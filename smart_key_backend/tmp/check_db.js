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
    console.log('Connected to database');

    const queries = [
        "SELECT id, name, role_id FROM users",
        "SELECT id, name FROM organizations",
        "SELECT id, org_id, owner_id, unit_name FROM units",
        "SELECT id, unit_id, key_code, status FROM keyss"
    ];

    let results = {};

    const runQuery = (index) => {
        if (index >= queries.length) {
            console.log(JSON.stringify(results, null, 2));
            conn.end();
            return;
        }
        conn.query(queries[index], (err, rows) => {
            if (err) {
                console.error('Query error:', err);
            } else {
                results[queries[index]] = rows;
            }
            runQuery(index + 1);
        });
    };

    runQuery(0);
});
