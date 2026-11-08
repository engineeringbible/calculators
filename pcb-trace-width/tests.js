/**
 * pcb-trace-width/tests.js — checks against the IPC-2221 curve fit, its commonly tabulated values and R = ρ L / A.
 * Run: node run-tests.js pcb-trace-width
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const MIL = 25.4e-6;

export const tests = [
  {
    name: '1 A, 1 oz, 10 °C rise, outer layer: 16.3 mil² and 11.8 mil (0.30 mm), the value printed in IPC-2221 trace-width tables',
    source: 'IPC-2221B Figure 6-4 curve fit, I = 0.048 ΔT^0.44 A^0.725; 1 oz = 1.378 mil',
    run: () => {
      const o = calculate({ current_a: 1, copper_oz: 1, rise_k: 10, layer: 'external' }).outputs;
      assertClose(o.area_mil2, 16.296, { abs: 0.001 }, 'area');
      assertClose(o.width_m / MIL, 11.83, { abs: 0.01 }, 'width mil');
      assertClose(o.width_mm_m * 1000, 0.300, { abs: 0.001 }, 'width mm');
    },
  },
  {
    name: 'The fitted current from the computed area returns the input current (inverse of I = k ΔT^0.44 A^0.725)',
    source: 'IPC-2221B curve fit, hand inversion',
    run: () => {
      const o = calculate({ current_a: 7.5, copper_oz: 2, rise_k: 30, layer: 'external' }).outputs;
      assertClose(0.048 * 30 ** 0.44 * o.area_mil2 ** 0.725, 7.5, { rel: 1e-12 }, 'I');
      assertClose(o.width_m / MIL, o.area_mil2 / (2 * 1.378), { rel: 1e-12 }, 'w = A / t');
    },
  },
  {
    name: 'Inner layer at 1 A needs the same copper as an outer layer at 2 A (k = 0.024 is half of 0.048)',
    source: 'IPC-2221B: the internal chart is the external chart at half the current',
    run: () => {
      const inner = calculate({ current_a: 1, layer: 'internal' }).outputs;
      const outer = calculate({ current_a: 2, layer: 'external' }).outputs;
      assertClose(inner.width_m, outer.width_m, { rel: 1e-12 }, 'width');
      assertClose(outer.other_width_m / outer.width_m, 2 ** (1 / 0.725), { rel: 1e-12 }, 'inner/outer width ratio 2^(1/0.725) = 2.60');
    },
  },
  {
    name: '2 A worked example: 2 in at 35 °C is 33.9 mΩ (R = ρ L / A with ρ = 1.7241e-8 × (1 + 0.00393 × 15)), 67.8 mV, 0.136 W',
    source: 'IEC 60028 copper resistivity and temperature coefficient; hand calculation',
    run: () => {
      const o = calculate({ current_a: 2, length_m: 0.0508, ambient_c: 25, rise_k: 10 }).outputs;
      const area = o.area_mil2 * MIL * MIL;
      assertClose(o.resistance_ohm, (1.7241e-8 * (1 + 0.00393 * 15) * 0.0508) / area, { rel: 1e-12 }, 'R');
      assertClose(o.resistance_ohm, 0.03391, { abs: 1e-5 }, 'R value');
      assertClose(o.drop_v, 0.06782, { abs: 1e-5 }, 'V');
      assertClose(o.loss_w, 0.1356, { abs: 1e-4 }, 'P');
    },
  },
  {
    name: 'Outside the IPC-2221 charts the calculator refuses: 20 A on an inner layer, a width over 400 mil, a 5 °C rise, 4 oz copper',
    source: 'IPC-2221B chart extent (35 A outer, 17.5 A inner, 400 mil, 10–100 °C, 0.5–3 oz)',
    run: () => {
      assertThrows(() => calculate({ current_a: 20, layer: 'internal' }), '17.5 A');
      assertThrows(() => calculate({ current_a: 30, copper_oz: 0.5, rise_k: 10 }), '400 mil');
      assertThrows(() => calculate({ rise_k: 5 }), 'Temperature rise');
      assertThrows(() => calculate({ copper_oz: 4 }), 'Copper weight');
      assertEqual(calculate({ current_a: 30, copper_oz: 3, rise_k: 100 }).outputs.width_m > 0, true, '30 A inside the range');
    },
  },
];
