/**
 * concrete-bags/calc.js — how many bags of premixed concrete make a given volume: bags of the chosen size and of every
 * common size, the yield of one bag, bags per cubic yard and per cubic metre, the weight to carry and the cost.
 *
 * bags = V × (1 + waste) / yield;  yield = 0.60 ft³ per 80 lb of dry mix (shared/concrete.js).
 * Schema units: SI — m³, kg, currency.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertNonNegative } from '../shared/validate.js';
import { BAGS, YD3_M3, bagYieldM3, bagsFor, bagSummary, wasteInput, bagInput } from '../shared/concrete.js';

export const schema = {
  id: 'concrete-bags',
  name: 'Concrete bag calculator',
  category: 'civil',
  summary: 'How many 80, 60, 50 or 40 lb bags (or 20 to 30 kg) of premixed concrete you need for any volume, with the yield per bag, the weight to carry and the cost.',
  related: ['concrete-slab', 'concrete-footing', 'concrete-column', 'concrete-volume'],
  assumptions: [
    'Premixed concrete yields 0.60 ft³ per 80 lb bag, 0.45 ft³ per 60 lb, 0.375 ft³ per 50 lb and 0.30 ft³ per 40 lb, the figures printed on US bags; metric bags use the same yield per kilogram (11.7 L per 25 kg).',
    'Mortar, high-strength, fast-setting and lightweight mixes yield different volumes; read the yield on the bag and compare.',
    'The weight to carry is the dry weight of the bags; the water added on site is not included.',
  ],
  notes: [
    'Verification 2026-11-07: one cubic yard is 45 bags of 80 lb (3 600 lb of dry mix), 60 of 60 lb and 90 of 40 lb, as in premix yield charts.',
  ],
  sources: [
    'QUIKRETE Concrete Mix (No. 1101) product data: 80 lb yields about 0.60 ft³, 60 lb about 0.45 ft³',
    '1 yd³ = 27 ft³ = 0.764554857984 m³ (NIST Handbook 44, Appendix C)',
  ],
  inputs: [
    { id: 'volume_m3', label: 'Volume of concrete needed', group: 'volume', unit: 'm3', display: 'yd3', default: 0.764554857984, min: 1e-6, max: 100000 },
    wasteInput(0),
    bagInput(),
    { id: 'price_bag', label: 'Price per bag (optional)', group: 'money', unit: 'cur', default: 0, min: 0, max: 10000 },
  ],
  outputs: [
    { id: 'bags', label: 'Bags to buy (chosen size)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'bags_exact', label: 'Exact number of bags', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'bags_all', label: 'Bags of each size', type: 'text' },
    { id: 'yield_m3', label: 'Concrete made by one bag', group: 'volume', unit: 'm3', display: 'ft3' },
    { id: 'per_yd3', label: 'Bags per cubic yard', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'per_m3', label: 'Bags per cubic metre', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'dry_kg', label: 'Weight of the bags to carry', group: 'mass', unit: 'kg', display: 'lb' },
    { id: 'cost', label: 'Cost of the bags', group: 'money', unit: 'cur' },
  ],
  example: {
    inputs: { volume_m3: [1, 'yd3'], waste: [0, 'pct'], bag: 'lb80' },
    results: { bags: '45', yield_m3: '0.600 ft³', per_m3: '58.9', dry_kg: '3 600 lb' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.bag, Object.keys(BAGS), 'bag', 'Premix bag size');
  const v = assertPositive(x.volume_m3, 'volume_m3', 'Volume of concrete needed');
  const waste = assertRange(x.waste, 0, 0.5, 'waste', 'Waste and spillage allowance');
  const price = assertNonNegative(x.price_bag, 'price_bag', 'Price per bag');
  const order = v * (1 + waste);
  const exact = bagsFor(order, x.bag);
  const bags = Math.ceil(exact - 1e-9);
  const warnings = [];
  if (order > YD3_M3 * 1.0001) warnings.push('More than one cubic yard: ready-mix by truck is usually cheaper and faster than mixing this many bags.');
  return {
    outputs: {
      bags,
      bags_exact: exact,
      bags_all: bagSummary(order, ['lb80', 'lb60', 'lb50', 'lb40', 'kg30', 'kg25', 'kg20']),
      yield_m3: bagYieldM3(x.bag),
      per_yd3: YD3_M3 / bagYieldM3(x.bag),
      per_m3: 1 / bagYieldM3(x.bag),
      dry_kg: bags * BAGS[x.bag].kg,
      cost: price > 0 ? bags * price : null,
    },
    warnings,
  };
}
