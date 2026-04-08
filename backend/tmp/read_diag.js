const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('tmp/diag_output.json', 'utf8'));
  console.log('--- ROLES ---');
  console.table(data["SELECT * FROM roles"]);
  console.log('--- UNITS ---');
  console.table(data["SELECT * FROM units"]);
  console.log('--- USERS ---');
  console.table(data["SELECT * FROM users"]);
  console.log('--- ORGANIZATIONS ---');
  console.table(data["SELECT * FROM organizations"]);
} catch (e) {
  console.error('Error parsing JSON:', e.message);
}
