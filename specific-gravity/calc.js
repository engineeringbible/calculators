/**
 * specific-gravity/calc.js — specific gravity of liquids from density (water at 60 °F or 4 °C as reference), API
 * gravity and Baumé degrees (heavy and light scales) at 60/60 °F, and of gases relative to air from the molar mass.
 *
 * SG = ρ / ρ_water;  °API = 141.5 / SG60 − 131.5;  °Bé heavy = 145 − 145 / SG60;  °Bé light = 140 / SG60 − 130;
 * gas SG = M / M_air;  ρ_gas = P M / (R T).
 * Schema units: SI — kg/m³, K, Pa; molar mass in g/mol; gravities dimensionless.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';

/** Density of water at 60 °F (15.556 °C), kg/m³, as used by API MPMS Ch. 11.1 for 60/60 °F gravities. */
export const WATER_60F = 999.016;
/** Density of water at 4 °C, kg/m³ (CIPM 2001, Tanaka et al.). */
export const WATER_4C = 999.972;
/** Molar mass of dry air, g/mol (ISO 2533:1975). */
export const M_AIR = 28.9644;
/** Molar gas constant, J/(mol·K), exact (CODATA 2018). */
export const R = 8.314462618;
const LB_PER_GAL_PER_KG_M3 = 0.003785411784 / 0.45359237;

export const sgFromApi = (api) => 141.5 / (api + 131.5);
export const apiFromSg = (sg) => 141.5 / sg - 131.5;
export const sgFromBaumeHeavy = (be) => 145 / (145 - be);
export const sgFromBaumeLight = (be) => 140 / (130 + be);

