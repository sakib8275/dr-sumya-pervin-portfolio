// Colour-contrast regression guard for the design tokens.
//
// History: the original gold palette shipped four text tokens below WCAG AA
// (4.5:1) and nothing caught it, because contrast is not something that throws.
// The multi-page site then added two more failures the token checks never saw:
// hero copy at ~2:1 over an orange gradient, and the doctor's name in every
// footer at 1:1 (ink on ink).
//
// The Nil & Haldi palette (2026-10-03) replaced that palette. This file pins it
// the same way: it reads the real values out of site.css rather than restating
// them, so lightening a token to "soften" the design fails here instead of
// silently on a patient's screen. tests/pages.test.mjs keeps style.css's :root
// a verbatim copy, so these checks cover the admin panel too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const siteCss = await readFile(join(repoRoot, 'public', 'css', 'site.css'), 'utf8');

function token(name) {
  const m = siteCss.match(new RegExp(`^\\s*--${name}:\\s*(#[0-9A-Fa-f]{6});`, 'm'));
  assert.ok(m, `token --${name} not found as a hex primitive in site.css`);
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

// The light grounds text lands on. --paper-2 is the darkest, so it is the
// binding constraint; all three are checked so a future change to one cannot
// quietly break a combination.
const LIGHT = ['paper', 'paper-2', 'surface'];
// Tokens used as TEXT on those grounds.
const FOREGROUNDS = ['ink', 'ink-2', 'nil', 'haldi-ink', 'err-ink', 'warn-ink'];

for (const name of FOREGROUNDS) {
  test(`--${name} meets WCAG AA (4.5:1) on every light ground`, () => {
    const value = token(name);
    for (const ground of LIGHT) {
      const ratio = contrast(value, token(ground));
      assert.ok(
        ratio >= 4.5,
        `--${name} (${value}) on --${ground} (${token(ground)}) is ${ratio.toFixed(2)}:1, below the 4.5:1 AA floor for normal text`
      );
    }
  });
}

test('text on the indigo grounds meets AA', () => {
  // --nil-deep: footer, utility bar, limits band, estimator, signature tier,
  // nameplate. --nil: buttons, flags, the closing CTA band.
  const pairs = [
    ['#FFFFFF', 'nil'], ['#FFFFFF', 'nil-deep'],
    ['on-nil', 'nil'], ['on-nil', 'nil-deep'],
    ['haldi', 'nil-deep'],
  ];
  for (const [fg, bg] of pairs) {
    const f = fg.startsWith('#') ? fg : token(fg);
    const ratio = contrast(f, token(bg));
    assert.ok(ratio >= 4.5, `${fg} on --${bg} is ${ratio.toFixed(2)}:1, below 4.5:1`);
  }
});

test('ink on a turmeric fill meets AA', () => {
  // The "Consulting today" flag, savings badges and the BMDC pill.
  const ratio = contrast(token('ink'), token('haldi'));
  assert.ok(ratio >= 4.5, `ink on --haldi is ${ratio.toFixed(2)}:1, below 4.5:1`);
  assert.ok(contrast(token('err-ink'), token('err-bg')) >= 4.5, '--err-ink on --err-bg must pass AA');
  assert.ok(contrast(token('warn-ink'), token('warn-bg')) >= 4.5, '--warn-ink on --warn-bg must pass AA');
});

test('turmeric is never text on a light ground', () => {
  // --haldi is 2:1 on paper: a fill, a rule or a mark there, never text. As a
  // text colour it is allowed only inside the indigo-ground components.
  const DARK = /\.(nameplate|np-|h-dont|no-mark|pr-est-out|foot|h-tier\.sig|u-bar|m-sticky)/;
  const rules = siteCss.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]+\{[^}]*\}/g) || [];
  for (const rule of rules) {
    if (!/(^|[^-])color:\s*var\(--haldi\)/.test(rule)) continue;
    const selector = rule.slice(0, rule.indexOf('{')).trim();
    if (selector.startsWith('--') || selector === ':root') continue;
    assert.match(selector, DARK, `--haldi used as text outside an indigo ground: ${selector}; use --haldi-ink`);
  }
});

test('no gradient sits under the hero copy', () => {
  const heroRules = [...siteCss.matchAll(/\.h-hero\s*\{([^}]*)\}/g)].map((m) => m[1].replace(/\/\*[\s\S]*?\*\//g, ''));
  assert.ok(heroRules.length >= 1, '.h-hero rule not found in site.css');
  for (const rule of heroRules) {
    if (!/background/.test(rule)) continue;
    assert.doesNotMatch(rule, /gradient\(/, '.h-hero must be a flat ground under the copy');
  }
});

test('the footer is indigo and its brand is light on it', () => {
  assert.match(siteCss, /\.foot\s*\{[^}]*background:\s*var\(--nil-deep\)/, '.foot must sit on --nil-deep');
  const m = siteCss.match(/\.foot \.logo-n\s*\{([^}]*)\}/);
  assert.ok(m, '.foot .logo-n override missing — .logo-n is --ink, which vanishes on indigo');
  assert.doesNotMatch(m[1], /var\(--(ink|nil|nil-deep)\)/, 'the footer name must not be dark on dark');
  const s = siteCss.match(/\.foot \.logo-s\s*\{([^}]*)\}/);
  assert.ok(s && /var\(--on-nil\)|#fff/i.test(s[1]), '.foot .logo-s must be --on-nil or white');
});

test('form fields and focus rings meet the 3:1 non-text floor', () => {
  for (const ground of ['paper', 'surface']) {
    assert.ok(contrast(token('field-line'), token(ground)) >= 3, `--field-line must be ≥3:1 on --${ground} (WCAG 1.4.11)`);
  }
  assert.match(siteCss, /:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--nil\)/, 'a site-wide nil focus ring must exist');
  assert.ok(contrast(token('nil'), token('paper-2')) >= 3, 'the focus ring must be ≥3:1 on the darkest light ground');
  assert.ok(contrast(token('haldi'), token('nil-deep')) >= 3, 'the turmeric focus ring must be ≥3:1 on --nil-deep');
});

test('focus rings on every Deep Nil ground, the hero journey panel included, are turmeric', () => {
  // The site-wide ring is --nil, 1.2:1 on --nil-deep: invisible on an indigo ground.
  const m = siteCss.match(/([^{}]*:focus-visible[^{}]*)\{\s*outline-color:\s*var\(--haldi\)\s*;?\s*\}/);
  assert.ok(m, 'the turmeric focus-ring override list is missing');
  for (const sel of ['.u-bar', '.foot', '.h-dont', '.h-final', '.m-sticky', '.pr-est-out', '.h-tier.sig', '.nameplate']) {
    assert.ok(m[1].includes(`${sel} :focus-visible`), `${sel} sits on Deep Nil and needs the turmeric focus ring`);
  }
});

test('every legacy alias resolves to a defined primitive', () => {
  // style.css and the admin panel's inline styles still read the old names.
  const root = siteCss.match(/:root\s*\{([\s\S]*?)\}/)[1];
  const aliases = [...root.matchAll(/--([a-z0-9-]+):\s*var\(--([a-z0-9-]+)\)/g)];
  assert.ok(aliases.length >= 10, 'expected the legacy alias block in :root');
  for (const [, name, target] of aliases) {
    assert.ok(token(target), `--${name} aliases --${target}, which is not a hex primitive`);
  }
});
