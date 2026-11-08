/**
 * tidal-height/tests.js — checks against the rule of twelfths, the cosine curve and hand-verified windows.
 * Run: node run-tests.js tidal-height
 */
import { calculate, twelfthsFraction, twelfthsInverse, cosineFraction, cosineInverse, formatClock } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** LW 1.0 m at 02:00, HW 5.0 m at 08:00: 6 h rise, 4 m range. */
const RISING_6H = { time_first_h: 2, height_first_m: 1, time_second_h: 8, height_second_m: 5, method: 'twelfths', charted_depth_m: 8, required_depth_m: 10.5 };

export const tests = [
  {
    name: 'Rule of twelfths: 1, 3, 6, 9, 11 and 12 twelfths of a 4 m range after 1–6 h (heights 1.33, 2.00, 3.00, 4.00, 4.67, 5.00 m above a 1.0 m low water)',
    source: 'Admiralty Manual of Navigation Vol. 1, rule of twelfths; Bowditch ch. 9',
    run: () => {
      const expected = [1 / 12, 3 / 12, 6 / 12, 9 / 12, 11 / 12, 1];
      expected.forEach((frac, k) => assertClose(twelfthsFraction((k + 1) / 6), frac, { rel: 1e-12 }, `hour ${k + 1}`));
      const heights = [1.3333, 2.0, 3.0, 4.0, 4.6667, 5.0];
      heights.forEach((h, k) => {
        const { outputs } = calculate({ ...RISING_6H, time_query_h: 2 + (k + 1) });
        assertClose(outputs.height_m, h, { abs: 1e-4 }, `height at hour ${k + 1}`);
      });
    },
  },
  {
    name: 'Cosine curve: half the range at half the duration; 0.268 m after the first hour vs 0.333 m by twelfths (the largest disagreement, ≈ 1/60 of the range)',
    source: 'Semidiurnal tide as a cosine curve (Bowditch ch. 9): h = h₁ + R (1 − cos πt/D)/2',
    run: () => {
      assertClose(cosineFraction(0.5), 0.5, { rel: 1e-12 }, 'half');
      assertClose(cosineFraction(1 / 6), (1 - Math.cos(Math.PI / 6)) / 2, { rel: 1e-12 }, 'first sixth');
      const { outputs } = calculate({ ...RISING_6H, method: 'cosine', time_query_h: 3 });
      assertClose(outputs.height_m, 1 + 4 * 0.066987, { abs: 1e-4 }, 'cosine height at 1 h');
      assertClose(outputs.height_other_m, 1.3333, { abs: 1e-4 }, 'twelfths shown as the other method');
      const mid = calculate({ ...RISING_6H, method: 'cosine', time_query_h: 5 }).outputs;
      assertClose(mid.height_m, 3.0, { rel: 1e-12 }, 'mid-tide');
      assertClose(mid.height_other_m, 3.0, { rel: 1e-12 }, 'both agree at mid-tide');
    },
  },
  {
    name: 'Inverse: a 2.5 m rise (⅝ of 4 m, i.e. 3.5 m height) is reached 3.5 h after LW by twelfths (05:30) and 3.47 h by cosine (05:28)',
    source: 'Piecewise inverse of the twelfths; cosine inverse f = acos(1 − 2 p)/π',
    run: () => {
      assertClose(twelfthsInverse(0.625), 3.5 / 6, { rel: 1e-12 }, 'twelfths inverse');
      assertClose(cosineInverse(0.625), Math.acos(-0.25) / Math.PI, { rel: 1e-12 }, 'cosine inverse');
      assertClose(twelfthsInverse(twelfthsFraction(0.37)), 0.37, { rel: 1e-12 }, 'twelfths round trip');
      assertClose(cosineInverse(cosineFraction(0.37)), 0.37, { rel: 1e-9 }, 'cosine round trip');
      const tw = calculate({ ...RISING_6H, required_depth_m: 11.5 }).outputs;
      assertClose(tw.time_required_h, 5.5, { abs: 1e-9 }, 'twelfths time');
      const co = calculate({ ...RISING_6H, method: 'cosine', required_depth_m: 11.5 }).outputs;
      assertClose(co.time_required_h, 2 + (Math.acos(-0.25) / Math.PI) * 6, { abs: 1e-9 }, 'cosine time');
      assertEqual(formatClock(tw.time_required_h), '05:30', 'clock');
    },
  },
  {
    name: 'Default case: 1.0 m LW 02:00 → 5.0 m HW 08:18; at 04:30 (2.5 h of 6.3 h) the twelfths height is 2.38 m, depth 10.38 m, 0.12 m short of 10.5 m; required depth from 04:38',
    source: 'Hand calculation with the rule of twelfths (f = 0.3968 → third sixth, 0.3452 of the range)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.duration_h, 6.3, { rel: 1e-9 }, 'duration');
      assertClose(outputs.elapsed_h, 2.5, { rel: 1e-9 }, 'elapsed');
      assertClose(outputs.height_m, 1 + 4 * twelfthsFraction(2.5 / 6.3), { rel: 1e-12 }, 'height');
      assertClose(outputs.height_m, 2.381, { abs: 2e-3 }, 'height value');
      assertClose(outputs.height_other_m, 2.363, { abs: 2e-3 }, 'cosine comparison value');
      assertClose(outputs.depth_m, 10.381, { abs: 2e-3 }, 'depth');
      assertClose(outputs.depth_margin_m, -0.119, { abs: 2e-3 }, 'margin');
      assertClose(outputs.required_height_m, 2.5, { rel: 1e-12 }, 'required height');
      assertClose(outputs.time_required_h, 2 + twelfthsInverse(0.375) * 6.3, { rel: 1e-12 }, 'time required');
      assertEqual(outputs.window_text.startsWith('Required depth available from 04:38'), true, 'window text');
      assertEqual(outputs.tide_state.startsWith('Rising'), true, 'state');
    },
  },
  {
    name: 'Falling tide HW 5.0 m 08:18 → LW 1.0 m 14:36: 3.0 m at mid-tide (11:27), depth 10.5 m available until 11:59 by twelfths (11.975 h)',
    source: 'Symmetry of the curve; required height 2.5 m = fraction 0.625 of the fall → 3.5/6 of 6.3 h = 3.675 h after HW = 11.975 h, rounded to 11:59',
    run: () => {
      const mid = calculate({ time_first_h: 8.3, height_first_m: 5, time_second_h: 14.6, height_second_m: 1, time_query_h: 11.45, method: 'twelfths', charted_depth_m: 8, required_depth_m: 10.5 }).outputs;
      assertEqual(mid.tide_state.startsWith('Falling'), true, 'falling');
      assertClose(mid.height_m, 3.0, { abs: 1e-9 }, 'mid height');
      assertEqual(mid.rate_m_per_h < 0, true, 'falling rate negative');
      assertClose(mid.time_required_h, 8.3 + 3.675, { abs: 1e-9 }, 'time required');
      assertEqual(mid.window_text.startsWith('Required depth available until 11:59'), true, 'window text');
    },
  },
  {
    name: 'Interval across midnight: LW 22:00 → HW 04:18, query 01:09 is 3.15 h in (half the duration) → half the range',
    source: 'Time wrapping by adding 24 h to the second turning point and to a query earlier than the first',
    run: () => {
      const { outputs } = calculate({ time_first_h: 22, height_first_m: 1, time_second_h: 4.3, height_second_m: 5, time_query_h: 1.15, method: 'cosine' });
      assertClose(outputs.duration_h, 6.3, { rel: 1e-9 }, 'duration');
      assertClose(outputs.elapsed_h, 3.15, { rel: 1e-9 }, 'elapsed');
      assertClose(outputs.height_m, 3.0, { abs: 1e-9 }, 'height');
      assertEqual(formatClock(28.3), '04:18', 'wrapped clock');
    },
  },
  {
    name: 'Rate of rise: cosine peak rate at mid-tide = π R / (2 D) = 1.047 m/h for 4 m in 6 h; twelfths third-hour rate = 3/12 × 4 m per hour = 1.0 m/h',
    source: 'Derivative of the cosine curve; slope of the third twelfths segment (3 twelfths of the range in one sixth of the duration)',
    run: () => {
      const co = calculate({ ...RISING_6H, method: 'cosine', time_query_h: 5 }).outputs;
      assertClose(co.rate_m_per_h * 3600, (Math.PI * 4) / 12, { rel: 1e-9 }, 'cosine peak rate (m/h)');
      const tw = calculate({ ...RISING_6H, time_query_h: 4.5 }).outputs;
      assertClose(tw.rate_m_per_h * 3600, 1.0, { rel: 1e-9 }, 'twelfths third-segment rate (m/h)');
      const first = calculate({ ...RISING_6H, time_query_h: 2.5 }).outputs;
      assertClose(first.rate_m_per_h * 3600, 4 / 12, { rel: 1e-9 }, 'twelfths first-hour rate 1/12 of the range per hour');
    },
  },
  {
    name: 'Window edge cases: depth sufficient throughout, and never reached; non-standard duration raises a warning',
    source: 'Behaviour specification of this calculator',
    run: () => {
      const always = calculate({ ...RISING_6H, required_depth_m: 8.5 }).outputs;
      assertEqual(always.window_text.startsWith('Depth is sufficient throughout'), true, 'sufficient');
      assertEqual(always.time_required_h, null, 'no time');
      const never = calculate({ ...RISING_6H, required_depth_m: 14 }).outputs;
      assertEqual(never.window_text.startsWith('Not reached'), true, 'not reached');
      const odd = calculate({ ...RISING_6H, time_second_h: 12 });
      assertEqual(odd.warnings.some((w) => w.includes('Duration outside')), true, 'duration warning');
    },
  },
  {
    name: 'Invalid inputs fail fast: query outside the interval, zero range, clock time above 24',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...RISING_6H, time_query_h: 9 }), 'outside the interval', 'query');
      assertThrows(() => calculate({ ...RISING_6H, height_second_m: 1 }), 'range is zero', 'range');
      assertThrows(() => calculate({ ...RISING_6H, time_first_h: 25 }), 'between 0 and 24', 'clock');
    },
  },
];
