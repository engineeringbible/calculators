/**
 * timer-555/calc.js — 555 timer astable (frequency, high and low times, duty cycle) and monostable (pulse width), and
 * an astable design from a target frequency and duty cycle with the nearest E24 resistors.
 *
 * Astable: t_H = ln2 (R1 + R2) C,  t_L = ln2 R2 C,  f = 1 / (ln2 (R1 + 2 R2) C) ≈ 1.44 / ((R1 + 2 R2) C),
 * D = (R1 + R2) / (R1 + 2 R2).  Monostable: t = ln3 R1 C ≈ 1.1 R1 C.
 * Design: S = R1 + 2 R2 = 1 / (ln2 f C);  R1 = (2D − 1) S;  R2 = (1 − D) S.
 * Schema units: SI — Ω, F, s, Hz; R and C typed as marked on parts (4k7, 10n) and parsed by shared/eseries.js.
 */
import { withDefaults, assertOneOf, assertPositive, assertRange } from '../shared/validate.js';
import { parseComponentValues, formatWithPrefix, nearestStandard } from '../shared/eseries.js';

/** The capacitor swings between 1/3 and 2/3 of the supply in astable mode (ln 2) and from 0 to 2/3 in monostable mode (ln 3). */
export const LN2 = Math.LN2;
export const LN3 = Math.log(3);

