/**
 * gravel/calc.js — gravel, crushed stone, sand or topsoil for an area: volume in place, volume to order with a
 * compaction allowance, tonnage from the loose bulk density of the material, truck loads and cost.
 *
 * V = A × d;  V_order = V × (1 + compaction);  m = V_order × ρ_loose;  loads = max(V_order / V_truck, m / m_truck), rounded up.
 * Schema units: SI — m, m², m³, kg/m³, kg, currency.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertNonNegative } from '../shared/validate.js';

/** Loose bulk densities, kg/m³ (Caterpillar Performance Handbook, Tables: weights of materials, loose column). */
export const MATERIALS = {
  crushed_stone: { label: 'Crushed stone (1 600 kg/m³, 2 700 lb/yd³)', kg_m3: 1600 },
  gravel: { label: 'Gravel, dry, ¼ to 2 in (1 690 kg/m³, 2 850 lb/yd³)', kg_m3: 1690 },
  sand_gravel: { label: 'Sand and gravel, dry (1 720 kg/m³, 2 900 lb/yd³)', kg_m3: 1720 },
  sand: { label: 'Sand, dry (1 420 kg/m³, 2 400 lb/yd³)', kg_m3: 1420 },
  topsoil: { label: 'Topsoil (950 kg/m³, 1 600 lb/yd³)', kg_m3: 950 },
  custom: { label: 'Custom bulk density', kg_m3: null },
};

const YD3 = 0.764554857984;
const SHORT_TON = 907.18474;

