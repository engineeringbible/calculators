/**
 * ppm-concentration/calc.js — concentration conversions. In a liquid (or solid): ppm and ppb by mass, % w/w, mg/L,
 * µg/L, g/L, mol/L and mmol/L through the solution density and the molar mass. In a gas: ppm, ppb and % by volume,
 * mg/m³ and µg/m³ at a stated temperature and pressure through the molar mass, plus ppm by mass in air.
 *
 * Solution: c [g/L] = w ρ [kg/m³];  M_c [mol/L] = c / M.
 * Gas: c [mg/m³] = x M P / (R T) × 1000;  w = x M / (x M + (1 − x) M_air).
 * Schema units: SI — kg/m³, K, Pa; concentrations as plain numbers in the unit chosen; molar mass in g/mol.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';

/** Molar gas constant, J/(mol·K), exact (CODATA 2018). */
export const R = 8.314462618;
/** Molar mass of dry air, g/mol (ISO 2533:1975, 28.964 42). */
export const M_AIR = 28.9644;

const SOL_UNITS = [
  { value: 'ppm', label: 'ppm by mass (mg/kg)' },
  { value: 'ppb', label: 'ppb by mass (µg/kg)' },
  { value: 'pct', label: '% by weight (% w/w)' },
  { value: 'mg_L', label: 'mg/L' },
  { value: 'ug_L', label: 'µg/L' },
  { value: 'g_L', label: 'g/L' },
  { value: 'mol_L', label: 'mol/L (molarity, M)' },
  { value: 'mmol_L', label: 'mmol/L' },
];
const GAS_UNITS = [
  { value: 'ppmv', label: 'ppm by volume (ppmv)' },
  { value: 'ppbv', label: 'ppb by volume (ppbv)' },
  { value: 'pctv', label: '% by volume' },
  { value: 'mg_m3', label: 'mg/m³' },
  { value: 'ug_m3', label: 'µg/m³' },
];

const out = (id, label, phase) => ({ id, label, group: 'dimensionless', unit: 'none', visibleWhen: { phase } });

/** Solution: mass fraction w and mass concentration c (g/L) from a value in a unit; ρ in kg/m³, M in g/mol. */
export function solutionFrom(value, unit, rho, M) {
  const wTo = { ppm: 1e-6, ppb: 1e-9, pct: 1e-2 };
  const cTo = { mg_L: 1e-3, ug_L: 1e-6, g_L: 1, mol_L: M, mmol_L: M / 1000 };
  if (unit in wTo) { const w = value * wTo[unit]; return { w, c: w * rho }; }
  const c = value * cTo[unit];
  return { w: c / rho, c };
}

/** Gas: mole (volume) fraction x from a value in a unit at T (K) and P (Pa); M in g/mol. */
export function gasFraction(value, unit, M, T, P) {
  const molPerM3 = P / (R * T);
  const xTo = { ppmv: 1e-6, ppbv: 1e-9, pctv: 1e-2 };
  if (unit in xTo) return value * xTo[unit];
  const mgM3 = unit === 'mg_m3' ? value : value / 1000;
  return mgM3 / (1000 * M * molPerM3);
}

