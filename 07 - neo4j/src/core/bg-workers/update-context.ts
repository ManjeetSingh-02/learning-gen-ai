// internal-imports
import { getRedisKV, setRedisKV, zrangebyscoreRedisSortedSet } from '../lib/redis.js';
import { runBackgroundNeo4jAgent } from './helper.js';

// function to start the update context worker
export function startUpdateContextWorker() {
  let isUpdating = false;

  setInterval(async () => {
    if (isUpdating) return;
    isUpdating = true;

    try {
      await runUpdateContextWorker();
    } catch (error) {
      console.error('Neo4j sync worker failed:', error);
    } finally {
      isUpdating = false;
    }
  }, 30000);
}

// function to run the update context worker
export async function runUpdateContextWorker() {
  // get chat running context, last processed timestamp and history
  const context = await getRedisKV('chat-running-context');
  const timestamp = Number(await getRedisKV('chat-context-last-processed-timestamp')) || 0;
  const history = await zrangebyscoreRedisSortedSet('chat-history', `(${timestamp}`, '+inf');

  // if there is no new chat history, return
  if (history.length === 0) return;

  await runBackgroundNeo4jAgent({
    chatHistory: history.map(c => JSON.parse(c.value!)),
    systemPrompt: `${SYSTEM_PROMPT}\nRunning Context:${context}`,
    outputFn: async v => await setRedisKV('chat-running-context', v),
  });

  // update this worker's checkpoint
  await setRedisKV('chat-context-last-processed-timestamp', Math.max(...history.map(c => c.score)));
}

// system prompt for the LLM
const SYSTEM_PROMPT = `You are an assistant that helps to keep sync between the chat history and the running context.

RULES:
- Your job is to read the current running context and then read the new chat history.
- Update the running context when the new chat history contains information that should change, add to, or remove information from the current running context.
- You have access to a read-only Cypher query tool for Neo4j.
- Neo4j contains the structured long-term representation of the conversation and is maintained by another background process.
- You may generate read-only Cypher queries to retrieve or verify information from the Neo4j graph.
- Never generate Cypher queries that modify the Neo4j database.
- The newly received chat history is the latest source of information and must be considered when updating the running context.
- The current running context represents the previous state of the conversation.
- Neo4j represents the structured long-term state of the conversation.
- Use Neo4j to retrieve or verify information that is not fully available in the current running context or newly received chat history.
- Do not ignore new chat history merely because the corresponding information is not yet present in Neo4j.
- If the current running context conflicts with newer chat history, the newer chat history takes precedence.
- If Neo4j conflicts with newer chat history, the newer chat history takes precedence because Neo4j may not yet have been updated by the separate synchronization process.
- The final OUTPUT must contain the complete updated running context as a string.
- The OUTPUT will replace the previous running context.

INFORMATION:
- Running Context: This is the current context of the chat. It may contain information about the user, the conversation, and any relevant data that can help you generate accurate Cypher queries.
- Chat History: This is a list of previous messages in the chat. It may contain information about the user's questions, the assistant's responses, and any relevant data that can help you generate accurate Cypher queries.
- The final output will be a string that represents the new running context that will be replaced with old running context.

TOOLS:
- executeQuery(query: string): This is only READ_ONLY tool. You wont provide any write queris. When you generate a TOOL_REQUEST, the application will execute the generated Cypher query against Neo4j and provide the execution result back to you as a TOOL_RESULT step.

PIPELINE: INITIAL | THINK | TOOL_REQUEST | ANALYZE | OUTPUT
- This pipeline will run in a loop until the chat history is fully processed and the running context is updated accordingly. Each step of the pipeline will be executed in order, and the output of each step will be used as input for the next step.
- INITIAL: In this step, you should read the current running context and chat history. You should also read any relevant information that can help you generate accurate Cypher queries. You should not generate any Cypher queries in this step.
- THINK: In this step, you should determine if any read-only Cypher queries need to be generated to verify information against the Neo4j database.
- TOOL_REQUEST: In this step, you should only generate a read-only Cypher query when information from Neo4j is needed to verify the correct running context.
- TOOL_RESULT: This step is inserted by the application after a TOOL_REQUEST is executed. It contains the actual result returned by Neo4j. You must use this result in the next ANALYZE step to determine whether further actions are required. You should not generate TOOL_RESULT yourself.
- ANALYZE: In this step, you should analyze the result of the TOOL_REQUEST and determine if any further actions are required. You should also determine if any additional read-only Cypher queries need to be generated to verify the updated state of the graph. You should not generate any Cypher queries in this step.
- OUTPUT: In this step, you should generate the final output that will be used as the new running context. You should not generate any Cypher queries in this step.

OUTPUT_FORMAT:
- {
    "step": "INITIAL" | "THINK" | "TOOL_REQUEST" | "ANALYZE" | "OUTPUT",
    "query": string, (only present in TOOL_REQUEST step)
    "output": string
  }

- Running Context: "Use's name is Ryan. User loves football. User hates pizza hut's pizza."
- Chat History: [{
  "query": "I love pizza of pizza hut.",
  "response": "That's great! Pizza Hut is known for its delicious pizzas. Do you have a favorite pizza from there?"
}]
- The Neo4j will be updated with this information by another process, you have to update the running context now.

Now you will perform all the pipeline steps
- {
    "step": "INITIAL",
    "output": "The current running context indicates that user hates pizza hut's pizza. The chat history shows that the user has expressed love for pizza from pizza hut. This is a contradiction that needs to be resolved in the running context."
  }
- {
    "step": "THINK",
    "output": "The running context needs to be updated to reflect the user's current preference for pizza from pizza hut. The previous context indicating that the user hates pizza hut's pizza is no longer accurate based on the latest chat history. To verify this change, we can generate a Cypher query to check the user's preferences in the Neo4j database and update it accordingly."
  }
- {
    "step": "TOOL_REQUEST",
    "query": "<cypher_query_to_check_current_user_pizza_hut_prefrences>",
    "output": "Generated a Cypher query to check the user's current preferences for pizza from pizza hut in the Neo4j database."
  }
- Here you will get the result of the executed query
- {
    "step": "ANALYZE",
    "output": "Analyzing the result of the executed Cypher query. The result indicates that the user currently has a preference for pizza from pizza hut. Therefore, we will update the running context to reflect this change."
  }
- {
    "step": "OUTPUT",
    "output": "User's name is Ryan. User loves football. User loves pizza hut's pizza."
  }
    
You will continue to run the pipeline until all the chat history is processed and the running context is updated accordingly.`;
