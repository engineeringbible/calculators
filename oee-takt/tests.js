/**
 * oee-takt/tests.js — checks against the OEE.com worked example and the OEE and takt definitions.
 * Run: node run-tests.js oee-takt
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'OEE.com example: availability 0.8881, performance 0.8611, quality 0.9780, OEE 0.7479',
    source: 'Vorne Industries, OEE.com, Calculate OEE (published worked example)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.availability, 0.8881, { abs: 0.00005 }, 'A');
      assertClose(o.performance, 0.8611, { abs: 0.00005 }, 'P');
      assertClose(o.quality, 0.978, { abs: 0.00005 }, 'Q');
      assertClose(o.oee, 0.7479, { abs: 0.00005 }, 'OEE');
      assertEqual(o.good_count, 18848, 'good');
    },
  },
  {
    name: 'Simple OEE identity: OEE = ideal cycle × good parts / planned time = 1.0 × 18 848 / 25 200 s',
    source: 'OEE.com simple calculation (fully productive time ÷ planned production time)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.oee, 18848 / 25200, { rel: 1e-12 }, 'identity');
    },
  },
  {
    name: 'Takt: 420 min for 18 000 parts is 1.40 s; 1.337 s per good part meets it; at 20 000 parts (1.26 s) it falls short',
    source: 'Takt time = available time / demand (hand calculation)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.takt_s, 1.4, { rel: 1e-12 }, 'takt');
      assertClose(o.per_good_s, 25200 / 18848, { rel: 1e-12 }, 'per good part');
      assertEqual(o.verdict.startsWith('Meets demand'), true, 'meets');
      assertEqual(calculate({ demand: 20000 }).outputs.verdict.startsWith('Falls short'), true, 'short');
      assertClose(o.avg_cycle_s, 373 * 60 / 19271, { rel: 1e-12 }, 'average cycle');
    },
  },
  {
    name: 'Limiting cases: no downtime, ideal speed and no rejects give OEE 100 %; a too-slow ideal cycle warns (performance above 100 %)',
    source: 'Definitions (limiting cases)',
    run: () => {
      const o = calculate({ shift_s: 3600, breaks_s: 0, downtime_s: 0, ideal_cycle_s: 2, total_count: 1800, reject_count: 0, demand: 1800 }).outputs;
      assertClose(o.oee, 1, { rel: 1e-12 }, '100 %');
      assertEqual(calculate({ ideal_cycle_s: 2 }).warnings.length >= 1, true, 'P > 1');
    },
  },
  {
    name: 'Breaks longer than the shift, downtime longer than planned time and more rejects than parts are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ breaks_s: 480 * 60 }), 'shorter than the shift');
      assertThrows(() => calculate({ downtime_s: 420 * 60 }), 'planned production time');
      assertThrows(() => calculate({ reject_count: 20000 }), 'cannot exceed');
    },
  },
];
