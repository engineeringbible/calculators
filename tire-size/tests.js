/**
 * tire-size/tests.js — checks against the ISO 4000-1 / ETRTO design diameter, the flotation designation and the parser.
 * Run: node run-tests.js tire-size
 */
import { calculate, parseTire } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const MPH = 0.44704;

export const tests = [
  {
    name: '225/45R17: sidewall 225 × 0.45 = 101.25 mm, diameter 17 × 25.4 + 2 × 101.25 = 634.3 mm (24.97 in), 807.6 revs per mile',
    source: 'ISO 4000-1 design overall diameter D = d + 2 S × aspect / 100; hand calculation',
    run: () => {
      const o = calculate({ tire_a: '225/45R17', tire_b: '225/45R17' }).outputs;
      assertClose(o.sidewall_a_m * 1000, 101.25, { abs: 1e-9 }, 'sidewall');
      assertClose(o.dia_a_m * 1000, 634.3, { abs: 1e-9 }, 'diameter');
      assertClose(o.revs_mile_a, 807.61, { abs: 0.01 }, 'revs/mile');
      assertClose(o.revs_km_a, 1e6 / (Math.PI * 634.3), { rel: 1e-12 }, 'revs/km');
      assertEqual(o.dia_diff, 0, 'same size');
    },
  },
  {
    name: '225/45R17 to 245/40R18: 653.2 mm against 634.3 mm is 2.98 % taller; 60 mph on the speedometer is 61.8 mph true',
    source: 'Hand calculation, true speed = reading × D_B / D_A',
    run: () => {
      const o = calculate({ tire_a: '225/45R17', tire_b: '245/40R18', reading_m_s: 60 * MPH }).outputs;
      assertClose(o.dia_b_m * 1000, 653.2, { abs: 1e-9 }, 'diameter B');
      assertClose(o.dia_diff, 653.2 / 634.3 - 1, { rel: 1e-12 }, 'difference');
      assertClose(o.true_speed_m_s / MPH, 61.788, { abs: 0.001 }, 'true speed');
      assertClose(o.speedo_error, 634.3 / 653.2 - 1, { rel: 1e-12 }, 'speedometer error');
    },
  },
  {
    name: 'Flotation 33x12.50R15: 33 in tall, 12.5 in wide, 9 in sidewall; LT265/75R16 is 31.65 in',
    source: 'Tire and Rim Association flotation designation (diameter x width R rim, inches); ISO 4000-1 for LT-metric',
    run: () => {
      const f = parseTire('33x12.50R15LT', 'T');
      assertClose(f.diameter_m / IN, 33, { rel: 1e-12 }, 'diameter');
      assertClose(f.width_m / IN, 12.5, { rel: 1e-12 }, 'width');
      assertClose(f.sidewall_m / IN, 9, { rel: 1e-12 }, 'sidewall');
      assertClose(parseTire('LT265/75R16 123/120S', 'T').diameter_m / IN, 31.6496, { abs: 1e-4 }, 'LT');
    },
  },
  {
    name: 'The parser accepts P and ZR codes, lower case, spaces, dashes and load and speed indexes',
    source: 'Size designation formats of ISO 4000-1 and the Tire and Rim Association',
    run: () => {
      const ref = parseTire('225/45R17', 'T').diameter_m;
      for (const t of ['P225/45R17', 'p225/45zr17 94W', '225 45 17', '225/45-17', ' 225 / 45 R 17 ']) assertClose(parseTire(t, 'T').diameter_m, ref, { rel: 1e-12 }, t);
      assertClose(parseTire('275/40ZR18.5', 'T').rim_m / IN, 18.5, { rel: 1e-12 }, 'half-inch rim');
    },
  },
  {
    name: 'Unreadable codes, a missing aspect ratio and impossible sizes are rejected with a plain message; over 3 % warns',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ tire_a: 'abc' }), 'not a tire size code');
      assertThrows(() => calculate({ tire_b: '195R14' }), 'no aspect ratio');
      assertThrows(() => calculate({ tire_a: '225/45R40' }), 'rim diameter');
      assertThrows(() => calculate({ tire_a: '' }), 'enter a size code');
      assertThrows(() => calculate({ tire_b: '22x12.5R20' }), 'sidewall');
      assertEqual(calculate({ tire_a: '225/45R17', tire_b: '255/40R19' }).warnings.length, 1, 'warning');
    },
  },
];
