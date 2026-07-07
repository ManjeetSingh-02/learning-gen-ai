import OpenAI from 'openai';

const client = new OpenAI();

async function init() {
  const result = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: 'Hi, how are you?',
  });

  console.log(result.output_text);
}

await init();

console.log('OpenAI SDK initialized successfully');
