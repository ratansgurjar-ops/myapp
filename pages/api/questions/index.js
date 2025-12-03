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
    data.slug = data.slug || slugify(data.question_english, { lower: true, strict: true });
    // require admin session cookie
    const admin = await verifyAdminSession(req);
    if (!admin) return res.status(401).json({ error: 'unauthorized' });

    const item = await Question.createQuestion(data);
    res.json({ ok: true, item });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
};
