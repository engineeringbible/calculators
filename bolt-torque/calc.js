/**
 * bolt-torque/calc.js — preload and tightening torque for ISO metric bolts (VDI 2230 method).
 *
 * Preload: 90 % of yield under combined tension + thread torsion (VDI 2230 Part 1, eq. R8/1), a percentage of the
 * ISO 898-1 proof load (Shigley practice), or given. Torque: M_A = F_M (0.16 P + 0.58 d₂ μ_G + D_Km μ_K / 2).
 * The M12 8.8 / μ = 0.14 case reproduces the VDI 2230 Table A1 values (F_M = 41.9 kN, M_A = 93 N·m).
 *
 * Schema units: SI — m, N, Pa, N·m; thread sizes by ISO 261 coarse pitch designation.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

/** ISO 261 coarse threads: pitch, plus ISO 4014/4017 hex-head minimum bearing diameter d_w and ISO 273 medium hole d_h (all mm). */
export const THREADS = {
  M4: { d: 4, p: 0.7, dw: 5.88, dh: 4.5 },
  M5: { d: 5, p: 0.8, dw: 6.88, dh: 5.5 },
  M6: { d: 6, p: 1.0, dw: 8.88, dh: 6.6 },
  M8: { d: 8, p: 1.25, dw: 11.63, dh: 9.0 },
  M10: { d: 10, p: 1.5, dw: 14.63, dh: 11.0 },
  M12: { d: 12, p: 1.75, dw: 16.63, dh: 13.5 },
  M14: { d: 14, p: 2.0, dw: 19.64, dh: 15.5 },
  M16: { d: 16, p: 2.0, dw: 22.49, dh: 17.5 },
  M20: { d: 20, p: 2.5, dw: 28.19, dh: 22.0 },
  M24: { d: 24, p: 3.0, dw: 33.61, dh: 26.0 },
  M30: { d: 30, p: 3.5, dw: 42.75, dh: 33.0 },
  M36: { d: 36, p: 4.0, dw: 51.11, dh: 39.0 },
  M42: { d: 42, p: 4.5, dw: 59.95, dh: 45.0 },
  M48: { d: 48, p: 5.0, dw: 69.45, dh: 52.0 },
};

/**
 * Property classes — ISO 898-1:2013 Table 3 (carbon steel) and ISO 3506-1 (stainless, Rp0.2 used as proof stress).
 * yield = R_eL or R_p0.2 min, proof = S_p (proof stress), uts = R_m min, all MPa; `large` applies above M16 for 8.8.
 */
export const PROPERTY_CLASSES = {
  '4.6': { label: '4.6 (R_eL 240, R_m 400 MPa)', yield: 240, proof: 225, uts: 400 },
  '5.8': { label: '5.8 (R_eL 420, R_m 520 MPa)', yield: 420, proof: 380, uts: 520 },
  '8.8': { label: '8.8 (R_p0.2 640/660, R_m 800/830 MPa)', yield: 640, proof: 580, uts: 800, large: { yield: 660, proof: 600, uts: 830 } },
  '10.9': { label: '10.9 (R_p0.2 940, R_m 1040 MPa)', yield: 940, proof: 830, uts: 1040 },
  '12.9': { label: '12.9 (R_p0.2 1100, R_m 1220 MPa)', yield: 1100, proof: 970, uts: 1220 },
  'A2-70': { label: 'Stainless A2-70 / A4-70 (R_p0.2 450, R_m 700 MPa, ≤ M24)', yield: 450, proof: 450, uts: 700 },
  'A4-80': { label: 'Stainless A4-80 (R_p0.2 600, R_m 800 MPa, ≤ M24)', yield: 600, proof: 600, uts: 800 },
};

/** Friction presets (thread and under-head equal) — VDI 2230 Part 1 Table A5 friction classes. */
export const FRICTION_PRESETS = {
  moly_ptfe: { label: 'MoS₂ paste, PTFE or anti-seize — class A (0.04–0.10), μ = 0.08', mu: 0.08 },
  oiled: { label: 'Lightly oiled or zinc-flake coated — class B (0.08–0.16), μ = 0.12', mu: 0.12 },
  dry_zinc: { label: 'Dry, zinc electroplated or phosphated — class C (0.14–0.24), μ = 0.14', mu: 0.14 },
  dry_bare: { label: 'Dry, untreated or hot-dip galvanized — class D (0.20–0.35), μ = 0.20', mu: 0.20 },
  custom: { label: 'Custom thread and under-head friction', mu: null },
};

