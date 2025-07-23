#!/usr/bin/env node

/**
 * @description
 * Utility script to clear Redis job queues for the HTTP server.
 * This prevents issues with pending jobs from previous runs.
 * 
 * Usage:
 *   node scripts/clear-queue.js
 */

const IORedis = require('ioredis');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Queue names used by the HTTP server
const QUEUE_NAMES = [
  'inference-submission',
  'performance-monitoring'
];

async function clearQueues() {
  const connection = new IORedis(REDIS_URL);

  try {
    console.log('🔍 Connecting to Redis...');
    await connection.ping();
    console.log('✅ Connected to Redis successfully');

    let totalCleared = 0;

    for (const queueName of QUEUE_NAMES) {
      console.log(`\n🔍 Checking queue: ${queueName}`);

      // Find all keys related to this queue
      const queueKeys = await connection.keys(`bull:${queueName}:*`);

      if (queueKeys.length > 0) {
        console.log(`⚠️  Found ${queueKeys.length} keys for queue '${queueName}'`);
        console.log('🧹 Clearing queue...');

        // Delete all keys for this queue
        await connection.del(...queueKeys);
        console.log(`✅ Successfully cleared ${queueKeys.length} keys from '${queueName}'`);
        totalCleared += queueKeys.length;
      } else {
        console.log(`✅ No keys found for queue '${queueName}'`);
      }
    }

    // Also check for any other BullMQ related keys
    console.log('\n🔍 Checking for other BullMQ keys...');
    const allBullKeys = await connection.keys('bull:*');

    if (allBullKeys.length > 0) {
      console.log(`⚠️  Found ${allBullKeys.length} total BullMQ keys`);
      console.log('🧹 Clearing all remaining BullMQ keys...');
      await connection.del(...allBullKeys);
      console.log(`✅ Successfully cleared all BullMQ keys`);
      totalCleared += allBullKeys.length;
    } else {
      console.log('✅ No other BullMQ keys found');
    }

    console.log(`\n🎉 Queue clearing completed!`);
    console.log(`📊 Total keys cleared: ${totalCleared}`);

  } catch (error) {
    console.error('❌ Error clearing queues:', error.message);
    process.exit(1);
  } finally {
    await connection.quit();
    console.log('Redis connection closed');
  }
}

clearQueues(); 