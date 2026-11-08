/**
 * propeller-slip/tests.js — checks against the standard slip definitions and hand-verified values.
 * Run: node run-tests.js propeller-slip
 */
import { calculate, theoreticalSpeedKn, slipFraction } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Pitch 6 m at 100 rpm gives 36 000 m/h = 19.438 kn theoretical speed',
    source: 'Vt = P × N × 60 / 1852 — D.A. Taylor, Introduction to Marine Engineering, 2nd ed. (1996), ch. "Propellers"; 1 nmi = 1852 m',
    run: () => {
      assertClose(theoreticalSpeedKn(6, 100), 36000 / 1852, { rel: 1e-12 }, 'Vt');
      assertClose(theoreticalSpeedKn(6, 100), 19.438, { abs: 5e-4 }, 'Vt');
    },
  },
  {
    name: 'Pitch 6 m, 90 rpm, observed 14 kn → Vt 17.495 kn, apparent slip 19.98 %',
    source: 'Apparent slip S_A = (p·n − V) / (p·n) — MAN Energy Solutions, Basic Principles of Ship Propulsion (2018), "Slip ratio"',
    run: () => {
      const { outputs } = calculate({ pitch_m: 6, rpm: 90, mode: 'slip', sog_kn: 14 });
      assertClose(outputs.vt_kn, 17.4946, { abs: 1e-4 }, 'vt_kn');
      assertClose(outputs.apparent_slip_pct, 19.975, { abs: 5e-3 }, 'apparent_slip_pct');
      assertClose(outputs.engine_distance_day_nmi, 419.87, { abs: 0.01 }, 'engine distance/day');
      assertClose(outputs.observed_distance_day_nmi, 336, { rel: 1e-9 }, 'observed distance/day');
    },
  },
  {
    name: 'Speed mode: 10 % apparent slip on Vt 17.495 kn gives 15.745 kn',
    source: 'V = Vt × (1 − S_A), rearranged from the slip definition',
    run: () => {
      const { outputs } = calculate({ pitch_m: 6, rpm: 90, mode: 'speed', slip_pct: 10 });
      assertClose(outputs.ship_speed_kn, 15.7451, { abs: 1e-4 }, 'ship_speed_kn');
      assertEqual(outputs.apparent_slip_pct, undefined, 'slip-mode outputs absent');
    },
  },
  {
    name: 'A 2 kn following current: STW 12 kn, slip through water 31.41 %',
    source: 'STW = SOG − current (Bowditch, American Practical Navigator, 2019 ed., ch. "Dead Reckoning"); slip definition as above',
    run: () => {
      const { outputs } = calculate({ pitch_m: 6, rpm: 90, mode: 'slip', sog_kn: 14, current_kn: 2 });
      assertClose(outputs.stw_kn, 12, { rel: 1e-12 }, 'stw_kn');
      assertClose(outputs.slip_stw_pct, 31.407, { abs: 5e-3 }, 'slip_stw_pct');
    },
  },
  {
    name: 'Wake fraction 0.25 on STW 12 kn: speed of advance 9.0 kn, real slip 48.56 %',
    source: 'Va = V (1 − w); real slip S_R = (p·n − Va) / (p·n) — Carlton, Marine Propellers and Propulsion, 4th ed., ch. 5; MAN Basic Principles (2018)',
    run: () => {
      const { outputs } = calculate({ pitch_m: 6, rpm: 90, mode: 'slip', sog_kn: 14, current_kn: 2, wake_fraction: 0.25 });
      assertClose(outputs.va_kn, 9.0, { rel: 1e-12 }, 'va_kn');
      assertClose(outputs.real_slip_pct, 48.555, { abs: 5e-3 }, 'real_slip_pct');
    },
  },
  {
    name: 'Observed 18 kn against Vt 17.495 kn gives negative slip −2.89 % and a warning',
    source: 'Negative slip case — Taylor, Introduction to Marine Engineering (1996), "Propeller slip"',
    run: () => {
      const result = calculate({ pitch_m: 6, rpm: 90, mode: 'slip', sog_kn: 18 });
      assertClose(result.outputs.apparent_slip_pct, -2.889, { abs: 5e-3 }, 'apparent_slip_pct');
      assertEqual(result.warnings.some((w) => w.includes('Negative apparent slip')), true, 'warning present');
      assertClose(slipFraction(10, 11), -0.1, { rel: 1e-12 }, 'slipFraction sign');
    },
  },
  {
    name: '90 rpm at 14 kn over ground = 385.7 propeller revolutions per nautical mile',
    source: 'Revolutions per mile = N × 60 / V — standard engine-log check (Reeds Vol. 12, Motor Engineering Knowledge, "Engine performance")',
    run: () => {
      const { outputs } = calculate({ pitch_m: 6, rpm: 90, mode: 'slip', sog_kn: 14 });
      assertClose(outputs.revs_per_nmi, 385.714, { abs: 5e-3 }, 'revs_per_nmi');
    },
  },
  {
    name: 'Unit layer: a 20 ft pitch is 6.096 m; 100 rpm = 10.472 rad/s',
    source: '1 ft = 0.3048 m exactly (1959 international yard and pound agreement)',
    run: () => {
      assertClose(convert(20, 'ft', 'm', 'length'), 6.096, { rel: 1e-12 }, 'ft → m');
      assertClose(convert(100, 'rpm', 'rad_s', 'rotational_speed'), 10.4720, { abs: 1e-4 }, 'rpm → rad/s');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero rpm, negative pitch, unknown mode',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ rpm: 0 }), 'greater than zero', 'zero rpm');
      assertThrows(() => calculate({ pitch_m: -1 }), 'greater than zero', 'negative pitch');
      assertThrows(() => calculate({ mode: 'guess' }), 'must be one of', 'unknown mode');
    },
  },
];
