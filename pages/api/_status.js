const { getPool } = require('../../lib/db');

module.exports = async function handler(req, res) {
  try {
    const pool = await getPool();
    // simple check
    const [rows] = await pool.query('SELECT 1 as ok');
    return res.json({ ok: true, db: !!rows });
  } catch (e) {
    console.error('/api/_status error', e && (e.stack || e.message || e));
    return res.status(500).json({ ok: false, error: 'DB unavailable', details: (e && e.message) ? e.message : String(e) });
  }
};

  // Ensure Next.js can load this CommonJS handler as a default export
  module.exports.default = module.exports;
