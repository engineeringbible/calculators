/**
 * inverter-size/tests.js — checks against hand calculations of W, VA, surge and battery current.
 * Run: node run-tests.js inverter-size
 */
import { calculate, parseLoads } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Default list: 2 360 W, 2 664 VA, pump surge 1 600 W, peak 3 960 W, 3 330 VA with 25 % margin, 3 500 W inverter, 109.3 A at 24 V and 90 %',
    source: 'Hand calculation: Σ W, Σ W/PF, largest (start − run), I = P / (V η)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.running_w, 2360, { rel: 1e-12 }, 'W');
      assertClose(o.running_va, 150 / 0.8 + 800 / 0.75 + 1000 + 200 + 150 + 60, { rel: 1e-12 }, 'VA');
      assertClose(o.surge_w, 1600, { rel: 1e-12 }, 'surge');
      assertClose(o.peak_w, 3960, { rel: 1e-12 }, 'peak');
      assertClose(o.need_continuous_va, 3330.21, { abs: 0.01 }, 'with margin');
      assertEqual(o.recommended_w, 3500, 'size');
      assertClose(o.dc_running_a, 2360 / 21.6, { rel: 1e-12 }, 'DC');
      assertClose(o.dc_peak_a, 3960 / (21 * 0.9), { rel: 1e-12 }, 'DC peak at 21 V');
    },
  },
  {
    name: 'A 1 000 W pump starting at 3 000 W alone with a 2× surge inverter needs 1 500 W, set by the surge, not the 1 250 VA running load',
    source: 'Hand calculation: peak / surge multiple = 3 000 / 2',
    run: () => {
      const o = calculate({ loads: 'Pump; 1000; 3000; 0.8', margin: 0, surge_multiple: 2 }).outputs;
      assertClose(o.running_va, 1250, { rel: 1e-12 }, 'VA');
      assertClose(o.need_surge_w, 1500, { rel: 1e-12 }, 'surge need');
      assertEqual(o.recommended_w, 1500, 'size');
      assertEqual(o.recommended.includes('set by the motor starting surge'), true, 'text');
    },
  },
  {
    name: 'All motors starting together add every surge: 600 + 1 600 = 2 200 W on the default list',
    source: 'Definition of simultaneous starting',
    run: () => {
      const o = calculate({ starting: 'all' }).outputs;
      assertClose(o.surge_w, 2200, { rel: 1e-12 }, 'surge');
      assertClose(o.peak_w, 4560, { rel: 1e-12 }, 'peak');
    },
  },
  {
    name: '1 000 W from a 12 V battery through a 90 % inverter draws 92.6 A, and 105.8 A at the 10.5 V cutoff',
    source: 'I = P / (V η)',
    run: () => {
      const o = calculate({ loads: 'Load; 1000', battery_v: 12, cutoff: 0.875, efficiency: 0.9 }).outputs;
      assertClose(o.dc_running_a, 92.593, { abs: 0.001 }, '12 V');
      assertClose(o.dc_cutoff_a, 105.820, { abs: 0.001 }, '10.5 V');
      assertClose(o.pf, 1, { rel: 1e-12 }, 'resistive');
    },
  },
  {
    name: 'A load above the largest common size gives no size and says so; the parser fills in starting watts and power factor',
    source: 'Design decision; parser contract',
    run: () => {
      const o = calculate({ loads: 'Heater; 20000' }).outputs;
      assertEqual(o.recommended_w, null, 'no size');
      assertEqual(o.dc_rated_a, null, 'no rated current');
      const [l] = parseLoads('Fan; 75');
      assertEqual(l.start, 75, 'start');
      assertEqual(l.pf, 1, 'pf');
    },
  },
  {
    name: 'A power factor above 1, starting watts below running watts, an empty list and zero watts are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ loads: 'Pump; 500; 1500; 1.5' }), 'power factor');
      assertThrows(() => calculate({ loads: 'Pump; 500; 300' }), 'starting watts');
      assertThrows(() => calculate({ loads: '# nothing' }), 'at least one load');
      assertThrows(() => calculate({ loads: 'Off; 0' }), 'add up to zero');
    },
  },
];
