/**
 * base-plate/tests.js — checks against AISC Design Guide 1 Example 4.1 and the Design Guide formulas by hand.
 * Run: node run-tests.js base-plate
 */
import { calculate, bearingStrength, supportArea, thickness } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const KIP = 4448.2216152605;
const KSI = 6894757.293168;

export const tests = [
  {
    name: 'Design Guide 1 Example 4.1: W12×96, Pu 700 kips, f\'c 3 ksi, A2 = A1, A36: A1 = 422 in², plate 22 × 20 in, φcPp = 729 kips, n = 5.12 in governs, t = 1.60 in',
    source: 'AISC Design Guide 1, 2nd ed. (2006), Example 4.1 Base plate for concentric axial compressive load (no concrete confinement), LRFD',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.a1_req_m2 / IN ** 2, 422, { abs: 0.5 }, 'A1');
      assertClose(o.n_out_m / IN, 22, { abs: 1e-9 }, 'N');
      assertClose(o.b_out_m / IN, 20, { abs: 1e-9 }, 'B');
      assertClose(o.phi_pp_n / KIP, 729, { abs: 0.5 }, 'φcPp');
      assertClose(o.nn_m / IN, 5.12, { abs: 1e-9 }, 'n');
      assertClose(o.m_m / IN, 4.97, { abs: 0.005 }, 'm');
      assertEqual(o.governs.startsWith('n'), true, 'n governs');
      assertClose(o.t_m / IN, 1.60, { abs: 0.005 }, 't');
    },
  },
  {
    name: 'Bearing on concrete: √(A2/A1) = 1.5 raises φcPp by 50 %, A2 = 4 A1 doubles it, and the factor stops at 2 (1.7 f\'c)',
    source: 'AISC 360-16 J8: φc Pp = 0.65 × 0.85 f\'c A1 √(A2/A1) ≤ 0.65 × 1.7 f\'c A1',
    run: () => {
      const fc = 3 * KSI; const a1 = 0.1;
      const base = 0.65 * 0.85 * fc * a1;
      assertClose(bearingStrength(fc, a1, a1), base, { rel: 1e-12 }, 'A2 = A1');
      assertClose(bearingStrength(fc, a1, 2.25 * a1), 1.5 * base, { rel: 1e-12 }, '1.5');
      assertClose(bearingStrength(fc, a1, 4 * a1), 2 * base, { rel: 1e-12 }, '2');
      assertClose(bearingStrength(fc, a1, 9 * a1), 2 * base, { rel: 1e-12 }, 'limit');
      // a 16 × 14 in plate on a 24 × 24 in pedestal: the similar area scales by min(24/16, 24/14)² = 2.25
      assertClose(supportArea(16, 14, 'pedestal', 24, 24), 16 * 14 * 2.25, { rel: 1e-12 }, 'similar area');
    },
  },
  {
    name: 'Thornton λ: X = 0.5 gives λ = 2√0.5/(1 + √0.5) = 0.828; X ≥ 1 gives λ = 1; λn\' = λ √(d bf)/4',
    source: 'AISC Design Guide 1, section 3.1.2: λ = 2√X / (1 + √(1 − X)) ≤ 1 (Thornton 1990)',
    run: () => {
      const d = 12.7; const bf = 12.2;
      const k = (4 * d * bf) / (d + bf) ** 2;
      const half = thickness({ pu: 0.5 / k, d, bf, fy: 36, N: 20, B: 20, phiPp: 1 });
      assertClose(half.lambda, (2 * Math.sqrt(0.5)) / (1 + Math.sqrt(0.5)), { rel: 1e-12 }, 'λ at X 0.5');
      assertClose(half.lnp, half.lambda * Math.sqrt(d * bf) / 4, { rel: 1e-12 }, 'λn\'');
      assertEqual(thickness({ pu: 2, d, bf, fy: 36, N: 20, B: 20, phiPp: 1 }).lambda, 1, 'λ cap');
    },
  },
  {
    name: 'Given 24 × 24 in plate for the Example 4.1 column: m = 5.97 in, n = 7.12 in governs, t = 7.12 √(2 × 700/(0.9 × 36 × 576)) = 1.95 in',
    source: 'Hand calculation with Design Guide 1 eq. t_min = l √(2 Pu / (0.9 Fy B N))',
    run: () => {
      const o = calculate({ sizing: 'given', n_m: 24 * IN, b_m: 24 * IN }).outputs;
      assertClose(o.m_m / IN, (24 - 0.95 * 12.7) / 2, { abs: 1e-9 }, 'm');
      const n = (24 - 0.8 * 12.2) / 2;
      assertClose(o.nn_m / IN, n, { abs: 1e-9 }, 'n');
      assertClose(o.t_m / IN, n * Math.sqrt(1400 / (0.9 * 36 * 576)), { rel: 1e-9 }, 't');
      assertClose(o.t_m / IN, 1.950, { abs: 0.001 }, 'value');
    },
  },
  {
    name: 'A large footing (A2 ≥ 4 A1) halves the required area to 211 in²; a pedestal sizes a plate that passes bearing; plates smaller than the column or the pedestal are refused',
    source: 'AISC Design Guide 1 section 3.1.1 (A1 = Pu / (2 φc 0.85 f\'c) when A2 ≥ 4 A1); validation contract',
    run: () => {
      assertClose(calculate({ support: 'large' }).outputs.a1_req_m2 / IN ** 2, 422.32 / 2, { abs: 0.01 }, 'half');
      const p = calculate({ support: 'pedestal', n2_m: 24 * IN, b2_m: 24 * IN }).outputs;
      assertEqual(p.ratio <= 1, true, 'pedestal plate passes');
      assertThrows(() => calculate({ sizing: 'given', n_m: 10 * IN, b_m: 20 * IN }), 'at least as large as the column');
      assertThrows(() => calculate({ support: 'pedestal', n2_m: 14 * IN, b2_m: 14 * IN }), 'does not fit');
      assertEqual(calculate({ sizing: 'given', n_m: 14 * IN, b_m: 14 * IN }).warnings.length > 0, true, 'overloaded');
    },
  },
];
