// Chamber schedules and the same-day booking cutoff.
//
// Rule (owner requirement, 2026-08-02): bookings for a chamber close 30 minutes
// before that chamber's consultation starts, and are only taken on days the
// chamber actually consults. The daily digest email for each chamber is sent
// after its cutoff -- this module is the single source of truth for both.
//
// Dhaka is UTC+6 year-round (no DST), so a fixed offset is exact, not an
// approximation. Every computation below is done in Dhaka wall-clock terms:
// a patient booking "today" means today in Dhaka, wherever the server runs.
const DHAKA_OFFSET_MIN = 6 * 60;
export const CUTOFF_MIN = 30;

// Keys are the exact <option value> strings the booking form posts
// (public/index.html chamberSelect). Days are Dhaka weekdays, 0 = Sunday.
export const CHAMBERS = {
  'Alliance Hospital Limited (Shyamoli)': {
    short: 'Alliance Hospital',
    days: [6, 0, 1, 2, 3, 4], // Saturday – Thursday
    startMin: 17 * 60,        // 5:00 PM
    scheduleLabel: 'Saturday – Thursday, 5:00 PM – 8:00 PM'
  },
  'Dhaka Central International Medical College (DCIMCH)': {
    short: 'DCIMCH',
    days: [6, 0, 1, 2, 3], // Saturday – Wednesday
    startMin: 15 * 60,     // 3:00 PM
    scheduleLabel: 'Saturday – Wednesday, 3:00 PM – 5:00 PM'
  }
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MS = 24 * 60 * 60 * 1000;

// Dhaka wall-clock parts for an instant: the calendar date as YYYY-MM-DD and
// minutes since Dhaka midnight.
export function dhakaParts(now = new Date()) {
  const shifted = new Date(now.getTime() + DHAKA_OFFSET_MIN * 60 * 1000);
  return {
    dateStr: shifted.toISOString().slice(0, 10),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes()
  };
}

export function weekdayOf(dateStr) {
  return new Date(dateStr + 'T00:00:00Z').getUTCDay();
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return new Date(d.getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

function fmtTime(minutes) {
  const h24 = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, '0');
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${m} ${h24 < 12 ? 'AM' : 'PM'}`;
}

// The first date on or after fromDateStr (YYYY-MM-DD) the chamber consults.
// Guaranteed to terminate: days arrays are non-empty, so at most 7 scans.
export function nextOpenDate(chamber, fromDateStr) {
  for (let i = 0; i < 8; i++) {
    const candidate = addDays(fromDateStr, i);
    if (CHAMBERS[chamber].days.includes(weekdayOf(candidate))) return candidate;
  }
  return fromDateStr; // unreachable with non-empty days
}

// Returns null when the slot can be booked, or a patient-facing error message.
// now is injectable so the boundary cases are deterministically testable.
export function validateSlot(chamber, dateStr, now = new Date()) {
  const c = CHAMBERS[chamber];
  if (!c) return 'Please choose one of the listed chambers.';

  const today = dhakaParts(now);
  if (dateStr < today.dateStr) {
    return 'That date has already passed. Please choose an upcoming date.';
  }

  if (!c.days.includes(weekdayOf(dateStr))) {
    const next = nextOpenDate(chamber, addDays(dateStr, 1));
    return `Dr. Pervin does not consult at ${c.short} on ${WEEKDAYS[weekdayOf(dateStr)]}s ` +
      `(${c.scheduleLabel}). The next available date is ${next}.`;
  }

  if (dateStr === today.dateStr && today.minutes >= c.startMin - CUTOFF_MIN) {
    const next = nextOpenDate(chamber, addDays(dateStr, 1));
    return `Same-day bookings for ${c.short} close at ${fmtTime(c.startMin - CUTOFF_MIN)}, ` +
      `${CUTOFF_MIN} minutes before consultation starts. The next available date is ${next}.`;
  }

  return null;
}
