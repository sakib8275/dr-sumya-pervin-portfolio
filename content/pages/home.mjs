// Home body — docx §5.1 copy verbatim, laid out in the incumbent gold design.
// Owner 2026-10-02: the doctor does not want her photograph published, so the
// hero carries a credential nameplate (no face) instead of the wireframe's
// portrait. The arched crown keeps the silhouette the image occupied.
import { SITE, href } from '../site.mjs';

export default function home() {
  const chips = (list) => `<div class="chips">${list.map((c) => `<span class="chip">${c}</span>`).join('')}</div>`;
  return `
<section class="h-hero">
  <div class="wrap">
    <div class="h-hero-copy">
      <p class="eyebrow">Specialist dermatology · FCPS (Skin &amp; VD)</p>
      <h1>Every treatment starts with a <em>diagnosis</em>.</h1>
      <p class="h-sub">Doctor-led care for skin, hair and nail conditions, plus evidence-based aesthetic and laser treatment. Published prices. A written plan at every visit. Follow-up we actually send.</p>
      <div class="h-ctas">
        <a class="btn btn-ink" href="${href('/book/')}">Book a consultation →</a>
        <a class="btn btn-ghost" href="${href('/prices/')}">See prices</a>
      </div>
      <p class="h-alt">Not sure what you need? <a class="tlink" href="${href('/consultation-prep/')}">See what your first visit will involve</a> (2-minute check)</p>
    </div>
    <div class="h-hero-figure">
      <div class="nameplate">
        <span class="np-mark" aria-hidden="true">SP</span>
        <div class="np-body">
          <p class="np-role">Consultant Dermatologist</p>
          <p class="np-name">${SITE.name}</p>
          <p class="np-line">Skin, Hair, Nail, Allergy &amp; Venereal Diseases</p>
          <ul class="np-creds">
            <li class="pill">MBBS</li>
            <li class="pill">DDV (BSMMU)</li>
            <li class="pill">FCPS (Skin &amp; VD)</li>
            <li class="pill gold">${SITE.bmdc.replace('BMDC Reg. ', 'BMDC ')}</li>
          </ul>
        </div>
        <p class="np-note"><b>Consulting now</b> in Shyamoli · Dermatology Centre opening 2027</p>
      </div>
    </div>
  </div>
</section>

<div class="h-promises">
  <div class="wrap">
    <div class="h-pr"><div class="h-pr-t">Prices published</div><p>See exactly what each fee includes, before you call.</p></div>
    <div class="h-pr"><div class="h-pr-t">Doctor-led, always disclosed</div><p>Every price shows who performs it: Dr. Sumya, or a trained nurse working to her protocol.</p></div>
    <div class="h-pr"><div class="h-pr-t">Written plan, every visit</div><p>Diagnosis, treatment, timeline and total cost, in writing.</p></div>
    <div class="h-pr"><div class="h-pr-t">Follow-up we send</div><p>A check-in message at the right time for your condition.</p></div>
  </div>
</div>

<section class="s-sec">
  <div class="wrap">
    <div class="s-head"><div><p class="eyebrow">Start with your concern</p><h2>What brings you here?</h2></div>
      <a class="tlink" href="${href('/medical-dermatology/')}">All conditions &amp; treatments →</a></div>
    <div class="h-pillars">
      <article class="h-pil">
        <p class="k">Medical Dermatology</p><h3>Skin, hair &amp; nail conditions</h3>
        <p>Diagnosed properly, treated with evidence, followed up until controlled.</p>
        ${chips(['Acne', 'Eczema', 'Psoriasis', 'Fungal infection', 'Hair fall', 'Melasma', 'Hives', 'Vitiligo'])}
        <a class="tlink" href="${href('/medical-dermatology/')}">Explore conditions →</a>
      </article>
      <article class="h-pil">
        <p class="k">Skin Surgery &amp; Procedures</p><h3>Moles, lumps &amp; growths</h3>
        <p>Minor skin surgery in a clean procedure room, with lab confirmation when needed.</p>
        ${chips(['Mole check', 'Mole / cyst removal', 'Skin tags &amp; DPN', 'Warts', 'Keloid', 'Skin biopsy'])}
        <a class="tlink" href="${href('/skin-surgery/')}">Explore procedures →</a>
      </article>
      <article class="h-pil">
        <p class="k">Aesthetic &amp; Laser</p><h3>Look like yourself, rested</h3>
        <p>Only what the evidence supports for South Asian skin — planned by a dermatologist.</p>
        ${chips(['Acne scars', 'Pigmentation', 'Unwanted hair', 'Ageing skin', 'Hair thinning', 'Bridal prep'])}
        <a class="tlink" href="${href('/aesthetic-and-laser/')}">Explore aesthetics →</a>
      </article>
    </div>
  </div>
</section>

<section class="s-sec tone-butter">
  <div class="wrap">
    <div class="s-head"><div><p class="eyebrow">How a consultation works</p><h2>From first visit to a plan you can follow</h2></div></div>
    <ol class="h-steps">
      <li><b>History</b><p>Bring your creams and old prescriptions. We ask what you have tried.</p></li>
      <li><b>Examination</b><p>A proper look, with dermoscopy where it helps.</p></li>
      <li><b>Tests — only if useful</b><p>Explained and priced before anything is done.</p></li>
      <li><b>Written plan</b><p>Diagnosis, options, timeline and total cost.</p></li>
      <li><b>Follow-up</b><p>We message you to check progress.</p></li>
    </ol>
  </div>
</section>

<section class="s-sec">
  <div class="wrap">
    <div class="s-head"><div><p class="eyebrow">Consultation fees</p><h2>Choose the depth of your first visit</h2></div>
      <a class="tlink" href="${href('/prices/')}">Full price list →</a></div>
    <div class="h-tiers">
      <article class="h-tier">
        <h3>Specialist Consultation</h3><p class="h-tier-min">20–25 minutes with Dr. Sumya</p>
        <div class="h-tier-p">৳2,000</div>
        <ul><li>✓ Examination + dermoscopy</li><li>✓ Written diagnosis &amp; care plan</li><li>✓ Report review within 14 days — ৳0</li><li>✓ One WhatsApp check-in</li></ul>
      </article>
      <article class="h-tier rec">
        <p class="h-tier-flag">Recommended for long-standing or cosmetic concerns</p>
        <h3>Comprehensive Assessment</h3><p class="h-tier-min">40 minutes with Dr. Sumya</p>
        <div class="h-tier-p">৳3,500</div>
        <ul><li>✓ Everything in Specialist</li><li>✓ Standardised baseline photographs</li><li>✓ Costed options for every route</li><li>✓ One follow-up within 30 days — included</li><li>✓ Two WhatsApp check-ins</li></ul>
      </article>
      <article class="h-tier sig">
        <h3>Signature Skin &amp; Hair Review</h3><p class="h-tier-min">60 minutes with Dr. Sumya</p>
        <div class="h-tier-p">৳6,000</div>
        <ul><li>✓ Everything in Comprehensive</li><li>✓ Full-body mole map or scalp trichoscopy</li><li>✓ Same-visit fungal &amp; Wood’s lamp tests</li><li>✓ Typed report for your records</li><li>✓ 3-month review message</li></ul>
      </article>
    </div>
    <p class="h-note">Follow-up within 30 days ৳1,200 · No package is sold at a first visit · Hospital-chamber fees follow each hospital’s tariff.</p>
  </div>
</section>

<section class="s-sec">
  <div class="wrap">
    <div class="s-head"><div><p class="eyebrow">Inside the Centre</p><h2>Built like a clinic, not a salon</h2></div>
      <a class="tlink" href="${href('/the-centre/')}">Take the tour →</a></div>
    <div class="h-rooms">
      <article><h3>Consultation suites</h3><p>Private, unhurried, with dermoscopy and magnified lighting.</p></article>
      <article><h3>Laser suite</h3><p>Interlocked door, eye protection, plume extraction.</p></article>
      <article><h3>In-house lab</h3><p>Same-visit fungal microscopy. PRP prepared in a closed system.</p></article>
    </div>
  </div>
</section>

<section class="h-dont">
  <div class="wrap">
    <div>
      <p class="eyebrow">Our ethical limits</p>
      <h2>Some treatments are not available here — at any price.</h2>
      <p>Saying no is part of good medicine. Here is what we don’t offer, and why.</p>
      <a class="btn btn-ghost-inv" href="${href('/what-we-do-not-offer/')}">Read the full list →</a>
    </div>
    <div class="h-dont-x">
      <div>Skin-whitening drips &amp; injections<span>No safety evidence; real harms</span></div>
      <div>Steroid creams without a diagnosis<span>Cause thinning and rebound</span></div>
      <div>“Instant fairness” packages<span>Skin tone is not a disease</span></div>
      <div>Treatment from a photo alone<span>Diagnosis needs examination</span></div>
      <div>Unregistered injectables<span>Only DGDA-registered products</span></div>
      <div>Guaranteed results<span>Honest ranges, not promises</span></div>
    </div>
  </div>
</section>

<section class="s-sec">
  <div class="wrap">
    <div class="s-head"><div><p class="eyebrow">Learn</p><h2>Written and reviewed by Dr. Sumya</h2></div>
      <a class="tlink" href="${href('/learn/')}">All articles →</a></div>
    <div class="h-learn">
      <article><p class="cat">Pigmentation</p><h3>Melasma is manageable, not curable — what actually works</h3><p class="by">6 min read · Reviewed by Dr. Sumya Pervin, FCPS</p></article>
      <article><p class="cat">Fungal infection</p><h3>Why ringworm keeps coming back — and the cream that makes it worse</h3><p class="by">5 min read · Reviewed by Dr. Sumya Pervin, FCPS</p></article>
      <article><p class="cat">Mole check</p><h3>The ABCDE rule — plus the palms, soles and nails rule for South Asian skin</h3><p class="by">4 min read · Reviewed by Dr. Sumya Pervin, FCPS</p></article>
    </div>
  </div>
</section>

<section class="h-final">
  <div class="wrap">
    <h2>Pick a day. We’ll send your serial, time window and what to bring.</h2>
    <div class="h-final-ctas">
      <a class="btn btn-ink" href="${href('/book/')}">Book a consultation</a>
      <a class="btn btn-ghost-inv" href="https://wa.me/${SITE.whatsapp}" rel="noopener">Ask on WhatsApp</a>
    </div>
  </div>
</section>`;
}
