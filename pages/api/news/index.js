const slugify = require('slugify');
const News = require('../../../models/news');
const { verifyAdminSession } = require('../../../lib/adminAuth');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { q, page = 1, limit = 50, type } = req.query;
    // allow admins to fetch inactive items when authenticated via session cookie
    const admin = await verifyAdminSession(req);
    const includeInactive = !!admin;
    const data = await News.findNews({ q, page: parseInt(page), limit: parseInt(limit), type, includeInactive });
    res.json({ items: data.items, total: data.total });
    return;
  }

  if (req.method === 'POST') {
    const data = req.body;
    if (!data.title) return res.status(400).json({ error: 'title required' });
    data.slug = data.slug || slugify(data.title, { lower: true, strict: true });
    // require admin session cookie
    const admin = await verifyAdminSession(req);
    if (!admin) return res.status(401).json({ error: 'unauthorized' });

    // ensure type is set (news or ad)
    data.type = data.type || 'news';
    const item = await News.createNews(data);
    res.json({ ok: true, item });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
};
