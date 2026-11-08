/**
 * concrete-column/calc.js — concrete for round columns, piers and tube forms, or for setting fence and deck posts in
 * round holes, with premix bags per hole and in total, weight and cost.
 *
 * Column: V = n × π D² / 4 × H.  Post hole: V = n × (π D² / 4 − A_post) × (h − h_gravel).  V_order = V × (1 + waste).
 * Schema units: SI — m, m³, kg, currency.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertInteger, assertNonNegative } from '../shared/validate.js';
import { BAGS, bagsFor, wasteInput, bagInput, priceInputs, orderOutputs, orderOutputSpecs } from '../shared/concrete.js';

export const schema = {
  id: 'concrete-column',
  name: 'Concrete column and post hole calculator',
  category: 'civil',
  summary: 'Concrete for round columns, piers and tube forms, or for setting fence and deck posts, with premix bags per hole and in total, weight and cost.',
  related: ['concrete-footing', 'concrete-bags', 'concrete-slab', 'concrete-volume'],
  assumptions: [
    'Columns and holes are round with a uniform diameter; a bell or flared base at the bottom of a pier is not included.',
    'In a post hole, the post displaces concrete over the depth of the hole above the gravel; the post is assumed to stand on the gravel at the bottom.',
    'Rules of thumb in the article (hole about three times the post width, one third of the post in the ground) are common fencing practice; posts for decks and structures follow the local code and the drawings.',
    'Premix bags yield 0.60 ft³ per 80 lb; the weight uses 2 400 kg/m³ and counts only the concrete.',
  ],
  notes: [
    'Verification 2026-11-07: a 12 in hole 36 in deep around a 4 × 4 post (3.5 in actual) holds 2.10 ft³, 3.5 bags of 80 lb; ten holes with 10 % waste need 39 bags. Checked by hand.',
  ],
  sources: [
    'International Residential Code (2021), R507.3 (deck footings) and R403.1.4 (footing depth below frost)',
    'QUIKRETE Concrete Mix (No. 1101) product data (0.60 ft³ per 80 lb bag)',
  ],
  inputs: [
    { id: 'type', label: 'What are you filling?', type: 'select', default: 'post', options: [{ value: 'post', label: 'Post holes (fence, deck or mailbox posts)' }, { value: 'column', label: 'Round columns, piers or tube forms' }] },
    { id: 'diameter_m', label: 'Hole or column diameter', group: 'length', unit: 'm', display: 'in', default: 0.3048, min: 0.02, max: 10 },
    { id: 'depth_m', label: 'Hole depth or column height', group: 'length', unit: 'm', display: 'in', default: 0.9144, min: 0.02, max: 100 },
    { id: 'post_shape', label: 'Post shape', type: 'select', default: 'square', options: [{ value: 'square', label: 'Square (4 × 4 is 3.5 in actual)' }, { value: 'round', label: 'Round' }], visibleWhen: { type: 'post' } },
    { id: 'post_size_m', label: 'Post width or diameter (actual)', group: 'length', unit: 'm', display: 'in', default: 0.0889, min: 0, max: 5, visibleWhen: { type: 'post' } },
    { id: 'gravel_m', label: 'Gravel at the bottom of the hole', group: 'length', unit: 'm', display: 'in', default: 0, min: 0, max: 5, visibleWhen: { type: 'post' } },
    { id: 'count', label: 'Number of holes or columns', group: 'dimensionless', unit: 'none', default: 10, min: 1, max: 100000, integer: true },
    wasteInput(0.1),
    bagInput(),
    ...priceInputs(),
  ],
  outputs: [
    { id: 'each_m3', label: 'Concrete per hole or column', group: 'volume', unit: 'm3', display: 'ft3' },
    { id: 'bags_each', label: 'Bags per hole or column (chosen size, no waste)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'volume_m3', label: 'Total concrete volume', group: 'volume', unit: 'm3', display: 'yd3' },
    { id: 'order_m3', label: 'Volume to order, with waste', group: 'volume', unit: 'm3', display: 'ft3' },
    ...orderOutputSpecs(),
  ],
  example: {
    inputs: { type: 'post', diameter_m: [12, 'in'], depth_m: [36, 'in'], post_shape: 'square', post_size_m: [3.5, 'in'], gravel_m: [0, 'in'], count: 10, waste: [10, 'pct'], bag: 'lb80' },
    results: { each_m3: '2.10 ft³', bags_each: '3.50', order_m3: '23.1 ft³', bags: '39' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.type, ['post', 'column'], 'type', 'What are you filling?');
  assertOneOf(x.post_shape, ['square', 'round'], 'post_shape', 'Post shape');
  assertOneOf(x.bag, Object.keys(BAGS), 'bag', 'Premix bag size');
  const dia = assertPositive(x.diameter_m, 'diameter_m', 'Hole or column diameter');
  const depth = assertPositive(x.depth_m, 'depth_m', 'Hole depth or column height');
  const n = assertInteger(x.count, 'count', 'Number of holes or columns');
  assertPositive(n, 'count', 'Number of holes or columns');
  const waste = assertRange(x.waste, 0, 0.5, 'waste', 'Waste and spillage allowance');
  const pr = assertNonNegative(x.price_readymix, 'price_readymix', 'Ready-mix price');
  const pb = assertNonNegative(x.price_bag, 'price_bag', 'Price per bag');

  const holeArea = (Math.PI / 4) * dia * dia;
  const warnings = [];
  let each;
  if (x.type === 'column') {
    each = holeArea * depth;
  } else {
    const post = assertNonNegative(x.post_size_m, 'post_size_m', 'Post width or diameter');
    const gravel = assertNonNegative(x.gravel_m, 'gravel_m', 'Gravel at the bottom of the hole');
    const postArea = x.post_shape === 'square' ? post * post : (Math.PI / 4) * post * post;
    const fits = x.post_shape === 'square' ? post * Math.SQRT2 < dia : post < dia;
    if (!fits) throw new Error('Post width or diameter: the post does not fit in the hole; make the hole wider.');
    if (gravel >= depth) throw new Error('Gravel at the bottom of the hole: the gravel fills the whole hole; it must be less than the depth.');
    each = (holeArea - postArea) * (depth - gravel);
    if (post > 0 && dia < 2.5 * post) warnings.push('The hole is narrower than about three times the post width, the usual rule for fence posts; the post may lean in soft ground.');
  }
  const volume = each * n;
  const order = volume * (1 + waste);
  if (order > 0.764554857984) warnings.push('More than one cubic yard: ready-mix by truck is usually cheaper and faster than mixing bags.');
  return {
    outputs: { each_m3: each, bags_each: bagsFor(each, x.bag), volume_m3: volume, order_m3: order, ...orderOutputs(order, volume, x.bag, pr, pb) },
    warnings,
  };
}
