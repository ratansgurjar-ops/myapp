const { getPool } = require('../../../lib/db');

// GET behaviours:
// - ?username=foo&list=1  -> list saved exercises for user (id,title,savedAt,displayName)
// - ?username=foo&file=<id> -> return specific exercise by id
export default async function handler(req, res) {
  const username = String(req.query.username || '').trim();
  if (!username) return res.status(400).json({ error: 'username required' });
  try {
    const pool = await getPool();
    if (req.query.list) {
      const [rows] = await pool.query('SELECT id, title, createdAt FROM typing_user_exercises WHERE username = ? ORDER BY createdAt DESC', [username]);
      // fetch displayName from typing_users if present
      const [userRows] = await pool.query('SELECT displayName FROM typing_users WHERE username = ?', [username]);
      const displayName = (userRows && userRows[0]) ? (userRows[0].displayName || '') : '';
      const items = (rows || []).map(r => ({ id: r.id, title: r.title || '', savedAt: r.createdAt ? new Date(r.createdAt).toISOString() : '', displayName }));
      return res.json({ items });
    }

    if (req.query.file) {
      const id = String(req.query.file);
      const [rows] = await pool.query('SELECT id, username, title, text, createdAt FROM typing_user_exercises WHERE id = ? AND username = ?', [id, username]);
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'not found' });
      const r = rows[0];
      return res.json({ id: r.id, username: r.username, title: r.title || '', text: r.text || '', savedAt: r.createdAt ? new Date(r.createdAt).toISOString() : '' });
    }

    return res.status(400).json({ error: 'invalid request' });
  } catch (e) {
    console.error('typing get error:', e && (e.stack || e.message || e));
    return res.status(500).json({ error: 'server error' });
  }
}
