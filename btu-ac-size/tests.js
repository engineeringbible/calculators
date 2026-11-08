/**
 * btu-ac-size/tests.js — checks against the ENERGY STAR room air conditioner sizing chart and adjustments.
 * Run: node run-tests.js btu-ac-size
 */
import { calculate, chartBtuH } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const B = 0.29307107017;

export const tests = [
  {
    name: '14 × 20 ft very sunny room with 3 people: chart 7 000, ×1.1 = 7 700, +600 = 8 300 Btu/h = 2.43 kW = 0.69 ton',
    source: 'ENERGY STAR room air conditioner sizing: 250–300 ft² → 7 000 Btu/h; +10 % very sunny; +600 Btu/h per person beyond two',
    run: () => {
      const { outputs } = calculate({ length_m: 20 * FT, width_m: 14 * FT, sun: 'sunny', people: 3, kitchen: 'no' });
      assertClose(outputs.chart_w / B, 7000, { rel: 1e-12 }, 'chart');
      assertClose(outputs.capacity_w / B, 8300, { rel: 1e-12 }, 'adjusted');
      assertClose(outputs.capacity_kw_w / 1000, 2.4325, { abs: 1e-4 }, 'kW');
      assertClose(outputs.capacity_tons_w / (12000 * B), 0.6917, { abs: 1e-4 }, 'tons');
    },
  },
  {
    name: 'Chart rows: 100 → 5 000, 150 → 6 000, 450 → 12 000, 700 → 18 000, 1 500 → 30 000, 2 500 → 34 000 Btu/h; under 100 ft² takes 5 000',
    source: 'ENERGY STAR room air conditioner sizing chart (each row from its lower area up to the next)',
    run: () => {
      [[100, 5000], [150, 6000], [449, 10000], [450, 12000], [700, 18000], [1500, 30000], [2500, 34000], [60, 5000]].forEach(([a, b]) => assertEqual(chartBtuH(a), b, `${a} ft²`));
      assertEqual(chartBtuH(2600), null, 'above chart');
    },
  },
  {
    name: 'A 300 ft² room entered in feet lands on the 8 000 Btu/h row, not 7 000; shaded removes 10 %; a kitchen adds 4 000',
    source: 'ENERGY STAR: 300–350 ft² → 8 000 Btu/h; −10 % heavily shaded; +4 000 Btu/h kitchen',
    run: () => {
      const base = { length_m: 20 * FT, width_m: 15 * FT, people: 2 };
      assertClose(calculate({ ...base, sun: 'normal' }).outputs.capacity_w / B, 8000, { rel: 1e-12 }, '300 ft²');
      assertClose(calculate({ ...base, sun: 'shaded' }).outputs.capacity_w / B, 7200, { rel: 1e-12 }, 'shaded');
      assertClose(calculate({ ...base, sun: 'normal', kitchen: 'yes' }).outputs.capacity_w / B, 12000, { rel: 1e-12 }, 'kitchen');
    },
  },
  {
    name: 'Metric room 4 × 5 m = 20 m² = 215 ft²: 6 000 Btu/h (1.76 kW) with two people and normal sun; rule of thumb 4 306 Btu/h',
    source: 'ENERGY STAR chart 150–250 ft²; rule of thumb 20 Btu/h per ft²',
    run: () => {
      const { outputs } = calculate({ length_m: 5, width_m: 4, sun: 'normal', people: 2 });
      assertClose(outputs.capacity_kw_w / 1000, 1.7584, { abs: 1e-4 }, 'kW');
      assertClose(outputs.rule_w / B, 4305.6, { abs: 0.1 }, 'rule');
    },
  },
  {
    name: 'Above 2 500 ft² is rejected with a pointer to Manual J; zero size and negative people are rejected',
    source: 'Chart range; validation contract',
    run: () => {
      assertThrows(() => calculate({ length_m: 20, width_m: 15 }), 'Manual J');
      assertThrows(() => calculate({ length_m: 0 }), 'Room length must be greater than zero');
      assertThrows(() => calculate({ people: -1 }), 'People');
    },
  },
];
