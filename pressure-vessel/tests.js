/**
 * pressure-vessel/tests.js — checks against thin-wall theory, Lamé and the ASME VIII-1 UG-27 formulas.
 * Run: node run-tests.js pressure-vessel
 */
import { calculate, thinWallStresses, lameMaxHoopStress, asmeRequiredThickness, asmeMawp } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** 2 m inside diameter cylinder, 10 mm wall, 10 bar, SA-516 Gr 70 (138 MPa), full radiography. */
const CYLINDER = { geometry: 'cylinder', inside_diameter_m: 2, thickness_m: 0.01, pressure_pa: 1e6, allowable_stress_pa: 138e6, joint_efficiency: 'e100', corrosion_allowance_m: 0 };

export const tests = [
  {
    name: 'Thin-wall cylinder 2 m × 10 mm at 10 bar: hoop σ = p R / t = 100 MPa, longitudinal 50 MPa; sphere σ = p R / 2t = 50 MPa',
    source: 'Hibbeler, Mechanics of Materials, 10th ed., §8-1 eqs 8-1 to 8-3',
    run: () => {
      const s = thinWallStresses('cylinder', 1e6, 1, 0.01);
      assertClose(s.hoop, 100e6, { rel: 1e-12 }, 'hoop');
      assertClose(s.longitudinal, 50e6, { rel: 1e-12 }, 'longitudinal');
      assertClose(thinWallStresses('sphere', 1e6, 1, 0.01).hoop, 50e6, { rel: 1e-12 }, 'sphere');
      const { outputs } = calculate(CYLINDER);
      assertClose(outputs.hoop_stress_pa, 100e6, { rel: 1e-12 }, 'in calculate()');
      assertClose(outputs.thickness_to_radius, 0.01, { rel: 1e-12 }, 't/R');
      assertEqual(outputs.wall_regime.startsWith('Thin wall'), true, 'regime');
    },
  },
  {
    name: 'Lamé thick-wall check: for t/R = 0.01 the inner-surface hoop stress is 100.5 MPa (0.5 % above thin-wall); for t/R = 0.5 it is 1.67 p vs 2 p thin-wall',
    source: "Roark's Formulas for Stress and Strain, 8th ed., Table 13.5 case 1a: σ_hoop,max = p (b² + a²)/(b² − a²)",
    run: () => {
      assertClose(lameMaxHoopStress('cylinder', 1e6, 1, 1.01), (1e6 * (1.01 ** 2 + 1)) / (1.01 ** 2 - 1), { rel: 1e-12 }, 'formula');
      assertClose(lameMaxHoopStress('cylinder', 1e6, 1, 1.01), 100.5e6, { abs: 0.01e6 }, 'value');
      assertClose(lameMaxHoopStress('cylinder', 1e6, 1, 1.5), (1e6 * 3.25) / 1.25, { rel: 1e-12 }, 'thick cylinder 2.6 p');
      assertClose(lameMaxHoopStress('sphere', 1e6, 1, 1.01), (1e6 * (1.01 ** 3 + 2)) / (2 * (1.01 ** 3 - 1)), { rel: 1e-12 }, 'sphere formula');
      const thick = calculate({ ...CYLINDER, thickness_m: 0.2 });
      assertEqual(thick.outputs.wall_regime.startsWith('Thick wall'), true, 'thick regime');
      assertEqual(thick.warnings.some((w) => w.includes('exceeds 0.1')), true, 'thick warning');
    },
  },
  {
    name: 'ASME VIII-1 UG-27(c)(1): required t = p R / (S E − 0.6 p) = 7.28 mm at E = 1; 8.57 mm at E = 0.85; sphere UG-27(d) 3.63 mm',
    source: 'ASME BPVC Section VIII Division 1, UG-27 (c)(1) and (d)',
    run: () => {
      assertClose(asmeRequiredThickness('cylinder', 1e6, 1, 138e6, 1), 1e6 / (138e6 - 0.6e6), { rel: 1e-12 }, 'formula');
      assertClose(asmeRequiredThickness('cylinder', 1e6, 1, 138e6, 1) * 1000, 7.278, { abs: 1e-3 }, 'E = 1');
      assertClose(asmeRequiredThickness('cylinder', 1e6, 1, 138e6, 0.85) * 1000, 8.569, { abs: 1e-3 }, 'E = 0.85');
      assertClose(asmeRequiredThickness('sphere', 1e6, 1, 138e6, 1) * 1000, 1000 / (276 - 0.2), { abs: 1e-3 }, 'sphere');
      const { outputs } = calculate(CYLINDER);
      assertClose(outputs.required_thickness_m * 1000, 7.278, { abs: 1e-3 }, 'in calculate()');
      assertClose(outputs.thickness_margin_m * 1000, 10 - 7.278, { abs: 1e-3 }, 'margin');
    },
  },
  {
    name: 'ASME MAWP for 10 mm: S E t / (R + 0.6 t) = 13.72 bar; with 2 mm corrosion allowance the corroded 8 mm wall gives 10.98 bar and the required thickness becomes 9.28 mm',
    source: 'ASME BPVC Section VIII Division 1, UG-27 (c)(1) rearranged for P; UG-25 corrosion allowance',
    run: () => {
      assertClose(asmeMawp('cylinder', 0.01, 1, 138e6, 1), (138e6 * 0.01) / (1 + 0.006), { rel: 1e-12 }, 'formula');
      assertClose(convert(asmeMawp('cylinder', 0.01, 1, 138e6, 1), 'Pa', 'bar', 'pressure'), 13.72, { abs: 0.01 }, 'MAWP');
      const corroded = calculate({ ...CYLINDER, corrosion_allowance_m: 0.002 }).outputs;
      assertClose(convert(corroded.mawp_pa, 'Pa', 'bar', 'pressure'), (138 * 8) / (1000 + 4.8) * 10, { abs: 0.01 }, 'corroded MAWP');
      assertClose(corroded.required_thickness_m * 1000, 7.278 + 2, { abs: 1e-3 }, 'required incl. allowance');
    },
  },
  {
    name: 'End-cap force p π R² = 3.142 MN at 10 bar on a 2 m vessel; stress utilisation 72.5 % of S E',
    source: 'Axial equilibrium of the closed cylinder (Hibbeler §8-1 derivation of the longitudinal stress)',
    run: () => {
      const { outputs } = calculate(CYLINDER);
      assertClose(outputs.end_force_n, Math.PI * 1e6, { rel: 1e-12 }, 'end force');
      assertClose(outputs.stress_utilisation_pct, (100 / 138) * 100, { rel: 1e-9 }, 'utilisation');
      assertClose(outputs.longitudinal_stress_pa * Math.PI * ((1.01) ** 2 - 1), outputs.end_force_n, { rel: 0.01 }, 'longitudinal stress × wall area ≈ end force (thin wall)');
    },
  },
  {
    name: 'Under-thickness and over-pressure are flagged: 6 mm wall at 10 bar is below the required 7.28 mm; 60 bar on 10 mm exceeds S E and the UG-27 pressure limit for E = 0.7',
    source: 'ASME UG-27 limits p ≤ 0.385 S E; behaviour specification',
    run: () => {
      const thin = calculate({ ...CYLINDER, thickness_m: 0.006 });
      assertEqual(thin.warnings.some((w) => w.includes('below the ASME required thickness')), true, 'thickness warning');
      const highP = calculate({ ...CYLINDER, pressure_pa: 6e6, joint_efficiency: 'e70' });
      assertEqual(highP.warnings.some((w) => w.includes('exceeds S × E')), true, 'stress warning');
      assertEqual(highP.outputs.hoop_stress_pa > 138e6 * 0.7, true, 'hoop above S E');
    },
  },
  {
    name: 'Unit layer: 10 bar = 145.04 psi = 1 MPa; 138 MPa = 20.0 ksi (SA-516 Gr 70 allowable)',
    source: 'NIST SP 811: 1 psi = 6.894757 kPa; ASME II-D allowable 20.0 ksi',
    run: () => {
      assertClose(convert(1e6, 'Pa', 'psi', 'pressure'), 145.04, { abs: 0.01 }, 'psi');
      assertClose(convert(138e6, 'Pa', 'ksi', 'pressure'), 20.0, { abs: 0.02 }, 'ksi');
    },
  },
  {
    name: 'Invalid inputs fail fast: corrosion allowance not less than the wall, zero diameter, unknown geometry',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...CYLINDER, corrosion_allowance_m: 0.01 }), 'less than the wall thickness', 'allowance');
      assertThrows(() => calculate({ ...CYLINDER, inside_diameter_m: 0 }), 'greater than zero', 'diameter');
      assertThrows(() => calculate({ ...CYLINDER, geometry: 'cone' }), 'must be one of', 'geometry');
    },
  },
];
