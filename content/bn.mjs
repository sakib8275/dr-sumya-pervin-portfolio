// Bangla summaries — DRAFTS, not published.
//
// Much of the audience reads Bangla more easily than English (critique,
// 2026-10-03). These are machine-drafted one-paragraph summaries for the
// highest-traffic surfaces. Medical copy in a patient's first language has to
// be written or checked by the doctor, so nothing here renders until an entry
// is marked `approved: true` — tests/pages.test.mjs fails if an unapproved
// entry ever reaches a built page. The font stack already carries Hind Siliguri
// (loaded with unicode-range, so it downloads only when Bengali text exists).
//
// To publish one: have Dr. Sumya read and correct `text`, set approved: true,
// rebuild. Keep each to the facts already published in English on that page.
export const BN = {
  '/': {
    approved: false,
    text: 'প্রতিটি চিকিৎসা শুরু হয় সঠিক রোগনির্ণয় দিয়ে। ত্বক, চুল ও নখের সমস্যায় চিকিৎসকের নেতৃত্বে সেবা: প্রকাশিত মূল্য, প্রতিবার লিখিত চিকিৎসা-পরিকল্পনা, আর নির্দিষ্ট সময়ে ফলো-আপ বার্তা। এখন শ্যামলীতে অ্যালায়েন্স হাসপাতাল ও ডিসিআইএমসিএইচ-এ রোগী দেখছেন।',
  },
  '/book/': {
    approved: false,
    text: 'চেম্বার ও দিন বেছে নিয়ে অনুরোধ পাঠান। ২ কর্মঘণ্টার মধ্যে এসএমএস বা হোয়াটসঅ্যাপে আপনার সিরিয়াল, সময় ও কী আনতে হবে তা জানানো হবে। জরুরি অবস্থায় এই ফর্ম ব্যবহার করবেন না।',
  },
};

// The rendered block for a page, or '' while the entry is unapproved.
export function bnSummary(path) {
  const entry = BN[path];
  return entry && entry.approved ? `<p class="bn-sum" lang="bn">${entry.text}</p>` : '';
}
