/**
 * coil-inductance/tests.js — checks against Wheeler's formulas, Nagaoka's tabulated coefficients and μ0 N² A / l.
 * Run: node run-tests.js coil-inductance
 */
import { calculate, nagaoka } from './calc.js';
import { assertClose, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;

export const tests = [
  {
    name: 'Single layer, 1 in by 1 in, 20 turns: Wheeler 400/58 = 6.897 µH; current sheet 0.6884 × 10.03 = 6.903 µH (within 0.1 %)',
    source: 'Wheeler, Proc. IRE 16 (1928) single-layer formula; Nagaoka (1909) coefficient for d/l = 1',
    run: () => {
      const o = calculate({ type: 'single', diameter_m: IN, length_m: IN, turns: 20 }).outputs;
      assertClose(o.l_uh, 400 / 58, { rel: 1e-12 }, 'Wheeler');
      assertClose(o.long_uh, 10.0275, { abs: 1e-4 }, 'long solenoid');
      assertClose(o.sheet_uh, 6.903, { abs: 0.001 }, 'current sheet');
      assertClose(o.l_uh, o.sheet_uh, { rel: 0.002 }, 'Wheeler within 0.2 % of the exact current sheet');
    },
  },
  {
    name: 'Nagaoka coefficients match the published tables: d/l = 0.5 → 0.8181, 1 → 0.6884, 2 → 0.5255, and → 1 for a very long coil',
    source: 'Nagaoka (1909) and Grover, Inductance Calculations, tables of K',
    run: () => {
      assertClose(nagaoka(0.5, 1), 0.8181, { abs: 6e-5 }, 'd/l 0.5');
      assertClose(nagaoka(1, 1), 0.6884, { abs: 6e-5 }, 'd/l 1');
      assertClose(nagaoka(2, 1), 0.5255, { abs: 6e-5 }, 'd/l 2');
      assertClose(nagaoka(0.001, 1), 1 - (4 * 0.001) / (3 * Math.PI), { abs: 1e-6 }, 'long-coil limit 1 − 4d/(3πl)');
    },
  },
  {
    name: 'Turns for 10 µH on the 1 in by 1 in former: N = √(10 × 58) = 24.08, and that N gives 10 µH back',
    source: 'Wheeler single-layer formula solved for N',
    run: () => {
      const o = calculate({ type: 'single', solve: 'N', target_uh: 10, diameter_m: IN, length_m: IN }).outputs;
      assertClose(o.turns_out, Math.sqrt(580), { rel: 1e-12 }, 'N');
      assertClose(calculate({ type: 'single', diameter_m: IN, length_m: IN, turns: o.turns_out }).outputs.l_uh, 10, { rel: 1e-12 }, 'round trip');
    },
  },
  {
    name: 'Multilayer, mean radius 0.5 in, length 0.5 in, depth 0.45 in, 100 turns: 0.8 × 0.25 × 10⁴ / (3 + 4.5 + 4.5) = 166.7 µH',
    source: 'Wheeler, Proc. IRE 16 (1928) multilayer formula, hand calculation',
    run: () => {
      const o = calculate({ type: 'multi', diameter_m: IN, length_m: 0.5 * IN, depth_m: 0.45 * IN, turns: 100 }).outputs;
      assertClose(o.l_uh, 2000 / 12, { rel: 1e-12 }, 'L');
    },
  },
  {
    name: 'Long solenoid, 1 000 turns, 10 mm diameter, 0.5 m long: μ0 N² A / l = 197.4 µH, within 1 % of the current sheet',
    source: 'Physics long-solenoid formula L = μ0 N² A / l; Nagaoka K → 1 for l ≫ d',
    run: () => {
      const o = calculate({ type: 'long', diameter_m: 0.01, length_m: 0.5, turns: 1000 }).outputs;
      assertClose(o.l_uh, (4e-7 * Math.PI * 1e6 * Math.PI * 1e-4) / 4 / 0.5 * 1e6, { rel: 1e-9 }, 'L');
      assertClose(o.sheet_uh / o.l_uh, 1, { abs: 0.01 }, 'K close to 1');
    },
  },
  {
    name: 'Invalid entries are rejected: zero diameter, zero turns, a winding deeper than the mean diameter',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ diameter_m: 0 }), 'Coil diameter');
      assertThrows(() => calculate({ turns: 0 }), 'Number of turns');
      assertThrows(() => calculate({ type: 'multi', depth_m: 0.03 }), 'Winding depth');
    },
  },
];
