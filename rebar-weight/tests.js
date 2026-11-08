/**
 * rebar-weight/tests.js — checks against ASTM A615 Table 1, the d²/162 rule and hand counts of slab grids.
 * Run: node run-tests.js rebar-weight
 */
import { calculate, barData, US_BARS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const LB_FT = 0.45359237 / 0.3048;
const FT = 0.3048;
const IN = 0.0254;

export const tests = [
  {
    name: '20 × 20 ft slab, #4 at 12 in each way, 3 in cover: 20 + 20 bars of 19.5 ft = 780 ft, 521.0 lb, 0.20 in² per ft',
    source: 'N = floor((240 − 6)/12) + 1 = 20 each way; ASTM A615 #4: 0.668 lb/ft, 0.20 in²',
    run: () => {
      const o = calculate({ bar: '#4', mode: 'grid', length_m: 20 * FT, width_m: 20 * FT, spacing_m: 12 * IN, cover_m: 3 * IN, layers: 1, laps: 0 }).outputs;
      assertEqual(o.bars, 40, 'bars');
      assertClose(o.total_length_m / FT, 780, { rel: 1e-9 }, 'length');
      assertClose(o.total_kg / 0.45359237, 521.04, { abs: 0.01 }, 'lb');
      assertClose(o.as_m2_m, 0.2, { rel: 1e-9 }, 'in²/ft');
    },
  },
  {
    name: 'ASTM A615 unit weights equal 490 lb/ft³ steel on the nominal diameter within 0.3 % for every bar #3 to #18',
    source: 'ASTM A615/A615M-22 Table 1',
    run: () => {
      for (const [k, [d, , w]] of Object.entries(US_BARS)) assertClose(w, (490 * Math.PI * d * d) / 4 / 144, { rel: 0.003 }, k);
    },
  },
  {
    name: 'Metric: 12 mm weighs 0.888 kg/m (d²/162), 16 mm 1.578, 25 mm 3.853 kg/m; a 6 × 4 m slab, 12 mm at 200 mm, 40 mm cover: 50 bars, 236 m, 209.5 kg, 565 mm²/m',
    source: 'EN 10080 nominal mass 0.006165 d²; hand count 20 + 30 bars',
    run: () => {
      assertClose(barData('12mm')[2], 0.888, { abs: 0.001 }, '12');
      assertClose(barData('16mm')[2], 1.578, { abs: 0.001 }, '16');
      assertClose(barData('25mm')[2], 3.853, { abs: 0.001 }, '25');
      const o = calculate({ bar: '12mm', mode: 'grid', length_m: 6, width_m: 4, spacing_m: 0.2, cover_m: 0.04 }).outputs;
      assertEqual(o.bars, 50, 'bars');
      assertClose(o.total_length_m, 236, { rel: 1e-9 }, 'm');
      assertClose(o.total_kg, 209.52, { abs: 0.01 }, 'kg');
      assertClose(o.as_m2_m, 565.49, { abs: 0.01 }, 'mm²/m');
    },
  },
  {
    name: 'Pieces: 25 bars of #5 at 20 ft with 10 % laps = 550 ft and 573.7 lb; two layers double a grid',
    source: '#5: 1.043 lb/ft; 25 × 20 × 1.1 = 550 ft',
    run: () => {
      const o = calculate({ bar: '#5', mode: 'pieces', pieces: 25, length_m: 20 * FT, laps: 0.1 }).outputs;
      assertClose(o.total_length_m / FT, 550, { rel: 1e-9 }, 'ft');
      assertClose(o.total_kg / 0.45359237, 573.65, { abs: 0.01 }, 'lb');
      const one = calculate({ layers: 1 }).outputs.total_kg;
      assertClose(calculate({ layers: 2 }).outputs.total_kg, 2 * one, { rel: 1e-12 }, 'layers');
      assertClose(calculate({ bar: '#8' }).outputs.unit_kg_m / LB_FT, 2.67, { rel: 1e-12 }, '#8');
    },
  },
  {
    name: 'Tight spacing warns; cover larger than the slab and unknown sizes are rejected',
    source: 'ACI 318 §25.2 minimum spacing; validation contract',
    run: () => {
      assertEqual(calculate({ bar: '#8', spacing_m: 0.03 }).warnings.length, 1, 'tight');
      assertThrows(() => calculate({ cover_m: 4 }), 'Edge cover');
      assertThrows(() => calculate({ bar: '#20' }), 'Bar size');
    },
  },
];
