// /book/ — Phase 2 booking form (docx §5.40). Bespoke body because it carries
// the working form; public/js/site.js handles Turnstile + submit (CSP-safe, no
// inline handlers). Posts to the same /api/appointments the one-pager uses.
//
// The chamber options are built from CHAMBERS_NOW and stamped with the
// consulting weekdays from functions/lib/schedule.js — the server's own rule —
// so the form can refuse a closed day before Turnstile, and the session is
// derived from the chamber (each runs exactly one) instead of offering slots
// that do not exist.
import { href, SITE, CHAMBERS_NOW } from '../site.mjs';
import { CHAMBERS } from '../../functions/lib/schedule.js';
import { bnSummary } from '../bn.mjs';

const TIERS = [
  ['Specialist Consultation', '৳2,000', '20–25 min', 'examination, dermoscopy, written plan'],
  ['Comprehensive Assessment', '৳3,500', '40 min', '+ baseline photos, costed options, included follow-up'],
  ['Signature Skin &amp; Hair Review', '৳6,000', '60 min', '+ mole map or scalp check, same-visit tests, typed report'],
  ['Procedure Assessment', '৳1,500', 'For a specific mole, lump, wart or scar', 'adjusted against session 1'],
  ['Private Consultation', '৳2,000', 'A private time slot', 'discreet invoice wording'],
];

const err = (id) => `<span class="bk-err" id="${id}Err" hidden></span>`;

export default function book() {
  const tierOptions = TIERS.map(([t, , len]) => `<option value="${t}">${t} — ${len}</option>`).join('');
  const chamberOptions = CHAMBERS_NOW.map((c) =>
    `<option value="${c.key}" data-days="${CHAMBERS[c.key].days.join(',')}" data-session="${c.session}" data-when="${c.days}, ${c.hours}">${c.short} — ${c.daysShort}, ${c.hours.replace(/:00/g, '')}</option>`
  ).join('');
  const vat = Math.round(SITE.vatRate * 100);
  return `
<section class="pg-hero"><div class="wrap">
  <p class="crumb"><a href="${href('/')}">Home</a> / Book</p>
  <h1>Book a consultation</h1>
  <p class="lede">Choose a chamber and a day. You’ll receive your serial, time window and what to bring by SMS/WhatsApp within 2 working hours.</p>
  ${bnSummary('/book/')}
</div></section>

<section class="s-sec"><div class="wrap bk-grid">
  <form class="tool bk-form" id="siteBookingForm" novalidate>
    <noscript><p class="bk-status warn">This form needs JavaScript to send. To book without it, call <a class="tlink" href="tel:${SITE.phoneTel}">${SITE.phone}</a> or message us on <a class="tlink" href="https://wa.me/${SITE.whatsapp}" rel="noopener">WhatsApp</a>.</p></noscript>
    <div id="sbStatus" class="bk-status" role="alert" tabindex="-1" hidden></div>
    <div id="sbConfirm" class="bk-confirm" role="status" aria-live="polite" tabindex="-1" hidden></div>

    <fieldset class="tool-q bk-form-fields" id="sbFields">
      <legend>Your details</legend>
      <div class="bk-field">
        <label for="sbName">Full name</label>
        <input id="sbName" name="patient_name" type="text" autocomplete="name" required maxlength="120" aria-describedby="sbNameErr">
        ${err('sbName')}
      </div>
      <div class="bk-field">
        <label for="sbPhone">Mobile number</label>
        <span class="bk-hint" id="sbPhoneHint">We send your serial here by SMS or WhatsApp. For example, 01712345678.</span>
        <input id="sbPhone" name="patient_phone" type="tel" inputmode="tel" autocomplete="tel" required maxlength="40" aria-describedby="sbPhoneHint sbPhoneErr">
        ${err('sbPhone')}
      </div>
      <div class="bk-field">
        <label for="sbChamber">Chamber</label>
        <select id="sbChamber" name="chamber" required aria-describedby="sbChamberHint">${chamberOptions}</select>
        <span class="bk-hint" id="sbChamberHint">Consults ${CHAMBERS_NOW[0].days}, ${CHAMBERS_NOW[0].hours}. Your serial sets the exact time.</span>
      </div>
      <div class="bk-field">
        <label for="sbDate">Preferred date</label>
        <input id="sbDate" name="appointment_date" type="date" required aria-describedby="sbDateErr">
        ${err('sbDate')}
      </div>
      <div class="bk-field">
        <label for="sbTier">Consultation type</label>
        <select id="sbTier" name="consultation_type" required aria-describedby="sbTierHint">${tierOptions}</select>
        <span class="bk-hint" id="sbTierHint">Tells Dr. Sumya how much time to set aside. Not sure? <a class="tlink" href="${href('/consultation-prep/')}">The 2-minute check</a> suggests one.</span>
      </div>
      <div class="bk-field">
        <label for="sbNotes">Reason <span class="bk-opt">(optional)</span></label>
        <textarea id="sbNotes" name="notes" rows="3" maxlength="2000" placeholder="A word about your concern helps us prepare."></textarea>
      </div>
      <label class="tool-check bk-remind"><input type="checkbox" id="sbRemind" checked><span>Send me appointment and follow-up reminders. You can stop them with one reply.</span></label>

      <div class="bk-verify">
        <p class="tool-note">One quick check that you’re a person, not a bot. No account needed.</p>
        <div id="turnstileBooking"></div>
      </div>

      <button type="submit" class="btn btn-ink" id="sbSubmit" disabled aria-busy="true">Request my appointment</button>
      <p class="tool-fine">Submitting sends a request, not a confirmed slot. We confirm by SMS/WhatsApp within 2 working hours. This form is not for emergencies: for swelling of the tongue or throat, difficulty breathing, or feeling faint, go to the nearest emergency department now.</p>
    </fieldset>
  </form>

  <aside class="bk-aside">
    <h2>What happens next</h2>
    <ol class="bk-steps">
      <li><b>You request a day.</b><p>We check the chamber schedule.</p></li>
      <li><b>We confirm.</b><p>You get your serial, time window and what to bring by SMS/WhatsApp.</p></li>
      <li><b>You come prepared.</b><p>Bring your creams and old prescriptions — it changes the plan more often than people expect.</p></li>
    </ol>
    <h2>Fees</h2>
    <p class="bk-fees-note"><b>At Alliance and DCIMCH today,</b> fees follow each hospital’s own tariff. The fees below apply at the Centre, from opening in 2027, and exclude ${vat}% VAT.</p>
    <ul class="bk-fees">${TIERS.map(([t, p, len, d]) => `<li><span><b>${t}</b><br>${len} · ${d}</span><b>${p}</b></li>`).join('')}</ul>
    <p class="tool-fine">No package is sold at a first visit. <a class="tlink" href="${href('/prices/')}">See the full price list →</a></p>
    <p class="tool-fine">Prefer to talk? <a class="tlink" href="tel:${SITE.phoneTel}">Call ${SITE.phone}</a> · <a class="tlink" href="https://wa.me/${SITE.whatsapp}" rel="noopener">WhatsApp</a> · <a class="tlink" href="${href('/contact/')}">Directions</a></p>
  </aside>
</div></section>`;
}
