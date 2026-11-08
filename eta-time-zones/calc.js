/**
 * eta-time-zones/calc.js — passage ETA across time zones: from the departure date and time with its UTC offset, the
 * distance and speed (or legs at different speeds) and any stops, the arrival in UTC and in the local time of the
 * destination, the passage time, the calendar days, the net clock change and the date-line crossing.
 *
 * t = Σ d_i / V_i + stops;  UTC_dep = local_dep − offset_dep;  UTC_arr = UTC_dep + t;  local_arr = UTC_arr + offset_arr.
 * Clock change = offset_arr − offset_dep (+ = clocks advanced). Dates by the proleptic Gregorian calendar
 * (days-from-civil algorithm, no Date object). Schema units: nmi, kn, s, hours for offsets.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Days since 1970-01-01 of a Gregorian date (H. Hinnant, chrono-compatible low-level date algorithms). */
export function daysFromCivil(y, m, d) {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Gregorian date of a day count since 1970-01-01. */
export function civilFromDays(z) {
  const zz = z + 719468;
  const era = Math.floor(zz / 146097);
  const doe = zz - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  return { y: era * 400 + yoe + (m <= 2 ? 1 : 0), m, d };
}

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInMonth = (y, m) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
const pad = (n) => String(n).padStart(2, '0');

/** Minutes since 1970-01-01 00:00 of a "YYYY-MM-DD HH:MM" text; throws a readable error otherwise. */
export function parseDateTime(text, label) {
  const match = String(text).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T]+(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error(`${label}: write the date and time as YYYY-MM-DD HH:MM, for example 2026-11-08 14:30.`);
  const [y, mo, d, h, mi] = match.slice(1).map(Number);
  if (y < 1900 || y > 2200) throw new Error(`${label}: the year must be between 1900 and 2200.`);
  if (mo < 1 || mo > 12) throw new Error(`${label}: the month must be 1 to 12.`);
  if (d < 1 || d > daysInMonth(y, mo)) throw new Error(`${label}: ${y}-${pad(mo)} has ${daysInMonth(y, mo)} days.`);
  if (h > 23 || mi > 59) throw new Error(`${label}: the time must be between 00:00 and 23:59.`);
  return daysFromCivil(y, mo, d) * 1440 + h * 60 + mi;
}

/** "YYYY-MM-DD HH:MM (Day)" of a minute count since 1970-01-01. */
export function formatDateTime(minutes) {
  const total = Math.round(minutes);
  const days = Math.floor(total / 1440);
  const rest = total - days * 1440;
  const { y, m, d } = civilFromDays(days);
  const weekday = WEEKDAYS[((days % 7) + 11) % 7];
  return `${y}-${pad(m)}-${pad(d)} ${pad(Math.floor(rest / 60))}:${pad(rest % 60)} (${weekday})`;
}

const formatOffset = (h) => {
  const sign = h < 0 ? '−' : '+';
  const a = Math.abs(h);
  const hh = Math.floor(a + 1e-9);
  const mm = Math.round((a - hh) * 60);
  return `UTC${sign}${hh}${mm ? `:${pad(mm)}` : ''}`;
};

const formatHours = (h) => {
  const a = Math.abs(h);
  const hh = Math.floor(a + 1e-9);
  const mm = Math.round((a - hh) * 60);
  return mm ? `${hh} h ${mm} min` : `${hh} h`;
};

/** "9 d 10 h 40 min" of a duration in minutes. */
export function formatDuration(minutes) {
  const total = Math.round(minutes);
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const mi = total % 60;
  return `${d ? `${d} d ` : ''}${h} h ${pad(mi)} min`;
}

/** Parses "distance; speed" lines into legs in nmi and kn. */
export function parseLegs(text) {
  const legs = [];
  String(text).split(/\r?\n/).forEach((raw, k) => {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) return;
    const parts = line.split(/[;\t]/).map((p) => p.trim());
    if (parts.length !== 2) throw new Error(`Legs, line ${k + 1}: write "distance in nmi; speed in knots", for example 240; 12.5`);
    const dist = Number(parts[0]);
    const speed = Number(parts[1]);
    if (!Number.isFinite(dist) || dist <= 0) throw new Error(`Legs, line ${k + 1}: the distance "${parts[0]}" must be a number above zero.`);
    if (!Number.isFinite(speed) || speed <= 0 || speed > 100) throw new Error(`Legs, line ${k + 1}: the speed "${parts[1]}" must be a number above zero and at most 100 kn.`);
    legs.push({ dist, speed });
  });
  if (!legs.length) throw new Error('Legs: enter at least one line "distance; speed".');
  return legs;
}

