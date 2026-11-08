/**
 * sfoc-iso3046-correction/calc.js — ISO 3046-1 power adjustment and specific fuel consumption recalculation for
 * ambient conditions: ratio of indicated power k from pressure, temperature and charge-air coolant ratios with the
 * Table 2 exponents, power adjustment factor α, fuel consumption factor β = k/α, plus the fuel heating-value correction.
 *
 * k = [(p_x − a φ_x p_sx)/(p_r − a φ_r p_sr)]^m (T_r/T_x)^n (T_cr/T_cx)^s;  α = k − 0.7 (1 − k)(1/η_m − 1);  P_x = α P_r;  β = k/α;  b_x = β b_r
 * Schema units: kPa, °C, %, kW, g/kWh, kJ/kg.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

/** ISO 3046-1:2002 Table 2 — formula reference: factor a and exponents m, n, s. */
export const FORMULA_REFERENCES = {
  A: { label: 'A — diesel, non-turbocharged, power limited by air/fuel ratio', a: 1, m: 1, n: 0.75, s: 0 },
  B: { label: 'B — diesel, non-turbocharged, power limited by thermal loading', a: 0, m: 1, n: 1, s: 0 },
  C: { label: 'C — diesel, turbocharged without charge air cooling (low/medium speed 4-stroke)', a: 0, m: 0.7, n: 2, s: 0 },
  D: { label: 'D — diesel, turbocharged with charge air cooling (low/medium speed 4-stroke)', a: 0, m: 0.7, n: 1.2, s: 1 },
  F: { label: 'F — pilot-injection gas (dual fuel), turbocharged with charge air cooling', a: 0, m: 0.57, n: 0.55, s: 1.75 },
  G: { label: 'G — high-pressure gas injection dual fuel, turbocharged with charge air cooling', a: 0, m: 0.7, n: 1.2, s: 1 },
  I: { label: 'I — spark ignition, non-turbocharged, high-speed 4-stroke', a: 1, m: 0.86, n: 0.55, s: 0 },
  J: { label: 'J — spark ignition gas, turbocharged with charge air cooling', a: 0, m: 0.57, n: 0.55, s: 1.75 },
};

/** ISO 3046 / ISO 19030 reference fuel lower calorific value, kJ/kg. */
export const LCV_REF_KJ_KG = 42700;

/** Saturation vapour pressure of water, kPa (Magnus, Alduchov & Eskridge 1996). */
export function saturationVapourPressureKpa(tempC) {
  return 0.61094 * Math.exp((17.625 * tempC) / (tempC + 243.04));
}

