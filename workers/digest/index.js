// F8 — daily per-chamber appointment digest (locked decision T11).
//
// A separate Worker on its own crons, deliberately NOT part of the Pages
// project: it must never be able to affect the booking path. Its D1 access is
// read-only by construction (one SELECT, in digest.js) and nothing here is
// reachable over HTTP -- there is no fetch handler.
//
// All logic lives in ./digest.js so it can be unit-tested outside workerd. This
// file is only the entry point and the email transport.
import { EmailMessage } from 'cloudflare:email';
import { runDigest } from './digest.js';

/**
 * Cloudflare has shipped two generations of the `send_email` binding: the
 * original Email Routing one takes an EmailMessage built from raw MIME, and the
 * newer Email Service one takes a plain object. Which is live depends on how
 * the zone was onboarded, and that is a human dashboard step this Worker cannot
 * inspect. So: try raw MIME first -- it is what HUMAN-TASKS Task 13 sets up --
 * and fall back to the object form, logging which path worked. Nothing is
 * swallowed: if both fail the original error is rethrown, and runDigest()
 * records a send failure.
 */
async function sendEmail(env, { from, to, subject, body, raw }) {
  try {
    return await env.EMAIL.send(new EmailMessage(from, to, raw));
  } catch (rawErr) {
    try {
      const result = await env.EMAIL.send({ from, to, subject, text: body });
      console.log('digest: raw-MIME send rejected, object-form send succeeded');
      return result;
    } catch (objectErr) {
      console.error(`digest: object-form send also failed: ${objectErr?.stack || objectErr}`);
      throw rawErr;
    }
  }
}

export default {
  async scheduled(event, env, ctx) {
    await runDigest({
      event,
      env,
      send: (message) => sendEmail(env, message)
    });
  }
};
