#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set. Provide it via env.');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function run() {
  const client = await pool.connect();
  try {
    console.log('Connected to database');
    const files = [
      path.join(__dirname, '..', 'db', 'migrations', '009_create_submissions_table.sql'),
      path.join(__dirname, '..', 'db', 'migrations', '010_enable_rls_submissions.sql'),
    ];
    for (const file of files) {
      console.log(`Applying ${path.basename(file)}...`);
      const sql = fs.readFileSync(file, 'utf8');
      await client.query(sql);
      console.log(`Applied ${path.basename(file)}`);
    }
    console.log('Submissions migrations applied successfully');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();


