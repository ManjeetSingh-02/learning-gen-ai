import { Anthropic } from '@anthropic-ai/sdk';

const client = new Anthropic();

async function init() {
  const result = await client.messages.create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, how are you?' }],
    model: 'claude-opus-4-8',
  });

  for (const block of result.messages) {
    if (block.type === 'text') console.log(block.text);
  }
}

await init();

console.log('Anthropic SDK initialized successfully');
