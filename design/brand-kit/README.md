# Brand kit

Everything the practice needs around the approved **Signature SP** mark: logo files, social images, the written-plan pad, letterhead, cards and chamber nameboards. Open `index.html` in a browser to see every piece with its download links and usage rules.

Every file here is generated. Do not edit the files directly: edit the source and rerun the build.

```sh
npm run build:brand-kit
```

| Source | What it controls |
|---|---|
| `content/brand.mjs` | The mark (the same paths the website draws) |
| `content/site.mjs` | Name, phone, domain, BMDC number, chambers |
| `functions/lib/schedule.js` | Days, hours and the same-day serial cutoff |
| `scripts/render-brand-kit.mjs` | Layout of every piece, and the printed title, specialty and qualifications |
| `type-paths.json` | The outlined name and descriptor in the logo SVGs |

When the name or the descriptor wording changes, regenerate `type-paths.json` first. This needs Python with `fonttools` and `uharfbuzz`:

```sh
python design/brand-kit/tools/outline-type.py
```

The fonts, Outfit and Hind Siliguri (both OFL), are downloaded once into `.cache/`, which git ignores.

A regeneration is reproducible: the PDFs carry a fixed date stamp (the build overwrites Chromium's wall-clock one), so a rerun that changes nothing leaves the tree clean. The preview PNGs can still differ by a few pixels of sub-pixel anti-aliasing with no visible change — such a diff can be discarded.

## Contents

| Folder | Files | Use |
|---|---|---|
| `logo/` | `mark`, `horizontal`, `stacked` × `indigo`, `reverse`, `black`, as SVG and PNG | The SVG type is outlined, so it prints correctly without Outfit installed. `reverse` is white, for Deep Nil or dark grounds. |
| `digital/` | `profile-1080.png` | WhatsApp Business, Facebook, Google Business Profile and Instagram. Drawn for the circle crop. |
| | `cover-facebook-1640x624.png` | Facebook page cover. The text stays inside the area phones keep. |
| | `post-chamber-hours-1080.png` | WhatsApp status or a pinned post. Rerender it when the hours change. |
| | `email-signature.html` | Open it in a browser, copy the rendered signature and paste it into the mail client's settings. |
| `print/` | `written-plan-a4.pdf` | The prescription and plan pad, in pads of 50 or 100 sheets. |
| | `letterhead-a4.pdf` | Referral letters and medical certificates. |
| | `visiting-card-89x51.pdf` | 3.5 × 2 in visiting card, front and back. |
| | `follow-up-card-89x51.pdf` | The next-visit card, filled in by hand at the desk. |
| | `nameboard-<chamber>-a3.pdf` | A3 landscape board for each chamber door. |

The print PDFs are trim size plus **3 mm bleed** on every side, with no crop marks. Tell the printer the trim size from the table, and ask for a printed proof on the chosen stock before the full run. The PDFs are RGB, so deep indigo shifts between presses. The smallest card labels sit at 5.4–6.6 pt, at the practical print floor — check them first on the proof.

## Decisions taken for the owner

Dr. Sumya delegated these decisions on 2026-10-04.

- **The mark is unchanged.** The curved skin contour was discussed and kept.
- **Printed credentials use only the confirmed wording:** Consultant Dermatologist; Skin, Hair, Nail, Allergy & Venereal Diseases; MBBS (SSMC) · DDV (BSMMU) · FCPS (Skin & VD); BMDC Reg. A-59492.
- **Lockup type is Outfit 500,** one step lighter than the site header, so the name weighs the same as the monoline mark.
- **The share card (`public/assets/og-card.png`) is flat Deep Nil,** with the radial glow removed, following DESIGN.md's "no gradient under text".

## Owner answers (2026-10-05)

- **Assistant Professor and BCS (Health) are not current.** Neither prints. PRODUCT.md, context.md and agent.md now record them as past roles.
- **No "MD".** She holds no MD degree. The unused `title` field in `content/site.mjs` dropped it; the rendered site title never carried it.
- **The qualifications line prints in the short form,** "MBBS (SSMC) · DDV (BSMMU) · FCPS (Skin & VD)", decided for the owner. It matches the website, so a patient sees the same line on the card as on the site. The years and "(BCPS)" would lengthen a line that already sits at the print floor on the cards, and FCPS is only ever awarded by BCPS, so naming it adds nothing. The long form stays in `content/source/website-content.md` for anywhere that wants the full history.

## Later

Not needed now, kept here so they are not forgotten.

1. **Bangla.** The follow-up card and nameboards would serve more patients with a Bangla line: name, "Consultant Dermatologist", the chamber days and hours. Needs her approval of the exact wording and the spelling of her name. Hind Siliguri is already in the kit for the Taka sign, so the Bangla face is ready.
2. **The Centre (2027).** Once the Centre has a name and an address: a Centre lockup (the SP mark with the Centre's name, or the Centre's own mark endorsed by hers), door and fascia signage, and a Centre version of the letterhead and cards. Not drawn now because the name, the signage size and the relationship between her name and the Centre's are not decided.
