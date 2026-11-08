/**
 * footing-size/tests.js — checks against hand calculations of A = P / q_net.
 * Run: node run-tests.js footing-size
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const PSF = 4.4482216152605 / 0.09290304;
const KIP = 4448.2216152605;
const FT = 0.3048;
const PCF_KN = (4.4482216152605 / 0.028316846592) / 1000; // 1 pcf in kN/m³

export const tests = [
  {
    name: '800 kN, 200 kPa allowable, 0.5 m footing under 0.5 m soil: net 179 kPa, 4.469 m², 2.114 m → 2.15 m square, 194.1 kPa',
    source: 'ACI 318-19 §13.3.1.1: A = P / (q_all − γ_c t − γ_s h_s)',
    run: () => {
      const o = calculate({ shape: 'square', load_n: 800000, q_all_pa: 200000, thickness_m: 0.5, soil_m: 0.5, gamma_c: 24, gamma_s: 18, step_m: 0.05 }).outputs;
      assertClose(o.q_net_pa, 179000, { rel: 1e-12 }, 'net');
      assertClose(o.area_m2, 4.4693, { abs: 1e-4 }, 'A');
      assertClose(o.width_m, 2.1141, { abs: 1e-4 }, 'B');
      assertClose(o.width_round_m, 2.15, { abs: 1e-9 }, 'rounded');
      assertClose(o.pressure_pa / 1000, 194.07, { abs: 0.01 }, 'pressure');
    },
  },
  {
    name: 'US: 100 kip on 3 000 psf, 2 ft footing under 2 ft of soil (150 and 115 pcf): net 2 470 psf, 40.49 ft², 6.36 ft square',
    source: 'Same relation in US units: 3 000 − 150 × 2 − 115 × 2 = 2 470 psf',
    run: () => {
      const o = calculate({ shape: 'square', load_n: 100 * KIP, q_all_pa: 3000 * PSF, thickness_m: 2 * FT, soil_m: 2 * FT, gamma_c: 150 * PCF_KN, gamma_s: 115 * PCF_KN, step_m: 0.5 * FT }).outputs;
      assertClose(o.q_net_pa / PSF, 2470, { abs: 0.5 }, 'net');
      assertClose(o.area_m2 / (FT * FT), 40.49, { abs: 0.01 }, 'A');
      assertClose(o.width_m / FT, 6.363, { abs: 0.002 }, 'B');
      assertClose(o.width_round_m / FT, 6.5, { abs: 1e-6 }, 'rounded to 6 in');
    },
  },
  {
    name: 'Strip: 150 kN/m needs 0.838 m, rounded to 0.85 m; rectangle 1.5 : 1 gives 1.75 × 2.60 m',
    source: 'B = w / q_net; B = √(A/r), L = r B',
    run: () => {
      const s = calculate({ shape: 'strip', line_load_n_m: 150 }).outputs;
      assertClose(s.width_m, 0.83799, { abs: 1e-5 }, 'strip');
      assertClose(s.width_round_m, 0.85, { abs: 1e-9 }, 'strip rounded');
      const r = calculate({ shape: 'rect', ratio: 1.5 }).outputs;
      assertClose(r.width_round_m, 1.75, { abs: 1e-9 }, 'B');
      assertClose(r.length_round_m, 2.6, { abs: 1e-9 }, 'L');
    },
  },
  {
    name: 'Round footing: D = √(4A/π) = 2.385 m for 4.469 m²; actual pressure never exceeds the allowable after rounding up',
    source: 'Circle area',
    run: () => {
      const o = calculate({ shape: 'round' }).outputs;
      assertClose(o.width_m, Math.sqrt((4 * 4.46927) / Math.PI), { abs: 1e-4 }, 'D');
      for (const shape of ['square', 'rect', 'round']) assertEqual(calculate({ shape }).outputs.pressure_pa <= 200000 + 1e-6, true, shape);
    },
  },
  {
    name: 'A footing so deep that its weight uses all the allowable pressure is rejected; a thin footing warns',
    source: 'Validation contract; ACI 318 §13.3.1.2 minimum depth',
    run: () => {
      assertThrows(() => calculate({ q_all_pa: 20000, thickness_m: 0.5, soil_m: 1 }), 'already use all of it');
      assertEqual(calculate({ thickness_m: 0.1 }).warnings.length, 1, 'thin');
    },
  },
];
