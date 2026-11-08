/**
 * belt-pulley/calc.js — two-pulley belt drive: speed ratio, driven speed (with optional slip), belt speed, exact belt
 * length for an open or crossed belt, the wrap angles on both pulleys and the free span length.
 *
 * Open belt (Shigley eq. 17-1): θ_d = π − 2 asin((D − d)/(2C)), θ_D = π + 2 asin((D − d)/(2C)),
 *   L = √(4C² − (D − d)²) + ½ (D θ_D + d θ_d).
 * Crossed belt: θ = π + 2 asin((D + d)/(2C)) on both, L = √(4C² − (D + d)²) + ½ (D + d) θ.
 * n₂ = n₁ d₁/d₂ (1 − s);  v = π d₁ n₁.  Schema units: SI — m, rpm, m/s, rad.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';

/** Wrap angles (rad) and belt length (m) for pulley diameters d1, d2 and centre distance c. */
export function beltGeometry(d1, d2, c, arrangement = 'open') {
  const big = Math.max(d1, d2);
  const small = Math.min(d1, d2);
  if (arrangement === 'crossed') {
    const theta = Math.PI + 2 * Math.asin((big + small) / (2 * c));
    return { wrapSmall: theta, wrapLarge: theta, length: Math.sqrt(4 * c * c - (big + small) ** 2) + 0.5 * (big + small) * theta, span: Math.sqrt(c * c - ((big + small) / 2) ** 2) };
  }
  const phi = Math.asin((big - small) / (2 * c));
  const wrapSmall = Math.PI - 2 * phi;
  const wrapLarge = Math.PI + 2 * phi;
  return { wrapSmall, wrapLarge, length: Math.sqrt(4 * c * c - (big - small) ** 2) + 0.5 * (big * wrapLarge + small * wrapSmall), span: Math.sqrt(c * c - ((big - small) / 2) ** 2) };
}

export const schema = {
  id: 'belt-pulley',
  name: 'Belt and pulley calculator (ratio, rpm, belt length)',
  category: 'mechanical',
  summary: 'Pulley ratio, driven rpm, belt speed, exact open or crossed belt length and wrap angle from the two pulley diameters and the centre distance.',
  related: ['v-belt-length', 'gear-ratio', 'chain-sprocket', 'torque-power-rpm'],
  assumptions: [
    'Diameters are the effective (pitch) diameters on which the belt runs: the outside diameter plus the belt thickness for a flat belt, the pitch diameter for V-belts and timing belts.',
    'The belt length uses the exact geometry of two circles joined by straight spans (Shigley eq. 17-1); belt sag, stretch and installation allowance are not included.',
    'The driven speed is n₁ d₁/d₂ reduced by the slip entered; flat and V-belts typically creep 1 to 2 %, timing belts do not slip.',
    'A wrap angle on the small pulley below about 120° limits the torque a friction belt can transmit; the calculator warns below 120°.',
  ],
  notes: [
    'Verification 2026-11-08: open belt, d = 100 mm at 1 450 rpm, D = 250 mm, C = 600 mm: ratio 2.5, 580 rpm, 7.59 m/s, wrap 165.6° on the small pulley, belt length 1 190.6 + 549.8 + 18.8 = 1 759 mm. Checked by hand.',
  ],
  sources: [
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §17-2 Flat and round belts, eq. 17-1 (open and crossed belt geometry)",
    'Oberg et al., Machinery\'s Handbook, 31st ed., Belts and pulleys: pulley speeds and belt length formulas',
  ],
  inputs: [
    { id: 'arrangement', label: 'Belt arrangement', type: 'select', default: 'open', options: [{ value: 'open', label: 'Open belt (same direction)' }, { value: 'crossed', label: 'Crossed belt (reverses direction)' }] },
    { id: 'd1_m', label: 'Driver pulley diameter d₁', group: 'length', unit: 'm', display: 'mm', default: 0.1, min: 0.001, max: 10 },
    { id: 'd2_m', label: 'Driven pulley diameter d₂', group: 'length', unit: 'm', display: 'mm', default: 0.25, min: 0.001, max: 10 },
    { id: 'c_m', label: 'Centre distance C', group: 'length', unit: 'm', display: 'mm', default: 0.6, min: 0.001, max: 100 },
    { id: 'n1_rpm', label: 'Driver speed n₁', group: 'rotational_speed', unit: 'rpm', default: 1450, min: 0.01, max: 100000 },
    { id: 'slip', label: 'Belt slip (0 for a timing belt)', group: 'ratio', unit: 'frac', display: 'pct', default: 0, min: 0, max: 0.1 },
  ],
  outputs: [
    { id: 'ratio', label: 'Speed ratio d₂/d₁', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'n2_rpm', label: 'Driven speed n₂', group: 'rotational_speed', unit: 'rpm' },
    { id: 'belt_speed_m_s', label: 'Belt speed', group: 'speed', unit: 'm_s' },
    { id: 'length_m', label: 'Belt length (exact)', group: 'length', unit: 'm', display: 'mm' },
    { id: 'wrap_small_rad', label: 'Wrap angle on the small pulley', group: 'angle', unit: 'rad', display: 'deg', decimals: 1 },
    { id: 'wrap_large_rad', label: 'Wrap angle on the large pulley', group: 'angle', unit: 'rad', display: 'deg', decimals: 1 },
    { id: 'span_m', label: 'Free span length (each side)', group: 'length', unit: 'm', display: 'mm' },
  ],
  example: {
    inputs: { arrangement: 'open', d1_m: [100, 'mm'], d2_m: [250, 'mm'], c_m: [600, 'mm'], n1_rpm: [1450, 'rpm'], slip: [0, 'pct'] },
    results: { ratio: '2.500', n2_rpm: '580 rpm', belt_speed_m_s: '7.59 m/s', length_m: '1 759 mm' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.arrangement, ['open', 'crossed'], 'arrangement', 'Belt arrangement');
  const d1 = assertPositive(x.d1_m, 'd1_m', 'Driver pulley diameter');
  const d2 = assertPositive(x.d2_m, 'd2_m', 'Driven pulley diameter');
  const c = assertPositive(x.c_m, 'c_m', 'Centre distance');
  const n1 = assertPositive(x.n1_rpm, 'n1_rpm', 'Driver speed');
  const s = assertRange(x.slip, 0, 0.1, 'slip', 'Belt slip');
  if (c <= (d1 + d2) / 2) throw new Error('Centre distance: it must be more than the sum of the two pulley radii, or the pulleys overlap.');
  const g = beltGeometry(d1, d2, c, x.arrangement);
  const warnings = [];
  if (g.wrapSmall < (120 * Math.PI) / 180) warnings.push('Wrap angle on the small pulley below 120°: a friction belt may slip; increase the centre distance or add an idler.');
  const ratio = d2 / d1;
  if (ratio > 8 || ratio < 1 / 8) warnings.push('Speed ratio beyond 8 : 1 in one belt stage: the wrap on the small pulley is short; consider two stages.');
  const v = (Math.PI * d1 * n1) / 60;
  if (v > 30) warnings.push('Belt speed above 30 m/s: check the belt maker\'s speed limit and the maximum rim speed of the pulleys.');
  return {
    outputs: {
      ratio,
      n2_rpm: ((n1 * d1) / d2) * (1 - s),
      belt_speed_m_s: v,
      length_m: g.length,
      wrap_small_rad: g.wrapSmall,
      wrap_large_rad: g.wrapLarge,
      span_m: g.span,
    },
    warnings,
  };
}
