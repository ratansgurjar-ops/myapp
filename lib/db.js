const mysql = require('mysql2/promise');
const path = require('path');

// Load .env.local when present so scripts and dev server pick up credentials
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
} catch (e) {
  // ignore if dotenv is not installed or file not present
}

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'study_gk';

let pool;

async function getPool() {
  if (pool) return pool;
  // Try to create pool with the configured database. If the database does not exist,
  // attempt to create it (requires the DB user to have CREATE DATABASE privileges).
  try {
    pool = mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, waitForConnections: true, connectionLimit: 10 });
    // quick connectivity check
    await pool.query('SELECT 1');
  } catch (firstErr) {
    // If the error indicates the database is missing, try to create it and retry
    const msg = (firstErr && (firstErr.message || '')).toString().toLowerCase();
    if (msg.includes('unknown database') || msg.includes("er_bad_db_error") || msg.includes('database') && msg.includes('doesn\'t exist')) {
      try {
        const adminConn = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASS, multipleStatements: true });
        await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await adminConn.end();
        // recreate pool
        pool = mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, waitForConnections: true, connectionLimit: 10 });
        await pool.query('SELECT 1');
      } catch (createErr) {
        console.error('Could not create database', createErr && (createErr.stack || createErr.message || createErr));
        throw createErr;
      }
    }
    // otherwise rethrow the original error
    throw firstErr;
  }
  // create tables if not exist
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

  // Ensure additional columns exist for flags, feedback and active state
  // helper to add column if missing (safe across MySQL versions)
  async function ensureColumn(table, column, definition) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [DB_NAME, table, column]
    );
    if (rows[0].c === 0) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  try {
    await ensureColumn('questions', 'active', "TINYINT(1) DEFAULT 1");
    await ensureColumn('questions', 'flags_count', "INT DEFAULT 0");
    await ensureColumn('questions', 'feedback_count', "INT DEFAULT 0");
  } catch (e) {
    // ignore non-critical errors
    console.warn('Could not ensure question columns:', e.message || e);
  }

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

  // Ensure news has type and active
  try {
    await ensureColumn('news', 'type', "VARCHAR(32) DEFAULT 'news'");
    await ensureColumn('news', 'active', "TINYINT(1) DEFAULT 1");
  } catch (e) {
    console.warn('Could not ensure news columns:', e.message || e);
  }

  // Feedback table to store user feedbacks per question
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      content TEXT,
      resolved TINYINT(1) DEFAULT 0,
      resolved_by VARCHAR(255) DEFAULT NULL,
      resolvedAt DATETIME DEFAULT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  try {
    await ensureColumn('feedbacks', 'resolved', "TINYINT(1) DEFAULT 0");
    await ensureColumn('feedbacks', 'resolved_by', "VARCHAR(255) DEFAULT NULL");
    await ensureColumn('feedbacks', 'resolvedAt', "DATETIME DEFAULT NULL");
  } catch (e) {
    console.warn('Could not ensure feedbacks.resolved column:', e.message || e);
  }

  // Visits table for counting site visits
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(64),
        path VARCHAR(255),
        user_agent VARCHAR(512),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
  } catch (e) {
    console.warn('Could not ensure visits table:', e.message || e);
  }

  // Admins table for storing admin users (email, password hash, secret question answer)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        secret_question VARCHAR(255) DEFAULT 'first_school_name',
        secret_answer_hash VARCHAR(255) DEFAULT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
  } catch (e) {
    console.warn('Could not ensure admins table:', e.message || e);
  }

  // Table to store password reset tokens (short lived)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expiresAt DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  } catch (e) {
    console.warn('Could not ensure admin_reset_tokens table:', e.message || e);
  }

  return pool;
}

module.exports = { getPool };

// Debugging helper: log DB configuration presence (without printing password)
try {
  // Slight delay to avoid noisy logs during tests; this runs when module is imported
  setTimeout(() => {
    console.log('DB loader: host=' + (process.env.DB_HOST || 'localhost') + ', user=' + (process.env.DB_USER || 'root') + ', hasPassword=' + (!!process.env.DB_PASS) + ', database=' + (process.env.DB_NAME || 'study_gk'));
  }, 100);
} catch (e) {
  // ignore
}
