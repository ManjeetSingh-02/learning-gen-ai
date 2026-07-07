import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const client = new OpenAI();

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
  const result = await client.responses.parse({
    model: 'gpt-4.1-mini',
    input: 'Give 3 examples of hello world code with tags for Python and JavaScript',
    text: { format: zodTextFormat(outputSchema, 'output-schema') },
  });

  console.log(result.output_text);
  console.log(result.output_parsed);
}

await init();

console.log('OpenAI SDK initialized successfully');
