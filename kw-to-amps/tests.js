/**
 * kw-to-amps/tests.js — checks against I = P / (√3 V cos φ) and motor input power P_shaft / η.
 * Run: node run-tests.js kw-to-amps
 */
import { calculate } from './calc.js';
import { calculate as threePhase } from '../three-phase-power/calc.js';
import { assertClose, assertEqual } from '../shared/test-runner.js';

export const tests = [
  {
    name: '22 kW electrical at 400 V three-phase and 0.85: I = 37.36 A, S = 25.88 kVA',
    source: 'Hughes, Electrical and Electronic Technology, ch. "Three-phase systems": I = P / (√3 V_L cos φ)',
    run: () => {
      const { outputs } = calculate({ system: 'ac3', load: 'electrical', power_w: 22000, voltage_v: 400, power_factor: 0.85 });
      assertClose(outputs.current_a, 37.358, { abs: 1e-3 }, 'I');
      assertClose(outputs.apparent_va, 25882.4, { abs: 0.1 }, 'S');
    },
  },
  {
    name: 'A 22 kW motor at 93 % efficiency draws 23.66 kW and 40.17 A, with a starting-current note',
    source: 'IEC 60034-1: rated output is the shaft power; input = output / η',
    run: () => {
      const result = calculate({ system: 'ac3', load: 'motor', power_w: 22000, efficiency: 0.93, voltage_v: 400, power_factor: 0.85 });
      assertClose(result.outputs.input_w, 22000 / 0.93, { rel: 1e-12 }, 'input');
      assertClose(result.outputs.current_a, 40.170, { abs: 1e-3 }, 'I');
      assertEqual(result.warnings.length, 1, 'starting note');
    },
  },
  {
    name: 'Agrees with the three-phase power calculator\'s motor mode for 30 kW, η 0.92, cos φ 0.85 at 400 V (55.37 A)',
    source: 'Cross-check against three-phase-power (catalogue band 55–57 A)',
    run: () => {
      const here = calculate({ system: 'ac3', load: 'motor', power_w: 30000, efficiency: 0.92, voltage_v: 400, power_factor: 0.85 }).outputs.current_a;
      const there = threePhase({ system: 'ac3', mode: 'motor', voltage_v: 400, shaft_power_w: 30000, efficiency: 0.92, power_factor: 0.85 }).outputs.line_current_a;
      assertClose(here, there, { rel: 1e-12 }, 'same current');
    },
  },
  {
    name: 'Single-phase 3 kW at 230 V and 0.95 is 13.73 A; DC 2 kW at 48 V is 41.67 A',
    source: 'I = P / (V cos φ); I = P / V',
    run: () => {
      assertClose(calculate({ system: 'ac1', load: 'electrical', power_w: 3000, voltage_v: 230, power_factor: 0.95 }).outputs.current_a, 13.730, { abs: 1e-3 }, 'ac1');
      assertClose(calculate({ system: 'dc', load: 'electrical', power_w: 2000, voltage_v: 48 }).outputs.current_a, 41.667, { abs: 1e-3 }, 'dc');
    },
  },
  {
    name: 'At 480 V the same 22 kW load draws 400/480 of the 400 V current',
    source: 'I ∝ 1/V at constant P',
    run: () => {
      const a = calculate({ system: 'ac3', load: 'electrical', power_w: 22000, voltage_v: 400, power_factor: 0.85 }).outputs.current_a;
      const b = calculate({ system: 'ac3', load: 'electrical', power_w: 22000, voltage_v: 480, power_factor: 0.85 }).outputs.current_a;
      assertClose(b / a, 400 / 480, { rel: 1e-12 }, 'ratio');
    },
  },
];
