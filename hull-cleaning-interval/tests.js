/**
 * hull-cleaning-interval/tests.js — checks of the replacement-interval optimum and the cost arithmetic.
 * Run: node run-tests.js hull-cleaning-interval
 */
import { calculate, averageMonthlyCost } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const CASE = { fuel_t_per_day: 30, sea_days_per_month: 22, fuel_price: 550, eua_price: 70, ets_share_pct: 50, co2_factor: 3.114, initial_penalty_pct: 0, penalty_rate_pct_month: 1, cleaning_cost: 60000, offhire_days: 1, hire_rate: 20000, chosen_interval_months: 12, docking_interval_months: 60 };
const C1 = (30 * 22 * (550 + 0.5 * 3.114 * 70)) / 100;
const C = 80000;

export const tests = [
  {
    name: 'Cost per point and per cleaning: c₁ = 30 × 22 × (550 + 0.5 × 3.114 × 70)/100 = 4 349.3 per % per month; C = 60 000 + 1 × 20 000 = 80 000',
    source: 'Model definition (fuel + ETS cost of one percentage point; cleaning plus off-hire)',
    run: () => {
      const { outputs } = calculate(CASE);
      assertClose(outputs.cost_per_pct_month, C1, { rel: 1e-12 }, 'c₁');
      assertClose(outputs.cost_per_pct_month, 4349.3, { abs: 0.1 }, 'c₁ value');
      assertClose(outputs.cycle_cost, C, { rel: 1e-12 }, 'C');
    },
  },
  {
    name: 'Optimum: T* = √(2 × 80 000/(4 349.3 × 1)) = 6.065 months, A(T*) = √(2 C c₁ r) = 26 380 per month = 316 557 per year; 1.98 cleanings per year; penalty 6.07 % just before cleaning',
    source: 'Jardine & Tsang age-replacement optimum with linearly increasing cost',
    run: () => {
      const { outputs } = calculate(CASE);
      assertClose(outputs.optimal_interval_months, Math.sqrt((2 * C) / C1), { rel: 1e-12 }, 'T* formula');
      assertClose(outputs.optimal_interval_months, 6.065, { abs: 1e-3 }, 'T* value');
      assertClose(outputs.recommended_interval_months, outputs.optimal_interval_months, { rel: 1e-12 }, 'not capped');
      assertClose(outputs.avg_cost_year_opt / 12, Math.sqrt(2 * C * C1), { rel: 1e-9 }, 'A(T*)');
      assertClose(outputs.avg_cost_year_opt / 12, 26380, { abs: 1 }, 'A(T*) value');
      assertClose(outputs.cleanings_per_year, 12 / outputs.optimal_interval_months, { rel: 1e-12 }, 'per year');
      assertClose(outputs.penalty_end_opt_pct, outputs.optimal_interval_months, { rel: 1e-12 }, 'penalty at T*');
    },
  },
  {
    name: 'The optimum is a minimum: A(T*) ≤ A(T) for T = 3, 4.5, 9, 12, 24 months; the compared 12-month policy costs 32 763 per month, so the saving is 12 × (32 763 − 26 380) = 76 595 per year',
    source: 'Convexity of C/T + a T/2; arithmetic',
    run: () => {
      const { outputs } = calculate(CASE);
      const aStar = averageMonthlyCost(outputs.optimal_interval_months, C, C1, 0, 1);
      for (const T of [3, 4.5, 9, 12, 24]) assertEqual(averageMonthlyCost(T, C, C1, 0, 1) >= aStar - 1e-9, true, `A(${T}) ≥ A*`);
      assertClose(outputs.avg_cost_year_chosen / 12, 80000 / 12 + (C1 * 12) / 2, { rel: 1e-12 }, 'A(12)');
      assertClose(outputs.avg_cost_year_chosen / 12, 32763, { abs: 1 }, 'A(12) value');
      assertClose(outputs.savings_year, outputs.avg_cost_year_chosen - outputs.avg_cost_year_opt, { rel: 1e-12 }, 'saving');
      assertClose(outputs.savings_year, 76595, { abs: 5 }, 'saving value');
      assertEqual(outputs.summary.startsWith('Clean every 6.1 months'), true, 'summary');
    },
  },
  {
    name: 'Fuel wasted at 12 months: 30 × 22 × 12 × (0 + 12/2)/100 = 475.2 t/yr and 1 479.8 t CO₂; at the optimum 240.2 t/yr',
    source: 'Average penalty over a cycle = p₀ + r T/2',
    run: () => {
      const { outputs } = calculate(CASE);
      assertClose(outputs.fuel_wasted_chosen_t_year, 475.2, { rel: 1e-9 }, 'fuel');
      assertClose(outputs.co2_wasted_chosen_t_year, 475.2 * 3.114, { rel: 1e-9 }, 'CO₂');
      assertClose(outputs.fuel_wasted_opt_t_year, (30 * 22 * 12 * (outputs.optimal_interval_months / 2)) / 100, { rel: 1e-9 }, 'at optimum');
    },
  },
  {
    name: 'Residual penalty shifts the cost but not the interval: p₀ 2 % leaves T* at 6.065 months and adds 2 × 4 349.3 × 12 = 104 383 per year, with a warning',
    source: 'A(T) = C/T + c₁ p₀ + c₁ r T/2 — the p₀ term is constant in T',
    run: () => {
      const base = calculate(CASE).outputs;
      const r = calculate({ ...CASE, initial_penalty_pct: 2 });
      assertClose(r.outputs.optimal_interval_months, base.optimal_interval_months, { rel: 1e-12 }, 'T* unchanged');
      assertClose(r.outputs.avg_cost_year_opt - base.avg_cost_year_opt, 2 * C1 * 12, { rel: 1e-9 }, 'shift');
      assertEqual(r.warnings.some((w) => w.includes('Residual penalty')), true, 'warning');
    },
  },
  {
    name: 'Edge cases: zero growth → no optimum, docking interval used and warned; slow growth 0.05 %/month → T* 27.1 months capped at a 24-month docking interval; zero fuel cost rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      const zero = calculate({ ...CASE, penalty_rate_pct_month: 0 });
      assertEqual(zero.outputs.optimal_interval_months, null, 'null');
      assertClose(zero.outputs.recommended_interval_months, 60, { rel: 1e-12 }, 'docking');
      assertEqual(zero.warnings.some((w) => w.includes('no optimum')), true, 'warning');
      const slow = calculate({ ...CASE, penalty_rate_pct_month: 0.05, docking_interval_months: 24 });
      assertClose(slow.outputs.optimal_interval_months, Math.sqrt((2 * C) / (C1 * 0.05)), { rel: 1e-12 }, 'T* slow');
      assertClose(slow.outputs.recommended_interval_months, 24, { rel: 1e-12 }, 'capped');
      assertEqual(slow.warnings.some((w) => w.includes('exceeds the docking interval')), true, 'cap warning');
      assertThrows(() => calculate({ ...CASE, fuel_price: 0, eua_price: 0 }), 'no cost', 'no cost');
      assertThrows(() => calculate({ ...CASE, fuel_t_per_day: 0 }), 'greater than zero', 'fuel');
    },
  },
];
