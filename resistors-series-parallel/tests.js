/**
 * resistors-series-parallel/tests.js — checks against the series and parallel resistance rules and current and
 * voltage division.
 * Run: node run-tests.js resistors-series-parallel
 */
import { calculate, seriesResistance, parallelResistance } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '100, 220 and 470 Ω: 790 Ω in series and 59.98 Ω in parallel',
    source: 'Hughes, Electrical and Electronic Technology, ch. 2: R_s = ΣR, 1/R_p = Σ1/R',
    run: () => {
      const { outputs } = calculate({ values: '100\n220\n470', voltage_v: 0 });
      assertClose(outputs.series_ohm, 790, { rel: 1e-12 }, 'series');
      assertClose(outputs.parallel_ohm, 1 / (1 / 100 + 1 / 220 + 1 / 470), { rel: 1e-12 }, 'parallel');
      assertClose(outputs.parallel_ohm, 59.98, { abs: 0.005 }, 'parallel value');
      assertEqual(outputs.count, 3, 'count');
      assertEqual(outputs.series_current_a, null, 'no voltage, no current');
    },
  },
  {
    name: 'Two equal resistors in parallel give half: 2 × 10 kΩ = 5 kΩ; n equal resistors give R/n',
    source: 'Boylestad, Introductory Circuit Analysis, ch. 6 (equal parallel resistors)',
    run: () => {
      assertClose(parallelResistance([10000, 10000]), 5000, { rel: 1e-12 }, 'two');
      assertClose(parallelResistance([1000, 1000, 1000, 1000]), 250, { rel: 1e-12 }, 'four');
      assertClose(seriesResistance([1000, 1000, 1000, 1000]), 4000, { rel: 1e-12 }, 'four in series');
    },
  },
  {
    name: 'Marked values: 4k7, 2R2 and 1M read as 4.7 kΩ, 2.2 Ω and 1 MΩ; the series total is 1 004 702.2 Ω',
    source: 'IEC 60062:2016 clause 5 letter and digit code',
    run: () => {
      const { outputs } = calculate({ values: '4k7, 2R2, 1M', voltage_v: 0 });
      assertClose(outputs.series_ohm, 1004702.2, { rel: 1e-12 }, 'series');
      assertEqual(outputs.shares.rows[0][1], '4.7 kΩ', 'formatted');
    },
  },
  {
    name: 'At 12 V: 100 Ω + 200 Ω in series carry 40 mA and share the voltage 33.3 % / 66.7 %; in parallel they take 180 mA, 2.16 W, current shared 66.7 % / 33.3 %',
    source: 'Voltage division V_i = V R_i / ΣR; current division I_i = I G_i / ΣG (Hughes, ch. 2)',
    run: () => {
      const { outputs } = calculate({ values: '100 200', voltage_v: 12 });
      assertClose(outputs.series_current_a, 0.04, { rel: 1e-12 }, 'series current');
      assertClose(outputs.parallel_current_a, 0.18, { rel: 1e-12 }, 'parallel current');
      assertClose(outputs.parallel_power_w, 2.16, { rel: 1e-12 }, 'parallel power');
      assertEqual(outputs.shares.rows[0][2], '33.3 %', 'voltage share R1');
      assertEqual(outputs.shares.rows[0][3], '66.7 %', 'current share R1');
    },
  },
  {
    name: 'A wide spread warns; an empty list, a zero value and an unreadable value are rejected',
    source: 'Validation contract; parallel total is below the smallest resistor, series total above the largest',
    run: () => {
      assertEqual(calculate({ values: '1 10M', voltage_v: 0 }).warnings.length >= 1, true, 'spread warning');
      assertThrows(() => calculate({ values: '# none' }), 'at least one resistor');
      assertThrows(() => calculate({ values: '100 0' }), 'must be greater than zero');
      assertThrows(() => calculate({ values: '100 abc' }), 'not a component value');
    },
  },
];
