/**
 * chemical-dosing/calc.js — chemical feed for water treatment: active chemical and product feed rate from the water
 * flow, the dose in mg/L and the product strength (% w/w or % w/v) and density; dosing pump setting in L/h, mL/min and
 * US gal/day; daily use; and the chlorine form dose = demand + residual (solve any one).
 *
 * Active [g/h] = Q [m³/h] × dose [mg/L = g/m³];  product mass = active / w;  product volume = active / (w ρ) or active / c_wv;
 * US: lb/day = MGD × mg/L × 8.34.  Chlorine: dose = demand + residual.
 * Schema units: SI — m³/s, kg/m³, kg/s, kg, m³; doses in mg/L, strength as a fraction.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const US_GAL_L = 3.785411784;

export const schema = {
  id: 'chemical-dosing',
  name: 'Chemical dosing calculator (feed rate, pump setting, chlorine dose)',
  category: 'process',
  summary: 'Chemical feed rate and dosing pump setting in L/h and gal/day from flow, dose in mg/L, product strength and density, with chlorine dose, demand and residual.',
  related: ['ppm-concentration', 'dilution', 'mass-balance', 'flow-rate-velocity'],
  assumptions: [
    'The dose is the mass of active chemical per litre of treated water (mg/L = g/m³), applied to the whole flow; 1 mg/L in 1 m³ is 1 g, and in 1 million US gallons 8.34 lb.',
    'Product strength is the active content of the delivered product: % w/w is per mass of product, % w/v is grams per 100 mL (as for trade-strength hypochlorite, where % w/v = % w/w × specific gravity).',
    'The pump setting is the product volume per hour while the water flows; the daily use is that rate times the dosing hours per day. Pump ratings in gal/day are the same rate over 24 hours.',
    'Chlorine dose equals chlorine demand plus the residual left after the contact time; the demand depends on the water and the contact time, so measure the residual and adjust.',
    'Sodium hypochlorite loses strength in storage, faster when warm; check the strength of the product on delivery and periodically.',
  ],
  notes: [
    'Verification 2026-11-08: 100 m³/h dosed at 5 mg/L needs 0.5 kg/h of active chemical, 12.0 kg a day; with 12.5 % w/v hypochlorite of density 1 200 kg/m³ the pump delivers 4.00 L/h (25.4 US gal/day), 115.2 kg of product a day. Checked by hand.',
  ],
  sources: [
    'Office of Water Programs, California State University, Sacramento: Water Treatment Plant Operation, Vol. I, chapter on disinfection (chlorine dose = demand + residual; pounds formula lb/day = MGD × mg/L × 8.34)',
    'AWWA B300, Standard for Hypochlorites (sodium and calcium hypochlorite supplied for water treatment)',
    'Metcalf & Eddy, Wastewater Engineering: Treatment and Resource Recovery, 5th ed., ch. 12 (chlorine dose, demand and residual)',
  ],
  inputs: [
    { id: 'mode', label: 'Dose given as', type: 'select', default: 'dose', options: [{ value: 'dose', label: 'Target dose in mg/L' }, { value: 'chlorine', label: 'Chlorine: dose = demand + residual' }] },
    { id: 'cl_solve', label: 'Solve for', type: 'select', default: 'dose', options: [{ value: 'dose', label: 'Chlorine dose (from demand and residual)' }, { value: 'demand', label: 'Chlorine demand (from dose and residual)' }, { value: 'residual', label: 'Expected residual (from dose and demand)' }], visibleWhen: { mode: 'chlorine' } },
    { id: 'flow_m3_s', label: 'Water flow rate Q', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 100 / 3600, min: 1e-7, max: 100 },
    { id: 'dose_mg_l', label: 'Target dose, mg/L', group: 'dimensionless', unit: 'none', default: 5, min: 0.001, max: 100000, visibleWhen: { mode: 'dose' } },
    { id: 'cl_dose_mg_l', label: 'Chlorine dose, mg/L', group: 'dimensionless', unit: 'none', default: 3, min: 0, max: 1000, visibleWhen: { mode: 'chlorine', cl_solve: ['demand', 'residual'] } },
    { id: 'demand_mg_l', label: 'Chlorine demand, mg/L', group: 'dimensionless', unit: 'none', default: 1.5, min: 0, max: 1000, visibleWhen: { mode: 'chlorine', cl_solve: ['dose', 'residual'] } },
    { id: 'residual_mg_l', label: 'Chlorine residual, mg/L', group: 'dimensionless', unit: 'none', default: 0.5, min: 0, max: 1000, visibleWhen: { mode: 'chlorine', cl_solve: ['dose', 'demand'] } },
    { id: 'basis', label: 'Product strength given as', type: 'select', default: 'ww', options: [{ value: 'ww', label: '% w/w (mass of active per mass of product)' }, { value: 'wv', label: '% w/v (grams of active per 100 mL, trade %)' }] },
    { id: 'strength', label: 'Product strength', group: 'ratio', unit: 'frac', display: 'pct', default: 0.1, min: 0.0001, max: 1 },
    { id: 'product_density_kg_m3', label: 'Product density', group: 'density', unit: 'kg_m3', default: 1200, min: 500, max: 2500 },
    { id: 'hours', label: 'Dosing hours per day', group: 'dimensionless', unit: 'none', default: 24, min: 0.1, max: 24 },
  ],
  outputs: [
    { id: 'dose_out', label: 'Dose applied, mg/L', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'demand_out', label: 'Chlorine demand, mg/L', group: 'dimensionless', unit: 'none', decimals: 3, visibleWhen: { mode: 'chlorine' } },
    { id: 'residual_out', label: 'Chlorine residual, mg/L', group: 'dimensionless', unit: 'none', decimals: 3, visibleWhen: { mode: 'chlorine' } },
    { id: 'active_kg_s', label: 'Active chemical feed', group: 'mass_flow', unit: 'kg_s', display: 'kg_h' },
    { id: 'active_day_kg', label: 'Active chemical per day', group: 'mass', unit: 'kg' },
    { id: 'active_day_lb', label: 'Active chemical per day in pounds', group: 'mass', unit: 'kg', display: 'lb' },
    { id: 'product_kg_s', label: 'Product feed (mass)', group: 'mass_flow', unit: 'kg_s', display: 'kg_h' },
    { id: 'pump_l_h', label: 'Dosing pump setting, L/h', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'pump_ml_min', label: 'Dosing pump setting, mL/min', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'pump_gpd', label: 'Dosing pump setting, US gal/day', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'product_day_kg', label: 'Product used per day (mass)', group: 'mass', unit: 'kg' },
    { id: 'product_day_m3', label: 'Product used per day (volume)', group: 'volume', unit: 'm3', display: 'L' },
    { id: 'strength_ww', label: 'Product strength as % w/w', group: 'ratio', unit: 'frac', display: 'pct' },
  ],
  example: {
    inputs: { mode: 'dose', flow_m3_s: [100, 'm3_h'], dose_mg_l: 5, basis: 'wv', strength: [12.5, 'pct'], product_density_kg_m3: [1200, 'kg_m3'], hours: 24 },
    results: { active_day_kg: '12.0 kg', pump_l_h: '4.00', pump_gpd: '25.4', product_day_kg: '115.2 kg' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['dose', 'chlorine'], 'mode', 'Dose given as');
  assertOneOf(x.basis, ['ww', 'wv'], 'basis', 'Product strength given as');
  const Q = assertPositive(x.flow_m3_s, 'flow_m3_s', 'Water flow rate Q');
  const rho = assertRange(x.product_density_kg_m3, 500, 2500, 'product_density_kg_m3', 'Product density');
  const s = assertRange(x.strength, 0.0001, 1, 'strength', 'Product strength');
  const hours = assertRange(x.hours, 0.1, 24, 'hours', 'Dosing hours per day');
  const warnings = [];
  let dose;
  let demand = null;
  let residual = null;
  if (x.mode === 'dose') {
    dose = assertPositive(x.dose_mg_l, 'dose_mg_l', 'Target dose');
  } else {
    assertOneOf(x.cl_solve, ['dose', 'demand', 'residual'], 'cl_solve', 'Solve for');
    if (x.cl_solve === 'dose') {
      demand = assertNonNegative(x.demand_mg_l, 'demand_mg_l', 'Chlorine demand');
      residual = assertNonNegative(x.residual_mg_l, 'residual_mg_l', 'Chlorine residual');
      dose = demand + residual;
    } else if (x.cl_solve === 'demand') {
      dose = assertNonNegative(x.cl_dose_mg_l, 'cl_dose_mg_l', 'Chlorine dose');
      residual = assertNonNegative(x.residual_mg_l, 'residual_mg_l', 'Chlorine residual');
      if (residual > dose) throw new Error('Chlorine residual: it cannot exceed the dose; the demand would be negative.');
      demand = dose - residual;
    } else {
      dose = assertNonNegative(x.cl_dose_mg_l, 'cl_dose_mg_l', 'Chlorine dose');
      demand = assertNonNegative(x.demand_mg_l, 'demand_mg_l', 'Chlorine demand');
      if (demand > dose) throw new Error('Chlorine demand: it exceeds the dose, so no residual is left; raise the dose above the demand.');
      residual = dose - demand;
    }
    if (dose <= 0) throw new Error('Chlorine dose: it must be greater than zero to size a feed.');
    if (residual > 4) warnings.push('A residual above 4 mg/L exceeds the US EPA maximum residual disinfectant level for chlorine in drinking water (4.0 mg/L as Cl₂).');
  }
  const ww = x.basis === 'ww' ? s : s * (1000 / rho); // % w/v (g/100 mL) over SG gives % w/w
  if (ww > 1) throw new Error('Product strength: at this density the % w/v is more than 100 % by weight; check the strength and density.');
  const active = Q * dose / 1000; // kg/s: m³/s × g/m³ / 1000
  const productMass = active / ww; // kg/s
  const productVol = productMass / rho; // m³/s
  const lph = productVol * 3.6e6;
  const day = hours * 3600;
  if (lph < 0.05) warnings.push('Pump setting below 0.05 L/h: few dosing pumps meter that accurately; dilute the product or use a smaller pump.');
  return {
    outputs: {
      dose_out: dose,
      demand_out: demand,
      residual_out: residual,
      active_kg_s: active,
      active_day_kg: active * day,
      active_day_lb: active * day,
      product_kg_s: productMass,
      pump_l_h: lph,
      pump_ml_min: (lph * 1000) / 60,
      pump_gpd: (lph * 24) / US_GAL_L,
      product_day_kg: productMass * day,
      product_day_m3: productVol * day,
      strength_ww: ww,
    },
    warnings,
  };
}
