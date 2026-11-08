/**
 * slope/tests.js — checks against the right-triangle relations and the ADA ramp limit.
 * Run: node run-tests.js slope
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '1 m rise over 12 m: 8.33 %, 4.76°, 1 : 12, 1 in 12 pitch, 12.04 m along the slope; at the ADA ramp limit',
    source: '2010 ADA Standards §405.2 (1 : 12); tan θ = 1/12',
    run: () => {
      const o = calculate({ mode: 'rise_run', rise_m: 1, run_m: 12 }).outputs;
      assertClose(o.grade, 1 / 12, { rel: 1e-12 }, 'grade');
      assertClose(o.degrees_out, 4.7636, { abs: 1e-4 }, 'degrees');
      assertEqual(o.ratio, '1 : 12', 'ratio');
      assertEqual(o.pitch_out, '1 in 12', 'pitch');
      assertClose(o.length_m, 12.0416, { abs: 1e-4 }, 'length');
      assertEqual(o.check.includes('ADA ramp limit'), true, 'ADA');
    },
  },
  {
    name: 'A 6 in 12 roof is 50 %, 26.57°, 1 : 2; 45° is 100 % grade and 12 in 12',
    source: 'Roof pitch = 12 × rise/run; tan 45° = 1',
    run: () => {
      const r = calculate({ mode: 'pitch', pitch: 6 }).outputs;
      assertClose(r.grade, 0.5, { rel: 1e-12 }, 'grade');
      assertClose(r.degrees_out, 26.565, { abs: 1e-3 }, 'deg');
      assertEqual(r.ratio, '1 : 2', 'ratio');
      const f = calculate({ mode: 'degrees', degrees: 45 }).outputs;
      assertClose(f.grade, 1, { rel: 1e-12 }, '45°');
      assertEqual(f.pitch_out, '12 in 12', 'pitch');
    },
  },
  {
    name: 'A 2 % fall is 1 : 50 and drops 0.2 m over 10 m; a 1 : 20 ratio is 5 %',
    source: 'grade = 1/n; rise = grade × run',
    run: () => {
      const o = calculate({ mode: 'percent', percent: 0.02, run_m: 10 }).outputs;
      assertEqual(o.ratio, '1 : 50', 'ratio');
      assertClose(o.rise_out_m, 0.2, { rel: 1e-12 }, 'rise');
      assertClose(calculate({ mode: 'ratio', ratio_n: 20 }).outputs.grade, 0.05, { rel: 1e-12 }, '1:20');
    },
  },
  {
    name: 'Every input mode gives the same answer for the same slope',
    source: 'Consistency of the conversions',
    run: () => {
      const g = 0.3;
      const deg = (Math.atan(g) * 180) / Math.PI;
      for (const i of [{ mode: 'percent', percent: g }, { mode: 'degrees', degrees: deg }, { mode: 'ratio', ratio_n: 1 / g }, { mode: 'pitch', pitch: 12 * g }, { mode: 'rise_run', rise_m: 3, run_m: 10 }]) {
        assertClose(calculate(i).outputs.grade, g, { rel: 1e-9 }, i.mode);
      }
    },
  },
  {
    name: 'Zero run, 90° and an unknown mode are rejected; level ground is shown as 1 : ∞',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ run_m: 0 }), 'Run must be greater than zero');
      assertThrows(() => calculate({ mode: 'degrees', degrees: 90 }), 'Angle');
      assertThrows(() => calculate({ mode: 'gradient' }), 'Slope given as');
      assertEqual(calculate({ rise_m: 0 }).outputs.ratio, 'Level (1 : ∞)', 'level');
    },
  },
];
