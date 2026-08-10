// internal-imports
import { cliTool, weatherTool } from './app/tools.js';

// external-imports
import { Agent, run } from '@openai/agents';

async function init() {
  // create a cli agent
  const cliAgent = new Agent({
    name: 'CLI Agent',
    handoffDescription:
      'Handles filesystem and terminal operations. Use this agent when files or directories need to be created, read, updated, or deleted, or when a shell command must be executed.',
    instructions: `You are a CLI agent.
    Your ONLY responsibility is performing filesystem and terminal operations.

    You CAN:
    - Create files
    - Read files
    - Update files
    - Delete files
    - Create directories
    - Delete directories
    - Execute shell commands using the cli tool

    You CANNOT:
    - Explain or review code as your primary task
    - Verify whether code is correct
    - Solve programming problems conceptually
    - Simply describe commands without executing them

    IMPORTANT:
    When the user asks you to create, modify, delete, read, or inspect
    a file or directory, you MUST use the cli tool.

    Do NOT claim that a file or directory was created unless the cli
    tool was actually called and returned successfully.

    After the cli tool successfully performs the requested operation,
    return a concise confirmation`,
    tools: [cliTool],
  });

  // create a weather agent
  const weatherAgent = new Agent({
    name: 'Weather Agent',
    instructions: `You are a helpful AI weather agent.

  Your responsibility is to provide current weather information.

  You can use the weather tool to retrieve weather information.

  If the user's request contains a filesystem or terminal task,
  you MUST hand off that task to the CLI Agent.

  The CLI Agent is responsible for:
  - creating files
  - modifying files
  - deleting files
  - creating directories
  - executing shell commands

  Do not attempt to perform filesystem operations yourself.

  If the request contains both a weather task and a filesystem task:
  1. Get the weather using the weather tool.
  2. Hand off the filesystem task to the CLI Agent, including the
    weather information needed by the CLI Agent.
  3. Let the CLI Agent perform the filesystem operation.
  4. Only provide the final answer after the requested tasks are complete`,
    tools: [weatherTool],
    handoffs: [cliAgent],
  });

  // run the agent with a prompt
  const result = await run(
    weatherAgent,
    `What is the weather of New Delhi?
   Also write a simple hello world program in C++
   printing the weather inside code/weather.cpp`
  );

  // log the final output of the agent
  console.log(result.finalOutput);
}

await init();
