// The booking pre-fill protocol — the one channel a tool's answers take to
// /book/. A result's "Book" button is a plain /book/ link carrying the intent
// in data- attributes; a click moves it to sessionStorage, which /book/ reads
// once and clears. Answers never reach a URL (history, server logs,
// referrers). Static links may also use ?tier= / ?chamber= / ?reason= URL
// params, which name a visit or a chamber — never a symptom. If storage is
// blocked the patient simply picks the visit themselves.
const storage = () => (typeof sessionStorage === 'undefined' ? undefined : sessionStorage);

export function writePrefill(el, s = storage()) {
  try {
    if (s) s.setItem('bookPrefill', JSON.stringify({ tier: el.dataset.prefillTier || '', reason: el.dataset.prefillReason || '' }));
  } catch { /* storage unavailable: the plain link still works */ }
}

// query is a URLSearchParams (or anything with .get); returns the merged
// pre-fill with sessionStorage consumed exactly once.
export function takePrefill(query, s = storage()) {
  let kept = {};
  try {
    if (s) {
      kept = JSON.parse(s.getItem('bookPrefill') || '{}') || {};
      s.removeItem('bookPrefill');
    }
  } catch { kept = {}; }
  const q = query || { get: () => null };
  return {
    tier: kept.tier || q.get('tier') || '',
    reason: kept.reason || q.get('reason') || '',
    chamber: q.get('chamber') || ''
  };
}
