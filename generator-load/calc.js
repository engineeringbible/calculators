/**
 * generator-load/calc.js — loading of a set of parallel diesel generators: load percentage, kVA and current, N−1 redundancy,
 * recommended number of sets for a target load band, and daily fuel, cost and CO₂ from the specific fuel consumption.
 *
 * Installed kW = n × kVA × pf_rated; load % = P / installed kW; fuel/day = P × SFOC × h / 10⁶ t.
 * Schema units: SI electrical — VA, W, V, g/kWh, h, t.
 */
import { CO2_FACTOR_T_PER_T, FUEL_OPTIONS } from '../shared/fuels.js';
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

/** Typical medium-speed diesel generator SFOC multipliers relative to the 100 % load value, by load fraction. */
export const SFOC_LOAD_CURVE = [
  { load: 0.25, factor: 1.27 },
  { load: 0.5, factor: 1.10 },
  { load: 0.75, factor: 1.02 },
  { load: 1.0, factor: 1.0 },
];

export const schema = {
  id: 'generator-load',
  name: 'Generator load, kVA and fuel',
  category: 'electrical',
  summary: 'Load factor, kVA, current and N−1 redundancy of parallel diesel generators, the recommended number of sets for a load band, and fuel, cost and CO₂ from SFOC.',
  related: ['three-phase-power', 'fuel-voyage-cost', 'cii-rating', 'battery-runtime'],
  assumptions: [
    'All running sets are identical and share the active load equally (isochronous or matched droop); reactive load sharing and unequal set sizes are not modelled.',
    'Rated kW = rated kVA × rated power factor (0.8 for most marine alternators); the load is limited by the engine kW and by the alternator kVA, whichever is reached first, and both percentages are reported.',
    'Load percentage limits are planning policy, not physics: the default band is 30–85 % (below ≈ 30 % medium-speed diesels suffer fouling and wet stacking; above ≈ 85–90 % no margin remains for transients), and ISO 8528-1 prime rating allows 10 % overload for one hour in twelve.',
    'N−1: the load that remains if one set trips is divided among the others; SOLAS II-1 Reg. 41 and class rules require essential services to be supplied with any one generator out of service — the check here is a simple kW comparison without transient analysis or preferential tripping.',
    'Specific fuel consumption: the entered value is at 100 % load and is scaled with a typical medium-speed part-load curve (×1.02 at 75 %, ×1.10 at 50 %, ×1.27 at 25 %, linear between); engine shop-test curves should replace it for a real plant, and the value refers to the reference fuel (42 700 kJ/kg) unless corrected.',
    'Fuel per day = electrical load × SFOC × hours; alternator efficiency (≈ 95–97 %) is included only if the SFOC is given per electrical kWh — engine project guides quote per brake kWh, so divide by the alternator efficiency when using them.',
    'CO₂ uses the IMO MEPC.364(79) carbon factor of the selected fuel (shared/fuels.js).',
  ],
  notes: [
    'Verification 2026-10-30: 2 × 1 000 kVA at 0.8 with 1 200 kW at 0.85 gives 75 % load, 1 412 kVA, 1 852 A at 440 V, an N−1 load of 150 % (overload) and 6.2 t/day at 214 g/kWh (SFOC 210 × 1.02 at 75 %); the recommended count for 1 200 kW in a 30–85 % band is two sets.',
    'Design decision: the SFOC part-load curve is a typical multiplier table rather than a fit, to keep the behaviour transparent; users with shop-test data override it by entering the SFOC at the actual load with the curve switched off (set the 100 % value to the known value and read the warning).',
    'Design decision: both the kW-based (engine) and kVA-based (alternator) load percentages are shown because low power factor loads reach the alternator limit first.',
  ],
  sources: [
    'ISO 8528-1:2018, Reciprocating internal combustion engine driven alternating current generating sets — Part 1: Application, ratings and performance (prime, continuous and standby ratings, 10 % overload)',
    'SOLAS Chapter II-1 Regulation 40–41 and IEC 60092-301 (main source of electrical power: supply with one generator out of service)',
    'MAN Energy Solutions and Wärtsilä genset project guides (typical SFOC versus load for medium-speed engines)',
    'IMO Resolution MEPC.364(79) Table 1 (CO₂ carbon factors)',
  ],
  inputs: [
    { id: 'sets_running', label: 'Generator sets running in parallel', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 8, integer: true },
    { id: 'rating_va', label: 'Rating of each set', group: 'apparent_power', unit: 'VA', display: 'kVA', default: 1000e3, min: 1e3, max: 1e8 },
    { id: 'rated_pf', label: 'Rated power factor of the alternator', group: 'dimensionless', unit: 'none', default: 0.8, min: 0.5, max: 1 },
    { id: 'voltage_v', label: 'System voltage (line-to-line)', group: 'voltage', unit: 'V', default: 440, min: 100, max: 15000 },
    { id: 'load_w', label: 'Total electrical load (active power)', group: 'power', unit: 'W', display: 'kW', default: 1200e3, min: 0, max: 1e9 },
    { id: 'load_pf', label: 'Load power factor', group: 'dimensionless', unit: 'none', default: 0.85, min: 0.3, max: 1 },
    { id: 'band_min_pct', label: 'Recommended minimum load per set', group: 'ratio', unit: 'pct', default: 30, min: 0, max: 100 },
    { id: 'band_max_pct', label: 'Recommended maximum load per set', group: 'ratio', unit: 'pct', default: 85, min: 10, max: 110 },
    { id: 'sfoc_100_g_kwh', label: 'SFOC at 100 % load (per electrical kWh)', group: 'specific_fuel', unit: 'g_kWh', default: 210, min: 150, max: 400, help: 'Medium-speed gensets ≈ 195–215 g/kWh brake; divide by the alternator efficiency (≈ 0.96) for electrical kWh.' },
    { id: 'use_load_curve', label: 'Part-load SFOC correction', type: 'select', default: 'yes', options: [{ value: 'yes', label: 'Apply the typical part-load curve' }, { value: 'no', label: 'Use the entered SFOC at any load' }] },
    { id: 'hours_h', label: 'Operating hours', group: 'time', unit: 'h', default: 24, min: 0, max: 8760 },
    { id: 'fuel_type', label: 'Fuel (CO₂ factor)', type: 'select', default: 'mgo', options: FUEL_OPTIONS },
    { id: 'fuel_price', label: 'Fuel price', group: 'price_per_mass', unit: 'cur_t', default: 700, min: 0, max: 5000 },
  ],
  outputs: [
    { id: 'installed_kw_w', label: 'Installed active power of the running sets', group: 'power', unit: 'W', display: 'kW' },
    { id: 'load_kva_va', label: 'Apparent power drawn by the load', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'load_per_set_w', label: 'Active load per set', group: 'power', unit: 'W', display: 'kW' },
    { id: 'load_pct_kw', label: 'Load factor on the engine (kW basis)', group: 'ratio', unit: 'pct' },
    { id: 'load_pct_kva', label: 'Load factor on the alternator (kVA basis)', group: 'ratio', unit: 'pct' },
    { id: 'current_a', label: 'Total line current', group: 'current', unit: 'A' },
    { id: 'band_status', label: 'Load band check', type: 'text' },
    { id: 'n_minus_1_pct', label: 'Load per remaining set if one trips (N−1)', group: 'ratio', unit: 'pct' },
    { id: 'redundancy_status', label: 'Redundancy', type: 'text' },
    { id: 'recommended_sets', label: 'Sets recommended for this load within the band', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'recommended_load_pct', label: 'Load per set with the recommended number', group: 'ratio', unit: 'pct' },
    { id: 'sfoc_used_g_kwh', label: 'SFOC at the operating load', group: 'specific_fuel', unit: 'g_kWh' },
    { id: 'fuel_per_hour_kg', label: 'Fuel per hour', group: 'mass_flow', unit: 'kg_h' },
    { id: 'fuel_period_t', label: 'Fuel over the operating hours', group: 'mass', unit: 't' },
    { id: 'fuel_cost', label: 'Fuel cost over the period', group: 'money', unit: 'cur' },
    { id: 'co2_period_t', label: 'CO₂ over the period', group: 'mass', unit: 't' },
    { id: 'energy_period_wh', label: 'Electrical energy over the period', group: 'energy', unit: 'Wh', display: 'MWh' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      installed_kw_w: '1 600 kW',
      load_kva_va: '1 412 kVA',
      load_per_set_w: '600 kW',
      load_pct_kw: '75 %',
      load_pct_kva: '70.6 %',
      current_a: '1 852 A',
      n_minus_1_pct: '150 %',
      recommended_load_pct: '75 %',
    },
  },
};

