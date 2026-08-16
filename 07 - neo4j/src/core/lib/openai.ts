// external-imports
import OpenAI from 'openai';
import type { ResponsesModel } from 'openai/resources';

// create openai instance
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// function to call openai
export async function callOpenAI({
  model,
  instructions,
  input,
}: {
  model: ResponsesModel;
  instructions: string;
  input: string;
}) {
  return await openai.responses.create({ model, instructions, input });
}
