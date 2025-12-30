const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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

async function runMigration() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('Usage: node run-single-migration.js <migration-file>');
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, '../src/database/migrations');
  const filePath = path.join(migrationsDir, migrationFile);

  if (!fs.existsSync(filePath)) {
    console.error(`Migration file not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Executing ${migrationFile}...`);
  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    await pool.query(sql);
    console.log(`✓ ${migrationFile} completed successfully!`);
  } catch (error) {
    console.error(`✗ ${migrationFile} failed:`, error.message);
    process.exit(1);
  }

  await pool.end();
}

runMigration().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
