/**
 * esd-payback/calc.js — payback, NPV and IRR of an energy-saving device or retrofit: fuel and CO₂ saved per year,
 * fuel and ETS savings, simple and discounted payback, net present value, internal rate of return, benefit-cost
 * ratio and the levelized cost of the saved fuel.
 *
 * benefit_t = [S p (1+e)^(t−1) + S C_F e_EUA s] (1−δ)^(t−1) − M;  NPV = −I + Σ benefit_t/(1+i)^t
 * Schema units: currency, %, t/day, years.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';
import { CO2_FACTOR_T_PER_T, FUEL_OPTIONS } from '../shared/fuels.js';

export const schema = {
  id: 'esd-payback',
  name: 'Energy-saving device payback',
  category: 'maritime',
  summary: 'Payback, NPV, IRR and levelized cost of a fuel-saving retrofit from the saving, fuel and ETS prices, life and discount rate.',
  related: ['hull-cleaning-interval', 'eu-ets-fueleu', 'cii-rating', 'fuel-voyage-cost', 'optimal-speed-charter'],
  assumptions: [
    'The device saves a fixed percentage of the fuel consumption entered (main engine at sea, or total, as the user decides) for the sea days per year entered; the percentage may decline each year by the degradation entered (coating wear, fouling of the device); savings from an ESD measured in trials or by ISO 19030-type monitoring carry ±1–3 % absolute uncertainty, which usually dominates the result.',
    'Benefits are the fuel saved × fuel price (escalating at the rate entered) plus the CO₂ saved × allowance price × the share of emissions under the EU ETS (100 % for intra-EU voyages, 50 % for voyages to/from the EU, 0 outside), less the annual maintenance of the device; FuelEU penalties, CII rating value, charter-party premiums and residual value are not priced.',
    'The investment is the capex plus the off-hire days for installation × daily hire (opportunity cost), all at year 0; cash flows are annual at year end, discounted at the nominal rate entered with prices also nominal (use a real rate with zero escalation for a real analysis).',
    'Simple payback = investment / first-year net benefit; discounted payback interpolates the year in which the cumulative discounted benefit reaches the investment; IRR is the rate that zeroes the NPV (bisection between −90 % and 1 000 %, undefined if the cash flows never pay back); the levelized cost of saved fuel = (capital recovery factor × investment + maintenance) / fuel saved per year, to compare directly with the fuel price.',
    'One currency throughout; the allowance price must be entered in that currency.',
  ],
  notes: [
    'Verification 2026-10-31: the textbook annuity (300 000 invested, 100 000 net per year for 5 years at 10 %) gives NPV 79 079, IRR 19.86 %, payback 3.0 years and discounted payback 3.75 years, matching the standard tables; the capital recovery factor 0.26380 at 10 %/5 years matches the engineering-economics tables.',
    'Design decision: ETS savings are kept at a constant allowance price (no escalation input for EUAs) because the user can fold an expected price path into the price entered; fuel price escalation is separate because bunker prices and allowance prices move independently.',
  ],
  sources: [
    'D. G. Newnan, T. G. Eschenbach, J. P. Lavelle, Engineering Economic Analysis, 13th ed., Oxford University Press 2017 — NPV, IRR, payback, capital recovery factor',
    'IMO Resolution MEPC.364(79) — carbon factors C_F per fuel (shared/fuels.js); IMO MEPC.1/Circ.896 Guidance on treatment of innovative energy efficiency technologies',
    'Directive (EU) 2023/959 and Regulation (EU) 2023/957 — extension of the EU ETS to maritime transport (50 % of emissions on voyages to/from the EU, 100 % intra-EU; 40/70/100 % phase-in 2024–2026)',
    'ISO 19030-1:2016 — measurement of changes in hull and propeller performance (uncertainty of measured savings)',
  ],
  inputs: [
    { id: 'capex', label: 'Investment (device, installation, class)', group: 'money', unit: 'cur', default: 400000, min: 0, max: 1e9 },
    { id: 'install_offhire_days', label: 'Off-hire days for installation', group: 'dimensionless', unit: 'none', default: 3, min: 0, max: 120 },
    { id: 'hire_rate', label: 'Daily hire or opportunity cost', group: 'money', unit: 'cur', default: 20000, min: 0, max: 1e6 },
    { id: 'annual_maintenance', label: 'Annual maintenance of the device', group: 'money', unit: 'cur', default: 5000, min: 0, max: 1e7 },
    { id: 'saving_pct', label: 'Fuel saving', group: 'ratio', unit: 'pct', default: 5, min: 0, max: 60 },
    { id: 'fuel_t_per_day', label: 'Fuel consumption the saving applies to', group: 'mass', unit: 't', default: 30, min: 0.1, max: 400, help: 'tonnes per day at sea' },
    { id: 'sea_days_per_year', label: 'Days at sea per year', group: 'dimensionless', unit: 'none', default: 250, min: 1, max: 365 },
    { id: 'fuel_type', label: 'Fuel (CO₂ factor)', type: 'select', default: 'hfo', options: FUEL_OPTIONS },
    { id: 'fuel_price', label: 'Fuel price (year 1)', group: 'price_per_mass', unit: 'cur_t', default: 550, min: 0, max: 5000 },
    { id: 'eua_price', label: 'CO₂ allowance price (per t CO₂)', group: 'money', unit: 'cur', default: 70, min: 0, max: 1000 },
    { id: 'ets_share_pct', label: 'Share of emissions under the ETS', group: 'ratio', unit: 'pct', default: 50, min: 0, max: 100 },
    { id: 'project_life_years', label: 'Project life', group: 'dimensionless', unit: 'none', default: 10, min: 1, max: 30, integer: true },
    { id: 'discount_rate_pct', label: 'Discount rate', group: 'ratio', unit: 'pct', default: 8, min: 0, max: 50 },
    { id: 'fuel_escalation_pct', label: 'Fuel price escalation per year', group: 'ratio', unit: 'pct', default: 2, min: -20, max: 30 },
    { id: 'saving_degradation_pct', label: 'Decline of the saving per year (of the saving)', group: 'ratio', unit: 'pct', default: 0, min: 0, max: 50 },
  ],
  outputs: [
    { id: 'investment', label: 'Total investment (capex + installation off-hire)', group: 'money', unit: 'cur' },
    { id: 'fuel_saved_t_year', label: 'Fuel saved in year 1', group: 'mass', unit: 't' },
    { id: 'co2_saved_t_year', label: 'CO₂ saved in year 1', group: 'mass', unit: 't' },
    { id: 'fuel_saving_year1', label: 'Fuel cost saved in year 1', group: 'money', unit: 'cur' },
    { id: 'ets_saving_year1', label: 'ETS allowances saved in year 1', group: 'money', unit: 'cur' },
    { id: 'net_benefit_year1', label: 'Net benefit in year 1 (after maintenance)', group: 'money', unit: 'cur' },
    { id: 'simple_payback_years', label: 'Simple payback (years)', group: 'dimensionless', unit: 'none' },
    { id: 'discounted_payback_years', label: 'Discounted payback (years)', group: 'dimensionless', unit: 'none' },
    { id: 'npv', label: 'Net present value over the project life', group: 'money', unit: 'cur' },
    { id: 'irr_pct', label: 'Internal rate of return', group: 'ratio', unit: 'pct' },
    { id: 'benefit_cost_ratio', label: 'Benefit-cost ratio (PV of benefits / investment)', group: 'dimensionless', unit: 'none' },
    { id: 'pv_benefits', label: 'Present value of the net benefits', group: 'money', unit: 'cur' },
    { id: 'crf', label: 'Capital recovery factor i(1+i)ⁿ/((1+i)ⁿ − 1)', group: 'dimensionless', unit: 'none' },
    { id: 'levelized_cost_saved_fuel', label: 'Levelized cost of saved fuel (compare with the fuel price)', group: 'price_per_mass', unit: 'cur_t' },
    { id: 'verdict', label: 'Verdict', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      investment: '460 000',
      fuel_saved_t_year: '375',
      co2_saved_t_year: '1 168',
      fuel_saving_year1: '206 250',
      ets_saving_year1: '40 871',
      net_benefit_year1: '242 121',
      simple_payback_years: '1.9',
      discounted_payback_years: 'about 2.1',
      benefit_cost_ratio: '3.8',
      crf: '0.149',
      levelized_cost_saved_fuel: '196',
    },
  },
};

/** Net present value of cash flows [c0, c1, …] at rate r (fraction). */
export function npv(rate, cashFlows) {
  return cashFlows.reduce((sum, cf, t) => sum + cf / (1 + rate) ** t, 0);
}

