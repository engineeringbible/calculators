/**
 * anchor-catenary/calc.js — catenary of an anchor cable: chain on the bottom, uplift at the anchor, horizontal distance,
 * tension at the hawse pipe, the maximum horizontal force the paid-out cable can take without lifting the anchor,
 * environmental force from wind, anchor holding capacity and swinging radius.
 *
 * Catenary with parameter a = H/w (H horizontal tension, w submerged weight per metre): a chain horizontal at the
 * anchor needs a suspended length s = √(D² + 2 a D) to reach a hawse pipe D above the bottom; x = a asinh(s/a).
 * Schema units: m, kg/m, N, m², m/s, kg.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** ISO 1704 stud-link chain: mass per metre ≈ 0.0219 × d² kg/m with d in mm (grade-independent). */
export const CHAIN_MASS_COEFFICIENT = 0.0219;
export const SEA_WATER_DENSITY_KG_M3 = 1025;
export const STEEL_DENSITY_KG_M3 = 7850;
export const AIR_DENSITY_KG_M3 = 1.225;
/** Length of one shackle (shot) of anchor cable, m (ISO 1704). */
export const SHACKLE_M = 27.5;

export const schema = {
  id: 'anchor-catenary',
  name: 'Anchor cable catenary and scope',
  category: 'maritime',
  summary: 'Anchor cable catenary: chain on the bottom, uplift at the anchor, hawse tension, maximum force before the anchor lifts, wind force, holding and swinging radius.',
  related: ['beaufort-sea-state', 'tidal-height', 'ship-squat', 'unit-converter'],
  assumptions: [
    'The cable is an ideal inextensible catenary of uniform submerged weight in still water; the seabed is flat and horizontal and the chain lying on it is straight along the line of pull. Soil friction on the grounded chain is not counted as holding.',
    'Depth D is measured from the seabed to the hawse pipe (water depth + height of the hawse above the waterline at the current draft and tide).',
    'The horizontal environmental force is wind drag 0.5 ρ_air C_d A V² on the entered windage area plus any other force you give (current, waves, yawing); C_d ≈ 1.0 is a mid-range value for ships head to wind, and OCIMF coefficients should replace it for a specific ship.',
    'Chain mass per metre follows the ISO 1704 stud-link approximation 0.0219 d² kg/m (d in mm) unless entered directly; submerged weight uses steel 7 850 and sea water 1 025 kg/m³.',
    'Holding capacity = anchor mass × g × holding coefficient; coefficients are crude (ordinary stockless 3–4, high-holding-power 6–10 in sand, less in soft mud) and depend on burial, soil and the fluke angle, so the margin is indicative only.',
    'The anchor holds best with the cable horizontal at the shank; an uplift angle reduces the holding and the calculator reports the angle rather than quantifying the loss.',
    'Dynamic loads from pitching, yawing and snatching in a seaway are not included; they can double the static tension.',
    'Swinging radius = horizontal distance from hawse to anchor + ship length, measured from the anchor position.',
  ],
  notes: [
    'Verification 2026-10-30: the catenary identity (a + D)² = a² + s² and the inversion for the maximum force (a = (L² − D²)/(2D)) were checked by substitution; the 76 mm chain mass (126.5 kg/m) agrees with class/ISO tables (≈ 127 kg/m) within 1 %.',
    'Design decision: when the cable is too short to lie on the bottom, the catenary is solved for the uplift angle by bisection on the virtual arc length below the anchor (y² = a² + s² parametrisation), which converges for any L > D.',
    'Design decision: the shackle is 27.5 m (ISO 1704); the older 15-fathom shackle is 27.43 m and the Admiralty 12.5-fathom shackle 22.86 m — the unit menu offers the ISO value.',
  ],
  sources: [
    'Admiralty Manual of Seamanship, Vol. 1 (BR 67), ch. "Anchoring" (scope, catenary, rules for cable length)',
    'G. Danton, The Theory and Practice of Seamanship, 11th ed., ch. "Anchor work" (catenary of the cable)',
    'ISO 1704:2008, Ships and marine technology — Stud-link anchor chains (mass ≈ 0.0219 d² kg/m, 27.5 m shackles)',
    'IACS UR A1 / DNV Rules Pt.3 Ch.11, Anchoring equipment (equipment number, HHP anchors with twice the holding power of ordinary anchors)',
    'OCIMF, Mooring Equipment Guidelines (MEG4, 2018), wind and current force coefficients',
  ],
  inputs: [
    { id: 'depth_to_hawse_m', label: 'Depth from seabed to hawse pipe D (water depth + hawse height)', group: 'length', unit: 'm', default: 30, min: 1, max: 500 },
    {
      id: 'chain_basis',
      label: 'Chain weight from',
      type: 'select',
      default: 'diameter',
      options: [
        { value: 'diameter', label: 'Stud-link chain diameter (ISO 1704 mass formula)' },
        { value: 'mass', label: 'Mass per metre in air (catalogue)' },
      ],
    },
    { id: 'chain_diameter_m', label: 'Chain diameter d', group: 'length', unit: 'm', display: 'mm', default: 0.076, min: 0.01, max: 0.2, visibleWhen: { chain_basis: 'diameter' } },
    { id: 'chain_mass_kg_m', label: 'Chain mass per metre in air', group: 'linear_density', unit: 'kg_m', default: 126, min: 1, max: 1000, visibleWhen: { chain_basis: 'mass' } },
    { id: 'cable_out_m', label: 'Cable paid out L (from the hawse pipe)', group: 'length', unit: 'm', display: 'shackle', default: 5 * SHACKLE_M, min: 1, max: 1000 },
    {
      id: 'force_basis',
      label: 'Horizontal force on the ship',
      type: 'select',
      default: 'wind',
      options: [
        { value: 'wind', label: 'From wind speed and windage area (+ other forces)' },
        { value: 'given', label: 'Given total horizontal force' },
      ],
    },
    { id: 'wind_speed_m_s', label: 'Wind speed', group: 'speed', unit: 'm_s', display: 'kn', default: 30 * (1852 / 3600), min: 0, max: 80, visibleWhen: { force_basis: 'wind' } },
    { id: 'windage_area_m2', label: 'Frontal windage area (hull + superstructure above water)', group: 'area', unit: 'm2', default: 1500, min: 1, max: 20000, visibleWhen: { force_basis: 'wind' } },
    { id: 'drag_coefficient', label: 'Wind drag coefficient C_d', group: 'dimensionless', unit: 'none', default: 1.0, min: 0.3, max: 2, visibleWhen: { force_basis: 'wind' }, help: 'OCIMF head-wind coefficients 0.7–1.1 depending on ship type.' },
    { id: 'other_force_n', label: 'Other horizontal force (current, waves, yaw)', group: 'force', unit: 'N', display: 'kN', default: 0, min: 0, max: 1e8, visibleWhen: { force_basis: 'wind' } },
    { id: 'given_force_n', label: 'Total horizontal force H', group: 'force', unit: 'N', display: 'kN', default: 200000, min: 0, max: 1e8, visibleWhen: { force_basis: 'given' } },
    { id: 'anchor_mass_kg', label: 'Anchor mass', group: 'mass', unit: 'kg', default: 7800, min: 1, max: 100000 },
    { id: 'holding_coefficient', label: 'Holding coefficient (× anchor weight)', group: 'dimensionless', unit: 'none', default: 7, min: 1, max: 20, help: 'Ordinary stockless 3–4; HHP 6–10 in sand, 3–5 in soft mud.' },
    { id: 'ship_length_m', label: 'Ship length overall (for the swinging radius)', group: 'length', unit: 'm', default: 190, min: 1, max: 500 },
  ],
  outputs: [
    { id: 'chain_mass_out_kg_m', label: 'Chain mass per metre in air', group: 'linear_density', unit: 'kg_m' },
    { id: 'chain_weight_water_n_m', label: 'Submerged weight per metre w', group: 'line_load', unit: 'N_m' },
    { id: 'horizontal_force_n', label: 'Horizontal force H', group: 'force', unit: 'N', display: 'kN' },
    { id: 'catenary_parameter_m', label: 'Catenary parameter a = H / w', group: 'length', unit: 'm' },
    { id: 'suspended_length_m', label: 'Cable needed for a horizontal pull at the anchor √(D² + 2aD)', group: 'length', unit: 'm' },
    { id: 'chain_on_bottom_m', label: 'Cable lying on the seabed', group: 'length', unit: 'm' },
    { id: 'uplift_angle_deg', label: 'Uplift angle of the cable at the anchor (0 = horizontal)', group: 'angle', unit: 'deg' },
    { id: 'horizontal_distance_m', label: 'Horizontal distance hawse → anchor', group: 'length', unit: 'm' },
    { id: 'tension_hawse_n', label: 'Cable tension at the hawse pipe', group: 'force', unit: 'N', display: 'kN' },
    { id: 'max_force_no_uplift_n', label: 'Maximum horizontal force before the anchor lifts (for this cable length)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'scope_ratio', label: 'Scope L / D', group: 'dimensionless', unit: 'none' },
    { id: 'holding_capacity_n', label: 'Anchor holding capacity (mass × g × coefficient)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'holding_status', label: 'Holding check', type: 'text' },
    { id: 'swing_radius_m', label: 'Swinging radius from the anchor', group: 'length', unit: 'm' },
    { id: 'cable_rules', label: 'Cable length by common rules', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      chain_mass_out_kg_m: '126.5 kg/m',
      horizontal_force_n: '219 kN',
      catenary_parameter_m: '203 m',
      suspended_length_m: '114 m',
      chain_on_bottom_m: '23 m',
      horizontal_distance_m: '132 m',
      tension_hawse_n: '251 kN',
      max_force_no_uplift_n: '324 kN',
    },
  },
};

/** Stud-link chain mass per metre in air, kg/m, from the diameter in mm. */
export function chainMassKgPerM(diameterMm) {
  return CHAIN_MASS_COEFFICIENT * diameterMm * diameterMm;
}

/** Submerged weight per metre (N/m) from the mass per metre in air. */
export function submergedWeightNPerM(massKgPerM) {
  return massKgPerM * GRAVITY_M_S2 * (1 - SEA_WATER_DENSITY_KG_M3 / STEEL_DENSITY_KG_M3);
}

/** Wind drag force, N. */
export function windForceN(speedMS, areaM2, dragCoefficient) {
  return 0.5 * AIR_DENSITY_KG_M3 * dragCoefficient * areaM2 * speedMS * speedMS;
}

/**
 * Catenary geometry for horizontal tension H, submerged weight w, hawse height D and cable length L.
 * @returns {{ a, suspended, onBottom, upliftDeg, horizontalDistance, tensionHawse }}
 */
export function catenary(H, w, D, L) {
  if (L <= D) throw new Error(`Cable paid out (${L.toFixed(1)} m) must exceed the depth to the hawse pipe (${D.toFixed(1)} m)`);
  if (H <= 0) {
    return { a: Infinity, suspended: D, onBottom: L - D, upliftDeg: 0, horizontalDistance: L - D, tensionHawse: w * D };
  }
  const a = H / w;
  const suspendedMin = Math.sqrt(D * D + 2 * a * D);
  if (L >= suspendedMin) {
    return {
      a,
      suspended: suspendedMin,
      onBottom: L - suspendedMin,
      upliftDeg: 0,
      horizontalDistance: a * Math.asinh(suspendedMin / a) + (L - suspendedMin),
      tensionHawse: H + w * D,
    };
  }
  // Cable fully suspended: find the virtual arc length s0 below the anchor such that the catenary rises D over L.
  const rise = (s0) => Math.sqrt(a * a + (s0 + L) ** 2) - Math.sqrt(a * a + s0 * s0);
  let lo = 0;
  let hi = a;
  while (rise(hi) < D) hi *= 2;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    if (rise(mid) < D) lo = mid;
    else hi = mid;
  }
  const s0 = (lo + hi) / 2;
  return {
    a,
    suspended: L,
    onBottom: 0,
    upliftDeg: (Math.atan(s0 / a) * 180) / Math.PI,
    horizontalDistance: a * (Math.asinh((s0 + L) / a) - Math.asinh(s0 / a)),
    tensionHawse: w * Math.sqrt(a * a + (s0 + L) ** 2),
  };
}

/** Largest horizontal force for which a cable of length L still reaches the anchor horizontally. */
export function maxHorizontalForceN(w, D, L) {
  if (L <= D) return 0;
  return (w * (L * L - D * D)) / (2 * D);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.depth_to_hawse_m, 'depth_to_hawse_m', 'Depth to hawse pipe');
  assertOneOf(i.chain_basis, ['diameter', 'mass'], 'chain_basis', 'Chain basis');
  assertOneOf(i.force_basis, ['wind', 'given'], 'force_basis', 'Force basis');
  assertPositive(i.cable_out_m, 'cable_out_m', 'Cable paid out');
  assertPositive(i.anchor_mass_kg, 'anchor_mass_kg', 'Anchor mass');
  assertRange(i.holding_coefficient, 0.5, 30, 'holding_coefficient', 'Holding coefficient');
  assertPositive(i.ship_length_m, 'ship_length_m', 'Ship length');

  const massPerM = i.chain_basis === 'diameter' ? chainMassKgPerM(assertPositive(i.chain_diameter_m, 'chain_diameter_m', 'Chain diameter') * 1000) : assertPositive(i.chain_mass_kg_m, 'chain_mass_kg_m', 'Chain mass per metre');
  const w = submergedWeightNPerM(massPerM);

  let H;
  if (i.force_basis === 'wind') {
    assertNonNegative(i.wind_speed_m_s, 'wind_speed_m_s', 'Wind speed');
    assertPositive(i.windage_area_m2, 'windage_area_m2', 'Windage area');
    assertRange(i.drag_coefficient, 0.1, 3, 'drag_coefficient', 'Drag coefficient');
    H = windForceN(i.wind_speed_m_s, i.windage_area_m2, i.drag_coefficient) + assertNonNegative(i.other_force_n, 'other_force_n', 'Other force');
  } else {
    H = assertNonNegative(i.given_force_n, 'given_force_n', 'Horizontal force');
  }

  const geometry = catenary(H, w, i.depth_to_hawse_m, i.cable_out_m);
  const maxForce = maxHorizontalForceN(w, i.depth_to_hawse_m, i.cable_out_m);
  const holding = i.anchor_mass_kg * GRAVITY_M_S2 * i.holding_coefficient;
  const scope = i.cable_out_m / i.depth_to_hawse_m;
  const ruleShackles = 1.5 * Math.sqrt(i.depth_to_hawse_m);

  const warnings = [];
  if (geometry.upliftDeg > 0) warnings.push(`The cable lifts off the bottom at the anchor (uplift ${geometry.upliftDeg.toFixed(1)}°): the anchor's holding power is reduced and it may drag — pay out more cable.`);
  if (geometry.onBottom > 0 && geometry.onBottom < 0.1 * i.cable_out_m) warnings.push('Less than 10 % of the cable is on the bottom: little reserve before the anchor lifts in a gust or yaw.');
  if (holding < H) warnings.push('Estimated holding capacity is below the horizontal force: dragging is likely regardless of scope.');
  else if (holding < 1.5 * H) warnings.push('Holding margin below 1.5: marginal in a rising wind or with yawing.');
  if (scope < 4) warnings.push('Scope below 4 × depth is short for anything but a brief stop in calm weather; 6–8 is usual, 10 in heavy weather.');
  warnings.push('Static catenary only: snatching and yawing in a seaway can double the tension; holding coefficients are indicative.');

  return {
    outputs: {
      chain_mass_out_kg_m: massPerM,
      chain_weight_water_n_m: w,
      horizontal_force_n: H,
      catenary_parameter_m: Number.isFinite(geometry.a) ? geometry.a : null,
      suspended_length_m: geometry.suspended,
      chain_on_bottom_m: geometry.onBottom,
      uplift_angle_deg: geometry.upliftDeg,
      horizontal_distance_m: geometry.horizontalDistance,
      tension_hawse_n: geometry.tensionHawse,
      max_force_no_uplift_n: maxForce,
      scope_ratio: scope,
      holding_capacity_n: holding,
      holding_status: holding >= H ? `OK — holding ${(holding / 1000).toFixed(0)} kN vs force ${(H / 1000).toFixed(0)} kN (margin ${(holding / Math.max(H, 1)).toFixed(2)})` : `Dragging risk — holding ${(holding / 1000).toFixed(0)} kN < force ${(H / 1000).toFixed(0)} kN`,
      swing_radius_m: geometry.horizontalDistance + i.ship_length_m,
      cable_rules: `1.5 √D rule: ${ruleShackles.toFixed(1)} shackles (${(ruleShackles * SHACKLE_M).toFixed(0)} m); scope 6 × D: ${(6 * i.depth_to_hawse_m).toFixed(0)} m; scope 10 × D (heavy weather): ${(10 * i.depth_to_hawse_m).toFixed(0)} m`,
    },
    warnings,
  };
}
