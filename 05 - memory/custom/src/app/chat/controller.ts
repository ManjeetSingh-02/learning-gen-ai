// internal-imports
import { openai } from '../../core/lib/openai.js';
import { Chat } from '../../core/db/model/chat.js';
import { Message } from '../../core/db/model/message.js';
import { Role } from '../../core/config/role.js';
import { SP } from '../../core/config/prompt.js';

// external-imports
import mongoose from 'mongoose';
import type { Request, Response } from 'express';

// controller for module
export const controller = {
  // @controller POST /
  startChat: async (request: Request, response: Response) => {
    // find the chat in db, if not found create a new one
    const chat = await Chat.findByIdAndUpdate(
      request.body.id ?? new mongoose.Types.ObjectId(),
      {},
      { returnDocument: 'after', upsert: true }
    ).select('ltm _id');

    // get the last 20 messages of the chat from db
    const STM = await Message.find({ chatID: chat._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('role content')
      .lean();

    // reverse the STM array to get the messages in chronological order
    STM.reverse();

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
      STM: ${JSON.stringify(STM.map(m => ({ role: m.role, content: m.content })))}\n
      LTM: ${JSON.stringify(chat.ltm)}`,
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

    // if the LTM is provided, push it to the chat's LTM array and update the chat in db
    if (parsedRes.ltm) chat.ltm.push(parsedRes.ltm);
    await chat.save();

    // return the response to the client
    return response.status(200).json({
      success: true,
      message: parsedRes.answer,
      chat: { id: chat._id, ltm: chat.ltm },
    });
  },
};
