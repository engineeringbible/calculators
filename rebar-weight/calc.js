/**
 * rebar-weight/calc.js — reinforcing bar weight and quantity: US bar sizes #3–#18 (ASTM A615) and metric 6–50 mm,
 * by pieces and length or as a grid in a slab at a spacing, with total length, weight and steel area per width.
 *
 * Metric: m' = 7 850 × π d²/4 = 0.006165 d² kg/m (d in mm). US: nominal area and unit weight of ASTM A615 Table 1.
 * Grid: bars across a span S at spacing s with cover c: N = floor((S − 2c)/s) + 1, each (L − 2c) long.
 * Schema units: SI — m, kg, m², fraction.
 */
import { withDefaults, assertPositive, assertOneOf, assertInteger, assertRange, assertNonNegative } from '../shared/validate.js';

const IN = 0.0254;
const LB_FT = 0.45359237 / 0.3048;

/** ASTM A615/A615M Table 1: bar number → [nominal diameter in, area in², weight lb/ft]. */
export const US_BARS = {
  '#3': [0.375, 0.11, 0.376], '#4': [0.5, 0.2, 0.668], '#5': [0.625, 0.31, 1.043], '#6': [0.75, 0.44, 1.502],
  '#7': [0.875, 0.6, 2.044], '#8': [1, 0.79, 2.67], '#9': [1.128, 1, 3.4], '#10': [1.27, 1.27, 4.303],
  '#11': [1.41, 1.56, 5.313], '#14': [1.693, 2.25, 7.65], '#18': [2.257, 4, 13.6],
};
/** Metric bar diameters, mm (EN 10080 / BS 4449 and common sizes). */
export const METRIC_BARS = [6, 8, 10, 12, 14, 16, 20, 25, 28, 32, 40, 50];

/** [diameter m, area m², mass kg/m] of a bar size. */
export function barData(size) {
  if (US_BARS[size]) { const [d, a, w] = US_BARS[size]; return [d * IN, a * IN * IN, w * LB_FT]; }
  const mm = Number(String(size).replace(/mm$/, ''));
  if (!METRIC_BARS.includes(mm)) throw new Error(`Bar size: unknown size "${size}".`);
  const d = mm / 1000;
  return [d, (Math.PI * d * d) / 4, 7850 * (Math.PI * d * d) / 4];
}

const barOptions = [
  ...Object.entries(US_BARS).map(([k, [d]]) => ({ value: k, label: `${k} (${d} in, US)` })),
  ...METRIC_BARS.map((d) => ({ value: `${d}mm`, label: `${d} mm (metric)` })),
];

