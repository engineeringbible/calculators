/**
 * helical-spring/calc.js — round-wire helical compression spring (Shigley ch. 10): spring index, curvature factor,
 * rate, deflection, torsional stress and static safety factor against the wire's torsional yield strength, end
 * geometry (solid height, pitch), solid-height stress check, buckling and surge frequency.
 *
 * k = d⁴ G/(8 D³ N_a);  τ = K 8 F D/(π d³);  S_ut = A/d^m;  S_sy = f S_ut;  buckling L₀ < 2.63 D/α.
 * Schema units: m (display mm), N, Pa (display MPa), N/m (display N/mm), Hz.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** Shigley Table 10-4 (SI: A in MPa·mm^m) and Table 10-6 static torsional yield fraction; G from Table 10-5. */
export const MATERIALS = {
  music_wire: { label: 'Music wire ASTM A228 (0.10–6.5 mm)', A: 2211, m: 0.145, fraction: 0.45, G: 81.0e9, dMin: 0.1, dMax: 6.5 },
  hard_drawn: { label: 'Hard-drawn wire ASTM A227 (0.7–12.7 mm)', A: 1783, m: 0.19, fraction: 0.45, G: 79.3e9, dMin: 0.7, dMax: 12.7 },
  oil_tempered: { label: 'Oil-tempered wire ASTM A229 (0.5–12.7 mm)', A: 1855, m: 0.187, fraction: 0.5, G: 77.2e9, dMin: 0.5, dMax: 12.7 },
  chrome_vanadium: { label: 'Chrome-vanadium ASTM A232 (0.8–11.1 mm)', A: 2005, m: 0.168, fraction: 0.5, G: 77.2e9, dMin: 0.8, dMax: 11.1 },
  chrome_silicon: { label: 'Chrome-silicon ASTM A401 (1.6–9.5 mm)', A: 1974, m: 0.108, fraction: 0.5, G: 77.2e9, dMin: 1.6, dMax: 9.5 },
  stainless_302: { label: 'Stainless 302 ASTM A313 (0.3–2.5 mm)', A: 1867, m: 0.146, fraction: 0.35, G: 69.0e9, dMin: 0.3, dMax: 2.5 },
  custom: { label: 'Custom (enter S_ut, yield fraction and G)', A: null, m: null, fraction: null, G: null },
};

export const END_TYPES = {
  plain: { label: 'Plain ends', extra: 0, solid: (d, Nt) => d * (Nt + 1), freeFromPitch: (p, Na, d) => p * Na + d },
  plain_ground: { label: 'Plain and ground ends', extra: 1, solid: (d, Nt) => d * Nt, freeFromPitch: (p, Na) => p * (Na + 1) },
  squared: { label: 'Squared (closed) ends', extra: 2, solid: (d, Nt) => d * (Nt + 1), freeFromPitch: (p, Na, d) => p * Na + 3 * d },
  squared_ground: { label: 'Squared and ground ends', extra: 2, solid: (d, Nt) => d * Nt, freeFromPitch: (p, Na, d) => p * Na + 2 * d },
};

/** End-condition constants for buckling (Shigley Table 10-2). */
export const BUCKLING_ALPHA = {
  fixed_fixed: { label: 'Both ends supported by flat parallel surfaces (fixed–fixed), α 0.5', alpha: 0.5 },
  fixed_hinged: { label: 'One end on a flat surface, other hinged (α 0.707)', alpha: 0.707 },
  hinged_hinged: { label: 'Both ends hinged (α 1.0)', alpha: 1.0 },
  fixed_free: { label: 'One end clamped, other free (α 2.0)', alpha: 2.0 },
};

