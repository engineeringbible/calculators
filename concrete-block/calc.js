/**
 * concrete-block/calc.js — concrete masonry units (CMU) for a wall: number of blocks from the net wall area, bags of
 * preblended mortar, and the grout to fill the cores at a chosen spacing (NCMA TEK 4-2A).
 *
 * blocks = (L × H − openings) / face module × (1 + waste);  US 8 × 16 in face = 0.889 ft², metric 450 × 225 mm = 0.101 m².
 * Mortar: one 80 lb bag of preblended mortar lays about 16 conventional CMU with face-shell bedding (TEK 4-2A Table 2).
 * Grout: TEK 4-2A Table 3, ft³ per 100 ft² of wall by unit width and grout spacing (two-core units, 3 % waste included).
 * Schema units: SI — m, m², m³.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertNonNegative } from '../shared/validate.js';

const FT2 = 0.09290304;
const FT3 = 0.028316846592;
const IN = 0.0254;

export const UNITS = {
  us8x16: { label: 'US 8 × 16 in nominal (15⅝ × 7⅝ in, ⅜ in joints)', faceL: 16 * IN, faceH: 8 * IN },
  metric440: { label: 'Metric 440 × 215 mm (10 mm joints)', faceL: 0.45, faceH: 0.225 },
};

/** NCMA TEK 4-2A Table 3: grout, ft³ per 100 ft² of single-wythe wall (two-core hollow units, 3 % waste). */
export const GROUT_FT3_PER_100FT2 = {
  8: { 6: 25.6, 8: 36.1, 10: 47.0, 12: 58.9, 14: 74.5 },
  16: { 6: 12.8, 8: 18.1, 10: 23.5, 12: 29.5, 14: 37.3 },
  24: { 6: 8.6, 8: 12.1, 10: 15.7, 12: 19.7, 14: 24.8 },
  32: { 6: 6.4, 8: 9.1, 10: 11.8, 12: 14.8, 14: 18.6 },
  40: { 6: 5.2, 8: 7.3, 10: 9.4, 12: 11.8, 14: 14.9 },
  48: { 6: 4.3, 8: 6.1, 10: 7.9, 12: 9.9, 14: 12.4 },
};

/** Conventional CMU laid per 80 lb bag of preblended mortar, face-shell bedding (NCMA TEK 4-2A Table 2). */
export const BLOCKS_PER_BAG = 16;

