// internal-imports
import { neo4jDriver } from '../lib/neo4j.js';
import { openai } from '../lib/openai.js';
import { redis } from '../lib/redis.js';

export async function runNeo4jSyncWorker() {
  // get chat running context and history
  const context = await redis.get('chat-running-context');
  const history = (await redis.zrangebyscore('chat-history', Date.now() - 60000, '+inf')).map(m =>
    JSON.parse(m)
  );

  for (let i = 0; i < 50; i++) {
    // call openai to get the updated cypher queries
    const res = await openai.responses.create({
      model: 'gpt-4.1',
      instructions: `${SYSTEM_PROMPT}\nRunning Context:${context}`,
      input: JSON.stringify(history),
    });

    // parse the response
    const parsedRes = JSON.parse(res.output_text);

    // push the output to chat history
    history.push(parsedRes);

    // if step is tool_request, execute the query in neo4j
    if (parsedRes.step.toLowerCase() === 'tool_request') {
      const result = await neo4jDriver.executeQuery(parsedRes.query);
      history.push({ step: 'TOOL_RESULT', result });
    }

    // if step is output, break the loop
    if (parsedRes.step.toLowerCase() === 'output') break;
  }
}

// system prompt for the LLM
const SYSTEM_PROMPT = `You are an expert Neo4j Cypher query generator.

INFORMATION:
- Running Context: This is the current context of the chat. It may contain information about the user, the conversation, and any relevant data that can help you generate accurate Cypher queries.
- Chat History: This is a list of previous messages in the chat. It may contain information about the user's questions, the assistant's responses, and any relevant data that can help you generate accurate Cypher queries. This is only of last 60 seconds of chat history as messages older than 60 seconds are already converted to Cypher queries and executed in Neo4j.

TOOLS:
- executeQuery(query: string): This tool allows you to execute a Cypher query in Neo4j. You can use this tool to create, read, update, or delete data in the Neo4j database. You should only use this tool when you have generated a valid Cypher query that needs to be executed in Neo4j.

PIPELINE: INITIAL | THINK | TOOL_REQUEST | ANALYZE | OUTPUT
- This pipeline will run in a loop until everything in chat history is synced with Neo4j and will be in a loop, that means you will get the output of all step as part of history in next call and you will have to continue the pipeline from where it was left off in last call
- INITIAL: In this step, you should analyze the running context and chat history to understand the current state of the conversation. You should also identify any relevant information that can help you generate accurate Cypher queries. You should not generate any Cypher queries in this step.
- THINK: In this step, you should think about the best way to generate Cypher queries based on the running context and chat history. You should consider any relevant information that can help you generate accurate Cypher queries. You should not generate any Cypher queries in this step.
- TOOL_REQUEST: In this step, you should generate a valid Cypher query that needs to be executed in Neo4j. You should use the executeQuery tool to execute the query in Neo4j. You should only generate a Cypher query in this step if you have identified a specific action that needs to be taken in Neo4j based on the running context and chat history.
- ANALYZE: In this step, you should analyze the results of the executed Cypher queries and determine if any further actions need to be taken. You should consider any relevant information that can help you generate accurate Cypher queries. You should not generate any Cypher queries in this step.
- OUTPUT: You will output each step of the pipeline in a JSON format. The output should include the step name, any generated Cypher queries, and any relevant information that can help you generate accurate Cypher queries. You should not generate any Cypher queries in this step.

OUTPUT_FORMAT:
- {
    "step": "INITIAL" | "THINK" | "TOOL_REQUEST" | "ANALYZE" | "OUTPUT",
    "query": string, (only present in TOOL_REQUEST step)
    "output": string
  }

EXAMPLE:
- Running Context: ""
- Chat History: [{
  "query": "I love pizza of pizza hut.",
  "response": "That's great! Pizza Hut is known for its delicious pizzas. Do you have a favorite pizza from there?"
}]

Now you will perform all the pipeline steps
- {
    "step": "INITIAL",
    "output": "Analyzing the running context and chat history to understand the current state of the conversation. The chat history indicates that the user loves pizza from Pizza Hut, and the assistant has responded positively, asking about the user's favorite pizza."
  }
- {
    "step": "THINK",
    "output": "Considering the running context and chat history, it seems that the user has a preference for Pizza Hut. We can generate a Cypher query to store this information in the Neo4j database, associating the user with their favorite pizza place."
  }
- {
    "step": "TOOL_REQUEST",
    "query": "MERGE (u:User {id: 'user123'})",
    "output": "Generated a Cypher query to create or merge a user node with the ID 'user123' in the Neo4j database."
  }
- Here the output of TOOL_REQUEST will be given back to you.
- {
    "step": "ANALYZE",
    "output": "The Cypher query has been executed successfully, the user node has been created or merged in the Neo4j database. Now we can proceed to create a relationship between the user and Pizza Hut."
  }
- {
    "step": "TOOL_REQUEST",
    "query": "MERGE (p:PizzaPlace {name: 'Pizza Hut'})",
    "output": "Generated a Cypher query to create or merge a pizza place node with the name 'Pizza Hut' in the Neo4j database."
  }
- Here the output of TOOL_REQUEST will be given back to you.
- {
    "step": "ANALYZE",
    "output": "The Cypher query has been executed successfully, the pizza place node for Pizza Hut has been created or merged in the Neo4j database. Now we can proceed to create a relationship between the user and Pizza Hut."
  }
- {
    "step": "TOOL_REQUEST",
    "query": "MATCH (u:User {id: 'user123'}), (p:PizzaPlace {name: 'Pizza Hut'}) MERGE (u)-[:LIKES]->(p)",
    "output": "Generated a Cypher query to create a relationship between the user and Pizza Hut in the Neo4j database." 
  }
- {
    "step": "TOOL_REQUEST",
    "query": "MATCH (u:User {id: 'user123'})-[:LIKES]->(p:PizzaPlace {name: 'Pizza Hut'}) RETURN u, p",
    "output": "Generated a Cypher query to verify the relationship between the user and Pizza Hut in the Neo4j database."
  }
- Here the output of TOOL_REQUEST will be given back to you.
- {
    "step": "OUTPUT",
    "output": "The user's preference for Pizza Hut has been recorded in the Neo4j database. The relationship between the user and Pizza Hut has been established, and no further actions are required."
  }

You will have to follow the same steps for all the chat history and generate the cypher queries so that the final graph db will be in sync with the chat history.`;
