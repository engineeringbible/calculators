/**
 * inclining-experiment/tests.js — GM from synthetic inclining data, zero error, free surface and the lightweight survey.
 * Run: node run-tests.js inclining-experiment
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const MOMENTS = [0, 160, 320, 160, 0, -160, -320, -160, 0];
/** Exact readings for Δ = 9000 t and GM = 1.2 m on pendulums of 6.0 m and 5.5 m, plus an optional zero error (mm). */
const exactReadings = (zero = 0, gm = 1.2, disp = 9000) => MOMENTS.map((m) => {
  const tan = m / (disp * gm);
  return `${m}; ${tan * 6000 + zero}; ${tan * 5500 + zero}`;
}).join('\n');

export const tests = [
  {
    name: 'Exact readings for Δ = 9000 t and GM = 1.20 m (tan θ = W·x/(Δ·GM)) give GM = 1.200 m with R² = 1; the rounded default readings give 1.20 m within 1 cm',
    source: 'IS Code 2008 Annex 1 §4.3: heeling moment against tangent, GM = W·x/(Δ tan θ)',
    run: () => {
      const exact = calculate({ readings: exactReadings() }).outputs;
      assertClose(exact.gm_m, 1.2, { rel: 1e-9 }, 'GM exact');
      assertClose(exact.r2, 1, { abs: 1e-12 }, 'R²');
      const rounded = calculate({}).outputs;
      assertClose(rounded.gm_m, 1.2, { abs: 0.01 }, 'GM from the rounded default readings');
      assertClose(rounded.max_heel_deg, Math.atan(320 / 10800) * 180 / Math.PI, { abs: 0.02 }, 'largest heel ≈ 1.70°');
    },
  },
  {
    name: 'A constant 3 mm zero error on every pendulum reading shifts the fitted line but leaves GM unchanged, as the guidance says the line need not pass through the origin',
    source: 'IS Code 2008 Annex 1 §4.3.2 (regression line not forced through the origin)',
    run: () => {
      const clean = calculate({ readings: exactReadings(0) }).outputs;
      const offset = calculate({ readings: exactReadings(3) }).outputs;
      assertClose(offset.gm_m, clean.gm_m, { rel: 1e-9 }, 'same GM');
      assertEqual(Math.abs(offset.intercept_tan) > 1e-4, true, 'the offset shows in the intercept');
    },
  },
  {
    name: 'KG and free surface: KM 9.50 m − GM 1.20 m = 8.30 m including free surface; FSM 150 t·m / 9000 t = 0.0167 m, so the solid KG is 8.2833 m',
    source: 'KG = KM − GM; free-surface correction FSM/Δ (IS Code 2008 Part B 3.1)',
    run: () => {
      const { outputs } = calculate({ readings: exactReadings(), km_m: 9.5, fsm_t_m: 150 });
      assertClose(outputs.kg_fluid_m, 8.3, { rel: 1e-9 }, 'KG fluid');
      assertClose(outputs.fsc_m, 150 / 9000, { rel: 1e-12 }, 'FSC');
      assertClose(outputs.kg_solid_m, 8.3 - 150 / 9000, { rel: 1e-9 }, 'KG solid');
    },
  },
  {
    name: 'Lightweight survey of the default items: 9000 − 40 − 1.5 + 2 − 12 = 8948.5 t, KG = (74 550 − 500 − 22.5 + 36 − 72)/8948.5 = 8.2686 m',
    source: 'Moments about the keel (IS Code 2008 Part B 8.1 lightweight survey)',
    run: () => {
      const { outputs } = calculate({ readings: exactReadings(), km_m: 9.5, fsm_t_m: 150 });
      assertClose(outputs.lightship_t, 8948.5, { rel: 1e-12 }, 'lightship');
      assertClose(outputs.lightship_kg_m, (9000 * (8.3 - 150 / 9000) - 500 - 22.5 + 36 - 72) / 8948.5, { rel: 1e-9 }, 'lightship KG');
      assertClose(outputs.lightship_kg_m, 8.2686, { abs: 1e-4 }, 'value');
    },
  },
  {
    name: 'A bad reading is flagged: 20 mm added to one deflection lowers R² below 0.99 and the line is named in a warning',
    source: 'IS Code 2008 Annex 1 §4.3.2 (deviations from a straight line indicate other moments)',
    run: () => {
      const lines = exactReadings().split('\n');
      const parts = lines[2].split(';').map(Number);
      lines[2] = `${parts[0]}; ${parts[1] + 20}; ${parts[2] + 20}`;
      const { warnings } = calculate({ readings: lines.join('\n') });
      assertEqual(warnings.some((w) => w.startsWith('Reading on line 3')), true, 'outlier named');
    },
  },
  {
    name: 'Invalid inputs fail fast: two readings only, pendulum 2 without pendulum 1, a missing deflection, inverted signs',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ readings: '0;0;0\n160;89;81' }), 'At least three readings', 'too few');
      assertThrows(() => calculate({ pendulum1_m: 0, pendulum2_m: 5 }), 'without gaps', 'numbering');
      assertThrows(() => calculate({ readings: '0;0\n160;89\n320;178' }), 'only 1 deflection', 'missing deflection');
      assertThrows(() => calculate({ readings: exactReadings().replace(/^(-?\d+)/gm, (m) => String(-Number(m))) }), 'do not increase', 'sign');
    },
  },
];
