/**
 * cii-rating/calc.js — attained vs required operational Carbon Intensity Indicator and the A–E rating.
 *
 * Sources (all read from the IMO resolution texts):
 *   G1 attained CII   — MEPC.352(78): CII = M / (Capacity × Dt), M = Σ FC_j × CF_j in grams.
 *   G2 reference lines — MEPC.353(78) Table 1: CIIref = a × Capacity^(−c), 2019 reference year.
 *   G3 reduction factors — MEPC.338(76) for 2023–2026 and MEPC.400(83), adopted 11 April 2025, for 2027–2030.
 *   G4 rating boundaries — MEPC.354(78) Table 1 (dd vectors) and the example following it.
 *   CF factors — MEPC.364(79) Table 1 (shared/fuels.js).
 *
 * Schema units: capacity as DWT (t) or GT (dimensionless), distance nmi, fuel masses t, CII in g CO₂/(capacity·nmi).
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf, assertInteger } from '../shared/validate.js';
import { CO2_FACTOR_T_PER_T } from '../shared/fuels.js';

const GRAMS_PER_TONNE = 1e6;

const DWT_TYPES = ['bulk_carrier', 'gas_carrier', 'tanker', 'container_ship', 'general_cargo', 'refrigerated_cargo', 'combination_carrier', 'lng_carrier'];
const GT_TYPES = ['roro_vehicle_carrier', 'roro_cargo', 'roro_passenger', 'roro_passenger_hsc', 'cruise_passenger'];

/**
 * Ship-type table. `referenceLine(capacity)` returns the capacity actually inserted into the reference-line
 * formula (some rows cap or floor it) with the a and c parameters; `ddVector(capacity)` returns
 * [exp(d1), exp(d2), exp(d3), exp(d4)]. Values exactly as printed in MEPC.353(78) and MEPC.354(78).
 */
export const SHIP_TYPES = {
  bulk_carrier: {
    label: 'Bulk carrier',
    capacity: 'dwt',
    referenceLine: (dwt) => ({ capacity: Math.min(dwt, 279000), a: 4745, c: 0.622 }),
    ddVector: () => [0.86, 0.94, 1.06, 1.18],
  },
  gas_carrier: {
    label: 'Gas carrier (LPG and other liquefied gases)',
    capacity: 'dwt',
    referenceLine: (dwt) => (dwt >= 65000 ? { capacity: dwt, a: 14405e7, c: 2.071 } : { capacity: dwt, a: 8104, c: 0.639 }),
    ddVector: (dwt) => (dwt >= 65000 ? [0.81, 0.91, 1.12, 1.44] : [0.85, 0.95, 1.06, 1.25]),
  },
  tanker: {
    label: 'Tanker',
    capacity: 'dwt',
    referenceLine: (dwt) => ({ capacity: dwt, a: 5247, c: 0.610 }),
    ddVector: () => [0.82, 0.93, 1.08, 1.28],
  },
  container_ship: {
    label: 'Container ship',
    capacity: 'dwt',
    referenceLine: (dwt) => ({ capacity: dwt, a: 1984, c: 0.489 }),
    ddVector: () => [0.83, 0.94, 1.07, 1.19],
  },
  general_cargo: {
    label: 'General cargo ship',
    capacity: 'dwt',
    referenceLine: (dwt) => (dwt >= 20000 ? { capacity: dwt, a: 31948, c: 0.792 } : { capacity: dwt, a: 588, c: 0.3885 }),
    ddVector: () => [0.83, 0.94, 1.06, 1.19],
  },
  refrigerated_cargo: {
    label: 'Refrigerated cargo carrier',
    capacity: 'dwt',
    referenceLine: (dwt) => ({ capacity: dwt, a: 4600, c: 0.557 }),
    ddVector: () => [0.78, 0.91, 1.07, 1.20],
  },
  combination_carrier: {
    label: 'Combination carrier',
    capacity: 'dwt',
    referenceLine: (dwt) => ({ capacity: dwt, a: 5119, c: 0.622 }),
    ddVector: () => [0.87, 0.96, 1.06, 1.14],
  },
  lng_carrier: {
    label: 'LNG carrier',
    capacity: 'dwt',
    // MEPC.353(78) prints 14479E10 for the 65 000–100 000 DWT row and 14779E10 for the sub-65 000 row (capacity floored at 65 000).
    referenceLine: (dwt) => {
      if (dwt >= 100000) return { capacity: dwt, a: 9.827, c: 0 };
      if (dwt >= 65000) return { capacity: dwt, a: 14479e10, c: 2.673 };
      return { capacity: 65000, a: 14779e10, c: 2.673 };
    },
    ddVector: (dwt) => (dwt >= 100000 ? [0.89, 0.98, 1.06, 1.13] : [0.78, 0.92, 1.10, 1.37]),
  },
  roro_vehicle_carrier: {
    label: 'Ro-ro cargo ship (vehicle carrier)',
    capacity: 'gt',
    referenceLine: (gt) => {
      if (gt >= 57700) return { capacity: 57700, a: 3627, c: 0.590 };
      if (gt >= 30000) return { capacity: gt, a: 3627, c: 0.590 };
      return { capacity: gt, a: 330, c: 0.329 };
    },
    ddVector: () => [0.86, 0.94, 1.06, 1.16],
  },
  roro_cargo: {
    label: 'Ro-ro cargo ship',
    capacity: 'gt',
    referenceLine: (gt) => ({ capacity: gt, a: 1967, c: 0.485 }),
    ddVector: () => [0.76, 0.89, 1.08, 1.27],
  },
  roro_passenger: {
    label: 'Ro-ro passenger ship',
    capacity: 'gt',
    referenceLine: (gt) => ({ capacity: gt, a: 2023, c: 0.460 }),
    ddVector: () => [0.76, 0.92, 1.14, 1.30],
  },
  roro_passenger_hsc: {
    label: 'Ro-ro passenger ship, high-speed craft (SOLAS ch. X)',
    capacity: 'gt',
    referenceLine: (gt) => ({ capacity: gt, a: 4196, c: 0.460 }),
    ddVector: () => [0.76, 0.92, 1.14, 1.30],
  },
  cruise_passenger: {
    label: 'Cruise passenger ship',
    capacity: 'gt',
    referenceLine: (gt) => ({ capacity: gt, a: 930, c: 0.383 }),
    ddVector: () => [0.87, 0.95, 1.06, 1.16],
  },
};

