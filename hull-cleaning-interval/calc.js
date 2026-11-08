/**
 * hull-cleaning-interval/calc.js — the hull cleaning (or propeller polishing) interval that minimises the average cost
 * of fuel penalty plus cleaning: a fouling penalty growing linearly with time since the last cleaning, a fuel and
 * ETS cost per percentage point, and a fixed cost per cleaning including off-hire.
 *
 * c₁ = F d (p + s C_F e)/100  cost per month of a 1 % penalty;  C = cleaning + off-hire × hire
 * A(T) = C/T + c₁ p₀ + c₁ r T/2  average monthly cost;  T* = √(2C/(c₁ r));  A(T*) = c₁ p₀ + √(2 C c₁ r)
 * Schema units: t/day, currency, %, months.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange } from '../shared/validate.js';

export const schema = {
  id: 'hull-cleaning-interval',
  name: 'Optimal hull cleaning interval',
  category: 'maritime',
  summary: 'Cleaning interval that minimises fuel penalty plus cleaning cost, from the fouling growth rate, fuel and ETS prices and the cost per cleaning.',
  related: ['hull-roughness-penalty', 'esd-payback', 'eu-ets-fueleu', 'cii-rating', 'fuel-voyage-cost'],
  assumptions: [
    'The fouling fuel penalty grows linearly with time since cleaning, p(t) = p₀ + r t in per cent of the clean-hull consumption at sea, with a residual p₀ right after cleaning (0 for a full clean, 1–3 % when cleaning does not restore the coating) and a rate r in % per month; real growth is seasonal and stepwise (slime in weeks, calcareous fouling after idle periods), so r is the average over the cycle and the result is a planning interval, not a forecast.',
    'Each percentage point of penalty costs c₁ = F × d × (p + s C_F e)/100 per month, where F is the clean consumption at sea (t/day), d the sea days per month, p the fuel price, e the CO₂ allowance price, C_F the carbon factor and s the share of emissions under the ETS; the CII and FuelEU consequences are not priced.',
    'A cleaning costs C = diver/ROV cost + off-hire days × daily hire (or opportunity cost); the cleaning is assumed to take the hull back to the residual p₀ instantly and to be feasible anywhere (port-state and coating-manufacturer restrictions, capture requirements and the IMO 2023 Biofouling Guidelines are outside the model).',
    'Minimising the average monthly cost A(T) = C/T + c₁ p₀ + c₁ r T/2 gives the age-replacement optimum T* = √(2C/(c₁ r)) (Jardine & Tsang); A(T*) = c₁ p₀ + √(2 C c₁ r). The interval cannot exceed the docking interval entered, where a full recoating resets the cycle anyway.',
    'Cost to the owner/operator only, in one currency; discounting is ignored over the cycle (months), and the fuel penalty is charged whether the ship is on time charter or spot (whoever pays the fuel bears it).',
  ],
  notes: [
    'Verification 2026-10-31: default case (30 t/day, 22 sea days/month, 550 per t fuel, 70 per t CO₂ at 50 % ETS, 1 %/month, cleaning 60 000 + 1 day off-hire at 20 000) gives c₁ 4 349 per % per month, T* 6.07 months and 26 380 per month; a 12-month interval costs 32 763 per month, so cleaning twice as often saves about 76 600 per year — the same order as the Schultz et al. (2011) frigate study (slime-level fouling dominating the cost).',
    'Design decision: a single linear growth rate because the published data do not support a more detailed universal curve; the chosen-interval outputs let the user compare any policy against the optimum.',
  ],
  sources: [
    'M. P. Schultz, J. A. Bendick, E. R. Holm, W. M. Hertel, "Economic impact of biofouling on a naval surface ship", Biofouling 27(1), 2011, 87–98',
    'M. P. Schultz, "Effects of coating roughness and biofouling on ship resistance and powering", Biofouling 23(5), 2007 (penalty magnitudes per condition)',
    'A. K. S. Jardine, A. H. C. Tsang, Maintenance, Replacement, and Reliability: Theory and Applications, 2nd ed., CRC Press 2013 — replacement interval with linearly increasing operating cost, T* = √(2C/a)',
    'IMO Resolution MEPC.378(80), 2023 Guidelines for the control and management of ships\' biofouling (inspection and cleaning practice)',
  ],
  inputs: [
    { id: 'fuel_t_per_day', label: 'Fuel consumption at sea with a clean hull', group: 'mass', unit: 't', default: 30, min: 0.1, max: 400, help: 'tonnes per day' },
    { id: 'sea_days_per_month', label: 'Sea days per month', group: 'dimensionless', unit: 'none', default: 22, min: 0, max: 31 },
    { id: 'fuel_price', label: 'Fuel price', group: 'price_per_mass', unit: 'cur_t', default: 550, min: 0, max: 5000 },
    { id: 'eua_price', label: 'CO₂ allowance price (per t CO₂)', group: 'money', unit: 'cur', default: 70, min: 0, max: 1000 },
    { id: 'ets_share_pct', label: 'Share of emissions under the ETS', group: 'ratio', unit: 'pct', default: 50, min: 0, max: 100 },
    { id: 'co2_factor', label: 'CO₂ factor (t CO₂ per t fuel)', group: 'dimensionless', unit: 'none', default: 3.114, min: 0, max: 4 },
    { id: 'initial_penalty_pct', label: 'Residual penalty right after cleaning p₀', group: 'ratio', unit: 'pct', default: 0, min: 0, max: 20 },
    { id: 'penalty_rate_pct_month', label: 'Penalty growth rate r (% of consumption per month)', group: 'dimensionless', unit: 'none', default: 1.0, min: 0, max: 20, help: 'Slime-prone trades 1–2 %/month; good coating, active trading 0.3–0.7.' },
    { id: 'cleaning_cost', label: 'Cost per cleaning (divers / ROV, capture, port)', group: 'money', unit: 'cur', default: 60000, min: 0, max: 5e6 },
    { id: 'offhire_days', label: 'Off-hire or waiting days per cleaning', group: 'dimensionless', unit: 'none', default: 1, min: 0, max: 30 },
    { id: 'hire_rate', label: 'Daily hire or opportunity cost', group: 'money', unit: 'cur', default: 20000, min: 0, max: 1e6 },
    { id: 'chosen_interval_months', label: 'Interval to compare (current policy)', group: 'dimensionless', unit: 'none', default: 12, min: 0.5, max: 120 },
    { id: 'docking_interval_months', label: 'Docking interval (upper bound)', group: 'dimensionless', unit: 'none', default: 60, min: 1, max: 120 },
  ],
  outputs: [
    { id: 'cost_per_pct_month', label: 'Cost of a 1 % penalty per month c₁ (fuel + ETS)', group: 'money', unit: 'cur' },
    { id: 'cycle_cost', label: 'Cost per cleaning incl. off-hire C', group: 'money', unit: 'cur' },
    { id: 'optimal_interval_months', label: 'Optimal interval T* = √(2C/(c₁ r)) (months)', group: 'dimensionless', unit: 'none' },
    { id: 'recommended_interval_months', label: 'Recommended interval (T* capped at the docking interval)', group: 'dimensionless', unit: 'none' },
    { id: 'cleanings_per_year', label: 'Cleanings per year at the recommended interval', group: 'dimensionless', unit: 'none' },
    { id: 'penalty_end_opt_pct', label: 'Penalty just before cleaning at the recommended interval', group: 'ratio', unit: 'pct' },
    { id: 'avg_cost_year_opt', label: 'Average annual cost (penalty + cleaning) at the recommended interval', group: 'money', unit: 'cur' },
    { id: 'fuel_wasted_opt_t_year', label: 'Fuel wasted per year at the recommended interval', group: 'mass', unit: 't' },
    { id: 'penalty_end_chosen_pct', label: 'Penalty just before cleaning at the compared interval', group: 'ratio', unit: 'pct' },
    { id: 'avg_cost_year_chosen', label: 'Average annual cost at the compared interval', group: 'money', unit: 'cur' },
    { id: 'fuel_wasted_chosen_t_year', label: 'Fuel wasted per year at the compared interval', group: 'mass', unit: 't' },
    { id: 'co2_wasted_chosen_t_year', label: 'CO₂ wasted per year at the compared interval', group: 'mass', unit: 't' },
    { id: 'savings_year', label: 'Saving per year by moving to the recommended interval', group: 'money', unit: 'cur' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      penalty_end_opt_pct: '6.1 %',
      fuel_wasted_chosen_t_year: '475 t',
      co2_wasted_chosen_t_year: '1 480 t',
    },
  },
};

/** Average monthly cost of a cleaning cycle of T months. */
export function averageMonthlyCost(T, cycleCost, costPerPct, p0, rate) {
  return cycleCost / T + costPerPct * p0 + (costPerPct * rate * T) / 2;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.fuel_t_per_day, 'fuel_t_per_day', 'Fuel consumption');
  assertRange(i.sea_days_per_month, 0, 31, 'sea_days_per_month', 'Sea days per month');
  assertNonNegative(i.fuel_price, 'fuel_price', 'Fuel price');
  assertNonNegative(i.eua_price, 'eua_price', 'Allowance price');
  assertRange(i.ets_share_pct, 0, 100, 'ets_share_pct', 'ETS share');
  assertNonNegative(i.co2_factor, 'co2_factor', 'CO₂ factor');
  assertNonNegative(i.initial_penalty_pct, 'initial_penalty_pct', 'Residual penalty');
  assertNonNegative(i.penalty_rate_pct_month, 'penalty_rate_pct_month', 'Penalty rate');
  assertNonNegative(i.cleaning_cost, 'cleaning_cost', 'Cleaning cost');
  assertNonNegative(i.offhire_days, 'offhire_days', 'Off-hire days');
  assertNonNegative(i.hire_rate, 'hire_rate', 'Hire rate');
  assertPositive(i.chosen_interval_months, 'chosen_interval_months', 'Compared interval');
  assertPositive(i.docking_interval_months, 'docking_interval_months', 'Docking interval');

  const effectivePrice = i.fuel_price + (i.ets_share_pct / 100) * i.co2_factor * i.eua_price;
  const c1 = (i.fuel_t_per_day * i.sea_days_per_month * effectivePrice) / 100;
  const C = i.cleaning_cost + i.offhire_days * i.hire_rate;
  if (c1 <= 0) throw new Error('The fuel penalty has no cost: enter sea days and a fuel or allowance price');
  const r = i.penalty_rate_pct_month;
  const p0 = i.initial_penalty_pct;
  const tStar = r > 0 && C > 0 ? Math.sqrt((2 * C) / (c1 * r)) : null;
  const tRec = tStar === null ? i.docking_interval_months : Math.min(tStar, i.docking_interval_months);
  const monthly = (T) => averageMonthlyCost(T, C, c1, p0, r);
  const wastedT = (T) => (i.fuel_t_per_day * i.sea_days_per_month * 12 * (p0 + (r * T) / 2)) / 100;
  const chosen = i.chosen_interval_months;
  const savings = 12 * (monthly(chosen) - monthly(tRec));

  const warnings = [];
  if (tStar === null && r === 0) warnings.push('Zero penalty growth: there is no optimum — clean only at docking (interval set to the docking interval).');
  if (tStar === null && C === 0) warnings.push('Zero cleaning cost: the optimum is to clean continuously; the docking interval is shown instead.');
  if (tStar !== null && tStar > i.docking_interval_months) warnings.push(`The economic optimum ${tStar.toFixed(1)} months exceeds the docking interval: clean only at docking (penalty too slow or cleaning too expensive to pay off).`);
  if (tStar !== null && tStar < 2) warnings.push('Optimum below two months: the linear-growth model and the instant-cleaning assumption are stretched; check the growth rate and consider a better coating.');
  if (p0 > 0) warnings.push(`Residual penalty ${p0} % after cleaning adds a fixed ${(c1 * p0 * 12).toFixed(0)} per year that no interval removes — only recoating does.`);
  warnings.push('Average linear fouling growth over the cycle: idle periods in warm water accelerate calcareous fouling far beyond the average rate.');
  warnings.push('Cleaning feasibility (port rules, capture systems, coating damage from aggressive brushes) and the CII/FuelEU value of the saved fuel are outside the model.');

  return {
    outputs: {
      cost_per_pct_month: c1,
      cycle_cost: C,
      optimal_interval_months: tStar,
      recommended_interval_months: tRec,
      cleanings_per_year: 12 / tRec,
      penalty_end_opt_pct: p0 + r * tRec,
      avg_cost_year_opt: 12 * monthly(tRec),
      fuel_wasted_opt_t_year: wastedT(tRec),
      penalty_end_chosen_pct: p0 + r * chosen,
      avg_cost_year_chosen: 12 * monthly(chosen),
      fuel_wasted_chosen_t_year: wastedT(chosen),
      co2_wasted_chosen_t_year: wastedT(chosen) * i.co2_factor,
      savings_year: savings,
      summary: tStar === null
        ? `No economic optimum (${r === 0 ? 'no penalty growth' : 'no cleaning cost'}); compared interval ${chosen} months costs ${(12 * monthly(chosen)).toFixed(0)} per year.`
        : `Clean every ${tRec.toFixed(1)} months (${(12 / tRec).toFixed(1)} per year): ${(12 * monthly(tRec)).toFixed(0)} per year against ${(12 * monthly(chosen)).toFixed(0)} at ${chosen} months — ${savings >= 0 ? 'saving' : 'costing'} ${Math.abs(savings).toFixed(0)} per year.`,
    },
    warnings,
  };
}
