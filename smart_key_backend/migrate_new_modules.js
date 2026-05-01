require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "smart_key_db",
      multipleStatements: true,
    });

    console.log("Connected to DB");

    const sqlPath = path.join(__dirname, "src", "database", "new_modules_schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Executing SQL...");
    await connection.query(sql);

    console.log("Successfully created new tables!");
    process.exit(0);
  } catch (err) {
    console.error("Error executing schema:", err);
    process.exit(1);
  }
}

run();
