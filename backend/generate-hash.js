// ============================================
// Generate Password Hash
// Simple script that doesn't need database
// ============================================

const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  
  console.log('Generating hash for password:', password);
  console.log('Please wait...\n');
  
  // Generate hash with 10 rounds
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Generated Hash:');
  console.log(hash);
  console.log('\n');
  
  // Verify it works
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification test:', isValid ? '✅ Hash is valid' : '❌ Hash is invalid');
  
  console.log('\n--- SQL to update users ---');
  console.log(`UPDATE USER_ACCOUNT SET Password_Hash = '${hash}';`);
  console.log('\nOr run this in MySQL:');
  console.log(`mysql -u root -p visitor_management_system -e "UPDATE USER_ACCOUNT SET Password_Hash = '${hash}';"`);
}

generateHash();