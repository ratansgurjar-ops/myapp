const bcrypt = require('bcryptjs');
const { getPool } = require('../../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password, secretAnswer } = req.body || {};
  if (!email || !password || !secretAnswer) return res.status(400).json({ error: 'email, password and secretAnswer required' });
  const pool = await getPool();
  try {
    const [rows] = await pool.query('SELECT id FROM admins WHERE email = ?', [email]);
    if (rows && rows.length > 0) return res.status(400).json({ error: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 10);
    const secret_answer_hash = await bcrypt.hash(String(secretAnswer), 10);
    await pool.query('INSERT INTO admins (email, password_hash, secret_answer_hash) VALUES (?, ?, ?)', [email, password_hash, secret_answer_hash]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('admin.register error', e && (e.stack || e.message || e));
    return res.status(500).json({ error: 'server error' });
  }
};

// Ensure Next.js (which expects an ES default export) can load this handler
module.exports.default = module.exports;
