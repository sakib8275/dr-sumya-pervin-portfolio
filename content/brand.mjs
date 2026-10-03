// The practice mark: "Signature SP" — concept 01 of the logo study in
// design/clinic-logo/ (a custom S beside a rounded P, grounded by one curved
// skin contour). One definition, used by the header, drawer, footer, the hero
// nameplate, the favicon and the share card (scripts/render-brand-assets.mjs).
//
// Drawn in currentColor on a 0 0 100 100 box, so each placement sets its colour
// with CSS: indigo on paper, white or paper on indigo. One colour only; the
// study keeps turmeric for the surroundings, never inside the mark.
export const MARK_PATHS = [
  'M45 30C39 22 23 25 23 36C23 47 45 44 45 56C45 67 28 72 21 63', // S
  'M56 68V27H66C84 27 84 49 66 49H56',                            // P
  'M24 80Q50 72 77 80',                                           // skin contour
];

// The study's stroke is 4 units, right from about 40px up. Small placements
// pass a heavier weight so the strokes stay crisp: 16px × 4/100 is 0.64px.
export function mark(cls, weight = 4) {
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round">${MARK_PATHS.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`;
}
