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
    const queries = [
        "SELECT * FROM roles",
        "SELECT * FROM units",
        "SELECT * FROM users",
        "SELECT * FROM organizations"
    ];

    let results = {};
    const runQuery = (i) => {
      if(i >= queries.length) {
        console.log(JSON.stringify(results, null, 2));
        conn.end();
        return;
      }
      conn.query(queries[i], (err, rows) => {
        results[queries[i]] = rows;
        runQuery(i+1);
      });
    }
    runQuery(0);
});
