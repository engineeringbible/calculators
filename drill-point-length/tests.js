/**
 * drill-point-length/tests.js — checks against the Haas multipliers and the cone geometry.
 * Run: node run-tests.js drill-point-length
 */
import { calculate, pointLength } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;

export const tests = [
  {
    name: 'Haas: point length 0.30043 D at 118° and 0.207 D at 135°; 140° gives 0.1820 D',
    source: 'Haas Automation, Working out drill depth; L = (D/2) / tan(θ/2)',
    run: () => {
      assertClose(pointLength(1, 118), 0.30043, { abs: 0.000005 }, '118°');
      assertClose(pointLength(1, 135), 0.20711, { abs: 0.000005 }, '135°');
      assertClose(pointLength(1, 140), 0.18199, { abs: 0.000005 }, '140°');
    },
  },
  {
    name: 'Blind hole: 1/2 in drill at 118°, 1 in full depth: point 0.1502 in, drill to 1.1502 in',
    source: 'Tip depth = depth + point length (hand calculation)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.point_m / IN, 0.150215, { abs: 0.000001 }, 'point');
      assertClose(o.drill_to_m / IN, 1.150215, { abs: 0.000001 }, 'tip depth');
    },
  },
  {
    name: 'Metric Haas example basis: a 12 mm drill at 135° adds 0.207 × 12 = 2.485 mm; through 10 mm plate with 1 mm breakthrough travels 13.485 mm',
    source: 'Haas Automation 135° multiplier (hand calculation)',
    run: () => {
      const o = calculate({ diameter_m: 0.012, angle_deg: 135, hole: 'through', depth_m: 0.01, breakthrough_m: 0.001 }).outputs;
      assertClose(o.point_m * 1000, 2.4853, { abs: 0.0001 }, 'point');
      assertClose(o.drill_to_m * 1000, 13.4853, { abs: 0.0001 }, 'travel');
    },
  },
  {
    name: 'Limiting cases: a 180° (flat) drill has no point; a 90° point is half the diameter; the table lists six angles',
    source: 'Cone geometry',
    run: () => {
      assertClose(pointLength(10, 180), 0, { abs: 1e-12 }, 'flat');
      assertClose(pointLength(10, 90), 5, { rel: 1e-12 }, '90°');
      assertEqual(calculate({}).outputs.table.rows.length, 6, 'table');
    },
  },
  {
    name: 'A point angle below 60°, zero thickness for a through hole and zero diameter are rejected; a hole over 10 D warns',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ angle_deg: 50 }), 'Point angle');
      assertThrows(() => calculate({ hole: 'through', depth_m: 0 }), 'thickness');
      assertThrows(() => calculate({ diameter_m: 0 }), 'Drill diameter');
      assertEqual(calculate({ depth_m: 6 * IN }).warnings.length, 1, 'deep hole');
    },
  },
];
