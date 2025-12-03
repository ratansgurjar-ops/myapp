const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getPool } = require('../../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, securityAnswer, newPassword } = req.body || {};
  if (!email || !securityAnswer) return res.status(400).json({ error: 'email and securityAnswer required' });
  const pool = await getPool();
  try {
    const [rows] = await pool.query('SELECT id, secret_answer_hash FROM admins WHERE email = ?', [email]);
    if (!rows || rows.length === 0) return res.status(400).json({ error: 'No such account' });
    const admin = rows[0];
    const match = admin.secret_answer_hash ? await bcrypt.compare(String(securityAnswer), admin.secret_answer_hash) : false;
    if (!match) return res.status(401).json({ error: 'Incorrect security answer' });

    if (newPassword) {
      const password_hash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE admins SET password_hash = ? WHERE id = ?', [password_hash, admin.id]);
      return res.status(200).json({ ok: true, message: 'Password updated' });
    }

    // Generate a short-lived token and store it
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await pool.query('INSERT INTO admin_reset_tokens (admin_id, token, expiresAt) VALUES (?, ?, ?)', [admin.id, token, expiresAt]);
    return res.status(200).json({ ok: true, token });
  } catch (e) {
    console.error('admin.forgot error', e && (e.stack || e.message || e));
    return res.status(500).json({ error: 'server error' });
  }
};

module.exports.default = module.exports;
