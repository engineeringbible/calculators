/**
 * rc-time-constant/tests.js — checks against the RC charging law and the first-order filter cutoff.
 * Run: node run-tests.js rc-time-constant
 */
import { calculate, timeConstant, cutoffFrequency } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '10 kΩ and 100 µF: τ = 1 s, f_c = 1/(2π) = 0.159 Hz; at t = τ a 5 V charge reaches 63.2 % = 3.16 V',
    source: 'Horowitz and Hill, The Art of Electronics, §1.4.2: τ = RC, V = V_f (1 − e^(−t/RC))',
    run: () => {
      const { outputs } = calculate({ r_ohm: 10000, c_f: 100e-6, supply_v: 5, time_s: 1 });
      assertClose(outputs.tau_s, 1, { rel: 1e-12 }, 'τ');
      assertClose(outputs.cutoff_hz, 1 / (2 * Math.PI), { rel: 1e-12 }, 'f_c');
      assertClose(outputs.fraction, 1 - Math.exp(-1), { rel: 1e-12 }, '63.2 %');
      assertClose(outputs.v_charge_v, 3.1606, { abs: 1e-4 }, 'V at τ');
      assertClose(outputs.v_discharge_v, 5 * Math.exp(-1), { rel: 1e-12 }, 'discharge at τ');
    },
  },
  {
    name: 'Audio low-pass with 1 kΩ and 100 nF: f_c = 1.592 kHz and τ = 100 µs',
    source: 'Horowitz and Hill, §1.7.1: f_3dB = 1 / (2π R C)',
    run: () => {
      assertClose(cutoffFrequency(1000, 100e-9), 1591.55, { abs: 0.01 }, 'f_c');
      assertClose(timeConstant(1000, 100e-9), 1e-4, { rel: 1e-12 }, 'τ');
    },
  },
  {
    name: 'Milestones: 99 % at 4.605 τ, 99.33 % at 5 τ; charging and discharging voltages always add up to V_s',
    source: 'Hughes, Electrical and Electronic Technology, ch. 10 (RC transients); 1 − e^(−5) = 0.99326',
    run: () => {
      const { outputs } = calculate({ r_ohm: 4700, c_f: 220e-6, supply_v: 12, time_s: 5 * 4700 * 220e-6 });
      assertClose(outputs.t99_s, Math.log(100) * 4700 * 220e-6, { rel: 1e-12 }, 't99');
      assertClose(outputs.fraction, 0.993262, { abs: 1e-6 }, '5 τ');
      for (const t of [0, 0.3, 1, 2.5, 7]) {
        const o = calculate({ r_ohm: 1000, c_f: 1e-3, supply_v: 9, time_s: t }).outputs;
        assertClose(o.v_charge_v + o.v_discharge_v, 9, { rel: 1e-12 }, `sum at ${t} s`);
      }
    },
  },
  {
    name: 'At t = 0 the capacitor is empty and the current is V_s / R; the full capacitor stores ½ C V²',
    source: 'Initial condition of the RC step response; W = ½ C V²',
    run: () => {
      const { outputs } = calculate({ r_ohm: 1000, c_f: 1e-3, supply_v: 10, time_s: 0 });
      assertEqual(outputs.v_charge_v, 0, 'V at 0');
      assertClose(outputs.peak_current_a, 0.01, { rel: 1e-12 }, 'I at 0');
      assertClose(outputs.energy_j, 0.05, { rel: 1e-12 }, 'energy');
    },
  },
  {
    name: 'A long timing period with an electrolytic warns; zero resistance or capacitance is rejected',
    source: 'Validation contract; electrolytic leakage (Horowitz and Hill, §1.4.2)',
    run: () => {
      assertEqual(calculate({ r_ohm: 1e6, c_f: 1e-3 }).warnings.length >= 1, true, 'long τ warning');
      assertThrows(() => calculate({ r_ohm: 0 }), 'Resistance must be greater than zero');
      assertThrows(() => calculate({ c_f: 0 }), 'Capacitance must be greater than zero');
    },
  },
];
