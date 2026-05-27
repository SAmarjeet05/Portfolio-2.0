const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = '$2a$10$2ZkHDLNFwLHBngjX8s3kcOhgyEJ9HEiHprXNR7Z8ecXa4EW67HQUG';

bcrypt.compare(password, hash).then(match => {
  if (match) {
    console.log('✅ PASSWORD MATCHES! Login will work.');
    process.exit(0);
  } else {
    console.log('❌ PASSWORD DOES NOT MATCH');
    process.exit(1);
  }
}).catch(e => {
  console.log('❌ ERROR:', e.message);
  process.exit(1);
});
