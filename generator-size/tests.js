/**
 * generator-size/tests.js — checks against hand sums of running and starting watts.
 * Run: node run-tests.js generator-size
 */
import { calculate, parseLoads } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Default house list: 4 450 W running, largest surge 1 550 W (furnace fan), peak 6 000 W, 5 563 W running rating at 80 %, 6.95 kVA standby',
    source: '700 + 1 050 + 800 + 600 + 1 000 + 300 = 4 450 W; max(1 500, 1 100, 1 550) = 1 550 W; 4 450 / 0.8 = 5 562.5 W; ISO 8528-1 kVA at pf 0.8',
    run: () => {
      const { outputs } = calculate({});
      assertEqual(outputs.running_w, 4450, 'running');
      assertEqual(outputs.surge_w, 1550, 'surge');
      assertEqual(outputs.peak_w, 6000, 'peak');
      assertClose(outputs.rated_w, 5562.5, { rel: 1e-12 }, 'rating');
      assertEqual(outputs.rated_start_w, 6000, 'starting rating');
      assertClose(outputs.standby_va, 6953.125, { rel: 1e-12 }, 'kVA');
      assertEqual(outputs.largest.startsWith('Furnace fan'), true, 'largest');
    },
  },
  {
    name: 'All motors starting together add every surge: 4 450 + 1 500 + 1 100 + 1 550 = 8 600 W',
    source: 'Simultaneous starting after a power cut',
    run: () => {
      assertEqual(calculate({ starting: 'all' }).outputs.peak_w, 8600, 'peak');
    },
  },
  {
    name: 'RV air conditioner 1 800 W running and 3 000 W starting with 400 W of other loads at 100 % loading: 2 200 W running, 3 400 W starting',
    source: 'W_peak = W_run + (W_start − W_run) of the air conditioner',
    run: () => {
      const { outputs } = calculate({ loads: 'Air conditioner; 1800; 3000\nOther; 400', max_loading: 1 });
      assertEqual(outputs.running_w, 2200, 'running');
      assertEqual(outputs.rated_w, 2200, 'rating');
      assertEqual(outputs.rated_start_w, 3400, 'starting');
    },
  },
  {
    name: 'Parser: comments, blank lines, tabs and thousands with spaces are read; starting watts default to running; the running rating is never below the peak in the starting rating',
    source: 'Input format of the page',
    run: () => {
      const l = parseLoads('# heading\n\nPump\t1 200\t3 600\nLamp; 60');
      assertEqual(l.length, 2, 'count');
      assertEqual(l[0].start, 3600, 'pump start');
      assertEqual(l[1].start, 60, 'lamp start defaults');
      const o = calculate({ loads: 'Heater; 3000', max_loading: 0.5 }).outputs;
      assertEqual(o.rated_start_w, 6000, 'rating above peak');
      assertEqual(calculate({ loads: 'Heater; 3000' }).warnings.length, 1, 'no-surge hint');
    },
  },
  {
    name: 'Bad lines are rejected with their line number: text for watts, starting below running, too many fields, an empty list',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ loads: 'Fridge; lots' }), 'line 1');
      assertThrows(() => calculate({ loads: 'Ok; 100\nPump; 1000; 500' }), 'line 2: the starting watts');
      assertThrows(() => calculate({ loads: 'A; 1; 2; 3' }), 'line 1');
      assertThrows(() => calculate({ loads: '# nothing' }), 'at least one load');
    },
  },
];
