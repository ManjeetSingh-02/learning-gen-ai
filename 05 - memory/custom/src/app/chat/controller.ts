// internal-imports
import { openai } from '../../core/lib/openai.js';
import { Chat } from '../../core/db/model/chat.js';
import { Role } from '../../core/config/role.js';

// external-imports
import type { Request, Response } from 'express';

// controller for module
export const controller = {
  // @controller POST /
  startChat: async (request: Request, response: Response) => {
    // find the chat in the database or create a new one if it doesn't exist
    let chat = await Chat.findOne({ createdBy: request.body.createdBy });
    if (!chat) chat = await Chat.create({ createdBy: request.body.createdBy, messages: [] });

    // push the user message to the chat
    chat.messages.push({ role: Role.USER, content: request.body.query });

    // generate a response from the LLM
    const res = await openai.responses.create({
      model: 'gpt-4.1-mini',
      instructions: 'You are an AI assistant that understands user queries and provide answers.',
      input: JSON.stringify(chat.messages.map(m => ({ role: m.role, content: m.content }))),
    });

    // push the assistant message to the chat
    chat.messages.push({ role: Role.ASSISTANT, content: res.output_text });

    // save the chat to the database
    await chat.save();

    // return the response to the client
    return response.status(200).json({
      success: true,
      message: res.output_text,
      history: chat.messages,
    });
  },
};
