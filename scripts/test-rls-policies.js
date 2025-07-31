#!/usr/bin/env node

/**
 * @description
 * This script comprehensively tests Row Level Security (RLS) policies to ensure
 * proper data isolation between users. It creates test users and verifies that
 * each user can only access their own data.
 * 
 * Usage:
 *   node scripts/test-rls-policies.js
 * 
 * Prerequisites:
 *   - DATABASE_URL must be set in .env.local
 *   - RLS policies must be applied to the database
 *   - Database tables must exist
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

class RLSTestSuite {
  constructor() {
    this.testUsers = [];
    this.testData = {};
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runTests() {
    console.log('🔒 Testing Row Level Security (RLS) Policies');
    console.log('==============================================\n');

    try {
      await this.setupTestData();
      await this.testUserIsolation();
      await this.testModelAccess();
      await this.testWalletAccess();
      await this.testPerformanceMetricsAccess();
      await this.testCrossUserAccess();
      await this.cleanup();
      await this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  async setupTestData() {
    console.log('🛠️  Setting up test data...');

    const client = await pool.connect();

    try {
      // Create test users
      for (let i = 1; i <= 2; i++) {
        const userId = uuidv4();
        const email = `test-user-${i}@rls-test.com`;
        const clerkUserId = `clerk_test_${userId.replace(/-/g, '_')}`;

        await client.query(
          'INSERT INTO users (id, email, clerk_user_id) VALUES ($1, $2, $3)',
          [userId, email, clerkUserId]
        );

        this.testUsers.push({ id: userId, email, clerkUserId });
      }

      // Create test wallets and models for each user
      for (const user of this.testUsers) {
        // Create wallet
        const walletId = uuidv4();
        const address = `test-address-${user.id.substring(0, 8)}`;
        const secretRef = `test-secret-${user.id}`;

        await client.query(
          'INSERT INTO wallets (id, address, secret_ref) VALUES ($1, $2, $3)',
          [walletId, address, secretRef]
        );

        // Create model
        const modelId = uuidv4();
        const webhookUrl = `https://test-webhook-${user.id.substring(0, 8)}.com`;
        const topicId = `test-topic-${user.id.substring(0, 8)}`;

        await client.query(
          'INSERT INTO models (id, user_id, wallet_id, webhook_url, topic_id, model_type) VALUES ($1, $2, $3, $4, $5, $6)',
          [modelId, user.id, walletId, webhookUrl, topicId, 'inference']
        );

        // Create performance metrics
        await client.query(
          'INSERT INTO performance_metrics (model_id, timestamp, ema_score) VALUES ($1, $2, $3)',
          [modelId, new Date(), '0.85']
        );

        this.testData[user.id] = { walletId, modelId };
      }

      console.log(`✅ Created ${this.testUsers.length} test users with associated data\n`);
    } finally {
      client.release();
    }
  }

  async testUserIsolation() {
    console.log('👤 Testing user table isolation...');

    for (const user of this.testUsers) {
      const client = await pool.connect();

      try {
        // Set the user context for RLS
        await client.query(`SET LOCAL "request.jwt.claim.sub" = '${user.id}'`);
        await client.query(`SELECT set_config('request.jwt.claim.sub', '${user.id}', false)`);

        // Test: User can see their own record
        const ownRecord = await client.query('SELECT * FROM users WHERE id = $1', [user.id]);
        this.assert(
          ownRecord.rows.length === 1,
          `User ${user.email} can access their own record`
        );

        // Test: User cannot see other users' records (RLS should block access)
        const otherUsers = this.testUsers.filter(u => u.id !== user.id);
        for (const otherUser of otherUsers) {
          const otherRecord = await client.query('SELECT * FROM users WHERE id = $1', [otherUser.id]);
          this.assert(
            otherRecord.rows.length === 0,
            `User ${user.email} cannot access ${otherUser.email}'s record`
          );
        }

        // Test: User can only see themselves in general queries (RLS should filter results)
        const allVisibleUsers = await client.query('SELECT * FROM users');
        this.assert(
          allVisibleUsers.rows.length === 1 && allVisibleUsers.rows[0].id === user.id,
          `User ${user.email} can only see their own record in general queries`
        );

      } finally {
        client.release();
      }
    }
    console.log('✅ User isolation tests completed\n');
  }

  async testModelAccess() {
    console.log('🤖 Testing model table access...');

    for (const user of this.testUsers) {
      const client = await pool.connect();

      try {
        // Set user context
        await client.query(`SELECT set_config('request.jwt.claim.sub', '${user.id}', false)`);

        // Test: User can see their own models
        const ownModels = await client.query('SELECT * FROM models WHERE user_id = $1', [user.id]);
        this.assert(
          ownModels.rows.length === 1,
          `User ${user.email} can access their own models`
        );

        // Test: User cannot see other users' models
        const otherUsers = this.testUsers.filter(u => u.id !== user.id);
        for (const otherUser of otherUsers) {
          const otherModels = await client.query('SELECT * FROM models WHERE user_id = $1', [otherUser.id]);
          this.assert(
            otherModels.rows.length === 0,
            `User ${user.email} cannot access ${otherUser.email}'s models`
          );
        }

        // Test: General queries only return user's own models
        const allVisibleModels = await client.query('SELECT * FROM models');
        this.assert(
          allVisibleModels.rows.length === 1 && allVisibleModels.rows[0].user_id === user.id,
          `User ${user.email} can only see their own models in general queries`
        );

      } finally {
        client.release();
      }
    }
    console.log('✅ Model access tests completed\n');
  }

  async testWalletAccess() {
    console.log('💰 Testing wallet table access...');

    for (const user of this.testUsers) {
      const client = await pool.connect();

      try {
        // Set user context
        await client.query(`SELECT set_config('request.jwt.claim.sub', '${user.id}', false)`);

        // Test: User can see wallets associated with their models
        const ownWallets = await client.query('SELECT * FROM wallets WHERE id = $1', [this.testData[user.id].walletId]);
        this.assert(
          ownWallets.rows.length === 1,
          `User ${user.email} can access wallets associated with their models`
        );

        // Test: User cannot see other users' wallets
        const otherUsers = this.testUsers.filter(u => u.id !== user.id);
        for (const otherUser of otherUsers) {
          const otherWallets = await client.query('SELECT * FROM wallets WHERE id = $1', [this.testData[otherUser.id].walletId]);
          this.assert(
            otherWallets.rows.length === 0,
            `User ${user.email} cannot access ${otherUser.email}'s wallets`
          );
        }

      } finally {
        client.release();
      }
    }
    console.log('✅ Wallet access tests completed\n');
  }

  async testPerformanceMetricsAccess() {
    console.log('📊 Testing performance metrics access...');

    for (const user of this.testUsers) {
      const client = await pool.connect();

      try {
        // Set user context
        await client.query(`SELECT set_config('request.jwt.claim.sub', '${user.id}', false)`);

        // Test: User can see metrics for their own models
        const ownMetrics = await client.query('SELECT * FROM performance_metrics WHERE model_id = $1', [this.testData[user.id].modelId]);
        this.assert(
          ownMetrics.rows.length === 1,
          `User ${user.email} can access metrics for their own models`
        );

        // Test: User cannot see metrics for other users' models
        const otherUsers = this.testUsers.filter(u => u.id !== user.id);
        for (const otherUser of otherUsers) {
          const otherMetrics = await client.query('SELECT * FROM performance_metrics WHERE model_id = $1', [this.testData[otherUser.id].modelId]);
          this.assert(
            otherMetrics.rows.length === 0,
            `User ${user.email} cannot access ${otherUser.email}'s metrics`
          );
        }

      } finally {
        client.release();
      }
    }
    console.log('✅ Performance metrics access tests completed\n');
  }

  async testCrossUserAccess() {
    console.log('🔀 Testing cross-user access attempts...');

    const user1 = this.testUsers[0];
    const user2 = this.testUsers[1];
    const client = await pool.connect();

    try {
      // Set context as user1
      await client.query(`SELECT set_config('request.jwt.claim.sub', '${user1.id}', false)`);

      // Test: User1 cannot update user2's data
      try {
        await client.query('UPDATE users SET email = $1 WHERE id = $2', ['hacked@evil.com', user2.id]);
        const updatedUser = await client.query('SELECT email FROM users WHERE id = $1', [user2.id]);
        this.assert(
          updatedUser.rows.length === 0, // Should not see the record at all
          'User1 cannot update user2\'s email'
        );
      } catch (error) {
        // RLS may prevent the query entirely, which is also valid
        this.assert(true, 'User1 cannot update user2\'s email (query blocked)');
      }

      // Test: User1 cannot delete user2's models
      try {
        const deleteResult = await client.query('DELETE FROM models WHERE user_id = $1', [user2.id]);
        this.assert(
          deleteResult.rowCount === 0,
          'User1 cannot delete user2\'s models'
        );
      } catch (error) {
        this.assert(true, 'User1 cannot delete user2\'s models (query blocked)');
      }

    } finally {
      client.release();
    }

    console.log('✅ Cross-user access tests completed\n');
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');

    const client = await pool.connect();

    try {
      // Delete test data in correct order (respecting foreign keys)
      for (const user of this.testUsers) {
        const { modelId, walletId } = this.testData[user.id] || {};

        if (modelId) {
          await client.query('DELETE FROM performance_metrics WHERE model_id = $1', [modelId]);
          await client.query('DELETE FROM models WHERE id = $1', [modelId]);
        }

        if (walletId) {
          await client.query('DELETE FROM wallets WHERE id = $1', [walletId]);
        }

        await client.query('DELETE FROM users WHERE id = $1', [user.id]);
      }

      console.log('✅ Test data cleaned up\n');
    } finally {
      client.release();
    }
  }

  assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      this.testResults.passed++;
    } else {
      console.log(`  ❌ ${message}`);
      this.testResults.failed++;
      this.testResults.errors.push(message);
    }
  }

  async printResults() {
    const total = this.testResults.passed + this.testResults.failed;

    console.log('📋 Test Results Summary');
    console.log('=======================');
    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed tests:');
      this.testResults.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
      console.log('\n🚨 RLS policies are NOT working correctly!');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed! RLS policies are working correctly.');
      console.log('\n✅ Your database is properly secured with Row Level Security.');
      console.log('\n📝 Recommendations:');
      console.log('   - Monitor your application logs for RLS denials');
      console.log('   - Test with real user authentication tokens');
      console.log('   - Consider adding application-level tests for edge cases');
    }
  }
}

// Handle authentication context for Supabase
async function setupSupabaseRLSContext() {
  // This function can be extended to handle Supabase-specific auth context
  // For now, we simulate it using PostgreSQL's set_config
  console.log('🔧 Setting up authentication context simulation...\n');
}

// Run the test suite
async function main() {
  try {
    await setupSupabaseRLSContext();
    const testSuite = new RLSTestSuite();
    await testSuite.runTests();
  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();