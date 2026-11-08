/**
 * eta-time-zones/tests.js — checks of the passage time, UTC conversion, date rollover, leap years and date-line crossings.
 * Run: node run-tests.js eta-time-zones
 */
import { calculate, daysFromCivil, civilFromDays, formatDateTime, parseDateTime } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Yokohama (UTC+9) 2026-11-08 14:00, 3 400 nmi at 15 kn: 9 d 10 h 40 min, ETA 2026-11-17 15:40 UTC = 05:40 local at UTC−10',
    source: 'Bowditch ch. 18 (zone time); hand calculation',
    run: () => {
      const o = calculate({ departure: '2026-11-08 14:00', dep_offset_h: 9, distance_nmi: 3400, speed_kn: 15, arr_offset_h: -10 }).outputs;
      assertEqual(o.passage_text, '9 d 10 h 40 min', 'duration');
      assertEqual(o.arrival_utc.startsWith('2026-11-17 15:40'), true, 'UTC');
      assertEqual(o.arrival_local.startsWith('2026-11-17 05:40'), true, 'local');
      assertEqual(o.clock_change_h, -19, 'clock change');
      assertEqual(o.clocks.includes('advanced 5 h') && o.clocks.includes('repeated'), true, 'eastbound across the date line');
    },
  },
  {
    name: 'Westbound over the date line, Honolulu (UTC−10) to Yokohama (UTC+9): clocks retarded 5 h and a day is skipped; 10 calendar days',
    source: 'Bowditch ch. 18 (date line: westbound, advance the date one day); hand calculation',
    run: () => {
      const o = calculate({ departure: '2026-11-08 14:00', dep_offset_h: -10, distance_nmi: 3400, speed_kn: 15, arr_offset_h: 9 }).outputs;
      assertEqual(o.arrival_local.startsWith('2026-11-18 19:40'), true, 'local');
      assertEqual(o.clocks.includes('retarded 5 h') && o.clocks.includes('skipped'), true, 'westbound');
      assertEqual(o.calendar_days, 10, 'calendar days');
    },
  },
  {
    name: 'Year and leap-day rollover: 2026-12-31 23:00 + 2 h is 2027-01-01 01:00; 2028-02-28 22:00 + 3 h is 2028-02-29 01:00',
    source: 'Gregorian calendar (2028 is a leap year); days-from-civil algorithm',
    run: () => {
      assertEqual(calculate({ departure: '2026-12-31 23:00', dep_offset_h: 0, arr_offset_h: 0, distance_nmi: 20, speed_kn: 10 }).outputs.arrival_local.startsWith('2027-01-01 01:00'), true, 'new year');
      assertEqual(calculate({ departure: '2028-02-28 22:00', dep_offset_h: 0, arr_offset_h: 0, distance_nmi: 30, speed_kn: 10 }).outputs.arrival_local.startsWith('2028-02-29 01:00'), true, 'leap day');
      assertEqual(daysFromCivil(1970, 1, 1), 0, 'epoch');
      assertEqual(daysFromCivil(2000, 3, 1) - daysFromCivil(2000, 2, 28), 2, '2000 is a leap year');
      assertEqual(daysFromCivil(2100, 3, 1) - daysFromCivil(2100, 2, 28), 1, '2100 is not');
      const c = civilFromDays(daysFromCivil(2031, 7, 15));
      assertEqual(`${c.y}-${c.m}-${c.d}`, '2031-7-15', 'round trip');
    },
  },
  {
    name: 'Weekdays: 1970-01-01 was a Thursday and 2000-03-01 a Wednesday',
    source: 'Calendar facts',
    run: () => {
      assertEqual(formatDateTime(parseDateTime('1970-01-01 00:00', 'x')), '1970-01-01 00:00 (Thu)', 'epoch');
      assertEqual(formatDateTime(parseDateTime('2000-03-01 12:30', 'x')), '2000-03-01 12:30 (Wed)', '2000');
    },
  },
  {
    name: 'Legs and stops: 120 nmi at 10 kn, 3 000 at 15 and 280 at 12 plus 6 h of stops is 241 h 20 min; India UTC+5.5 is handled',
    source: 'Hand calculation (12 + 200 + 23.333 + 6 h)',
    run: () => {
      const o = calculate({ basis: 'legs', legs: '120; 10\n3000; 15\n280; 12', stops_s: 6 * 3600, dep_offset_h: 5.5, arr_offset_h: 5.5, departure: '2026-01-01 00:00' }).outputs;
      assertClose(o.passage_s / 3600, 241.3333, { abs: 1e-4 }, 'hours');
      assertEqual(o.departure_utc.startsWith('2025-12-31 18:30'), true, 'UTC at +5:30');
      assertEqual(o.arrival_local.endsWith('UTC+5:30'), true, 'offset label');
    },
  },
  {
    name: 'Bad dates and legs are rejected: 2027-02-29, 24:10, a missing time and a leg without speed',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ departure: '2027-02-29 10:00' }), 'has 28 days');
      assertThrows(() => calculate({ departure: '2026-11-08 24:10' }), 'between 00:00 and 23:59');
      assertThrows(() => calculate({ departure: '2026-11-08' }), 'YYYY-MM-DD HH:MM');
      assertThrows(() => calculate({ basis: 'legs', legs: '200' }), 'distance in nmi; speed in knots');
    },
  },
];
