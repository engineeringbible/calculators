/**
 * roof-pitch/calc.js — gable roof: pitch x/12 ↔ angle ↔ percent, pitch multiplier, common rafter length with the eave
 * overhang, ridge height, sloped roof area from the footprint and the number of shingle squares and bundles.
 *
 * slope s = pitch / 12 = tan θ;  multiplier k = √(1 + s²);  rafter = (span/2 + eave overhang) × k;
 * area = (span + 2 eave) × (length + 2 rake) × k;  squares = area × (1 + waste) / 100 ft²;  bundles = squares × 3.
 * Schema units: SI — m, m², rad.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertNonNegative } from '../shared/validate.js';

const FT = 0.3048;
const SQUARE_M2 = 100 * FT * FT;

export const schema = {
  id: 'roof-pitch',
  name: 'Roof pitch calculator: rafters, area and shingles',
  category: 'civil',
  summary: 'Roof pitch in x/12, degrees and percent, gable rafter length, ridge height, roof area from the footprint, and shingle squares and bundles.',
  related: ['slope', 'stair-stringer', 'snow-load', 'wind-load'],
  assumptions: [
    'A simple gable roof: two equal planes meeting at a central ridge over a rectangular footprint. Hips, valleys, dormers and unequal pitches need their planes added separately.',
    'Pitch is the rise in inches per 12 in of horizontal run. The pitch multiplier √(1 + (pitch/12)²) converts any horizontal length or area to the length or area along the slope.',
    'The rafter length is measured along the slope from the ridge centre line to the end of the eave overhang; deduct half the ridge board thickness, measured horizontally, when cutting.',
    'A square is 100 ft² of roof surface; standard three-tab and most laminated shingles come 3 bundles to the square, but check the wrapper of your product. The waste allowance covers starter strips, ridge caps and cutting.',
    'Asphalt shingles are allowed on slopes of 2/12 and steeper; from 2/12 to below 4/12 the IRC requires two layers of underlayment.',
  ],
  notes: [
    'Verification 2026-11-08: a 24 × 40 ft house with a 6/12 pitch and 1 ft overhangs: multiplier 1.118, rafter 14.53 ft, ridge 6 ft above the wall plate, roof area 1 221 ft², 13.43 squares and 41 bundles with 10 % waste. Checked by hand.',
  ],
  sources: [
    'International Residential Code 2021, R905.1.1 (underlayment for slopes 2/12 to 4/12) and R905.2.2 (asphalt shingles on slopes of 2/12 or greater)',
    'NRCA Roofing Manual: Steep-Slope Roof Systems (2021), slope expressed as rise in inches per 12 in of run; roofing square of 100 ft²',
    'Trigonometry of the right triangle: tan θ = rise / run, slope length = run × √(1 + (rise/run)²)',
  ],
  inputs: [
    { id: 'mode', label: 'Pitch given as', type: 'select', default: 'pitch', options: [{ value: 'pitch', label: 'Rise per 12 of run (x/12)' }, { value: 'angle', label: 'Angle in degrees' }, { value: 'percent', label: 'Percent grade' }] },
    { id: 'pitch', label: 'Pitch: rise in inches per 12 in of run', group: 'dimensionless', unit: 'none', default: 6, min: 0.1, max: 48, visibleWhen: { mode: 'pitch' } },
    { id: 'angle_rad', label: 'Roof angle', group: 'angle', unit: 'rad', display: 'deg', default: Math.atan(0.5), min: 0.001, max: 1.4, visibleWhen: { mode: 'angle' } },
    { id: 'grade', label: 'Grade', group: 'ratio', unit: 'frac', display: 'pct', default: 0.5, min: 0.001, max: 4, visibleWhen: { mode: 'percent' } },
    { id: 'span_m', label: 'Building width (span, eave wall to eave wall)', group: 'length', unit: 'm', display: 'ft', default: 24 * FT, min: 0.5, max: 200 },
    { id: 'length_m', label: 'Building length (along the ridge)', group: 'length', unit: 'm', display: 'ft', default: 40 * FT, min: 0.5, max: 1000 },
    { id: 'eave_m', label: 'Eave overhang, horizontal', group: 'length', unit: 'm', display: 'ft', default: 1 * FT, min: 0, max: 5 },
    { id: 'rake_m', label: 'Gable (rake) overhang', group: 'length', unit: 'm', display: 'ft', default: 1 * FT, min: 0, max: 5 },
    { id: 'waste', label: 'Shingle waste allowance', group: 'ratio', unit: 'frac', display: 'pct', default: 0.1, min: 0, max: 0.5 },
    { id: 'bundles_per_square', label: 'Bundles per square', group: 'dimensionless', unit: 'none', default: 3, min: 1, max: 6, integer: true },
  ],
  outputs: [
    { id: 'pitch_text', label: 'Pitch', type: 'text' },
    { id: 'angle_out_rad', label: 'Roof angle', group: 'angle', unit: 'rad', display: 'deg', decimals: 2 },
    { id: 'grade_out', label: 'Percent grade', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'multiplier', label: 'Pitch multiplier (slope length per unit run)', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'rafter_m', label: 'Common rafter length, ridge to eave edge', group: 'length', unit: 'm', display: 'ft' },
    { id: 'ridge_m', label: 'Ridge height above the wall plate', group: 'length', unit: 'm', display: 'ft' },
    { id: 'area_m2', label: 'Roof area (both planes)', group: 'area', unit: 'm2', display: 'ft2' },
    { id: 'squares', label: 'Roofing squares, with waste', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'bundles', label: 'Shingle bundles', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'roofing', label: 'Asphalt shingle slope check', type: 'text' },
  ],
  example: {
    inputs: { mode: 'pitch', pitch: 6, span_m: [24, 'ft'], length_m: [40, 'ft'], eave_m: [1, 'ft'], rake_m: [1, 'ft'], waste: [10, 'pct'], bundles_per_square: 3 },
    results: { multiplier: '1.118', rafter_m: '14.53 ft', ridge_m: '6 ft', area_m2: '1 221 ft²', squares: '13.43', bundles: '41' },
  },
};

const fmt = (v) => (Math.abs(v - Math.round(v)) < 0.005 ? String(Math.round(v)) : v.toFixed(2));

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['pitch', 'angle', 'percent'], 'mode', 'Pitch given as');
  let s;
  if (x.mode === 'pitch') s = assertRange(x.pitch, 0.1, 48, 'pitch', 'Pitch') / 12;
  else if (x.mode === 'angle') s = Math.tan(assertRange(x.angle_rad, 0.001, 1.4, 'angle_rad', 'Roof angle'));
  else s = assertRange(x.grade, 0.001, 4, 'grade', 'Grade');
  const span = assertPositive(x.span_m, 'span_m', 'Building width');
  const len = assertPositive(x.length_m, 'length_m', 'Building length');
  const eave = assertNonNegative(x.eave_m, 'eave_m', 'Eave overhang');
  const rake = assertNonNegative(x.rake_m, 'rake_m', 'Gable overhang');
  const waste = assertRange(x.waste, 0, 0.5, 'waste', 'Shingle waste allowance');
  const bps = assertRange(x.bundles_per_square, 1, 6, 'bundles_per_square', 'Bundles per square');
  if (!Number.isInteger(bps)) throw new Error(`Bundles per square must be a whole number (got ${bps})`);

  const k = Math.sqrt(1 + s * s);
  const run = span / 2;
  const area = (span + 2 * eave) * (len + 2 * rake) * k;
  const squares = (area * (1 + waste)) / SQUARE_M2;
  const pitch = 12 * s;
  let roofing;
  if (pitch < 2 - 1e-9) roofing = 'Below 2/12: asphalt shingles not allowed (IRC R905.2.2); use a low-slope membrane roof';
  else if (pitch < 4 - 1e-9) roofing = 'Low slope 2/12 to under 4/12: shingles allowed with two layers of underlayment (IRC R905.1.1)';
  else roofing = '4/12 or steeper: standard shingle installation';
  const warnings = [];
  if (pitch > 21) warnings.push('Pitch steeper than 21/12 (about 60°): special fastening is needed for shingles; check the manufacturer\'s steep-slope instructions.');
  return {
    outputs: {
      pitch_text: `${fmt(pitch)}/12`,
      angle_out_rad: Math.atan(s),
      grade_out: s,
      multiplier: k,
      rafter_m: (run + eave) * k,
      ridge_m: run * s,
      area_m2: area,
      squares,
      bundles: Math.ceil(squares * bps - 1e-9),
      roofing,
    },
    warnings,
  };
}
