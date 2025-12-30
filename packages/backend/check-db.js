const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connected:', result.rows[0].now);

    console.log('\nChecking attachments table...');
    const attachments = await pool.query('SELECT id, file_name, file_path, mime_type FROM attachments ORDER BY id DESC LIMIT 5');
    console.log('Attachments in database:');
    console.table(attachments.rows);

    await pool.end();
  } catch (error) {
    console.error('✗ Database error:', error.message);
    console.error('\nPlease ensure PostgreSQL is running and the database is created.');
    console.error('You can create it with: createdb -U postgres sets_carton_maintenance');
    process.exit(1);
  }
}

checkDatabase();
