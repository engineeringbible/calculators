/**
 * prop-pitch-speed/tests.js — checks against V = pitch × rpm (1 kn = 1 852 m/h) and the slip definition.
 * Run: node run-tests.js prop-pitch-speed
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;

export const tests = [
  {
    name: '19 in pitch at 5 500 engine rpm through 2.0:1: 2 750 propeller rpm, 43.0 kn theoretical, 37.8 kn at 12 % slip',
    source: 'Gerr, The Propeller Handbook: V = pitch × rpm; US rule V[kn] = pitch[in] × rpm / 1 215.2; hand calculation',
    run: () => {
      const o = calculate({ mode: 'speed', pitch_m: 19 * IN, engine_rpm: 5500, gear_ratio: 2, slip_frac: 0.12 }).outputs;
      assertClose(o.prop_rpm, 2750, { rel: 1e-12 }, 'prop rpm');
      assertClose(o.theory_kn, (19 * 2750) / 1215.2, { rel: 1e-4 }, 'theory (1 215.2 rule)');
      assertClose(o.speed_kn, 37.8367, { abs: 1e-3 }, 'speed');
    },
  },
  {
    name: 'Ship check: 6 m pitch at 100 rpm direct drive is 36 000 m/h = 19.438 kn (the propeller-slip calculator\'s example)',
    source: 'MAN, Basic Principles of Ship Propulsion (apparent slip); 1 nmi = 1 852 m',
    run: () => {
      const o = calculate({ mode: 'speed', pitch_m: 6, engine_rpm: 100, gear_ratio: 1, slip_frac: 0 }).outputs;
      assertClose(o.theory_kn, 19.4384, { abs: 1e-4 }, 'theoretical speed');
    },
  },
  {
    name: 'Slip from GPS: 37 kn against 43.0 kn theoretical is 13.9 % apparent slip',
    source: 'Slip = 1 − V / (pitch × rpm); hand calculation',
    run: () => {
      const o = calculate({ mode: 'slip', pitch_m: 19 * IN, engine_rpm: 5500, gear_ratio: 2, measured_kn: 37 }).outputs;
      assertClose(o.slip_out, 0.13946, { abs: 1e-4 }, 'slip');
    },
  },
  {
    name: 'Pitch for 40 kn at 2 750 propeller rpm and 12 % slip is 20.1 in; feeding it back gives 40 kn',
    source: 'P = V / ((1 − s) n); consistency check',
    run: () => {
      const p = calculate({ mode: 'pitch', engine_rpm: 5500, gear_ratio: 2, slip_frac: 0.12, target_kn: 40 }).outputs.pitch_req_m;
      assertClose(p / IN, 20.086, { abs: 1e-3 }, 'pitch');
      const v = calculate({ mode: 'speed', pitch_m: p, engine_rpm: 5500, gear_ratio: 2, slip_frac: 0.12 }).outputs.speed_kn;
      assertClose(v, 40, { rel: 1e-12 }, 'round trip');
    },
  },
  {
    name: 'Negative slip warns; zero rpm and a gear ratio of 0.2 are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ mode: 'slip', measured_kn: 50 }).warnings.length, 1, 'negative slip');
      assertThrows(() => calculate({ engine_rpm: 0 }), 'Engine speed must be greater than zero');
      assertThrows(() => calculate({ gear_ratio: 0.2 }), 'Gear ratio');
    },
  },
];
