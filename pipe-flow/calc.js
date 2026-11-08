/**
 * pipe-flow/calc.js — velocity, Reynolds number, Darcy friction factor and pressure drop in a straight circular pipe.
 *
 * Friction factor: laminar f = 64/Re (Hagen–Poiseuille); turbulent Colebrook–White iterated to convergence, with the
 * Swamee–Jain explicit approximation shown for comparison. Losses by Darcy–Weisbach plus ΣK minor losses and static head.
 *
 * Schema units: SI — m, m/s, m³/s, kg/m³, m²/s, Pa.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative, assertFinite, assertOneOf } from '../shared/validate.js';

export const RE_LAMINAR_LIMIT = 2300;
export const RE_TURBULENT_LIMIT = 4000;

/** Absolute roughness in metres — Moody (1944) / White, Fluid Mechanics, Table 6.1; stainless per Crane TP-410. */
export const ROUGHNESS_M = {
  drawn_tubing: { label: 'Drawn tubing, copper, brass (0.0015 mm)', value: 0.0015e-3 },
  pvc: { label: 'PVC / plastic (0.0015 mm)', value: 0.0015e-3 },
  stainless_steel: { label: 'Stainless steel (0.015 mm)', value: 0.015e-3 },
  commercial_steel: { label: 'Commercial steel, wrought iron (0.045 mm)', value: 0.045e-3 },
  galvanized_iron: { label: 'Galvanized iron (0.15 mm)', value: 0.15e-3 },
  cast_iron: { label: 'Cast iron (0.26 mm)', value: 0.26e-3 },
  concrete: { label: 'Concrete, average (1.0 mm)', value: 1.0e-3 },
  riveted_steel: { label: 'Riveted steel (3 mm)', value: 3.0e-3 },
  custom: { label: 'Custom roughness', value: null },
};

/**
 * Fluid presets: density kg/m³ and kinematic viscosity m²/s.
 * Water: CRC Handbook / IAPWS at 20 °C. Sea water: ITTC Recommended Procedure 7.5-02-01-03 (2011) at 15 °C.
 * Air: 20 °C, 101.325 kPa. Fuels and lube oil are typical values at the stated temperature (ISO 8217 ranges), not a standard.
 */
export const FLUIDS = {
  water_20c: { label: 'Fresh water, 20 °C', rho: 998.2, nu: 1.004e-6 },
  seawater_15c: { label: 'Sea water, 15 °C (ITTC)', rho: 1025.87, nu: 1.18831e-6 },
  mgo_40c: { label: 'Marine gas oil DMA, 40 °C (typical)', rho: 830, nu: 3.5e-6 },
  hfo_50c: { label: 'HFO RMG 380, 50 °C (typical)', rho: 970, nu: 380e-6 },
  lube_oil_40c: { label: 'Lubricating oil SAE 30, 40 °C (typical)', rho: 870, nu: 100e-6 },
  air_20c: { label: 'Air, 20 °C, 1 atm', rho: 1.204, nu: 1.516e-5 },
  custom: { label: 'Custom fluid', rho: null, nu: null },
};

