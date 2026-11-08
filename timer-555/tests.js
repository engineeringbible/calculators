/**
 * timer-555/tests.js — checks against the TI NE555 datasheet timing equations and hand calculations.
 * Run: node run-tests.js timer-555
 */
import { calculate, readOne } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Astable 4k7, 10k, 10n: f = 5.84 kHz (datasheet 1.44/((R_A + 2R_B)C) = 5.83 kHz), t_H 101.9 µs, t_L 69.3 µs, duty 59.5 %',
    source: 'TI NE555 datasheet SLFS022, astable equations; hand calculation with ln 2',
    run: () => {
      const o = calculate({ mode: 'astable', r1: '4k7', r2: '10k', c: '10n' }).outputs;
      assertClose(o.t_high_s, 0.693 * 14700 * 10e-9, { rel: 0.0003 }, 't_H against 0.693 (R_A + R_B) C');
      assertClose(o.t_low_s, 0.693 * 10000 * 10e-9, { rel: 0.0003 }, 't_L against 0.693 R_B C');
      assertClose(o.freq_out_hz, 1.44 / (24700 * 10e-9), { rel: 0.002 }, 'f against 1.44 / ((R_A + 2 R_B) C)');
      assertClose(o.freq_out_hz, 5840.87, { abs: 0.01 }, 'f exact');
      assertClose(o.duty_out, 14.7 / 24.7, { rel: 1e-12 }, 'duty');
    },
  },
  {
    name: 'Monostable 100 kΩ and 10 µF: t = 1.1 R C = 1.10 s (ln 3 R C = 1.0986 s)',
    source: 'TI NE555 datasheet SLFS022, monostable t_w = 1.1 R_A C',
    run: () => {
      const o = calculate({ mode: 'monostable', r1: '100k', c: '10u' }).outputs;
      assertClose(o.pulse_s, 1.1, { rel: 0.0013 }, 'datasheet 1.1 R C');
      assertClose(o.pulse_s, Math.log(3), { rel: 1e-12 }, 'ln 3 R C');
      assertEqual(o.freq_out_hz, null, 'no frequency in monostable mode');
    },
  },
  {
    name: 'Design 1 kHz, 60 % with 100 nF: exact R1 2.885 kΩ, R2 5.771 kΩ; E24 3 kΩ and 5.6 kΩ give 1.016 kHz and 60.6 %',
    source: 'Inverting f = 1/(ln2 (R1 + 2R2) C) and D = (R1 + R2)/(R1 + 2R2); IEC 60063 E24 values',
    run: () => {
      const o = calculate({ mode: 'design', c: '100n', freq_hz: 1000, duty: 0.6 }).outputs;
      assertEqual(o.r_exact, 'R1 = 2.885 kΩ, R2 = 5.771 kΩ', 'exact');
      assertEqual(o.r_e24, 'R1 = 3 kΩ, R2 = 5.6 kΩ', 'E24');
      assertClose(o.freq_out_hz, 1 / (Math.LN2 * 14200 * 100e-9), { rel: 1e-12 }, 'f with E24');
      assertClose(o.duty_out, 8600 / 14200, { rel: 1e-12 }, 'duty with E24');
    },
  },
  {
    name: 'Limiting case: R1 much smaller than R2 gives a duty cycle just above 50 %; marking notation and plain microfarads read correctly',
    source: 'D = (R1 + R2)/(R1 + 2R2) → 1/2 as R1 → 0; IEC 60062 letter-digit code',
    run: () => {
      const o = calculate({ mode: 'astable', r1: '10', r2: '1M', c: '1' }).outputs;
      assertClose(o.duty_out, 0.5, { abs: 1e-5 }, 'duty');
      assertClose(readOne('4u7', 1e-6, 'C'), 4.7e-6, { rel: 1e-12 }, '4u7');
      assertClose(readOne('2R2', 1, 'R'), 2.2, { rel: 1e-12 }, '2R2');
      assertClose(readOne('0.47', 1e-6, 'C'), 0.47e-6, { rel: 1e-12 }, 'plain µF');
    },
  },
  {
    name: 'Invalid entries are rejected: text, two values, zero, and a duty cycle of 50 %',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ r1: 'abc' }), 'R1');
      assertThrows(() => calculate({ r2: '10k 22k' }), 'exactly one value');
      assertThrows(() => calculate({ c: '0' }), 'greater than zero');
      assertThrows(() => calculate({ mode: 'design', duty: 0.5 }), 'Target duty cycle');
    },
  },
];
