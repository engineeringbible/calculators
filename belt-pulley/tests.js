/**
 * belt-pulley/tests.js — checks of the open and crossed belt geometry of Shigley eq. 17-1 and the speed relations.
 * Run: node run-tests.js belt-pulley
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Open belt 100/250 mm on 600 mm centres at 1 450 rpm: ratio 2.5, 580 rpm, 7.592 m/s, wrap 165.64°, L = 1 759.17 mm',
    source: "Shigley's Mechanical Engineering Design, 10th ed., eq. 17-1 (hand calculation)",
    run: () => {
      const o = calculate({ arrangement: 'open', d1_m: 0.1, d2_m: 0.25, c_m: 0.6, n1_rpm: 1450 }).outputs;
      assertClose(o.ratio, 2.5, { rel: 1e-12 }, 'ratio');
      assertClose(o.n2_rpm, 580, { rel: 1e-12 }, 'n2');
      assertClose(o.belt_speed_m_s, 7.5922, { abs: 1e-4 }, 'v');
      assertClose((o.wrap_small_rad * 180) / Math.PI, 165.639, { abs: 1e-3 }, 'wrap small');
      assertClose(o.length_m * 1000, 1759.166, { abs: 1e-3 }, 'L');
    },
  },
  {
    name: 'Crossed belt, same pulleys: wrap 213.92° on both, L = √(1.44 − 0.1225) + 0.175 × 3.7335 = 1 801.19 mm',
    source: "Shigley eq. 17-1, crossed belt (hand calculation)",
    run: () => {
      const o = calculate({ arrangement: 'crossed', d1_m: 0.1, d2_m: 0.25, c_m: 0.6 }).outputs;
      assertClose((o.wrap_small_rad * 180) / Math.PI, 213.9155, { abs: 1e-3 }, 'wrap');
      assertClose(o.length_m * 1000, 1801.192, { abs: 1e-3 }, 'L');
    },
  },
  {
    name: 'Equal pulleys: open length is 2C + π d and both wraps are 180°',
    source: 'Limiting case of eq. 17-1 with D = d',
    run: () => {
      const o = calculate({ d1_m: 0.2, d2_m: 0.2, c_m: 1 }).outputs;
      assertClose(o.length_m, 2 + Math.PI * 0.2, { rel: 1e-12 }, 'L');
      assertClose(o.wrap_small_rad, Math.PI, { rel: 1e-12 }, 'wrap');
      assertClose(o.span_m, 1, { rel: 1e-12 }, 'span');
    },
  },
  {
    name: 'Slip: 2 % slip lowers 580 rpm to 568.4 rpm; swapping driver and driven gives the inverse ratio and the same belt length',
    source: 'n₂ = n₁ d₁/d₂ (1 − s); the belt geometry is symmetric in the two pulleys',
    run: () => {
      assertClose(calculate({ slip: 0.02 }).outputs.n2_rpm, 568.4, { rel: 1e-12 }, 'slip');
      const a = calculate({ d1_m: 0.1, d2_m: 0.25 }).outputs;
      const b = calculate({ d1_m: 0.25, d2_m: 0.1 }).outputs;
      assertClose(b.ratio, 0.4, { rel: 1e-12 }, 'ratio');
      assertClose(b.length_m, a.length_m, { rel: 1e-12 }, 'L');
    },
  },
  {
    name: 'A short centre distance warns of low wrap (100/400 mm on 280 mm: 115°); overlapping pulleys and zero speed are rejected',
    source: 'Validation contract',
    run: () => {
      const r = calculate({ d1_m: 0.1, d2_m: 0.4, c_m: 0.28 });
      assertEqual(r.warnings.some((w) => w.includes('120°')), true, 'wrap warning');
      assertThrows(() => calculate({ d1_m: 0.3, d2_m: 0.5, c_m: 0.35 }), 'Centre distance');
      assertThrows(() => calculate({ n1_rpm: 0 }), 'Driver speed');
    },
  },
];
