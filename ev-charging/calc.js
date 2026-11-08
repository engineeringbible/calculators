/**
 * ev-charging/calc.js — electric vehicle charging time and cost from the battery capacity, the start and end state of
 * charge, the charger power with the vehicle's limit (onboard charger for AC, maximum DC power), the charging
 * efficiency and the electricity price; range added in total and per hour of charging from the consumption.
 *
 * E_bat = C (SoC_end − SoC_start);  E_grid = E_bat / η;  P = min(P_charger, P_vehicle);  t = E_grid / P;
 * cost = E_grid × price;  range = E_bat / consumption;  range per hour = P η / consumption.
 * Schema units: Wh (display kWh), W (display kW), s (display h), m (display mi), m/s (display mph).
 */
import { withDefaults, assertRange, assertOneOf, assertNonNegative } from '../shared/validate.js';

const MI = 1609.344;

/** Consumption entries → battery energy per metre driven, Wh/m. */
export const CONSUMPTION = {
  mi_kwh: { label: 'mi/kWh', toWhPerM: (v) => 1000 / (v * MI) },
  km_kwh: { label: 'km/kWh', toWhPerM: (v) => 1000 / (v * 1000) },
  kwh_100mi: { label: 'kWh/100 mi', toWhPerM: (v) => (v * 1000) / (100 * MI) },
  kwh_100km: { label: 'kWh/100 km', toWhPerM: (v) => (v * 1000) / 100000 },
  wh_mi: { label: 'Wh/mi', toWhPerM: (v) => v / MI },
};

