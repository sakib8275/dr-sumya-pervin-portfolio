// The tools' decision logic (public/js/tools.mjs), the estimator arithmetic
// (public/js/estimator.mjs) and the pre-fill protocol (public/js/prefill.mjs),
// tested at their interfaces — no browser, no DOM. Before the split, all of
// this was reachable only through Playwright.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMERGENCY, moleDecision, skinTypeResult, skinCheckTriage, prepAdvice } from '../public/js/tools.mjs';
import { estimate } from '../public/js/estimator.mjs';
import { writePrefill, takePrefill } from '../public/js/prefill.mjs';

// A sessionStorage stand-in for node.
const fakeStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k)
  };
};

// — mole check —

test('mole decision: any ticked sign warrants a look, none is reassuring', () => {
  assert.deepEqual(moleDecision([]), { concerning: false, count: 0, signs: [] });
  const r = moleDecision(['Asymmetry', 'Border']);
  assert.equal(r.concerning, true);
  assert.equal(r.count, 2);
});

// — skin type guide —

const SKIN = { feel: 'normal', react: 'none', sun: 'sometimes', breakouts: 'rare', marks: 'no', outdoor: 'some' };

test('skin type: incomplete until all six answers', () => {
  assert.equal(skinTypeResult({ ...SKIN, marks: '' }).stage, 'incomplete');
  assert.equal(skinTypeResult(SKIN).stage, 'result');
});

test('skin type ladder: sting wins, then oil, then dry, then t-zone', () => {
  assert.equal(skinTypeResult({ ...SKIN, react: 'sting', feel: 'oily' }).type, 'sensitive');
  assert.equal(skinTypeResult({ ...SKIN, feel: 'oily' }).type, 'oily');
  assert.equal(skinTypeResult({ ...SKIN, breakouts: 'often' }).type, 'oily');
  assert.equal(skinTypeResult({ ...SKIN, feel: 'tight' }).type, 'dry');
  assert.equal(skinTypeResult({ ...SKIN, feel: 'tzone' }).type, 'combination');
  assert.equal(skinTypeResult(SKIN).type, 'normal');
});

test('skin type notes follow the sun answer and the type', () => {
  assert.match(skinTypeResult({ ...SKIN, sun: 'burn' }).sunNote, /burn easily/);
  assert.match(skinTypeResult({ ...SKIN, sun: 'deep' }).sunNote, /dark marks/);
  assert.match(skinTypeResult({ ...SKIN, react: 'sting' }).peelNote, /patch test/);
  assert.match(skinTypeResult({ ...SKIN, feel: 'oily' }).peelNote, /Most peels and lasers suit/);
});

// — skin check triage (approved by Dr. Sumya 2026-10-04) —

const SC = { where: 'face', look: 'spots', dur: 'weeks', acts: [], warn: [] };

test('triage: emergencies short-circuit alone, airway before fever', () => {
  assert.deepEqual(skinCheckTriage({ ...SC, warn: ['airway'] }), { stage: 'emergency', emergency: 'airway' });
  assert.deepEqual(skinCheckTriage({ ...SC, warn: ['fever', 'airway'] }), { stage: 'emergency', emergency: 'airway' });
  assert.equal(EMERGENCY.airway.includes('allergic reaction'), true);
});

test('triage: incomplete until where, look and duration are answered', () => {
  assert.equal(skinCheckTriage({ ...SC, look: '' }).stage, 'incomplete');
  assert.equal(skinCheckTriage(SC).stage, 'result');
});

test('triage: fast-spreading hot skin is "today" and offers WhatsApp', () => {
  const t = skinCheckTriage({ ...SC, warn: ['hot'] });
  assert.equal(t.stage, 'result');
  assert.equal(t.urgency.key, 'today');
  assert.equal(t.urgency.heading, 'See a doctor today');
  assert.equal(t.urgency.offerWa, true);
  assert.match(t.urgency.body, /go to an emergency department\.$/); // the adapter appends the link
});

test('triage: a bleeding or fast-changing mole is "in the next day or two"', () => {
  const t = skinCheckTriage({ ...SC, look: 'mole', warn: ['mole-fast'] });
  assert.equal(t.urgency.key, 'soon');
  assert.equal(t.urgency.heading, 'Be seen in the next day or two');
  assert.match(t.urgency.body, /priority slot/);
  assert.equal(t.mole, true);
});

test('triage: new or changing mole, private area, or bleeding skin are "few days"', () => {
  for (const over of [{ look: 'mole' }, { where: 'private' }, { look: 'private' }, { acts: ['bleed'] }]) {
    const t = skinCheckTriage({ ...SC, ...over });
    assert.equal(t.urgency.heading, 'Be seen within the next few days', JSON.stringify(over));
  }
});

test('triage: otherwise a routine visit', () => {
  const t = skinCheckTriage(SC);
  assert.equal(t.urgency.key, 'routine');
  assert.equal(t.urgency.heading, 'A routine visit is fine');
});