export const schema = {
  id: 'gravel',
  name: 'Gravel calculator: cubic yards and tons',
  category: 'civil',
  summary: 'Cubic yards, m³ and tons of gravel, crushed stone, sand or topsoil for an area and depth, with compaction allowance, truck loads and cost.',
  related: ['concrete-slab', 'asphalt', 'trench-volume', 'earthwork-volume'],
  assumptions: [
    'The area is a rectangle, or an area you enter, covered to a uniform depth; split irregular areas into rectangles and add them.',
    "Tonnage uses the loose bulk density of the delivered material from the Caterpillar Performance Handbook; the real figure varies with moisture, grading and rock type, so use the supplier's weight per yard when you have it.",
    'The compaction allowance covers the volume lost when loose material is spread and compacted; 10 to 15 % is usual for base courses and less for loose decorative stone.',
    'Truck loads are the larger of the volume and weight limits you enter; legal payloads vary by truck and by state.',
  ],
  notes: [
    'Verification 2026-11-08: a 20 × 10 ft area 4 in deep is 66.7 ft³ = 2.47 yd³; with 10 % compaction 2.72 yd³; crushed stone at 1 600 kg/m³ (2 697 lb/yd³) gives 7 325 lb = 3.66 short ton, $146.50 at $40 per ton. Checked by hand.',
  ],
  sources: [
    'Caterpillar Performance Handbook, Tables section: approximate weights of materials, loose and bank (crushed stone 1 600 kg/m³, gravel dry ¼–2 in 1 690, sand and gravel dry 1 720, sand dry 1 420, topsoil 950)',
    'NIST Handbook 44, Appendix C, and NIST SP 811, Appendix B (1 yd³ = 27 ft³ = 0.764555 m³; 1 short ton = 2 000 lb)',
  ],
  inputs: [
    { id: 'shape', label: 'Area given as', type: 'select', default: 'rect', options: [{ value: 'rect', label: 'Length and width' }, { value: 'area', label: 'Area' }] },
    { id: 'length_m', label: 'Length', group: 'length', unit: 'm', display: 'ft', default: 6.096, min: 0.01, max: 10000, visibleWhen: { shape: 'rect' } },
    { id: 'width_m', label: 'Width', group: 'length', unit: 'm', display: 'ft', default: 3.048, min: 0.01, max: 10000, visibleWhen: { shape: 'rect' } },
    { id: 'area_m2', label: 'Area', group: 'area', unit: 'm2', display: 'ft2', default: 18.58, min: 0.01, max: 1e7, visibleWhen: { shape: 'area' } },
    { id: 'depth_m', label: 'Depth after compaction', group: 'length', unit: 'm', display: 'in', default: 0.1016, min: 0.001, max: 5 },
    { id: 'material', label: 'Material', type: 'select', default: 'crushed_stone', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'density_kg_m3', label: 'Bulk density, loose', group: 'density', unit: 'kg_m3', display: 'lb_ft3', default: 1600, min: 300, max: 3000, visibleWhen: { material: 'custom' } },
    { id: 'compaction', label: 'Compaction and settlement allowance', group: 'ratio', unit: 'frac', display: 'pct', default: 0.1, min: 0, max: 0.5 },
    { id: 'truck_m3', label: 'Truck capacity by volume (your hauler)', group: 'volume', unit: 'm3', display: 'yd3', default: 10 * YD3, min: 0.1, max: 100 },
    { id: 'truck_kg', label: 'Truck payload by weight (your hauler)', group: 'mass', unit: 'kg', display: 'st', default: 15 * SHORT_TON, min: 100, max: 100000 },
    { id: 'price_t', label: 'Price per ton or tonne (optional)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 100000 },
    { id: 'price_basis', label: 'Price is per', type: 'select', default: 'short', options: [{ value: 'short', label: 'US short ton (2 000 lb)' }, { value: 'tonne', label: 'Metric tonne (1 000 kg)' }] },
  ],
  outputs: [
    { id: 'area_out_m2', label: 'Area covered', group: 'area', unit: 'm2', display: 'ft2' },
    { id: 'volume_m3', label: 'Volume in place', group: 'volume', unit: 'm3', display: 'yd3' },
    { id: 'order_m3', label: 'Volume to order, with compaction allowance', group: 'volume', unit: 'm3', display: 'yd3' },
    { id: 'order_ft3_m3', label: 'Volume to order in cubic feet', group: 'volume', unit: 'm3', display: 'ft3' },
    { id: 'mass_kg', label: 'Weight to order', group: 'mass', unit: 'kg', display: 'st' },
    { id: 'mass_t_kg', label: 'Weight to order in metric tonnes', group: 'mass', unit: 'kg', display: 't' },
    { id: 'density_used', label: 'Bulk density used', group: 'density', unit: 'kg_m3', display: 'lb_ft3' },
    { id: 'loads', label: 'Truck loads', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'cost', label: 'Material cost', group: 'money', unit: 'cur' },
  ],
  example: {
    inputs: { shape: 'rect', length_m: [20, 'ft'], width_m: [10, 'ft'], depth_m: [4, 'in'], material: 'crushed_stone', compaction: [10, 'pct'], price_t: 40, price_basis: 'short' },
    results: { volume_m3: '2.47 yd³', order_m3: '2.72 yd³', mass_kg: '3.66 short ton', cost: '146.50' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.shape, ['rect', 'area'], 'shape', 'Area given as');
  assertOneOf(x.material, Object.keys(MATERIALS), 'material', 'Material');
  assertOneOf(x.price_basis, ['short', 'tonne'], 'price_basis', 'Price is per');
  const area = x.shape === 'rect'
    ? assertPositive(x.length_m, 'length_m', 'Length') * assertPositive(x.width_m, 'width_m', 'Width')
    : assertPositive(x.area_m2, 'area_m2', 'Area');
  const d = assertPositive(x.depth_m, 'depth_m', 'Depth');
  const rho = x.material === 'custom' ? assertRange(x.density_kg_m3, 300, 3000, 'density_kg_m3', 'Bulk density') : MATERIALS[x.material].kg_m3;
  const c = assertRange(x.compaction, 0, 0.5, 'compaction', 'Compaction and settlement allowance');
  const vTruck = assertPositive(x.truck_m3, 'truck_m3', 'Truck capacity by volume');
  const mTruck = assertPositive(x.truck_kg, 'truck_kg', 'Truck payload by weight');
  const price = assertNonNegative(x.price_t, 'price_t', 'Price per ton');

  const volume = area * d;
  const order = volume * (1 + c);
  const mass = order * rho;
  const loads = Math.max(Math.ceil(order / vTruck - 1e-9), Math.ceil(mass / mTruck - 1e-9));
  const tons = x.price_basis === 'short' ? mass / SHORT_TON : mass / 1000;
  const warnings = [];
  if (d < 0.05) warnings.push('Depth under 2 in (50 mm): thin for a path or driveway base, which is usually several inches thick and compacted in layers.');
  if (x.material === 'topsoil' && c < 0.15) warnings.push('Topsoil settles a lot after placing; an allowance of 15 to 25 % is common.');
  return {
    outputs: {
      area_out_m2: area,
      volume_m3: volume,
      order_m3: order,
      order_ft3_m3: order,
      mass_kg: mass,
      mass_t_kg: mass,
      density_used: rho,
      loads,
      cost: price > 0 ? tons * price : null,
    },
    warnings,
  };
}
