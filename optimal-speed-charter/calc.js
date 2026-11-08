/**
 * optimal-speed-charter/calc.js — the economic speed of a ship: cost-minimising speed under time charter (hire versus
 * fuel, Ronen 1982) and profit-per-day-maximising speed on a voyage charter (freight, fuel, port time, operating cost),
 * with the fuel-speed power law, ETS cost in the effective fuel price and speed bounds.
 *
 * F(v) = F₀ (v/v₀)ⁿ;  TC: C(v) = H (D/24v + T_p) + p F(v) D/24v → v* = v₀ [H/((n−1) p F₀)]^(1/n)
 * Voyage: Π(v) = [R − p F(v) D/24v − c_op (D/24v + T_p)] / (D/24v + T_p) → numeric; T_p = 0: v* = [24 R v₀ⁿ/(n p F₀ D)]^(1/(n−1))
 * Schema units: nmi, kn, t/day, currency.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

export const schema = {
  id: 'optimal-speed-charter',
  name: 'Optimal speed under charter',
  category: 'maritime',
  summary: 'Cost-minimising speed on time charter and profit-maximising speed on a voyage charter from the fuel-speed law, prices, hire or freight and port time.',
  related: ['fuel-voyage-cost', 'admiralty-coefficient', 'esd-payback', 'eu-ets-fueleu', 'great-circle-distance'],
  sendTo: [
    {
      target: 'fuel-voyage-cost',
      label: 'Voyage fuel and cost at the optimal speed',
      note: 'Daily fuel at the optimum from the power law; auxiliary fuel is set to zero because the speed optimiser does not model it.',
      links: [
        { to: 'distance_nmi', from: 'input:distance_nmi' },
        { to: 'speed_kn', from: 'optimal_speed_kn' },
        { to: 'basis', value: 'daily' },
        { to: 'me_daily_t', from: 'fuel_per_day_opt_t', raw: true },
        { to: 'aux_daily_t', value: 0 },
        { to: 'port_days', from: 'input:port_days', raw: true },
        { to: 'port_daily_t', from: 'input:port_fuel_t_day', raw: true },
        { to: 'bunker_price', from: 'input:fuel_price' },
      ],
    },
  ],
  assumptions: [
    'Daily fuel consumption at sea follows a power law of speed, F(v) = F₀ (v/v₀)ⁿ with n ≈ 3 (the cubic law) for displacement ships near their design speed; the exponent drifts above 3 at high speed and below 3 at very low speed (hotel and auxiliary loads make the fuel per mile rise again), so the result is valid within the speed range the law was fitted to, which the speed bounds should reflect.',
    'Time charter: the charterer pays hire and fuel, so the voyage cost C(v) = H (D/24v + T_p) + p_eff F(v) D/24v is minimised; the closed-form optimum is Ronen\'s v* = v₀ [H/((n−1) p_eff F₀)]^(1/n), independent of distance and port time.',
    'Voyage charter: the owner earns a fixed freight R per voyage and pays fuel and daily operating costs, so the profit per day over the whole cycle (sea + port days) is maximised; port time LOWERS the optimal speed in this model — the fixed freight is spread over more days, so each sea day saved is worth less (the opposite holds when more voyages per year bring more freight at a rate per day, which is the time-charter case); the closed form for zero port time and zero operating cost, v* = [24 R v₀ⁿ/(n p_eff F₀ D)]^(1/(n−1)), is reported for reference and the numeric optimum (golden-section search within the bounds) is the answer.',
    'The effective fuel price p_eff = fuel price + ETS share × C_F × allowance price prices the CO₂ of the fuel; FuelEU intensity penalties, CII rating effects, canal dues, cargo inventory cost, laycan constraints and weather are outside the model (the latter two usually dominate real voyage planning).',
    'Port fuel (auxiliary engines and boilers) is a constant per port day added to the voyage fuel; it does not affect the optimum.',
  ],
  notes: [
    'Verification 2026-10-31: time charter 18 000/day, 14 kn with 35 t/day, fuel 550 → v* = 14 × (18 000/(2 × 550 × 35))^(1/3) = 10.87 kn (Ronen formula) and the numeric minimiser agrees to 0.001 kn; a voyage charter of 1.2 million over 5 000 nmi with no port time gives v* = √(8 R v₀³/(p F₀ D)) = 16.5 kn, and adding 4 port days lowers the optimum to 15.1 kn (first-order condition R = 3K/s² + 2K T_p/s³ in sea days s, solved for larger s).',
    'Design decision: a numeric optimiser is used for the voyage case so that port time and operating cost are included exactly; the closed forms are shown so the user can see the textbook result.',
    'Article check 2026-10-31 (schema.example): the worked example printed the voyage cost at 14 kn as 632 000 (it is 632 915) and the saving as 5.7 % (5.79 %); corrected to 633 000 and 5.8 % in content.md.',
  ],
  sources: [
    'D. Ronen, "The effect of oil price on the optimal speed of ships", Journal of the Operational Research Society 33, 1982, 1035–1040',
    'H. N. Psaraftis, C. A. Kontovas, "Speed models for energy-efficient maritime transportation: A taxonomy and survey", Transportation Research Part C 26, 2013, 331–351',
    'M. Stopford, Maritime Economics, 3rd ed., Routledge 2009 — speed, fuel consumption and the cubic law (ch. 6)',
    'IMO MEPC.364(79) carbon factors; Directive (EU) 2023/959 (ETS share of maritime emissions)',
  ],
  inputs: [
    { id: 'mode', label: 'Commercial setting', type: 'select', default: 'voyage_charter', options: [{ value: 'time_charter', label: 'Time charter — minimise voyage cost (hire + fuel)' }, { value: 'voyage_charter', label: 'Voyage charter / own cargo — maximise profit per day' }] },
    { id: 'distance_nmi', label: 'Voyage distance', group: 'length', unit: 'nmi', default: 5000, min: 10, max: 30000 },
    { id: 'v_ref_kn', label: 'Reference speed v₀', group: 'speed', unit: 'kn', default: 14, min: 3, max: 35 },
    { id: 'fuel_ref_t_day', label: 'Fuel at the reference speed F₀', group: 'mass', unit: 't', default: 35, min: 0.1, max: 400, help: 'tonnes per day at sea' },
    { id: 'exponent_n', label: 'Fuel-speed exponent n', group: 'dimensionless', unit: 'none', default: 3, min: 2, max: 5 },
    { id: 'port_fuel_t_day', label: 'Fuel in port (per port day)', group: 'mass', unit: 't', default: 3, min: 0, max: 50 },
    { id: 'fuel_price', label: 'Fuel price', group: 'price_per_mass', unit: 'cur_t', default: 550, min: 0, max: 5000 },
    { id: 'eua_price', label: 'CO₂ allowance price (per t CO₂)', group: 'money', unit: 'cur', default: 0, min: 0, max: 1000 },
    { id: 'ets_share_pct', label: 'Share of emissions under the ETS', group: 'ratio', unit: 'pct', default: 50, min: 0, max: 100 },
    { id: 'co2_factor', label: 'CO₂ factor (t CO₂ per t fuel)', group: 'dimensionless', unit: 'none', default: 3.114, min: 0, max: 4 },
    { id: 'port_days', label: 'Port days per voyage (loading + discharging + waiting)', group: 'dimensionless', unit: 'none', default: 4, min: 0, max: 60 },
    { id: 'hire_rate', label: 'Daily hire H', group: 'money', unit: 'cur', default: 18000, min: 0, max: 1e6, visibleWhen: { mode: 'time_charter' } },
    { id: 'freight_revenue', label: 'Freight revenue per voyage R', group: 'money', unit: 'cur', default: 1200000, min: 0, max: 1e9, visibleWhen: { mode: 'voyage_charter' } },
    { id: 'opex_per_day', label: 'Daily operating cost (crew, insurance, maintenance)', group: 'money', unit: 'cur', default: 7000, min: 0, max: 1e6, visibleWhen: { mode: 'voyage_charter' } },
    { id: 'v_min_kn', label: 'Minimum feasible speed', group: 'speed', unit: 'kn', default: 8, min: 1, max: 30 },
    { id: 'v_max_kn', label: 'Maximum speed', group: 'speed', unit: 'kn', default: 16, min: 2, max: 40 },
    { id: 'operating_days_per_year', label: 'Operating days per year', group: 'dimensionless', unit: 'none', default: 350, min: 1, max: 366 },
  ],
  outputs: [
    { id: 'effective_fuel_price', label: 'Effective fuel price incl. ETS', group: 'price_per_mass', unit: 'cur_t' },
    { id: 'optimal_speed_kn', label: 'Optimal speed within the bounds', group: 'speed', unit: 'kn' },
    { id: 'closed_form_speed_kn', label: 'Closed-form optimum (TC: Ronen; voyage: zero port time and opex)', group: 'speed', unit: 'kn' },
    { id: 'fuel_per_day_opt_t', label: 'Fuel per day at sea at the optimum', group: 'mass', unit: 't' },
    { id: 'sea_days', label: 'Sea days per voyage at the optimum', group: 'dimensionless', unit: 'none' },
    { id: 'voyage_days', label: 'Voyage days incl. port', group: 'dimensionless', unit: 'none' },
    { id: 'fuel_per_voyage_t', label: 'Fuel per voyage (sea + port)', group: 'mass', unit: 't' },
    { id: 'co2_per_voyage_t', label: 'CO₂ per voyage', group: 'mass', unit: 't' },
    { id: 'fuel_cost_voyage', label: 'Fuel (+ ETS) cost per voyage', group: 'money', unit: 'cur' },
    { id: 'time_cost_voyage', label: 'Hire (TC) or operating cost (voyage charter) per voyage', group: 'money', unit: 'cur' },
    { id: 'objective_optimum', label: 'Cost per voyage (TC) or profit per day (voyage charter) at the optimum', group: 'money', unit: 'cur' },
    { id: 'objective_reference', label: 'The same at the reference speed v₀', group: 'money', unit: 'cur' },
    { id: 'improvement_pct', label: 'Improvement over sailing at v₀', group: 'ratio', unit: 'pct' },
    { id: 'cost_per_nmi', label: 'Fuel + time cost per nautical mile at the optimum', group: 'money_per_distance', unit: 'cur_nmi' },
    { id: 'voyages_per_year', label: 'Voyages per year at the optimum', group: 'dimensionless', unit: 'none' },
    { id: 'annual_figure', label: 'Annual cost (TC) or annual profit (voyage charter)', group: 'money', unit: 'cur' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      mode: 'time_charter',
    },
    results: {
      optimal_speed_kn: '10.87 kn',
      sea_days: '19.2',
      fuel_per_day_opt_t: '16.4',
      time_cost_voyage: '417 000',
      fuel_cost_voyage: '179 000',
      objective_optimum: '596 000',
      objective_reference: '633 000',
      improvement_pct: '5.8 %',
    },
  },
};

/** Golden-section search for the minimum of f on [a, b]. */
export function minimize(f, a, b, tol = 1e-7) {
  const phi = (Math.sqrt(5) - 1) / 2;
  let lo = a;
  let hi = b;
  let c = hi - phi * (hi - lo);
  let d = lo + phi * (hi - lo);
  let fc = f(c);
  let fd = f(d);
  while (hi - lo > tol) {
    if (fc < fd) { hi = d; d = c; fd = fc; c = hi - phi * (hi - lo); fc = f(c); } else { lo = c; c = d; fc = fd; d = lo + phi * (hi - lo); fd = f(d); }
  }
  const x = (lo + hi) / 2;
  for (const edge of [a, b]) if (f(edge) < f(x)) return edge;
  return x;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.mode, ['time_charter', 'voyage_charter'], 'mode', 'Mode');
  assertPositive(i.distance_nmi, 'distance_nmi', 'Distance');
  assertPositive(i.v_ref_kn, 'v_ref_kn', 'Reference speed');
  assertPositive(i.fuel_ref_t_day, 'fuel_ref_t_day', 'Reference fuel');
  assertRange(i.exponent_n, 1.5, 6, 'exponent_n', 'Exponent');
  assertNonNegative(i.port_fuel_t_day, 'port_fuel_t_day', 'Port fuel');
  assertNonNegative(i.fuel_price, 'fuel_price', 'Fuel price');
  assertNonNegative(i.eua_price, 'eua_price', 'Allowance price');
  assertRange(i.ets_share_pct, 0, 100, 'ets_share_pct', 'ETS share');
  assertNonNegative(i.co2_factor, 'co2_factor', 'CO₂ factor');
  assertNonNegative(i.port_days, 'port_days', 'Port days');
  assertPositive(i.v_min_kn, 'v_min_kn', 'Minimum speed');
  assertPositive(i.v_max_kn, 'v_max_kn', 'Maximum speed');
  if (i.v_min_kn >= i.v_max_kn) throw new Error('Minimum speed must be below the maximum speed');
  assertPositive(i.operating_days_per_year, 'operating_days_per_year', 'Operating days');

  const pEff = i.fuel_price + (i.ets_share_pct / 100) * i.co2_factor * i.eua_price;
  const n = i.exponent_n;
  const D = i.distance_nmi;
  const fuelPerDay = (v) => i.fuel_ref_t_day * (v / i.v_ref_kn) ** n;
  const seaDays = (v) => D / (24 * v);
  const voyageFuel = (v) => fuelPerDay(v) * seaDays(v) + i.port_fuel_t_day * i.port_days;
  const fuelCost = (v) => voyageFuel(v) * pEff;
  let objective;
  let timeCost;
  let closedForm;
  let better;
  if (i.mode === 'time_charter') {
    assertNonNegative(i.hire_rate, 'hire_rate', 'Hire');
    if (pEff <= 0 && i.hire_rate <= 0) throw new Error('Enter a fuel price or a hire rate');
    timeCost = (v) => i.hire_rate * (seaDays(v) + i.port_days);
    objective = (v) => timeCost(v) + fuelCost(v);
    closedForm = pEff > 0 && i.hire_rate > 0 ? i.v_ref_kn * (i.hire_rate / ((n - 1) * pEff * i.fuel_ref_t_day)) ** (1 / n) : null;
    better = (a, b) => a < b;
  } else {
    assertNonNegative(i.freight_revenue, 'freight_revenue', 'Freight');
    assertNonNegative(i.opex_per_day, 'opex_per_day', 'Operating cost');
    timeCost = (v) => i.opex_per_day * (seaDays(v) + i.port_days);
    objective = (v) => (i.freight_revenue - fuelCost(v) - timeCost(v)) / (seaDays(v) + i.port_days);
    closedForm = pEff > 0 && i.freight_revenue > 0 ? ((24 * i.freight_revenue * i.v_ref_kn ** n) / (n * pEff * i.fuel_ref_t_day * D)) ** (1 / (n - 1)) : null;
    better = (a, b) => a > b;
  }
  const vOpt = i.mode === 'time_charter' ? minimize(objective, i.v_min_kn, i.v_max_kn) : minimize((v) => -objective(v), i.v_min_kn, i.v_max_kn);
  const objOpt = objective(vOpt);
  const objRef = objective(i.v_ref_kn);
  const improvement = i.mode === 'time_charter' ? (objRef - objOpt) / Math.abs(objRef) : (objOpt - objRef) / Math.abs(objRef);
  const voyageDays = seaDays(vOpt) + i.port_days;
  const voyagesPerYear = i.operating_days_per_year / voyageDays;
  const annual = i.mode === 'time_charter' ? objOpt * voyagesPerYear : objOpt * i.operating_days_per_year;
  const atBound = Math.abs(vOpt - i.v_min_kn) < 1e-6 || Math.abs(vOpt - i.v_max_kn) < 1e-6;

  const warnings = [];
  if (atBound) warnings.push(`The optimum sits on a speed bound (${vOpt.toFixed(2)} kn): the unconstrained optimum is outside the feasible range${closedForm !== null ? ` (closed form ${closedForm.toFixed(2)} kn)` : ''}.`);
  if (vOpt < 0.6 * i.v_ref_kn || vOpt > 1.25 * i.v_ref_kn) warnings.push('Optimum far from the reference speed: the power law was fitted near v₀ and the consumption extrapolation is uncertain — re-anchor F₀ at a speed closer to the result.');
  if (i.mode === 'voyage_charter' && objOpt < 0) warnings.push('Negative profit per day even at the best speed: the freight does not cover fuel and operating costs.');
  if (i.mode === 'voyage_charter' && i.port_days > 0) warnings.push('Port days lower the optimal speed below the zero-port-time closed form: the fixed freight is spread over more days, so a sea day saved is worth less.');
  warnings.push('Laycan and ETA constraints, weather, canal dues, cargo inventory cost, FuelEU penalties and CII consequences are outside the model and often dominate the decision.');
  warnings.push('The fuel-speed exponent is an average: below about 60 % of design speed the fuel per mile rises again because hotel and auxiliary loads do not slow down.');

  return {
    outputs: {
      effective_fuel_price: pEff,
      optimal_speed_kn: vOpt,
      closed_form_speed_kn: closedForm,
      fuel_per_day_opt_t: fuelPerDay(vOpt),
      sea_days: seaDays(vOpt),
      voyage_days: voyageDays,
      fuel_per_voyage_t: voyageFuel(vOpt),
      co2_per_voyage_t: voyageFuel(vOpt) * i.co2_factor,
      fuel_cost_voyage: fuelCost(vOpt),
      time_cost_voyage: timeCost(vOpt),
      objective_optimum: objOpt,
      objective_reference: objRef,
      improvement_pct: improvement * 100,
      cost_per_nmi: (fuelCost(vOpt) + timeCost(vOpt)) / D,
      voyages_per_year: voyagesPerYear,
      annual_figure: annual,
      summary: i.mode === 'time_charter'
        ? `Sail at ${vOpt.toFixed(2)} kn: ${objOpt.toFixed(0)} per voyage (${seaDays(vOpt).toFixed(1)} sea days) against ${objRef.toFixed(0)} at ${i.v_ref_kn} kn — ${(improvement * 100).toFixed(1)} % cheaper.`
        : `Sail at ${vOpt.toFixed(2)} kn: profit ${objOpt.toFixed(0)} per day over a ${voyageDays.toFixed(1)}-day cycle against ${objRef.toFixed(0)} per day at ${i.v_ref_kn} kn — ${(improvement * 100).toFixed(1)} % better.`,
    },
    warnings,
  };
}
