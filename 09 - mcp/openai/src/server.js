import { Agent, hostedMcpTool, run, MCPServerStdio, MCPServerStreamableHttp } from '@openai/agents';
import path from 'path';

async function hostedMCPRun() {
  const agent = new Agent({
    name: 'MCP Assistant',
    instructions: 'You must always use the MCP tools to answer questions.',
    tools: [
      hostedMcpTool({
        serverLabel: 'deepwiki',
        serverUrl: 'https://mcp.deepwiki.com/mcp',
      }),
    ],
  });

  const result = await run(agent, 'What is the capital of France?');
  console.log(result.finalOutput);
}

async function httpStreamableMCPRun() {
  const mcpServer = new MCPServerStreamableHttp({
    url: 'http://localhost:3000/mcp',
    name: 'Airthmetic MCP Server, via local package',
  });

  try {
    await mcpServer.connect();

    const agent = new Agent({
      name: 'Airthmetic MCP Assistant',
      instructions: 'You must always use the MCP tools to answer questions.',
      mcpServers: [mcpServer],
    });

    const result = await run(agent, 'Subtract 8 and 4');
    console.log(result.finalOutput);
  } finally {
    await mcpServer.close();
  }
}

async function stdioMCPRun() {
  const dir = path.join(__dirname, '../../stdin-transport/src/server.js');
  const mcpServer = new MCPServerStdio({
    name: 'Airthmetic MCP Server, via local package',
    fullCommand: `node ${dir}`,
  });

  try {
    await mcpServer.connect();

    const agent = new Agent({
      name: 'Airthmetic MCP Assistant',
      instructions: 'You must always use the MCP tools to answer questions.',
      mcpServers: [mcpServer],
    });

    const result = await run(agent, 'Add 8 and 4');
    console.log(result.finalOutput);
  } finally {
    await mcpServer.close();
  }
}
await hostedMCPRun();
await httpStreamableMCPRun();
await stdioMCPRun();
