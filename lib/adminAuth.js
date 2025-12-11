const crypto = require('crypto');

// Cookie name and secret (use env vars in production)
const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SECRET || 'dev-admin-secret-please-change';
const SESSION_MAX_AGE_SECONDS = parseInt(process.env.ADMIN_SESSION_MAX_AGE || String(7 * 24 * 3600), 10);

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function unbase64url(input) {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad === 2) s += '=='; else if (pad === 3) s += '='; else if (pad === 1) s += '===';
  return Buffer.from(s, 'base64').toString('utf8');
}

function sign(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

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

function createSessionCookieForAdmin(admin) {
  const payload = { id: admin.id, email: admin.email, iat: Date.now(), exp: Date.now() + (SESSION_MAX_AGE_SECONDS * 1000) };
  const json = JSON.stringify(payload);
  const b = base64url(json);
  const sig = sign(b);
  const token = `${b}.${sig}`;
  const secure = (process.env.NODE_ENV === 'production');
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure ? '; Secure' : ''}`;
}

function clearSessionCookie() {
  const secure = (process.env.NODE_ENV === 'production');
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure ? '; Secure' : ''}`;
}

async function verifyAdminSession(req) {
  try {
    const cookies = parseCookies(req || {});
    const token = cookies[COOKIE_NAME];
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b, sig] = parts;
    const expected = sign(b);
    try {
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    } catch (e) {
      return null;
    }
    const json = unbase64url(b);
    const obj = JSON.parse(json);
    if (!obj || !obj.exp || Date.now() > obj.exp) return null;
    return { id: obj.id, email: obj.email };
  } catch (e) {
    return null;
  }
}

module.exports = { verifyAdminSession, createSessionCookieForAdmin, clearSessionCookie };
