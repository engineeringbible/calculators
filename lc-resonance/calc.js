/**
 * lc-resonance/calc.js — resonant frequency of an inductor and a capacitor, or the L or C for a target frequency,
 * with the characteristic impedance, the Q and bandwidth from the series resistance, and the parallel-tank
 * dynamic resistance.
 *
 * f0 = 1 / (2π √(L C));  L = 1 / ((2π f)² C);  C = 1 / ((2π f)² L);  Z0 = √(L / C) = X_L = X_C at f0;
 * Q = Z0 / R;  BW = f0 / Q = R / (2π L);  f1,2 = f0 (√(1 + 1/(4Q²)) ∓ 1/(2Q));  R_D = L / (C R) = Q² R.
 * Schema units: SI — F, Hz, Ω; inductance in µH (no inductance unit group yet).
 */
import { withDefaults, assertOneOf, assertPositive, assertRange } from '../shared/validate.js';

export const schema = {
  id: 'lc-resonance',
  name: 'LC resonant frequency calculator',
  category: 'electrical',
  summary: 'Resonant frequency of an LC circuit, or the L or C for a target frequency, with characteristic impedance, Q and bandwidth from the series resistance.',
  related: ['filter-cutoff', 'coil-inductance', 'capacitors-series-parallel', 'rc-time-constant'],
  assumptions: [
    'The inductor and capacitor are ideal apart from one resistance R in series with them, which stands for the coil\'s winding and skin-effect resistance and any capacitor ESR at the resonant frequency.',
    'Q, bandwidth and the −3 dB frequencies are those of the series RLC circuit; for high Q they also describe a parallel tank whose coil has the series resistance R.',
    'A parallel tank with a lossy coil resonates, in the sense of a purely resistive impedance, at f0 √(1 − 1/Q²); the difference from f0 is 0.5 % at Q = 10 and smaller above.',
    'Stray capacitance of the coil and the wiring adds to C and lowers the frequency; at high frequencies it can be several picofarads.',
  ],
  notes: [
    'Verification 2026-11-08: 10 µH and 100 pF resonate at 5.03 MHz with Z0 = 316 Ω; with 5 Ω series resistance Q = 63.2, the bandwidth is 79.6 kHz and the parallel dynamic resistance 20 kΩ. Checked by hand.',
  ],
  sources: [
    'Hughes, Electrical and Electronic Technology, 12th ed., the chapters on series and parallel resonance (Q factor, bandwidth f0 / Q)',
    'Boylestad, Introductory Circuit Analysis, 13th ed., ch. 20 (resonance: f_s = 1/(2π√(LC)), Q_s = X_L/R, BW = f_s/Q_s, half-power frequencies)',
    'ARRL Handbook for Radio Communications, Electrical Fundamentals chapter (resonant circuits, Q, dynamic resistance of a parallel tank R_D = Q² R)',
  ],
  inputs: [
    { id: 'solve', label: 'Find', type: 'select', default: 'f', options: [
      { value: 'f', label: 'Resonant frequency from L and C' },
      { value: 'L', label: 'Inductance L for a frequency and C' },
      { value: 'C', label: 'Capacitance C for a frequency and L' },
    ] },
    { id: 'l_uh', label: 'Inductance L, µH', group: 'dimensionless', unit: 'none', default: 10, min: 1e-6, max: 1e9, visibleWhen: { solve: ['f', 'C'] } },
    { id: 'c_f', label: 'Capacitance C', group: 'capacitance', unit: 'F', display: 'pF', default: 100e-12, min: 1e-15, max: 10, visibleWhen: { solve: ['f', 'L'] } },
    { id: 'f_hz', label: 'Target resonant frequency', group: 'frequency', unit: 'Hz', display: 'MHz', default: 5e6, min: 1e-3, max: 1e11, visibleWhen: { solve: ['L', 'C'] } },
    { id: 'r_ohm', label: 'Series resistance R (coil and capacitor losses; 0 for ideal)', group: 'resistance', unit: 'ohm', default: 5, min: 0, max: 1e9 },
  ],
  outputs: [
    { id: 'f0_hz', label: 'Resonant frequency f0', group: 'frequency', unit: 'Hz', display: 'MHz' },
    { id: 'l_out_uh', label: 'Inductance L, µH', group: 'dimensionless', unit: 'none' },
    { id: 'c_out_f', label: 'Capacitance C', group: 'capacitance', unit: 'F', display: 'pF' },
    { id: 'omega', label: 'Angular frequency ω0 = 2π f0 (rad/s)', group: 'dimensionless', unit: 'none' },
    { id: 'z0_ohm', label: 'Characteristic impedance √(L/C) = reactance of L and C at f0', group: 'resistance', unit: 'ohm' },
    { id: 'q', label: 'Quality factor Q = √(L/C) / R', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'bw_hz', label: 'Bandwidth f0 / Q (−3 dB)', group: 'frequency', unit: 'Hz', display: 'kHz' },
    { id: 'f_low_hz', label: 'Lower −3 dB frequency', group: 'frequency', unit: 'Hz', display: 'MHz' },
    { id: 'f_high_hz', label: 'Upper −3 dB frequency', group: 'frequency', unit: 'Hz', display: 'MHz' },
    { id: 'rd_ohm', label: 'Parallel-tank dynamic resistance L / (C R)', group: 'resistance', unit: 'ohm', display: 'kohm' },
  ],
  example: {
    inputs: { solve: 'f', l_uh: 10, c_f: [100, 'pF'], r_ohm: [5, 'ohm'] },
    results: { f0_hz: '5.03 MHz', z0_ohm: '316 Ω', q: '63.2', bw_hz: '79.6 kHz', rd_ohm: '20 kΩ' },
  },
};

