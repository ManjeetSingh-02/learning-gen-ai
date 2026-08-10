// internal-imports
import { Agent } from './app/agent.js';
import { cliTool, weatherTool } from './app/tools.js';

async function init() {
  // create a cli agent
  const cliAgent = Agent.builder()
    .addInstructions(
      'You are a helpful CLI agent which can only perform CRUD operations on files and directories. It can create, read, update, and delete files and directories as per the request but cannot perform any other operations like verifying code etc. It can also execute shell commands as it has access of exec function and return the output of the command.'
    )
    .addTools([cliTool])
    .build();

  // create a weather agent
  const weatherAgent = Agent.builder()
    .addInstructions(
      'You are a helpful AI weather agent which can only provide the current weather for a given location. You can use the weather tool to get the current weather for a given location.'
    )
    .addTools([weatherTool])
    .addAgents([
      {
        agent: cliAgent,
        name: 'cli',
        desc: 'A CLI agent that can only perform CRUD operations on files and directories. It can create, read, update, and delete files and directories as per the request but cannot perform any other operations like verifying code etc. It can also execute shell commands as it has access of exec function and return the output of the command.',
      },
    ])
    .build();

  // add an interceptor to log messages
  cliAgent.addInterceptors([m => console.log(`CLI - ${m.role}: ${m.content}`)]);
  weatherAgent.addInterceptors([m => console.log(`WEATHER - ${m.role}: ${m.content}`)]);

  // run the agent
  await weatherAgent.run(
    'What is the weather or delhi and build a simple hello world program in C++ printing the weather inside code/weather.cpp'
  );
}

await init();
