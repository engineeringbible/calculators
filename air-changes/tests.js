/**
 * air-changes/tests.js — checks against ACH = 60 CFM / ft³ and ASHRAE 62.2.
 * Run: node run-tests.js air-changes
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const CFM = 0.028316846592 / 60;

export const tests = [
  {
    name: '12 × 15 × 8 ft room (1 440 ft³) at 6 ACH: 144 cfm = 244.7 m³/h = 67.96 L/s, one change every 10 minutes',
    source: 'CFM = ACH × ft³ / 60 (ASHRAE Fundamentals, Ch. 16)',
    run: () => {
      const { outputs } = calculate({ mode: 'flow', length_m: 15 * FT, width_m: 12 * FT, height_m: 8 * FT, ach_target: 6 });
      assertClose(outputs.volume_m3 / 0.028316846592, 1440, { rel: 1e-12 }, 'ft³');
      assertClose(outputs.flow_cfm_m3s / CFM, 144, { rel: 1e-12 }, 'cfm');
      assertClose(outputs.flow_m3h_m3s * 3600, 244.66, { abs: 0.01 }, 'm³/h');
      assertClose(outputs.flow_ls_m3s * 1000, 67.96, { abs: 0.01 }, 'L/s');
      assertClose(outputs.minutes, 10, { rel: 1e-12 }, 'minutes');
    },
  },
  {
    name: 'Reverse: 100 cfm into the same room is 4.17 ACH; metric 300 m³/h into a 5 × 4 × 2.5 m room is 6 ACH',
    source: 'ACH = 60 × CFM / ft³ = (m³/h) / m³',
    run: () => {
      assertClose(calculate({ mode: 'ach', length_m: 15 * FT, width_m: 12 * FT, height_m: 8 * FT, flow_m3s: 100 * CFM }).outputs.ach, 4.1667, { abs: 1e-4 }, 'imperial');
      assertClose(calculate({ mode: 'ach', length_m: 5, width_m: 4, height_m: 2.5, flow_m3s: 300 / 3600 }).outputs.ach, 6, { rel: 1e-12 }, 'metric');
    },
  },
  {
    name: 'ASHRAE 62.2: 2 000 ft², 3 bedrooms needs 0.03 × 2 000 + 7.5 × 4 = 90 cfm (0.34 ACH with 8 ft ceilings)',
    source: 'ANSI/ASHRAE 62.2-2022, 4.1.1, Q_tot = 0.03 A_floor + 7.5 (N_br + 1)',
    run: () => {
      const { outputs } = calculate({ mode: 'dwelling', floor_m2: 2000 * FT * FT, bedrooms: 3, height_m: 8 * FT });
      assertClose(outputs.flow_cfm_m3s / CFM, 90, { rel: 1e-12 }, 'cfm');
      assertClose(outputs.ach, 0.3375, { abs: 1e-4 }, 'ACH');
    },
  },
  {
    name: 'ASHRAE 62.2 in metric: 100 m² with 2 bedrooms is 25.9 L/s, within 2 % of the rounded SI form 0.15 × 100 + 3.5 × 3 = 25.5 L/s',
    source: 'ASHRAE 62.2 SI form: Q = 0.15 A + 3.5 (N_br + 1) L/s',
    run: () => {
      assertClose(calculate({ mode: 'dwelling', floor_m2: 100, bedrooms: 2, height_m: 2.5 }).outputs.flow_ls_m3s * 1000, 25.5, { rel: 0.02 }, 'L/s');
    },
  },
  {
    name: 'A very low airflow warns; zero sizes and negative bedrooms are rejected',
    source: 'ASHRAE 62-1989 residential minimum 0.35 ACH; validation contract',
    run: () => {
      assertEqual(calculate({ mode: 'ach', flow_m3s: 5 * CFM }).warnings.length, 1, 'low ACH');
      assertThrows(() => calculate({ height_m: 0 }), 'Ceiling height must be greater than zero');
      assertThrows(() => calculate({ mode: 'dwelling', bedrooms: -1 }), 'Number of bedrooms');
    },
  },
];
