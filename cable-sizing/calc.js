/**
 * cable-sizing/calc.js — voltage drop and minimum conductor size for DC, single-phase and three-phase circuits.
 *
 * Resistance from the IEC 60228 class 2 maximum values at 20 °C, scaled to the conductor temperature; reactance per
 * IEC 60364-5-52 Annex G default (0.08 Ω/km). Voltage drop ΔU = b × I × L × (R' cos φ + X' sin φ) with b = 2 (DC,
 * single-phase) or √3 (three-phase, line-to-line).
 *
 * Schema units: SI — V, A, m, mm² (area), Ω/km, °C.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** IEC 60228:2004 Table 2 — maximum DC resistance of class 2 stranded conductors at 20 °C, Ω/km. */
export const IEC60228_RESISTANCE_OHM_KM = {
  copper: { 1.5: 12.1, 2.5: 7.41, 4: 4.61, 6: 3.08, 10: 1.83, 16: 1.15, 25: 0.727, 35: 0.524, 50: 0.387, 70: 0.268, 95: 0.193, 120: 0.153, 150: 0.124, 185: 0.0991, 240: 0.0754, 300: 0.0601, 400: 0.0470, 500: 0.0366 },
  aluminium: { 16: 1.91, 25: 1.20, 35: 0.868, 50: 0.641, 70: 0.443, 95: 0.320, 120: 0.253, 150: 0.206, 185: 0.164, 240: 0.125, 300: 0.100, 400: 0.0778, 500: 0.0605 },
};

/** Resistivity at 20 °C (Ω·m) and temperature coefficient (1/K) — IEC 60028 (IACS copper) and IEC 60287-1-1 Table 1. */
export const CONDUCTORS = {
  copper: { label: 'Copper', rho20: 1.7241e-8, alpha: 0.00393 },
  aluminium: { label: 'Aluminium', rho20: 2.8264e-8, alpha: 0.00403 },
};

export const INSULATIONS = {
  pvc_70: { label: 'PVC, 70 °C conductor (IEC 60502-1 / 60092-351)', temperature: 70 },
  xlpe_90: { label: 'XLPE / EPR, 90 °C conductor', temperature: 90 },
  ambient_20: { label: 'Cold conductor, 20 °C (reference resistance)', temperature: 20 },
  custom: { label: 'Custom conductor temperature', temperature: null },
};

/** IEC 60364-5-52 Annex G: reactance per unit length taken as 0.08 mΩ/m in the absence of other information. */
export const DEFAULT_REACTANCE_OHM_KM = 0.08;

/** Numeric sort is required: JavaScript orders integer-like object keys before "1.5" and "2.5". */
const numericSizes = (table) => Object.keys(table).map(Number).sort((a, b) => a - b);
const STANDARD_SIZES = numericSizes(IEC60228_RESISTANCE_OHM_KM.copper);

