/**
 * reliability/tests.js — k-out-of-n blocks, system availability, mission reliability and the Weibull fit.
 * Run: node run-tests.js reliability
 */
import { calculate, kOutOfN, weibullFit } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'k-out-of-n: 1 of 1 is the unit itself, 1 of 2 is 1 − (1 − p)², 2 of 3 is 3p² − 2p³',
    source: 'IEC 61078 series, parallel and k-out-of-n structures (binomial)',
    run: () => {
      const p = 4000 / 4012;
      assertClose(kOutOfN(1, 1, p), p, { rel: 1e-12 }, '1 of 1');
      assertClose(kOutOfN(1, 2, p), 1 - (1 - p) ** 2, { rel: 1e-12 }, '1 of 2');
      assertClose(kOutOfN(2, 3, p), 3 * p ** 2 - 2 * p ** 3, { rel: 1e-12 }, '2 of 3');
    },
  },
  {
    name: 'Default system: unit availability MTBF/(MTBF + MTTR), system = product of blocks = 99.5195 %, 42.1 h of downtime in an 8766 h year',
    source: 'Steady-state availability of independent blocks in series',
    run: () => {
      const { outputs } = calculate({});
      const rows = outputs.blocks_table.rows;
      assertClose(rows[0][2], (5000 / 5024) * 100, { rel: 1e-12 }, 'main engine');
      assertClose(outputs.availability_pct, rows.reduce((p, r) => p * (1 - r[3] / 8766), 1) * 100, { rel: 1e-12 }, 'product');
      assertClose(outputs.downtime_h_year, (1 - outputs.availability_pct / 100) * 8766, { rel: 1e-12 }, 'downtime');
      assertClose(outputs.availability_pct, 99.5195, { abs: 0.00005 }, 'value');
    },
  },
  {
    name: 'Mission reliability without repair: the main engine over 720 h is e^(−720/5000) = 86.59 %',
    source: 'Constant failure rate, R(t) = e^(−t/MTBF)',
    run: () => {
      assertClose(calculate({}).outputs.blocks_table.rows[0][4], Math.exp(-720 / 5000) * 100, { rel: 1e-12 }, 'R');
    },
  },
  {
    name: 'Failure times placed exactly at the Bernard median ranks of a Weibull with β = 2 and η = 3000 h are fitted back exactly',
    source: 'IEC 61649 median ranks F = (i − 0.3)/(n + 0.4); regression of ln t on ln(−ln(1 − F))',
    run: () => {
      const n = 7;
      const times = Array.from({ length: n }, (_, i) => 3000 * (-Math.log(1 - (i + 1 - 0.3) / (n + 0.4))) ** 0.5);
      const fit = weibullFit(times);
      assertClose(fit.beta, 2, { rel: 1e-12 }, 'β');
      assertClose(fit.eta, 3000, { rel: 1e-12 }, 'η');
    },
  },
  {
    name: 'With β = 1 (exponential) the mean life equals η and the B10 life is η (−ln 0.9) = 0.1054 η',
    source: 'Weibull B life and mean η Γ(1 + 1/β) (Abernethy 2006)',
    run: () => {
      const n = 8;
      const times = Array.from({ length: n }, (_, i) => -1000 * Math.log(1 - (i + 1 - 0.3) / (n + 0.4)));
      const { outputs } = calculate({ failures: times.join(', ') });
      assertClose(outputs.weibull_beta, 1, { rel: 1e-9 }, 'β');
      assertClose(outputs.mean_life_h, 1000, { rel: 1e-9 }, 'mean');
      assertClose(outputs.b10_h, -1000 * Math.log(0.9), { rel: 1e-9 }, 'B10');
    },
  },
  {
    name: 'Invalid inputs are rejected: more units needed than installed, equal failure times, a block line with four fields',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ blocks: 'Pumps; 2; 3; 1000; 5' }), '1 ≤ needed ≤ installed');
      assertThrows(() => calculate({ failures: '100, 100, 100' }), 'must not all be equal');
      assertThrows(() => calculate({ blocks: 'Pumps; 2; 1; 1000' }), 'expected name');
    },
  },
];