export const schema = {
  id: 'timer-555',
  name: '555 timer calculator',
  category: 'electrical',
  summary: '555 timer astable frequency, high and low times and duty cycle, monostable pulse width, or R1 and R2 for a target frequency and duty cycle.',
  related: ['rc-time-constant', 'resistors-series-parallel', 'capacitors-series-parallel', 'led-resistor'],
  assumptions: [
    'The timing follows the ideal 555 thresholds: the capacitor charges and discharges between 1/3 and 2/3 of the supply in astable mode, and charges from 0 to 2/3 in monostable mode, so the results do not depend on the supply voltage.',
    'The exact factors ln 2 = 0.6931 and ln 3 = 1.0986 are used; the datasheet rounds them to 0.693, 1.44 and 1.1, which changes the results by less than 0.2 %.',
    'Component tolerances, capacitor leakage, the internal propagation delays and the discharge transistor\'s saturation voltage are ignored; they matter at very high frequencies and with large electrolytic capacitors.',
    'In the basic astable circuit the capacitor charges through R1 and R2 but discharges through R2 only, so the duty cycle is always above 50 %; a diode across R2 or a different circuit is needed for 50 % or less.',
    'Resistors are typed in ohms or with a prefix (470, 4k7, 1M); capacitors are typed with a prefix (100p, 10n, 4u7), and a plain number is microfarads.',
  ],
  notes: [
    'Verification 2026-11-08: R1 = 4.7 kΩ, R2 = 10 kΩ and C = 10 nF give t_H = 101.9 µs, t_L = 69.3 µs, f = 5.84 kHz and a duty cycle of 59.5 %; the datasheet form 1.44 / ((R1 + 2 R2) C) gives 5.83 kHz. Checked by hand.',
  ],
  sources: [
    'Texas Instruments, NE555, SA555, SE555 Precision Timers datasheet (SLFS022), Detailed Description, monostable and astable operation: t_w = 1.1 R_A C, t_H = 0.693 (R_A + R_B) C, t_L = 0.693 R_B C, f ≈ 1.44 / ((R_A + 2 R_B) C)',
    'Horowitz and Hill, The Art of Electronics, 3rd ed., §7.2 (the 555 timer and its timing equations)',
    'IEC 60063:2015 preferred number series for resistors and capacitors (E24 values for the design mode)',
  ],
  inputs: [
    { id: 'mode', label: 'Circuit', type: 'select', default: 'astable', options: [
      { value: 'astable', label: 'Astable (oscillator): frequency from R1, R2, C' },
      { value: 'monostable', label: 'Monostable (one-shot): pulse width from R1, C' },
      { value: 'design', label: 'Astable design: R1 and R2 for a target frequency' },
    ] },
    { id: 'r1', label: 'R1 (R_A, supply to discharge pin), e.g. 4k7', type: 'textarea', rows: 1, default: '4k7', visibleWhen: { mode: ['astable', 'monostable'] } },
    { id: 'r2', label: 'R2 (R_B, discharge to threshold pin), e.g. 10k', type: 'textarea', rows: 1, default: '10k', visibleWhen: { mode: 'astable' } },
    { id: 'c', label: 'Timing capacitor C, e.g. 10n or 4u7 (a plain number is µF)', type: 'textarea', rows: 1, default: '10n' },
    { id: 'freq_hz', label: 'Target frequency', group: 'frequency', unit: 'Hz', default: 1000, min: 1e-4, max: 2e6, visibleWhen: { mode: 'design' } },
    { id: 'duty', label: 'Target duty cycle (high time / period, above 50 %)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.6, min: 0.51, max: 0.99, visibleWhen: { mode: 'design' } },
  ],
  outputs: [
    { id: 'freq_out_hz', label: 'Frequency f', group: 'frequency', unit: 'Hz', display: 'kHz', visibleWhen: { mode: ['astable', 'design'] } },
    { id: 'period_s', label: 'Period T = t_H + t_L', group: 'time', unit: 's', visibleWhen: { mode: ['astable', 'design'] } },
    { id: 't_high_s', label: 'High time t_H = 0.693 (R1 + R2) C', group: 'time', unit: 's', visibleWhen: { mode: ['astable', 'design'] } },
    { id: 't_low_s', label: 'Low time t_L = 0.693 R2 C', group: 'time', unit: 's', visibleWhen: { mode: ['astable', 'design'] } },
    { id: 'duty_out', label: 'Duty cycle (R1 + R2) / (R1 + 2 R2)', group: 'ratio', unit: 'frac', display: 'pct', visibleWhen: { mode: ['astable', 'design'] } },
    { id: 'pulse_s', label: 'Pulse width t = 1.1 R1 C', group: 'time', unit: 's', visibleWhen: { mode: 'monostable' } },
    { id: 'timing', label: 'Timing with prefixes', type: 'text' },
    { id: 'r_exact', label: 'Exact R1 and R2 for the target', type: 'text', visibleWhen: { mode: 'design' } },
    { id: 'r_e24', label: 'Nearest E24 resistors (the results above use these)', type: 'text', visibleWhen: { mode: 'design' } },
    { id: 'components', label: 'Values read', type: 'text' },
  ],
  example: {
    inputs: { mode: 'astable', r1: '4k7', r2: '10k', c: '10n' },
    results: { freq_out_hz: '5.84 kHz', duty_out: '59.5 %' },
  },
};

/** One component value from a text field; throws unless exactly one value above zero is given. */
export function readOne(text, plainFactor, label) {
  let values;
  try {
    values = parseComponentValues(text, plainFactor);
  } catch (e) {
    throw new Error(`${label}: ${e.message.replace(/^Values: /, '')}`);
  }
  if (values.length !== 1) throw new Error(`${label}: enter exactly one value (got ${values.length})`);
  if (!(values[0] > 0)) throw new Error(`${label}: the value must be greater than zero`);
  return values[0];
}

/** Astable timing of the classic two-resistor circuit. */
export function astable(r1, r2, c) {
  const tH = LN2 * (r1 + r2) * c;
  const tL = LN2 * r2 * c;
  return { tH, tL, period: tH + tL, f: 1 / (tH + tL), duty: tH / (tH + tL) };
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['astable', 'monostable', 'design'], 'mode', 'Circuit');
  const c = readOne(x.c, 1e-6, 'Timing capacitor C');
  const warnings = [];
  if (c < 1e-9) warnings.push('Below about 1 nF the stray capacitance of the board and the pins adds noticeably to C, and the real frequency comes out lower.');
  const out = { freq_out_hz: null, period_s: null, t_high_s: null, t_low_s: null, duty_out: null, pulse_s: null, r_exact: null, r_e24: null };
  const fmt = (v, u) => formatWithPrefix(v, u);
  if (x.mode === 'monostable') {
    const r1 = readOne(x.r1, 1, 'R1');
    out.pulse_s = LN3 * r1 * c;
    out.timing = `Pulse ${fmt(out.pulse_s, 's')}`;
    out.components = `R1 = ${fmt(r1, 'Ω')}, C = ${fmt(c, 'F')}`;
    return { outputs: out, warnings };
  }
  let r1;
  let r2;
  if (x.mode === 'astable') {
    r1 = readOne(x.r1, 1, 'R1');
    r2 = readOne(x.r2, 1, 'R2');
  } else {
    const f = assertPositive(x.freq_hz, 'freq_hz', 'Target frequency');
    const d = assertRange(x.duty, 0.501, 0.999, 'duty', 'Target duty cycle');
    const s = 1 / (LN2 * f * c);
    const r1x = (2 * d - 1) * s;
    const r2x = (1 - d) * s;
    r1 = nearestStandard(r1x, 'E24');
    r2 = nearestStandard(r2x, 'E24');
    out.r_exact = `R1 = ${fmt(r1x, 'Ω')}, R2 = ${fmt(r2x, 'Ω')}`;
    out.r_e24 = `R1 = ${fmt(r1, 'Ω')}, R2 = ${fmt(r2, 'Ω')}`;
    if (r1x < 1000 || r2x < 1000) warnings.push('A resistor comes out below 1 kΩ: a smaller capacitor brings both resistors into the kilohm range and keeps the discharge current low.');
    if (r1x + r2x > 2e7) warnings.push('The resistors come out in the tens of megohms: a larger capacitor gives values where leakage and the threshold input current matter less.');
  }
  const a = astable(r1, r2, c);
  Object.assign(out, { freq_out_hz: a.f, period_s: a.period, t_high_s: a.tH, t_low_s: a.tL, duty_out: a.duty });
  out.timing = `f = ${fmt(a.f, 'Hz')}, high ${fmt(a.tH, 's')}, low ${fmt(a.tL, 's')}, period ${fmt(a.period, 's')}`;
  out.components = `R1 = ${fmt(r1, 'Ω')}, R2 = ${fmt(r2, 'Ω')}, C = ${fmt(c, 'F')}`;
  return { outputs: out, warnings };
}
