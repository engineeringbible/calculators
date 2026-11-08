/**
 * bolt-torque/tests.js — checks against ISO 898-1 tables, VDI 2230 / Bossard torque tables and Shigley.
 * Run: node run-tests.js bolt-torque
 */
import { calculate, threadGeometry, classStrength, vdiAssemblyPreload, THREADS } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'ISO thread geometry: stress areas M10 58.0, M12 84.3, M16 157, M20 245 mm²; M12 d₂ = 10.863 mm, d₃ = 9.853 mm',
    source: 'ISO 898-1:2013 Table 4 (nominal stress areas, coarse thread); ISO 724 basic dimensions (d₂ = d − 0.6495 P, d₃ = d − 1.2269 P)',
    run: () => {
      const expected = { M10: 58.0, M12: 84.3, M16: 157, M20: 245, M24: 353, M30: 561 };
      for (const [size, area] of Object.entries(expected)) {
        const g = threadGeometry(THREADS[size].d / 1000, THREADS[size].p / 1000);
        assertClose(g.stressArea * 1e6, area, { rel: 3e-3 }, `A_s ${size}`);
      }
      const m12 = threadGeometry(0.012, 0.00175);
      assertClose(m12.d2 * 1000, 10.863, { abs: 1e-3 }, 'd₂ M12');
      assertClose(m12.d3 * 1000, 9.853, { abs: 1e-3 }, 'd₃ M12');
    },
  },
  {
    name: 'Proof loads: M12 8.8 = 48.9 kN, M20 10.9 = 203 kN, M20 8.8 = 147 kN (600 MPa above M16)',
    source: 'ISO 898-1:2013 Table 7 (proof loads, coarse thread): 48 900 N, 203 000 N, 147 000 N',
    run: () => {
      assertClose(calculate({ size: 'M12', property_class: '8.8' }).outputs.proof_load_n, 48900, { rel: 3e-3 }, 'M12 8.8');
      assertClose(calculate({ size: 'M20', property_class: '10.9' }).outputs.proof_load_n, 203000, { rel: 3e-3 }, 'M20 10.9');
      assertClose(calculate({ size: 'M20', property_class: '8.8' }).outputs.proof_load_n, 147000, { rel: 3e-3 }, 'M20 8.8');
      assertEqual(classStrength('8.8', 0.012).yield, 640, '8.8 ≤ M16 yield');
      assertEqual(classStrength('8.8', 0.020).yield, 660, '8.8 > M16 yield');
    },
  },
  {
    name: 'VDI 2230 Table A1 / Bossard: M12 8.8 at μ_G = μ_K = 0.14, 90 % yield → F_M = 41.9 kN, M_A = 93 N·m',
    source: 'VDI 2230 Part 1 (2015) Table A1; Bossard technical resource F-047 (M12/0.14, class 8.8: F_M max 41.9 kN, M_A max 93 N·m)',
    run: () => {
      const { outputs } = calculate({ size: 'M12', property_class: '8.8', preload_basis: 'vdi_90_yield', friction: 'dry_zinc' });
      assertClose(outputs.preload_n, 41900, { rel: 0.01 }, 'F_M');
      assertClose(outputs.torque_nm, 93, { rel: 0.015 }, 'M_A');
      assertClose(outputs.yield_utilisation_pct, 90, { abs: 1e-6 }, 'utilisation is exactly 90 %');
      assertClose(outputs.bearing_diameter_out_m * 1000, 15.065, { abs: 1e-3 }, 'D_Km = (16.63 + 13.5)/2');
    },
  },
  {
    name: 'Shigley: the nut factor K comes out ≈ 0.20 when thread and collar friction are both 0.15',
    source: "Budynas & Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §8-8 eq. 8-27 (K ≈ 0.20 for μ = μ_c = 0.15)",
    run: () => {
      const { outputs } = calculate({ size: 'M12', property_class: '8.8', friction: 'custom', mu_thread: 0.15, mu_head: 0.15 });
      assertClose(outputs.nut_factor, 0.20, { abs: 0.01 }, 'K');
      assertClose(outputs.torque_nm, outputs.nut_factor * outputs.preload_n * 0.012, { rel: 1e-12 }, 'K definition');
    },
  },
  {
    name: 'Percent-of-proof mode: 75 % of 48.9 kN = 36.7 kN, torque at μ = 0.14 = 81.2 N·m; 90 % permanent = 44.0 kN',
    source: "Shigley 10th ed. §8-7: F_i = 0.75 F_p reusable, 0.90 F_p permanent; torque per VDI formula with D_Km 15.065 mm",
    run: () => {
      const reusable = calculate({ size: 'M12', property_class: '8.8', preload_basis: 'percent_proof', proof_fraction_pct: 75, friction: 'dry_zinc' }).outputs;
      assertClose(reusable.preload_n, 0.75 * reusable.proof_load_n, { rel: 1e-12 }, 'F_i');
      assertClose(reusable.preload_n, 36660, { rel: 3e-3 }, 'F_i value');
      assertClose(reusable.torque_nm, 81.2, { rel: 5e-3 }, 'torque');
      const permanent = calculate({ size: 'M12', property_class: '8.8', preload_basis: 'percent_proof', proof_fraction_pct: 90 }).outputs;
      assertClose(permanent.preload_n, 0.9 * permanent.proof_load_n, { rel: 1e-12 }, 'F_i permanent');
    },
  },
  {
    name: 'Given preload 30 kN on M12 with μ = 0.10: M_G = 18.9 N·m, head torque 22.6 N·m, M_A = 49.9 N·m vs 72 N·m from the K = 0.2 rule',
    source: 'VDI 2230 eq. R8/4 M_A = F_M (0.16 P + 0.58 d₂ μ_G + D_Km μ_K / 2); hand calculation',
    run: () => {
      const { outputs } = calculate({ size: 'M12', preload_basis: 'given', preload_given_n: 30000, friction: 'custom', mu_thread: 0.10, mu_head: 0.10 });
      const d2 = threadGeometry(0.012, 0.00175).d2;
      assertClose(outputs.thread_torque_nm, 30000 * (0.16 * 0.00175 + 0.58 * d2 * 0.1), { rel: 1e-9 }, 'M_G');
      assertClose(outputs.thread_torque_nm, 27.30, { abs: 0.01 }, 'M_G value');
      assertClose(outputs.head_torque_nm, (30000 * 0.1 * 0.015065) / 2, { rel: 1e-6 }, 'M_K');
      assertClose(outputs.torque_nm, 49.9, { abs: 0.1 }, 'M_A');
      assertClose(outputs.torque_k02_nm, 72, { rel: 1e-12 }, 'K = 0.2 rule');
    },
  },
  {
    name: 'VDI preload formula: M12 8.8 allows 45.2 kN at μ_G 0.08 but 38.5 kN at μ_G 0.20 (more torsion); tightening factor 1.7 gives F_min = F_M / 1.7',
    source: 'VDI 2230 Part 1 (2015) eq. R8/1 evaluated by hand (bracket 0.226 → √1.153; bracket 0.444 → √1.591) and Table A8 (tightening factor α_A)',
    run: () => {
      const g = threadGeometry(0.012, 0.00175);
      const lowFriction = vdiAssemblyPreload(g, 0.00175, 640e6, 0.08);
      const highFriction = vdiAssemblyPreload(g, 0.00175, 640e6, 0.20);
      assertClose(lowFriction, 45200, { rel: 5e-3 }, 'F_M at μ 0.08');
      assertClose(highFriction, 38480, { rel: 5e-3 }, 'F_M at μ 0.20');
      assertClose(highFriction / lowFriction, 0.851, { abs: 5e-3 }, 'ratio');
      const { outputs } = calculate({ tightening_factor: 1.7 });
      assertClose(outputs.preload_min_n, outputs.preload_n / 1.7, { rel: 1e-12 }, 'F_min');
    },
  },
  {
    name: 'Warnings: a given preload above the proof load and a reduced stress above yield are flagged',
    source: 'ISO 898-1 proof load definition; VDI 2230 yield criterion',
    run: () => {
      const { warnings } = calculate({ size: 'M12', property_class: '8.8', preload_basis: 'given', preload_given_n: 60000 });
      assertEqual(warnings.some((w) => w.includes('exceeds the ISO 898-1 proof load')), true, 'proof warning');
      assertEqual(warnings.some((w) => w.includes('exceeds the yield strength')), true, 'yield warning');
    },
  },
  {
    name: 'Unit layer: 93 N·m = 68.6 lbf·ft; 41.9 kN = 9 420 lbf',
    source: 'NIST SP 811 Appendix B: 1 lbf·ft = 1.355818 N·m, 1 lbf = 4.448222 N',
    run: () => {
      assertClose(convert(93, 'N_m', 'lbf_ft', 'torque'), 68.59, { abs: 0.01 }, 'N·m → lbf·ft');
      assertClose(convert(41900, 'N', 'lbf', 'force'), 9419.4, { abs: 0.5 }, 'N → lbf');
    },
  },
  {
    name: 'Invalid inputs fail fast: unknown size, unknown class, zero given preload',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ size: 'M13' }), 'must be one of', 'size');
      assertThrows(() => calculate({ property_class: '9.9' }), 'must be one of', 'class');
      assertThrows(() => calculate({ preload_basis: 'given', preload_given_n: 0 }), 'greater than zero', 'preload');
    },
  },
];
