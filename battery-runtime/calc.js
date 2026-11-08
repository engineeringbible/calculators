/**
 * battery-runtime/calc.js — runtime of a battery bank under a constant load with Peukert's correction, or the
 * capacity required for a target runtime; depth of discharge, C-rate, energy, recharge and derating.
 *
 * Peukert: t = H (C / (I H))^k for a capacity C rated at the H-hour rate; runtime = DoD × t; required C = I H (t_full / H)^(1/k).
 * Schema units: SI-ish electrical — V, A, Ah, W, h.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** Chemistry presets: Peukert exponent, recommended depth of discharge, charge (Ah) efficiency. */
export const CHEMISTRIES = {
  flooded_lead_acid: { label: 'Flooded lead-acid (k 1.25, DoD 50 %, charge eff. 85 %)', k: 1.25, dod: 50, chargeEfficiency: 0.85 },
  agm: { label: 'AGM / VRLA lead-acid (k 1.12, DoD 50 %, charge eff. 90 %)', k: 1.12, dod: 50, chargeEfficiency: 0.9 },
  gel: { label: 'Gel lead-acid (k 1.15, DoD 50 %, charge eff. 90 %)', k: 1.15, dod: 50, chargeEfficiency: 0.9 },
  lifepo4: { label: 'Lithium iron phosphate (k 1.03, DoD 80 %, charge eff. 97 %)', k: 1.03, dod: 80, chargeEfficiency: 0.97 },
  nicd: { label: 'Nickel-cadmium (k 1.10, DoD 80 %, charge eff. 80 %)', k: 1.1, dod: 80, chargeEfficiency: 0.8 },
  custom: { label: 'Custom exponent and depth of discharge', k: null, dod: null, chargeEfficiency: null },
};

