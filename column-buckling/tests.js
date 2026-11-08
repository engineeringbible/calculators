/**
 * column-buckling/tests.js — checks against Euler and Johnson theory (Shigley, Hibbeler) and rolled-section tables.
 * Run: node run-tests.js column-buckling
 */
import { calculate, eulerLoadN, transitionSlenderness, johnsonStressPa, columnSection, END_CONDITIONS } from './calc.js';
import { iSection, hollowCircleSection } from '../shared/sections.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** 50 mm solid A36 rod (E 200 GPa, σ_y 250 MPa), pinned ends. */
const ROD = { section: 'circle', diameter_m: 0.05, material: 'steel_a36', end_condition: 'pinned_pinned', k_basis: 'theoretical', safety_factor: 2 };

export const tests = [
  {
    name: 'Euler: 3 m pinned 50 mm steel rod, I = π d⁴/64 = 30.68 cm⁴, P_cr = π² × 200 GPa × I / 3² = 67.3 kN, σ_cr 34.3 MPa at KL/r = 240 (long column)',
    source: 'Hibbeler, Mechanics of Materials, ch. 13 eq. 13-5 P_cr = π² E I / (K L)²; Shigley §4-12',
    run: () => {
      const I = (Math.PI * 0.05 ** 4) / 64;
      assertClose(eulerLoadN(200e9, I, 3), 67289, { abs: 5 }, 'helper');
      const { outputs } = calculate({ ...ROD, length_m: 3, axial_load_n: 20000 });
      assertClose(outputs.i_min_m4, I, { rel: 1e-12 }, 'I');
      assertClose(outputs.radius_gyration_m, 0.0125, { rel: 1e-12 }, 'r = d/4');
      assertClose(outputs.slenderness, 240, { rel: 1e-12 }, 'KL/r');
      assertClose(outputs.euler_load_n, 67289, { abs: 5 }, 'Euler load');
      assertClose(outputs.critical_load_n, outputs.euler_load_n, { rel: 1e-12 }, 'Euler governs');
      assertClose(outputs.critical_stress_pa, 34.27e6, { abs: 0.02e6 }, 'σ_cr');
      assertEqual(outputs.regime.startsWith('Long (Euler)'), true, 'regime');
      assertEqual(outputs.johnson_load_n, null, 'no Johnson value for a long column');
    },
  },
  {
    name: 'Transition slenderness π √(2E/σ_y): A36 125.7, S235 132.8; at the transition the Euler and Johnson stresses both equal σ_y/2',
    source: "Shigley's Mechanical Engineering Design, 10th ed., eq. 4-45 and Fig. 4-19 (Johnson parabola tangent to Euler at σ_y/2)",
    run: () => {
      assertClose(transitionSlenderness(200e9, 250e6), Math.PI * 40, { rel: 1e-12 }, 'A36');
      assertClose(transitionSlenderness(210e9, 235e6), 132.8, { abs: 0.1 }, 'S235');
      const s1 = transitionSlenderness(200e9, 250e6);
      assertClose(johnsonStressPa(200e9, 250e6, s1), 125e6, { rel: 1e-9 }, 'Johnson at transition');
      assertClose((Math.PI ** 2 * 200e9) / s1 ** 2, 125e6, { rel: 1e-9 }, 'Euler at transition');
    },
  },
  {
    name: 'Johnson: the same rod at 1.25 m (KL/r = 100) has σ_cr = 250 − (250²/4π²E) × 100² = 170.8 MPa and P_cr = 335 kN, below the Euler value (197.4 MPa)',
    source: 'Shigley eq. 4-43 (J. B. Johnson parabola) for intermediate columns',
    run: () => {
      assertClose(johnsonStressPa(200e9, 250e6, 100), 170.84e6, { abs: 0.02e6 }, 'helper');
      const { outputs } = calculate({ ...ROD, length_m: 1.25, axial_load_n: 100000 });
      assertClose(outputs.slenderness, 100, { rel: 1e-9 }, 'KL/r');
      assertClose(outputs.johnson_load_n, 170.84e6 * (Math.PI * 0.05 ** 2) / 4, { rel: 2e-4 }, 'Johnson load');
      assertClose(outputs.johnson_load_n, 335400, { abs: 200 }, 'Johnson value');
      assertClose(outputs.euler_stress_pa, 197.39e6, { abs: 0.02e6 }, 'Euler stress');
      assertEqual(outputs.critical_load_n < outputs.euler_load_n, true, 'Johnson governs');
      assertEqual(outputs.regime.startsWith('Intermediate'), true, 'regime');
    },
  },
  {
    name: 'End conditions: fixed–free (K = 2) carries a quarter of the pinned Euler load, fixed–fixed theoretical (0.5) four times, recommended (0.65) 2.37 times',
    source: 'Hibbeler Fig. 13-8 effective lengths; AISC Commentary Table C-A-7.1 recommended K values',
    run: () => {
      assertEqual(END_CONDITIONS.fixed_free.theoretical, 2.0, 'K flagpole');
      assertEqual(END_CONDITIONS.fixed_fixed.recommended, 0.65, 'K fixed design');
      const pinned = calculate({ ...ROD, length_m: 3 }).outputs.euler_load_n;
      const flagpole = calculate({ ...ROD, length_m: 3, end_condition: 'fixed_free' }).outputs.euler_load_n;
      const fixedTheory = calculate({ ...ROD, length_m: 3, end_condition: 'fixed_fixed' }).outputs.euler_load_n;
      const fixedDesign = calculate({ ...ROD, length_m: 3, end_condition: 'fixed_fixed', k_basis: 'recommended' }).outputs.euler_load_n;
      assertClose(flagpole / pinned, 0.25, { rel: 1e-12 }, 'flagpole ratio');
      assertClose(fixedTheory / pinned, 4, { rel: 1e-12 }, 'fixed theoretical ratio');
      assertClose(fixedDesign / pinned, 1 / 0.65 ** 2, { rel: 1e-12 }, 'fixed recommended ratio');
    },
  },
  {
    name: 'Default CHS 139.7 × 6: A 25.2 cm², I 564 cm⁴, i 47.3 mm (EN 10210 tables); 4 m pinned S235 → KL/r 84.5, Johnson 472 kN, Euler 731 kN, allowable 246 kN at FoS 1.92',
    source: 'Section tables for hot-finished CHS 139.7 × 6 (A = 25.2 cm², I = 564 cm⁴, i = 4.73 cm); Johnson/Euler formulas as above',
    run: () => {
      const s = hollowCircleSection(0.1397, 0.006);
      assertClose(s.area * 1e4, 25.20, { abs: 0.02 }, 'A');
      assertClose(s.iMinor * 1e8, 564.2, { abs: 0.5 }, 'I');
      const { outputs } = calculate({});
      assertClose(outputs.radius_gyration_m * 1000, 47.3, { abs: 0.1 }, 'r');
      assertClose(outputs.slenderness, 84.5, { abs: 0.1 }, 'KL/r');
      assertClose(outputs.johnson_load_n, 472400, { abs: 600 }, 'Johnson');
      assertClose(outputs.euler_load_n, 730900, { abs: 800 }, 'Euler');
      assertClose(outputs.allowable_load_n, outputs.critical_load_n / 1.92, { rel: 1e-12 }, 'allowable');
      assertClose(outputs.utilisation_pct, (200000 / outputs.allowable_load_n) * 100, { rel: 1e-12 }, 'utilisation');
      assertClose(outputs.yield_load_n, s.area * 235e6, { rel: 1e-12 }, 'squash load');
    },
  },
  {
    name: 'Weak axis is used: a 100 × 200 rectangle has I_min = 200 × 100³/12 = 1 667 cm⁴ (not 6 667) and r_min = b/√12 = 28.9 mm; IPE 200 weak-axis I by formula 141.9 cm⁴ vs 142 in the tables',
    source: 'Section properties (Gere Appendix E); ArcelorMittal / EN 10365 IPE 200: I_z = 142 cm⁴',
    run: () => {
      const rect = columnSection({ section: 'rectangle', width_m: 0.1, height_m: 0.2 });
      assertClose(rect.iMin * 1e8, 1666.67, { abs: 0.01 }, 'I_min rectangle');
      assertClose(Math.sqrt(rect.iMin / rect.area) * 1000, 100 / Math.sqrt(12), { rel: 1e-12 }, 'r_min');
      const ipe = iSection(0.1, 0.2, 0.0085, 0.0056);
      assertClose(ipe.iMinor * 1e8, 141.9, { abs: 0.2 }, 'IPE 200 I_z formula');
      assertClose(ipe.iMinor / 142e-8, 1, { abs: 0.01 }, 'within 1 % of the table');
      const col = columnSection({ section: 'i_beam', width_m: 0.1, height_m: 0.2, flange_m: 0.0085, web_m: 0.0056 });
      assertClose(col.iMin, ipe.iMinor, { rel: 1e-12 }, 'column uses the weak axis');
    },
  },
  {
    name: 'Custom section IPE 200 from the tables (A 28.5 cm², I_z 142 cm⁴), 4 m pinned S235: KL/r 179, Euler 184 kN, σ_cr 64.5 MPa; slenderness warning above 200 for 4.5 m',
    source: 'Euler formula with tabulated properties; AISC KL/r ≤ 200 recommendation (E2 user note)',
    run: () => {
      const { outputs } = calculate({ section: 'custom', area_custom_m2: 28.5e-4, i_custom_m4: 142e-8, length_m: 4, material: 'steel_s235', axial_load_n: 50000 });
      assertClose(outputs.slenderness, 4 / Math.sqrt(142e-8 / 28.5e-4), { rel: 1e-12 }, 'KL/r');
      assertClose(outputs.slenderness, 179.2, { abs: 0.2 }, 'KL/r value');
      assertClose(outputs.euler_load_n, (Math.PI ** 2 * 210e9 * 142e-8) / 16, { rel: 1e-12 }, 'Euler');
      assertClose(outputs.euler_load_n, 183900, { abs: 200 }, 'Euler value');
      assertClose(outputs.critical_stress_pa, 64.5e6, { abs: 0.1e6 }, 'σ_cr');
      const slender = calculate({ section: 'custom', area_custom_m2: 28.5e-4, i_custom_m4: 142e-8, length_m: 4.5, material: 'steel_s235' });
      assertEqual(slender.warnings.some((w) => w.includes('Slenderness above 200')), true, 'slenderness warning');
    },
  },
  {
    name: 'Overloaded column is flagged: 300 kN applied on the default CHS exceeds the 246 kN allowable',
    source: 'Behaviour specification',
    run: () => {
      const { warnings, outputs } = calculate({ axial_load_n: 300000 });
      assertEqual(outputs.utilisation_pct > 100, true, 'over 100 %');
      assertEqual(warnings.some((w) => w.includes('exceeds the allowable load')), true, 'warning');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero length, unknown end condition, zero custom area',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ length_m: 0 }), 'greater than zero', 'length');
      assertThrows(() => calculate({ end_condition: 'welded' }), 'must be one of', 'end condition');
      assertThrows(() => calculate({ section: 'custom', area_custom_m2: 0 }), 'greater than zero', 'area');
    },
  },
];
