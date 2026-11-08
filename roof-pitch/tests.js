/**
 * roof-pitch/tests.js — checks against the pitch multipliers of the right triangle, hand calculations of rafter length
 * and roof area, and the IRC R905.2.2 shingle slope limits.
 * Run: node run-tests.js roof-pitch
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;

export const tests = [
  {
    name: 'Pitch multipliers √(1 + (p/12)²): 4/12 1.0541, 6/12 1.1180, 8/12 1.2019, 12/12 1.4142 (45°)',
    source: 'Right-triangle geometry; the same values appear in rafter tables of a carpenter\'s framing square',
    run: () => {
      [[4, 1.0541], [6, 1.1180], [8, 1.2019], [12, 1.4142]].forEach(([p, k]) => assertClose(calculate({ pitch: p }).outputs.multiplier, k, { abs: 1e-4 }, `${p}/12`));
      assertClose(calculate({ pitch: 12 }).outputs.angle_out_rad * 180 / Math.PI, 45, { abs: 1e-9 }, '45°');
      assertClose(calculate({ pitch: 6 }).outputs.angle_out_rad * 180 / Math.PI, 26.565, { abs: 1e-3 }, '6/12 angle');
    },
  },
  {
    name: '24 × 40 ft gable, 6/12, 1 ft overhangs: rafter 14.53 ft, ridge 6 ft, area 1 221 ft², 13.43 squares, 41 bundles with 10 % waste',
    source: 'Hand calculation: (12 + 1) × 1.1180 = 14.534; 26 × 42 × 1.1180 = 1 220.9 ft²; × 1.1 / 100 = 13.43; × 3 = 40.3 → 41',
    run: () => {
      const o = calculate({ pitch: 6, span_m: 24 * FT, length_m: 40 * FT, eave_m: FT, rake_m: FT, waste: 0.1, bundles_per_square: 3 }).outputs;
      assertClose(o.rafter_m / FT, 14.5344, { abs: 1e-4 }, 'rafter');
      assertClose(o.ridge_m / FT, 6, { abs: 1e-9 }, 'ridge');
      assertClose(o.area_m2 / (FT * FT), 1220.893, { abs: 1e-3 }, 'area');
      assertClose(o.squares, 13.4298, { abs: 1e-4 }, 'squares');
      assertEqual(o.bundles, 41, 'bundles');
      assertEqual(o.pitch_text, '6/12', 'text');
    },
  },
  {
    name: 'Input forms agree: 30° is 6.93/12 and 57.7 %; a 50 % grade is 6/12',
    source: 'tan 30° = 0.57735; 12 × 0.57735 = 6.928',
    run: () => {
      const a = calculate({ mode: 'angle', angle_rad: Math.PI / 6 }).outputs;
      assertEqual(a.pitch_text, '6.93/12', 'pitch text');
      assertClose(a.grade_out, 0.57735, { abs: 1e-5 }, 'grade');
      assertClose(calculate({ mode: 'percent', grade: 0.5 }).outputs.multiplier, calculate({ pitch: 6 }).outputs.multiplier, { rel: 1e-12 }, 'same');
    },
  },
  {
    name: 'IRC R905.2.2 and R905.1.1: 1.5/12 is too flat for shingles, 3/12 needs double underlayment, 4/12 is standard',
    source: 'IRC 2021 R905.2.2 (asphalt shingles only on slopes of 2/12 or greater) and R905.1.1 (underlayment for slopes from 2/12 to below 4/12)',
    run: () => {
      assertEqual(calculate({ pitch: 1.5 }).outputs.roofing.startsWith('Below 2/12'), true, 'flat');
      assertEqual(calculate({ pitch: 3 }).outputs.roofing.startsWith('Low slope'), true, 'low');
      assertEqual(calculate({ pitch: 4 }).outputs.roofing.startsWith('4/12 or steeper'), true, 'standard');
    },
  },
  {
    name: 'No overhang and no waste: a flat 10 × 10 m plan at 12/12 has 141.4 m² of roof; a zero span and 2.5 bundles per square are rejected',
    source: 'Hand calculation: 100 m² × √2 = 141.42 m²; validation contract',
    run: () => {
      const o = calculate({ pitch: 12, span_m: 10, length_m: 10, eave_m: 0, rake_m: 0, waste: 0 }).outputs;
      assertClose(o.area_m2, 141.421, { abs: 1e-3 }, 'area');
      assertThrows(() => calculate({ span_m: 0 }), 'Building width');
      assertThrows(() => calculate({ bundles_per_square: 2.5 }), 'Bundles per square must be a whole number');
    },
  },
];
