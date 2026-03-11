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
    conn.query('SELECT * FROM organizations', (err, rows) => {
        if (err) {
            console.error('Query error:', err);
        } else {
            console.log(JSON.stringify(rows, null, 2));
        }
        conn.end();
    });
});
