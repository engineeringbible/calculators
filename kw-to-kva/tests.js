/**
 * kw-to-kva/tests.js — checks against the power triangle S = P / cos φ.
 * Run: node run-tests.js kw-to-kva
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '400 kW at 0.8: 500 kVA, 300 kvar, 721.7 A at 400 V three-phase',
    source: 'Hughes, Electrical and Electronic Technology, ch. "Three-phase systems": S = P / cos φ, Q = S sin φ, I = S / (√3 V)',
    run: () => {
      const { outputs } = calculate({ power_w: 400000, power_factor: 0.8, phases: '3', voltage_v: 400 });
      assertClose(outputs.apparent_va, 500000, { rel: 1e-12 }, 'S');
      assertClose(outputs.reactive_var, 300000, { rel: 1e-12 }, 'Q');
      assertClose(outputs.current_a, 721.69, { abs: 0.01 }, 'I');
    },
  },
  {
    name: 'At unity power factor kVA equals kW and kvar is zero',
    source: 'cos φ = 1',
    run: () => {
      const { outputs } = calculate({ power_w: 75000, power_factor: 1, phases: '3', voltage_v: 400 });
      assertClose(outputs.apparent_va, 75000, { rel: 1e-12 }, 'S');
      assertClose(outputs.reactive_var, 0, { abs: 1e-9 }, 'Q');
    },
  },
  {
    name: 'A generator rated 1000 kVA at 0.8 delivers 800 kW: 800 kW at 0.8 is exactly 1000 kVA',
    source: 'ISO 8528-1: rated power stated at power factor 0.8',
    run: () => {
      assertClose(calculate({ power_w: 800000, power_factor: 0.8 }).outputs.apparent_va, 1e6, { rel: 1e-12 }, 'S');
    },
  },
  {
    name: 'Single-phase 5 kW at 0.9 and 230 V: 5.556 kVA, 24.15 A; a power factor of 0.6 warns',
    source: 'S = P / cos φ; I = S / V',
    run: () => {
      const { outputs } = calculate({ power_w: 5000, power_factor: 0.9, phases: '1', voltage_v: 230 });
      assertClose(outputs.apparent_va, 5555.56, { abs: 0.01 }, 'S');
      assertClose(outputs.current_a, 24.155, { abs: 0.001 }, 'I');
      assertEqual(calculate({ power_w: 5000, power_factor: 0.6 }).warnings.length, 1, 'warning');
    },
  },
  {
    name: 'Zero power and an unknown supply are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ power_w: 0 }), 'Real power must be greater than zero');
      assertThrows(() => calculate({ phases: '2' }), 'Supply');
    },
  },
];
