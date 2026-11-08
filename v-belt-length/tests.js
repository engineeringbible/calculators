/**
 * v-belt-length/tests.js — checks of Shigley eqs. 17-16a/b against the exact open-belt geometry.
 * Run: node run-tests.js v-belt-length
 */
import { calculate, approxLength, exactLength, approxCentre } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Sheaves 100 and 250 mm on 600 mm centres: L_p = 1 200 + 549.779 + 9.375 = 1 759.154 mm; exact 1 759.166 mm',
    source: "Shigley's Mechanical Engineering Design, 10th ed., eq. 17-16a and eq. 17-1 (hand calculation)",
    run: () => {
      const o = calculate({ mode: 'length', d_small_m: 0.1, d_large_m: 0.25, c_m: 0.6 }).outputs;
      assertClose(o.length_approx_m * 1000, 1759.154, { abs: 1e-3 }, 'approx');
      assertClose(o.length_exact_m * 1000, 1759.166, { abs: 1e-3 }, 'exact');
      assertClose(o.error_m * 1000, -0.0123, { abs: 1e-4 }, 'difference');
    },
  },
  {
    name: 'Centre distance for an 1 800 mm belt: ¼ {1 250.221 + √(1 250.221² − 2 × 150²)} = 620.579 mm; exact 620.573 mm',
    source: 'Shigley eq. 17-16b; exact inverse of eq. 17-1 by bisection (hand calculation)',
    run: () => {
      const o = calculate({ mode: 'centre', d_small_m: 0.1, d_large_m: 0.25, belt_m: 1.8 }).outputs;
      assertClose(o.centre_approx_m * 1000, 620.579, { abs: 1e-3 }, 'approx C');
      assertClose(o.centre_exact_m * 1000, 620.573, { abs: 1e-3 }, 'exact C');
      assertClose(exactLength(0.25, 0.1, o.centre_exact_m), 1.8, { rel: 1e-12 }, 'round trip');
    },
  },
  {
    name: 'Equal sheaves: approximate and exact formulas agree exactly, L = 2C + π d',
    source: 'Limiting case D = d of eqs. 17-16a and 17-1',
    run: () => {
      assertClose(approxLength(0.2, 0.2, 1), 2 + 0.2 * Math.PI, { rel: 1e-12 }, 'approx');
      assertClose(exactLength(0.2, 0.2, 1), 2 + 0.2 * Math.PI, { rel: 1e-12 }, 'exact');
      assertClose(approxCentre(0.2, 0.2, 2 + 0.2 * Math.PI), 1, { rel: 1e-12 }, 'inverse');
    },
  },
  {
    name: 'The approximation error grows with the diameter difference: 100/500 mm on 400 mm centres differs by more than 1 mm',
    source: 'Series truncation of eq. 17-16a against eq. 17-1',
    run: () => {
      const small = Math.abs(approxLength(0.25, 0.1, 0.6) - exactLength(0.25, 0.1, 0.6));
      const large = Math.abs(approxLength(0.5, 0.1, 0.4) - exactLength(0.5, 0.1, 0.4));
      assertEqual(large > 1e-3 && large > 50 * small, true, 'growth');
    },
  },
  {
    name: 'Approximate inverse is the exact inverse of the approximate length (eq. 17-16b solves 17-16a)',
    source: 'Algebra of eqs. 17-16a and 17-16b',
    run: () => {
      const L = approxLength(0.315, 0.125, 0.75);
      assertClose(approxCentre(0.315, 0.125, L), 0.75, { rel: 1e-12 }, 'C');
    },
  },
  {
    name: 'Too short a belt, overlapping sheaves and D smaller than d are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ mode: 'centre', belt_m: 0.8 }), 'Belt pitch length');
      assertThrows(() => calculate({ mode: 'length', c_m: 0.15 }), 'Centre distance');
      assertThrows(() => calculate({ d_small_m: 0.3, d_large_m: 0.2 }), 'Large sheave');
    },
  },
];
