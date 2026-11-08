/**
 * conveyor-belt/tests.js — checks against the Precision Pulley & Idler capacity table (CEMA basis), the CEMA edge
 * distance and hand calculations.
 * Run: node run-tests.js conveyor-belt
 */
import { calculate, edgeDistance, loadArea } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const FT = 0.3048;

export const tests = [
  {
    name: '36 in belt, 35° three equal 13 in rolls, 20° surcharge: 5 946 ft³/h at 100 fpm against 5 886 in the PPI table (within 1.5 %); 0° surcharge 4 133 against 4 058',
    source: 'Precision Pulley & Idler idler selection guide, Table 2 (35° troughed belt, 3 equal rolls, 100 fpm)',
    run: () => {
      assertClose(calculate({ roll_m: 13 * IN }).outputs.ft3_h_100fpm, 5886, { rel: 0.015 }, '20° surcharge');
      assertClose(calculate({ roll_m: 13 * IN, surcharge_deg: 0 }).outputs.ft3_h_100fpm, 4058, { rel: 0.02 }, '0° surcharge');
    },
  },
  {
    name: 'Default rolls of b/3: 24 in 2 511 vs 2 438, 30 in 4 082 vs 3 975, 36 in 6 032 vs 5 886 ft³/h at 100 fpm (within 3.5 %, on the high side)',
    source: 'Precision Pulley & Idler idler selection guide, Table 2',
    run: () => {
      for (const [b, ref] of [[24, 2438], [30, 3975], [36, 5886]]) {
        const v = calculate({ width_m: b * IN }).outputs.ft3_h_100fpm;
        assertClose(v, ref, { rel: 0.035 }, `${b} in`);
        assertEqual(v > ref, true, `${b} in above the table`);
      }
    },
  },
  {
    name: 'CEMA edge distance 0.055 b + 0.9 in: 2.88 in for a 36 in belt (a published conveyor specifier sheet shows 2.9 in); a flat belt with 20° surcharge carries the circular segment only',
    source: 'CEMA Belt Conveyors for Bulk Materials, standard edge distance; circular segment area R²(β − sin β cos β)',
    run: () => {
      assertClose(edgeDistance(36 * IN) / IN, 2.88, { rel: 1e-12 }, 'edge');
      const flat = loadArea(36 * IN, 0, Math.PI / 9, 0);
      const W = (36 - 5.76) * IN;
      const R = W / (2 * Math.sin(Math.PI / 9));
      assertClose(flat.area, R * R * (Math.PI / 9 - Math.sin(Math.PI / 9) * Math.cos(Math.PI / 9)), { rel: 1e-12 }, 'segment');
    },
  },
  {
    name: 'Speed and capacity: a 24 in pulley at 100 rpm runs π × 2 ft × 100 = 628.3 fpm; 0.9909 ft² × 628.3 fpm × 100 lb/ft³ = 1 868 short tons/h; lifting 30 ft takes ṁ g H = 42.2 kW',
    source: 'v = π D n; Q = A v ρ; P = Q g H (hand calculation)',
    run: () => {
      const o = calculate({ roll_m: 13 * IN, lift_m: 30 * FT }).outputs;
      assertClose(o.speed_out_m_s / 0.00508, 628.3185, { abs: 0.0001 }, 'fpm');
      assertClose(o.short_tph, (0.990906 * 628.3185 * 60 * 100) / 2000, { rel: 1e-5 }, 'short tons');
      assertClose(o.lift_w, o.mass_kg_s * 9.80665 * 30 * FT, { rel: 1e-12 }, 'lift power');
      assertClose(o.lift_w / 1000, 42.207, { abs: 0.001 }, 'kW');
    },
  },
  {
    name: 'A flat belt with no surcharge, a centre roll as wide as the belt and zero pulley speed are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ belt_type: 'flat', surcharge_deg: 0 }), 'carries no load');
      assertThrows(() => calculate({ roll_m: 36 * IN }), 'shorter than the belt width');
      assertThrows(() => calculate({ pulley_rpm: 0 }), 'Drive pulley speed');
    },
  },
];
