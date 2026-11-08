/**
 * eu-ets-fueleu/calc.js — EU ETS allowances and FuelEU Maritime compliance for one reporting year from the fuel
 * consumed, its split between intra-EEA/at-berth and extra-EEA voyages, and the Annex II default emission factors.
 *
 * FuelEU: GHGIE = f_wind × Σ M_i [WtT_i LCV_i + (1−slip_i)(CfCO2 + CfCH4·25 + CfN2O·298) + slip_i·25] / Σ M_i LCV_i;
 *         CB = (limit − GHGIE) × E_scope;  penalty = |CB| / (GHGIE × 41 000) × 2 400 € × (1 + 0.1 (N − 1)).
 * EU ETS:  CO₂e in scope × phase-in (40 % 2024, 70 % 2025, 100 % 2026+); CH₄ and N₂O (GWP 28/265) from 2026.
 * Schema units: t fuel, %, EUR (reported in dimensionless "EUR" outputs), gCO₂e/MJ.
 */
import { withDefaults, assertNonNegative, assertRange, assertOneOf, assertInteger, assertPositive } from '../shared/validate.js';

/** Regulation (EU) 2023/1805 Annex II default factors (fossil pathways). LCV MJ/g; WtT gCO₂e/MJ; Cf g/g fuel; slip fraction. */
export const FUELEU_FACTORS = {
  hfo: { label: 'HFO (ISO 8217 RME–RMK)', lcv: 0.0405, wtt: 13.5, co2: 3.114, ch4: 0.00005, n2o: 0.00018, slip: 0 },
  lfo: { label: 'LFO / VLSFO (RMA–RMD)', lcv: 0.041, wtt: 13.2, co2: 3.151, ch4: 0.00005, n2o: 0.00018, slip: 0 },
  mgo: { label: 'MDO / MGO (DMX–DMB)', lcv: 0.0427, wtt: 14.4, co2: 3.206, ch4: 0.00005, n2o: 0.00018, slip: 0 },
  lng_otto_ms: { label: 'LNG — Otto dual-fuel medium speed (slip 3.1 %)', lcv: 0.0491, wtt: 18.5, co2: 2.75, ch4: 0, n2o: 0.00011, slip: 0.031 },
  lng_otto_ss: { label: 'LNG — Otto dual-fuel slow speed (slip 1.7 %)', lcv: 0.0491, wtt: 18.5, co2: 2.75, ch4: 0, n2o: 0.00011, slip: 0.017 },
  lng_diesel_ss: { label: 'LNG — Diesel dual-fuel slow speed (slip 0.2 %)', lcv: 0.0491, wtt: 18.5, co2: 2.75, ch4: 0, n2o: 0.00011, slip: 0.002 },
  lng_lbsi: { label: 'LNG — lean-burn spark ignition (slip 2.6 %)', lcv: 0.0491, wtt: 18.5, co2: 2.75, ch4: 0, n2o: 0.00011, slip: 0.026 },
  lpg_propane: { label: 'LPG propane (fossil; CH₄/N₂O not yet given → 0)', lcv: 0.046, wtt: 7.8, co2: 3.0, ch4: 0, n2o: 0, slip: 0 },
  lpg_butane: { label: 'LPG butane (fossil; CH₄/N₂O not yet given → 0)', lcv: 0.046, wtt: 7.8, co2: 3.03, ch4: 0, n2o: 0, slip: 0 },
  methanol_fossil: { label: 'Methanol from natural gas (CH₄/N₂O not yet given → 0)', lcv: 0.0199, wtt: 31.3, co2: 1.375, ch4: 0, n2o: 0, slip: 0 },
  none: { label: '— not used —', lcv: 0, wtt: 0, co2: 0, ch4: 0, n2o: 0, slip: 0 },
};
export const FUEL_OPTIONS_EU = Object.entries(FUELEU_FACTORS).map(([value, f]) => ({ value, label: f.label }));

