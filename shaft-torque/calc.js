/**
 * shaft-torque/calc.js — torque from power and speed, torsional shear stress and twist of solid or hollow circular
 * shafts, required diameter for an allowable shear stress, combined bending + torsion, and the IACS UR M68 minimum
 * propulsion-shaft diameter.
 *
 * T = P / ω = 9 549.3 P[kW] / n[rpm] N·m;  τ = T r / J with J = π (d_o⁴ − d_i⁴) / 32;  θ = T L / (G J).
 * Schema units: SI — W, rpm, m, Pa, N·m.
 */
import { polarMomentCircle } from '../shared/sections.js';
import { withDefaults, assertPositive, assertNonNegative, assertOneOf, assertRange } from '../shared/validate.js';

/** IACS UR M68 factors F (by installation type) and k (by shaft design feature). */
export const RULE_F_FACTORS = {
  f95: { label: 'F = 95: intermediate shafts in turbine, electric or slip-coupling installations', value: 95 },
  f100: { label: 'F = 100: all other diesel installations and all propeller shafts', value: 100 },
};
export const RULE_K_FACTORS = {
  plain: { label: 'k = 1.00: intermediate shaft with integral flanges or keyless shrink-fit coupling', value: 1.0 },
  keyway: { label: 'k = 1.10: intermediate shaft with keyway, transverse hole or radial hole', value: 1.1 },
  longitudinal_slot: { label: 'k = 1.20: intermediate shaft with longitudinal slot', value: 1.2 },
  propeller_keyless: { label: 'k = 1.22: propeller shaft, keyless or flanged propeller, oil-lubricated', value: 1.22 },
  propeller_keyed: { label: 'k = 1.26: propeller shaft with keyed propeller or water-lubricated bearing', value: 1.26 },
};

const SHEAR_MODULUS_STEEL_PA = 80e9;

