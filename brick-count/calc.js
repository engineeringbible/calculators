/**
 * brick-count/calc.js — bricks for a wall: modular, standard, queen, king, Norman, utility, UK metric or custom
 * bricks with the joint thickness, net wall area after openings, single or double wythe, waste and mortar volume.
 *
 * bricks per area = 1 / ((L + j)(H + j));  mortar per brick = ((L + j)(H + j) − L H) × W   (BIA TN 10 method);
 * double wythe: twice the bricks and joint mortar plus a collar joint of thickness j.
 * Schema units: SI — m, m², m³.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertNonNegative } from '../shared/validate.js';

const IN = 0.0254;

/** Specified brick dimensions L × H × W (BIA TN 10 Table 4 for ⅜ in joints; UK format 215 × 65 × 102.5 mm). */
export const BRICKS = {
  modular: { label: 'Modular, 7⅝ × 2¼ × 3⅝ in', L: 7.625 * IN, H: 2.25 * IN, W: 3.625 * IN },
  standard: { label: 'Standard, 8 × 2¼ × 3⅝ in', L: 8 * IN, H: 2.25 * IN, W: 3.625 * IN },
  queen: { label: 'Queen, 7⅝ × 2¾ × 2¾ in', L: 7.625 * IN, H: 2.75 * IN, W: 2.75 * IN },
  king: { label: 'King, 9¾ × 2¾ × 2¾ in', L: 9.75 * IN, H: 2.75 * IN, W: 2.75 * IN },
  norman: { label: 'Norman, 11⅝ × 2¼ × 3⅝ in', L: 11.625 * IN, H: 2.25 * IN, W: 3.625 * IN },
  utility: { label: 'Utility, 11⅝ × 3⅝ × 3⅝ in', L: 11.625 * IN, H: 3.625 * IN, W: 3.625 * IN },
  uk: { label: 'UK metric, 215 × 65 × 102.5 mm', L: 0.215, H: 0.065, W: 0.1025 },
  custom: { label: 'Custom size', L: null, H: null, W: null },
};

/** Theoretical joint mortar of one standard brick (8 × 2¼ × 3⅝ in, ⅜ in joints), m³: 14.43 in³. */
const STANDARD_BRICK_MORTAR_M3 = ((8.375 * 2.625 - 8 * 2.25) * 3.625) * IN ** 3;

