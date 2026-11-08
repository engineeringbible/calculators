/**
 * bernoulli/calc.js — Bernoulli's equation between two points on a streamline: the pressure at point 2 from the
 * pressure, velocity and height at point 1, the velocity and height at point 2, and an optional head loss.
 * Velocity at point 2 is entered directly or found from the two bores by continuity (venturi, reducer, nozzle).
 *
 * p₁ + ½ρV₁² + ρg z₁ = p₂ + ½ρV₂² + ρg z₂ + ρg h_L;  continuity V₂ = V₁ (D₁/D₂)².
 * Schema units: SI — Pa, m/s, m, kg/m³.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative, assertFinite, assertOneOf } from '../shared/validate.js';
import { fluidOptions, densityOf } from '../shared/fluids.js';

export const schema = {
  id: 'bernoulli',
  name: "Bernoulli's equation and venturi",
  category: 'thermal',
  summary: "Pressure at a second point from Bernoulli's equation, with velocity from the bores (venturi, reducer, nozzle), height change and head loss.",
  related: ['orifice-flow', 'flow-rate-velocity', 'pipe-flow', 'hydrostatic-pressure'],
  assumptions: [
    'Steady, incompressible flow along a streamline; for liquids, and for gases only where the pressure changes by less than about 10 %.',
    'Without a head loss the flow is frictionless; real flows lose energy, which is entered as a head loss (from the pipe flow calculator or a fitting\'s K value).',
    'Both pressures use the same reference, both gauge or both absolute; the cavitation check needs absolute pressures.',
    'Velocities are mean velocities, and the bores at the two points set them through continuity; the kinetic-energy correction factor of a non-uniform profile is taken as 1.',
  ],
  notes: [
    'Verification 2026-11-07: water at 1 m/s through a 100 to 50 mm venturi at 200 kPa reaches 4 m/s and 192.5 kPa (a 7.49 kPa drop); a 10 m rise at constant velocity loses 97.9 kPa. Checked by hand.',
  ],
  sources: [
    'White, F. M., Fluid Mechanics, 7th ed., ch. 3.5 (Bernoulli equation) and ch. 3.6 (energy equation with head loss)',
    'Çengel and Cimbala, Fluid Mechanics: Fundamentals and Applications, 4th ed., ch. 5 (Bernoulli and energy equations, venturi meter)',
  ],
  inputs: [
    { id: 'fluid', label: 'Fluid', type: 'select', default: 'water_20c', options: fluidOptions(['water_20c', 'seawater_15c', 'mgo_40c', 'hfo_50c', 'lube_oil_40c', 'custom']) },
    { id: 'rho_kg_m3', label: 'Density ρ', group: 'density', unit: 'kg_m3', default: 1000, min: 1, max: 25000, visibleWhen: { fluid: 'custom' } },
    { id: 'reference', label: 'Pressures are', type: 'select', default: 'gauge', options: [{ value: 'gauge', label: 'Gauge (above atmosphere)' }, { value: 'absolute', label: 'Absolute' }] },
    { id: 'p1_pa', label: 'Pressure at point 1, p₁', group: 'pressure', unit: 'Pa', display: 'kPa', default: 200000, min: -101325, max: 1e9 },
    { id: 'v1_m_s', label: 'Velocity at point 1, V₁', group: 'speed', unit: 'm_s', default: 1, min: 0, max: 500 },
    { id: 'z1_m', label: 'Height of point 1, z₁', group: 'length', unit: 'm', default: 0, min: -1e5, max: 1e5 },
    { id: 'v2_mode', label: 'Velocity at point 2 from', type: 'select', default: 'bores', options: [{ value: 'bores', label: 'The two bores (continuity)' }, { value: 'direct', label: 'A known velocity' }] },
    { id: 'd1_m', label: 'Bore at point 1, D₁', group: 'length', unit: 'm', display: 'mm', default: 0.1, min: 1e-4, max: 20, visibleWhen: { v2_mode: 'bores' } },
    { id: 'd2_m', label: 'Bore at point 2, D₂', group: 'length', unit: 'm', display: 'mm', default: 0.05, min: 1e-4, max: 20, visibleWhen: { v2_mode: 'bores' } },
    { id: 'v2_m_s', label: 'Velocity at point 2, V₂', group: 'speed', unit: 'm_s', default: 4, min: 0, max: 500, visibleWhen: { v2_mode: 'direct' } },
    { id: 'z2_m', label: 'Height of point 2, z₂', group: 'length', unit: 'm', default: 0, min: -1e5, max: 1e5 },
    { id: 'head_loss_m', label: 'Head loss between the points h_L', group: 'length', unit: 'm', default: 0, min: 0, max: 1e5 },
  ],
  outputs: [
    { id: 'p2_pa', label: 'Pressure at point 2, p₂', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'dp_pa', label: 'Pressure change p₁ − p₂', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'v2_out_m_s', label: 'Velocity at point 2, V₂', group: 'speed', unit: 'm_s' },
    { id: 'dynamic1_pa', label: 'Dynamic pressure at 1, ½ρV₁²', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'dynamic2_pa', label: 'Dynamic pressure at 2, ½ρV₂²', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'total_head_m', label: 'Total head at point 1, p₁/ρg + V₁²/2g + z₁', group: 'length', unit: 'm' },
    { id: 'flow_m3_s', label: 'Flow rate (bores mode)', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
  ],
  example: {
    inputs: { fluid: 'water_20c', reference: 'gauge', p1_pa: [200, 'kPa'], v1_m_s: [1, 'm_s'], z1_m: [0, 'm'], v2_mode: 'bores', d1_m: [100, 'mm'], d2_m: [50, 'mm'], z2_m: [0, 'm'], head_loss_m: [0, 'm'] },
    results: {
      v2_out_m_s: '4 m/s',
      p2_pa: '192.5 kPa',
      dp_pa: '7.49 kPa',
    },
  },
};

/** Pressure at point 2 from Bernoulli's equation with a head loss. */
export function pressureAt2({ rho, p1, v1, z1, v2, z2, headLoss = 0 }) {
  return p1 + 0.5 * rho * (v1 * v1 - v2 * v2) + rho * GRAVITY_M_S2 * (z1 - z2 - headLoss);
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.reference, ['gauge', 'absolute'], 'reference', 'Pressures are');
  assertOneOf(x.v2_mode, ['bores', 'direct'], 'v2_mode', 'Velocity at point 2 from');
  const rho = densityOf(x.fluid, x.rho_kg_m3);
  const p1 = assertFinite(x.p1_pa, 'p1_pa', 'Pressure at point 1');
  const v1 = assertNonNegative(x.v1_m_s, 'v1_m_s', 'Velocity at point 1');
  const z1 = assertFinite(x.z1_m, 'z1_m', 'Height of point 1');
  const z2 = assertFinite(x.z2_m, 'z2_m', 'Height of point 2');
  const headLoss = assertNonNegative(x.head_loss_m, 'head_loss_m', 'Head loss');
  let v2;
  let flow = null;
  if (x.v2_mode === 'bores') {
    const d1 = assertPositive(x.d1_m, 'd1_m', 'Bore at point 1');
    const d2 = assertPositive(x.d2_m, 'd2_m', 'Bore at point 2');
    v2 = v1 * (d1 / d2) ** 2;
    flow = v1 * Math.PI * d1 * d1 / 4;
  } else {
    v2 = assertNonNegative(x.v2_m_s, 'v2_m_s', 'Velocity at point 2');
  }
  if (x.reference === 'absolute' && p1 <= 0) throw new Error(`Pressure at point 1 must be above zero when pressures are absolute (got ${p1})`);
  const p2 = pressureAt2({ rho, p1, v1, z1, v2, z2, headLoss });
  const absoluteP2 = x.reference === 'absolute' ? p2 : p2 + 101325;
  const warnings = [];
  if (absoluteP2 <= 0) warnings.push('The pressure at point 2 comes out below absolute zero: the flow cannot do this; it would cavitate or separate long before.');
  else if (rho > 500 && absoluteP2 < 2340) warnings.push('The absolute pressure at point 2 is below the vapour pressure of water at 20 °C (2.34 kPa): expect cavitation.');
  if (x.fluid === 'air_20c') warnings.push('For air, Bernoulli holds only while the pressure changes by less than about 10 %.');
  return {
    outputs: {
      p2_pa: p2,
      dp_pa: p1 - p2,
      v2_out_m_s: v2,
      dynamic1_pa: 0.5 * rho * v1 * v1,
      dynamic2_pa: 0.5 * rho * v2 * v2,
      total_head_m: p1 / (rho * GRAVITY_M_S2) + (v1 * v1) / (2 * GRAVITY_M_S2) + z1,
      flow_m3_s: flow,
    },
    warnings,
  };
}
