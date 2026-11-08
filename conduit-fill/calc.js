/**
 * conduit-fill/calc.js — conduit fill for THHN/THWN-2 conductors in EMT or PVC Schedule 40 under NEC Chapter 9:
 * percent fill of a chosen trade size, the smallest size that complies, and how many of one wire size fit.
 *
 * Fill = Σ n_i A_i / A_conduit;  limit 53 % (1 conductor), 31 % (2), 40 % (3 or more), 60 % (nipple ≤ 24 in).
 * Areas in square inches as listed in NEC Chapter 9 Table 4 (conduit) and Table 5 (conductors).
 * Schema units: SI — m² for areas, fraction for percentages.
 */
import { withDefaults, assertOneOf, assertInteger, assertNonNegative } from '../shared/validate.js';

const IN2_M2 = 0.00064516;

/** Trade sizes with metric designators. */
export const TRADE_SIZES = [
  ['1/2', '16'], ['3/4', '21'], ['1', '27'], ['1-1/4', '35'], ['1-1/2', '41'],
  ['2', '53'], ['2-1/2', '63'], ['3', '78'], ['3-1/2', '91'], ['4', '103'],
];

/** NEC Chapter 9 Table 4: internal diameter and total (100 %) area, in and in². */
export const CONDUITS = {
  emt: {
    label: 'EMT (electrical metallic tubing)',
    sizes: { '1/2': [0.622, 0.304], '3/4': [0.824, 0.533], '1': [1.049, 0.864], '1-1/4': [1.38, 1.496], '1-1/2': [1.61, 2.036], '2': [2.067, 3.356], '2-1/2': [2.731, 5.858], '3': [3.356, 8.846], '3-1/2': [3.834, 11.545], '4': [4.334, 14.753] },
  },
  pvc40: {
    label: 'PVC Schedule 40 (rigid PVC conduit)',
    sizes: { '1/2': [0.602, 0.285], '3/4': [0.804, 0.508], '1': [1.029, 0.832], '1-1/4': [1.36, 1.453], '1-1/2': [1.59, 1.986], '2': [2.047, 3.291], '2-1/2': [2.445, 4.695], '3': [3.042, 7.268], '3-1/2': [3.521, 9.737], '4': [3.998, 12.554] },
  },
};

/** NEC Chapter 9 Table 5: THHN, THWN, THWN-2 approximate diameter (in) and area (in²). */
export const WIRES = {
  '14': [0.111, 0.0097], '12': [0.13, 0.0133], '10': [0.164, 0.0211], '8': [0.216, 0.0366], '6': [0.254, 0.0507],
  '4': [0.324, 0.0824], '3': [0.352, 0.0973], '2': [0.384, 0.1158], '1': [0.446, 0.1562],
  '1/0': [0.486, 0.1855], '2/0': [0.532, 0.2223], '3/0': [0.584, 0.2679], '4/0': [0.642, 0.3237],
  '250': [0.711, 0.397], '300': [0.766, 0.4608], '350': [0.817, 0.5242], '400': [0.864, 0.5863], '500': [0.949, 0.7073],
};

const wireLabel = (w) => (Number(w) >= 250 ? `${w} kcmil` : `${w} AWG`);
const wireOptions = Object.keys(WIRES).map((w) => ({ value: w, label: wireLabel(w) }));
const sizeOptions = TRADE_SIZES.map(([s, m]) => ({ value: s, label: `${s} in (metric ${m})` }));

/** NEC Chapter 9 Table 1 and Note 4. */
export function fillLimit(count, nipple) {
  if (nipple) return 0.6;
  if (count === 1) return 0.53;
  if (count === 2) return 0.31;
  return 0.4;
}

/** Most conductors of one size that fit, with Chapter 9 Note 7 (a fraction of 0.8 or more rounds up). */
export function maxSameSize(conduitArea, wireArea, nipple) {
  for (const n of [1, 2]) if (n * wireArea > fillLimit(n, nipple) * conduitArea) return n - 1;
  const exact = (fillLimit(3, nipple) * conduitArea) / wireArea;
  const n = exact - Math.floor(exact) >= 0.8 - 1e-9 ? Math.ceil(exact) : Math.floor(exact);
  return n >= 3 ? n : 2;
}

const group = (k, wire, count) => [
  { id: `wire${k}`, label: `Wire ${k}: size (THHN/THWN-2)`, type: 'select', default: wire, options: wireOptions },
  { id: `count${k}`, label: `Wire ${k}: number of conductors, including grounds`, group: 'dimensionless', unit: 'none', default: count, min: 0, max: 500, integer: true },
];

