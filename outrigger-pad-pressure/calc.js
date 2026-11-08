/**
 * outrigger-pad-pressure/calc.js — mobile crane outrigger bearing check: maximum outrigger load (manufacturer value or
 * estimate), bearing pressure under the float, effective mat area (rigid mat or load spread through the mat thickness),
 * ground bearing pressure and utilisation against a presumed or tested allowable value, required mat size and a
 * one-way bending check of a rigid mat.
 *
 * q_float = F/A_float;  rigid: q = (F + W_mat)/A_mat;  spread: L_eff = min(L_mat, L_float + 2 t tan θ), q = F/(L_eff B_eff) + W_mat/A_mat
 * bending (rigid mat, cantilever c beyond the float): σ = 3 q c²/t²
 * Schema units: kN, t, m, kPa, MPa.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';
import { GRAVITY_M_S2 } from '../shared/units.js';

/** BS 8004:1986 Table 1 presumed allowable bearing values (lower bound of each range), kPa. */
export const GROUNDS = {
  rock: { label: 'Strong limestone / sandstone rock (4 000 kPa)', q: 4000 },
  dense_gravel: { label: 'Dense gravel or dense sand and gravel (> 600 kPa)', q: 600 },
  compact_sand: { label: 'Compact sand (> 300 kPa)', q: 300 },
  very_stiff_clay: { label: 'Very stiff boulder clay / hard clay (300–600 kPa)', q: 300 },
  medium_gravel: { label: 'Medium dense gravel or sand and gravel (200–600 kPa)', q: 200 },
  stiff_clay: { label: 'Stiff clay (150–300 kPa)', q: 150 },
  medium_sand: { label: 'Medium dense sand (100–300 kPa)', q: 100 },
  firm_clay: { label: 'Firm clay (75–150 kPa)', q: 75 },
  custom: { label: 'Tested or specified allowable value', q: null },
};

