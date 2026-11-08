/**
 * shaft-critical-speed/tests.js — checks against the data of Shigley Example 7-5 and the closed-form limits.
 * Run: node run-tests.js shaft-critical-speed
 */
import { calculate, influence, shaftSpeed } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const LBF = 4.4482216152605;
const PSI = 6894.757293168;

export const tests = [
  {
    name: 'Shigley Example 7-5 influence coefficients (1 in shaft, 31 in span, 30 Mpsi): a11 = 2.061, a12 = 1.734, a22 = 2.472 × 10⁻⁴ in/lbf',
    source: "Shigley's Mechanical Engineering Design, 10th ed., Example 7-5 (Table A-9 deflection formulas)",
    run: () => {
      const EI = 30e6 * PSI * (Math.PI / 64) * IN ** 4;
      const unit = IN / LBF;
      assertClose(influence(7 * IN, 7 * IN, 31 * IN, EI) / unit * 1e4, 2.061, { abs: 0.001 }, 'a11');
      assertClose(influence(7 * IN, 23 * IN, 31 * IN, EI) / unit * 1e4, 1.734, { abs: 0.001 }, 'a12');
      assertClose(influence(23 * IN, 7 * IN, 31 * IN, EI) / unit * 1e4, 1.734, { abs: 0.001 }, 'a21 (Maxwell reciprocity)');
      assertClose(influence(23 * IN, 23 * IN, 31 * IN, EI) / unit * 1e4, 2.472, { abs: 0.001 }, 'a22');
    },
  },
  {
    name: 'Example 7-5: Rayleigh 143.9 rad/s (1 374 rpm), Dunkerley 136.2 rad/s (1 301 rpm), shaft alone 520.4 rad/s (4 969 rpm), combined 1 325 rpm',
    source: 'Shigley 10th ed., Example 7-5 data with eqs. 7-22, 7-23 and 7-32 (hand calculation)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.n_rayleigh_rpm, 1374.4, { abs: 0.5 }, 'Rayleigh');
      assertClose(o.n_dunkerley_rpm, 1300.7, { abs: 0.5 }, 'Dunkerley');
      assertClose(o.n_shaft_rpm, 4969.0, { abs: 0.5 }, 'shaft');
      assertClose(o.n_crit_rpm, 1324.6, { abs: 0.5 }, 'combined');
      assertEqual(o.n_dunkerley_rpm < o.n_rayleigh_rpm, true, 'Dunkerley below Rayleigh');
    },
  },
  {
    name: 'Single central mass: Rayleigh and Dunkerley both give the exact ω = √(48 E I / (m L³))',
    source: 'Simply supported beam, central load: δ = W L³ / (48 E I) (Roark Table 8.1)',
    run: () => {
      const L = 1; const d = 0.04; const E = 210e9; const m = 100;
      const I = (Math.PI / 64) * d ** 4;
      const exact = Math.sqrt((48 * E * I) / (m * L ** 3)) * 60 / (2 * Math.PI);
      const o = calculate({ span_m: L, d_m: d, e_pa: E, shaft_mass: 'ignore', m1_kg: m, a1_m: 0.5, m2_kg: 0, m3_kg: 0 }).outputs;
      assertClose(o.n_rayleigh_rpm, exact, { rel: 1e-12 }, 'Rayleigh');
      assertClose(o.n_dunkerley_rpm, exact, { rel: 1e-12 }, 'Dunkerley');
    },
  },
  {
    name: 'Uniform shaft alone: ω_s = (π/L)² √(EI/(ρA)); a hollow shaft of the same outside diameter runs faster',
    source: "Shigley 10th ed., eq. 7-22",
    run: () => {
      const L = 2; const d = 0.05; const E = 210e9; const rho = 7850;
      const I = (Math.PI / 64) * d ** 4; const A = (Math.PI / 4) * d * d;
      const o = calculate({ span_m: L, d_m: d, e_pa: E, density: rho, m1_kg: 0, m2_kg: 0, m3_kg: 0 }).outputs;
      assertClose(o.n_shaft_rpm, shaftSpeed(L, E * I, rho * A) * 60 / (2 * Math.PI), { rel: 1e-12 }, 'ωs');
      assertClose(o.n_crit_rpm, o.n_shaft_rpm, { rel: 1e-12 }, 'no masses');
      const h = calculate({ span_m: L, d_m: d, di_m: 0.03, e_pa: E, density: rho, m1_kg: 0, m2_kg: 0, m3_kg: 0 }).outputs;
      assertEqual(h.n_shaft_rpm > o.n_shaft_rpm, true, 'hollow faster');
    },
  },
  {
    name: 'Operating speed near critical warns (1 300 rpm against 1 325 rpm); ratio is reported',
    source: 'Validation contract',
    run: () => {
      const r = calculate({ n_op_rpm: 1300 });
      assertClose(r.outputs.speed_ratio, 1300 / r.outputs.n_crit_rpm, { rel: 1e-12 }, 'ratio');
      assertEqual(r.warnings.some((w) => w.includes('within 30 %')), true, 'warning');
    },
  },
  {
    name: 'A mass outside the span, a bore larger than the shaft and no mass at all are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ a1_m: 1 }), 'Position of mass 1');
      assertThrows(() => calculate({ di_m: 0.03 }), 'Bore diameter');
      assertThrows(() => calculate({ m1_kg: 0, m2_kg: 0, m3_kg: 0, shaft_mass: 'ignore' }), 'Mass 1');
    },
  },
];
