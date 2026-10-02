// About body — docx §5.2 copy verbatim. The 15/7 figures match the
// owner-supplied About stat row added 2026-10-02 (A12).
import { SITE, href } from '../site.mjs';

export default function about() {
  return `
<section class="pg-hero">
  <div class="wrap">
    <p class="crumb"><a href="${href('/')}">Home</a> / About</p>
    <h1>Dr. Sumya Pervin</h1>
    <p class="lede">Consultant Dermatologist — Skin, Hair, Nail, Allergy &amp; Venereal Diseases.<br>
    MBBS (Sir Salimullah Medical College, 2011) · DDV, Diploma in Dermatology &amp; Venereology (BSMMU, 2019) · FCPS, Skin &amp; VD (Bangladesh College of Physicians and Surgeons, 2025) · Trained in dermatosurgery · ${SITE.bmdc}.</p>
    <div class="h-ctas"><a class="btn btn-ink" href="${href('/book/')}">Book with Dr. Sumya</a><a class="btn btn-ghost" href="${href('/chambers/')}">See where she consults now</a></div>
  </div>
</section>

<section class="s-sec"><div class="wrap s-prose">
  <h2>Fifteen years in medicine. Seven as a skin specialist.</h2>
  <p>Dr. Sumya Pervin qualified from Sir Salimullah Medical College in 2011 and spent the following decade in public health service across district and tertiary hospitals, including a period in rural practice that still shapes how she listens to patients. She trained in dermatology at BSMMU, completing her DDV in 2019, and served in the Department of Skin &amp; VD at Sir Salimullah Medical College &amp; Mitford Hospital. In 2025 she was awarded the FCPS in Skin &amp; VD, the country’s highest specialist qualification in the field.</p>

  <h2>How she practises</h2>
  <p>Her position is simple, and in today’s Dhaka market unusual: a skin condition should be diagnosed before it is treated, and the patient should understand both. She will not prescribe from a photograph. She will ask to see what you are already applying, because many long-standing “unresponsive” rashes in Bangladesh are caused or kept going by over-the-counter steroid creams. She will tell you when a condition is chronic rather than curable. And she will not offer a treatment she cannot justify from evidence. Skin-lightening infusions, unregistered injectables and “instant fairness” programmes are not available at any price.</p>

  <h2>Areas of practice</h2>
  <p>General dermatology (skin, hair, nails) · Acne and acne scarring · Pigmentation and melasma · Eczema, psoriasis and chronic inflammatory skin disease · Hives and skin allergy · Fungal and bacterial infections · Children’s skin · Hair loss · Dermatosurgery and minor procedures · Skin cancer screening · Sexual health and STIs (confidential) · Evidence-based aesthetic and laser dermatology.</p>

  <h2>Building a practice that outlasts one doctor</h2>
  <p>The Centre on Ring Road, Mohammadpur, is designed so every patient gets the same standard: the same consultation steps, written plans, consent rules and follow-up, whoever is on duty. Every doctor who joins is credentialed against these standards.</p>
  <p><b>Consultations in Bangla and English.</b></p>

  <div class="statrow">
    <div class="statrow-item"><span class="statrow-num">15+</span><span class="statrow-lab">Years in Medical Practice</span></div>
    <div class="statrow-item"><span class="statrow-num">10+</span><span class="statrow-lab">Years in Government Service</span></div>
    <div class="statrow-item"><span class="statrow-num">7+</span><span class="statrow-lab">Years as Dermatology Specialist</span></div>
  </div>
</div></section>`;
}
