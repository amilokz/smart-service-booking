const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,  // Changed from DB_PASSWORD to DB_PASS
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

connection.connect(err => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.log('⚠️  Starting with mock authentication...');
    } else {
        console.log('✅ Connected to MySQL database:', process.env.DB_NAME);
    }
});

// Handle connection errors
connection.on('error', (err) => {
    console.error('MySQL connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Connection lost. Attempting to reconnect...');
    }
});

module.exports = connection;