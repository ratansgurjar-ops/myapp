const mysql = require('mysql2/promise');
const path = require('path');

// Load .env.local when present so scripts and dev server pick up credentials
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
} catch (e) {}

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'study_gk';

// Reuse pool across HMR reloads
let pool = (global.__mysqlPool);

async function getPool() {
  if (pool) return pool;
  try {
    pool = mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, waitForConnections: true, connectionLimit: 10 });
    try { global.__mysqlPool = pool; } catch (e) {}
    await pool.query('SELECT 1');
  } catch (firstErr) {
    const msg = (firstErr && (firstErr.message || '')).toString().toLowerCase();
    if (msg.includes('unknown database') || msg.includes("er_bad_db_error") || (msg.includes('database') && msg.includes("doesn't exist"))) {
      try {
        const adminConn = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASS, multipleStatements: true });
        await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await adminConn.end();
        pool = mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, waitForConnections: true, connectionLimit: 10 });
        try { global.__mysqlPool = pool; } catch (e) {}
        await pool.query('SELECT 1');
      } catch (createErr) {
        console.error('Could not create database', createErr && (createErr.stack || createErr.message || createErr));
        throw createErr;
      }
    }
    throw firstErr;
  }

  // Create minimal tables if missing (safe noop)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_english TEXT,
      question_hindi TEXT,
      options_1_english TEXT,
      options_2_english TEXT,
      options_3_english TEXT,
      options_4_english TEXT,
      options_1_hindi TEXT,
      options_2_hindi TEXT,
      options_3_hindi TEXT,
      options_4_hindi TEXT,
      answer TEXT,
      category VARCHAR(128),
      chapter_name VARCHAR(128),
      solution TEXT,
      slug VARCHAR(255),
      hits INT DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_slug (slug)
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS news (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      content TEXT,
      image VARCHAR(512),
      link VARCHAR(512),
      slug VARCHAR(255),
      tags TEXT,
      hits INT DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_slug_news (slug)
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      content TEXT,
      resolved TINYINT(1) DEFAULT 0,
      resolved_by VARCHAR(255) DEFAULT NULL,
      resolvedAt DATETIME DEFAULT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  return pool;
}

module.exports = { getPool };

// Debug log
try {
  setTimeout(() => {
    console.log('DB loader: host=' + (process.env.DB_HOST || 'localhost') + ', user=' + (process.env.DB_USER || 'root') + ', hasPassword=' + (!!process.env.DB_PASS) + ', database=' + (process.env.DB_NAME || 'study_gk'));
  }, 100);
} catch (e) {}
