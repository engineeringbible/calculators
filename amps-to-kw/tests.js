/**
 * amps-to-kw/tests.js — checks against P = √3 V I cos φ and the power triangle.
 * Run: node run-tests.js amps-to-kw
 */
import { calculate } from './calc.js';
import { assertClose, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '100 A at 400 V three-phase, 0.8: P = 55.43 kW, S = 69.28 kVA, Q = 41.57 kvar',
    source: 'Hughes, Electrical and Electronic Technology, ch. "Three-phase systems": P = √3 V I cos φ; Q = √3 V I sin φ',
    run: () => {
      const { outputs } = calculate({ system: 'ac3', current_a: 100, voltage_v: 400, power_factor: 0.8 });
      assertClose(outputs.power_w, 55425.6, { abs: 0.1 }, 'P');
      assertClose(outputs.apparent_va, 69282.0, { abs: 0.1 }, 'S');
      assertClose(outputs.reactive_var, 41569.2, { abs: 0.1 }, 'Q');
    },
  },
  {
    name: 'The power triangle holds: S² = P² + Q² for several power factors',
    source: 'IEEE Std 1459-2010 (sinusoidal power quantities)',
    run: () => {
      for (const pf of [0.3, 0.6, 0.85, 1]) {
        const { outputs } = calculate({ system: 'ac3', current_a: 50, voltage_v: 690, power_factor: pf });
        assertClose(Math.hypot(outputs.power_w, outputs.reactive_var), outputs.apparent_va, { rel: 1e-12 }, `pf ${pf}`);
      }
    },
  },
  {
    name: 'Single-phase 10 A at 230 V and 0.9 is 2.07 kW; DC 50 A at 24 V is 1.2 kW',
    source: 'P = V I cos φ; P = V I',
    run: () => {
      assertClose(calculate({ system: 'ac1', current_a: 10, voltage_v: 230, power_factor: 0.9 }).outputs.power_w, 2070, { rel: 1e-12 }, 'ac1');
      assertClose(calculate({ system: 'dc', current_a: 50, voltage_v: 24 }).outputs.power_w, 1200, { rel: 1e-12 }, 'dc');
    },
  },
  {
    name: 'A 480 V, 60 A three-phase feeder at 0.9 carries 44.9 kW',
    source: 'P = √3 × 480 × 60 × 0.9',
    run: () => {
      assertClose(calculate({ system: 'ac3', current_a: 60, voltage_v: 480, power_factor: 0.9 }).outputs.power_w, 44894.76, { abs: 0.01 }, 'P');
    },
  },
  {
    name: 'Zero current and a power factor above 1 are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ current_a: 0 }), 'Line current must be greater than zero');
      assertThrows(() => calculate({ power_factor: 1.2 }), 'Power factor');
    },
  },
];
