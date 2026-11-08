/**
 * fillet-weld/calc.js — design resistance of fillet welds to EN 1993-1-8 §4.5: the simplified method (resultant force per
 * unit length against F_w,Rd = f_vw,d a) and the directional method (σ⊥, τ⊥, τ∥ on the throat plane against
 * f_u/(β_w γ_M2) and 0.9 f_u/γ_M2), for a weld group of parallel welds under transverse force, longitudinal shear and
 * in-plane bending; required throat, geometric limits.
 *
 * f_vw,d = f_u/(√3 β_w γ_M2);  √(σ⊥² + 3(τ⊥² + τ∥²)) ≤ f_u/(β_w γ_M2);  σ⊥ ≤ 0.9 f_u/γ_M2.
 * Schema units: m (display mm), N (display kN), N·m (display kN·m), Pa (display MPa).
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

/** EN 1993-1-8 Table 4.1 correlation factors and EN 1993-1-1 Table 3.1 nominal f_u (t ≤ 40 mm). */
export const STEEL_GRADES = {
  S235: { label: 'S235 (f_u 360 MPa, β_w 0.80)', fu: 360e6, bw: 0.8 },
  S275: { label: 'S275 (f_u 430 MPa, β_w 0.85)', fu: 430e6, bw: 0.85 },
  S355: { label: 'S355 (f_u 490 MPa, β_w 0.90)', fu: 490e6, bw: 0.9 },
  S420: { label: 'S420 (f_u 520 MPa, β_w 1.00)', fu: 520e6, bw: 1.0 },
  S460: { label: 'S460 (f_u 540 MPa, β_w 1.00)', fu: 540e6, bw: 1.0 },
  custom: { label: 'Custom f_u and β_w', fu: null, bw: null },
};

