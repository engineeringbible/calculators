/**
 * initial-stability/calc.js — metacentric height with free-surface correction, list from a weight shift, loading or
 * discharge, rolling period and the IMO minimum-GM check.
 *
 * GM = KM − KG; free surface correction FSC = Σ(i ρ) / Δ with i = l b³/12 (divided by n² for n equal subdivisions);
 * list tan θ = heeling moment / (Δ GM_fluid); rolling period T = 2 C B / √GM with C per the 2008 IS Code.
 * Schema units: m, t, t·m, t/m³, degrees, seconds. Transverse distances positive to starboard.
 */
import { withDefaults, assertPositive, assertNonNegative, assertFinite, assertOneOf, assertInteger, assertRange } from '../shared/validate.js';

/** IMO 2008 IS Code Part A 2.2.4: minimum initial GM corrected for free surface, m. */
export const IMO_MIN_GM_M = 0.15;
const SMALL_ANGLE_LIMIT_DEG = 10;

export const schema = {
  id: 'initial-stability',
  name: 'Initial stability GM and list',
  category: 'maritime',
  summary: 'GM from KM and KG with free-surface correction, list from a weight shift, loading or discharge, rolling period and the IMO minimum-GM check.',
  related: ['hydrostatics', 'draft-survey', 'bunker-quantity', 'ship-squat'],
  assumptions: [
    'Initial (small-angle) stability only: GM describes the righting lever for heel angles up to about 10°; list angles above that are reported with a warning and the full GZ curve (cross curves / KN) is needed instead.',
    'KM is taken from the hydrostatic tables at the present draft and is held constant through a loading or discharge operation; for large weights re-enter KM at the new displacement.',
    'Free surface is a virtual rise of G: FSC = Σ(l b³/12 × ρ_liquid) / Δ for rectangular tank surfaces, divided by n² for n equal longitudinal subdivisions; irregular tank shapes need the free-surface moments from the tank tables, and the moment is independent of how full the tank is (as long as it is slack).',
    'List assumes the heeling moment acts statically and the ship floats at the same KM; wind heeling, cargo shifting and grain heeling moments are not covered.',
    'Transverse distances are positive to starboard: a positive list is to starboard.',
    'The rolling period uses the IMO 2008 IS Code weather-criterion formula T = 2 C B / √GM with C = 0.373 + 0.023 B/d − 0.043 L_wl/100; it is an estimate for conventional hull forms and actual periods vary with loading and radius of gyration.',
    'The IMO check is the 0.15 m minimum corrected GM only; the area-under-GZ and weather criteria of the IS Code are not evaluated.',
    'The "stiff / tender" classification by rolling period is a rule of thumb for crew comfort and cargo securing, not a regulatory criterion.',
  ],
  notes: [
    'Design decision: KM is held constant for load/discharge operations (stated in the assumptions) so the calculator stays table-independent; the warning asks for re-entry when the weight exceeds 2 % of displacement.',
    'Verification 2026-10-30: free-surface moments (20 × 10 m tank, 1 666.7 t·m; two compartments 416.7 t·m), list for a 200 t shift (1.65°) and the loading case (KG 11.042 m) checked by hand against the Derrett formulas; rolling period C = 0.369 for B/d = 3.2, L = 180 m.',
    'Design decision: a negative fluid GM raises an error rather than a list, because the ship would then take an angle of loll, which is not a list calculation.',
  ],
  sources: [
    'Derrett & Barrass, Ship Stability for Masters and Mates, 7th ed. (2012): ch. 5 "Transverse statical stability", ch. 17 "List", ch. 21 "Free surface effect"',
    'IMO Resolution MSC.267(85), International Code on Intact Stability, 2008 (2008 IS Code), Part A 2.2.4 (GM ≥ 0.15 m) and 2.3 (weather criterion, rolling period formula)',
    'Rawson & Tupper, Basic Ship Theory, 5th ed., ch. 4 (stability) and ch. 11 (rolling)',
  ],
  inputs: [
    { id: 'displacement_t', label: 'Displacement Δ', group: 'mass', unit: 't', default: 47232, min: 1, max: 1e6 },
    { id: 'km_m', label: 'Transverse metacentre above keel KM (hydrostatic tables)', group: 'length', unit: 'm', default: 12.5, min: 0.1, max: 100 },
    { id: 'kg_solid_m', label: 'Solid KG (from the loading condition)', group: 'length', unit: 'm', default: 11.0, min: 0, max: 100 },
    {
      id: 'fsm_basis',
      label: 'Free surface moments',
      type: 'select',
      default: 'given',
      options: [
        { value: 'given', label: 'Total free surface moment given (tank tables)' },
        { value: 'tank', label: 'From one rectangular slack tank' },
      ],
    },
    { id: 'fsm_given_t_m', label: 'Total free surface moment Σ(i × ρ)', group: 'mass_moment', unit: 't_m', default: 1500, min: 0, max: 1e6, visibleWhen: { fsm_basis: 'given' } },
    { id: 'tank_length_m', label: 'Tank length l', group: 'length', unit: 'm', default: 20, min: 0.1, max: 200, visibleWhen: { fsm_basis: 'tank' } },
    { id: 'tank_breadth_m', label: 'Tank breadth b (overall, before subdivision)', group: 'length', unit: 'm', default: 10, min: 0.1, max: 100, visibleWhen: { fsm_basis: 'tank' } },
    { id: 'tank_density_t_m3', label: 'Liquid density in the tank', group: 'density', unit: 't_m3', default: 1.0, min: 0.5, max: 2, visibleWhen: { fsm_basis: 'tank' } },
    { id: 'tank_divisions', label: 'Equal longitudinal subdivisions n', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 6, integer: true, visibleWhen: { fsm_basis: 'tank' } },
    {
      id: 'operation',
      label: 'Weight operation',
      type: 'select',
      default: 'shift',
      options: [
        { value: 'none', label: 'None — report GM only' },
        { value: 'shift', label: 'Shift a weight already on board' },
        { value: 'load', label: 'Load a weight' },
        { value: 'discharge', label: 'Discharge a weight' },
      ],
    },
    { id: 'weight_t', label: 'Weight w', group: 'mass', unit: 't', default: 200, min: 0, max: 1e5, visibleWhen: { operation: ['shift', 'load', 'discharge'] } },
    { id: 'transverse_m', label: 'Transverse distance (shift distance, or distance of the weight from the centreline; + starboard)', group: 'length', unit: 'm', default: 10, min: -100, max: 100, visibleWhen: { operation: ['shift', 'load', 'discharge'] } },
    { id: 'vertical_shift_m', label: 'Vertical shift (+ up)', group: 'length', unit: 'm', default: 0, min: -100, max: 100, visibleWhen: { operation: 'shift' } },
    { id: 'weight_kg_m', label: 'Height of the weight above keel Kg', group: 'length', unit: 'm', default: 15, min: 0, max: 100, visibleWhen: { operation: ['load', 'discharge'] } },
    { id: 'beam_m', label: 'Breadth B (for the rolling period)', group: 'length', unit: 'm', default: 32, min: 1, max: 80 },
    { id: 'length_wl_m', label: 'Waterline length L_wl (for the rolling period)', group: 'length', unit: 'm', default: 180, min: 10, max: 500 },
    { id: 'draft_m', label: 'Mean draft d (for the rolling period)', group: 'length', unit: 'm', default: 10, min: 0.1, max: 40 },
  ],
  outputs: [
    { id: 'gm_solid_m', label: 'Solid GM = KM − KG (initial condition)', group: 'length', unit: 'm' },
    { id: 'fsm_t_m', label: 'Free surface moment used', group: 'mass_moment', unit: 't_m' },
    { id: 'fsc_initial_m', label: 'Free surface correction (initial)', group: 'length', unit: 'm' },
    { id: 'gm_fluid_initial_m', label: 'Fluid GM (initial)', group: 'length', unit: 'm' },
    { id: 'displacement_final_t', label: 'Displacement after the operation', group: 'mass', unit: 't' },
    { id: 'kg_final_m', label: 'Solid KG after the operation', group: 'length', unit: 'm' },
    { id: 'gm_fluid_final_m', label: 'Fluid GM after the operation', group: 'length', unit: 'm' },
    { id: 'heeling_moment_t_m', label: 'Heeling moment (+ to starboard)', group: 'mass_moment', unit: 't_m' },
    { id: 'list_deg', label: 'Angle of list (+ starboard)', group: 'angle', unit: 'deg' },
    { id: 'list_text', label: 'List', type: 'text' },
    { id: 'roll_period_s', label: 'Rolling period T = 2 C B / √GM (IS Code)', group: 'time', unit: 's' },
    { id: 'roll_coefficient', label: 'Roll coefficient C = 0.373 + 0.023 B/d − 0.043 L/100', group: 'dimensionless', unit: 'none' },
    { id: 'imo_check', label: 'IMO 2008 IS Code minimum GM (0.15 m)', type: 'text' },
    { id: 'stiffness', label: 'Roll character (rule of thumb)', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      gm_solid_m: '1.50 m',
      fsc_initial_m: '0.032 m',
      gm_fluid_initial_m: '1.468 m',
      gm_fluid_final_m: '1.468 m',
      heeling_moment_t_m: '2 000 t·m',
      roll_period_s: '19.5 s',
      roll_coefficient: '0.369',
    },
  },
};

