/**
 * filter-cutoff/tests.js — checks against f_c = 1/(2πRC) and R/(2πL), the first-order response and the standard
 * second-order results (Butterworth, critical damping, peaking).
 * Run: node run-tests.js filter-cutoff
 */
import { calculate, halfPowerU } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const DEG = Math.PI / 180;

export const tests = [
  {
    name: 'RC low-pass 1 kΩ, 100 nF: f_c = 1.592 kHz; at 10 kHz |H| = 0.1572 (−16.07 dB), phase −80.96°',
    source: 'Horowitz and Hill §1.7, f_3dB = 1/(2πRC) and |H| = 1/√(1 + (f/f_c)²); hand calculation',
    run: () => {
      const o = calculate({ type: 'rc', response: 'low', r_ohm: 1000, c_f: 100e-9, f_hz: 10000 }).outputs;
      assertClose(o.fc_hz, 1591.549, { abs: 0.001 }, 'f_c');
      assertClose(o.gain_ratio, 0.15718, { abs: 1e-5 }, '|H|');
      assertClose(o.gain_db, -16.072, { abs: 0.001 }, 'dB');
      assertClose(o.phase_rad / DEG, -80.957, { abs: 0.001 }, 'phase');
    },
  },
  {
    name: 'At the cutoff a first-order filter is −3.01 dB with ±45° of phase; RL high-pass f_c = R/(2πL) and the L for 1 kHz with 100 Ω is 15.92 mH',
    source: 'Definition of the half-power point; Boylestad ch. 21, R-L filters',
    run: () => {
      const hp = calculate({ type: 'rl', response: 'high', r_ohm: 100, l_uh: 15915.494, f_hz: 1000 }).outputs;
      assertClose(hp.fc_hz, 1000, { rel: 1e-7 }, 'f_c');
      assertClose(hp.gain_db, -3.0103, { abs: 1e-4 }, '−3 dB');
      assertClose(hp.phase_rad / DEG, 45, { abs: 1e-4 }, '+45°');
      const l = calculate({ type: 'rl', solve: 'L', r_ohm: 100, target_hz: 1000 }).outputs.l_out_uh;
      assertClose(l, 15915.494, { abs: 0.001 }, 'L');
    },
  },
  {
    name: 'Second order: Q = 0.707 puts the −3 dB point at f0 (Butterworth); Q = 0.5 (critical damping) at 0.6436 f0 low-pass and 1.554 f0 high-pass',
    source: 'Standard second-order results: √(√2 − 1) = 0.6436 for two equal real poles',
    run: () => {
      assertClose(halfPowerU(Math.SQRT1_2), 1, { rel: 1e-12 }, 'Butterworth');
      assertClose(Math.sqrt(halfPowerU(0.5)), Math.sqrt(Math.SQRT2 - 1), { rel: 1e-12 }, 'critical');
      const lp = calculate({ type: 'lcr', response: 'low', r_ohm: 50, l_uh: 10, c_f: 1e-9 }).outputs;
      assertClose(lp.q, 0.5, { rel: 1e-12 }, 'Q = R √(C/L)');
      assertClose(lp.fc_hz / lp.f0_hz, 0.64359, { abs: 1e-5 }, 'LP');
      const hp = calculate({ type: 'lcr', response: 'high', r_ohm: 50, l_uh: 10, c_f: 1e-9 }).outputs;
      assertClose(hp.fc_hz / hp.f0_hz, 1 / 0.64359, { rel: 1e-5 }, 'HP');
    },
  },
  {
    name: 'Series RLC with Q = 1: resonant peak 1.25 dB; at f0 the low-pass gain is Q (0 dB) with −90° phase',
    source: 'Second-order peaking Q/√(1 − 1/(4Q²)); |H(f0)| = Q',
    run: () => {
      const l = 0.01;
      const c = 100e-9;
      const r = Math.sqrt(l / c);
      const o = calculate({ type: 'rlc', response: 'low', r_ohm: r, l_uh: l * 1e6, c_f: c, f_hz: 1 / (2 * Math.PI * Math.sqrt(l * c)) }).outputs;
      assertClose(o.q, 1, { rel: 1e-12 }, 'Q');
      assertClose(o.peak_db, 1.2494, { abs: 1e-4 }, 'peak');
      assertClose(o.gain_db, 0, { abs: 1e-9 }, '0 dB at f0');
      assertClose(o.phase_rad / DEG, -90, { abs: 1e-6 }, '−90°');
    },
  },
  {
    name: 'Component for a target: RC with 10 kΩ for 1 kHz needs 15.92 nF; LC with 10 mH for f0 = 1 kHz needs 2.533 µF',
    source: 'C = 1/(2π f R); C = 1/((2π f)² L)',
    run: () => {
      assertClose(calculate({ type: 'rc', solve: 'C', r_ohm: 10000, target_hz: 1000 }).outputs.c_out_f, 15.9155e-9, { rel: 1e-5 }, 'RC');
      const o = calculate({ type: 'rlc', solve: 'C', l_uh: 10000, target_hz: 1000 }).outputs;
      assertClose(o.c_out_f, 2.53303e-6, { rel: 1e-5 }, 'LC');
      assertClose(o.f0_hz, 1000, { rel: 1e-12 }, 'f0');
    },
  },
  {
    name: 'Invalid entries are rejected: an inductor for an RC filter, zero resistance, zero frequency',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ type: 'rc', solve: 'L' }), 'no inductor');
      assertThrows(() => calculate({ r_ohm: 0 }), 'Resistance');
      assertThrows(() => calculate({ f_hz: 0 }), 'Frequency');
      assertEqual(calculate({ type: 'rl' }).outputs.c_out_f, null, 'no C in an RL filter');
    },
  },
];
