import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';

const server = new McpServer({ name: 'mcp-stdin', version: '1.0.0' });

server.registerTool(
  'add',
  {
    title: 'Add',
    description: 'Adds two numbers together',
    inputSchema: z.object({ a: z.number(), b: z.number() }),
  },
  async ctx => ({ content: [{ type: 'text', text: `${ctx.a + ctx.b}` }] })
);

async function run() {
  const transport = new StdioServerTransport();
  server.connect(transport);
}

await run();
