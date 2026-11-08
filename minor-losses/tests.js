/**
 * minor-losses/tests.js — checks against the Crane K method by hand.
 * Run: node run-tests.js minor-losses
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const none = { elbow90: 0, bend90: 0, elbow45: 0, tee_run: 0, tee_branch: 0, gate: 0, ball: 0, butterfly: 0, globe: 0, check_swing: 0, entrance: 0, exit: 0, extra_k: 0 };

export const tests = [
  {
    name: '2 in Sch 40 (52.5 mm), 10 m³/h: 4 elbows + gate + swing check + entrance + exit: f_T 0.0190, ΣK = 0.0190 × 228 + 1.5 = 5.836, h = 0.490 m, 4.80 kPa',
    source: 'Crane TP-410: K = f_T L/D (elbow 30, gate 8, swing check 100), entrance 0.5, exit 1.0; h = K v²/2g',
    run: () => {
      const o = calculate({ diameter_m: 0.0525, flow_m3s: 10 / 3600, density: 998, ...none, elbow90: 4, gate: 1, check_swing: 1, entrance: 1, exit: 1 }).outputs;
      assertClose(o.velocity_m_s, 1.2832, { abs: 1e-4 }, 'v');
      assertClose(o.ft, 0.01902, { abs: 1e-5 }, 'f_T');
      assertClose(o.k_total, 5.8363, { abs: 1e-4 }, 'ΣK');
      assertClose(o.head_m, 0.48996, { abs: 1e-5 }, 'h');
      assertClose(o.dp_pa / 1000, 4.795, { abs: 0.001 }, 'Δp');
    },
  },
  {
    name: 'An exit alone (K = 1) loses exactly one velocity head; a globe valve (340 f_T) loses as much as 17 standard elbows',
    source: 'Crane TP-410 Appendix A',
    run: () => {
      const exit = calculate({ ...none, exit: 1 }).outputs;
      assertClose(exit.head_m, exit.vhead_m, { rel: 1e-12 }, 'exit');
      const globe = calculate({ ...none, globe: 1 }).outputs.k_total;
      const elbows = calculate({ ...none, elbow90: 17 }).outputs.k_total;
      assertClose(globe / elbows, 340 / 510, { rel: 1e-12 }, 'globe vs elbows');
    },
  },
  {
    name: 'Equivalent length L = ΣK D / f_T: one standard elbow equals 30 diameters of pipe',
    source: 'Definition of L/D',
    run: () => {
      const o = calculate({ ...none, elbow90: 1, diameter_m: 0.1 }).outputs;
      assertClose(o.leq_m / 0.1, 30, { rel: 1e-12 }, 'L/D');
    },
  },
  {
    name: 'Extra K adds directly; head loss rises with the square of flow; fast flow warns',
    source: 'h ∝ v²',
    run: () => {
      const a = calculate({ ...none, extra_k: 2, flow_m3s: 0.002 }).outputs.head_m;
      const b = calculate({ ...none, extra_k: 2, flow_m3s: 0.004 }).outputs.head_m;
      assertClose(b / a, 4, { rel: 1e-12 }, 'square law');
      assertEqual(calculate({ flow_m3s: 0.01 }).warnings.length, 1, 'velocity');
    },
  },
  {
    name: 'Negative counts, zero diameter and fractional counts are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ elbow90: -1 }), '90° standard elbow');
      assertThrows(() => calculate({ diameter_m: 0 }), 'Pipe inside diameter must be greater than zero');
      assertThrows(() => calculate({ gate: 1.5 }), 'Gate valve');
    },
  },
];