export const schema = {
  id: 'ev-charging',
  name: 'EV charging time and cost calculator',
  category: 'electrical',
  summary: 'Electric car charging time and cost from battery size, state of charge, charger power and the car\'s limit, with charging losses and the range added per hour.',
  related: ['electricity-cost', 'battery-charge-time', 'kw-to-amps', 'solar-payback'],
  assumptions: [
    'Charging runs at a constant power, the lower of the charger rating and the vehicle limit (the onboard charger for AC, the maximum DC power for fast charging). DC fast charging slows down above about 80 % state of charge, so times to a higher end point are underestimated.',
    'The efficiency covers the losses from the meter to the battery: onboard charger, cables, battery and cooling. Idaho National Laboratory measured 88.8 % on Level 1 and 90.8 % on Level 2 for the onboard charger of one vehicle; 85 to 90 % from wall to battery is a typical planning range, and cold weather lowers it.',
    'The capacity is the usable battery energy; the state of charge is the share of that usable energy shown by the car.',
    'The consumption is the energy taken from the battery per distance, as shown by the trip computer. EPA label figures in kWh/100 mi are measured at the wall (SAE J1634) and include charging losses; with them, set the efficiency to 100 % for the range.',
    'The price is per kWh drawn from the grid or billed by the station; standing charges, session fees and time-of-use rates are not included.',
  ],
  notes: [
    'Verification 2026-11-08: a 75 kWh battery from 20 to 80 % takes 45.0 kWh; at 90 % efficiency 50.0 kWh from a 7.2 kW Level 2 charger, 6.94 h (6 h 57 min), 7.50 at 0.15 per kWh; at 3.4 mi/kWh the range added is 153 mi, 22.0 mi per hour of charging. Checked by hand.',
  ],
  sources: [
    'SAE J1772, SAE Electric Vehicle and Plug-in Hybrid Electric Vehicle Conductive Charge Coupler (AC Level 1 at 120 V up to 16 A; AC Level 2 at 208–240 V up to 80 A)',
    'U.S. Department of Energy, Alternative Fuels Data Center, Electric Vehicle Charging Stations (Level 1 about 1.9 kW and 5 miles of range per hour; Level 2 up to 19.2 kW, about 25 miles per hour at 7.2 kW)',
    'Idaho National Laboratory, Advanced Vehicle Testing Activity, Benchmark Testing of the Chevrolet Volt Onboard Charger (2012): AC-to-DC charging efficiency 88.8 % Level 1, 90.8 % Level 2',
    'SAE J1634, Battery Electric Vehicle Energy Consumption and Range Test Procedure (recharge energy measured at the AC supply)',
  ],
  inputs: [
    { id: 'capacity_wh', label: 'Usable battery capacity', group: 'energy', unit: 'Wh', display: 'kWh', default: 75000, min: 1000, max: 300000 },
    { id: 'soc_start', label: 'State of charge at the start', group: 'ratio', unit: 'frac', display: 'pct', default: 0.2, min: 0, max: 1 },
    { id: 'soc_end', label: 'State of charge at the end', group: 'ratio', unit: 'frac', display: 'pct', default: 0.8, min: 0, max: 1 },
    { id: 'charger_type', label: 'Charger', type: 'select', default: 'ac', options: [{ value: 'ac', label: 'AC: Level 1 or Level 2 (through the onboard charger)' }, { value: 'dc', label: 'DC fast charger' }] },
    { id: 'charger_w', label: 'Charger power', group: 'power', unit: 'W', display: 'kW', default: 7200, min: 500, max: 1e6, help: 'Level 1: 120 V × 12 A = 1.44 kW. Level 2: 240 V × 32 A = 7.68 kW. Power = volts × amps.' },
    { id: 'onboard_w', label: 'Onboard charger limit of the car', group: 'power', unit: 'W', display: 'kW', default: 11000, min: 500, max: 50000, visibleWhen: { charger_type: 'ac' } },
    { id: 'dc_limit_w', label: 'Maximum DC charging power of the car', group: 'power', unit: 'W', display: 'kW', default: 150000, min: 5000, max: 1e6, visibleWhen: { charger_type: 'dc' } },
    { id: 'efficiency', label: 'Charging efficiency, grid to battery', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.5, max: 1 },
    { id: 'price_kwh', label: 'Electricity price per kWh', group: 'dimensionless', unit: 'none', default: 0.15, min: 0, max: 10 },
    { id: 'consumption_unit', label: 'Consumption given as', type: 'select', default: 'mi_kwh', options: Object.entries(CONSUMPTION).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'cons_mi_kwh', label: 'Consumption, mi/kWh', group: 'dimensionless', unit: 'none', default: 3.4, min: 0.5, max: 10, visibleWhen: { consumption_unit: 'mi_kwh' } },
    { id: 'cons_km_kwh', label: 'Consumption, km/kWh', group: 'dimensionless', unit: 'none', default: 5.5, min: 1, max: 16, visibleWhen: { consumption_unit: 'km_kwh' } },
    { id: 'cons_kwh_100mi', label: 'Consumption, kWh/100 mi', group: 'dimensionless', unit: 'none', default: 30, min: 10, max: 200, visibleWhen: { consumption_unit: 'kwh_100mi' } },
    { id: 'cons_kwh_100km', label: 'Consumption, kWh/100 km', group: 'dimensionless', unit: 'none', default: 18, min: 6, max: 120, visibleWhen: { consumption_unit: 'kwh_100km' } },
    { id: 'cons_wh_mi', label: 'Consumption, Wh/mi', group: 'dimensionless', unit: 'none', default: 300, min: 100, max: 2000, visibleWhen: { consumption_unit: 'wh_mi' } },
  ],
  outputs: [
    { id: 'battery_wh', label: 'Energy added to the battery', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'grid_wh', label: 'Energy drawn from the grid', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'loss_wh', label: 'Charging losses', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'power_w', label: 'Charging power (charger or car, whichever is lower)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'limited_by', label: 'Power limited by', type: 'text' },
    { id: 'time_s', label: 'Charging time', group: 'time', unit: 's', display: 'h' },
    { id: 'time_text', label: 'Charging time in hours and minutes', type: 'text' },
    { id: 'cost', label: 'Cost of the charge', group: 'money', unit: 'cur' },
    { id: 'range_m', label: 'Range added', group: 'length', unit: 'm', display: 'mi' },
    { id: 'range_rate_m_s', label: 'Range added per hour of charging', group: 'speed', unit: 'm_s', display: 'mph' },
    { id: 'cost_per_km', label: 'Energy cost per km driven', group: 'money', unit: 'cur', decimals: 3 },
    { id: 'cost_per_mi', label: 'Energy cost per mile driven', group: 'money', unit: 'cur', decimals: 3 },
  ],
  example: {
    inputs: { capacity_wh: [75, 'kWh'], soc_start: [20, 'pct'], soc_end: [80, 'pct'], charger_type: 'ac', charger_w: [7.2, 'kW'], onboard_w: [11, 'kW'], efficiency: [90, 'pct'], price_kwh: 0.15, consumption_unit: 'mi_kwh', cons_mi_kwh: 3.4 },
    results: { battery_wh: '45.0 kWh', grid_wh: '50.0 kWh', time_s: '6.94 h', cost: '7.50', range_m: '153 mi', range_rate_m_s: '22.0 mph' },
  },
};

const CONS_FIELD = { mi_kwh: ['cons_mi_kwh', 0.5, 10], km_kwh: ['cons_km_kwh', 1, 16], kwh_100mi: ['cons_kwh_100mi', 10, 200], kwh_100km: ['cons_kwh_100km', 6, 120], wh_mi: ['cons_wh_mi', 100, 2000] };

/** "6 h 57 min" from a time in seconds. */
export function hoursMinutes(seconds) {
  const total = Math.round(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.charger_type, ['ac', 'dc'], 'charger_type', 'Charger');
  assertOneOf(x.consumption_unit, Object.keys(CONSUMPTION), 'consumption_unit', 'Consumption given as');
  const cap = assertRange(x.capacity_wh, 1000, 300000, 'capacity_wh', 'Usable battery capacity');
  const s0 = assertRange(x.soc_start, 0, 1, 'soc_start', 'State of charge at the start');
  const s1 = assertRange(x.soc_end, 0, 1, 'soc_end', 'State of charge at the end');
  if (s1 <= s0) throw new Error('State of charge at the end: it must be above the state of charge at the start.');
  const pCharger = assertRange(x.charger_w, 500, 1e6, 'charger_w', 'Charger power');
  const pCar = x.charger_type === 'ac'
    ? assertRange(x.onboard_w, 500, 50000, 'onboard_w', 'Onboard charger limit')
    : assertRange(x.dc_limit_w, 5000, 1e6, 'dc_limit_w', 'Maximum DC charging power');
  const eta = assertRange(x.efficiency, 0.5, 1, 'efficiency', 'Charging efficiency');
  const price = assertNonNegative(x.price_kwh, 'price_kwh', 'Electricity price');
  const [field, lo, hi] = CONS_FIELD[x.consumption_unit];
  const cons = assertRange(x[field], lo, hi, field, `Consumption, ${CONSUMPTION[x.consumption_unit].label}`);
  const whPerM = CONSUMPTION[x.consumption_unit].toWhPerM(cons);

  const eBat = cap * (s1 - s0);
  const eGrid = eBat / eta;
  const power = Math.min(pCharger, pCar);
  const time = (eGrid / power) * 3600;
  const cost = (eGrid / 1000) * price;
  const range = eBat / whPerM;
  const warnings = [];
  if (x.charger_type === 'dc' && s1 > 0.8) warnings.push('DC fast charging tapers above about 80 % state of charge: the last part takes much longer than this constant-power estimate.');
  if (x.charger_type === 'ac' && pCharger > 19200) warnings.push('AC Level 2 under SAE J1772 goes up to 80 A at 240 V, 19.2 kW; check the charger power.');
  if (x.charger_type === 'dc' && pCharger < 20000) warnings.push('DC chargers usually deliver 20 kW or more; check the charger type.');
  return {
    outputs: {
      battery_wh: eBat,
      grid_wh: eGrid,
      loss_wh: eGrid - eBat,
      power_w: power,
      limited_by: pCharger <= pCar ? 'The charger' : x.charger_type === 'ac' ? 'The car\'s onboard charger' : 'The car\'s maximum DC charging power',
      time_s: time,
      time_text: hoursMinutes(time),
      cost,
      range_m: range,
      range_rate_m_s: (power * eta) / whPerM / 3600,
      cost_per_km: (whPerM / eta) * price,
      cost_per_mi: ((whPerM / eta) * MI / 1000) * price,
    },
    warnings,
  };
}
