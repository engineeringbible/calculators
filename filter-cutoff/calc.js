/**
 * filter-cutoff/calc.js — cutoff frequency of first-order RC and RL and second-order RLC and LC filters, low-pass or
 * high-pass, with the attenuation and phase at a frequency, the Q and peaking of second-order filters, and the
 * capacitor or inductor for a target frequency.
 *
 * First order:  f_c = 1/(2π R C) or R/(2π L);  x = f/f_c;  LP H = 1/(1 + jx),  HP H = jx/(1 + jx).
 * Second order: f0 = 1/(2π√(LC));  Q = √(L/C)/R (series R) or R √(C/L) (load R across the output);
 *               x = f/f0;  LP H = 1/(1 − x² + jx/Q),  HP H = −x²/(1 − x² + jx/Q);
 *               −3 dB: u = [(2 − 1/Q²) + √((2 − 1/Q²)² + 4)]/2,  f_3dB = f0 √u (LP) or f0/√u (HP).
 * Schema units: SI — Ω, F, Hz, s, rad; inductance in µH (no inductance unit group yet).
 */
import { withDefaults, assertOneOf, assertPositive, assertRange } from '../shared/validate.js';

export const TYPES = ['rc', 'rl', 'rlc', 'lcr'];

export const schema = {
  id: 'filter-cutoff',
  name: 'Filter cutoff frequency calculator (RC, RL, LC)',
  category: 'electrical',
  summary: 'Cutoff frequency of RC, RL, LC and RLC low-pass and high-pass filters, with Q, attenuation in dB and phase at a frequency, or the component for a target cutoff.',
  related: ['rc-time-constant', 'lc-resonance', 'decibels', 'coil-inductance'],
  assumptions: [
    'Components are ideal: the inductor has no resistance and the capacitor no leakage or ESR, apart from the resistor R of the circuit; a coil\'s own resistance can be added to R in the series RLC circuit.',
    'The source has zero impedance and, for the RC, RL and series RLC circuits, the output drives an open circuit; a load in parallel with the output changes the cutoff and, for second-order filters, the Q.',
    'In the LC circuit with a load resistor, the inductor (low-pass) or capacitor (high-pass) is in series and the load R sits across the other component, which is the output.',
    'For second-order filters the −3 dB frequency equals the natural frequency f0 only at Q = 0.707 (Butterworth); the component for a target is chosen so that f0 equals the target, and the resulting −3 dB frequency is shown.',
    'The cutoff is the −3 dB (half-power) point, where the output voltage is 0.707 of the input and the phase shift is 45° for a first-order filter.',
  ],
  notes: [
    'Verification 2026-11-08: an RC low-pass of 1 kΩ and 100 nF has f_c = 1.59 kHz and τ = 0.1 ms; at 10 kHz it passes 0.157 of the input (−16.1 dB) with a phase of −81.0°. Checked by hand.',
  ],
  sources: [
    'Horowitz and Hill, The Art of Electronics, 3rd ed., §1.7 (RC filters, f_3dB = 1/(2πRC)) and §6.2 (LC filters and Q)',
    'Boylestad, Introductory Circuit Analysis, 13th ed., ch. 21 (decibels, filters and Bode plots: R-C and R-L low-pass and high-pass filters)',
    'Hughes, Electrical and Electronic Technology, 12th ed., the chapters on frequency response and resonance (second-order response, Q and damping)',
  ],
  inputs: [
    { id: 'type', label: 'Filter', type: 'select', default: 'rc', options: [
      { value: 'rc', label: 'RC, first order' },
      { value: 'rl', label: 'RL, first order' },
      { value: 'rlc', label: 'Series RLC, second order (R in series with L and C)' },
      { value: 'lcr', label: 'LC with a load resistor R across the output, second order' },
    ] },
    { id: 'response', label: 'Response', type: 'select', default: 'low', options: [{ value: 'low', label: 'Low-pass' }, { value: 'high', label: 'High-pass' }] },
    { id: 'solve', label: 'Find', type: 'select', default: 'cutoff', options: [
      { value: 'cutoff', label: 'Cutoff frequency from the components' },
      { value: 'C', label: 'Capacitor C for a target cutoff (RC) or f0 (LC, RLC)' },
      { value: 'L', label: 'Inductor L for a target cutoff (RL) or f0 (LC, RLC)' },
    ] },
    { id: 'r_ohm', label: 'Resistance R', group: 'resistance', unit: 'ohm', display: 'kohm', default: 1000, min: 1e-3, max: 1e12 },
    { id: 'c_f', label: 'Capacitance C', group: 'capacitance', unit: 'F', display: 'nF', default: 100e-9, min: 1e-15, max: 10, visibleWhen: { type: ['rc', 'rlc', 'lcr'], solve: ['cutoff', 'L'] } },
    { id: 'l_uh', label: 'Inductance L, µH', group: 'dimensionless', unit: 'none', default: 10000, min: 1e-6, max: 1e10, visibleWhen: { type: ['rl', 'rlc', 'lcr'], solve: ['cutoff', 'C'] } },
    { id: 'target_hz', label: 'Target cutoff (first order) or natural frequency f0 (second order)', group: 'frequency', unit: 'Hz', default: 1000, min: 1e-6, max: 1e12, visibleWhen: { solve: ['C', 'L'] } },
    { id: 'f_hz', label: 'Frequency for the attenuation and phase', group: 'frequency', unit: 'Hz', display: 'kHz', default: 10000, min: 1e-6, max: 1e12 },
  ],
  outputs: [
    { id: 'fc_hz', label: 'Cutoff frequency (−3 dB)', group: 'frequency', unit: 'Hz', display: 'kHz' },
    { id: 'f0_hz', label: 'Natural frequency f0 = 1/(2π√(LC))', group: 'frequency', unit: 'Hz', display: 'kHz' },
    { id: 'q', label: 'Quality factor Q', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'tau_s', label: 'Time constant τ (first order)', group: 'time', unit: 's' },
    { id: 'c_out_f', label: 'Capacitance C used', group: 'capacitance', unit: 'F', display: 'nF' },
    { id: 'l_out_uh', label: 'Inductance L used, µH', group: 'dimensionless', unit: 'none' },
    { id: 'gain_db', label: 'Gain at the frequency, dB', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'gain_ratio', label: 'Output / input voltage at the frequency', group: 'ratio', unit: 'frac', decimals: 4 },
    { id: 'phase_rad', label: 'Phase of the output at the frequency', group: 'angle', unit: 'rad', display: 'deg' },
    { id: 'peak_db', label: 'Resonant peak above the passband (Q > 0.707), dB', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'character', label: 'Response', type: 'text' },
  ],
  example: {
    inputs: { type: 'rc', response: 'low', solve: 'cutoff', r_ohm: [1, 'kohm'], c_f: [100, 'nF'], f_hz: [10, 'kHz'] },
    results: { fc_hz: '1.59 kHz', gain_db: '−16.1', gain_ratio: '0.157' },
  },
};

