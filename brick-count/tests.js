/**
 * brick-count/tests.js — checks against BIA Technical Note 10 Tables 4 and 5 and hand calculations.
 * Run: node run-tests.js brick-count
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const FT = 0.3048;
const FT2 = 0.09290304;
const FT3 = 0.028316846592;

export const tests = [
  {
    name: 'BIA TN 10 Table 4, modular brick: mortar 8.1 ft³ per 1 000 bricks with ⅜ in joints and 10.3 with ½ in joints',
    source: 'Brick Industry Association TN 10 (2009), Table 4: modular 4 × 2⅔ × 8 nominal, ⅜ in 8.1 and ½ in 10.3 ft³ per 1 000 brick',
    run: () => {
      assertClose(calculate({ brick: 'modular', joint_m: 0.375 * IN }).outputs.mortar_per_1000_m3 / FT3, 8.1, { abs: 0.05 }, '⅜ in');
      const half = calculate({ brick: 'custom', brick_l_m: 7.5 * IN, brick_h_m: (2 + 3 / 16) * IN, brick_w_m: 3.5 * IN, joint_m: 0.5 * IN }).outputs;
      assertClose(half.mortar_per_1000_m3 / FT3, 10.3, { abs: 0.05 }, '½ in');
    },
  },
  {
    name: 'BIA TN 10 Table 4 counts: standard brick 655 per 100 ft² and king 455 per 100 ft² with ⅜ in joints',
    source: 'Brick Industry Association TN 10, Table 4 (non-modular sizes); 144 / (8⅜ × 2⅝) = 6.55 per ft²',
    run: () => {
      assertClose(calculate({ brick: 'standard' }).outputs.per_ft2 * 100, 655, { abs: 0.5 }, 'standard');
      assertClose(calculate({ brick: 'king' }).outputs.per_ft2 * 100, 455, { abs: 0.5 }, 'king');
    },
  },
  {
    name: '20 × 8 ft wall less a 12 ft² window, modular, ⅜ in joints: 1 015 bricks, 1 066 with 5 % waste, 8.18 ft³ of mortar, 27 bags',
    source: 'Hand calculation: 148 ft² × 144 / (8 × 2.625) = 1 014.9; mortar (21 − 7.625 × 2.25) × 3.625 = 13.93 in³ per brick',
    run: () => {
      const o = calculate({ brick: 'modular', joint_m: 0.375 * IN, length_m: 20 * FT, height_m: 8 * FT, openings_m2: 12 * FT2, wythes: '1', waste: 0.05, bricks_per_bag: 37 }).outputs;
      assertClose(o.per_ft2, 6.857143, { abs: 1e-6 }, 'per ft²');
      assertEqual(o.bricks_net, 1015, 'net');
      assertEqual(o.bricks, 1066, 'with waste');
      assertClose(o.mortar_m3 / FT3, 8.183, { abs: 1e-3 }, 'mortar');
      assertEqual(o.bags, 27, 'bags');
    },
  },
  {
    name: 'Double wythe adds the collar joint of BIA TN 10 Table 5: 3.13 ft³ per 100 ft² for a ⅜ in joint',
    source: 'Brick Industry Association TN 10, Table 5 (mortar in collar joints): ⅜ in, 3.13 ft³ per 100 ft²',
    run: () => {
      const base = { brick: 'modular', joint_m: 0.375 * IN, length_m: 12.5 * FT, height_m: 8 * FT, openings_m2: 0, waste: 0 };
      const one = calculate({ ...base, wythes: '1' }).outputs;
      const two = calculate({ ...base, wythes: '2' }).outputs;
      assertClose((two.mortar_m3 - 2 * one.mortar_m3) / FT3, 3.125, { abs: 1e-6 }, 'collar');
      assertEqual(two.bricks_net, 1372, '2 × 685.7 → 1 372');
    },
  },
  {
    name: 'UK bricks 215 × 65 mm with 10 mm joints: 59.3 per m²; zero joint warns; openings larger than the wall are rejected',
    source: 'Hand calculation: 1 / (0.225 × 0.075) = 59.26 per m²; validation contract',
    run: () => {
      assertClose(calculate({ brick: 'uk', joint_m: 0.01 }).outputs.per_m2, 59.259, { abs: 1e-3 }, 'per m²');
      assertEqual(calculate({ joint_m: 0 }).warnings.some((w) => w.includes('dry-laid')), true, 'dry');
      assertThrows(() => calculate({ length_m: 2, height_m: 2, openings_m2: 5 }), 'must be smaller than the wall');
      assertThrows(() => calculate({ brick: 'roman' }), 'Brick size');
    },
  },
];
