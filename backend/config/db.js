const mysql = require('mysql2/promise');

// En mode PM2 cluster, chaque worker a son propre pool.
// connectionLimit: 8 par worker × 8 workers = 64 connexions max vers MySQL.
// MySQL sur Railway (8GB RAM) supporte ~500 connexions simultanées sans problème.
// On garde 8 par worker pour rester conservateur et éviter de saturer MySQL.
const CONNECTIONS_PER_WORKER = 8;

const pool = mysql.createPool({
  host:     process.env.MYSQLHOST     || 'localhost',
  port:     parseInt(process.env.MYSQLPORT || '3306'),
  user:     process.env.MYSQLUSER     || 'root',
  password: process.env.MYSQLPASSWORD || 'avfdbAbzmtqzwczOawUgsiWzuhTzQJey',
  database: process.env.MYSQLDATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: CONNECTIONS_PER_WORKER,
  queueLimit: 100,          // file d'attente si toutes les connexions sont occupées
  connectTimeout: 10000,    // 10s timeout de connexion
  charset: 'utf8mb4',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    const workerId = process.env.pm_id || '0';
    console.log(`✅ MySQL connecté — Worker #${workerId}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erreur connexion MySQL:', err.message);
  });

module.exports = pool;
