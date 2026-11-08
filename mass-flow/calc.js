/**
 * mass-flow/calc.js — mass flow, volumetric flow and velocity in a round pipe from any one of them and the density;
 * for gases the density follows from the molar mass, pressure, temperature and Z, and the actual flow converts to
 * standard or normal flow (Nm³/h, Sm³/h, SCFM) at a chosen reference.
 *
 * ṁ = ρ Q = ρ v A;  A = π D² / 4;  gas: ρ = P M / (Z R T);  Q_std = ṁ / ρ_std = Q (P / P_std)(T_std / T)(1 / Z).
 * Schema units: SI — kg/s, m³/s, m/s, m, kg/m³, Pa, K; molar mass in g/mol.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';

/** Molar gas constant, J/(mol·K), exact (CODATA 2018). */
export const R = 8.314462618;

/** Standard reference conditions [label, T in K, P in Pa]; Z = 1 is taken at the reference state. */
export const REFERENCES = {
  normal: ['0 °C, 101.325 kPa (normal, Nm³; DIN 1343)', 273.15, 101325],
  iso: ['15 °C, 101.325 kPa (standard, Sm³; ISO 13443)', 288.15, 101325],
  us: ['60 °F, 14.696 psia (US standard cubic feet, SCF)', 288.7055556, 101325],
  air: ['20 °C, 100 kPa (compressed air; ISO 8778)', 293.15, 100000],
};

