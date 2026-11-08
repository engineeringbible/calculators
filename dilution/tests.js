/**
 * dilution/tests.js — checks against the dilution formula C1V1 = C2V2 and serial dilution by hand.
 * Run: node run-tests.js dilution
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const ML = 1e-6;

export const tests = [
  {
    name: '500 mL of 1 M HCl from 12 M stock: 41.67 mL of stock, 458.3 mL of water, dilution factor 12 (1 : 11)',
    source: 'Harris, Quantitative Chemical Analysis, ch. 1: M_conc V_conc = M_dil V_dil, by hand',
    run: () => {
      const o = calculate({ solve: 'v1', c1: 12, c2: 1, v2_m3: 500 * ML }).outputs;
      assertClose(o.v1_out / ML, 41.6667, { abs: 1e-4 }, 'V1');
      assertClose(o.diluent / ML, 458.3333, { abs: 1e-4 }, 'diluent');
      assertClose(o.df, 12, { rel: 1e-12 }, 'DF');
      assertEqual(o.ratio.startsWith('1 : 11 '), true, 'ratio');
    },
  },
  {
    name: 'Each unknown in turn: 10 mL of 0.5 M made up to 250 mL is 0.02 M; 10 mL of 2 M to 0.1 M needs 200 mL; 0.02 M from 10 mL into 250 mL means 0.5 M stock',
    source: 'C1V1 = C2V2 rearranged, by hand',
    run: () => {
      assertClose(calculate({ solve: 'c2', c1: 0.5, v1_m3: 10 * ML, v2_m3: 250 * ML }).outputs.c2_out, 0.02, { rel: 1e-12 }, 'C2');
      assertClose(calculate({ solve: 'v2', c1: 2, v1_m3: 10 * ML, c2: 0.1 }).outputs.v2_out / ML, 200, { rel: 1e-12 }, 'V2');
      assertClose(calculate({ solve: 'c1', c2: 0.02, v1_m3: 10 * ML, v2_m3: 250 * ML }).outputs.c1_out, 0.5, { rel: 1e-12 }, 'C1');
    },
  },
  {
    name: 'Serial: six 1 : 10 steps from 10⁸ cells/mL give a factor of 10⁶ and 100 cells/mL; 1 mL transfers need 9 mL of diluent per tube',
    source: 'Serial dilution, DF_total = f^n (Skoog et al., ch. 4), by hand',
    run: () => {
      const o = calculate({ c1: 1e8, serial: 'yes', steps: 6, step_factor: 10, transfer_m3: 1 * ML }).outputs;
      assertClose(o.serial_df, 1e6, { rel: 1e-12 }, 'total');
      assertClose(o.serial_final, 100, { rel: 1e-12 }, 'final');
      assertClose(o.serial_diluent / ML, 9, { rel: 1e-12 }, 'diluent');
      assertEqual(o.serial_list.split('; ').length, 6, 'list');
    },
  },
  {
    name: 'Two-fold series: 5 steps of 1 : 2 is a factor of 32; a one-step factor of 1 leaves the concentration unchanged with no diluent',
    source: 'Limiting cases by hand',
    run: () => {
      assertClose(calculate({ serial: 'yes', steps: 5, step_factor: 2 }).outputs.serial_df, 32, { rel: 1e-12 }, '2⁵');
      const o = calculate({ solve: 'v1', c1: 1, c2: 1, v2_m3: 100 * ML }).outputs;
      assertClose(o.v1_out / ML, 100, { rel: 1e-12 }, 'V1 = V2');
      assertClose(o.diluent, 0, { abs: 1e-18 }, 'no diluent');
    },
  },
  {
    name: 'A final concentration above the stock, a final volume below the stock volume and a fractional step count are rejected; a large one-step factor warns',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ solve: 'v1', c1: 1, c2: 2 }), 'must not exceed the stock concentration');
      assertThrows(() => calculate({ solve: 'c2', c1: 1, v1_m3: 20 * ML, v2_m3: 10 * ML }), 'at least the stock volume');
      assertThrows(() => calculate({ serial: 'yes', steps: 2.5 }), 'whole number');
      assertEqual(calculate({ solve: 'v1', c1: 5000, c2: 1 }).warnings.length, 1, 'warning');
    },
  },
];
