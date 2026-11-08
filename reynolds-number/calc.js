/**
 * reynolds-number/calc.js — Reynolds number and flow regime for a circular pipe, a non-circular duct (hydraulic
 * diameter), a flat plate, or any characteristic length.
 *
 * Re = V L / ν = ρ V L / μ;  pipe L = D;  duct L = D_h = 4 A / P_wetted;  plate L = distance from the leading edge.
 * Schema units: SI — m, m/s, m³/s, m², kg/m³, m²/s.
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';
import { FLUIDS, fluidOptions } from '../shared/fluids.js';

export { FLUIDS };

// Regime limits. Internal flow: laminar below 2300, turbulent above 4000 (Moody 1944; White, Fluid Mechanics, ch. 6).
// Flat plate: transition at about 5 × 10⁵ for a smooth plate in a quiet stream (White, ch. 7; Schlichting).
export const PIPE_LAMINAR = 2300;
export const PIPE_TURBULENT = 4000;
export const PLATE_TRANSITION = 5e5;

export const schema = {
  id: 'reynolds-number',
  name: 'Reynolds number and flow regime',
  category: 'thermal',
  summary: 'Reynolds number for a pipe, a non-circular duct, a flat plate or any length, from velocity or flow, with the regime: laminar, transitional or turbulent.',
  related: ['pipe-flow', 'orifice-flow', 'control-valve-cv', 'heat-exchanger-lmtd'],
  assumptions: [
    'The fluid is Newtonian and its density and viscosity are uniform over the length considered; for a heated or cooled flow use the properties at the mean bulk temperature.',
    'Pipe and duct flow is fully developed internal flow running full; the limits 2300 and 4000 are the usual engineering bounds of the transitional range, and a very smooth, vibration-free pipe can stay laminar to much higher Reynolds numbers.',
    'A non-circular duct is represented by its hydraulic diameter D_h = 4 A / P; this is accurate for turbulent flow and only approximate for laminar flow in shapes far from a circle.',
    'The flat-plate regime uses a transition at Re_x ≈ 5 × 10⁵ for a smooth plate in a low-turbulence stream; roughness or free-stream turbulence can trip the boundary layer far earlier.',
    'Built-in fluid properties are reference values at the stated temperature; oils and fuels vary widely between grades, so use the custom fluid with the data sheet values when it matters.',
  ],
  notes: [
    'Verification 2026-11-07: water at 20 °C, 1.5 m/s in a 50 mm bore gives Re = 74 701 by hand; a 300 × 200 mm duct has D_h = 0.24 m; the fluid table (shared/fluids.js) is identical to pipe-flow so the two calculators agree.',
    'Design decision: the regime text names the geometry\'s own limits, because the same Reynolds number is turbulent in a pipe and laminar on a plate.',
  ],
  sources: [
    'Reynolds, O. (1883) An experimental investigation of the circumstances which determine whether the motion of water shall be direct or sinuous, Phil. Trans. R. Soc. 174, 935–982',
    'White, F. M., Fluid Mechanics, 7th ed., ch. 6 (pipe flow, Re = ρVD/μ, transition near 2300, hydraulic diameter) and ch. 7 (flat-plate boundary layer, transition near 5 × 10⁵)',
    'Moody, L. F. (1944) Friction factors for pipe flow, Trans. ASME 66, 671–684 (laminar, critical and turbulent zones)',
    'ITTC Recommended Procedure 7.5-02-01-03 (2011), fresh water and sea water density and viscosity',
  ],
  inputs: [
    {
      id: 'geometry',
      label: 'Geometry',
      type: 'select',
      default: 'pipe',
      options: [
        { value: 'pipe', label: 'Circular pipe running full (L = inside diameter)' },
        { value: 'duct', label: 'Non-circular duct (L = hydraulic diameter 4A/P)' },
        { value: 'plate', label: 'Flat plate (L = distance from the leading edge)' },
        { value: 'length', label: 'Any characteristic length' },
      ],
    },
    {
      id: 'known',
      label: 'Flow given as',
      type: 'select',
      default: 'velocity',
      options: [
        { value: 'velocity', label: 'Velocity' },
        { value: 'flow', label: 'Volume flow rate' },
      ],
      visibleWhen: { geometry: ['pipe', 'duct'] },
    },
    { id: 'velocity_m_s', label: 'Mean velocity V', group: 'speed', unit: 'm_s', default: 1.5, min: 0, max: 1000 },
    { id: 'flow_m3_s', label: 'Volume flow rate Q', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 0.01, min: 0, max: 1000, visibleWhen: { geometry: ['pipe', 'duct'], known: 'flow' } },
    { id: 'diameter_m', label: 'Pipe inside diameter D', group: 'length', unit: 'm', display: 'mm', default: 0.05, min: 1e-5, max: 20, visibleWhen: { geometry: 'pipe' } },
    { id: 'area_m2', label: 'Duct flow area A', group: 'area', unit: 'm2', default: 0.06, min: 1e-8, max: 1000, visibleWhen: { geometry: 'duct' }, help: 'A 300 × 200 mm rectangle is 0.06 m².' },
    { id: 'perimeter_m', label: 'Duct wetted perimeter P', group: 'length', unit: 'm', default: 1, min: 1e-5, max: 1000, visibleWhen: { geometry: 'duct' }, help: 'A 300 × 200 mm rectangle is 1.0 m.' },
    { id: 'length_m', label: 'Characteristic length L', group: 'length', unit: 'm', default: 1, min: 1e-6, max: 1e5, visibleWhen: { geometry: ['plate', 'length'] } },
    { id: 'fluid', label: 'Fluid', type: 'select', default: 'water_20c', options: fluidOptions() },
    { id: 'rho_kg_m3', label: 'Density ρ', group: 'density', unit: 'kg_m3', default: 998.2, min: 0.01, max: 25000, visibleWhen: { fluid: 'custom' } },
    { id: 'nu_m2_s', label: 'Kinematic viscosity ν', group: 'kinematic_viscosity', unit: 'm2_s', display: 'cSt', default: 1.004e-6, min: 1e-9, max: 1, visibleWhen: { fluid: 'custom' }, help: 'Dynamic viscosity μ divided by density: 1 cSt = 1 mm²/s.' },
  ],
  outputs: [
    { id: 'reynolds', label: 'Reynolds number Re', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'regime', label: 'Flow regime', type: 'text' },
    { id: 'length_used_m', label: 'Characteristic length used', group: 'length', unit: 'm', display: 'mm' },
    { id: 'velocity_used_m_s', label: 'Velocity used', group: 'speed', unit: 'm_s' },
    { id: 'nu_used_m2_s', label: 'Kinematic viscosity used', group: 'kinematic_viscosity', unit: 'm2_s', display: 'cSt' },
    { id: 'mu_pa_s', label: 'Dynamic viscosity μ = ρ ν', group: 'dynamic_viscosity', unit: 'Pa_s', display: 'mPa_s' },
    { id: 'critical_velocity_m_s', label: 'Velocity at the start of transition (Re 2300 or 5 × 10⁵)', group: 'speed', unit: 'm_s' },
  ],
  example: {
    inputs: { geometry: 'pipe', known: 'velocity', velocity_m_s: [1.5, 'm_s'], diameter_m: [50, 'mm'], fluid: 'water_20c' },
    results: {
      reynolds: '74 700',
      critical_velocity_m_s: '0.046 m/s',
    },
  },
};

/** Reynolds number from velocity, characteristic length and kinematic viscosity. */
export function reynolds(velocity, length, nu) {
  return (velocity * length) / nu;
}

