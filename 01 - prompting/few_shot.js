import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

async function main() {
  const prompt = `What is 2+ 2 ?
  Don't add any explanation, just answer the question.
    Example:
    - Question: What is 1 + 1?
    - Answer: 2
    - Question: What is 3 + 3?
    - Answer: 6
    - Question: What is 5 + 5?
    - Answer: 10
    `;
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
