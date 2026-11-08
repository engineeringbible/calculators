/**
 * electricity-cost/calc.js — energy use and running cost of an appliance or a plant load per hour, day, month and
 * year, from its power, hours of use, duty cycle and the price per kWh.
 *
 * E_day = P × duty × hours per day;  E_month = E_day × (days per week / 7) × 30.4375;  cost = E × price.
 * Schema units: SI — W, s; energy returned in J (shown in kWh); price per kWh in any currency.
 */
import { withDefaults, assertNonNegative, assertRange } from '../shared/validate.js';

// Average year of 365.25 days (the Julian year, ISO 80000-3), and the average month a twelfth of it.
export const DAYS_PER_YEAR = 365.25;
export const DAYS_PER_MONTH = DAYS_PER_YEAR / 12;
const J_PER_KWH = 3.6e6;

export const schema = {
  id: 'electricity-cost',
  name: 'Electricity cost and energy use',
  category: 'electrical',
  summary: 'Energy use and running cost of any appliance or load per hour, day, month and year, from its power, hours of use and the price per kWh.',
  related: ['ohms-law', 'three-phase-power', 'generator-load', 'solar-pv-sizing'],
  assumptions: [
    'The power is the real power the load draws while it runs (the watts on the rating plate or measured with a plug-in meter); for motors and heaters on a thermostat, the duty cycle sets the share of time it actually draws that power.',
    'The price is a flat price per kWh; time-of-use tariffs, standing charges, demand charges and taxes are not included.',
    'A month is the average 30.44 days and a year 365.25 days; days per week below 7 scale both.',
    'Standby power can be added as a second load, entered with 24 hours a day.',
  ],
  notes: [
    'Verification 2026-11-07: a 2 kW heater 4 h a day at 0.25 per kWh uses 8 kWh and costs 2.00 a day, 730.50 a year (2 922 kWh). Checked by hand.',
  ],
  sources: [
    'IEC 60050-131 and ISO 80000-6: energy W = P t; 1 kWh = 3.6 MJ',
    'IEC 62301:2011 Household electrical appliances — Measurement of standby power (for the standby note)',
  ],
  inputs: [
    { id: 'power_w', label: 'Power while running P', group: 'power', unit: 'W', display: 'kW', default: 2000, min: 0, max: 1e9 },
    { id: 'hours_s', label: 'Hours of use per day', group: 'time', unit: 's', display: 'h', default: 4 * 3600, min: 0, max: 86400 },
    { id: 'days_per_week', label: 'Days of use per week', group: 'dimensionless', unit: 'none', default: 7, min: 0, max: 7 },
    { id: 'duty', label: 'Duty cycle (share of the time it draws full power)', group: 'ratio', unit: 'frac', display: 'pct', default: 1, min: 0, max: 1, help: 'A fridge compressor runs about 30–50 % of the time; a heater on a thermostat varies with the weather.' },
    { id: 'price', label: 'Price per kWh (your currency)', group: 'dimensionless', unit: 'none', default: 0.25, min: 0, max: 100 },
  ],
  outputs: [
    { id: 'energy_day_j', label: 'Energy per day of use', group: 'energy', unit: 'J', display: 'kWh' },
    { id: 'energy_month_j', label: 'Energy per month', group: 'energy', unit: 'J', display: 'kWh' },
    { id: 'energy_year_j', label: 'Energy per year', group: 'energy', unit: 'J', display: 'kWh' },
    { id: 'cost_hour', label: 'Cost per hour of running', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'cost_day', label: 'Cost per day of use', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'cost_month', label: 'Cost per month', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'cost_year', label: 'Cost per year', group: 'dimensionless', unit: 'none', decimals: 2 },
  ],
  example: {
    inputs: { power_w: [2, 'kW'], hours_s: [4, 'h'], days_per_week: 7, duty: [100, 'pct'], price: 0.25 },
    results: {
      energy_day_j: '8 kWh',
      energy_year_j: '2 922 kWh',
      cost_day: '2.00',
      cost_year: '730.50',
    },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const power = assertNonNegative(x.power_w, 'power_w', 'Power');
  const hours = assertRange(x.hours_s, 0, 86400, 'hours_s', 'Hours of use per day') / 3600;
  const days = assertRange(x.days_per_week, 0, 7, 'days_per_week', 'Days of use per week');
  const duty = assertRange(x.duty, 0, 1, 'duty', 'Duty cycle');
  const price = assertNonNegative(x.price, 'price', 'Price per kWh');
  const dayJ = power * duty * hours * 3600;
  const share = days / 7;
  const monthJ = dayJ * share * DAYS_PER_MONTH;
  const yearJ = dayJ * share * DAYS_PER_YEAR;
  const kwh = (j) => j / J_PER_KWH;
  const warnings = [];
  if (power > 50000 && hours >= 8) warnings.push('A large load running many hours: industrial tariffs usually add a demand charge on the peak kW, which this flat-rate estimate leaves out.');
  return {
    outputs: {
      energy_day_j: dayJ,
      energy_month_j: monthJ,
      energy_year_j: yearJ,
      cost_hour: kwh(power * duty * 3600) * price,
      cost_day: kwh(dayJ) * price,
      cost_month: kwh(monthJ) * price,
      cost_year: kwh(yearJ) * price,
    },
    warnings,
  };
}
