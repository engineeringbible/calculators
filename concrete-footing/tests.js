/**
 * concrete-footing/tests.js — checks against hand calculations for strip and pad footings.
 * Run: node run-tests.js concrete-footing
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const IN = 0.0254;
const YD3 = 0.764554857984;
const FT3 = 0.028316846592;

export const tests = [
  {
    name: 'Garage walls on a 24 × 24 ft centreline square (96 ft), 16 × 8 in strip footing: 85.3 ft³ = 3.16 yd³, 3.48 yd³ with 10 % waste, 157 bags of 80 lb',
    source: '96 × 16/12 × 8/12 = 85.33 ft³; /27 = 3.160 yd³; × 1.1 = 93.87 ft³; / 0.60 = 156.4 → 157',
    run: () => {
      const { outputs } = calculate({ type: 'strip', length_m: 96 * FT, width_m: 16 * IN, depth_m: 8 * IN, waste: 0.1, bag: 'lb80' });
      assertClose(outputs.volume_m3 / FT3, 85.333, { abs: 0.001 }, 'ft³');
      assertClose(outputs.volume_m3 / YD3, 3.1605, { abs: 1e-4 }, 'yd³');
      assertClose(outputs.order_m3 / YD3, 3.4765, { abs: 1e-4 }, 'order');
      assertEqual(outputs.bags, 157, 'bags');
    },
  },
  {
    name: 'Six 24 × 24 in pads, 12 in deep under deck posts: 24 ft³ = 0.889 yd³, 40 bags of 80 lb with no waste',
    source: '6 × 2 × 2 × 1 = 24 ft³; 24 / 0.60 = 40',
    run: () => {
      const { outputs } = calculate({ type: 'pad', pad_length_m: 24 * IN, width_m: 24 * IN, depth_m: 12 * IN, count: 6, waste: 0 });
      assertClose(outputs.volume_m3 / FT3, 24, { rel: 1e-12 }, 'ft³');
      assertClose(outputs.volume_m3 / YD3, 0.8889, { abs: 1e-4 }, 'yd³');
      assertEqual(outputs.bags, 40, 'bags');
    },
  },
  {
    name: 'Metric strip footing 40 m × 600 mm × 300 mm: 7.2 m³, 7.92 m³ with 10 % waste, ready-mix at 120 per m³ costs 950.40',
    source: '40 × 0.6 × 0.3 = 7.2 m³',
    run: () => {
      const { outputs } = calculate({ type: 'strip', length_m: 40, width_m: 0.6, depth_m: 0.3, waste: 0.1, price_readymix: 120 });
      assertClose(outputs.volume_m3, 7.2, { rel: 1e-12 }, 'm³');
      assertClose(outputs.cost_readymix, 950.4, { rel: 1e-12 }, 'cost');
      assertClose(outputs.weight_kg, 17280, { rel: 1e-12 }, 'weight at 2 400 kg/m³');
    },
  },
  {
    name: 'A 10 × 5 in footing is below the IRC minimum and warns; a 12 × 6 in footing does not',
    source: 'IRC (2021) R403.1.1: footings not less than 12 in wide and 6 in thick',
    run: () => {
      const small = calculate({ type: 'strip', length_m: 3, width_m: 10 * IN, depth_m: 5 * IN }).warnings;
      assertEqual(small.some((w) => w.includes('R403.1.1')), true, 'small warns');
      const ok = calculate({ type: 'strip', length_m: 3, width_m: 12 * IN, depth_m: 6 * IN }).warnings;
      assertEqual(ok.some((w) => w.includes('R403.1.1')), false, 'minimum passes');
    },
  },
  {
    name: 'Zero width, zero pads and an unknown type are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ width_m: 0 }), 'Width must be greater than zero');
      assertThrows(() => calculate({ type: 'pad', count: 0 }), 'Number of pads');
      assertThrows(() => calculate({ type: 'ring' }), 'Footing type');
    },
  },
];
