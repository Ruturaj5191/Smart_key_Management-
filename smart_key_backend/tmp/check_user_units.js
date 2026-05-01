const mysql = require('mysql');
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'smart_key_db'
});

conn.connect((err) => {
    if (err) {
        console.error('Connection error:', err);
        return;
    }
    conn.query('SELECT id, name FROM users WHERE name LIKE "Ruturaj%"', (err, users) => {
        if (err || users.length === 0) {
            console.log('User Ruturaj not found');
            conn.end();
            return;
        }
        const userId = users[0].id;
        console.log('User ID:', userId);
        conn.query('SELECT u.*, o.name as org_name FROM units u JOIN organizations o ON o.id = u.org_id WHERE u.owner_id = ?', [userId], (err, units) => {
            if (err) {
                console.error('Query error:', err);
            } else {
                console.log('Units:', JSON.stringify(units, null, 2));
            }
            conn.end();
        });
    });
});
