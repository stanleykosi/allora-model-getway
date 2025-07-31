#!/usr/bin/env node

/**
 * @description
 * This script applies Row Level Security (RLS) policies to the Supabase database.
 * It reads the RLS policy SQL file and executes it against the database.
 * 
 * Usage:
 *   node scripts/apply-rls-policies.js
 * 
 * Prerequisites:
 *   - DATABASE_URL must be set in .env.local
 *   - Database must have all required tables created (run previous migrations first)
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applyRLSPolicies() {
  console.log('🔒 Applying Row Level Security (RLS) Policies');
  console.log('===============================================\n');

  try {
    // Check database connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful\n');

    // Read the RLS policy file
    const rlsFilePath = path.join(__dirname, '..', 'db', 'migrations', '007_enable_rls_policies.sql');
    console.log(`📄 Reading RLS policy file: ${rlsFilePath}`);
    
    if (!fs.existsSync(rlsFilePath)) {
      throw new Error(`RLS policy file not found: ${rlsFilePath}`);
    }

    const rlsSQL = fs.readFileSync(rlsFilePath, 'utf8');
    console.log('✅ RLS policy file loaded successfully\n');

    // Check if RLS is already enabled on any table
    console.log('🔍 Checking current RLS status...');
    const rlsCheckQuery = `
      SELECT 
        c.relname as tablename,
        c.relrowsecurity as rowsecurity,
        c.relforcerowsecurity as forcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' 
        AND c.relname IN ('users', 'models', 'wallets', 'performance_metrics')
        AND c.relkind = 'r'
      ORDER BY c.relname;
    `;
    
    const rlsStatus = await client.query(rlsCheckQuery);
    
    if (rlsStatus.rows.length > 0) {
      console.log('Current RLS status:');
      rlsStatus.rows.forEach(row => {
        const status = row.rowsecurity ? (row.forcerowsecurity ? 'FORCED' : 'ENABLED') : 'DISABLED';
        console.log(`  - ${row.tablename}: ${status}`);
      });
      console.log();
    }

    // Apply RLS policies
    console.log('🚀 Applying RLS policies...');
    await client.query(rlsSQL);
    console.log('✅ RLS policies applied successfully\n');

    // Verify RLS is now enabled
    console.log('🔍 Verifying RLS status after migration...');
    const postMigrationStatus = await client.query(rlsCheckQuery);
    
    console.log('Updated RLS status:');
    postMigrationStatus.rows.forEach(row => {
      const status = row.rowsecurity ? (row.forcerowsecurity ? 'FORCED' : 'ENABLED') : 'DISABLED';
      console.log(`  - ${row.tablename}: ${status}`);
    });

    // Check policies were created
    console.log('\n🔍 Checking created policies...');
    const policiesQuery = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;
    
    const policies = await client.query(policiesQuery);
    console.log(`\n📋 Found ${policies.rows.length} RLS policies:`);
    
    let currentTable = '';
    policies.rows.forEach(policy => {
      if (policy.tablename !== currentTable) {
        currentTable = policy.tablename;
        console.log(`\n  ${currentTable}:`);
      }
      console.log(`    - ${policy.policyname} (${policy.cmd})`);
    });

    client.release();
    console.log('\n🎉 RLS migration completed successfully!');
    console.log('\n⚡ Next steps:');
    console.log('   1. Run the test script to verify RLS policies work correctly');
    console.log('   2. Test with actual user authentication to ensure isolation');
    console.log('   3. Monitor application logs for any RLS-related errors');

  } catch (error) {
    console.error('❌ Error applying RLS policies:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   - Ensure your database user has SUPERUSER privileges');
      console.error('   - For Supabase, use the service_role key in DATABASE_URL');
      console.error('   - Check that all required tables exist before applying RLS');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
applyRLSPolicies();