/**
 * flow-rate-velocity/calc.js — the continuity equation for a full pipe: velocity from flow and bore, flow from velocity
 * and bore, or the bore needed for a flow at a target velocity, with a check against usual design velocities.
 *
 * Q = V A,  A = π D² / 4;  D = √(4 Q / (π V)).
 * Schema units: SI — m³/s, m/s, m.
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';

// Usual design velocities for liquid lines (m/s). Ranges from Crane TP-410 and common plant and marine practice:
// pump suction 0.6–1.5, pump discharge and general water 1–3, oil lines 0.5–2.
export const SERVICES = {
  water: { label: 'Water, general or pump discharge (1.0–3.0 m/s)', min: 1.0, max: 3.0 },
  suction: { label: 'Pump suction (0.6–1.5 m/s)', min: 0.6, max: 1.5 },
  oil: { label: 'Fuel or lubricating oil (0.5–2.0 m/s)', min: 0.5, max: 2.0 },
  none: { label: 'No check', min: null, max: null },
};

export const schema = {
  id: 'flow-rate-velocity',
  name: 'Flow rate and pipe velocity',
  category: 'thermal',
  summary: 'Velocity from flow rate and pipe bore, flow from velocity, or the bore needed for a flow at a target velocity, checked against usual design velocities.',
  related: ['pipe-flow', 'pipe-volume', 'reynolds-number', 'pump-affinity'],
  assumptions: [
    'The pipe runs full with an incompressible fluid, so the mean velocity is the flow divided by the bore area (continuity); gases at high pressure drop need the local density.',
    'The velocity is the mean over the cross-section; the centre-line velocity is higher (about 1.2 times in turbulent flow, twice in laminar flow).',
    'The design-velocity ranges are common practice, not a code requirement; noise, erosion, water hammer and the allowable pressure drop decide the final size.',
  ],
  notes: [
    'Verification 2026-11-07: 50 m³/h in a 100 mm bore is 1.77 m/s; for 2 m/s the bore would be 94.0 mm. Checked by hand.',
    'Design decision: the bore mode returns the exact diameter; choosing the next standard pipe size above it is left to the user, because bores depend on the pipe standard and wall thickness.',
  ],
  sources: [
    'White, F. M., Fluid Mechanics, 7th ed., ch. 3 (continuity: Q = V A)',
    'Crane Co., Flow of Fluids Through Valves, Fittings and Pipe, Technical Paper 410 (reasonable velocities for liquid lines)',
  ],
  inputs: [
    { id: 'solve_for', label: 'Find', type: 'select', default: 'velocity', options: [{ value: 'velocity', label: 'Velocity from flow and bore' }, { value: 'flow', label: 'Flow from velocity and bore' }, { value: 'diameter', label: 'Bore for a flow at a target velocity' }] },
    { id: 'flow_m3_s', label: 'Flow rate Q', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 50 / 3600, min: 0, max: 1000, visibleWhen: { solve_for: ['velocity', 'diameter'] } },
    { id: 'velocity_m_s', label: 'Mean velocity V', group: 'speed', unit: 'm_s', default: 2, min: 0, max: 200, visibleWhen: { solve_for: ['flow', 'diameter'] } },
    { id: 'diameter_m', label: 'Inside diameter (bore) D', group: 'length', unit: 'm', display: 'mm', default: 0.1, min: 1e-4, max: 20, visibleWhen: { solve_for: ['velocity', 'flow'] } },
    { id: 'service', label: 'Check against', type: 'select', default: 'water', options: Object.entries(SERVICES).map(([value, s]) => ({ value, label: s.label })) },
  ],
  outputs: [
    { id: 'velocity_out_m_s', label: 'Mean velocity V', group: 'speed', unit: 'm_s' },
    { id: 'flow_out_m3_s', label: 'Flow rate Q', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'flow_l_s', label: 'Flow rate in L/s', group: 'volume_flow', unit: 'm3_s', display: 'L_s' },
    { id: 'diameter_out_m', label: 'Inside diameter D', group: 'length', unit: 'm', display: 'mm' },
    { id: 'area_m2', label: 'Bore area A', group: 'area', unit: 'm2', display: 'cm2' },
    { id: 'check', label: 'Velocity check', type: 'text' },
  ],
  example: {
    inputs: { solve_for: 'velocity', flow_m3_s: [50, 'm3_h'], diameter_m: [100, 'mm'], service: 'water' },
    results: {
      velocity_out_m_s: '1.77 m/s',
      area_m2: '78.5 cm²',
    },
  },
};

export const area = (d) => (Math.PI * d * d) / 4;

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.solve_for, ['velocity', 'flow', 'diameter'], 'solve_for', 'Find');
  assertOneOf(x.service, Object.keys(SERVICES), 'service', 'Check against');
  let q;
  let v;
  let d;
  if (x.solve_for === 'velocity') {
    q = assertPositive(x.flow_m3_s, 'flow_m3_s', 'Flow rate');
    d = assertPositive(x.diameter_m, 'diameter_m', 'Inside diameter');
    v = q / area(d);
  } else if (x.solve_for === 'flow') {
    v = assertPositive(x.velocity_m_s, 'velocity_m_s', 'Mean velocity');
    d = assertPositive(x.diameter_m, 'diameter_m', 'Inside diameter');
    q = v * area(d);
  } else {
    q = assertPositive(x.flow_m3_s, 'flow_m3_s', 'Flow rate');
    v = assertPositive(x.velocity_m_s, 'velocity_m_s', 'Mean velocity');
    d = Math.sqrt((4 * q) / (Math.PI * v));
  }
  const s = SERVICES[x.service];
  let check = 'Not checked';
  const warnings = [];
  if (s.min !== null) {
    if (v < s.min) check = `Below the usual ${s.min}–${s.max} m/s: a smaller pipe would do, but solids may settle at very low velocity`;
    else if (v > s.max) { check = `Above the usual ${s.min}–${s.max} m/s: expect more pressure drop, noise and erosion`; warnings.push('The velocity is above the usual range for this service; check the pressure drop and consider a larger pipe.'); }
    else check = `Within the usual ${s.min}–${s.max} m/s`;
  }
  return {
    outputs: { velocity_out_m_s: v, flow_out_m3_s: q, flow_l_s: q, diameter_out_m: d, area_m2: area(d), check },
    warnings,
  };
}
