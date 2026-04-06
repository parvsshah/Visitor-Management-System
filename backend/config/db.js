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

// PostgreSQL returns lowercase column names (e.g. user_id, is_active)
// but our JS code uses mixed-case (e.g. User_ID, Is_Active).
// This transformer adds mixed-case aliases so both formats work.
const specialMappings = {
  'checkin_time': 'CheckIn_Time',
  'checkout_time': 'CheckOut_Time',
  'checked_in_by': 'Checked_In_By',
  'checked_out_by': 'Checked_Out_By',
  'expected_checkout_time': 'Expected_CheckOut_Time',
  'checked_in_by_name': 'Checked_In_By_Name',
  'checked_out_by_name': 'Checked_Out_By_Name',
  'blacklisted_date': 'Blacklisted_Date',
};

function toPascalSnakeCase(key) {
  if (specialMappings[key]) return specialMappings[key];
  return key.split('_').map(part => {
    if (part.toLowerCase() === 'id') return 'ID';
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join('_');
}

function transformRow(row) {
  if (!row || typeof row !== 'object') return row;
  const transformed = { ...row }; // keep original lowercase keys
  for (const [key, value] of Object.entries(row)) {
    const newKey = toPascalSnakeCase(key);
    if (newKey !== key) {
      transformed[newKey] = value; // add mixed-case alias
    }
  }
  return transformed;
}

// Wrapper to match mysql2 destructuring pattern: const [rows] = await db.query(...)
const query = async (text, params) => {
  // Convert ? placeholders to $1, $2, etc. for pg
  let paramIndex = 0;
  const pgText = text.replace(/\?/g, () => `$${++paramIndex}`);
  const result = await pool.query(pgText, params);
  // Transform each row to add mixed-case column aliases
  const rows = result.rows.map(transformRow);
  return [rows, result.fields];
};

module.exports = { query, pool };
