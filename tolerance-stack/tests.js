/**
 * tolerance-stack/tests.js — worst case, RSS, Monte Carlo and yield of a dimension chain.
 * Run: node run-tests.js tolerance-stack
 */
import { calculate, parseChain } from './calc.js';
import { normalCdf } from '../shared/stats.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Default chain 120 − 25 − 70 − 24.5: gap 0.50 mm, worst case ±(0.10 + 0.05 + 0.08 + 0.06) = ±0.29 mm, RSS ±√0.0225 = ±0.15 mm',
    source: 'Worst-case and root-sum-square stack-up (Drake 1999, ch. 9)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.nominal_mm, 0.5, { abs: 1e-12 }, 'gap');
      assertClose(outputs.worst_max_mm - outputs.nominal_mm, 0.29, { abs: 1e-12 }, 'worst case');
      assertClose(outputs.rss_mm, 0.15, { rel: 1e-12 }, 'RSS');
    },
  },
  {
    name: 'An unequal tolerance 10 +0.2/−0 enters at its mid-value 10.1 with a half-width of 0.1',
    source: 'Mean-shift conversion of bilateral unequal tolerances',
    run: () => {
      const { outputs } = calculate({ chain: 'A; +; 10; 0.2; 0', lower_limit: 9, upper_limit: 11 });
      assertClose(outputs.nominal_mm, 10.1, { rel: 1e-12 }, 'mid-value');
      assertClose(outputs.worst_max_mm, 10.2, { rel: 1e-12 }, 'upper');
      assertEqual(parseChain('A; −; 5; 0.1')[0].sign, -1, 'typographic minus');
    },
  },
  {
    name: 'Monte Carlo with normal parts at ±3σ: SD within 2 % of RSS/3 = 0.05; uniform parts: within 2 % of √(Σh²/3) = 0.0866',
    source: 'Variance of a sum of independent variables; seeded mulberry32 sampling',
    run: () => {
      assertClose(calculate({}).outputs.mc_sd_mm, 0.05, { rel: 0.02 }, 'normal');
      const uniform = calculate({ distribution: 'uniform' }).outputs;
      assertClose(uniform.sigma_mm, 0.15 / Math.sqrt(3), { rel: 1e-12 }, 'σ uniform');
      assertClose(uniform.mc_sd_mm, uniform.sigma_mm, { rel: 0.02 }, 'MC uniform');
    },
  },
  {
    name: 'Limits at ±3σ around the gap: normal yield 99.73 % and Cpk 1.00; the worst case exceeds them and is flagged',
    source: 'Normal distribution; process capability Cpk = min(USL − μ, μ − LSL)/3σ',
    run: () => {
      const { outputs, warnings } = calculate({});
      assertClose(outputs.normal_yield_pct, (normalCdf(3) - normalCdf(-3)) * 100, { rel: 1e-9 }, 'yield');
      assertClose(outputs.cpk, 1, { rel: 1e-9 }, 'Cpk');
      assertEqual(warnings.some((w) => w.startsWith('The worst case')), true, 'warning');
    },
  },
  {
    name: 'The simulation repeats exactly for the same inputs, can be switched off, and the variance shares add up to 100 %',
    source: 'Fixed seed; variance shares σ_i²/Σσ²',
    run: () => {
      assertEqual(calculate({}).outputs.mc_low_mm, calculate({}).outputs.mc_low_mm, 'reproducible');
      assertEqual(calculate({ monte_carlo: 'off' }).outputs.mc_sd_mm, null, 'off');
      const rows = calculate({}).outputs.chain_table.rows;
      assertClose(rows.reduce((s, r) => s + r[4], 0), 100, { rel: 1e-12 }, 'shares');
      assertClose(rows[0][4], (0.01 / 0.0225) * 100, { rel: 1e-12 }, 'housing share');
    },
  },
  {
    name: 'Invalid inputs are rejected: a direction other than + or −, an upper limit below the lower one, a negative tolerance',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ chain: 'A; x; 10; 0.1' }), 'must be + or −');
      assertThrows(() => calculate({ lower_limit: 1, upper_limit: 0.5 }), 'above the lower limit');
      assertThrows(() => calculate({ chain: 'A; +; 10; -0.1' }), 'positive amounts');
    },
  },
];
