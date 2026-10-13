import { createHmac, timingSafeEqual } from 'node:crypto';

function secret() {
  const value = process.env.UNSUBSCRIBE_SIGNING_SECRET;
  if (!value || value.length < 32) throw new Error('UNSUBSCRIBE_NOT_CONFIGURED');
  return value;
}

export function makeUnsubscribeToken(email, ttlDays = 90) {
  const normalized = String(email).trim().toLowerCase();
  const payload = Buffer.from(JSON.stringify({ email: normalized, exp: Math.floor(Date.now() / 1000) + ttlDays * 86400 })).toString('base64url');
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return payload + '.' + signature;
}

export function parseUnsubscribeToken(token) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = createHmac('sha256', secret()).update(payload).digest();
  let supplied;
  try { supplied = Buffer.from(sig, 'base64url'); } catch { return null; }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof parsed.email !== 'string' || !/^\S+@\S+\.\S+$/.test(parsed.email)) return null;
    if (!Number.isSafeInteger(parsed.exp) || parsed.exp < Date.now() / 1000) return null;
    return parsed.email;
  } catch { return null; }
}
