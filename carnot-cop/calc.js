/**
 * carnot-cop/calc.js — Carnot limits between two temperatures: heat-engine efficiency, heat-pump COP and refrigerator
 * COP, with a realistic estimate from the fraction of Carnot a real machine reaches, and the heat or power that gives.
 *
 * η_C = 1 − T_c/T_h;  COP_h,C = T_h/(T_h − T_c);  COP_c,C = T_c/(T_h − T_c);  real = Carnot × second-law efficiency.
 * Schema units: SI — °C, W, fraction.
 */
import { withDefaults, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

export const schema = {
  id: 'carnot-cop',
  name: 'Carnot efficiency and COP calculator',
  category: 'thermal',
  summary: 'Carnot efficiency of a heat engine and the ideal COP of a heat pump or refrigerator between two temperatures, with a realistic estimate and the heat or power.',
  related: ['specific-heat', 'heat-transfer', 'heat-loss', 'electricity-cost'],
  assumptions: [
    'Temperatures are those of the hot and cold reservoirs in kelvin (°C + 273.15). For a heat pump use the temperature delivered (flow temperature) and the source temperature (outdoor air or ground); the refrigerant runs a few kelvin beyond both, so a real machine sees a wider lift.',
    'The Carnot value is the theoretical maximum of any machine between the two temperatures. Real machines reach a fraction of it, the second-law efficiency: typically 40–55 % for heat pumps and chillers, 30–60 % for heat engines.',
    'The power figures assume steady operation at the given temperatures; seasonal performance (SCOP, SEER) averages over changing conditions, defrost and part load.',
  ],
  notes: [
    'Verification 2026-11-07: a heat pump delivering 35 °C from 0 °C outdoor air has a Carnot COP of 308.15/35 = 8.80; at 50 % of Carnot, COP 4.40, so 2 kW of electricity gives 8.8 kW of heat. Checked by hand.',
  ],
  sources: [
    'Çengel, Y.A. and Boles, M.A., Thermodynamics: An Engineering Approach, 9th ed., ch. 6 (Carnot efficiency and COP, eqs. 6-18, 6-20, 6-21)',
    'EN 14511-2:2018 (rating conditions of air-to-water heat pumps, e.g. A7/W35), for the typical fraction of Carnot',
  ],
  inputs: [
    { id: 'machine', label: 'Machine', type: 'select', default: 'heatpump', options: [{ value: 'heatpump', label: 'Heat pump (heating)' }, { value: 'fridge', label: 'Refrigerator, chiller or air conditioner (cooling)' }, { value: 'engine', label: 'Heat engine (power from heat)' }] },
    { id: 'hot_c', label: 'Hot side temperature', group: 'temperature', unit: 'C', default: 35, min: -200, max: 3000 },
    { id: 'cold_c', label: 'Cold side temperature', group: 'temperature', unit: 'C', default: 0, min: -273, max: 3000 },
    { id: 'fraction', label: 'Fraction of Carnot reached (second-law efficiency)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.5, min: 0.01, max: 1 },
    { id: 'power_w', label: 'Power input (heat pump, fridge) or heat input (engine)', group: 'power', unit: 'W', display: 'kW', default: 2000, min: 0, max: 1e12 },
  ],
  outputs: [
    { id: 'carnot', label: 'Carnot value (efficiency or COP)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'real', label: 'Realistic value at the fraction of Carnot', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'useful_w', label: 'Heat delivered, heat removed, or work output', group: 'power', unit: 'W', display: 'kW' },
    { id: 'rejected_w', label: 'Heat from the source or rejected to the sink', group: 'power', unit: 'W', display: 'kW' },
    { id: 'lift_k', label: 'Temperature lift', group: 'temperature_difference', unit: 'K' },
  ],
  example: {
    inputs: { machine: 'heatpump', hot_c: [35, 'C'], cold_c: [0, 'C'], fraction: [50, 'pct'], power_w: [2, 'kW'] },
    results: { carnot: '8.804', real: '4.40', useful_w: '8.80 kW' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.machine, ['heatpump', 'fridge', 'engine'], 'machine', 'Machine');
  const th = assertRange(x.hot_c, -200, 3000, 'hot_c', 'Hot side temperature') + 273.15;
  const tc = assertRange(x.cold_c, -273, 3000, 'cold_c', 'Cold side temperature') + 273.15;
  if (tc <= 0) throw new Error('Cold side temperature: it must be above absolute zero.');
  if (th <= tc) throw new Error('Hot side temperature: it must be above the cold side temperature.');
  const f = assertRange(x.fraction, 0.01, 1, 'fraction', 'Fraction of Carnot');
  const p = assertNonNegative(x.power_w, 'power_w', 'Power input');
  let carnot; let useful; let other;
  if (x.machine === 'engine') {
    carnot = 1 - tc / th;
    useful = p * carnot * f; other = p - useful;
  } else if (x.machine === 'heatpump') {
    carnot = th / (th - tc);
    useful = p * carnot * f; other = useful - p;
  } else {
    carnot = tc / (th - tc);
    useful = p * carnot * f; other = useful + p;
  }
  const warnings = [];
  if (x.machine !== 'engine' && th - tc < 5) warnings.push('A lift under 5 K gives a very high theoretical COP that real machines cannot reach; fans, pumps and heat-exchanger temperature differences dominate.');
  return { outputs: { carnot, real: carnot * f, useful_w: p > 0 ? useful : null, rejected_w: p > 0 ? other : null, lift_k: th - tc }, warnings };
}
