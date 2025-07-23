const { spawn } = require('child_process');

console.log('Testing Authenticated MCP Server...');

const mcp = spawn('npm', ['run', 'start:mcp:authenticated'], {
  cwd: '/home/stanley/allora-mcp',
  stdio: ['pipe', 'pipe', 'pipe']
});

setTimeout(() => {
  // Test tools/list
  const listRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };
  
  console.log('Sending tools/list request...');
  mcp.stdin.write(JSON.stringify(listRequest) + '\n');
  
  setTimeout(() => {
    // Test register_user
    const registerRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "register_user",
        arguments: {
          email: "test@example.com"
        }
      }
    };
    console.log('Sending register_user request...');
    mcp.stdin.write(JSON.stringify(registerRequest) + '\n');
  }, 2000);
  
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
}, 10000); 