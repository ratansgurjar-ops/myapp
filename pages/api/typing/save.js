const { getPool } = require('../../../lib/db');

// Increase the built-in Next.js body parser limit so ~1MB+ payloads are accepted
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb'
    }
  }
};

// Save a new practice for a user into MySQL tables `typing_user_exercises` and `typing_users`.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const { username, text, title, displayName } = req.body || {};
  if (!username || !username.match(/^[-_a-zA-Z0-9]+$/)) return res.status(400).json({ error: 'invalid username' });
  try {
    const pool = await getPool();
    const now = new Date();
    const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
    // MySQL DATETIME expects 'YYYY-MM-DD HH:MM:SS' (no timezone Z)
    const createdAt = now.toISOString().slice(0,19).replace('T', ' ');
    // insert exercise
    await pool.query('INSERT INTO typing_user_exercises (id, username, title, text, createdAt) VALUES (?, ?, ?, ?, ?)', [id, username, title || '', text || '', createdAt]);

    // upsert user metadata: set lastSaved and update exerciseCount
    const [countRows] = await pool.query('SELECT COUNT(*) as c FROM typing_user_exercises WHERE username = ?', [username]);
    const count = (countRows && countRows[0] && countRows[0].c) ? Number(countRows[0].c) : 0;
    // ensure max 2 exercises per user by deleting oldest if needed
    if (count > 2) {
      const toRemove = count - 2;
      const [oldRows] = await pool.query('SELECT id FROM typing_user_exercises WHERE username = ? ORDER BY createdAt ASC LIMIT ?', [username, toRemove]);
      const ids = oldRows.map(r => r.id).filter(Boolean);
      if (ids.length) {
        await pool.query(`DELETE FROM typing_user_exercises WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
      }
    }

    // recompute count after possible deletion
    const [countRows2] = await pool.query('SELECT COUNT(*) as c FROM typing_user_exercises WHERE username = ?', [username]);
    const finalCount = (countRows2 && countRows2[0] && countRows2[0].c) ? Number(countRows2[0].c) : 0;

    // upsert typing_users
    await pool.query(`INSERT INTO typing_users (username, displayName, lastSaved, exerciseCount) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE displayName = VALUES(displayName), lastSaved = VALUES(lastSaved), exerciseCount = VALUES(exerciseCount)
    `, [username, displayName || '', createdAt, finalCount]);

    return res.json({ ok: true, id });
  } catch (e) {
    console.error('typing save error:', e && (e.stack || e.message || e));
    return res.status(500).json({ error: 'server error' });
  }
}
