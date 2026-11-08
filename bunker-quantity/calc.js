/**
 * bunker-quantity/calc.js — bunker mass from observed volume, temperature and density at 15 °C.
 *
 * Volume correction factor per the ASTM D1250-80 / API MPMS 11.1 (1980) / ISO 91-1 Table 54B generating equation:
 *   VCF = exp(−α ΔT (1 + 0.8 α ΔT)),  ΔT = T − 15 °C,  α = K0/ρ15² + K1/ρ15 (+ A) by product group.
 * Mass in vacuo = V15 × ρ15; mass in air = V15 × (ρ15 − 1.1 kg/m³) (ISO 91 / Table 56 air-buoyancy convention).
 * Schema units: m³, °C, kg/m³, MJ/kg, t, GJ.
 */
import { withDefaults, assertNonNegative, assertRange, assertOneOf, assertPositive } from '../shared/validate.js';

/** Table 54B product groups by density at 15 °C (kg/m³) with the generating-equation coefficients (per °C). */
export const PRODUCT_GROUPS = [
  { id: 'gasolines', label: 'Gasolines (610.6–770.35 kg/m³)', min: 610.6, max: 770.352, k0: 346.4228, k1: 0.4388, a: 0 },
  { id: 'transition', label: 'Transition zone (770.35–787.52 kg/m³)', min: 770.352, max: 787.5195, k0: 2680.3206, k1: 0, a: -0.00336312 },
  { id: 'jet_fuels', label: 'Jet fuels / kerosines (787.52–838.31 kg/m³)', min: 787.5195, max: 838.3127, k0: 594.5418, k1: 0, a: 0 },
  { id: 'fuel_oils', label: 'Fuel oils incl. MGO, MDO, HFO (838.31–1163.5 kg/m³)', min: 838.3127, max: 1163.5, k0: 186.9696, k1: 0.4862, a: 0 },
];

/** Standard air-buoyancy correction: density in air = density in vacuo − 1.1 kg/m³ (ISO 91, ASTM Table 56). */
export const AIR_BUOYANCY_KG_M3 = 1.1;

/** Reference fuel lower calorific value for SFOC and consumption curves, MJ/kg (ISO 3046-1 / ISO 15550). */
export const REFERENCE_LCV_MJ_KG = 42.7;

const REFERENCE_TEMPERATURE_C = 15;

