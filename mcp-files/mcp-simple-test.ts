import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Create simple MCP server
const server = new Server(
  {
    name: 'allora-simple-test',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define simple test tools
const tools: Tool[] = [
  {
    name: 'test_connection',
    description: 'Test if MCP connection is working',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'echo',
    description: 'Echo back the input',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Message to echo',
        },
      },
      required: ['message'],
    },
  },
];

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.log(`Simple MCP: Executing tool '${name}' with args:`, args);

  if (name === 'test_connection') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'MCP connection is working!',
            timestamp: new Date().toISOString(),
            source: 'Simple MCP Test Server'
          }, null, 2),
        },
      ],
    };
  }

  if (name === 'echo') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Echo response',
            input: (args as any).message,
            timestamp: new Date().toISOString(),
            source: 'Simple MCP Test Server'
          }, null, 2),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          error: 'Unknown tool',
          tool: name,
          source: 'Simple MCP Test Server'
        }, null, 2),
      },
    ],
  };
});

// Start the server
async function startMCPServer() {
  try {
    console.log('🧪 Starting Simple MCP Test Server...');

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log('✅ Simple MCP Test Server ready!');
    console.log('📋 Available tools:');
    tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
  } catch (error) {
    console.error('Failed to start Simple MCP Test server:', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  startMCPServer();
}

export default server; 