export const schema = {
  id: 'concrete-block',
  name: 'Concrete block calculator: CMU, mortar and grout',
  category: 'civil',
  summary: 'Concrete blocks for a wall (8 × 16 in or 440 × 215 mm), with openings and waste, bags of mortar and the grout volume to fill the cores.',
  related: ['brick-count', 'concrete-footing', 'concrete-volume', 'retaining-wall'],
  assumptions: [
    'Single-wythe wall laid in running bond. The count uses the face module of the unit plus one joint: 8 × 16 in (0.889 ft²) for US blocks and 225 × 450 mm (0.101 m²) for metric blocks. Corners, lintels and bond beams need their own special units.',
    'Mortar uses the NCMA estimate of 16 conventional blocks per 80 lb bag of preblended mortar with face-shell bedding, which includes nominal waste; the QUIKRETE Mortar Mix data sheet gives 13, so use that rate for inexperienced masons. Metric blocks are scaled by their longer joint length.',
    'Grout volumes are those of NCMA TEK 4-2A Table 3 for two-core hollow units, including 3 % waste; units with larger cells or bond beams take more. Grout is not estimated for metric blocks, which are often solid or have other cell shapes.',
    'The waste allowance on blocks covers breakage and cuts; NCMA uses about 5 %.',
  ],
  notes: [
    'Verification 2026-11-08: a wall 40 ft long and 8 ft high, 8-in units grouted at 48 in: 320 ft² / 0.889 = 360 blocks, 378 with 5 % waste; 22.5 so 23 bags of mortar; grout 320 × 6.1/100 = 19.5 ft³ = 0.723 yd³. Checked by hand.',
    'Grout table transcribed from NCMA (CMHA) TEK 4-2A Table 3 for unit widths 6 to 14 in and spacings 8 to 48 in.',
  ],
  sources: [
    'NCMA (CMHA) TEK 4-2A, Estimating Concrete Masonry Materials: Table 2 (mortar, 16 units per 80 lb preblended bag) and Table 3 (grout volume per 100 ft² of wall)',
    'QUIKRETE Mortar Mix No. 1102 data sheet (an 80 lb bag lays up to 13 standard 8 × 8 × 16 in blocks)',
  ],
  inputs: [
    { id: 'unit', label: 'Block size', type: 'select', default: 'us8x16', options: Object.entries(UNITS).map(([value, u]) => ({ value, label: u.label })) },
    { id: 'width_in', label: 'Block width (nominal)', type: 'select', default: '8', options: [6, 8, 10, 12, 14].map((w) => ({ value: String(w), label: `${w} in` })), visibleWhen: { unit: 'us8x16' } },
    { id: 'length_m', label: 'Wall length', group: 'length', unit: 'm', display: 'ft', default: 40 * 0.3048, min: 0.1, max: 10000 },
    { id: 'height_m', label: 'Wall height', group: 'length', unit: 'm', display: 'ft', default: 8 * 0.3048, min: 0.1, max: 100 },
    { id: 'openings_m2', label: 'Area of doors and windows to deduct', group: 'area', unit: 'm2', display: 'ft2', default: 0, min: 0, max: 1e6 },
    { id: 'waste', label: 'Waste and breakage allowance', group: 'ratio', unit: 'frac', display: 'pct', default: 0.05, min: 0, max: 0.5 },
    { id: 'grout', label: 'Cores grouted', type: 'select', default: '48', options: [
      { value: 'none', label: 'None (hollow wall)' }, { value: '8', label: 'Every core (solid grouted)' },
      { value: '16', label: 'At 16 in on centre' }, { value: '24', label: 'At 24 in on centre' }, { value: '32', label: 'At 32 in on centre' },
      { value: '40', label: 'At 40 in on centre' }, { value: '48', label: 'At 48 in on centre' },
    ], visibleWhen: { unit: 'us8x16' } },
    { id: 'blocks_per_bag', label: 'Blocks laid per 80 lb bag of mortar', group: 'dimensionless', unit: 'none', default: BLOCKS_PER_BAG, min: 5, max: 30 },
  ],
  outputs: [
    { id: 'area_m2', label: 'Net wall area', group: 'area', unit: 'm2', display: 'ft2' },
    { id: 'blocks_net', label: 'Blocks, no waste', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'blocks', label: 'Blocks to buy, with waste', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'courses', label: 'Height in courses', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'bags', label: 'Mortar, 80 lb bags of mortar mix', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'grout_m3', label: 'Grout for the cores', group: 'volume', unit: 'm3', display: 'yd3' },
    { id: 'grout_ft3_m3', label: 'Grout in cubic feet', group: 'volume', unit: 'm3', display: 'ft3' },
  ],
  example: {
    inputs: { unit: 'us8x16', width_in: '8', length_m: [40, 'ft'], height_m: [8, 'ft'], openings_m2: [0, 'ft2'], waste: [5, 'pct'], grout: '48', blocks_per_bag: 16 },
    results: { blocks_net: '360', blocks: '378', bags: '23', grout_ft3_m3: '19.5 ft³', grout_m3: '0.723 yd³' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.unit, Object.keys(UNITS), 'unit', 'Block size');
  assertOneOf(String(x.width_in), ['6', '8', '10', '12', '14'], 'width_in', 'Block width');
  assertOneOf(String(x.grout), ['none', '8', '16', '24', '32', '40', '48'], 'grout', 'Cores grouted');
  const L = assertPositive(x.length_m, 'length_m', 'Wall length');
  const H = assertPositive(x.height_m, 'height_m', 'Wall height');
  const open = assertNonNegative(x.openings_m2, 'openings_m2', 'Area of doors and windows');
  const waste = assertRange(x.waste, 0, 0.5, 'waste', 'Waste and breakage allowance');
  const perBag = assertRange(x.blocks_per_bag, 5, 30, 'blocks_per_bag', 'Blocks laid per 80 lb bag of mortar');
  const area = L * H - open;
  if (area <= 0) throw new Error(`Area of doors and windows: the openings (${open.toFixed(2)} m²) must be smaller than the wall (${(L * H).toFixed(2)} m²)`);
  const u = UNITS[x.unit];
  const blocksExact = area / (u.faceL * u.faceH);
  const blocksNet = Math.ceil(blocksExact - 1e-9);
  const blocks = Math.ceil(blocksExact * (1 + waste) - 1e-9);
  // joint length per unit relative to the 8 × 16 in unit the bag rate is quoted for
  const jointScale = (u.faceL + u.faceH) / (24 * IN);
  const bags = Math.ceil((blocksExact * jointScale) / perBag - 1e-9);
  let grout = null;
  if (x.unit === 'us8x16' && x.grout !== 'none') grout = (area / FT2) * GROUT_FT3_PER_100FT2[x.grout][x.width_in] / 100 * FT3;
  const warnings = [];
  const courses = H / u.faceH;
  if (Math.abs(courses - Math.round(courses)) > 0.02) warnings.push('The wall height is not a whole number of courses; adjust it to the 8 in (225 mm) module or allow for cut blocks.');
  if (x.unit === 'us8x16' && x.grout === 'none' && H > 1.2) warnings.push('Hollow, unreinforced walls are suitable for low garden walls only; walls that retain soil or carry loads need reinforced, grouted cores to an engineer\'s design.');
  return {
    outputs: {
      area_m2: area,
      blocks_net: blocksNet,
      blocks,
      courses,
      bags,
      grout_m3: grout,
      grout_ft3_m3: grout,
    },
    warnings,
  };
}
