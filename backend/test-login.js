// ============================================
// Test Login Script
// Run this to verify password hashing works
// ============================================

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testLogin() {
  console.log('=== Testing Login System ===\n');

  // Test password
  const testPassword = 'admin123';
  console.log('Test Password:', testPassword);

  // Create connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('✓ Connected to database\n');

  // Get all users
  const [users] = await connection.query('SELECT User_ID, Username, Password_Hash FROM USER_ACCOUNT');
  
  console.log('Found', users.length, 'users in database:\n');

  for (const user of users) {
    console.log('─────────────────────────────────');
    console.log('Username:', user.Username);
    console.log('User ID:', user.User_ID);
    console.log('Stored Hash:', user.Password_Hash.substring(0, 30) + '...');
    
    // Test if password matches
    const isMatch = await bcrypt.compare(testPassword, user.Password_Hash);
    console.log('Password "admin123" matches:', isMatch ? '✅ YES' : '❌ NO');
    
    if (!isMatch) {
      // Generate correct hash
      const correctHash = await bcrypt.hash(testPassword, 10);
      console.log('\n❌ Password does NOT match!');
      console.log('Correct hash should be:', correctHash.substring(0, 30) + '...');
    }
    console.log('');
  }

  console.log('=== Test Complete ===\n');

  // Generate fresh hash for reference
  console.log('Generating fresh hash for "admin123":');
  const freshHash = await bcrypt.hash('admin123', 10);
  console.log('Fresh Hash:', freshHash);
  
  console.log('\nVerifying fresh hash:');
  const freshMatch = await bcrypt.compare('admin123', freshHash);
  console.log('Fresh hash works:', freshMatch ? '✅ YES' : '❌ NO');

  await connection.end();
}

testLogin().catch(console.error);