/**
 * btu-ac-size/calc.js — air conditioner size for a room in Btu/h, kW and tons from the floor area, with the ENERGY
 * STAR adjustments for sun, occupants and kitchens.
 *
 * Base capacity from the ENERGY STAR room air conditioner sizing chart (100–2 500 ft², 8 ft ceilings), then ×0.9 for a
 * heavily shaded room or ×1.1 for a very sunny one, +600 Btu/h per person beyond two, +4 000 Btu/h for a kitchen.
 * Schema units: SI — m, m², W (Btu/h and tons as display units).
 */
import { withDefaults, assertPositive, assertOneOf, assertInteger, assertNonNegative } from '../shared/validate.js';

const FT2_M2 = 0.09290304;
const BTU_H_W = 0.29307107017;

/** ENERGY STAR room air conditioner sizing: [area from, area up to (ft²), capacity (Btu/h)]. */
export const ENERGY_STAR_CHART = [
  [100, 150, 5000], [150, 250, 6000], [250, 300, 7000], [300, 350, 8000], [350, 400, 9000], [400, 450, 10000],
  [450, 550, 12000], [550, 700, 14000], [700, 1000, 18000], [1000, 1200, 21000], [1200, 1400, 23000],
  [1400, 1500, 24000], [1500, 2000, 30000], [2000, 2500, 34000],
];

/** Chart capacity for an area in ft²; rooms under 100 ft² take the smallest size; null above 2 500 ft². */
export function chartBtuH(areaFt2) {
  if (areaFt2 < 100) return 5000;
  const row = ENERGY_STAR_CHART.find(([a, b]) => areaFt2 >= a && areaFt2 < b) ?? (areaFt2 === 2500 ? ENERGY_STAR_CHART[ENERGY_STAR_CHART.length - 1] : null);
  return row ? row[2] : null;
}

export const schema = {
  id: 'btu-ac-size',
  name: 'BTU calculator: AC size for a room',
  category: 'hvac',
  summary: 'Air conditioner size in BTU, kW and tons for a room from its floor area, with the ENERGY STAR adjustments for sun, people and kitchens.',
  related: ['heat-loss', 'air-changes', 'dew-point', 'electricity-cost'],
  assumptions: [
    'Capacities follow the ENERGY STAR room air conditioner sizing chart for rooms of 100 to 2 500 ft² (9 to 232 m²) with ceilings of about 8 ft (2.4 m) in a typical climate; taller ceilings, large windows, poor insulation or a very hot climate need more.',
    'ENERGY STAR adjustments: reduce 10 % for a heavily shaded room, add 10 % for a very sunny one, add 600 Btu/h for each regular occupant beyond two, and add 4 000 Btu/h for a kitchen.',
    'This sizes a room or window unit or a single mini-split head. A whole house with central air needs a room-by-room load calculation such as ACCA Manual J.',
    'An oversized unit cools the air quickly but removes little moisture and cycles often; buy the size the chart gives rather than the next one up.',
  ],
  notes: [
    'Verification 2026-11-07: a 14 × 20 ft room (280 ft²) is 7 000 Btu/h on the chart; very sunny with three people gives 7 700 + 600 = 8 300 Btu/h, 2.43 kW, 0.69 ton.',
  ],
  sources: [
    'ENERGY STAR, Room Air Conditioner sizing chart and adjustments (U.S. EPA and DOE), energystar.gov',
    'ACCA Manual J, Residential Load Calculation, 8th edition (whole-house loads; named for scope only)',
  ],
  inputs: [
    { id: 'length_m', label: 'Room length', group: 'length', unit: 'm', display: 'ft', default: 6.096, min: 0.5, max: 200 },
    { id: 'width_m', label: 'Room width', group: 'length', unit: 'm', display: 'ft', default: 4.2672, min: 0.5, max: 200 },
    { id: 'sun', label: 'Sun on the room', type: 'select', default: 'sunny', options: [{ value: 'normal', label: 'Normal' }, { value: 'shaded', label: 'Heavily shaded (−10 %)' }, { value: 'sunny', label: 'Very sunny (+10 %)' }] },
    { id: 'people', label: 'People regularly in the room', group: 'dimensionless', unit: 'none', default: 3, min: 0, max: 100, integer: true },
    { id: 'kitchen', label: 'Is it a kitchen?', type: 'select', default: 'no', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes (+4 000 Btu/h)' }] },
  ],
  outputs: [
    { id: 'area_m2', label: 'Floor area', group: 'area', unit: 'm2', display: 'ft2' },
    { id: 'chart_w', label: 'Chart capacity for the area', group: 'power', unit: 'W', display: 'btu_h' },
    { id: 'capacity_w', label: 'Air conditioner size needed', group: 'power', unit: 'W', display: 'btu_h' },
    { id: 'capacity_kw_w', label: 'Size in kW (cooling)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'capacity_tons_w', label: 'Size in tons of refrigeration', group: 'power', unit: 'W', display: 'ton_r' },
    { id: 'rule_w', label: 'Rule of thumb, 20 Btu/h per ft², for comparison', group: 'power', unit: 'W', display: 'btu_h' },
  ],
  example: {
    inputs: { length_m: [20, 'ft'], width_m: [14, 'ft'], sun: 'sunny', people: 3, kitchen: 'no' },
    results: { area_m2: '280 ft²', chart_w: '7 000 Btu/h', capacity_w: '8 300 Btu/h', capacity_kw_w: '2.43 kW' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.sun, ['normal', 'shaded', 'sunny'], 'sun', 'Sun on the room');
  assertOneOf(x.kitchen, ['no', 'yes'], 'kitchen', 'Is it a kitchen?');
  const area = assertPositive(x.length_m, 'length_m', 'Room length') * assertPositive(x.width_m, 'width_m', 'Room width');
  const people = assertInteger(assertNonNegative(x.people, 'people', 'People'), 'people', 'People');
  const ft2 = Math.round((area / FT2_M2) * 1e6) / 1e6; // so 300 ft² entered in feet is not 299.99999
  const base = chartBtuH(ft2);
  const warnings = [];
  if (base === null) throw new Error('Room length and width: the area is above 2 500 ft² (232 m²), beyond the room air conditioner chart; a central system needs a Manual J load calculation.');
  if (ft2 < 100) warnings.push('Below 100 ft² (9 m²): the smallest room units, 5 000 Btu/h, are already enough.');
  let btu = base * (x.sun === 'shaded' ? 0.9 : x.sun === 'sunny' ? 1.1 : 1);
  btu += 600 * Math.max(0, people - 2);
  if (x.kitchen === 'yes') btu += 4000;
  const w = btu * BTU_H_W;
  return {
    outputs: {
      area_m2: area,
      chart_w: base * BTU_H_W,
      capacity_w: w,
      capacity_kw_w: w,
      capacity_tons_w: w,
      rule_w: 20 * ft2 * BTU_H_W,
    },
    warnings,
  };
}
