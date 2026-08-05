// Cloudflare Worker entry point for dr-sumya-mailer service binding.
import { EmailMessage } from 'cloudflare:email';
import { handleMailer } from './mailer.js';

export default {
  async fetch(request, env) {
    const res = await handleMailer(env, request);

    if (!res.ok) {
      return Response.json(
        { ok: false, error: res.error },
        { status: res.status === 450 ? 405 : res.status }
      );
    }

    try {
      await env.EMAIL.send(new EmailMessage(res.from, res.to, res.raw));
    } catch (err) {
      try {
        // Fallback to simple object form supported by some workerd runtimes
        await env.EMAIL.send({
          from: res.from,
          to: res.to,
          subject: res.subject,
          text: res.text
        });
      } catch (fallbackErr) {
        return Response.json(
          { ok: false, error: fallbackErr.message || err.message },
          { status: 500 }
        );
      }
    }

    return Response.json({ ok: true, message: 'Email dispatched' });
  }
};
