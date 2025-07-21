#!/usr/bin/env node

/**
 * @description
 * This script creates a test user with an API key for testing the model registration endpoint.
 * It uses the UserService to create a user and displays the API key for testing.
 * 
 * Usage:
 *   node scripts/create-test-user.js
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Import the database client
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTestUser() {
  console.log('🔑 Creating Test User with API Key');
  console.log('====================================\n');

  try {
    // Generate a test API key
    const apiKey = require('crypto').randomBytes(16).toString('hex');
    const keyPrefix = apiKey.substring(0, 8);

    // Hash the API key
    const saltRounds = 12;
    const apiKeyHash = await bcrypt.hash(apiKey, saltRounds);

    // Test user data
    const email = 'test@example.com';
    const userId = uuidv4();

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  User with email test@example.com already exists.');
      console.log('   You can use an existing API key or create a new user with a different email.');
      return;
    }

    // Check if key prefix already exists
    const existingPrefix = await pool.query(
      'SELECT id FROM users WHERE api_key_prefix = $1',
      [keyPrefix]
    );

    if (existingPrefix.rows.length > 0) {
      console.log('⚠️  API key prefix collision detected. Please run the script again.');
      return;
    }

    // Insert the new user
    const query = `
      INSERT INTO users (id, email, api_key_hash, api_key_prefix)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email;
    `;
    const values = [userId, email, apiKeyHash, keyPrefix];

    const result = await pool.query(query, values);
    const newUser = result.rows[0];

    if (!newUser) {
      console.log('❌ Failed to create user.');
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('\n📋 User Details:');
    console.log(`   User ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   API Key: ${apiKey}`);
    console.log(`   Key Prefix: ${keyPrefix}`);

    console.log('\n🔧 Testing Instructions:');
    console.log('1. Start the server: npm start');
    console.log('2. Use this API key in the X-API-Key header');
    console.log('3. Test with curl or Postman:');
    console.log('\n   curl -X POST http://localhost:3000/api/v1/models \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -H "X-API-Key: ' + apiKey + '" \\');
    console.log('     -d \'{');
    console.log('       "webhook_url": "https://your-model-endpoint.com/inference",');
    console.log('       "topic_id": "12",');
    console.log('       "model_type": "inference"');
    console.log('     }\'');

    console.log('\n⚠️  IMPORTANT: Save this API key - it won\'t be shown again!');

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
createTestUser().catch(console.error); 