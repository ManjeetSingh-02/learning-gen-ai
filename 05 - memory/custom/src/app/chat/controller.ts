// internal-imports
import { openai } from '../../core/lib/openai.js';
import { Chat } from '../../core/db/model/chat.js';
import { LTM } from '../../core/db/model/ltm.js';
import { Message } from '../../core/db/model/message.js';
import { Role } from '../../core/config/role.js';
import { SP } from '../../core/config/prompt.js';

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

    // find the user's ltm in db, if not found create a new one
    const ltm = await LTM.findOneAndUpdate(
      { userID: request.body.userID },
      {},
      { returnDocument: 'after', upsert: true }
    ).select('facts');

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

    // update the ltm in db if the ltm is updated in the response
    if (parsedRes.ltm) ltm.facts.push(parsedRes.ltm);
    await ltm.save();

    // return the response to the client
    return response.status(200).json({
      success: true,
      message: parsedRes.answer,
    });
  },
};
