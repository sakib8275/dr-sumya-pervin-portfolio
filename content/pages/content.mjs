// Phase 3 content registry: sitemap path → structured article content.
//
// One module per workstream keeps the transcription reviewable. Every key here
// must be a real sitemap path, and every `links` target must resolve to a built
// page (tests/pages.test.mjs enforces both indirectly via the link sweep).
import { conditions } from './content/conditions.mjs';
import { treatments } from './content/treatments.mjs';
import { aesthetic } from './content/aesthetic.mjs';
import { visit } from './content/visit.mjs';

export const CONTENT = {
  ...conditions,
  ...treatments,
  ...aesthetic,
  ...visit,
};
