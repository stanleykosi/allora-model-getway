#!/bin/bash

# Expose MCP Server to Internet using ngrok
# This allows remote users to connect to your MCP server

echo "🌐 Exposing MCP Server to Internet..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Please install ngrok first:"
    echo "   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null"
    echo "   echo 'deb https://ngrok-agent.s3.amazonaws.com buster main' | sudo tee /etc/apt/sources.list.d/ngrok.list"
    echo "   sudo apt update && sudo apt install ngrok"
    exit 1
fi

# Start the MCP server in background
echo "🚀 Starting MCP server..."
npm run start:mcp:authenticated &
MCP_PID=$!

# Wait for server to start
sleep 5

# Expose via ngrok (assuming MCP server uses port 3000)
echo "🌐 Exposing via ngrok..."
ngrok http 3000

# Cleanup
echo "🧹 Cleaning up..."
kill $MCP_PID 