export const schema = {
  id: 'battery-runtime',
  name: 'Battery capacity and runtime',
  category: 'electrical',
  summary: 'Runtime of a battery bank under a constant load with Peukert correction, or the capacity for a target runtime; C-rate, usable energy, recharge Ah and time.',
  related: ['three-phase-power', 'cable-sizing', 'generator-load', 'unit-converter'],
  assumptions: [
    'Constant-current discharge: the load is converted to a constant DC current at the nominal battery voltage (AC loads through the inverter efficiency); real loads at falling voltage draw rising current, and intermittent loads recover some Peukert loss, so the result is a planning figure.',
    "Peukert's law t = H (C/(I H))^k with the capacity rated at the H-hour rate (20 h for most lead-acid, 10 h in IEC 60896 and for many marine batteries, 1 h or 0.5 h for lithium); the exponent is a battery-specific fit (flooded lead-acid 1.2–1.3, AGM 1.1–1.15, LiFePO4 1.02–1.05) and the law overestimates capacity at currents well below the rated rate and is unreliable above about 1 C.",
    'Depth of discharge is a cycle-life choice, not a physical limit: 50 % for lead-acid (longer life) and 80 % for lithium are typical; the runtime is the time to reach that DoD, not to full discharge.',
    'Temperature and age derate the capacity (lead-acid loses roughly 1 % per °C below 25 °C and is considered end-of-life at 80 % of rated capacity); the derating factor is a single multiplier entered by the user.',
    'Recharge Ah = discharged Ah ÷ charge efficiency, and the recharge time assumes the charger current is accepted for the whole period — lead-acid absorption tapering can double the real time.',
    'Series/parallel wiring is not modelled: enter the bank capacity in Ah at the bank voltage.',
  ],
  notes: [
    'Verification 2026-10-30: the textbook Peukert case (100 Ah at the 20 h rate, k = 1.3, discharged at 10 A) gives 8.12 h and 81.2 Ah; at the rated 5 A exactly 20 h; the required-capacity inversion returns the input capacity for the same load and runtime.',
    'Design decision: chemistry presets carry k, DoD and charge efficiency together, because users rarely know their Peukert exponent but do know the battery type; all three can be overridden with the custom option.',
    'Design decision: runtime is reported to the chosen depth of discharge rather than to 100 %, and both figures are shown.',
  ],
  sources: [
    'W. Peukert, "Über die Abhängigkeit der Kapazität von der Entladestromstärke bei Bleiakkumulatoren", Elektrotechnische Zeitschrift 20 (1897)',
    "D. Doerffel & S. A. Sharkh, \"A critical review of using the Peukert equation for determining the remaining capacity of lead-acid and lithium-ion batteries\", J. Power Sources 155 (2006)",
    'Linden & Reddy, Handbook of Batteries, 4th ed. (depth of discharge, charge efficiency, temperature effects)',
    'IEC 60896-11 / IEC 60896-21 (stationary lead-acid batteries, capacity rating at the 10 h rate); IEEE Std 485 (sizing lead-acid batteries for stationary applications)',
  ],
  inputs: [
    { id: 'voltage_v', label: 'Bank nominal voltage', group: 'voltage', unit: 'V', default: 24, min: 1, max: 1500 },
    { id: 'capacity_ah', label: 'Bank rated capacity', group: 'dimensionless', unit: 'none', default: 200, min: 0.1, max: 100000, help: 'Ampere-hours at the rated discharge time below (C20 for most lead-acid).' },
    { id: 'rated_hours', label: 'Rated discharge time of the capacity (C-rate basis)', group: 'time', unit: 'h', default: 20, min: 0.1, max: 200 },
    { id: 'chemistry', label: 'Battery type', type: 'select', default: 'agm', options: Object.entries(CHEMISTRIES).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'peukert_k', label: 'Peukert exponent k', group: 'dimensionless', unit: 'none', default: 1.2, min: 1, max: 1.6, visibleWhen: { chemistry: 'custom' } },
    { id: 'dod_pct', label: 'Depth of discharge used', group: 'ratio', unit: 'pct', default: 50, min: 5, max: 100, visibleWhen: { chemistry: 'custom' } },
    { id: 'charge_efficiency', label: 'Charge (Ah) efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.5, max: 1, visibleWhen: { chemistry: 'custom' } },
    {
      id: 'load_basis',
      label: 'Load given as',
      type: 'select',
      default: 'power',
      options: [
        { value: 'power', label: 'Power (W) — DC, or AC through an inverter' },
        { value: 'current', label: 'DC current (A)' },
      ],
    },
    { id: 'load_w', label: 'Load power', group: 'power', unit: 'W', default: 1000, min: 0, max: 1e7, visibleWhen: { load_basis: 'power' } },
    { id: 'inverter_efficiency', label: 'Inverter / converter efficiency (1.0 for a direct DC load)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.5, max: 1, visibleWhen: { load_basis: 'power' } },
    { id: 'load_a', label: 'Load current', group: 'current', unit: 'A', default: 40, min: 0, max: 1e5, visibleWhen: { load_basis: 'current' } },
    { id: 'derating', label: 'Capacity derating for temperature and age', group: 'ratio', unit: 'frac', display: 'pct', default: 1.0, min: 0.3, max: 1.2, help: 'Lead-acid ≈ −1 %/°C below 25 °C; end-of-life 0.8.' },
    {
      id: 'mode',
      label: 'Find',
      type: 'select',
      default: 'runtime',
      options: [
        { value: 'runtime', label: 'Runtime for this bank' },
        { value: 'capacity', label: 'Capacity required for a target runtime' },
      ],
    },
    { id: 'target_runtime_h', label: 'Target runtime', group: 'time', unit: 'h', default: 10, min: 0.01, max: 10000, visibleWhen: { mode: 'capacity' } },
    { id: 'charger_a', label: 'Charger current (for the recharge time)', group: 'current', unit: 'A', default: 40, min: 0, max: 1e5 },
  ],
  outputs: [
    { id: 'load_current_a', label: 'DC load current at nominal voltage', group: 'current', unit: 'A' },
    { id: 'c_rate', label: 'Discharge C-rate (I / rated capacity)', group: 'dimensionless', unit: 'none' },
    { id: 'rated_current_a', label: 'Rated discharge current C / H', group: 'current', unit: 'A' },
    { id: 'peukert_k_out', label: 'Peukert exponent used', group: 'dimensionless', unit: 'none' },
    { id: 'effective_capacity_ah', label: 'Effective capacity at this current (Peukert, derated)', group: 'dimensionless', unit: 'none' },
    { id: 'capacity_loss_pct', label: 'Capacity lost to the discharge rate', group: 'ratio', unit: 'pct' },
    { id: 'time_to_empty_h', label: 'Time to full discharge at this current', group: 'time', unit: 'h' },
    { id: 'runtime_h', label: 'Runtime to the chosen depth of discharge', group: 'time', unit: 'h' },
    { id: 'nominal_energy_wh', label: 'Nominal energy V × C', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'usable_energy_wh', label: 'Usable energy at this rate and DoD', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'discharged_ah', label: 'Ah removed at the end of the runtime', group: 'dimensionless', unit: 'none' },
    { id: 'recharge_ah', label: 'Ah to put back (÷ charge efficiency)', group: 'dimensionless', unit: 'none' },
    { id: 'recharge_time_h', label: 'Recharge time at the charger current (bulk only)', group: 'time', unit: 'h' },
    { id: 'required_capacity_ah', label: 'Rated capacity required for the target runtime', group: 'dimensionless', unit: 'none' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      load_current_a: '46.3 A',
      rated_current_a: '10 A',
      peukert_k_out: '1.12',
      effective_capacity_ah: '166',
      capacity_loss_pct: '17 %',
      time_to_empty_h: '3.59 h',
      runtime_h: '1.80 h',
      nominal_energy_wh: '4.8 kWh',
    },
  },
};

/** Peukert time to full discharge (h) for a capacity C rated over H hours, discharged at I amps. */
export function peukertTimeH(capacityAh, ratedHours, currentA, k) {
  return ratedHours * (capacityAh / (currentA * ratedHours)) ** k;
}

/** Rated capacity (Ah) needed to sustain `currentA` for `timeToEmptyH` hours under Peukert. */
export function peukertCapacityAh(currentA, ratedHours, timeToEmptyH, k) {
  return currentA * ratedHours * (timeToEmptyH / ratedHours) ** (1 / k);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.voltage_v, 'voltage_v', 'Voltage');
  assertPositive(i.capacity_ah, 'capacity_ah', 'Capacity');
  assertPositive(i.rated_hours, 'rated_hours', 'Rated discharge time');
  assertOneOf(i.chemistry, Object.keys(CHEMISTRIES), 'chemistry', 'Battery type');
  assertOneOf(i.load_basis, ['power', 'current'], 'load_basis', 'Load basis');
  assertOneOf(i.mode, ['runtime', 'capacity'], 'mode', 'Find');
  assertRange(i.derating, 0.1, 1.5, 'derating', 'Derating');
  assertNonNegative(i.charger_a, 'charger_a', 'Charger current');

  const preset = CHEMISTRIES[i.chemistry];
  const k = i.chemistry === 'custom' ? assertRange(i.peukert_k, 1, 2, 'peukert_k', 'Peukert exponent') : preset.k;
  const dod = (i.chemistry === 'custom' ? assertRange(i.dod_pct, 1, 100, 'dod_pct', 'Depth of discharge') : preset.dod) / 100;
  const chargeEff = i.chemistry === 'custom' ? assertRange(i.charge_efficiency, 0.1, 1, 'charge_efficiency', 'Charge efficiency') : preset.chargeEfficiency;

  let current;
  if (i.load_basis === 'power') {
    assertNonNegative(i.load_w, 'load_w', 'Load power');
    assertRange(i.inverter_efficiency, 0.1, 1, 'inverter_efficiency', 'Inverter efficiency');
    current = i.load_w / i.inverter_efficiency / i.voltage_v;
  } else {
    current = assertNonNegative(i.load_a, 'load_a', 'Load current');
  }
  if (current <= 0) throw new Error('Load must be greater than zero to compute a runtime');

  const deratedCapacity = i.capacity_ah * i.derating;
  const timeToEmpty = peukertTimeH(deratedCapacity, i.rated_hours, current, k);
  const effectiveCapacity = current * timeToEmpty;
  const runtime = dod * timeToEmpty;
  const dischargedAh = current * runtime;
  const rechargeAh = dischargedAh / chargeEff;
  const cRate = current / i.capacity_ah;

  let requiredCapacity = null;
  if (i.mode === 'capacity') {
    assertPositive(i.target_runtime_h, 'target_runtime_h', 'Target runtime');
    requiredCapacity = peukertCapacityAh(current, i.rated_hours, i.target_runtime_h / dod, k) / i.derating;
  }

  const warnings = [];
  if (cRate > 1) warnings.push("Discharge above 1 C: Peukert's law is unreliable at high rates and lead-acid voltage collapses early — use the manufacturer's discharge curves.");
  if (current < (i.capacity_ah / i.rated_hours) * 0.2) warnings.push("Discharge well below the rated rate: Peukert's law overestimates the capacity gain; self-discharge and the real cut-off voltage dominate.");
  if (dod > 0.5 && i.chemistry !== 'lifepo4' && i.chemistry !== 'nicd' && i.chemistry !== 'custom') warnings.push('Lead-acid above 50 % depth of discharge shortens cycle life markedly.');
  if (i.derating === 1) warnings.push('No derating: cold batteries and aged batteries deliver less (lead-acid ≈ −1 % per °C below 25 °C; end-of-life 80 %).');
  if (i.load_basis === 'power' && i.inverter_efficiency === 1) warnings.push('Inverter efficiency 1.0 assumed: typical inverters are 85–95 % at full load and worse at light load.');
  warnings.push('Constant-current planning figure; voltage sag, intermittent loads and charger tapering change the real runtime and recharge time.');

  return {
    outputs: {
      load_current_a: current,
      c_rate: cRate,
      rated_current_a: i.capacity_ah / i.rated_hours,
      peukert_k_out: k,
      effective_capacity_ah: effectiveCapacity,
      capacity_loss_pct: (1 - effectiveCapacity / deratedCapacity) * 100,
      time_to_empty_h: timeToEmpty,
      runtime_h: runtime,
      nominal_energy_wh: i.voltage_v * i.capacity_ah,
      usable_energy_wh: i.voltage_v * dischargedAh,
      discharged_ah: dischargedAh,
      recharge_ah: rechargeAh,
      recharge_time_h: i.charger_a > 0 ? rechargeAh / i.charger_a : null,
      required_capacity_ah: requiredCapacity,
    },
    warnings,
  };
}
