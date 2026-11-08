/**
 * enclosed-space-purge/tests.js — dilution purge times for oxygen, flammable and toxic gas with a mixing factor.
 * Run: node run-tests.js enclosed-space-purge
 */
import { calculate, dilutionTime } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Washout: a contaminant falls to 1/e of its value in one time constant, and a tenfold reduction takes ln 10 = 2.30 air changes with perfect mixing',
    source: 'ACGIH Industrial Ventilation manual, purge equation t = (K V/Q) ln(C0/C)',
    run: () => {
      assertClose(dilutionTime(100, 100 / Math.E, 0, 60, 'max'), 60, { rel: 1e-12 }, 'one time constant');
      const { outputs } = calculate({ mixing_factor: 1, o2_initial_pct: 20.9, toxic_initial_ppm: 0, lfl_initial_pct: 10, lfl_target_pct: 1 });
      assertClose(outputs.air_changes, Math.log(10), { rel: 1e-12 }, 'air changes');
    },
  },
  {
    name: 'Default tank: 1200 m³, 5000 m³/h, K = 3: oxygen 18 → 20.8 % takes 43.2 ln 29 = 145.5 min and governs; 10 → 1 % LFL 99.5 min; 50 → 12.5 ppm 59.9 min',
    source: 'Dilution towards 20.9 % oxygen and zero contaminant; MSC.581(110) 7.4 entry criteria',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.o2_time_min, 43.2 * Math.log(29), { rel: 1e-9 }, 'oxygen');
      assertClose(outputs.lfl_time_min, 43.2 * Math.log(10), { rel: 1e-9 }, 'flammable');
      assertClose(outputs.toxic_time_min, 43.2 * Math.log(4), { rel: 1e-9 }, 'toxic');
      assertClose(outputs.purge_time_min, outputs.o2_time_min, { rel: 1e-12 }, 'governs');
      assertClose(outputs.air_changes, 10.10, { abs: 0.005 }, 'air changes');
    },
  },
  {
    name: 'The mixing factor scales the time: K = 3 needs three times the ideal time of perfect mixing',
    source: 'Effective dilution flow Q/K',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.ideal_time_min, outputs.purge_time_min / 3, { rel: 1e-12 }, 'ideal');
      assertClose(calculate({ mixing_factor: 1 }).outputs.purge_time_min, outputs.ideal_time_min, { rel: 1e-12 }, 'K = 1');
    },
  },
  {
    name: 'Values already meeting their criteria need no ventilation time, and the table shows the atmosphere at the end of the purge',
    source: 'Criteria met at the start',
    run: () => {
      const done = calculate({ o2_initial_pct: 20.85, lfl_initial_pct: 0.5, toxic_initial_ppm: 5 });
      assertEqual(done.outputs.purge_time_min, 0, 'no time');
      const rows = calculate({}).outputs.purge_table.rows;
      assertClose(rows[rows.length - 1][1], 20.8, { rel: 1e-9 }, 'oxygen at the end');
    },
  },
  {
    name: 'Unreachable targets are rejected: supply air above the toxic target, an oxygen target of 21 %',
    source: 'Dilution only approaches the supply air composition',
    run: () => {
      assertThrows(() => calculate({ toxic_fresh_ppm: 20 }), 'cannot reach');
      assertThrows(() => calculate({ o2_target_pct: 21 }), 'cannot reach');
    },
  },
  {
    name: 'Invalid inputs are rejected: zero fan flow, a mixing factor below 1',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ fan_flow_m3_h: 0 }), 'greater than zero');
      assertThrows(() => calculate({ mixing_factor: 0.5 }), 'must be between');
    },
  },
];
