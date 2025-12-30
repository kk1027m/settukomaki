const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  console.log('Seeding database...');

  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    // Insert users
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role, full_name) VALUES
        ('admin', 'admin@sets-carton.co.jp', $1, 'admin', '管理者'),
        ('user1', 'user1@sets-carton.co.jp', $2, 'user', '山田太郎')
      ON CONFLICT (username) DO NOTHING
    `, [adminPassword, userPassword]);
    console.log('✓ Users seeded');

    // Get admin user ID
    const adminResult = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    const adminId = adminResult.rows[0]?.id;

    if (adminId) {
      // Insert sample lubrication points
      await pool.query(`
        INSERT INTO lubrication_points (machine_name, location, cycle_days, created_by) VALUES
          ('コルゲータ #1', 'メインベアリング左', 30, $1),
          ('コルゲータ #1', 'ギアボックス上部', 60, $1),
          ('ロータリー #2', 'メインシャフト', 45, $1),
          ('プリンター #1', 'チェーン駆動部', 30, $1),
          ('スリッター #3', 'カッターヘッド', 14, $1)
        ON CONFLICT (machine_name, location) DO NOTHING
      `, [adminId]);
      console.log('✓ Lubrication points seeded');

      // Insert sample parts
      await pool.query(`
        INSERT INTO parts (part_number, part_name, current_stock, min_stock, unit, created_by) VALUES
          ('BRG-6305', 'ベアリング 6305', 8, 10, '個', $1),
          ('BELT-A100', 'Vベルト A-100', 5, 5, '本', $1),
          ('OIL-VG32', '潤滑油 VG32', 50, 20, 'L', $1),
          ('SEAL-100', 'オイルシール 100mm', 15, 10, '個', $1),
          ('CHAIN-12B', 'ローラーチェーン 12B', 3, 5, '本', $1)
        ON CONFLICT (part_number) DO NOTHING
      `, [adminId]);
      console.log('✓ Parts seeded');
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
