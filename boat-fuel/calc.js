/**
 * boat-fuel/calc.js — fuel consumption of a boat engine from power, load and specific fuel consumption (or a measured
 * fuel flow): litres and US gallons per hour, endurance and range on a tank with a reserve, fuel per mile and cost.
 *
 * P = P_rated × load (or P_rated × (n/n_rated)³ by the propeller law);  ṁ = P × SFC;  Q = ṁ / ρ_fuel.
 * Endurance = V_usable / Q;  range = endurance × speed.
 * Schema units: W, g/kWh, kg/m³, kn, m³, nmi; fuel flow and price per litre as plain numbers.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const L_PER_GAL = 3.785411784;
/** Typical specific fuel consumption and density by fuel. Diesel: Volvo Penta D4 data at rated power 220–232 g/kWh;
 * petrol: Heywood's typical best SI value is about 270 g/kWh, and marine petrol engines run richer near full throttle.
 * Densities at 15 °C within EN 590 (diesel, 820–845 kg/m³) and EN 228 (petrol, 720–775 kg/m³). */
export const FUELS = {
  diesel: { label: 'Diesel (SFC 225 g/kWh, 0.84 kg/L)', sfc: 225, density: 840 },
  petrol: { label: 'Petrol / gasoline four-stroke (SFC 300 g/kWh, 0.745 kg/L)', sfc: 300, density: 745 },
  custom: { label: 'Other: enter SFC and density' },
};

