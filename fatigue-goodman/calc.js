/**
 * fatigue-goodman/calc.js — endurance limit of a steel part by the Marin equation and the fatigue factor of safety for
 * fluctuating stress by the modified Goodman, Gerber, Soderberg and ASME-elliptic criteria, with Langer first-cycle yield.
 *
 * S_e' = 0.5 S_ut (S_ut ≤ 1 400 MPa), 700 MPa above (Shigley eq. 6-8);  S_e = k_a k_b k_c k_d k_e k_f S_e' (eq. 6-18);
 * k_a = a S_ut^b (Table 6-2); k_b = (d/7.62)^−0.107 (2.79–51 mm), 1.51 d^−0.157 (51–254 mm), 1 for axial (eq. 6-20);
 * k_c = 1 bending, 0.85 axial, 0.59 torsion (eq. 6-26); k_d polynomial in °F (eq. 6-27); k_e from Table 6-5.
 * Goodman 1/n = σa/Se + σm/Sut; Soderberg 1/n = σa/Se + σm/Sy; Gerber and ASME-elliptic per Table 6-7 and 6-8;
 * Langer n_y = Sy/(σa + σm).  Torsion: Sut → Ssu = 0.67 Sut (eq. 6-54), Sy → Ssy = 0.577 Sy.
 * Schema units: SI — Pa, m, °C.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative, assertFinite } from '../shared/validate.js';

/** Shigley Table 6-2 surface factor k_a = a S_ut^b with S_ut in MPa. */
export const SURFACE = {
  ground: { label: 'Ground', a: 1.58, b: -0.085 },
  machined: { label: 'Machined or cold-drawn', a: 4.51, b: -0.265 },
  hot_rolled: { label: 'Hot-rolled', a: 57.7, b: -0.718 },
  forged: { label: 'As-forged', a: 272, b: -0.995 },
};
/** Shigley Table 6-5 reliability factor k_e. */
export const RELIABILITY = { 50: 1.0, 90: 0.897, 95: 0.868, 99: 0.814, 99.9: 0.753, 99.99: 0.702, 99.999: 0.659, 99.9999: 0.62 };
const LOAD_KC = { bending: 1, axial: 0.85, torsion: 0.59 };

export function surfaceFactor(kind, sutMpa) {
  const s = SURFACE[kind];
  return s.a * sutMpa ** s.b;
}

/** Size factor for a round section in rotating bending or torsion, diameter in mm (Shigley eq. 6-20); null outside 2.79–254 mm. */
export function sizeFactor(dMm) {
  if (dMm < 2.79 - 1e-9 || dMm > 254 + 1e-9) return null;
  return dMm <= 51 ? (dMm / 7.62) ** -0.107 : 1.51 * dMm ** -0.157;
}

/** Temperature factor (Shigley eq. 6-27) from °C; 1 at or below 70 °F (21 °C). */
export function temperatureFactor(tC) {
  const f = (tC * 9) / 5 + 32;
  if (f <= 70) return 1;
  return 0.975 + 0.432e-3 * f - 0.115e-5 * f ** 2 + 0.104e-8 * f ** 3 - 0.595e-12 * f ** 4;
}

/** Fatigue factors of safety for alternating sa and mean sm against Se, Sut, Sy (Shigley Tables 6-6 to 6-8). */
export function safetyFactors(sa, sm, se, sut, sy) {
  if (sm <= 0) {
    const n = se / sa;
    return { goodman: n, gerber: n, soderberg: n, asme: n, langer: sy / (sa + Math.abs(sm)) };
  }
  const r = sa / sm;
  return {
    goodman: 1 / (sa / se + sm / sut),
    soderberg: 1 / (sa / se + sm / sy),
    gerber: 0.5 * (sut / sm) ** 2 * (sa / se) * (-1 + Math.sqrt(1 + ((2 * sm * se) / (sut * sa)) ** 2)),
    asme: Math.sqrt(1 / ((sa / se) ** 2 + (sm / sy) ** 2)),
    langer: sy / (sa + sm),
    r,
  };
}

