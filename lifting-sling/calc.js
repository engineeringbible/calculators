/**
 * lifting-sling/calc.js — leg tension of multi-leg slings from load, number of legs and sling angle (or geometry),
 * dynamic factor, hitch mode factor, sling working load limit for chain, wire rope or a rated sling, and utilisation.
 *
 * Tension per leg T = W g DAF / (n_eff cos β) with β the angle to the vertical; compression on the load per leg T sin β.
 * Schema units: SI — kg (load mass), N, m, degrees.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

/** Hitch mode factors (EN 13414-1 / ASME B30.9): choke 0.8, basket 2.0 with vertical legs. */
export const HITCHES = {
  straight: { label: 'Straight (eye and eye, vertical hitch)', factor: 1.0 },
  choke: { label: 'Choke hitch (× 0.8)', factor: 0.8 },
  basket: { label: 'Basket hitch, legs vertical (× 2.0)', factor: 2.0 },
};

/** Grade 8 chain single-leg WLL ≈ 0.0314 d² tonnes (EN 818-4 table: 8 mm 2.0 t, 10 mm 3.15 t, 13 mm 5.3 t, 16 mm 8 t, 20 mm 12.5 t). */
export const CHAIN_G8_WLL_T_PER_MM2 = 0.0314;
/** Wire rope MBL = K d² R_r / 1000 kN (EN 12385-4), K = 0.356 for 6×36 IWRC; EN 13414-1: WLL = MBL × K_t / 5, ferrule-secured eye K_t = 0.9. */
export const WIRE_ROPE_K = 0.356;
export const WIRE_ROPE_GRADE_MPA = 1770;
export const WIRE_ROPE_TERMINATION_EFFICIENCY = 0.9;
export const WIRE_ROPE_SAFETY_FACTOR = 5;

export const SLING_TYPES = {
  chain_g8: { label: 'Grade 8 alloy chain sling (EN 818-4)' },
  wire_rope: { label: 'Wire rope sling 6×36 IWRC 1770 MPa, ferrule-secured eyes (EN 13414-1)' },
  rated: { label: 'Rated sling: enter the single-leg WLL from the tag (webbing, roundsling…)' },
};