export const schema = {
  id: 'sfoc-iso3046-correction',
  name: 'Engine power and SFOC to ISO 3046 conditions',
  category: 'mechanical',
  summary: 'ISO 3046-1 power adjustment factor α and fuel consumption factor β between reference and site ambient conditions, with the fuel LCV correction.',
  related: ['generator-load', 'engine-bmep', 'fuel-lcv-co2', 'engine-room-ventilation', 'fuel-voyage-cost'],
  assumptions: [
    'ISO 3046-1:2002 clause 10 power adjustment: the ratio of indicated power k = [(p_x − a φ_x p_sx)/(p_r − a φ_r p_sr)]^m (T_r/T_x)^n (T_cr/T_cx)^s with the factor a and exponents m, n, s of Table 2 for the formula reference the manufacturer states (A–D diesel, F/G dual fuel, I/J spark ignition; E and H, low-speed two-stroke engines, have no recommended values and are not offered — the manufacturer\'s own factors apply); the power adjustment factor α = k − 0.7 (1 − k)(1/η_m − 1) accounts for the friction power that does not scale with the indicated power, and P_x = α P_r.',
    'Specific fuel consumption is recalculated with β = k/α (clause 10.4): the fuel per indicated kWh is unchanged while the brake power falls by α, so b_x = β b_r; the standard allows the manufacturer to declare other methods, and modern engines with electronic control may hold SFOC differently — the result is the ISO default, not a guarantee.',
    'Standard reference conditions of ISO 15550 / ISO 3046-1 clause 5: total barometric pressure 100 kPa, air temperature 298 K (25 °C), relative humidity 30 %, charge air coolant temperature 298 K (25 °C); manufacturers may declare substitute reference conditions (clause 10.3.2), which can be entered in the reference fields. Temperatures are absolute (K) in the ratios.',
    'The humidity term applies only where a = 1 (references A and I): the dry-air pressure p − φ p_s uses the saturation vapour pressure of water from the Magnus formula (Alduchov & Eskridge, ±0.1 % below 50 °C); where a = 0 the total barometric pressure is used.',
    'Mechanical efficiency η_m is the manufacturer\'s value at the declared power; 0.8 is the figure commonly used when none is declared (friction ≈ 20 % of indicated power); the exponent s is taken as zero where the charge air is cooled by engine jacket water at constant temperature (Table 2 note 3).',
    'Fuel heating value: ISO consumption figures refer to a fuel of 42 700 kJ/kg net; with another fuel the mass consumption scales with 42 700/LCV at the same energy per kWh (ISO 3046-1 clause 13 / ISO 15550 fuel specification; ISO 19030 uses the same reference), so b_fuel = β b_r × 42 700/LCV.',
  ],
  notes: [
    'Verification 2026-10-31: reference D engine at site 45 °C air, 36 °C charge-air coolant, 100 kPa, η_m 0.8 → k = (298.15/318.15)^1.2 × (298.15/309.15) = 0.8921, α = 0.8733 (−12.7 % power), β = 1.0216 (+2.2 % SFOC): the derating magnitude manufacturers quote for tropical conditions on medium-speed engines (≈ 1 % per 1.5–2 K of air temperature).',
    'Design decision: Table 2 is reproduced from the ISO 3046-1:2002 preview (iTeh sample pages 5–6, 2026-10-31); references E and H are excluded on purpose because the standard gives no values (nr). β = k/α is the clause 10.4 relation as cited by CIMAC and engine makers; the preview did not include the clause text itself.',
  ],
  sources: [
    'ISO 3046-1:2002 Reciprocating internal combustion engines — Performance — Part 1: Declarations of power, fuel and lubricating oil consumptions, and test methods, clause 10 and Table 2 (formulae 1–3)',
    'ISO 15550:2002 Internal combustion engines — Determination and method for the measurement of engine power — General requirements, clause 5 (standard reference conditions 100 kPa, 298 K, 30 %, 298 K)',
    'CIMAC Recommendation 2 (1980s) on the ambient-condition correction factors adopted by ISO 3046 (Table 2 note 1)',
    'O. A. Alduchov, R. E. Eskridge, "Improved Magnus form approximation of saturation vapor pressure", J. Appl. Meteorol. 35, 1996',
  ],
  inputs: [
    { id: 'formula_ref', label: 'Formula reference (ISO 3046-1 Table 2)', type: 'select', default: 'D', options: Object.entries(FORMULA_REFERENCES).map(([value, f]) => ({ value, label: f.label })) },
    { id: 'declared_power_kw', label: 'Declared power at reference conditions P_r', group: 'power', unit: 'kW', default: 10000, min: 1, max: 100000 },
    { id: 'sfoc_ref_g_kwh', label: 'SFOC at reference conditions b_r (ISO fuel 42 700 kJ/kg)', group: 'specific_fuel', unit: 'g_kWh', default: 175, min: 100, max: 400 },
    { id: 'eta_m', label: 'Mechanical efficiency η_m', group: 'dimensionless', unit: 'none', default: 0.8, min: 0.5, max: 0.98 },
    { id: 'jacket_cooled', label: 'Charge air cooled by jacket water at constant temperature (s = 0)', type: 'select', default: 'no', options: [{ value: 'no', label: 'No — separate charge air coolant (exponent s applies)' }, { value: 'yes', label: 'Yes — s taken as zero (Table 2 note 3)' }] },
    { id: 'p_r_kpa', label: 'Reference total barometric pressure p_r', group: 'pressure', unit: 'kPa', default: 100, min: 50, max: 110 },
    { id: 't_r_c', label: 'Reference air temperature T_r', group: 'temperature', unit: 'C', default: 25, min: -20, max: 60 },
    { id: 'rh_r_pct', label: 'Reference relative humidity φ_r', group: 'ratio', unit: 'pct', default: 30, min: 0, max: 100 },
    { id: 't_cr_c', label: 'Reference charge air coolant temperature T_cr', group: 'temperature', unit: 'C', default: 25, min: -20, max: 70 },
    { id: 'p_x_kpa', label: 'Site total barometric pressure p_x', group: 'pressure', unit: 'kPa', default: 100, min: 50, max: 110 },
    { id: 't_x_c', label: 'Site air temperature at the engine inlet T_x', group: 'temperature', unit: 'C', default: 45, min: -40, max: 70 },
    { id: 'rh_x_pct', label: 'Site relative humidity φ_x', group: 'ratio', unit: 'pct', default: 60, min: 0, max: 100 },
    { id: 't_cx_c', label: 'Site charge air coolant temperature T_cx', group: 'temperature', unit: 'C', default: 36, min: -20, max: 80 },
    { id: 'lcv_kj_kg', label: 'Net calorific value of the fuel in use', group: 'specific_energy', unit: 'kJ_kg', default: 42700, min: 15000, max: 55000 },
  ],
  outputs: [
    { id: 'p_s_ref_kpa', label: 'Saturation vapour pressure at T_r', group: 'pressure', unit: 'kPa' },
    { id: 'p_s_site_kpa', label: 'Saturation vapour pressure at T_x', group: 'pressure', unit: 'kPa' },
    { id: 'pressure_ratio', label: 'Pressure ratio term [(p_x − a φ_x p_sx)/(p_r − a φ_r p_sr)]^m', group: 'dimensionless', unit: 'none' },
    { id: 'temperature_ratio', label: 'Temperature term (T_r/T_x)^n', group: 'dimensionless', unit: 'none' },
    { id: 'coolant_ratio', label: 'Charge air coolant term (T_cr/T_cx)^s', group: 'dimensionless', unit: 'none' },
    { id: 'k', label: 'Ratio of indicated power k', group: 'dimensionless', unit: 'none' },
    { id: 'alpha', label: 'Power adjustment factor α = k − 0.7 (1 − k)(1/η_m − 1)', group: 'dimensionless', unit: 'none' },
    { id: 'site_power_w', label: 'Power at site conditions P_x = α P_r', group: 'power', unit: 'W', display: 'kW' },
    { id: 'power_change_pct', label: 'Power change', group: 'ratio', unit: 'pct' },
    { id: 'beta', label: 'Fuel consumption factor β = k/α', group: 'dimensionless', unit: 'none' },
    { id: 'sfoc_site_g_kwh', label: 'SFOC at site conditions (ISO reference fuel)', group: 'specific_fuel', unit: 'g_kWh' },
    { id: 'sfoc_site_fuel_g_kwh', label: 'SFOC at site conditions with the fuel in use (× 42 700/LCV)', group: 'specific_fuel', unit: 'g_kWh' },
    { id: 'fuel_flow_kg_h', label: 'Fuel consumption at site power with the fuel in use', group: 'mass_flow', unit: 'kg_h' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      temperature_ratio: '0.9250',
      coolant_ratio: '0.9644',
      k: '0.8921',
      alpha: '0.8733',
      site_power_w: '8 733 kW',
      beta: '1.0216',
      sfoc_site_g_kwh: '178.8 g/kWh',
      sfoc_site_fuel_g_kwh: '178.8 g/kWh',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.formula_ref, Object.keys(FORMULA_REFERENCES), 'formula_ref', 'Formula reference');
  assertPositive(i.declared_power_kw, 'declared_power_kw', 'Declared power');
  assertPositive(i.sfoc_ref_g_kwh, 'sfoc_ref_g_kwh', 'Reference SFOC');
  assertRange(i.eta_m, 0.3, 1, 'eta_m', 'Mechanical efficiency');
  assertOneOf(i.jacket_cooled, ['no', 'yes'], 'jacket_cooled', 'Jacket cooling');
  for (const [key, label] of [['p_r_kpa', 'Reference pressure'], ['p_x_kpa', 'Site pressure'], ['lcv_kj_kg', 'Calorific value']]) assertPositive(i[key], key, label);
  for (const [key, label] of [['t_r_c', 'Reference temperature'], ['t_x_c', 'Site temperature'], ['t_cr_c', 'Reference coolant temperature'], ['t_cx_c', 'Site coolant temperature']]) assertRange(i[key], -60, 100, key, label);
  assertRange(i.rh_r_pct, 0, 100, 'rh_r_pct', 'Reference humidity');
  assertRange(i.rh_x_pct, 0, 100, 'rh_x_pct', 'Site humidity');

  const ref = FORMULA_REFERENCES[i.formula_ref];
  const s = i.jacket_cooled === 'yes' ? 0 : ref.s;
  const pSr = saturationVapourPressureKpa(i.t_r_c);
  const pSx = saturationVapourPressureKpa(i.t_x_c);
  const dryRef = i.p_r_kpa - ref.a * (i.rh_r_pct / 100) * pSr;
  const drySite = i.p_x_kpa - ref.a * (i.rh_x_pct / 100) * pSx;
  if (dryRef <= 0 || drySite <= 0) throw new Error('Dry air pressure is not positive: check pressure, temperature and humidity');
  const pressureTerm = (drySite / dryRef) ** ref.m;
  const temperatureTerm = ((i.t_r_c + 273.15) / (i.t_x_c + 273.15)) ** ref.n;
  const coolantTerm = ((i.t_cr_c + 273.15) / (i.t_cx_c + 273.15)) ** s;
  const k = pressureTerm * temperatureTerm * coolantTerm;
  const alpha = k - 0.7 * (1 - k) * (1 / i.eta_m - 1);
  if (alpha <= 0) throw new Error('Power adjustment factor is not positive: conditions far outside the method');
  const beta = k / alpha;
  const sitePowerW = alpha * i.declared_power_kw * 1000;
  const sfocSite = beta * i.sfoc_ref_g_kwh;
  const sfocFuel = sfocSite * (LCV_REF_KJ_KG / i.lcv_kj_kg);
  const fuelFlow = (sfocFuel * sitePowerW) / 1e6;

  const warnings = [];
  if (alpha > 1) warnings.push('Site conditions are more favourable than the reference: ISO 3046-1 note 2 allows the manufacturer to limit the power to the declared value — do not uprate without agreement.');
  if (Math.abs(1 - k) > 0.25) warnings.push('Indicated-power ratio differs from 1 by more than 25 %: the CIMAC exponents were established for moderate deviations; consult the manufacturer.');
  if (ref.a === 0 && Math.abs(i.rh_x_pct - i.rh_r_pct) > 30) warnings.push(`Humidity has no effect for formula reference ${i.formula_ref} (a = 0) by the standard, although it does change the charge density slightly.`);
  if (i.lcv_kj_kg !== LCV_REF_KJ_KG) warnings.push(`Fuel LCV ${i.lcv_kj_kg} kJ/kg: mass consumption scaled by 42 700/LCV at equal energy; density and injection effects on efficiency are not modelled.`);
  warnings.push('Table 2 factors are guideline values (note 2): the manufacturer may declare its own, and modern electronically controlled engines may limit power differently.');
  warnings.push('β = k/α is the ISO default recalculation; engines held at constant brake power by the governor see the fuel consumption change through turbocharger and air-excess effects instead.');

  return {
    outputs: {
      p_s_ref_kpa: pSr,
      p_s_site_kpa: pSx,
      pressure_ratio: pressureTerm,
      temperature_ratio: temperatureTerm,
      coolant_ratio: coolantTerm,
      k,
      alpha,
      site_power_w: sitePowerW,
      power_change_pct: (alpha - 1) * 100,
      beta,
      sfoc_site_g_kwh: sfocSite,
      sfoc_site_fuel_g_kwh: sfocFuel,
      fuel_flow_kg_h: fuelFlow,
      summary: `Reference ${i.formula_ref}: k ${k.toFixed(4)}, α ${alpha.toFixed(4)} → ${(alpha * i.declared_power_kw).toFixed(0)} kW at site (${((alpha - 1) * 100).toFixed(1)} %), SFOC ${sfocSite.toFixed(1)} g/kWh on ISO fuel (${((beta - 1) * 100).toFixed(1)} %)${i.lcv_kj_kg !== LCV_REF_KJ_KG ? `, ${sfocFuel.toFixed(1)} g/kWh with the ${i.lcv_kj_kg} kJ/kg fuel` : ''}`,
    },
    warnings,
  };
}
