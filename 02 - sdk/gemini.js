import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({});

async function init() {
  const interaction = await client.interactions.create({
    model: 'gemini-3.5-flash',
    input: 'Hi, how are you?',
  });

  console.log(interaction.output_text);
}

await init();

console.log('Gemini SDK initialized successfully');
