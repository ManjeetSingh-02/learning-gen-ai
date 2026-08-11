// internal-imports
import { SP } from '../../core/config/prompt.js';
import { Role } from '../../core/config/role.js';
import { Chat } from '../../core/db/mongoose/model/chat.js';
import { Message } from '../../core/db/mongoose/model/message.js';
import { vectorStore } from '../../core/db/qdrant/store.js';
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

    // get the last 3 relevant facts from the ltm in vector store
    const ltm = await vectorStore.similaritySearch(request.body.query, 3);

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
      LTM: ${JSON.stringify(ltm.map(f => f.pageContent))}`,
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

    // update the ltm in vector store and db if the LLM has provided new information
    if (parsedRes.ltm)
      await vectorStore.addDocuments([
        {
          metadata: { userID: request.body.userID },
          pageContent: parsedRes.ltm,
        },
      ]);

    // return the response to the client
    return response.status(200).json({
      success: true,
      message: parsedRes.answer,
    });
  },
};
