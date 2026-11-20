/**
 * wire-rope-weight/tests.js — checks against a rope maker's tables according to EN 12385-4 and hand calculations.
 * Run: node run-tests.js wire-rope-weight
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const G = 9.80665;
const LB_FT = 0.45359237 / 0.3048;

/** [construction, kg per 100 m, MBL kN, grade] at 20 mm, as printed in the catalogue tables (rounded to 3 figures). */
const TABLE_20MM = [
  ['6x7_fc', 138, 235, '1770'],
  ['7x7', 154, 254, '1770'],
  ['6x19_fc', 144, 234, '1770'],
  ['6x19_iwrc', 160, 252, '1770'],
  ['6x36_fc', 147, 234, '1770'],
  ['6x36_iwrc', 164, 252, '1770'],
  ['8x19_fc', 136, 207, '1770'],
  ['8x19_iwrc', 163, 252, '1770'],
  ['8x36_fc', 139, 207, '1770'],
  ['8x36_iwrc', 167, 252, '1770'],
  ['18x7', 153, 232, '1770'],
  ['35x7', 182, 282, '1960'],
];

export const tests = [
  {
    name: 'Every construction at 20 mm matches the catalogue table: weight per 100 m and MBL within the printed rounding',
    source: 'Hendrik Veder Group steel wire rope catalogue, chapter 4, tables according to EN 12385-4',
    run: () => {
      for (const [construction, per100, mblKn, grade] of TABLE_20MM) {
        const o = calculate({ construction, grade, diameter_m: 0.02 }).outputs;
        assertClose(o.per100_kg, per100, { abs: 0.5 }, `${construction} weight`);
        assertClose(o.mbl_n / 1000, mblKn, { abs: 0.5 }, `${construction} MBL`);
      }
    },
  },
  {
    name: '32 mm rows: 6×19 IWRC 410 kg and 645 kN; 6×36 IWRC 419 kg; 8×19 FC 348 kg and 531 kN; 35×7 465 kg and 723 kN (1960)',
    source: 'Hendrik Veder Group steel wire rope catalogue, chapter 4, tables according to EN 12385-4',
    run: () => {
      const at32 = (construction, grade = '1770') => calculate({ construction, grade, diameter_m: 0.032 }).outputs;
      assertClose(at32('6x19_iwrc').per100_kg, 410, { abs: 0.5 }, '6x19 IWRC weight');
      assertClose(at32('6x19_iwrc').mbl_n / 1000, 645, { abs: 0.5 }, '6x19 IWRC MBL');
      assertClose(at32('6x36_iwrc').per100_kg, 419, { abs: 0.5 }, '6x36 IWRC weight');
      assertClose(at32('8x19_fc').per100_kg, 348, { abs: 0.5 }, '8x19 FC weight');
      assertClose(at32('8x19_fc').mbl_n / 1000, 531, { abs: 0.5 }, '8x19 FC MBL');
      assertClose(at32('35x7', '1960').per100_kg, 465, { abs: 0.5 }, '35x7 weight');
      assertClose(at32('35x7', '1960').mbl_n / 1000, 723, { abs: 0.5 }, '35x7 MBL');
    },
  },
  {
    name: 'Worked example: 100 m of 20 mm 6×36 IWRC = 1.636 kg/m (1.099 lb/ft), 163.6 kg, 1.422 kg/m in seawater, own weight 0.637 % of 252.0 kN',
    source: 'Hand calculation: m\' = W d² / 100, m\'_w = m\' (1 − 1 025 / 7 850), share = m\' g L / MBL',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.unit_kg_m, 1.636, { rel: 1e-12 }, 'kg/m');
      assertClose(o.unit_kg_m / LB_FT, 1.0993, { abs: 1e-4 }, 'lb/ft');
      assertClose(o.total_kg, 163.6, { rel: 1e-12 }, 'total');
      assertClose(o.submerged_kg_m, 1.636 * (1 - 1025 / 7850), { rel: 1e-12 }, 'in seawater');
      assertClose(o.submerged_kg_m, 1.4224, { abs: 1e-4 }, 'in seawater value');
      assertClose(o.mbl_n, 252048, { rel: 1e-12 }, 'MBL');
      assertClose(o.self_share, 163.6 * G / 252048, { rel: 1e-12 }, 'share');
      assertClose(calculate({ water: 'fresh' }).outputs.submerged_kg_m, 1.636 * (1 - 1000 / 7850), { rel: 1e-12 }, 'fresh water');
    },
  },
  {
    name: 'Length on a reel: a 500 kg net coil of 16 mm 6×19 IWRC (1.024 kg/m) holds 488.3 m; the round trip returns the mass',
    source: 'Hand calculation: L = M / m\'',
    run: () => {
      const o = calculate({ construction: '6x19_iwrc', diameter_m: 0.016, mode: 'mass', mass_kg: 500 }).outputs;
      assertClose(o.unit_kg_m, 1.024, { rel: 1e-12 }, 'kg/m');
      assertClose(o.length_out_m, 500 / 1.024, { rel: 1e-12 }, 'length');
      const back = calculate({ construction: '6x19_iwrc', diameter_m: 0.016, mode: 'length', length_m: o.length_out_m }).outputs;
      assertClose(back.total_kg, 500, { rel: 1e-12 }, 'round trip');
    },
  },
  {
    name: 'Entered factors are used as given; an unusual W warns; the rope\'s own weight warns at a fifth of the MBL',
    source: 'Validation contract',
    run: () => {
      const c = calculate({ construction: 'custom', w_custom: 0.42, k_custom: 0.31, diameter_m: 0.01 });
      assertClose(c.outputs.unit_kg_m, 0.42, { rel: 1e-12 }, 'custom W');
      assertClose(c.outputs.mbl_n, 0.31 * 100 * 1770, { rel: 1e-12 }, 'custom K');
      assertEqual(c.warnings.length, 0, 'normal W, no warning');
      assertEqual(calculate({ construction: 'custom', w_custom: 0.9 }).warnings.length, 1, 'unusual W');
      // 6×36 IWRC 1770 breaks under its own weight at 0.356 × 1770 / (0.00409 × g) = 15.71 km; a fifth is 3.14 km.
      assertEqual(calculate({ length_m: 3000 }).warnings.length, 0, '3 km');
      assertEqual(calculate({ length_m: 3200 }).warnings.length, 1, '3.2 km');
    },
  },
  {
    name: 'A diameter of 1 mm, a zero length and an unknown construction are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ diameter_m: 0.001 }), 'Rope diameter');
      assertThrows(() => calculate({ length_m: 0 }), 'Rope length');
      assertThrows(() => calculate({ construction: '6x37' }), 'Rope construction');
    },
  },
];
