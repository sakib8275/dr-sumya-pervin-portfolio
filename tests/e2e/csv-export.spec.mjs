// A3 regression — the appointments CSV export must survive hostile patient input.
//
// Every field in this file except the id, date and status is unauthenticated
// patient input, and its reader is the doctor opening it in Excel or Google
// Sheets. The old export concatenated '"' + value + '"' and pushed the whole
// document through encodeURI() into a data: URL, which left three defects:
//
//   1. '#' is not escaped by encodeURI, so it started a URL fragment and the
//      file was silently TRUNCATED from that point on. The doctor received a
//      short spreadsheet with no error anywhere.
//   2. An embedded '"' was not doubled, so it closed the field early and shifted
//      every remaining column in that row.
//   3. A value starting =, +, - or @ is evaluated as a FORMULA on open --
//      code execution in the doctor's spreadsheet, triggered by anyone who can
//      book an appointment.
//
// This drives the real button and reads the real downloaded bytes, because all
// three defects lived in the serialisation, not in anything the API could catch.
import { readFile } from 'node:fs/promises';
import { test, expect, stubTurnstile } from './helpers/site.mjs';
import { nextOpenDate, addDays, dhakaParts } from '../../functions/lib/schedule.js';

const CHAMBER = 'Alliance Hospital Limited (Shyamoli)';

// One patient, three attacks, plus a Bengali name for the encoding check.
const HOSTILE_NAME = '=HYPERLINK("http://evil.test","Click")';
const HOSTILE_NOTES = 'Rash on back #2 area, "itchy" at night, +1 week';
const BENGALI_NAME = 'নুসরাত জাহান';

async function book(page, baseURL, { name, phone, notes, date }) {
  await page.goto(baseURL + '/book/', { waitUntil: 'networkidle' });
  await page.fill('#sbName', name);
  await page.fill('#sbPhone', phone);
  await page.selectOption('#sbTier', 'Specialist Consultation');
  await page.selectOption('#sbChamber', CHAMBER);
  await page.fill('#sbDate', date);
  if (notes) await page.fill('#sbNotes', notes);
  await page.click('#sbSubmit');
  await expect(page.locator('#sbConfirm')).toContainText('Request received');
}

test('the CSV export survives quotes, hashes, formulas and non-ASCII names', async ({ page, site }) => {
  await stubTurnstile(page);

  await book(page, site.baseURL, { name: HOSTILE_NAME, phone: '01711000001', notes: HOSTILE_NOTES, date: nextOpenDate(CHAMBER, addDays(dhakaParts().dateStr, 1)) });
  await book(page, site.baseURL, { name: BENGALI_NAME, phone: '01711000002', notes: 'Follow-up', date: nextOpenDate(CHAMBER, addDays(dhakaParts().dateStr, 2)) });

  await page.goto(site.baseURL + '/admin/', { waitUntil: 'networkidle' });
  await page.locator('#cmsPinInput').fill(site.pin);
  await page.locator('#submitPin').click();
  await page.locator('#cmsMainSection').waitFor({ state: 'visible' });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#exportAppointmentsCSV').click()
  ]);
  const raw = (await readFile(await download.path())).toString('utf8');

  // --- 1. Nothing was truncated. Both rows must be present in full ---------
  expect(raw, 'the file was truncated -- the # in the notes started a URL fragment')
    .toContain('#2 area');
  const dataLines = raw.trim().split('\r\n').slice(1);
  expect(dataLines.length, 'both bookings must appear').toBe(2);

  // --- 2. Quotes are doubled, so the row still parses ----------------------
  expect(raw).toContain('""itchy""');

  // --- 3. The formula is neutralised -------------------------------------
  // Checked on the raw bytes only for the prefix itself; the full value cannot
  // be compared raw because its own quotes are (correctly) doubled. The
  // round-trip assertion at the end of this test is what proves the value
  // survives intact.
  expect(raw, 'a leading = must be prefixed with an apostrophe so Excel treats it as text')
    .toContain(`"'=HYPERLINK(`);

  // --- 4. UTF-8 BOM, so Excel does not mangle the Bengali name ------------
  expect(raw.charCodeAt(0), 'a UTF-8 BOM must lead the file').toBe(0xfeff);
  expect(raw).toContain(BENGALI_NAME);

  // --- 5. The result is genuinely well-formed CSV --------------------------
  // Parse it back and check the column count of every row. This is the
  // assertion that would have caught the unescaped-quote column shift.
  const parse = (line) => {
    const out = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };

  const header = parse(raw.slice(1).split('\r\n')[0]);
  expect(header.length).toBe(9);
  for (const line of dataLines) {
    expect(parse(line).length, `row has the wrong column count: ${line}`).toBe(9);
  }

  // Every hostile value must round-trip byte-for-byte once parsed -- the point
  // of escaping is that the doctor still reads exactly what the patient typed.
  const rows = dataLines.map(parse);
  expect(rows.map(r => r[6]), 'notes must round-trip with its # and quotes intact')
    .toContain(HOSTILE_NOTES);
  expect(rows.map(r => r[1]), 'the name must round-trip, apostrophe-prefixed and otherwise unchanged')
    .toContain(`'${HOSTILE_NAME}`);
  expect(rows.map(r => r[1]), 'the Bengali name must round-trip unchanged')
    .toContain(BENGALI_NAME);
});