export const schema = {
  id: 'cable-sizing',
  name: 'Cable sizing and voltage drop',
  category: 'electrical',
  summary: 'Voltage drop, power loss and the minimum IEC conductor size for DC, single-phase and three-phase circuits from current, length, material and allowed drop.',
  related: ['three-phase-power', 'battery-runtime', 'generator-load', 'unit-converter'],
  notes: [
    'Defect found and fixed 2026-10-30: JavaScript orders integer-like object keys before "1.5" and "2.5", so the smallest-size search started at 4 mm²; the sizes are now sorted numerically (test: 2.5 mm² at 4.63 % is the correct answer for the single-phase case).',
    'Verification 2026-10-30: theoretical ρ/A lies 4–11 % below the IEC 60228 maxima for every copper size (the 50 mm² conductor is the extreme at 11 %), consistent with stranding and tolerance allowances.',
    'Design decision: resistances come from the IEC 60228 table (conservative, what designers quote) with theoretical ρ/A only for custom sizes; the conductor is assumed at its rated temperature as in IEC 60364-5-52 Annex G.',
    'Design decision: ampacity is deliberately not computed — it depends on installation method, grouping and ambient — and is only checked against a derated rating the user enters.',
  ],
  assumptions: [
    'Conductor resistance uses the IEC 60228 class 2 maximum DC values at 20 °C (copper 1.5–500 mm², aluminium 16–500 mm²) scaled with the temperature coefficient to the conductor temperature; real cables are up to 5–7 % better, so the drop is slightly conservative. Custom sizes use the theoretical ρ/A.',
    'The conductor is assumed at its rated temperature (PVC 70 °C, XLPE/EPR 90 °C) as in IEC 60364-5-52 Annex G; at partial load the conductor is cooler and the real drop smaller.',
    'The default reactance 0.08 Ω/km (IEC 60364-5-52 Annex G) applies to multicore and touching single-core LV cables; widely spaced single cores have higher reactance, and DC circuits have none.',
    'Balanced sinusoidal load with the entered power factor; harmonics (skin effect, neutral current) and unbalance are not covered.',
    'Length is the one-way route length of the circuit; the formula includes the return conductor (factor 2) or the three-phase factor √3.',
    'Voltage drop is referred to the nominal system voltage (line-to-line for three-phase, phase-to-neutral for single-phase, DC voltage) and compared with the allowed percentage: IEC 60364-5-52 suggests 3 % lighting / 5 % other, IEC 60092-201 allows 6 % on ships.',
    'Current-carrying capacity is NOT calculated — it depends on installation method, grouping, ambient temperature and insulation; enter the derated rating from the cable standard (IEC 60092-352, IEC 60364-5-52) or catalogue to see the utilisation. Short-circuit withstand and protective-device coordination are also outside this calculator.',
    'The recommended size is the smallest standard IEC 60228 size that meets the voltage-drop limit; it may still be too small for ampacity or too small for mechanical minimums (IEC 60092 requires ≥ 1.0 mm² power circuits).',
  ],
  sources: [
    'IEC 60228:2004, Conductors of insulated cables — Table 2 (maximum resistance of class 2 conductors at 20 °C)',
    'IEC 60287-1-1, Electric cables — current rating equations — Table 1 (temperature coefficients of resistance)',
    'IEC 60364-5-52:2009, Annex G (voltage drop in consumers\' installations; λ = 0.08 mΩ/m; 3 % / 5 % limits)',
    'IEC 60092-201 (ships, electrical installations — system design, 6 % voltage drop) and IEC 60092-352 (cable selection)',
    'IEC 60028, International standard of resistance for copper (ρ = 1.7241 µΩ·cm at 20 °C)',
  ],
  inputs: [
    {
      id: 'system',
      label: 'System',
      type: 'select',
      default: 'ac3',
      options: [
        { value: 'dc', label: 'DC (two conductors)' },
        { value: 'ac1', label: 'AC single-phase (phase + neutral)' },
        { value: 'ac3', label: 'AC three-phase (balanced)' },
      ],
    },
    { id: 'voltage_v', label: 'Nominal voltage (line-to-line for three-phase)', group: 'voltage', unit: 'V', default: 400, min: 1, max: 100000 },
    { id: 'current_a', label: 'Load current I', group: 'current', unit: 'A', default: 50, min: 0, max: 10000 },
    { id: 'length_m', label: 'Cable route length (one way)', group: 'length', unit: 'm', default: 50, min: 0, max: 100000 },
    { id: 'material', label: 'Conductor material', type: 'select', default: 'copper', options: Object.entries(CONDUCTORS).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'insulation', label: 'Insulation / conductor temperature', type: 'select', default: 'pvc_70', options: Object.entries(INSULATIONS).map(([value, ins]) => ({ value, label: ins.label })) },
    { id: 'conductor_temp_c', label: 'Conductor temperature', group: 'temperature', unit: 'C', default: 70, min: -50, max: 250, visibleWhen: { insulation: 'custom' } },
    { id: 'size', label: 'Conductor cross-section (IEC 60228)', type: 'select', default: '16', options: [...STANDARD_SIZES.map((s) => ({ value: String(s), label: `${s} mm²` })), { value: 'custom', label: 'Custom cross-section' }] },
    { id: 'custom_section_mm2', label: 'Custom cross-section', group: 'area', unit: 'mm2', default: 16, min: 0.1, max: 2000, visibleWhen: { size: 'custom' } },
    { id: 'reactance_ohm_km', label: 'Cable reactance X\' (AC)', group: 'resistance_per_length', unit: 'ohm_km', default: DEFAULT_REACTANCE_OHM_KM, min: 0, max: 1, visibleWhen: { system: ['ac1', 'ac3'] }, help: 'IEC 60364-5-52 Annex G default 0.08 Ω/km for cables; from the catalogue when known.' },
    { id: 'power_factor', label: 'Load power factor cos φ', group: 'dimensionless', unit: 'none', default: 0.85, min: 0.1, max: 1, visibleWhen: { system: ['ac1', 'ac3'] } },
    { id: 'allowed_drop_pct', label: 'Allowed voltage drop', group: 'ratio', unit: 'pct', default: 5, min: 0.1, max: 20, help: 'IEC 60364: 3 % lighting, 5 % other; IEC 60092-201 ships: 6 % from switchboard to consumer.' },
    { id: 'cable_rating_a', label: 'Cable current rating after derating (0 = not checked)', group: 'current', unit: 'A', default: 0, min: 0, max: 10000, help: 'From IEC 60092-352 / IEC 60364-5-52 tables or the catalogue, with grouping and ambient correction applied.' },
  ],
  outputs: [
    { id: 'section_out_mm2', label: 'Cross-section used', group: 'area', unit: 'mm2' },
    { id: 'resistance_20_ohm_km', label: 'Conductor resistance at 20 °C', group: 'resistance_per_length', unit: 'ohm_km' },
    { id: 'resistance_t_ohm_km', label: 'Conductor resistance at operating temperature', group: 'resistance_per_length', unit: 'ohm_km' },
    { id: 'resistance_ohm', label: 'Resistance of one conductor over the route', group: 'resistance', unit: 'ohm' },
    { id: 'voltage_drop_v', label: 'Voltage drop ΔU', group: 'voltage', unit: 'V' },
    { id: 'voltage_drop_pct', label: 'Voltage drop', group: 'ratio', unit: 'pct' },
    { id: 'voltage_at_load_v', label: 'Voltage at the load', group: 'voltage', unit: 'V' },
    { id: 'power_loss_w', label: 'Power lost in the cable', group: 'power', unit: 'W' },
    { id: 'compliance', label: 'Voltage-drop check', type: 'text' },
    { id: 'recommended_size', label: 'Smallest standard size meeting the allowed drop', type: 'text' },
    { id: 'recommended_drop_pct', label: 'Voltage drop with that size', group: 'ratio', unit: 'pct' },
    { id: 'rating_utilisation_pct', label: 'Load current ÷ cable rating', group: 'ratio', unit: 'pct' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      resistance_20_ohm_km: '1.15 Ω/km',
      resistance_t_ohm_km: '1.376 Ω/km',
      resistance_ohm: '0.0688 Ω',
      voltage_drop_v: '5.25 V',
      voltage_drop_pct: '1.31 %',
      voltage_at_load_v: '394.8 V',
      power_loss_w: '516 W',
      recommended_drop_pct: '3.4 %',
    },
  },
};

