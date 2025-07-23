const { spawn } = require('child_process');

console.log('Testing MCP Bridge...');

const bridge = spawn('npm', ['run', 'start:mcp:bridge'], {
  cwd: '/home/stanley/allora-mcp',
  stdio: ['pipe', 'pipe', 'pipe']
});

// Wait a moment for the bridge to start
setTimeout(() => {
  // Send tools/list request
  const listRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };

  console.log('Sending tools/list request...');
  bridge.stdin.write(JSON.stringify(listRequest) + '\n');

  // Wait for response
  setTimeout(() => {
    console.log('Sending call request...');
    const callRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "get_active_topics",
        arguments: {}
      }
    };
    bridge.stdin.write(JSON.stringify(callRequest) + '\n');
  }, 2000);

}, 1000);

bridge.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

bridge.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

setTimeout(() => {
  console.log('Test complete');
  bridge.kill();
  process.exit(0);
}, 10000); 