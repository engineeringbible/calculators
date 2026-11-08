/**
 * watts-to-amps/tests.js — checks against I = P / V, P / (V cos φ) and P / (√3 V cos φ).
 * Run: node run-tests.js watts-to-amps
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'A 1500 W kettle: 6.522 A at 230 V and 12.5 A at 120 V',
    source: 'Hughes, Electrical and Electronic Technology, ch. 2: I = P / V for a resistive load; IEC 60038 mains voltages',
    run: () => {
      assertClose(calculate({ system: 'ac1', power_w: 1500, voltage_v: 230, power_factor: 1 }).outputs.current_a, 6.5217, { abs: 1e-4 }, '230 V');
      assertClose(calculate({ system: 'ac1', power_w: 1500, voltage_v: 120, power_factor: 1 }).outputs.current_a, 12.5, { rel: 1e-12 }, '120 V');
    },
  },
  {
    name: 'DC: 60 W at 12 V is 5 A, and the power factor is ignored',
    source: 'P = V I for DC',
    run: () => {
      assertClose(calculate({ system: 'dc', power_w: 60, voltage_v: 12, power_factor: 0.5 }).outputs.current_a, 5, { rel: 1e-12 }, 'DC');
    },
  },
  {
    name: 'Three-phase: 3 kW at 400 V and unity power factor is 4.330 A per line; 11 kW at 0.85 is 18.68 A',
    source: 'Hughes, ch. "Three-phase systems": I = P / (√3 V_L cos φ)',
    run: () => {
      assertClose(calculate({ system: 'ac3', power_w: 3000, voltage_v: 400, power_factor: 1 }).outputs.current_a, 4.3301, { abs: 1e-4 }, '3 kW');
      assertClose(calculate({ system: 'ac3', power_w: 11000, voltage_v: 400, power_factor: 0.85 }).outputs.current_a, 18.679, { abs: 1e-3 }, '11 kW');
    },
  },
  {
    name: 'A 100 W LED driver at 230 V with power factor 0.5 draws 0.870 A and 200 VA, twice the current at unity',
    source: 'I = P / (V cos φ); S = P / cos φ',
    run: () => {
      const { outputs } = calculate({ system: 'ac1', power_w: 100, voltage_v: 230, power_factor: 0.5 });
      assertClose(outputs.current_a, 0.8696, { abs: 1e-4 }, 'I');
      assertClose(outputs.apparent_va, 200, { rel: 1e-12 }, 'S');
    },
  },
  {
    name: 'A 3.8 kW load on 230 V single-phase (16.5 A) warns above 16 A; zero voltage is rejected',
    source: 'IEC 60884-1 socket outlets up to 16 A; validation contract',
    run: () => {
      assertEqual(calculate({ system: 'ac1', power_w: 3800, voltage_v: 230, power_factor: 1 }).warnings.some((w) => w.includes('16 A')), true, 'warning');
      assertThrows(() => calculate({ voltage_v: 0 }), 'Voltage must be greater than zero');
    },
  },
];
