/**
 * @description
 * MCP Bridge - Converts stdio MCP protocol to HTTP calls
 * This allows Cursor to use the HTTP MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// HTTP MCP Server URL
const HTTP_MCP_URL = 'https://8a3d259e905d.ngrok-free.app';

// Create MCP server for stdio communication
const server = new Server(
  {
    name: 'allora-mcp-bridge',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools that will be bridged to HTTP
const tools: Tool[] = [
  {
    name: 'register_user',
    description: 'Register a new user and get API key (required before model registration)',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'User email address',
        },
      },
      required: ['email'],
    },
  },
  {
    name: 'get_active_topics',
    description: 'Get all active topics (same as HTTP endpoint)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'register_model',
    description: 'Register model with authentication: requires API key, generates wallet, saves to vault, registers on blockchain',
    inputSchema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          description: 'API key from user registration',
        },
        topicId: {
          type: 'string',
          description: 'The topic ID to register for',
        },
        modelType: {
          type: 'string',
          enum: ['inference', 'forecaster', 'reputer'],
          description: 'Type of model to register',
        },
        webhookUrl: {
          type: 'string',
          description: 'Webhook URL for inference submissions',
        },
        gasPriceLimit: {
          type: 'string',
          description: 'Gas price limit for transactions (optional)',
        },
      },
      required: ['apiKey', 'topicId', 'modelType', 'webhookUrl'],
    },
  },
  {
    name: 'get_user_wallet_phrases',
    description: 'Retrieve wallet mnemonic phrases for authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          description: 'API key for authentication',
        },
      },
      required: ['apiKey'],
    },
  },
  {
    name: 'get_user_models',
    description: 'Get all models for authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          description: 'API key for authentication',
        },
      },
      required: ['apiKey'],
    },
  },
];

// Register tools with the server
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Handle tool calls by bridging to HTTP
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    console.log(`MCP Bridge: Executing tool '${name}' with args:`, args);

    // Make HTTP request to the MCP server
    const response = await fetch(`${HTTP_MCP_URL}/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        arguments: args,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
    }

        const result = await response.json();
    
    // Convert HTTP response back to MCP format
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: `Tool '${name}' executed successfully via HTTP bridge`,
            result: (result as any).result,
            source: 'MCP Bridge -> HTTP MCP Server'
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error('MCP Bridge tool execution failed:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            tool: name,
            args,
            source: 'MCP Bridge'
          }, null, 2),
        },
      ],
    };
  }
});

// Start the MCP bridge server
async function startMCPServer() {
  try {
    console.log('🌉 Starting MCP Bridge Server...');
    console.log(`🔗 Bridging to HTTP MCP Server: ${HTTP_MCP_URL}`);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log('✅ MCP Bridge Server ready for Cursor integration!');
    console.log('📋 Available tools:');
    tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
  } catch (error) {
    console.error('Failed to start MCP Bridge server:', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  startMCPServer();
}

export default server; 