export const schema = {
  id: 'rebar-weight',
  name: 'Rebar weight and quantity calculator',
  category: 'structural',
  summary: 'Rebar weight per foot or metre for US #3–#18 and metric bars, and the number, length and weight of bars in a slab grid at any spacing.',
  related: ['metal-weight', 'concrete-slab', 'concrete-volume', 'concrete-footing'],
  assumptions: [
    'US bars use the nominal areas and unit weights of ASTM A615/A615M Table 1; metric bars use 7 850 kg/m³ on the nominal diameter (0.006165 d² kg/m). Deformations do not change the nominal weight.',
    'In a grid, bars run the full length less the cover at both ends, and the first and last bars sit at the cover from the edges; N = floor((span − 2 × cover)/spacing) + 1 in each direction.',
    'Laps, hooks, bends, chairs and waste are added as one percentage; splice lengths depend on the bar size, concrete strength and code (ACI 318 Chapter 25, EN 1992-1-1 §8.7).',
    'The spacing and bar size come from the structural design; this page estimates quantities only.',
  ],
  notes: [
    'Verification 2026-11-07: a 20 × 20 ft slab with #4 at 12 in each way and 3 in cover takes 20 + 20 bars of 19.5 ft, 780 ft and 521 lb; 12 mm bars weigh 0.888 kg/m. Checked by hand.',
  ],
  sources: [
    'ASTM A615/A615M-22, Deformed and Plain Carbon-Steel Bars for Concrete Reinforcement, Table 1 (nominal dimensions and unit weights)',
    'EN 10080:2005 Steel for the reinforcement of concrete (nominal cross-section and mass per metre)',
    'ACI 318-19 Chapter 25 and EN 1992-1-1 §8.7 (lap lengths, for the allowance only)',
  ],
  inputs: [
    { id: 'bar', label: 'Bar size', type: 'select', default: '#4', options: barOptions },
    { id: 'mode', label: 'Quantity from', type: 'select', default: 'grid', options: [{ value: 'grid', label: 'A slab or wall grid at a spacing' }, { value: 'pieces', label: 'Number of pieces and their length' }] },
    { id: 'length_m', label: 'Slab length (grid) or bar length (pieces)', group: 'length', unit: 'm', display: 'ft', default: 6.096, min: 0.05, max: 10000 },
    { id: 'width_m', label: 'Slab width', group: 'length', unit: 'm', display: 'ft', default: 6.096, min: 0.05, max: 10000, visibleWhen: { mode: 'grid' } },
    { id: 'spacing_m', label: 'Bar spacing, both ways', group: 'length', unit: 'm', display: 'in', default: 0.3048, min: 0.02, max: 5, visibleWhen: { mode: 'grid' } },
    { id: 'cover_m', label: 'Edge cover', group: 'length', unit: 'm', display: 'in', default: 0.0762, min: 0, max: 1, visibleWhen: { mode: 'grid' } },
    { id: 'layers', label: 'Layers (1 = single mat, 2 = top and bottom)', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 6, integer: true, visibleWhen: { mode: 'grid' } },
    { id: 'pieces', label: 'Number of pieces', group: 'dimensionless', unit: 'none', default: 10, min: 1, max: 1e6, integer: true, visibleWhen: { mode: 'pieces' } },
    { id: 'laps', label: 'Laps, hooks and waste allowance', group: 'ratio', unit: 'frac', display: 'pct', default: 0, min: 0, max: 1 },
  ],
  outputs: [
    { id: 'diameter_m', label: 'Nominal bar diameter', group: 'length', unit: 'm', display: 'in' },
    { id: 'bar_area_m2', label: 'Area of one bar', group: 'area', unit: 'm2', display: 'in2' },
    { id: 'unit_kg_m', label: 'Weight per length', group: 'linear_density', unit: 'kg_m', display: 'lb_ft' },
    { id: 'bars', label: 'Number of bars', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'total_length_m', label: 'Total bar length with allowance', group: 'length', unit: 'm', display: 'ft' },
    { id: 'total_kg', label: 'Total weight', group: 'mass', unit: 'kg', display: 'lb' },
    { id: 'as_m2_m', label: 'Steel area per foot or metre of width (each way, per layer)', group: 'dimensionless', unit: 'none', decimals: 1 },
  ],
  example: {
    inputs: { bar: '#4', mode: 'grid', length_m: [20, 'ft'], width_m: [20, 'ft'], spacing_m: [12, 'in'], cover_m: [3, 'in'], layers: 1, laps: [0, 'pct'] },
    results: { bars: '40', total_length_m: '780 ft', total_kg: '521.0 lb' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['grid', 'pieces'], 'mode', 'Quantity from');
  const [d, area, unit] = barData(x.bar);
  const L = assertPositive(x.length_m, 'length_m', 'Length');
  const laps = assertRange(x.laps, 0, 1, 'laps', 'Laps, hooks and waste allowance');
  let bars; let length; let asPerWidth = null;
  const warnings = [];
  if (x.mode === 'pieces') {
    bars = assertInteger(x.pieces, 'pieces', 'Number of pieces');
    if (bars < 1) throw new Error('Number of pieces: enter 1 or more.');
    length = bars * L;
  } else {
    const W = assertPositive(x.width_m, 'width_m', 'Slab width');
    const s = assertPositive(x.spacing_m, 'spacing_m', 'Bar spacing');
    const c = assertNonNegative(x.cover_m, 'cover_m', 'Edge cover');
    const layers = assertInteger(x.layers, 'layers', 'Layers');
    if (2 * c >= Math.min(L, W)) throw new Error('Edge cover: twice the cover must be less than the slab length and width.');
    const nAlongL = Math.floor((W - 2 * c) / s + 1e-9) + 1; // bars running along L, spaced across W
    const nAlongW = Math.floor((L - 2 * c) / s + 1e-9) + 1;
    bars = (nAlongL + nAlongW) * layers;
    length = (nAlongL * (L - 2 * c) + nAlongW * (W - 2 * c)) * layers;
    const us = String(x.bar).startsWith('#');
    asPerWidth = us ? (area / (IN * IN)) * (0.3048 / s) : area * 1e6 * (1 / s); // in²/ft or mm²/m
    if (s < Math.max(0.025, 1.5 * d)) warnings.push('The clear gap between bars is very small for the concrete to pass; check the minimum spacing of ACI 318 §25.2 or EN 1992-1-1 §8.2.');
  }
  const total = length * (1 + laps);
  return {
    outputs: { diameter_m: d, bar_area_m2: area, unit_kg_m: unit, bars, total_length_m: total, total_kg: total * unit, as_m2_m: asPerWidth },
    warnings,
  };
}
