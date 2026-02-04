const mysql=require('mysql');
const util=require('util');



const conn=mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})



const exe=util.promisify(conn.query).bind(conn);

module.exports=exe;