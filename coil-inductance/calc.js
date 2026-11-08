/**
 * coil-inductance/calc.js — inductance of an air-core coil, or the turns for a target inductance: Wheeler's
 * single-layer and multilayer formulas, the long-solenoid formula, and the single-layer current sheet with
 * Nagaoka's coefficient for comparison.
 *
 * Wheeler single layer:  L[µH] = d² N² / (18 d + 40 l)            (d diameter, l length, inches)
 * Wheeler multilayer:    L[µH] = 0.8 a² N² / (6 a + 9 b + 10 c)   (a mean radius, b length, c winding depth, inches)
 * Long solenoid:         L = μ0 N² A / l,  A = π d² / 4
 * Current sheet:         L = K_N μ0 N² A / l,  K_N = 4/(3π k′) [ (k′²/k²)(K(k) − E(k)) + E(k) − k ],
 *                        k = d / √(d² + l²), k′ = l / √(d² + l²)  (Nagaoka 1909)
 * Schema units: SI — m; inductance in µH (no inductance unit group yet).
 */
import { withDefaults, assertOneOf, assertPositive, assertRange } from '../shared/validate.js';

/** Magnetic constant, H/m (CODATA 2018: 1.25663706212e-6). */
export const MU0 = 1.25663706212e-6;
const IN = 0.0254;

/** Complete elliptic integrals K(k) and E(k) of modulus k by the arithmetic-geometric mean. */
export function ellipticKE(k) {
  let a = 1;
  let b = Math.sqrt(1 - k * k);
  let sum = (k * k) / 2;
  let p = 0.5;
  for (let n = 0; n < 40 && Math.abs(a - b) > 1e-15 * a; n += 1) {
    const c = (a - b) / 2;
    const an = (a + b) / 2;
    b = Math.sqrt(a * b);
    a = an;
    p *= 2;
    sum += p * c * c;
  }
  const K = Math.PI / (2 * a);
  return { K, E: K * (1 - sum) };
}

/** Nagaoka's coefficient of a single-layer current sheet of diameter d and length l. */
export function nagaoka(d, l) {
  const h = Math.hypot(d, l);
  const k = d / h;
  const kp = l / h;
  const { K, E } = ellipticKE(k);
  return (4 / (3 * Math.PI * kp)) * ((kp * kp) / (k * k) * (K - E) + E - k);
}

export const wheelerSingleUh = (dIn, lIn, n) => (dIn * dIn * n * n) / (18 * dIn + 40 * lIn);
export const wheelerMultiUh = (aIn, bIn, cIn, n) => (0.8 * aIn * aIn * n * n) / (6 * aIn + 9 * bIn + 10 * cIn);
export const longSolenoidUh = (d, l, n) => ((MU0 * n * n * Math.PI * d * d) / (4 * l)) * 1e6;

export const schema = {
  id: 'coil-inductance',
  name: 'Air-core coil inductance calculator',
  category: 'electrical',
  summary: 'Inductance of an air-core coil by Wheeler\'s single-layer and multilayer formulas or the long-solenoid formula, and the turns for a target inductance.',
  related: ['lc-resonance', 'filter-cutoff', 'awg-wire-gauge', 'wire-size'],
  assumptions: [
    'The coil has no core, or a core of a non-magnetic material such as plastic, wood or ceramic; a ferrite or iron core multiplies the inductance by its effective permeability.',
    'Wheeler\'s single-layer formula uses the diameter to the centre of the wire and the winding length; Wheeler gives it as accurate to about 1 % when the length is more than 0.4 times the diameter.',
    'Wheeler\'s multilayer formula uses the mean radius, the winding length and the radial depth of the winding; it is accurate to about 1 % when 6a, 9b and 10c are about equal, and less otherwise.',
    'The long-solenoid formula μ0 N² A / l ignores the field at the ends, so it overestimates a short coil; the current-sheet value with Nagaoka\'s coefficient is exact for a thin, evenly wound single layer and is shown for comparison.',
    'Self-capacitance, the wire\'s own inductance and the change of current distribution with frequency are ignored; they matter near the coil\'s self-resonant frequency.',
  ],
  notes: [
    'Verification 2026-11-08: 20 turns, 1 in diameter and 1 in long give 6.90 µH by Wheeler (400 / 58 = 6.897), 10.03 µH as a long solenoid and 6.90 µH with Nagaoka\'s coefficient 0.6884 for d/l = 1; 24.1 turns give 10 µH. Checked by hand.',
  ],
  sources: [
    'Wheeler, H. A., Simple Inductance Formulas for Radio Coils, Proceedings of the IRE, vol. 16, no. 10, 1928, pp. 1398–1400 (single-layer and multilayer formulas)',
    'Nagaoka, H., The Inductance Coefficients of Solenoids, Journal of the College of Science, Imperial University of Tokyo, vol. 27, art. 6, 1909 (coefficient K for d/l = 1: 0.6884)',
    'Grover, F. W., Inductance Calculations, Van Nostrand 1946 (Dover reprint), the chapter on single-layer coils and its tables of Nagaoka\'s coefficient',
  ],
  inputs: [
    { id: 'type', label: 'Coil and formula', type: 'select', default: 'single', options: [
      { value: 'single', label: 'Single-layer solenoid (Wheeler)' },
      { value: 'multi', label: 'Multilayer coil (Wheeler)' },
      { value: 'long', label: 'Long solenoid, μ0 N² A / l' },
    ] },
    { id: 'solve', label: 'Find', type: 'select', default: 'L', options: [{ value: 'L', label: 'Inductance from the number of turns' }, { value: 'N', label: 'Turns for a target inductance' }] },
    { id: 'diameter_m', label: 'Coil diameter d (to the wire centres; mean diameter for a multilayer coil)', group: 'length', unit: 'm', display: 'in', default: 0.0254, min: 1e-4, max: 10 },
    { id: 'length_m', label: 'Winding length l', group: 'length', unit: 'm', display: 'in', default: 0.0254, min: 1e-4, max: 100 },
    { id: 'depth_m', label: 'Winding depth c (outer minus inner radius)', group: 'length', unit: 'm', display: 'in', default: 0.00635, min: 1e-5, max: 10, visibleWhen: { type: 'multi' } },
    { id: 'turns', label: 'Number of turns N', group: 'dimensionless', unit: 'none', default: 20, min: 0.5, max: 1e6, visibleWhen: { solve: 'L' } },
    { id: 'target_uh', label: 'Target inductance, µH', group: 'dimensionless', unit: 'none', default: 10, min: 1e-4, max: 1e8, visibleWhen: { solve: 'N' } },
  ],
  outputs: [
    { id: 'l_uh', label: 'Inductance by the chosen formula, µH', group: 'dimensionless', unit: 'none' },
    { id: 'turns_out', label: 'Turns N', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'long_uh', label: 'Long-solenoid value μ0 N² A / l, µH', group: 'dimensionless', unit: 'none' },
    { id: 'sheet_uh', label: 'Current sheet with Nagaoka coefficient, µH', group: 'dimensionless', unit: 'none', visibleWhen: { type: ['single', 'long'] } },
    { id: 'k_nagaoka', label: 'Nagaoka coefficient K for d/l', group: 'dimensionless', unit: 'none', decimals: 4, visibleWhen: { type: ['single', 'long'] } },
    { id: 'ratio_ld', label: 'Length to diameter l/d', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'pitch_m', label: 'Winding pitch l/N (largest wire diameter, single layer)', group: 'length', unit: 'm', display: 'mm', visibleWhen: { type: ['single', 'long'] } },
    { id: 'wire_m', label: 'Wire length, about π d N', group: 'length', unit: 'm' },
  ],
  example: {
    inputs: { type: 'single', solve: 'L', diameter_m: [1, 'in'], length_m: [1, 'in'], turns: 20 },
    results: { l_uh: '6.90', long_uh: '10.03', sheet_uh: '6.90', k_nagaoka: '0.6884' },
  },
};

