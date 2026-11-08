/**
 * fuel-changeover/calc.js — time for the fuel at the engines to reach a sulphur limit after changing over to a
 * compliant fuel: plug flow through the line to the mixing point, then first-order dilution of the booster circuit,
 * with the feed blended gradually when an instant switch would change the fuel temperature faster than allowed.
 *
 * Q = consumption / density;  τ = V_circuit / Q;  delay = V_line / Q
 * new-fuel fraction y(t): instant switch 1 − e^(−t/τ); ramp of length t_r: (t − τ(1 − e^(−t/τ))) / t_r up to t_r,
 * then 1 − (τ/t_r)(e^(−(t−t_r)/τ) − e^(−t/τ));  S = S_old − (S_old − S_new) y;  T = T_old − (T_old − T_new) y
 * Schema units: % m/m, t/h, kg/m³, m³, °C, °C/min, minutes, knots.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange } from '../shared/validate.js';

const MAX_TABLE_ROWS = 30;
const TABLE_STEPS_MIN = [1, 2, 5, 10, 15, 20, 30, 60, 120, 240];

export const schema = {
  id: 'fuel-changeover',
  name: 'Fuel changeover before an ECA',
  category: 'maritime',
  summary: 'Time and distance before an emission control area to start the changeover so that the fuel at the engines meets the sulphur limit, within the temperature rate.',
  related: ['fuel-blend-heating', 'fuel-voyage-cost', 'bunker-quantity', 'passage-plan'],
  assumptions: [
    'The changeover is a dilution of the fuel already in the booster circuit (MAN Diesel & Turbo 5212208-3): the new fuel first fills the line to the mixing point (plug flow, delay V_line/Q), then mixes with the circuit volume, which is treated as one well-stirred volume with residence time τ = V/Q, Q being the fuel consumed from the circuit.',
    'The engines keep burning at the entered rate during the changeover, and the circuit volume is constant; sulphur and temperature of the mixture follow the new-fuel fraction linearly (equal specific heats, no heater or cooler action, no heat loss).',
    'The temperature at the fuel pump inlet should change by no more than 2 °C/min to avoid thermal shock and sticking of the fuel pumps (MAN 5212208-3), and the viscosity should stay between 2 and 20 cSt. When an instant switch would exceed the limit, the feed is blended linearly over the shortest time that keeps the rate within it.',
    'MARPOL Annex VI regulation 14.6: a written changeover procedure must allow enough time for the fuel oil service system to be fully flushed of non-compliant fuel before entering the ECA, and the tank volumes, date, time and position at completion are logged.',
  ],
  notes: [
    'Verification 2026-10-31: 2 t/h of fuel at 900 kg/m³ through a 3 m³ circuit gives τ = 1.35 h; from 0.50 % to a 0.05 % fuel the 0.10 % limit is reached after the 0.09 h line delay plus τ ln(9) ≈ 2.97 h; an instant switch would cool the fuel by 70 °C at 0.86 °C/min, within the 2 °C/min limit, so no blending is needed.',
    'Design decision: the circuit is modelled as one mixed volume because the circulating booster pumps return several times the consumption to the mixing tank; a long, unmixed pipe run belongs in the line volume.',
  ],
  sources: [
    'MAN Diesel & Turbo, Fuel oil change-over procedure, item 5212208-3 (2010) — dilution in the booster circuit, 2 °C/min, 2–20 cSt',
    'MARPOL Annex VI, regulation 14.6 — written changeover procedure, flushing before entry, log-book entries',
    'O. Levenspiel, Chemical Reaction Engineering, 3rd ed., Wiley 1999, chapter 11 — residence time distribution and response of a stirred volume',
  ],
  inputs: [
    { id: 'sulphur_old_pct', label: 'Sulphur of the fuel in use', group: 'ratio', unit: 'pct', default: 0.5, min: 0, max: 5 },
    { id: 'sulphur_new_pct', label: 'Sulphur of the compliant fuel', group: 'ratio', unit: 'pct', default: 0.05, min: 0, max: 5 },
    { id: 'sulphur_limit_pct', label: 'Sulphur limit to meet', group: 'ratio', unit: 'pct', default: 0.1, min: 0, max: 5 },
    { id: 'consumption_t_h', label: 'Fuel consumed from the circuit', group: 'mass_flow', unit: 't_h', default: 2, min: 0.01, max: 50 },
    { id: 'density_kg_m3', label: 'Fuel density', group: 'density', unit: 'kg_m3', default: 900, min: 700, max: 1010 },
    { id: 'circuit_volume_m3', label: 'Mixing volume of the booster circuit', group: 'volume', unit: 'm3', default: 3, min: 0.01, max: 100 },
    { id: 'line_volume_m3', label: 'Line volume from the changeover valve to the mixing point', group: 'volume', unit: 'm3', default: 0.2, min: 0, max: 50 },
    { id: 'temp_old_c', label: 'Temperature of the fuel in use at the pumps', group: 'temperature', unit: 'C', default: 110, min: 0, max: 160 },
    { id: 'temp_new_c', label: 'Temperature of the compliant fuel', group: 'temperature', unit: 'C', default: 40, min: 0, max: 160 },
    { id: 'max_rate_c_min', label: 'Maximum rate of temperature change', group: 'temperature_rate', unit: 'C_min', default: 2, min: 0.1, max: 20 },
    { id: 'margin_min', label: 'Safety margin before the boundary', group: 'time', unit: 'min', default: 15, min: 0, max: 600 },
    { id: 'ship_speed_kn', label: 'Ship speed', group: 'speed', unit: 'kn', default: 14, min: 0, max: 40 },
  ],
  outputs: [
    { id: 'residence_time_h', label: 'Residence time of the circuit τ', group: 'time', unit: 'h' },
    { id: 'blend_time_h', label: 'Blending time for the temperature limit (0 = switch at once)', group: 'time', unit: 'h' },
    { id: 'max_rate_c_min', label: 'Largest rate of temperature change', group: 'temperature_rate', unit: 'C_min' },
    { id: 'flush_time_h', label: 'Time from start to the sulphur limit', group: 'time', unit: 'h' },
    { id: 'start_before_h', label: 'Start the changeover before the boundary', group: 'time', unit: 'h' },
    { id: 'start_distance_nmi', label: 'Distance before the boundary', group: 'length', unit: 'nmi' },
    { id: 'changeover_table', label: 'Fuel at the engines after the start', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      residence_time_h: '1.35 h',
      max_rate_c_min: '0.86 °C/min',
      flush_time_h: '3.06 h',
      start_before_h: '3.31 h',
      start_distance_nmi: '46.3 nmi',
    },
  },
};

/** New-fuel fraction at the engines t hours after the end of the line delay. */
export function newFuelFraction(t, tau, blend) {
  if (t <= 0) return 0;
  if (blend <= 0) return 1 - Math.exp(-t / tau);
  if (t <= blend) return (t - tau * (1 - Math.exp(-t / tau))) / blend;
  return 1 - (tau / blend) * (Math.exp(-(t - blend) / tau) - Math.exp(-t / tau));
}