/** Hydraulic diameter of a duct from its flow area and wetted perimeter. */
export function hydraulicDiameter(area, perimeter) {
  return (4 * area) / perimeter;
}

/** Regime text with the limits that apply to the geometry. */
export function regimeOf(geometry, re) {
  if (geometry === 'plate') return re < PLATE_TRANSITION ? 'Laminar boundary layer (Re below about 5 × 10⁵)' : 'Turbulent boundary layer (Re above about 5 × 10⁵)';
  if (geometry === 'length') return 'Depends on the geometry: internal flow turns turbulent near 2300 to 4000, a flat plate near 5 × 10⁵';
  if (re < PIPE_LAMINAR) return 'Laminar (Re below 2300)';
  if (re <= PIPE_TURBULENT) return 'Transitional (Re 2300 to 4000): unstable, friction is uncertain';
  return 'Turbulent (Re above 4000)';
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.geometry, ['pipe', 'duct', 'plate', 'length'], 'geometry', 'Geometry');
  assertOneOf(x.fluid, Object.keys(FLUIDS), 'fluid', 'Fluid');
  const internal = x.geometry === 'pipe' || x.geometry === 'duct';
  const byFlow = internal && x.known === 'flow';
  if (internal) assertOneOf(x.known, ['velocity', 'flow'], 'known', 'Flow given as');

  let length;
  let area;
  if (x.geometry === 'pipe') {
    length = assertPositive(x.diameter_m, 'diameter_m', 'Pipe inside diameter');
    area = (Math.PI * length * length) / 4;
  } else if (x.geometry === 'duct') {
    area = assertPositive(x.area_m2, 'area_m2', 'Duct flow area');
    length = hydraulicDiameter(area, assertPositive(x.perimeter_m, 'perimeter_m', 'Duct wetted perimeter'));
  } else {
    length = assertPositive(x.length_m, 'length_m', 'Characteristic length');
  }
  const velocity = byFlow ? assertPositive(x.flow_m3_s, 'flow_m3_s', 'Volume flow rate') / area : assertPositive(x.velocity_m_s, 'velocity_m_s', 'Mean velocity');

  const fluid = FLUIDS[x.fluid];
  const rho = x.fluid === 'custom' ? assertPositive(x.rho_kg_m3, 'rho_kg_m3', 'Density') : fluid.rho;
  const nu = x.fluid === 'custom' ? assertPositive(x.nu_m2_s, 'nu_m2_s', 'Kinematic viscosity') : fluid.nu;

  const re = reynolds(velocity, length, nu);
  const criticalRe = x.geometry === 'plate' ? PLATE_TRANSITION : PIPE_LAMINAR;
  const warnings = [];
  if (internal && re >= PIPE_LAMINAR && re <= PIPE_TURBULENT) warnings.push('Transitional flow: the friction factor can jump between the laminar and turbulent values, so pressure-drop and heat-transfer results are uncertain by a factor of two or more.');
  if (x.geometry === 'duct' && re < PIPE_LAMINAR) warnings.push('Laminar flow in a non-circular duct: the hydraulic diameter is only approximate, and the friction factor depends on the shape.');
  if (x.fluid === 'air_20c' && velocity > 100) warnings.push('Air above about 100 m/s (Mach 0.3) is compressible; density and viscosity change along the flow.');

  return {
    outputs: {
      reynolds: re,
      regime: regimeOf(x.geometry, re),
      length_used_m: length,
      velocity_used_m_s: velocity,
      nu_used_m2_s: nu,
      mu_pa_s: rho * nu,
      critical_velocity_m_s: x.geometry === 'length' ? null : (criticalRe * nu) / length,
    },
    warnings,
  };
}
