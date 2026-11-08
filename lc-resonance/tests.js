/**
 * lc-resonance/tests.js — checks against f0 = 1/(2π√(LC)), Q = √(L/C)/R and the half-power frequencies.
 * Run: node run-tests.js lc-resonance
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '10 µH and 100 pF: f0 = 5.033 MHz, Z0 = 316.2 Ω; with 5 Ω, Q = 63.25, BW = 79.58 kHz, R_D = 20 kΩ',
    source: 'Hand calculation from f0 = 1/(2π√(LC)), Q = √(L/C)/R, BW = R/(2πL), R_D = L/(CR)',
    run: () => {
      const o = calculate({ solve: 'f', l_uh: 10, c_f: 100e-12, r_ohm: 5 }).outputs;
      assertClose(o.f0_hz, 5.032921e6, { rel: 1e-6 }, 'f0');
      assertClose(o.z0_ohm, Math.sqrt(1e5), { rel: 1e-12 }, 'Z0');
      assertClose(o.q, 63.2456, { abs: 1e-4 }, 'Q');
      assertClose(o.bw_hz, 79577.47, { abs: 0.01 }, 'BW');
      assertClose(o.rd_ohm, 20000, { rel: 1e-9 }, 'R_D');
    },
  },
  {
    name: 'Medium-wave tuning: 1 MHz with 100 pF needs 253.3 µH, and 253.3 µH needs 100 pF back',
    source: 'L = 1/((2πf)² C), C = 1/((2πf)² L); the textbook 1 MHz / 100 pF / 253 µH broadcast-band case',
    run: () => {
      const l = calculate({ solve: 'L', f_hz: 1e6, c_f: 100e-12 }).outputs.l_out_uh;
      assertClose(l, 253.303, { abs: 0.001 }, 'L');
      const c = calculate({ solve: 'C', f_hz: 1e6, l_uh: l }).outputs.c_out_f;
      assertClose(c, 100e-12, { rel: 1e-12 }, 'C round trip');
    },
  },
  {
    name: 'The −3 dB frequencies are geometric about f0 (f1 f2 = f0²) and differ by exactly the bandwidth',
    source: 'Series RLC half-power frequencies f1,2 = f0(√(1 + 1/(4Q²)) ∓ 1/(2Q))',
    run: () => {
      const o = calculate({ solve: 'f', l_uh: 47, c_f: 1e-9, r_ohm: 30 }).outputs;
      assertClose(o.f_low_hz * o.f_high_hz, o.f0_hz ** 2, { rel: 1e-12 }, 'geometric mean');
      assertClose(o.f_high_hz - o.f_low_hz, o.bw_hz, { rel: 1e-9 }, 'bandwidth');
    },
  },
  {
    name: 'Limiting case: zero resistance gives no Q, bandwidth or dynamic resistance, and a warning',
    source: 'Q = Z0/R → ∞ as R → 0',
    run: () => {
      const r = calculate({ r_ohm: 0 });
      assertEqual(r.outputs.q, null, 'Q');
      assertEqual(r.outputs.bw_hz, null, 'BW');
      assertEqual(r.warnings.length, 1, 'warning');
    },
  },
  {
    name: 'Invalid entries are rejected: zero inductance, zero capacitance, negative resistance',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ l_uh: 0 }), 'Inductance');
      assertThrows(() => calculate({ solve: 'L', c_f: 0 }), 'Capacitance');
      assertThrows(() => calculate({ r_ohm: -1 }), 'Series resistance');
    },
  },
];
