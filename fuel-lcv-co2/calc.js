/**
 * fuel-lcv-co2/calc.js — net and gross specific energy of a marine fuel from its bunker delivery note properties
 * (ISO 8217 Annex H, residual and distillate forms), energy per tonne and per litre, the CO₂ factor by IMO grade or
 * from the carbon content, the emission intensity per MJ and the scaling to the 42 700 kJ/kg reference fuel.
 *
 * H.1  Q_net,res  = (46.704 − 8.802 ρ²·10⁻⁶ + 3.167 ρ·10⁻³)[1 − 0.01 (w_w + w_a + w_s)] + 0.0942 w_s − 0.02449 w_w  (MJ/kg)
 * H.3  Q_net,dist = (46.423 − 8.792 ρ²·10⁻⁶ + 3.170 ρ·10⁻³)[…] + 0.0942 w_s − 0.02449 w_w
 * H.2/H.4  gross: (52.190 − 8.802 ρ²·10⁻⁶)[…] + 0.0942 w_s ;  (51.916 − 8.792 ρ²·10⁻⁶)[…] + 0.0942 w_s
 * Schema units: kg/m³, % m/m, kJ/kg.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';
import { CO2_FACTOR_T_PER_T, FUEL_OPTIONS } from '../shared/fuels.js';

export const LCV_REF_KJ_KG = 42700;
const CO2_PER_C = 44.0095 / 12.011;

export const schema = {
  id: 'fuel-lcv-co2',
  name: 'Fuel net specific energy and CO₂ factor',
  category: 'maritime',
  summary: 'ISO 8217 net and gross specific energy from density, water, ash and sulphur; CO₂ factor by IMO grade or carbon content; g CO₂/MJ.',
  related: ['fuel-blend-heating', 'bunker-quantity', 'cii-rating', 'eu-ets-fueleu', 'sfoc-iso3046-correction'],
  sendTo: [
    {
      target: 'sfoc-iso3046-correction',
      label: 'SFOC correction with this calorific value',
      note: 'The net calorific value converts the corrected SFOC to the fuel actually burnt.',
      links: [{ to: 'lcv_kj_kg', from: 'q_net_kj_kg' }],
    },
    {
      target: 'bunker-quantity',
      label: 'Bunker quantity (volume to mass and energy)',
      note: 'Density at 15 °C and the net calorific value; enter the observed volume and temperature there.',
      links: [
        { to: 'density15_kg_m3', from: 'input:density_15_kg_m3' },
        { to: 'lcv_j_kg', from: 'q_net_kj_kg' },
      ],
    },
  ],
  assumptions: [
    'Net (lower) and gross (higher) specific energy from the ISO 8217:2017 Annex H correlations in density at 15 °C and the water, ash and sulphur mass fractions — H.1/H.2 for residual fuels and H.3/H.4 for distillates — "with a degree of accuracy acceptable for normal purposes" (about ±0.2 MJ/kg); a bomb-calorimeter value (ISO 1928 / ASTM D240) supersedes the estimate, and the correlations do not apply to biofuels, methanol, LNG or other non-petroleum fuels.',
    'Energy per tonne is Q_net × 1 000 (GJ/t) and energy per litre Q_net × ρ15/1 000 (MJ/L) at 15 °C; the volume-based figure changes with temperature through the VCF (bunker-quantity calculator).',
    'The CO₂ factor is either the IMO conversion factor for the fuel grade (MEPC.364(79)/CII guidelines: HFO 3.114, LFO 3.151, MGO 3.206 t CO₂/t fuel, derived from typical carbon contents of 84.9/85.9/87.5 %) or computed from a measured carbon content as C_F = w_C × 44.0095/12.011 assuming complete combustion; the fuel-specific value is what the EU MRV/ETS regulation accepts with a laboratory analysis.',
    'Emission intensity per unit energy g CO₂/MJ = C_F × 1 000/Q_net(MJ/kg) is the tank-to-wake basis FuelEU Maritime uses (HFO 76.9, MGO 75.1 g CO₂/MJ with the default values); well-to-wake and methane/N₂O terms are in the EU ETS and FuelEU calculator.',
    'The 42 700 kJ/kg reference is the ISO 3046 / ISO 19030 "normal fuel" to which shop-test SFOC and performance baselines refer; mass consumption of the actual fuel = reference-fuel mass × 42 700/Q_net.',
  ],
  notes: [
    'Verification 2026-10-31: a typical HFO (991 kg/m³, 0.2 % water, 0.05 % ash, 0.5 % sulphur) gives Q_net 40.93 MJ/kg and Q_gross 43.27 MJ/kg; a typical MGO (850 kg/m³, 0.05 % water, 0.01 % ash, 0.1 % sulphur) gives 42.71 MJ/kg — the 40.5–41 and 42.7 MJ/kg values quoted for these grades; HFO 3.114 t/t ÷ 40.5 MJ/kg = 76.9 g CO₂/MJ matches the FuelEU default.',
    'Transcription from the ISO 8217:2017 PDF (Annex H, formulae H.1–H.4): the sulphur and water terms print as "0,094 2 w_s" and "0,024 49 w_w", i.e. 0.0942 w_s and 0.02449 w_w; the gross formulas have no water term.',
  ],
  sources: [
    'ISO 8217:2017 Petroleum products — Fuels (class F) — Specifications of marine fuels, Annex H (informative) Calculation of specific energy, formulae H.1–H.4',
    'IMO Resolution MEPC.364(79) 2022 Guidelines on the method of calculation of the attained EEDI, Table 1 (C_F per fuel and carbon content)',
    'Regulation (EU) 2023/1805 (FuelEU Maritime) Annex II — default emission factors (HFO LCV 0.0405 MJ/g, C_F 3.114; MGO 0.0427, 3.206)',
    'ISO 3046-1:2002 clause 13 / ISO 19030-3:2016 — 42 700 kJ/kg reference fuel',
  ],
  inputs: [
    { id: 'fuel_class', label: 'Fuel class (ISO 8217 formula)', type: 'select', default: 'residual', options: [{ value: 'residual', label: 'Residual fuel (RM grades: HFO, VLSFO) — H.1/H.2' }, { value: 'distillate', label: 'Distillate fuel (DM grades: MGO, MDO) — H.3/H.4' }] },
    { id: 'density_15_kg_m3', label: 'Density at 15 °C ρ15', group: 'density', unit: 'kg_m3', default: 991, min: 700, max: 1100 },
    { id: 'water_pct', label: 'Water content w_w (% m/m)', group: 'ratio', unit: 'pct', default: 0.2, min: 0, max: 5 },
    { id: 'ash_pct', label: 'Ash content w_a (% m/m)', group: 'ratio', unit: 'pct', default: 0.05, min: 0, max: 1 },
    { id: 'sulphur_pct', label: 'Sulphur content w_s (% m/m)', group: 'ratio', unit: 'pct', default: 0.5, min: 0, max: 5 },
    { id: 'co2_mode', label: 'CO₂ factor from', type: 'select', default: 'grade', options: [{ value: 'grade', label: 'IMO conversion factor by fuel grade' }, { value: 'carbon', label: 'Measured carbon content' }] },
    { id: 'fuel_grade', label: 'Fuel grade (IMO C_F)', type: 'select', default: 'vlsfo', options: FUEL_OPTIONS, visibleWhen: { co2_mode: 'grade' } },
    { id: 'carbon_pct', label: 'Carbon content w_C (% m/m)', group: 'ratio', unit: 'pct', default: 86.5, min: 30, max: 95, visibleWhen: { co2_mode: 'carbon' } },
    { id: 'reference_lcv_kj_kg', label: 'Reference fuel net specific energy (shop test / baseline)', group: 'specific_energy', unit: 'kJ_kg', default: 42700, min: 30000, max: 50000 },
  ],
  outputs: [
    { id: 'q_net_kj_kg', label: 'Net specific energy Q_net (LCV)', group: 'specific_energy', unit: 'kJ_kg', display: 'MJ_kg' },
    { id: 'q_gross_kj_kg', label: 'Gross specific energy Q_gross (HCV)', group: 'specific_energy', unit: 'kJ_kg', display: 'MJ_kg' },
    { id: 'hydrogen_penalty_kj_kg', label: 'Gross − net (latent heat of the combustion water)', group: 'specific_energy', unit: 'kJ_kg', display: 'MJ_kg' },
    { id: 'energy_per_tonne_gj', label: 'Net energy per tonne (GJ/t)', group: 'dimensionless', unit: 'none' },
    { id: 'energy_per_litre_mj', label: 'Net energy per litre at 15 °C (MJ/L)', group: 'dimensionless', unit: 'none' },
    { id: 'co2_factor', label: 'CO₂ factor C_F (t CO₂ per t fuel)', group: 'dimensionless', unit: 'none' },
    { id: 'carbon_content_pct', label: 'Carbon content implied / entered', group: 'ratio', unit: 'pct' },
    { id: 'co2_per_mj', label: 'Tank-to-wake CO₂ intensity (g CO₂/MJ)', group: 'dimensionless', unit: 'none' },
    { id: 'co2_per_tonne_energy', label: 'CO₂ per GJ of fuel energy (kg CO₂/GJ)', group: 'dimensionless', unit: 'none' },
    { id: 'reference_scale', label: 'Mass scaling to the reference fuel (× consumption of reference fuel)', group: 'dimensionless', unit: 'none' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      q_net_kj_kg: '40.93 MJ/kg',
      q_gross_kj_kg: '43.27 MJ/kg',
      energy_per_tonne_gj: '40.93',
      energy_per_litre_mj: '40.6',
      co2_factor: '3.151',
      carbon_content_pct: '86.0 %',
      co2_per_mj: '77.0',
      co2_per_tonne_energy: '77.0',
    },
  },
};

/** ISO 8217 Annex H net specific energy, MJ/kg. */
export function netSpecificEnergyMjKg(fuelClass, rho15, waterPct, ashPct, sulphurPct) {
  const base = fuelClass === 'distillate'
    ? 46.423 - 8.792 * rho15 * rho15 * 1e-6 + 3.17 * rho15 * 1e-3
    : 46.704 - 8.802 * rho15 * rho15 * 1e-6 + 3.167 * rho15 * 1e-3;
  return base * (1 - 0.01 * (waterPct + ashPct + sulphurPct)) + 0.0942 * sulphurPct - 0.02449 * waterPct;
}