/** Frequency x² at the −3 dB point of a second-order low-pass, relative to f0² (the high-pass point is the reciprocal). */
export function halfPowerU(q) {
  const b = 2 - 1 / (q * q);
  return (b + Math.sqrt(b * b + 4)) / 2;
}

/** Complex response {mag, phase} of the chosen filter at x = f / f_c (first order) or f / f0 (second order). */
export function response(order, kind, x, q) {
  if (order === 1) {
    const mag = (kind === 'low' ? 1 : x) / Math.sqrt(1 + x * x);
    const phase = (kind === 'low' ? 0 : Math.PI / 2) - Math.atan(x);
    return { mag, phase };
  }
  const re = 1 - x * x;
  const im = x / q;
  const den = Math.hypot(re, im);
  const argD = Math.atan2(im, re);
  return kind === 'low' ? { mag: 1 / den, phase: -argD } : { mag: (x * x) / den, phase: Math.PI - argD };
}

/** A number input checked against zero and its schema limits. */
function inRange(value, id, label) {
  const spec = schema.inputs.find((i) => i.id === id);
  assertPositive(value, id, label);
  return assertRange(value, spec.min, spec.max, id, label);
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.type, TYPES, 'type', 'Filter');
  assertOneOf(x.response, ['low', 'high'], 'response', 'Response');
  assertOneOf(x.solve, ['cutoff', 'C', 'L'], 'solve', 'Find');
  if (x.type === 'rc' && x.solve === 'L') throw new Error('Find: an RC filter has no inductor; choose the capacitor or the cutoff frequency.');
  if (x.type === 'rl' && x.solve === 'C') throw new Error('Find: an RL filter has no capacitor; choose the inductor or the cutoff frequency.');
  const r = inRange(x.r_ohm, 'r_ohm', 'Resistance');
  const f = inRange(x.f_hz, 'f_hz', 'Frequency for the attenuation');
  const target = x.solve === 'cutoff' ? null : inRange(x.target_hz, 'target_hz', 'Target frequency');
  const w = target ? 2 * Math.PI * target : null;
  const usesC = x.type !== 'rl';
  const usesL = x.type !== 'rc';
  let c = null;
  let l = null;
  if (usesC && x.solve !== 'C') c = inRange(x.c_f, 'c_f', 'Capacitance');
  if (usesL && x.solve !== 'L') l = inRange(x.l_uh, 'l_uh', 'Inductance') * 1e-6;
  if (x.solve === 'C') c = x.type === 'rc' ? 1 / (w * r) : 1 / (w * w * l);
  if (x.solve === 'L') l = x.type === 'rl' ? r / w : 1 / (w * w * c);
  const out = { f0_hz: null, q: null, tau_s: null, peak_db: null };
  const warnings = [];
  let fc;
  let resp;
  if (x.type === 'rc' || x.type === 'rl') {
    const tau = x.type === 'rc' ? r * c : l / r;
    fc = 1 / (2 * Math.PI * tau);
    out.tau_s = tau;
    resp = response(1, x.response, f / fc);
    out.character = `First order: ${x.response === 'low' ? '−' : '+'}20 dB per decade (6 dB per octave) ${x.response === 'low' ? 'above' : 'below'} the cutoff, 45° phase shift at the cutoff.`;
  } else {
    const f0 = 1 / (2 * Math.PI * Math.sqrt(l * c));
    const z0 = Math.sqrt(l / c);
    const q = x.type === 'rlc' ? z0 / r : r / z0;
    const u = halfPowerU(q);
    fc = x.response === 'low' ? f0 * Math.sqrt(u) : f0 / Math.sqrt(u);
    out.f0_hz = f0;
    out.q = q;
    if (q > Math.SQRT1_2) out.peak_db = 20 * Math.log10(q / Math.sqrt(1 - 1 / (4 * q * q)));
    resp = response(2, x.response, f / f0, q);
    const shape = Math.abs(q - Math.SQRT1_2) < 0.005 ? 'Butterworth (maximally flat)' : q > Math.SQRT1_2 ? 'underdamped, with a peak near f0' : 'overdamped, no peak';
    out.character = `Second order, Q = ${q.toPrecision(3)}: ${shape}; ${x.response === 'low' ? '−' : '+'}40 dB per decade (12 dB per octave) far ${x.response === 'low' ? 'above' : 'below'} f0.`;
    if (q > 10) warnings.push('Q above 10: the filter rings and has a sharp peak at f0; component tolerances shift the peak noticeably.');
  }
  if (![fc, resp.mag, resp.phase].every(Number.isFinite) || resp.mag <= 0) throw new Error('Components: the values are so extreme that the response cannot be computed; check the units of R, L and C.');
  return {
    outputs: {
      fc_hz: fc,
      ...out,
      c_out_f: c,
      l_out_uh: l === null ? null : l * 1e6,
      gain_db: 20 * Math.log10(resp.mag),
      gain_ratio: resp.mag,
      phase_rad: resp.phase,
    },
    warnings,
  };
}
