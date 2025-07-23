/**
 * @description
 * Startup script for the HTTP server with optional queue clearing.
 * This helps prevent issues with pending jobs from previous runs.
 */

const { spawn } = require('child_process');
const IORedis = require('ioredis');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const INFERENCE_QUEUE_NAME = 'inference-submission';

async function clearQueue() {
  const connection = new IORedis(REDIS_URL);
  
  try {
    console.log('🔍 Checking for pending jobs...');
    await connection.ping();
    
    // Check for any pending jobs
    const queueKeys = await connection.keys(`bull:${INFERENCE_QUEUE_NAME}:*`);
    
    if (queueKeys.length > 0) {
      console.log(`⚠️  Found ${queueKeys.length} pending job keys`);
      console.log('🧹 Clearing pending jobs...');
      await connection.del(...queueKeys);
      console.log('✅ Successfully cleared all pending jobs');
    } else {
      console.log('✅ No pending jobs found');
    }
    
  } catch (error) {
    console.error('❌ Error checking/clearing queue:', error.message);
  } finally {
    await connection.quit();
  }
}

async function startServer() {
  // Check if --clear-queue flag is provided
  const shouldClearQueue = process.argv.includes('--clear-queue');
  
  if (shouldClearQueue) {
    console.log('🚀 Starting server with queue clearing...');
    await clearQueue();
  } else {
    console.log('🚀 Starting server...');
  }
  
  // Start the server
  const server = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGTERM');
  });
}

startServer(); 