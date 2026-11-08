/**
 * column-buckling/calc.js — Euler and Johnson critical loads of a compression member with the end-condition factor K.
 *
 * Euler: P_cr = π² E I / (K L)²;  Johnson parabola for KL/r below the transition π √(2E/σ_y): σ_cr = σ_y − (σ_y² / 4π² E) (KL/r)².
 * Section properties (weak axis) from shared/sections.js.
 * Schema units: SI — m, Pa, N.
 */
import { rectangleSection, hollowRectangleSection, circleSection, hollowCircleSection, iSection, radiusOfGyration } from '../shared/sections.js';
import { withDefaults, assertPositive, assertNonNegative, assertOneOf, assertRange } from '../shared/validate.js';

/** Effective-length factors: theoretical (ideal) and recommended design values (AISC Commentary Table C-A-7.1). */
export const END_CONDITIONS = {
  pinned_pinned: { label: 'Pinned – pinned', theoretical: 1.0, recommended: 1.0 },
  fixed_fixed: { label: 'Fixed – fixed', theoretical: 0.5, recommended: 0.65 },
  fixed_pinned: { label: 'Fixed – pinned', theoretical: 0.7, recommended: 0.8 },
  fixed_free: { label: 'Fixed – free (flagpole)', theoretical: 2.0, recommended: 2.1 },
  fixed_guided: { label: 'Fixed – guided (sway, no rotation at the top)', theoretical: 1.0, recommended: 1.2 },
};

export const MATERIALS = {
  steel_s235: { label: 'Structural steel S235 (E 210 GPa, f_y 235 MPa)', e: 210e9, yieldPa: 235e6 },
  steel_s355: { label: 'Structural steel S355 (E 210 GPa, f_y 355 MPa)', e: 210e9, yieldPa: 355e6 },
  steel_a36: { label: 'ASTM A36 (E 200 GPa, f_y 250 MPa)', e: 200e9, yieldPa: 250e6 },
  stainless_304: { label: 'Stainless 304 (E 193 GPa, f_y 205 MPa)', e: 193e9, yieldPa: 205e6 },
  aluminium_6061: { label: 'Aluminium 6061-T6 (E 69 GPa, f_y 240 MPa)', e: 69e9, yieldPa: 240e6 },
  timber_c24: { label: 'Timber C24 parallel to grain (E 11 GPa, f_c 21 MPa)', e: 11e9, yieldPa: 21e6 },
  custom: { label: 'Custom E and yield', e: null, yieldPa: null },
};

export const SECTIONS = {
  rectangle: { label: 'Solid rectangle b × h (buckles about the weak axis)' },
  hollow_rectangle: { label: 'Rectangular hollow section b × h, wall t' },
  circle: { label: 'Solid circle, diameter d' },
  hollow_circle: { label: 'Circular hollow section, outside diameter D, wall t' },
  i_beam: { label: 'I / H section: flange b × t_f, depth h, web t_w (weak axis, no fillets)' },
  custom: { label: 'Custom: area and minimum second moment of area' },
};

