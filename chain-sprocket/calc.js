/**
 * chain-sprocket/calc.js — roller chain drive: speed ratio, output speed, chain speed, chain length in pitches (rounded
 * up to an even number), the actual centre distance for that length, sprocket pitch diameters and the chordal speed
 * variation.
 *
 * D = p / sin(180°/N)  (Shigley eq. 17-25);  V = N p n;
 * L/p = 2C/p + (N₁ + N₂)/2 + (N₂ − N₁)² / (4π² C/p)  (eq. 17-27);
 * C = (p/4) [−A + √(A² − 8 ((N₂ − N₁)/(2π))²)],  A = (N₁ + N₂)/2 − L/p  (eq. 17-28);
 * chordal variation ΔV/V = (π/N) [1/sin(180°/N) − 1/tan(180°/N)].
 * Schema units: SI — m, rpm, m/s.
 */
import { withDefaults, assertPositive, assertOneOf, assertInteger, assertRange } from '../shared/validate.js';

/** ANSI B29.1 (ASME B29.100) standard roller chain numbers and pitches in inches. */
export const ANSI_PITCH_IN = { 25: 0.25, 35: 0.375, 40: 0.5, 50: 0.625, 60: 0.75, 80: 1, 100: 1.25, 120: 1.5, 140: 1.75, 160: 2, 180: 2.25, 200: 2.5, 240: 3 };
const IN = 0.0254;

export const pitchDiameter = (p, N) => p / Math.sin(Math.PI / N);
export const lengthPitches = (cp, N1, N2) => 2 * cp + (N1 + N2) / 2 + (N2 - N1) ** 2 / (4 * Math.PI ** 2 * cp);
export function centrePitches(Lp, N1, N2) {
  const A = (N1 + N2) / 2 - Lp;
  const disc = A * A - 8 * ((N2 - N1) / (2 * Math.PI)) ** 2;
  return disc < 0 ? null : 0.25 * (-A + Math.sqrt(disc));
}
export const chordalVariation = (N) => (Math.PI / N) * (1 / Math.sin(Math.PI / N) - 1 / Math.tan(Math.PI / N));