/** A number input checked against zero and its schema limits. */
function inRange(value, id, label) {
  const spec = schema.inputs.find((i) => i.id === id);
  assertPositive(value, id, label);
  return assertRange(value, spec.min, spec.max, id, label);
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.type, ['single', 'multi', 'long'], 'type', 'Coil and formula');
  assertOneOf(x.solve, ['L', 'N'], 'solve', 'Find');
  const d = inRange(x.diameter_m, 'diameter_m', 'Coil diameter');
  const l = inRange(x.length_m, 'length_m', 'Winding length');
  const c = x.type === 'multi' ? inRange(x.depth_m, 'depth_m', 'Winding depth') : 0;
  if (x.type === 'multi' && c >= d) throw new Error(`Winding depth: the depth must be less than the mean diameter (got ${c} m for a mean diameter of ${d} m)`);
  const dIn = d / IN;
  const lIn = l / IN;
  const aIn = dIn / 2;
  const cIn = c / IN;
  // inductance per turn squared of the chosen formula, µH
  const perN2 = x.type === 'single' ? wheelerSingleUh(dIn, lIn, 1) : x.type === 'multi' ? wheelerMultiUh(aIn, lIn, cIn, 1) : longSolenoidUh(d, l, 1);
  let n;
  let L;
  if (x.solve === 'L') {
    n = inRange(x.turns, 'turns', 'Number of turns');
    L = perN2 * n * n;
  } else {
    L = inRange(x.target_uh, 'target_uh', 'Target inductance');
    n = Math.sqrt(L / perN2);
  }
  const k = nagaoka(d, l);
  const warnings = [];
  if (x.type === 'single' && l < 0.4 * d) warnings.push('The coil is shorter than 0.4 times its diameter: Wheeler\'s single-layer formula loses its 1 % accuracy; the current-sheet value is the better estimate.');
  if (x.type === 'long' && k < 0.95) warnings.push('The coil is not long compared with its diameter: the long-solenoid formula overestimates it; the current-sheet value with Nagaoka\'s coefficient is closer.');
  if (x.type === 'multi') {
    const terms = [6 * aIn, 9 * lIn, 10 * cIn];
    if (Math.max(...terms) > 3 * Math.min(...terms)) warnings.push('The terms 6a, 9b and 10c differ widely: Wheeler\'s multilayer formula is less accurate than its usual 1 % for this shape.');
  }
  if (x.type !== 'multi' && n > 0 && l / n < 5e-5) warnings.push('The winding pitch is under 0.05 mm: the turns will not fit in one layer at this length.');
  return {
    outputs: {
      l_uh: L,
      turns_out: n,
      long_uh: longSolenoidUh(d, l, n),
      sheet_uh: x.type === 'multi' ? null : k * longSolenoidUh(d, l, n),
      k_nagaoka: x.type === 'multi' ? null : k,
      ratio_ld: l / d,
      pitch_m: x.type === 'multi' ? null : l / n,
      wire_m: Math.PI * d * n,
    },
    warnings,
  };
}
