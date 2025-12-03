const bcrypt = require('bcryptjs');
const { createSessionCookieForAdmin } = require('../../../lib/adminAuth');
const { getPool } = require('../../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const email = String(body.email || '').trim();
  const password = String(body.password || '');

  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  // Try DB-backed admin first
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT id, email, password_hash FROM admins WHERE email = ?', [email]);
    if (rows && rows.length > 0) {
      const a = rows[0];
      const match = await bcrypt.compare(password, a.password_hash);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
      const cookie = createSessionCookieForAdmin({ id: a.id, email: a.email });
      res.setHeader('Set-Cookie', cookie);
      return res.status(200).json({ ok: true });
    }
  } catch (e) {
    console.warn('admin.login DB check failed', e && (e.message || e));
  }

  // Fallback to env-based admin for quick setups
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@local';
  const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

  let ok = false;
  if (ADMIN_PASSWORD_HASH) {
    try {
      ok = (email === ADMIN_EMAIL) && await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } catch (e) {
      ok = false;
    }
  } else {
    // fallback: plain password env or default 'admin'
    const fallback = process.env.ADMIN_PASSWORD || 'admin';
    ok = (email === ADMIN_EMAIL) && password === fallback;
  }

  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const cookie = createSessionCookieForAdmin({ id: 1, email: ADMIN_EMAIL });
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true });
};

module.exports.default = module.exports;
