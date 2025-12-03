const bcrypt = require('bcryptjs');
const { getPool } = require('../../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'token and password required' });
  const pool = await getPool();
  try {
    const [rows] = await pool.query('SELECT id, admin_id, expiresAt, used FROM admin_reset_tokens WHERE token = ?', [token]);
    if (!rows || rows.length === 0) return res.status(400).json({ error: 'Invalid token' });
    const t = rows[0];
    if (t.used) return res.status(400).json({ error: 'Token already used' });
    if (new Date(t.expiresAt) < new Date()) return res.status(400).json({ error: 'Token expired' });
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE admins SET password_hash = ? WHERE id = ?', [password_hash, t.admin_id]);
    await pool.query('UPDATE admin_reset_tokens SET used = 1 WHERE id = ?', [t.id]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('admin.reset error', e && (e.stack || e.message || e));
    return res.status(500).json({ error: 'server error' });
  }
};

module.exports.default = module.exports;
