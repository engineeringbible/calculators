/**
 * planing-speed/tests.js — checks against Crouch's formula V = C / √(W/P) with Gerr's constants.
 * Run: node run-tests.js planing-speed
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const LB = 0.45359237;
const HP = 745.69987158227;
const FT = 0.3048;

export const tests = [
  {
    name: '5 000 lb runabout with 200 shp, C = 150: 25 lb/hp and 150 / √25 = 30.0 kn',
    source: 'Crouch\'s formula and constants as given in Gerr, The Propeller Handbook, ch. 2; hand calculation',
    run: () => {
      const o = calculate({ mode: 'speed', weight_kg: 5000 * LB, power_w: 200 * HP, hull: 'average' }).outputs;
      assertClose(o.lb_per_hp, 25, { rel: 1e-9 }, 'lb/hp');
      assertClose(o.speed_kn, 30, { rel: 1e-9 }, 'speed');
    },
  },
  {
    name: 'Inverse: 35 kn for the same boat needs 5 000 × (35/150)² = 272.2 shp',
    source: 'P = W (V/C)²; hand calculation',
    run: () => {
      const o = calculate({ mode: 'power', weight_kg: 5000 * LB, target_kn: 35, hull: 'average' }).outputs;
      assertClose(o.power_req_w / HP, 272.222, { abs: 1e-3 }, 'power');
    },
  },
  {
    name: 'Gerr\'s constants: 190 high-speed runabouts, 210 race boats, 220 hydroplanes, 230 racing catamarans',
    source: 'Gerr, The Propeller Handbook, table of Crouch constants',
    run: () => {
      assertEqual(calculate({ hull: 'fast' }).outputs.c_used, 190, 'fast');
      assertEqual(calculate({ hull: 'race' }).outputs.c_used, 210, 'race');
      assertEqual(calculate({ hull: 'hydroplane' }).outputs.c_used, 220, 'hydroplane');
      assertEqual(calculate({ hull: 'catamaran' }).outputs.c_used, 230, 'catamaran');
    },
  },
  {
    name: 'Speed scales with √(P/W): four times the power doubles the speed',
    source: 'Crouch\'s formula; consistency check',
    run: () => {
      const a = calculate({ power_w: 100 * HP }).outputs.speed_kn;
      const b = calculate({ power_w: 400 * HP }).outputs.speed_kn;
      assertClose(b / a, 2, { rel: 1e-12 }, 'ratio');
    },
  },
  {
    name: 'A 20 ft waterline at 12 kn is S/L 2.68 and warns that the boat is not planing; zero weight is rejected',
    source: 'Gerr: planing above S/L 3.0; validation contract',
    run: () => {
      const r = calculate({ mode: 'power', target_kn: 12, lwl_m: 20 * FT });
      assertClose(r.outputs.sl_ratio, 2.6833, { abs: 1e-4 }, 'S/L');
      assertEqual(r.warnings.length > 0, true, 'warning');
      assertThrows(() => calculate({ weight_kg: 0 }), 'Loaded weight must be greater than zero');
    },
  },
];
