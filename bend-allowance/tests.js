/**
 * bend-allowance/tests.js — checks against the bend allowance geometry and the DIN 6935 correction factor.
 * Run: node run-tests.js bend-allowance
 */
import { calculate, dinK, bend, parseLegs } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;

export const tests = [
  {
    name: 'DIN 6935: K = 0.325 at R = T, 0.400 at R = 2T, 0.4997 just below R = 5T and 0.5 from 5T',
    source: 'DIN 6935: k = 0.65 + 0.5 log10(R/T), K = k/2',
    run: () => {
      assertClose(dinK(1), 0.325, { rel: 1e-12 }, 'R/T 1');
      assertClose(dinK(2), 0.40026, { abs: 0.00001 }, 'R/T 2');
      assertClose(dinK(4.999999), 0.49974, { abs: 0.00001 }, 'just below 5');
      assertClose(dinK(10), 0.5, { rel: 1e-12 }, 'R/T 10');
    },
  },
  {
    name: '2 mm sheet, R 2 mm, 90°, K 0.325: BA = 4.1626 mm, OSSB = 4 mm, BD = 3.8374 mm; channel 30/50/30 mm has a 102.33 mm blank',
    source: 'BA = θ(R + KT), OSSB = tan(θ/2)(R + T), BD = 2 OSSB − BA (hand calculation)',
    run: () => {
      const o = calculate({ thickness_m: 0.002, radius_m: 0.002, angle_deg: 90, leg_units: 'mm', legs: '30\n50\n30' }).outputs;
      assertClose(o.ba_m * 1000, 4.16261, { abs: 0.00001 }, 'BA');
      assertClose(o.ossb_m * 1000, 4, { abs: 1e-9 }, 'OSSB');
      assertClose(o.bd_m * 1000, 3.83739, { abs: 0.00001 }, 'BD');
      assertClose(o.flat_m * 1000, 102.32522, { abs: 0.00001 }, 'flat');
    },
  },
  {
    name: 'Consistency: the flat length equals the inside flat portions plus the bend allowances (L-bracket 2 × 1 in, 0.06 in sheet, R 0.06 in, K 0.44)',
    source: 'Flat = Σ(leg − setbacks) + Σ BA, the same blank measured two ways',
    run: () => {
      const T = 0.06 * IN;
      const R = 0.06 * IN;
      const o = calculate({ thickness_m: T, radius_m: R, k_mode: 'custom', k_factor: 0.44, leg_units: 'in', legs: '2\n1' }).outputs;
      const straight = (2 * IN - (R + T)) + (1 * IN - (R + T));
      assertClose(o.flat_m, straight + (Math.PI / 2) * (R + 0.44 * T), { rel: 1e-12 }, 'two ways');
    },
  },
  {
    name: 'Per-bend angles: a 45° bend has OSSB = tan 22.5° (R + T) and a smaller deduction than 90°; a 1° bend deducts under 1 % of a 90° bend',
    source: 'Bend geometry; limiting case θ → 0',
    run: () => {
      const b45 = bend(2, 2, 0.325, Math.PI / 4);
      assertClose(b45.ossb, Math.tan(Math.PI / 8) * 4, { rel: 1e-12 }, 'OSSB 45');
      const two = calculate({ thickness_m: 0.002, radius_m: 0.002, leg_units: 'mm', legs: '50; 45\n50' }).outputs;
      assertClose(two.flat_m * 1000, 100 - b45.bd, { rel: 1e-12 }, 'flat with 45°');
      assertEqual(bend(2, 2, 0.325, Math.PI / 180).bd < 0.01 * bend(2, 2, 0.325, Math.PI / 2).bd, true, '1° bend');
      assertEqual(parseLegs('10; 30\n20').length, 2, 'parser');
    },
  },
  {
    name: 'A 180° bend, a single leg, a bad number, a radius below 0.1 T with the DIN K-factor and a too-short leg are caught',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ angle_deg: 180 }), 'below 180');
      assertThrows(() => calculate({ legs: '25' }), 'at least two legs');
      assertThrows(() => calculate({ legs: '25\nabc' }), 'line 2');
      assertThrows(() => calculate({ radius_m: 0 }), 'enter your own K-factor');
      assertEqual(calculate({ legs: '0.05\n1' }).warnings.length, 1, 'short leg');
    },
  },
];
