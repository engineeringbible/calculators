/**
 * capacitors-series-parallel/tests.js — checks against the series and parallel capacitance rules, Q = C V and
 * E = ½ C V².
 * Run: node run-tests.js capacitors-series-parallel
 */
import { calculate, seriesCapacitance, parallelCapacitance } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '10, 22 and 47 µF in series at 12 V: 5.998 µF, 71.97 µC, 0.432 mJ; voltages 7.20, 3.27 and 1.53 V add to 12 V',
    source: 'Hughes, Electrical and Electronic Technology, ch. 5: 1/C = Σ1/Cᵢ, Q = C V, Vᵢ = Q/Cᵢ, W = ½ C V²',
    run: () => {
      const { outputs } = calculate({ values: '10\n22\n47', connection: 'series', voltage_v: 12 });
      const c = 1 / (1 / 10e-6 + 1 / 22e-6 + 1 / 47e-6);
      assertClose(outputs.total_f, c, { rel: 1e-12 }, 'C');
      assertClose(outputs.charge_uc, c * 12 * 1e6, { rel: 1e-12 }, 'Q');
      assertClose(outputs.energy_j, 0.5 * c * 144, { rel: 1e-12 }, 'E');
      assertClose(outputs.max_voltage_v, c * 12 / 10e-6, { rel: 1e-12 }, 'V on 10 µF');
      const sum = outputs.each.rows.reduce((s, row) => s + Number(row[2].replace(' V', '')), 0);
      assertClose(sum, 12, { abs: 0.02 }, 'voltages add up');
    },
  },
  {
    name: 'In parallel the same three give 79 µF; at 12 V each sees 12 V and the charge is 948 µC',
    source: 'Boylestad, Introductory Circuit Analysis, ch. 10: C = ΣCᵢ in parallel',
    run: () => {
      const { outputs } = calculate({ values: '10 22 47', connection: 'parallel', voltage_v: 12 });
      assertClose(outputs.total_f, 79e-6, { rel: 1e-12 }, 'C');
      assertClose(outputs.charge_uc, 948, { rel: 1e-12 }, 'Q');
      assertClose(outputs.max_voltage_v, 12, { rel: 1e-12 }, 'V');
      assertClose(outputs.other_f, seriesCapacitance([10e-6, 22e-6, 47e-6]), { rel: 1e-12 }, 'other connection');
    },
  },
  {
    name: 'Two equal capacitors: series halves (2 × 100 nF = 50 nF), parallel doubles (200 nF); marked values 100n, 4u7 and 22p read correctly',
    source: 'Equal capacitors; IEC 60062 letter and digit code',
    run: () => {
      assertClose(seriesCapacitance([100e-9, 100e-9]), 50e-9, { rel: 1e-12 }, 'series');
      assertClose(parallelCapacitance([100e-9, 100e-9]), 200e-9, { rel: 1e-12 }, 'parallel');
      const { outputs } = calculate({ values: '100n 4u7 22p', connection: 'parallel', voltage_v: 0 });
      assertClose(outputs.total_f, 100e-9 + 4.7e-6 + 22e-12, { rel: 1e-12 }, 'marked values');
      assertEqual(outputs.energy_j, 0, 'no voltage, no energy');
    },
  },
  {
    name: 'Energy: a 1000 µF capacitor at 50 V stores 1.25 J',
    source: 'W = ½ C V² (Hughes, ch. 5)',
    run: () => {
      assertClose(calculate({ values: '1000', connection: 'parallel', voltage_v: 50 }).outputs.energy_j, 1.25, { rel: 1e-12 }, 'E');
    },
  },
  {
    name: 'Series stacks warn about voltage sharing; an empty list and a zero value are rejected',
    source: 'Validation contract; series voltage sharing by leakage (Hughes, ch. 5)',
    run: () => {
      assertEqual(calculate({ values: '10 47', connection: 'series', voltage_v: 12 }).warnings.length >= 1, true, 'warning');
      assertThrows(() => calculate({ values: '' }), 'at least one capacitor');
      assertThrows(() => calculate({ values: '10 0' }), 'must be greater than zero');
    },
  },
];