export const schema = {
  id: 'boat-fuel',
  name: 'Boat fuel consumption calculator',
  category: 'maritime',
  summary: 'Boat fuel burn in litres and gallons per hour from engine power and load, with range and endurance on a tank, fuel per mile and cost per hour.',
  related: ['fuel-voyage-cost', 'hull-speed', 'planing-speed', 'eta-time-zones'],
  assumptions: [
    'Fuel flow is power × specific fuel consumption ÷ fuel density. The default SFC is 225 g/kWh for diesel (Volvo Penta D4 series, 220–232 g/kWh at rated power) and 300 g/kWh for four-stroke petrol engines, a little above the 270 g/kWh Heywood gives as a typical best value.',
    'SFC rises at light load: below about a third of rated power a diesel can burn 10 to 30 % more per kWh than at its best point. Use the engine maker\'s fuel curve or a measured flow where you have one.',
    'With the load given as a share of rated rpm, the power follows the propeller law P ∝ n³ (MAN, Basic Principles of Ship Propulsion). Planing boats depart from it, especially around the hump speed.',
    'Range and endurance use the usable fuel after the reserve, at constant speed and load, in calm water with a clean hull. Wind, sea, current and fouling all cut the range.',
    'Prices are per litre in any single currency; for a price per US gallon divide by 3.785.',
  ],
  notes: [
    'Verification 2026-11-08: a 200 hp diesel at 70 % power (104.4 kW) burns 104.4 × 225 = 23.5 kg/h, 27.96 L/h or 7.39 US gal/h; 400 L with 20 % reserve lasts 11.4 h, 229 nmi at 20 kn; at 1.80 per litre 50.3 per hour. Checked by hand.',
    'Design decision: fuel flow is shown in L/h and US gal/h as plain numbers because the unit library has no L/h or gal/h volume-flow units.',
  ],
  sources: [
    'J.B. Heywood, Internal Combustion Engine Fundamentals (McGraw-Hill, 1988), §2.9: specific fuel consumption (typical best values about 270 g/kWh for spark-ignition and 200 g/kWh for diesel engines)',
    'Volvo Penta D4 series marine diesel data (D4-180 to D4-300): specific fuel consumption 220–232 g/kWh at rated power',
    'MAN Energy Solutions, Basic Principles of Ship Propulsion (2018): the propeller law, power proportional to the cube of the speed',
    'EN 590:2022 (diesel) and EN 228:2012+A1:2017 (petrol): density limits at 15 °C',
  ],
  inputs: [
    { id: 'fuel', label: 'Fuel', type: 'select', default: 'diesel', options: Object.entries(FUELS).map(([value, f]) => ({ value, label: f.label })) },
    { id: 'sfc_g_kwh', label: 'Specific fuel consumption', group: 'specific_fuel', unit: 'g_kWh', default: 250, min: 150, max: 600, visibleWhen: { fuel: 'custom' } },
    { id: 'density_kg_m3', label: 'Fuel density', group: 'density', unit: 'kg_m3', display: 'kg_L', default: 840, min: 500, max: 1100, visibleWhen: { fuel: 'custom' } },
    {
      id: 'basis', label: 'Fuel use from', type: 'select', default: 'power',
      options: [{ value: 'power', label: 'Engine power and load' }, { value: 'flow', label: 'Measured fuel flow (flow meter or engine display)' }],
    },
    { id: 'power_w', label: 'Rated engine power (all engines together)', group: 'power', unit: 'W', display: 'hp', default: 149139.97, min: 100, max: 1e8, visibleWhen: { basis: 'power' } },
    {
      id: 'load_basis', label: 'Engine load given as', type: 'select', default: 'power', visibleWhen: { basis: 'power' },
      options: [{ value: 'power', label: 'Share of rated power' }, { value: 'rpm', label: 'Share of rated rpm (propeller law, P ∝ n³)' }],
    },
    { id: 'load_frac', label: 'Load (share of rated power)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.7, min: 0.05, max: 1.1, visibleWhen: { basis: 'power', load_basis: 'power' } },
    { id: 'rpm_frac', label: 'Engine speed (share of rated rpm)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.85, min: 0.2, max: 1.05, visibleWhen: { basis: 'power', load_basis: 'rpm' } },
    { id: 'flow_l_h', label: 'Measured fuel flow, L/h (all engines)', group: 'dimensionless', unit: 'none', default: 25, min: 0.01, max: 100000, visibleWhen: { basis: 'flow' } },
    { id: 'speed_kn', label: 'Boat speed', group: 'speed', unit: 'kn', default: 20, min: 0, max: 80 },
    { id: 'tank_m3', label: 'Fuel in the tank', group: 'volume', unit: 'm3', display: 'L', default: 0.4, min: 0, max: 10000 },
    { id: 'reserve_frac', label: 'Reserve kept in the tank', group: 'ratio', unit: 'frac', display: 'pct', default: 0.2, min: 0, max: 0.9 },
    { id: 'trip_nmi', label: 'Trip distance (optional)', group: 'length', unit: 'nmi', default: 0, min: 0, max: 20000 },
    { id: 'price_l', label: 'Fuel price per litre (optional)', group: 'dimensionless', unit: 'none', default: 1.8, min: 0, max: 100 },
  ],
  outputs: [
    { id: 'power_used_w', label: 'Power delivered', group: 'power', unit: 'W', display: 'kW' },
    { id: 'fuel_kg_s', label: 'Fuel mass flow', group: 'mass_flow', unit: 'kg_s', display: 'kg_h' },
    { id: 'fuel_l_h', label: 'Fuel flow, litres per hour', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'fuel_gph', label: 'Fuel flow, US gallons per hour', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'usable_m3', label: 'Usable fuel after the reserve', group: 'volume', unit: 'm3', display: 'L' },
    { id: 'endurance_s', label: 'Endurance on the usable fuel', group: 'time', unit: 's', display: 'h' },
    { id: 'range_nmi', label: 'Range at this speed', group: 'length', unit: 'nmi' },
    { id: 'l_per_nmi', label: 'Fuel per nautical mile, L/nmi', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'nmi_per_gal', label: 'Nautical miles per US gallon', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'cost_h', label: 'Fuel cost per hour', group: 'money', unit: 'cur' },
    { id: 'cost_nmi', label: 'Fuel cost per nautical mile', group: 'money_per_distance', unit: 'cur_nmi' },
    { id: 'trip_fuel_m3', label: 'Fuel for the trip', group: 'volume', unit: 'm3', display: 'L' },
    { id: 'trip_cost', label: 'Fuel cost of the trip', group: 'money', unit: 'cur' },
  ],
  example: {
    inputs: { fuel: 'diesel', basis: 'power', power_w: [200, 'hp'], load_basis: 'power', load_frac: [70, 'pct'], speed_kn: [20, 'kn'], tank_m3: [400, 'L'], reserve_frac: [20, 'pct'], trip_nmi: [0, 'nmi'], price_l: 1.8 },
    results: { power_used_w: '104.4 kW', fuel_l_h: '27.96', fuel_gph: '7.39', endurance_s: '11.4 h', range_nmi: '229 nmi', cost_h: '50.33' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.fuel, Object.keys(FUELS), 'fuel', 'Fuel');
  assertOneOf(x.basis, ['power', 'flow'], 'basis', 'Fuel use from');
  assertOneOf(x.load_basis, ['power', 'rpm'], 'load_basis', 'Engine load given as');
  const custom = x.fuel === 'custom';
  const sfc = custom ? assertRange(x.sfc_g_kwh, 150, 600, 'sfc_g_kwh', 'Specific fuel consumption') : FUELS[x.fuel].sfc;
  const rho = custom ? assertRange(x.density_kg_m3, 500, 1100, 'density_kg_m3', 'Fuel density') : FUELS[x.fuel].density;
  const speed = assertNonNegative(x.speed_kn, 'speed_kn', 'Boat speed');
  const tank = assertNonNegative(x.tank_m3, 'tank_m3', 'Fuel in the tank');
  const reserve = assertRange(x.reserve_frac, 0, 0.9, 'reserve_frac', 'Reserve');
  const trip = assertNonNegative(x.trip_nmi, 'trip_nmi', 'Trip distance');
  const price = assertNonNegative(x.price_l, 'price_l', 'Fuel price');
  const warnings = [];
  let power = null;
  let lph;
  if (x.basis === 'power') {
    const rated = assertPositive(x.power_w, 'power_w', 'Rated engine power');
    const share = x.load_basis === 'power'
      ? assertRange(x.load_frac, 0.05, 1.1, 'load_frac', 'Load')
      : assertRange(x.rpm_frac, 0.2, 1.05, 'rpm_frac', 'Engine speed') ** 3;
    power = rated * share;
    lph = (power / 1000) * sfc / rho; // kW × g/kWh = g/h; ÷ kg/m³ = L/h
    if (share < 0.3) warnings.push('Below about 30 % of rated power the specific fuel consumption rises: the fuel flow shown is probably low. Check the engine maker\'s curve.');
    if (share > 1) warnings.push('More than rated power: engines are not run continuously above their rating.');
  } else {
    lph = assertPositive(x.flow_l_h, 'flow_l_h', 'Measured fuel flow');
  }
  const kgPerS = (lph * rho) / 1000 / 3600;
  const usable = tank * (1 - reserve);
  const endurance = usable > 0 ? ((usable * 1000) / lph) * 3600 : null;
  const lPerNmi = speed > 0 ? lph / speed : null;
  if (speed === 0) warnings.push('Boat speed is zero: range and fuel per mile are not defined.');
  return {
    outputs: {
      power_used_w: power,
      fuel_kg_s: kgPerS,
      fuel_l_h: lph,
      fuel_gph: lph / L_PER_GAL,
      usable_m3: usable,
      endurance_s: endurance,
      range_nmi: endurance !== null && speed > 0 ? (endurance / 3600) * speed : null,
      l_per_nmi: lPerNmi,
      nmi_per_gal: lPerNmi ? L_PER_GAL / lPerNmi : null,
      cost_h: price > 0 ? lph * price : null,
      cost_nmi: price > 0 && lPerNmi ? lPerNmi * price : null,
      trip_fuel_m3: trip > 0 && lPerNmi ? (trip * lPerNmi) / 1000 : null,
      trip_cost: trip > 0 && lPerNmi && price > 0 ? trip * lPerNmi * price : null,
    },
    warnings,
  };
}
