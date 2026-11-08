/**
 * mechanical-advantage/tests.js — checks against Shigley Example 8-1 and the statics of levers, pulleys, inclines and winches.
 * Run: node run-tests.js mechanical-advantage
 */
import { calculate, screwTorques } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Shigley Example 8-1: square thread d_m 30 mm, l 8 mm, 6.4 kN, μ = μ_c = 0.08, d_c 40 mm: T_R = 15.94 + 10.24 = 26.18 N·m, T_L = −0.466 + 10.24 = 9.77 N·m, e = 0.311',
    source: "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., Example 8-1",
    run: () => {
      const t = screwTorques({ W: 6400, dm: 0.03, lead: 0.008, mu: 0.08, alphaDeg: 0, muC: 0.08, dc: 0.04 });
      assertClose(t.threadR, 15.94, { abs: 0.005 }, 'thread raise');
      assertClose(t.collar, 10.24, { abs: 1e-9 }, 'collar');
      assertClose(t.raise, 26.18, { abs: 0.005 }, 'T_R');
      assertClose(t.threadL, -0.466, { abs: 0.0005 }, 'thread lower');
      assertClose(t.lower, 9.77, { abs: 0.005 }, 'T_L');
      const o = calculate({ system: 'screw', load_n: 6400, mu: 0.08, thread: 'square', dm_m: 0.03, lead_m: 0.008, handle_m: 0.3, mu_collar: 0.08, dc_m: 0.04 }).outputs;
      assertClose(o.efficiency, 0.311, { abs: 0.0005 }, 'efficiency');
    },
  },
  {
    name: 'Acme thread (α 14.5°) needs more torque than a square thread; with no friction the screw efficiency is 100 %',
    source: 'Shigley eq. 8-5 (sec α on the friction terms); limiting case μ = μ_c = 0',
    run: () => {
      const sq = screwTorques({ W: 6400, dm: 0.03, lead: 0.008, mu: 0.08, alphaDeg: 0, muC: 0, dc: 0 }).raise;
      const ac = screwTorques({ W: 6400, dm: 0.03, lead: 0.008, mu: 0.08, alphaDeg: 14.5, muC: 0, dc: 0 }).raise;
      assertEqual(ac > sq, true, 'Acme higher');
      const o = calculate({ system: 'screw', mu: 0, mu_collar: 0 }).outputs;
      assertClose(o.efficiency, 1, { rel: 1e-12 }, 'ideal');
    },
  },
  {
    name: 'Levers: 1.5 m effort arm and 0.3 m load arm give IMA 5 and 1 280 N for 6.4 kN; class 2 and 3 arm order is enforced',
    source: 'Moment equilibrium about the fulcrum, F a_e = W a_l (Meriam and Kraige, Statics, ch. 3)',
    run: () => {
      const o = calculate({ system: 'lever', lever_class: '1', effort_arm_m: 1.5, load_arm_m: 0.3, load_n: 6400 }).outputs;
      assertClose(o.ima, 5, { rel: 1e-12 }, 'IMA');
      assertClose(o.effort_n, 1280, { rel: 1e-12 }, 'F');
      assertClose(calculate({ system: 'lever', lever_class: '3', effort_arm_m: 0.05, load_arm_m: 0.35, load_n: 50 }).outputs.effort_n, 350, { rel: 1e-12 }, 'class 3');
      assertThrows(() => calculate({ system: 'lever', lever_class: '2', effort_arm_m: 0.3, load_arm_m: 1 }), 'class 2');
      assertThrows(() => calculate({ system: 'lever', lever_class: '3', effort_arm_m: 1, load_arm_m: 0.3 }), 'class 3');
    },
  },
  {
    name: 'Pulley block: 4 parts at 85 % lift 6.4 kN with 1 882 N (AMA 3.4); wheel and axle 400/50 mm at 85 % needs 941 N',
    source: 'IMA = n and IMA = R/r, AMA = η × IMA (hand calculation)',
    run: () => {
      const p = calculate({ system: 'pulley', parts: 4, eff: 0.85, load_n: 6400 }).outputs;
      assertClose(p.ama, 3.4, { rel: 1e-12 }, 'AMA');
      assertClose(p.effort_n, 1882.35, { abs: 0.01 }, 'F');
      assertClose(calculate({ system: 'wheel', wheel_m: 0.4, axle_m: 0.05, eff: 0.85, load_n: 6400 }).outputs.effort_n, 941.18, { abs: 0.01 }, 'winch');
    },
  },
  {
    name: 'Incline 20°, μ 0.08, 6.4 kN: F = W (sin θ + μ cos θ) = 2 670.1 N, IMA 2.924; frictionless F = W sin θ',
    source: 'Hibbeler, Statics, §8.2 (block on an incline pushed up the slope; hand calculation)',
    run: () => {
      const th = (20 * Math.PI) / 180;
      const o = calculate({ system: 'incline', angle_rad: th, mu: 0.08, load_n: 6400 }).outputs;
      assertClose(o.effort_n, 2670.05, { abs: 0.01 }, 'F');
      assertClose(o.ima, 2.9238, { abs: 1e-4 }, 'IMA');
      assertClose(calculate({ system: 'incline', angle_rad: th, mu: 0, load_n: 6400 }).outputs.efficiency, 1, { rel: 1e-12 }, 'ideal');
    },
  },
  {
    name: 'A steep, smooth screw is not self-locking and warns; zero load, a fractional rope count and a locked screw are rejected',
    source: 'Validation contract; self-locking condition π μ d_m sec α > l (Shigley eq. 8-3)',
    run: () => {
      assertEqual(calculate({ system: 'screw', lead_m: 0.03, mu: 0.05, mu_collar: 0 }).warnings.length, 1, 'not self-locking');
      assertThrows(() => calculate({ load_n: 0 }), 'Load W');
      assertThrows(() => calculate({ system: 'pulley', parts: 2.5 }), 'whole number');
      assertThrows(() => calculate({ system: 'screw', mu: 1, lead_m: 0.1, dm_m: 0.03 }), 'locks solid');
    },
  },
];
