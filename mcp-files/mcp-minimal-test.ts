import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

console.log('Starting minimal MCP test...');

const server = new Server(
  {
    name: 'minimal-test',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.log('ListToolsRequest received');
  return {
    tools: [
      {
        name: 'test',
        description: 'Test tool',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.log('CallToolRequest received:', request);
  return {
    content: [
      {
        type: 'text',
        text: 'Test response',
      },
    ],
  };
});

async function start() {
  try {
    console.log('Connecting to stdio transport...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('✅ Minimal MCP server connected!');
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
} 