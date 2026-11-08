/**
 * pressure-vessel/calc.js — membrane stresses in thin-walled cylinders and spheres, the Lamé thick-wall check,
 * ASME Section VIII Division 1 required thickness and maximum allowable working pressure, and the end-cap load.
 *
 * Thin wall: σ_hoop = p R / t, σ_long = p R / (2t), sphere σ = p R / (2t).  Lamé (thick wall) σ_hoop,max = p (r_o² + r_i²)/(r_o² − r_i²).
 * ASME VIII-1 UG-27: cylinder t = p R / (S E − 0.6 p), sphere t = p R / (2 S E − 0.2 p); MAWP = S E t / (R + 0.6 t).
 * Schema units: SI — m, Pa, N.
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf } from '../shared/validate.js';

export const JOINT_EFFICIENCIES = {
  e100: { label: 'E = 1.00: full radiography (Type 1 butt weld) or seamless', value: 1.0 },
  e85: { label: 'E = 0.85: spot radiography', value: 0.85 },
  e70: { label: 'E = 0.70: no radiography', value: 0.7 },
};

/** Thin-wall limit used by most textbooks: wall thickness up to one tenth of the radius. */
export const THIN_WALL_RATIO = 0.1;

export const schema = {
  id: 'pressure-vessel',
  name: 'Thin-wall pressure vessel',
  category: 'mechanical',
  summary: 'Hoop and longitudinal stress in cylinders and spheres, Lamé thick-wall check, ASME VIII-1 required thickness and MAWP with joint efficiency and corrosion.',
  related: ['bolt-torque', 'pipe-flow', 'thermal-expansion', 'beam-deflection'],
  sendTo: [
    {
      target: 'relief-valve-api520',
      label: 'Relief valve sizing (API 520) at the MAWP',
      note: 'The set pressure is the MAWP of the vessel, the highest allowed (ASME VIII UG-134); enter the required relieving flow and the fluid there.',
      links: [{ to: 'set_pressure_kpa', from: 'mawp_pa' }],
    },
  ],
  assumptions: [
    'Thin-wall membrane theory: stresses are uniform through the wall and the radial stress is neglected; accurate within about 5 % when the wall is at most one tenth of the radius. The Lamé maximum hoop stress at the inner surface is shown for comparison and the calculator warns when the thin-wall limit is exceeded.',
    'Internal gauge pressure only, on a cylinder far from its ends or on a complete sphere: stress concentrations at heads, nozzles, supports, welds and the head-to-shell junction are not evaluated; external pressure (vacuum, submergence) requires a buckling check (ASME UG-28) that is not included.',
    'The ASME formulas are those of Section VIII Division 1 UG-27 for the circumferential stress of cylindrical shells and for spherical shells, with R the inside radius in the corroded condition; they are valid for t ≤ R/2 and p ≤ 0.385 S E (cylinder) or p ≤ 0.665 S E (sphere), outside which Appendix 1 thick-wall formulas apply.',
    'The allowable stress S is the code value for the material at the design temperature (e.g. SA-516 Gr 70: 138 MPa up to about 340 °C in Division 1); the calculator does not look it up.',
    'Joint efficiency E reflects the weld radiography (1.0, 0.85, 0.7); the corrosion allowance is added to the required thickness and subtracted from the actual thickness for the MAWP.',
    'The end-cap force p π R² is the axial load carried by the heads and transferred through the shell; it sizes closures and bolted flanges but is not the flange design itself (ASME Appendix 2).',
    'Mill undertolerance, forming thinning, hydrotest and fatigue (ASME VIII-2 Part 5) are outside this calculator.',
  ],
  notes: [
    'Verification 2026-10-30: the 2 m × 10 mm cylinder at 10 bar gives 100 MPa hoop / 50 MPa longitudinal by thin-wall theory and 100.5 MPa by Lamé (0.5 % apart, as expected at t/R = 0.01); the ASME required thickness 7.28 mm at S = 138 MPa, E = 1 and MAWP 1.37 MPa for 10 mm were checked by hand.',
    'Design decision: both the textbook thin-wall stresses and the ASME code thickness are shown, because students learn the first and engineers are asked for the second.',
    'Design decision: the ASME validity limits (t ≤ R/2, p ≤ 0.385 S E) are checked and warned rather than silently switching to the thick-wall appendix formulas.',
  ],
  sources: [
    'Hibbeler, Mechanics of Materials, 10th ed., ch. 8-1 "Thin-walled pressure vessels"',
    'ASME Boiler and Pressure Vessel Code, Section VIII Division 1 (2023), UG-27 Thickness of shells under internal pressure, UG-16 minimum thickness, UG-25 corrosion allowance, UW-12 joint efficiencies',
    "Young, Budynas & Sadegh, Roark's Formulas for Stress and Strain, 8th ed., Table 13.5 (thick-walled cylinders, Lamé)",
    'ASME Section II Part D, allowable stresses (e.g. SA-516 Gr 70: 20.0 ksi = 138 MPa)',
  ],
  inputs: [
    {
      id: 'geometry',
      label: 'Vessel',
      type: 'select',
      default: 'cylinder',
      options: [
        { value: 'cylinder', label: 'Cylindrical shell (away from the heads)' },
        { value: 'sphere', label: 'Spherical shell' },
      ],
    },
    { id: 'inside_diameter_m', label: 'Inside diameter D', group: 'length', unit: 'm', default: 2.0, min: 0.01, max: 50 },
    { id: 'thickness_m', label: 'Wall thickness t (as built)', group: 'length', unit: 'm', display: 'mm', default: 0.010, min: 0.0001, max: 1 },
    { id: 'pressure_pa', label: 'Internal design pressure p (gauge)', group: 'pressure', unit: 'Pa', display: 'bar', default: 1e6, min: 0, max: 1e9 },
    { id: 'allowable_stress_pa', label: 'Allowable stress S at design temperature (code)', group: 'pressure', unit: 'Pa', display: 'MPa', default: 138e6, min: 1e6, max: 1e9, help: 'ASME II-D: SA-516 Gr 70 138 MPa, SA-240 304 115–138 MPa, SA-106 B 118 MPa (temperature dependent).' },
    { id: 'joint_efficiency', label: 'Weld joint efficiency E', type: 'select', default: 'e100', options: Object.entries(JOINT_EFFICIENCIES).map(([value, e]) => ({ value, label: e.label })) },
    { id: 'corrosion_allowance_m', label: 'Corrosion allowance c', group: 'length', unit: 'm', display: 'mm', default: 0, min: 0, max: 0.05 },
  ],
  outputs: [
    { id: 'thickness_to_radius', label: 'Wall thickness ÷ inside radius t / R', group: 'dimensionless', unit: 'none' },
    { id: 'wall_regime', label: 'Wall classification', type: 'text' },
    { id: 'hoop_stress_pa', label: 'Hoop (circumferential) stress σ_h = p R / t', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'longitudinal_stress_pa', label: 'Longitudinal stress σ_l = p R / (2 t) (cylinder; sphere equals hoop)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'lame_hoop_stress_pa', label: 'Lamé maximum hoop stress at the inner surface (thick-wall)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'stress_utilisation_pct', label: 'Hoop stress ÷ (S × E)', group: 'ratio', unit: 'pct' },
    { id: 'required_thickness_m', label: 'ASME VIII-1 required thickness (incl. corrosion allowance)', group: 'length', unit: 'm', display: 'mm' },
    { id: 'thickness_margin_m', label: 'Thickness margin: as built − required', group: 'length', unit: 'm', display: 'mm' },
    { id: 'mawp_pa', label: 'Maximum allowable working pressure for the corroded thickness', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'end_force_n', label: 'Axial force on each head p π R²', group: 'force', unit: 'N', display: 'kN' },
    { id: 'asme_check', label: 'ASME formula validity', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      hoop_stress_pa: '100 MPa',
      longitudinal_stress_pa: '50 MPa',
      lame_hoop_stress_pa: '100.5 MPa',
      required_thickness_m: '7.28 mm',
      thickness_margin_m: '2.7 mm',
      mawp_pa: '1.37 MPa',
      end_force_n: '3.14 MN',
    },
  },
};

