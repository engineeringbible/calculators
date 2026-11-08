/**
 * bend-allowance/calc.js — sheet metal bend allowance, bend deduction, outside setback and flat length of a part with
 * one or more bends, from thickness, inside radius, bend angle and K-factor (entered, or from DIN 6935).
 *
 * BA = θ (R + K T);  OSSB = tan(θ/2) (R + T);  BD = 2 OSSB − BA;  flat length = Σ legs (outside dimensions) − Σ BD.
 * DIN 6935: k = 0.65 + 0.5 log10(R/T) for R/T < 5, k = 1 above; K = k/2.
 * Schema units: SI — m, rad.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive, assertNonNegative } from '../shared/validate.js';

const IN = 0.0254;

/** K-factor from the DIN 6935 correction factor k (K = k/2), for an inside radius to thickness ratio R/T. */
export function dinK(ratio) {
  if (ratio >= 5) return 0.5;
  return (0.65 + 0.5 * Math.log10(ratio)) / 2;
}

/** Bend allowance, outside setback and bend deduction for one bend (lengths in the unit of R and T). */
export function bend(T, R, K, theta) {
  const ba = theta * (R + K * T);
  const ossb = Math.tan(theta / 2) * (R + T);
  return { ba, ossb, bd: 2 * ossb - ba };
}

/** Parses "length" or "length; angle in degrees" lines; returns [{ length, angleDeg|null }] in the given unit. */
export function parseLegs(text) {
  const legs = [];
  String(text).split(/\r?\n/).forEach((raw, k) => {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) return;
    const parts = line.split(/[;\t]/).map((p) => p.trim());
    if (parts.length > 2) throw new Error(`Legs, line ${k + 1}: write "length" or "length; angle of the next bend".`);
    const length = Number(parts[0].replace(/\s/g, ''));
    if (!Number.isFinite(length) || length <= 0) throw new Error(`Legs, line ${k + 1}: the length "${parts[0]}" must be a number above zero.`);
    let angle = null;
    if (parts.length === 2 && parts[1] !== '') {
      angle = Number(parts[1].replace(/°/g, ''));
      if (!Number.isFinite(angle) || angle <= 0 || angle >= 180) throw new Error(`Legs, line ${k + 1}: the bend angle "${parts[1]}" must be between 0 and 180 degrees.`);
    }
    legs.push({ length, angleDeg: angle });
  });
  if (legs.length < 2) throw new Error('Legs: enter at least two legs (one bend between them).');
  return legs;
}

