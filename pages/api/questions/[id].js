const Question = require('../../../models/question');
const { verifyAdminSession } = require('../../../lib/adminAuth');

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'GET') {
    const item = await Question.findBySlug(id) || null;
    return res.json({ item });
  }
  // write operations require an authenticated admin session
  const admin = await verifyAdminSession(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'PATCH') {
    const data = req.body;
    // allow toggling active, editing fields
    const pool = (await require('../../../lib/db').getPool());
    const sets = [];
    const params = [];
    Object.keys(data).forEach(k => { sets.push(`${k} = ?`); params.push(data[k]); });
    if (sets.length === 0) return res.status(400).json({ error: 'no fields' });
    params.push(id);
    await pool.query(`UPDATE questions SET ${sets.join(',')} WHERE id = ?`, params);
    const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [id]);
    return res.json({ ok: true, item: rows[0] });
  }

  if (req.method === 'DELETE') {
    const pool = (await require('../../../lib/db').getPool());
    await pool.query('DELETE FROM questions WHERE id = ?', [id]);
    return res.json({ ok: true });
  }

  res.setHeader('Allow', ['GET','PATCH','DELETE']);
  res.status(405).end('Method Not Allowed');
};
