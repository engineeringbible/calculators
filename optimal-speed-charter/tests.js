/**
 * optimal-speed-charter/tests.js — checks against Ronen's closed forms and the properties of the optimum.
 * Run: node run-tests.js optimal-speed-charter
 */
import { calculate, minimize } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const TC = { mode: 'time_charter', distance_nmi: 5000, v_ref_kn: 14, fuel_ref_t_day: 35, exponent_n: 3, port_fuel_t_day: 3, fuel_price: 550, eua_price: 0, ets_share_pct: 50, co2_factor: 3.114, port_days: 4, hire_rate: 18000, v_min_kn: 8, v_max_kn: 16, operating_days_per_year: 350 };
const VC = { ...TC, mode: 'voyage_charter', freight_revenue: 1200000, opex_per_day: 7000, v_max_kn: 25 };

export const tests = [
  {
    name: 'Time charter (Ronen): v* = 14 × (18 000/(2 × 550 × 35))^(1/3) = 10.866 kn; the numeric minimiser agrees within 0.002 kn; cost per voyage at v* is below the cost at 14 kn',
    source: 'Ronen (1982) cost-minimising speed v* = v₀ [H/((n−1) p F₀)]^(1/n)',
    run: () => {
      const { outputs } = calculate(TC);
      const closed = 14 * (18000 / (2 * 550 * 35)) ** (1 / 3);
      assertClose(outputs.closed_form_speed_kn, closed, { rel: 1e-12 }, 'closed form');
      assertClose(closed, 10.866, { abs: 1e-3 }, 'value');
      assertClose(outputs.optimal_speed_kn, closed, { abs: 2e-3 }, 'numeric = closed');
      assertEqual(outputs.objective_optimum < outputs.objective_reference, true, 'cheaper than v₀');
      assertEqual(outputs.summary.startsWith('Sail at 10.87 kn'), true, 'summary');
    },
  },
  {
    name: 'Time-charter arithmetic at v*: sea days 5000/(24 × 10.866) = 19.18, fuel 35 × (10.866/14)³ = 16.36 t/day → 313.8 t + 12 t port, hire 18 000 × 23.18 = 417 200; cost per nmi = total/5 000',
    source: 'Voyage cost C(v) = H (D/24v + T_p) + p F₀ (v/v₀)ⁿ D/24v',
    run: () => {
      const { outputs } = calculate(TC);
      const v = outputs.optimal_speed_kn;
      const sea = 5000 / (24 * v);
      assertClose(outputs.sea_days, sea, { rel: 1e-12 }, 'sea days');
      assertClose(outputs.fuel_per_day_opt_t, 35 * (v / 14) ** 3, { rel: 1e-12 }, 'fuel/day');
      assertClose(outputs.fuel_per_voyage_t, 35 * (v / 14) ** 3 * sea + 12, { rel: 1e-12 }, 'fuel/voyage');
      assertClose(outputs.time_cost_voyage, 18000 * (sea + 4), { rel: 1e-12 }, 'hire');
      assertClose(outputs.objective_optimum, outputs.time_cost_voyage + outputs.fuel_cost_voyage, { rel: 1e-12 }, 'total');
      assertClose(outputs.cost_per_nmi, outputs.objective_optimum / 5000, { rel: 1e-12 }, 'per nmi');
      assertClose(outputs.co2_per_voyage_t, outputs.fuel_per_voyage_t * 3.114, { rel: 1e-12 }, 'CO₂');
      assertClose(outputs.annual_figure, outputs.objective_optimum * (350 / outputs.voyage_days), { rel: 1e-12 }, 'annual');
    },
  },
  {
    name: 'Voyage charter with zero port time and zero opex: numeric optimum equals the closed form √(8 R v₀³/(p F₀ D)) = 16.54 kn within 0.01 kn',
    source: 'Profit-per-day maximisation with T_p = 0 (Ronen 1982; Psaraftis & Kontovas 2013)',
    run: () => {
      const r = calculate({ ...VC, port_days: 0, opex_per_day: 0 });
      const closed = Math.sqrt((8 * 1200000 * 14 ** 3) / (550 * 35 * 5000));
      assertClose(r.outputs.closed_form_speed_kn, closed, { rel: 1e-12 }, 'closed form');
      assertClose(closed, 16.54, { abs: 0.01 }, 'value');
      assertClose(r.outputs.optimal_speed_kn, closed, { abs: 0.01 }, 'numeric');
    },
  },
  {
    name: 'Port time lowers the voyage-charter optimum (4 port days → 15.1 kn against 16.54 kn with none, first-order condition R = 3K/s² + 2K T_p/s³); a higher fuel price lowers it; the ETS adds 0.5 × 3.114 × 70 = 108.99 to the effective price',
    source: 'Profit-per-day model derivative; price sensitivity; ETS cost per tonne of fuel',
    run: () => {
      const none = calculate({ ...VC, port_days: 0 }).outputs.optimal_speed_kn;
      const four = calculate({ ...VC, port_days: 4 }).outputs.optimal_speed_kn;
      assertEqual(four < none, true, 'port time → slower');
      assertClose(four, 15.10, { abs: 0.02 }, '15.1 kn');
      assertClose(none, 16.54, { abs: 0.02 }, '16.5 kn');
      const dear = calculate({ ...VC, fuel_price: 900 }).outputs.optimal_speed_kn;
      assertEqual(dear < four, true, 'dearer fuel → slower');
      const ets = calculate({ ...TC, eua_price: 70 }).outputs;
      assertClose(ets.effective_fuel_price, 550 + 0.5 * 3.114 * 70, { rel: 1e-12 }, 'p_eff');
      assertEqual(ets.optimal_speed_kn < calculate(TC).outputs.optimal_speed_kn, true, 'ETS → slower');
    },
  },
  {
    name: 'Bounds: with v_max 16 kn and no port time the voyage-charter optimum (16.5 kn unconstrained) sits on the bound with a warning; the golden-section minimiser finds the minimum of (x − 3)² at 3 and respects the edges',
    source: 'Behaviour specification; golden-section search',
    run: () => {
      const r = calculate({ ...VC, port_days: 0, v_max_kn: 16 });
      assertClose(r.outputs.optimal_speed_kn, 16, { abs: 1e-5 }, 'at bound');
      assertEqual(r.warnings.some((w) => w.includes('speed bound')), true, 'warning');
      assertClose(minimize((x) => (x - 3) ** 2, 0, 10), 3, { abs: 1e-5 }, 'minimize');
      assertClose(minimize((x) => x, 2, 10), 2, { abs: 1e-9 }, 'edge');
    },
  },
  {
    name: 'Validation: minimum speed at or above the maximum, zero distance and an unknown mode are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ ...TC, v_min_kn: 16, v_max_kn: 16 }), 'below the maximum', 'bounds');
      assertThrows(() => calculate({ ...TC, distance_nmi: 0 }), 'greater than zero', 'distance');
      assertThrows(() => calculate({ ...TC, mode: 'bareboat' }), 'must be one of', 'mode');
    },
  },
];