export const schema = {
  id: 'bend-allowance',
  name: 'Bend allowance calculator (sheet metal flat length)',
  category: 'manufacturing',
  summary: 'Sheet metal bend allowance, bend deduction, outside setback and flat length for one or many bends, from thickness, radius, angle and K-factor.',
  related: ['press-tonnage', 'tap-drill', 'weld-deposition', 'metal-weight'],
  assumptions: [
    'The neutral axis lies at K × T from the inside surface and keeps its length through the bend; the K-factor depends on material, tooling and R/T, so a test bend gives the best value.',
    'The suggested K-factor uses the DIN 6935 correction factor k = 0.65 + 0.5 log10(R/T) for R/T below 5 and k = 1 above, with K = k/2: 0.325 at R = T and 0.5 from R = 5T.',
    'Leg lengths are outside dimensions measured to the intersection of the outside surfaces (the mould lines); the flat length is their sum minus one bend deduction per bend.',
    'The bend angle is the angle the sheet turns through (90° for an L), not the included angle between the legs; angles from just above 0° to just below 180° are allowed.',
    'Thinning in the bend, springback and the press brake\'s actual inside radius are not modelled; in air bending the radius follows the die opening rather than the punch.',
  ],
  notes: [
    'Verification 2026-11-08: 2 mm sheet bent 90° over a 2 mm inside radius has K = 0.325 by DIN 6935, BA = π/2 × (2 + 0.65) = 4.16 mm, OSSB = 4 mm and BD = 3.84 mm; a 30/50/30 mm channel needs a 102.33 mm blank. Checked by hand.',
  ],
  sources: [
    'DIN 6935:2011 Cold bending of flat rolled steel products, correction factor k and neutral fibre position',
    'Benson, S. D., Press Brake Technology: A Guide to Precision Sheet Metal Bending (SME, 1997): bend allowance, outside setback and bend deduction with the K-factor',
  ],
  inputs: [
    { id: 'thickness_m', label: 'Sheet thickness T', group: 'length', unit: 'm', display: 'in', default: 0.06 * IN, min: 0.00001, max: 0.1 },
    { id: 'radius_m', label: 'Inside bend radius R', group: 'length', unit: 'm', display: 'in', default: 0.06 * IN, min: 0, max: 1 },
    { id: 'angle_deg', label: 'Bend angle (90° for an L)', group: 'angle', unit: 'deg', default: 90, min: 1, max: 179 },
    { id: 'k_mode', label: 'K-factor', type: 'select', default: 'din', options: [{ value: 'din', label: 'Suggested by DIN 6935 from R/T' }, { value: 'custom', label: 'Enter my own' }] },
    { id: 'k_factor', label: 'K-factor (neutral axis position ÷ T)', group: 'dimensionless', unit: 'none', default: 0.44, min: 0, max: 0.5, visibleWhen: { k_mode: 'custom' } },
    { id: 'leg_units', label: 'Units of the leg list', type: 'select', default: 'in', options: [{ value: 'in', label: 'inches' }, { value: 'mm', label: 'millimetres' }] },
    { id: 'legs', label: 'Leg lengths, outside dimensions (one per line; optional "; angle" for the bend after it)', type: 'textarea', rows: 5, default: '1\n2\n1', help: 'A channel 1 × 2 × 1 in: three lines. Write "2; 45" when the bend after that leg is 45°.' },
  ],
  outputs: [
    { id: 'k_used', label: 'K-factor used', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'k_din', label: 'K-factor suggested by DIN 6935', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'ba_m', label: 'Bend allowance BA (arc of the neutral axis)', group: 'length', unit: 'm', display: 'in' },
    { id: 'ossb_m', label: 'Outside setback OSSB', group: 'length', unit: 'm', display: 'in' },
    { id: 'bd_m', label: 'Bend deduction BD', group: 'length', unit: 'm', display: 'in' },
    { id: 'flat_m', label: 'Flat length of the part (blank)', group: 'length', unit: 'm', display: 'in' },
    { id: 'bends', label: 'Bends in the part', type: 'text' },
  ],
  example: {
    inputs: { thickness_m: [2, 'mm'], radius_m: [2, 'mm'], angle_deg: [90, 'deg'], k_mode: 'din', leg_units: 'mm', legs: '30\n50\n30' },
    results: { k_used: '0.325', ba_m: '4.16 mm', bd_m: '3.84 mm', flat_m: '102.33 mm' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.k_mode, ['din', 'custom'], 'k_mode', 'K-factor');
  assertOneOf(x.leg_units, ['in', 'mm'], 'leg_units', 'Units of the leg list');
  const T = assertRange(x.thickness_m, 0.00001, 0.1, 'thickness_m', 'Sheet thickness T');
  const R = assertNonNegative(x.radius_m, 'radius_m', 'Inside bend radius R');
  const angleDeg = assertPositive(x.angle_deg, 'angle_deg', 'Bend angle');
  if (angleDeg >= 180) throw new Error('Bend angle: it must be below 180° (a 180° hem has no finite setback).');
  const ratio = R / T;
  const kDin = ratio >= 0.1 ? dinK(ratio) : null;
  let K;
  if (x.k_mode === 'custom') K = assertRange(x.k_factor, 0, 0.5, 'k_factor', 'K-factor');
  else {
    if (kDin === null) throw new Error('Inside bend radius R: below 0.1 × T the DIN 6935 formula does not apply; enter your own K-factor.');
    K = kDin;
  }
  const one = bend(T, R, K, (angleDeg * Math.PI) / 180);
  const unit = x.leg_units === 'in' ? IN : 0.001;
  const legs = parseLegs(x.legs);
  let sum = 0;
  const descr = [];
  legs.forEach((leg, i) => {
    sum += leg.length * unit;
    if (i === legs.length - 1) return;
    const a = leg.angleDeg ?? angleDeg;
    const b = bend(T, R, K, (a * Math.PI) / 180);
    sum -= b.bd;
    descr.push(`${a}°`);
  });
  const warnings = [];
  if (ratio < 1) warnings.push('Inside radius below the thickness: the K-factor of such tight bends scatters; make a test bend.');
  const shortLeg = legs.some((l) => l.length * unit < one.ossb);
  if (shortLeg) warnings.push('A leg is shorter than the outside setback: the flange is too short to bend; check the leg lengths and their units.');
  if (sum <= 0) throw new Error('Legs: the bend deductions exceed the leg lengths; check the leg units and the thickness.');
  return {
    outputs: {
      k_used: K,
      k_din: kDin,
      ba_m: one.ba,
      ossb_m: one.ossb,
      bd_m: one.bd,
      flat_m: sum,
      bends: `${descr.length} bend${descr.length === 1 ? '' : 's'}: ${descr.join(', ')}`,
    },
    warnings,
  };
}
