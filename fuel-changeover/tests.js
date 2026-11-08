/**
 * fuel-changeover/tests.js — stirred-volume dilution, line delay, blending for the temperature limit.
 * Run: node run-tests.js fuel-changeover
 */
import { calculate, newFuelFraction } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Washout of a stirred volume: one residence time after an instant switch the engines burn 1 − 1/e = 63.2 % new fuel',
    source: 'Levenspiel (1999) ch. 11, response of a stirred volume to a step input',
    run: () => {
      assertClose(newFuelFraction(1.35, 1.35, 0), 1 - Math.exp(-1), { rel: 1e-12 }, 'one τ');
      assertClose(newFuelFraction(2 * 1.35, 1.35, 0), 1 - Math.exp(-2), { rel: 1e-12 }, 'two τ');
      assertEqual(newFuelFraction(0, 1.35, 0), 0, 'start');
    },
  },
  {
    name: 'Default: 2 t/h at 900 kg/m³ through 3 m³ gives τ = 1.35 h; 0.50 % to 0.10 % with 0.05 % fuel takes 0.09 h + τ ln 9 = 3.056 h; start 3.306 h, 46.29 nmi before the boundary at 14 kn',
    source: 'MAN 5212208-3: changeover by dilution in the booster circuit; MARPOL Annex VI reg. 14.6',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.residence_time_h, 1.35, { rel: 1e-12 }, 'τ');
      assertClose(outputs.flush_time_h, 0.09 + 1.35 * Math.log(9), { rel: 1e-9 }, 'flush time');
      assertClose(outputs.start_before_h, 0.09 + 1.35 * Math.log(9) + 0.25, { rel: 1e-9 }, 'start before');
      assertClose(outputs.start_distance_nmi, 46.29, { abs: 0.005 }, 'distance');
      assertEqual(outputs.blend_time_h, 0, 'no blending needed at 0.86 °C/min');
    },
  },
  {
    name: 'Sulphur and temperature follow the same new-fuel fraction: at the limit the fuel has cooled to 110 − 70 × 8/9 = 47.78 °C',
    source: 'Linear mixing of sulphur content and temperature (equal specific heats)',
    run: () => {
      const rows = calculate({}).outputs.changeover_table.rows;
      const last = rows[rows.length - 1];
      assertClose(last[2], 0.1, { rel: 1e-9 }, 'sulphur at the end');
      assertClose(last[3], 110 - (70 * 8) / 9, { rel: 1e-9 }, 'temperature at the end');
    },
  },
  {
    name: 'A 1 m³ circuit and 140 °C fuel would cool at 3.7 °C/min if switched at once; blending over 37.6 min holds the largest rate at exactly 2 °C/min',
    source: 'MAN 5212208-3: at most 2 °C/min at the fuel pump inlet; ramp response of a stirred volume',
    run: () => {
      const { outputs, warnings } = calculate({ circuit_volume_m3: 1, temp_old_c: 140 });
      assertClose(outputs.max_rate_c_min, 2, { rel: 1e-6 }, 'largest rate');
      assertClose(outputs.blend_time_h * 60, 37.56, { abs: 0.01 }, 'blend time');
      const tau = 1 / (2000 / 900);
      let largest = 0;
      for (let t = 0; t < 3; t += 1e-4) largest = Math.max(largest, ((newFuelFraction(t + 1e-6, tau, outputs.blend_time_h) - newFuelFraction(t, tau, outputs.blend_time_h)) / 1e-6) * 100);
      assertClose(largest / 60, 2, { rel: 1e-3 }, 'numerical derivative');
      assertEqual(warnings.some((w) => w.includes('blend the new fuel')), true, 'warning');
    },
  },
  {
    name: 'The blended response is continuous at the end of the blend and approaches the instant switch as the blend shortens',
    source: 'Ramp minus delayed ramp through a first-order lag',
    run: () => {
      const tau = 0.5;
      const tr = 0.4;
      assertClose(newFuelFraction(tr - 1e-9, tau, tr), newFuelFraction(tr + 1e-9, tau, tr), { abs: 1e-8 }, 'continuity');
      assertClose(newFuelFraction(1, tau, 1e-6), newFuelFraction(1, tau, 0), { abs: 1e-5 }, 'short blend');
      assertClose(newFuelFraction(20, tau, tr), 1, { abs: 1e-12 }, 'complete');
    },
  },
  {
    name: 'Invalid inputs are rejected: a new fuel above the limit, a fuel in use already compliant, zero consumption',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ sulphur_new_pct: 0.12 }), 'less sulphur than the limit');
      assertThrows(() => calculate({ sulphur_old_pct: 0.08 }), 'already meets the limit');
      assertThrows(() => calculate({ consumption_t_h: 0 }), 'greater than zero');
    },
  },
];
