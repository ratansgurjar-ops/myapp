const { getPool } = require('../../../lib/db');
const { verifyAdminSession } = require('../../../lib/adminAuth');

function parseIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return xf.split(',')[0].trim();
  return req.socket && (req.socket.remoteAddress || req.connection && req.connection.remoteAddress) || req.ip || '';
}

function isLocalIp(ip) {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === '::1') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') ) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  return false;
}

export default async function handler(req, res) {
  const pool = await getPool();
  if (req.method === 'POST') {
    const ip = parseIp(req);
    if (isLocalIp(ip)) return res.json({ ok: true, ignored: true });
    const { path, ua } = req.body || {};
    const pathVal = String(path || req.url || '').trim();
    // Do not count admin pages as visits
    if (pathVal.startsWith('/ad81188') || pathVal.startsWith('/ad81188/admin') || pathVal.startsWith('/admin')) {
      return res.json({ ok: true, ignored: true, reason: 'admin-path' });
    }
    await pool.query('INSERT INTO visits (ip, path, user_agent) VALUES (?, ?, ?)', [ip, pathVal, ua || req.headers['user-agent'] || '']);
    return res.json({ ok: true });
  }

  if (req.method === 'GET') {
    const admin = await verifyAdminSession(req);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });
    // Support query params: range=7days|month|year or from=YYYY-MM-DD&to=YYYY-MM-DD
    const { range, from, to, group } = req.query;
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM visits');
    const [recent] = await pool.query('SELECT COUNT(*) as last24 FROM visits WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 DAY)');

    // Provide quick breakdowns for homepage and typing tutor
    const [homeTotal] = await pool.query("SELECT COUNT(*) as c FROM visits WHERE path = '/' ");
    const [typingTotal] = await pool.query("SELECT COUNT(*) as c FROM visits WHERE path = '/typing-tutor' ");

    // If no range/from-to specified, return totals only
    if (!range && !from && !to) {
      return res.json({ total: rows[0].total, last24: recent[0].last24, homepage: (homeTotal[0] && homeTotal[0].c) || 0, typingTutor: (typingTotal[0] && typingTotal[0].c) || 0 });
    }

    // Determine from/to bounds
    let fromDate = null;
    let toDate = null;
    if (from) fromDate = new Date(from);
    if (to) toDate = new Date(to);
    if (!fromDate && range) {
      if (range === '7days') fromDate = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      else if (range === 'month') fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      else if (range === 'year') fromDate = new Date(new Date().getFullYear(), 0, 1);
    }
    if (!toDate) toDate = new Date();

    // Normalize toDate to end of day
    toDate.setHours(23,59,59,999);

    // Grouping: day/month/year
    let groupBy = 'day';
    if (group === 'month') groupBy = 'month';
    if (group === 'year') groupBy = 'year';

    // Build SQL for grouped counts
    let sql = '';
    if (groupBy === 'day') {
      sql = `SELECT DATE(createdAt) as dt, COUNT(*) as cnt FROM visits WHERE createdAt BETWEEN ? AND ? GROUP BY DATE(createdAt) ORDER BY DATE(createdAt) ASC`;
    } else if (groupBy === 'month') {
      sql = `SELECT DATE_FORMAT(createdAt, '%Y-%m-01') as dt, COUNT(*) as cnt FROM visits WHERE createdAt BETWEEN ? AND ? GROUP BY DATE_FORMAT(createdAt, '%Y-%m') ORDER BY DATE_FORMAT(createdAt, '%Y-%m') ASC`;
    } else {
      sql = `SELECT DATE_FORMAT(createdAt, '%Y-01-01') as dt, COUNT(*) as cnt FROM visits WHERE createdAt BETWEEN ? AND ? GROUP BY DATE_FORMAT(createdAt, '%Y') ORDER BY DATE_FORMAT(createdAt, '%Y') ASC`;
    }

    const [items] = await pool.query(sql, [fromDate.toISOString().slice(0,19).replace('T',' '), toDate.toISOString().slice(0,19).replace('T',' ')]);
    // counts for the specified range
    const [homeRange] = await pool.query("SELECT COUNT(*) as c FROM visits WHERE path = '/' AND createdAt BETWEEN ? AND ?", [fromDate.toISOString().slice(0,19).replace('T',' '), toDate.toISOString().slice(0,19).replace('T',' ')]);
    const [typingRange] = await pool.query("SELECT COUNT(*) as c FROM visits WHERE path = '/typing-tutor' AND createdAt BETWEEN ? AND ?", [fromDate.toISOString().slice(0,19).replace('T',' '), toDate.toISOString().slice(0,19).replace('T',' ')]);
    return res.json({ total: rows[0].total, last24: recent[0].last24, items, homepage: (homeRange[0] && homeRange[0].c) || 0, typingTutor: (typingRange[0] && typingRange[0].c) || 0 });
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end();
}