/** Free surface moment of a rectangular tank surface, t·m: l b³/12 × ρ, divided by n² for n equal subdivisions. */
export function freeSurfaceMomentTM(lengthM, breadthM, densityTM3, divisions = 1) {
  return ((lengthM * breadthM ** 3) / 12) * densityTM3 / (divisions * divisions);
}

/** Angle of list in degrees from heeling moment (t·m), displacement (t) and fluid GM (m). */
export function listAngleDeg(heelingMomentTM, displacementT, gmFluidM) {
  return (Math.atan(heelingMomentTM / (displacementT * gmFluidM)) * 180) / Math.PI;
}

/** IS Code roll coefficient C and rolling period (s). */
export function rollingPeriodS(beamM, draftM, lengthWlM, gmM) {
  const c = 0.373 + 0.023 * (beamM / draftM) - 0.043 * (lengthWlM / 100);
  return { c, periodS: (2 * c * beamM) / Math.sqrt(gmM) };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.displacement_t, 'displacement_t', 'Displacement');
  assertPositive(i.km_m, 'km_m', 'KM');
  assertNonNegative(i.kg_solid_m, 'kg_solid_m', 'KG');
  assertOneOf(i.fsm_basis, ['given', 'tank'], 'fsm_basis', 'Free surface basis');
  assertOneOf(i.operation, ['none', 'shift', 'load', 'discharge'], 'operation', 'Weight operation');
  assertPositive(i.beam_m, 'beam_m', 'Breadth');
  assertPositive(i.length_wl_m, 'length_wl_m', 'Waterline length');
  assertPositive(i.draft_m, 'draft_m', 'Draft');

  let fsm;
  if (i.fsm_basis === 'given') fsm = assertNonNegative(i.fsm_given_t_m, 'fsm_given_t_m', 'Free surface moment');
  else {
    assertInteger(i.tank_divisions, 'tank_divisions', 'Subdivisions');
    assertRange(i.tank_divisions, 1, 20, 'tank_divisions', 'Subdivisions');
    fsm = freeSurfaceMomentTM(assertPositive(i.tank_length_m, 'tank_length_m', 'Tank length'), assertPositive(i.tank_breadth_m, 'tank_breadth_m', 'Tank breadth'), assertPositive(i.tank_density_t_m3, 'tank_density_t_m3', 'Liquid density'), i.tank_divisions);
  }

  const gmSolid = i.km_m - i.kg_solid_m;
  const fscInitial = fsm / i.displacement_t;
  const gmFluidInitial = gmSolid - fscInitial;

  let displacementFinal = i.displacement_t;
  let kgFinal = i.kg_solid_m;
  let heelingMoment = 0;
  if (i.operation !== 'none') {
    assertNonNegative(i.weight_t, 'weight_t', 'Weight');
    assertFinite(i.transverse_m, 'transverse_m', 'Transverse distance');
    if (i.operation === 'shift') {
      assertFinite(i.vertical_shift_m, 'vertical_shift_m', 'Vertical shift');
      kgFinal = i.kg_solid_m + (i.weight_t * i.vertical_shift_m) / i.displacement_t;
      heelingMoment = i.weight_t * i.transverse_m;
    } else if (i.operation === 'load') {
      assertNonNegative(i.weight_kg_m, 'weight_kg_m', 'Kg of the weight');
      displacementFinal = i.displacement_t + i.weight_t;
      kgFinal = (i.displacement_t * i.kg_solid_m + i.weight_t * i.weight_kg_m) / displacementFinal;
      heelingMoment = i.weight_t * i.transverse_m;
    } else {
      assertNonNegative(i.weight_kg_m, 'weight_kg_m', 'Kg of the weight');
      if (i.weight_t >= i.displacement_t) throw new Error('Discharged weight must be less than the displacement');
      displacementFinal = i.displacement_t - i.weight_t;
      kgFinal = (i.displacement_t * i.kg_solid_m - i.weight_t * i.weight_kg_m) / displacementFinal;
      heelingMoment = -i.weight_t * i.transverse_m;
    }
  }
  const fscFinal = fsm / displacementFinal;
  const gmFluidFinal = i.km_m - kgFinal - fscFinal;
  if (gmFluidFinal <= 0) throw new Error(`Fluid GM after the operation is ${gmFluidFinal.toFixed(3)} m (zero or negative): the ship would loll, not list — reduce KG or free surface`);

  const listDeg = listAngleDeg(heelingMoment, displacementFinal, gmFluidFinal);
  const roll = rollingPeriodS(i.beam_m, i.draft_m, i.length_wl_m, gmFluidFinal);

  const warnings = [];
  if (Math.abs(listDeg) > SMALL_ANGLE_LIMIT_DEG) warnings.push('List exceeds 10°: the initial-stability (GM) formula is no longer accurate; use the GZ curve for the actual angle.');
  if (gmFluidFinal < IMO_MIN_GM_M) warnings.push('Fluid GM is below the IMO 2008 IS Code minimum of 0.15 m.');
  if (i.operation !== 'none' && i.operation !== 'shift' && i.weight_t > 0.02 * i.displacement_t) warnings.push('The weight exceeds 2 % of displacement: KM changes with draft — re-enter KM from the tables at the new displacement.');
  if (fsm === 0) warnings.push('No free surface moment entered: any slack tank reduces GM; the fluid GM equals the solid GM here.');
  if (gmFluidInitial > 0 && gmFluidFinal < 0.5 * gmFluidInitial) warnings.push('The operation removes more than half of the initial GM.');

  let listText;
  if (Math.abs(listDeg) < 0.005) listText = 'Upright';
  else listText = `${Math.abs(listDeg).toFixed(2)}° to ${listDeg > 0 ? 'starboard' : 'port'}`;
  let stiffness;
  if (roll.periodS < 10) stiffness = 'Stiff: short roll period (< 10 s), violent accelerations — check cargo securing';
  else if (roll.periodS <= 20) stiffness = 'Moderate roll period (10–20 s)';
  else stiffness = 'Tender: long roll period (> 20 s), small GM — check the stability margins';

  return {
    outputs: {
      gm_solid_m: gmSolid,
      fsm_t_m: fsm,
      fsc_initial_m: fscInitial,
      gm_fluid_initial_m: gmFluidInitial,
      displacement_final_t: displacementFinal,
      kg_final_m: kgFinal,
      gm_fluid_final_m: gmFluidFinal,
      heeling_moment_t_m: heelingMoment,
      list_deg: listDeg,
      list_text: listText,
      roll_period_s: roll.periodS,
      roll_coefficient: roll.c,
      imo_check: gmFluidFinal >= IMO_MIN_GM_M ? `OK — fluid GM ${gmFluidFinal.toFixed(3)} m ≥ 0.15 m` : `FAIL — fluid GM ${gmFluidFinal.toFixed(3)} m < 0.15 m`,
      stiffness,
    },
    warnings,
  };
}
