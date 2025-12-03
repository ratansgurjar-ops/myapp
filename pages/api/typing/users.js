const { getPool } = require('../../../lib/db');

export default async function handler(req, res) {
  try {
    const pool = await getPool();
    // list users from typing_users, ordered by lastSaved desc
    const [rows] = await pool.query('SELECT username, displayName, lastSaved, exerciseCount FROM typing_users ORDER BY lastSaved DESC');
    const items = (rows || []).map(r => ({ username: r.username, displayName: r.displayName || '', lastSaved: r.lastSaved ? new Date(r.lastSaved).toISOString() : '', count: r.exerciseCount || 0 }));
    return res.json({ items });
  } catch (e) {
    console.error('typing users error:', e && (e.stack || e.message || e));
    return res.status(500).json({ error: 'server error' });
  }
}