export const schema = {
  id: 'eta-time-zones',
  name: 'ETA calculator with time zones',
  category: 'maritime',
  summary: 'Passage ETA in local time at the destination from departure time and UTC offset, distance and speed, with clock changes and the date line.',
  related: ['passage-plan', 'great-circle-distance', 'boat-fuel', 'fuel-voyage-cost'],
  assumptions: [
    'Offsets are hours from UTC as the clocks show them, east positive: UTC+9 is 9, UTC−5 is −5, India 5.5. A ship\'s zone description has the opposite sign (ZD −9 for UTC+9).',
    'The passage time is distance ÷ speed for each leg plus the stops entered. Speed is the planned speed over the ground: allow for current, weather and slow steaming separately.',
    'The arrival time in UTC and in the destination\'s local time does not depend on where the clocks are changed on the way; only the description of the clock changes uses the route direction.',
    'With direction "automatic" the route is taken as the shorter way round: a net clock change of more than 12 hours means the ship crosses the International Date Line. Eastbound the date is repeated, westbound a day is skipped.',
    'Daylight saving time is not applied automatically: enter the offset in force at departure and at arrival (for example UTC+1 in winter and UTC+2 in summer for Central Europe).',
  ],
  notes: [
    'Verification 2026-11-08: Yokohama (UTC+9) 2026-11-08 14:00 for 3 400 nmi at 15 kn is 226 h 40 min (9 d 10 h 40 min): UTC 05:00 + 226 h 40 min = 2026-11-17 15:40 UTC, which is 2026-11-17 05:40 at UTC−10. The net clock change is −19 h: eastbound, clocks advanced 5 h and the date repeated once. Checked by hand.',
    'Design decision: dates are computed with the days-from-civil algorithm rather than the JavaScript Date object, which calc.js files may not use; leap years and the Gregorian century rule are tested.',
  ],
  sources: [
    'Bowditch, The American Practical Navigator, NGA Pub. 9 (2019), ch. 18 Time: zone time, zone description and the date line',
    'IMO Resolution A.893(21), Guidelines for voyage planning (1999): planned speeds and ETAs',
    'H. Hinnant, chrono-Compatible Low-Level Date Algorithms (days_from_civil, civil_from_days), 2013',
  ],
  inputs: [
    { id: 'departure', label: 'Departure, local time (YYYY-MM-DD HH:MM)', type: 'textarea', rows: 1, default: '2026-11-08 14:00' },
    { id: 'dep_offset_h', label: 'Departure UTC offset, hours (UTC+9 → 9, UTC−5 → −5)', group: 'dimensionless', unit: 'none', default: 9, min: -12, max: 14 },
    {
      id: 'basis', label: 'Speed', type: 'select', default: 'single',
      options: [{ value: 'single', label: 'One distance at one speed' }, { value: 'legs', label: 'Legs at different speeds' }],
    },
    { id: 'distance_nmi', label: 'Distance', group: 'length', unit: 'nmi', default: 3400, min: 0.1, max: 30000, visibleWhen: { basis: 'single' } },
    { id: 'speed_kn', label: 'Speed over the ground', group: 'speed', unit: 'kn', default: 15, min: 0.1, max: 100, visibleWhen: { basis: 'single' } },
    { id: 'legs', label: 'Legs (one per line: distance nmi; speed kn)', type: 'textarea', rows: 5, default: '120; 10\n3000; 15\n280; 12', visibleWhen: { basis: 'legs' } },
    { id: 'stops_s', label: 'Stops and delays on the way', group: 'time', unit: 's', display: 'h', default: 0, min: 0, max: 3.1536e7 },
    { id: 'arr_offset_h', label: 'Arrival UTC offset, hours', group: 'dimensionless', unit: 'none', default: -10, min: -12, max: 14 },
    {
      id: 'direction', label: 'Direction of the passage', type: 'select', default: 'auto',
      options: [
        { value: 'auto', label: 'Automatic (the shorter way round)' },
        { value: 'east', label: 'Eastbound' },
        { value: 'west', label: 'Westbound' },
      ],
    },
  ],
  outputs: [
    { id: 'passage_s', label: 'Passage time', group: 'time', unit: 's', display: 'h', decimals: 1 },
    { id: 'passage_text', label: 'Passage time (days, hours, minutes)', type: 'text' },
    { id: 'departure_utc', label: 'Departure in UTC', type: 'text' },
    { id: 'arrival_utc', label: 'ETA in UTC', type: 'text' },
    { id: 'arrival_local', label: 'ETA in local time at the destination', type: 'text' },
    { id: 'arrival_ship', label: 'ETA if the ship kept departure time', type: 'text' },
    { id: 'clock_change_h', label: 'Net clock change, hours (+ advanced, − retarded)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'clocks', label: 'Clock changes on the way', type: 'text' },
    { id: 'calendar_days', label: 'Calendar days from the departure date to the arrival date (local)', group: 'dimensionless', unit: 'none', decimals: 0 },
  ],
  example: {
    inputs: { departure: '2026-11-08 14:00', dep_offset_h: 9, basis: 'single', distance_nmi: [3400, 'nmi'], speed_kn: [15, 'kn'], stops_s: [0, 'h'], arr_offset_h: -10, direction: 'auto' },
    results: { passage_s: '226.7 h' },
  },
};

function describeClocks(diff, direction) {
  let dir = direction;
  if (dir === 'auto') dir = Math.abs(diff) <= 12 ? (diff >= 0 ? 'east' : 'west') : (diff < 0 ? 'east' : 'west');
  if (Math.abs(diff) < 1e-9 && direction === 'auto') return { text: 'No clock change: same zone time at both ends.', odd: false };
  if (dir === 'east') {
    if (diff >= 0) return { text: `Eastbound: clocks advanced ${formatHours(diff)} in total, no date-line crossing.`, odd: false };
    const advance = diff + 24;
    return { text: `Eastbound across the date line: clocks advanced ${formatHours(advance)} in zone steps, and the date is repeated once (one day of 48 hours on the calendar).`, odd: advance < 0 };
  }
  if (diff <= 0) return { text: `Westbound: clocks retarded ${formatHours(-diff)} in total, no date-line crossing.`, odd: false };
  const retard = 24 - diff;
  return { text: `Westbound across the date line: clocks retarded ${formatHours(retard)} in zone steps, and one calendar day is skipped.`, odd: retard < 0 };
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.basis, ['single', 'legs'], 'basis', 'Speed');
  assertOneOf(x.direction, ['auto', 'east', 'west'], 'direction', 'Direction');
  const dep = parseDateTime(x.departure, 'Departure');
  const a = assertRange(x.dep_offset_h, -12, 14, 'dep_offset_h', 'Departure UTC offset');
  const b = assertRange(x.arr_offset_h, -12, 14, 'arr_offset_h', 'Arrival UTC offset');
  const stopsH = assertNonNegative(x.stops_s, 'stops_s', 'Stops and delays') / 3600;
  let hours;
  if (x.basis === 'single') {
    const dist = assertPositive(x.distance_nmi, 'distance_nmi', 'Distance');
    const v = assertPositive(x.speed_kn, 'speed_kn', 'Speed over the ground');
    hours = dist / v;
  } else {
    hours = parseLegs(x.legs).reduce((s, leg) => s + leg.dist / leg.speed, 0);
  }
  hours += stopsH;
  const warnings = [];
  if (hours > 24 * 365) throw new Error('Passage time: more than a year. Check the distance and speed.');
  const depUtc = dep - a * 60;
  const arrUtc = depUtc + hours * 60;
  const arrLocal = arrUtc + b * 60;
  const arrShip = arrUtc + a * 60;
  const diff = b - a;
  const clocks = describeClocks(diff, x.direction);
  if (clocks.odd) warnings.push('The offsets and the chosen direction do not fit a normal route: check both offsets and the direction.');
  if ([a, b].some((o) => Math.abs(o * 4 - Math.round(o * 4)) > 1e-9)) warnings.push('An offset is not a whole number of quarter hours: real time zones are whole, half or three-quarter hours.');
  const localDay = (minutes) => Math.floor(Math.round(minutes) / 1440);
  return {
    outputs: {
      passage_s: hours * 3600,
      passage_text: formatDuration(hours * 60),
      departure_utc: `${formatDateTime(depUtc)} UTC`,
      arrival_utc: `${formatDateTime(arrUtc)} UTC`,
      arrival_local: `${formatDateTime(arrLocal)} ${formatOffset(b)}`,
      arrival_ship: `${formatDateTime(arrShip)} ${formatOffset(a)}`,
      clock_change_h: diff,
      clocks: clocks.text,
      calendar_days: localDay(arrLocal) - localDay(dep),
    },
    warnings,
  };
}
