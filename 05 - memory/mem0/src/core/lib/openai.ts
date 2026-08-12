// external-imports
import OpenAI from 'openai';

// openai instance
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
