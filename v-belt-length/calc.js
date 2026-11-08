/**
 * v-belt-length/calc.js — V-belt pitch length from the sheave pitch diameters and the centre distance, and the inverse:
 * the centre distance for a standard belt length; by the standard approximate formula, checked against the exact
 * open-belt geometry.
 *
 * Approximate (Shigley eq. 17-16a): L_p = 2C + π(D + d)/2 + (D − d)²/(4C).
 * Inverse (eq. 17-16b): C = ¼ {[L_p − π(D + d)/2] + √([L_p − π(D + d)/2]² − 2(D − d)²)}.
 * Exact (eq. 17-1): L = √(4C² − (D − d)²) + ½ [D(π + 2φ) + d(π − 2φ)], φ = asin((D − d)/(2C)); inverse by bisection.
 * Schema units: SI — m, rad.
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';

export const approxLength = (D, d, C) => 2 * C + (Math.PI * (D + d)) / 2 + (D - d) ** 2 / (4 * C);

export function exactLength(D, d, C) {
  const phi = Math.asin((D - d) / (2 * C));
  return Math.sqrt(4 * C * C - (D - d) ** 2) + 0.5 * (D * (Math.PI + 2 * phi) + d * (Math.PI - 2 * phi));
}

export function approxCentre(D, d, L) {
  const b = L - (Math.PI * (D + d)) / 2;
  const disc = b * b - 2 * (D - d) ** 2;
  return disc < 0 || b <= 0 ? null : 0.25 * (b + Math.sqrt(disc));
}

/** Exact centre distance for a pitch length L by bisection on the exact length (monotonic in C). */
export function exactCentre(D, d, L) {
  let lo = (D + d) / 2;
  if (exactLength(D, d, lo) >= L) return null;
  let hi = L;
  for (let k = 0; k < 200; k += 1) {
    const mid = 0.5 * (lo + hi);
    if (exactLength(D, d, mid) < L) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

export const schema = {
  id: 'v-belt-length',
  name: 'V-belt length and centre distance calculator',
  category: 'mechanical',
  summary: 'V-belt pitch length from sheave pitch diameters and centre distance, or the centre distance for a standard belt, with the exact formula as a check.',
  related: ['belt-pulley', 'chain-sprocket', 'gear-ratio', 'torque-power-rpm'],
  assumptions: [
    'Diameters are sheave pitch diameters and the length is the belt pitch length, the convention of belt catalogues and of Shigley §17-3. Outside or inside lengths differ from the pitch length by an amount that depends on the belt section; take it from the belt maker.',
    'The approximate formula replaces the exact arc geometry by the first terms of a series in (D − d)/C; its error grows with the diameter difference and is shown next to the exact value.',
    'The centre distance for a standard belt is the nominal value with the belt fitted; drives need adjustment for installation (shorter) and take-up (longer), usually given by the belt maker.',
    'Two-sheave open drive with no idler; the wrap angle on the small sheave is shown, and below about 120° the belt rating must be reduced.',
  ],
  notes: [
    'Verification 2026-11-08: sheaves of 100 and 250 mm on 600 mm centres: approximate L_p = 1 200 + 549.78 + 9.38 = 1 759.15 mm, exact 1 759.17 mm; for an 1 800 mm belt the approximate inverse gives C = 620.58 mm and the exact inverse 620.57 mm. Checked by hand.',
  ],
  sources: [
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §17-3 V belts, eqs. 17-16a and 17-16b (pitch length and centre distance), and eq. 17-1 (exact open-belt geometry)",
    'ISO 4184:1992, Belt drives — Classical and narrow V-belts — Lengths in datum system (standard datum lengths)',
  ],
  inputs: [
    { id: 'mode', label: 'Solve for', type: 'select', default: 'length', options: [{ value: 'length', label: 'Belt pitch length from the centre distance' }, { value: 'centre', label: 'Centre distance for a standard belt length' }] },
    { id: 'd_small_m', label: 'Small sheave pitch diameter d', group: 'length', unit: 'm', display: 'mm', default: 0.1, min: 0.005, max: 5 },
    { id: 'd_large_m', label: 'Large sheave pitch diameter D', group: 'length', unit: 'm', display: 'mm', default: 0.25, min: 0.005, max: 5 },
    { id: 'c_m', label: 'Centre distance C', group: 'length', unit: 'm', display: 'mm', default: 0.6, min: 0.005, max: 50, visibleWhen: { mode: 'length' } },
    { id: 'belt_m', label: 'Belt pitch length L_p', group: 'length', unit: 'm', display: 'mm', default: 1.8, min: 0.05, max: 100, visibleWhen: { mode: 'centre' } },
  ],
  outputs: [
    { id: 'length_approx_m', label: 'Pitch length, approximate formula', group: 'length', unit: 'm', display: 'mm', visibleWhen: { mode: 'length' } },
    { id: 'length_exact_m', label: 'Pitch length, exact geometry', group: 'length', unit: 'm', display: 'mm' },
    { id: 'error_m', label: 'Approximate minus exact length', group: 'length', unit: 'm', display: 'mm', decimals: 3, visibleWhen: { mode: 'length' } },
    { id: 'centre_approx_m', label: 'Centre distance, approximate formula', group: 'length', unit: 'm', display: 'mm', visibleWhen: { mode: 'centre' } },
    { id: 'centre_exact_m', label: 'Centre distance, exact geometry', group: 'length', unit: 'm', display: 'mm' },
    { id: 'wrap_rad', label: 'Wrap angle on the small sheave', group: 'angle', unit: 'rad', display: 'deg', decimals: 1 },
    { id: 'ratio', label: 'Speed ratio D/d', group: 'dimensionless', unit: 'none', decimals: 3 },
  ],
  example: {
    inputs: { mode: 'centre', d_small_m: [100, 'mm'], d_large_m: [250, 'mm'], belt_m: [1800, 'mm'] },
    results: { centre_approx_m: '620.58 mm', centre_exact_m: '620.57 mm' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['length', 'centre'], 'mode', 'Solve for');
  const d = assertPositive(x.d_small_m, 'd_small_m', 'Small sheave pitch diameter');
  const D = assertPositive(x.d_large_m, 'd_large_m', 'Large sheave pitch diameter');
  if (D < d) throw new Error('Large sheave pitch diameter: enter the larger sheave as D and the smaller as d.');
  const warnings = [];
  let C; let Lexact; let Lapprox = null; let Capprox = null;
  if (x.mode === 'length') {
    C = assertPositive(x.c_m, 'c_m', 'Centre distance');
    if (C <= (D + d) / 2) throw new Error('Centre distance: it must be more than the sum of the two sheave radii, or the sheaves overlap.');
    Lapprox = approxLength(D, d, C);
    Lexact = exactLength(D, d, C);
  } else {
    const L = assertPositive(x.belt_m, 'belt_m', 'Belt pitch length');
    C = exactCentre(D, d, L);
    if (C === null) throw new Error('Belt pitch length: the belt is too short to pass round both sheaves without them touching; choose a longer belt.');
    Capprox = approxCentre(D, d, L);
    Lexact = L;
  }
  const wrap = Math.PI - 2 * Math.asin((D - d) / (2 * C));
  if (wrap < (120 * Math.PI) / 180) warnings.push('Wrap angle on the small sheave below 120°: V-belt power ratings must be reduced for the short arc of contact; increase the centre distance if possible.');
  if (C < D) warnings.push('Centre distance less than the large sheave diameter: below the usual minimum for V-belt drives; check the belt maker\'s recommendation.');
  return {
    outputs: {
      length_approx_m: Lapprox,
      length_exact_m: Lexact,
      error_m: Lapprox === null ? null : Lapprox - Lexact,
      centre_approx_m: Capprox,
      centre_exact_m: C,
      wrap_rad: wrap,
      ratio: D / d,
    },
    warnings,
  };
}
