/**
 * shaft-torsion/tests.js — checks of τ = T r / J and θ = T L / (G J) against the data of Gere and Goodno Example 3-1 and by hand.
 * Run: node run-tests.js shaft-torsion
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const DEG = Math.PI / 180;
const GERE = { mode: 'check', torque_from: 'torque', torque_nm: 340, section: 'solid', do_m: 0.04, length_m: 1.3, material: 'custom', g_pa: 80e9, tau_allow_pa: 42e6, twist_allow_rad: 2.5 * DEG };

export const tests = [
  {
    name: 'Solid bar d 40 mm, L 1.3 m, G 80 GPa, T 340 N·m: τmax = 16T/(πd³) = 27.06 MPa, θ = TL/(GJ) = 0.02198 rad = 1.26°',
    source: 'Gere and Goodno, Mechanics of Materials, Example 3-1 data (eqs. 3-14 and 3-17; hand calculation)',
    run: () => {
      const o = calculate(GERE).outputs;
      assertClose(o.tau_pa / 1e6, 27.056, { abs: 0.001 }, 'τ');
      assertClose(o.twist_rad, 0.021983, { abs: 1e-6 }, 'θ');
      assertClose(o.twist_rad / DEG, 1.2596, { abs: 1e-4 }, 'θ in degrees');
    },
  },
  {
    name: 'Same bar with τ_allow 42 MPa and θ_allow 2.5°: torque 527.8 N·m by stress, 674.8 N·m by twist, so 528 N·m governs',
    source: 'Gere and Goodno, Example 3-1 (b) data: T = τ π d³/16 and T = G J θ / L (hand calculation)',
    run: () => {
      const o = calculate(GERE).outputs;
      assertClose(o.t_allow_stress_nm, 527.79, { abs: 0.01 }, 'stress');
      assertClose(o.t_allow_twist_nm, 674.84, { abs: 0.01 }, 'twist');
      assertEqual(o.governs.includes('stress limit'), true, 'governs');
    },
  },
  {
    name: 'Power to torque: 15 kW at 1 450 rpm = 98.79 N·m; solid steel shaft at 40 MPa needs d = (16T/(πτ))^(1/3) = 23.26 mm',
    source: 'T = P/ω (Shigley eq. 3-42); Gere eq. 3-14 solved for d (hand calculation)',
    run: () => {
      const o = calculate({ mode: 'size', torque_from: 'power', power_w: 15000, speed_rpm: 1450, material: 'steel', tau_allow_pa: 40e6, twist_allow_rad: 0 }).outputs;
      assertClose(o.torque_out_nm, 98.786, { abs: 0.001 }, 'T');
      assertClose(o.d_required_m * 1000, 23.256, { abs: 0.001 }, 'd');
      assertClose(o.tau_pa, 40e6, { rel: 1e-9 }, 'τ at that d');
    },
  },
  {
    name: 'Hollow shaft k 0.6 needs (1 − 0.6⁴)^(−1/3) = 1.047 times the solid diameter for the same stress; twist sizing hits the twist limit exactly',
    source: 'J = π d⁴ (1 − k⁴)/32 (hand calculation)',
    run: () => {
      const base = { mode: 'size', torque_nm: 500, material: 'steel', tau_allow_pa: 50e6, twist_allow_rad: 0 };
      const s = calculate({ ...base, section: 'solid' }).outputs.d_required_m;
      const h = calculate({ ...base, section: 'hollow', k_ratio: 0.6 }).outputs.d_required_m;
      assertClose(h / s, (1 - 0.6 ** 4) ** (-1 / 3), { rel: 1e-12 }, 'ratio');
      const t = calculate({ mode: 'size', torque_nm: 500, material: 'steel', tau_allow_pa: 0, twist_allow_rad: 0.25 * DEG, length_m: 1 }).outputs;
      assertClose(t.twist_rad, 0.25 * DEG, { rel: 1e-9 }, 'twist limit');
    },
  },
  {
    name: 'Material moduli: steel twists 81/27 = 3 times less than aluminium for the same shaft and torque',
    source: 'EN 1993-1-1 §3.2.6 (G 81 GPa) and EN 1999-1-1 §3.2.5 (G 27 GPa); θ ∝ 1/G',
    run: () => {
      const st = calculate({ ...GERE, material: 'steel' }).outputs.twist_rad;
      const al = calculate({ ...GERE, material: 'aluminium' }).outputs.twist_rad;
      assertClose(al / st, 3, { rel: 1e-12 }, 'ratio');
    },
  },
  {
    name: 'Over-stress warns; a bore not smaller than the outside diameter and sizing with no limit are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ ...GERE, torque_nm: 600 }).warnings.length > 0, true, 'warning');
      assertThrows(() => calculate({ ...GERE, section: 'hollow', di_m: 0.05 }), 'Inside diameter');
      assertThrows(() => calculate({ mode: 'size', tau_allow_pa: 0, twist_allow_rad: 0 }), 'Allowable shear stress');
    },
  },
];
