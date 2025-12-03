async function findNews({ q, page = 1, limit = 20, type, includeInactive = false }) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  const offset = (Math.max(1, page) - 1) * limit;
  const where = [];
  const params = [];
  // active filter only when not requesting inactive items
  if (!includeInactive) where.push('active = 1');
  if (q) { where.push('(title LIKE ? OR content LIKE ? OR tags LIKE ?)'); const qq = `%${q}%`; params.push(qq, qq, qq); }
  if (type && type !== 'all') { where.push('type = ?'); params.push(type); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [items] = await pool.query(`SELECT * FROM news ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const [countRow] = await pool.query(`SELECT COUNT(*) as total FROM news ${whereSql}`, params);
  return { items, total: countRow[0].total };
}

async function createNews(data) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  const fields = ['title','content','image','link','slug','tags','type','active'];
  const vals = fields.map((f) => (typeof data[f] !== 'undefined' ? data[f] : null));
  const placeholders = fields.map(() => '?').join(',');
  const [res] = await pool.query(`INSERT INTO news (${fields.join(',')}) VALUES (${placeholders})`, vals);
  const [rows] = await pool.query('SELECT * FROM news WHERE id = ?', [res.insertId]);
  return rows[0];
}

async function findBySlug(slug) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  const [rows] = await pool.query('SELECT * FROM news WHERE slug = ? LIMIT 1', [slug]);
  return rows[0] || null;
}

async function incrementHits(id) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  await pool.query('UPDATE news SET hits = hits + 1 WHERE id = ?', [id]);
}

module.exports = { findNews, createNews, findBySlug, incrementHits };
