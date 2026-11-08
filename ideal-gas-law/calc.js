/**
 * ideal-gas-law/calc.js — pressure, volume, temperature or amount of an ideal gas from the other three
 * (PV = nRT), with the mass, density and specific gas constant for a chosen gas.
 *
 * P V = n R T;  m = n M;  ρ = P M / (R T);  R_specific = R / M.
 * Schema units: SI — Pa, m³, K, mol, kg, kg/m³; molar mass in kg/mol.
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';

// Molar gas constant, exact since the 2019 SI redefinition (CODATA 2018).
export const R_J_MOL_K = 8.314462618;

// Molar masses in kg/mol (IUPAC 2021 standard atomic weights; dry air composition from ISO 2533 / ICAO standard atmosphere).
export const GASES = {
  air: { label: 'Dry air', molarMass: 0.0289647 },
  nitrogen: { label: 'Nitrogen N₂', molarMass: 0.0280134 },
  oxygen: { label: 'Oxygen O₂', molarMass: 0.0319988 },
  co2: { label: 'Carbon dioxide CO₂', molarMass: 0.0440095 },
  methane: { label: 'Methane CH₄ (natural gas, approx.)', molarMass: 0.0160425 },
  hydrogen: { label: 'Hydrogen H₂', molarMass: 0.00201588 },
  helium: { label: 'Helium He', molarMass: 0.0040026 },
  argon: { label: 'Argon Ar', molarMass: 0.039948 },
  ammonia: { label: 'Ammonia NH₃', molarMass: 0.0170305 },
  custom: { label: 'Custom gas', molarMass: null },
};

export const schema = {
  id: 'ideal-gas-law',
  name: 'Ideal gas law (PV = nRT)',
  category: 'thermal',
  summary: 'Pressure, volume, temperature or amount of a gas from PV = nRT, with its mass, density and specific gas constant for air, N₂, CO₂, H₂ and more.',
  related: ['pipe-insulation', 'starting-air', 'tank-volume', 'unit-converter'],
  assumptions: [
    'The gas is ideal: its molecules have no volume and no attraction. Real gases follow PV = nRT closely at low pressure and well above their boiling point; at high pressure the compressibility factor Z multiplies the right-hand side.',
    'Pressure is absolute. A gauge reading must have the atmospheric pressure (about 1.013 bar at sea level) added before it is entered.',
    'Temperature is absolute (kelvin); the calculator converts °C and °F, but the law itself only holds on an absolute scale.',
    'Molar masses are for the pure gas (dry air for air); humid air is slightly lighter, and natural gas varies with its composition.',
  ],
  notes: [
    'Verification 2026-11-07: dry air at 101.325 kPa and 20 °C gives 1.204 kg/m³, the standard value; 1 mol at 0 °C and 101.325 kPa occupies 22.414 L (the textbook molar volume).',
    'Design decision: one page solves for any of the four variables, because searches for the ideal gas law come from every direction (pressure in a tank, volume of a gas, temperature after heating).',
  ],
  sources: [
    'CODATA 2018 recommended values: molar gas constant R = 8.314 462 618 J/(mol·K), exact',
    'Çengel and Boles, Thermodynamics: An Engineering Approach, 9th ed., ch. 3 (ideal-gas equation of state, compressibility factor)',
    'IUPAC Commission on Isotopic Abundances and Atomic Weights, standard atomic weights 2021 (molar masses)',
    'ISO 2533:1975 Standard Atmosphere (dry air molar mass 28.9644 g/mol, 1.225 kg/m³ at 15 °C)',
  ],
  inputs: [
    {
      id: 'solve_for',
      label: 'Solve for',
      type: 'select',
      default: 'amount',
      options: [
        { value: 'amount', label: 'Amount of gas (moles and mass)' },
        { value: 'pressure', label: 'Pressure' },
        { value: 'volume', label: 'Volume' },
        { value: 'temperature', label: 'Temperature' },
      ],
    },
    { id: 'gas', label: 'Gas', type: 'select', default: 'air', options: Object.entries(GASES).map(([value, g]) => ({ value, label: g.label })) },
    { id: 'molar_mass_g_mol', label: 'Molar mass M (g/mol)', group: 'dimensionless', unit: 'none', default: 28.9647, min: 0.1, max: 1000, visibleWhen: { gas: 'custom' } },
    { id: 'pressure_pa', label: 'Absolute pressure P', group: 'pressure', unit: 'Pa', display: 'kPa', default: 101325, min: 0, max: 1e9, visibleWhen: { solve_for: ['amount', 'volume', 'temperature'] }, help: 'Absolute: add about 101.3 kPa to a gauge reading.' },
    { id: 'volume_m3', label: 'Volume V', group: 'volume', unit: 'm3', default: 50, min: 0, max: 1e9, visibleWhen: { solve_for: ['amount', 'pressure', 'temperature'] } },
    { id: 'temperature_k', label: 'Temperature T', group: 'temperature', unit: 'K', display: 'C', default: 293.15, min: 0, max: 5000, visibleWhen: { solve_for: ['amount', 'pressure', 'volume'] } },
    { id: 'amount_mol', label: 'Amount of gas n (mol)', group: 'dimensionless', unit: 'none', default: 2078.6, min: 0, max: 1e12, visibleWhen: { solve_for: ['pressure', 'volume', 'temperature'] }, help: 'Moles. 1 kmol = 1000 mol.' },
  ],
  outputs: [
    { id: 'pressure_out_pa', label: 'Absolute pressure P', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'volume_out_m3', label: 'Volume V', group: 'volume', unit: 'm3' },
    { id: 'temperature_out_k', label: 'Temperature T', group: 'temperature', unit: 'K', display: 'C' },
    { id: 'amount_out_mol', label: 'Amount of gas n (mol)', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'mass_kg', label: 'Mass m = n M', group: 'mass', unit: 'kg' },
    { id: 'density_kg_m3', label: 'Density ρ = P M / (R T)', group: 'density', unit: 'kg_m3' },
    { id: 'specific_constant', label: 'Specific gas constant R / M', group: 'specific_heat', unit: 'J_kgK' },
    { id: 'molar_volume_m3', label: 'Molar volume V / n (m³ per kmol)', group: 'dimensionless', unit: 'none', decimals: 3 },
  ],
  example: {
    inputs: { solve_for: 'amount', gas: 'air', pressure_pa: [101.325, 'kPa'], volume_m3: [50, 'm3'], temperature_k: [20, 'C'] },
    results: {
      amount_out_mol: '2 079',
      mass_kg: '60.2 kg',
      density_kg_m3: '1.204 kg/m³',
      specific_constant: '287.1 J/(kg·K)',
    },
  },
};

/** Solve PV = nRT for the missing variable; returns { p, v, t, n } in SI units. */
export function solveIdealGas(solveFor, { p, v, t, n }) {
  switch (solveFor) {
    case 'amount': return { p, v, t, n: (p * v) / (R_J_MOL_K * t) };
    case 'pressure': return { p: (n * R_J_MOL_K * t) / v, v, t, n };
    case 'volume': return { p, v: (n * R_J_MOL_K * t) / p, t, n };
    case 'temperature': return { p, v, t: (p * v) / (n * R_J_MOL_K), n };
    default: throw new Error(`Unknown variable "${solveFor}"`);
  }
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.solve_for, ['amount', 'pressure', 'volume', 'temperature'], 'solve_for', 'Solve for');
  assertOneOf(x.gas, Object.keys(GASES), 'gas', 'Gas');
  const molarMass = x.gas === 'custom' ? assertPositive(x.molar_mass_g_mol, 'molar_mass_g_mol', 'Molar mass') / 1000 : GASES[x.gas].molarMass;
  const known = {};
  if (x.solve_for !== 'pressure') known.p = assertPositive(x.pressure_pa, 'pressure_pa', 'Absolute pressure');
  if (x.solve_for !== 'volume') known.v = assertPositive(x.volume_m3, 'volume_m3', 'Volume');
  if (x.solve_for !== 'temperature') known.t = assertPositive(x.temperature_k, 'temperature_k', 'Temperature (absolute)');
  if (x.solve_for !== 'amount') known.n = assertPositive(x.amount_mol, 'amount_mol', 'Amount of gas');
  const { p, v, t, n } = solveIdealGas(x.solve_for, known);

  const warnings = [];
  if (p > 1e6) warnings.push('Above about 10 bar real gases depart from PV = nRT; at 200 bar nitrogen holds a few per cent less gas than the ideal value. Multiply by the compressibility factor Z for high-pressure work.');
  if ((x.gas === 'co2' && t < 304.13) || (x.gas === 'ammonia' && t < 405.4)) warnings.push('Below its critical temperature this gas can condense under pressure; the ideal gas law does not apply to the liquid or near saturation.');
  if (t < 150) warnings.push('Below about 150 K most gases are near condensation, where the ideal gas law is unreliable.');

  return {
    outputs: {
      pressure_out_pa: p,
      volume_out_m3: v,
      temperature_out_k: t,
      amount_out_mol: n,
      mass_kg: n * molarMass,
      density_kg_m3: (p * molarMass) / (R_J_MOL_K * t),
      specific_constant: R_J_MOL_K / molarMass,
      molar_volume_m3: (v / n) * 1000,
    },
    warnings,
  };
}
