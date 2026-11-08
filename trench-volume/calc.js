/**
 * trench-volume/calc.js — trench and excavation volume with vertical or sloped (benched-equivalent) sides, the loose
 * volume to haul after swell, truck loads, and the backfill around a pipe.
 *
 * Cross-section of a trench with side slope n H : 1 V: A = (b + n d) d;  V_bank = A L;  V_loose = V_bank (1 + swell).
 * OSHA 29 CFR 1926 Subpart P Appendix B: stable rock vertical, Type A ¾ : 1, Type B 1 : 1, Type C 1½ : 1.
 * Schema units: SI — m, m³, fraction.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

export const SLOPES = {
  vertical: ['Vertical sides (shored, boxed or under 5 ft / 1.5 m)', 0],
  rock: ['OSHA stable rock: vertical', 0],
  typeA: ['OSHA Type A soil: ¾ H : 1 V (53°)', 0.75],
  typeB: ['OSHA Type B soil: 1 H : 1 V (45°)', 1],
  typeC: ['OSHA Type C soil: 1½ H : 1 V (34°)', 1.5],
  custom: ['Custom side slope', null],
};

export const schema = {
  id: 'trench-volume',
  name: 'Trench and excavation volume calculator',
  category: 'civil',
  summary: 'Volume of a trench or excavation with vertical or OSHA sloped sides, the loose volume and truck loads after swell, and backfill around a pipe.',
  related: ['earthwork-volume', 'slope', 'pipe-volume', 'concrete-footing'],
  assumptions: [
    'The trench has a flat bottom of constant width and uniform depth; for a varying depth, split it into lengths of similar depth. Sloped sides are symmetric at n horizontal to 1 vertical.',
    'OSHA slopes are the maximum allowable slopes of 29 CFR 1926 Subpart P Appendix B for excavations up to 20 ft (6 m) deep; a competent person classifies the soil, and deeper or wetter excavations need an engineered protective system.',
    'Swell (bulking) converts bank volume to loose volume for hauling: typically 10–20 % for sand and gravel, 25–35 % for common earth and clay, 50 % or more for blasted rock.',
    'Backfill is the trench volume less the pipe\'s outside volume; compaction may need 10–25 % more loose material than the bank volume it fills.',
  ],
  notes: [
    'Verification 2026-11-07: a 100 ft trench 2 ft wide and 4 ft deep is 800 ft³ = 29.63 yd³; with 25 % swell 37.04 yd³, four 10 yd³ loads. Checked by hand.',
  ],
  sources: [
    'OSHA 29 CFR 1926 Subpart P, Appendix B, Table B-1 (maximum allowable slopes) and 1926.652(a)(1) (excavations under 5 ft)',
    'Caterpillar Performance Handbook, edition 49, section "Tables" (swell factors of materials)',
  ],
  inputs: [
    { id: 'length_m', label: 'Trench length', group: 'length', unit: 'm', display: 'ft', default: 30.48, min: 0.01, max: 1e6 },
    { id: 'width_m', label: 'Bottom width', group: 'length', unit: 'm', display: 'ft', default: 0.6096, min: 0.01, max: 1000 },
    { id: 'depth_m', label: 'Depth', group: 'length', unit: 'm', display: 'ft', default: 1.2192, min: 0.01, max: 100 },
    { id: 'sides', label: 'Sides', type: 'select', default: 'vertical', options: Object.entries(SLOPES).map(([value, [label]]) => ({ value, label })) },
    { id: 'slope_n', label: 'Side slope n (horizontal per 1 vertical)', group: 'dimensionless', unit: 'none', default: 1, min: 0, max: 10, visibleWhen: { sides: 'custom' } },
    { id: 'swell', label: 'Swell when dug (bulking)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.25, min: 0, max: 1.5 },
    { id: 'truck_m3', label: 'Truck capacity (loose)', group: 'volume', unit: 'm3', display: 'yd3', default: 7.64554857984, min: 0.1, max: 1000 },
    { id: 'pipe_m', label: 'Pipe outside diameter (0 if none)', group: 'length', unit: 'm', display: 'in', default: 0, min: 0, max: 10 },
  ],
  outputs: [
    { id: 'top_width_m', label: 'Width at the top', group: 'length', unit: 'm', display: 'ft' },
    { id: 'bank_m3', label: 'Excavated volume (in the ground)', group: 'volume', unit: 'm3', display: 'yd3' },
    { id: 'bank_ft3_m3', label: 'Excavated volume in cubic feet', group: 'volume', unit: 'm3', display: 'ft3' },
    { id: 'loose_m3', label: 'Loose volume to haul', group: 'volume', unit: 'm3', display: 'yd3' },
    { id: 'loads', label: 'Truck loads', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'backfill_m3', label: 'Backfill (trench less pipe)', group: 'volume', unit: 'm3', display: 'yd3' },
  ],
  example: {
    inputs: { length_m: [100, 'ft'], width_m: [2, 'ft'], depth_m: [4, 'ft'], sides: 'vertical', swell: [25, 'pct'], truck_m3: [10, 'yd3'], pipe_m: [0, 'in'] },
    results: { bank_m3: '29.63 yd³', loose_m3: '37.04 yd³', loads: '4' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.sides, Object.keys(SLOPES), 'sides', 'Sides');
  const L = assertPositive(x.length_m, 'length_m', 'Trench length');
  const b = assertPositive(x.width_m, 'width_m', 'Bottom width');
  const d = assertPositive(x.depth_m, 'depth_m', 'Depth');
  const n = x.sides === 'custom' ? assertRange(x.slope_n, 0, 10, 'slope_n', 'Side slope') : SLOPES[x.sides][1];
  const swell = assertRange(x.swell, 0, 1.5, 'swell', 'Swell');
  const truck = assertPositive(x.truck_m3, 'truck_m3', 'Truck capacity');
  const pipe = assertNonNegative(x.pipe_m, 'pipe_m', 'Pipe outside diameter');
  if (pipe >= d || pipe > b) throw new Error('Pipe outside diameter: the pipe does not fit in the trench.');
  const area = (b + n * d) * d;
  const bank = area * L;
  const loose = bank * (1 + swell);
  const warnings = [];
  if (x.sides === 'vertical' && d >= 1.524) warnings.push('Vertical sides at 5 ft (1.5 m) or deeper need shoring, a trench box or sloping under OSHA 1926.652, unless the trench is in stable rock.');
  if (d > 6.096) warnings.push('Deeper than 20 ft (6 m): OSHA requires a protective system designed by a registered professional engineer.');
  return {
    outputs: {
      top_width_m: b + 2 * n * d,
      bank_m3: bank,
      bank_ft3_m3: bank,
      loose_m3: loose,
      loads: Math.ceil(loose / truck - 1e-9),
      backfill_m3: bank - (Math.PI / 4) * pipe * pipe * L,
    },
    warnings,
  };
}
