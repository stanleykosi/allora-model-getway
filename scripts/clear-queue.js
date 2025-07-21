/**
 * @description
 * Utility script to clear pending jobs from the Redis queue.
 * This helps resolve issues where the server tries to complete
 * previous jobs on startup.
 */

const IORedis = require('ioredis');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const INFERENCE_QUEUE_NAME = 'inference-submission';

async function clearQueue() {
  const connection = new IORedis(REDIS_URL);
  
  try {
    console.log('Connecting to Redis...');
    await connection.ping();
    console.log('✅ Connected to Redis successfully');
    
    // Get queue keys
    const queueKeys = await connection.keys(`bull:${INFERENCE_QUEUE_NAME}:*`);
    console.log(`Found ${queueKeys.length} queue-related keys`);
    
    if (queueKeys.length > 0) {
      console.log('Clearing queue keys...');
      await connection.del(...queueKeys);
      console.log('✅ Successfully cleared all queue keys');
    } else {
      console.log('No queue keys found to clear');
    }
    
    // Also clear any failed jobs
    const failedKeys = await connection.keys(`bull:${INFERENCE_QUEUE_NAME}:failed:*`);
    if (failedKeys.length > 0) {
      console.log(`Found ${failedKeys.length} failed job keys`);
      await connection.del(...failedKeys);
      console.log('✅ Successfully cleared failed job keys');
    }
    
    // Clear waiting jobs
    const waitingKeys = await connection.keys(`bull:${INFERENCE_QUEUE_NAME}:wait:*`);
    if (waitingKeys.length > 0) {
      console.log(`Found ${waitingKeys.length} waiting job keys`);
      await connection.del(...waitingKeys);
      console.log('✅ Successfully cleared waiting job keys');
    }
    
    // Clear active jobs
    const activeKeys = await connection.keys(`bull:${INFERENCE_QUEUE_NAME}:active:*`);
    if (activeKeys.length > 0) {
      console.log(`Found ${activeKeys.length} active job keys`);
      await connection.del(...activeKeys);
      console.log('✅ Successfully cleared active job keys');
    }
    
    console.log('🎉 Queue clearing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing queue:', error.message);
    process.exit(1);
  } finally {
    await connection.quit();
    console.log('Redis connection closed');
  }
}

clearQueue(); 