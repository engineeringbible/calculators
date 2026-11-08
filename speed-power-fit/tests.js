/**
 * speed-power-fit/tests.js — power-law fit, power increase, speed loss and the ISO 19030 performance value.
 * Run: node run-tests.js speed-power-fit
 */
import { calculate, fitPowerLaw, parsePairs } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const REF = (v) => 0.95 * v ** 3.4;
const SPEEDS = [11, 12, 13, 14, 15];
const lines = (f) => SPEEDS.map((v) => `${v}; ${f(v)}`).join('\n');

export const tests = [
  {
    name: 'Exact data on P = 0.95 V^3.4 are fitted with a = 0.95, n = 3.4 and R² = 1',
    source: 'Least squares on ln P = ln a + n ln V (ITTC 7.5-04-01-01.2 power curve)',
    run: () => {
      const fit = fitPowerLaw(SPEEDS.map((v) => ({ v, p: REF(v) })));
      assertClose(fit.a, 0.95, { rel: 1e-9 }, 'a');
      assertClose(fit.n, 3.4, { rel: 1e-9 }, 'n');
      assertClose(fit.r2, 1, { abs: 1e-12 }, 'R²');
    },
  },
  {
    name: 'Fouled hull: data 6 % above the reference give a 6.0 % power increase at any speed and a performance value of 1.06^(−1/3.4) − 1 = −1.70 % at every point',
    source: 'ISO 19030-2:2016 performance value PV = (V_meas − V_expected)/V_expected',
    run: () => {
      const { outputs } = calculate({ data: lines((v) => 1.06 * REF(v)), reference: 'coefficients', ref_a: 0.95, ref_n: 3.4, eval_speed_kn: 13.5 });
      assertClose(outputs.power_increase_pct, 6, { rel: 1e-9 }, 'power increase');
      const pv = (1.06 ** (-1 / 3.4) - 1) * 100;
      assertClose(outputs.mean_pv_pct, pv, { rel: 1e-9 }, 'mean PV');
      assertClose(outputs.mean_pv_pct, -1.70, { abs: 0.01 }, 'value');
      outputs.points_table.rows.forEach((r) => assertClose(r[5], pv, { rel: 1e-9 }, `PV at ${r[0]} kn`));
    },
  },
  {
    name: 'Speed loss at constant power equals the performance value: (V_fit(P) − V_ref(P))/V_ref(P) = 1.06^(−1/3.4) − 1 for a 6 % power increase',
    source: 'Inverse power law V = (P/a)^(1/n)',
    run: () => {
      const { outputs } = calculate({ data: lines((v) => 1.06 * REF(v)), reference: 'coefficients', ref_a: 0.95, ref_n: 3.4, eval_power_kw: 7000 });
      assertClose(outputs.speed_loss_pct, (1.06 ** (-1 / 3.4) - 1) * 100, { rel: 1e-9 }, 'speed loss');
      assertClose(outputs.ref_speed_at_power_kn, (7000 / 0.95) ** (1 / 3.4), { rel: 1e-12 }, 'reference speed');
    },
  },
  {
    name: 'Reference given as points on the same curve gives the same result as the coefficients',
    source: 'Same least-squares fit applied to the reference points',
    run: () => {
      const data = lines((v) => 1.06 * REF(v));
      const byPoints = calculate({ data, reference: 'points', ref_points: lines(REF), eval_speed_kn: 13 }).outputs;
      const byCoefficients = calculate({ data, reference: 'coefficients', ref_a: 0.95, ref_n: 3.4, eval_speed_kn: 13 }).outputs;
      assertClose(byPoints.power_increase_pct, byCoefficients.power_increase_pct, { rel: 1e-9 }, 'same');
    },
  },
  {
    name: 'Default data, 7 % above the reference with ±1 % scatter: the fit finds n ≈ 3.4, R² above 0.99 and a performance value of about −2 %',
    source: 'Synthetic data from P = 1.07 × 0.95 V^3.4 with fixed scatter',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.fit_n, 3.4, { abs: 0.15 }, 'exponent');
      assertEqual(outputs.r2 > 0.99, true, 'R²');
      assertClose(outputs.mean_pv_pct, (1.07 ** (-1 / 3.4) - 1) * 100, { abs: 0.3 }, 'performance value');
    },
  },
  {
    name: 'Invalid inputs fail fast: two data points, a zero power, a malformed line, all points at one speed',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ data: '12; 4000\n13; 5000' }), 'at least three', 'too few');
      assertThrows(() => parsePairs('12; 0', 'Data'), 'greater than zero', 'zero power');
      assertThrows(() => parsePairs('12 kn fast', 'Data'), 'Data line 1', 'malformed');
      assertThrows(() => calculate({ data: '12; 4000\n12; 4100\n12; 4200' }), 'same speed', 'one speed');
    },
  },
];
