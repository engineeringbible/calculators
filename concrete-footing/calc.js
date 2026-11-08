/**
 * concrete-footing/calc.js — concrete for a continuous strip footing or a set of rectangular pad footings, in cubic
 * yards and m³ with waste, premix bags, weight and cost.
 *
 * Strip: V = L_centreline × B × D.  Pads: V = n × L × B × D.  V_order = V × (1 + waste).
 * Schema units: SI — m, m³, kg, currency.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertInteger, assertNonNegative } from '../shared/validate.js';
import { BAGS, wasteInput, bagInput, priceInputs, orderOutputs, orderOutputSpecs } from '../shared/concrete.js';

/** IRC R403.1.1 minimum footing size for light-frame buildings: 12 in wide, 6 in thick. */
const IRC_MIN_WIDTH_M = 0.3048;
const IRC_MIN_DEPTH_M = 0.1524;

export const schema = {
  id: 'concrete-footing',
  name: 'Concrete footing calculator',
  category: 'civil',
  summary: 'Concrete for strip footings under walls or square pad footings under posts, in cubic yards or m³ with waste, premix bags, weight and cost.',
  related: ['concrete-slab', 'concrete-column', 'concrete-bags', 'concrete-volume'],
  assumptions: [
    'A strip footing is measured along its centreline, so the corners are counted once. Measuring the outside perimeter instead double-counts each corner.',
    'Footings are rectangular in section with a level base; stepped footings, stem walls and trench over-dig are not included. The waste allowance covers over-dig and spillage, 10 % or more when pouring against earth.',
    'The size of a footing comes from the load and the soil, and its depth from the local frost line; this page only estimates quantities. IRC R403.1.1 sets 12 in wide and 6 in thick as the minimum for light-frame buildings.',
    'Premix bags yield 0.60 ft³ per 80 lb; the weight uses 2 400 kg/m³.',
  ],
  notes: [
    'Verification 2026-11-07: walls on a 24 × 24 ft square of centrelines give 96 ft; a 16 × 8 in footing is 85.3 ft³ = 3.16 yd³, 3.48 yd³ with 10 % waste. Checked by hand.',
  ],
  sources: [
    'International Residential Code (2021), R403.1 and R403.1.1 (minimum footing width 12 in and thickness 6 in)',
    'QUIKRETE Concrete Mix (No. 1101) product data (0.60 ft³ per 80 lb bag)',
  ],
  inputs: [
    { id: 'type', label: 'Footing type', type: 'select', default: 'strip', options: [{ value: 'strip', label: 'Strip (continuous) footing under walls' }, { value: 'pad', label: 'Pad (spread) footings under posts or columns' }] },
    { id: 'length_m', label: 'Total length along the centreline', group: 'length', unit: 'm', display: 'ft', default: 29.2608, min: 0.1, max: 10000, visibleWhen: { type: 'strip' } },
    { id: 'pad_length_m', label: 'Pad length', group: 'length', unit: 'm', display: 'in', default: 0.6096, min: 0.05, max: 50, visibleWhen: { type: 'pad' } },
    { id: 'width_m', label: 'Width', group: 'length', unit: 'm', display: 'in', default: 0.4064, min: 0.05, max: 50 },
    { id: 'depth_m', label: 'Depth (thickness of concrete)', group: 'length', unit: 'm', display: 'in', default: 0.2032, min: 0.02, max: 10 },
    { id: 'count', label: 'Number of pads', group: 'dimensionless', unit: 'none', default: 6, min: 1, max: 10000, integer: true, visibleWhen: { type: 'pad' } },
    wasteInput(0.1),
    bagInput(),
    ...priceInputs(),
  ],
  outputs: [
    { id: 'volume_m3', label: 'Concrete volume', group: 'volume', unit: 'm3', display: 'yd3' },
    { id: 'order_m3', label: 'Volume to order, with waste', group: 'volume', unit: 'm3', display: 'yd3' },
    { id: 'order_ft3_m3', label: 'Volume to order in cubic feet', group: 'volume', unit: 'm3', display: 'ft3' },
    ...orderOutputSpecs(),
  ],
  example: {
    inputs: { type: 'strip', length_m: [96, 'ft'], width_m: [16, 'in'], depth_m: [8, 'in'], waste: [10, 'pct'], bag: 'lb80' },
    results: { volume_m3: '3.16 yd³', order_m3: '3.48 yd³', order_ft3_m3: '93.9 ft³', bags: '157' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.type, ['strip', 'pad'], 'type', 'Footing type');
  assertOneOf(x.bag, Object.keys(BAGS), 'bag', 'Premix bag size');
  const b = assertPositive(x.width_m, 'width_m', 'Width');
  const d = assertPositive(x.depth_m, 'depth_m', 'Depth');
  const waste = assertRange(x.waste, 0, 0.5, 'waste', 'Waste and spillage allowance');
  const pr = assertNonNegative(x.price_readymix, 'price_readymix', 'Ready-mix price');
  const pb = assertNonNegative(x.price_bag, 'price_bag', 'Price per bag');

  let volume;
  if (x.type === 'strip') {
    volume = assertPositive(x.length_m, 'length_m', 'Total length along the centreline') * b * d;
  } else {
    const n = assertInteger(x.count, 'count', 'Number of pads');
    assertPositive(n, 'count', 'Number of pads');
    volume = n * assertPositive(x.pad_length_m, 'pad_length_m', 'Pad length') * b * d;
  }
  const order = volume * (1 + waste);
  const warnings = [];
  if (b < IRC_MIN_WIDTH_M - 1e-9 || d < IRC_MIN_DEPTH_M - 1e-9) warnings.push('Smaller than the IRC R403.1.1 minimum of 12 in wide and 6 in thick for footings of light-frame buildings.');
  if (order > 0.764554857984) warnings.push('More than one cubic yard: ready-mix by truck is usually cheaper and faster than mixing bags.');
  return {
    outputs: { volume_m3: volume, order_m3: order, order_ft3_m3: order, ...orderOutputs(order, volume, x.bag, pr, pb) },
    warnings,
  };
}