/** Internal rate of return by bisection, or null when no sign change exists in [−0.9, 10]. */
export function irr(cashFlows) {
  let lo = -0.9;
  let hi = 10;
  let fLo = npv(lo, cashFlows);
  const fHi = npv(hi, cashFlows);
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo * fHi > 0) return null;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, cashFlows);
    if (Math.abs(fMid) < 1e-6 || hi - lo < 1e-12) return mid;
    if (fLo * fMid < 0) hi = mid;
    else { lo = mid; fLo = fMid; }
  }
  return (lo + hi) / 2;
}

/** Capital recovery factor. */
export function capitalRecoveryFactor(rate, years) {
  if (rate === 0) return 1 / years;
  return (rate * (1 + rate) ** years) / ((1 + rate) ** years - 1);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertNonNegative(i.capex, 'capex', 'Investment');
  assertNonNegative(i.install_offhire_days, 'install_offhire_days', 'Off-hire days');
  assertNonNegative(i.hire_rate, 'hire_rate', 'Hire rate');
  assertNonNegative(i.annual_maintenance, 'annual_maintenance', 'Maintenance');
  assertRange(i.saving_pct, 0, 100, 'saving_pct', 'Saving');
  assertPositive(i.fuel_t_per_day, 'fuel_t_per_day', 'Fuel consumption');
  assertRange(i.sea_days_per_year, 0, 366, 'sea_days_per_year', 'Sea days');
  assertOneOf(i.fuel_type, Object.keys(CO2_FACTOR_T_PER_T), 'fuel_type', 'Fuel type');
  assertNonNegative(i.fuel_price, 'fuel_price', 'Fuel price');
  assertNonNegative(i.eua_price, 'eua_price', 'Allowance price');
  assertRange(i.ets_share_pct, 0, 100, 'ets_share_pct', 'ETS share');
  assertInteger(i.project_life_years, 'project_life_years', 'Project life');
  assertRange(i.project_life_years, 1, 60, 'project_life_years', 'Project life');
  assertRange(i.discount_rate_pct, 0, 100, 'discount_rate_pct', 'Discount rate');
  assertRange(i.fuel_escalation_pct, -50, 100, 'fuel_escalation_pct', 'Escalation');
  assertRange(i.saving_degradation_pct, 0, 100, 'saving_degradation_pct', 'Degradation');

  const investment = i.capex + i.install_offhire_days * i.hire_rate;
  if (investment <= 0) throw new Error('The investment is zero: enter a capex or installation off-hire');
  const cf = CO2_FACTOR_T_PER_T[i.fuel_type];
  const fuelSaved = (i.saving_pct / 100) * i.fuel_t_per_day * i.sea_days_per_year;
  const co2Saved = fuelSaved * cf;
  const etsSaving = co2Saved * i.eua_price * (i.ets_share_pct / 100);
  const rate = i.discount_rate_pct / 100;
  const n = i.project_life_years;
  const flows = [-investment];
  for (let t = 1; t <= n; t += 1) {
    const degr = (1 - i.saving_degradation_pct / 100) ** (t - 1);
    const fuelSaving = fuelSaved * i.fuel_price * (1 + i.fuel_escalation_pct / 100) ** (t - 1);
    flows.push((fuelSaving + etsSaving) * degr - i.annual_maintenance);
  }
  const net1 = flows[1];
  const pvBenefits = npv(rate, [0, ...flows.slice(1)]);
  const value = pvBenefits - investment;
  const rateOfReturn = irr(flows);
  let discountedPayback = null;
  let cumulative = 0;
  for (let t = 1; t <= n; t += 1) {
    const pv = flows[t] / (1 + rate) ** t;
    if (cumulative + pv >= investment && pv > 0) { discountedPayback = t - 1 + (investment - cumulative) / pv; break; }
    cumulative += pv;
  }
  const crf = capitalRecoveryFactor(rate, n);
  const lcsf = fuelSaved > 0 ? (crf * investment + i.annual_maintenance) / fuelSaved : null;
  const simplePayback = net1 > 0 ? investment / net1 : null;

  const warnings = [];
  if (net1 <= 0) warnings.push('The first-year net benefit is not positive: the saving does not cover the maintenance — no payback.');
  if (simplePayback !== null && simplePayback > n) warnings.push('Simple payback exceeds the project life: the investment is not recovered.');
  if (value < 0) warnings.push('Negative NPV at the discount rate entered: the retrofit destroys value unless unpriced benefits (CII, charter premium) justify it.');
  if (i.saving_pct > 15) warnings.push('Savings above 15 % are rarely verified for a single device: check the claim against independent trials or monitoring.');
  warnings.push('The measured saving of an ESD carries ±1–3 % absolute uncertainty (ISO 19030): run the page at the low end of the claimed range too.');
  warnings.push('Not priced: FuelEU Maritime penalties or pooling value, CII rating consequences, residual value, financing costs and taxes.');

  return {
    outputs: {
      investment,
      fuel_saved_t_year: fuelSaved,
      co2_saved_t_year: co2Saved,
      fuel_saving_year1: fuelSaved * i.fuel_price,
      ets_saving_year1: etsSaving,
      net_benefit_year1: net1,
      simple_payback_years: simplePayback,
      discounted_payback_years: discountedPayback,
      npv: value,
      irr_pct: rateOfReturn === null ? null : rateOfReturn * 100,
      benefit_cost_ratio: pvBenefits / investment,
      pv_benefits: pvBenefits,
      crf,
      levelized_cost_saved_fuel: lcsf,
      verdict: value >= 0
        ? `Pays back in ${simplePayback === null ? '—' : simplePayback.toFixed(1)} years (discounted ${discountedPayback === null ? 'never' : discountedPayback.toFixed(1)}); NPV ${value.toFixed(0)}, IRR ${rateOfReturn === null ? '—' : (rateOfReturn * 100).toFixed(1)} %; each saved tonne costs ${lcsf === null ? '—' : lcsf.toFixed(0)} against a fuel price of ${i.fuel_price}.`
        : `Does not pay back at ${i.discount_rate_pct} %: NPV ${value.toFixed(0)}${rateOfReturn === null ? '' : `, IRR ${(rateOfReturn * 100).toFixed(1)} %`}; the saved fuel costs ${lcsf === null ? '—' : lcsf.toFixed(0)} per tonne against a price of ${i.fuel_price}.`,
    },
    warnings,
  };
}
