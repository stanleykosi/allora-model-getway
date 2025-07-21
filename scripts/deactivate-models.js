/**
 * @description
 * Utility script to deactivate all models in the database.
 * This prevents schedulers from trying to process old models on startup.
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

async function deactivateModels() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Connecting to PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL successfully');
    
    // Check current active models
    const activeModelsResult = await pool.query(`
      SELECT id, topic_id, webhook_url, is_active 
      FROM models 
      WHERE is_active = true
    `);
    
    console.log(`Found ${activeModelsResult.rows.length} active models:`);
    activeModelsResult.rows.forEach(model => {
      console.log(`  - Model ID: ${model.id}, Topic: ${model.topic_id}, Webhook: ${model.webhook_url}`);
    });
    
    if (activeModelsResult.rows.length > 0) {
      console.log('Deactivating all models...');
      const deactivateResult = await pool.query(`
        UPDATE models 
        SET is_active = false, updated_at = NOW() 
        WHERE is_active = true
      `);
      
      console.log(`✅ Successfully deactivated ${deactivateResult.rowCount} models`);
    } else {
      console.log('No active models found to deactivate');
    }
    
    // Also check for any active topics that might cause issues
    const activeTopicsResult = await pool.query(`
      SELECT DISTINCT topic_id 
      FROM models 
      WHERE is_active = true
    `);
    
    if (activeTopicsResult.rows.length > 0) {
      console.log(`⚠️  Warning: Found ${activeTopicsResult.rows.length} topics with active models`);
    } else {
      console.log('✅ No active topics found');
    }
    
    console.log('🎉 Model deactivation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error deactivating models:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('PostgreSQL connection closed');
  }
}

deactivateModels(); 