export const schema = {
  id: 'shaft-torque',
  name: 'Shaft torque, power and diameter',
  category: 'mechanical',
  summary: 'Torque from power and speed, shear stress and twist of solid or hollow shafts, required diameter, combined bending, and the IACS UR M68 rule diameter.',
  related: ['propeller-slip', 'pump-affinity', 'bolt-torque', 'beam-deflection'],
  assumptions: [
    'Torque follows from power and rotational speed with no transmission loss: T = P/ω; enter shaft power for shaft torque and brake power for the engine output flange.',
    'Elastic torsion of a straight circular shaft (solid or hollow): τ = T r / J with the maximum at the outer surface; stress concentrations at keyways, fillets, holes and shrink fits are not included in the stress outputs (they are in the rule k factors).',
    'The angle of twist uses a uniform shaft of length L and shear modulus G (steel 79–81 GPa); stepped shafts need to be summed section by section.',
    'The required diameter for an allowable shear stress is the simple strength sizing at the same hollowness ratio; fatigue, vibration (torsional and whirling), deflection and alignment usually govern long shafts and are not covered.',
    'Combined bending and torsion uses the maximum-shear-stress (Tresca) equivalent torque T_e = √(M² + T²) and the maximum-principal-stress equivalent moment M_e = (M + T_e)/2 for a steady bending moment; alternating bending on a rotating shaft is a fatigue problem.',
    'The IACS UR M68 rule diameter d = F k [P / (n (1 − Q⁴)) × 560 / (σ_B + 160)]^(1/3) mm is reproduced with the standard F and k factors; the rule limits the tensile strength σ_B that may be used (600 N/mm² for carbon/carbon-manganese steel and for propeller shafts, 800 N/mm² for alloy-steel intermediate shafts) — enter the capped value — and the rule is a minimum, not a design.',
    'Rule check applies to propulsion shafting of conventional ships; thrusters, gearbox shafts and non-marine machinery follow other codes.',
  ],
  notes: [
    'Verification 2026-10-30: T = 9 549.3 P/n reproduces the Shigley relation (eq. 3-42); the 8 000 kW / 90 rpm case (848.8 kN·m, 47.4 MPa on a 450 mm solid shaft, 1.51° twist over 10 m) was checked by hand, and the rule diameter 403 mm for σ_B = 600 is in the range of real intermediate shafts of that power.',
    'Design decision: the polar moment comes from shared/sections.js so shafts, beams and columns share one geometry module.',
    'Design decision: combined loading is reported with both classical equivalents (T_e and M_e) because marine engineering textbooks (Reeds) use them side by side.',
  ],
  sources: [
    "Budynas & Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §3-12 torsion (eqs 3-36 to 3-42), §4 angle of twist",
    'Hibbeler, Mechanics of Materials, 10th ed., ch. 5 "Torsion" (τ = T c / J, φ = T L / J G, power transmission)',
    'Reeds Marine Engineering Series Vol. 2, Applied Mechanics for Marine Engineers, ch. "Torsion" (equivalent torque and moment)',
    'IACS Unified Requirement M68, Dimensions of propulsion shafts and their permissible torsional vibration stresses (Rev. 2, 2015)',
  ],
  inputs: [
    { id: 'power_w', label: 'Transmitted power P', group: 'power', unit: 'W', display: 'kW', default: 8e6, min: 1, max: 2e8 },
    { id: 'speed_rpm', label: 'Shaft speed n', group: 'rotational_speed', unit: 'rpm', default: 90, min: 0.1, max: 100000 },
    {
      id: 'shaft_type',
      label: 'Shaft section',
      type: 'select',
      default: 'solid',
      options: [
        { value: 'solid', label: 'Solid' },
        { value: 'hollow', label: 'Hollow' },
      ],
    },
    { id: 'outer_diameter_m', label: 'Outer diameter d_o', group: 'length', unit: 'm', display: 'mm', default: 0.45, min: 0.001, max: 5 },
    { id: 'inner_diameter_m', label: 'Bore diameter d_i', group: 'length', unit: 'm', display: 'mm', default: 0.15, min: 0, max: 5, visibleWhen: { shaft_type: 'hollow' } },
    { id: 'length_m', label: 'Shaft length L (for twist)', group: 'length', unit: 'm', default: 10, min: 0.01, max: 200 },
    { id: 'shear_modulus_pa', label: 'Shear modulus G', group: 'pressure', unit: 'Pa', display: 'GPa', default: SHEAR_MODULUS_STEEL_PA, min: 1e9, max: 500e9, help: 'Steel 79–81, stainless 77, aluminium 26, titanium 41, cast iron 40 GPa.' },
    { id: 'allowable_shear_pa', label: 'Allowable shear stress τ_allow (for the required diameter)', group: 'pressure', unit: 'Pa', display: 'MPa', default: 55e6, min: 1e6, max: 1e9, help: 'Marine intermediate shafts are commonly sized around 50–60 MPa nominal shear; machine shafts per code.' },
    { id: 'bending_moment_nm', label: 'Steady bending moment M on the same section (0 = torsion only)', group: 'torque', unit: 'N_m', display: 'kN_m', default: 0, min: 0, max: 1e9 },
    { id: 'rule_f', label: 'IACS UR M68 factor F', type: 'select', default: 'f100', options: Object.entries(RULE_F_FACTORS).map(([value, f]) => ({ value, label: f.label })) },
    { id: 'rule_k', label: 'IACS UR M68 factor k', type: 'select', default: 'plain', options: Object.entries(RULE_K_FACTORS).map(([value, k]) => ({ value, label: k.label })) },
    { id: 'tensile_strength_pa', label: 'Material tensile strength σ_B for the rule (capped per UR M68)', group: 'pressure', unit: 'Pa', display: 'MPa', default: 600e6, min: 400e6, max: 800e6 },
  ],
  outputs: [
    { id: 'torque_nm', label: 'Torque T = P / ω', group: 'torque', unit: 'N_m', display: 'kN_m' },
    { id: 'polar_moment_m4', label: 'Polar second moment of area J', group: 'second_moment_of_area', unit: 'm4', display: 'cm4' },
    { id: 'shear_stress_pa', label: 'Maximum torsional shear stress τ = T r / J', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'twist_deg', label: 'Angle of twist over the length', group: 'angle', unit: 'deg' },
    { id: 'twist_deg_per_m', label: 'Twist per metre', group: 'angle', unit: 'deg' },
    { id: 'required_diameter_m', label: 'Outer diameter required for τ_allow (same bore ratio)', group: 'length', unit: 'm', display: 'mm' },
    { id: 'stress_utilisation_pct', label: 'Shear stress ÷ allowable', group: 'ratio', unit: 'pct' },
    { id: 'equivalent_torque_nm', label: 'Equivalent torque T_e = √(M² + T²) (Tresca)', group: 'torque', unit: 'N_m', display: 'kN_m' },
    { id: 'equivalent_moment_nm', label: 'Equivalent moment M_e = (M + T_e)/2 (Rankine)', group: 'torque', unit: 'N_m', display: 'kN_m' },
    { id: 'combined_shear_pa', label: 'Maximum shear stress under combined loading 16 T_e / (π d³)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'combined_principal_pa', label: 'Maximum principal stress under combined loading 32 M_e / (π d³)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'rule_diameter_m', label: 'IACS UR M68 minimum diameter', group: 'length', unit: 'm', display: 'mm' },
    { id: 'rule_margin_pct', label: 'Actual outer diameter over the rule minimum', group: 'ratio', unit: 'pct' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      torque_nm: '848 800 N·m',
      polar_moment_m4: '402 600 cm⁴',
      shear_stress_pa: '47.4 MPa',
      twist_deg: '0.0264 rad',
      required_diameter_m: '0.428 m',
      stress_utilisation_pct: '86 %',
      rule_diameter_m: '403 mm',
      rule_margin_pct: '12 %',
    },
  },
};

