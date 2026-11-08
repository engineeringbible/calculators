/**
 * concrete-slab/tests.js — checks against hand calculations of V = L × W × t and premix yields.
 * Run: node run-tests.js concrete-slab
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const IN = 0.0254;
const YD3 = 0.764554857984;
const FT3 = 0.028316846592;

export const tests = [
  {
    name: '10 × 10 ft patio, 4 in thick: 33.3 ft³ = 1.23 yd³, 1.36 yd³ with 10 % waste, 62 bags of 80 lb, about 4 990 lb in place',
    source: 'V = 10 × 10 × 4/12 = 33.33 ft³; 1 yd³ = 27 ft³; 36.67 ft³ / 0.60 ft³ per bag = 61.1 → 62',
    run: () => {
      const { outputs } = calculate({ length_m: 10 * FT, width_m: 10 * FT, thickness_m: 4 * IN, waste: 0.1, bag: 'lb80' });
      assertClose(outputs.volume_m3 / YD3, 1.2346, { abs: 1e-4 }, 'yd³');
      assertClose(outputs.order_m3 / YD3, 1.3580, { abs: 1e-4 }, 'order yd³');
      assertClose(outputs.order_ft3_m3 / FT3, 36.667, { abs: 0.001 }, 'ft³');
      assertEqual(outputs.bags, 62, 'bags');
      assertClose(outputs.weight_kg / 0.45359237, 4994, { abs: 1 }, 'lb');
      assertClose(outputs.area_m2 / (FT * FT), 100, { rel: 1e-12 }, 'area');
    },
  },
  {
    name: 'Metric shed base 5 × 4 m, 100 mm, 5 % waste: 2.0 m³, 2.1 m³ to order, 180 bags of 25 kg, ready-mix at 150 per m³ costs 315',
    source: '25 kg bag yields 11.7 L (0.60 ft³ per 80 lb by mass); 2.1 / 0.011705 = 179.4 → 180',
    run: () => {
      const { outputs } = calculate({ length_m: 5, width_m: 4, thickness_m: 0.1, waste: 0.05, bag: 'kg25', price_readymix: 150 });
      assertClose(outputs.volume_m3, 2, { rel: 1e-12 }, 'm³');
      assertClose(outputs.order_m3, 2.1, { rel: 1e-12 }, 'order');
      assertEqual(outputs.bags, 180, 'bags');
      assertClose(outputs.cost_readymix, 315, { rel: 1e-12 }, 'cost');
      assertEqual(outputs.cost_bags, null, 'no bag price');
    },
  },
  {
    name: 'Driveway 12 × 40 ft, 6 in thick, no waste: 240 ft³ = 8.89 yd³; at $180 per yd³ it costs $1 600',
    source: '12 × 40 × 0.5 = 240 ft³; 240 / 27 = 8.889 yd³; 8.889 × 180 = 1 600',
    run: () => {
      const { outputs } = calculate({ length_m: 40 * FT, width_m: 12 * FT, thickness_m: 6 * IN, waste: 0, price_readymix: 180 / YD3 });
      assertClose(outputs.volume_m3 / YD3, 8.8889, { abs: 1e-4 }, 'yd³');
      assertClose(outputs.cost_readymix, 1600, { rel: 1e-9 }, 'cost');
    },
  },
  {
    name: 'Three 4 × 4 ft pads, 4 in thick: 16 ft³, 27 bags of 80 lb and $162 at $6 a bag with no waste',
    source: '3 × 4 × 4 × 1/3 = 16 ft³; 16 / 0.6 = 26.7 → 27',
    run: () => {
      const { outputs } = calculate({ length_m: 4 * FT, width_m: 4 * FT, thickness_m: 4 * IN, count: 3, waste: 0, price_bag: 6 });
      assertClose(outputs.volume_m3 / FT3, 16, { rel: 1e-12 }, 'ft³');
      assertEqual(outputs.bags, 27, 'bags');
      assertClose(outputs.cost_bags, 162, { rel: 1e-12 }, 'cost');
    },
  },
  {
    name: 'A 3 in slab warns; a small slab gives no ready-mix hint; zero length and an unknown bag are rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      assertEqual(calculate({ length_m: 2, width_m: 2, thickness_m: 3 * IN }).warnings.length, 1, 'thin');
      assertEqual(calculate({ length_m: 2, width_m: 2, thickness_m: 0.1 }).warnings.length, 0, 'small');
      assertThrows(() => calculate({ length_m: 0 }), 'Length must be greater than zero');
      assertThrows(() => calculate({ bag: 'lb90' }), 'Premix bag size');
    },
  },
];
