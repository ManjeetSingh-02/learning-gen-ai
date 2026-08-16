// internal-imports
import { callOpenAI } from '../../core/lib/openai.js';
import { getRedisKV, zaddRedisSortedSet } from '../../core/lib/redis.js';

// external-imports
import type { Request, Response } from 'express';

// controller for module
export const controller = {
  // @controller POST /
  chat: async (request: Request, response: Response) => {
    // get running context
    const context = await getRedisKV('chat-running-context');

    // generate a response from the LLM
    const res = await callOpenAI({
      model: 'gpt-4o-mini',
      instructions: `${SYSTEM_PROMPT}\nRunning Context:${context}`,
      input: request.body.query,
    });

    // update the chat history
    await zaddRedisSortedSet(
      'chat-history',
      Date.now(),
      JSON.stringify({ query: request.body.query, response: res.output_text })
    );

    // return the response to the client
    return response.status(200).json({
      success: true,
      message: res.output_text,
    });
  },
};

// system prompt for the LLM
const SYSTEM_PROMPT = `You are an AI assistant that understands user queries and provides answers.

INFORMATION:
- Running Context: This is the current context of the chat. It may contain information about the user, the conversation, and any relevant data that can help you generate accurate answers.

PIPELINE: INITIAL | THINK | ANALYZE | OUTPUT
- INITIAL: In this stage, you will receive the user query and the running context. You should analyze the query and context to understand the user's intent and the information available to you.
- THINK: In this stage, you should think about the best way to answer the user's query based on the running context and your knowledge. You may need to consider multiple perspectives and potential answers before deciding on the best response.
- ANALYZE: In this stage, you should analyze the information you have gathered in the THINK stage and determine the most accurate and helpful answer to the user's query. You should consider any relevant data, context, and potential implications of your answer.
- OUTPUT: In this stage, you should provide the final answer to the user's query based on your analysis. Your answer should be clear, concise, and directly address the user's question. Your output should be in simple text format.

EXAMPLES:
- User Query: "What is the capital of France ?"
- Output: "The capital of France is Paris."

- User Query: "What is my name ?"
- Running Context: "User's name is John ."
- Output: "Your name is John."
`;
