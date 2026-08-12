// internal-imports
import { SP } from '../../core/config/prompt.js';
import { Role } from '../../core/config/role.js';
import { Chat } from '../../core/db/mongoose/model/chat.js';
import { Message } from '../../core/db/mongoose/model/message.js';
import { retrieveDocs, storeDocs } from '../../core/db/qdrant/store.js';
import { openai } from '../../core/lib/openai.js';

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

    // retrieve the relevant long-term memories from the vector store
    const ltm = await retrieveDocs(request.body.query, request.body.userID);

    // get the last 20 messages of the chat from db
    const stm = await Message.find({ chatID: chat._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('role content')
      .lean();

    // reverse the stm array to get the messages in chronological order
    stm.reverse();

    // create new user message in db
    await Message.create({
      chatID: chat._id,
      content: request.body.query,
      role: Role.USER,
    });

    // generate a response from the LLM
    const res = await openai.responses.create({
      model: 'gpt-4.1-mini',
      instructions: `${SP}\n
      STM: ${JSON.stringify(stm.map(m => ({ role: m.role, content: m.content })))}\n
      LTM: ${JSON.stringify(ltm)}`,
      input: request.body.query,
    });

    // parse the response from the LLM
    const parsedRes = JSON.parse(res.output_text);

    // create new assistant message in db
    await Message.create({
      chatID: chat._id,
      content: parsedRes.answer,
      role: Role.ASSISTANT,
    });

    // store the new memories in the vector store
    if (parsedRes.memories) await storeDocs(parsedRes.memories, request.body.userID);

    // return the response to the client
    return response.status(200).json({
      success: true,
      message: parsedRes.answer,
    });
  },
};