export const schema = {
  id: 'conduit-fill',
  name: 'Conduit fill calculator (NEC)',
  category: 'electrical',
  summary: 'Percent fill and the smallest EMT or PVC conduit for THHN wires under NEC Chapter 9, with how many wires of one size fit in each trade size.',
  related: ['wire-size', 'breaker-size', 'awg-wire-gauge', 'cable-sizing'],
  assumptions: [
    'Conductors are THHN, THWN or THWN-2 copper building wire, with the areas of NEC Chapter 9 Table 5. Other insulations (XHHW, RHW, USE) and compact conductors have different areas.',
    'Conduit areas are the NEC Chapter 9 Table 4 values for EMT (Article 358) and PVC Schedule 40 (Article 352). Equipment grounding and bonding conductors count in the fill (Chapter 9 Note 3).',
    'The fill limit is 53 % for one conductor, 31 % for two and 40 % for three or more (Chapter 9 Table 1); a nipple of 24 in or less may be filled to 60 % (Note 4).',
    'The number of one wire size that fits uses Note 7: when the count has a decimal of 0.8 or more, the next whole number is allowed.',
    'Fill is one check among several: ampacity adjustment for more than three current-carrying conductors (310.15(C)(1)), pulling tension and jam ratio are not covered.',
  ],
  notes: [
    'Verification 2026-11-07: the Steel Tube Institute worked example (3 × 12, 4 × 10 and 8 × 8 AWG THWN, 0.4171 in²) needs 1-1/4 in EMT, since the 40 % area of 1 in EMT is 0.346 in² and of 1-1/4 in is 0.598 in². Table 4 and 5 values cross-checked against published fill tables (1 in EMT 0.864 in², 1 in PVC 40 0.832 in², 1/0 THHN 0.1855 in², 300 kcmil 0.4608 in²).',
  ],
  sources: [
    'NFPA 70, National Electrical Code (2023), Chapter 9: Table 1 (percent fill), Notes 3, 4 and 7, Table 4 (Articles 352 and 358 dimensions), Table 5 (THHN/THWN/THWN-2 dimensions)',
    'Steel Tube Institute, "NEC Conduit and EMT Fill Tables" (worked example for EMT), steeltubeinstitute.org',
  ],
  inputs: [
    { id: 'conduit', label: 'Conduit type', type: 'select', default: 'emt', options: Object.entries(CONDUITS).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'size', label: 'Trade size to check', type: 'select', default: '1', options: sizeOptions },
    { id: 'nipple', label: 'Run length', type: 'select', default: 'no', options: [{ value: 'no', label: 'Normal run' }, { value: 'yes', label: 'Nipple, 24 in or shorter (60 % fill)' }] },
    ...group(1, '12', 3),
    ...group(2, '10', 4),
    ...group(3, '8', 8),
  ],
  outputs: [
    { id: 'count', label: 'Number of conductors', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'wire_area_m2', label: 'Total conductor area', group: 'area', unit: 'm2', display: 'in2' },
    { id: 'limit', label: 'Fill limit (NEC Chapter 9 Table 1)', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'fill', label: 'Fill of the chosen conduit', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'allowed_m2', label: 'Allowed area in the chosen conduit', group: 'area', unit: 'm2', display: 'in2' },
    { id: 'status', label: 'Chosen conduit', type: 'text' },
    { id: 'smallest', label: 'Smallest conduit that complies', type: 'text' },
    { id: 'max_wire1', label: 'Most wires of size 1 alone in the chosen conduit', group: 'dimensionless', unit: 'none', decimals: 0 },
  ],
  example: {
    inputs: { conduit: 'emt', size: '1', nipple: 'no', wire1: '12', count1: 3, wire2: '10', count2: 4, wire3: '8', count3: 8 },
    results: { count: '15', wire_area_m2: '0.4171 in²', fill: '48.3 %', allowed_m2: '0.3456 in²' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.conduit, Object.keys(CONDUITS), 'conduit', 'Conduit type');
  assertOneOf(x.size, TRADE_SIZES.map(([s]) => s), 'size', 'Trade size to check');
  assertOneOf(x.nipple, ['no', 'yes'], 'nipple', 'Run length');
  const nipple = x.nipple === 'yes';
  let count = 0;
  let area = 0;
  for (const k of [1, 2, 3]) {
    assertOneOf(String(x[`wire${k}`]), Object.keys(WIRES), `wire${k}`, `Wire ${k}: size`);
    const n = assertInteger(assertNonNegative(x[`count${k}`], `count${k}`, `Wire ${k}: number of conductors`), `count${k}`, `Wire ${k}: number of conductors`);
    count += n;
    area += n * WIRES[String(x[`wire${k}`])][1];
  }
  if (count === 0) throw new Error('Number of conductors: enter at least one conductor.');

  const sizes = CONDUITS[x.conduit].sizes;
  const limit = fillLimit(count, nipple);
  const conduitArea = sizes[x.size][1];
  const allowed = limit * conduitArea;
  const ok = area <= allowed + 1e-9;
  const smallest = TRADE_SIZES.find(([s]) => area <= limit * sizes[s][1] + 1e-9);
  const warnings = [];
  if (!smallest) warnings.push('No trade size up to 4 in is large enough: split the conductors between two conduits or use larger conduit.');
  if (count > 3 && !nipple) warnings.push('More than three current-carrying conductors in one raceway: derate their ampacity per NEC 310.15(C)(1) (grounds and most neutrals are not counted).');

  return {
    outputs: {
      count,
      wire_area_m2: area * IN2_M2,
      limit,
      fill: area / conduitArea,
      allowed_m2: allowed * IN2_M2,
      status: ok ? `OK: ${(area / conduitArea * 100).toFixed(1)} % of ${x.size} in is within ${limit * 100} %` : `Too full: ${x.size} in allows ${allowed.toFixed(4)} in²`,
      smallest: smallest ? `${smallest[0]} in (metric ${smallest[1]})` : 'Larger than 4 in',
      max_wire1: maxSameSize(conduitArea, WIRES[String(x.wire1)][1], nipple),
    },
    warnings,
  };
}