/** SFOC multiplier for a load fraction from the typical medium-speed curve, linear between points, clamped at the ends. */
export function sfocLoadFactor(loadFraction) {
  const curve = SFOC_LOAD_CURVE;
  if (loadFraction <= curve[0].load) return curve[0].factor;
  if (loadFraction >= curve[curve.length - 1].load) return curve[curve.length - 1].factor;
  for (let k = 1; k < curve.length; k += 1) {
    if (loadFraction <= curve[k].load) {
      const a = curve[k - 1];
      const b = curve[k];
      return a.factor + ((b.factor - a.factor) * (loadFraction - a.load)) / (b.load - a.load);
    }
  }
  return 1;
}

/** Smallest number of sets keeping each set at or below `maxFraction` of its kW rating. */
export function recommendedSets(loadW, ratedKwPerSet, maxFraction) {
  if (loadW <= 0) return 1;
  return Math.max(1, Math.ceil(loadW / (maxFraction * ratedKwPerSet)));
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertInteger(i.sets_running, 'sets_running', 'Sets running');
  assertRange(i.sets_running, 1, 20, 'sets_running', 'Sets running');
  assertPositive(i.rating_va, 'rating_va', 'Set rating');
  assertRange(i.rated_pf, 0.1, 1, 'rated_pf', 'Rated power factor');
  assertPositive(i.voltage_v, 'voltage_v', 'Voltage');
  assertNonNegative(i.load_w, 'load_w', 'Load');
  assertRange(i.load_pf, 0.1, 1, 'load_pf', 'Load power factor');
  assertRange(i.band_min_pct, 0, 100, 'band_min_pct', 'Minimum load');
  assertRange(i.band_max_pct, 1, 120, 'band_max_pct', 'Maximum load');
  if (i.band_max_pct <= i.band_min_pct) throw new Error('The maximum of the load band must exceed the minimum');
  assertPositive(i.sfoc_100_g_kwh, 'sfoc_100_g_kwh', 'SFOC');
  assertOneOf(i.use_load_curve, ['yes', 'no'], 'use_load_curve', 'Part-load correction');
  assertNonNegative(i.hours_h, 'hours_h', 'Operating hours');
  assertOneOf(i.fuel_type, Object.keys(CO2_FACTOR_T_PER_T), 'fuel_type', 'Fuel');
  assertNonNegative(i.fuel_price, 'fuel_price', 'Fuel price');

  const ratedKwPerSet = i.rating_va * i.rated_pf;
  const installedKw = i.sets_running * ratedKwPerSet;
  const loadKva = i.load_w / i.load_pf;
  const loadPerSet = i.load_w / i.sets_running;
  const loadPctKw = (i.load_w / installedKw) * 100;
  const loadPctKva = (loadKva / (i.sets_running * i.rating_va)) * 100;
  const current = loadKva / (Math.sqrt(3) * i.voltage_v);
  const nMinus1 = i.sets_running > 1 ? (i.load_w / ((i.sets_running - 1) * ratedKwPerSet)) * 100 : null;
  const recommended = recommendedSets(i.load_w, ratedKwPerSet, i.band_max_pct / 100);
  const recommendedLoadPct = (i.load_w / (recommended * ratedKwPerSet)) * 100;
  const loadFraction = loadPctKw / 100;
  const sfoc = i.use_load_curve === 'yes' ? i.sfoc_100_g_kwh * sfocLoadFactor(Math.min(loadFraction, 1.1)) : i.sfoc_100_g_kwh;
  const fuelPerHourKg = (i.load_w / 1000) * sfoc / 1000;
  const fuelPeriodT = (fuelPerHourKg * i.hours_h) / 1000;

  let bandStatus;
  if (loadPctKw > 100 || loadPctKva > 100) bandStatus = `OVERLOAD — ${Math.max(loadPctKw, loadPctKva).toFixed(0)} % of rating`;
  else if (loadPctKw > i.band_max_pct || loadPctKva > i.band_max_pct) bandStatus = `Above the ${i.band_max_pct} % band maximum — little margin for transients`;
  else if (loadPctKw < i.band_min_pct) bandStatus = `Below the ${i.band_min_pct} % band minimum — low-load operation`;
  else bandStatus = `Within the ${i.band_min_pct}–${i.band_max_pct} % band`;

  let redundancy;
  if (nMinus1 === null) redundancy = 'Single set running: no redundancy — a trip blacks out the load';
  else if (nMinus1 <= 100) redundancy = `OK — remaining sets would carry ${nMinus1.toFixed(0)} % (ISO 8528 allows 110 % for 1 h)`;
  else if (nMinus1 <= 110) redundancy = `Marginal — ${nMinus1.toFixed(0)} % on the remaining sets, within the 10 % short-time overload only`;
  else redundancy = `FAIL — ${nMinus1.toFixed(0)} % on the remaining sets: non-essential load must be shed (preferential trip) or another set started`;

  const warnings = [];
  if (loadPctKw > 100) warnings.push('Engine overloaded: the active load exceeds the kW rating of the running sets.');
  if (loadPctKva > 100 && loadPctKw <= 100) warnings.push('Alternator overloaded on kVA while the engine is within kW: the load power factor is below the alternator rating — improve the power factor or start another set.');
  if (loadPctKw < i.band_min_pct) warnings.push('Low-load operation below the band minimum: medium-speed diesels foul and wet-stack below about 30 %; stop a set if redundancy allows.');
  if (nMinus1 !== null && nMinus1 > 110) warnings.push('N−1 check fails: with one set tripped the others would be overloaded beyond the 10 % short-time allowance.');
  if (i.use_load_curve === 'yes' && Math.abs(loadFraction - 1) > 0.01) warnings.push(`SFOC scaled from the 100 % value with a typical part-load curve (× ${sfocLoadFactor(Math.min(loadFraction, 1.1)).toFixed(3)}); use the shop-test curve for a real plant.`);
  warnings.push('SFOC per electrical kWh assumed; project-guide values are per brake kWh and must be divided by the alternator efficiency (≈ 0.96).');

  return {
    outputs: {
      installed_kw_w: installedKw,
      load_kva_va: loadKva,
      load_per_set_w: loadPerSet,
      load_pct_kw: loadPctKw,
      load_pct_kva: loadPctKva,
      current_a: current,
      band_status: bandStatus,
      n_minus_1_pct: nMinus1,
      redundancy_status: redundancy,
      recommended_sets: recommended,
      recommended_load_pct: recommendedLoadPct,
      sfoc_used_g_kwh: sfoc,
      fuel_per_hour_kg: fuelPerHourKg,
      fuel_period_t: fuelPeriodT,
      fuel_cost: fuelPeriodT * i.fuel_price,
      co2_period_t: fuelPeriodT * CO2_FACTOR_T_PER_T[i.fuel_type],
      energy_period_wh: i.load_w * i.hours_h,
    },
    warnings,
  };
}
