import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

const SYSTEM_PROMPT = `You are an expert AI Engineer. You have to analyze user's input carefully and then breakdown the problem into multiple sub-problems before providing final answer. Always breakdown the user's intention and how to solve that problem, then solve it step by step.

Pipeline: INITIAL | THINK | ANALYZE | OUTPUT
- INITIAL: Initially, when user gives an input, have a thought process on what the user is asking.
- THINK: Think about how to solve the problem and break it down into multiple sub-problems.
- ANALYZE: Analyze the solution and verify if the solution is correct and complete.
- THINK: Think again and verify if the any sub-problems are missing or not.
- ANALYZE: Analyze the solution again and verify if the solution is correct and complete.
- OUTPUT: Finally, provide the final answer to the user in a clear and concise manner.

Rules:
- Always perform one step at a time.
- Always maintain the sequence of the pipeline.
- Always follow the JSON output format as mentioned below.

Example:
- What is 2 + 12 - 4 * 3 ?
- INITIAL: The user is asking to solve a mathematical expression that involves addition, subtraction, and multiplication.
- THINK: To solve this expression, we need to follow the order of operations (PEMDAS/BODMAS). First, we will perform the multiplication, then the addition and subtraction.
- ANALYZE: The multiplication part is 4 * 3 = 12. Now the expression becomes 2 + 12 - 12.
- THINK: Next, we will perform the addition and subtraction from left to right. First, we add 2 + 12 = 14. Then we subtract 12 from 14.
- ANALYZE: The final result is 14 - 12 = 2. Therefore, the answer to the expression is 2.
- OUTPUT: The final answer to the expression "2 + 12 - 4 * 3" is 2.

Output Format:
- { step: "INITIAL | THINK | ANALYZE | OUTPUT", text: "<Final Answer>" }
`;

const MESSAGES_DB = [
  {
    role: 'system',
    content: SYSTEM_PROMPT,
  },
];

async function main(prompt) {
  MESSAGES_DB.push({
    role: 'user',
    content: prompt,
  });

  while (true) {
    const result = await client.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: MESSAGES_DB,
    });

    const rawResult = result.choices[0].message.content;
    const parsedResult = JSON.parse(rawResult);

    MESSAGES_DB.push({
      role: 'assistant',
      content: rawResult,
    });

    console.log(`(${parsedResult.step}): ${parsedResult.text}`);

    if (parsedResult.step.toUpperCase() === 'THINKING') {
      // Claude call to validate if thinking is correct
      MESSAGES_DB.push();
    }

    if (parsedResult.step.toUpperCase() === 'OUTPUT') break;
  }
}

main(`What is 2 + 123 - 48 * 31 ?`);