/** Torque in N·m from power in W and speed in rpm. */
export function torqueFromPowerNm(powerW, speedRpm) {
  return powerW / ((2 * Math.PI * speedRpm) / 60);
}

/** Maximum torsional shear stress, Pa. */
export function shearStressPa(torqueNm, outerDiameterM, innerDiameterM = 0) {
  return (torqueNm * (outerDiameterM / 2)) / polarMomentCircle(outerDiameterM, innerDiameterM);
}

/** Outer diameter for an allowable shear stress at a given bore ratio q = d_i/d_o. */
export function requiredOuterDiameterM(torqueNm, allowableShearPa, boreRatio = 0) {
  return ((16 * torqueNm) / (Math.PI * allowableShearPa * (1 - boreRatio ** 4))) ** (1 / 3);
}

/** IACS UR M68 minimum shaft diameter in mm: d = F k [P/(n (1 − Q⁴)) × 560/(σ_B + 160)]^(1/3), P in kW, σ_B in N/mm². */
export function iacsRuleDiameterMm(powerKw, speedRpm, boreRatio, tensileStrengthMpa, F, k) {
  return F * k * ((powerKw / (speedRpm * (1 - boreRatio ** 4))) * (560 / (tensileStrengthMpa + 160))) ** (1 / 3);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.power_w, 'power_w', 'Power');
  assertPositive(i.speed_rpm, 'speed_rpm', 'Shaft speed');
  assertOneOf(i.shaft_type, ['solid', 'hollow'], 'shaft_type', 'Shaft section');
  assertPositive(i.outer_diameter_m, 'outer_diameter_m', 'Outer diameter');
  assertPositive(i.length_m, 'length_m', 'Shaft length');
  assertPositive(i.shear_modulus_pa, 'shear_modulus_pa', 'Shear modulus');
  assertPositive(i.allowable_shear_pa, 'allowable_shear_pa', 'Allowable shear stress');
  assertNonNegative(i.bending_moment_nm, 'bending_moment_nm', 'Bending moment');
  assertOneOf(i.rule_f, Object.keys(RULE_F_FACTORS), 'rule_f', 'Rule factor F');
  assertOneOf(i.rule_k, Object.keys(RULE_K_FACTORS), 'rule_k', 'Rule factor k');
  assertRange(i.tensile_strength_pa, 400e6, 800e6, 'tensile_strength_pa', 'Tensile strength for the rule');

  const inner = i.shaft_type === 'hollow' ? assertNonNegative(i.inner_diameter_m, 'inner_diameter_m', 'Bore diameter') : 0;
  if (inner >= i.outer_diameter_m) throw new Error('Bore diameter must be less than the outer diameter');
  const boreRatio = inner / i.outer_diameter_m;

  const torque = torqueFromPowerNm(i.power_w, i.speed_rpm);
  const J = polarMomentCircle(i.outer_diameter_m, inner);
  const tau = shearStressPa(torque, i.outer_diameter_m, inner);
  const twistRad = (torque * i.length_m) / (i.shear_modulus_pa * J);
  const requiredD = requiredOuterDiameterM(torque, i.allowable_shear_pa, boreRatio);
  const d3 = i.outer_diameter_m ** 3 * (1 - boreRatio ** 4);
  const te = Math.sqrt(i.bending_moment_nm ** 2 + torque ** 2);
  const me = (i.bending_moment_nm + te) / 2;
  const ruleDiameterMm = iacsRuleDiameterMm(i.power_w / 1000, i.speed_rpm, boreRatio, i.tensile_strength_pa / 1e6, RULE_F_FACTORS[i.rule_f].value, RULE_K_FACTORS[i.rule_k].value);
  const ruleDiameterM = ruleDiameterMm / 1000;

  const warnings = [];
  if (tau > i.allowable_shear_pa) warnings.push('Torsional shear stress exceeds the allowable value: increase the diameter or the material grade.');
  if (i.outer_diameter_m < ruleDiameterM) warnings.push('Outer diameter is below the IACS UR M68 minimum for this power, speed and material.');
  if (twistRad / i.length_m > (0.25 * Math.PI) / 180) warnings.push('Twist exceeds 0.25° per metre, a common stiffness limit for machine shafting; check torsional vibration and alignment.');
  if (boreRatio > 0.7) warnings.push('Bore ratio above 0.7: a thin-walled tube — check local buckling and the rule limits for hollow shafts.');
  if (i.bending_moment_nm > 0) warnings.push('Combined loading uses static equivalents; a rotating shaft sees the bending stress as fully reversed and needs a fatigue check (Shigley ch. 7).');
  warnings.push('Stress concentrations (keyways, fillets, holes) and torsional vibration stresses are not included in the stress outputs.');

  return {
    outputs: {
      torque_nm: torque,
      polar_moment_m4: J,
      shear_stress_pa: tau,
      twist_deg: (twistRad * 180) / Math.PI,
      twist_deg_per_m: (twistRad * 180) / Math.PI / i.length_m,
      required_diameter_m: requiredD,
      stress_utilisation_pct: (tau / i.allowable_shear_pa) * 100,
      equivalent_torque_nm: i.bending_moment_nm > 0 ? te : null,
      equivalent_moment_nm: i.bending_moment_nm > 0 ? me : null,
      combined_shear_pa: i.bending_moment_nm > 0 ? (16 * te) / (Math.PI * d3) : null,
      combined_principal_pa: i.bending_moment_nm > 0 ? (32 * me) / (Math.PI * d3) : null,
      rule_diameter_m: ruleDiameterM,
      rule_margin_pct: ((i.outer_diameter_m - ruleDiameterM) / ruleDiameterM) * 100,
    },
    warnings,
  };
}
