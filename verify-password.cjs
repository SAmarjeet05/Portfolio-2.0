const bcrypt = require('bcryptjs');

const password = 'amar';
const hash = '$2a$10$vbnikPQe9heJDxv1m7CDS.uGME3tcBWfELubzfGRjm1z5cJhwEyNi';

bcrypt.compare(password, hash).then(match => {
  if (match) {
    console.log('✅ CORRECT! Password "amar" matches the hash perfectly');
    process.exit(0);
  } else {
    console.log('❌ MISMATCH! Password "amar" does NOT match the hash');
    process.exit(1);
  }
}).catch(e => {
  console.log('❌ ERROR:', e.message);
  process.exit(1);
});
