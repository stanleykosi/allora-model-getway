const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkUsers() {
  console.log('🔍 Checking Users Table');
  console.log('========================\n');

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL successfully');

    // Check table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log('📋 Users table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check recent users
    const users = await pool.query(`
      SELECT id, email, clerk_user_id, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10;
    `);

    console.log(`\n👥 Found ${users.rows.length} users in database:`);
    if (users.rows.length === 0) {
      console.log('   No users found in database.');
    } else {
      users.rows.forEach((user, index) => {
        console.log(`\n   ${index + 1}. User ID: ${user.id}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Clerk User ID: ${user.clerk_user_id || 'N/A'}`);
        console.log(`      Created: ${user.created_at}`);
        console.log(`      Updated: ${user.updated_at}`);
      });
    }

    // Check for users with Clerk IDs specifically
    const clerkUsers = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE clerk_user_id IS NOT NULL;
    `);

    console.log(`\n🔐 Users with Clerk IDs: ${clerkUsers.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\nPostgreSQL connection closed');
  }
}

checkUsers(); 