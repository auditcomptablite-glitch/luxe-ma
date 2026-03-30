const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.MYSQLHOST     || 'localhost',
  port:     parseInt(process.env.MYSQLPORT || '3306'),
  user:     process.env.MYSQLUSER     || 'root',
  password: process.env.MYSQLPASSWORD || 'avfdbAbzmtqzwczOawUgsiWzuhTzQJey',
  database: process.env.MYSQLDATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connecté à Railway');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erreur connexion MySQL:', err.message);
  });

module.exports = pool;
