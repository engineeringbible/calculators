/**
 * decibels/tests.js — checks against the definitions of the decibel and the absolute-level references.
 * Run: node run-tests.js decibels
 */
import { calculate, sumLevels, parseLevels } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'A power ratio of 2 is 3.0103 dB, 10 is 10 dB; a voltage ratio of 2 is 6.0206 dB, 10 is 20 dB',
    source: 'IEC 60027-3: L_P = 10 lg(P2/P1) dB, L_F = 20 lg(F2/F1) dB',
    run: () => {
      assertClose(calculate({ mode: 'ratio', ratio_kind: 'power', ratio: 2 }).outputs.db_out, 3.0103, { abs: 1e-4 }, 'P × 2');
      assertClose(calculate({ mode: 'ratio', ratio_kind: 'power', ratio: 10 }).outputs.db_out, 10, { abs: 1e-12 }, 'P × 10');
      assertClose(calculate({ mode: 'ratio', ratio_kind: 'voltage', ratio: 2 }).outputs.db_out, 6.0206, { abs: 1e-4 }, 'V × 2');
      assertClose(calculate({ mode: 'ratio', ratio_kind: 'voltage', ratio: 10 }).outputs.db_out, 20, { abs: 1e-12 }, 'V × 10');
    },
  },
  {
    name: '−6 dB is a power ratio of 0.2512 and a voltage ratio of 0.5012; 0 dB is 1',
    source: 'Inverse of the definitions: 10^(dB/10), 10^(dB/20)',
    run: () => {
      const o = calculate({ mode: 'db', db_in: -6 }).outputs;
      assertClose(o.power_ratio, 0.25119, { abs: 1e-5 }, 'power');
      assertClose(o.voltage_ratio, 0.50119, { abs: 1e-5 }, 'voltage');
      assertEqual(calculate({ mode: 'db', db_in: 0 }).outputs.power_ratio, 1, '0 dB');
    },
  },
  {
    name: '0 dBm in 50 Ω is 1 mW, −30 dBW, 0.2236 V, −13.01 dBV, 107.0 dBµV; 0 dBu in 600 Ω is 0.7746 V and 0 dBm',
    source: 'ITU-R V.574-5 absolute levels; 0 dBu = √(1 mW × 600 Ω) = 0.7746 V',
    run: () => {
      const o = calculate({ mode: 'level', level: 0, level_unit: 'dBm', impedance_ohm: 50 }).outputs;
      assertClose(o.watts, 1e-3, { rel: 1e-12 }, 'W');
      assertClose(o.dbw, -30, { abs: 1e-9 }, 'dBW');
      assertClose(o.volts, 0.223607, { abs: 1e-6 }, 'V');
      assertClose(o.dbv, -13.0103, { abs: 1e-4 }, 'dBV');
      assertClose(o.dbuv, 106.9897, { abs: 1e-4 }, 'dBµV');
      const u = calculate({ mode: 'level', level: 0, level_unit: 'dBu', impedance_ohm: 600 }).outputs;
      assertClose(u.volts, 0.774597, { abs: 1e-6 }, '0 dBu');
      assertClose(u.dbm, 0, { abs: 1e-9 }, 'dBm = dBu in 600 Ω');
      assertClose(u.dbv, -2.2185, { abs: 1e-4 }, 'dBV = dBu − 2.218');
    },
  },
  {
    name: 'Round trip: 1 V r.m.s. is 0 dBV and 120 dBµV, and 120 dBµV gives 1 V back',
    source: 'dBV re 1 V, dBµV re 1 µV',
    run: () => {
      const o = calculate({ mode: 'level', level: 1, level_unit: 'V' }).outputs;
      assertClose(o.dbv, 0, { abs: 1e-12 }, 'dBV');
      assertClose(o.dbuv, 120, { abs: 1e-9 }, 'dBµV');
      assertClose(calculate({ mode: 'level', level: 120, level_unit: 'dBuV' }).outputs.volts, 1, { rel: 1e-12 }, 'back');
    },
  },
  {
    name: 'Incoherent sum: two equal levels add 3.01 dB, ten add 10 dB; 85 + 82 + 79 dB = 87.4 dB',
    source: 'L = 10 lg Σ 10^(L_i/10) for uncorrelated sources',
    run: () => {
      assertClose(sumLevels([80, 80]), 83.0103, { abs: 1e-4 }, 'two equal');
      assertClose(sumLevels(new Array(10).fill(60)), 70, { abs: 1e-9 }, 'ten equal');
      assertClose(calculate({ mode: 'sum', levels: '85\n82\n79' }).outputs.sum_db, 87.436, { abs: 1e-3 }, 'three');
      assertEqual(parseLevels('−3; 4, 5').length, 3, 'separators and the minus sign');
    },
  },
  {
    name: 'Invalid entries are rejected: zero ratio, text in the levels, negative watts, zero impedance',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ mode: 'ratio', ratio: 0 }), 'Ratio');
      assertThrows(() => calculate({ mode: 'sum', levels: '80\nloud' }), 'Levels, line 2');
      assertThrows(() => calculate({ mode: 'level', level_unit: 'W', level: -1 }), 'watts');
      assertThrows(() => calculate({ mode: 'level', impedance_ohm: 0 }), 'Impedance');
    },
  },
];
