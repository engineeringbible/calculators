/**
 * kva-to-kw/tests.js — checks against P = S cos φ and its inverse.
 * Run: node run-tests.js kva-to-kw
 */
import { calculate } from './calc.js';
import { apparentFromReal } from '../shared/power.js';
import { assertClose, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '500 kVA at 0.8: 400 kW, 300 kvar, 721.7 A at 400 V three-phase',
    source: 'Hughes, Electrical and Electronic Technology, ch. "Three-phase systems": P = S cos φ, Q = S sin φ',
    run: () => {
      const { outputs } = calculate({ apparent_va: 500000, power_factor: 0.8, phases: '3', voltage_v: 400 });
      assertClose(outputs.power_w, 400000, { rel: 1e-12 }, 'P');
      assertClose(outputs.reactive_var, 300000, { rel: 1e-12 }, 'Q');
      assertClose(outputs.current_a, 721.69, { abs: 0.01 }, 'I');
    },
  },
  {
    name: 'A 10 kVA single-phase UPS at power factor 0.9 supplies 9 kW at 43.5 A on 230 V',
    source: 'P = S cos φ; I = S / V',
    run: () => {
      const { outputs } = calculate({ apparent_va: 10000, power_factor: 0.9, phases: '1', voltage_v: 230 });
      assertClose(outputs.power_w, 9000, { rel: 1e-12 }, 'P');
      assertClose(outputs.current_a, 43.478, { abs: 0.001 }, 'I');
    },
  },
  {
    name: 'Inverse of kW to kVA: P → S → P returns the same value',
    source: 'S = P / cos φ and P = S cos φ',
    run: () => {
      for (const pf of [0.5, 0.8, 0.95]) {
        const s = apparentFromReal(123000, pf);
        assertClose(calculate({ apparent_va: s, power_factor: pf }).outputs.power_w, 123000, { rel: 1e-12 }, `pf ${pf}`);
      }
    },
  },
  {
    name: 'A 1600 kVA transformer at 11 kV draws 83.98 A on the primary',
    source: 'IEC 60076-1 rated current I = S / (√3 U)',
    run: () => {
      assertClose(calculate({ apparent_va: 1.6e6, power_factor: 0.9, phases: '3', voltage_v: 11000 }).outputs.current_a, 83.978, { abs: 0.001 }, 'I');
    },
  },
  {
    name: 'Zero kVA and a power factor of zero are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ apparent_va: 0 }), 'Apparent power must be greater than zero');
      assertThrows(() => calculate({ power_factor: 0 }), 'Power factor');
    },
  },
];
