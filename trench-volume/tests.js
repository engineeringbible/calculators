/**
 * trench-volume/tests.js — checks against hand calculations of trapezoidal trench sections and OSHA slopes.
 * Run: node run-tests.js trench-volume
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const YD3 = 0.764554857984;
const FT3 = 0.028316846592;

export const tests = [
  {
    name: '100 ft × 2 ft × 4 ft with vertical sides: 800 ft³ = 29.63 yd³; 25 % swell gives 37.04 yd³, four 10 yd³ loads',
    source: 'V = L b d; V_loose = V (1 + swell)',
    run: () => {
      const o = calculate({ length_m: 100 * FT, width_m: 2 * FT, depth_m: 4 * FT, sides: 'vertical', swell: 0.25, truck_m3: 10 * YD3 }).outputs;
      assertClose(o.bank_m3 / FT3, 800, { rel: 1e-9 }, 'ft³');
      assertClose(o.bank_m3 / YD3, 29.630, { abs: 0.001 }, 'yd³');
      assertClose(o.loose_m3 / YD3, 37.037, { abs: 0.001 }, 'loose');
      assertEqual(o.loads, 4, 'loads');
    },
  },
  {
    name: 'OSHA Type B (1 : 1), 2 ft bottom, 6 ft deep, 50 ft long: top 14 ft, section (2 + 6) × 6 = 48 ft², 2 400 ft³',
    source: 'OSHA 29 CFR 1926 Subpart P, Appendix B, Table B-1 (Type B 1 H : 1 V)',
    run: () => {
      const o = calculate({ length_m: 50 * FT, width_m: 2 * FT, depth_m: 6 * FT, sides: 'typeB' }).outputs;
      assertClose(o.top_width_m / FT, 14, { rel: 1e-9 }, 'top');
      assertClose(o.bank_m3 / FT3, 2400, { rel: 1e-9 }, 'volume');
    },
  },
  {
    name: 'Type A is ¾ : 1 and Type C 1½ : 1: at 3 m deep and 1 m bottom the sections are 9.75 and 16.5 m²',
    source: 'OSHA Appendix B Table B-1',
    run: () => {
      assertClose(calculate({ length_m: 1, width_m: 1, depth_m: 3, sides: 'typeA' }).outputs.bank_m3, 9.75, { rel: 1e-12 }, 'A');
      assertClose(calculate({ length_m: 1, width_m: 1, depth_m: 3, sides: 'typeC' }).outputs.bank_m3, 16.5, { rel: 1e-12 }, 'C');
    },
  },
  {
    name: 'Backfill around a 300 mm pipe in a 30 m × 0.6 m × 1.2 m trench: 21.6 − 2.121 = 19.48 m³',
    source: 'V_backfill = V_trench − π D² L / 4',
    run: () => {
      assertClose(calculate({ length_m: 30, width_m: 0.6, depth_m: 1.2, pipe_m: 0.3 }).outputs.backfill_m3, 21.6 - (Math.PI / 4) * 0.09 * 30, { rel: 1e-12 }, 'backfill');
    },
  },
  {
    name: 'Vertical sides at 6 ft warn (OSHA 1926.652); a pipe wider than the trench and zero depth are rejected',
    source: 'OSHA 29 CFR 1926.652(a)(1); validation contract',
    run: () => {
      assertEqual(calculate({ depth_m: 6 * FT, sides: 'vertical' }).warnings.length, 1, 'shoring');
      assertThrows(() => calculate({ width_m: 0.3, depth_m: 1, pipe_m: 0.5 }), 'does not fit');
      assertThrows(() => calculate({ depth_m: 0 }), 'Depth must be greater than zero');
    },
  },
];