export const schema = {
  id: 'bunker-quantity',
  name: 'Bunker quantity and density correction',
  category: 'maritime',
  summary: 'Bunker mass in vacuo and in air from sounded volume, temperature and density at 15 °C (Table 54B VCF), with energy content, cost and BDN comparison.',
  related: ['fuel-voyage-cost', 'draft-survey', 'cii-rating', 'unit-converter'],
  notes: [
    'Defect caught before release 2026-10-30: the Table 54B coefficients first recalled (K0 = 103.8720, K1 = 0.2701 for fuel oils) are the Fahrenheit set of Table 6B; the Celsius set is 1.8 × larger (186.9696, 0.4862) and gives the field-known VCF of 0.976 for HFO at 50 °C instead of 0.987.',
    'Verification 2026-10-30: VCF 0.9760 (991 kg/m³ at 50 °C) and 0.9875 (850 kg/m³ at 30 °C) agree with the printed Table 54B values; the temperature sensitivity of 0.07 % per °C for HFO matches the field rule.',
    'Design decision: the product group is chosen from the density automatically, with a warning when a "fuel oil" turns out to fall in another group, which usually means a unit error in the density.',
    'Design decision: the commercial figure is mass in air with the fixed ISO 91 buoyancy correction of 1.1 kg/m³; density stated in air on a BDN is converted to in vacuo before use.',
  ],
  assumptions: [
    'The volume correction factor uses the 1980 Table 54B generating equation VCF = exp(−α ΔT (1 + 0.8 α ΔT)) with α = K0/ρ15² + K1/ρ15 by product group; the printed tables round VCF to four decimals and the 2004 edition (ASTM D1250-04) differs from 1980 by up to about ±0.0002 for fuel oils.',
    'Product group is selected automatically from the density at 15 °C: gasolines, transition zone, jet fuels, fuel oils (838.3–1163.5 kg/m³ covers MGO, MDO and all residual grades). Densities outside 610.6–1163.5 kg/m³ are rejected.',
    'Density at 15 °C must be the value in vacuo as stated on the bunker delivery note; if the figure is in air, select that basis and 1.1 kg/m³ is added. Mass in air (the commercial quantity) = volume at 15 °C × (ρ15 − 1.1 kg/m³).',
    'The observed volume is taken as given from the tank tables after trim and heel correction; this calculator does not convert soundings or ullages and does not deduct free water or sediment.',
    'Temperature is the representative bulk temperature of the parcel; a 1 °C error changes the mass of HFO by about 0.07 %, so average the readings across the tank.',
    'Energy uses the entered lower calorific value (ISO 8217 does not specify LCV; typical HFO 40.2–40.8 MJ/kg, MGO 42.5–42.8 MJ/kg); the reference-fuel equivalent converts to the 42.7 MJ/kg basis used for SFOC and consumption curves.',
    'Cost is price × mass in air in a single currency; no exchange rate, no fuel-quality adjustments.',
    'The BDN comparison is a simple difference; typical measurement uncertainty of a sounding-based quantity is ±0.5 %, and larger shortfalls are the usual trigger for a letter of protest.',
  ],
  sources: [
    'ASTM D1250-80 / API MPMS Chapter 11.1 (1980) / ISO 91-1:1992 — Petroleum measurement tables, Table 54B generating equations and product-group coefficients',
    'ISO 91:2017 — Petroleum and related products: temperature and pressure volume correction factors; air-buoyancy convention 1.1 kg/m³ (ASTM Table 56 weight conversion)',
    'ISO 8217:2017 — Fuel standard for marine distillate and residual fuels (density limits, e.g. RMG 380 ≤ 991 kg/m³, DMA ≤ 890 kg/m³)',
    'ISO 3046-1 / ISO 15550 — reference fuel lower calorific value 42 700 kJ/kg for SFOC',
    'IMO MEPC.1/Circ.875 and MARPOL Annex VI reg. 18 — bunker delivery note content',
  ],
  inputs: [
    { id: 'volume_obs_m3', label: 'Observed volume at the measured temperature (from tank tables)', group: 'volume', unit: 'm3', default: 500, min: 0, max: 100000 },
    { id: 'temperature_c', label: 'Observed fuel temperature', group: 'temperature', unit: 'C', default: 45, min: -50, max: 150 },
    { id: 'density15_kg_m3', label: 'Density at 15 °C (bunker delivery note)', group: 'density', unit: 'kg_m3', default: 985, min: 600, max: 1200 },
    {
      id: 'density_basis',
      label: 'Density basis on the BDN',
      type: 'select',
      default: 'vacuo',
      options: [
        { value: 'vacuo', label: 'In vacuo (standard BDN statement)' },
        { value: 'air', label: 'In air (add 1.1 kg/m³ to get in vacuo)' },
      ],
    },
    { id: 'lcv_j_kg', label: 'Lower calorific value (BDN or analysis)', group: 'specific_energy', unit: 'J_kg', display: 'MJ_kg', default: 40.5e6, min: 10e6, max: 60e6, help: 'HFO 40.2–40.8, VLSFO 41–42, MGO 42.5–42.8, LNG ≈ 48–50 MJ/kg.' },
    { id: 'price', label: 'Bunker price (per tonne in air)', group: 'price_per_mass', unit: 'cur_t', default: 550, min: 0, max: 5000 },
    { id: 'bdn_mass_t', label: 'Quantity stated on the BDN (0 = no comparison)', group: 'mass', unit: 't', default: 0, min: 0, max: 100000 },
  ],
  outputs: [
    { id: 'product_group', label: 'Table 54B product group', type: 'text' },
    { id: 'density15_vacuo_kg_m3', label: 'Density at 15 °C in vacuo used', group: 'density', unit: 'kg_m3' },
    { id: 'alpha_per_c', label: 'Thermal expansion coefficient α at 15 °C (per °C)', group: 'dimensionless', unit: 'none' },
    { id: 'vcf', label: 'Volume correction factor VCF (Table 54B)', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'density_at_temp_kg_m3', label: 'Density at the observed temperature', group: 'density', unit: 'kg_m3' },
    { id: 'volume_15_m3', label: 'Volume at 15 °C', group: 'volume', unit: 'm3' },
    { id: 'mass_vacuo_t', label: 'Mass in vacuo', group: 'mass', unit: 't' },
    { id: 'mass_air_t', label: 'Mass in air (commercial quantity)', group: 'mass', unit: 't' },
    { id: 'energy_j', label: 'Energy content (mass in air × LCV)', group: 'energy', unit: 'J', display: 'GJ' },
    { id: 'reference_fuel_t', label: 'Equivalent tonnes of 42.7 MJ/kg reference fuel', group: 'mass', unit: 't' },
    { id: 'cost', label: 'Cost', group: 'money', unit: 'cur' },
    { id: 'bdn_difference_t', label: 'Measured minus BDN quantity', group: 'mass', unit: 't' },
    { id: 'bdn_difference_pct', label: 'Difference relative to the BDN', group: 'ratio', unit: 'pct' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      vcf: '0.9793',
      density_at_temp_kg_m3: '964.6 kg/m³',
      mass_vacuo_t: '482.3 t',
      mass_air_t: '481.8 t',
      cost: '265 000 $',
    },
  },
};

