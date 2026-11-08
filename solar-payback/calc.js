/**
 * solar-payback/calc.js — payback and return of a solar PV system: net cost after incentives, yearly production
 * (entered, or size × specific yield) with panel degradation, the value of self-consumed and exported energy with
 * price escalation, the payback year, savings over the life, NPV at a discount rate, IRR and the levelised cost.
 *
 * E_n = E_1 (1 − d)^(n−1);  S_n = E_n [s p_imp + (1 − s) p_exp] (1 + e)^(n−1) − O&M;
 * payback: Σ S_n = C_net;  NPV = −C_net + Σ S_n / (1 + r)^n;  LCOE = (C_net + Σ O&M/(1+r)^n) / Σ E_n/(1+r)^n.
 * Schema units: currency, kWh, W (display kW), fractions, years.
 */
import { withDefaults, assertRange, assertOneOf, assertInteger, assertNonNegative } from '../shared/validate.js';

/** Year-by-year cash flows. */
export function cashFlows({ e1, degradation, selfShare, importPrice, exportPrice, escalation, om, years }) {
  const rows = [];
  for (let n = 1; n <= years; n += 1) {
    const kwh = e1 * (1 - degradation) ** (n - 1);
    const value = kwh * (selfShare * importPrice + (1 - selfShare) * exportPrice) * (1 + escalation) ** (n - 1);
    rows.push({ n, kwh, saving: value - om });
  }
  return rows;
}

/** Fractional year at which the cumulative (optionally discounted) saving reaches the cost; null if never. */
export function paybackYear(rows, cost, rate = null) {
  let cum = 0;
  for (const r of rows) {
    const s = rate === null ? r.saving : r.saving / (1 + rate) ** r.n;
    if (s > 0 && cum + s >= cost) return r.n - 1 + (cost - cum) / s;
    cum += s;
  }
  return null;
}

const npvAt = (rows, cost, rate) => rows.reduce((a, r) => a + r.saving / (1 + rate) ** r.n, -cost);

