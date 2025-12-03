const slugify = require('slugify');
const Question = require('../../../models/question');
const { verifyAdminSession } = require('../../../lib/adminAuth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const items = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'expected array of questions' });

  const prepared = items.map((it) => ({
    ...it,
    slug: it.slug || slugify(it.question_english || (it.question_hindi || '').slice(0, 50), { lower: true, strict: true })
  }));

  // require admin session cookie
  const admin = await verifyAdminSession(req);
  if (!admin) return res.status(401).json({ error: 'unauthorized' });

  const result = await Question.bulkInsert(prepared);
  res.json(result);
};

// Next.js (and some bundlers) expect a default export for API routes.
// Add a default alias for compatibility when using CommonJS `module.exports`.
module.exports.default = module.exports;

// Allow larger payloads for bulk uploads (increase body parser size limit)
// Using a high limit because CSV can be large; adjust as needed in production.
exports.config = { api: { bodyParser: { sizeLimit: '50mb' } } };
