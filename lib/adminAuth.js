const crypto = require('crypto');

const SECRET = process.env.ADMIN_SECRET || 'dev-admin-secret-please-change';
const SESSION_MAX_AGE_SECONDS = parseInt(process.env.ADMIN_SESSION_MAX_AGE || String(7 * 24 * 3600), 10);

function parseCookies(req) {
  const hdr = req && req.headers ? (req.headers.cookie || '') : '';
  const parts = hdr.split(';').map(p => p.trim()).filter(Boolean);
  const out = {};
  for (const p of parts) {
    const eq = p.indexOf('=');
    if (eq === -1) continue;
    const k = p.slice(0, eq).trim();
    const v = p.slice(eq + 1);
    out[k] = v;
  }
  return out;
}

function sign(base) {
  return crypto.createHmac('sha256', SECRET).update(base).digest('hex');
}

function createToken(admin) {
  const payload = { id: admin.id, email: admin.email, iat: Date.now() };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expected = sign(b64);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch (e) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString());
    return payload;
  } catch (e) {
    return null;
  }
}

async function verifyAdminSession(req) {
  const cookies = parseCookies(req || {});
  const token = cookies['admin_session'];
  const payload = verifyToken(token);
  if (!payload) return null;
  // Basic expiry: we don't encode expiry in token but rely on max-age of cookie.
  return { id: payload.id, email: payload.email };
}

function createSessionCookieForAdmin(admin) {
  const token = createToken(admin || { id: 1, email: (admin && admin.email) || 'admin' });
  const secure = (process.env.NODE_ENV === 'production') ? 'Secure; ' : '';
  const cookie = `admin_session=${token}; Path=/; HttpOnly; SameSite=Strict; ${secure}Max-Age=${SESSION_MAX_AGE_SECONDS}`;
  return cookie;
}

function clearSessionCookie() {
  return 'admin_session=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
}

module.exports = { verifyAdminSession, createSessionCookieForAdmin, clearSessionCookie };
