// internal-imports
import { mem0ai } from '../../core/lib/mem0ai.js';
import { openai } from '../../core/lib/openai.js';
import { SP } from '../../core/config/prompt.js';
import { Role } from '../../core/config/role.js';
import { Chat } from '../../core/db/model/chat.js';
import { Message } from '../../core/db/model/message.js';

// external-imports
import type { Request, Response } from 'express';

// controller for module
export const controller = {
  // @controller POST /
  startChat: async (request: Request, response: Response) => {
    // find the user's chat in db, if not found create a new one
    const chat = await Chat.findOneAndUpdate(
      { userID: request.body.userID },
      {},
      { returnDocument: 'after', upsert: true }
    )
      .select('_id')
      .lean();

    // retrieve the relevant long-term memories from the mem0ai
    const { results } = await mem0ai.search(request.body.query, {
      filters: { user_id: request.body.userID },
      topK: 5,
    });

    // get the last 20 messages of the chat from db
    const stm = await Message.find({ chatID: chat._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('role content')
      .lean();

    // reverse the stm array to get the messages in chronological order
    stm.reverse();

    // generate a response from the LLM
    const res = await openai.responses.create({
      model: 'gpt-4.1-mini',
      instructions: `${SP}\n
      STM: ${JSON.stringify(stm.map(m => ({ role: m.role, content: m.content })))}\n
      LTM: ${JSON.stringify(results.map(m => m.memory))}`,
      input: request.body.query,
    });

    // initialize the messages array with the user's query and the assistant's response
    const messages = [
      { role: Role.USER, content: request.body.query },
      { role: Role.ASSISTANT, content: res.output_text },
    ];

    // store the messages in the db
    await Message.insertMany(
      messages.map(m => ({ chatID: chat._id, content: m.content, role: m.role }))
    );

    // give the messages to mem0ai
    await mem0ai.add(messages, { user_id: request.body.userID });

    // return the response to the client
    return response.status(200).json({
      success: true,
      message: res.output_text,
    });
  },
};
