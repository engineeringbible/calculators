/**
 * moment-of-inertia/tests.js — checks against closed-form section properties and published pipe and beam tables.
 * Run: node run-tests.js moment-of-inertia
 */
import { calculate, composite } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const cm4 = (v) => v * 1e8;
const cm3 = (v) => v * 1e6;

export const tests = [
  {
    name: 'Rectangle 100 × 200 mm: A 20 000 mm², Ix = bh³/12 = 6 667 cm⁴, Iy 1 667 cm⁴, Sx = bh²/6 = 666.7 cm³, Zx = bh²/4 = 1 000 cm³, rx = h/√12 = 57.7 mm',
    source: 'Roark\'s Formulas for Stress and Strain, Table A.1 case 1',
    run: () => {
      const o = calculate({ shape: 'rect', width_m: 0.1, height_m: 0.2 }).outputs;
      assertClose(o.area_m2, 0.02, { rel: 1e-12 }, 'A');
      assertClose(cm4(o.ix_m4), 6666.667, { abs: 0.001 }, 'Ix');
      assertClose(cm4(o.iy_m4), 1666.667, { abs: 0.001 }, 'Iy');
      assertClose(cm3(o.sx_m3), 666.667, { abs: 0.001 }, 'Sx');
      assertClose(cm3(o.zx_m3), 1000, { rel: 1e-9 }, 'Zx');
      assertClose(o.rx_m * 1000, 57.735, { abs: 0.001 }, 'rx');
    },
  },
  {
    name: 'I-beam 200 × 100 × 5.6 × 8.5 mm (IPE 200 without fillets): Ix = [bh³ − (b − tw)(h − 2tf)³]/12 = 1 845.6 cm⁴, about 5 % below the catalogue 1 943 cm⁴ that includes root fillets',
    source: 'Closed form for a doubly symmetric I; EN 10365 IPE 200 catalogue Iy = 1 943 cm⁴',
    run: () => {
      const o = calculate({ shape: 'ibeam', width_m: 0.1, height_m: 0.2, flange_m: 0.0085, web_m: 0.0056 }).outputs;
      const closed = (0.1 * 0.2 ** 3 - 0.0944 * 0.183 ** 3) / 12;
      assertClose(o.ix_m4, closed, { rel: 1e-12 }, 'closed form');
      assertClose(cm4(o.ix_m4) / 1943, 0.95, { abs: 0.01 }, 'fillets');
    },
  },
  {
    name: 'T-section 100 × 100 × 10 × 10 mm: centroid 71.32 mm up, Ix 180.0 cm⁴, plastic axis 90.5 mm up, Zx 45.47 cm³',
    source: 'Parallel-axis theorem by hand: (95 × 1 000 + 45 × 900)/1 900; Z = 900 × 45.5 + 50 × 0.25 + 950 × 4.75',
    run: () => {
      const o = calculate({ shape: 'tee', width_m: 0.1, height_m: 0.1, flange_m: 0.01, web_m: 0.01 }).outputs;
      assertClose(o.ybar_m * 1000, 71.316, { abs: 0.001 }, 'ȳ');
      assertClose(cm4(o.ix_m4), 180.004, { abs: 0.01 }, 'Ix');
      assertClose(cm3(o.zx_m3), 45.475, { abs: 0.001 }, 'Zx');
    },
  },
  {
    name: '4 in Schedule 40 pipe (114.3 × 6.02 mm): I = 7.23 in⁴ = 300.9 cm⁴, J = 2I; solid 100 mm bar Z = d³/6 = 166.7 cm³',
    source: 'ASME B36.10M pipe dimensions; published Schedule 40 property tables (4 in: I = 7.23 in⁴)',
    run: () => {
      const t = calculate({ shape: 'tube', diameter_m: 0.1143, wall_m: 0.00602 }).outputs;
      assertClose(cm4(t.ix_m4), 300.9, { rel: 0.002 }, 'pipe I');
      assertClose(t.j_m4, 2 * t.ix_m4, { rel: 1e-12 }, 'J');
      assertClose(cm3(calculate({ shape: 'circle', diameter_m: 0.1 }).outputs.zx_m3), 166.667, { abs: 0.001 }, 'bar Z');
    },
  },
  {
    name: 'The rectangle routine agrees with box and triangle closed forms; impossible walls and flanges are rejected',
    source: 'Box: (bh³ − b_i h_i³)/12; triangle: bh³/36 with centroid at h/3',
    run: () => {
      const box = calculate({ shape: 'box', width_m: 0.1, height_m: 0.15, wall_m: 0.01 }).outputs;
      assertClose(box.ix_m4, (0.1 * 0.15 ** 3 - 0.08 * 0.13 ** 3) / 12, { rel: 1e-12 }, 'box');
      const tri = calculate({ shape: 'triangle', width_m: 0.3, height_m: 0.2 }).outputs;
      assertClose(tri.ix_m4, (0.3 * 0.2 ** 3) / 36, { rel: 1e-12 }, 'triangle');
      assertClose(tri.ybar_m, 0.2 / 3, { rel: 1e-12 }, 'ȳ');
      assertEqual(composite([[0, 1, 0, 1]]).A, 1, 'unit square');
      assertThrows(() => calculate({ shape: 'box', wall_m: 0.06 }), 'Wall thickness');
      assertThrows(() => calculate({ shape: 'ibeam', flange_m: 0.11 }), 'Flange thickness');
      assertThrows(() => calculate({ shape: 'tube', wall_m: 0.06 }), 'Wall thickness');
    },
  },
];
