/**
 * @description
 * Web Interface for Allora MCP Server
 * Allows users to interact with the MCP server through a browser
 */

import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static HTML
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Serve the main HTML page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Allora MCP Server - Web Interface</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            background: #f9f9f9;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #555;
        }
        input, select, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        button {
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
        }
        button:hover {
            background: #5a6fd8;
        }
        .result {
            background: #f0f8ff;
            border: 1px solid #b0d4f1;
            border-radius: 5px;
            padding: 15px;
            margin-top: 15px;
            white-space: pre-wrap;
            font-family: monospace;
            max-height: 400px;
            overflow-y: auto;
        }
        .error {
            background: #ffe6e6;
            border: 1px solid #ffb3b3;
            color: #cc0000;
        }
        .success {
            background: #e6ffe6;
            border: 1px solid #b3ffb3;
            color: #006600;
        }
        .api-key {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Allora MCP Server - Web Interface</h1>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> Save your API key securely! You cannot recover it if lost.
        </div>

        <!-- Health Check -->
        <div class="section">
            <h3>🏥 Server Health Check</h3>
            <button onclick="checkHealth()">Check Server Status</button>
            <div id="healthResult" class="result" style="display: none;"></div>
        </div>

        <!-- Get Tools -->
        <div class="section">
            <h3>🛠️ Available Tools</h3>
            <button onclick="getTools()">List Available Tools</button>
            <div id="toolsResult" class="result" style="display: none;"></div>
        </div>

        <!-- Get Topics -->
        <div class="section">
            <h3>📊 Blockchain Topics</h3>
            <button onclick="getTopics()">Get Active Topics</button>
            <div id="topicsResult" class="result" style="display: none;"></div>
        </div>

        <!-- Register User -->
        <div class="section">
            <h3>👤 Register User</h3>
            <div class="form-group">
                <label for="userEmail">Email:</label>
                <input type="email" id="userEmail" placeholder="user@example.com">
            </div>
            <button onclick="registerUser()">Register User</button>
            <div id="registerResult" class="result" style="display: none;"></div>
        </div>

        <!-- Register Model -->
        <div class="section">
            <h3>🤖 Register Model</h3>
            <div class="form-group">
                <label for="modelApiKey">API Key:</label>
                <input type="text" id="modelApiKey" placeholder="Your API key from user registration">
            </div>
            <div class="form-group">
                <label for="topicId">Topic ID:</label>
                <select id="topicId">
                    <option value="1">1 - ETH 10min Prediction</option>
                    <option value="2">2 - ETH 24h Prediction</option>
                    <option value="3">3 - BTC 10min Prediction</option>
                    <option value="4">4 - BTC 24h Prediction</option>
                    <option value="7">7 - ETH 20min Prediction</option>
                </select>
            </div>
            <div class="form-group">
                <label for="modelType">Model Type:</label>
                <select id="modelType">
                    <option value="inference">Inference</option>
                    <option value="forecaster">Forecaster</option>
                    <option value="reputer">Reputer</option>
                </select>
            </div>
            <div class="form-group">
                <label for="webhookUrl">Webhook URL:</label>
                <input type="url" id="webhookUrl" placeholder="https://your-webhook.com">
            </div>
            <button onclick="registerModel()">Register Model</button>
            <div id="modelResult" class="result" style="display: none;"></div>
        </div>

        <!-- Get Wallet Phrases -->
        <div class="section">
            <h3>💰 Get Wallet Phrases</h3>
            <div class="form-group">
                <label for="walletApiKey">API Key:</label>
                <input type="text" id="walletApiKey" placeholder="Your API key">
            </div>
            <button onclick="getWalletPhrases()">Get Wallet Phrases</button>
            <div id="walletResult" class="result" style="display: none;"></div>
        </div>

        <!-- Get User Models -->
        <div class="section">
            <h3>📋 Get User Models</h3>
            <div class="form-group">
                <label for="modelsApiKey">API Key:</label>
                <input type="text" id="modelsApiKey" placeholder="Your API key">
            </div>
            <button onclick="getUserModels()">Get User Models</button>
            <div id="modelsResult" class="result" style="display: none;"></div>
        </div>
    </div>

    <script>
        const MCP_SERVER_URL = 'https://8a3d259e905d.ngrok-free.app';

        async function makeRequest(endpoint, method = 'GET', body = null) {
            try {
                const options = {
                    method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                if (body) {
                    options.body = JSON.stringify(body);
                }

                const response = await fetch(\`\${MCP_SERVER_URL}\${endpoint}\`, options);
                const data = await response.json();
                
                return { success: true, data };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        function showResult(elementId, result, isError = false) {
            const element = document.getElementById(elementId);
            element.style.display = 'block';
            element.className = \`result \${isError ? 'error' : 'success'}\`;
            element.textContent = JSON.stringify(result, null, 2);
        }

        async function checkHealth() {
            const result = await makeRequest('/health');
            showResult('healthResult', result);
        }

        async function getTools() {
            const result = await makeRequest('/tools');
            showResult('toolsResult', result);
        }

        async function getTopics() {
            const result = await makeRequest('/tools/call', 'POST', {
                name: 'get_active_topics',
                arguments: {}
            });
            showResult('topicsResult', result);
        }

        async function registerUser() {
            const email = document.getElementById('userEmail').value;
            if (!email) {
                alert('Please enter an email address');
                return;
            }

            const result = await makeRequest('/tools/call', 'POST', {
                name: 'register_user',
                arguments: { email }
            });
            showResult('registerResult', result);
        }

        async function registerModel() {
            const apiKey = document.getElementById('modelApiKey').value;
            const topicId = document.getElementById('topicId').value;
            const modelType = document.getElementById('modelType').value;
            const webhookUrl = document.getElementById('webhookUrl').value;

            if (!apiKey || !webhookUrl) {
                alert('Please fill in all required fields');
                return;
            }

            const result = await makeRequest('/tools/call', 'POST', {
                name: 'register_model',
                arguments: {
                    apiKey,
                    topicId,
                    modelType,
                    webhookUrl
                }
            });
            showResult('modelResult', result);
        }

        async function getWalletPhrases() {
            const apiKey = document.getElementById('walletApiKey').value;
            if (!apiKey) {
                alert('Please enter your API key');
                return;
            }

            const result = await makeRequest('/tools/call', 'POST', {
                name: 'get_user_wallet_phrases',
                arguments: { apiKey }
            });
            showResult('walletResult', result);
        }

        async function getUserModels() {
            const apiKey = document.getElementById('modelsApiKey').value;
            if (!apiKey) {
                alert('Please enter your API key');
                return;
            }

            const result = await makeRequest('/tools/call', 'POST', {
                name: 'get_user_models',
                arguments: { apiKey }
            });
            showResult('modelsResult', result);
        }

        // Auto-check health on page load
        window.onload = function() {
            checkHealth();
        };
    </script>
</body>
</html>
  `);
});

// Start the web interface server
app.listen(PORT, () => {
  console.log(`🌐 Web Interface running on http://localhost:${PORT}`);
  console.log(`📱 Access the interface in your browser`);
  console.log(`🔗 MCP Server: https://8a3d259e905d.ngrok-free.app`);
});

export default app; 