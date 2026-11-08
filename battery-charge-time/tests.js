/**
 * battery-charge-time/tests.js — checks against t = Q (SoC₂ − SoC₁) / (I η) and the C-rate.
 * Run: node run-tests.js battery-charge-time
 */
import { calculate } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const ah = (v) => convert(v, 'Ah', 'C', 'electric_charge');

export const tests = [
  {
    name: '100 Ah flooded lead-acid from 50 % to 100 % at 10 A: 50 Ah back, 58.8 Ah from the charger, 5.88 h at 0.10 C, with an absorption warning',
    source: 'Linden\'s Handbook of Batteries, ch. 16: charge input = capacity × ΔSoC / charge efficiency',
    run: () => {
      const { outputs, warnings } = calculate({ capacity_c: ah(100), chemistry: 'flooded', start_soc: 0.5, target_soc: 1, current_a: 10 });
      assertClose(convert(outputs.charge_needed_c, 'C', 'Ah', 'electric_charge'), 50, { rel: 1e-12 }, 'Ah back');
      assertClose(convert(outputs.charge_from_charger_c, 'C', 'Ah', 'electric_charge'), 50 / 0.85, { rel: 1e-12 }, 'Ah in');
      assertClose(outputs.time_s / 3600, 5.88235, { abs: 1e-5 }, 'hours');
      assertClose(outputs.c_rate, 0.1, { rel: 1e-12 }, 'C-rate');
      assertEqual(warnings.some((w) => w.includes('absorption')), true, 'absorption warning');
    },
  },
  {
    name: 'A 5 Ah Li-ion pack from 20 % to 80 % at 2.5 A (0.5 C): 3 Ah back in 1.26 h at 95 %, no warnings',
    source: 'Linden, ch. 26: lithium-ion charge efficiency about 95 %; constant-current phase below 80 %',
    run: () => {
      const { outputs, warnings } = calculate({ capacity_c: ah(5), chemistry: 'liion', start_soc: 0.2, target_soc: 0.8, current_a: 2.5 });
      assertClose(outputs.time_s / 3600, 3 / (2.5 * 0.95), { rel: 1e-12 }, 'hours');
      assertClose(outputs.c_rate, 0.5, { rel: 1e-12 }, 'C-rate');
      assertEqual(warnings.length, 0, 'no warnings');
    },
  },
  {
    name: 'Charging a 100 Ah AGM battery at 40 A (0.4 C) warns about the rate',
    source: 'Typical AGM maximum charge current 0.2–0.3 C (battery makers\' data)',
    run: () => {
      const { warnings } = calculate({ capacity_c: ah(100), chemistry: 'agm', start_soc: 0.2, target_soc: 0.7, current_a: 40 });
      assertEqual(warnings.some((w) => w.includes('0.4 C')), true, 'rate warning');
    },
  },
  {
    name: 'Doubling the charger current halves the time; a custom efficiency of 100 % gives the ideal time',
    source: 't ∝ 1 / I; t = ΔQ / I at η = 1',
    run: () => {
      const a = calculate({ capacity_c: ah(200), chemistry: 'lifepo4', start_soc: 0.1, target_soc: 0.9, current_a: 20 }).outputs.time_s;
      const b = calculate({ capacity_c: ah(200), chemistry: 'lifepo4', start_soc: 0.1, target_soc: 0.9, current_a: 40 }).outputs.time_s;
      assertClose(a / b, 2, { rel: 1e-12 }, 'halved');
      const ideal = calculate({ capacity_c: ah(200), chemistry: 'custom', efficiency: 1, start_soc: 0.1, target_soc: 0.9, current_a: 20 }).outputs.time_s;
      assertClose(ideal / 3600, 8, { rel: 1e-12 }, '160 Ah at 20 A');
    },
  },
  {
    name: 'A target at or below the present charge and a zero current are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ start_soc: 0.8, target_soc: 0.8 }), 'Charge to must be above');
      assertThrows(() => calculate({ current_a: 0 }), 'Charger current must be greater than zero');
    },
  },
];
