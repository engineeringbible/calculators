/**
 * gear-speed/tests.js — checks against mph = rpm × D / (ratio × 336.13) and the speedometer relation.
 * Run: node run-tests.js gear-speed
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const MPH = 0.44704;

export const tests = [
  {
    name: '3 000 rpm, direct 1.00 gear, 3.73 axle, 28 in tire: 3 000 × 28 / (3.73 × 336.13) = 67.0 mph',
    source: 'Hand calculation, mph = rpm × D[in] / (i × 336.13), 336.13 = 63 360 / (60 π)',
    run: () => {
      const o = calculate({ rpm: 3000, gear: 1, final: 3.73, tire_m: 28 * IN }).outputs;
      assertClose(o.speed_out_m_s / MPH, (3000 * 28) / (3.73 * (63360 / (60 * Math.PI))), { rel: 1e-12 }, 'mph');
      assertClose(o.speed_out_m_s / MPH, 66.997, { abs: 0.001 }, 'mph value');
      assertClose(o.mph_per_1000 / MPH, 22.332, { abs: 0.001 }, 'mph per 1 000 rpm');
    },
  },
  {
    name: 'Overdrive 0.70 with 3.73 and 28 in tires turns 2 194 rpm at 70 mph',
    source: 'Inverse of the same relation: rpm = mph × i × 336.13 / D',
    run: () => {
      const o = calculate({ mode: 'rpm', speed_m_s: 70 * MPH, gear: 0.7, final: 3.73, tire_m: 28 * IN }).outputs;
      assertClose(o.rpm_out, 70 * 0.7 * 3.73 * (63360 / (60 * Math.PI)) / 28, { rel: 1e-12 }, 'rpm');
      assertClose(o.rpm_out, 2194.1, { abs: 0.1 }, 'rpm value');
      assertClose(o.overall, 2.611, { abs: 1e-9 }, 'overall ratio');
    },
  },
  {
    name: 'A 28 in tire makes 63 360 / (π × 28) = 720.3 revolutions per mile',
    source: 'Circumference π D; 1 mile = 63 360 in (NIST)',
    run: () => {
      assertClose(calculate({ tire_m: 28 * IN }).outputs.revs_mile, 720.29, { abs: 0.01 }, 'revs/mile');
    },
  },
  {
    name: 'Speedometer set for 26 in, tire 28 in: at a true 67.0 mph it reads 62.2 mph, −7.1 %; same tire, no error',
    source: 'Reading = true speed × D_cal / D (the speedometer counts revolutions)',
    run: () => {
      const o = calculate({ tire_m: 28 * IN, cal_tire_m: 26 * IN }).outputs;
      assertClose(o.speedo_error, 26 / 28 - 1, { rel: 1e-12 }, 'error');
      assertClose(o.speedo_m_s / MPH, 62.212, { abs: 0.001 }, 'reading');
      assertEqual(calculate({ tire_m: 0.7, cal_tire_m: 0.7 }).outputs.speedo_error, 0, 'no change');
      assertEqual(calculate({ tire_m: 28 * IN, cal_tire_m: 26 * IN }).warnings.length, 1, 'recalibrate warning');
    },
  },
  {
    name: 'A zero gear ratio, a 0.05 m tire and an unknown mode are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ gear: 0 }), 'Transmission gear ratio');
      assertThrows(() => calculate({ tire_m: 0.05 }), 'Tire diameter');
      assertThrows(() => calculate({ mode: 'kph' }), 'Calculate');
    },
  },
];
