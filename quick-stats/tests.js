/**
 * quick-stats/tests.js — checks against textbook statistics, the t table, ISO 5725-2 Grubbs values and parsing rules.
 * Run: node run-tests.js quick-stats
 */
import { calculate, parseData } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FUEL = '31.2\n30.8\n31.5\n30.9\n31.1\n31.4\n30.7\n31.0\n31.3\n34.2';

export const tests = [
  {
    name: 'Textbook series 2, 4, 4, 4, 5, 5, 7, 9: mean 5, median 4.5, sample SD 2.1381, population SD 2, skewness 0.8185, excess kurtosis 0.9406 (Excel SKEW/KURT)',
    source: 'Standard-deviation textbook example (population SD 2); Joanes & Gill (1998) estimators',
    run: () => {
      const { outputs } = calculate({ mode: 'values', data: '2 4 4 4 5 5 7 9', confidence: '0.95' });
      assertEqual(outputs.n, 8, 'n');
      assertEqual(outputs.mean, 5, 'mean');
      assertClose(outputs.median, 4.5, { rel: 1e-12 }, 'median');
      assertClose(outputs.sd, Math.sqrt(32 / 7), { rel: 1e-12 }, 'SD');
      assertClose(outputs.population_sd, 2, { rel: 1e-12 }, 'population SD');
      assertClose(outputs.skewness, 0.8184876, { abs: 1e-6 }, 'skewness');
      assertClose(outputs.kurtosis, 0.940625, { rel: 1e-9 }, 'kurtosis');
    },
  },
  {
    name: 'Confidence interval: n 8, t(0.975, 7) = 2.364624 → 5 ± 2.364624 × 2.13809/√8 = 3.2125 … 6.7875; at 99 % t(0.995, 7) = 3.499483 → ± 2.6454',
    source: 'Student t table (NIST/SEMATECH 1.3.6.7.2)',
    run: () => {
      const r95 = calculate({ mode: 'values', data: '2,4,4,4,5,5,7,9', confidence: '0.95' }).outputs;
      assertClose(r95.t_value, 2.364624, { abs: 1e-6 }, 't 95');
      assertClose(r95.ci_low, 5 - 2.364624 * Math.sqrt(32 / 7) / Math.sqrt(8), { abs: 1e-5 }, 'low');
      assertClose(r95.ci_high, 6.7875, { abs: 1e-4 }, 'high');
      const r99 = calculate({ mode: 'values', data: '2;4;4;4;5;5;7;9', confidence: '0.99' }).outputs;
      assertClose(r99.t_value, 3.499483, { abs: 1e-6 }, 't 99');
      assertClose(r99.ci_high - 5, 2.6454, { abs: 1e-4 }, 'half-width 99');
    },
  },
  {
    name: 'Trend: pairs (1,1) (2,3) (3,2) (4,5) (5,4) give slope 0.8, intercept 0.6, R² 0.64, p 0.104 → not significant at 95 %; the same values as one series give the same line against the observation number',
    source: 'OLS regression inference (Montgomery & Runger)',
    run: () => {
      const pairs = calculate({ mode: 'pairs', data: '1 1\n2 3\n3 2\n4 5\n5 4', confidence: '0.95' }).outputs;
      assertClose(pairs.trend_slope, 0.8, { rel: 1e-12 }, 'slope');
      assertClose(pairs.trend_intercept, 0.6, { rel: 1e-9 }, 'intercept');
      assertClose(pairs.trend_r2, 0.64, { rel: 1e-12 }, 'R²');
      assertClose(pairs.trend_p, 0.104, { abs: 5e-4 }, 'p');
      assertEqual(pairs.trend_text.startsWith('Not significant at 95 %'), true, 'text');
      const series = calculate({ mode: 'values', data: '1 3 2 5 4', confidence: '0.95' }).outputs;
      assertClose(series.trend_slope, 0.8, { rel: 1e-12 }, 'series slope');
      assertClose(series.mean, 3, { rel: 1e-12 }, 'statistics of y');
    },
  },
  {
    name: 'Outliers in the default fuel series: mean 31.41, s 1.0137; 34.2 has G = 2.752 > 2.290 (Grubbs, n 10, α 5 %), Chauvenet n·P = 0.059 < 0.5 and lies above the Tukey fence 32.05 → flagged by all three; without it mean 31.10',
    source: 'ISO 5725-2:2019 Table 5 (Grubbs n = 10: 2.290); Taylor (Chauvenet); Tukey fences',
    run: () => {
      const { outputs, warnings } = calculate({ mode: 'values', data: FUEL, confidence: '0.95' });
      assertClose(outputs.mean, 31.41, { abs: 1e-9 }, 'mean');
      assertClose(outputs.sd, Math.sqrt(9.249 / 9), { rel: 1e-9 }, 'SD');
      assertEqual(outputs.outlier_table.rows.length, 1, 'one flagged value');
      const [value, position, z, tests] = outputs.outlier_table.rows[0];
      assertEqual(value === 34.2 && position === 10, true, 'value and position');
      assertClose(z, 2.79 / Math.sqrt(9.249 / 9), { rel: 1e-9 }, 'z');
      assertEqual(tests, 'Tukey, Chauvenet, Grubbs', 'all three tests');
      assertEqual(outputs.outliers_text.includes('34.2 is a Grubbs outlier'), true, 'text');
      assertClose(outputs.mean_clean, 31.1, { abs: 1e-9 }, 'mean without');
      assertEqual(warnings.some((w) => w.includes('investigated')), true, 'warning');
    },
  },
  {
    name: 'Quartiles (type 7) of the fuel series: Q1 = 30.925, Q3 = 31.375, IQR 0.45, fences 30.25 / 32.05; a clean series flags nothing',
    source: 'Hyndman & Fan (1996) type 7 (Excel PERCENTILE.INC)',
    run: () => {
      const { outputs } = calculate({ mode: 'values', data: FUEL, confidence: '0.95' });
      assertClose(outputs.q1, 30.925, { abs: 1e-9 }, 'Q1');
      assertClose(outputs.q3, 31.375, { abs: 1e-9 }, 'Q3');
      assertClose(outputs.iqr, 0.45, { abs: 1e-9 }, 'IQR');
      const clean = calculate({ mode: 'values', data: FUEL.replace('34.2', '31.0'), confidence: '0.95' }).outputs;
      assertEqual(clean.outliers_text.startsWith('No value flagged'), true, 'clean');
      assertEqual(clean.outlier_table.rows[0][1], 'none', 'table none');
    },
  },
  {
    name: 'Parsing and validation: comment lines, commas, semicolons and tabs are accepted; text, a single value and a pair line with three numbers are rejected',
    source: 'Input contract',
    run: () => {
      assertEqual(parseData('# t/day\n1,2;3\t4', 'values').ys.join(), '1,2,3,4', 'separators');
      assertEqual(parseData('# x y\n1 10\n2 20', 'pairs').xs.join(), '1,2', 'pairs');
      assertThrows(() => calculate({ mode: 'values', data: '1, 2, abc', confidence: '0.95' }), 'is not a number', 'text');
      assertThrows(() => calculate({ mode: 'values', data: '5', confidence: '0.95' }), 'at least two values', 'one value');
      assertThrows(() => calculate({ mode: 'pairs', data: '1 2 3\n4 5', confidence: '0.95' }), 'Line 1: expected two numbers', 'bad pair');
    },
  },
];