/** Reduction factor Z (%) relative to the 2019 reference line — MEPC.338(76) and MEPC.400(83). */
export const REDUCTION_FACTOR_PCT = {
  2023: 5,
  2024: 7,
  2025: 9,
  2026: 11,
  2027: 13.625,
  2028: 16.25,
  2029: 18.875,
  2030: 21.5,
};

const RATING_LETTERS = ['A', 'B', 'C', 'D', 'E'];
const FUEL_INPUTS = [
  { id: 'fuel_hfo_t', fuel: 'hfo', label: 'HFO consumed in the year', default: 4000 },
  { id: 'fuel_vlsfo_t', fuel: 'vlsfo', label: 'VLSFO / LFO consumed', default: 500 },
  { id: 'fuel_mgo_t', fuel: 'mgo', label: 'MGO / MDO consumed', default: 300 },
  { id: 'fuel_lng_t', fuel: 'lng', label: 'LNG consumed', default: 0 },
  { id: 'fuel_lpg_t', fuel: 'lpg_propane', label: 'LPG (propane) consumed', default: 0 },
  { id: 'fuel_methanol_t', fuel: 'methanol', label: 'Methanol consumed', default: 0 },
];

export const schema = {
  id: 'cii-rating',
  name: 'CII rating estimator',
  category: 'maritime',
  summary: 'Attained and required operational CII with the A–E rating, from ship type, capacity, annual fuel or CO₂ and distance.',
  related: ['fuel-voyage-cost', 'admiralty-coefficient', 'propeller-slip', 'unit-converter'],
  notes: [
    'Verification 2026-10-30: every reference-line parameter and dd vector was read from the MEPC.353(78) and MEPC.354(78) PDFs rather than from memory; a remembered combination-carrier line (40853 / 0.812) was wrong and was corrected to 5119 / 0.622 before coding.',
    'Verification 2026-10-30: the 2027–2030 reduction factors (13.625 / 16.25 / 18.875 / 21.5 %) were confirmed as MEPC.400(83), adopted 11 April 2025, via DNV, Lloyd\'s Register and Türk Loydu MEPC 83 summaries.',
    'Provenance: the IMO worked example in MEPC.354(78) (required 10 → boundaries 8.6/9.4/10.6/11.8, attained 9 = B) is used as a self-test.',
    'Design decision (Chris, 2026-10-30): EEXI is excluded — it is a one-off certificate every ship has already obtained; the calculator covers the annual CII only.',
  ],
  assumptions: [
    'This is an estimate of the regulatory calculation; the verified rating is issued by the Administration or recognised organisation on the verified IMO DCS data.',
    'No voyage adjustments or correction factors (MEPC.355(78), G5: ice class, shuttle tankers, STS, electrical cargo consumers, excluded segments) are applied; they can only lower the attained CII, so the result is conservative for entitled ships.',
    'Capacity is DWT for cargo and gas/LNG ships and GT for ro-ro and passenger ships; the reference-line caps and floors (bulk carriers 279 000 DWT, LNG carriers below 65 000 DWT, vehicle carriers 57 700 GT) apply to the reference line only, never to the attained CII.',
    'Distance is the total distance over ground reported to the DCS, ballast legs included; time at anchor or in port adds CO₂ without distance.',
    'LNG carrier parameters are reproduced exactly as printed in MEPC.353(78): 14479E10 for 65 000–100 000 DWT and 14779E10 below 65 000 DWT, which makes the reference line discontinuous at 65 000 DWT.',
    'Reduction factors exist for 2023–2030 only (MEPC.338(76) for 2023–2026, MEPC.400(83) for 2027–2030); nothing is set beyond 2030.',
    'Ratings use strict comparisons, so a value exactly on a boundary falls in the better band.',
    'EEXI is deliberately out of scope: it is a one-off design certificate verified at the first survey after 1 January 2023 and does not change year to year.',
  ],
  sources: [
    'IMO Resolution MEPC.352(78) — 2022 Guidelines on operational carbon intensity indicators and the calculation methods (G1)',
    'IMO Resolution MEPC.353(78) — 2022 Guidelines on the reference lines (G2), Table 1',
    'IMO Resolutions MEPC.338(76) and MEPC.400(83) — operational carbon intensity reduction factors (G3)',
    'IMO Resolution MEPC.354(78) — 2022 Guidelines on the operational carbon intensity rating (G4), Table 1 and example',
    'IMO Resolution MEPC.364(79) — 2022 EEDI calculation guidelines, Table 1 (CF factors)',
    'MARPOL Annex VI, regulation 28 (CII) and regulation 2 (ship-type definitions)',
  ],
  inputs: [
    {
      id: 'ship_type',
      label: 'Ship type (MARPOL Annex VI reg. 2)',
      type: 'select',
      default: 'bulk_carrier',
      options: Object.entries(SHIP_TYPES).map(([value, type]) => ({ value, label: type.label })),
    },
    { id: 'dwt', label: 'Deadweight (DWT)', group: 'mass', unit: 't', default: 80000, min: 1, max: 600000, visibleWhen: { ship_type: DWT_TYPES } },
    { id: 'gt', label: 'Gross tonnage (GT)', group: 'dimensionless', unit: 'none', default: 50000, min: 1, max: 400000, visibleWhen: { ship_type: GT_TYPES } },
    { id: 'year', label: 'Reporting year', group: 'dimensionless', unit: 'none', default: 2026, min: 2023, max: 2030, integer: true },
    { id: 'distance_nmi', label: 'Distance travelled in the year', group: 'length', unit: 'nmi', default: 60000, min: 1, max: 200000, help: 'Total distance over ground from the IMO DCS report, including ballast legs.' },
    {
      id: 'emissions_basis',
      label: 'Emissions from',
      type: 'select',
      default: 'fuels',
      options: [
        { value: 'fuels', label: 'Fuel quantities (IMO DCS)' },
        { value: 'co2', label: 'Total CO₂ directly' },
      ],
    },
    ...FUEL_INPUTS.map((f) => ({ id: f.id, label: f.label, group: 'mass', unit: 't', default: f.default, min: 0, max: 200000, visibleWhen: { emissions_basis: 'fuels' } })),
    { id: 'co2_t', label: 'Total CO₂ emitted in the year', group: 'mass', unit: 't', default: 15000, min: 0, max: 1e6, visibleWhen: { emissions_basis: 'co2' } },
  ],
  outputs: [
    { id: 'capacity_used', label: 'Capacity used for the attained CII (DWT or GT)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'co2_total_t', label: 'CO₂ emitted', group: 'mass', unit: 't' },
    { id: 'attained_cii', label: 'Attained CII', group: 'carbon_intensity', unit: 'g_cap_nmi' },
    { id: 'reference_cii', label: 'Reference CII (2019 line)', group: 'carbon_intensity', unit: 'g_cap_nmi' },
    { id: 'reduction_pct', label: 'Reduction factor Z for the year', group: 'ratio', unit: 'pct' },
    { id: 'required_cii', label: 'Required CII', group: 'carbon_intensity', unit: 'g_cap_nmi' },
    { id: 'attained_over_required', label: 'Attained ÷ required', group: 'dimensionless', unit: 'none' },
    { id: 'rating', label: 'Rating', type: 'text' },
    { id: 'boundary_ab', label: 'A/B boundary (superior)', group: 'carbon_intensity', unit: 'g_cap_nmi' },
    { id: 'boundary_bc', label: 'B/C boundary (lower)', group: 'carbon_intensity', unit: 'g_cap_nmi' },
    { id: 'boundary_cd', label: 'C/D boundary (upper)', group: 'carbon_intensity', unit: 'g_cap_nmi' },
    { id: 'boundary_de', label: 'D/E boundary (inferior)', group: 'carbon_intensity', unit: 'g_cap_nmi' },
    { id: 'co2_limit_c_t', label: 'Maximum CO₂ for a C rating at this distance', group: 'mass', unit: 't' },
    { id: 'co2_margin_t', label: 'CO₂ margin to the C/D boundary (negative = over)', group: 'mass', unit: 't' },
    { id: 'margin_to_d_pct', label: 'Margin to the C/D boundary', group: 'ratio', unit: 'pct' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      capacity_used: '80 000',
      reduction_pct: '11 %',
      co2_limit_c_t: '19 162 t',
    },
  },
};

/** Reference CII (g CO₂ per capacity·nmi) for a ship type and capacity — MEPC.353(78) eq. (1). */
export function referenceCii(shipType, capacity) {
  const { capacity: refCapacity, a, c } = SHIP_TYPES[shipType].referenceLine(capacity);
  return a * refCapacity ** -c;
}

/** Required CII for a year: reference × (1 − Z/100). */
export function requiredCii(shipType, capacity, year) {
  return referenceCii(shipType, capacity) * (1 - REDUCTION_FACTOR_PCT[year] / 100);
}

/** Rating boundaries [A/B, B/C, C/D, D/E] = dd vector × required CII — MEPC.354(78) eq. (3). */
export function ratingBoundaries(required, ddVector) {
  return ddVector.map((d) => d * required);
}

/** Letter rating from the attained CII and the four boundaries. */
export function rateCii(attained, boundaries) {
  const index = boundaries.findIndex((boundary) => attained < boundary);
  return index === -1 ? 'E' : RATING_LETTERS[index];
}

/** Attained CII in g/(capacity·nmi) from CO₂ in tonnes. */
export function attainedCii(co2Tonnes, capacity, distanceNmi) {
  return (co2Tonnes * GRAMS_PER_TONNE) / (capacity * distanceNmi);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.ship_type, Object.keys(SHIP_TYPES), 'ship_type', 'Ship type');
  assertInteger(i.year, 'year', 'Reporting year');
  assertOneOf(i.year, Object.keys(REDUCTION_FACTOR_PCT).map(Number), 'year', 'Reporting year');
  assertPositive(i.distance_nmi, 'distance_nmi', 'Distance travelled');
  assertOneOf(i.emissions_basis, ['fuels', 'co2'], 'emissions_basis', 'Emissions basis');

  const type = SHIP_TYPES[i.ship_type];
  const capacity = type.capacity === 'dwt' ? assertPositive(i.dwt, 'dwt', 'Deadweight') : assertPositive(i.gt, 'gt', 'Gross tonnage');

  let co2;
  if (i.emissions_basis === 'fuels') {
    co2 = FUEL_INPUTS.reduce((sum, f) => sum + assertNonNegative(i[f.id], f.id, f.label) * CO2_FACTOR_T_PER_T[f.fuel], 0);
  } else {
    co2 = assertNonNegative(i.co2_t, 'co2_t', 'Total CO₂');
  }

  const attained = attainedCii(co2, capacity, i.distance_nmi);
  const reference = referenceCii(i.ship_type, capacity);
  const required = requiredCii(i.ship_type, capacity, i.year);
  const boundaries = ratingBoundaries(required, type.ddVector(capacity));
  const rating = rateCii(attained, boundaries);
  const co2LimitC = (boundaries[2] * capacity * i.distance_nmi) / GRAMS_PER_TONNE;

  const warnings = [];
  if (co2 === 0) warnings.push('No CO₂ entered — the rating is meaningless until fuel or CO₂ is given.');
  if (rating === 'D') warnings.push('D rating: three consecutive D years require a corrective action plan in SEEMP Part III (MARPOL Annex VI reg. 28.8).');
  if (rating === 'E') warnings.push('E rating: a corrective action plan must be included in SEEMP Part III and verified before the ship can keep trading (reg. 28.8).');
  warnings.push('No voyage adjustments or correction factors (MEPC.355(78), G5) are applied; those can only improve the attained value.');
  if (i.distance_nmi < 10000) warnings.push('Distance below 10 000 nmi for a year is low for an ocean-going ship — check whether the figure is for a full calendar year.');

  return {
    outputs: {
      capacity_used: capacity,
      co2_total_t: co2,
      attained_cii: attained,
      reference_cii: reference,
      reduction_pct: REDUCTION_FACTOR_PCT[i.year],
      required_cii: required,
      attained_over_required: attained / required,
      rating,
      boundary_ab: boundaries[0],
      boundary_bc: boundaries[1],
      boundary_cd: boundaries[2],
      boundary_de: boundaries[3],
      co2_limit_c_t: co2LimitC,
      co2_margin_t: co2LimitC - co2,
      margin_to_d_pct: ((boundaries[2] - attained) / boundaries[2]) * 100,
    },
    warnings,
  };
}