const THREAD_ANGLE_FACTOR = 1 / Math.cos((30 * Math.PI) / 180); // 1.1547 for 60° ISO threads
const VDI_YIELD_UTILISATION = 0.9;

export const schema = {
  id: 'bolt-torque',
  name: 'Bolt torque and preload',
  category: 'mechanical',
  summary: 'Preload and tightening torque for ISO metric bolts by the VDI 2230 method, with property class, friction, proof load and preload scatter.',
  related: ['shaft-torque', 'beam-deflection', 'pressure-vessel', 'unit-converter'],
  notes: [
    'Verification 2026-10-30: the VDI 2230 / Bossard table value for M12 8.8 at μ = 0.14 (41.9 kN, 93 N·m) is reproduced only when the plastic torsion modulus π d_s³/12 and the exact thread-torque form are used; a purely elastic von Mises check gives about 38.3 kN. Bossard F-047 values were confirmed online the same day.',
    'Verification: ISO 898-1 proof loads (M12 8.8 48.9 kN, M20 10.9 203 kN, M20 8.8 147 kN) and stress areas are reproduced from the ISO 724 geometry to 0.3 %.',
    'Design decision: the tightening torque uses the rounded VDI R8/4 coefficients (0.16 P + 0.58 d₂ μ_G) as published, while the stress check uses the exact form, so that both the torque table and the 90 % utilisation are reproduced.',
    'Design decision: the under-head bearing diameter defaults to the ISO 4014/4017 head on an ISO 273 medium hole (D_Km = 15.07 mm for M12) because that is what the VDI tables assume.',
  ],
  assumptions: [
    'Torque–preload relation per VDI 2230: M_A = F_M (0.16 P + 0.58 d₂ μ_G + D_Km μ_K / 2); the coefficients 0.16 ≈ 1/(2π) and 0.58 ≈ 1/(2 cos 30°) are the standard approximations for 60° ISO threads.',
    'The 90 %-of-yield preload follows VDI 2230 eq. R8/1 with the plastic torsion section modulus (π d_s³/12) and d_s = (d₂ + d₃)/2, which is why it reproduces the VDI/Bossard tables (M12 8.8, μ = 0.14: 41.9 kN, 93 N·m).',
    'Friction coefficients dominate the result (a change from 0.10 to 0.20 nearly doubles the torque for the same preload) and are only known to the VDI class range; the presets are mid-class values.',
    'Under-head bearing diameter D_Km is taken as the mean of the ISO 4014/4017 hex-head minimum bearing diameter and an ISO 273 medium clearance hole; flange bolts, washers, socket heads and nuts change it.',
    'Material strengths are ISO 898-1 minimum values (8.8 uses 660/600 MPa above M16); stainless classes use R_p0.2 as proof stress and are valid up to M24.',
    'Torque-controlled tightening scatters: the minimum preload is F_M divided by the tightening factor α_A (1.4–1.6 torque wrench with measured friction, 1.6–2.0 standard torque wrench, 2.5–4 impact wrench).',
    'No joint analysis: clamp-load loss from embedding and relaxation, external load sharing, thread stripping, fatigue and gasket requirements need the full VDI 2230 procedure.',
    'Coarse-pitch ISO 261 threads only; fine threads have smaller pitch and larger stress area and are not tabulated here.',
  ],
  sources: [
    'VDI 2230 Part 1 (2015), Systematic calculation of highly stressed bolted joints — eq. R8/1 (assembly preload), R8/4 (tightening torque), Table A1 (preloads and torques), Table A5 (friction classes)',
    'ISO 898-1:2013, Mechanical properties of fasteners — Table 3 (property classes), Table 7 (proof loads)',
    'ISO 68-1 / ISO 724 / ISO 261 — ISO metric thread geometry and coarse pitches',
    'ISO 4014 / ISO 4017 (hex head bolts, bearing diameter d_w), ISO 273 (clearance holes)',
    'ISO 3506-1:2020 — stainless steel fasteners (A2-70, A4-80)',
    'Budynas & Nisbett, Shigley\'s Mechanical Engineering Design, 10th ed., §8-8 (K ≈ 0.20 for μ = 0.15) and §8-7 (preload 75 %/90 % of proof load)',
    'Bossard, Technical resources F-047 (VDI 2230 preload and torque tables)',
  ],
  inputs: [
    { id: 'size', label: 'Thread size (ISO coarse)', type: 'select', default: 'M12', options: Object.keys(THREADS).map((value) => ({ value, label: `${value} × ${THREADS[value].p}` })) },
    { id: 'property_class', label: 'Property class', type: 'select', default: '8.8', options: Object.entries(PROPERTY_CLASSES).map(([value, c]) => ({ value, label: c.label })) },
    {
      id: 'preload_basis',
      label: 'Target preload',
      type: 'select',
      default: 'vdi_90_yield',
      options: [
        { value: 'vdi_90_yield', label: '90 % of yield under tension + torsion (VDI 2230)' },
        { value: 'percent_proof', label: 'Percentage of ISO 898-1 proof load (Shigley)' },
        { value: 'given', label: 'Given preload' },
      ],
    },
    { id: 'proof_fraction_pct', label: 'Fraction of proof load', group: 'ratio', unit: 'pct', default: 75, min: 10, max: 100, visibleWhen: { preload_basis: 'percent_proof' }, help: 'Shigley: 75 % for reusable connections, 90 % for permanent ones.' },
    { id: 'preload_given_n', label: 'Preload F_M', group: 'force', unit: 'N', display: 'kN', default: 30000, min: 1, max: 1e8, visibleWhen: { preload_basis: 'given' } },
    { id: 'friction', label: 'Friction condition', type: 'select', default: 'dry_zinc', options: Object.entries(FRICTION_PRESETS).map(([value, f]) => ({ value, label: f.label })) },
    { id: 'mu_thread', label: 'Thread friction coefficient μ_G', group: 'dimensionless', unit: 'none', default: 0.14, min: 0.02, max: 0.6, visibleWhen: { friction: 'custom' } },
    { id: 'mu_head', label: 'Under-head friction coefficient μ_K', group: 'dimensionless', unit: 'none', default: 0.14, min: 0.02, max: 0.6, visibleWhen: { friction: 'custom' } },
    {
      id: 'bearing_source',
      label: 'Under-head bearing diameter D_Km',
      type: 'select',
      default: 'hex_standard',
      options: [
        { value: 'hex_standard', label: 'ISO 4014/4017 hex head on a medium clearance hole' },
        { value: 'given', label: 'Given (washer, flange bolt, socket head…)' },
      ],
    },
    { id: 'bearing_diameter_m', label: 'Effective bearing diameter D_Km', group: 'length', unit: 'm', display: 'mm', default: 0.015, min: 0.001, max: 0.2, visibleWhen: { bearing_source: 'given' } },
    { id: 'tightening_factor', label: 'Tightening factor α_A (preload scatter)', group: 'dimensionless', unit: 'none', default: 1.7, min: 1, max: 4, help: 'VDI 2230 Table A8: 1.4–1.6 torque wrench with measured friction, 1.6–2.0 standard torque wrench, 2.5–4 impact wrench.' },
  ],
  outputs: [
    { id: 'pitch_m', label: 'Pitch P', group: 'length', unit: 'm', display: 'mm' },
    { id: 'd2_m', label: 'Pitch diameter d₂', group: 'length', unit: 'm', display: 'mm' },
    { id: 'd3_m', label: 'Minor diameter d₃', group: 'length', unit: 'm', display: 'mm' },
    { id: 'stress_area_m2', label: 'Tensile stress area A_s', group: 'area', unit: 'm2', display: 'mm2' },
    { id: 'yield_pa', label: 'Yield / R_p0.2 (min)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'proof_load_n', label: 'Proof load S_p × A_s (ISO 898-1)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'preload_n', label: 'Assembly preload F_M', group: 'force', unit: 'N', display: 'kN' },
    { id: 'preload_min_n', label: 'Minimum preload F_M / α_A', group: 'force', unit: 'N', display: 'kN' },
    { id: 'thread_torque_nm', label: 'Thread torque M_G', group: 'torque', unit: 'N_m' },
    { id: 'head_torque_nm', label: 'Under-head friction torque', group: 'torque', unit: 'N_m' },
    { id: 'torque_nm', label: 'Tightening torque M_A', group: 'torque', unit: 'N_m' },
    { id: 'nut_factor', label: 'Equivalent nut factor K = M_A / (F_M d)', group: 'dimensionless', unit: 'none' },
    { id: 'torque_k02_nm', label: 'Rule-of-thumb torque with K = 0.20 (for comparison)', group: 'torque', unit: 'N_m' },
    { id: 'tensile_stress_pa', label: 'Tensile stress F_M / A_s', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'torsional_stress_pa', label: 'Torsional stress M_G / (π d_s³/12)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'reduced_stress_pa', label: 'Reduced stress √(σ² + 3τ²)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'yield_utilisation_pct', label: 'Utilisation of yield (VDI basis)', group: 'ratio', unit: 'pct' },
    { id: 'bearing_diameter_out_m', label: 'Bearing diameter D_Km used', group: 'length', unit: 'm', display: 'mm' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      d2_m: '10.863 mm',
      d3_m: '9.853 mm',
      stress_area_m2: '84.3 mm²',
      yield_pa: '640 MPa',
      proof_load_n: '48.9 kN',
      preload_n: '42.0 kN',
      preload_min_n: '24.7 kN',
      thread_torque_nm: '48.8 N·m',
    },
  },
};

