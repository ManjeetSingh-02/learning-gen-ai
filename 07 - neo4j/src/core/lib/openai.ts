// external-imports
import OpenAI from 'openai';

// create openai instance
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
