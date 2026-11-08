/**
 * solar-payback/tests.js — checks against the closed-form geometric series of the cash flows, limiting cases and
 * the definitions of NPV, IRR and LCOE (NREL TP-462-5173).
 * Run: node run-tests.js solar-payback
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '6 kW × 1 300 kWh/kW, half self-used at 0.25, half exported at 0.08: 7 800 kWh, 1 287 in year 1, simple payback 11.66 years',
    source: 'Hand calculation: S_1 = E_1 [s p_imp + (1 − s) p_exp]',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.first_kwh, 7800, { rel: 1e-12 }, 'kWh');
      assertClose(o.first_saving, 1287, { rel: 1e-12 }, 'saving');
      assertClose(o.simple_payback, 15000 / 1287, { rel: 1e-12 }, 'simple');
    },
  },
  {
    name: '3 % price rises and 0.5 % degradation: 25-year savings 1 287 × (g²⁵ − 1)/(g − 1) = 43 876 with g = 0.995 × 1.03; NPV at 4 % 11 088; payback 10.36 years',
    source: 'Closed-form geometric series of the yearly savings (Short, Packey and Holt, NREL TP-462-5173, present value of a geometric gradient)',
    run: () => {
      const o = calculate({}).outputs;
      const g = 0.995 * 1.03;
      assertClose(o.total_savings, 1287 * (g ** 25 - 1) / (g - 1), { rel: 1e-10 }, 'total');
      const q = g / 1.04;
      assertClose(o.npv, (1287 / 1.04) * (1 - q ** 25) / (1 - q) - 15000, { rel: 1e-10 }, 'NPV');
      const n = Math.log(1 + (15000 / 1287) * (g - 1)) / Math.log(g);
      assertClose(o.payback, n, { abs: 0.01 }, 'payback (within the linear step inside the year)');
      assertClose(o.lifetime_kwh, 7800 * (1 - 0.995 ** 25) / 0.005, { rel: 1e-10 }, 'lifetime kWh');
    },
  },
  {
    name: 'No price rise and no degradation: the payback equals the simple payback, NPV at 0 % equals the net gain, LCOE = cost / lifetime kWh',
    source: 'Limiting cases of the definitions',
    run: () => {
      const o = calculate({ escalation: 0, degradation: 0, discount_rate: 0 }).outputs;
      assertClose(o.payback, o.simple_payback, { rel: 1e-12 }, 'payback');
      assertClose(o.npv, o.net_gain, { rel: 1e-9 }, 'NPV = gain');
      assertClose(o.lcoe, 15000 / (7800 * 25), { rel: 1e-12 }, 'LCOE');
      assertClose(o.roi, (1287 * 25 - 15000) / 15000, { rel: 1e-12 }, 'ROI');
    },
  },
  {
    name: 'The IRR makes the NPV zero: at a discount rate equal to the IRR the NPV vanishes',
    source: 'Definition of the internal rate of return',
    run: () => {
      const r = calculate({}).outputs.irr;
      assertClose(r, 0.0938, { abs: 0.0001 }, 'IRR');
      assertClose(calculate({ discount_rate: r }).outputs.npv, 0, { abs: 1e-6 }, 'NPV at IRR');
    },
  },
  {
    name: 'A 30 % tax credit and a 1 000 grant on 15 000 leave 9 500; entered production of 7 800 kWh matches 6 kW × 1 300',
    source: 'Hand calculation: 15 000 × 0.7 − 1 000',
    run: () => {
      const o = calculate({ incentive_frac: 0.3, incentive_amount: 1000 }).outputs;
      assertClose(o.net_cost, 9500, { rel: 1e-12 }, 'net cost');
      assertClose(calculate({ production_mode: 'entered', annual_kwh: 7800 }).outputs.npv, calculate({}).outputs.npv, { rel: 1e-12 }, 'modes agree');
      assertEqual(calculate({}).outputs.table.rows.length, 25, 'table rows');
    },
  },
  {
    name: 'A system that never pays back gives no payback year and warns; incentives above the cost and a fractional period are rejected',
    source: 'Validation contract',
    run: () => {
      const r = calculate({ import_price: 0.02, export_price: 0.01 });
      assertEqual(r.outputs.payback, null, 'no payback');
      assertEqual(r.warnings.some((w) => w.includes('does not pay back')), true, 'warning');
      assertThrows(() => calculate({ incentive_amount: 20000 }), 'nothing to pay back');
      assertThrows(() => calculate({ years: 12.5 }), 'whole number');
    },
  },
];
