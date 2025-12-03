const { getPool } = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const { username, file } = req.body || {};
  if (!username || !file) return res.status(400).json({ error: 'username and file required' });
  if (!username.match(/^[-_a-zA-Z0-9]+$/)) return res.status(400).json({ error: 'invalid username' });
  try {
    const pool = await getPool();
    // assume `file` is the exercise id
    const id = String(file);
    const [rows] = await pool.query('SELECT id FROM typing_user_exercises WHERE id = ? AND username = ?', [id, username]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'file not found' });
    await pool.query('DELETE FROM typing_user_exercises WHERE id = ? AND username = ?', [id, username]);

    // recompute count and update typing_users
    const [countRows] = await pool.query('SELECT COUNT(*) as c FROM typing_user_exercises WHERE username = ?', [username]);
    const count = (countRows && countRows[0] && countRows[0].c) ? Number(countRows[0].c) : 0;
    await pool.query('UPDATE typing_users SET exerciseCount = ? WHERE username = ?', [count, username]);

    return res.json({ ok: true });
  } catch (e) {
    console.error('typing delete error:', e && (e.stack || e.message || e));
    return res.status(500).json({ error: 'server error' });
  }
}