/** Thin-wall membrane stresses, Pa. */
export function thinWallStresses(geometry, pressurePa, insideRadiusM, thicknessM) {
  const hoop = geometry === 'sphere' ? (pressurePa * insideRadiusM) / (2 * thicknessM) : (pressurePa * insideRadiusM) / thicknessM;
  const longitudinal = (pressurePa * insideRadiusM) / (2 * thicknessM);
  return { hoop, longitudinal };
}

/** Lamé maximum hoop stress at the inner surface of a thick cylinder or sphere under internal pressure, Pa. */
export function lameMaxHoopStress(geometry, pressurePa, innerRadiusM, outerRadiusM) {
  const ri2 = innerRadiusM ** 2;
  const ro2 = outerRadiusM ** 2;
  if (geometry === 'sphere') {
    const ri3 = innerRadiusM ** 3;
    const ro3 = outerRadiusM ** 3;
    return (pressurePa * (ro3 + 2 * ri3)) / (2 * (ro3 - ri3));
  }
  return (pressurePa * (ro2 + ri2)) / (ro2 - ri2);
}

/** ASME VIII-1 UG-27 required thickness (without corrosion allowance), m. */
export function asmeRequiredThickness(geometry, pressurePa, insideRadiusM, allowablePa, efficiency) {
  if (geometry === 'sphere') return (pressurePa * insideRadiusM) / (2 * allowablePa * efficiency - 0.2 * pressurePa);
  return (pressurePa * insideRadiusM) / (allowablePa * efficiency - 0.6 * pressurePa);
}

