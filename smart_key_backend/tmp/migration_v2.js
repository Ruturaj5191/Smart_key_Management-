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

    const alterations = [
        "ALTER TABLE key_setup_requests ADD COLUMN created_key_id BIGINT NULL AFTER approved_by",
        "ALTER TABLE setup_requests ADD COLUMN key_code VARCHAR(100) AFTER unit_name",
        "ALTER TABLE setup_requests ADD COLUMN key_type VARCHAR(20) AFTER key_code",
        "ALTER TABLE setup_requests ADD COLUMN locker_no VARCHAR(50) AFTER key_type",
        `CREATE TABLE IF NOT EXISTS facility_requests (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            unit_id BIGINT NOT NULL,
            request_type VARCHAR(50) NOT NULL,
            description TEXT,
            status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (unit_id) REFERENCES units(id)
        )`
    ];

    let current = 0;
    const runNext = () => {
        if (current >= alterations.length) {
            console.log('All migrations completed successfully');
            conn.end();
            return;
        }

        console.log(`Running: ${alterations[current]}`);
        conn.query(alterations[current], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_COLUMN_NAME') {
                    console.log(`Column already exists, skipping...`);
                } else {
                    console.error('Migration error:', err);
                    conn.end();
                    return;
                }
            }
            current++;
            runNext();
        });
    };

    runNext();
});
