/**
 * retaining-wall/tests.js — checks against Rankine and Jaky coefficients and a hand stability check.
 * Run: node run-tests.js retaining-wall
 */
import { calculate, rankineKa } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '3 m wall, φ 30°, γ 18, 10 kPa surcharge: K_a = 1/3, thrust 27 + 10 = 37 kN/m at 1.135 m; 1.8 m concrete block: FS 1.75 sliding, 2.78 overturning',
    source: 'Rankine active thrust P = ½ K_a γ H² + K_a q H; W = 24 × 1.8 × 3 = 129.6 kN/m; FS_s = 0.5 W / P; FS_o = W × 0.9 / (P ȳ)',
    run: () => {
      const o = calculate({ height_m: 3, phi_deg: 30, gamma: 18, beta_deg: 0, surcharge_pa: 10000, state: 'active', wall_width_m: 1.8, gamma_wall: 24, mu: 0.5 }).outputs;
      assertClose(o.ka, 1 / 3, { rel: 1e-12 }, 'Ka');
      assertClose(o.thrust_n_m, 37, { rel: 1e-12 }, 'P');
      assertClose(o.ybar_m, 42 / 37, { rel: 1e-12 }, 'ȳ');
      assertClose(o.fs_sliding, 64.8 / 37, { rel: 1e-12 }, 'sliding');
      assertClose(o.fs_overturning, 116.64 / 42, { rel: 1e-12 }, 'overturning');
    },
  },
  {
    name: 'Coefficients: K_a 0.271 and K_p 3.690 at φ 35°; K_0 = 1 − sin 30° = 0.5; sloping backfill β 10°, φ 30°: K_a 0.350',
    source: 'Das, Principles of Foundation Engineering, ch. 7 (Rankine tables); Jaky (1944)',
    run: () => {
      const o = calculate({ phi_deg: 35 }).outputs;
      assertClose(o.ka, 0.271, { abs: 5e-4 }, 'Ka 35');
      assertClose(o.kp, 3.690, { abs: 5e-4 }, 'Kp 35');
      assertClose(calculate({ phi_deg: 30 }).outputs.k0, 0.5, { rel: 1e-12 }, 'K0');
      assertClose(rankineKa(30, 10), 0.350, { abs: 5e-4 }, 'sloping');
    },
  },
  {
    name: 'At-rest pressure on a rigid wall is 1.5 times the active at φ 30°; base pressure K γ H + K q',
    source: 'K_0 / K_a = 0.5 / 0.333',
    run: () => {
      const a = calculate({ state: 'active' }).outputs;
      const r = calculate({ state: 'rest' }).outputs;
      assertClose(r.thrust_n_m / a.thrust_n_m, 1.5, { rel: 1e-12 }, 'ratio');
      assertClose(a.p_base_pa / 1000, (1 / 3) * 18 * 3 + (1 / 3) * 10, { rel: 1e-12 }, 'base pressure');
    },
  },
  {
    name: 'A narrow 1.2 m block warns on sliding and overturning; zero width skips the check',
    source: 'Typical minimum factors of safety 1.5 and 2.0',
    run: () => {
      assertEqual(calculate({ wall_width_m: 1.2 }).warnings.length, 2, 'both');
      assertEqual(calculate({ wall_width_m: 0 }).outputs.fs_sliding, null, 'skipped');
    },
  },
  {
    name: 'A backfill slope at or above the friction angle and out-of-range inputs are rejected',
    source: 'Rankine K_a is undefined for β ≥ φ; validation contract',
    run: () => {
      assertThrows(() => calculate({ phi_deg: 30, beta_deg: 30 }), 'Backfill slope');
      assertThrows(() => calculate({ height_m: 0 }), 'Height must be greater than zero');
      assertThrows(() => calculate({ state: 'passive' }), 'Pressure state');
    },
  },
];