export const schema = {
  id: 'pipe-flow',
  name: 'Pipe flow and pressure drop',
  category: 'thermal',
  summary: 'Velocity, Reynolds number, Darcy friction factor (Colebrook, Swamee–Jain) and pressure drop for a straight pipe with fittings.',
  related: ['pump-affinity', 'heat-exchanger-lmtd', 'tank-volume', 'unit-converter'],
  sendTo: [
    {
      target: 'water-hammer',
      label: 'Water hammer on sudden valve closure',
      when: { fluid: ['water_20c', 'seawater_15c', 'mgo_40c', 'hfo_50c', 'lube_oil_40c', 'custom'] },
      whenNote: 'Not available for air: water hammer is a liquid phenomenon.',
      note: 'A full stop of the computed velocity; enter the wall thickness, the closure time and the pressures there.',
      links: [
        { to: 'velocity_change_m_s', from: 'velocity_out_m_s' },
        { to: 'diameter_mm', from: 'input:diameter_m' },
        { to: 'length_m', from: 'input:length_m' },
        { to: 'fluid', from: 'input:fluid', map: { water_20c: 'fresh_water', seawater_15c: 'sea_water', mgo_40c: 'fuel_oil', hfo_50c: 'fuel_oil', lube_oil_40c: 'lube_oil' }, skipNote: 'fluid: choose the closest liquid in the water-hammer calculator' },
        { to: 'material', from: 'input:material', map: { commercial_steel: 'steel', stainless_steel: 'steel', galvanized_iron: 'steel', riveted_steel: 'steel', pvc: 'pvc' }, skipNote: 'pipe material: no direct equivalent, choose it in the water-hammer calculator' },
      ],
    },
    {
      target: 'control-valve-cv',
      label: 'Control valve sizing (Kv, IEC 60534)',
      when: { fluid: ['water_20c', 'seawater_15c', 'mgo_40c', 'hfo_50c', 'lube_oil_40c', 'custom'] },
      whenNote: 'Not available for air: the valve calculator uses the liquid sizing equations.',
      note: 'Flow, density and pipe size; enter the inlet and outlet pressures and the valve type there. Viscous liquids such as HFO need the IEC 60534 viscosity correction, which the valve calculator does not apply.',
      links: [
        { to: 'flow_m3_h', from: 'flow_out_m3_s' },
        { to: 'density_kg_m3', from: 'density_out_kg_m3' },
        { to: 'pipe_diameter_mm', from: 'input:diameter_m' },
      ],
    },
    {
      target: 'pump-npsh',
      label: 'Pump NPSH available (this pipe as the suction line)',
      when: { fluid: ['water_20c', 'seawater_15c', 'mgo_40c', 'hfo_50c', 'lube_oil_40c', 'custom'] },
      whenNote: 'Not available for air.',
      note: 'Treats this pipe as the suction line: its friction and fitting losses become the suction loss. Set the static head, the liquid temperature or vapour pressure and the pump NPSHr there.',
      links: [
        { to: 'flow_m3_h', from: 'flow_out_m3_s' },
        { to: 'density_kg_m3', from: 'density_out_kg_m3' },
        { to: 'friction_loss_m', from: 'head_loss_m' },
      ],
    },
  ],
  notes: [
    'Verification 2026-10-30: the laminar case is checked against Hagen–Poiseuille independently (320 Pa both ways); the smooth-pipe limit against the Prandtl law (0.0180 at Re 10⁵) and the fully rough limit against von Kármán (0.0379 at ε/D 0.01); the Moody chart point Re 10⁵, ε/D 0.001 reads 0.0222 against Colebrook 0.02217.',
    'Design decision: Colebrook is iterated to 10⁻¹³ from a Swamee–Jain start and both values are shown, so users can see the explicit approximation error (about 0.8 % at the test point).',
    'Design decision: in the transitional band the turbulent factor is used as the conservative choice and a warning is raised rather than interpolating.',
    'Article check 2026-10-31 (schema.example): the worked example printed the Colebrook factor as 0.0180 and the Swamee–Jain factor as 0.0181; recomputed independently (Re 2.98·10⁵, ε/D 4.5·10⁻⁴) they are 0.01793 and 0.01805, as this calculator gives, so the friction loss is 115.1 kPa (11.4 m) instead of 115.5 kPa (11.5 m) and the total head 24.6 m instead of 24.7 m. Corrected in content.md.',
  ],
  assumptions: [
    'Steady, fully developed, incompressible flow in a circular pipe running full; for gases the result holds while the pressure drop stays below about 10 % of the absolute pressure.',
    'The friction factor is the Darcy factor (4 × Fanning): laminar f = 64/Re below Re 2 300, Colebrook–White iterated to convergence above; in the transitional band 2 300–4 000 the turbulent value is used and a warning is raised.',
    'Swamee–Jain is shown for comparison only (within about 1 % of Colebrook for 5 000 ≤ Re ≤ 10⁸ and 10⁻⁶ ≤ ε/D ≤ 10⁻²).',
    'Minor losses are lumped as ΣK × dynamic pressure; handbook K values vary by ±30 % and depend on Reynolds number and fitting geometry.',
    'Roughness presets are for new, clean pipe (Moody 1944 / White Table 6.1); aged or scaled pipe can have several times the roughness and a reduced bore, and losses scale with D⁻⁵ at fixed flow.',
    'Fuel and lubricating-oil presets are typical values at the stated temperature, not standard properties; HFO viscosity roughly halves for a 10 °C rise.',
    'Non-circular ducts: use the hydraulic diameter 4A/P in place of D; accuracy about ±15 % in turbulent flow and poor in laminar flow.',
    'Elevation enters as the static term ρ g Δz; the outlet pressure requirement and velocity-head changes between different inlet and outlet diameters are not included.',
  ],
  sources: [
    'L.F. Moody, "Friction factors for pipe flow", Trans. ASME 66 (1944)',
    'C.F. Colebrook, J. Inst. Civil Eng. 11 (1939) (Colebrook–White equation)',
    'P.K. Swamee & A.K. Jain, J. Hydraulics Div. ASCE 102 (1976)',
    'F.M. White, Fluid Mechanics, 7th ed., ch. 6 (Table 6.1 roughness, eqs 6.54–6.55)',
    'Crane Co., Flow of Fluids through Valves, Fittings and Pipe, TP-410 (2013)',
    'ITTC Recommended Procedure 7.5-02-01-03 (2011), fresh and sea water properties',
  ],
  inputs: [
    {
      id: 'known',
      label: 'Flow given as',
      type: 'select',
      default: 'flow',
      options: [
        { value: 'flow', label: 'Volume flow rate' },
        { value: 'velocity', label: 'Mean velocity' },
      ],
    },
    { id: 'flow_m3_s', label: 'Volume flow rate', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 100 / 3600, min: 0, max: 100, visibleWhen: { known: 'flow' } },
    { id: 'velocity_m_s', label: 'Mean velocity', group: 'speed', unit: 'm_s', default: 2, min: 0, max: 100, visibleWhen: { known: 'velocity' } },
    { id: 'diameter_m', label: 'Pipe inside diameter', group: 'length', unit: 'm', display: 'mm', default: 0.1, min: 0.0005, max: 10 },
    { id: 'length_m', label: 'Pipe length', group: 'length', unit: 'm', default: 100, min: 0, max: 100000 },
    {
      id: 'material',
      label: 'Pipe material (absolute roughness)',
      type: 'select',
      default: 'commercial_steel',
      options: Object.entries(ROUGHNESS_M).map(([value, r]) => ({ value, label: r.label })),
    },
    { id: 'roughness_m', label: 'Absolute roughness ε', group: 'length', unit: 'm', display: 'mm', default: 0.045e-3, min: 0, max: 0.05, visibleWhen: { material: 'custom' } },
    {
      id: 'fluid',
      label: 'Fluid',
      type: 'select',
      default: 'water_20c',
      options: Object.entries(FLUIDS).map(([value, f]) => ({ value, label: f.label })),
    },
    { id: 'rho_kg_m3', label: 'Density ρ', group: 'density', unit: 'kg_m3', default: 998.2, min: 0.01, max: 20000, visibleWhen: { fluid: 'custom' } },
    { id: 'nu_m2_s', label: 'Kinematic viscosity ν', group: 'kinematic_viscosity', unit: 'm2_s', display: 'cSt', default: 1.004e-6, min: 1e-8, max: 1, visibleWhen: { fluid: 'custom' } },
    { id: 'k_minor', label: 'Sum of minor-loss coefficients ΣK (bends, valves, entries)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 1000, help: 'Typical: 90° elbow 0.3–0.9, gate valve open 0.2, globe valve open 10, sharp entry 0.5, exit 1.0.' },
    { id: 'elevation_m', label: 'Rise of outlet above inlet (+ up)', group: 'length', unit: 'm', default: 0, min: -1000, max: 1000 },
  ],
  outputs: [
    { id: 'velocity_out_m_s', label: 'Mean velocity', group: 'speed', unit: 'm_s' },
    { id: 'flow_out_m3_s', label: 'Volume flow rate', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'reynolds', label: 'Reynolds number Re = V·D/ν', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'regime', label: 'Flow regime', type: 'text' },
    { id: 'relative_roughness', label: 'Relative roughness ε/D', group: 'dimensionless', unit: 'none' },
    { id: 'friction_factor', label: 'Darcy friction factor f', group: 'dimensionless', unit: 'none' },
    { id: 'friction_method', label: 'Friction factor method', type: 'text' },
    { id: 'swamee_jain_f', label: 'Swamee–Jain explicit f (for comparison)', group: 'dimensionless', unit: 'none' },
    { id: 'head_loss_friction_m', label: 'Friction head loss h_f', group: 'length', unit: 'm' },
    { id: 'dp_friction_pa', label: 'Friction pressure drop', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'dp_per_100m_pa', label: 'Friction pressure drop per 100 m', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'dp_minor_pa', label: 'Minor-loss pressure drop (ΣK)', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'dp_static_pa', label: 'Static pressure difference from elevation', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'dp_total_pa', label: 'Total pressure drop inlet → outlet', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'head_total_m', label: 'Total head required', group: 'length', unit: 'm' },
    { id: 'head_loss_m', label: 'Loss head h_f + ΣK V²/2g (friction and fittings, no elevation)', group: 'length', unit: 'm' },
    { id: 'density_out_kg_m3', label: 'Fluid density ρ used', group: 'density', unit: 'kg_m3' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      fluid: 'seawater_15c',
      k_minor: 5,
      elevation_m: [10, 'm'],
    },
    results: {
      velocity_out_m_s: '3.54 m/s',
      friction_factor: '0.0179',
      swamee_jain_f: '0.0180',
      dp_friction_pa: '115.1 kPa',
      head_loss_friction_m: '11.4 m',
      dp_minor_pa: '32.1 kPa',
      dp_static_pa: '100.6 kPa',
      dp_total_pa: '248 kPa',
      head_total_m: '24.6 m',
    },
  },
};

/** Swamee–Jain (1976) explicit approximation of the Colebrook equation, valid 5000 ≤ Re ≤ 1e8, 1e-6 ≤ ε/D ≤ 1e-2. */
export function swameeJainFrictionFactor(re, relativeRoughness) {
  const term = Math.log10(relativeRoughness / 3.7 + 5.74 / re ** 0.9);
  return 0.25 / (term * term);
}

/** Colebrook–White (1939) implicit equation solved by fixed-point iteration from the Swamee–Jain start. */
export function colebrookFrictionFactor(re, relativeRoughness) {
  let f = swameeJainFrictionFactor(re, relativeRoughness);
  for (let iteration = 0; iteration < 200; iteration += 1) {
    const rhs = -2 * Math.log10(relativeRoughness / 3.7 + 2.51 / (re * Math.sqrt(f)));
    const next = 1 / (rhs * rhs);
    if (Math.abs(next - f) < 1e-13) return next;
    f = next;
  }
  return f;
}

/** Laminar Darcy friction factor for a circular pipe. */
export function laminarFrictionFactor(re) {
  return 64 / re;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.known, ['flow', 'velocity'], 'known', 'Flow given as');
  assertPositive(i.diameter_m, 'diameter_m', 'Pipe diameter');
  assertNonNegative(i.length_m, 'length_m', 'Pipe length');
  assertOneOf(i.material, Object.keys(ROUGHNESS_M), 'material', 'Pipe material');
  assertOneOf(i.fluid, Object.keys(FLUIDS), 'fluid', 'Fluid');
  assertNonNegative(i.k_minor, 'k_minor', 'Minor-loss coefficients');
  assertFinite(i.elevation_m, 'elevation_m', 'Elevation');

  const roughness = i.material === 'custom' ? assertNonNegative(i.roughness_m, 'roughness_m', 'Roughness') : ROUGHNESS_M[i.material].value;
  const rho = i.fluid === 'custom' ? assertPositive(i.rho_kg_m3, 'rho_kg_m3', 'Density') : FLUIDS[i.fluid].rho;
  const nu = i.fluid === 'custom' ? assertPositive(i.nu_m2_s, 'nu_m2_s', 'Kinematic viscosity') : FLUIDS[i.fluid].nu;

  const area = (Math.PI * i.diameter_m * i.diameter_m) / 4;
  let velocity;
  let flow;
  if (i.known === 'flow') {
    flow = assertNonNegative(i.flow_m3_s, 'flow_m3_s', 'Volume flow rate');
    velocity = flow / area;
  } else {
    velocity = assertNonNegative(i.velocity_m_s, 'velocity_m_s', 'Mean velocity');
    flow = velocity * area;
  }

  const relativeRoughness = roughness / i.diameter_m;
  const dynamicPressure = (rho * velocity * velocity) / 2;
  const dpStatic = rho * GRAVITY_M_S2 * i.elevation_m;
  const dpMinor = i.k_minor * dynamicPressure;
  const warnings = [];

  if (velocity === 0) {
    return {
      outputs: {
        velocity_out_m_s: 0,
        flow_out_m3_s: 0,
        reynolds: 0,
        regime: 'No flow',
        relative_roughness: relativeRoughness,
        friction_factor: null,
        friction_method: '—',
        swamee_jain_f: null,
        head_loss_friction_m: 0,
        dp_friction_pa: 0,
        dp_per_100m_pa: 0,
        dp_minor_pa: 0,
        dp_static_pa: dpStatic,
        dp_total_pa: dpStatic,
        head_total_m: i.elevation_m,
        head_loss_m: 0,
        density_out_kg_m3: rho,
      },
      warnings,
    };
  }

  const re = (velocity * i.diameter_m) / nu;
  let frictionFactor;
  let method;
  let regime;
  let swameeJain = null;
  if (re < RE_LAMINAR_LIMIT) {
    frictionFactor = laminarFrictionFactor(re);
    method = 'Laminar: f = 64 / Re';
    regime = 'Laminar';
  } else {
    frictionFactor = colebrookFrictionFactor(re, relativeRoughness);
    swameeJain = swameeJainFrictionFactor(re, relativeRoughness);
    method = 'Turbulent: Colebrook–White, iterated';
    regime = re < RE_TURBULENT_LIMIT ? 'Transitional (2 300 < Re < 4 000)' : 'Turbulent';
    if (re < RE_TURBULENT_LIMIT) warnings.push('Transitional regime: the friction factor is uncertain by ±30 %; the turbulent value is shown as the conservative choice.');
  }
  if (relativeRoughness > 0.05) warnings.push('Relative roughness above 0.05 is outside the Moody chart; the Colebrook result is an extrapolation.');
  if (velocity > 3 && i.fluid !== 'air_20c') warnings.push('Liquid velocity above 3 m/s: expect noise, erosion and water hammer risk; typical design 1–3 m/s.');
  if (i.fluid === 'air_20c' && frictionFactor * (i.length_m / i.diameter_m) * dynamicPressure > 0.1 * 101325) {
    warnings.push('Gas pressure drop exceeds about 10 % of absolute pressure: incompressible flow assumptions no longer hold.');
  }

  const headFriction = frictionFactor * (i.length_m / i.diameter_m) * (velocity * velocity) / (2 * GRAVITY_M_S2);
  const dpFriction = frictionFactor * (i.length_m / i.diameter_m) * dynamicPressure;
  const dpTotal = dpFriction + dpMinor + dpStatic;

  return {
    outputs: {
      velocity_out_m_s: velocity,
      flow_out_m3_s: flow,
      reynolds: re,
      regime,
      relative_roughness: relativeRoughness,
      friction_factor: frictionFactor,
      friction_method: method,
      swamee_jain_f: swameeJain,
      head_loss_friction_m: headFriction,
      dp_friction_pa: dpFriction,
      dp_per_100m_pa: i.length_m > 0 ? (dpFriction / i.length_m) * 100 : frictionFactor * (100 / i.diameter_m) * dynamicPressure,
      dp_minor_pa: dpMinor,
      dp_static_pa: dpStatic,
      dp_total_pa: dpTotal,
      head_total_m: dpTotal / (rho * GRAVITY_M_S2),
      head_loss_m: (dpFriction + dpMinor) / (rho * GRAVITY_M_S2),
      density_out_kg_m3: rho,
    },
    warnings,
  };
}