export const resonantFrequency = (l, c) => 1 / (2 * Math.PI * Math.sqrt(l * c));

/** A number input checked against zero and its schema limits. */
function inRange(value, id, label) {
  const spec = schema.inputs.find((i) => i.id === id);
  assertPositive(value, id, label);
  return assertRange(value, spec.min, spec.max, id, label);
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.solve, ['f', 'L', 'C'], 'solve', 'Find');
  const r = assertRange(x.r_ohm, 0, 1e9, 'r_ohm', 'Series resistance');
  let l;
  let c;
  let f;
  if (x.solve === 'f') {
    l = inRange(x.l_uh, 'l_uh', 'Inductance') * 1e-6;
    c = inRange(x.c_f, 'c_f', 'Capacitance');
    f = resonantFrequency(l, c);
  } else {
    f = inRange(x.f_hz, 'f_hz', 'Target resonant frequency');
    const w2 = (2 * Math.PI * f) ** 2;
    if (x.solve === 'L') {
      c = inRange(x.c_f, 'c_f', 'Capacitance');
      l = 1 / (w2 * c);
    } else {
      l = inRange(x.l_uh, 'l_uh', 'Inductance') * 1e-6;
      c = 1 / (w2 * l);
    }
  }
  const z0 = Math.sqrt(l / c);
  const q = r > 0 ? z0 / r : null;
  const warnings = [];
  let fLow = null;
  let fHigh = null;
  if (q !== null) {
    const a = Math.sqrt(1 + 1 / (4 * q * q));
    fLow = f * (a - 1 / (2 * q));
    fHigh = f * (a + 1 / (2 * q));
    if (q < 0.5) warnings.push('Q is below 0.5: the circuit is overdamped and has no sharp resonance; the bandwidth figures describe a broad response.');
  } else {
    warnings.push('With zero resistance Q and the dynamic resistance are unlimited; enter the coil\'s resistance at the frequency for real values.');
  }
  return {
    outputs: {
      f0_hz: f,
      l_out_uh: l * 1e6,
      c_out_f: c,
      omega: 2 * Math.PI * f,
      z0_ohm: z0,
      q,
      bw_hz: r > 0 ? r / (2 * Math.PI * l) : null,
      f_low_hz: fLow,
      f_high_hz: fHigh,
      rd_ohm: r > 0 ? l / (c * r) : null,
    },
    warnings,
  };
}
