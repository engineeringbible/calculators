/**
 * hazen-williams/calc.js — Hazen–Williams friction loss for water in full pressure pipes: head loss from flow and
 * diameter, or the flow or the diameter for an allowed head loss, with velocity and pressure drop.
 *
 * SI: h_f = 10.67 L Q^1.852 / (C^1.852 d^4.8704), from V = 0.849 C R_h^0.63 S^0.54 with R_h = d/4.
 * US equivalent (NFPA 13): p = 4.52 Q^1.85 / (C^1.85 d^4.87) psi per foot, Q in gpm, d in inches.
 * Δp = ρ g h_f with ρ = 999.1 kg/m³ (water at 15 °C).  Schema units: SI — m, m³/s, m/s, Pa.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';

const G = 9.80665;
/** Water at 15 °C (IAPWS-95 / CRC Handbook), kg/m³. */
const RHO_WATER_15C = 999.1;
/** SI constant of the head-loss form: (0.849 × π/4 × 4^−0.63)^−1.852 = 10.67. */
const K_SI = 10.67;
const N_Q = 1.852;
const N_D = 4.8704;

/** Hazen–Williams C values, NFPA 13 (2025) Table 28.3.4.8.1, plus the AWWA M23 value for PVC. */
export const C_FACTORS = {
  plastic: { label: 'PVC, CPVC or PE plastic pipe (C = 150)', c: 150 },
  copper: { label: 'Copper tube, brass or stainless steel (C = 150)', c: 150 },
  di_lined: { label: 'Cement-lined cast or ductile iron (C = 140)', c: 140 },
  asbestos: { label: 'Asbestos cement (C = 140)', c: 140 },
  concrete: { label: 'Concrete (C = 140)', c: 140 },
  steel_wet: { label: 'Black steel, wet systems (C = 120)', c: 120 },
  galv_wet: { label: 'Galvanized steel, wet systems (C = 120)', c: 120 },
  steel_dry: { label: 'Black or galvanized steel, dry systems (C = 100)', c: 100 },
  iron_unlined: { label: 'Unlined cast or ductile iron (C = 100)', c: 100 },
  custom: { label: 'Other: enter C', c: null },
};

/** Head loss h_f (m) over length L (m) for flow Q (m³/s) in bore d (m) with factor C. */
export const headLoss = (L, Q, C, d) => (K_SI * L * Q ** N_Q) / (C ** N_Q * d ** N_D);

