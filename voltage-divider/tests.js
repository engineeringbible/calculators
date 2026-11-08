/**
 * voltage-divider/tests.js — checks against the divider equation, the Thévenin source resistance and the E series.
 * Run: node run-tests.js voltage-divider
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Equal resistors halve the input: 10 V across 10 kΩ + 10 kΩ gives 5 V, 0.5 mA and a 5 kΩ source resistance',
    source: 'Horowitz and Hill, The Art of Electronics, §1.2.3: V_out = V_in R2 / (R1 + R2); §1.2.6: R_th = R1 ∥ R2',
    run: () => {
      const { outputs } = calculate({ mode: 'output', vin_v: 10, r1_ohm: 10000, r2_ohm: 10000, load_ohm: 0 });
      assertClose(outputs.vout_v, 5, { rel: 1e-12 }, 'V_out');
      assertClose(outputs.current_a, 5e-4, { rel: 1e-12 }, 'I');
      assertClose(outputs.source_ohm, 5000, { rel: 1e-12 }, 'R_th');
      assertEqual(outputs.vout_loaded_v, null, 'no load');
    },
  },
  {
    name: 'Design 12 V to 3.3 V with R1 = 10 kΩ: exact R2 = 3 793 Ω; E24 gives 3.9 kΩ (3.37 V), E96 gives 3.83 kΩ (3.32 V)',
    source: 'R2 = R1 V_out / (V_in − V_out); IEC 60063:2015 E24 and E96',
    run: () => {
      const e24 = calculate({ mode: 'design', vin_v: 12, r1_ohm: 10000, vout_target_v: 3.3, series: 'E24', load_ohm: 0 }).outputs;
      assertClose(e24.r2_exact_ohm, 3793.103, { abs: 0.001 }, 'exact R2');
      assertEqual(e24.r2_used_ohm, 3900, 'E24');
      assertClose(e24.vout_v, 12 * 3900 / 13900, { rel: 1e-12 }, 'V_out E24');
      const e96 = calculate({ mode: 'design', vin_v: 12, r1_ohm: 10000, vout_target_v: 3.3, series: 'E96', load_ohm: 0 }).outputs;
      assertEqual(e96.r2_used_ohm, 3830, 'E96');
      assertClose(e96.vout_v, 3.3232, { abs: 1e-4 }, 'V_out E96');
    },
  },
  {
    name: 'A 10 kΩ load on a 10 kΩ / 10 kΩ divider from 10 V drops the output from 5 V to 3.33 V, with a warning',
    source: 'Loaded divider: R2 ∥ R_L = 5 kΩ, V_out = 10 × 5 / 15 (Hughes, ch. 3)',
    run: () => {
      const result = calculate({ mode: 'output', vin_v: 10, r1_ohm: 10000, r2_ohm: 10000, load_ohm: 10000 });
      assertClose(result.outputs.vout_loaded_v, 10 / 3, { rel: 1e-12 }, 'loaded');
      assertEqual(result.warnings.length >= 1, true, 'warning');
    },
  },
  {
    name: 'Power: 24 V across 1 kΩ + 1 kΩ dissipates 144 mW in each resistor and warns at 12 mA',
    source: 'P = I² R (Hughes, ch. 2)',
    run: () => {
      const result = calculate({ mode: 'output', vin_v: 24, r1_ohm: 1000, r2_ohm: 1000, load_ohm: 0 });
      assertClose(result.outputs.p_r1_w, 0.144, { rel: 1e-12 }, 'P R1');
      assertClose(result.outputs.p_r2_w, 0.144, { rel: 1e-12 }, 'P R2');
      assertEqual(result.warnings.some((w) => w.includes('10 mA')), true, 'current warning');
    },
  },
  {
    name: 'The ratio is independent of the input voltage, and a target at or above the input is rejected',
    source: 'Divider ratio R2 / (R1 + R2); validation contract',
    run: () => {
      const a = calculate({ mode: 'output', vin_v: 5, r1_ohm: 4700, r2_ohm: 2200, load_ohm: 0 }).outputs.ratio;
      const b = calculate({ mode: 'output', vin_v: 48, r1_ohm: 4700, r2_ohm: 2200, load_ohm: 0 }).outputs.ratio;
      assertClose(a, b, { rel: 1e-12 }, 'same ratio');
      assertClose(a, 2200 / 6900, { rel: 1e-12 }, 'ratio value');
      assertThrows(() => calculate({ mode: 'design', vin_v: 5, vout_target_v: 5 }), 'Target output must be below the input voltage');
      assertThrows(() => calculate({ mode: 'output', r2_ohm: 0 }), 'Bottom resistor R2 must be greater than zero');
    },
  },
];
