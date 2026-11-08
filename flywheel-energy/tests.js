/**
 * flywheel-energy/tests.js — checks of Shigley §16-12 (E = ½ I ω², ΔE = C_s I ω²) and the disc and rim relations.
 * Run: node run-tests.js flywheel-energy
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const W300 = (300 * 2 * Math.PI) / 60;

export const tests = [
  {
    name: 'Energy swing 2 500 J at 300 rpm, C_s 0.05: I = 2 500 / (0.05 × 31.416²) = 50.66 kg·m²; speeds 292.5 and 307.5 rpm',
    source: "Shigley's Mechanical Engineering Design, 10th ed., eq. 16-62 (hand calculation)",
    run: () => {
      const o = calculate({ mode: 'size', delta_e_j: 2500, n_mean_rpm: 300, cs: 0.05 }).outputs;
      assertClose(o.inertia_out, 2500 / (0.05 * W300 * W300), { rel: 1e-12 }, 'I');
      assertClose(o.inertia_out, 50.6606, { abs: 1e-4 }, 'I value');
      assertClose(o.n1_out_rpm, 292.5, { rel: 1e-12 }, 'n1');
      assertClose(o.n2_out_rpm, 307.5, { rel: 1e-12 }, 'n2');
      assertClose(o.delta_e_out_j, 2500, { rel: 1e-9 }, 'ΔE recovered exactly');
    },
  },
  {
    name: '50 kg·m² between 285 and 315 rpm: ΔE = ½ × 50 × (32.987² − 29.845²) = 4 934.8 J, C_s = 0.1',
    source: 'Shigley eqs. 16-60 and 16-61 (hand calculation)',
    run: () => {
      const o = calculate({ mode: 'energy', inertia_kg_m2: 50, n1_rpm: 285, n2_rpm: 315 }).outputs;
      assertClose(o.delta_e_out_j, 4934.80, { abs: 0.01 }, 'ΔE');
      assertClose(o.cs_out, 0.1, { abs: 1e-12 }, 'Cs');
      assertClose(o.e2_j - o.e1_j, o.cs_out * 50 * W300 * W300, { rel: 1e-9 }, 'ΔE = Cs I ω²');
    },
  },
  {
    name: 'Mass and thickness: I 50.66 kg·m² as a 0.4 m solid steel disc is 633.3 kg and 160.5 mm thick; as a thin rim 316.6 kg',
    source: 'Solid disc I = ½ m r², thin ring I = m r² (Meriam and Kraige, Dynamics; hand calculation)',
    run: () => {
      const d = calculate({ shape: 'disc', radius_m: 0.4, density: 7850 }).outputs;
      assertClose(d.mass_kg, 633.257, { abs: 1e-3 }, 'disc mass');
      assertClose(d.thickness_m * 1000, 160.487, { abs: 1e-3 }, 'thickness');
      const r = calculate({ shape: 'rim', radius_m: 0.4 }).outputs;
      assertClose(r.mass_kg, d.mass_kg / 2, { rel: 1e-12 }, 'rim mass');
      assertEqual(r.thickness_m, null, 'no thickness for a rim');
    },
  },
  {
    name: 'Centrifugal stress at 12.566 m/s in steel: thin rim ρ v² = 1.2396 MPa; solid disc centre (3.3/8) ρ v² = 0.5113 MPa',
    source: "Shigley 10th ed., §3-15 Stresses in rotating rings (ν = 0.3)",
    run: () => {
      assertClose(calculate({ shape: 'rim' }).outputs.stress_pa / 1e6, 7850 * 12.566370614 ** 2 / 1e6, { rel: 1e-9 }, 'rim');
      assertClose(calculate({ shape: 'disc' }).outputs.stress_pa / 1e6, 0.51134, { abs: 1e-5 }, 'disc');
    },
  },
  {
    name: 'Energy scales with speed squared: doubling the speed band quadruples the energy at each speed',
    source: 'E = ½ I ω²',
    run: () => {
      const a = calculate({ mode: 'energy', n1_rpm: 100, n2_rpm: 200 }).outputs;
      const b = calculate({ mode: 'energy', n1_rpm: 200, n2_rpm: 400 }).outputs;
      assertClose(b.e2_j / a.e2_j, 4, { rel: 1e-12 }, 'E2');
      assertClose(b.delta_e_out_j / a.delta_e_out_j, 4, { rel: 1e-12 }, 'ΔE');
    },
  },
  {
    name: 'Upper speed not above the lower, zero energy swing and C_s above 1.5 are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ mode: 'energy', n1_rpm: 300, n2_rpm: 300 }), 'Upper speed');
      assertThrows(() => calculate({ delta_e_j: 0 }), 'Energy swing');
      assertThrows(() => calculate({ cs: 2 }), 'Coefficient of speed fluctuation');
    },
  },
];
