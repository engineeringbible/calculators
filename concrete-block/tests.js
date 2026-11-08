/**
 * concrete-block/tests.js — checks against the 0.889 ft² face of an 8 × 16 in block and NCMA TEK 4-2A Tables 2 and 3.
 * Run: node run-tests.js concrete-block
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const FT2 = 0.09290304;
const FT3 = 0.028316846592;
const YD3 = 0.764554857984;

export const tests = [
  {
    name: '40 × 8 ft wall of 8 in blocks grouted at 48 in: 360 blocks, 378 with 5 % waste, 23 bags, 19.5 ft³ = 0.723 yd³ of grout',
    source: 'Hand calculation: 320 ft² / (16 × 8 / 144) = 360; 360 / 16 per bag = 22.5 → 23; TEK 4-2A Table 3: 6.1 ft³ per 100 ft²',
    run: () => {
      const o = calculate({ unit: 'us8x16', width_in: '8', length_m: 40 * FT, height_m: 8 * FT, openings_m2: 0, waste: 0.05, grout: '48', blocks_per_bag: 16 }).outputs;
      assertClose(o.area_m2 / FT2, 320, { rel: 1e-12 }, 'area');
      assertEqual(o.blocks_net, 360, 'net');
      assertEqual(o.blocks, 378, 'with waste');
      assertClose(o.courses, 12, { abs: 1e-9 }, 'courses');
      assertEqual(o.bags, 23, 'bags');
      assertClose(o.grout_ft3_m3 / FT3, 19.52, { abs: 1e-9 }, 'grout ft³');
      assertClose(o.grout_m3 / YD3, 0.72296, { abs: 1e-5 }, 'grout yd³');
    },
  },
  {
    name: 'NCMA TEK 4-2A Table 3, solid grouted per 100 ft²: 6 in 25.6 ft³, 8 in 36.1, 10 in 47.0, 12 in 58.9; 12 in at 32 in o.c. 14.8',
    source: 'NCMA (CMHA) TEK 4-2A, Estimating Concrete Masonry Materials, Table 3 (two-core units, 3 % waste)',
    run: () => {
      const base = { length_m: 100 * FT / 8, height_m: 8 * FT, openings_m2: 0 };
      [['6', 25.6], ['8', 36.1], ['10', 47.0], ['12', 58.9]].forEach(([w, v]) => {
        assertClose(calculate({ ...base, width_in: w, grout: '8' }).outputs.grout_ft3_m3 / FT3, v, { abs: 1e-9 }, `${w} in`);
      });
      assertClose(calculate({ ...base, width_in: '12', grout: '32' }).outputs.grout_ft3_m3 / FT3, 14.8, { abs: 1e-9 }, '12 in at 32');
      assertEqual(calculate({ ...base, grout: 'none' }).outputs.grout_m3, null, 'hollow');
    },
  },
  {
    name: 'One block covers 0.889 ft², so 100 ft² takes 112.5 blocks (113); NCMA rate of 16 blocks per 80 lb bag gives 8 bags per 128 blocks',
    source: 'NCMA TEK 4-2A: 8 × 16 in face = 8/9 ft² per unit; Table 2: one 80 lb bag of preblended mortar lays 16 conventional CMU',
    run: () => {
      const o = calculate({ length_m: 100 * FT / 8, height_m: 8 * FT, openings_m2: 0, waste: 0, grout: 'none' }).outputs;
      assertEqual(o.blocks_net, 113, '112.5 → 113');
      const p = calculate({ length_m: 128 * 16 / 12 * FT / 12, height_m: 12 * 8 / 12 * FT, openings_m2: 0, waste: 0 }).outputs;
      assertEqual(p.blocks_net, 128, '128 blocks');
      assertEqual(p.bags, 8, '8 bags');
      assertEqual(calculate({ length_m: 128 * 16 / 12 * FT / 12, height_m: 8 * FT, openings_m2: 0, blocks_per_bag: 13 }).outputs.bags, 10, 'QUIKRETE rate 13: 128 / 13 = 9.8 → 10');
    },
  },
  {
    name: 'Metric 440 × 215 mm blocks: 9.88 per m², 10 × 2.25 m wall = 223 blocks, no grout estimate; openings are deducted',
    source: 'Hand calculation: 1 / (0.45 × 0.225) = 9.877 per m²; 22.5 × 9.877 = 222.2 → 223',
    run: () => {
      const o = calculate({ unit: 'metric440', length_m: 10, height_m: 2.25, openings_m2: 0, waste: 0 }).outputs;
      assertEqual(o.blocks_net, 223, 'blocks');
      assertEqual(o.grout_m3, null, 'no grout');
      assertClose(o.courses, 10, { abs: 1e-9 }, 'courses');
      const w = calculate({ unit: 'metric440', length_m: 10, height_m: 2.25, openings_m2: 2.25, waste: 0 }).outputs;
      assertEqual(w.blocks_net, 200, '20.25 m² → 200');
    },
  },
  {
    name: 'Openings as large as the wall, zero length and an unknown width are rejected; an off-module height warns',
    source: 'Behaviour specification; validation contract',
    run: () => {
      assertThrows(() => calculate({ length_m: 2, height_m: 2, openings_m2: 4 }), 'must be smaller than the wall');
      assertThrows(() => calculate({ length_m: 0 }), 'Wall length must be greater than zero');
      assertThrows(() => calculate({ width_in: '9' }), 'Block width');
      assertEqual(calculate({ height_m: 7.5 * FT }).warnings.some((w) => w.includes('whole number of courses')), true, 'courses warning');
    },
  },
];
