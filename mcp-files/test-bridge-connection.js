const { spawn } = require('child_process');

// Test the MCP bridge directly
const bridge = spawn('npm', ['run', 'start:mcp:bridge'], {
  cwd: '/home/stanley/allora-mcp',
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send a simple MCP request
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {}
};

console.log('Sending request to bridge...');
bridge.stdin.write(JSON.stringify(request) + '\n');

let response = '';
bridge.stdout.on('data', (data) => {
  response += data.toString();
  console.log('Received:', data.toString());
});

bridge.stderr.on('data', (data) => {
  console.error('Bridge error:', data.toString());
});

setTimeout(() => {
  console.log('Final response:', response);
  bridge.kill();
  process.exit(0);
}, 5000); 