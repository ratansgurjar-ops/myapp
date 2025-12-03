async function findQuestions({ q, category, chapter, page = 1, limit = 15, random = false, offset = null }) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  const offsetVal = (offset !== null && offset !== undefined) ? parseInt(offset) : ((Math.max(1, page) - 1) * limit);
  const where = [];
  const params = [];
  // only active questions by default
  where.push('active = 1');
  if (q) {
    where.push('(question_english LIKE ? OR question_hindi LIKE ? OR chapter_name LIKE ? OR category LIKE ? OR options_1_english LIKE ? OR options_2_english LIKE ? OR options_3_english LIKE ? OR options_4_english LIKE ? OR options_1_hindi LIKE ? OR options_2_hindi LIKE ? OR options_3_hindi LIKE ? OR options_4_hindi LIKE ? OR solution LIKE ?)');
    const qq = `%${q}%`;
    params.push(qq, qq, qq, qq, qq, qq, qq, qq, qq, qq, qq, qq, qq);
  }
  if (category) { where.push('category = ?'); params.push(category); }
  if (chapter) { where.push('chapter_name = ?'); params.push(chapter); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  // if random is requested, use ORDER BY RAND() to return random rows
  const orderSql = random ? 'ORDER BY RAND()' : 'ORDER BY createdAt DESC';
  const [items] = await pool.query(`SELECT * FROM questions ${whereSql} ${orderSql} LIMIT ? OFFSET ?`, [...params, limit, offsetVal]);
  const [countRow] = await pool.query(`SELECT COUNT(*) as total FROM questions ${whereSql}`, params);
  return { items, total: countRow[0].total };
}

async function flagQuestion(id) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  await pool.query('UPDATE questions SET flags_count = flags_count + 1 WHERE id = ?', [id]);
  const [rows] = await pool.query('SELECT flags_count FROM questions WHERE id = ?', [id]);
  return rows[0];
}

async function addFeedback(question_id, content) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  await pool.query('INSERT INTO feedbacks (question_id, content) VALUES (?, ?)', [question_id, content]);
  await pool.query('UPDATE questions SET feedback_count = feedback_count + 1 WHERE id = ?', [question_id]);
  return { ok: true };
}

async function createQuestion(data) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  const fields = ['question_english','question_hindi','options_1_english','options_2_english','options_3_english','options_4_english','options_1_hindi','options_2_hindi','options_3_hindi','options_4_hindi','answer','category','chapter_name','solution','slug'];
  const vals = fields.map((f) => data[f] || null);
  const placeholders = fields.map(() => '?').join(',');
  const [res] = await pool.query(`INSERT INTO questions (${fields.join(',')}) VALUES (${placeholders})`, vals);
  const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [res.insertId]);
  return rows[0];
}

async function bulkInsert(items) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  const fields = ['question_english','question_hindi','options_1_english','options_2_english','options_3_english','options_4_english','options_1_hindi','options_2_hindi','options_3_hindi','options_4_hindi','answer','category','chapter_name','solution','slug'];
  if (!Array.isArray(items) || items.length === 0) return { ok: true, inserted: 0 };

  // Insert in chunks to avoid creating an enormous single SQL statement
  // and to work around MySQL `max_allowed_packet` limits.
  const chunkSize = 200; // adjust if needed
  let inserted = 0;
  try {
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const values = chunk.map((it) => fields.map((f) => it[f] || null));
      const placeholders = values.map(() => '(' + fields.map(() => '?').join(',') + ')').join(',');
      const flat = values.flat();
      // Use INSERT IGNORE to skip rows that would violate UNIQUE constraints (e.g. duplicate slug)
      const [result] = await pool.query(`INSERT IGNORE INTO questions (${fields.join(',')}) VALUES ${placeholders}`, flat);
      // result.affectedRows gives number of rows actually inserted
      inserted += (result && result.affectedRows) ? result.affectedRows : 0;
    }
    return { ok: true, inserted };
  } catch (e) {
    return { error: e && e.message ? e.message : String(e), inserted };
  }
}

async function findBySlug(slug) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  const [rows] = await pool.query('SELECT * FROM questions WHERE slug = ? LIMIT 1', [slug]);
  return rows[0] || null;
}

async function incrementHits(id) {
  const { getPool } = require('../lib/db');
  const pool = await getPool();
  await pool.query('UPDATE questions SET hits = hits + 1 WHERE id = ?', [id]);
}

module.exports = { findQuestions, createQuestion, bulkInsert, findBySlug, incrementHits, flagQuestion, addFeedback };
