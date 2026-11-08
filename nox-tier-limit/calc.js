/**
 * nox-tier-limit/calc.js — MARPOL Annex VI Regulation 13 NOx emission limits (Tier I, II, III) as a function of the
 * rated engine speed, the applicable tier from the keel-laying date and the operating area, the margin of a certified
 * or measured value against the limit, and the annual NOx mass at the limit and at the certified value.
 *
 * Tier I: 17.0 (n < 130), 45 n^−0.2 (130 ≤ n < 2000), 9.8 (n ≥ 2000) g/kWh;  Tier II: 14.4, 44 n^−0.23, 7.7;  Tier III: 3.4, 9 n^−0.2, 2.0
 * Schema units: rpm, g/kWh, kW, hours.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

export const TIERS = {
  I: { label: 'Tier I (ships constructed 2000-01-01 to 2010-12-31)', low: 17.0, coef: 45, exp: -0.2, high: 9.8 },
  II: { label: 'Tier II (constructed on or after 2011-01-01, global)', low: 14.4, coef: 44, exp: -0.23, high: 7.7 },
  III: { label: 'Tier III (NOx Emission Control Areas: North America/US Caribbean 2016, North Sea/Baltic 2021)', low: 3.4, coef: 9, exp: -0.2, high: 2.0 },
};

/** NOx limit, g/kWh, for a tier and rated speed n (rpm). */
export function noxLimit(tier, rpm) {
  const t = TIERS[tier];
  if (rpm < 130) return t.low;
  if (rpm >= 2000) return t.high;
  return t.coef * rpm ** t.exp;
}

