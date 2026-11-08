/**
 * weir-flow/tests.js — checks against the USBR Water Measurement Manual free-flow tables and hand calculations of the
 * Francis, Cone and Cipolletti equations.
 * Run: node run-tests.js weir-flow
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const CFS = 0.028316846592;

const q = (inputs) => calculate(inputs).outputs.flow_m3s / CFS;

export const tests = [
  {
    name: 'USBR Parshall free-flow tables: 1 in at 0.50 ft 0.115, 3 in at 1.00 ft 0.992, 9 in at 1.50 ft 5.71, 1 ft at 1.00 ft 3.95, 4 ft at 0.50 ft 5.36, 8 ft at 2.50 ft 139 ft³/s',
    source: 'USBR Water Measurement Manual, appendix tables A8-7, A8-9, A8-11 and A8-12 (free-flow discharge through Parshall flumes)',
    run: () => {
      [['in1', 0.5, 0.115, 0.0005], ['in3', 1.0, 0.992, 0.0005], ['in9', 1.5, 5.71, 0.005], ['ft1', 1.0, 3.95, 0.005], ['ft4', 0.5, 5.36, 0.005], ['ft8', 2.5, 139, 0.5]].forEach(([t, h, v, tol]) => {
        assertClose(q({ type: 'parshall', throat: t, head_m: h * FT }), v, { abs: tol }, `${t} at ${h} ft`);
      });
    },
  },
  {
    name: 'Francis, 2 ft crest, 0.5 ft head: contracted 2.24 ft³/s (3.33 × 1.9 × 0.3536), suppressed 2.35 ft³/s',
    source: 'Hand calculation of Q = 3.33 (L − 0.1 n H) H^1.5 (Brater and King, Handbook of Hydraulics)',
    run: () => {
      const o = calculate({ type: 'rect', head_m: 0.5 * FT, crest_m: 2 * FT, contractions: '2', crest_height_m: 1.5 * FT }).outputs;
      assertClose(o.flow_m3s / CFS, 2.23693, { abs: 1e-5 }, 'contracted');
      assertClose(o.effective_m / FT, 1.9, { abs: 1e-12 }, 'effective length');
      assertClose(o.flow_ls_m3s * 1000, 63.343, { abs: 1e-3 }, 'L/s');
      assertClose(q({ type: 'rect', head_m: 0.5 * FT, crest_m: 2 * FT, contractions: '0', crest_height_m: 1.5 * FT }), 2.35467, { abs: 1e-5 }, 'suppressed');
    },
  },
  {
    name: '90° V-notch: 0.2 ft gives 0.0460 ft³/s and 1.25 ft gives 4.33 ft³/s, the ends of the USBR range of about 0.05 to 4.25 ft³/s; 0.5 ft gives 0.446',
    source: 'USBR WMM eq. 7-6 (Cone): Q = 2.49 H^2.48, used for 0.05 to 4.25 ft³/s',
    run: () => {
      assertClose(q({ type: 'vnotch', head_m: 0.2 * FT, crest_height_m: FT }), 0.04600, { abs: 1e-4 }, '0.2 ft');
      assertClose(q({ type: 'vnotch', head_m: 1.25 * FT, crest_height_m: 3 * FT }), 4.330, { abs: 2e-3 }, '1.25 ft');
      assertClose(q({ type: 'vnotch', head_m: 0.5 * FT, crest_height_m: FT }), 0.44632, { abs: 1e-5 }, '0.5 ft');
    },
  },
  {
    name: 'Cipolletti, 3 ft crest at 0.6 ft head: Q = 3.367 × 3 × 0.6^1.5 = 4.69 ft³/s',
    source: 'USBR WMM eq. 7-7: Q = 3.367 L H^1.5',
    run: () => {
      assertClose(q({ type: 'cipolletti', crest_m: 3 * FT, head_m: 0.6 * FT, crest_height_m: 2 * FT }), 4.6945, { abs: 1e-4 }, 'Q');
    },
  },
  {
    name: 'Limits: heads below 0.2 ft, above L/3 or above 1.25 ft on a V-notch, outside the flume table range, and a submerged flume are rejected; a low crest warns',
    source: 'USBR WMM chapter 7 (weir limits) and chapter 8 (Parshall submergence 0.7 for 1 to 8 ft flumes)',
    run: () => {
      assertThrows(() => calculate({ type: 'rect', head_m: 0.15 * FT }), 'below the 0.2 ft');
      assertThrows(() => calculate({ type: 'rect', crest_m: 1 * FT, head_m: 0.4 * FT }), 'one third of the crest length');
      assertThrows(() => calculate({ type: 'vnotch', head_m: 1.3 * FT }), '1.25 ft');
      assertThrows(() => calculate({ type: 'parshall', throat: 'ft1', head_m: 2.6 * FT }), 'outside the free-flow range');
      assertThrows(() => calculate({ type: 'parshall', throat: 'ft1', head_m: 1 * FT, hb_m: 0.75 * FT }), 'submergence');
      assertEqual(calculate({ type: 'parshall', throat: 'ft1', head_m: 1 * FT, hb_m: 0.65 * FT }).outputs.flow_m3s > 0, true, '0.65 is free flow');
      assertEqual(calculate({ type: 'rect', head_m: 0.5 * FT, crest_height_m: 0.8 * FT }).warnings.length, 1, 'low crest');
    },
  },
];