/** ISO 8217 Annex H gross specific energy, MJ/kg. */
export function grossSpecificEnergyMjKg(fuelClass, rho15, waterPct, ashPct, sulphurPct) {
  const base = fuelClass === 'distillate' ? 51.916 - 8.792 * rho15 * rho15 * 1e-6 : 52.19 - 8.802 * rho15 * rho15 * 1e-6;
  return base * (1 - 0.01 * (waterPct + ashPct + sulphurPct)) + 0.0942 * sulphurPct;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.fuel_class, ['residual', 'distillate'], 'fuel_class', 'Fuel class');
  assertRange(i.density_15_kg_m3, 600, 1200, 'density_15_kg_m3', 'Density');
  assertRange(i.water_pct, 0, 10, 'water_pct', 'Water');
  assertRange(i.ash_pct, 0, 5, 'ash_pct', 'Ash');
  assertRange(i.sulphur_pct, 0, 10, 'sulphur_pct', 'Sulphur');
  assertOneOf(i.co2_mode, ['grade', 'carbon'], 'co2_mode', 'CO₂ mode');
  assertPositive(i.reference_lcv_kj_kg, 'reference_lcv_kj_kg', 'Reference LCV');

  const qNet = netSpecificEnergyMjKg(i.fuel_class, i.density_15_kg_m3, i.water_pct, i.ash_pct, i.sulphur_pct);
  const qGross = grossSpecificEnergyMjKg(i.fuel_class, i.density_15_kg_m3, i.water_pct, i.ash_pct, i.sulphur_pct);
  let cf;
  let carbon;
  if (i.co2_mode === 'grade') {
    assertOneOf(i.fuel_grade, Object.keys(CO2_FACTOR_T_PER_T), 'fuel_grade', 'Fuel grade');
    cf = CO2_FACTOR_T_PER_T[i.fuel_grade];
    carbon = (cf / CO2_PER_C) * 100;
  } else {
    carbon = assertRange(i.carbon_pct, 10, 100, 'carbon_pct', 'Carbon content');
    cf = (carbon / 100) * CO2_PER_C;
  }
  const co2PerMj = (cf * 1000) / qNet;

  const warnings = [];
  if (i.fuel_class === 'residual' && i.density_15_kg_m3 < 900) warnings.push('Density below 900 kg/m³ with the residual formula: a distillate or light blend — check the fuel class.');
  if (i.fuel_class === 'distillate' && i.density_15_kg_m3 > 900) warnings.push('Density above 900 kg/m³ with the distillate formula: likely a residual grade — check the fuel class.');
  if (i.co2_mode === 'grade' && ['lng', 'methanol', 'ethanol', 'lpg_propane', 'lpg_butane'].includes(i.fuel_grade)) warnings.push('The ISO 8217 energy correlations are for petroleum fuels: the specific energy shown does not apply to LNG, LPG or alcohols — use the FuelEU default LCV for those.');
  if (i.water_pct > 0.5) warnings.push('Water above 0.5 %: beyond the ISO 8217 limit for most grades; the energy is reduced both by dilution and by evaporation of the water.');
  warnings.push('Correlation accuracy about ±0.2 MJ/kg: a bomb-calorimeter test (ISO 1928) supersedes it for custody or ETS purposes.');
  warnings.push('CO₂ factor assumes complete combustion of the carbon; CH₄, N₂O and the well-to-wake chain are in the EU ETS / FuelEU calculator.');

  return {
    outputs: {
      q_net_kj_kg: qNet * 1000,
      q_gross_kj_kg: qGross * 1000,
      hydrogen_penalty_kj_kg: (qGross - qNet) * 1000,
      energy_per_tonne_gj: qNet,
      energy_per_litre_mj: (qNet * i.density_15_kg_m3) / 1000,
      co2_factor: cf,
      carbon_content_pct: carbon,
      co2_per_mj: co2PerMj,
      co2_per_tonne_energy: co2PerMj,
      reference_scale: i.reference_lcv_kj_kg / (qNet * 1000),
      summary: `Q_net ${qNet.toFixed(2)} MJ/kg (gross ${qGross.toFixed(2)}), C_F ${cf.toFixed(3)} t/t → ${co2PerMj.toFixed(1)} g CO₂/MJ; one tonne of reference fuel (${i.reference_lcv_kj_kg} kJ/kg) equals ${(i.reference_lcv_kj_kg / (qNet * 1000)).toFixed(4)} t of this fuel`,
    },
    warnings,
  };
}
