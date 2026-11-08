/**
 * ohms-law/tests.js — checks against Ohm's and Joule's laws and textbook examples.
 * Run: node run-tests.js ohms-law
 */
import { calculate, solve } from './calc.js';
import { assertClose, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Voltage and current: 12 V across a resistor carrying 2 A gives R = 6 Ω and P = 24 W',
    source: 'Hughes, Electrical and Electronic Technology, ch. 2: R = V / I, P = V I',
    run: () => {
      const { outputs } = calculate({ pair: 'vi', voltage_v: 12, current_a: 2 });
      assertClose(outputs.resistance_out_ohm, 6, { rel: 1e-12 }, 'R');
      assertClose(outputs.power_out_w, 24, { rel: 1e-12 }, 'P');
      assertClose(outputs.conductance_s, 1 / 6, { rel: 1e-12 }, 'G');
    },
  },
  {
    name: 'A 1 kW heater on 230 V: I = 4.348 A and R = 52.9 Ω; from voltage and resistance the power is back to 1000 W',
    source: 'Boylestad, Introductory Circuit Analysis, ch. 4: P = V² / R, I = P / V',
    run: () => {
      const fromPower = calculate({ pair: 'pv', power_w: 1000, voltage_v: 230 }).outputs;
      assertClose(fromPower.current_out_a, 4.3478, { abs: 1e-4 }, 'I');
      assertClose(fromPower.resistance_out_ohm, 52.9, { abs: 1e-9 }, 'R = 230² / 1000');
      const back = calculate({ pair: 'vr', voltage_v: 230, resistance_ohm: 52.9 }).outputs;
      assertClose(back.power_out_w, 1000, { rel: 1e-12 }, 'P');
    },
  },
  {
    name: 'A 100 W, 4 Ω loudspeaker: I = √(P/R) = 5 A and V = 20 V RMS',
    source: 'Hughes, ch. 2: P = I² R; RMS power into a resistive load',
    run: () => {
      const { outputs } = calculate({ pair: 'pr', power_w: 100, resistance_ohm: 4 });
      assertClose(outputs.current_out_a, 5, { rel: 1e-12 }, 'I');
      assertClose(outputs.voltage_out_v, 20, { rel: 1e-12 }, 'V');
    },
  },
  {
    name: 'Power and current: 60 W at 5 A means 12 V and 2.4 Ω; current and resistance: 0.5 A through 48 Ω drops 24 V and dissipates 12 W',
    source: 'Ohm (1827): V = I R; Joule heating P = I² R (Boylestad ch. 4)',
    run: () => {
      const pi = calculate({ pair: 'pi', power_w: 60, current_a: 5 }).outputs;
      assertClose(pi.voltage_out_v, 12, { rel: 1e-12 }, 'V');
      assertClose(pi.resistance_out_ohm, 2.4, { rel: 1e-12 }, 'R');
      const ir = calculate({ pair: 'ir', current_a: 0.5, resistance_ohm: 48 }).outputs;
      assertClose(ir.voltage_out_v, 24, { rel: 1e-12 }, 'V');
      assertClose(ir.power_out_w, 12, { rel: 1e-12 }, 'P');
    },
  },
  {
    name: 'Every pair gives the same four values for the worked example (24 V, 0.5 A, 48 Ω, 12 W)',
    source: 'Consistency of V = I R and P = V I across all six pairs',
    run: () => {
      const all = { v: 24, i: 0.5, r: 48, p: 12 };
      for (const pair of ['vi', 'vr', 'ir', 'pv', 'pi', 'pr']) {
        const known = Object.fromEntries([...pair].map((key) => [key, all[key]]));
        const got = solve(pair, known);
        for (const key of ['v', 'i', 'r', 'p']) assertClose(got[key], all[key], { rel: 1e-12 }, `${pair}: ${key}`);
      }
    },
  },
  {
    name: 'Zero or negative values are rejected, and an unknown pair is refused',
    source: 'Input validation contract (shared/validate.js)',
    run: () => {
      assertThrows(() => calculate({ pair: 'vr', voltage_v: 24, resistance_ohm: 0 }), 'Resistance must be greater than zero');
      assertThrows(() => calculate({ pair: 'vi', voltage_v: -5, current_a: 1 }), 'Voltage must be greater than zero');
      assertThrows(() => calculate({ pair: 'xy' }), 'Known values');
    },
  },
];