/** Product group for a density at 15 °C in vacuo (kg/m³), or null outside the table range. */
export function productGroup(density15) {
  return PRODUCT_GROUPS.find((g) => density15 >= g.min && density15 < g.max) || (density15 === 1163.5 ? PRODUCT_GROUPS[3] : null) || null;
}

/** Thermal expansion coefficient α (per °C) at 15 °C for Table 54B. */
export function alphaPerC(density15) {
  const group = productGroup(density15);
  if (!group) throw new Error(`Density ${density15} kg/m³ is outside the Table 54B range 610.6–1163.5 kg/m³`);
  return group.k0 / (density15 * density15) + group.k1 / density15 + group.a;
}

/** Volume correction factor from the observed temperature to 15 °C (Table 54B generating equation). */
export function volumeCorrectionFactor(density15, temperatureC) {
  const alpha = alphaPerC(density15);
  const dT = temperatureC - REFERENCE_TEMPERATURE_C;
  return Math.exp(-alpha * dT * (1 + 0.8 * alpha * dT));
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertNonNegative(i.volume_obs_m3, 'volume_obs_m3', 'Observed volume');
  assertRange(i.temperature_c, -50, 150, 'temperature_c', 'Temperature');
  assertOneOf(i.density_basis, ['vacuo', 'air'], 'density_basis', 'Density basis');
  assertPositive(i.density15_kg_m3, 'density15_kg_m3', 'Density at 15 °C');
  assertPositive(i.lcv_j_kg, 'lcv_j_kg', 'Lower calorific value');
  assertNonNegative(i.price, 'price', 'Price');
  assertNonNegative(i.bdn_mass_t, 'bdn_mass_t', 'BDN quantity');

  const densityVacuo = i.density_basis === 'air' ? i.density15_kg_m3 + AIR_BUOYANCY_KG_M3 : i.density15_kg_m3;
  const group = productGroup(densityVacuo);
  if (!group) throw new Error(`Density ${densityVacuo} kg/m³ in vacuo is outside the Table 54B range 610.6–1163.5 kg/m³`);
  const alpha = alphaPerC(densityVacuo);
  const vcf = volumeCorrectionFactor(densityVacuo, i.temperature_c);
  const volume15 = i.volume_obs_m3 * vcf;
  const massVacuoT = (volume15 * densityVacuo) / 1000;
  const massAirT = (volume15 * (densityVacuo - AIR_BUOYANCY_KG_M3)) / 1000;
  const energyJ = massAirT * 1000 * i.lcv_j_kg;
  const referenceFuelT = energyJ / (REFERENCE_LCV_MJ_KG * 1e6) / 1000;
  const bdnDifference = i.bdn_mass_t > 0 ? massAirT - i.bdn_mass_t : null;

  const warnings = [];
  if (group.id !== 'fuel_oils') warnings.push(`Density places this product in the "${group.label}" group, not the fuel-oil group — check that the density is in kg/m³ at 15 °C in vacuo.`);
  if (densityVacuo > 991 && densityVacuo <= 1010) warnings.push('Density above 991 kg/m³: exceeds the ISO 8217 RMG limit (RMK grades allow 1010); check the grade on the BDN.');
  if (densityVacuo > 1010) warnings.push('Density above 1010 kg/m³ exceeds every ISO 8217 residual grade — verify the figure.');
  if (group.id === 'fuel_oils' && densityVacuo > 900 && i.temperature_c < 30) warnings.push('Residual fuel below 30 °C is near or below typical pour points; the sounding may be unreliable and the parcel non-homogeneous.');
  if (bdnDifference !== null && Math.abs(bdnDifference / i.bdn_mass_t) > 0.005) warnings.push(`Measured quantity differs from the BDN by ${((bdnDifference / i.bdn_mass_t) * 100).toFixed(2)} %, beyond the usual ±0.5 % measurement tolerance — document temperatures, densities and soundings and consider a letter of protest.`);
  warnings.push('VCF from the 1980 Table 54B relation; the 2004 tables differ by up to ±0.0002. Free water and sediment are not deducted.');

  return {
    outputs: {
      product_group: group.label,
      density15_vacuo_kg_m3: densityVacuo,
      alpha_per_c: alpha,
      vcf,
      density_at_temp_kg_m3: densityVacuo * vcf,
      volume_15_m3: volume15,
      mass_vacuo_t: massVacuoT,
      mass_air_t: massAirT,
      energy_j: energyJ,
      reference_fuel_t: referenceFuelT,
      cost: massAirT * i.price,
      bdn_difference_t: bdnDifference,
      bdn_difference_pct: bdnDifference === null ? null : (bdnDifference / i.bdn_mass_t) * 100,
    },
    warnings,
  };
}