/** ISO 68-1 basic profile: pitch diameter, minor diameter, d_s and stress area (all in metres / m²). */
export function threadGeometry(dM, pM) {
  const d2 = dM - 0.649519 * pM;
  const d3 = dM - 1.226869 * pM;
  const ds = (d2 + d3) / 2;
  return { d2, d3, ds, stressArea: (Math.PI / 4) * ds * ds };
}

/** Strength values of a property class for a nominal diameter (8.8 changes above M16). */
export function classStrength(propertyClass, dM) {
  const cls = PROPERTY_CLASSES[propertyClass];
  if (cls.large && dM > 0.016) return cls.large;
  return { yield: cls.yield, proof: cls.proof, uts: cls.uts };
}

/**
 * VDI 2230 eq. R8/1: preload at ν × yield under combined tension and thread torsion.
 * F = A_s ν R_p0.2 / sqrt(1 + 3 [ (3/2)(d₂/d_s)(P/(π d₂) + 1.155 μ_G) ]²)
 */
export function vdiAssemblyPreload(geometry, pitchM, yieldPa, muThread, utilisation = VDI_YIELD_UTILISATION) {
  const term = 1.5 * (geometry.d2 / geometry.ds) * (pitchM / (Math.PI * geometry.d2) + THREAD_ANGLE_FACTOR * muThread);
  return (geometry.stressArea * utilisation * yieldPa) / Math.sqrt(1 + 3 * term * term);
}

