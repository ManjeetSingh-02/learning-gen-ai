import { Anthropic } from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const client = new Anthropic();

const outputSchema = z
  .array(
    z.object({
      language: z.enum(['Python', 'JavaScript']),
      code: z.string().describe('Code example for the specified language'),
      tags: z.array(z.string()).describe('Tags associated with the code example'),
    })
  )
  .describe('List of code examples with associated tags');

async function init() {
  const result = await client.messages.parse({
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: 'Give 3 examples of hello world code with tags for Python and JavaScript',
      },
    ],
    model: 'claude-opus-4-8',
    output_config: { format: zodOutputFormat(outputSchema) },
  });

  console.log(result.parsed_output);
}

await init();

console.log('Anthropic SDK initialized successfully');
