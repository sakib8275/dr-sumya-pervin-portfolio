// Learn articles (docx §3.2 /learn/[slug], §3.4 launch set). The hub must link
// every article, and each article must carry the rulebook's primary condition
// link and a tool link.
import { test, expect } from './helpers/site.mjs';

const ARTICLES = [
  '/learn/melasma-manageable-not-curable/',
  '/learn/ringworm-keeps-coming-back/',
  '/learn/abcde-rule-brown-skin/',
  '/learn/laser-hair-removal-permanent/',
  '/learn/hair-fall-after-illness/',
  '/learn/arsenic-and-skin/',
];

test('the Learn hub links all six launch articles', async ({ page, site }) => {
  await page.goto(site.baseURL + '/learn/', { waitUntil: 'networkidle' });
  const hrefs = await page.locator('.cards a.card').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  for (const href of ARTICLES) expect(hrefs).toContain(href);
});

test('a Learn article renders with its primary condition and tool links', async ({ page, site }) => {
  await page.goto(site.baseURL + '/learn/abcde-rule-brown-skin/', { waitUntil: 'networkidle' });
  await expect(page.locator('h1')).toContainText('ABCDE');
  const related = page.locator('.article-links');
  await expect(related.locator('a[href="/conditions/skin-cancer/"]')).toHaveCount(1);
  await expect(related.locator('a[href="/tools/mole-check/"]')).toHaveCount(1);
});
