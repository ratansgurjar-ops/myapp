const { getPool } = require('../../../lib/db');
const { verifyAdminSession } = require('../../../lib/adminAuth');

export default async function handler(req, res) {
  const { id } = req.query;
  const pool = await getPool();

  if (!id) return res.status(400).json({ error: 'id required' });

  if (req.method === 'PATCH') {
    const admin = await verifyAdminSession(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body || {};
    const fields = [];
    const params = [];
    if (typeof body.resolved !== 'undefined') {
      fields.push('resolved = ?'); params.push(body.resolved ? 1 : 0);
      if (body.resolved) {
        // set resolved_by and resolvedAt; prefer supplied resolvedBy (friendly name)
        if (body.resolvedBy) {
          fields.push('resolved_by = ?'); params.push(body.resolvedBy);
        } else {
          fields.push('resolved_by = NULL');
        }
        fields.push('resolvedAt = CURRENT_TIMESTAMP');
      } else {
        fields.push('resolved_by = NULL');
        fields.push('resolvedAt = NULL');
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'nothing to update' });
    const sql = `UPDATE feedbacks SET ${fields.join(', ')} WHERE id = ?`;
    await pool.query(sql, [...params, id]);
    const [rows] = await pool.query('SELECT * FROM feedbacks WHERE id = ?', [id]);
    return res.json({ item: rows[0] });
  }

  if (req.method === 'DELETE') {
    const admin = await verifyAdminSession(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });
    await pool.query('DELETE FROM feedbacks WHERE id = ?', [id]);
    return res.json({ ok: true });
  }

  res.setHeader('Allow', 'PATCH,DELETE');
  res.status(405).end();
}
