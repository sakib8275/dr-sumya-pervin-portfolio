// Pure mailer handler logic. Testable in Node without workerd or network bindings.
import { buildMimeMessage } from '../lib/email.js';

export const ALLOWED_RECIPIENT = 'dr.enamtalha@gmail.com';

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function handleMailer(env, request) {
  if (request.method !== 'POST') {
    return { ok: false, status: 450, error: 'Method not allowed' }; // 405
  }

  const mailSecret = request.headers.get('X-Mail-Secret') || '';
  if (!env.MAIL_SECRET || !safeEqual(mailSecret, env.MAIL_SECRET)) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' };
  }

  const { to, subject, body: messageBody } = body || {};

  if (typeof to !== 'string' || to !== ALLOWED_RECIPIENT) {
    return { ok: false, status: 400, error: `Unauthorized recipient. Only ${ALLOWED_RECIPIENT} allowed.` };
  }

  if (typeof subject !== 'string' || !subject || typeof messageBody !== 'string' || !messageBody) {
    return { ok: false, status: 400, error: 'Subject and body are required' };
  }

  const from = env.MAIL_FROM || 'digest@drsumyapervin.com';
  const raw = buildMimeMessage({
    from,
    to,
    subject,
    body: messageBody
  });

  return {
    ok: true,
    from,
    to,
    subject,
    text: messageBody,
    raw
  };
}
