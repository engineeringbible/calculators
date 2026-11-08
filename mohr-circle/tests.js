/**
 * mohr-circle/tests.js — checks against Shigley Examples 3-4 and 5-1 and the stress transformation equations.
 * Run: node run-tests.js mohr-circle
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const M = 1e6;
const deg = (r) => (r * 180) / Math.PI;

export const tests = [
  {
    name: 'Shigley Example 3-4: σx 80, τxy 50 MPa cw: σ1 = 104 MPa, σ2 = −24 MPa, τ1 = 64 MPa, σ1 at 25.7° cw from x',
    source: "Shigley's Mechanical Engineering Design, 10th ed., Example 3-4",
    run: () => {
      const o = calculate({ sx_pa: 80 * M, sy_pa: 0, txy_pa: -50 * M }).outputs;
      assertClose(o.s1_pa / M, 104.03, { abs: 0.01 }, 'σ1');
      assertClose(o.s2_pa / M, -24.03, { abs: 0.01 }, 'σ2');
      assertClose(o.tau_max_pa / M, 64.03, { abs: 0.01 }, 'τmax');
      assertClose(deg(o.theta_p_rad), -25.67, { abs: 0.01 }, 'θp');
    },
  },
  {
    name: 'Shigley Example 5-1 (Sy 100 kpsi): (b) σx 60, σy 40, τ −15: n = 1.47 (MSS), 1.70 (DE); (c) σy 40, τ 45: n = 1.02, 1.14; (d) σx −40, σy −60, τ 15: 1.47, 1.70',
    source: "Shigley's Mechanical Engineering Design, 10th ed., Example 5-1",
    run: () => {
      [[60, 40, -15, 1.47, 1.70], [0, 40, 45, 1.02, 1.14], [-40, -60, 15, 1.47, 1.70]].forEach(([a, b, t, mss, de], k) => {
        const o = calculate({ sx_pa: a, sy_pa: b, txy_pa: t, sy_yield_pa: 100 }).outputs;
        assertClose(o.fs_tresca, mss, { abs: 0.005 }, `MSS case ${k}`);
        assertClose(o.fs_vm, de, { abs: 0.005 }, `DE case ${k}`);
      });
      const a = calculate({ sx_pa: 70, sy_pa: 70, txy_pa: 0, sy_yield_pa: 100 }).outputs;
      assertClose(a.fs_vm, 1.43, { abs: 0.005 }, '(a) DE');
      assertClose(a.fs_tresca, 1.43, { abs: 0.005 }, '(a) MSS');
    },
  },
  {
    name: 'Rotated element: σx −80, σy 50, τxy −25 MPa turned 30° clockwise gives σx\' = −25.8, σy\' = −4.15, τx\'y\' = −68.8 MPa',
    source: 'Hibbeler, Mechanics of Materials, §9.2, eqs. 9-1 to 9-3 (hand calculation)',
    run: () => {
      const o = calculate({ sx_pa: -80 * M, sy_pa: 50 * M, txy_pa: -25 * M, theta_rad: (-30 * Math.PI) / 180 }).outputs;
      assertClose(o.sxp_pa / M, -25.85, { abs: 0.01 }, "σx'");
      assertClose(o.syp_pa / M, -4.15, { abs: 0.01 }, "σy'");
      assertClose(o.txyp_pa / M, -68.79, { abs: 0.01 }, "τx'y'");
    },
  },
  {
    name: 'Invariants: rotating to θp gives σx\' = σ1 and τx\'y\' = 0; σx\' + σy\' is the same at any angle',
    source: 'Properties of the transformation equations (Mohr circle centre and radius)',
    run: () => {
      const base = { sx_pa: 30 * M, sy_pa: -70 * M, txy_pa: 40 * M };
      const p = calculate(base).outputs;
      const o = calculate({ ...base, theta_rad: p.theta_p_rad }).outputs;
      assertClose(o.sxp_pa, p.s1_pa, { rel: 1e-12 }, 'σ1');
      assertClose(o.txyp_pa, 0, { abs: 1e-6 }, 'τ = 0');
      const q = calculate({ ...base, theta_rad: 1.1 }).outputs;
      assertClose(q.sxp_pa + q.syp_pa, -40 * M, { rel: 1e-12 }, 'trace');
    },
  },
  {
    name: 'Pure shear τ: σ1 = τ, σ2 = −τ, von Mises √3 τ, Tresca 2τ; uniaxial σ: von Mises = Tresca = σ',
    source: 'Limiting cases of Shigley eqs. 5-3 and 5-15',
    run: () => {
      const s = calculate({ sx_pa: 0, sy_pa: 0, txy_pa: 100 * M }).outputs;
      assertClose(s.von_mises_pa, Math.sqrt(3) * 100 * M, { rel: 1e-12 }, 'vm');
      assertClose(s.tresca_pa, 200 * M, { rel: 1e-12 }, 'tresca');
      assertClose(deg(s.theta_p_rad), 45, { abs: 1e-9 }, '45°');
      const u = calculate({ sx_pa: 150 * M, sy_pa: 0, txy_pa: 0 }).outputs;
      assertClose(u.von_mises_pa, 150 * M, { rel: 1e-12 }, 'uniaxial vm');
      assertClose(u.tau_abs_pa, 75 * M, { rel: 1e-12 }, 'uniaxial τabs');
    },
  },
  {
    name: 'Yield warning when σ\' > Sy; no yield strength gives no safety factor; non-numeric stress is rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ sx_pa: 300 * M, sy_yield_pa: 250 * M }).warnings.some((w) => w.includes('yields')), true, 'yield');
      assertEqual(calculate({ sy_yield_pa: 0 }).outputs.fs_vm, null, 'no Sy');
      assertThrows(() => calculate({ sx_pa: 'abc' }), 'Normal stress σx');
    },
  },
];
