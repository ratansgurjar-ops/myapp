const Question = require('../../../models/question');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const result = await Question.flagQuestion(id);
    res.json({ ok: true, flags_count: result.flags_count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Ensure Next.js can load this CommonJS handler as a default export
module.exports.default = module.exports;
