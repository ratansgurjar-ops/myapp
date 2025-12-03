const Question = require('../../../models/question');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const { id, content } = req.body;
  if (!id || !content) return res.status(400).json({ error: 'id and content required' });
  try {
    await Question.addFeedback(id, content);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Ensure Next.js can load this CommonJS handler as a default export
module.exports.default = module.exports;
