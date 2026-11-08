/**
 * planing-speed/calc.js — planing boat speed from shaft power and displacement by Crouch's formula, and the inverse:
 * the power needed for a target speed.
 *
 * V[kn] = C / √(W[lb] / P[shp]);  P = W (V / C)².  C from Gerr's table of Crouch constants by hull type.
 * Schema units: kg, W, kn.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const LB = 0.45359237;
const HP = 745.69987158227;
const FT = 0.3048;

/** Crouch constants (speed in knots) as tabulated by Gerr, The Propeller Handbook, ch. 2. */
export const HULLS = {
  average: { label: 'Average runabouts, cruisers, passenger vessels (C = 150)', c: 150 },
  fast: { label: 'High-speed runabouts, very light high-speed cruisers (C = 190)', c: 190 },
  race: { label: 'Race boats (C = 210)', c: 210 },
  hydroplane: { label: 'Three-point and stepped hydroplanes (C = 220)', c: 220 },
  catamaran: { label: 'Racing power catamarans and sea sleds (C = 230)', c: 230 },
  custom: { label: 'Other: enter C (calibrate from a known boat)' },
};

export const schema = {
  id: 'planing-speed',
  name: 'Planing boat speed calculator (Crouch formula)',
  category: 'maritime',
  summary: 'Top speed of a planing boat from shaft horsepower and weight by Crouch\'s formula, with C by hull type, and the power needed for a target speed.',
  related: ['hull-speed', 'prop-pitch-speed', 'boat-fuel', 'froude-number'],
  assumptions: [
    'Crouch\'s formula V = C / √(W / P) is an empirical fit for planing hulls (speed in knots, weight in pounds, shaft horsepower). It does not apply to displacement or most semi-displacement hulls below a speed–length ratio of about 3.',
    'W is the loaded weight of the boat as it runs: hull, engines, fuel, water, people and gear. A half-loaded boat is noticeably faster than a fully loaded one.',
    'P is shaft horsepower delivered to the propeller. Gearboxes and stern drives lose a few percent of the engine\'s rated power, and the rating itself is at the top of the rpm range.',
    'The constant C depends on the hull and its propeller: Gerr tabulates 150 for average runabouts and cruisers up to 230 for racing catamarans. The best value comes from a sister boat with a known speed and power.',
  ],
  notes: [
    'Verification 2026-11-08: a 5 000 lb runabout (C = 150) with 200 shp runs 150 / √(5 000 / 200) = 30.0 kn; for 35 kn it needs 5 000 × (35 / 150)² = 272 shp. Checked by hand.',
  ],
  sources: [
    'D. Gerr, The Propeller Handbook (International Marine, 1989), ch. 2: Crouch\'s planing speed formula and the table of Crouch constants C',
    'D. Savitsky, Hydrodynamic design of planing hulls, Marine Technology 1(1), 1964, pp. 71–95 (the physics-based method for planing resistance behind empirical rules such as Crouch\'s)',
  ],
  inputs: [
    {
      id: 'mode', label: 'What do you want to find?', type: 'select', default: 'speed',
      options: [{ value: 'speed', label: 'Speed from power' }, { value: 'power', label: 'Power for a target speed' }],
    },
    { id: 'weight_kg', label: 'Loaded weight (displacement)', group: 'mass', unit: 'kg', display: 'lb', default: 2267.96185, min: 10, max: 2e6 },
    { id: 'power_w', label: 'Shaft power (all engines)', group: 'power', unit: 'W', display: 'hp', default: 149139.974316, min: 100, max: 1e8, visibleWhen: { mode: 'speed' } },
    { id: 'target_kn', label: 'Target speed', group: 'speed', unit: 'kn', default: 35, min: 1, max: 200, visibleWhen: { mode: 'power' } },
    { id: 'hull', label: 'Hull type (Crouch constant C)', type: 'select', default: 'average', options: Object.entries(HULLS).map(([value, h]) => ({ value, label: h.label })) },
    { id: 'c_custom', label: 'Crouch constant C', group: 'dimensionless', unit: 'none', default: 160, min: 50, max: 400, visibleWhen: { hull: 'custom' } },
    { id: 'lwl_m', label: 'Waterline length (optional, 0 = skip the planing check)', group: 'length', unit: 'm', display: 'ft', default: 0, min: 0, max: 200 },
  ],
  outputs: [
    { id: 'c_used', label: 'Crouch constant C used', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'lb_per_hp', label: 'Weight per shaft horsepower, lb/hp', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'speed_kn', label: 'Speed', group: 'speed', unit: 'kn', decimals: 1 },
    { id: 'power_req_w', label: 'Shaft power needed', group: 'power', unit: 'W', display: 'hp' },
    { id: 'sl_ratio', label: 'Speed–length ratio S/L (knots / √ft)', group: 'dimensionless', unit: 'none', decimals: 2 },
  ],
  example: {
    inputs: { mode: 'speed', weight_kg: [5000, 'lb'], power_w: [200, 'hp'], hull: 'average', lwl_m: [0, 'ft'] },
    results: { lb_per_hp: '25.0', speed_kn: '30.0 kn' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['speed', 'power'], 'mode', 'What do you want to find');
  assertOneOf(x.hull, Object.keys(HULLS), 'hull', 'Hull type');
  const W = assertPositive(x.weight_kg, 'weight_kg', 'Loaded weight') / LB;
  const C = x.hull === 'custom' ? assertRange(x.c_custom, 50, 400, 'c_custom', 'Crouch constant C') : HULLS[x.hull].c;
  const lwl = assertNonNegative(x.lwl_m, 'lwl_m', 'Waterline length');
  let speed;
  let hp;
  if (x.mode === 'speed') {
    hp = assertPositive(x.power_w, 'power_w', 'Shaft power') / HP;
    speed = C / Math.sqrt(W / hp);
  } else {
    speed = assertPositive(x.target_kn, 'target_kn', 'Target speed');
    hp = W * (speed / C) ** 2;
  }
  const sl = lwl > 0 ? speed / Math.sqrt(lwl / FT) : null;
  const warnings = [];
  if (sl !== null && sl < 3) warnings.push('The speed–length ratio is below 3: the boat is not fully planing at this speed, and Crouch\'s formula overestimates the speed (or underestimates the power).');
  if (W / hp > 100) warnings.push('More than 100 lb per horsepower: a boat this heavy for its power will probably not plane.');
  return {
    outputs: {
      c_used: C,
      lb_per_hp: W / hp,
      speed_kn: speed,
      power_req_w: x.mode === 'power' ? hp * HP : null,
      sl_ratio: sl,
    },
    warnings,
  };
}
