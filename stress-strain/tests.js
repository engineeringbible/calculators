/**
 * stress-strain/tests.js — checks of σ = F/A, ε = ΔL/L, σ = Eε and δ = FL/(AE) by hand and by inversion.
 * Run: node run-tests.js stress-strain
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const KIP = 4448.2216152605;

export const tests = [
  {
    name: '20 mm steel rod, 2 m, 50 kN, E 210 GPa: A 314.16 mm², σ 159.15 MPa, ε 7.579e-4, ΔL 1.5158 mm, k 32.99 kN/mm',
    source: 'Gere and Goodno §2.2: δ = PL/(EA), k = EA/L (hand calculation)',
    run: () => {
      const o = calculate({ mode: 'elongation', material: 'steel_en', section: 'round', diameter_m: 0.02, force_n: 50000, length_m: 2 }).outputs;
      assertClose(o.area_out_m2 * 1e6, 314.159, { abs: 1e-3 }, 'A');
      assertClose(o.stress_pa / 1e6, 159.155, { abs: 1e-3 }, 'σ');
      assertClose(o.strain, 7.5788e-4, { abs: 1e-8 }, 'ε');
      assertClose(o.elongation_out_m * 1e3, 1.51576, { abs: 1e-5 }, 'ΔL');
      assertClose(o.stiffness_n_m / 1e6, 32.9867, { abs: 1e-4 }, 'k (kN/mm)');
    },
  },
  {
    name: 'US units: 1 in² bar, 10 ft, 10 kip, E 29 000 ksi: δ = PL/(AE) = 10 × 120 / 29 000 = 0.04138 in; σ = 10 ksi',
    source: 'Hibbeler, Mechanics of Materials, eq. 4-2 (hand calculation)',
    run: () => {
      const o = calculate({ mode: 'elongation', material: 'custom', modulus_pa: 29000 * 6894757.293168, section: 'area', area_m2: IN * IN, force_n: 10 * KIP, length_m: 120 * IN }).outputs;
      assertClose(o.elongation_out_m / IN, 1200 / 29000, { rel: 1e-9 }, 'δ');
      assertClose(o.stress_pa / 6894757.293168, 10, { rel: 1e-9 }, 'σ');
    },
  },
  {
    name: 'Inversion: the force, modulus and length modes recover 50 kN, 210 GPa and 2 m from ΔL = 1.51576 mm',
    source: 'Consistency of σ = F/A, ε = ΔL/L, σ = Eε',
    run: () => {
      const dL = (50000 * 2) / (Math.PI * 1e-4 * 210e9);
      const base = { material: 'steel_en', section: 'round', diameter_m: 0.02, force_n: 50000, length_m: 2, elongation_m: dL };
      assertClose(calculate({ ...base, mode: 'force' }).outputs.force_out_n, 50000, { rel: 1e-12 }, 'F');
      assertClose(calculate({ ...base, mode: 'modulus' }).outputs.modulus_out_pa, 210e9, { rel: 1e-12 }, 'E');
      assertClose(calculate({ ...base, mode: 'length' }).outputs.length_out_m, 2, { rel: 1e-12 }, 'L');
    },
  },
  {
    name: 'Area for an allowable stress: 50 kN at 150 MPa needs 333.3 mm², a 20.60 mm round bar',
    source: 'A = F / σ_allow (hand calculation)',
    run: () => {
      const o = calculate({ mode: 'area', material: 'steel_en', force_n: 50000, allow_pa: 150e6, length_m: 2 }).outputs;
      assertClose(o.area_out_m2 * 1e6, 333.333, { abs: 1e-3 }, 'A');
      assertClose(o.diameter_out_m * 1e3, 20.601, { abs: 1e-3 }, 'd');
      assertClose(o.stress_pa, 150e6, { rel: 1e-12 }, 'σ');
    },
  },
  {
    name: 'Aluminium deflects three times as much as steel (E 70 against 210 GPa) under the same load',
    source: 'EN 1999-1-1 §3.2.5 and EN 1993-1-1 §3.2.6 moduli; δ ∝ 1/E',
    run: () => {
      const s = calculate({ material: 'steel_en' }).outputs.elongation_out_m;
      const a = calculate({ material: 'aluminium' }).outputs.elongation_out_m;
      assertClose(a / s, 3, { rel: 1e-12 }, 'ratio');
    },
  },
  {
    name: 'Yield warning above fy (S235 at 300 MPa); zero area, zero force and an unknown mode are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ section: 'area', area_m2: 100e-6, force_n: 30000 }).warnings.length > 0, true, 'yield');
      assertThrows(() => calculate({ section: 'area', area_m2: 0 }), 'Cross-section area');
      assertThrows(() => calculate({ force_n: 0 }), 'Axial force');
      assertThrows(() => calculate({ mode: 'shear' }), 'Solve for');
    },
  },
];
