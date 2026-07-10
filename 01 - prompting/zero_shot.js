import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

async function main() {
  const prompt = 'What is the capital of France?';
  const result = await client.chat.completions.create({
    model: 'gemini-2.5-flash',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  console.log(result.choices[0].message.content);
}

main();
