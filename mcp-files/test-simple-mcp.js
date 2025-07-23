const { spawn } = require('child_process');

console.log('Testing Simple MCP Server...');

const mcp = spawn('npm', ['run', 'start:mcp:simple'], {
  cwd: '/home/stanley/allora-mcp',
  stdio: ['pipe', 'pipe', 'pipe']
});

setTimeout(() => {
  const request = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };
  
  console.log('Sending tools/list request...');
  mcp.stdin.write(JSON.stringify(request) + '\n');
  
  setTimeout(() => {
    const callRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "test_connection",
        arguments: {}
      }
    };
    console.log('Sending test_connection request...');
    mcp.stdin.write(JSON.stringify(callRequest) + '\n');
  }, 1000);
  
}, 1000);

mcp.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

mcp.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

setTimeout(() => {
  console.log('Test complete');
  mcp.kill();
  process.exit(0);
}, 5000); 