export const schema = {
  id: 'lifting-sling',
  name: 'Lifting sling and wire rope load',
  category: 'mechanical',
  summary: 'Sling leg tension from load, legs and angle or geometry with dynamic and hitch factors; chain, wire-rope or rated WLL; utilisation and maximum load.',
  related: ['anchor-catenary', 'hydraulic-cylinder', 'column-buckling', 'beam-deflection'],
  assumptions: [
    'The load is shared equally by the effective legs and each leg makes the same angle β with the vertical; by EN 13414-1 and ASME B30.9 practice a 3- or 4-leg sling is rated on three legs unless the lift points and leg lengths guarantee equal sharing (the calculator defaults to 3 effective legs for 4-leg slings and lets you override).',
    'β is the angle from the vertical (0° = legs hanging straight). The common field rule "60° included angle" corresponds to β = 30°; EN 13414-1 limits β to 60° (tension = full load per leg) and recommends 45° or less.',
    'The dynamic amplification factor multiplies the static weight to cover acceleration, swing and snatch: 1.1–1.25 for slow crane lifts in a workshop, 1.3 or more for offshore lifts (DNV-ST-N001) — the calculator does not derive it.',
    'Sling working load limits: Grade 8 chain WLL ≈ 0.0314 d² t (EN 818-4, factor 4 on breaking load); wire rope 6×36 IWRC 1770 MPa MBL = 0.356 d² × 1770/1000 kN with ferrule-secured eyes (termination efficiency 0.9) and safety factor 5 (EN 13414-1). Other constructions, grades and terminations differ; the tag WLL always governs.',
    'Hitch factors: choke 0.8 and basket 2.0 (legs vertical) per EN 13414-1 / ASME B30.9; a basket hitch with inclined legs needs the angle reduction as well, and bending over small diameters (D/d < 20 for wire rope) reduces the capacity further.',
    'The centre of gravity is assumed under the hook; an off-centre CoG loads the near legs more than this calculation shows and needs a moment balance.',
    'Shackles, hooks, master links, lifting lugs and the hook block are not checked; each must have at least the leg tension (or the total load) as WLL, with the correct angle factors for shackles loaded in-line.',
  ],
  notes: [
    'Verification 2026-10-30: 10 t on two legs at β = 30° gives 5.77 t per leg and at 60° the full 10 t per leg, the standard sling-angle demonstration; chain WLL 13 mm → 5.3 t matches the EN 818-4 table; the geometry mode reproduces β = 30° for a 4 m spread with 4 m legs.',
    'Design decision: 4-leg slings default to 3 effective legs (EN 13414-1 / ASME B30.9 practice) with an override, because equal sharing on four legs requires adjustable legs or a very rigid load.',
    'Design decision: the WLL output always states the basis (formula or tag) so the register and the user can see what the utilisation is measured against.',
  ],
  sources: [
    'EN 13414-1:2003+A2:2008, Steel wire rope slings — Safety — Part 1: Slings for general lifting service (mode factors, angle limits, safety factor 5, termination efficiency)',
    'EN 818-4:1996+A1:2008, Short link chain for lifting purposes — Chain slings Grade 8 (WLL table)',
    'EN 12385-4:2002+A1:2008, Steel wire ropes — Stranded ropes for general lifting applications (minimum breaking force K factors)',
    'ASME B30.9-2021, Slings (sling angle, choker and basket hitch factors, 3-leg assumption for 4-leg slings)',
    'DNV-ST-N001 Marine operations and marine warranty (dynamic amplification factors); LEEA Code of Practice for the Safe Use of Lifting Equipment',
  ],
  inputs: [
    { id: 'load_kg', label: 'Load mass W', group: 'mass', unit: 'kg', display: 't', default: 10000, min: 0, max: 5e6 },
    { id: 'dynamic_factor', label: 'Dynamic amplification factor', group: 'dimensionless', unit: 'none', default: 1.1, min: 1, max: 3, help: 'Workshop crane 1.1–1.25; offshore (DNV-ST-N001) 1.3 or higher.' },
    { id: 'legs', label: 'Number of sling legs', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 4, integer: true },
    { id: 'effective_legs', label: 'Legs assumed to carry the load (0 = standard: all for 1–2 legs, 3 for 3–4 legs)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 4, integer: true },
    {
      id: 'angle_basis',
      label: 'Sling angle given as',
      type: 'select',
      default: 'angle',
      options: [
        { value: 'angle', label: 'Angle of each leg to the vertical β' },
        { value: 'geometry', label: 'Spread between lift points and leg length' },
      ],
    },
    { id: 'angle_deg', label: 'Leg angle to the vertical β (single leg: 0)', group: 'angle', unit: 'deg', default: 30, min: 0, max: 75, visibleWhen: { angle_basis: 'angle' } },
    { id: 'spread_m', label: 'Distance between opposite lift points (2 legs) or diagonal (4 legs)', group: 'length', unit: 'm', default: 4, min: 0, max: 100, visibleWhen: { angle_basis: 'geometry' } },
    { id: 'leg_length_m', label: 'Sling leg length (bearing point to bearing point)', group: 'length', unit: 'm', default: 4, min: 0.1, max: 100, visibleWhen: { angle_basis: 'geometry' } },
    { id: 'hitch', label: 'Hitch', type: 'select', default: 'straight', options: Object.entries(HITCHES).map(([value, h]) => ({ value, label: h.label })) },
    { id: 'sling_type', label: 'Sling', type: 'select', default: 'chain_g8', options: Object.entries(SLING_TYPES).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'sling_diameter_m', label: 'Chain or rope nominal diameter', group: 'length', unit: 'm', display: 'mm', default: 0.016, min: 0.003, max: 0.1, visibleWhen: { sling_type: ['chain_g8', 'wire_rope'] } },
    { id: 'rated_wll_kg', label: 'Single-leg WLL from the tag (straight pull)', group: 'mass', unit: 'kg', display: 't', default: 5000, min: 1, max: 1e6, visibleWhen: { sling_type: 'rated' } },
  ],
  outputs: [
    { id: 'angle_out_deg', label: 'Leg angle to the vertical β', group: 'angle', unit: 'deg' },
    { id: 'included_angle_deg', label: 'Included angle between opposite legs 2β', group: 'angle', unit: 'deg' },
    { id: 'effective_legs_out', label: 'Legs assumed to carry the load', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'hook_load_n', label: 'Hook load W g × dynamic factor', group: 'force', unit: 'N', display: 'kN' },
    { id: 'leg_tension_n', label: 'Tension per leg T = hook load / (n cos β)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'leg_tension_kg', label: 'Tension per leg as a mass', group: 'mass', unit: 'kg', display: 't' },
    { id: 'angle_factor', label: 'Angle factor 1 / cos β (tension increase)', group: 'dimensionless', unit: 'none' },
    { id: 'compression_n', label: 'Horizontal compression on the load per leg T sin β', group: 'force', unit: 'N', display: 'kN' },
    { id: 'sling_wll_single_kg', label: 'Single-leg straight-pull WLL of the sling', group: 'mass', unit: 'kg', display: 't' },
    { id: 'wll_basis', label: 'WLL basis', type: 'text' },
    { id: 'leg_capacity_kg', label: 'Capacity per leg in this hitch (WLL × hitch factor)', group: 'mass', unit: 'kg', display: 't' },
    { id: 'utilisation_pct', label: 'Leg tension ÷ leg capacity', group: 'ratio', unit: 'pct' },
    { id: 'max_load_kg', label: 'Maximum load mass for this sling, legs, angle and factors', group: 'mass', unit: 'kg', display: 't' },
    { id: 'status', label: 'Check', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      hook_load_n: '107.9 kN',
      leg_tension_n: '62.3 kN',
      leg_tension_kg: '6.35 t',
      angle_factor: '1.155',
      compression_n: '31.1 kN',
      sling_wll_single_kg: '8.04 t',
      leg_capacity_kg: '8.04 t',
      utilisation_pct: '79 %',
    },
  },
};

/** Tension per leg, N. */
export function legTensionN(hookLoadN, effectiveLegs, angleDeg) {
  return hookLoadN / (effectiveLegs * Math.cos((angleDeg * Math.PI) / 180));
}

/** Grade 8 chain single-leg WLL in kg from the nominal diameter in mm. */
export function chainG8WllKg(diameterMm) {
  return CHAIN_G8_WLL_T_PER_MM2 * diameterMm * diameterMm * 1000;
}

/** Wire rope sling single-leg WLL in kg (6×36 IWRC 1770, ferrule-secured eyes, factor 5). */
export function wireRopeWllKg(diameterMm) {
  const mblN = (WIRE_ROPE_K * diameterMm * diameterMm * WIRE_ROPE_GRADE_MPA / 1000) * 1000;
  return (mblN * WIRE_ROPE_TERMINATION_EFFICIENCY) / WIRE_ROPE_SAFETY_FACTOR / GRAVITY_M_S2;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertNonNegative(i.load_kg, 'load_kg', 'Load mass');
  assertRange(i.dynamic_factor, 1, 5, 'dynamic_factor', 'Dynamic factor');
  assertInteger(i.legs, 'legs', 'Number of legs');
  assertRange(i.legs, 1, 4, 'legs', 'Number of legs');
  assertInteger(i.effective_legs, 'effective_legs', 'Effective legs');
  assertOneOf(i.angle_basis, ['angle', 'geometry'], 'angle_basis', 'Angle basis');
  assertOneOf(i.hitch, Object.keys(HITCHES), 'hitch', 'Hitch');
  assertOneOf(i.sling_type, Object.keys(SLING_TYPES), 'sling_type', 'Sling');

  let effectiveLegs = i.effective_legs;
  if (effectiveLegs === 0) effectiveLegs = i.legs <= 2 ? i.legs : 3;
  if (effectiveLegs > i.legs) throw new Error(`Effective legs (${effectiveLegs}) cannot exceed the number of legs (${i.legs})`);

  let angle;
  if (i.legs === 1) angle = 0;
  else if (i.angle_basis === 'angle') angle = assertRange(i.angle_deg, 0, 89, 'angle_deg', 'Leg angle');
  else {
    assertNonNegative(i.spread_m, 'spread_m', 'Spread');
    assertPositive(i.leg_length_m, 'leg_length_m', 'Leg length');
    const half = i.spread_m / 2;
    if (half >= i.leg_length_m) throw new Error('Half the spread must be less than the leg length — the legs cannot reach');
    angle = (Math.asin(half / i.leg_length_m) * 180) / Math.PI;
  }

  const hookLoad = i.load_kg * GRAVITY_M_S2 * i.dynamic_factor;
  const tension = legTensionN(hookLoad, effectiveLegs, angle);
  const angleFactor = 1 / Math.cos((angle * Math.PI) / 180);

  let wllKg;
  let basis;
  if (i.sling_type === 'chain_g8') {
    const dMm = assertPositive(i.sling_diameter_m, 'sling_diameter_m', 'Chain diameter') * 1000;
    wllKg = chainG8WllKg(dMm);
    basis = `Grade 8 chain ${dMm.toFixed(0)} mm: 0.0314 × d² = ${(wllKg / 1000).toFixed(2)} t (EN 818-4)`;
  } else if (i.sling_type === 'wire_rope') {
    const dMm = assertPositive(i.sling_diameter_m, 'sling_diameter_m', 'Rope diameter') * 1000;
    wllKg = wireRopeWllKg(dMm);
    basis = `6×36 IWRC 1770 rope ${dMm.toFixed(0)} mm: MBL ${(WIRE_ROPE_K * dMm * dMm * 1.77).toFixed(0)} kN × 0.9 / 5 = ${(wllKg / 1000).toFixed(2)} t (EN 13414-1)`;
  } else {
    wllKg = assertPositive(i.rated_wll_kg, 'rated_wll_kg', 'Rated WLL');
    basis = `Tag WLL ${(wllKg / 1000).toFixed(2)} t (straight pull)`;
  }
  const legCapacityKg = wllKg * HITCHES[i.hitch].factor;
  const legCapacityN = legCapacityKg * GRAVITY_M_S2;
  const utilisation = tension / legCapacityN;
  const maxLoadKg = (legCapacityN * effectiveLegs * Math.cos((angle * Math.PI) / 180)) / (GRAVITY_M_S2 * i.dynamic_factor);

  const warnings = [];
  if (angle > 60) warnings.push('Leg angle above 60° to the vertical: not permitted by EN 13414-1 / ASME B30.9 — use longer slings or a spreader beam.');
  else if (angle > 45) warnings.push('Leg angle between 45° and 60°: allowed but the tension exceeds 1.41 × the share of the load; 45° or less is recommended.');
  if (i.legs >= 3 && effectiveLegs === i.legs) warnings.push('All legs assumed to share the load: valid only with adjustable legs or a rigid load and exact lift-point geometry; standards rate 3- and 4-leg slings on three legs.');
  if (utilisation > 1) warnings.push('Leg tension exceeds the sling capacity in this hitch — the lift is not permitted with this sling.');
  if (i.dynamic_factor === 1) warnings.push('No dynamic factor: even a slow crane lift sees 10–25 % overload from acceleration and swing.');
  if (i.hitch === 'basket' && angle > 0) warnings.push('Basket hitch with inclined legs: the ×2 factor applies only to vertical legs; the angle factor has been applied on top, but check the standard\'s combined table.');
  warnings.push('Centre of gravity assumed under the hook; off-centre loads overload the near legs. Shackles, hooks, lugs and the hook block need their own WLL checks.');

  return {
    outputs: {
      angle_out_deg: angle,
      included_angle_deg: 2 * angle,
      effective_legs_out: effectiveLegs,
      hook_load_n: hookLoad,
      leg_tension_n: tension,
      leg_tension_kg: tension / GRAVITY_M_S2,
      angle_factor: angleFactor,
      compression_n: tension * Math.sin((angle * Math.PI) / 180),
      sling_wll_single_kg: wllKg,
      wll_basis: basis,
      leg_capacity_kg: legCapacityKg,
      utilisation_pct: utilisation * 100,
      max_load_kg: maxLoadKg,
      status: utilisation <= 1 ? `OK — ${(utilisation * 100).toFixed(0)} % of the leg capacity used` : `NOT PERMITTED — ${(utilisation * 100).toFixed(0)} % of the leg capacity`,
    },
    warnings,
  };
}
