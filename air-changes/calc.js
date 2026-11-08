/**
 * air-changes/calc.js — air changes per hour (ACH) and airflow in CFM, m³/h and L/s for a room, both ways, and the
 * ASHRAE 62.2 whole-dwelling ventilation rate.
 *
 * ACH = Q × 3600 / V (Q in m³/s, V in m³), i.e. ACH = 60 × CFM / ft³;  Q = ACH × V / 3600.
 * ASHRAE 62.2: Q_tot = 0.03 A_floor + 7.5 (N_br + 1) cfm (A in ft²) = 0.15 A + 3.5 (N_br + 1) L/s (A in m²).
 * Schema units: SI — m, m², m³, m³/s.
 */
import { withDefaults, assertPositive, assertOneOf, assertInteger, assertNonNegative, assertRange } from '../shared/validate.js';

const CFM_M3S = 0.028316846592 / 60;
const FT2_M2 = 0.09290304;

export const schema = {
  id: 'air-changes',
  name: 'Air changes per hour (ACH) and CFM calculator',
  category: 'hvac',
  summary: 'Air changes per hour from a room’s airflow, or the CFM, m³/h and L/s for a target ACH, plus the ASHRAE 62.2 whole-house ventilation rate.',
  related: ['air-density', 'btu-ac-size', 'dew-point', 'heat-loss'],
  assumptions: [
    'The room volume is length × width × ceiling height; furniture is ignored. ACH counts the outdoor or supply air delivered, assuming it mixes through the room.',
    'Recommended air changes depend on the use and the code in force: ventilation codes (ASHRAE 62.1 and 62.2, EN 16798-1) set rates per person and per floor area, which this page converts to ACH, rather than a single ACH figure.',
    'ASHRAE 62.2 gives the total mechanical ventilation for a whole dwelling from its conditioned floor area and number of bedrooms; infiltration credits and local exhaust requirements are not included.',
  ],
  notes: [
    'Verification 2026-11-07: a 12 × 15 × 8 ft room (1 440 ft³) at 6 ACH needs 144 cfm (245 m³/h, 68 L/s); a 2 000 ft² three-bedroom house needs 90 cfm under ASHRAE 62.2. Checked by hand.',
  ],
  sources: [
    'ANSI/ASHRAE Standard 62.2-2022, Ventilation and Acceptable Indoor Air Quality in Residential Buildings, 4.1.1 (Q_tot = 0.03 A_floor + 7.5 (N_br + 1))',
    'ASHRAE Handbook — Fundamentals, Chapter 16 Ventilation and Infiltration (air change rate definition)',
  ],
  inputs: [
    { id: 'mode', label: 'Find', type: 'select', default: 'flow', options: [{ value: 'flow', label: 'Airflow for a target ACH' }, { value: 'ach', label: 'ACH from a known airflow' }, { value: 'dwelling', label: 'Whole-house ventilation (ASHRAE 62.2)' }] },
    { id: 'length_m', label: 'Room length', group: 'length', unit: 'm', display: 'ft', default: 4.572, min: 0.1, max: 1000, visibleWhen: { mode: ['flow', 'ach'] } },
    { id: 'width_m', label: 'Room width', group: 'length', unit: 'm', display: 'ft', default: 3.6576, min: 0.1, max: 1000, visibleWhen: { mode: ['flow', 'ach'] } },
    { id: 'floor_m2', label: 'Conditioned floor area of the dwelling', group: 'area', unit: 'm2', display: 'ft2', default: 185.80608, min: 1, max: 100000, visibleWhen: { mode: 'dwelling' } },
    { id: 'bedrooms', label: 'Number of bedrooms', group: 'dimensionless', unit: 'none', default: 3, min: 0, max: 50, integer: true, visibleWhen: { mode: 'dwelling' } },
    { id: 'height_m', label: 'Ceiling height', group: 'length', unit: 'm', display: 'ft', default: 2.4384, min: 1, max: 50 },
    { id: 'ach_target', label: 'Air changes per hour wanted', group: 'dimensionless', unit: 'none', default: 6, min: 0.01, max: 500, visibleWhen: { mode: 'flow' } },
    { id: 'flow_m3s', label: 'Airflow into the room', group: 'volume_flow', unit: 'm3_s', display: 'cfm', default: 100 * CFM_M3S, min: 1e-6, max: 1000, visibleWhen: { mode: 'ach' } },
  ],
  outputs: [
    { id: 'volume_m3', label: 'Volume', group: 'volume', unit: 'm3', display: 'ft3' },
    { id: 'flow_cfm_m3s', label: 'Airflow', group: 'volume_flow', unit: 'm3_s', display: 'cfm' },
    { id: 'flow_m3h_m3s', label: 'Airflow in m³/h', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'flow_ls_m3s', label: 'Airflow in L/s', group: 'volume_flow', unit: 'm3_s', display: 'L_s' },
    { id: 'ach', label: 'Air changes per hour', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'minutes', label: 'Minutes per air change', group: 'dimensionless', unit: 'none', decimals: 1 },
  ],
  example: {
    inputs: { mode: 'flow', length_m: [15, 'ft'], width_m: [12, 'ft'], height_m: [8, 'ft'], ach_target: 6 },
    results: { volume_m3: '1 440 ft³', flow_cfm_m3s: '144 cfm', flow_m3h_m3s: '245 m³/h', flow_ls_m3s: '68.0 L/s' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['flow', 'ach', 'dwelling'], 'mode', 'Find');
  const h = assertPositive(x.height_m, 'height_m', 'Ceiling height');
  let volume;
  let flow;
  if (x.mode === 'dwelling') {
    const area = assertPositive(x.floor_m2, 'floor_m2', 'Conditioned floor area');
    const nbr = assertInteger(assertNonNegative(x.bedrooms, 'bedrooms', 'Number of bedrooms'), 'bedrooms', 'Number of bedrooms');
    volume = area * h;
    flow = (0.03 * (area / FT2_M2) + 7.5 * (nbr + 1)) * CFM_M3S;
  } else {
    volume = assertPositive(x.length_m, 'length_m', 'Room length') * assertPositive(x.width_m, 'width_m', 'Room width') * h;
    flow = x.mode === 'flow'
      ? (assertRange(x.ach_target, 0.01, 500, 'ach_target', 'Air changes per hour') * volume) / 3600
      : assertPositive(x.flow_m3s, 'flow_m3s', 'Airflow into the room');
  }
  const ach = (flow * 3600) / volume;
  const warnings = [];
  if (x.mode !== 'dwelling' && ach < 0.35) warnings.push('Below 0.35 ACH, the old ASHRAE 62 minimum for homes: stale air and moisture can build up.');
  return {
    outputs: { volume_m3: volume, flow_cfm_m3s: flow, flow_m3h_m3s: flow, flow_ls_m3s: flow, ach, minutes: 60 / ach },
    warnings,
  };
}
