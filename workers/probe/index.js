// F11 — the Cloudflare-native uptime probe (entry point and email transport).
//
// A separate Worker on its own 30-minute cron, deliberately NOT part of the
// Pages project and deliberately separate from the digest Worker: a monitoring
// failure must never be able to take down the booking path or the digest. Its
// D1 access is confined to the single uptime_state row (migrations/002) and
// nothing here is reachable over HTTP — there is no fetch handler and
// workers_dev is false.
//
// All logic lives in ./probe.js so it can be unit-tested outside workerd. This
// file is only the entry point and the email transport. The send path mirrors
// the digest Worker's: try raw MIME first, fall back to the object form, and
// never swallow the error.
import { EmailMessage } from 'cloudflare:email';
import { runProbe } from './probe.js';

async function sendEmail(env, { from, to, subject, body, raw }) {
  try {
    return await env.EMAIL.send(new EmailMessage(from, to, raw));
  } catch (rawErr) {
    try {
      const result = await env.EMAIL.send({ from, to, subject, text: body });
      console.log('probe: raw-MIME send rejected, object-form send succeeded');
      return result;
    } catch (objectErr) {
      console.error(`probe: object-form send also failed: ${objectErr?.stack || objectErr}`);
      throw rawErr;
    }
  }
}

export default {
  async scheduled(event, env, ctx) {
    await runProbe({
      env,
      send: (message) => sendEmail(env, message)
    });
  }
};
