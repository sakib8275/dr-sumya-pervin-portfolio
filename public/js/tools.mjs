// Decision logic for the interactive guides (docx §5.40) — the what-to-say,
// without the how-to-render. public/js/site.js owns the DOM adapters; these
// functions are pure: answers in, staged copy out, so the clinical wording is
// testable in node (tests/tools.test.mjs) instead of only through a browser.
//
// The skin-check urgency wording was reviewed and approved by Dr. Sumya on
// 2026-10-04, amended so a bleeding or fast-changing mole is "in the next day
// or two". Emergencies short-circuit everything and never offer a booking.

export const EMERGENCY = {
  heading: 'Go to the nearest emergency department now',
  airway: 'Swelling of the lips, tongue or throat, or trouble breathing, can be a severe allergic reaction.',
  fever: 'Fever with a widespread rash, or blistering or peeling skin, needs hospital care the same day.',
  tail: 'Do not wait for a clinic appointment.'
};

export function moleDecision(signs) {
  return { concerning: signs.length > 0, count: signs.length, signs };
}

const ROUTINES = {
  oily: ['Gel cleanser, twice a day', 'Light, oil-free moisturiser', 'Non-comedogenic sunscreen SPF 50, every morning'],
  combination: ['Gentle foaming cleanser', 'Light moisturiser on dry areas', 'Sunscreen SPF 50, every morning'],
  dry: ['Cream cleanser, no soap', 'Rich moisturiser while skin is damp', 'Sunscreen SPF 50, every morning'],
  sensitive: ['Fragrance-free gentle cleanser', 'Barrier moisturiser, minimal actives', 'Mineral or fragrance-free sunscreen SPF 50'],
  normal: ['Gentle cleanser', 'Light moisturiser', 'Sunscreen SPF 50, every morning']
};

export function skinTypeResult(a) {
  if (['feel', 'react', 'sun', 'breakouts', 'marks', 'outdoor'].some((k) => !a[k])) {
    return { stage: 'incomplete' };
  }
  let type = 'combination';
  if (a.react === 'sting') type = 'sensitive';
  else if (a.feel === 'oily' || a.breakouts === 'often') type = 'oily';
  else if (a.feel === 'tight') type = 'dry';
  else if (a.feel === 'tzone') type = 'combination';
  else type = 'normal';

  const sunNote = a.sun === 'burn'
    ? 'High — you burn easily, so daily sunscreen is essential.'
    : a.sun === 'deep'
      ? 'Lower burning risk, but higher risk of dark marks after any inflammation.'
      : 'Moderate — daily sunscreen still matters, especially for pigmentation.';
  const peelNote = type === 'sensitive' || type === 'dry'
    ? 'Peels and laser need gentler settings and a patch test; tell your doctor you react easily.'
    : 'Most peels and lasers suit this skin, with settings chosen for South Asian skin.';

  return { stage: 'result', type, routine: ROUTINES[type], sunNote, peelNote };
}

// Answers in: { where, look, dur, acts: [], warn: [] }. Staged copy out.
// offerWa marks the one urgency where the adapter appends the WhatsApp link
// (the number is site content, not decision logic).
export function skinCheckTriage(a) {
  const warn = a.warn || [];
  const acts = a.acts || [];

  if (warn.includes('airway') || warn.includes('fever')) {
    return { stage: 'emergency', emergency: warn.includes('airway') ? 'airway' : 'fever' };
  }
  if (!a.where || !a.look || !a.dur) return { stage: 'incomplete' };

  const mole = a.look === 'mole' || warn.includes('mole-fast');
  const priv = a.where === 'private' || a.look === 'private';

  let urgency;
  if (warn.includes('hot')) {
    urgency = {
      key: 'today', offerWa: true, heading: 'See a doctor today',
      body: 'Red, hot, painful skin that spreads fast can be an infection that needs treatment the same day. If you cannot see a doctor today, go to an emergency department.'
    };
  } else if (warn.includes('mole-fast')) {
    urgency = {
      key: 'soon', heading: 'Be seen in the next day or two',
      body: 'A mole that is bleeding or changing quickly should be examined quickly. It is usually harmless, but this is the one to check rather than watch. When you book, say it is a changing mole — we give these a priority slot.'
    };
  } else if (mole || priv || acts.includes('bleed')) {
    urgency = {
      key: 'soon', heading: 'Be seen within the next few days',
      body: mole
        ? 'A mole that is new, changing or bleeding should be examined soon. It is usually harmless, but this is the one to check rather than watch.'
        : priv
          ? 'Sores, bumps or discharge in the private area are best seen soon. Most causes are very treatable, and partners may need treatment too.'
          : 'Skin that bleeds or oozes should be examined soon, especially if it does not heal within two weeks.'
    };
  } else {
    urgency = {
      key: 'routine', heading: 'A routine visit is fine',
      body: 'Nothing you described sounds urgent. Book when it suits you, and come sooner if it changes quickly, spreads, or stops you sleeping.'
    };
  }

  let visit;
  if (priv) {
    visit = { name: 'Private Consultation', blurb: 'A private time slot. No reason is needed when booking, and the invoice wording is discreet.' };
  } else if (a.dur === 'long' || acts.length >= 2) {
    visit = { name: 'Comprehensive Assessment', blurb: '40 minutes. Long-standing or busy problems usually need baseline photographs, costed options and an included follow-up.' };
  } else {
    visit = { name: 'Specialist Consultation', blurb: '20–25 minutes. A focused first visit: examination, dermoscopy where it helps, and a written plan.' };
  }

  return { stage: 'result', urgency, visit, mole, priv };
}

// The depth figures mirror content/prices.mjs (docx Part 6), stated in the
// same words the price cards use.
export function prepAdvice(a) {
  if (['duration', 'itch', 'products', 'doctors', 'conditions', 'photo', 'cosmetic'].some((k) => !a[k])) {
    return { stage: 'incomplete' };
  }
  const deep = ['long', 'chronic'].includes(a.duration) || a.products === 'many' || a.conditions === 'yes' || a.cosmetic === 'yes';
  return {
    stage: 'result',
    depth: deep
      ? 'Comprehensive Assessment (40 minutes, ৳3,500) — long-standing or cosmetic concerns usually need baseline photographs, costed options and an included follow-up.'
      : 'Specialist Consultation (20–25 minutes, ৳2,000) — a focused first visit with examination, dermoscopy and a written plan.',
    bring: a.photo === 'yes'
      ? 'Bring the photo of the problem at its worst — it often changes the plan.'
      : 'Come without oil on the hair and without nail polish if those are affected.'
  };
}
