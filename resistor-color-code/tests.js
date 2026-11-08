/**
 * resistor-color-code/tests.js — checks against the IEC 60062 colour code for 4, 5 and 6-band resistors.
 * Run: node run-tests.js resistor-color-code
 */
import { calculate, encode, formatOhms } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Yellow, violet, red, gold = 47 × 10² Ω = 4.7 kΩ ± 5 %: 4.465 to 4.935 kΩ, an E6 value',
    source: 'IEC 60062:2016 clause 4, Tables 1 and 2 (digits, multiplier, tolerance)',
    run: () => {
      const { outputs } = calculate({ mode: 'decode', bands: '4', band1: 'yellow', band2: 'violet', multiplier: 'red', tolerance: 'gold' });
      assertClose(outputs.resistance_out_ohm, 4700, { rel: 1e-12 }, 'R');
      assertClose(outputs.min_ohm, 4465, { rel: 1e-12 }, 'min');
      assertClose(outputs.max_ohm, 4935, { rel: 1e-12 }, 'max');
      assertEqual(outputs.label, '4.7 kΩ ± 5 %', 'label');
      assertEqual(outputs.colours, 'Yellow, Violet, Red, Gold', 'colours');
      assertEqual(outputs.series.startsWith('E6'), true, 'series');
    },
  },
  {
    name: 'Five bands brown, black, black, brown, brown = 100 × 10 Ω = 1 kΩ ± 1 %; six bands with a red sixth band add 50 ppm/K',
    source: 'IEC 60062:2016, Tables 1–3 (three significant digits; temperature coefficient band)',
    run: () => {
      const five = calculate({ mode: 'decode', bands: '5', band1: 'brown', band2: 'black', band3: 'black', multiplier: 'brown', tolerance: 'brown' }).outputs;
      assertClose(five.resistance_out_ohm, 1000, { rel: 1e-12 }, 'R');
      assertClose(five.tolerance_out, 0.01, { rel: 1e-12 }, 'tolerance');
      const six = calculate({ mode: 'decode', bands: '6', band1: 'brown', band2: 'black', band3: 'black', multiplier: 'brown', tolerance: 'brown', tempco: 'red' }).outputs;
      assertEqual(six.tempco_ppm, 50, 'tempco');
      assertEqual(six.label, '1 kΩ ± 1 %, 50 ppm/K', 'label');
    },
  },
  {
    name: 'Fractional and large values: green, blue, gold, gold = 0.56 Ω ± 5 %; brown, black, green, silver = 1 MΩ ± 10 %',
    source: 'IEC 60062:2016 multipliers gold × 0.1 and green × 10⁵',
    run: () => {
      assertClose(calculate({ mode: 'decode', bands: '4', band1: 'green', band2: 'blue', multiplier: 'gold', tolerance: 'gold' }).outputs.resistance_out_ohm, 5.6, { rel: 1e-12 }, '5.6 Ω');
      const small = calculate({ mode: 'decode', bands: '4', band1: 'green', band2: 'blue', multiplier: 'silver', tolerance: 'gold' }).outputs;
      assertClose(small.resistance_out_ohm, 0.56, { rel: 1e-12 }, '0.56 Ω');
      const big = calculate({ mode: 'decode', bands: '4', band1: 'brown', band2: 'black', multiplier: 'green', tolerance: 'silver' }).outputs;
      assertClose(big.resistance_out_ohm, 1e6, { rel: 1e-12 }, '1 MΩ');
      assertEqual(formatOhms(1e6), '1 MΩ', 'format');
    },
  },
  {
    name: 'Encoding: 4.7 kΩ in 4 bands is yellow, violet, red; 10 kΩ in 5 bands is brown, black, black, red; 4.75 kΩ in 4 bands is rounded with a warning',
    source: 'IEC 60062:2016 (inverse of the colour code)',
    run: () => {
      assertEqual(encode(4700, 2).colours.join(' '), 'yellow violet red', '4.7 k');
      assertEqual(encode(10000, 3).colours.join(' '), 'brown black black red', '10 k');
      const rounded = calculate({ mode: 'encode', bands: '4', resistance_ohm: 4750, tolerance: 'gold' });
      assertEqual(rounded.warnings.some((w) => w.includes('more significant digits')), true, 'rounding warning');
      assertEqual(calculate({ mode: 'encode', bands: '5', resistance_ohm: 4750, tolerance: 'brown' }).outputs.colours, 'Yellow, Violet, Green, Brown, Brown', '4.75 k in 5 bands');
    },
  },
  {
    name: 'Round trip: every E24 value from 1 Ω to 9.1 MΩ encodes and decodes back to itself in 4 bands',
    source: 'IEC 60063 E24 values; IEC 60062 code',
    run: () => {
      const e24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
      for (let decade = 0; decade <= 6; decade += 1) {
        for (const m of e24) {
          const value = Number((m * 10 ** decade).toPrecision(2));
          const [d1, d2, mult] = encode(value, 2).colours;
          const back = calculate({ mode: 'decode', bands: '4', band1: d1, band2: d2, multiplier: mult, tolerance: 'gold' }).outputs.resistance_out_ohm;
          assertClose(back, value, { rel: 1e-12 }, `${value} Ω`);
        }
      }
    },
  },
  {
    name: 'Black as the first band, no tolerance band on a 5-band resistor and a value beyond the white multiplier are rejected',
    source: 'IEC 60062:2016 (first band is never black; "no band" ± 20 % applies to 4-band parts)',
    run: () => {
      assertThrows(() => calculate({ mode: 'decode', band1: 'black' }), 'Band 1');
      assertThrows(() => calculate({ mode: 'decode', bands: '5', tolerance: 'none' }), 'only 4-band resistors');
      assertThrows(() => calculate({ mode: 'encode', bands: '4', resistance_ohm: 5e11 }), 'cannot be marked');
    },
  },
];
