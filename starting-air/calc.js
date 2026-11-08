/**
 * starting-air/calc.js — starting air receiver capacity for the consecutive starts of IACS UR M61 and the compressor
 * capacity to charge the receivers from atmospheric pressure within one hour.
 *
 * usable free air per m³ of receiver from p1 down to p2 (absolute): u = p1 (1 − (p2/p1)^(1/n)) / p_atm
 * required starts = engines × (12 reversible | 6 non-reversible);  air = starts × air per start + other consumers
 * receiver volume = air / u;  compressor = free air to charge the receivers to the pressure that holds the starts / 1 h
 * Schema units: m³ (receiver volume and free air at atmospheric pressure), bar (gauge), hours.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

const P_ATM_BAR = 1.01325;
const STARTS = { reversible: 12, non_reversible: 6 };

export const schema = {
  id: 'starting-air',
  name: 'Starting air receivers and compressors',
  category: 'maritime',
  summary: 'Receiver capacity for the consecutive engine starts of IACS UR M61 and the compressor capacity to charge the receivers from atmospheric pressure in one hour.',
  related: ['co2-fire-system', 'engine-bmep', 'pressure-vessel', 'tank-volume'],
  sendTo: [
    {
      target: 'co2-fire-system',
      label: 'CO₂ quantity for the engine room with these receivers',
      note: 'The installed receiver volume and its maximum pressure; their free air is added to the machinery space volume (FSS 2.1.1.2).',
      links: [
        { to: 'space_type', value: 'machinery' },
        { to: 'receivers', value: 'add' },
        { to: 'receiver_volume_m3', from: 'input:installed_volume_m3' },
        { to: 'receiver_pressure_bar', from: 'input:p_max_bar' },
      ],
    },
  ],
  assumptions: [
    'IACS UR M61 (Rev.3, 2024): the receivers must give, without replenishment, at least 12 consecutive starts alternately ahead and astern of each reversible main engine and 6 starts of each non-reversible main engine driving a controllable pitch propeller or other device that allows a start without opposite torque, plus the air of other consumers connected to them; for multi-engine plants the Society may agree to fewer starts per engine.',
    'At least two receivers of about equal capacity (M61.1.4) and two or more compressors, at least one driven independently of the main engine with not less than 50 % of the total required capacity (M61.1.2); the total compressor capacity must supply within one hour the air needed for the starts by charging the receivers from atmospheric pressure, divided about equally between the compressors (M61.1.3).',
    'Usable free air between the maximum and the minimum starting pressure for expansion with exponent n: u = p1 (1 − (p2/p1)^(1/n)) / p_atm per m³ of receiver, absolute pressures; n = 1 assumes the air regains the ambient temperature between starts (isothermal), n = 1.4 a rapid adiabatic sequence. Charging is taken as isothermal.',
    'The air per start and the minimum starting pressure come from the engine maker; free air is measured at atmospheric pressure and the receiver temperature.',
  ],
  notes: [
    'Verification 2026-10-31: 12 starts of 3 m³ between 30 and 12 bar gauge need 36 m³ of free air and 2.027 m³ of receivers (two of 1.013 m³) isothermally; 2.5 m³ installed give 14.8 starts and must be charged to 26.59 bar for the 12 starts, 65.6 m³ of free air from atmospheric pressure, i.e. 65.6 m³/h in one hour.',
    'Design decision: the compressor capacity is given both to the pressure that holds the required starts (the UR M61.1.3 minimum) and to the maximum working pressure, which the compressors usually also have to reach.',
  ],
  sources: [
    'IACS, Unified Requirement M61 Starting arrangements of internal combustion engines, Rev.3 (Feb 2024) — M61.1.2 to M61.1.5',
    'IMO, FSS Code chapter 5, 2.1.1.2 — free air of the starting air receivers added to the machinery space volume for the CO₂ quantity',
  ],
  inputs: [
    {
      id: 'engine_type',
      label: 'Main engines',
      type: 'select',
      default: 'reversible',
      options: [
        { value: 'reversible', label: 'Reversible (12 starts ahead and astern)' },
        { value: 'non_reversible', label: 'Non-reversible with CPP or clutch (6 starts)' },
        { value: 'custom', label: 'Starts agreed with the Society' },
      ],
    },
    { id: 'number_of_engines', label: 'Number of main engines', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 8, integer: true },
    { id: 'custom_starts', label: 'Starts per engine agreed with the Society', group: 'dimensionless', unit: 'none', default: 12, min: 1, max: 30, visibleWhen: { engine_type: 'custom' }, integer: true },
    { id: 'air_per_start_m3', label: 'Free air per start (engine maker)', group: 'volume', unit: 'm3', default: 3, min: 0.01, max: 200 },
    { id: 'other_air_m3', label: 'Free air of other consumers during the starts', group: 'volume', unit: 'm3', default: 0, min: 0, max: 1000 },
    { id: 'p_max_bar', label: 'Maximum receiver pressure (gauge)', group: 'pressure', unit: 'bar', default: 30, min: 1, max: 60 },
    { id: 'p_min_bar', label: 'Minimum starting pressure (gauge)', group: 'pressure', unit: 'bar', default: 12, min: 0, max: 60 },
    { id: 'polytropic_n', label: 'Expansion exponent n (1 isothermal, 1.4 adiabatic)', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 1.4 },
    { id: 'number_of_receivers', label: 'Number of receivers', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 10, integer: true },
    { id: 'installed_volume_m3', label: 'Installed receiver volume (total)', group: 'volume', unit: 'm3', default: 2.5, min: 0.01, max: 500 },
    { id: 'number_of_compressors', label: 'Number of compressors (excluding emergency)', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 6, integer: true },
    { id: 'charge_time_h', label: 'Charging time from atmospheric pressure', group: 'time', unit: 'h', default: 1, min: 0.1, max: 10 },
  ],
  outputs: [
    { id: 'starts_required', label: 'Consecutive starts required', group: 'dimensionless', unit: 'none' },
    { id: 'free_air_required_m3', label: 'Free air required', group: 'volume', unit: 'm3' },
    { id: 'receiver_volume_m3', label: 'Receiver volume required (total)', group: 'volume', unit: 'm3' },
    { id: 'each_receiver_m3', label: 'Each receiver', group: 'volume', unit: 'm3' },
    { id: 'starts_available', label: 'Starts from the installed receivers', group: 'dimensionless', unit: 'none' },
    { id: 'charge_pressure_bar', label: 'Pressure that holds the required starts (gauge)', group: 'pressure', unit: 'bar' },
    { id: 'compressor_m3_h', label: 'Compressor capacity, total (to that pressure)', group: 'volume_flow', unit: 'm3_h' },
    { id: 'compressor_full_m3_h', label: 'Compressor capacity, total (to the maximum pressure)', group: 'volume_flow', unit: 'm3_h' },
    { id: 'each_compressor_m3_h', label: 'Each compressor (to that pressure)', group: 'volume_flow', unit: 'm3_h' },
    { id: 'free_air_content_m3', label: 'Free air in the receivers at maximum pressure (FSS 2.1.1.2)', group: 'volume', unit: 'm3' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      free_air_required_m3: '36 m³',
      receiver_volume_m3: '2.03 m³',
      each_receiver_m3: '1.01 m³',
      starts_available: '14.8',
      charge_pressure_bar: '26.6 bar',
      compressor_m3_h: '65.6 m³/h',
      each_compressor_m3_h: '32.8 m³/h',
    },
  },
};

/** Usable free air (m³ at atmospheric pressure) per m³ of receiver between absolute pressures p1 and p2 (bar). */
export function usableAirPerVolume(p1, p2, n) {
  return (p1 * (1 - (p2 / p1) ** (1 / n))) / P_ATM_BAR;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.engine_type, ['reversible', 'non_reversible', 'custom'], 'engine_type', 'Main engines');
  assertInteger(i.number_of_engines, 'number_of_engines', 'Number of main engines');
  assertRange(i.number_of_engines, 1, 20, 'number_of_engines', 'Number of main engines');
  assertInteger(i.custom_starts, 'custom_starts', 'Starts per engine');
  assertRange(i.custom_starts, 1, 100, 'custom_starts', 'Starts per engine');
  assertPositive(i.air_per_start_m3, 'air_per_start_m3', 'Free air per start');
  assertNonNegative(i.other_air_m3, 'other_air_m3', 'Free air of other consumers');
  assertPositive(i.p_max_bar, 'p_max_bar', 'Maximum receiver pressure');
  assertNonNegative(i.p_min_bar, 'p_min_bar', 'Minimum starting pressure');
  if (i.p_min_bar >= i.p_max_bar) throw new Error('The minimum starting pressure must be below the maximum receiver pressure');
  assertRange(i.polytropic_n, 1, 1.67, 'polytropic_n', 'Expansion exponent');
  assertInteger(i.number_of_receivers, 'number_of_receivers', 'Number of receivers');
  assertRange(i.number_of_receivers, 1, 20, 'number_of_receivers', 'Number of receivers');
  assertPositive(i.installed_volume_m3, 'installed_volume_m3', 'Installed receiver volume');
  assertInteger(i.number_of_compressors, 'number_of_compressors', 'Number of compressors');
  assertRange(i.number_of_compressors, 1, 20, 'number_of_compressors', 'Number of compressors');
  assertPositive(i.charge_time_h, 'charge_time_h', 'Charging time');

  const p1 = i.p_max_bar + P_ATM_BAR;
  const p2 = i.p_min_bar + P_ATM_BAR;
  const perEngine = i.engine_type === 'custom' ? i.custom_starts : STARTS[i.engine_type];
  const starts = i.number_of_engines * perEngine;
  const air = starts * i.air_per_start_m3 + i.other_air_m3;
  const usable = usableAirPerVolume(p1, p2, i.polytropic_n);
  const required = air / usable;
  const installedAir = i.installed_volume_m3 * usable;
  const startsAvailable = Math.max(0, (installedAir - i.other_air_m3) / i.air_per_start_m3);
  const enough = installedAir >= air;
  let pCharge = p1;
  if (enough) {
    let lo = p2;
    let hi = p1;
    for (let k = 0; k < 100; k += 1) {
      const mid = (lo + hi) / 2;
      if (i.installed_volume_m3 * usableAirPerVolume(mid, p2, i.polytropic_n) < air) lo = mid;
      else hi = mid;
    }
    pCharge = hi;
  }
  const chargeAir = (i.installed_volume_m3 * (pCharge - P_ATM_BAR)) / P_ATM_BAR;
  const fullAir = (i.installed_volume_m3 * (p1 - P_ATM_BAR)) / P_ATM_BAR;

  const warnings = [];
  if (!enough) warnings.push(`The installed receivers give only ${startsAvailable.toFixed(1)} of the ${starts} starts required: ${required.toFixed(2)} m³ are needed.`);
  if (i.number_of_receivers < 2) warnings.push('UR M61.1.4 requires at least two receivers of about equal capacity.');
  if (i.number_of_compressors < 2) warnings.push('UR M61.1.2 requires two or more compressors, at least one driven independently of the main engine.');
  if (i.engine_type === 'custom') warnings.push('Fewer starts per engine than 12 or 6 need the agreement of the Classification Society (UR M61.1.5).');
  if (i.polytropic_n === 1) warnings.push('Isothermal expansion assumes the air regains the ambient temperature between starts; a rapid sequence of starts yields less air (try n = 1.4).');

  return {
    outputs: {
      starts_required: starts,
      free_air_required_m3: air,
      receiver_volume_m3: required,
      each_receiver_m3: required / i.number_of_receivers,
      starts_available: startsAvailable,
      charge_pressure_bar: pCharge - P_ATM_BAR,
      compressor_m3_h: chargeAir / i.charge_time_h,
      compressor_full_m3_h: fullAir / i.charge_time_h,
      each_compressor_m3_h: chargeAir / i.charge_time_h / i.number_of_compressors,
      free_air_content_m3: (i.installed_volume_m3 * p1) / P_ATM_BAR,
      summary: `${starts} starts of ${i.air_per_start_m3} m³ need ${air.toFixed(1)} m³ of free air and ${required.toFixed(2)} m³ of receivers (${i.number_of_receivers} × ${(required / i.number_of_receivers).toFixed(2)} m³) between ${i.p_max_bar} and ${i.p_min_bar} bar; the installed ${i.installed_volume_m3} m³ give ${startsAvailable.toFixed(1)} starts, and the compressors need ${(chargeAir / i.charge_time_h).toFixed(1)} m³/h in total.`,
    },
    warnings,
  };
}
