// Colour-contrast regression guard for the design tokens.
//
// Four of the palette's text tokens shipped below WCAG AA (4.5:1) from the
// beginning, and nothing caught it because contrast is not something that
// throws. Measured against --butter #FCF7DA, the darkest surface any of them
// lands on: --grey 2.78:1, --tan 2.33:1, --rust 3.41:1, --orange 3.00:1.
//
// --grey alone carries .svc p, .gallery-body p, .chamber-meta, .modal-header p
// and every form hint on the site, so a single token was responsible for most
// of the body copy failing. --orange was worse than a foreground problem: it was
// the .btn-primary BACKGROUND under white text, which made the site's single
// most important control -- "Confirm Appointment Request" -- fail AA, while its
// hover state (--sienna, 5.81:1) passed. The resting state was the inaccessible
// one.
//
// This test reads the real values out of style.css rather than restating them,
// so lightening a token to "soften" the design fails here instead of silently
// on a patient's screen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const css = await readFile(join(repoRoot, 'public', 'css', 'style.css'), 'utf8');

function token(name) {
  const m = css.match(new RegExp(`^\\s*--${name}:\\s*(#[0-9A-Fa-f]{6});`, 'm'));
  assert.ok(m, `token --${name} not found in style.css`);
  return m[1];
}

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const channel = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const [r, g, b] = toRgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Every surface a foreground token can land on. --butter is the darkest, so it
// is the binding constraint; all three are checked so a future surface change
// cannot quietly break one combination.
const SURFACES = { '--surface': '#FFFFFF', '--ivory': '#FDFBEF', '--butter': '#FCF7DA' };

// Tokens used as TEXT on those surfaces.
const FOREGROUNDS = ['ink', 'grey', 'rust', 'tan', 'sienna', 'orange-ink'];

for (const name of FOREGROUNDS) {
  test(`--${name} meets WCAG AA (4.5:1) on every surface it is used on`, () => {
    const value = token(name);
    for (const [surfaceName, surface] of Object.entries(SURFACES)) {
      const ratio = contrast(value, surface);
      assert.ok(
        ratio >= 4.5,
        `--${name} (${value}) on ${surfaceName} (${surface}) is ${ratio.toFixed(2)}:1, below the 4.5:1 AA floor for normal text`
      );
    }
  });
}

test('white text on --orange-ink and --sienna backgrounds meets AA', () => {
  // .btn-primary, .fab-book and .cms-tab-btn.active set white text on
  // --orange-ink; .btn-primary:hover uses --sienna the same way.
  for (const name of ['orange-ink', 'sienna']) {
    const value = token(name);
    const ratio = contrast('#FFFFFF', value);
    assert.ok(ratio >= 4.5, `white on --${name} (${value}) is ${ratio.toFixed(2)}:1, below 4.5:1`);
  }
});

test('--orange stays decorative: it is never used outside a gradient', () => {
  // The token split is the fix for .btn-primary. It only holds while --orange
  // has no text-bearing use, so assert that rather than trusting review.
  const uses = css.split('\n').filter((l) => l.includes('var(--orange)'));
  assert.ok(uses.length > 0, 'expected --orange to still drive the brand gradients');
  for (const line of uses) {
    assert.match(
      line,
      /gradient\(/,
      `--orange is decorative-only (3.00:1) and must not appear outside a gradient; use --orange-ink: ${line.trim()}`
    );
  }
});

test('the .w1 / .w2 heading pair stays visually distinguishable', () => {
  // AA forces both --rust and --tan dark, which removes the lightness axis their
  // original distinction relied on. They were re-chosen to hold the same
  // perceptual separation on hue/saturation instead (deltaE 20.0 vs 19.9
  // before). Collapsing them toward each other would silently kill the two-tone
  // heading effect while every contrast assertion above still passed.
  const lab = (hex) => {
    const [r, g, b] = toRgb(hex).map(channel);
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
    const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
    const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };
  const [a, b] = [lab(token('rust')), lab(token('tan'))];
  const deltaE = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  assert.ok(deltaE >= 15, `--rust and --tan are only deltaE ${deltaE.toFixed(1)} apart; the .w1/.w2 two-tone heading needs visible separation`);
});

// The multi-page site puts text on two surfaces the token checks above never
// see: the hero gradient and the ink footer. Both shipped failing — the hero
// eyebrow and links at ~2:1 over the gradient's orange, and the doctor's name
// in every footer at 1:1 (ink on ink). These pin the fixes in site.css.
const siteCss = await readFile(join(repoRoot, 'public', 'css', 'site.css'), 'utf8');

test('hero copy sits on --gold, with orange only in the figure-side pool', () => {
  const heroRules = [...siteCss.matchAll(/\.h-hero\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(heroRules.length >= 1, '.h-hero rule not found in site.css');
  for (const rule of heroRules) {
    const bg = rule.replace(/\/\*[\s\S]*?\*\//g, '');
    if (!/background/.test(bg)) continue;
    assert.match(bg, /var\(--gold\)\s*;?\s*$/, '.h-hero must paint --gold as its base layer under the copy');
    assert.match(bg, /radial-gradient\([^;]*at (100%|50% 100%)/, 'the orange pool must sit at the figure side (right, or bottom when stacked)');
  }
  assert.ok(contrast(token('ink'), token('gold')) >= 4.5, 'ink on --gold must pass AA for body copy');
  assert.ok(contrast(token('ink'), token('amber')) >= 4.5, 'ink on --amber must pass AA where the pool fades under copy');
  assert.ok(contrast(token('sienna'), token('gold')) >= 4.5, 'the sienna headline accent must pass on --gold');
  assert.doesNotMatch(siteCss, /\.h-hero[^{]*\.tlink\s*\{[^}]*orange-ink/, 'hero links must not use --orange-ink (2:1 on the gradient)');
});

test('the footer brand is light on the ink footer', () => {
  const m = siteCss.match(/\.foot \.logo-n\s*\{([^}]*)\}/);
  assert.ok(m, '.foot .logo-n override missing — .logo-n is --ink, the footer background');
  assert.doesNotMatch(m[1], /var\(--ink\)/, 'the footer name must not be ink on ink');
  const s = siteCss.match(/\.foot \.logo-s\s*\{([^}]*)\}/);
  assert.ok(s && /var\(--butter\)|#fff/i.test(s[1]), '.foot .logo-s must be butter or white on ink');
});

test('form fields and focus rings meet the 3:1 non-text floor', () => {
  assert.ok(contrast(token('field-line'), '#FFFFFF') >= 3, '--field-line must be ≥3:1 on white (WCAG 1.4.11)');
  assert.match(siteCss, /:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--ink\)/, 'a site-wide ink focus ring must exist');
});