export const schema = {
  id: 'fillet-weld',
  name: 'Fillet weld strength',
  category: 'structural',
  summary: 'Throat area and design resistance of fillet welds under shear, tension and bending (Eurocode 3 directional and simplified methods).',
  related: ['beam-deflection', 'bolt-torque', 'column-buckling', 'pressure-vessel'],
  assumptions: [
    'EN 1993-1-8 §4.5 fillet welds with equal legs: the throat a is the height of the inscribed triangle (a = z/√2 for leg z), a ≥ 3 mm, and the effective length excludes the end craters (L_eff ≥ 30 mm and ≥ 6a); welds longer than 150 a in lap joints need the β_Lw reduction (not applied — the page warns).',
    'Simplified method (§4.5.3.3): the resultant of all forces per unit length F_w,Ed ≤ F_w,Rd = f_vw,d a with f_vw,d = f_u/(√3 β_w γ_M2), independent of the load direction — always safe-sided. Directional method (§4.5.3.2): the stresses on the throat plane must satisfy √(σ⊥² + 3(τ⊥² + τ∥²)) ≤ f_u/(β_w γ_M2) and σ⊥ ≤ 0.9 f_u/γ_M2; for a weld loaded transversely σ⊥ = τ⊥ = F/(√2 a L), which gives 22 % more resistance than the simplified method.',
    'Weld group: n parallel welds of length L; the transverse force and the longitudinal shear are shared equally; an in-plane moment about the weld group is resisted by a force couple M/h between two parallel welds at spacing h (exact for two equal welds, conservative otherwise). Eccentricity, torsion of the group and stress concentrations at the weld ends are not modelled.',
    'f_u is the nominal ultimate strength of the weaker part joined (EN 1993-1-1 Table 3.1 for t ≤ 40 mm: S235 360, S275 430, S355 490, S420 520, S460 540 MPa), β_w from EN 1993-1-8 Table 4.1 (0.80/0.85/0.90/1.00/1.00) and γ_M2 = 1.25 (recommended; National Annexes may differ); the weld metal must match or over-match the parent metal.',
    'Static design at ultimate limit state; fatigue (EN 1993-1-9), residual stresses, distortion and inspection levels are outside the calculation.',
    'The throat limit a ≤ 0.7 t_min of the thinner plate is the usual practical maximum to avoid burn-through; the minimum 3 mm is from EN 1993-1-8 §4.5.2.',
  ],
  notes: [
    'Verification 2026-10-31: f_vw,d = 360/(√3 × 0.8 × 1.25) = 207.8 MPa for S235 and 251.5 MPa for S355; the UTM worked example with f_u 340 MPa (older S235 grade) gives 196.3 MPa; the directional/simplified ratio for a transverse weld is √3/√2 = 1.225, the classic Eurocode result.',
    'Design decision: both methods are reported side by side with their utilisations, because designers use the simplified method for quick checks and the directional method to justify slender welds.',
  ],
  sources: [
    'EN 1993-1-8:2005 Eurocode 3 — Design of steel structures — Part 1-8: Design of joints, §4.5 (fillet welds), Table 4.1 (β_w), §4.5.3.2 directional method, §4.5.3.3 simplified method',
    'EN 1993-1-1:2005 Table 3.1 nominal values of f_y and f_u; EN 10025-2 hot-rolled structural steels',
    'SCI P363 / Access Steel SN017 worked examples on fillet weld design; UTM OCW steel connections lecture (f_vw,d example)',
    'AWS D1.1 / IIW recommendations — background on throat definition and effective length',
  ],
  inputs: [
    { id: 'grade', label: 'Steel grade of the weaker connected part', type: 'select', default: 'S355', options: Object.entries(STEEL_GRADES).map(([value, g]) => ({ value, label: g.label })) },
    { id: 'fu_custom_pa', label: 'Custom ultimate strength f_u', group: 'pressure', unit: 'Pa', display: 'MPa', default: 470e6, min: 2e8, max: 1e9, visibleWhen: { grade: 'custom' } },
    { id: 'bw_custom', label: 'Custom correlation factor β_w', group: 'dimensionless', unit: 'none', default: 0.9, min: 0.7, max: 1.2, visibleWhen: { grade: 'custom' } },
    { id: 'gamma_m2', label: 'Partial factor γ_M2', group: 'dimensionless', unit: 'none', default: 1.25, min: 1, max: 1.5 },
    { id: 'size_basis', label: 'Weld size given as', type: 'select', default: 'throat', options: [{ value: 'throat', label: 'Throat thickness a' }, { value: 'leg', label: 'Leg length z (a = z/√2)' }] },
    { id: 'size_m', label: 'Weld size (throat or leg)', group: 'length', unit: 'm', display: 'mm', default: 0.005, min: 1e-3, max: 0.05 },
    { id: 'length_m', label: 'Effective length of each weld L_eff', group: 'length', unit: 'm', display: 'mm', default: 0.2, min: 0.01, max: 20 },
    { id: 'welds', label: 'Number of parallel welds sharing the load', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 20, integer: true },
    { id: 'plate_t_m', label: 'Thinner connected plate thickness t_min (for the a ≤ 0.7 t check)', group: 'length', unit: 'm', display: 'mm', default: 0.01, min: 1e-3, max: 0.2 },
    { id: 'force_transverse_n', label: 'Force perpendicular to the weld axis (in the plate plane), total', group: 'force', unit: 'N', display: 'kN', default: 300e3, min: 0, max: 1e8 },
    { id: 'force_longitudinal_n', label: 'Shear force parallel to the weld axis, total', group: 'force', unit: 'N', display: 'kN', default: 100e3, min: 0, max: 1e8 },
    { id: 'moment_n_m', label: 'In-plane bending moment on the weld group (0 = none)', group: 'torque', unit: 'N_m', display: 'kN_m', default: 0, min: 0, max: 1e8 },
    { id: 'spacing_m', label: 'Spacing h between the two welds resisting the moment', group: 'length', unit: 'm', display: 'mm', default: 0.2, min: 0.01, max: 5 },
  ],
  outputs: [
    { id: 'throat_m', label: 'Throat thickness a', group: 'length', unit: 'm', display: 'mm' },
    { id: 'leg_m', label: 'Leg length z = a √2', group: 'length', unit: 'm', display: 'mm' },
    { id: 'throat_area_m2', label: 'Total throat area Σ a L', group: 'area', unit: 'm2', display: 'mm2' },
    { id: 'fu_used_pa', label: 'f_u used', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'bw_used', label: 'β_w used', group: 'dimensionless', unit: 'none' },
    { id: 'fvwd_pa', label: 'Design shear strength of the weld f_vw,d = f_u/(√3 β_w γ_M2)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'fwrd_n_m', label: 'Design resistance per unit length F_w,Rd = f_vw,d a', group: 'line_load', unit: 'N_m', display: 'kN_m' },
    { id: 'resultant_n_m', label: 'Resultant design force per unit length F_w,Ed (simplified method)', group: 'line_load', unit: 'N_m', display: 'kN_m' },
    { id: 'utilisation_simplified', label: 'Utilisation — simplified method', group: 'ratio', unit: 'pct' },
    { id: 'sigma_perp_pa', label: 'σ⊥ on the throat (directional)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'tau_perp_pa', label: 'τ⊥ on the throat', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'tau_par_pa', label: 'τ∥ on the throat', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'comparison_stress_pa', label: 'Comparison stress √(σ⊥² + 3(τ⊥² + τ∥²))', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'limit_stress_pa', label: 'Limit f_u/(β_w γ_M2)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'utilisation_directional', label: 'Utilisation — directional method (governing of the two criteria)', group: 'ratio', unit: 'pct' },
    { id: 'required_throat_simplified_m', label: 'Throat required for 100 % (simplified)', group: 'length', unit: 'm', display: 'mm' },
    { id: 'required_throat_directional_m', label: 'Throat required for 100 % (directional)', group: 'length', unit: 'm', display: 'mm' },
    { id: 'geometry_check', label: 'Geometric limits (a ≥ 3 mm, a ≤ 0.7 t, L ≥ 30 mm and 6a, L ≤ 150a)', type: 'text' },
    { id: 'verdict', label: 'Verdict', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      fvwd_pa: '251.5 MPa',
      utilisation_simplified: '63 %',
      sigma_perp_pa: '106 MPa',
      tau_perp_pa: '106 MPa',
      tau_par_pa: '50 MPa',
      limit_stress_pa: '436 MPa',
      utilisation_directional: '53 %',
    },
  },
};

/** Design shear strength of the weld metal, Pa. */
export function weldShearStrength(fu, bw, gammaM2) {
  return fu / (Math.sqrt(3) * bw * gammaM2);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.grade, Object.keys(STEEL_GRADES), 'grade', 'Steel grade');
  assertOneOf(i.size_basis, ['throat', 'leg'], 'size_basis', 'Size basis');
  assertRange(i.gamma_m2, 1, 2, 'gamma_m2', 'γ_M2');
  assertPositive(i.size_m, 'size_m', 'Weld size');
  assertPositive(i.length_m, 'length_m', 'Weld length');
  assertInteger(i.welds, 'welds', 'Number of welds');
  assertRange(i.welds, 1, 50, 'welds', 'Number of welds');
  assertPositive(i.plate_t_m, 'plate_t_m', 'Plate thickness');
  assertNonNegative(i.force_transverse_n, 'force_transverse_n', 'Transverse force');
  assertNonNegative(i.force_longitudinal_n, 'force_longitudinal_n', 'Longitudinal force');
  assertNonNegative(i.moment_n_m, 'moment_n_m', 'Moment');
  assertPositive(i.spacing_m, 'spacing_m', 'Spacing');
  if (i.force_transverse_n + i.force_longitudinal_n + i.moment_n_m <= 0) throw new Error('Enter at least one force or moment');
  if (i.moment_n_m > 0 && i.welds < 2) throw new Error('An in-plane moment needs at least two parallel welds (force couple)');

  const grade = STEEL_GRADES[i.grade];
  const fu = i.grade === 'custom' ? assertPositive(i.fu_custom_pa, 'fu_custom_pa', 'f_u') : grade.fu;
  const bw = i.grade === 'custom' ? assertRange(i.bw_custom, 0.5, 1.5, 'bw_custom', 'β_w') : grade.bw;
  const a = i.size_basis === 'leg' ? i.size_m / Math.SQRT2 : i.size_m;
  const L = i.length_m;
  const n = i.welds;
  const fvwd = weldShearStrength(fu, bw, i.gamma_m2);
  const Fwrd = fvwd * a;

  // forces per weld
  const momentForce = i.moment_n_m > 0 ? i.moment_n_m / i.spacing_m : 0;
  const transversePerWeld = i.force_transverse_n / n + momentForce;
  const longitudinalPerWeld = i.force_longitudinal_n / n;
  const perLengthTransverse = transversePerWeld / L;
  const perLengthLongitudinal = longitudinalPerWeld / L;
  const resultant = Math.hypot(perLengthTransverse, perLengthLongitudinal);
  const utilSimplified = resultant / Fwrd;

  const sigmaPerp = perLengthTransverse / (Math.SQRT2 * a);
  const tauPerp = sigmaPerp;
  const tauPar = perLengthLongitudinal / a;
  const comparison = Math.sqrt(sigmaPerp ** 2 + 3 * (tauPerp ** 2 + tauPar ** 2));
  const limit = fu / (bw * i.gamma_m2);
  const limitPerp = (0.9 * fu) / i.gamma_m2;
  const utilDirectional = Math.max(comparison / limit, sigmaPerp / limitPerp);
  const requiredSimplified = resultant / fvwd;
  const requiredDirectional = a * utilDirectional;

  const geo = [];
  if (a < 0.003) geo.push('a < 3 mm');
  if (a > 0.7 * i.plate_t_m) geo.push(`a > 0.7 t_min (${(0.7 * i.plate_t_m * 1000).toFixed(1)} mm)`);
  if (L < 0.03 || L < 6 * a) geo.push('L_eff < max(30 mm, 6a)');
  if (L > 150 * a) geo.push('L_eff > 150 a (apply β_Lw for lap joints)');
  const geometryCheck = geo.length ? `CHECK — ${geo.join('; ')}` : `OK — a ${(a * 1000).toFixed(1)} mm, L_eff ${(L * 1000).toFixed(0)} mm within limits`;
  const verdict = utilDirectional <= 1 ? `OK — directional ${(utilDirectional * 100).toFixed(0)} %, simplified ${(utilSimplified * 100).toFixed(0)} %` : utilSimplified <= 1 ? 'Inconsistent input (directional exceeds while simplified passes) — check the moment couple' : `FAIL — directional ${(utilDirectional * 100).toFixed(0)} %, simplified ${(utilSimplified * 100).toFixed(0)} %: throat ≥ ${(requiredDirectional * 1000).toFixed(1)} mm needed`;

  const warnings = [];
  if (i.moment_n_m > 0 && n > 2) warnings.push('Moment resisted by a force couple between two welds at spacing h: conservative for groups of more than two welds (the others are ignored for the moment).');
  if (L > 150 * a) warnings.push('Long weld: EN 1993-1-8 §4.11 reduces the resistance of lap-joint welds longer than 150 a by β_Lw = 1.2 − 0.2 L/(150 a); not applied here.');
  if (i.gamma_m2 !== 1.25) warnings.push('γ_M2 differs from the recommended 1.25: ensure it matches the National Annex.');
  if (i.grade !== 'custom' && i.plate_t_m > 0.04) warnings.push('Plate thicker than 40 mm: EN 10025 f_u is lower (e.g. S355 470 MPa for 40–80 mm) — use the custom grade.');
  warnings.push('Static ULS design to EN 1993-1-8; fatigue (EN 1993-1-9), eccentricity of the weld group and end-crater effects are not covered.');
  warnings.push('Weld metal assumed to match or over-match the parent metal; the simplified method is always the conservative check.');

  return {
    outputs: {
      throat_m: a,
      leg_m: a * Math.SQRT2,
      throat_area_m2: a * L * n,
      fu_used_pa: fu,
      bw_used: bw,
      fvwd_pa: fvwd,
      fwrd_n_m: Fwrd,
      resultant_n_m: resultant,
      utilisation_simplified: utilSimplified * 100,
      sigma_perp_pa: sigmaPerp,
      tau_perp_pa: tauPerp,
      tau_par_pa: tauPar,
      comparison_stress_pa: comparison,
      limit_stress_pa: limit,
      utilisation_directional: utilDirectional * 100,
      required_throat_simplified_m: requiredSimplified,
      required_throat_directional_m: requiredDirectional,
      geometry_check: geometryCheck,
      verdict,
    },
    warnings,
  };
}
