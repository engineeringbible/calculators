/**
 * kva-to-amps/tests.js — checks against S = √3 V I (three-phase) and S = V I (single-phase).
 * Run: node run-tests.js kva-to-amps
 */
import { calculate } from './calc.js';
import { assertClose, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '1000 kVA at 400 V three-phase: I = 10⁶ / (√3 × 400) = 1443.4 A; 800 kW and 600 kvar at 0.8 power factor',
    source: 'Hughes, Electrical and Electronic Technology, ch. "Three-phase systems": S = √3 V_L I_L, P = S cos φ',
    run: () => {
      const { outputs } = calculate({ mode: 'to_amps', phases: '3', apparent_va: 1e6, voltage_v: 400, power_factor: 0.8 });
      assertClose(outputs.current_out_a, 1443.376, { abs: 0.001 }, 'I');
      assertClose(outputs.active_w, 800000, { rel: 1e-12 }, 'P');
      assertClose(outputs.reactive_var, 600000, { rel: 1e-12 }, 'Q');
    },
  },
  {
    name: '10 kVA single-phase at 230 V is 43.48 A',
    source: 'S = V I for single-phase',
    run: () => {
      assertClose(calculate({ mode: 'to_amps', phases: '1', apparent_va: 10000, voltage_v: 230 }).outputs.current_out_a, 43.478, { abs: 0.001 }, 'I');
    },
  },
  {
    name: 'A 630 kVA transformer secondary at 400 V carries 909.3 A; at 11 kV its primary carries 33.07 A',
    source: 'IEC 60076-1 clause 3.4: rated current from rated power and rated voltage',
    run: () => {
      assertClose(calculate({ mode: 'to_amps', phases: '3', apparent_va: 630000, voltage_v: 400 }).outputs.current_out_a, 909.33, { abs: 0.01 }, 'LV');
      assertClose(calculate({ mode: 'to_amps', phases: '3', apparent_va: 630000, voltage_v: 11000 }).outputs.current_out_a, 33.067, { abs: 0.001 }, 'HV');
    },
  },
  {
    name: 'Amps to kVA: 100 A at 400 V three-phase is 69.28 kVA; converting back returns 100 A',
    source: 'S = √3 V I',
    run: () => {
      const s = calculate({ mode: 'to_kva', phases: '3', current_a: 100, voltage_v: 400 }).outputs.apparent_out_va;
      assertClose(s, 69282.03, { abs: 0.01 }, 'S');
      assertClose(calculate({ mode: 'to_amps', phases: '3', apparent_va: s, voltage_v: 400 }).outputs.current_out_a, 100, { rel: 1e-12 }, 'round trip');
    },
  },
  {
    name: 'Zero voltage and an unknown supply are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ voltage_v: 0 }), 'Voltage must be greater than zero');
      assertThrows(() => calculate({ phases: '2' }), 'Supply');
    },
  },
];