export const schema = {
  id: 'ppm-concentration',
  name: 'PPM concentration converter (mg/L, % w/w, ppmv, mg/m³, mol/L)',
  category: 'process',
  summary: 'Convert ppm and ppb by mass or volume, mg/L, g/L, % w/w, mol/L and mg/m³ for liquids and gases, using the density, molar mass, temperature and pressure.',
  related: ['molarity', 'dilution', 'chemical-dosing', 'ideal-gas-law'],
  assumptions: [
    'In a liquid, ppm and ppb are by mass (mg/kg and µg/kg); converting them to mg/L uses the density of the whole solution, so 1 ppm equals 1 mg/L only when the density is 1 000 kg/m³.',
    'In a gas, ppm and ppb are by volume, which for ideal gases equals the mole fraction; mg/m³ uses the ideal gas molar volume R T / P at the stated temperature and pressure (24.45 L/mol at 25 °C and 1 atm).',
    'The ppm by mass in a gas is for a binary mixture with dry air (28.964 g/mol); for other carrier gases use the volume fraction and molar masses directly.',
    'Molarity uses the molar mass of the dissolved species as entered: for a salt that dissociates, the molar mass of the formula unit, not of one ion.',
  ],
  notes: [
    'Verification 2026-11-08: 35 g/L of sodium chloride (58.44 g/mol) in a solution of 1 025 kg/m³ is 34 146 ppm by mass, 3.415 % w/w and 0.599 mol/L. Checked by hand.',
    'Gas conversions reproduce the NIOSH Pocket Guide factors at 25 °C and 1 atm: 1 ppm of carbon monoxide is 1.15 mg/m³, of hydrogen sulfide 1.39 mg/m³ and of benzene 3.19 mg/m³.',
  ],
  sources: [
    'NIOSH Pocket Guide to Chemical Hazards, DHHS (NIOSH) Publication 2005-149, Introduction: conversion of ppm to mg/m³ at 25 °C and 760 mmHg (mg/m³ = ppm × M / 24.45)',
    'IUPAC Compendium of Chemical Terminology (Gold Book): mass fraction, mass concentration, amount concentration',
    'CODATA 2018 recommended values: molar gas constant R = 8.314 462 618 J/(mol·K)',
  ],
  inputs: [
    { id: 'phase', label: 'Mixture', type: 'select', default: 'solution', options: [{ value: 'solution', label: 'Liquid or solid (mass basis)' }, { value: 'gas', label: 'Gas (volume basis)' }] },
    { id: 'sol_unit', label: 'Concentration given in', type: 'select', default: 'mg_L', options: SOL_UNITS, visibleWhen: { phase: 'solution' } },
    { id: 'gas_unit', label: 'Concentration given in', type: 'select', default: 'ppmv', options: GAS_UNITS, visibleWhen: { phase: 'gas' } },
    { id: 'value', label: 'Concentration, in the unit chosen above', group: 'dimensionless', unit: 'none', default: 250, min: 0, max: 1e9 },
    { id: 'molar_mass', label: 'Molar mass of the substance M, g/mol', group: 'dimensionless', unit: 'none', default: 58.44, min: 1, max: 1e6, help: 'NaCl 58.44, CaCO₃ 100.09, NH₃ 17.03, CO 28.01, H₂S 34.08, CO₂ 44.01' },
    { id: 'density_kg_m3', label: 'Density of the solution', group: 'density', unit: 'kg_m3', default: 1000, min: 500, max: 3000, visibleWhen: { phase: 'solution' } },
    { id: 'temp_k', label: 'Gas temperature', group: 'temperature', unit: 'K', display: 'C', default: 298.15, min: 150, max: 1500, visibleWhen: { phase: 'gas' } },
    { id: 'pressure_pa', label: 'Gas pressure (absolute)', group: 'pressure', unit: 'Pa', display: 'kPa', default: 101325, min: 1000, max: 1e8, visibleWhen: { phase: 'gas' } },
  ],
  outputs: [
    out('ppm_mass', 'ppm by mass (mg/kg)', 'solution'),
    out('ppb_mass', 'ppb by mass (µg/kg)', 'solution'),
    out('pct_w', '% by weight (% w/w)', 'solution'),
    out('mg_L', 'mg/L', 'solution'),
    out('ug_L', 'µg/L', 'solution'),
    out('g_L', 'g/L', 'solution'),
    out('mol_L', 'Molarity, mol/L', 'solution'),
    out('mmol_L', 'mmol/L', 'solution'),
    out('ppmv', 'ppm by volume (ppmv)', 'gas'),
    out('ppbv', 'ppb by volume (ppbv)', 'gas'),
    out('pct_v', '% by volume', 'gas'),
    out('mg_m3', 'mg/m³', 'gas'),
    out('ug_m3', 'µg/m³', 'gas'),
    out('ppm_mass_air', 'ppm by mass in dry air (mg/kg)', 'gas'),
    out('molar_volume_L', 'Molar volume of the gas R T / P, L/mol', 'gas'),
  ],
  example: {
    inputs: { phase: 'solution', sol_unit: 'g_L', value: 35, molar_mass: 58.44, density_kg_m3: [1025, 'kg_m3'] },
    results: { ppm_mass: '34 146', pct_w: '3.415', mol_L: '0.599' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.phase, ['solution', 'gas'], 'phase', 'Mixture');
  const value = assertRange(x.value, 0, 1e9, 'value', 'Concentration');
  const M = assertRange(x.molar_mass, 1, 1e6, 'molar_mass', 'Molar mass M');
  const nul = Object.fromEntries(schema.outputs.map((o) => [o.id, null]));
  const warnings = [];
  if (x.phase === 'solution') {
    assertOneOf(x.sol_unit, SOL_UNITS.map((u) => u.value), 'sol_unit', 'Concentration given in');
    const rho = assertRange(x.density_kg_m3, 500, 3000, 'density_kg_m3', 'Density of the solution');
    const { w, c } = solutionFrom(value, x.sol_unit, rho, M);
    if (w > 1) throw new Error('Concentration: this is more than 100 % by weight of the solution; check the value, its unit and the density.');
    if (w > 0.01 && Math.abs(rho - 1000) < 1e-9) warnings.push('Above 1 % by weight the solution is usually denser than water; enter its actual density for mg/L and mol/L.');
    return {
      outputs: { ...nul, ppm_mass: w * 1e6, ppb_mass: w * 1e9, pct_w: w * 100, mg_L: c * 1000, ug_L: c * 1e6, g_L: c, mol_L: c / M, mmol_L: (1000 * c) / M },
      warnings,
    };
  }
  assertOneOf(x.gas_unit, GAS_UNITS.map((u) => u.value), 'gas_unit', 'Concentration given in');
  const T = assertRange(x.temp_k, 150, 1500, 'temp_k', 'Gas temperature');
  const P = assertRange(x.pressure_pa, 1000, 1e8, 'pressure_pa', 'Gas pressure');
  const xf = gasFraction(value, x.gas_unit, M, T, P);
  if (xf > 1) throw new Error('Concentration: this is more than 100 % by volume at the stated temperature and pressure; check the value and its unit.');
  const mgM3 = xf * M * (P / (R * T)) * 1000;
  const w = (xf * M) / (xf * M + (1 - xf) * M_AIR);
  if (P > 1e6) warnings.push('Above about 10 bar real-gas behaviour makes mg/m³ from the ideal gas law less accurate; correct the molar volume with the compressibility factor.');
  return {
    outputs: { ...nul, ppmv: xf * 1e6, ppbv: xf * 1e9, pct_v: xf * 100, mg_m3: mgM3, ug_m3: mgM3 * 1000, ppm_mass_air: w * 1e6, molar_volume_L: ((R * T) / P) * 1000 },
    warnings,
  };
}
