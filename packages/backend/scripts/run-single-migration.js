const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

async function runMigration(filename) {
  const migrationsDir = path.join(__dirname, '../src/database/migrations');
  const filepath = path.join(migrationsDir, filename);

  if (!fs.existsSync(filepath)) {
    console.error('Migration file not found:', filename);
    process.exit(1);
  }

  console.log('Running migration:', filename);
  const sql = fs.readFileSync(filepath, 'utf8');

  try {
    await pool.query(sql);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error.message);
  }

  await pool.end();
}

const filename = process.argv[2];
if (!filename) {
  console.error('Usage: node run-single-migration.js <filename>');
  process.exit(1);
}

runMigration(filename);
