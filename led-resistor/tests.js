/**
 * led-resistor/tests.js — checks against Ohm's law for the series resistor, the E series and resistor ratings.
 * Run: node run-tests.js led-resistor
 */
import { calculate, ratingFor } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'One white LED (3.2 V) on 5 V at 20 mA: R = 90 Ω, next E24 value 91 Ω gives 19.8 mA and 36 mW, a 1/8 W part',
    source: 'Horowitz and Hill, The Art of Electronics, §2.1.1: R = (V_s − V_f) / I; IEC 60063 E24',
    run: () => {
      const { outputs } = calculate({ supply_v: 5, led_colour: 'white', current_a: 0.02, count: 1, series: 'E24' });
      assertClose(outputs.r_exact_ohm, 90, { rel: 1e-12 }, 'R exact');
      assertEqual(outputs.r_standard_ohm, 91, 'R standard');
      assertClose(outputs.current_actual_a, 1.8 / 91, { rel: 1e-12 }, 'I actual');
      assertClose(outputs.p_resistor_w, (1.8 / 91) ** 2 * 91, { rel: 1e-12 }, 'P');
      assertEqual(outputs.rating.startsWith('1/8 W'), true, 'rating');
    },
  },
  {
    name: 'Three red LEDs (3 × 2.0 V) on 12 V at 20 mA: R = 300 Ω exactly (an E24 value), 120 mW, a 1/4 W part; LEDs take half the supply power',
    source: 'R = (V_s − n V_f) / I; P = I² R; P_LED / P_supply = n V_f / V_s',
    run: () => {
      const { outputs } = calculate({ supply_v: 12, led_colour: 'red', current_a: 0.02, count: 3, series: 'E24' });
      assertEqual(outputs.r_standard_ohm, 300, 'exact E24 value kept');
      assertClose(outputs.p_resistor_w, 0.12, { rel: 1e-12 }, 'P');
      assertEqual(outputs.rating.startsWith('1/4 W'), true, 'rating');
      assertClose(outputs.efficiency, 0.5, { rel: 1e-12 }, 'efficiency');
      assertClose(outputs.p_leds_w, 0.12, { rel: 1e-12 }, 'LED power');
    },
  },
  {
    name: 'E12 rounds 90 Ω up to 100 Ω, so the current falls to 18 mA; the chosen value is never below the exact one',
    source: 'IEC 60063 E12; next value above keeps I ≤ I_target',
    run: () => {
      const e12 = calculate({ supply_v: 5, led_colour: 'white', current_a: 0.02, count: 1, series: 'E12' }).outputs;
      assertEqual(e12.r_standard_ohm, 100, 'E12');
      assertClose(e12.current_actual_a, 0.018, { rel: 1e-12 }, 'I');
      for (const supply of [3.6, 5, 9, 12, 24]) {
        const out = calculate({ supply_v: supply, led_colour: 'red', current_a: 0.015, count: 1, series: 'E24' }).outputs;
        assertEqual(out.current_actual_a <= 0.015 * (1 + 1e-12), true, `at ${supply} V`);
      }
    },
  },
  {
    name: 'Ratings: 36 mW needs 1/8 W, 120 mW needs 1/4 W, 0.3 W needs 1 W; above 5 W a driver is advised',
    source: 'Common resistor ratings with a factor of two on dissipation (design practice)',
    run: () => {
      assertEqual(ratingFor(0.036).startsWith('1/8 W'), true, '36 mW');
      assertEqual(ratingFor(0.12).startsWith('1/4 W'), true, '120 mW');
      assertEqual(ratingFor(0.3).startsWith('1 W'), true, '0.3 W');
      assertEqual(ratingFor(6).includes('constant-current driver'), true, '6 W');
    },
  },
  {
    name: 'Little headroom warns; a supply below the total forward voltage and a fractional LED count are rejected',
    source: 'Validation contract; current sensitivity grows as V_s − n V_f shrinks',
    run: () => {
      assertEqual(calculate({ supply_v: 3.7, led_colour: 'white', current_a: 0.02, count: 1 }).warnings.some((w) => w.includes('1 V')), true, 'headroom warning');
      assertThrows(() => calculate({ supply_v: 5, led_colour: 'white', count: 2 }), 'The supply must exceed');
      assertThrows(() => calculate({ count: 1.5 }), 'LEDs in series');
    },
  },
];
