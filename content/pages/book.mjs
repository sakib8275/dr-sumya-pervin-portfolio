// /book/ — Phase 2 booking form (docx §5.40). Bespoke body because it carries
// the working form; public/js/site.js handles Turnstile + submit (CSP-safe, no
// inline handlers). Posts to the same /api/appointments the one-pager uses.
import { href, SITE } from '../site.mjs';

const TIERS = [
  ['Specialist Consultation', '৳2,000', '20–25 min · examination, dermoscopy, written plan'],
  ['Comprehensive Assessment', '৳3,500', '40 min · + baseline photos, costed options, included follow-up'],
  ['Signature Skin &amp; Hair Review', '৳6,000', '60 min · + mole map / trichoscopy, same-visit tests, typed report'],
  ['Procedure Assessment', '৳1,500', 'For a specific mole, lump, wart or scar · adjusted against session 1'],
  ['Private Consultation', '৳2,000', 'A private time slot · discreet invoice wording'],
];

export default function book() {
  const options = TIERS.map(([t]) => `<option value="${t}">${t}</option>`).join('');
  return `
<section class="pg-hero"><div class="wrap">
  <p class="crumb"><a href="${href('/')}">Home</a> / Book</p>
  <h1>Book a consultation</h1>
  <p class="lede">Choose the depth of your first visit, then tell us your preferred day and session. You’ll receive your serial, time window and what to bring by SMS/WhatsApp within 2 working hours.</p>
</div></section>

<section class="s-sec"><div class="wrap bk-grid">
  <form class="tool bk-form" id="siteBookingForm" novalidate>
    <div id="sbStatus" class="bk-status" role="status" aria-live="polite" hidden></div>
    <div id="sbConfirm" class="bk-confirm" role="status" aria-live="polite" hidden></div>

    <fieldset class="tool-q" id="sbFields">
      <legend>Your details</legend>
      <label class="bk-field">Full name
        <input id="sbName" name="patient_name" type="text" autocomplete="name" required maxlength="120">
      </label>
      <label class="bk-field">Mobile number
        <input id="sbPhone" name="patient_phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="01XXXXXXXXX">
      </label>
      <label class="bk-field">Consultation type
        <select id="sbTier" name="consultation_type" required>${options}</select>
      </label>
      <label class="bk-field">Chamber
        <select id="sbChamber" name="chamber" required>
          <option value="Alliance Hospital Limited (Shyamoli)">Alliance Hospital (Shyamoli) — Sat–Thu 5–8 PM</option>
          <option value="Dhaka Central International Medical College (DCIMCH)">DCIMCH (Shyamoli) — Sat–Wed 3–5 PM</option>
        </select>
      </label>
      <label class="bk-field">Preferred date
        <input id="sbDate" name="appointment_date" type="date" required>
      </label>
      <label class="bk-field">Preferred session
        <select id="sbSession" name="preferred_session">
          <option value="Morning">Morning</option>
          <option value="Afternoon">Afternoon</option>
          <option value="Evening">Evening</option>
        </select>
      </label>
      <label class="bk-field">Reason (optional)
        <textarea id="sbNotes" name="notes" rows="3" maxlength="2000" placeholder="A word about your concern helps us prepare."></textarea>
      </label>
      <label class="tool-check bk-remind"><input type="checkbox" id="sbRemind" checked><span>Send me appointment and follow-up reminders.</span></label>

      <div class="bk-verify">
        <p class="tool-note">One quick check that you’re a person, not a bot. No account needed.</p>
        <div id="turnstileBooking"></div>
      </div>

      <button type="submit" class="btn btn-ink" id="sbSubmit" disabled aria-busy="true">Request my appointment</button>
      <p class="tool-fine">Submitting sends a request, not a confirmed slot. We confirm by SMS/WhatsApp within 2 working hours. This form is not for emergencies.</p>
    </fieldset>
  </form>

  <aside class="bk-aside">
    <h2>What happens next</h2>
    <ol class="bk-steps">
      <li><b>You request a day.</b><p>We check the chamber schedule and your preferred session.</p></li>
      <li><b>We confirm.</b><p>You get your serial, time window and what to bring by SMS/WhatsApp.</p></li>
      <li><b>You come prepared.</b><p>Bring your creams and old prescriptions — it changes the plan more often than people expect.</p></li>
    </ol>
    <h2>Fees</h2>
    <ul class="bk-fees">${TIERS.map(([t, p, d]) => `<li><span><b>${t}</b><br>${d}</span><b>${p}</b></li>`).join('')}</ul>
    <p class="tool-fine">No package is sold at a first visit. Fees at the hospital chambers follow each hospital’s tariff. <a class="tlink" href="${href('/prices/')}">See the full price list →</a></p>
    <p class="tool-fine">Prefer to talk? <a class="tlink" href="${href('/contact/')}">Contact &amp; directions</a> · <a class="tlink" href="https://wa.me/${SITE.whatsapp}" rel="noopener">WhatsApp</a></p>
  </aside>
</div></section>`;
}