/** Resistance per km at temperature T from the 20 °C value. */
export function resistanceAtTemperature(r20OhmKm, alpha, temperatureC) {
  return r20OhmKm * (1 + alpha * (temperatureC - 20));
}

/** 20 °C resistance per km for a material and size: IEC 60228 table for standard sizes, theoretical ρ/A otherwise. */
export function resistance20OhmKm(material, sectionMm2) {
  const table = IEC60228_RESISTANCE_OHM_KM[material];
  if (table && table[sectionMm2] !== undefined) return table[sectionMm2];
  return (CONDUCTORS[material].rho20 / (sectionMm2 * 1e-6)) * 1000;
}

/** Voltage drop in volts for the circuit type; rPerKm and xPerKm in Ω/km, length in m. */
export function voltageDropV(system, currentA, lengthM, rPerKm, xPerKm, powerFactor) {
  const r = (rPerKm * lengthM) / 1000;
  const x = (xPerKm * lengthM) / 1000;
  if (system === 'dc') return 2 * currentA * r;
  const sinPhi = Math.sqrt(Math.max(0, 1 - powerFactor * powerFactor));
  const perConductor = currentA * (r * powerFactor + x * sinPhi);
  return system === 'ac1' ? 2 * perConductor : Math.sqrt(3) * perConductor;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.system, ['dc', 'ac1', 'ac3'], 'system', 'System');
  assertOneOf(i.material, Object.keys(CONDUCTORS), 'material', 'Conductor material');
  assertOneOf(i.insulation, Object.keys(INSULATIONS), 'insulation', 'Insulation');
  assertPositive(i.voltage_v, 'voltage_v', 'Nominal voltage');
  assertNonNegative(i.current_a, 'current_a', 'Load current');
  assertNonNegative(i.length_m, 'length_m', 'Cable length');
  assertPositive(i.allowed_drop_pct, 'allowed_drop_pct', 'Allowed voltage drop');
  assertNonNegative(i.cable_rating_a, 'cable_rating_a', 'Cable rating');

  const isAc = i.system !== 'dc';
  const powerFactor = isAc ? assertRange(i.power_factor, 0.01, 1, 'power_factor', 'Power factor') : 1;
  const reactance = isAc ? assertNonNegative(i.reactance_ohm_km, 'reactance_ohm_km', 'Reactance') : 0;
  const temperature = i.insulation === 'custom' ? i.conductor_temp_c : INSULATIONS[i.insulation].temperature;
  const conductor = CONDUCTORS[i.material];

  let section;
  if (i.size === 'custom') section = assertPositive(i.custom_section_mm2, 'custom_section_mm2', 'Cross-section');
  else {
    section = Number(i.size);
    if (!STANDARD_SIZES.includes(section)) throw new Error(`Unknown conductor size "${i.size}"`);
  }

  const r20 = resistance20OhmKm(i.material, section);
  const rT = resistanceAtTemperature(r20, conductor.alpha, temperature);
  const drop = voltageDropV(i.system, i.current_a, i.length_m, rT, reactance, powerFactor);
  const dropPct = (drop / i.voltage_v) * 100;
  const resistanceOhm = (rT * i.length_m) / 1000;
  const conductorsCarrying = i.system === 'ac3' ? 3 : 2;
  const powerLoss = conductorsCarrying * i.current_a * i.current_a * resistanceOhm;

  const candidateSizes = numericSizes(IEC60228_RESISTANCE_OHM_KM[i.material]);
  let recommended = null;
  let recommendedDrop = null;
  for (const candidate of candidateSizes) {
    const candidateDrop = (voltageDropV(i.system, i.current_a, i.length_m, resistanceAtTemperature(resistance20OhmKm(i.material, candidate), conductor.alpha, temperature), reactance, powerFactor) / i.voltage_v) * 100;
    if (candidateDrop <= i.allowed_drop_pct) {
      recommended = candidate;
      recommendedDrop = candidateDrop;
      break;
    }
  }

  const warnings = [];
  if (i.material === 'aluminium' && section < 16) warnings.push('Aluminium conductors below 16 mm² are not standard (IEC 60228 class 2 starts at 16 mm²); the theoretical resistance is used.');
  if (isAc && reactance > 0 && powerFactor < 0.7) warnings.push('Low power factor: the reactive part of the drop is significant; use the actual cable reactance rather than the 0.08 Ω/km default.');
  if (i.cable_rating_a > 0 && i.current_a > i.cable_rating_a) warnings.push('Load current exceeds the cable rating: the cable is undersized for ampacity regardless of voltage drop.');
  if (recommended === null) warnings.push('No single standard conductor up to 500 mm² meets the allowed drop — use parallel conductors, a higher voltage or a shorter route.');
  if (i.current_a > 0 && dropPct > i.allowed_drop_pct && recommended !== null && recommended > section) warnings.push(`Voltage drop ${dropPct.toFixed(2)} % exceeds the ${i.allowed_drop_pct} % limit; ${recommended} mm² would give ${recommendedDrop.toFixed(2)} %.`);
  warnings.push('Ampacity, short-circuit withstand and protection coordination are not checked here.');

  return {
    outputs: {
      section_out_mm2: section,
      resistance_20_ohm_km: r20,
      resistance_t_ohm_km: rT,
      resistance_ohm: resistanceOhm,
      voltage_drop_v: drop,
      voltage_drop_pct: dropPct,
      voltage_at_load_v: i.voltage_v - drop,
      power_loss_w: powerLoss,
      compliance: dropPct <= i.allowed_drop_pct ? `OK — ${dropPct.toFixed(2)} % ≤ ${i.allowed_drop_pct} %` : `Exceeds limit — ${dropPct.toFixed(2)} % > ${i.allowed_drop_pct} %`,
      recommended_size: recommended === null ? 'none up to 500 mm²' : `${recommended} mm² ${i.material}`,
      recommended_drop_pct: recommendedDrop,
      rating_utilisation_pct: i.cable_rating_a > 0 ? (i.current_a / i.cable_rating_a) * 100 : null,
    },
    warnings,
  };
}