/** ASME VIII-1 UG-27 maximum allowable working pressure for a thickness t, Pa. */
export function asmeMawp(geometry, thicknessM, insideRadiusM, allowablePa, efficiency) {
  if (geometry === 'sphere') return (2 * allowablePa * efficiency * thicknessM) / (insideRadiusM + 0.2 * thicknessM);
  return (allowablePa * efficiency * thicknessM) / (insideRadiusM + 0.6 * thicknessM);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.geometry, ['cylinder', 'sphere'], 'geometry', 'Vessel');
  assertPositive(i.inside_diameter_m, 'inside_diameter_m', 'Inside diameter');
  assertPositive(i.thickness_m, 'thickness_m', 'Wall thickness');
  assertNonNegative(i.pressure_pa, 'pressure_pa', 'Pressure');
  assertPositive(i.allowable_stress_pa, 'allowable_stress_pa', 'Allowable stress');
  assertOneOf(i.joint_efficiency, Object.keys(JOINT_EFFICIENCIES), 'joint_efficiency', 'Joint efficiency');
  assertNonNegative(i.corrosion_allowance_m, 'corrosion_allowance_m', 'Corrosion allowance');
  if (i.corrosion_allowance_m >= i.thickness_m) throw new Error('Corrosion allowance must be less than the wall thickness');

  const E = JOINT_EFFICIENCIES[i.joint_efficiency].value;
  const R = i.inside_diameter_m / 2;
  const t = i.thickness_m;
  const tCorroded = t - i.corrosion_allowance_m;
  const stresses = thinWallStresses(i.geometry, i.pressure_pa, R, t);
  const lame = lameMaxHoopStress(i.geometry, i.pressure_pa, R, R + t);
  const requiredNet = asmeRequiredThickness(i.geometry, i.pressure_pa, R, i.allowable_stress_pa, E);
  const required = requiredNet + i.corrosion_allowance_m;
  const mawp = asmeMawp(i.geometry, tCorroded, R, i.allowable_stress_pa, E);
  const ratio = t / R;

  const pressureLimit = i.geometry === 'sphere' ? 0.665 * i.allowable_stress_pa * E : 0.385 * i.allowable_stress_pa * E;
  const asmeValid = tCorroded <= R / 2 && i.pressure_pa <= pressureLimit && requiredNet > 0;

  const warnings = [];
  if (ratio > THIN_WALL_RATIO) warnings.push(`t/R = ${ratio.toFixed(3)} exceeds 0.1: thin-wall theory understates the inner-surface stress; use the Lamé value (${(lame / 1e6).toFixed(1)} MPa).`);
  if (!asmeValid) warnings.push('Outside the UG-27 validity limits (t ≤ R/2 and p ≤ 0.385 S E for cylinders, 0.665 S E for spheres): use the ASME Appendix 1 thick-wall formulas.');
  if (t < required) warnings.push('As-built thickness is below the ASME required thickness for this pressure, allowable stress, joint efficiency and corrosion allowance.');
  if (stresses.hoop > i.allowable_stress_pa * E) warnings.push('Thin-wall hoop stress exceeds S × E.');
  warnings.push('Membrane stress only: heads, nozzles, supports, external pressure and fatigue need their own code checks.');

  return {
    outputs: {
      thickness_to_radius: ratio,
      wall_regime: ratio <= THIN_WALL_RATIO ? `Thin wall (t/R ≤ 0.1): membrane theory within about ${(ratio * 50).toFixed(1)} %` : 'Thick wall (t/R > 0.1): use Lamé / thick-wall formulas',
      hoop_stress_pa: stresses.hoop,
      longitudinal_stress_pa: stresses.longitudinal,
      lame_hoop_stress_pa: lame,
      stress_utilisation_pct: (stresses.hoop / (i.allowable_stress_pa * E)) * 100,
      required_thickness_m: requiredNet > 0 ? required : null,
      thickness_margin_m: requiredNet > 0 ? t - required : null,
      mawp_pa: mawp,
      end_force_n: i.pressure_pa * Math.PI * R * R,
      asme_check: asmeValid ? 'UG-27 formulas valid (t ≤ R/2, p within the code limit)' : 'Outside UG-27 limits — thick-wall rules apply',
    },
    warnings,
  };
}
