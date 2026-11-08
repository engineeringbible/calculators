/**
 * outrigger-pad-pressure/tests.js — checks of the load estimates, float and mat pressures, spread model and bending.
 * Run: node run-tests.js outrigger-pad-pressure
 */
import { calculate, GROUNDS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const LIFT = { load_mode: 'manufacturer', outrigger_load_kn: 400, crane_mass_t: 60, load_mass_t: 10, rigging_mass_t: 0.5, float_shape: 'square', float_length_m: 0.6, float_width_m: 0.6, mat_length_m: 2, mat_width_m: 2, mat_thickness_m: 0.15, mat_mass_t: 0.5, mat_behaviour: 'rigid', spread_angle_deg: 45, mat_allowable_mpa: 10, ground: 'stiff_clay', allowable_custom_kpa: 100 };
const G = 9.80665;

export const tests = [
  {
    name: 'Load estimates: 0.65 × (60 + 10 + 0.5) t × g = 449.4 kN; upper bound 70.5 t × g = 691.4 kN; manufacturer value used as entered (400 kN)',
    source: 'Queensland Mobile Crane Code of Practice 2006 factor 0.65 (as quoted by Cranes and Lifting); g = 9.80665 m/s²',
    run: () => {
      assertClose(calculate({ ...LIFT, load_mode: 'estimate' }).outputs.outrigger_load_n, 0.65 * 70.5e3 * G, { rel: 1e-12 }, 'estimate');
      assertClose(calculate({ ...LIFT, load_mode: 'estimate' }).outputs.outrigger_load_n / 1000, 449.4, { abs: 0.1 }, 'estimate value');
      assertClose(calculate({ ...LIFT, load_mode: 'worst' }).outputs.outrigger_load_n / 1000, 691.4, { abs: 0.1 }, 'worst');
      assertClose(calculate(LIFT).outputs.outrigger_load_n, 400e3, { rel: 1e-12 }, 'manufacturer');
      assertEqual(calculate({ ...LIFT, load_mode: 'estimate' }).warnings.some((w) => w.includes('0.65 × total')), true, 'estimate warning');
    },
  },
  {
    name: 'Float pressure: 400 kN on 0.6 × 0.6 m = 1 111 kPa; on a 0.6 m diameter circular float (0.2827 m²) = 1 415 kPa',
    source: 'q = F/A',
    run: () => {
      assertClose(calculate(LIFT).outputs.float_pressure_pa / 1000, 400 / 0.36, { rel: 1e-12 }, 'square');
      const circ = calculate({ ...LIFT, float_shape: 'circular' }).outputs;
      assertClose(circ.float_area_m2, Math.PI * 0.09, { rel: 1e-12 }, 'circle area');
      assertClose(circ.float_pressure_pa / 1000, 1414.7, { abs: 0.1 }, 'circle pressure');
    },
  },
  {
    name: 'Rigid 2 × 2 m mat (0.5 t): q = (400 + 4.90) kN / 4 m² = 101.2 kPa, 67.5 % of stiff clay (150 kPa) → OK; required area 400/150 = 2.667 m² (1.633 m square)',
    source: 'Rigid-mat uniform pressure; BS 8004 Table 1 stiff clay 150–300 kPa (lower bound)',
    run: () => {
      const { outputs } = calculate(LIFT);
      assertClose(outputs.ground_pressure_pa / 1000, (400 + 0.5 * G) / 4, { rel: 1e-12 }, 'pressure');
      assertClose(outputs.ground_pressure_pa / 1000, 101.23, { abs: 0.01 }, 'pressure value');
      assertClose(outputs.utilisation_pct, 67.5, { abs: 0.1 }, 'utilisation');
      assertEqual(outputs.ground_check.startsWith('OK'), true, 'OK');
      assertClose(outputs.required_area_m2, 400 / 150, { rel: 1e-12 }, 'required area');
      assertClose(outputs.required_side_m, Math.sqrt(400 / 150), { rel: 1e-12 }, 'side');
    },
  },
  {
    name: 'Published sizing example: 490.5 kN at 100 kPa needs 4.905 m²; BS 8004 presets: dense gravel 600, compact sand 300, stiff clay 150, firm clay 75 kPa',
    source: 'Brilliant Ideas Ltd load-spread guide worked example; BS 8004:1986 Table 1',
    run: () => {
      const r = calculate({ ...LIFT, outrigger_load_kn: 490.5, ground: 'custom', allowable_custom_kpa: 100 }).outputs;
      assertClose(r.required_area_m2, 4.905, { rel: 1e-12 }, '4.905 m²');
      assertEqual([GROUNDS.dense_gravel.q, GROUNDS.compact_sand.q, GROUNDS.stiff_clay.q, GROUNDS.firm_clay.q].join(), '600,300,150,75', 'presets');
    },
  },
  {
    name: 'Load spread at 45° through 0.15 m: effective 0.9 × 0.9 m → 400/0.81 + 4.90/4 = 495.0 kPa → EXCEEDED on stiff clay; a 1.0 m thick mat spreads to the full 2 m',
    source: 'Load-spread model L_eff = min(L_mat, L_float + 2 t tan θ)',
    run: () => {
      const sp = calculate({ ...LIFT, mat_behaviour: 'spread' });
      assertClose(sp.outputs.effective_length_m, 0.9, { rel: 1e-12 }, 'L_eff');
      assertClose(sp.outputs.ground_pressure_pa / 1000, 400 / 0.81 + (0.5 * G) / 4, { rel: 1e-12 }, 'pressure');
      assertEqual(sp.outputs.ground_check.startsWith('EXCEEDED') && sp.warnings.some((w) => w.includes('exceeds the allowable')), true, 'exceeded');
      assertClose(calculate({ ...LIFT, mat_behaviour: 'spread', mat_thickness_m: 1 }).outputs.effective_length_m, 2, { rel: 1e-12 }, 'capped at the mat');
    },
  },
  {
    name: 'Mat bending (rigid): cantilever c = 0.7 m, σ = 3 × 101.2 kPa × 0.7²/0.15² = 6.61 MPa ≤ 10 MPa OK; a 75 mm mat gives 26.5 MPa → OVERSTRESSED with a warning',
    source: 'One-way cantilever bending of the mat outside the float, σ = 6M/t² with M = q c²/2',
    run: () => {
      const r = calculate(LIFT).outputs;
      assertClose(r.bending_stress_pa, (3 * r.ground_pressure_pa * 0.49) / 0.0225, { rel: 1e-12 }, 'formula');
      assertClose(r.bending_stress_pa / 1e6, 6.61, { abs: 0.01 }, 'value');
      assertEqual(r.bending_check.startsWith('OK'), true, 'OK');
      const thin = calculate({ ...LIFT, mat_thickness_m: 0.075 });
      assertEqual(thin.outputs.bending_check.startsWith('OVERSTRESSED') && thin.warnings.some((w) => w.includes('overstressed in bending')), true, 'overstressed');
    },
  },
  {
    name: 'No mat and validation: without a mat the float pressure is the ground pressure (warning); a mat smaller than the float and an unknown ground type are rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      const bare = calculate({ ...LIFT, mat_length_m: 0, mat_width_m: 0 });
      assertClose(bare.outputs.ground_pressure_pa, bare.outputs.float_pressure_pa, { rel: 1e-12 }, 'bare');
      assertEqual(bare.warnings.some((w) => w.includes('No mat')), true, 'warning');
      assertThrows(() => calculate({ ...LIFT, mat_length_m: 0.4 }), 'smaller than the float', 'small mat');
      assertThrows(() => calculate({ ...LIFT, ground: 'peat' }), 'must be one of', 'ground');
    },
  },
];
