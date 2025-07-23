/**
 * @description
 * Authenticated MCP Server that replicates complete HTTP server workflow:
 * 1. User registration (get API key)
 * 2. Authentication for model operations
 * 3. Model registration with proper user linkage
 * 4. Wallet creation and Vault storage
 * 5. Database persistence with user-model relationships
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Create MCP server
const server = new Server(
  {
    name: 'allora-authenticated-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define MCP Tools with proper authentication workflow
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

// Handle tool calls with authentication
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    console.log(`MCP: Executing tool '${name}' with args:`, args);

    switch (name) {
      case 'register_user': {
        console.log('MCP: Registering user', { args });
        const { email } = args as { email: string };

        // Use dynamic import like original MCP server
        const { default: userService } = await import('./services/user.service');
        
        const result = await userService.createUser({ email });
        
        if (!result) {
          throw new Error('Failed to create user');
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'User registered successfully',
                userId: result.id,
                email: result.email,
                apiKey: result.apiKey,
                note: 'SAVE THIS API KEY IMMEDIATELY - it\'s your only way to access your models and wallets!',
                warning: 'If you lose this API key, you cannot recover your models or wallet phrases.',
                security_tips: [
                  'Store this API key securely (password manager recommended)',
                  'Never share your API key with anyone',
                  'Backup your API key safely - you cannot recover if lost',
                  'This API key is required for all model operations'
                ],
                source: 'MCP server using userService'
              }, null, 2),
            },
          ],
        };
      }

      case 'get_active_topics': {
        console.log('MCP: Getting active topics (same as HTTP endpoint)');
        
        // Use dynamic import like original MCP server
        const { default: alloraConnectorService } = await import('./core/allora-connector/allora-connector.service');
        const topics = await alloraConnectorService.getActiveTopics();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'Active topics retrieved successfully',
                topics,
                source: 'MCP server using alloraConnectorService'
              }, null, 2),
            },
          ],
        };
      }

      case 'register_model': {
        console.log('MCP: Registering model with authentication', { args });
        const { apiKey, topicId, modelType, webhookUrl, gasPriceLimit } = args as {
          apiKey: string;
          topicId: string;
          modelType: string;
          webhookUrl: string;
          gasPriceLimit?: string;
        };

        // Use dynamic imports
        const { default: userService } = await import('./services/user.service');
        const { default: modelService } = await import('./services/model.service');
        
        // Step 1: Authenticate user with API key
        const user = await userService.validateApiKey(apiKey);
        if (!user) {
          throw new Error('Invalid API key. Please register a user first using the register_user tool to get a valid API key.');
        }
        
        console.log('MCP: User authenticated:', user.id);
        
        // Step 2: Register model with authenticated user ID
        const result = await modelService.registerModel({
          userId: user.id,
          topicId: topicId,
          modelType: modelType as 'inference' | 'forecaster',
          webhookUrl: webhookUrl,
          maxGasPrice: gasPriceLimit,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'Model registered successfully with authentication',
                userId: user.id,
                userEmail: user.email,
                result,
                workflow: [
                  '1. Authenticated user with API key',
                  '2. Generated wallet automatically',
                  '3. Saved mnemonic phrase to Vault',
                  '4. Registered model on blockchain',
                  '5. Saved model data to PostgreSQL with user linkage'
                ],
                source: 'MCP server using authenticated workflow'
              }, null, 2),
            },
          ],
        };
      }

      case 'get_user_wallet_phrases': {
        console.log('MCP: Getting user wallet phrases with authentication', { args });
        const { apiKey } = args as { apiKey: string };

        // Use dynamic imports
        const { default: userService } = await import('./services/user.service');
        const { default: modelService } = await import('./services/model.service');
        const { default: walletService } = await import('./services/wallet.service');
        const { default: secretsService } = await import('./core/secrets/secrets.service');

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
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'User wallet phrases retrieved successfully',
                userId: user.id,
                userEmail: user.email,
                wallets: walletPhrases,
                source: 'MCP server using authenticated workflow'
              }, null, 2),
            },
          ],
        };
      }

      case 'get_user_models': {
        console.log('MCP: Getting user models with authentication', { args });
        const { apiKey } = args as { apiKey: string };

        // Use dynamic imports
        const { default: userService } = await import('./services/user.service');
        const { default: modelService } = await import('./services/model.service');

        // Step 1: Authenticate user with API key
        const user = await userService.validateApiKey(apiKey);
        if (!user) {
          throw new Error('Invalid API key. Please register a user first using the register_user tool to get a valid API key.');
        }

        // Step 2: Get user's models
        const models = await modelService.getModelsByUserId(user.id);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'User models retrieved successfully',
                userId: user.id,
                userEmail: user.email,
                models,
                source: 'MCP server using authenticated workflow'
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error('MCP tool execution failed:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            tool: name,
            args,
            source: 'MCP server using authenticated workflow'
          }, null, 2),
        },
      ],
    };
  }
});

// Start the MCP server (simple startup like original)
async function startMCPServer() {
  try {
    console.log('Starting authenticated MCP server (complete HTTP workflow)...');

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log('Authenticated MCP server started successfully');
    console.log('✅ User registration with API keys');
    console.log('✅ Authentication for all operations');
    console.log('✅ Uses PostgreSQL for persistence');
    console.log('✅ Uses Vault for secrets');
    console.log('✅ Generates wallets automatically');
    console.log('✅ Saves mnemonics to Vault');
    console.log('✅ Registers models on blockchain');
    console.log('✅ Proper user-model linkage');
    console.log('✅ Same workflow as HTTP endpoints');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startMCPServer();
}

export default server; 