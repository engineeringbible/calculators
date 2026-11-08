/**
 * asphalt/calc.js — hot-mix asphalt for a driveway, parking area or patch: compacted volume, tonnage from the
 * compacted density, waste allowance and cost per ton.
 *
 * V = A × t;  m = V × ρ_compacted;  m_order = m × (1 + waste);  cost = m_order × price per ton.
 * US rule of thumb: tons = yd² × in × 110 lb / 2 000 (ρ ≈ 146.7 lb/ft³).
 * Schema units: SI — m, m², m³, kg/m³, kg, currency.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertNonNegative } from '../shared/validate.js';

const SHORT_TON = 907.18474;
const LB_FT3 = 16.01846337396;

/** Typical compacted density of dense-graded hot-mix asphalt, 145 lb/ft³ ≈ 2 323 kg/m³ (NAPA/Penn State: 144–160 lb/ft³). */
export const HMA_DENSITY_KG_M3 = 145 * LB_FT3;

export const schema = {
  id: 'asphalt',
  name: 'Asphalt calculator: tons of hot mix',
  category: 'civil',
  summary: 'Tons of hot-mix asphalt for a driveway, parking area or patch from area and compacted thickness, with density, waste allowance and cost per ton.',
  related: ['gravel', 'concrete-slab', 'earthwork-volume', 'slope'],
  assumptions: [
    'The paved area is a rectangle, or an area you enter, paved to a uniform compacted thickness; for an irregular shape add the areas of simple pieces.',
    'Tonnage uses the compacted density of the mix in place, 145 lb/ft³ (2.32 t/m³) by default; dense-graded mixes weigh 144 to 160 lb/ft³, so use the density on your plant\'s mix design when you have it.',
    'The waste allowance covers uneven base, edges and material left in the truck and paver; 5 to 10 % is usual.',
    'The thickness is the compacted thickness; the loose mat behind the paver is thicker and the rollers compact it down.',
  ],
  notes: [
    'Verification 2026-11-08: a 12 × 50 ft driveway with 3 in compacted is 150 ft³ = 5.56 yd³; at 145 lb/ft³ that is 21 750 lb = 10.88 short ton, 11.42 short ton with 5 % waste, $1 142 at $100 per ton. Checked by hand.',
  ],
  sources: [
    'NAPA and Penn State, Constructing Quality Asphalt Pavements: Checklist Booklet (2025): compacted mix weighs 108 to 120 lb per yd² per inch, 144 to 160 lb/ft³',
    'NIST SP 811, Appendix B (1 ft³ = 0.0283168 m³; 1 lb = 0.45359237 kg; 1 short ton = 2 000 lb)',
  ],
  inputs: [
    { id: 'shape', label: 'Area given as', type: 'select', default: 'rect', options: [{ value: 'rect', label: 'Length and width' }, { value: 'area', label: 'Area' }] },
    { id: 'length_m', label: 'Length', group: 'length', unit: 'm', display: 'ft', default: 15.24, min: 0.01, max: 100000, visibleWhen: { shape: 'rect' } },
    { id: 'width_m', label: 'Width', group: 'length', unit: 'm', display: 'ft', default: 3.6576, min: 0.01, max: 1000, visibleWhen: { shape: 'rect' } },
    { id: 'area_m2', label: 'Area', group: 'area', unit: 'm2', display: 'ft2', default: 55.74, min: 0.01, max: 1e7, visibleWhen: { shape: 'area' } },
    { id: 'thickness_m', label: 'Compacted thickness', group: 'length', unit: 'm', display: 'in', default: 0.0762, min: 0.005, max: 1 },
    { id: 'density_kg_m3', label: 'Compacted density of the mix', group: 'density', unit: 'kg_m3', display: 'lb_ft3', default: HMA_DENSITY_KG_M3, min: 1500, max: 3000 },
    { id: 'waste', label: 'Waste allowance', group: 'ratio', unit: 'frac', display: 'pct', default: 0.05, min: 0, max: 0.5 },
    { id: 'price_t', label: 'Price per ton or tonne (optional)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 100000 },
    { id: 'price_basis', label: 'Price is per', type: 'select', default: 'short', options: [{ value: 'short', label: 'US short ton (2 000 lb)' }, { value: 'tonne', label: 'Metric tonne (1 000 kg)' }] },
  ],
  outputs: [
    { id: 'area_out_m2', label: 'Area paved', group: 'area', unit: 'm2', display: 'ft2' },
    { id: 'volume_m3', label: 'Compacted volume', group: 'volume', unit: 'm3', display: 'yd3' },
    { id: 'mass_kg', label: 'Asphalt, net', group: 'mass', unit: 'kg', display: 'st' },
    { id: 'order_kg', label: 'Asphalt to order, with waste', group: 'mass', unit: 'kg', display: 'st' },
    { id: 'order_t_kg', label: 'Asphalt to order in metric tonnes', group: 'mass', unit: 'kg', display: 't' },
    { id: 'spread_lb_yd2_in', label: 'Spread rate, lb per yd² per inch', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'cost', label: 'Asphalt cost', group: 'money', unit: 'cur' },
  ],
  example: {
    inputs: { shape: 'rect', length_m: [50, 'ft'], width_m: [12, 'ft'], thickness_m: [3, 'in'], density_kg_m3: [145, 'lb_ft3'], waste: [5, 'pct'], price_t: 100, price_basis: 'short' },
    results: { volume_m3: '5.56 yd³', mass_kg: '10.88 short ton', order_kg: '11.42 short ton', cost: '1 142' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.shape, ['rect', 'area'], 'shape', 'Area given as');
  assertOneOf(x.price_basis, ['short', 'tonne'], 'price_basis', 'Price is per');
  const area = x.shape === 'rect'
    ? assertPositive(x.length_m, 'length_m', 'Length') * assertPositive(x.width_m, 'width_m', 'Width')
    : assertPositive(x.area_m2, 'area_m2', 'Area');
  const t = assertPositive(x.thickness_m, 'thickness_m', 'Compacted thickness');
  const rho = assertRange(x.density_kg_m3, 1500, 3000, 'density_kg_m3', 'Compacted density of the mix');
  const waste = assertRange(x.waste, 0, 0.5, 'waste', 'Waste allowance');
  const price = assertNonNegative(x.price_t, 'price_t', 'Price per ton');

  const volume = area * t;
  const mass = volume * rho;
  const order = mass * (1 + waste);
  // lb per square yard per inch of thickness: ρ[lb/ft³] × 9 ft² × 1/12 ft
  const spread = (rho / LB_FT3) * 9 / 12;
  const tons = x.price_basis === 'short' ? order / SHORT_TON : order / 1000;
  const warnings = [];
  if (t < 0.0381) warnings.push('Compacted thickness under 1.5 in (38 mm): only suitable for a thin overlay or patch on a sound base; a new driveway needs a thicker course on a compacted aggregate base.');
  if (rho / LB_FT3 < 135 || rho / LB_FT3 > 165) warnings.push('Density outside 135 to 165 lb/ft³ (2.16 to 2.64 t/m³): unusual for dense-graded hot mix; check the mix design.');
  return {
    outputs: {
      area_out_m2: area,
      volume_m3: volume,
      mass_kg: mass,
      order_kg: order,
      order_t_kg: order,
      spread_lb_yd2_in: spread,
      cost: price > 0 ? tons * price : null,
    },
    warnings,
  };
}
