const { getPool } = require('../../../lib/db')
const { verifyAdminSession } = require('../../../lib/adminAuth');

export default async function handler(req, res) {
  const method = req.method;
  const pool = await getPool();

  if (method === 'GET') {
    const { question_id, q, unresolved, from, to, page = 1, limit = 200 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    if (question_id) {
      const [rows] = await pool.query('SELECT * FROM feedbacks WHERE question_id = ? ORDER BY createdAt DESC', [question_id]);
      return res.json({ items: rows });
    }

    // admin-only listing with filters
    const admin = await verifyAdminSession(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });

    const where = [];
    const params = [];
    if (q) { where.push('content LIKE ?'); params.push('%' + q + '%'); }
    if (unresolved === '1' || unresolved === 'true') { where.push('resolved = 0'); }
    if (from) { where.push('createdAt >= ?'); params.push(from); }
    if (to) { where.push('createdAt <= ?'); params.push(to); }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await pool.query(`SELECT * FROM feedbacks ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    const [countRow] = await pool.query(`SELECT COUNT(*) as total FROM feedbacks ${whereSql}`, params);
    return res.json({ items: rows, total: countRow[0].total });
  }

  if (method === 'DELETE') {
    const admin = await verifyAdminSession(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });
    await pool.query('DELETE FROM feedbacks WHERE id = ?', [id]);
    return res.json({ ok: true });
  }

  res.setHeader('Allow', 'GET,DELETE');
  res.status(405).end();
}
