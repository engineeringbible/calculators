/**
 * machining-time/tests.js — checks against T = L / (f N) and hand calculations of the job time.
 * Run: node run-tests.js machining-time
 */
import { calculate } from './calc.js';
import { assertClose, assertThrows, assertEqual } from '../shared/test-runner.js';

const IN = 0.0254;

export const tests = [
  {
    name: 'Turning 100 + 3 mm at 0.2 mm/rev and 1 000 rpm: 103 / 200 = 0.515 min a pass; 2 passes 1.03 min; 50 parts + 30 min set-up + 0.5 min each = 106.5 min',
    source: 'Groover / Kalpakjian: T_m = L / (f N) (hand calculation)',
    run: () => {
      const o = calculate({ operation: 'turning', length_m: 0.1, allow_m: 0.003, f_rev_m: 0.0002, rpm: 1000, passes: 2, parts: 50, setup_s: 1800, handling_s: 30 }).outputs;
      assertClose(o.pass_s / 60, 0.515, { rel: 1e-12 }, 'pass');
      assertClose(o.part_s / 60, 1.03, { rel: 1e-12 }, 'part');
      assertClose(o.job_s / 60, 106.5, { rel: 1e-12 }, 'job');
      assertClose(o.per_hour, 60 / 1.53, { rel: 1e-12 }, 'parts per hour');
    },
  },
  {
    name: 'Drilling 1 in deep with a 1/2 in 118° drill: point 0.1502 in + 0.1 in approach = 1.2502 in at 0.008 in/rev and 800 rpm takes 0.1954 min',
    source: 'Point length D / (2 tan 59°) = 0.3004 D; T = L / (f N) (hand calculation)',
    run: () => {
      const o = calculate({ operation: 'drilling', drill_m: 0.5 * IN, depth_m: 1 * IN, point_deg: 118, allow_m: 0.1 * IN, f_rev_m: 0.008 * IN, rpm: 800 }).outputs;
      assertClose(o.travel_m / IN, 1.25021, { abs: 0.00001 }, 'travel');
      assertClose(o.pass_s / 60, 1.25021 / 6.4, { rel: 1e-5 }, 'time');
    },
  },
  {
    name: 'Facing a 2 in bar to the centre with 0.1 in approach at 0.008 in/rev and 800 rpm: 1.1 in at 6.4 in/min = 0.1719 min; a 1 in bore leaves 0.6 in',
    source: 'Travel (D − d)/2 + allowance (hand calculation)',
    run: () => {
      const o = calculate({ operation: 'facing' }).outputs;
      assertClose(o.feed_ipm, 6.4, { rel: 1e-12 }, 'feed');
      assertClose(o.pass_s / 60, 1.1 / 6.4, { rel: 1e-12 }, 'time');
      assertClose(calculate({ operation: 'facing', inner_m: 1 * IN }).outputs.travel_m / IN, 0.6, { rel: 1e-12 }, 'bore');
    },
  },
  {
    name: 'Milling 4 + 0.1 in at 0.003 in/tooth, 4 teeth, 800 rpm: 9.6 in/min, 0.4271 min; three passes take three times as long',
    source: 'Groover: f_r = N n_t f, T_m = (L + A) / f_r (hand calculation)',
    run: () => {
      const one = calculate({ operation: 'milling' }).outputs;
      assertClose(one.feed_ipm, 9.6, { rel: 1e-12 }, 'feed');
      assertClose(one.pass_s / 60, 4.1 / 9.6, { rel: 1e-12 }, 'time');
      assertClose(calculate({ operation: 'milling', passes: 3 }).outputs.part_s, 3 * one.pass_s, { rel: 1e-12 }, 'passes');
    },
  },
  {
    name: 'A bore as large as the outside, zero travel, fractional passes and zero rpm are rejected; facing warns about constant rpm',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ operation: 'facing', inner_m: 2 * IN }), 'smaller than the outside');
      assertThrows(() => calculate({ length_m: 0, allow_m: 0 }), 'travel is zero');
      assertThrows(() => calculate({ passes: 1.5 }), 'whole number');
      assertThrows(() => calculate({ rpm: 0 }), 'Spindle speed');
      assertEqual(calculate({ operation: 'facing' }).warnings.length, 1, 'facing warning');
    },
  },
];