export const schema = {
  id: 'helical-spring',
  name: 'Spring rate calculator (helical compression spring)',
  category: 'mechanical',
  summary: 'Spring rate, deflection, shear stress with the Wahl factor, solid height and buckling check for round-wire compression springs.',
  related: ['bolt-torque', 'shaft-torque', 'hydraulic-cylinder', 'thermal-expansion'],
  assumptions: [
    'Round-wire helical compression spring under axial static load, analysed per Shigley\'s Mechanical Engineering Design ch. 10: rate k = d⁴G/(8 D³ N_a), torsional stress τ = K 8FD/(π d³) with the curvature correction K — Wahl K_W = (4C − 1)/(4C − 4) + 0.615/C or Bergsträsser K_B = (4C + 2)/(4C − 3) (within 1 % of each other); Shigley uses K_B for both static and fatigue.',
    'Wire tensile strength from S_ut = A/d^m with the Shigley Table 10-4 constants (music wire A 2211 MPa·mm^m, m 0.145; hard-drawn 1783/0.190; oil-tempered 1855/0.187; chrome-vanadium 2005/0.168; chrome-silicon 1974/0.108; stainless 302 1867/0.146), valid only inside each wire\'s diameter range; the torsional yield strength for static service is a fraction of S_ut (Table 10-6: 45 % music wire and hard-drawn, 50 % hardened and tempered alloy wires, 35 % austenitic stainless) — set-removed springs may be allowed more.',
    'Shear modulus per material (Table 10-5: music wire 81.0 GPa, hard-drawn 79.3, oil-tempered/Cr-V/Cr-Si 77.2, stainless 69.0); the small variation of G with wire diameter is ignored.',
    'End geometry per Shigley Table 10-1: total coils N_t = N_a + 0/1/2/2 and solid height L_s = d(N_t + 1), d N_t, d(N_t + 1), d N_t for plain, plain-ground, squared and squared-ground ends; the spring index C = D/d should be 4–12 (below 4 hard to form, above 12 tangles).',
    'Static design only: no fatigue (Goodman/Gerber with Zimmerli data), no shot-peening or presetting credit, no temperature or corrosion effects; a safety factor against the solid-height stress of about 1.2 is the usual minimum (Shigley\'s design recommendation).',
    'Buckling criterion L₀ < 2.63 D/α (Shigley eq. 10-13 with the end-condition constants α); surge (natural) frequency f = ½ √(k/m) for a spring between flat plates with m the active-coil mass (ρ 7 850 kg/m³); keep operating frequencies below f/15–f/20.',
  ],
  notes: [
    'Verification 2026-10-30: Shigley Example 10-1 (music wire d 0.037 in, OD 0.4375 in, 12.5 total coils squared and ground, L₀ 1.25 in, G 11.75 Mpsi) reproduced in SI: C 10.8, K_B 1.124, k 4.08 lbf/in (714 N/m), L_s 0.4625 in, F_s 3.21 lbf, S_ut 324 kpsi, τ_s 72.6 kpsi, n_s 2.0, 2.63 D/α 2.11 in > L₀ (stable).',
    'Design decision: both Wahl and Bergsträsser factors are offered; the strength fractions of Table 10-6 are applied automatically by material class with a custom override.',
  ],
  sources: [
    'R. G. Budynas & J. K. Nisbett, Shigley\'s Mechanical Engineering Design, 9th–10th ed. (McGraw-Hill), ch. 10 Mechanical Springs: Tables 10-1 to 10-6, eqs. 10-3 to 10-13, Example 10-1',
    'Associated Spring (Barnes Group), Design Handbook — Engineering Guide to Spring Design (end types, buckling, allowable stresses)',
    'ASTM A228 / A227 / A229 / A232 / A401 / A313 wire specifications (tensile strength versus diameter)',
    'EN 13906-1:2013 Cylindrical helical springs made from round wire and bar — compression springs (equivalent European method)',
  ],
  inputs: [
    { id: 'wire_d_m', label: 'Wire diameter d', group: 'length', unit: 'm', display: 'mm', default: 0.0009398, min: 1e-4, max: 0.05 },
    { id: 'diameter_basis', label: 'Coil diameter given as', type: 'select', default: 'outer', options: [{ value: 'mean', label: 'Mean coil diameter D' }, { value: 'outer', label: 'Outside diameter OD (D = OD − d)' }] },
    { id: 'coil_d_m', label: 'Coil diameter (mean or outside)', group: 'length', unit: 'm', display: 'mm', default: 0.0111125, min: 2e-4, max: 1 },
    { id: 'end_type', label: 'End type', type: 'select', default: 'squared_ground', options: Object.entries(END_TYPES).map(([value, e]) => ({ value, label: e.label })) },
    { id: 'coil_basis', label: 'Coils given as', type: 'select', default: 'total', options: [{ value: 'total', label: 'Total coils N_t' }, { value: 'active', label: 'Active coils N_a' }] },
    { id: 'coils', label: 'Number of coils', group: 'dimensionless', unit: 'none', default: 12.5, min: 1, max: 100 },
    { id: 'free_length_m', label: 'Free length L₀', group: 'length', unit: 'm', display: 'mm', default: 0.03175, min: 1e-3, max: 2 },
    { id: 'material', label: 'Wire material', type: 'select', default: 'music_wire', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'sut_custom_pa', label: 'Custom tensile strength S_ut', group: 'pressure', unit: 'Pa', display: 'MPa', default: 1500e6, min: 1e8, max: 4e9, visibleWhen: { material: 'custom' } },
    { id: 'fraction_custom', label: 'Custom torsional yield fraction S_sy/S_ut', group: 'dimensionless', unit: 'none', default: 0.45, min: 0.2, max: 0.8, visibleWhen: { material: 'custom' } },
    { id: 'g_custom_pa', label: 'Custom shear modulus G', group: 'pressure', unit: 'Pa', display: 'GPa', default: 79.3e9, min: 1e10, max: 2e11, visibleWhen: { material: 'custom' } },
    { id: 'curvature', label: 'Curvature correction factor', type: 'select', default: 'bergstrasser', options: [{ value: 'bergstrasser', label: 'Bergsträsser K_B = (4C + 2)/(4C − 3) (Shigley)' }, { value: 'wahl', label: 'Wahl K_W = (4C − 1)/(4C − 4) + 0.615/C' }] },
    { id: 'load_mode', label: 'Working point given as', type: 'select', default: 'force', options: [{ value: 'force', label: 'Working force F' }, { value: 'deflection', label: 'Working deflection y' }] },
    { id: 'force_n', label: 'Working force F', group: 'force', unit: 'N', default: 10, min: 0, max: 1e6, visibleWhen: { load_mode: 'force' } },
    { id: 'deflection_m', label: 'Working deflection y', group: 'length', unit: 'm', display: 'mm', default: 0.014, min: 0, max: 2, visibleWhen: { load_mode: 'deflection' } },
    { id: 'buckling_ends', label: 'End condition for buckling', type: 'select', default: 'fixed_fixed', options: Object.entries(BUCKLING_ALPHA).map(([value, b]) => ({ value, label: b.label })) },
  ],
  outputs: [
    { id: 'mean_d_m', label: 'Mean coil diameter D', group: 'length', unit: 'm', display: 'mm' },
    { id: 'index', label: 'Spring index C = D/d', group: 'dimensionless', unit: 'none' },
    { id: 'curvature_factor', label: 'Curvature factor K', group: 'dimensionless', unit: 'none' },
    { id: 'active_coils', label: 'Active coils N_a', group: 'dimensionless', unit: 'none' },
    { id: 'total_coils', label: 'Total coils N_t', group: 'dimensionless', unit: 'none' },
    { id: 'rate_n_m', label: 'Spring rate k = d⁴G/(8D³N_a)', group: 'stiffness', unit: 'N_m', display: 'N_mm' },
    { id: 'sut_pa', label: 'Wire tensile strength S_ut = A/d^m', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'ssy_pa', label: 'Torsional yield strength S_sy', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'force_out_n', label: 'Working force F', group: 'force', unit: 'N' },
    { id: 'deflection_out_m', label: 'Working deflection y = F/k', group: 'length', unit: 'm', display: 'mm' },
    { id: 'stress_pa', label: 'Torsional stress at the working force τ = K 8FD/(πd³)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'safety_working', label: 'Static safety factor at the working force S_sy/τ', group: 'dimensionless', unit: 'none' },
    { id: 'solid_height_m', label: 'Solid height L_s', group: 'length', unit: 'm', display: 'mm' },
    { id: 'pitch_m', label: 'Pitch p', group: 'length', unit: 'm', display: 'mm' },
    { id: 'deflection_to_solid_m', label: 'Deflection to solid L₀ − L_s', group: 'length', unit: 'm', display: 'mm' },
    { id: 'force_solid_n', label: 'Force at solid height F_s', group: 'force', unit: 'N' },
    { id: 'stress_solid_pa', label: 'Stress at solid height τ_s', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'safety_solid', label: 'Safety factor at solid height S_sy/τ_s', group: 'dimensionless', unit: 'none' },
    { id: 'working_length_m', label: 'Length at the working force', group: 'length', unit: 'm', display: 'mm' },
    { id: 'buckling_limit_m', label: 'Buckling limit free length 2.63 D/α', group: 'length', unit: 'm', display: 'mm' },
    { id: 'buckling_status', label: 'Buckling check', type: 'text' },
    { id: 'surge_frequency_hz', label: 'Surge (natural) frequency f = ½ √(k/m)', group: 'frequency', unit: 'Hz' },
    { id: 'wire_mass_kg', label: 'Active-coil wire mass', group: 'mass', unit: 'kg' },
    { id: 'design_check', label: 'Design remarks', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      mean_d_m: '10.17 mm',
      index: '10.8',
      curvature_factor: '1.124',
      active_coils: '10.5',
      rate_n_m: '4.08 lbf/in',
      sut_pa: '2 231 MPa',
      solid_height_m: '11.75 mm',
      deflection_to_solid_m: '0.7875 in',
    },
  },
};

/** Curvature correction factor. */
export function curvatureFactor(C, method) {
  return method === 'wahl' ? (4 * C - 1) / (4 * C - 4) + 0.615 / C : (4 * C + 2) / (4 * C - 3);
}

/** Wire tensile strength (Pa) from the Shigley constants, d in metres. */
export function tensileStrengthPa(material, dM) {
  const m = MATERIALS[material];
  return (m.A / (dM * 1000) ** m.m) * 1e6;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.diameter_basis, ['mean', 'outer'], 'diameter_basis', 'Diameter basis');
  assertOneOf(i.end_type, Object.keys(END_TYPES), 'end_type', 'End type');
  assertOneOf(i.coil_basis, ['total', 'active'], 'coil_basis', 'Coil basis');
  assertOneOf(i.material, Object.keys(MATERIALS), 'material', 'Material');
  assertOneOf(i.curvature, ['bergstrasser', 'wahl'], 'curvature', 'Curvature factor');
  assertOneOf(i.load_mode, ['force', 'deflection'], 'load_mode', 'Load mode');
  assertOneOf(i.buckling_ends, Object.keys(BUCKLING_ALPHA), 'buckling_ends', 'End condition');
  assertPositive(i.wire_d_m, 'wire_d_m', 'Wire diameter');
  assertPositive(i.coil_d_m, 'coil_d_m', 'Coil diameter');
  assertPositive(i.coils, 'coils', 'Coils');
  assertPositive(i.free_length_m, 'free_length_m', 'Free length');

  const d = i.wire_d_m;
  const D = i.diameter_basis === 'outer' ? i.coil_d_m - d : i.coil_d_m;
  if (D <= d) throw new Error('Mean coil diameter must exceed the wire diameter (check OD versus d)');
  const C = D / d;
  const end = END_TYPES[i.end_type];
  const Na = i.coil_basis === 'total' ? i.coils - end.extra : i.coils;
  if (Na <= 0.5) throw new Error('Fewer than one active coil: increase the total coils for this end type');
  const Nt = Na + end.extra;
  const mat = MATERIALS[i.material];
  let G;
  let Sut;
  let fraction;
  if (i.material === 'custom') {
    G = assertPositive(i.g_custom_pa, 'g_custom_pa', 'Shear modulus');
    Sut = assertPositive(i.sut_custom_pa, 'sut_custom_pa', 'Tensile strength');
    fraction = assertRange(i.fraction_custom, 0.1, 0.9, 'fraction_custom', 'Yield fraction');
  } else {
    G = mat.G;
    Sut = tensileStrengthPa(i.material, d);
    fraction = mat.fraction;
  }
  const Ssy = fraction * Sut;
  const K = curvatureFactor(C, i.curvature);
  const k = (d ** 4 * G) / (8 * D ** 3 * Na);
  let F;
  let y;
  if (i.load_mode === 'force') {
    F = assertNonNegative(i.force_n, 'force_n', 'Working force');
    y = F / k;
  } else {
    y = assertNonNegative(i.deflection_m, 'deflection_m', 'Working deflection');
    F = k * y;
  }
  const stress = (F) => (K * 8 * F * D) / (Math.PI * d ** 3);
  const tau = stress(F);
  const Ls = end.solid(d, Nt);
  const ySolid = i.free_length_m - Ls;
  if (ySolid <= 0) throw new Error(`Free length ${(i.free_length_m * 1000).toFixed(2)} mm is not greater than the solid height ${(Ls * 1000).toFixed(2)} mm`);
  const Fs = k * ySolid;
  const tauS = stress(Fs);
  const pitch = (i.free_length_m - (end.extra === 0 ? d : end.extra === 1 ? 0 : end.extra === 2 && i.end_type === 'squared' ? 3 * d : 2 * d)) / (i.end_type === 'plain_ground' ? Na + 1 : Na);
  const alpha = BUCKLING_ALPHA[i.buckling_ends].alpha;
  const bucklingLimit = (2.63 * D) / alpha;
  const mass = 7850 * ((Math.PI * d * d) / 4) * Math.PI * D * Na;
  const surge = 0.5 * Math.sqrt(k / mass);
  const workingLength = i.free_length_m - y;

  const bucklingStatus = i.free_length_m < bucklingLimit ? `Stable — L₀ ${(i.free_length_m * 1000).toFixed(1)} mm < 2.63 D/α = ${(bucklingLimit * 1000).toFixed(1)} mm` : `BUCKLING RISK — L₀ ${(i.free_length_m * 1000).toFixed(1)} mm ≥ ${(bucklingLimit * 1000).toFixed(1)} mm: guide the spring (rod or tube) or shorten it`;
  const remarks = [];
  if (C < 4 || C > 12) remarks.push(`spring index ${C.toFixed(1)} outside 4–12`);
  if (Ssy / tauS < 1.2) remarks.push(`solid-height safety ${(Ssy / tauS).toFixed(2)} below 1.2`);
  if (y > ySolid) remarks.push('working deflection exceeds the deflection to solid');
  if (Ssy / tau < 1) remarks.push('yields at the working force');
  const designCheck = remarks.length ? `CHECK — ${remarks.join('; ')}` : `OK — C ${C.toFixed(1)}, n_s(solid) ${(Ssy / tauS).toFixed(2)}, working deflection ${((y / ySolid) * 100).toFixed(0)} % of the way to solid`;

  const warnings = [];
  if (i.material !== 'custom' && (d * 1000 < mat.dMin || d * 1000 > mat.dMax)) warnings.push(`Wire diameter ${(d * 1000).toFixed(2)} mm is outside the ${mat.dMin}–${mat.dMax} mm range of the S_ut = A/d^m fit for this material.`);
  if (C < 4) warnings.push('Spring index below 4: difficult to coil and high curvature stress.');
  if (C > 12) warnings.push('Spring index above 12: springs tangle and buckle easily; tolerances widen.');
  if (y > ySolid) warnings.push('The working deflection closes the spring solid — the force output is the solid-height force.');
  if (Ssy / tauS < 1.2) warnings.push('Shigley recommends a safety factor of at least 1.2 at the solid height so that accidental closing does not set the spring.');
  warnings.push('Static analysis: cyclic loading needs a fatigue check (Zimmerli endurance data with Goodman or Gerber) and ratio-dependent allowable stresses.');
  warnings.push('Curvature factor applied to the static stress as Shigley does; some design codes (EN 13906) omit it for static set-removed springs.');

  return {
    outputs: {
      mean_d_m: D,
      index: C,
      curvature_factor: K,
      active_coils: Na,
      total_coils: Nt,
      rate_n_m: k,
      sut_pa: Sut,
      ssy_pa: Ssy,
      force_out_n: Math.min(F, Fs),
      deflection_out_m: Math.min(y, ySolid),
      stress_pa: stress(Math.min(F, Fs)),
      safety_working: Ssy / stress(Math.min(F, Fs)),
      solid_height_m: Ls,
      pitch_m: pitch,
      deflection_to_solid_m: ySolid,
      force_solid_n: Fs,
      stress_solid_pa: tauS,
      safety_solid: Ssy / tauS,
      working_length_m: Math.max(workingLength, Ls),
      buckling_limit_m: bucklingLimit,
      buckling_status: bucklingStatus,
      surge_frequency_hz: surge,
      wire_mass_kg: mass,
      design_check: designCheck,
    },
    warnings,
  };
}
