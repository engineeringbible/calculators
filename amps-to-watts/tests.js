/**
 * amps-to-watts/tests.js — checks against P = V I, V I cos φ and √3 V I cos φ.
 * Run: node run-tests.js amps-to-watts
 */
import { calculate } from './calc.js';
import { currentFromPower } from '../shared/power.js';
import { assertClose, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'A 13 A socket at 230 V supplies 2 990 W; a 15 A circuit at 120 V supplies 1 800 W',
    source: 'Hughes, Electrical and Electronic Technology, ch. 2: P = V I; BS 1363 13 A outlets',
    run: () => {
      assertClose(calculate({ system: 'ac1', current_a: 13, voltage_v: 230, power_factor: 1 }).outputs.power_w, 2990, { rel: 1e-12 }, '13 A');
      assertClose(calculate({ system: 'ac1', current_a: 15, voltage_v: 120, power_factor: 1 }).outputs.power_w, 1800, { rel: 1e-12 }, '15 A');
    },
  },
  {
    name: 'DC: 10 A at 24 V is 240 W',
    source: 'P = V I',
    run: () => {
      assertClose(calculate({ system: 'dc', current_a: 10, voltage_v: 24 }).outputs.power_w, 240, { rel: 1e-12 }, 'DC');
    },
  },
  {
    name: 'Three-phase: 32 A at 400 V and 0.9 power factor is 19.95 kW and 22.17 kVA',
    source: 'Hughes, ch. "Three-phase systems": P = √3 V_L I_L cos φ',
    run: () => {
      const { outputs } = calculate({ system: 'ac3', current_a: 32, voltage_v: 400, power_factor: 0.9 });
      assertClose(outputs.power_w, 19953.0, { abs: 0.5 }, 'P');
      assertClose(outputs.apparent_va, 22170.0, { abs: 0.5 }, 'S');
    },
  },
  {
    name: 'Round trip with the inverse relation I = P / (k V cos φ) for every supply and a power factor of 0.8',
    source: 'Inverse relations',
    run: () => {
      for (const system of ['dc', 'ac1', 'ac3']) {
        const p = calculate({ system, current_a: 25, voltage_v: 230, power_factor: 0.8 }).outputs.power_w;
        assertClose(currentFromPower(system, p, 230, 0.8), 25, { rel: 1e-12 }, system);
      }
    },
  },
  {
    name: 'Zero current is rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ current_a: 0 }), 'Current must be greater than zero');
    },
  },
];
