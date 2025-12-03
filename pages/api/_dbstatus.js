const { getPool } = require('../../lib/db');

module.exports = async function handler(req, res) {
  try {
    const pool = await getPool();
    const [r] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: { host: process.env.DB_HOST || null, user: process.env.DB_USER || null, database: process.env.DB_NAME || null }, ping: r });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

  // Ensure Next.js can load this CommonJS handler as a default export
  module.exports.default = module.exports;
