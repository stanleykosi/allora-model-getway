/**
 * @description
 * HTTP wrapper for MCP server to enable internet access
 * This allows remote users to interact with the MCP server via HTTP
 */

import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Import the same services as authenticated MCP server
import { config } from '@/config';
import postgresClient from '@/persistence/postgres.client';
import secretsService from '@/core/secrets/secrets.service';
import alloraConnectorService from '@/core/allora-connector/allora-connector.service';
import modelService from '@/services/model.service';
import userService from '@/services/user.service';
import walletService from '@/services/wallet.service';

// Create Express app
const app = express();
app.use(express.json());

// Create MCP server (same as authenticated version)
const server = new Server(
  {
    name: 'allora-http-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define MCP Tools (same as authenticated version)
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

// HTTP Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Allora MCP Server is running' });
});

// List available tools
app.get('/tools', async (req, res) => {
  try {
    res.json({
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list tools' });
  }
});

// Execute tool
app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    // Find the tool
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      return res.status(400).json({ error: `Unknown tool: ${name}` });
    }

    // Execute the tool using the same logic as the authenticated MCP server
    let result;
    
    switch (name) {
      case 'register_user': {
        const { email } = args as { email: string };
        const userResult = await userService.createUser({ email });
        
        if (!userResult) {
          throw new Error('Failed to create user');
        }
        
        result = {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'User registered successfully',
                userId: userResult.id,
                email: userResult.email,
                apiKey: userResult.apiKey,
                note: 'SAVE THIS API KEY IMMEDIATELY - it\'s your only way to access your models and wallets!',
                warning: 'If you lose this API key, you cannot recover your models or wallet phrases.',
                security_tips: [
                  'Store this API key securely (password manager recommended)',
                  'Never share your API key with anyone',
                  'Backup your API key safely - you cannot recover if lost',
                  'This API key is required for all model operations'
                ],
                source: 'HTTP MCP server'
              }, null, 2),
            },
          ],
        };
        break;
      }

      case 'get_active_topics': {
        const topics = await alloraConnectorService.getActiveTopics();
        
        result = {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'Active topics retrieved successfully',
                topics,
                source: 'HTTP MCP server'
              }, null, 2),
            },
          ],
        };
        break;
      }

      case 'register_model': {
        const { apiKey, topicId, modelType, webhookUrl, gasPriceLimit } = args as {
          apiKey: string;
          topicId: string;
          modelType: string;
          webhookUrl: string;
          gasPriceLimit?: string;
        };

        // Step 1: Authenticate user with API key
        const user = await userService.validateApiKey(apiKey);
        if (!user) {
          throw new Error('Invalid API key. Please register a user first using the register_user tool to get a valid API key.');
        }
        
        console.log('HTTP MCP: User authenticated:', user.id);
        
        // Step 2: Register model with authenticated user ID
        const modelResult = await modelService.registerModel({
          userId: user.id,
          topicId: topicId,
          modelType: modelType as 'inference' | 'forecaster',
          webhookUrl: webhookUrl,
          maxGasPrice: gasPriceLimit,
        });
        
        result = {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'Model registered successfully with authentication',
                userId: user.id,
                userEmail: user.email,
                result: modelResult,
                workflow: [
                  '1. Authenticated user with API key',
                  '2. Generated wallet automatically',
                  '3. Saved mnemonic phrase to Vault',
                  '4. Registered model on blockchain',
                  '5. Saved model data to PostgreSQL with user linkage'
                ],
                source: 'HTTP MCP server'
              }, null, 2),
            },
          ],
        };
        break;
      }

      case 'get_user_wallet_phrases': {
        const { apiKey } = args as { apiKey: string };

        // Step 1: Authenticate user with API key
        const user = await userService.validateApiKey(apiKey);
        if (!user) {
          throw new Error('Invalid API key. Please register a user first using the register_user tool to get a valid API key.');
        }

        // Step 2: Get user's models
        const userModels = await modelService.getModelsByUserId(user.id);
        if (!userModels || userModels.length === 0) {
          throw new Error('No models found for this user. Register a model first to create a wallet.');
        }

        // Step 3: Get wallet phrases for each model
        const walletPhrases = [];
        for (const model of userModels) {
          const wallet = await walletService.getWalletById(model.wallet_id);
          if (!wallet) {
            continue;
          }

          const mnemonic = await secretsService.getSecret(wallet.secret_ref);
          if (!mnemonic) {
            continue;
          }

          walletPhrases.push({
            model_id: model.id,
            model_type: model.model_type,
            topic_id: model.topic_id,
            wallet_id: wallet.id,
            wallet_address: wallet.address,
            mnemonic_phrase: mnemonic,
            created_at: wallet.created_at
          });
        }

        if (walletPhrases.length === 0) {
          throw new Error('No valid wallet phrases found for this user.');
        }
        
        result = {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'User wallet phrases retrieved successfully',
                userId: user.id,
                userEmail: user.email,
                wallets: walletPhrases,
                source: 'HTTP MCP server'
              }, null, 2),
            },
          ],
        };
        break;
      }

      case 'get_user_models': {
        const { apiKey } = args as { apiKey: string };

        // Step 1: Authenticate user with API key
        const user = await userService.validateApiKey(apiKey);
        if (!user) {
          throw new Error('Invalid API key. Please register a user first using the register_user tool to get a valid API key.');
        }

        // Step 2: Get user's models
        const models = await modelService.getModelsByUserId(user.id);
        
        result = {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'User models retrieved successfully',
                userId: user.id,
                userEmail: user.email,
                models,
                source: 'HTTP MCP server'
              }, null, 2),
            },
          ],
        };
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    res.json({ result });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Allora MCP Server - HTTP Interface',
    endpoints: {
      'GET /health': 'Health check',
      'GET /tools': 'List available tools',
      'POST /tools/call': 'Execute a tool',
    },
    usage: {
      'Register User': 'POST /tools/call with name: "register_user", arguments: { email: "your@email.com" }',
      'Get Topics': 'POST /tools/call with name: "get_active_topics", arguments: {}',
      'Register Model': 'POST /tools/call with name: "register_model", arguments: { apiKey: "...", topicId: "1", modelType: "inference", webhookUrl: "..." }',
      'Get Wallet Phrases': 'POST /tools/call with name: "get_user_wallet_phrases", arguments: { apiKey: "..." }',
      'Get User Models': 'POST /tools/call with name: "get_user_models", arguments: { apiKey: "..." }'
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('Starting HTTP MCP server...');
    
    app.listen(PORT, () => {
      console.log(`🚀 HTTP MCP Server running on port ${PORT}`);
      console.log(`🌐 Access at: http://localhost:${PORT}`);
      console.log(`📖 Documentation: http://localhost:${PORT}/`);
      console.log('✅ Ready for remote LLM connections!');
    });
  } catch (error) {
    console.error('Failed to start HTTP MCP server:', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  startServer();
}

export default app; 