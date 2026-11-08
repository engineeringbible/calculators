/**
 * water-heating-time/calc.js — time to heat a tank of water with an electric element, a gas burner or a heat pump,
 * with the tank's standing loss, the energy and cost, and the recovery rate at a temperature rise.
 *
 * Energy balance m c dT/dt = P_heat − UA (T − T_room) gives T(t) = T_eq − (T_eq − T0) e^(−t/τ), τ = m c / UA,
 * T_eq = T_room + P_heat / UA, so t = τ ln[(T_eq − T0)/(T_eq − T1)]; without loss (UA = 0) t = m c (T1 − T0) / P_heat.
 * P_heat = η P (electric, gas) or COP × P (heat pump). Recovery = P_heat / (ρ c ΔT_rise).
 * Schema units: SI — m³, °C, K, W, s, J.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

/** Water at about 15 °C: density 999 kg/m³ (8.34 lb/US gal) and specific heat 4 186 J/(kg·K) (CRC Handbook). */
const RHO = 999;
const CP = 4186;
const GAL = 0.003785411784;

export const schema = {
  id: 'water-heating-time',
  name: 'Water heating time calculator (tank, element, gas or heat pump)',
  category: 'thermal',
  summary: 'Time to heat a water tank with an electric element, gas burner or heat pump, with standing loss, energy, cost and recovery rate in L/h or gal/h.',
  related: ['specific-heat', 'newtons-cooling', 'electricity-cost', 'carnot-cop'],
  assumptions: [
    'The tank is fully mixed: one water temperature throughout. A real tank stratifies, so hot water is available at the top well before the whole tank reaches the set point.',
    'Water has a density of 999 kg/m³ (8.34 lb per US gallon) and a specific heat of 4 186 J/(kg·K), i.e. 1 Btu/(lb·°F); both change by less than 2 % between 10 and 60 °C.',
    'Heat into the water is the input power times the efficiency (electric element 98 to 100 %, gas burner about 70 to 85 % recovery efficiency) or times the coefficient of performance for a heat pump. The COP is held constant, though it falls as the tank gets hotter.',
    'The standing loss is UA × (T − T_room) with a constant UA, so the temperature approaches T_room + P/UA exponentially. A tank losing S watts at 45 K above the room has UA = S / 45.',
    'The recovery rate is the volume heated through the given rise per hour with the full heater output, as manufacturers quote it; the standing loss is not deducted.',
  ],
  notes: [
    'Verification 2026-11-08: 50 US gal (189.1 kg) from 50 to 120 °F with a 4.5 kW element and UA = 2 W/K in a 68 °F room: 8.55 kWh into the water, 114.5 min, 8.59 kWh drawn, 1.29 at 0.15 per kWh; recovery 20.5 gal/h at 90 °F rise. Checked by hand.',
  ],
  sources: [
    'ASHRAE Handbook — HVAC Applications, chapter Service Water Heating (heater input, recovery efficiency and recovery rate)',
    'US DOE 10 CFR Part 430, Subpart B, Appendix E: uniform test method for water heaters (recovery efficiency, standby loss coefficient UA)',
    'F. P. Incropera et al., Fundamentals of Heat and Mass Transfer, 7th ed., Section 5.3 (energy balance of a lumped body with heat generation and convection)',
  ],
  inputs: [
    { id: 'heater', label: 'Heater', type: 'select', default: 'electric', options: [{ value: 'electric', label: 'Electric element' }, { value: 'gas', label: 'Gas or oil burner' }, { value: 'heatpump', label: 'Heat pump' }] },
    { id: 'power_w', label: 'Heater input power (electrical, or fuel input for gas)', group: 'power', unit: 'W', display: 'kW', default: 4500, min: 10, max: 1e7 },
    { id: 'eff_electric', label: 'Element efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 1, min: 0.5, max: 1, visibleWhen: { heater: 'electric' } },
    { id: 'eff_gas', label: 'Burner recovery efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 0.8, min: 0.3, max: 1.1, visibleWhen: { heater: 'gas' }, help: 'Atmospheric gas heaters about 76–80 %, condensing up to 96 % or more.' },
    { id: 'cop', label: 'Heat pump coefficient of performance (COP)', group: 'dimensionless', unit: 'none', default: 3, min: 1, max: 8, visibleWhen: { heater: 'heatpump' } },
    { id: 'volume_m3', label: 'Tank volume', group: 'volume', unit: 'm3', display: 'gal_us', default: 50 * GAL, min: 1e-4, max: 1000 },
    { id: 't_start_c', label: 'Starting (inlet) water temperature', group: 'temperature', unit: 'C', display: 'F', default: 10, min: 0, max: 99 },
    { id: 't_target_c', label: 'Target temperature', group: 'temperature', unit: 'C', display: 'F', default: 48.888888888889, min: 0.1, max: 99 },
    { id: 't_room_c', label: 'Room temperature around the tank', group: 'temperature', unit: 'C', display: 'F', default: 20, min: -30, max: 60 },
    { id: 'ua_w_k', label: 'Tank standing loss coefficient UA, W/K', group: 'dimensionless', unit: 'none', default: 2, min: 0, max: 1000, help: '0 for no loss. 1 W/K = 1.90 Btu/(h·°F). A tank losing 80 W at 45 K above the room has UA = 1.8 W/K.' },
    { id: 'price_kwh', label: 'Energy price per kWh of input (optional)', group: 'dimensionless', unit: 'none', default: 0.15, min: 0, max: 10, help: '1 therm of gas = 29.31 kWh.' },
    { id: 'rise_k', label: 'Temperature rise for the recovery rate', group: 'temperature_difference', unit: 'K', display: 'F', default: 50, min: 1, max: 100 },
  ],
  outputs: [
    { id: 'time_s', label: 'Time to reach the target', group: 'time', unit: 's', display: 'min' },
    { id: 'heat_water_j', label: 'Heat stored in the water m c ΔT', group: 'energy', unit: 'J', display: 'kWh' },
    { id: 'loss_j', label: 'Standing loss during heating', group: 'energy', unit: 'J', display: 'kWh' },
    { id: 'input_j', label: 'Energy drawn (electricity or fuel)', group: 'energy', unit: 'J', display: 'kWh' },
    { id: 'cost', label: 'Energy cost of one heat-up', group: 'money', unit: 'cur', decimals: 2 },
    { id: 'heat_rate_w', label: 'Heat into the water', group: 'power', unit: 'W', display: 'kW' },
    { id: 't_max_c', label: 'Highest temperature the heater can hold, T_room + P/UA (— above 100 °C)', group: 'temperature', unit: 'C', display: 'F' },
    { id: 'tau_s', label: 'Time constant of the tank m c / UA', group: 'time', unit: 's', display: 'h' },
    { id: 'recovery_gph', label: 'Recovery rate, US gal per hour', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'recovery_lph', label: 'Recovery rate, litres per hour', group: 'dimensionless', unit: 'none', decimals: 0 },
  ],
  example: {
    inputs: { heater: 'electric', power_w: [4.5, 'kW'], eff_electric: [100, 'pct'], volume_m3: [50, 'gal_us'], t_start_c: [50, 'F'], t_target_c: [120, 'F'], t_room_c: [68, 'F'], ua_w_k: 2, price_kwh: 0.15, rise_k: [90, 'F'] },
    results: { heat_water_j: '8.55 kWh', time_s: '114.5 min', input_j: '8.59 kWh', recovery_gph: '20.5', recovery_lph: '77' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.heater, ['electric', 'gas', 'heatpump'], 'heater', 'Heater');
  const p = assertRange(x.power_w, 10, 1e7, 'power_w', 'Heater input power');
  let factor;
  if (x.heater === 'electric') factor = assertRange(x.eff_electric, 0.5, 1, 'eff_electric', 'Element efficiency');
  else if (x.heater === 'gas') factor = assertRange(x.eff_gas, 0.3, 1.1, 'eff_gas', 'Burner recovery efficiency');
  else factor = assertRange(x.cop, 1, 8, 'cop', 'Heat pump COP');
  const v = assertPositive(x.volume_m3, 'volume_m3', 'Tank volume');
  const t0 = assertRange(x.t_start_c, 0, 99, 't_start_c', 'Starting water temperature');
  const t1 = assertRange(x.t_target_c, 0.1, 99, 't_target_c', 'Target temperature');
  const tr = assertRange(x.t_room_c, -30, 60, 't_room_c', 'Room temperature');
  const ua = assertRange(x.ua_w_k, 0, 1000, 'ua_w_k', 'Tank standing loss coefficient UA');
  const price = assertNonNegative(x.price_kwh, 'price_kwh', 'Energy price');
  const rise = assertRange(x.rise_k, 1, 100, 'rise_k', 'Temperature rise for the recovery rate');
  if (t1 <= t0) throw new Error('Target temperature: it must be above the starting temperature.');
  const m = RHO * v;
  const mc = m * CP;
  const ph = p * factor;
  const tEq = ua > 0 ? tr + ph / ua : Infinity;
  const warnings = [];
  let time = null;
  if (ua === 0) time = (mc * (t1 - t0)) / ph;
  else if (t1 < tEq) time = (mc / ua) * Math.log((tEq - t0) / (tEq - t1));
  else warnings.push('The target is at or above the highest temperature the heater can hold against the standing loss: it is never reached. Use a larger heater or insulate the tank.');
  const stored = mc * (t1 - t0);
  const input = time === null ? null : p * time;
  if (time !== null && time > 2 * 86400) warnings.push('Heating takes more than two days: check the heater power and tank size.');
  if (x.heater === 'heatpump' && t1 > 65) warnings.push('Above 65 °C most heat pumps cannot reach the temperature on their own and use a backup element; the COP also falls as the water gets hotter.');
  const recovery = ph / (RHO * CP * rise) * 3600; // m³/h
  return {
    outputs: {
      time_s: time,
      heat_water_j: stored,
      loss_j: time === null ? null : ph * time - stored,
      input_j: input,
      cost: input === null ? null : (input / 3.6e6) * price,
      heat_rate_w: ph,
      t_max_c: ua > 0 && tEq <= 100 ? tEq : null,
      tau_s: ua > 0 ? mc / ua : null,
      recovery_gph: recovery / GAL,
      recovery_lph: recovery * 1000,
    },
    warnings,
  };
}
