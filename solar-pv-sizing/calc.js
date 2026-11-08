/**
 * solar-pv-sizing/calc.js — off-grid (stand-alone) photovoltaic system sizing: array peak power from the daily load,
 * peak sun hours and system losses, module count, battery bank for days of autonomy and depth of discharge, charge
 * controller and inverter ratings, and the energy balance.
 *
 * P_array = E_day/(PSH η_sys);  C_bank = E_day × days/(DoD × η_inv);  I_ctrl = N_par I_sc × 1.25 (PWM) or P_array/V_bat × 1.25 (MPPT).
 * Schema units: Wh (display kWh), W (display kW), V, A, h.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

export const BATTERY_TYPES = {
  lead_acid: { label: 'Lead-acid (flooded/AGM): 50 % depth of discharge', dod: 0.5 },
  lifepo4: { label: 'Lithium iron phosphate: 80 % depth of discharge', dod: 0.8 },
  custom: { label: 'Custom depth of discharge', dod: null },
};

export const schema = {
  id: 'solar-pv-sizing',
  name: 'Solar PV array and storage sizing',
  category: 'electrical',
  summary: 'Array size from daily load, peak sun hours and system losses; battery storage for days of autonomy; charge controller current.',
  related: ['battery-runtime', 'cable-sizing', 'lighting-lumen', 'generator-load'],
  assumptions: [
    'Energy-balance sizing for a stand-alone system: the array must deliver the daily load energy at the design month\'s peak sun hours (PSH, kWh/m²/day of irradiation on the array plane = equivalent hours at 1 000 W/m²) after the system losses — module temperature, soiling, mismatch, wiring, controller and inverter efficiency, battery round-trip — combined into one derating factor (0.70–0.80 typical; NREL PVWatts default 0.86 for grid-tied without batteries, 0.77 historic).',
    'Design month = the month with the lowest PSH for the load profile (winter for a constant load), with an optional design margin; the array is not oversized for cloudy-day recovery beyond that margin — cloudy spells are covered by the battery autonomy.',
    'Battery bank capacity from the daily load × days of autonomy ÷ (depth of discharge × inverter efficiency), at the nominal bank voltage in Ah; lead-acid 50 % DoD (cycle life) and lithium iron phosphate 80 %; the battery round-trip loss is already inside the system efficiency and is not applied again; the Peukert rate effect, temperature derating (lead-acid loses capacity in the cold) and ageing are covered only by the user\'s margin.',
    'Recharge time: the design-month surplus (daily yield minus daily load, both as energy delivered to the loads) is what refills the bank, so recharge days = usable capacity / surplus; at a 100 % energy balance the bank never recovers, which is why an array margin or a backup generator is needed.',
    'Charge controller: PWM controllers pass the array current, so the rating is the parallel-string short-circuit current × 1.25 (NEC 690.8 continuous-duty factor); MPPT controllers are rated by output current P_array/V_bat × 1.25 and by the maximum array open-circuit voltage at the coldest temperature (V_oc × (1 + β_Voc ΔT)), which the page estimates with a −0.3 %/K coefficient.',
    'Inverter: continuous rating from the peak AC load with a 25 % margin; surge (motor starting) and power factor are not modelled beyond the user\'s peak load entry.',
    'Module data at STC (1 000 W/m², 25 °C); series/parallel arrangement chosen to approach the array power with the given module, the string voltage limited by the controller\'s maximum input voltage entered.',
  ],
  notes: [
    'Verification 2026-10-31: the published calculator case 8.5 kWh/day, 4.8 PSH, 75 % efficiency → 2.36 kW_p is reproduced (2.361 kW); 10 kWh/day, 2 days, 80 % DoD → 25 kWh of storage (per the Vatrer example, before inverter losses); 1 kW of 400 W modules → 3 modules.',
    'Design decision: losses are a single system efficiency because stand-alone sizing guides (IEEE 1562, Sandia) work that way; the register lists the components it covers.',
  ],
  sources: [
    'IEEE Std 1562-2007 Guide for Array and Battery Sizing in Stand-Alone Photovoltaic Systems; IEEE 1013 (lead-acid battery sizing for PV)',
    'Sandia National Laboratories, Stand-Alone Photovoltaic Systems — A Handbook of Recommended Design Practices (SAND87-7023)',
    'NREL PVWatts technical reference (system losses, derating); NEC Article 690.8 (125 % continuous current factor)',
    'Firgelli / Vatrer / RenewableWise off-grid sizing examples (8.5 kWh/day, 4.8 PSH, 75 % → 2.36 kW; 10 kWh, 2 days, 80 % DoD → 25 kWh) — used as check cases',
  ],
  inputs: [
    { id: 'daily_load_wh', label: 'Daily energy consumption (AC + DC loads)', group: 'energy', unit: 'Wh', display: 'kWh', default: 8500, min: 10, max: 1e7 },
    { id: 'peak_load_w', label: 'Peak simultaneous AC load (inverter sizing)', group: 'power', unit: 'W', default: 3000, min: 0, max: 1e6 },
    { id: 'psh_h', label: 'Peak sun hours of the design month (kWh/m²/day on the array plane)', group: 'time', unit: 'h', default: 4.8, min: 0.5, max: 9 },
    { id: 'system_efficiency', label: 'Overall system efficiency (temperature, soiling, wiring, controller, battery, inverter)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.75, min: 0.4, max: 0.95 },
    { id: 'design_margin_pct', label: 'Design margin on the array', group: 'ratio', unit: 'pct', default: 15, min: 0, max: 100 },
    { id: 'module_w', label: 'Module rated power (STC)', group: 'power', unit: 'W', default: 400, min: 10, max: 1000 },
    { id: 'module_voc_v', label: 'Module open-circuit voltage V_oc (STC)', group: 'voltage', unit: 'V', default: 49, min: 5, max: 120 },
    { id: 'module_isc_a', label: 'Module short-circuit current I_sc (STC)', group: 'current', unit: 'A', default: 10.5, min: 0.1, max: 30 },
    { id: 'modules_series', label: 'Modules in series per string', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 30, integer: true },
    { id: 'min_temp_c', label: 'Lowest expected module temperature (V_oc rise)', group: 'temperature', unit: 'C', default: -5, min: -40, max: 40 },
    { id: 'controller_max_v', label: 'Charge controller maximum PV input voltage', group: 'voltage', unit: 'V', default: 150, min: 20, max: 1000 },
    { id: 'controller_type', label: 'Charge controller type', type: 'select', default: 'mppt', options: [{ value: 'mppt', label: 'MPPT (rated by output current at battery voltage)' }, { value: 'pwm', label: 'PWM (rated by array short-circuit current)' }] },
    { id: 'battery_v', label: 'Battery bank nominal voltage', group: 'voltage', unit: 'V', default: 48, min: 12, max: 800 },
    { id: 'battery_type', label: 'Battery type', type: 'select', default: 'lifepo4', options: Object.entries(BATTERY_TYPES).map(([value, b]) => ({ value, label: b.label })) },
    { id: 'dod_custom', label: 'Custom depth of discharge', group: 'ratio', unit: 'frac', display: 'pct', default: 0.6, min: 0.1, max: 1, visibleWhen: { battery_type: 'custom' } },
    { id: 'autonomy_days', label: 'Days of autonomy (no sun)', group: 'dimensionless', unit: 'none', default: 2, min: 0.5, max: 14 },
    { id: 'inverter_eff', label: 'Inverter efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 0.92, min: 0.7, max: 1 },
  ],
  outputs: [
    { id: 'array_w', label: 'Array peak power required P = E/(PSH η) × (1 + margin)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'array_w_no_margin', label: 'Array peak power without margin', group: 'power', unit: 'W', display: 'kW' },
    { id: 'modules', label: 'Modules required', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'strings', label: 'Parallel strings (of the series count entered)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'array_installed_w', label: 'Installed array power', group: 'power', unit: 'W', display: 'kW' },
    { id: 'daily_yield_wh', label: 'Expected daily yield in the design month (installed × PSH × η)', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'energy_balance_pct', label: 'Daily yield / daily load', group: 'ratio', unit: 'pct' },
    { id: 'string_voc_cold_v', label: 'String V_oc at the lowest temperature (−0.3 %/K)', group: 'voltage', unit: 'V' },
    { id: 'voc_check', label: 'Controller input voltage check', type: 'text' },
    { id: 'controller_a', label: 'Charge controller rated current (× 1.25)', group: 'current', unit: 'A' },
    { id: 'battery_wh', label: 'Battery bank nominal capacity', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'battery_ah', label: 'Battery bank capacity at the bank voltage', group: 'dimensionless', unit: 'none', help: 'Ah' },
    { id: 'usable_wh', label: 'Usable energy (capacity × DoD)', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'daily_charge_a', label: 'Average charge current from the array at the bank voltage', group: 'current', unit: 'A' },
    { id: 'charge_rate_c', label: 'Charge rate relative to capacity (C-rate)', group: 'dimensionless', unit: 'none' },
    { id: 'recharge_days', label: 'Days of good sun to recharge the bank from the DoD with the load running', group: 'dimensionless', unit: 'none' },
    { id: 'inverter_w', label: 'Inverter continuous rating (peak load × 1.25)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'inverter_dc_a', label: 'Inverter DC input current at peak load', group: 'current', unit: 'A' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      array_w_no_margin: '2 361 W',
      array_installed_w: '3.2 kW',
      string_voc_cold_v: '107 V',
      battery_wh: '23.1 kWh',
      battery_ah: '481',
      usable_wh: '18.5 kWh',
      inverter_w: '3.75 kW',
      inverter_dc_a: '68 A',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.daily_load_wh, 'daily_load_wh', 'Daily load');
  assertNonNegative(i.peak_load_w, 'peak_load_w', 'Peak load');
  assertPositive(i.psh_h, 'psh_h', 'Peak sun hours');
  assertRange(i.system_efficiency, 0.2, 1, 'system_efficiency', 'System efficiency');
  assertNonNegative(i.design_margin_pct, 'design_margin_pct', 'Design margin');
  assertPositive(i.module_w, 'module_w', 'Module power');
  assertPositive(i.module_voc_v, 'module_voc_v', 'Module V_oc');
  assertPositive(i.module_isc_a, 'module_isc_a', 'Module I_sc');
  assertInteger(i.modules_series, 'modules_series', 'Modules in series');
  assertRange(i.modules_series, 1, 50, 'modules_series', 'Modules in series');
  assertPositive(i.controller_max_v, 'controller_max_v', 'Controller voltage');
  assertOneOf(i.controller_type, ['mppt', 'pwm'], 'controller_type', 'Controller type');
  assertPositive(i.battery_v, 'battery_v', 'Battery voltage');
  assertOneOf(i.battery_type, Object.keys(BATTERY_TYPES), 'battery_type', 'Battery type');
  assertPositive(i.autonomy_days, 'autonomy_days', 'Autonomy');
  assertRange(i.inverter_eff, 0.5, 1, 'inverter_eff', 'Inverter efficiency');

  const bat = BATTERY_TYPES[i.battery_type];
  const dod = i.battery_type === 'custom' ? assertRange(i.dod_custom, 0.05, 1, 'dod_custom', 'Depth of discharge') : bat.dod;

  const arrayNoMargin = i.daily_load_wh / (i.psh_h * i.system_efficiency);
  const arrayW = arrayNoMargin * (1 + i.design_margin_pct / 100);
  const stringW = i.module_w * i.modules_series;
  const strings = Math.max(1, Math.ceil(arrayW / stringW - 1e-9));
  const modules = strings * i.modules_series;
  const installed = modules * i.module_w;
  const yieldWh = installed * i.psh_h * i.system_efficiency;
  const vocCold = i.module_voc_v * i.modules_series * (1 + 0.003 * (25 - i.min_temp_c));
  const vocCheck = vocCold <= i.controller_max_v ? `OK — string V_oc ${vocCold.toFixed(0)} V at ${i.min_temp_c} °C ≤ ${i.controller_max_v} V` : `EXCEEDED — string V_oc ${vocCold.toFixed(0)} V at ${i.min_temp_c} °C > controller ${i.controller_max_v} V: fewer modules in series`;
  const controllerA = i.controller_type === 'pwm' ? strings * i.module_isc_a * 1.25 : (installed / i.battery_v) * 1.25;
  const batteryWh = (i.daily_load_wh * i.autonomy_days) / (dod * i.inverter_eff);
  const batteryAh = batteryWh / i.battery_v;
  const usableWh = batteryWh * dod;
  const dailyChargeA = yieldWh / i.psh_h / i.battery_v;
  const cRate = dailyChargeA / batteryAh;
  const surplusPerDay = yieldWh - i.daily_load_wh;
  const rechargeDays = surplusPerDay > 1e-6 * i.daily_load_wh ? usableWh / surplusPerDay : null;
  const inverterW = i.peak_load_w * 1.25;
  const inverterDcA = i.peak_load_w / (i.inverter_eff * i.battery_v);

  const warnings = [];
  if (vocCold > i.controller_max_v) warnings.push('Cold-weather open-circuit voltage exceeds the controller limit: reduce the series count or choose a higher-voltage controller.');
  if (rechargeDays === null) warnings.push('The array cannot recharge the bank while carrying the load (design-month yield at or below the daily load): increase the array or the margin.');
  else if (rechargeDays > 5) warnings.push(`Recharging the bank from ${(dod * 100).toFixed(0)} % DoD takes ${rechargeDays.toFixed(1)} days of design-month sun with the load running: consider a larger array or a generator.`);
  if (cRate < 0.05 && i.battery_type === 'lead_acid') warnings.push('Charge rate below C/20 for lead-acid: sulphation risk from chronic undercharging; add array or reduce the bank.');
  if (i.system_efficiency > 0.85) warnings.push('System efficiency above 85 % is optimistic for a battery system (temperature, soiling, wiring, controller, battery and inverter losses).');
  if (i.autonomy_days < 1) warnings.push('Less than one day of autonomy: a single cloudy day will empty the bank.');
  warnings.push('Design-month energy balance: use the month with the lowest peak sun hours for the load; summer surplus is curtailed.');
  warnings.push('Battery temperature derating, ageing and the Peukert effect are inside your margin; the battery-runtime calculator covers Peukert for the discharge side.');

  return {
    outputs: {
      array_w: arrayW,
      array_w_no_margin: arrayNoMargin,
      modules,
      strings,
      array_installed_w: installed,
      daily_yield_wh: yieldWh,
      energy_balance_pct: (yieldWh / i.daily_load_wh) * 100,
      string_voc_cold_v: vocCold,
      voc_check: vocCheck,
      controller_a: controllerA,
      battery_wh: batteryWh,
      battery_ah: batteryAh,
      usable_wh: usableWh,
      daily_charge_a: dailyChargeA,
      charge_rate_c: cRate,
      recharge_days: rechargeDays,
      inverter_w: inverterW,
      inverter_dc_a: inverterDcA,
    },
    warnings,
  };
}