export const schema = {
  id: 'nox-tier-limit',
  name: 'NOx tier limit by engine speed',
  category: 'maritime',
  summary: 'MARPOL Annex VI Reg. 13 Tier I/II/III NOx limits from rated speed, the applicable tier, the margin of the certified value and annual NOx mass.',
  related: ['eu-ets-fueleu', 'cii-rating', 'engine-bmep', 'generator-load', 'sfoc-iso3046-correction'],
  assumptions: [
    'Limits per MARPOL Annex VI Regulation 13 as a function of the rated engine speed n (rpm): Tier I 17.0 g/kWh below 130 rpm, 45 n^−0.2 from 130 to below 2 000 rpm, 9.8 at 2 000 rpm and above; Tier II 14.4 / 44 n^−0.23 / 7.7; Tier III 3.4 / 9 n^−0.2 / 2.0; the value is the weighted average over the NOx Technical Code test cycle (E2/E3/D2/C1), not an instantaneous limit.',
    'Applicability: Regulation 13 covers marine diesel engines above 130 kW installed on ships; Tier I applies to ships constructed (keel laid) from 1 January 2000, Tier II from 1 January 2011 worldwide, Tier III only when operating inside a NOx Emission Control Area for ships constructed on or after 1 January 2016 (North American and US Caribbean Sea ECAs) or 1 January 2021 (Baltic and North Sea ECAs); outside an ECA a Tier III ship meets Tier II; emines for emergency use, lifeboats and engines solely on ships in national waters with alternative measures are exempt (Reg. 13.1.2).',
    'Engines of pre-2000 ships (built 1990–1999, over 5 000 kW and over 90 L/cylinder) must meet Tier I where an approved method exists (Reg. 13.7); "major conversions" bring an engine to the tier of the conversion date; a certified value is the parent-engine value on the EIAPP certificate and applies at the test-cycle weighting.',
    'Annual NOx mass = power × load factor × hours × (g/kWh)/10⁶ in tonnes, a planning figure at the certified (or limit) value; actual emissions vary with load, ambient conditions and fuel, and the EIAPP value is a certification figure, not a measurement of in-service emissions.',
  ],
  notes: [
    'Verification 2026-10-31: 500 rpm → Tier I 12.98, Tier II 10.54, Tier III 2.60 g/kWh; the piecewise curves are continuous within 1 % at both breakpoints (130 rpm: 45 × 130^−0.2 = 17.0; 2 000 rpm: 45 × 2000^−0.2 = 9.84 vs 9.8; 44 × 2000^−0.23 = 7.66 vs 7.7; 9 × 2000^−0.2 = 1.97 vs 2.0), confirming the coefficients.',
    'Design decision: the applicable tier is derived from the construction date and the ECA switch, with the three limits always shown so a Tier III ship\'s Tier II value outside the ECA is visible.',
  ],
  sources: [
    'IMO MARPOL Annex VI, Regulation 13 — Nitrogen Oxides (NOx), as amended by MEPC.176(58), MEPC.251(66), MEPC.286(71) (Baltic/North Sea NECA)',
    'IMO NOx Technical Code 2008 (resolution MEPC.177(58) as amended) — test cycles and weighting factors',
    'IMO, "Nitrogen Oxides (NOx) — Regulation 13" guidance page (tier applicability dates)',
    'EIAPP certificate / Technical File requirements (NOx Technical Code chapter 2)',
  ],
  inputs: [
    { id: 'rated_rpm', label: 'Rated engine speed n', group: 'rotational_speed', unit: 'rpm', default: 500, min: 50, max: 4000 },
    { id: 'rated_power_kw', label: 'Rated power', group: 'power', unit: 'kW', default: 4000, min: 1, max: 100000 },
    { id: 'construction_year', label: 'Ship construction (keel-laying) year', group: 'dimensionless', unit: 'none', default: 2018, min: 1980, max: 2040, integer: true },
    { id: 'area', label: 'Operating area', type: 'select', default: 'neca_north_sea_baltic', options: [{ value: 'global', label: 'Outside any NOx ECA (Tier II at most)' }, { value: 'neca_north_america', label: 'North American / US Caribbean NECA (Tier III for ships built from 2016)' }, { value: 'neca_north_sea_baltic', label: 'Baltic Sea / North Sea NECA (Tier III for ships built from 2021)' }] },
    { id: 'certified_g_kwh', label: 'Certified (EIAPP) or measured NOx value', group: 'dimensionless', unit: 'none', default: 2.2, min: 0, max: 30, help: 'g/kWh, test-cycle weighted' },
    { id: 'load_factor', label: 'Average load factor', group: 'ratio', unit: 'frac', display: 'pct', default: 0.75, min: 0.05, max: 1 },
    { id: 'hours_per_year', label: 'Running hours per year', group: 'dimensionless', unit: 'none', default: 6000, min: 0, max: 8760 },
  ],
  outputs: [
    { id: 'tier1_limit', label: 'Tier I limit (g/kWh)', group: 'dimensionless', unit: 'none' },
    { id: 'tier2_limit', label: 'Tier II limit (g/kWh)', group: 'dimensionless', unit: 'none' },
    { id: 'tier3_limit', label: 'Tier III limit (g/kWh)', group: 'dimensionless', unit: 'none' },
    { id: 'applicable_tier', label: 'Applicable tier', type: 'text' },
    { id: 'applicable_limit', label: 'Applicable limit (g/kWh)', group: 'dimensionless', unit: 'none' },
    { id: 'margin_pct', label: 'Margin of the certified value below the applicable limit', group: 'ratio', unit: 'pct' },
    { id: 'compliance', label: 'Compliance', type: 'text' },
    { id: 'annual_nox_at_limit_t', label: 'Annual NOx at the applicable limit', group: 'mass', unit: 't' },
    { id: 'annual_nox_certified_t', label: 'Annual NOx at the certified value', group: 'mass', unit: 't' },
    { id: 'tier3_reduction_pct', label: 'Tier III reduction against Tier II at this speed', group: 'ratio', unit: 'pct' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      tier1_limit: '12.98',
      tier2_limit: '10.54',
      tier3_limit: '2.60',
      applicable_limit: '10.54',
      annual_nox_certified_t: '39.6 t',
      tier3_reduction_pct: '75 %',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.rated_rpm, 'rated_rpm', 'Rated speed');
  assertPositive(i.rated_power_kw, 'rated_power_kw', 'Rated power');
  assertInteger(i.construction_year, 'construction_year', 'Construction year');
  assertRange(i.construction_year, 1900, 2100, 'construction_year', 'Construction year');
  assertOneOf(i.area, ['global', 'neca_north_america', 'neca_north_sea_baltic'], 'area', 'Area');
  assertNonNegative(i.certified_g_kwh, 'certified_g_kwh', 'Certified value');
  assertRange(i.load_factor, 0, 1, 'load_factor', 'Load factor');
  assertRange(i.hours_per_year, 0, 8784, 'hours_per_year', 'Hours');

  const t1 = noxLimit('I', i.rated_rpm);
  const t2 = noxLimit('II', i.rated_rpm);
  const t3 = noxLimit('III', i.rated_rpm);
  let tier;
  let reason;
  if (i.construction_year < 2000) { tier = null; reason = 'Ship constructed before 2000: Regulation 13 applies only through Reg. 13.7 (pre-2000 engines > 5 000 kW and > 90 L/cyl with an approved method, Tier I) or after a major conversion'; }
  else if (i.construction_year < 2011) { tier = 'I'; reason = 'constructed 2000–2010'; }
  else {
    const tier3From = i.area === 'neca_north_america' ? 2016 : i.area === 'neca_north_sea_baltic' ? 2021 : null;
    if (tier3From !== null && i.construction_year >= tier3From) { tier = 'III'; reason = `constructed ${i.construction_year} ≥ ${tier3From}, operating in the ${i.area === 'neca_north_america' ? 'North American / US Caribbean' : 'Baltic / North Sea'} NECA`; }
    else { tier = 'II'; reason = tier3From === null ? 'constructed from 2011, outside a NECA' : `constructed ${i.construction_year} before the ${tier3From} NECA date — Tier II applies even inside the ECA`; }
  }
  const limit = tier === null ? null : noxLimit(tier, i.rated_rpm);
  const margin = limit === null ? null : ((limit - i.certified_g_kwh) / limit) * 100;
  const kwhPerYear = i.rated_power_kw * i.load_factor * i.hours_per_year;
  const annualAtLimit = limit === null ? null : (kwhPerYear * limit) / 1e6;
  const annualCertified = (kwhPerYear * i.certified_g_kwh) / 1e6;

  const warnings = [];
  if (i.rated_power_kw <= 130) warnings.push('Regulation 13 applies to engines above 130 kW: this engine is below the threshold.');
  if (tier === 'III') warnings.push('Tier III applies only while operating inside the NECA; outside it the same engine must meet Tier II (both limits are shown). Tier III needs SCR, EGR or LNG/dual-fuel operation.');
  if (tier !== null && i.certified_g_kwh > limit) warnings.push('Certified value exceeds the applicable limit: the engine cannot be certified for this tier without a NOx-reducing method.');
  if (i.rated_rpm >= 130 && i.rated_rpm < 2000) warnings.push('Within the speed-dependent band: the limit falls with rpm because slow engines have longer residence times and higher NOx formation.');
  warnings.push('Limits and certified values are NOx Technical Code test-cycle weighted averages (E2/E3/D2/C1), not instantaneous or in-service values; annual tonnes are a planning estimate.');
  warnings.push('Exemptions (emergency engines, lifeboats, national-waters alternatives) and the major-conversion rules are not evaluated here.');

  return {
    outputs: {
      tier1_limit: t1,
      tier2_limit: t2,
      tier3_limit: t3,
      applicable_tier: tier === null ? reason : `Tier ${tier} — ${reason}`,
      applicable_limit: limit,
      margin_pct: margin,
      compliance: limit === null ? 'No tier limit applies by construction date (see Reg. 13.7 for pre-2000 engines)' : i.certified_g_kwh <= limit ? `COMPLIES — ${i.certified_g_kwh} g/kWh ≤ Tier ${tier} limit ${limit.toFixed(2)} g/kWh (margin ${margin.toFixed(1)} %)` : `EXCEEDS — ${i.certified_g_kwh} g/kWh > Tier ${tier} limit ${limit.toFixed(2)} g/kWh`,
      annual_nox_at_limit_t: annualAtLimit,
      annual_nox_certified_t: annualCertified,
      tier3_reduction_pct: (1 - t3 / t2) * 100,
    },
    warnings,
  };
}
