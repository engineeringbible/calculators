/**
 * concrete-bags/tests.js — checks against premix yield charts and unit conversions.
 * Run: node run-tests.js concrete-bags
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const YD3 = 0.764554857984;
const FT3 = 0.028316846592;
const LB = 0.45359237;

export const tests = [
  {
    name: 'One cubic yard: 45 bags of 80 lb (3 600 lb), 0.600 ft³ per bag, 58.9 bags per m³',
    source: 'US premix yield charts: 45 × 80 lb bags per cubic yard; 27 ft³ / 0.60 ft³ = 45',
    run: () => {
      const { outputs } = calculate({ volume_m3: YD3, waste: 0, bag: 'lb80' });
      assertEqual(outputs.bags, 45, 'bags');
      assertClose(outputs.yield_m3 / FT3, 0.6, { rel: 1e-12 }, 'yield');
      assertClose(outputs.per_yd3, 45, { rel: 1e-12 }, 'per yd³');
      assertClose(outputs.per_m3, 58.86, { abs: 0.01 }, 'per m³');
      assertClose(outputs.dry_kg / LB, 3600, { rel: 1e-12 }, 'weight');
    },
  },
  {
    name: 'One cubic yard in other sizes: 60 bags of 60 lb, 72 of 50 lb, 90 of 40 lb',
    source: 'US premix yield charts (0.45, 0.375 and 0.30 ft³ per bag)',
    run: () => {
      assertEqual(calculate({ volume_m3: YD3, bag: 'lb60' }).outputs.bags, 60, '60 lb');
      assertEqual(calculate({ volume_m3: YD3, bag: 'lb50' }).outputs.bags, 72, '50 lb');
      assertEqual(calculate({ volume_m3: YD3, bag: 'lb40' }).outputs.bags, 90, '40 lb');
      assertEqual(calculate({ volume_m3: YD3 }).outputs.bags_all, '80 lb: 45 · 60 lb: 60 · 50 lb: 72 · 40 lb: 90 · 30 kg: 55 · 25 kg: 66 · 20 kg: 82', 'summary');
    },
  },
  {
    name: '10 ft³ with 10 % waste: 11 ft³ = 18.33 bags of 80 lb, so 19 bags, $114 at $6 each',
    source: '10 × 1.1 / 0.60 = 18.33',
    run: () => {
      const { outputs } = calculate({ volume_m3: 10 * FT3, waste: 0.1, bag: 'lb80', price_bag: 6 });
      assertClose(outputs.bags_exact, 18.333, { abs: 0.001 }, 'exact');
      assertEqual(outputs.bags, 19, 'bags');
      assertClose(outputs.cost, 114, { rel: 1e-12 }, 'cost');
    },
  },
  {
    name: 'Half a cubic metre in 25 kg bags: 42.7, so 43 bags, 1 075 kg to carry',
    source: '25 kg yields 11.705 L (0.60 ft³ per 80 lb by mass); 0.5 / 0.011705 = 42.72',
    run: () => {
      const { outputs } = calculate({ volume_m3: 0.5, bag: 'kg25' });
      assertClose(outputs.bags_exact, 42.72, { abs: 0.01 }, 'exact');
      assertEqual(outputs.bags, 43, 'bags');
      assertClose(outputs.dry_kg, 1075, { rel: 1e-12 }, 'weight');
      assertEqual(outputs.cost, null, 'no price');
    },
  },
  {
    name: 'Two cubic yards hints at ready-mix; zero volume and an unknown bag are rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      assertEqual(calculate({ volume_m3: 2 * YD3 }).warnings.length, 1, 'ready-mix hint');
      assertEqual(calculate({ volume_m3: YD3 }).warnings.length, 0, 'exactly one yard');
      assertThrows(() => calculate({ volume_m3: 0 }), 'Volume of concrete needed must be greater than zero');
      assertThrows(() => calculate({ bag: 'kg50' }), 'Premix bag size');
    },
  },
];