export const GHG_REFERENCE_G_MJ = 91.16;
/** Article 4(2) reductions by period start year. */
export const REDUCTION_STEPS = [
  { from: 2025, pct: 2 },
  { from: 2030, pct: 6 },
  { from: 2035, pct: 14.5 },
  { from: 2040, pct: 31 },
  { from: 2045, pct: 62 },
  { from: 2050, pct: 80 },
];
export const GWP_FUELEU = { ch4: 25, n2o: 298 };
export const GWP_ETS = { ch4: 28, n2o: 265 };
export const PENALTY_EUR_PER_T_VLSFO = 2400;
export const VLSFO_MJ_PER_T = 41000;
export const WIND_REWARD = { 1: 'No wind-assisted propulsion (f_wind 1.00)', 0.99: 'P_wind/P_prop 0.05–0.10 (f_wind 0.99)', 0.97: 'P_wind/P_prop 0.10–0.15 (f_wind 0.97)', 0.95: 'P_wind/P_prop ≥ 0.15 (f_wind 0.95)' };

export const schema = {
  id: 'eu-ets-fueleu',
  name: 'EU ETS and FuelEU Maritime',
  category: 'maritime',
  summary: 'EU ETS allowances and cost with phase-in and voyage scope; FuelEU Maritime GHG intensity against the yearly limit, compliance balance and penalty.',
  related: ['cii-rating', 'fuel-voyage-cost', 'generator-load', 'bunker-quantity'],
  assumptions: [
    'Scope follows both regulations: 100 % of the energy and emissions of voyages between EEA ports and at berth in EEA ports, 50 % of voyages between an EEA port and a third-country port, 0 % elsewhere; the user enters the share of each fuel burned in the first two categories and the remainder is out of scope. Ships ≥ 5 000 GT; exemptions (transhipment ports, islands, PSO routes, ice class) are not modelled.',
    'FuelEU GHG intensity is the well-to-wake energy-weighted average over ALL fuel in scope: GHGIE = f_wind Σ E_i (WtT_i + TtW_i)/Σ E_i, TtW_i = [(1 − C_slip)(Cf_CO2 + Cf_CH4·GWP_CH4 + Cf_N2O·GWP_N2O) + C_slip·GWP_CH4]/LCV with the RED II GWPs 25 and 298 (Annex I); the limit is 91.16 gCO₂e/MJ reduced by 2 % (2025), 6 % (2030), 14.5 % (2035), 31 % (2040), 62 % (2045) and 80 % (2050).',
    'Annex II default factors for fossil fuels (table reproduced in the EC guidance of 2025-10-08): the regulation marks CH₄ and N₂O for LPG and methanol as "to be measured" — they are taken as zero here, which slightly understates those fuels. Biofuels, RFNBOs (reward factor 2 until 2033), onshore power supply and the 2 % RFNBO sub-target from 2034 are not modelled; only fossil fuels are offered.',
    'Compliance balance CB = (GHGIE_target − GHGIE_actual) × E_scope in gCO₂e; penalty = |CB|/(GHGIE_actual × 41 000 MJ/t) × 2 400 EUR per tonne of VLSFO-equivalent energy, multiplied by 1 + (N − 1)/10 for N consecutive deficit years (Annex IV). A surplus can be banked or pooled; borrowing (up to 2 % of the limit × energy, at a 10 % premium) is not computed.',
    'EU ETS covers CO₂ for 2024–2025 reporting years and adds CH₄ and N₂O as CO₂-equivalent (GWP 28 and 265, Regulation (EU) 2020/1044) from the 2026 reporting year; allowances to surrender are 40 % of 2024, 70 % of 2025 and 100 % of 2026+ verified emissions (surrendered by 30 September of the following year). The emission factors used are the same Annex II/MRV values, with slip treated as unburnt methane. The penalty for non-surrender (100 EUR/t plus the allowances) is not included.',
    'The EUA price is an input; the cost shown is allowances × price with no hedging, no free allocation (none for shipping) and no administrative costs.',
  ],
  notes: [
    'Verification 2026-10-30: MGO well-to-wake intensity 90.77 gCO₂e/MJ (EC guidance Table 4.3), LNG Diesel slow-speed 76.08 (Table 4.4), HFO 91.744 (Bettersea worked example); limits 89.34/85.69/77.94/62.90/34.64/18.23 (KR guideline table); wind reward 0.99 × 90.77 = 89.86 (EC guidance Table 4.13).',
    'Verification 2026-10-30: ETS phase-in 40/70/100 % and the 50 % extra-EEA rule confirmed on the EMSA ETS page; CH₄ and N₂O from 1 January 2026.',
    'Design decision: three fuel slots with per-fuel scope shares cover dual-fuel ships and pilot fuel; a "none" option disables a slot.',
    'Design decision: FuelEU and ETS are computed from the same fuel entries so the two costs can be compared per tonne of fuel; the ETS CH₄ factor for LNG uses the slip percentage of the engine class, as the MRV delegated regulation does.',
  ],
  sources: [
    'Regulation (EU) 2023/1805 (FuelEU Maritime), Articles 2, 4, 20–23, Annex I (GHG intensity formula, GWPs, f_wind), Annex II (default emission factors), Annex IV (penalty)',
    'European Commission DG MOVE, "Guidance on the FuelEU Maritime Regulation for shipping companies", 2025-10-08 edition, Tables 4.2–4.4 and 4.12–4.13',
    'Directive (EU) 2023/959 amending Directive 2003/87/EC (EU ETS extension to maritime); Regulation (EU) 2023/957 (MRV amendments); EMSA "ETS extension to maritime" page (phase-in and scope)',
    'Korean Register, FuelEU Maritime Guidelines Rev. 2 (2024) — limits table, penalty formula, GWP values (25/298 FuelEU, 28/265 ETS)',
  ],
  inputs: [
    { id: 'year', label: 'Reporting year', type: 'select', default: '2025', options: ['2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035', '2040', '2045', '2050'].map((y) => ({ value: y, label: y })) },
    { id: 'fuel_1', label: 'Fuel 1', type: 'select', default: 'lfo', options: FUEL_OPTIONS_EU },
    { id: 'mass_1_t', label: 'Fuel 1 consumed in the year (all voyages)', group: 'mass', unit: 't', default: 5000, min: 0, max: 1e6 },
    { id: 'fuel_2', label: 'Fuel 2', type: 'select', default: 'mgo', options: FUEL_OPTIONS_EU },
    { id: 'mass_2_t', label: 'Fuel 2 consumed in the year', group: 'mass', unit: 't', default: 400, min: 0, max: 1e6 },
    { id: 'fuel_3', label: 'Fuel 3', type: 'select', default: 'none', options: FUEL_OPTIONS_EU },
    { id: 'mass_3_t', label: 'Fuel 3 consumed in the year', group: 'mass', unit: 't', default: 0, min: 0, max: 1e6, visibleWhen: { fuel_3: Object.keys(FUELEU_FACTORS).filter((k) => k !== 'none') } },
    { id: 'share_intra_pct', label: 'Share of fuel on intra-EEA voyages and at berth in EEA ports (100 % scope)', group: 'ratio', unit: 'pct', default: 30, min: 0, max: 100 },
    { id: 'share_extra_pct', label: 'Share of fuel on voyages between EEA and non-EEA ports (50 % scope)', group: 'ratio', unit: 'pct', default: 50, min: 0, max: 100, help: 'The remainder is outside both regulations.' },
    { id: 'f_wind', label: 'Wind-assisted propulsion reward factor', type: 'select', default: '1', options: Object.entries(WIND_REWARD).map(([value, label]) => ({ value, label })) },
    { id: 'consecutive_years', label: 'Consecutive years with a deficit incl. this one (penalty multiplier)', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 30, integer: true },
    { id: 'eua_price', label: 'EU allowance price (EUR per t CO₂e)', group: 'dimensionless', unit: 'none', default: 70, min: 0, max: 1000 },
  ],
  outputs: [
    { id: 'ghg_limit', label: 'FuelEU GHG intensity limit for the year', group: 'ghg_intensity', unit: 'gCO2e_MJ' },
    { id: 'ghg_actual', label: 'Attained GHG intensity (WtW, incl. f_wind)', group: 'ghg_intensity', unit: 'gCO2e_MJ' },
    { id: 'ghg_margin_pct', label: 'Margin to the limit (negative = deficit)', group: 'ratio', unit: 'pct' },
    { id: 'intensity_fuel_1', label: 'WtW intensity of fuel 1', group: 'ghg_intensity', unit: 'gCO2e_MJ' },
    { id: 'intensity_fuel_2', label: 'WtW intensity of fuel 2', group: 'ghg_intensity', unit: 'gCO2e_MJ' },
    { id: 'intensity_fuel_3', label: 'WtW intensity of fuel 3', group: 'ghg_intensity', unit: 'gCO2e_MJ' },
    { id: 'energy_scope_j', label: 'Energy in scope (100 % intra + 50 % extra)', group: 'energy', unit: 'J', display: 'GJ' },
    { id: 'compliance_balance_t', label: 'Compliance balance (positive = surplus)', group: 'mass', unit: 't' },
    { id: 'fueleu_status', label: 'FuelEU result', type: 'text' },
    { id: 'penalty_multiplier', label: 'Consecutive-deficit multiplier 1 + (N − 1)/10', group: 'dimensionless', unit: 'none' },
    { id: 'fueleu_penalty_eur', label: 'FuelEU penalty (EUR)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'ets_scope_factor', label: 'ETS/FuelEU scope factor on total fuel', group: 'ratio', unit: 'pct' },
    { id: 'ets_emissions_t', label: 'ETS emissions in scope (CO₂, +CH₄/N₂O from 2026)', group: 'mass', unit: 't' },
    { id: 'ets_phase_in_pct', label: 'ETS phase-in share for the year', group: 'ratio', unit: 'pct' },
    { id: 'ets_allowances_t', label: 'Allowances to surrender (EUA)', group: 'mass', unit: 't' },
    { id: 'ets_cost_eur', label: 'ETS cost at the EUA price (EUR)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'total_cost_eur', label: 'FuelEU penalty + ETS cost (EUR)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'cost_per_t_fuel_eur', label: 'Regulatory cost per tonne of in-scope fuel (EUR/t)', group: 'dimensionless', unit: 'none' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      ghg_actual: '91.3 gCO₂e/MJ',
      compliance_balance_t: '−245 t',
      fueleu_penalty_eur: '157 100',
      ets_emissions_t: '9 371 t',
      ets_phase_in_pct: '70 %',
      ets_cost_eur: '459 200',
      total_cost_eur: '616 300',
      cost_per_t_fuel_eur: '208',
    },
  },
};

/** FuelEU limit (gCO₂e/MJ) for a reporting year. */
export function ghgLimit(year) {
  let pct = 0;
  for (const step of REDUCTION_STEPS) if (year >= step.from) pct = step.pct;
  return GHG_REFERENCE_G_MJ * (1 - pct / 100);
}

/** Well-to-wake GHG intensity (gCO₂e/MJ) of a fuel pathway for the given GWPs. */
export function wtwIntensity(f, gwp = GWP_FUELEU) {
  if (f.lcv === 0) return 0;
  const ttwPerG = (1 - f.slip) * (f.co2 + f.ch4 * gwp.ch4 + f.n2o * gwp.n2o) + f.slip * gwp.ch4;
  return f.wtt + ttwPerG / f.lcv;
}

/** CO₂-equivalent per gram of fuel for the ETS (CO₂ only before 2026). */
export function etsCo2ePerG(f, year) {
  if (year < 2026) return (1 - f.slip) * f.co2;
  return (1 - f.slip) * (f.co2 + f.ch4 * GWP_ETS.ch4 + f.n2o * GWP_ETS.n2o) + f.slip * GWP_ETS.ch4;
}

/** ETS surrender share by reporting year. */
export function etsPhaseIn(year) {
  if (year <= 2024) return 0.4;
  if (year === 2025) return 0.7;
  return 1;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  const year = Number(i.year);
  assertRange(year, 2024, 2060, 'year', 'Reporting year');
  const fuels = [i.fuel_1, i.fuel_2, i.fuel_3];
  const masses = [i.mass_1_t, i.mass_2_t, i.mass_3_t];
  fuels.forEach((f, k) => assertOneOf(f, Object.keys(FUELEU_FACTORS), `fuel_${k + 1}`, `Fuel ${k + 1}`));
  masses.forEach((m, k) => assertNonNegative(m, `mass_${k + 1}_t`, `Fuel ${k + 1} mass`));
  assertRange(i.share_intra_pct, 0, 100, 'share_intra_pct', 'Intra-EEA share');
  assertRange(i.share_extra_pct, 0, 100, 'share_extra_pct', 'Extra-EEA share');
  if (i.share_intra_pct + i.share_extra_pct > 100.0001) throw new Error('The intra-EEA and extra-EEA shares add up to more than 100 %');
  const fWind = Number(i.f_wind);
  assertOneOf(fWind, [1, 0.99, 0.97, 0.95], 'f_wind', 'Wind reward factor');
  assertInteger(i.consecutive_years, 'consecutive_years', 'Consecutive years');
  assertRange(i.consecutive_years, 1, 50, 'consecutive_years', 'Consecutive years');
  assertNonNegative(i.eua_price, 'eua_price', 'EUA price');

  const scopeFactor = i.share_intra_pct / 100 + 0.5 * (i.share_extra_pct / 100);
  let energyScopeMJ = 0;
  let ghgScopeG = 0;
  let etsScopeG = 0;
  let massScopeT = 0;
  const intensities = [];
  fuels.forEach((key, k) => {
    const f = FUELEU_FACTORS[key];
    const massG = masses[k] * 1e6 * (key === 'none' ? 0 : 1);
    const energy = massG * f.lcv;
    const wtw = wtwIntensity(f);
    intensities.push(key === 'none' ? null : wtw);
    energyScopeMJ += energy * scopeFactor;
    ghgScopeG += energy * wtw * scopeFactor;
    etsScopeG += massG * etsCo2ePerG(f, year) * scopeFactor;
    if (key !== 'none') massScopeT += masses[k] * scopeFactor;
  });
  if (energyScopeMJ <= 0) throw new Error('No fuel in scope: enter a fuel mass and a non-zero EEA share');

  const limit = ghgLimit(year);
  const actual = (fWind * ghgScopeG) / energyScopeMJ;
  const cbG = (limit - actual) * energyScopeMJ;
  const multiplier = 1 + (i.consecutive_years - 1) / 10;
  const penalty = cbG < 0 ? (Math.abs(cbG) / (actual * VLSFO_MJ_PER_T)) * PENALTY_EUR_PER_T_VLSFO * multiplier : 0;
  const phaseIn = etsPhaseIn(year);
  const etsT = etsScopeG / 1e6;
  const allowances = etsT * phaseIn;
  const etsCost = allowances * i.eua_price;

  const status = cbG >= 0
    ? `COMPLIANT — surplus ${(cbG / 1e6).toFixed(0)} t CO₂e can be banked to next year or pooled`
    : `DEFICIT — ${(Math.abs(cbG) / 1e6).toFixed(0)} t CO₂e over the limit: pay ${penalty.toFixed(0)} EUR, pool with a surplus ship, or borrow (≤ 2 % of the limit × energy, 10 % premium)`;

  const warnings = [];
  if (fuels.some((f) => f.startsWith('lpg') || f === 'methanol_fossil')) warnings.push('LPG and fossil methanol: Annex II gives no default CH₄ and N₂O factors yet ("to be measured") — taken as zero, which slightly understates their intensity.');
  if (fuels.some((f) => f.startsWith('lng'))) warnings.push('LNG: the methane slip of the engine class dominates the result (3.1 % Otto medium speed down to 0.2 % Diesel slow speed) and is counted at GWP 25 (FuelEU) or 28 (ETS); certified actual slip may be used instead of the default.');
  if (year >= 2030 && cbG >= 0) warnings.push('Compliant with fossil fuel after 2030 is unusual: check the fuel mix — the limit falls to 85.69 in 2030 and 77.94 in 2035.');
  if (year < 2026) warnings.push('Before 2026 the ETS covers CO₂ only; from the 2026 reporting year CH₄ and N₂O are added (GWP 28 and 265).');
  if (fWind < 1) warnings.push(`Wind reward factor ${fWind} applied to the attained intensity (Annex I); P_wind must be verified.`);
  warnings.push('Fossil fuels only: biofuels, RFNBO (reward factor 2 until 2033), OPS electricity, banking/borrowing arithmetic and the 2034 RFNBO sub-target are outside this calculator.');
  warnings.push('Exemptions (transhipment ports, outermost regions, islands under 200 000 inhabitants, PSO routes, ice-class adjustments) are not applied.');

  return {
    outputs: {
      ghg_limit: limit,
      ghg_actual: actual,
      ghg_margin_pct: ((limit - actual) / limit) * 100,
      intensity_fuel_1: intensities[0],
      intensity_fuel_2: intensities[1],
      intensity_fuel_3: intensities[2],
      energy_scope_j: energyScopeMJ * 1e6,
      compliance_balance_t: cbG / 1e6,
      fueleu_status: status,
      penalty_multiplier: multiplier,
      fueleu_penalty_eur: penalty,
      ets_scope_factor: scopeFactor * 100,
      ets_emissions_t: etsT,
      ets_phase_in_pct: phaseIn * 100,
      ets_allowances_t: allowances,
      ets_cost_eur: etsCost,
      total_cost_eur: penalty + etsCost,
      cost_per_t_fuel_eur: massScopeT > 0 ? (penalty + etsCost) / massScopeT : null,
    },
    warnings,
  };
}