/** Shortest linear blend (h) keeping |ΔT| (1 − e^(−t_r/τ)) / t_r within the rate limit (°C/h). */
function blendTime(deltaT, tau, rateLimit) {
  if (Math.abs(deltaT) / tau <= rateLimit) return 0;
  const excess = (tr) => (Math.abs(deltaT) * (1 - Math.exp(-tr / tau))) / tr - rateLimit;
  let lo = 0;
  let hi = Math.abs(deltaT) / rateLimit;
  for (let k = 0; k < 100; k += 1) {
    const mid = (lo + hi) / 2;
    if (excess(mid) > 0) lo = mid;
    else hi = mid;
  }
  return hi;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertRange(i.sulphur_old_pct, 0, 10, 'sulphur_old_pct', 'Sulphur of the fuel in use');
  assertRange(i.sulphur_new_pct, 0, 10, 'sulphur_new_pct', 'Sulphur of the compliant fuel');
  assertRange(i.sulphur_limit_pct, 0, 10, 'sulphur_limit_pct', 'Sulphur limit');
  if (i.sulphur_new_pct >= i.sulphur_limit_pct) throw new Error('The new fuel must have less sulphur than the limit, or the limit is never reached');
  if (i.sulphur_old_pct <= i.sulphur_limit_pct) throw new Error('The fuel in use already meets the limit: no changeover is needed');
  assertPositive(i.consumption_t_h, 'consumption_t_h', 'Fuel consumption');
  assertPositive(i.density_kg_m3, 'density_kg_m3', 'Fuel density');
  assertPositive(i.circuit_volume_m3, 'circuit_volume_m3', 'Circuit volume');
  assertNonNegative(i.line_volume_m3, 'line_volume_m3', 'Line volume');
  assertRange(i.temp_old_c, -20, 200, 'temp_old_c', 'Temperature of the fuel in use');
  assertRange(i.temp_new_c, -20, 200, 'temp_new_c', 'Temperature of the compliant fuel');
  assertPositive(i.max_rate_c_min, 'max_rate_c_min', 'Maximum rate of temperature change');
  assertNonNegative(i.margin_min, 'margin_min', 'Safety margin');
  assertNonNegative(i.ship_speed_kn, 'ship_speed_kn', 'Ship speed');

  const flow = (i.consumption_t_h * 1000) / i.density_kg_m3;
  const tau = i.circuit_volume_m3 / flow;
  const delay = i.line_volume_m3 / flow;
  const deltaT = i.temp_old_c - i.temp_new_c;
  const blend = blendTime(deltaT, tau, i.max_rate_c_min * 60);
  const maxRate = blend > 0 ? (Math.abs(deltaT) * (1 - Math.exp(-blend / tau))) / blend / 60 : Math.abs(deltaT) / tau / 60;
  const needed = (i.sulphur_old_pct - i.sulphur_limit_pct) / (i.sulphur_old_pct - i.sulphur_new_pct);
  let lo = 0;
  let hi = blend + tau;
  while (newFuelFraction(hi, tau, blend) < needed) hi *= 2;
  for (let k = 0; k < 100; k += 1) {
    const mid = (lo + hi) / 2;
    if (newFuelFraction(mid, tau, blend) < needed) lo = mid;
    else hi = mid;
  }
  const flush = delay + hi;
  const startBefore = flush + i.margin_min / 60;
  const at = (hours) => {
    const y = newFuelFraction(hours - delay, tau, blend);
    return [hours * 60, y * 100, i.sulphur_old_pct - (i.sulphur_old_pct - i.sulphur_new_pct) * y, i.temp_old_c - deltaT * y];
  };
  const step = TABLE_STEPS_MIN.find((s) => (flush * 60) / s <= MAX_TABLE_ROWS - 2) ?? TABLE_STEPS_MIN[TABLE_STEPS_MIN.length - 1];
  const rows = [];
  for (let m = 0; m < flush * 60; m += step) rows.push(at(m / 60));
  rows.push(at(flush));

  const warnings = [];
  if (blend > 0) warnings.push(`Switching at once would change the fuel temperature by ${((Math.abs(deltaT) / tau) / 60).toFixed(1)} °C/min; blend the new fuel in over ${(blend * 60).toFixed(0)} min, or use the heater to control the rate.`);
  if (i.temp_new_c < i.temp_old_c) warnings.push('Check that the viscosity at the engine inlet stays above 2 cSt as the fuel cools; a cooler may be needed for the compliant fuel (MAN 5212208-3).');
  if (i.margin_min === 0) warnings.push('No safety margin: the fuel reaches the limit exactly at the boundary.');
  warnings.push('Check the compatibility of the two fuels before mixing them in the circuit, and watch the filters during the changeover.');

  return {
    outputs: {
      residence_time_h: tau,
      blend_time_h: blend,
      max_rate_c_min: maxRate,
      flush_time_h: flush,
      start_before_h: startBefore,
      start_distance_nmi: startBefore * i.ship_speed_kn,
      changeover_table: {
        columns: ['Time from start (min)', 'New fuel at the engines (%)', 'Sulphur (% m/m)', 'Temperature (°C)'],
        rows,
      },
      summary: `Circuit residence time ${(tau * 60).toFixed(0)} min${blend > 0 ? `, blend over ${(blend * 60).toFixed(0)} min` : ''}: the fuel at the engines reaches ${i.sulphur_limit_pct} % S after ${(flush * 60).toFixed(0)} min. Start the changeover ${(startBefore * 60).toFixed(0)} min (${(startBefore * i.ship_speed_kn).toFixed(1)} nmi at ${i.ship_speed_kn} kn) before the ECA boundary.`,
    },
    warnings,
  };
}
