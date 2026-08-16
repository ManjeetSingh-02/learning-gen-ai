// internal-imports
import { executeQuery } from '../lib/neo4j.js';
import { callOpenAI } from '../lib/openai.js';

// function to run the neo4j agent
export async function runBackgroundNeo4jAgent({
  systemPrompt,
  chatHistory,
  outputFn,
}: {
  systemPrompt: string;
  chatHistory: any[];
  outputFn?: (output: any) => Promise<void>;
}) {
  for (let i = 0; i < 50; i++) {
    // call openai
    const res = await callOpenAI({
      model: 'gpt-4.1',
      instructions: systemPrompt,
      input: JSON.stringify(chatHistory),
    });

    // parse the response
    const parsedRes = JSON.parse(res.output_text);

    // push the output to chat history
    chatHistory.push(parsedRes);

    // if step is tool_request, execute the query in neo4j
    if (parsedRes.step.toLowerCase() === 'tool_request') {
      const result = await executeQuery(parsedRes.query);
      chatHistory.push({ step: 'TOOL_RESULT', result });
    }

    // if step is output, update the running context and break the loop
    if (parsedRes.step.toLowerCase() === 'output') {
      if (outputFn) await outputFn(parsedRes.output);
      break;
    }
  }
}
