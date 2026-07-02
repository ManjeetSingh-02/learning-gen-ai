import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

client.chat.completions
  .create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: 'Hello, can you introduce yourself?',
      },
    ],
  })
  .then(res => console.log(res.choices[0].message.content));
