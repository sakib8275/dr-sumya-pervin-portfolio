// A2 guard — SERVICES_DATA keys and the .svc card headings must match exactly,
// in both directions.
//
// openServiceModalFromCard() looks a service up by the literal textContent of
// the card's <h4>. Before 2026-08-27 the two lists shared ZERO keys: the data
// used one naming scheme ('PRP & Microneedling Therapy', 'Acne & Scar
// Management') and the cards another ('Microneedling with Serums', 'Chemical
// Peels'). Every lookup missed, every modal took the fallback branch, and all
// eight services displayed the same invented '30-45 mins / Minimal / General
// skin phototypes'. Nothing failed, nothing logged, and fifty lines of clinical
// copy rendered nowhere.
//
// This is the same failure mode as F-UX-2, where evaluateQuiz() recommended
// service names that were not <option> values of #serviceType and every
// quiz-driven booking was rejected by the server. Both are string keys joined
// across two files with no compiler between them, so the join needs a test.
//
// Checked in BOTH directions on purpose: "every card resolves" alone would still
// pass with an orphaned entry that renders nowhere, which is half of the
// original bug.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const html = await readFile(join(repoRoot, 'public', 'index.html'), 'utf8');
const js = await readFile(join(repoRoot, 'public', 'js', 'main.js'), 'utf8');

// The eight service cards, read the way the browser reads them: the <h4> text
// with entities resolved, because that is what textContent yields.
function cardHeadings(markup) {
  const grid = markup.slice(markup.indexOf('id="svcGrid"'), markup.indexOf('</section>', markup.indexOf('id="svcGrid"')));
  // The heading wraps a <button> (the a11y fix that made the card keyboard
  // operable without stealing the <h4> from the accessibility tree), so the text
  // is not a bare text node any more -- strip the inner markup before comparing.
  return [...grid.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/g)].map(m =>
    m[1].replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ').trim()
  );
}

// Top-level quoted keys of the SERVICES_DATA object literal.
function servicesDataKeys(source) {
  const start = source.indexOf('const SERVICES_DATA = {');
  const end = source.indexOf('\n};', start);
  assert.ok(start !== -1 && end > start, 'SERVICES_DATA object literal not found in main.js');
  return [...source.slice(start, end).matchAll(/^ {2}'([^']+)':\s*\{/gm)].map(m => m[1]);
}

const headings = cardHeadings(html);
const keys = servicesDataKeys(js);

test('every service card heading has a SERVICES_DATA entry', () => {
  assert.ok(headings.length >= 8, `expected at least 8 service cards, found ${headings.length}`);
  const missing = headings.filter(h => !keys.includes(h));
  assert.deepEqual(missing, [], `service cards with no SERVICES_DATA entry (their modal would show fallback copy): ${missing.join(', ')}`);
});

test('every SERVICES_DATA entry has a service card that can open it', () => {
  const orphaned = keys.filter(k => !headings.includes(k));
  assert.deepEqual(orphaned, [], `SERVICES_DATA entries no card can reach (dead copy): ${orphaned.join(', ')}`);
});

test('every SERVICES_DATA entry carries a non-empty description', () => {
  // desc is the one field always required: it is what replaces the card's own
  // one-liner in the modal. duration/recovery/suitability are practice facts and
  // are deliberately absent where the practice has not supplied them.
  const start = js.indexOf('const SERVICES_DATA = {');
  const body = js.slice(start, js.indexOf('\n};', start));
  for (const key of keys) {
    const entry = body.slice(body.indexOf(`'${key}':`));
    const desc = entry.match(/desc:\s*(['"])([\s\S]*?)\1/);
    assert.ok(desc, `${key} has no desc`);
    assert.ok(desc[2].trim().length > 40, `${key} has a suspiciously short desc`);
  }
});

test('the booking select offers every service a card can preselect', () => {
  // "Book This Procedure Now" assigns the card heading straight into
  // #serviceType. A heading that is not an <option> value blanks the select and
  // the server rejects the booking as a missing required field -- F-UX-2, which
  // shipped to production and broke every quiz-driven booking.
  const options = [...html.matchAll(/<option value="([^"]+)"/g)].map(m =>
    m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  );
  const unbookable = headings.filter(h => !options.includes(h));
  assert.deepEqual(unbookable, [], `service cards whose "Book This Procedure Now" would blank #serviceType: ${unbookable.join(', ')}`);
});
