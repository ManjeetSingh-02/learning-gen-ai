// internal-imports
import { env } from './env.js';

// external-imports
import { OpenAI } from 'openai';

// create an instance of the OpenAI client
export const openAIClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
