#!/usr/bin/env node

/**
 * @description
 * This script verifies that RLS policies have been properly deployed to the database.
 * It checks for policy existence, RLS enablement, and provides guidance for testing
 * with real authentication.
 * 
 * Usage:
 *   node scripts/verify-rls-deployment.js
 */

const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyRLSDeployment() {
  console.log('🔍 Verifying RLS Policy Deployment');
  console.log('==================================\n');

  const client = await pool.connect();

  try {
    // Check RLS status on all tables
    console.log('📋 RLS Status Check:');
    const rlsStatusQuery = `
      SELECT 
        c.relname as table_name,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' 
        AND c.relname IN ('users', 'models', 'wallets', 'performance_metrics')
        AND c.relkind = 'r'
      ORDER BY c.relname;
    `;

    const rlsStatus = await client.query(rlsStatusQuery);
    rlsStatus.rows.forEach(row => {
      const status = row.rls_enabled ? (row.rls_forced ? 'FORCED ✅' : 'ENABLED ✅') : 'DISABLED ❌';
      console.log(`  ${row.table_name}: ${status}`);
    });

    // Check all policies exist
    console.log('\n🛡️  RLS Policies Check:');
    const policiesQuery = `
      SELECT 
        tablename,
        policyname,
        permissive,
        cmd
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;

    const policies = await client.query(policiesQuery);

    const expectedPolicies = {
      'users': ['users_select_self', 'users_update_self', 'users_insert_self'],
      'models': ['models_select_owner', 'models_insert_owner', 'models_update_owner', 'models_delete_owner'],
      'wallets': ['wallets_select_owner', 'wallets_update_owner'],
      'performance_metrics': ['performance_metrics_select_owner']
    };

    const actualPolicies = {};
    policies.rows.forEach(policy => {
      if (!actualPolicies[policy.tablename]) {
        actualPolicies[policy.tablename] = [];
      }
      actualPolicies[policy.tablename].push(policy.policyname);
    });

    let allPoliciesExist = true;

    for (const [table, expectedList] of Object.entries(expectedPolicies)) {
      console.log(`\n  ${table}:`);
      const actualList = actualPolicies[table] || [];

      for (const expectedPolicy of expectedList) {
        if (actualList.includes(expectedPolicy)) {
          console.log(`    ✅ ${expectedPolicy}`);
        } else {
          console.log(`    ❌ ${expectedPolicy} (MISSING)`);
          allPoliciesExist = false;
        }
      }
    }

    // Check for auth.uid() function availability
    console.log('\n🔑 Authentication Function Check:');
    try {
      const authCheck = await client.query("SELECT auth.uid()");
      console.log('  ✅ auth.uid() function is available');
    } catch (error) {
      console.log('  ❌ auth.uid() function not available');
      console.log('     This is expected in non-Supabase environments');
    }

    // Summary
    console.log('\n📊 Deployment Summary:');
    const tablesWithRLS = rlsStatus.rows.filter(row => row.rls_enabled).length;
    const totalTables = rlsStatus.rows.length;
    const totalPolicies = policies.rows.length;

    console.log(`  Tables with RLS: ${tablesWithRLS}/${totalTables}`);
    console.log(`  Total policies created: ${totalPolicies}`);
    console.log(`  All expected policies exist: ${allPoliciesExist ? '✅' : '❌'}`);

    if (tablesWithRLS === totalTables && allPoliciesExist) {
      console.log('\n🎉 RLS deployment verification PASSED!');
      console.log('\n📝 Next Steps for Testing:');
      console.log('   1. Test with your actual Supabase application');
      console.log('   2. Use Supabase client with real user authentication');
      console.log('   3. Verify users can only see their own data');
      console.log('   4. Check application logs for any RLS denials');
      console.log('\n💡 Testing Tips:');
      console.log('   - Create test users through your app\'s signup flow');
      console.log('   - Try accessing other users\' data via API calls');
      console.log('   - Monitor Supabase dashboard for RLS activity');
      console.log('   - Test with different user roles if applicable');
    } else {
      console.log('\n❌ RLS deployment has issues that need to be addressed');
    }

  } catch (error) {
    console.error('❌ Error verifying RLS deployment:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyRLSDeployment();