const slugify = require('slugify');
const Question = require('../../../models/question');
const { verifyAdminSession } = require('../../../lib/adminAuth');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { q, category, chapter, page = 1, limit = 15, random = '0', offset } = req.query;
    const randomFlag = (random === '1' || random === 'true');
    const opts = { q, category, chapter, page: parseInt(page), limit: parseInt(limit), random: randomFlag };
    if (typeof offset !== 'undefined') opts.offset = parseInt(offset);
    const data = await Question.findQuestions(opts);
    res.json({ items: data.items, total: data.total });
    return;
  }

  if (req.method === 'POST') {
    const data = req.body;
    if (!data.question_english) return res.status(400).json({ error: 'question_english required' });
    // ensure a unique slug: if the generated slug already exists, append a short suffix
    const baseSlug = data.slug || slugify(data.question_english, { lower: true, strict: true });
    let finalSlug = baseSlug;
    try {
      let counter = 0;
      // check existing and append counter until unique (prevent race by limited attempts)
      while (counter < 10) {
        // require admin session cookie early to allow findBySlug checks to use DB credentials
        const existing = await Question.findBySlug(finalSlug);
        if (!existing) break;
        counter += 1;
        finalSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}-${counter}`;
      }
    } catch (e) {
      // ignore and fallback to baseSlug
      finalSlug = baseSlug;
    }
    data.slug = finalSlug;
    // require admin session cookie
    const admin = await verifyAdminSession(req);
    if (!admin) return res.status(401).json({ error: 'unauthorized' });
    try {
      const item = await Question.createQuestion(data);
      res.json({ ok: true, item });
      return;
    } catch (e) {
      // return DB error message to admin to help debugging (sanitized)
      console.error('question create error:', e && (e.stack || e.message || e));
      return res.status(500).json({ error: e && e.message ? e.message : 'database error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
};