export const schema = {
  id: 'brick-count',
  name: 'Brick calculator: bricks and mortar for a wall',
  category: 'civil',
  summary: 'Number of bricks for a wall from its area less openings, for modular, standard, metric or custom bricks, one or two wythes, with waste and mortar.',
  related: ['concrete-block', 'paint-coverage', 'concrete-footing', 'retaining-wall'],
  assumptions: [
    'Running or stack bond with every joint the same thickness. Each brick takes up its face plus one bed joint and one head joint; patterns with header courses use more bricks, by BIA TN 10 Table 6.',
    'Mortar is the theoretical volume of full bed and head joints through the brick width, the method behind BIA TN 10 Table 4, with no waste; a double wythe adds a solid collar joint of the same thickness.',
    'Mortar bags use the QUIKRETE Mortar Mix rate of 37 standard bricks per 80 lb bag, scaled by the joint mortar of the chosen brick; this rate includes the droppings and waste of normal laying.',
    'The waste allowance on bricks covers cutting and breakage; 5 % is common for plain walls, more with many openings and corners.',
  ],
  notes: [
    'Verification 2026-11-08: a 20 × 8 ft wall less a 12 ft² window in modular brick with ⅜ in joints is 148 ft² × 6.857 = 1 015 bricks, 1 066 with 5 % waste; mortar 8.18 ft³ (8.06 ft³ per 1 000 bricks, BIA TN 10 Table 4: 8.1); 27 bags of 80 lb. Checked by hand.',
    'BIA TN 10 lists 675 modular bricks per 100 ft² because three modular courses fill 8 in; with joints of exactly ⅜ in the count is 686. Its non-modular mortar column is 1.73 times the geometric volume, apparently in³ per brick; the geometric method is used here.',
  ],
  sources: [
    'Brick Industry Association, Technical Note 10, Dimensioning and Estimating Brick Masonry (2009), Table 4 (bricks and mortar per 100 ft²) and Table 5 (collar joints)',
    'Brick Development Association, The BDA Guide to Successful Brickwork, 3rd ed. (2005): UK brick format 215 × 102.5 × 65 mm laid with 10 mm joints',
    'QUIKRETE Mortar Mix No. 1102 data sheet (an 80 lb bag lays up to 37 standard bricks)',
  ],
  inputs: [
    { id: 'brick', label: 'Brick size', type: 'select', default: 'modular', options: Object.entries(BRICKS).map(([value, b]) => ({ value, label: b.label })) },
    { id: 'brick_l_m', label: 'Brick length', group: 'length', unit: 'm', display: 'in', default: 7.625 * IN, min: 0.05, max: 0.6, visibleWhen: { brick: 'custom' } },
    { id: 'brick_h_m', label: 'Brick height', group: 'length', unit: 'm', display: 'in', default: 2.25 * IN, min: 0.03, max: 0.3, visibleWhen: { brick: 'custom' } },
    { id: 'brick_w_m', label: 'Brick width (wall thickness of one wythe)', group: 'length', unit: 'm', display: 'in', default: 3.625 * IN, min: 0.03, max: 0.3, visibleWhen: { brick: 'custom' } },
    { id: 'joint_m', label: 'Mortar joint thickness', group: 'length', unit: 'm', display: 'in', default: 0.375 * IN, min: 0, max: 0.03, help: '⅜ in is standard in the US, 10 mm in metric brickwork.' },
    { id: 'length_m', label: 'Wall length', group: 'length', unit: 'm', display: 'ft', default: 20 * 0.3048, min: 0.05, max: 10000 },
    { id: 'height_m', label: 'Wall height', group: 'length', unit: 'm', display: 'ft', default: 8 * 0.3048, min: 0.05, max: 200 },
    { id: 'openings_m2', label: 'Area of doors and windows to deduct', group: 'area', unit: 'm2', display: 'ft2', default: 12 * 0.09290304, min: 0, max: 1e6 },
    { id: 'wythes', label: 'Wall thickness', type: 'select', default: '1', options: [{ value: '1', label: 'Single wythe (one brick thick)' }, { value: '2', label: 'Double wythe with mortared collar joint' }] },
    { id: 'waste', label: 'Brick waste allowance', group: 'ratio', unit: 'frac', display: 'pct', default: 0.05, min: 0, max: 0.5 },
    { id: 'bricks_per_bag', label: 'Standard bricks laid per 80 lb bag of mortar mix', group: 'dimensionless', unit: 'none', default: 37, min: 10, max: 80 },
  ],
  outputs: [
    { id: 'area_m2', label: 'Net wall area', group: 'area', unit: 'm2', display: 'ft2' },
    { id: 'per_ft2', label: 'Bricks per ft² of wall face (one wythe)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'per_m2', label: 'Bricks per m² of wall face (one wythe)', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'bricks_net', label: 'Bricks, no waste', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'bricks', label: 'Bricks to buy, with waste', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'mortar_m3', label: 'Mortar volume in the joints', group: 'volume', unit: 'm3', display: 'ft3' },
    { id: 'mortar_per_1000_m3', label: 'Mortar per 1 000 bricks', group: 'volume', unit: 'm3', display: 'ft3' },
    { id: 'bags', label: 'Mortar mix, 80 lb bags', group: 'dimensionless', unit: 'none', decimals: 0 },
  ],
  example: {
    inputs: { brick: 'modular', joint_m: [0.375, 'in'], length_m: [20, 'ft'], height_m: [8, 'ft'], openings_m2: [12, 'ft2'], wythes: '1', waste: [5, 'pct'], bricks_per_bag: 37 },
    results: { per_ft2: '6.857', bricks_net: '1 015', bricks: '1 066', mortar_m3: '8.18 ft³', mortar_per_1000_m3: '8.06 ft³', bags: '27' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.brick, Object.keys(BRICKS), 'brick', 'Brick size');
  assertOneOf(String(x.wythes), ['1', '2'], 'wythes', 'Wall thickness');
  const b = BRICKS[x.brick];
  const L = x.brick === 'custom' ? assertRange(x.brick_l_m, 0.05, 0.6, 'brick_l_m', 'Brick length') : b.L;
  const H = x.brick === 'custom' ? assertRange(x.brick_h_m, 0.03, 0.3, 'brick_h_m', 'Brick height') : b.H;
  const W = x.brick === 'custom' ? assertRange(x.brick_w_m, 0.03, 0.3, 'brick_w_m', 'Brick width') : b.W;
  const j = assertRange(x.joint_m, 0, 0.03, 'joint_m', 'Mortar joint thickness');
  const wallL = assertPositive(x.length_m, 'length_m', 'Wall length');
  const wallH = assertPositive(x.height_m, 'height_m', 'Wall height');
  const open = assertNonNegative(x.openings_m2, 'openings_m2', 'Area of doors and windows');
  const waste = assertRange(x.waste, 0, 0.5, 'waste', 'Brick waste allowance');
  const perBag = assertRange(x.bricks_per_bag, 10, 80, 'bricks_per_bag', 'Standard bricks laid per 80 lb bag');
  const area = wallL * wallH - open;
  if (area <= 0) throw new Error(`Area of doors and windows: the openings (${open.toFixed(2)} m²) must be smaller than the wall (${(wallL * wallH).toFixed(2)} m²)`);
  const n = Number(x.wythes);

  const module = (L + j) * (H + j);
  const perM2 = 1 / module;
  const exact = area * perM2 * n;
  const mortarPerBrick = (module - L * H) * W;
  const mortar = exact * mortarPerBrick + (n === 2 ? area * j : 0);
  const bags = Math.ceil(mortar / (perBag * STANDARD_BRICK_MORTAR_M3) - 1e-9);
  const warnings = [];
  if (j > 0 && (j < 0.25 * IN || j > 0.5 * IN)) warnings.push('Joint thickness outside ¼ to ½ in (6 to 13 mm): unusual for brickwork; check the specification.');
  if (j === 0) warnings.push('Zero joint thickness: the count is for dry-laid units and gives no mortar.');
  return {
    outputs: {
      area_m2: area,
      per_ft2: perM2 * 0.09290304,
      per_m2: perM2,
      bricks_net: Math.ceil(exact - 1e-9),
      bricks: Math.ceil(exact * (1 + waste) - 1e-9),
      mortar_m3: mortar,
      mortar_per_1000_m3: mortarPerBrick * 1000,
      bags,
    },
    warnings,
  };
}
