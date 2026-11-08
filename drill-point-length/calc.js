/**
 * drill-point-length/calc.js — length of a twist drill's conical point from the diameter and the point angle, and the
 * depth to drill so that a blind hole reaches full diameter or a through hole breaks out completely.
 *
 * L_p = (D/2) / tan(θ/2)  (0.3004 D at 118°, 0.2071 D at 135°, 0.1820 D at 140°).
 * Blind hole: tip depth = full-diameter depth + L_p.  Through hole: travel = thickness + L_p + breakthrough.
 * Schema units: SI — m, degrees.
 */
import { withDefaults, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const IN = 0.0254;
const COMMON = [90, 118, 120, 130, 135, 140];

/** Point length of a drill of diameter D with an included point angle in degrees. */
export function pointLength(D, angleDeg) {
  return D / 2 / Math.tan((angleDeg * Math.PI) / 360);
}

export const schema = {
  id: 'drill-point-length',
  name: 'Drill point length calculator',
  category: 'manufacturing',
  summary: 'Length of a drill point from diameter and point angle (118°, 135°, 140°), and the depth to drill for a full-diameter blind hole or a through hole.',
  related: ['tap-drill', 'machining-time', 'speeds-feeds', 'chip-load'],
  assumptions: [
    'The point is a sharp cone with the included point angle of the drill; the chisel edge, thinning and corner chamfers change its length by a small amount.',
    'For a blind hole the full-diameter depth is the depth on the drawing; the drill tip goes one point length deeper, and the cone at the bottom stays in the part.',
    'For a through hole the whole point must leave the part, plus a breakthrough allowance so that the corners clear the exit edge.',
    'Flat-bottom (180°) drills have no point; point angles of 60° to 180° are accepted.',
  ],
  notes: [
    'Verification 2026-11-08: a 1/2 in drill with a 118° point has a point length of 0.25 / tan 59° = 0.1502 in (0.3004 D); to drill 1 in at full diameter the tip goes to 1.1502 in. Checked by hand.',
  ],
  sources: [
    'Haas Automation (UK), Working out drill depth: tip length 0.3 × D for a 118° point and 0.207 × D for 135°, added to the full-diameter depth',
    'Machinery\'s Handbook Pocket Companion (Industrial Press), Drilling and reaming: typical point angles, 118° for general work',
  ],
  inputs: [
    { id: 'diameter_m', label: 'Drill diameter D', group: 'length', unit: 'm', display: 'in', default: 0.5 * IN, min: 0.0001, max: 0.2 },
    { id: 'angle_deg', label: 'Point angle θ (included)', group: 'angle', unit: 'deg', default: 118, min: 60, max: 180 },
    { id: 'hole', label: 'Hole', type: 'select', default: 'blind', options: [{ value: 'blind', label: 'Blind hole' }, { value: 'through', label: 'Through hole' }] },
    { id: 'depth_m', label: 'Full-diameter depth (blind) or material thickness (through)', group: 'length', unit: 'm', display: 'in', default: 1 * IN, min: 0, max: 5 },
    { id: 'breakthrough_m', label: 'Breakthrough allowance beyond the point', group: 'length', unit: 'm', display: 'in', default: 0.04 * IN, min: 0, max: 0.1, visibleWhen: { hole: 'through' } },
  ],
  outputs: [
    { id: 'point_m', label: 'Point length', group: 'length', unit: 'm', display: 'in' },
    { id: 'ratio', label: 'Point length ÷ diameter', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'drill_to_m', label: 'Drill to (tip depth or total travel)', group: 'length', unit: 'm', display: 'in' },
    { id: 'table', label: 'Point length at common point angles', type: 'table' },
  ],
  example: {
    inputs: { diameter_m: [0.5, 'in'], angle_deg: [118, 'deg'], hole: 'blind', depth_m: [1, 'in'] },
    results: { point_m: '0.1502 in', ratio: '0.3004', drill_to_m: '1.1502 in' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.hole, ['blind', 'through'], 'hole', 'Hole');
  const D = assertRange(x.diameter_m, 0.0001, 0.2, 'diameter_m', 'Drill diameter D');
  const angle = assertRange(x.angle_deg, 60, 180, 'angle_deg', 'Point angle');
  const depth = assertNonNegative(x.depth_m, 'depth_m', 'Depth');
  const Lp = pointLength(D, angle);
  const extra = x.hole === 'through' ? assertNonNegative(x.breakthrough_m, 'breakthrough_m', 'Breakthrough allowance') : 0;
  if (x.hole === 'through' && depth === 0) throw new Error('Material thickness: enter the thickness of the part for a through hole.');
  const warnings = [];
  if (depth > 10 * D) warnings.push('The hole is deeper than 10 diameters: check chip evacuation; peck drilling or a deep-hole drill may be needed.');
  return {
    outputs: {
      point_m: Lp,
      ratio: Lp / D,
      drill_to_m: depth + Lp + extra,
      table: {
        columns: ['Point angle', 'Point length ÷ D', `Point length (in)`, 'Point length (mm)'],
        rows: COMMON.map((a) => [`${a}°`, Number((pointLength(1, a)).toFixed(4)), Number((pointLength(D, a) / IN).toFixed(4)), Number((pointLength(D, a) * 1000).toFixed(3))]),
      },
    },
    warnings,
  };
}
