/**
 * metal-weight/tests.js — checks against hand calculations and EN section tables.
 * Run: node run-tests.js metal-weight
 */
import { calculate } from './calc.js';
import { assertClose, assertThrows } from '../shared/test-runner.js';

const LB_FT = 0.45359237 / 0.3048;

export const tests = [
  {
    name: 'Steel round bar 20 mm × 6 m: 314.2 mm², 2.466 kg/m (1.657 lb/ft), 14.80 kg',
    source: 'm = 7 850 × π × 0.02²/4 × 6 (EN 1993-1-1 density)',
    run: () => {
      const o = calculate({ shape: 'round', material: 'steel', diameter_m: 0.02, length_m: 6 }).outputs;
      assertClose(o.area_m2 * 1e6, 314.16, { abs: 0.01 }, 'A');
      assertClose(o.per_m_kg_m, 2.466, { abs: 0.001 }, 'kg/m');
      assertClose(o.per_ft_kg_m / LB_FT, 1.657, { abs: 0.001 }, 'lb/ft');
      assertClose(o.piece_kg, 14.796, { abs: 0.001 }, 'piece');
    },
  },
  {
    name: 'Circular hollow section 48.3 × 3.2 mm: 3.56 kg/m, matching EN 10219-2',
    source: 'EN 10219-2:2006 Table B.3 (48.3 × 3.2: 3.56 kg/m)',
    run: () => {
      assertClose(calculate({ shape: 'pipe', diameter_m: 0.0483, thickness_m: 0.0032, length_m: 1 }).outputs.per_m_kg_m, 3.56, { abs: 0.005 }, 'kg/m');
    },
  },
  {
    name: 'Steel plate 2 000 × 1 000 × 10 mm weighs 157 kg (78.5 kg/m²); the same in aluminium 54 kg',
    source: '7 850 × 2 × 1 × 0.01; 2 700 × 0.02',
    run: () => {
      assertClose(calculate({ shape: 'plate', width_m: 1, thickness_m: 0.01, length_m: 2 }).outputs.piece_kg, 157, { rel: 1e-12 }, 'steel');
      assertClose(calculate({ shape: 'plate', material: 'aluminium', width_m: 1, thickness_m: 0.01, length_m: 2 }).outputs.piece_kg, 54, { rel: 1e-12 }, 'aluminium');
    },
  },
  {
    name: 'Angle 50 × 50 × 5: A = t(a + b − t) = 475 mm², 3.73 kg/m (catalogue 3.77 with root fillet); hex 20 mm A/F: (√3/2) s² = 346.4 mm²; 10 pieces sum',
    source: 'EN 10056-1 (L 50 × 50 × 5: 3.77 kg/m); hexagon area',
    run: () => {
      const a = calculate({ shape: 'angle', width_m: 0.05, height_m: 0.05, thickness_m: 0.005, length_m: 1 }).outputs;
      assertClose(a.area_m2 * 1e6, 475, { rel: 1e-12 }, 'angle A');
      assertClose(a.per_m_kg_m / 3.77, 0.99, { abs: 0.01 }, 'vs catalogue');
      assertClose(calculate({ shape: 'hex', side_m: 0.02 }).outputs.area_m2 * 1e6, 346.41, { abs: 0.01 }, 'hex');
      const ten = calculate({ shape: 'square', side_m: 0.01, length_m: 2, count: 10 }).outputs;
      assertClose(ten.total_kg, 10 * ten.piece_kg, { rel: 1e-12 }, 'count');
    },
  },
  {
    name: 'Walls too thick, oversize flanges, zero pieces and an unknown material are rejected; a custom density is used',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ shape: 'pipe', diameter_m: 0.02, thickness_m: 0.01 }), 'Thickness');
      assertThrows(() => calculate({ shape: 'ibeam', height_m: 0.1, flange_m: 0.06 }), 'Flange thickness');
      assertThrows(() => calculate({ count: 0 }), 'Number of pieces');
      assertThrows(() => calculate({ material: 'gold' }), 'Material');
      assertClose(calculate({ material: 'custom', density_kg_m3: 1000, diameter_m: 0.02, length_m: 1 }).outputs.piece_kg, 0.31416, { abs: 1e-5 }, 'custom');
    },
  },
];
