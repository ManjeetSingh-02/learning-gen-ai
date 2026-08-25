import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { McpServer } from '@modelcontextprotocol/server';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { z } from 'zod';

const server = new McpServer({ name: 'mcp-http-streaming', version: '1.0.0' });

server.registerTool(
  'subtract',
  {
    title: 'Subtract',
    description: 'Subtracts two numbers',
    inputSchema: z.object({ a: z.number(), b: z.number() }),
  },
  async ctx => ({ content: [{ type: 'text', text: `${ctx.a - ctx.b}` }] })
);

async function run() {
  const app = createMcpExpressApp();

  app.use('/mcp', async (req, res) => {
    const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.listen(3000, () => console.log('Server is running on http://localhost:3000'));
}

await run();
