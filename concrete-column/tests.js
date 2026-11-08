/**
 * concrete-column/tests.js — checks against hand calculations for post holes and round columns.
 * Run: node run-tests.js concrete-column
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const IN = 0.0254;
const YD3 = 0.764554857984;
const FT3 = 0.028316846592;

export const tests = [
  {
    name: 'Ten 12 in holes 36 in deep around 4 × 4 posts: 2.10 ft³ and 3.50 bags of 80 lb per hole, 23.1 ft³ and 39 bags with 10 % waste',
    source: '(π/4 × 1² − 3.5²/144) × 3 = (0.7854 − 0.0851) × 3 = 2.101 ft³; / 0.60 = 3.50; × 10 × 1.1 = 23.11 ft³; / 0.60 = 38.5 → 39',
    run: () => {
      const { outputs } = calculate({ type: 'post', diameter_m: 12 * IN, depth_m: 36 * IN, post_shape: 'square', post_size_m: 3.5 * IN, count: 10, waste: 0.1, bag: 'lb80' });
      assertClose(outputs.each_m3 / FT3, 2.101, { abs: 0.001 }, 'per hole');
      assertClose(outputs.bags_each, 3.502, { abs: 0.001 }, 'bags per hole');
      assertClose(outputs.order_m3 / FT3, 23.111, { abs: 0.001 }, 'order');
      assertEqual(outputs.bags, 39, 'bags');
    },
  },
  {
    name: 'Four 12 in tube forms 4 ft tall: π ft³ each = 5.24 bags of 80 lb, 0.465 yd³ in total, 21 bags',
    source: 'π/4 × 1² × 4 = 3.1416 ft³; × 4 = 12.566 ft³ = 0.4654 yd³; / 0.60 = 20.9 → 21',
    run: () => {
      const { outputs } = calculate({ type: 'column', diameter_m: 12 * IN, depth_m: 4 * FT, count: 4, waste: 0 });
      assertClose(outputs.each_m3 / FT3, Math.PI, { rel: 1e-12 }, 'per column');
      assertClose(outputs.volume_m3 / YD3, 0.4654, { abs: 1e-4 }, 'yd³');
      assertEqual(outputs.bags, 21, 'bags');
    },
  },
  {
    name: 'Metric: 300 mm hole 800 mm deep, 100 mm round post, 100 mm of gravel: 0.0440 m³, 3.76 bags of 25 kg, so 4 bags',
    source: '(π/4 × 0.3² − π/4 × 0.1²) × (0.8 − 0.1) = 0.06283 × 0.7 = 0.04398 m³; 25 kg yields 11.7 L',
    run: () => {
      const { outputs } = calculate({ type: 'post', diameter_m: 0.3, depth_m: 0.8, post_shape: 'round', post_size_m: 0.1, gravel_m: 0.1, count: 1, waste: 0, bag: 'kg25' });
      assertClose(outputs.each_m3, 0.043982, { abs: 1e-6 }, 'm³');
      assertClose(outputs.bags_each, 3.757, { abs: 0.001 }, 'bags each');
      assertEqual(outputs.bags, 4, 'bags');
    },
  },
  {
    name: 'A 6 in hole for a 4 × 4 post is narrow and warns; a 3.5 in post in a 4 in hole does not fit and is rejected',
    source: 'Fencing rule of thumb: hole about three times the post width; a square post needs a hole wider than its diagonal',
    run: () => {
      const narrow = calculate({ diameter_m: 6 * IN, post_size_m: 3.5 * IN, count: 1 });
      assertEqual(narrow.warnings.some((w) => w.includes('three times')), true, 'narrow warns');
      assertThrows(() => calculate({ diameter_m: 4 * IN, post_size_m: 3.5 * IN }), 'does not fit');
    },
  },
  {
    name: 'Gravel deeper than the hole, zero diameter and an unknown type are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ depth_m: 0.5, gravel_m: 0.6 }), 'gravel fills the whole hole');
      assertThrows(() => calculate({ diameter_m: 0 }), 'Hole or column diameter must be greater than zero');
      assertThrows(() => calculate({ type: 'wall' }), 'What are you filling?');
    },
  },
];
