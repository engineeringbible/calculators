/**
 * hydraulic-cylinder/calc.js — push and pull force, extend and retract speed and time, regenerative operation,
 * hydraulic power, oil volumes and the Euler buckling margin of the piston rod.
 *
 * F = p A η; v = Q / A; A_cap = π D²/4, A_annulus = π (D² − d²)/4, A_rod = π d²/4; P_hyd = p Q; P_cr = π² E I / (K L)².
 * Schema units: SI — m, Pa, m³/s, N, W.
 */
import { circleSection } from '../shared/sections.js';
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** Effective-length factors for rod buckling by cylinder mounting (ISO/TS 13725 style, as in manufacturer catalogues). */
export const MOUNTINGS = {
  pinned_both: { label: 'Both ends pivoted (clevis/trunnion), rod guided: K = 1.0', k: 1.0 },
  fixed_guided: { label: 'Cylinder rigidly mounted, rod end guided: K = 0.7', k: 0.7 },
  fixed_pivot: { label: 'Cylinder rigidly mounted, rod end pivoted and guided: K = 1.0', k: 1.0 },
  fixed_free: { label: 'Cylinder rigidly mounted, rod end free (unsupported load): K = 2.0', k: 2.0 },
};

export const schema = {
  id: 'hydraulic-cylinder',
  name: 'Hydraulic cylinder force and speed',
  category: 'mechanical',
  summary: 'Push and pull force, extend and retract speed, regenerative mode, hydraulic power, oil volumes and rod buckling margin from bore, rod, pressure and flow.',
  related: ['pressure-vessel', 'column-buckling', 'pump-affinity', 'lifting-sling'],
  assumptions: [
    'Force = pressure × effective piston area × mechanical efficiency; the pressure is the differential across the piston (supply minus the back-pressure on the other side), which the user enters as one effective value. Seal friction and breakaway are lumped into the efficiency (0.85–0.95 typical).',
    'Speed = flow ÷ area with the full pump flow available to the cylinder; valve pressure drops, pump slip and compensator behaviour are not modelled, and the extend and retract times exclude acceleration and cushioning.',
    'Regenerative (differential) extension connects the annulus to the cap side: speed Q / A_rod and force p A_rod, valid only while the load is below that force.',
    'Hydraulic power p Q is the power delivered to the cylinder; the pump input power is higher by the pump and drive efficiencies.',
    'Rod buckling uses the Euler formula on the rod alone with the full extended length and the mounting K factor, which is the conservative catalogue approach; manufacturers\' buckling charts also credit the cylinder tube stiffness and apply a safety factor of 3.5 (Parker) or 2.5–4 depending on the standard.',
    'The pressure vessel aspects (tube wall thickness, end caps, tie rods) are not checked — see the pressure-vessel calculator with the cylinder bore as inside diameter.',
    'Oil compressibility and hose expansion are ignored; they matter for positioning accuracy and natural frequency, not for the static figures here.',
  ],
  notes: [
    'Verification 2026-10-30: the 100/56 mm cylinder at 200 bar with 40 L/min gives 157.1 kN push, 107.8 kN pull, 0.0849 m/s extend (5.09 m/min) and 13.3 kW hydraulic power, all checked by hand against the standard catalogue formulas; the rod Euler load of 4.0 MN at 0.5 m confirms the familiar result that short strokes never buckle and a 3 m stroke of the same rod would.',
    'Design decision: ISO 3320 preferred bores and rods are not enforced — any dimensions are accepted — but the 100/56 default is a standard pairing (area ratio 1.46).',
    'Design decision: the rod section comes from shared/sections.js so the buckling check is consistent with the column calculator.',
  ],
  sources: [
    'Parker Hannifin, Industrial Hydraulic Cylinder Catalog (HY08-1114), force, speed and rod buckling (stop tube / column load charts)',
    'Bosch Rexroth, Hydraulic Formulae and Hydraulic Trainer Vol. 1 (F = p A, v = Q / A, P = p Q)',
    'ISO 3320:2013 (cylinder bores and piston rod diameters, metric series), ISO 4393 (strokes), ISO/TS 13725 (buckling load evaluation)',
    "Budynas & Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §4-12 (Euler columns)",
  ],
  inputs: [
    { id: 'bore_m', label: 'Cylinder bore D', group: 'length', unit: 'm', display: 'mm', default: 0.100, min: 0.005, max: 2 },
    { id: 'rod_m', label: 'Piston rod diameter d', group: 'length', unit: 'm', display: 'mm', default: 0.056, min: 0.001, max: 2 },
    { id: 'pressure_pa', label: 'Effective working pressure p (differential across the piston)', group: 'pressure', unit: 'Pa', display: 'bar', default: 200e5, min: 0, max: 1000e5 },
    { id: 'flow_m3_s', label: 'Pump flow Q to the cylinder', group: 'volume_flow', unit: 'm3_s', display: 'L_min', default: 40 / 60000, min: 0, max: 1 },
    { id: 'stroke_m', label: 'Stroke s', group: 'length', unit: 'm', display: 'mm', default: 0.5, min: 0.001, max: 50 },
    { id: 'efficiency', label: 'Mechanical (seal friction) efficiency η', group: 'ratio', unit: 'frac', default: 0.9, min: 0.5, max: 1 },
    { id: 'mounting', label: 'Mounting (for rod buckling)', type: 'select', default: 'pinned_both', options: Object.entries(MOUNTINGS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'rod_modulus_pa', label: "Rod Young's modulus E", group: 'pressure', unit: 'Pa', display: 'GPa', default: 210e9, min: 1e10, max: 5e11 },
    { id: 'buckling_safety_factor', label: 'Required safety factor on rod buckling', group: 'dimensionless', unit: 'none', default: 3.5, min: 1, max: 10, help: 'Catalogue practice 3.5 (Parker); ISO/TS 13725 and some standards 2.5–4.' },
  ],
  outputs: [
    { id: 'cap_area_m2', label: 'Piston (cap-end) area A_cap', group: 'area', unit: 'm2', display: 'cm2' },
    { id: 'annulus_area_m2', label: 'Annulus (rod-end) area A_ann', group: 'area', unit: 'm2', display: 'cm2' },
    { id: 'area_ratio', label: 'Area ratio φ = A_cap / A_ann', group: 'dimensionless', unit: 'none' },
    { id: 'push_force_n', label: 'Push (extend) force p A_cap η', group: 'force', unit: 'N', display: 'kN' },
    { id: 'pull_force_n', label: 'Pull (retract) force p A_ann η', group: 'force', unit: 'N', display: 'kN' },
    { id: 'extend_speed_m_s', label: 'Extend speed Q / A_cap', group: 'speed', unit: 'm_s', display: 'm_min' },
    { id: 'retract_speed_m_s', label: 'Retract speed Q / A_ann', group: 'speed', unit: 'm_s', display: 'm_min' },
    { id: 'extend_time_s', label: 'Extend time over the stroke', group: 'time', unit: 's' },
    { id: 'retract_time_s', label: 'Retract time over the stroke', group: 'time', unit: 's' },
    { id: 'return_flow_m3_s', label: 'Return flow from the rod end while extending Q (A_ann / A_cap)', group: 'volume_flow', unit: 'm3_s', display: 'L_min' },
    { id: 'regen_speed_m_s', label: 'Regenerative extend speed Q / A_rod', group: 'speed', unit: 'm_s', display: 'm_min' },
    { id: 'regen_force_n', label: 'Regenerative extend force p A_rod η', group: 'force', unit: 'N', display: 'kN' },
    { id: 'hydraulic_power_w', label: 'Hydraulic power p Q', group: 'power', unit: 'W', display: 'kW' },
    { id: 'cap_volume_m3', label: 'Oil volume to extend (cap end × stroke)', group: 'volume', unit: 'm3', display: 'L' },
    { id: 'annulus_volume_m3', label: 'Oil volume to retract (annulus × stroke)', group: 'volume', unit: 'm3', display: 'L' },
    { id: 'rod_euler_load_n', label: 'Rod Euler buckling load π² E I / (K s)² (fully extended)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'rod_buckling_factor', label: 'Buckling safety factor = Euler load ÷ push force', group: 'dimensionless', unit: 'none' },
    { id: 'rod_max_stroke_m', label: 'Maximum stroke for the required safety factor at this push force', group: 'length', unit: 'm', display: 'mm' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      cap_area_m2: '78.5 cm²',
      annulus_area_m2: '53.9 cm²',
      area_ratio: '1.46',
      push_force_n: '141 kN',
      pull_force_n: '97 kN',
      extend_speed_m_s: '0.085 m/s',
      retract_speed_m_s: '0.124 m/s',
      extend_time_s: '5.9 s',
    },
  },
};

/** Cap, annulus and rod areas, m². */
export function cylinderAreas(boreM, rodM) {
  const cap = (Math.PI * boreM * boreM) / 4;
  const rod = (Math.PI * rodM * rodM) / 4;
  return { cap, rod, annulus: cap - rod };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.bore_m, 'bore_m', 'Bore');
  assertPositive(i.rod_m, 'rod_m', 'Rod diameter');
  if (i.rod_m >= i.bore_m) throw new Error('Rod diameter must be smaller than the bore');
  assertNonNegative(i.pressure_pa, 'pressure_pa', 'Pressure');
  assertNonNegative(i.flow_m3_s, 'flow_m3_s', 'Flow');
  assertPositive(i.stroke_m, 'stroke_m', 'Stroke');
  assertRange(i.efficiency, 0.1, 1, 'efficiency', 'Efficiency');
  assertOneOf(i.mounting, Object.keys(MOUNTINGS), 'mounting', 'Mounting');
  assertPositive(i.rod_modulus_pa, 'rod_modulus_pa', "Rod Young's modulus");
  assertRange(i.buckling_safety_factor, 1, 20, 'buckling_safety_factor', 'Safety factor');

  const areas = cylinderAreas(i.bore_m, i.rod_m);
  const push = i.pressure_pa * areas.cap * i.efficiency;
  const pull = i.pressure_pa * areas.annulus * i.efficiency;
  const extendSpeed = i.flow_m3_s / areas.cap;
  const retractSpeed = i.flow_m3_s / areas.annulus;
  const K = MOUNTINGS[i.mounting].k;
  const rodI = circleSection(i.rod_m).iMinor;
  const eulerLoad = (Math.PI ** 2 * i.rod_modulus_pa * rodI) / (K * i.stroke_m) ** 2;
  const bucklingFactor = push > 0 ? eulerLoad / push : null;
  const maxStroke = push > 0 ? Math.sqrt((Math.PI ** 2 * i.rod_modulus_pa * rodI) / (i.buckling_safety_factor * push)) / K : null;

  const warnings = [];
  if (bucklingFactor !== null && bucklingFactor < i.buckling_safety_factor) warnings.push(`Rod buckling factor ${bucklingFactor.toFixed(2)} is below the required ${i.buckling_safety_factor}: shorten the stroke, use a larger rod or add a stop tube / better guiding.`);
  if (i.pressure_pa > 350e5) warnings.push('Pressure above 350 bar exceeds the usual industrial cylinder rating; check the cylinder series.');
  if (extendSpeed > 0.5) warnings.push('Extend speed above 0.5 m/s: cushioning and seal speed limits need checking (standard seals are rated to about 0.5–1 m/s).');
  if (i.efficiency === 1) warnings.push('Efficiency 1.0 ignores seal friction; catalogue practice uses 0.85–0.95.');
  warnings.push('Static figures with the full pump flow and the entered differential pressure; valve losses, back-pressure and acceleration are not included.');

  return {
    outputs: {
      cap_area_m2: areas.cap,
      annulus_area_m2: areas.annulus,
      area_ratio: areas.cap / areas.annulus,
      push_force_n: push,
      pull_force_n: pull,
      extend_speed_m_s: extendSpeed,
      retract_speed_m_s: retractSpeed,
      extend_time_s: extendSpeed > 0 ? i.stroke_m / extendSpeed : null,
      retract_time_s: retractSpeed > 0 ? i.stroke_m / retractSpeed : null,
      return_flow_m3_s: i.flow_m3_s * (areas.annulus / areas.cap),
      regen_speed_m_s: i.flow_m3_s / areas.rod,
      regen_force_n: i.pressure_pa * areas.rod * i.efficiency,
      hydraulic_power_w: i.pressure_pa * i.flow_m3_s,
      cap_volume_m3: areas.cap * i.stroke_m,
      annulus_volume_m3: areas.annulus * i.stroke_m,
      rod_euler_load_n: eulerLoad,
      rod_buckling_factor: bucklingFactor,
      rod_max_stroke_m: maxStroke,
    },
    warnings,
  };
}
