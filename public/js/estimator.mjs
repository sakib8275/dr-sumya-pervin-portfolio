// The course-cost estimator's arithmetic (docx §5.37), extracted from
// site.js so the pricing rules are node-testable (tests/tools.test.mjs).
//
// Rules: displayed prices exclude VAT; VAT (the site's rate) is added at
// checkout. Only laser hair removal (item 0) offers the doctor-performed
// +25% option. Pure: numbers in, rows out — the adapter formats the taka.
export function estimate({ pay, who, item, per, course, vat }) {
  const uplift = who === 'dr' && item === 0 ? 1.25 : 1;
  const single = Math.round(per * uplift);
  const full = Math.round(course * uplift);
  const isSingle = pay === 'single';
  const base = isSingle ? single : full;
  const vatAmount = Math.round(base * vat);

  const rows = isSingle
    ? [
        { label: 'Full course (6 sessions, pay for 5)', amount: full },
        { label: 'Typical course', text: '6–8 sessions, 4–6 weeks apart' }
      ]
    : [
        { label: 'Per session', amount: single },
        ...(item === 0 ? [{ label: 'Session 6', text: 'Included' }] : []),
        { label: 'Typical course', text: '6–8 sessions, 4–6 weeks apart' }
      ];
  rows.push(
    { label: `VAT (${Math.round(vat * 100)}%, added at checkout)`, amount: vatAmount },
    { label: 'Total at checkout', amount: base + vatAmount, total: true }
  );

  return { amount: base, note: isSingle ? 'per session' : 'for the full course', rows };
}