export const schema = {
  id: 'column-buckling',
  name: 'Column buckling (Euler and Johnson)',
  category: 'structural',
  summary: 'Critical buckling load of a compression member by Euler or the Johnson parabola, with end-condition factors, slenderness, allowable load and utilisation.',
  related: ['beam-deflection', 'thermal-expansion', 'shaft-torque', 'lifting-sling'],
  assumptions: [
    'Ideal elastic column: straight, homogeneous, concentrically loaded, with the effective length K L set by the end conditions; real columns have initial crookedness and load eccentricity, which design codes cover with buckling curves (EN 1993-1-1 §6.3, AISC E3) and a safety factor — the Euler/Johnson result is the theoretical capacity.',
    'Buckling occurs about the weak axis (minimum I) over the full unbraced length; if the weak axis is braced at intermediate points, enter the braced length or the strong-axis I as a custom section.',
    'The Johnson parabola is used for slenderness ratios below the transition (KL/r)₁ = π √(2E/σ_y), where the Euler stress would exceed half the yield stress; it is the classic machine-design treatment (Shigley) of inelastic buckling, not a code curve.',
    'Effective-length factors: the theoretical values assume perfectly rigid or perfectly free ends; the recommended design values (AISC Table C-A-7.1) allow for the fact that fixed ends are never fully fixed, and are the default.',
    'Local buckling of thin flanges or walls, torsional and flexural-torsional buckling of open sections, and lateral-torsional buckling are not checked; the I-section weak-axis I ignores root fillets.',
    'Allowable load = critical load ÷ the entered factor of safety; typical factors are 1.67–1.92 (AISC ASD) for structures and 2–3 for machine members with uncertain loads.',
    'Material presets are nominal values; timber uses the compressive strength parallel to the grain in place of yield.',
  ],
  notes: [
    'Verification 2026-10-30: a 3 m pinned 50 mm steel rod gives the textbook Euler load π² × 200 GPa × 3.068 ×10⁻⁷ / 9 = 67.3 kN at KL/r = 240; the S235 transition slenderness 129.6 and the Johnson load at KL/r = 100 (σ_cr = 165 MPa, 324 kN) were checked by hand.',
    'Design decision: Euler and Johnson values are both reported and the governing one is named, so the user sees where the column sits relative to the transition.',
    'Design decision: section properties come from shared/sections.js (shared with beams and shafts) and the weak-axis I is used automatically.',
  ],
  sources: [
    "Budynas & Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §4-12 to §4-14 (Euler columns, Johnson parabola, transition slenderness)",
    'Hibbeler, Mechanics of Materials, 10th ed., ch. 13 "Buckling of columns" (Euler load, effective length)',
    'AISC Steel Construction Manual, 15th ed., Commentary Table C-A-7.1 (approximate values of effective length factor K)',
    'EN 1993-1-1 §6.3 and EN 338 (material values for steel grades and timber C24)',
  ],
  inputs: [
    { id: 'section', label: 'Cross-section', type: 'select', default: 'hollow_circle', options: Object.entries(SECTIONS).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'width_m', label: 'Width b (minor dimension / flange width)', group: 'length', unit: 'm', display: 'mm', default: 0.1, min: 0.001, max: 10, visibleWhen: { section: ['rectangle', 'hollow_rectangle', 'i_beam'] } },
    { id: 'height_m', label: 'Depth h', group: 'length', unit: 'm', display: 'mm', default: 0.2, min: 0.001, max: 10, visibleWhen: { section: ['rectangle', 'hollow_rectangle', 'i_beam'] } },
    { id: 'diameter_m', label: 'Diameter d (outside for a tube)', group: 'length', unit: 'm', display: 'mm', default: 0.1397, min: 0.001, max: 10, visibleWhen: { section: ['circle', 'hollow_circle'] } },
    { id: 'wall_m', label: 'Wall thickness t', group: 'length', unit: 'm', display: 'mm', default: 0.006, min: 0.0001, max: 1, visibleWhen: { section: ['hollow_rectangle', 'hollow_circle'] } },
    { id: 'flange_m', label: 'Flange thickness t_f', group: 'length', unit: 'm', display: 'mm', default: 0.0085, min: 0.0001, max: 1, visibleWhen: { section: 'i_beam' } },
    { id: 'web_m', label: 'Web thickness t_w', group: 'length', unit: 'm', display: 'mm', default: 0.0056, min: 0.0001, max: 1, visibleWhen: { section: 'i_beam' } },
    { id: 'area_custom_m2', label: 'Cross-section area A', group: 'area', unit: 'm2', display: 'cm2', default: 28.5e-4, min: 1e-8, max: 10, visibleWhen: { section: 'custom' } },
    { id: 'i_custom_m4', label: 'Minimum second moment of area I_min', group: 'second_moment_of_area', unit: 'm4', display: 'cm4', default: 142e-8, min: 1e-14, max: 100, visibleWhen: { section: 'custom' } },
    { id: 'length_m', label: 'Unbraced length L', group: 'length', unit: 'm', default: 4, min: 0.01, max: 200 },
    { id: 'end_condition', label: 'End conditions', type: 'select', default: 'pinned_pinned', options: Object.entries(END_CONDITIONS).map(([value, c]) => ({ value, label: `${c.label} (K = ${c.theoretical} theoretical, ${c.recommended} design)` })) },
    {
      id: 'k_basis',
      label: 'Effective-length factor',
      type: 'select',
      default: 'recommended',
      options: [
        { value: 'recommended', label: 'Recommended design value (AISC)' },
        { value: 'theoretical', label: 'Theoretical ideal value' },
      ],
    },
    { id: 'material', label: 'Material', type: 'select', default: 'steel_s235', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'modulus_pa', label: "Young's modulus E", group: 'pressure', unit: 'Pa', display: 'GPa', default: 210e9, min: 1e8, max: 1e12, visibleWhen: { material: 'custom' } },
    { id: 'yield_pa', label: 'Yield (or compressive) strength σ_y', group: 'pressure', unit: 'Pa', display: 'MPa', default: 235e6, min: 1e5, max: 5e9, visibleWhen: { material: 'custom' } },
    { id: 'axial_load_n', label: 'Applied axial compression P', group: 'force', unit: 'N', display: 'kN', default: 200000, min: 0, max: 1e9 },
    { id: 'safety_factor', label: 'Factor of safety on the critical load', group: 'dimensionless', unit: 'none', default: 1.92, min: 1, max: 10, help: 'AISC ASD 1.67 (short) to 1.92 (slender); machine design 2–3.' },
  ],
  outputs: [
    { id: 'area_m2', label: 'Cross-section area A', group: 'area', unit: 'm2', display: 'cm2' },
    { id: 'i_min_m4', label: 'Minimum second moment of area I_min', group: 'second_moment_of_area', unit: 'm4', display: 'cm4' },
    { id: 'radius_gyration_m', label: 'Radius of gyration r = √(I/A)', group: 'length', unit: 'm', display: 'mm' },
    { id: 'k_factor', label: 'Effective-length factor K used', group: 'dimensionless', unit: 'none' },
    { id: 'effective_length_m', label: 'Effective length K L', group: 'length', unit: 'm' },
    { id: 'slenderness', label: 'Slenderness ratio K L / r', group: 'dimensionless', unit: 'none' },
    { id: 'transition_slenderness', label: 'Transition slenderness π √(2E/σ_y)', group: 'dimensionless', unit: 'none' },
    { id: 'regime', label: 'Column type', type: 'text' },
    { id: 'euler_load_n', label: 'Euler critical load π² E I / (K L)²', group: 'force', unit: 'N', display: 'kN' },
    { id: 'euler_stress_pa', label: 'Euler critical stress', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'johnson_load_n', label: 'Johnson critical load (intermediate columns)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'critical_load_n', label: 'Governing critical load', group: 'force', unit: 'N', display: 'kN' },
    { id: 'critical_stress_pa', label: 'Governing critical stress', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'allowable_load_n', label: 'Allowable load = critical ÷ factor of safety', group: 'force', unit: 'N', display: 'kN' },
    { id: 'utilisation_pct', label: 'Applied load ÷ allowable load', group: 'ratio', unit: 'pct' },
    { id: 'yield_load_n', label: 'Squash load A σ_y (for reference)', group: 'force', unit: 'N', display: 'kN' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      area_m2: '25.2 cm²',
      i_min_m4: '564 cm⁴',
      radius_gyration_m: '4.73 cm',
      slenderness: '84.5',
      transition_slenderness: '132.8',
      euler_load_n: '731 kN',
      euler_stress_pa: '290 MPa',
      johnson_load_n: '472 kN',
    },
  },
};

/** Euler critical load, N. */
export function eulerLoadN(modulusPa, iMinM4, effectiveLengthM) {
  return (Math.PI ** 2 * modulusPa * iMinM4) / effectiveLengthM ** 2;
}

/** Transition slenderness between Johnson and Euler. */
export function transitionSlenderness(modulusPa, yieldPa) {
  return Math.PI * Math.sqrt((2 * modulusPa) / yieldPa);
}

/** Johnson parabola critical stress, Pa (valid below the transition slenderness). */
export function johnsonStressPa(modulusPa, yieldPa, slenderness) {
  return yieldPa - (yieldPa ** 2 / (4 * Math.PI ** 2 * modulusPa)) * slenderness ** 2;
}

/** Weak-axis section properties for the schema inputs. */
export function columnSection(i) {
  const weak = (s) => ({ area: s.area, iMin: Math.min(s.iMajor, s.iMinor) });
  switch (i.section) {
    case 'rectangle':
      return weak(rectangleSection(i.width_m, i.height_m));
    case 'hollow_rectangle':
      return weak(hollowRectangleSection(i.width_m, i.height_m, i.wall_m));
    case 'circle':
      return weak(circleSection(i.diameter_m));
    case 'hollow_circle':
      return weak(hollowCircleSection(i.diameter_m, i.wall_m));
    case 'i_beam':
      return weak(iSection(i.width_m, i.height_m, i.flange_m, i.web_m));
    case 'custom':
      return { area: assertPositive(i.area_custom_m2, 'area_custom_m2', 'Area'), iMin: assertPositive(i.i_custom_m4, 'i_custom_m4', 'Minimum second moment of area') };
    default:
      throw new Error(`Unknown section "${i.section}"`);
  }
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.section, Object.keys(SECTIONS), 'section', 'Cross-section');
  assertOneOf(i.end_condition, Object.keys(END_CONDITIONS), 'end_condition', 'End conditions');
  assertOneOf(i.k_basis, ['recommended', 'theoretical'], 'k_basis', 'Effective-length basis');
  assertOneOf(i.material, Object.keys(MATERIALS), 'material', 'Material');
  assertPositive(i.length_m, 'length_m', 'Unbraced length');
  assertNonNegative(i.axial_load_n, 'axial_load_n', 'Axial load');
  assertRange(i.safety_factor, 1, 20, 'safety_factor', 'Factor of safety');
  for (const id of ['width_m', 'height_m', 'wall_m', 'diameter_m', 'flange_m', 'web_m']) assertPositive(i[id], id, id);

  const E = i.material === 'custom' ? assertPositive(i.modulus_pa, 'modulus_pa', "Young's modulus") : MATERIALS[i.material].e;
  const yieldPa = i.material === 'custom' ? assertPositive(i.yield_pa, 'yield_pa', 'Yield strength') : MATERIALS[i.material].yieldPa;
  const section = columnSection(i);
  const r = radiusOfGyration(section.iMin, section.area);
  const K = END_CONDITIONS[i.end_condition][i.k_basis];
  const effectiveLength = K * i.length_m;
  const slenderness = effectiveLength / r;
  const transition = transitionSlenderness(E, yieldPa);
  const eulerLoad = eulerLoadN(E, section.iMin, effectiveLength);
  const eulerStress = eulerLoad / section.area;
  const isLong = slenderness >= transition;
  const johnsonStress = isLong ? null : johnsonStressPa(E, yieldPa, slenderness);
  const criticalStress = isLong ? eulerStress : johnsonStress;
  const criticalLoad = criticalStress * section.area;
  const allowable = criticalLoad / i.safety_factor;

  let regime;
  if (slenderness < 0.2 * transition) regime = `Short column (KL/r ${slenderness.toFixed(0)} ≪ ${transition.toFixed(0)}): crushing governs, Johnson ≈ squash load`;
  else if (isLong) regime = `Long (Euler) column: KL/r ${slenderness.toFixed(0)} ≥ transition ${transition.toFixed(0)}`;
  else regime = `Intermediate column: KL/r ${slenderness.toFixed(0)} < transition ${transition.toFixed(0)}, Johnson parabola governs`;

  const warnings = [];
  if (i.axial_load_n > allowable) warnings.push('Applied load exceeds the allowable load: the column is inadequate at this factor of safety.');
  if (slenderness > 200) warnings.push('Slenderness above 200: most codes limit compression members to KL/r ≤ 200 (AISC) because small imperfections dominate.');
  if (i.section === 'hollow_circle' && i.diameter_m / i.wall_m > 90) warnings.push('D/t above 90: thin-walled tube, check local (shell) buckling.');
  if (i.section === 'hollow_rectangle' && Math.min(i.width_m, i.height_m) / i.wall_m > 40) warnings.push('Wall slenderness above 40: check local plate buckling of the walls.');
  if (i.section === 'i_beam') warnings.push('Weak-axis flexural buckling only; open sections can also fail by torsional or flexural-torsional buckling, and the fillet-free I is about 5 % low.');
  if (i.k_basis === 'theoretical' && i.end_condition !== 'pinned_pinned') warnings.push('Theoretical K assumes perfectly rigid fixity; design practice uses the recommended values.');
  warnings.push('Theoretical capacity of a perfect column; codes reduce it for imperfections (buckling curves) — compare with EN 1993-1-1 §6.3 or AISC E3 for a design check.');

  return {
    outputs: {
      area_m2: section.area,
      i_min_m4: section.iMin,
      radius_gyration_m: r,
      k_factor: K,
      effective_length_m: effectiveLength,
      slenderness,
      transition_slenderness: transition,
      regime,
      euler_load_n: eulerLoad,
      euler_stress_pa: eulerStress,
      johnson_load_n: johnsonStress === null ? null : johnsonStress * section.area,
      critical_load_n: criticalLoad,
      critical_stress_pa: criticalStress,
      allowable_load_n: allowable,
      utilisation_pct: allowable > 0 ? (i.axial_load_n / allowable) * 100 : null,
      yield_load_n: section.area * yieldPa,
    },
    warnings,
  };
}
