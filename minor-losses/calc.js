/**
 * minor-losses/calc.js — pressure and head loss through pipe fittings and valves by the Crane K method: K of each fitting
 * from f_T × L/D, the total K, the head and pressure loss and the equivalent length of straight pipe.
 *
 * h = ΣK v² / (2g);  Δp = ρ g h;  L_eq = ΣK D / f_T.  K and f_T from shared/pipes.js.
 * Schema units: SI — m, m³/s, kg/m³, Pa.
 */
import { withDefaults, assertPositive, assertRange, assertInteger, assertNonNegative } from '../shared/validate.js';
import { FITTINGS, fittingsK, G } from '../shared/pipes.js';

const count = (id, def) => ({ id, label: FITTINGS[id].label, group: 'dimensionless', unit: 'none', default: def, min: 0, max: 1000, integer: true });

export const schema = {
  id: 'minor-losses',
  name: 'Minor losses calculator (pipe fittings and valves)',
  category: 'mechanical',
  summary: 'Head and pressure loss through elbows, tees, valves, entrances and exits by the Crane K method, with total K and the equivalent pipe length.',
  related: ['total-dynamic-head', 'pipe-flow', 'pump-power', 'flow-rate-velocity'],
  assumptions: [
    'Resistance coefficients by the Crane TP-410 method: K = f_T × L/D with f_T the fully turbulent friction factor of clean steel pipe of the same bore. The method suits turbulent flow; in laminar flow fitting losses are higher than these K values give.',
    'Fittings are fully open and separated by at least a few diameters; closely coupled fittings interact and can lose more. Valve K values vary by make; use the manufacturer\'s K or C_v where available.',
    'The velocity is the mean velocity in the pipe bore; for a fitting between two sizes, use the K and velocity of the smaller bore.',
    'The equivalent length is the straight pipe that would lose the same head at the fully turbulent friction factor; at lower Reynolds numbers the real friction factor is higher and the equivalent length shorter.',
  ],
  notes: [
    'Verification 2026-11-07: 10 m³/h of water in a 52.5 mm bore (2 in Sch 40) at 1.28 m/s through 4 standard elbows, a gate valve, a swing check, an entrance and an exit: f_T = 0.0190, ΣK = 5.84, 0.490 m and 4.80 kPa. Checked by hand.',
  ],
  sources: [
    'Crane Co., Technical Paper No. 410 (2018), eq. 2-11 (h_L = K v²/2g) and Appendix A (representative resistance coefficients K and L/D)',
  ],
  inputs: [
    { id: 'diameter_m', label: 'Pipe inside diameter', group: 'length', unit: 'm', display: 'mm', default: 0.0525, min: 0.002, max: 5 },
    { id: 'flow_m3s', label: 'Flow rate', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 10 / 3600, min: 1e-8, max: 100 },
    { id: 'density', label: 'Liquid density', group: 'density', unit: 'kg_m3', default: 998, min: 1, max: 2500 },
    count('elbow90', 4), count('bend90', 0), count('elbow45', 0), count('tee_run', 0), count('tee_branch', 0),
    count('gate', 1), count('ball', 0), count('butterfly', 0), count('globe', 0), count('check_swing', 1),
    count('entrance', 1), count('exit', 1),
    { id: 'extra_k', label: 'Other K to add (strainers, meters, from data sheets)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 1e4 },
  ],
  outputs: [
    { id: 'velocity_m_s', label: 'Velocity in the pipe', group: 'speed', unit: 'm_s' },
    { id: 'vhead_m', label: 'Velocity head v² / 2g', group: 'length', unit: 'm' },
    { id: 'ft', label: 'Fully turbulent friction factor f_T', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'k_total', label: 'Total resistance coefficient ΣK', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'head_m', label: 'Head loss in the fittings', group: 'length', unit: 'm' },
    { id: 'dp_pa', label: 'Pressure loss in the fittings', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'leq_m', label: 'Equivalent length of straight pipe', group: 'length', unit: 'm' },
  ],
  example: {
    inputs: {},
    results: { k_total: '5.836', head_m: '0.490 m', dp_pa: '4.80 kPa' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const d = assertPositive(x.diameter_m, 'diameter_m', 'Pipe inside diameter');
  const Q = assertPositive(x.flow_m3s, 'flow_m3s', 'Flow rate');
  const rho = assertRange(x.density, 1, 2500, 'density', 'Liquid density');
  const extra = assertNonNegative(x.extra_k, 'extra_k', 'Other K');
  const counts = {};
  for (const id of Object.keys(FITTINGS)) counts[id] = assertInteger(assertNonNegative(x[id], id, FITTINGS[id].label), id, FITTINGS[id].label);
  const { fT, K } = fittingsK(counts, d);
  const total = K + extra;
  const v = Q / ((Math.PI / 4) * d * d);
  const vh = (v * v) / (2 * G);
  const h = total * vh;
  const warnings = [];
  if (total === 0) warnings.push('No fittings entered: the minor loss is zero.');
  if (v > 3) warnings.push('Velocity above 3 m/s (10 ft/s): losses, noise and erosion rise quickly; a larger pipe may pay back.');
  return {
    outputs: { velocity_m_s: v, vhead_m: vh, ft: fT, k_total: total, head_m: h, dp_pa: rho * G * h, leq_m: (total * d) / fT },
    warnings,
  };
}