/** Internal rate of return by bisection between −99 % and 100 %; null if there is no sign change. */
export function irr(rows, cost) {
  let lo = -0.99;
  let hi = 1;
  let flo = npvAt(rows, cost, lo);
  if (flo * npvAt(rows, cost, hi) > 0) return null;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    const fm = npvAt(rows, cost, mid);
    if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

export const schema = {
  id: 'solar-payback',
  name: 'Solar panel payback calculator',
  category: 'electrical',
  summary: 'Payback year, 25-year savings, ROI, NPV and IRR of a solar PV system from cost, incentives, production, self-consumption, tariffs, price rises and degradation.',
  related: ['solar-panel', 'solar-battery-bank', 'electricity-cost', 'heat-pump-cost'],
  assumptions: [
    'The saving in each year is the energy you use yourself valued at the import price plus the energy you export valued at the export price, less any yearly running cost; both prices rise by the escalation rate each year and the running cost stays flat.',
    'Production falls by the degradation rate each year; 0.5 % a year is the median rate Jordan and Kurtz found in their review of about 2 000 field measurements (NREL, 2013).',
    'The self-consumption share is the part of the production used on site at the moment it is produced; it depends on when the home uses electricity, and a battery, an EV or a heat pump raises it.',
    'Simple payback is the net cost divided by the first-year saving; the payback year adds price escalation and degradation; the discounted figures and the NPV use the discount rate, following the NREL manual of Short, Packey and Holt (1995).',
    'Inverter replacement (often once in 25 years), insurance, financing costs and taxes on the saving are not included unless entered as the yearly running cost.',
  ],
  notes: [
    'Verification 2026-11-08: a 15 000 system of 6 kW at 1 300 kWh/kW makes 7 800 kWh in year 1; half used at 0.25 and half exported at 0.08 saves 1 287, simple payback 11.66 years; with 3 % price rises and 0.5 % degradation it pays back after 10.4 years and saves 43 876 over 25 years; NPV at 4 % 11 088, IRR 9.4 %. Checked by hand with the geometric series of the cash flows.',
  ],
  sources: [
    'Short, W., Packey, D. J. and Holt, T., A Manual for the Economic Evaluation of Energy Efficiency and Renewable Energy Technologies, NREL/TP-462-5173, 1995 (payback, NPV, IRR, levelised cost of energy)',
    'Jordan, D. C. and Kurtz, S. R., Photovoltaic Degradation Rates — An Analytical Review, Progress in Photovoltaics 21 (2013) 12–29 (median degradation 0.5 % per year)',
    'NREL PVWatts Calculator technical manual (specific yield, kWh per kW per year, for a site)',
  ],
  inputs: [
    { id: 'cost', label: 'Installed cost of the system', group: 'money', unit: 'cur', default: 15000, min: 1, max: 1e9 },
    { id: 'incentive_frac', label: 'Tax credit or rebate as a share of the cost', group: 'ratio', unit: 'frac', display: 'pct', default: 0, min: 0, max: 0.9 },
    { id: 'incentive_amount', label: 'Grant or rebate as a fixed amount', group: 'money', unit: 'cur', default: 0, min: 0, max: 1e9 },
    { id: 'production_mode', label: 'Yearly production', type: 'select', default: 'yield', options: [{ value: 'yield', label: 'System size × specific yield' }, { value: 'entered', label: 'Enter the first-year production' }] },
    { id: 'size_w', label: 'System size (DC, at STC)', group: 'power', unit: 'W', display: 'kW', default: 6000, min: 100, max: 1e8, visibleWhen: { production_mode: 'yield' } },
    { id: 'specific_yield', label: 'Specific yield, kWh per kW per year', group: 'dimensionless', unit: 'none', default: 1300, min: 300, max: 2500, visibleWhen: { production_mode: 'yield' } },
    { id: 'annual_kwh', label: 'Production in the first year', group: 'energy', unit: 'kWh', default: 7800, min: 10, max: 1e9, visibleWhen: { production_mode: 'entered' } },
    { id: 'self_share', label: 'Share of the production used on site', group: 'ratio', unit: 'frac', display: 'pct', default: 0.5, min: 0, max: 1 },
    { id: 'import_price', label: 'Price of electricity bought, per kWh', group: 'dimensionless', unit: 'none', default: 0.25, min: 0, max: 5 },
    { id: 'export_price', label: 'Price paid for electricity exported, per kWh', group: 'dimensionless', unit: 'none', default: 0.08, min: 0, max: 5 },
    { id: 'escalation', label: 'Electricity price rise per year', group: 'ratio', unit: 'frac', display: 'pct', default: 0.03, min: -0.1, max: 0.2 },
    { id: 'degradation', label: 'Panel degradation per year', group: 'ratio', unit: 'frac', display: 'pct', default: 0.005, min: 0, max: 0.05 },
    { id: 'om_cost', label: 'Running cost per year (maintenance, insurance)', group: 'money', unit: 'cur', default: 0, min: 0, max: 1e8 },
    { id: 'discount_rate', label: 'Discount rate for the NPV', group: 'ratio', unit: 'frac', display: 'pct', default: 0.04, min: 0, max: 0.3 },
    { id: 'years', label: 'Period of the analysis, years', group: 'dimensionless', unit: 'none', default: 25, min: 1, max: 40, integer: true },
  ],
  outputs: [
    { id: 'net_cost', label: 'Net cost after incentives', group: 'money', unit: 'cur', decimals: 0 },
    { id: 'first_kwh', label: 'Production in the first year', group: 'energy', unit: 'kWh' },
    { id: 'first_saving', label: 'Saving in the first year', group: 'money', unit: 'cur', decimals: 0 },
    { id: 'simple_payback', label: 'Simple payback, years (net cost / first-year saving)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'payback', label: 'Payback with price rises and degradation, years', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'discounted_payback', label: 'Discounted payback, years', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'total_savings', label: 'Total savings over the period', group: 'money', unit: 'cur', decimals: 0 },
    { id: 'net_gain', label: 'Net gain over the period (savings − net cost)', group: 'money', unit: 'cur', decimals: 0 },
    { id: 'roi', label: 'Return on investment over the period', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'npv', label: 'Net present value at the discount rate', group: 'money', unit: 'cur', decimals: 0 },
    { id: 'irr', label: 'Internal rate of return', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'lcoe', label: 'Levelised cost of the energy produced, per kWh', group: 'money', unit: 'cur', decimals: 3 },
    { id: 'lifetime_kwh', label: 'Energy produced over the period', group: 'energy', unit: 'kWh' },
    { id: 'table', label: 'Year by year', type: 'table' },
  ],
  example: {
    inputs: { cost: 15000, incentive_frac: [0, 'pct'], incentive_amount: 0, production_mode: 'yield', size_w: [6, 'kW'], specific_yield: 1300, self_share: [50, 'pct'], import_price: 0.25, export_price: 0.08, escalation: [3, 'pct'], degradation: [0.5, 'pct'], om_cost: 0, discount_rate: [4, 'pct'], years: 25 },
    results: { first_kwh: '7 800 kWh', first_saving: '1 287', simple_payback: '11.66', payback: '10.4', total_savings: '43 876', npv: '11 088' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.production_mode, ['yield', 'entered'], 'production_mode', 'Yearly production');
  const cost = assertRange(x.cost, 1, 1e9, 'cost', 'Installed cost');
  const frac = assertRange(x.incentive_frac, 0, 0.9, 'incentive_frac', 'Tax credit or rebate share');
  const amount = assertRange(x.incentive_amount, 0, 1e9, 'incentive_amount', 'Grant or rebate amount');
  const netCost = cost * (1 - frac) - amount;
  if (netCost <= 0) throw new Error('Grant or rebate amount: the incentives cover the whole cost, so there is nothing to pay back.');
  const e1 = x.production_mode === 'yield'
    ? (assertRange(x.size_w, 100, 1e8, 'size_w', 'System size') / 1000) * assertRange(x.specific_yield, 300, 2500, 'specific_yield', 'Specific yield')
    : assertRange(x.annual_kwh, 10, 1e9, 'annual_kwh', 'Production in the first year');
  const selfShare = assertRange(x.self_share, 0, 1, 'self_share', 'Share used on site');
  const importPrice = assertRange(x.import_price, 0, 5, 'import_price', 'Price of electricity bought');
  const exportPrice = assertRange(x.export_price, 0, 5, 'export_price', 'Price paid for exports');
  const escalation = assertRange(x.escalation, -0.1, 0.2, 'escalation', 'Electricity price rise');
  const degradation = assertRange(x.degradation, 0, 0.05, 'degradation', 'Panel degradation');
  const om = assertNonNegative(x.om_cost, 'om_cost', 'Running cost per year');
  const rate = assertRange(x.discount_rate, 0, 0.3, 'discount_rate', 'Discount rate');
  const years = assertRange(assertInteger(x.years, 'years', 'Period of the analysis'), 1, 40, 'years', 'Period of the analysis');

  const rows = cashFlows({ e1, degradation, selfShare, importPrice, exportPrice, escalation, om, years });
  const first = rows[0].saving;
  const total = rows.reduce((a, r) => a + r.saving, 0);
  const pvEnergy = rows.reduce((a, r) => a + r.kwh / (1 + rate) ** r.n, 0);
  const pvOm = rows.reduce((a, r) => a + om / (1 + rate) ** r.n, 0);
  let cum = 0;
  let cumPv = 0;
  const table = {
    columns: ['Year', 'Production (kWh)', 'Saving', 'Cumulative saving', 'Cumulative discounted'],
    rows: rows.map((r) => {
      cum += r.saving;
      cumPv += r.saving / (1 + rate) ** r.n;
      return [r.n, Math.round(r.kwh), Math.round(r.saving), Math.round(cum), Math.round(cumPv)];
    }),
  };
  const payback = paybackYear(rows, netCost);
  const warnings = [];
  if (first <= 0) warnings.push('The first-year saving is zero or negative: the running cost is larger than the value of the energy.');
  if (payback === null) warnings.push('The system does not pay back within the period of the analysis.');
  if (x.production_mode === 'yield' && x.specific_yield > 2000) warnings.push('A specific yield above 2 000 kWh per kW is found only in the sunniest deserts or with trackers; check the site with PVWatts or PVGIS.');
  return {
    outputs: {
      net_cost: netCost,
      first_kwh: e1,
      first_saving: first,
      simple_payback: first > 0 ? netCost / first : null,
      payback,
      discounted_payback: paybackYear(rows, netCost, rate),
      total_savings: total,
      net_gain: total - netCost,
      roi: (total - netCost) / netCost,
      npv: npvAt(rows, netCost, rate),
      irr: irr(rows, netCost),
      lcoe: (netCost + pvOm) / pvEnergy,
      lifetime_kwh: rows.reduce((a, r) => a + r.kwh, 0),
      table,
    },
    warnings,
  };
}
