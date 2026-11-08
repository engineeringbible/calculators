/**
 * shared/concrete.js — premixed concrete bag yields, bag counts and weights shared by the concrete slab, footing,
 * column and bag calculators. DOM-free.
 *
 * Yield of a premix bag: 0.60 ft³ per 80 lb (US premix product data), i.e. 0.0075 ft³ per lb of dry mix, applied by
 * mass to the other bag sizes. 1 yd³ = 27 ft³ = 0.764554857984 m³.
 */

export const FT3_M3 = 0.028316846592;
export const YD3_M3 = 0.764554857984;
const LB_KG = 0.45359237;

/** Fresh volume per kilogram of dry premix, m³/kg: 0.60 ft³ per 80 lb. */
export const YIELD_M3_PER_KG = (0.6 * FT3_M3) / (80 * LB_KG);

/** Density of normal-weight concrete for the weight, kg/m³ (EN 1991-1-1 Table A.1; about 150 lb/ft³). */
export const CONCRETE_DENSITY_KG_M3 = 2400;

export const BAGS = {
  lb80: { label: '80 lb bag', kg: 80 * LB_KG },
  lb60: { label: '60 lb bag', kg: 60 * LB_KG },
  lb50: { label: '50 lb bag', kg: 50 * LB_KG },
  lb40: { label: '40 lb bag', kg: 40 * LB_KG },
  kg30: { label: '30 kg bag', kg: 30 },
  kg25: { label: '25 kg bag', kg: 25 },
  kg20: { label: '20 kg bag', kg: 20 },
};

export const bagOptions = () => Object.entries(BAGS).map(([value, b]) => ({ value, label: b.label }));

/** Fresh concrete volume made by one bag, m³. */
export const bagYieldM3 = (bag) => BAGS[bag].kg * YIELD_M3_PER_KG;

/** Exact number of bags for a volume in m³ (round up to buy). */
export const bagsFor = (volumeM3, bag) => volumeM3 / bagYieldM3(bag);

/** Bags to buy of every common size, as one line: "80 lb: 62 · 60 lb: 82 · …". */
export const bagSummary = (volumeM3, ids = ['lb80', 'lb60', 'lb50', 'lb40', 'kg25']) =>
  ids.map((id) => `${BAGS[id].label.replace(' bag', '')}: ${Math.ceil(bagsFor(volumeM3, id) - 1e-9)}`).join(' · ');

/** Standard inputs and outputs shared by the concrete pages. */
export const wasteInput = (def = 0.1) => ({ id: 'waste', label: 'Waste and spillage allowance', group: 'ratio', unit: 'frac', display: 'pct', default: def, min: 0, max: 0.5 });
export const bagInput = () => ({ id: 'bag', label: 'Premix bag size', type: 'select', default: 'lb80', options: bagOptions() });
export const priceInputs = () => [
  { id: 'price_readymix', label: 'Ready-mix price (optional, your local price)', group: 'price_per_volume', unit: 'cur_m3', display: 'cur_yd3', default: 0, min: 0, max: 100000 },
  { id: 'price_bag', label: 'Price per bag (optional)', group: 'money', unit: 'cur', default: 0, min: 0, max: 10000 },
];

/** Outputs for an order volume: bags of the chosen size, every size, weight and the two costs. */
export function orderOutputs(orderM3, netM3, bag, priceReadymix, priceBag) {
  const bags = Math.ceil(bagsFor(orderM3, bag) - 1e-9);
  return {
    bags,
    bags_all: bagSummary(orderM3),
    weight_kg: netM3 * CONCRETE_DENSITY_KG_M3,
    cost_readymix: priceReadymix > 0 ? orderM3 * priceReadymix : null,
    cost_bags: priceBag > 0 ? bags * priceBag : null,
  };
}

export const orderOutputSpecs = () => [
  { id: 'bags', label: 'Premix bags to buy (chosen size)', group: 'dimensionless', unit: 'none', decimals: 0 },
  { id: 'bags_all', label: 'Bags of each size', type: 'text' },
  { id: 'weight_kg', label: 'Weight of the concrete in place', group: 'mass', unit: 'kg', display: 'lb' },
  { id: 'cost_readymix', label: 'Ready-mix cost', group: 'money', unit: 'cur' },
  { id: 'cost_bags', label: 'Cost in bags', group: 'money', unit: 'cur' },
];
