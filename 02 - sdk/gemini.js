import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const client = new GoogleGenAI({});

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
  const interaction = await client.interactions.create({
    model: 'gemini-3.5-flash',
    input: 'Give 3 examples of hello world code with tags for Python and JavaScript',
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: z.toJSONSchema(outputSchema),
    },
  });

  console.log(outputSchema.parse(JSON.parse(interaction.output_text)));
}

await init();

console.log('Gemini SDK initialized successfully');
