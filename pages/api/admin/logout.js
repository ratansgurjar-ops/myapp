const { clearSessionCookie } = require('../../../lib/adminAuth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const cookie = clearSessionCookie();
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true });
};

module.exports.default = module.exports;
