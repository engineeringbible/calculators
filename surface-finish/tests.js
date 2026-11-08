/**
 * surface-finish/tests.js — checks against the ISO 1302 grade table, unit definitions and the ideal turning finish.
 * Run: node run-tests.js surface-finish
 */
import { calculate, nGrade, gradeRa } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Grade table: N7 = 1.6 µm (63 µin), N9 = 6.3 µm, N12 = 50 µm (2 000 µin), N1 = 0.025 µm (1 µin)',
    source: 'Machinery\'s Handbook 31st ed., Surface Texture, Table 4 (previous ISO 1302 grade numbers)',
    run: () => {
      assertEqual(gradeRa(7), 1.6, 'N7');
      assertEqual(gradeRa(9), 6.3, 'N9');
      assertEqual(gradeRa(12), 50, 'N12');
      assertEqual(gradeRa(1), 0.025, 'N1');
      const o = calculate({ given: 'n', value: 12 }).outputs;
      assertEqual(o.grade, 'N12 (Ra 50 µm, 2000 µin)', 'N12 text');
    },
  },
  {
    name: 'Units: 63 µin Ra is 1.6002 µm (1 µin = 0.0254 µm) and grade N7; 3.2 µm is 126 µin and N8',
    source: 'Definition 1 in = 25.4 mm',
    run: () => {
      const a = calculate({ given: 'ra_uin', value: 63 }).outputs;
      assertClose(a.ra_m * 1e6, 1.6002, { rel: 1e-12 }, '63 µin');
      assertEqual(a.grade.startsWith('N7 '), true, 'N7');
      const b = calculate({ given: 'ra_um', value: 3.2 }).outputs;
      assertClose(b.ra_uin, 125.98, { abs: 0.01 }, '3.2 µm');
      assertEqual(nGrade(3.2), 8, 'N8');
    },
  },
  {
    name: 'RMS: a sine profile has Rq / Ra = π / (2√2) = 1.1107, so 63 µin Ra is 70.0 µin RMS; the conversion inverts exactly',
    source: 'Sine profile: Ra = 2A/π, Rq = A/√2 (ISO 4287 definitions)',
    run: () => {
      const o = calculate({ given: 'ra_uin', value: 63 }).outputs;
      assertClose(o.rq_uin / o.ra_uin, 1.110721, { abs: 0.000001 }, 'ratio');
      assertClose(o.rq_uin, 69.975, { abs: 0.001 }, 'RMS');
      assertClose(calculate({ given: 'rq_uin', value: o.rq_uin }).outputs.ra_uin, 63, { rel: 1e-12 }, 'round trip');
    },
  },
  {
    name: 'Turning: f = 0.2 mm, r = 0.8 mm gives R_t = 6.25 µm and Ra = 0.0321 f²/r = 1.60 µm; halving the feed quarters both',
    source: 'Boothroyd and Knight, Fundamentals of Machining and Machine Tools: R_t = f²/(8 r), Ra = 0.0321 f²/r',
    run: () => {
      const o = calculate({ mode: 'turning', feed_m: 0.0002, radius_m: 0.0008 }).outputs;
      assertClose(o.rt_m * 1e6, 6.25, { rel: 1e-12 }, 'Rt');
      assertClose(o.ra_m * 1e6, (0.0321 * 0.04) / 0.8 * 1000, { rel: 0.001 }, 'Ra (0.0321)');
      const h = calculate({ mode: 'turning', feed_m: 0.0001, radius_m: 0.0008 }).outputs;
      assertClose(h.ra_m, o.ra_m / 4, { rel: 1e-12 }, 'feed squared');
    },
  },
  {
    name: 'A grade outside 1–12, a feed of twice the nose radius and a negative value are rejected; a fractional grade is rounded with a warning; a feed above the radius and an Rz input warn',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ given: 'n', value: 13 }), 'N1 to N12');
      assertEqual(calculate({ given: 'n', value: 7.4 }).warnings.length, 1, 'rounded grade');
      assertThrows(() => calculate({ mode: 'turning', feed_m: 0.0016, radius_m: 0.0008 }), 'twice the nose radius');
      assertThrows(() => calculate({ value: -1 }), 'Value');
      assertEqual(calculate({ mode: 'turning', feed_m: 0.001, radius_m: 0.0008 }).warnings.length, 1, 'feed > r');
      assertEqual(calculate({ given: 'rz_um', value: 10 }).warnings.length, 1, 'Rz');
    },
  },
];
