/**
 * concrete-slab/calc.js — concrete for a rectangular slab, patio, driveway or floor: cubic yards and m³ with waste,
 * premix bags of each size, weight and optional costs.
 *
 * V = L × W × t × n;  V_order = V × (1 + waste).  Bags from shared/concrete.js (0.60 ft³ per 80 lb).
 * Schema units: SI — m, m³, kg, currency.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertInteger, assertNonNegative } from '../shared/validate.js';
import { BAGS, wasteInput, bagInput, priceInputs, orderOutputs, orderOutputSpecs } from '../shared/concrete.js';

export const schema = {
  id: 'concrete-slab',
  name: 'Concrete slab calculator',
  category: 'civil',
  summary: 'Cubic yards or m³ of concrete for a slab, patio, driveway or shed base, with waste, the number of 80, 60 or 40 lb bags, weight and cost.',
  related: ['concrete-bags', 'concrete-footing', 'concrete-column', 'concrete-volume'],
  assumptions: [
    'The slab is rectangular with a uniform thickness; for an L-shape, add two rectangles. Thickened edges, beams under the slab and the gravel base are not included.',
    'The waste allowance covers spillage, an uneven sub-base and formwork that bows; 5 to 10 % is usual for slabs.',
    'Premix bags yield 0.60 ft³ per 80 lb; ready-mix is ordered by the cubic yard or cubic metre, usually in steps of a quarter or half.',
    'Thickness guidance in the article (4 in for patios and walkways, 5 to 6 in for driveways) is common residential practice; slabs that carry structural loads need an engineer\'s design.',
  ],
  notes: [
    'Verification 2026-11-07: a 10 × 10 ft slab 4 in thick is 33.3 ft³ = 1.23 yd³, 1.36 yd³ with 10 % waste, 62 bags of 80 lb. Checked by hand.',
  ],
  sources: [
    'ACI 302.1R-15, Guide to Concrete Floor and Slab Construction (slab thickness and sub-base practice)',
    'QUIKRETE Concrete Mix (No. 1101) product data (0.60 ft³ per 80 lb bag)',
  ],
  inputs: [
    { id: 'length_m', label: 'Length', group: 'length', unit: 'm', display: 'ft', default: 3.048, min: 0.01, max: 1000 },
    { id: 'width_m', label: 'Width', group: 'length', unit: 'm', display: 'ft', default: 3.048, min: 0.01, max: 1000 },
    { id: 'thickness_m', label: 'Thickness', group: 'length', unit: 'm', display: 'in', default: 0.1016, min: 0.01, max: 3 },
    { id: 'count', label: 'Number of identical slabs', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 10000, integer: true },
    wasteInput(0.1),
    bagInput(),
    ...priceInputs(),
  ],
  outputs: [
    { id: 'volume_m3', label: 'Concrete volume', group: 'volume', unit: 'm3', display: 'yd3' },
    { id: 'order_m3', label: 'Volume to order, with waste', group: 'volume', unit: 'm3', display: 'yd3' },
    { id: 'order_ft3_m3', label: 'Volume to order in cubic feet', group: 'volume', unit: 'm3', display: 'ft3' },
    { id: 'area_m2', label: 'Slab area', group: 'area', unit: 'm2', display: 'ft2' },
    ...orderOutputSpecs(),
  ],
  example: {
    inputs: { length_m: [10, 'ft'], width_m: [10, 'ft'], thickness_m: [4, 'in'], count: 1, waste: [10, 'pct'], bag: 'lb80' },
    results: { volume_m3: '1.23 yd³', order_m3: '1.36 yd³', order_ft3_m3: '36.7 ft³', bags: '62' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.bag, Object.keys(BAGS), 'bag', 'Premix bag size');
  const l = assertPositive(x.length_m, 'length_m', 'Length');
  const w = assertPositive(x.width_m, 'width_m', 'Width');
  const t = assertPositive(x.thickness_m, 'thickness_m', 'Thickness');
  const n = assertInteger(x.count, 'count', 'Number of identical slabs');
  assertPositive(n, 'count', 'Number of identical slabs');
  const waste = assertRange(x.waste, 0, 0.5, 'waste', 'Waste and spillage allowance');
  const pr = assertNonNegative(x.price_readymix, 'price_readymix', 'Ready-mix price');
  const pb = assertNonNegative(x.price_bag, 'price_bag', 'Price per bag');

  const volume = l * w * t * n;
  const order = volume * (1 + waste);
  const warnings = [];
  if (t < 0.0889) warnings.push('Slabs thinner than about 3.5 in (90 mm) crack easily; 4 in (100 mm) is the usual minimum for a patio or walkway.');
  if (order > 0.764554857984) warnings.push('More than one cubic yard: ready-mix by truck is usually cheaper, faster and more uniform than mixing bags.');
  return {
    outputs: { volume_m3: volume, order_m3: order, order_ft3_m3: order, area_m2: l * w * n, ...orderOutputs(order, volume, x.bag, pr, pb) },
    warnings,
  };
}