export const schema = {
  id: 'specific-gravity',
  name: 'Specific gravity calculator (SG, API gravity, Baumé)',
  category: 'process',
  summary: 'Specific gravity of liquids from density, API gravity or Baumé degrees, and of gases from the molar mass, with density in kg/m³, lb/ft³ and lb/gal.',
  related: ['density', 'mass-flow', 'gas-compressibility', 'blending-ratio'],
  assumptions: [
    'Liquid specific gravity is the density divided by that of water at the reference chosen: 999.016 kg/m³ at 60 °F (the petroleum convention, API MPMS Ch. 11.1) or 999.972 kg/m³ at 4 °C (the scientific convention); the two differ by 0.1 %.',
    'API gravity and both Baumé scales are defined on the specific gravity at 60/60 °F, so a density entered for them must be the density at 60 °F (15.56 °C); correct a density measured at another temperature with the ASTM D1250 (API MPMS 11.1) tables first.',
    'Baumé heavy (145 − 145/SG) applies to liquids denser than water and Baumé light (140/SG − 130) to lighter liquids, the US scales used in North American industry.',
    'Gas specific gravity is the ratio of molar masses to dry air (28.964 g/mol), which equals the density ratio for ideal gases at the same temperature and pressure; the gas density uses the ideal gas law.',
  ],
  notes: [
    'Verification 2026-11-08: a 35 °API crude has SG 60/60 °F of 141.5 / 166.5 = 0.8498, density 849.0 kg/m³ at 60 °F, 7.09 lb/US gal and 34.7 °Bé on the light scale. Checked by hand.',
    'Published checks: water is 10 °API and 0 °Bé heavy; 66 °Bé sulphuric acid has SG 1.835; methane has a gas SG of 0.554.',
  ],
  sources: [
    'API Manual of Petroleum Measurement Standards Ch. 11.1 (ASTM D1250), and ASTM D287 / D1298: API gravity = 141.5 / SG(60/60 °F) − 131.5',
    'ASTM E100, Standard Specification for ASTM Hydrometers (specific gravity, API and Baumé heavy and light scales at 60/60 °F)',
    'Tanaka, M. et al. (2001), Recommended table for the density of water, Metrologia 38, 301–309 (CIPM water density)',
  ],
  inputs: [
    { id: 'fluid', label: 'Fluid', type: 'select', default: 'liquid', options: [{ value: 'liquid', label: 'Liquid' }, { value: 'gas', label: 'Gas (relative to air)' }] },
    { id: 'given', label: 'Known value', type: 'select', default: 'density', options: [{ value: 'density', label: 'Density' }, { value: 'sg', label: 'Specific gravity' }, { value: 'api', label: 'API gravity (°API)' }, { value: 'be_heavy', label: 'Baumé, heavier than water (°Bé)' }, { value: 'be_light', label: 'Baumé, lighter than water (°Bé)' }], visibleWhen: { fluid: 'liquid' } },
    { id: 'reference', label: 'Water reference for SG', type: 'select', default: 'f60', options: [{ value: 'f60', label: 'Water at 60 °F (999.016 kg/m³), petroleum' }, { value: 'c4', label: 'Water at 4 °C (999.972 kg/m³)' }], visibleWhen: { fluid: 'liquid' } },
    { id: 'density_kg_m3', label: 'Density of the liquid', group: 'density', unit: 'kg_m3', default: 850, min: 100, max: 25000, visibleWhen: { fluid: 'liquid', given: 'density' } },
    { id: 'sg_in', label: 'Specific gravity (relative to the reference above)', group: 'dimensionless', unit: 'none', default: 0.85, min: 0.1, max: 25, visibleWhen: { fluid: 'liquid', given: 'sg' } },
    { id: 'api_in', label: 'API gravity, °API', group: 'dimensionless', unit: 'none', default: 35, min: -10, max: 150, visibleWhen: { fluid: 'liquid', given: 'api' } },
    { id: 'be_heavy_in', label: 'Baumé degrees (heavy scale), °Bé', group: 'dimensionless', unit: 'none', default: 66, min: 0, max: 80, visibleWhen: { fluid: 'liquid', given: 'be_heavy' } },
    { id: 'be_light_in', label: 'Baumé degrees (light scale), °Bé', group: 'dimensionless', unit: 'none', default: 40, min: 10, max: 150, visibleWhen: { fluid: 'liquid', given: 'be_light' } },
    { id: 'molar_mass', label: 'Molar mass of the gas, g/mol', group: 'dimensionless', unit: 'none', default: 16.043, min: 1, max: 500, visibleWhen: { fluid: 'gas' }, help: 'Methane 16.04, natural gas about 17 to 20, propane 44.10, CO₂ 44.01, H₂ 2.016' },
    { id: 'temp_k', label: 'Gas temperature', group: 'temperature', unit: 'K', display: 'C', default: 288.15, min: 100, max: 2000, visibleWhen: { fluid: 'gas' } },
    { id: 'pressure_pa', label: 'Gas pressure (absolute)', group: 'pressure', unit: 'Pa', display: 'kPa', default: 101325, min: 100, max: 1e7, visibleWhen: { fluid: 'gas' } },
  ],
  outputs: [
    { id: 'sg', label: 'Specific gravity (at the chosen reference; gas: air = 1)', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'sg60', label: 'Specific gravity 60/60 °F', group: 'dimensionless', unit: 'none', decimals: 4, visibleWhen: { fluid: 'liquid' } },
    { id: 'api', label: 'API gravity, °API', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { fluid: 'liquid' } },
    { id: 'be_heavy', label: 'Baumé heavy, °Bé (liquids denser than water)', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { fluid: 'liquid' } },
    { id: 'be_light', label: 'Baumé light, °Bé (liquids lighter than water)', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { fluid: 'liquid' } },
    { id: 'density_out', label: 'Density', group: 'density', unit: 'kg_m3' },
    { id: 'density_lb_ft3', label: 'Density in lb/ft³', group: 'density', unit: 'kg_m3', display: 'lb_ft3' },
    { id: 'lb_per_gal', label: 'Pounds per US gallon, lb/gal', group: 'dimensionless', unit: 'none', decimals: 3, visibleWhen: { fluid: 'liquid' } },
  ],
  example: {
    inputs: { fluid: 'liquid', given: 'api', reference: 'f60', api_in: 35 },
    results: { sg60: '0.8498', density_out: '849.0 kg/m³', lb_per_gal: '7.09', be_light: '34.7' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.fluid, ['liquid', 'gas'], 'fluid', 'Fluid');
  const warnings = [];
  if (x.fluid === 'gas') {
    const M = assertRange(x.molar_mass, 1, 500, 'molar_mass', 'Molar mass of the gas');
    const T = assertPositive(x.temp_k, 'temp_k', 'Gas temperature');
    const P = assertPositive(x.pressure_pa, 'pressure_pa', 'Gas pressure');
    const rho = (P * M) / 1000 / (R * T);
    if (P > 1e6) warnings.push('Above about 10 bar the ideal-gas density is less accurate; apply the compressibility factor Z (the gas compressibility calculator).');
    return { outputs: { sg: M / M_AIR, sg60: null, api: null, be_heavy: null, be_light: null, density_out: rho, density_lb_ft3: rho, lb_per_gal: null }, warnings };
  }
  assertOneOf(x.given, ['density', 'sg', 'api', 'be_heavy', 'be_light'], 'given', 'Known value');
  assertOneOf(x.reference, ['f60', 'c4'], 'reference', 'Water reference for SG');
  const rhoRef = x.reference === 'f60' ? WATER_60F : WATER_4C;
  let rho;
  if (x.given === 'density') rho = assertRange(x.density_kg_m3, 100, 25000, 'density_kg_m3', 'Density of the liquid');
  else if (x.given === 'sg') rho = assertRange(x.sg_in, 0.1, 25, 'sg_in', 'Specific gravity') * rhoRef;
  else if (x.given === 'api') rho = sgFromApi(assertRange(x.api_in, -10, 150, 'api_in', 'API gravity')) * WATER_60F;
  else if (x.given === 'be_heavy') rho = sgFromBaumeHeavy(assertRange(x.be_heavy_in, 0, 80, 'be_heavy_in', 'Baumé degrees (heavy scale)')) * WATER_60F;
  else rho = sgFromBaumeLight(assertRange(x.be_light_in, 10, 150, 'be_light_in', 'Baumé degrees (light scale)')) * WATER_60F;
  const sg60 = rho / WATER_60F;
  if (sg60 > 2.3 || sg60 < 0.5) warnings.push('Specific gravity outside 0.5 to 2.3, beyond the usual API and Baumé hydrometer scales: check the entry and its units.');
  return {
    outputs: {
      sg: rho / rhoRef,
      sg60,
      api: apiFromSg(sg60),
      be_heavy: sg60 >= 1 ? 145 - 145 / sg60 : null,
      be_light: sg60 <= 1 ? 140 / sg60 - 130 : null,
      density_out: rho,
      density_lb_ft3: rho,
      lb_per_gal: rho * LB_PER_GAL_PER_KG_M3,
    },
    warnings,
  };
}