export const schema = {
  id: 'fatigue-goodman',
  name: 'Fatigue safety factor calculator (Goodman, Gerber, Soderberg)',
  category: 'mechanical',
  summary: 'Endurance limit of a steel part with the Marin factors and the fatigue safety factor by modified Goodman, Gerber, Soderberg and ASME-elliptic criteria.',
  related: ['mohr-circle', 'hardness-conversion', 'shaft-torsion', 'weld-fatigue'],
  assumptions: [
    'The method is Shigley\'s stress-life approach for steel: S_e\' = 0.5 S_ut up to 1 400 MPa (700 MPa above), corrected by the Marin factors for surface, size, load, temperature and reliability (Shigley 10th ed. §6-7 to §6-9). It aims at infinite life (10⁶ cycles and beyond).',
    'The size factor applies to round sections in rotating bending or torsion from 2.79 to 254 mm; a non-rotating round section uses the effective diameter 0.370 d (eq. 6-23). Axial loading has k_b = 1. Other shapes need their own effective diameter.',
    'The fatigue stress-concentration factor K_f multiplies both the alternating and the mean nominal stress, as for a ductile material that does not yield locally (Shigley Example 6-10). Enter K_f = 1 if the stresses already include it.',
    'For torsion the load factor is 0.59, and the ultimate and yield strengths are replaced by S_su = 0.67 S_ut (eq. 6-54) and S_sy = 0.577 S_y; enter shear stresses. Combined loading should be reduced to von Mises alternating and mean stresses first and entered as bending.',
    'A compressive mean stress is treated conservatively: the fatigue factor is S_e/σ_a for every criterion and the yield factor uses |σ_m|. The temperature factor is valid up to 538 °C (1 000 °F).',
  ],
  notes: [
    'Verification 2026-11-08: Shigley Example 6-10 (1.5 in AISI 1050 CD bar, axial 0 to 16 kip, K_f 1.85, S_ut 100 kpsi, S_y 84 kpsi): k_a = 0.798 (SI constants; 0.797 with kpsi constants), k_c = 0.85, S_e = 33.9 kpsi, σ_a = σ_m = 8.38 kpsi; Gerber n_f = 3.66 (3.67 without rounding the intermediate values), ASME-elliptic 3.75, Langer n_y = 5.01, as printed in the example; Goodman 3.02 and Soderberg 2.88 by hand.',
  ],
  sources: [
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §6-7 to §6-9: eq. 6-8 (S_e'), eq. 6-18 (Marin equation), Table 6-2 (k_a), eqs. 6-20 and 6-23 (k_b), eq. 6-26 (k_c), eq. 6-27 (k_d), Table 6-5 (k_e)",
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §6-12 and Tables 6-6 to 6-8 (modified Goodman, Gerber, Soderberg, ASME-elliptic and Langer criteria), eq. 6-54 (torsion), Example 6-10",
  ],
  inputs: [
    { id: 'sut_pa', label: 'Ultimate tensile strength S_ut', group: 'pressure', unit: 'Pa', display: 'MPa', default: 100 * 6894757.293168, min: 100e6, max: 3000e6 },
    { id: 'sy_pa', label: 'Yield strength S_y', group: 'pressure', unit: 'Pa', display: 'MPa', default: 84 * 6894757.293168, min: 50e6, max: 3000e6 },
    { id: 'surface', label: 'Surface finish', type: 'select', default: 'machined', options: Object.entries(SURFACE).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'load', label: 'Loading', type: 'select', default: 'axial', options: [{ value: 'bending', label: 'Bending (k_c = 1)' }, { value: 'axial', label: 'Axial (k_c = 0.85)' }, { value: 'torsion', label: 'Torsion (k_c = 0.59, shear stresses)' }] },
    { id: 'motion', label: 'Section', type: 'select', default: 'rotating', options: [{ value: 'rotating', label: 'Round, rotating' }, { value: 'nonrotating', label: 'Round, not rotating (d_e = 0.370 d)' }], visibleWhen: { load: ['bending', 'torsion'] } },
    { id: 'd_m', label: 'Diameter d', group: 'length', unit: 'm', display: 'mm', default: 0.0381, min: 0.001, max: 1, visibleWhen: { load: ['bending', 'torsion'] } },
    { id: 'temp_c', label: 'Operating temperature', group: 'temperature', unit: 'C', default: 20, min: -40, max: 538 },
    { id: 'reliability', label: 'Reliability', type: 'select', default: '50', options: Object.entries(RELIABILITY).map(([value, k]) => ({ value, label: `${value} % (k_e = ${k.toFixed(3)})` })) },
    { id: 'kf_misc', label: 'Miscellaneous-effects factor k_f (1 if none)', group: 'dimensionless', unit: 'none', default: 1, min: 0.1, max: 1 },
    { id: 'sa_pa', label: 'Alternating nominal stress σ_a', group: 'pressure', unit: 'Pa', display: 'MPa', default: (8 / 1.767146) * 6894757.293168, min: 1, max: 5000e6 },
    { id: 'sm_pa', label: 'Mean nominal stress σ_m (negative if compressive)', group: 'pressure', unit: 'Pa', display: 'MPa', default: (8 / 1.767146) * 6894757.293168, min: -5000e6, max: 5000e6 },
    { id: 'kf_conc', label: 'Fatigue stress-concentration factor K_f', group: 'dimensionless', unit: 'none', default: 1.85, min: 1, max: 10 },
  ],
  outputs: [
    { id: 'se_prime_pa', label: 'Rotating-beam endurance limit S_e\'', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'ka', label: 'Surface factor k_a', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'kb', label: 'Size factor k_b', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'kc', label: 'Load factor k_c', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'kd', label: 'Temperature factor k_d', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'ke', label: 'Reliability factor k_e', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'se_pa', label: 'Corrected endurance limit S_e', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'sa_eff_pa', label: 'Alternating stress K_f σ_a', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'sm_eff_pa', label: 'Mean stress K_f σ_m', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'n_goodman', label: 'Fatigue safety factor, modified Goodman', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'n_gerber', label: 'Fatigue safety factor, Gerber', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'n_soderberg', label: 'Fatigue safety factor, Soderberg', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'n_asme', label: 'Fatigue safety factor, ASME-elliptic', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'n_yield', label: 'First-cycle yield safety factor (Langer)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'verdict', label: 'Result', type: 'text' },
  ],
  example: {
    inputs: { sut_pa: [100, 'ksi'], sy_pa: [84, 'ksi'], surface: 'machined', load: 'axial', temp_c: [20, 'C'], reliability: '50', kf_misc: 1, sa_pa: [4.5271, 'ksi'], sm_pa: [4.5271, 'ksi'], kf_conc: 1.85 },
    results: { ka: '0.798', se_pa: '33.9 ksi', sa_eff_pa: '8.375 ksi', n_goodman: '3.02', n_gerber: '3.67', n_soderberg: '2.88', n_asme: '3.75', n_yield: '5.01' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.surface, Object.keys(SURFACE), 'surface', 'Surface finish');
  assertOneOf(x.load, Object.keys(LOAD_KC), 'load', 'Loading');
  assertOneOf(x.motion, ['rotating', 'nonrotating'], 'motion', 'Section');
  assertOneOf(String(x.reliability), Object.keys(RELIABILITY), 'reliability', 'Reliability');
  const sut = assertPositive(x.sut_pa, 'sut_pa', 'Ultimate tensile strength');
  const sy = assertPositive(x.sy_pa, 'sy_pa', 'Yield strength');
  if (sy > sut) throw new Error('Yield strength: it cannot exceed the ultimate tensile strength.');
  const sutMpa = sut / 1e6;
  const tC = assertRange(x.temp_c, -40, 538, 'temp_c', 'Operating temperature');
  const kfm = assertRange(x.kf_misc, 0.1, 1, 'kf_misc', 'Miscellaneous-effects factor');
  const Kf = assertRange(x.kf_conc, 1, 10, 'kf_conc', 'Fatigue stress-concentration factor');
  const sa = Kf * assertPositive(x.sa_pa, 'sa_pa', 'Alternating nominal stress');
  const sm = Kf * assertFinite(x.sm_pa, 'sm_pa', 'Mean nominal stress');
  const sePrime = sutMpa <= 1400 ? 0.5 * sut : 700e6;
  const ka = surfaceFactor(x.surface, sutMpa);
  let kb = 1;
  if (x.load !== 'axial') {
    const d = assertPositive(x.d_m, 'd_m', 'Diameter') * 1000;
    const de = x.motion === 'nonrotating' ? 0.37 * d : d;
    kb = sizeFactor(de);
    if (kb === null) throw new Error(`Diameter: the size factor of Shigley eq. 6-20 covers effective diameters of 2.79 to 254 mm (got ${Number(de.toFixed(2))} mm).`);
  }
  const kc = LOAD_KC[x.load];
  const kd = temperatureFactor(tC);
  const ke = RELIABILITY[String(x.reliability)];
  const se = ka * kb * kc * kd * ke * kfm * sePrime;
  const torsion = x.load === 'torsion';
  const ult = torsion ? 0.67 * sut : sut;
  const yld = torsion ? 0.577 * sy : sy;
  const n = safetyFactors(sa, sm, se, ult, yld);
  const warnings = [];
  if (sutMpa > 1400) warnings.push('S_ut above 1 400 MPa: S_e\' is capped at 700 MPa (Shigley eq. 6-8).');
  if (tC < 0) warnings.push('Below 0 °C steels can become brittle; the Marin temperature factor does not cover low-temperature toughness. Check impact properties.');
  if (sm < 0) warnings.push('Compressive mean stress: the fatigue factors are S_e/σ_a, a conservative treatment.');
  const nf = Math.min(n.goodman, n.gerber, n.asme);
  const governing = Math.min(nf, n.langer);
  const verdict = governing >= 1
    ? `Infinite life expected: the lowest fatigue factor (Goodman, Gerber, ASME-elliptic) is ${nf.toFixed(2)} and the yield factor ${n.langer.toFixed(2)}.`
    : `${n.langer < 1 ? 'The part yields on the first cycle' : 'Finite life'}: lowest factor ${governing.toFixed(2)}. Reduce the stresses or improve the material or finish.`;
  return {
    outputs: {
      se_prime_pa: sePrime, ka, kb, kc, kd, ke, se_pa: se,
      sa_eff_pa: sa, sm_eff_pa: sm,
      n_goodman: n.goodman, n_gerber: n.gerber, n_soderberg: n.soderberg, n_asme: n.asme, n_yield: n.langer,
      verdict,
    },
    warnings,
  };
}