test('triage: private area books the Private Consultation, no reason asked', () => {
  const t = skinCheckTriage({ ...SC, where: 'private' });
  assert.equal(t.visit.name, 'Private Consultation');
});

test('triage: long-standing or busy problems suggest the Comprehensive Assessment', () => {
  assert.equal(skinCheckTriage({ ...SC, dur: 'long' }).visit.name, 'Comprehensive Assessment');
  assert.equal(skinCheckTriage({ ...SC, acts: ['itch', 'spread'] }).visit.name, 'Comprehensive Assessment');
  assert.equal(skinCheckTriage(SC).visit.name, 'Specialist Consultation');
});

// — prepare-for-visit —

const PREP = { duration: 'new', itch: 'no', products: 'none', doctors: 'no', conditions: 'no', photo: 'yes', cosmetic: 'no' };

test('prep: incomplete until all seven answers', () => {
  assert.equal(prepAdvice({ ...PREP, products: '' }).stage, 'incomplete');
});

test('prep: deep triggers suggest Comprehensive, others Specialist', () => {
  for (const deep of [{ duration: 'long' }, { duration: 'chronic' }, { products: 'many' }, { conditions: 'yes' }, { cosmetic: 'yes' }]) {
    assert.match(prepAdvice({ ...PREP, ...deep }).depth, /Comprehensive Assessment/, JSON.stringify(deep));
  }
  assert.match(prepAdvice(PREP).depth, /Specialist Consultation/);
});

test('prep: the bring note follows the photo answer', () => {
  assert.match(prepAdvice(PREP).bring, /photo of the problem at its worst/);
  assert.match(prepAdvice({ ...PREP, photo: 'no' }).bring, /nail polish/);
});

// — estimator —

test('estimator: course view adds VAT at checkout (e2e parity: ৳15,000 / ৳2,250 / ৳17,250)', () => {
  const r = estimate({ pay: 'course', who: 'n', item: 0, per: 3000, course: 15000, vat: 0.15 });
  assert.equal(r.amount, 15000);
  assert.equal(r.note, 'for the full course');
  const labels = r.rows.map((x) => x.label);
  assert.deepEqual(labels, ['Per session', 'Session 6', 'Typical course', 'VAT (15%, added at checkout)', 'Total at checkout']);
  assert.equal(r.rows[0].amount, 3000);
  assert.equal(r.rows[3].amount, 2250);
  assert.equal(r.rows[4].amount, 17250);
  assert.equal(r.rows[4].total, true);
});

test('estimator: single view leads with the per-session price', () => {
  const r = estimate({ pay: 'single', who: 'n', item: 1, per: 3000, course: 15000, vat: 0.15 });
  assert.equal(r.amount, 3000);
  assert.equal(r.note, 'per session');
  assert.deepEqual(r.rows.map((x) => x.label), ['Full course (6 sessions, pay for 5)', 'Typical course', 'VAT (15%, added at checkout)', 'Total at checkout']);
});

test('estimator: only laser hair removal (item 0) pays the doctor-performed +25%', () => {
  const laser = estimate({ pay: 'course', who: 'dr', item: 0, per: 3000, course: 15000, vat: 0.15 });
  assert.equal(laser.amount, 18750);
  const other = estimate({ pay: 'course', who: 'dr', item: 1, per: 3000, course: 15000, vat: 0.15 });
  assert.equal(other.amount, 15000);
  assert.equal(other.rows.some((x) => x.label === 'Session 6'), false); // Session 6 is laser's alone
});

// — pre-fill protocol —

test('prefill: write then take consumes sessionStorage exactly once', () => {
  const s = fakeStorage();
  writePrefill({ dataset: { prefillTier: 'Specialist Consultation' } }, s);
  assert.deepEqual(takePrefill(null, s), { tier: 'Specialist Consultation', reason: '', chamber: '' });
  assert.deepEqual(takePrefill(null, s), { tier: '', reason: '', chamber: '' });
});

test('prefill: URL params are the fallback; the reason may come from either', () => {
  const q = new URLSearchParams('?tier=Comprehensive%20Assessment&reason=mole&chamber=alliance');
  assert.deepEqual(takePrefill(q, fakeStorage()), {
    tier: 'Comprehensive Assessment', reason: 'mole', chamber: 'alliance'
  });
  const s = fakeStorage();
  writePrefill({ dataset: { prefillReason: 'mole' } }, s);
  assert.equal(takePrefill(new URLSearchParams(''), s).reason, 'mole'); // storage wins over empty URL
});

test('prefill: blocked storage degrades to the plain link, never throws', () => {
  const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => {} };
  writePrefill({ dataset: { prefillTier: 'x' } }, broken);
  assert.deepEqual(takePrefill(new URLSearchParams(''), broken), { tier: '', reason: '', chamber: '' });
});
