const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Support both DATABASE_URL (production) and individual env vars (development)
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

async function runNewMigrations() {
  const migrationsDir = path.join(__dirname, '../src/database/migrations');

  // Only run new migrations
  const newMigrations = [
    '009_add_unit_column.sql',
    '010_create_replacement_schedules.sql',
    '011_create_settings.sql'
  ];

  console.log('Running new migrations...');

  for (const file of newMigrations) {
    console.log(`Executing ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    try {
      await pool.query(sql);
      console.log(`✓ ${file} completed`);
    } catch (error) {
      console.error(`✗ ${file} failed:`, error.message);
      process.exit(1);
    }
  }

  console.log('All new migrations completed successfully!');
  await pool.end();
}

runNewMigrations().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
