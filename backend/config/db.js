// ============================================
// FILE: config/db.js (PostgreSQL Configuration)
// ============================================
const { Pool } = require('pg');

// Create PostgreSQL connection pool using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test database connection
pool.connect()
  .then(client => {
    console.log('✓ PostgreSQL Database connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('Error connecting to database:', err.message);
  });

// Wrapper to match mysql2 destructuring pattern: const [rows] = await db.query(...)
// PostgreSQL pg returns { rows, rowCount }, mysql2 returns [rows, fields]
const query = async (text, params) => {
  // Convert ? placeholders to $1, $2, etc. for pg
  let paramIndex = 0;
  const pgText = text.replace(/\?/g, () => `$${++paramIndex}`);
  const result = await pool.query(pgText, params);
  return [result.rows, result.fields];
};

module.exports = { query, pool };