export const schema = {
  id: 'mass-flow',
  name: 'Mass flow rate calculator (kg/h, m³/h, velocity, Nm³/h, SCFM)',
  category: 'process',
  summary: 'Mass flow, volume flow and pipe velocity from any one of them, with gas density from P, T and Z and conversion between actual and standard flow (Nm³/h, SCFM).',
  related: ['density', 'flow-rate-velocity', 'gas-compressibility', 'pipe-flow'],
  assumptions: [
    'Mass flow equals density × volume flow, and volume flow equals velocity × the inside cross-section of the pipe; the velocity is the average over the section.',
    'Gas density follows the real-gas law ρ = P M / (Z R T) at the flowing pressure and temperature; enter Z = 1 for an ideal gas, which is within 1 % for air and nitrogen below about 20 bar near room temperature.',
    'Standard and normal flows are the volume the same mass would occupy at the reference state, taken as an ideal gas there (Z = 1); the references are 0 °C and 101.325 kPa (Nm³), 15 °C and 101.325 kPa (Sm³), 60 °F and 14.696 psia (SCF) and 20 °C and 100 kPa for compressed air.',
    'Pressure is absolute: add the atmospheric pressure, about 1.013 bar or 14.7 psi, to a gauge reading.',
    'Water vapour is not separated out: a humid gas gives a wet standard flow; dry-basis flows need the moisture content removed first.',
  ],
  notes: [
    'Verification 2026-11-08: 500 Nm³/h of air (28.964 g/mol) is 646.1 kg/h; at 8 bar absolute and 20 °C its density is 9.507 kg/m³, so it flows at 67.97 m³/h, 40.0 ACFM, and 9.62 m/s in a 50 mm bore. Checked by hand.',
  ],
  sources: [
    'ISO 13443:1996 Natural gas — Standard reference conditions (15 °C, 101.325 kPa); DIN 1343:1990 Reference conditions, normal conditions (0 °C, 101.325 kPa)',
    'ISO 8778:2003 Pneumatic fluid power — Standard reference atmosphere (20 °C, 100 kPa)',
    'Perry\'s Chemical Engineers\' Handbook, 8th ed., Section 6 (fluid flow: continuity, ṁ = ρ v A) and Section 2 (gas density, compressibility)',
  ],
  inputs: [
    { id: 'fluid', label: 'Fluid', type: 'select', default: 'liquid', options: [{ value: 'liquid', label: 'Liquid (density entered)' }, { value: 'gas', label: 'Gas (density from P, T, M and Z)' }] },
    { id: 'given', label: 'Known flow', type: 'select', default: 'actual', options: [{ value: 'mass', label: 'Mass flow' }, { value: 'actual', label: 'Volume flow at flowing conditions (actual)' }, { value: 'standard', label: 'Standard or normal volume flow (gas)' }, { value: 'velocity', label: 'Velocity in the pipe' }] },
    { id: 'mass_flow_kg_s', label: 'Mass flow ṁ', group: 'mass_flow', unit: 'kg_s', display: 'kg_h', default: 10, min: 1e-9, max: 1e5, visibleWhen: { given: 'mass' } },
    { id: 'vol_flow_m3_s', label: 'Actual volume flow Q', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 0.01, min: 1e-9, max: 1e4, visibleWhen: { given: 'actual' } },
    { id: 'std_flow_m3_s', label: 'Standard volume flow Q_std (at the reference below)', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 500 / 3600, min: 1e-9, max: 1e5, visibleWhen: { given: 'standard' } },
    { id: 'velocity_m_s', label: 'Mean velocity v', group: 'speed', unit: 'm_s', default: 2, min: 1e-6, max: 1000, visibleWhen: { given: 'velocity' } },
    { id: 'diameter_m', label: 'Pipe inside diameter D', group: 'length', unit: 'm', display: 'mm', default: 0.1, min: 0.0001, max: 10 },
    { id: 'density_kg_m3', label: 'Liquid density ρ', group: 'density', unit: 'kg_m3', default: 998.2, min: 1, max: 25000, visibleWhen: { fluid: 'liquid' } },
    { id: 'molar_mass', label: 'Molar mass of the gas, g/mol', group: 'dimensionless', unit: 'none', default: 28.9644, min: 1, max: 500, visibleWhen: { fluid: 'gas' }, help: 'Air 28.96, N₂ 28.01, CO₂ 44.01, CH₄ 16.04, natural gas ≈ 28.96 × gas SG' },
    { id: 'pressure_pa', label: 'Flowing pressure (absolute)', group: 'pressure', unit: 'Pa', display: 'bar', default: 800000, min: 1000, max: 1e8, visibleWhen: { fluid: 'gas' } },
    { id: 'temp_k', label: 'Flowing temperature', group: 'temperature', unit: 'K', display: 'C', default: 293.15, min: 50, max: 2000, visibleWhen: { fluid: 'gas' } },
    { id: 'z', label: 'Compressibility factor Z at flowing conditions', group: 'dimensionless', unit: 'none', default: 1, min: 0.05, max: 3, visibleWhen: { fluid: 'gas' } },
    { id: 'reference', label: 'Standard reference conditions', type: 'select', default: 'normal', options: Object.entries(REFERENCES).map(([value, [label]]) => ({ value, label })), visibleWhen: { fluid: 'gas' } },
  ],
  outputs: [
    { id: 'mass_flow', label: 'Mass flow ṁ', group: 'mass_flow', unit: 'kg_s', display: 'kg_h' },
    { id: 'vol_flow', label: 'Actual volume flow Q', group: 'volume_flow', unit: 'm3_s', display: 'm3_h' },
    { id: 'acfm', label: 'Actual flow in ACFM', group: 'volume_flow', unit: 'm3_s', display: 'cfm' },
    { id: 'std_flow', label: 'Standard or normal flow Q_std', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', visibleWhen: { fluid: 'gas' } },
    { id: 'scfm', label: 'Standard flow in SCFM (at the chosen reference)', group: 'volume_flow', unit: 'm3_s', display: 'cfm', visibleWhen: { fluid: 'gas' } },
    { id: 'velocity', label: 'Mean velocity v', group: 'speed', unit: 'm_s' },
    { id: 'density', label: 'Density at flowing conditions ρ', group: 'density', unit: 'kg_m3' },
    { id: 'std_density', label: 'Density at the reference conditions', group: 'density', unit: 'kg_m3', visibleWhen: { fluid: 'gas' } },
    { id: 'area_m2', label: 'Pipe cross-section A', group: 'area', unit: 'm2', display: 'cm2' },
  ],
  example: {
    inputs: { fluid: 'gas', given: 'standard', std_flow_m3_s: [500, 'm3_h'], diameter_m: [50, 'mm'], molar_mass: 28.9644, pressure_pa: [8, 'bar'], temp_k: [20, 'C'], z: 1, reference: 'normal' },
    results: { mass_flow: '646.1 kg/h', density: '9.507 kg/m³', vol_flow: '67.97 m³/h', acfm: '40.0 cfm', velocity: '9.62 m/s' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.fluid, ['liquid', 'gas'], 'fluid', 'Fluid');
  assertOneOf(x.given, ['mass', 'actual', 'standard', 'velocity'], 'given', 'Known flow');
  const D = assertPositive(x.diameter_m, 'diameter_m', 'Pipe inside diameter D');
  const A = (Math.PI * D * D) / 4;
  const gas = x.fluid === 'gas';
  let rho;
  let rhoStd = null;
  if (gas) {
    const M = assertRange(x.molar_mass, 1, 500, 'molar_mass', 'Molar mass of the gas') / 1000;
    const P = assertPositive(x.pressure_pa, 'pressure_pa', 'Flowing pressure');
    const T = assertPositive(x.temp_k, 'temp_k', 'Flowing temperature');
    const Z = assertRange(x.z, 0.05, 3, 'z', 'Compressibility factor Z');
    assertOneOf(x.reference, Object.keys(REFERENCES), 'reference', 'Standard reference conditions');
    const [, Ts, Ps] = REFERENCES[x.reference];
    rho = (P * M) / (Z * R * T);
    rhoStd = (Ps * M) / (R * Ts);
  } else {
    if (x.given === 'standard') throw new Error('Known flow: standard volume flow applies to gases; choose Gas or give the actual flow of the liquid.');
    rho = assertPositive(x.density_kg_m3, 'density_kg_m3', 'Liquid density ρ');
  }
  let m;
  if (x.given === 'mass') m = assertPositive(x.mass_flow_kg_s, 'mass_flow_kg_s', 'Mass flow ṁ');
  else if (x.given === 'actual') m = rho * assertPositive(x.vol_flow_m3_s, 'vol_flow_m3_s', 'Actual volume flow Q');
  else if (x.given === 'standard') m = rhoStd * assertPositive(x.std_flow_m3_s, 'std_flow_m3_s', 'Standard volume flow Q_std');
  else m = rho * A * assertPositive(x.velocity_m_s, 'velocity_m_s', 'Mean velocity v');
  const Q = m / rho;
  const v = Q / A;
  const warnings = [];
  if (gas && v > 30) warnings.push('Gas velocity above 30 m/s (100 ft/s): expect noise and a high pressure drop; a larger pipe is usual.');
  if (!gas && v > 3) warnings.push('Liquid velocity above 3 m/s (10 ft/s): expect a high pressure drop, erosion and water hammer risk; 1 to 3 m/s is the usual design range.');
  const stdFlow = gas ? m / rhoStd : null;
  return {
    outputs: { mass_flow: m, vol_flow: Q, acfm: Q, std_flow: stdFlow, scfm: stdFlow, velocity: v, density: rho, std_density: rhoStd, area_m2: A },
    warnings,
  };
}