/** Thread torque M_G = F (0.16 P + 0.58 d₂ μ_G), N·m with SI inputs — the rounded VDI 2230 R8/4 form used for the tightening torque. */
export function threadTorque(preloadN, pitchM, d2M, muThread) {
  return preloadN * (0.16 * pitchM + 0.58 * d2M * muThread);
}

/** Exact thread torque F (d₂/2)(P/(π d₂) + μ_G / cos 30°) — the form behind VDI eq. R8/1, used for the stress check. */
export function threadTorqueExact(preloadN, pitchM, d2M, muThread) {
  return preloadN * (pitchM / (2 * Math.PI) + (d2M * muThread * THREAD_ANGLE_FACTOR) / 2);
}

/** Under-head friction torque F μ_K D_Km / 2. */
export function headTorque(preloadN, bearingDiameterM, muHead) {
  return (preloadN * muHead * bearingDiameterM) / 2;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.size, Object.keys(THREADS), 'size', 'Thread size');
  assertOneOf(i.property_class, Object.keys(PROPERTY_CLASSES), 'property_class', 'Property class');
  assertOneOf(i.preload_basis, ['vdi_90_yield', 'percent_proof', 'given'], 'preload_basis', 'Preload basis');
  assertOneOf(i.friction, Object.keys(FRICTION_PRESETS), 'friction', 'Friction condition');
  assertOneOf(i.bearing_source, ['hex_standard', 'given'], 'bearing_source', 'Bearing diameter source');
  assertRange(i.tightening_factor, 1, 10, 'tightening_factor', 'Tightening factor');

  const thread = THREADS[i.size];
  const dM = thread.d / 1000;
  const pM = thread.p / 1000;
  const geometry = threadGeometry(dM, pM);
  const strength = classStrength(i.property_class, dM);
  const yieldPa = strength.yield * 1e6;
  const proofLoad = strength.proof * 1e6 * geometry.stressArea;

  const muThread = i.friction === 'custom' ? assertRange(i.mu_thread, 0.01, 1, 'mu_thread', 'Thread friction') : FRICTION_PRESETS[i.friction].mu;
  const muHead = i.friction === 'custom' ? assertRange(i.mu_head, 0.01, 1, 'mu_head', 'Under-head friction') : FRICTION_PRESETS[i.friction].mu;
  const bearingDiameter = i.bearing_source === 'given' ? assertPositive(i.bearing_diameter_m, 'bearing_diameter_m', 'Bearing diameter') : ((thread.dw + thread.dh) / 2) / 1000;

  let preload;
  if (i.preload_basis === 'vdi_90_yield') {
    preload = vdiAssemblyPreload(geometry, pM, yieldPa, muThread);
  } else if (i.preload_basis === 'percent_proof') {
    assertRange(i.proof_fraction_pct, 1, 100, 'proof_fraction_pct', 'Fraction of proof load');
    preload = (i.proof_fraction_pct / 100) * proofLoad;
  } else {
    preload = assertPositive(i.preload_given_n, 'preload_given_n', 'Preload');
  }

  const mG = threadTorque(preload, pM, geometry.d2, muThread);
  const mK = headTorque(preload, bearingDiameter, muHead);
  const torque = mG + mK;
  const tensileStress = preload / geometry.stressArea;
  const torsionalStress = threadTorqueExact(preload, pM, geometry.d2, muThread) / ((Math.PI * geometry.ds ** 3) / 12);
  const reducedStress = Math.sqrt(tensileStress ** 2 + 3 * torsionalStress ** 2);

  const warnings = [];
  if (preload > proofLoad) warnings.push('Preload exceeds the ISO 898-1 proof load: permanent set is likely. Reduce the target or use a higher property class.');
  if (reducedStress > yieldPa) warnings.push('Reduced stress exceeds the yield strength: the bolt yields during tightening (acceptable only for angle-controlled tightening into the plastic range).');
  if (i.friction === 'custom' && Math.abs(muThread - muHead) > 0.1) warnings.push('Thread and under-head friction differ by more than 0.1 — unusual unless only one surface is lubricated.');
  if (i.property_class.startsWith('A') && thread.d > 24) warnings.push('Stainless property classes A2-70/A4-80 are specified up to M24 in ISO 3506-1; larger sizes have lower guaranteed strength.');
  warnings.push(`Torque tightening gives a preload scatter of roughly ±${Math.round(((i.tightening_factor - 1) / (i.tightening_factor + 1)) * 100)} % for α_A = ${i.tightening_factor}; the minimum preload is what the joint design may rely on.`);

  return {
    outputs: {
      pitch_m: pM,
      d2_m: geometry.d2,
      d3_m: geometry.d3,
      stress_area_m2: geometry.stressArea,
      yield_pa: yieldPa,
      proof_load_n: proofLoad,
      preload_n: preload,
      preload_min_n: preload / i.tightening_factor,
      thread_torque_nm: mG,
      head_torque_nm: mK,
      torque_nm: torque,
      nut_factor: torque / (preload * dM),
      torque_k02_nm: 0.2 * preload * dM,
      tensile_stress_pa: tensileStress,
      torsional_stress_pa: torsionalStress,
      reduced_stress_pa: reducedStress,
      yield_utilisation_pct: (reducedStress / yieldPa) * 100,
      bearing_diameter_out_m: bearingDiameter,
    },
    warnings,
  };
}