export const schema = {
  id: 'hazen-williams',
  name: 'Hazen–Williams head loss calculator',
  category: 'mechanical',
  summary: 'Hazen–Williams friction loss of water in a pressure pipe, or the flow or pipe diameter for an allowed loss, with velocity, pressure drop and C-factors.',
  related: ['total-dynamic-head', 'pipe-flow', 'minor-losses', 'flow-rate-velocity'],
  assumptions: [
    'Hazen–Williams is an empirical formula for water at ordinary temperatures, about 15 °C (60 °F), in full pipes in turbulent flow; it ignores viscosity, so it does not apply to oils, hot water or other liquids, where Darcy–Weisbach must be used.',
    'It is normally used for pipes of about 50 mm (2 in) bore and larger at velocities of about 0.3 to 3 m/s (1 to 10 ft/s); outside that range it can differ widely from Darcy–Weisbach, and the page warns.',
    'C values are the design values of NFPA 13 Table 28.3.4.8.1, the same for every pipe size; old, corroded or tuberculated pipe can fall well below them, and the authority having jurisdiction may require other values.',
    'Only straight-pipe friction is calculated: add fittings and valves as equivalent length or with the minor losses calculator, and elevation separately. The pressure drop uses water at 15 °C (999.1 kg/m³).',
  ],
  notes: [
    'Verification 2026-11-08: 500 US gpm of water through 1 000 ft of 6 in bore pipe with C = 150 loses 15.7 ft (6.82 psi) at 5.67 ft/s; the NFPA 13 form 4.52 Q^1.85/(C^1.85 d^4.87) gives 6.81 psi for the same pipe. Checked by hand.',
    'Verification: 20 L/s through 1 000 m of 150 mm PVC (C = 150) gives 7.32 m by Hazen–Williams and 7.25 m by Darcy–Weisbach with Colebrook (ε = 0.0015 mm, ν = 1.139 mm²/s at 15 °C, shared/pipes.js), 1 % apart.',
    'Constants: 10.67 and the exponents 1.852 and 4.8704 follow from the velocity form V = 0.849 C R^0.63 S^0.54; converted to psi per foot with Q in gpm and d in inches they give 4.523, the NFPA 13 constant 4.52 to 0.1 %.',
  ],
  sources: [
    'Williams, G.S. & Hazen, A., Hydraulic Tables, 3rd ed., Wiley, 1920 (V = 1.318 C R^0.63 S^0.54 in US units, 0.849 in SI)',
    'NFPA 13, Standard for the Installation of Sprinkler Systems, 2025 ed., hydraulic calculation formula p = 4.52 Q^1.85/(C^1.85 d^4.87) and Table 28.3.4.8.1 Hazen–Williams C values',
    'AWWA Manual M23, PVC Pipe — Design and Installation (C = 150 for PVC)',
  ],
  inputs: [
    { id: 'solve', label: 'Solve for', type: 'select', default: 'headloss', options: [{ value: 'headloss', label: 'Head loss from flow and diameter' }, { value: 'flow', label: 'Flow from head loss and diameter' }, { value: 'diameter', label: 'Diameter from flow and head loss' }] },
    { id: 'material', label: 'Pipe material (C-factor)', type: 'select', default: 'plastic', options: Object.entries(C_FACTORS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'c_custom', label: 'Hazen–Williams C', group: 'dimensionless', unit: 'none', default: 130, min: 40, max: 160, visibleWhen: { material: 'custom' } },
    { id: 'length_m', label: 'Pipe length L', group: 'length', unit: 'm', display: 'ft', default: 304.8, min: 0.1, max: 1e6 },
    { id: 'flow_m3s', label: 'Flow rate Q', group: 'volume_flow', unit: 'm3_s', display: 'gpm_us', default: 500 * 0.003785411784 / 60, min: 1e-6, max: 100, visibleWhen: { solve: ['headloss', 'diameter'] } },
    { id: 'diameter_m', label: 'Inside diameter d', group: 'length', unit: 'm', display: 'in', default: 6 * 0.0254, min: 0.005, max: 5, visibleWhen: { solve: ['headloss', 'flow'] } },
    { id: 'headloss_m', label: 'Allowed head loss h_f', group: 'length', unit: 'm', display: 'ft', default: 4.8, min: 1e-4, max: 1e5, visibleWhen: { solve: ['flow', 'diameter'] } },
  ],
  outputs: [
    { id: 'c_used', label: 'C-factor used', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'headloss_out_m', label: 'Friction head loss h_f', group: 'length', unit: 'm', display: 'ft' },
    { id: 'dp_pa', label: 'Pressure drop ρ g h_f', group: 'pressure', unit: 'Pa', display: 'psi' },
    { id: 'per_100', label: 'Head loss per 100 ft of pipe (ft), or per 100 m (m)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'flow_out_m3s', label: 'Flow rate Q', group: 'volume_flow', unit: 'm3_s', display: 'gpm_us' },
    { id: 'diameter_out_m', label: 'Inside diameter d', group: 'length', unit: 'm', display: 'in' },
    { id: 'velocity_m_s', label: 'Mean velocity', group: 'speed', unit: 'm_s', display: 'ft_s' },
  ],
  example: {
    inputs: { solve: 'headloss', material: 'plastic', length_m: [1000, 'ft'], flow_m3s: [500, 'gpm_us'], diameter_m: [6, 'in'] },
    results: { headloss_out_m: '15.7 ft', dp_pa: '6.82 psi', per_100: '1.57', velocity_m_s: '5.67 ft/s' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.solve, ['headloss', 'flow', 'diameter'], 'solve', 'Solve for');
  assertOneOf(x.material, Object.keys(C_FACTORS), 'material', 'Pipe material');
  const C = x.material === 'custom' ? assertRange(x.c_custom, 40, 160, 'c_custom', 'Hazen–Williams C') : C_FACTORS[x.material].c;
  const L = assertPositive(x.length_m, 'length_m', 'Pipe length');
  let Q; let d; let h;
  if (x.solve === 'headloss') {
    Q = assertPositive(x.flow_m3s, 'flow_m3s', 'Flow rate');
    d = assertPositive(x.diameter_m, 'diameter_m', 'Inside diameter');
    h = headLoss(L, Q, C, d);
  } else if (x.solve === 'flow') {
    h = assertPositive(x.headloss_m, 'headloss_m', 'Allowed head loss');
    d = assertPositive(x.diameter_m, 'diameter_m', 'Inside diameter');
    Q = ((h * C ** N_Q * d ** N_D) / (K_SI * L)) ** (1 / N_Q);
  } else {
    h = assertPositive(x.headloss_m, 'headloss_m', 'Allowed head loss');
    Q = assertPositive(x.flow_m3s, 'flow_m3s', 'Flow rate');
    d = ((K_SI * L * Q ** N_Q) / (C ** N_Q * h)) ** (1 / N_D);
  }
  const v = Q / ((Math.PI / 4) * d * d);
  const warnings = [];
  if (v < 0.3) warnings.push('Velocity below about 0.3 m/s (1 ft/s): Hazen–Williams is outside its usual range here; check with Darcy–Weisbach.');
  if (v > 3) warnings.push('Velocity above about 3 m/s (10 ft/s): Hazen–Williams is outside its usual range, and water hammer and erosion become concerns; check with Darcy–Weisbach.');
  if (d < 0.05) warnings.push('Bore below 50 mm (2 in): Hazen–Williams was fitted to larger pipes; Darcy–Weisbach is more reliable for small tubes.');
  return {
    outputs: {
      c_used: C,
      headloss_out_m: h,
      dp_pa: RHO_WATER_15C * G * h,
      per_100: (100 * h) / L,
      flow_out_m3s: Q,
      diameter_out_m: d,
      velocity_m_s: v,
    },
    warnings,
  };
}
