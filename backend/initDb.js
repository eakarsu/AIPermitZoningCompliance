const pool = require('./db');
require('dotenv').config({ path: '../.env' });

async function initDb() {
  console.log('Initializing database schema...');

  // Create ai_results table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      endpoint VARCHAR(100),
      entity_table VARCHAR(100),
      entity_id INTEGER,
      result TEXT,
      result_json JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Add ai_analysis column to all 16 entity tables
  const tables = [
    'permit_applications',
    'zoning_checks',
    'document_reviews',
    'code_violations',
    'inspections',
    'plan_reviews',
    'environmental_assessments',
    'setback_calculations',
    'occupancy_classifications',
    'fire_safety_checks',
    'ada_compliance',
    'stormwater_plans',
    'historical_reviews',
    'noise_assessments',
    'parking_analyses',
  ];

  for (const table of tables) {
    try {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ai_analysis TEXT`);
      console.log(`Added ai_analysis to ${table}`);
    } catch (err) {
      console.log(`Skipping ${table}: ${err.message}`);
    }
  }

  // Add status_history to permit_applications
  try {
    await pool.query(`ALTER TABLE permit_applications ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb`);
    await pool.query(`ALTER TABLE permit_applications ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP`);
    await pool.query(`ALTER TABLE permit_applications ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`);
    await pool.query(`ALTER TABLE permit_applications ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP`);
    console.log('Added permit state machine columns');
  } catch (err) {
    console.log('Permit state machine columns may already exist:', err.message);
  }

  // Create documents upload table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS uploaded_documents (
      id SERIAL PRIMARY KEY,
      original_filename VARCHAR(255),
      file_path VARCHAR(500),
      entity_type VARCHAR(100),
      entity_id INTEGER,
      uploaded_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('Database initialization complete.');
  await pool.end();
}

initDb().catch(err => {
  console.error('DB init error:', err.message);
  process.exit(1);
});