export const schema = {
  id: 'outrigger-pad-pressure',
  name: 'Crane outrigger pad bearing pressure',
  category: 'civil',
  summary: 'Outrigger load, float and mat bearing pressure, effective mat area by load spread, ground utilisation and required mat size for a mobile crane.',
  related: ['lifting-sling', 'concrete-volume', 'earthwork-volume', 'beam-deflection', 'column-buckling'],
  assumptions: [
    'The maximum outrigger load is best taken from the crane manufacturer\'s outrigger-load calculator for the lift (slew position, radius, counterweight); for planning the page offers the estimate 0.65 × (crane + load + rigging) quoted from the Queensland mobile crane code of practice and the upper bound of the whole crane and load on one outrigger.',
    'Bearing pressure is uniform under the float and under the mat (rigid-body assumption); with a "rigid" mat the whole mat is effective, which requires a mat stiff and strong enough to spread the load — checked here only by a one-way cantilever bending stress σ = 3 q c²/t² against the mat\'s allowable bending stress (conservative for two-way action; shear, deflection and the mat maker\'s rating are separate); with "load spread" the effective dimensions grow from the float by 2 t tan θ through the mat thickness (θ 45° typical — a designer\'s assumption, not a property of the mat), capped at the mat size.',
    'Allowable ground bearing pressures are the BS 8004:1986 presumed values (lower bound of each range) for preliminary design: they assume a foundation width of at least 1 m, the water table at least one width below the base, and they guard against shear failure, not settlement; soft clays, loose sands and fills (below 75–100 kPa) must be tested — use the tested or specified value option.',
    'Mat self-weight is added over the full mat area; dynamic effects (slewing, wind, sudden release) are covered only by the margin the user keeps below 100 % utilisation; voids, buried services, slopes and excavations near the outrigger are site checks outside this page.',
  ],
  notes: [
    'Verification 2026-10-31: 400 kN on a 0.6 × 0.6 m float = 1 111 kPa; a rigid 2 × 2 m mat of 0.5 t gives 101.2 kPa (67 % of stiff clay\'s 150 kPa) with a bending stress of 6.6 MPa for 150 mm thick timber; the same mat by 45° spread is effective over only 0.9 × 0.9 m (495 kPa) — the reason mat stiffness decides the result; the Brilliant Ideas worked example (490.5 kN at 100 kPa → 4.905 m²) is reproduced.',
    'Design decision: the 0.65 factor is shown as an estimate with its source, never as the default load; the default is the manufacturer value field.',
  ],
  sources: [
    'BS 8004:1986 Code of practice for foundations, Table 1 presumed allowable bearing values (as reproduced in published tables; superseded by BS EN 1997 for design)',
    'Construction Plant-hire Association (CPA), Ground Conditions for Construction Plant — Good Practice Guide (2014); BS 7121-3 Code of practice for safe use of cranes — Mobile cranes',
    'Queensland Mobile Crane Code of Practice 2006 — maximum outrigger force ≈ 0.65 × (crane + load), as quoted by Cranes and Lifting (2020)',
    'Brilliant Ideas Ltd, "How we size a crane mat: the load spread calculation" (area = force ÷ allowable bearing pressure; worked example 490.5 kN / 100 kPa = 4.905 m²); Temporary Works Forum outrigger mat guidance',
  ],
  inputs: [
    { id: 'load_mode', label: 'Outrigger load from', type: 'select', default: 'manufacturer', options: [{ value: 'manufacturer', label: 'Crane manufacturer\'s outrigger load (recommended)' }, { value: 'estimate', label: 'Estimate 0.65 × (crane + load + rigging)' }, { value: 'worst', label: 'Upper bound: all of crane + load on one outrigger' }] },
    { id: 'outrigger_load_kn', label: 'Maximum outrigger load', group: 'force', unit: 'kN', default: 400, min: 1, max: 20000, visibleWhen: { load_mode: 'manufacturer' } },
    { id: 'crane_mass_t', label: 'Crane mass (incl. counterweight)', group: 'mass', unit: 't', default: 60, min: 0.1, max: 2000, visibleWhen: { load_mode: ['estimate', 'worst'] } },
    { id: 'load_mass_t', label: 'Load mass', group: 'mass', unit: 't', default: 10, min: 0, max: 2000, visibleWhen: { load_mode: ['estimate', 'worst'] } },
    { id: 'rigging_mass_t', label: 'Rigging and hook block mass', group: 'mass', unit: 't', default: 0.5, min: 0, max: 100, visibleWhen: { load_mode: ['estimate', 'worst'] } },
    { id: 'float_shape', label: 'Outrigger float shape', type: 'select', default: 'square', options: [{ value: 'square', label: 'Square / rectangular' }, { value: 'circular', label: 'Circular' }] },
    { id: 'float_length_m', label: 'Float length (or diameter)', group: 'length', unit: 'm', default: 0.6, min: 0.05, max: 5 },
    { id: 'float_width_m', label: 'Float width', group: 'length', unit: 'm', default: 0.6, min: 0.05, max: 5, visibleWhen: { float_shape: 'square' } },
    { id: 'mat_length_m', label: 'Mat length (0 = no mat)', group: 'length', unit: 'm', default: 2, min: 0, max: 20 },
    { id: 'mat_width_m', label: 'Mat width', group: 'length', unit: 'm', default: 2, min: 0, max: 20 },
    { id: 'mat_thickness_m', label: 'Mat thickness', group: 'length', unit: 'm', default: 0.15, min: 0.005, max: 2 },
    { id: 'mat_mass_t', label: 'Mat mass', group: 'mass', unit: 't', default: 0.5, min: 0, max: 50 },
    { id: 'mat_behaviour', label: 'Mat behaviour', type: 'select', default: 'rigid', options: [{ value: 'rigid', label: 'Rigid: whole mat effective (check bending)' }, { value: 'spread', label: 'Load spread through the thickness at angle θ' }] },
    { id: 'spread_angle_deg', label: 'Load spread angle θ (from vertical)', group: 'angle', unit: 'deg', default: 45, min: 0, max: 60, visibleWhen: { mat_behaviour: 'spread' } },
    { id: 'mat_allowable_mpa', label: 'Mat allowable bending stress', group: 'pressure', unit: 'MPa', default: 10, min: 0.5, max: 500, visibleWhen: { mat_behaviour: 'rigid' }, help: 'Hardwood timber 8–12 MPa, engineered composite per maker, steel 165 MPa (S275 at 0.6 f_y).' },
    { id: 'ground', label: 'Ground (BS 8004 presumed allowable bearing)', type: 'select', default: 'stiff_clay', options: Object.entries(GROUNDS).map(([value, g]) => ({ value, label: g.label })) },
    { id: 'allowable_custom_kpa', label: 'Allowable bearing pressure (tested / specified)', group: 'pressure', unit: 'kPa', default: 100, min: 5, max: 20000, visibleWhen: { ground: 'custom' } },
  ],
  outputs: [
    { id: 'outrigger_load_n', label: 'Outrigger load used', group: 'force', unit: 'N', display: 'kN' },
    { id: 'float_area_m2', label: 'Float bearing area', group: 'area', unit: 'm2' },
    { id: 'float_pressure_pa', label: 'Pressure under the float (on the mat or ground)', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'effective_length_m', label: 'Effective mat length', group: 'length', unit: 'm' },
    { id: 'effective_width_m', label: 'Effective mat width', group: 'length', unit: 'm' },
    { id: 'effective_area_m2', label: 'Effective bearing area on the ground', group: 'area', unit: 'm2' },
    { id: 'ground_pressure_pa', label: 'Ground bearing pressure', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'allowable_pa', label: 'Allowable ground bearing pressure', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'utilisation_pct', label: 'Ground utilisation', group: 'ratio', unit: 'pct' },
    { id: 'ground_check', label: 'Ground bearing check', type: 'text' },
    { id: 'required_area_m2', label: 'Required effective area F/q_allow', group: 'area', unit: 'm2' },
    { id: 'required_side_m', label: 'Required square mat side (fully effective)', group: 'length', unit: 'm' },
    { id: 'bending_stress_pa', label: 'Mat bending stress 3 q c²/t² (rigid mat)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'bending_check', label: 'Mat bending check', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      outrigger_load_n: '400 kN',
      float_pressure_pa: '1 111 kPa',
      ground_pressure_pa: '101 kPa',
      allowable_pa: '150 kPa',
      utilisation_pct: '67 %',
      required_area_m2: '2.67 m²',
      required_side_m: '1.63 m',
      bending_stress_pa: '6.6 MPa',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.load_mode, ['manufacturer', 'estimate', 'worst'], 'load_mode', 'Load mode');
  assertOneOf(i.float_shape, ['square', 'circular'], 'float_shape', 'Float shape');
  assertPositive(i.float_length_m, 'float_length_m', 'Float length');
  assertNonNegative(i.mat_length_m, 'mat_length_m', 'Mat length');
  assertNonNegative(i.mat_width_m, 'mat_width_m', 'Mat width');
  assertPositive(i.mat_thickness_m, 'mat_thickness_m', 'Mat thickness');
  assertNonNegative(i.mat_mass_t, 'mat_mass_t', 'Mat mass');
  assertOneOf(i.mat_behaviour, ['rigid', 'spread'], 'mat_behaviour', 'Mat behaviour');
  assertOneOf(i.ground, Object.keys(GROUNDS), 'ground', 'Ground');

  let F;
  if (i.load_mode === 'manufacturer') F = assertPositive(i.outrigger_load_kn, 'outrigger_load_kn', 'Outrigger load') * 1000;
  else {
    const totalT = assertPositive(i.crane_mass_t, 'crane_mass_t', 'Crane mass') + assertNonNegative(i.load_mass_t, 'load_mass_t', 'Load mass') + assertNonNegative(i.rigging_mass_t, 'rigging_mass_t', 'Rigging mass');
    F = (i.load_mode === 'estimate' ? 0.65 : 1.0) * totalT * 1000 * GRAVITY_M_S2;
  }
  const floatL = i.float_shape === 'circular' ? Math.sqrt((Math.PI / 4) * i.float_length_m ** 2) : i.float_length_m;
  const floatW = i.float_shape === 'circular' ? floatL : assertPositive(i.float_width_m, 'float_width_m', 'Float width');
  const floatArea = i.float_shape === 'circular' ? (Math.PI / 4) * i.float_length_m ** 2 : floatL * floatW;
  const hasMat = i.mat_length_m > 0 && i.mat_width_m > 0;
  if (hasMat && (i.mat_length_m < floatL - 1e-9 || i.mat_width_m < floatW - 1e-9)) throw new Error('The mat is smaller than the float: the float would bear directly on the ground');
  const matWeight = hasMat ? i.mat_mass_t * 1000 * GRAVITY_M_S2 : 0;
  let Leff = floatL;
  let Beff = floatW;
  let groundPressure = F / floatArea;
  let bending = null;
  if (hasMat) {
    const matArea = i.mat_length_m * i.mat_width_m;
    if (i.mat_behaviour === 'rigid') {
      Leff = i.mat_length_m;
      Beff = i.mat_width_m;
      groundPressure = (F + matWeight) / matArea;
      const c = Math.max((i.mat_length_m - floatL) / 2, (i.mat_width_m - floatW) / 2);
      bending = (3 * groundPressure * c * c) / i.mat_thickness_m ** 2;
    } else {
      const grow = 2 * i.mat_thickness_m * Math.tan((assertRange(i.spread_angle_deg, 0, 89, 'spread_angle_deg', 'Spread angle') * Math.PI) / 180);
      Leff = Math.min(i.mat_length_m, floatL + grow);
      Beff = Math.min(i.mat_width_m, floatW + grow);
      groundPressure = F / (Leff * Beff) + matWeight / matArea;
    }
  }
  const allowable = (i.ground === 'custom' ? assertPositive(i.allowable_custom_kpa, 'allowable_custom_kpa', 'Allowable bearing') : GROUNDS[i.ground].q) * 1000;
  const util = groundPressure / allowable;
  const required = F / allowable;
  let bendingCheck = 'Not applicable (no mat, or load-spread model)';
  let bendingOk = true;
  if (bending !== null) {
    const allowBend = assertPositive(i.mat_allowable_mpa, 'mat_allowable_mpa', 'Mat bending stress') * 1e6;
    bendingOk = bending <= allowBend;
    bendingCheck = bendingOk ? `OK — ${(bending / 1e6).toFixed(2)} MPa ≤ ${i.mat_allowable_mpa} MPa (${((bending / allowBend) * 100).toFixed(0)} %)` : `OVERSTRESSED — ${(bending / 1e6).toFixed(2)} MPa > ${i.mat_allowable_mpa} MPa: thicker or stiffer mat, or use the load-spread model`;
  }

  const warnings = [];
  if (util > 1) warnings.push(`Ground pressure ${(groundPressure / 1000).toFixed(0)} kPa exceeds the allowable ${(allowable / 1000).toFixed(0)} kPa: a larger or stiffer mat (≥ ${Math.sqrt(required).toFixed(2)} m square if fully effective) or a ground improvement is needed.`);
  if (!hasMat) warnings.push('No mat: the float bears directly on the ground — only acceptable on rock, concrete or hardstanding designed for it.');
  if (!bendingOk) warnings.push('The mat is overstressed in bending: it will not spread the load over its whole area — the rigid-mat pressure is unconservative.');
  if (i.load_mode !== 'manufacturer') warnings.push(`Outrigger load ${i.load_mode === 'estimate' ? 'estimated as 0.65 × total' : 'taken as the whole crane and load'}: obtain the manufacturer's outrigger load for the actual lift configuration before relying on the result.`);
  if (allowable < 100000) warnings.push('Allowable bearing below 100 kPa: soft or loose ground — base the design on a site investigation and consider a temporary works design.');
  warnings.push('BS 8004 presumed values guard against shear failure, not settlement, and assume no voids, services, slopes or excavations near the outrigger; a temporary works designer should check marginal cases.');

  return {
    outputs: {
      outrigger_load_n: F,
      float_area_m2: floatArea,
      float_pressure_pa: F / floatArea,
      effective_length_m: Leff,
      effective_width_m: Beff,
      effective_area_m2: Leff * Beff,
      ground_pressure_pa: groundPressure,
      allowable_pa: allowable,
      utilisation_pct: util * 100,
      ground_check: util <= 1 ? `OK — ${(groundPressure / 1000).toFixed(0)} kPa ≤ ${(allowable / 1000).toFixed(0)} kPa (${(util * 100).toFixed(0)} %)` : `EXCEEDED — ${(groundPressure / 1000).toFixed(0)} kPa > ${(allowable / 1000).toFixed(0)} kPa (${(util * 100).toFixed(0)} %)`,
      required_area_m2: required,
      required_side_m: Math.sqrt(required),
      bending_stress_pa: bending,
      bending_check: bendingCheck,
    },
    warnings,
  };
}
