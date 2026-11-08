/**
 * generator-droop/tests.js — droop lines, proportional sharing and an isochronous set on an isolated bus.
 * Run: node run-tests.js generator-droop
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const WITH_ISO = 'DG1; 1000; 4; 62.4\nDG2; 1000; iso; 60';

export const tests = [
  {
    name: 'Woodward droop definition: a set from 60 Hz at no load with 10 % droop runs at 54 Hz at full load',
    source: 'Woodward Application Note 50528: (no-load − full-load speed)/rated = 6/60 = 10 %',
    run: () => {
      assertClose(calculate({ sets: 'G; 1000; 10; 60', load_kw: 1000 }).outputs.bus_frequency_hz, 54, { rel: 1e-12 }, 'f');
    },
  },
  {
    name: 'Equal droop and settings share load in proportion to rating: 1800 kW on 1000 + 1000 + 800 kW sets at 64.3 % each and 62.4 − 2.4 × 1800/2800 = 60.857 Hz',
    source: 'Woodward Application Note 01302; straight-line droop characteristics',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.bus_frequency_hz, 62.4 - (2.4 * 1800) / 2800, { rel: 1e-12 }, 'f');
      outputs.sets_table.rows.forEach((r) => assertClose(r[4], (1800 / 2800) * 100, { rel: 1e-12 }, r[0]));
      assertClose(outputs.setting_change_hz, 60 - outputs.bus_frequency_hz, { rel: 1e-12 }, 'setting change');
    },
  },
  {
    name: 'Unequal droops: every set lies on its own line at the common frequency and the loads add up to 1800 kW',
    source: 'P_i = P_r (f_nl − f)/(D f_r), Σ P_i = load',
    run: () => {
      const { outputs } = calculate({ sets: 'DG1; 1000; 4; 62.4\nDG2; 1000; 5; 63.0\nDG3; 800; 3; 61.8' });
      const f = outputs.bus_frequency_hz;
      const rows = outputs.sets_table.rows;
      assertClose(rows[0][3], (1000 * (62.4 - f)) / (0.04 * 60), { rel: 1e-12 }, 'DG1');
      assertClose(rows[2][3], (800 * (61.8 - f)) / (0.03 * 60), { rel: 1e-12 }, 'DG3');
      assertClose(rows.reduce((s, r) => s + r[3], 0), 1800, { rel: 1e-12 }, 'sum');
    },
  },
  {
    name: 'Isochronous set with a droop set: at 60 Hz the droop set carries 1000 kW and the isochronous set the balance of 800 kW',
    source: 'Woodward Application Note 01302, isochronous and droop units on an isolated system',
    run: () => {
      const { outputs } = calculate({ sets: WITH_ISO });
      assertClose(outputs.bus_frequency_hz, 60, { rel: 1e-12 }, 'f');
      assertClose(outputs.sets_table.rows[1][3], 800, { rel: 1e-12 }, 'isochronous load');
    },
  },
  {
    name: 'Beyond the isochronous set\'s rating the bus slows to 59.76 Hz at 2100 kW; below the droop setting it unloads and the bus rises to 61.68 Hz at 300 kW',
    source: 'Woodward Application Note 01302',
    run: () => {
      const high = calculate({ sets: WITH_ISO, load_kw: 2100 });
      assertClose(high.outputs.bus_frequency_hz, 62.4 - 2.4 * 1.1, { rel: 1e-12 }, 'overloaded');
      assertEqual(high.warnings.some((w) => w.includes('overloaded')), true, 'warning');
      assertClose(calculate({ sets: WITH_ISO, load_kw: 300 }).outputs.bus_frequency_hz, 62.4 - 2.4 * 0.3, { rel: 1e-12 }, 'unloaded');
    },
  },
  {
    name: 'Invalid inputs are rejected: two isochronous sets, a droop of 30 %, a line with three fields',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ sets: 'A; 500; iso; 60\nB; 500; iso; 60' }), 'Only one isochronous');
      assertThrows(() => calculate({ sets: 'A; 500; 30; 60' }), 'between 0 and 20');
      assertThrows(() => calculate({ sets: 'A; 500; 4' }), 'expected name');
    },
  },
];
