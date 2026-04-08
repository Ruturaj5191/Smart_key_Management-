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
    // Create a unit for Ruturaj (ID 5) in 'sai millin' (ID 1)
    conn.query('INSERT INTO units (org_id, owner_id, unit_name) VALUES (1, 5, "Unit 101")', (err, result) => {
        if (err) {
            console.error('Query error:', err);
        } else {
            console.log('Unit created:', result.insertId);
        }
        conn.end();
    });
});