export const schema = {
  id: 'chain-sprocket',
  name: 'Chain and sprocket calculator (roller chain length)',
  category: 'mechanical',
  summary: 'Roller chain drive: ratio, output rpm, chain speed, chain length in pitches (even), actual centre distance and sprocket pitch diameters.',
  related: ['belt-pulley', 'v-belt-length', 'gear-ratio', 'torque-power-rpm'],
  assumptions: [
    'Standard roller chain of pitch p on two sprockets in one plane; ANSI chain numbers give the pitch in eighths of an inch (No. 40 = 1/2 in). ISO 606 B-series chains of the same pitch use the same geometry.',
    'The chain length in pitches follows Shigley eq. 17-27 and is rounded up to the next even number, so that no offset (cranked) link is needed; the actual centre distance for that length follows eq. 17-28.',
    'The centre distance is nominal with the chain just taut; provide adjustment or an idler for wear elongation and sag.',
    'The chordal speed variation is the change in chain speed as each link seats on the small sprocket; it falls quickly as the tooth count rises.',
    'Power capacity, lubrication and the number of strands are not checked here; use the ANSI or ISO power-rating tables of the chain maker.',
  ],
  notes: [
    'Verification 2026-11-08: No. 40 chain (12.7 mm), 17 and 51 teeth, 900 rpm, 500 mm centres: L/p = 78.74 + 34 + 0.744 = 113.48, rounded to 114 pitches; actual C = 503.3 mm; pitch diameters 69.12 and 206.30 mm; 300 rpm out; chain speed 3.24 m/s. Checked by hand.',
  ],
  sources: [
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §17-5 Roller chain, eqs. 17-25 to 17-28 (pitch diameter, chain velocity, length in pitches, centre distance)",
    'ASME B29.100, Precision power transmission, double-pitch power transmission, and double-pitch conveyor roller chains, attachments and sprockets (standard chain numbers and pitches)',
    'Renold, Roller chain design guide: chain length and centre distance calculation',
  ],
  inputs: [
    { id: 'chain', label: 'Chain size', type: 'select', default: '40', options: [...Object.entries(ANSI_PITCH_IN).map(([n, p]) => ({ value: n, label: `ANSI No. ${n} (${p} in, ${(p * 25.4).toFixed(3).replace(/\.?0+$/, '')} mm)` })), { value: 'custom', label: 'Other pitch' }] },
    { id: 'pitch_m', label: 'Chain pitch p', group: 'length', unit: 'm', display: 'mm', default: 0.0127, min: 0.001, max: 0.2, visibleWhen: { chain: 'custom' } },
    { id: 'n1_teeth', label: 'Driver sprocket teeth N₁', group: 'dimensionless', unit: 'none', default: 17, min: 6, max: 200, integer: true },
    { id: 'n2_teeth', label: 'Driven sprocket teeth N₂', group: 'dimensionless', unit: 'none', default: 51, min: 6, max: 300, integer: true },
    { id: 'speed_rpm', label: 'Driver speed n₁', group: 'rotational_speed', unit: 'rpm', default: 900, min: 0.01, max: 20000 },
    { id: 'c_m', label: 'Desired centre distance C', group: 'length', unit: 'm', display: 'mm', default: 0.5, min: 0.005, max: 50 },
  ],
  outputs: [
    { id: 'ratio', label: 'Speed ratio N₂/N₁', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'n2_rpm', label: 'Driven speed n₂', group: 'rotational_speed', unit: 'rpm' },
    { id: 'chain_speed_m_s', label: 'Chain speed V = N₁ p n₁', group: 'speed', unit: 'm_s' },
    { id: 'length_calc', label: 'Chain length for the desired C (pitches)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'links', label: 'Chain length, rounded up to an even number of pitches', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'length_m', label: 'Chain length', group: 'length', unit: 'm', display: 'mm' },
    { id: 'centre_m', label: 'Actual centre distance for that chain', group: 'length', unit: 'm', display: 'mm' },
    { id: 'd1_m', label: 'Driver sprocket pitch diameter', group: 'length', unit: 'm', display: 'mm' },
    { id: 'd2_m', label: 'Driven sprocket pitch diameter', group: 'length', unit: 'm', display: 'mm' },
    { id: 'chordal', label: 'Chordal speed variation ΔV/V', group: 'ratio', unit: 'frac', display: 'pct', decimals: 2 },
  ],
  example: {
    inputs: { chain: '40', n1_teeth: 17, n2_teeth: 51, speed_rpm: [900, 'rpm'], c_m: [500, 'mm'] },
    results: { length_calc: '113.48', links: '114', centre_m: '503.3 mm', d1_m: '69.12 mm', d2_m: '206.30 mm', chain_speed_m_s: '3.24 m/s' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(String(x.chain), [...Object.keys(ANSI_PITCH_IN), 'custom'], 'chain', 'Chain size');
  const p = String(x.chain) === 'custom' ? assertRange(x.pitch_m, 0.001, 0.2, 'pitch_m', 'Chain pitch') : ANSI_PITCH_IN[x.chain] * IN;
  const N1 = assertInteger(assertRange(x.n1_teeth, 6, 200, 'n1_teeth', 'Driver sprocket teeth'), 'n1_teeth', 'Driver sprocket teeth');
  const N2 = assertInteger(assertRange(x.n2_teeth, 6, 300, 'n2_teeth', 'Driven sprocket teeth'), 'n2_teeth', 'Driven sprocket teeth');
  const n1 = assertPositive(x.speed_rpm, 'speed_rpm', 'Driver speed');
  const C = assertPositive(x.c_m, 'c_m', 'Desired centre distance');
  const D1 = pitchDiameter(p, N1);
  const D2 = pitchDiameter(p, N2);
  if (C <= (D1 + D2) / 2) throw new Error('Desired centre distance: it must be more than the sum of the two sprocket pitch radii, or the sprockets overlap.');
  const Nsmall = Math.min(N1, N2);
  const Nlarge = Math.max(N1, N2);
  const lp = lengthPitches(C / p, Nsmall, Nlarge);
  const links = 2 * Math.ceil(lp / 2 - 1e-9);
  const cp = centrePitches(links, Nsmall, Nlarge);
  const warnings = [];
  if (Nsmall < 17) warnings.push('Small sprocket with fewer than 17 teeth: the chordal speed variation exceeds 1.7 %, with more noise, vibration and wear; use more teeth if the speed is high.');
  return {
    outputs: {
      ratio: N2 / N1,
      n2_rpm: (n1 * N1) / N2,
      chain_speed_m_s: (N1 * p * n1) / 60,
      length_calc: lp,
      links,
      length_m: links * p,
      centre_m: cp * p,
      d1_m: D1,
      d2_m: D2,
      chordal: chordalVariation(Nsmall),
    },
    warnings,
  };
}
