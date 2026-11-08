/**
 * hull-roughness-penalty/calc.js — added resistance, power and fuel from hull roughness and fouling: ITTC-57 friction,
 * the ISO 15016 / ITTC-78 roughness allowance for the clean and the fouled hull, the resistance increase at constant
 * speed, the power and fuel penalty and the speed loss at constant power.
 *
 * Re = V L/ν;  C_F = 0.075/(log Re − 2)²;  ΔC_F(k_s) per shared/seawater.js;  ΔR = ½ρSV² [ΔC_F(k_s,fouled) − ΔC_F(k_s,clean)];
 * ΔP/P = ΔR/R_T at constant speed and propulsive efficiency;  ΔV/V = 1 − (1 + ΔP/P)^(−1/3) at constant power.
 * Schema units: m, m², kn, °C, µm, kW, g/kWh, currency/t.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';
import { seawaterDensity, seawaterKinematicViscosity, cfIttc57, roughnessAllowance } from '../shared/seawater.js';

const KN_TO_M_S = 1852 / 3600;

/** Hull surface conditions with equivalent sand roughness (Schultz 2007, Table 1 — Rt50 in µm). */
export const CONDITIONS = {
  as_applied: { label: 'Typical as-applied antifouling coating (150 µm)', ks_um: 150 },
  light_slime: { label: 'Deteriorated coating or light slime (300 µm)', ks_um: 300 },
  heavy_slime: { label: 'Heavy slime (600 µm)', ks_um: 600 },
  small_calcareous: { label: 'Small calcareous fouling or weed (1 000 µm)', ks_um: 1000 },
  medium_calcareous: { label: 'Medium calcareous fouling (3 000 µm)', ks_um: 3000 },
  heavy_calcareous: { label: 'Heavy calcareous fouling (10 000 µm)', ks_um: 10000 },
  custom: { label: 'Custom roughness', ks_um: null },
};

export const schema = {
  id: 'hull-roughness-penalty',
  name: 'Hull roughness and fouling penalty',
  category: 'maritime',
  summary: 'Added resistance, power, fuel and speed loss from hull roughness or fouling via the ITTC-57 line and the ISO 15016 roughness allowance.',
  related: ['hull-cleaning-interval', 'holtrop-mennen', 'admiralty-coefficient', 'water-temperature-correction', 'fuel-voyage-cost'],
  assumptions: [
    'Roughness acts only on the frictional part of the resistance through the roughness allowance ΔC_F; the viscous resistance of the clean hull is (1 + k) C_F ½ρSV² with the ITTC-1957 line and a form factor (1 + k), and ΔC_F is added without the form factor, as in the 1978 ITTC performance prediction method and ISO 15016:2025 (G.5).',
    'The roughness allowance follows ISO 15016:2025 E.7/G.8 (Townsin form, ΔC_F = 0.044[(k_s/L)^(1/3) − 10 Re^(−1/3)] + 0.000125, minimum 0) or the 1978 ITTC form [105 (k_s/L)^(1/3) − 0.64]·10⁻³; both treat k_s as a single equivalent sand roughness, which for coatings is close to the 50 mm cut-off hull roughness Rt50 and for fouling is the Schultz (2007) equivalent value — fouling is not sand roughness, so the equivalence is approximate (±30 %).',
    'The fouled condition is compared with the clean, newly coated hull (default 150 µm, the ISO default when no roughness survey exists): ΔR = ½ρSV² [ΔC_F(k_s,fouled) − ΔC_F(k_s,clean)].',
    'Power increase at constant speed ΔP/P = ΔR/R_T assumes the propulsive efficiency does not change with the added resistance (in reality the heavier propeller loading lowers it slightly, making the real penalty 5–10 % larger than computed); the total resistance comes either from the delivered power and η_D entered or from the clean viscous resistance divided by an assumed viscous share of the total.',
    'Speed loss at constant power uses the cubic law P ∝ V³: ΔV/V = 1 − (1 + ΔP/P)^(−1/3); fuel from the added power × SFOC × 24 h; CO₂ with the carbon factor entered (HFO 3.114 by default).',
    'Sea water density and viscosity from the ITTC 7.5-02-01-03 table at the temperature and salinity entered (shared/seawater.js).',
  ],
  notes: [
    'Verification 2026-10-31: for L 180 m at 6.5 m/s in 15 °C sea water (Re 9.846e8) the allowances reproduce the atlas_physics production pins (150 µm 9.677e-5, 300 µm 2.044e-4, 1 000 µm 4.620e-4, 10 000 µm 1.362e-3); heavy slime on a 5 500 m² hull with 3 200 kW delivered adds 29.0 kN, 8.66 % power, 1.16 t/day — inside the 10–20 % band Schultz (2007) predicts for heavy slime on a frigate.',
    'Design decision: the clean reference roughness is an input (not fixed at 150 µm) so a measured as-docked Rt50 can be used; the Schultz conditions are offered as presets with the custom value for survey data.',
    'Article check 2026-10-31 (schema.example): the worked example had been worked by hand with the speed rounded to 6.5 m/s (12.6 kn is 6.482 m/s), so its ½ρSV² (119.2 MN), ΔR (29.0 kN), ΔP/P (8.66 %), fuel (1.16 t/day, 291 t/year) and CO₂ (906 t) were 0.6–0.8 % high; restated in content.md with the results of this calculator.',
  ],
  sources: [
    'ITTC Recommended Procedure 7.5-02-03-01.4, 1978 ITTC Performance Prediction Method (roughness allowance, form factor, ITTC-57 line)',
    'ISO 15016:2025, Annex E (E.5–E.7) and Annex G (G.5–G.8) — friction coefficient and roughness allowance with k_s default 150 µm',
    'M. P. Schultz, "Effects of coating roughness and biofouling on ship resistance and powering", Biofouling 23(5), 2007, 331–341 — Table 1 hull conditions (150, 300, 600, 1 000, 3 000, 10 000 µm)',
    'R. L. Townsin, "The ITTC line — its genesis and correlation allowance", The Naval Architect, 1985; ITTC 7.5-02-01-03 water properties',
  ],
  inputs: [
    { id: 'lpp_m', label: 'Length between perpendiculars L_PP', group: 'length', unit: 'm', default: 180, min: 10, max: 450 },
    { id: 'wetted_surface_m2', label: 'Wetted surface area S', group: 'area', unit: 'm2', default: 5500, min: 50, max: 60000 },
    { id: 'speed_kn', label: 'Ship speed through water', group: 'speed', unit: 'kn', default: 12.6, min: 1, max: 40 },
    { id: 'water_temp_c', label: 'Sea water temperature', group: 'temperature', unit: 'C', default: 15, min: -2, max: 40 },
    { id: 'salinity_g_kg', label: 'Salinity (g/kg)', group: 'dimensionless', unit: 'none', default: 35, min: 0, max: 45 },
    { id: 'form_factor', label: 'Form factor (1 + k)', group: 'dimensionless', unit: 'none', default: 1.2, min: 1, max: 1.6 },
    { id: 'allowance_method', label: 'Roughness allowance formula', type: 'select', default: 'iso15016', options: [{ value: 'iso15016', label: 'ISO 15016:2025 E.7 / G.8 (Townsin form, Re-dependent)' }, { value: 'ittc78', label: '1978 ITTC [105 (k_s/L)^(1/3) − 0.64]·10⁻³' }] },
    { id: 'ks_clean_um', label: 'Roughness of the clean, newly coated hull k_s', group: 'length', unit: 'um', default: 150, min: 1, max: 1000, help: 'ISO default 150 µm; measured Rt50 after docking if available.' },
    { id: 'condition', label: 'Present hull condition', type: 'select', default: 'heavy_slime', options: Object.entries(CONDITIONS).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'ks_custom_um', label: 'Custom roughness k_s', group: 'length', unit: 'um', default: 500, min: 1, max: 50000, visibleWhen: { condition: 'custom' } },
    { id: 'resistance_mode', label: 'Total resistance from', type: 'select', default: 'power', options: [{ value: 'power', label: 'Delivered power at this speed and propulsive efficiency' }, { value: 'share', label: 'Viscous share of the total resistance (estimate)' }] },
    { id: 'delivered_power_kw', label: 'Delivered power at this speed (clean hull)', group: 'power', unit: 'kW', default: 3200, min: 10, max: 100000, visibleWhen: { resistance_mode: 'power' } },
    { id: 'viscous_share', label: 'Viscous share of the total resistance', group: 'ratio', unit: 'frac', display: 'pct', default: 0.8, min: 0.3, max: 1, visibleWhen: { resistance_mode: 'share' }, help: '0.75–0.85 for full slow ships, 0.5–0.65 for fast fine ships.' },
    { id: 'eta_d', label: 'Propulsive efficiency η_D', group: 'dimensionless', unit: 'none', default: 0.68, min: 0.4, max: 0.85 },
    { id: 'sfoc_g_kwh', label: 'Specific fuel consumption', group: 'specific_fuel', unit: 'g_kWh', default: 175, min: 120, max: 300 },
    { id: 'fuel_price', label: 'Fuel price', group: 'price_per_mass', unit: 'cur_t', default: 550, min: 0, max: 5000 },
    { id: 'co2_factor', label: 'CO₂ factor (t CO₂ per t fuel)', group: 'dimensionless', unit: 'none', default: 3.114, min: 0, max: 4 },
    { id: 'sea_days_per_year', label: 'Days at sea per year', group: 'dimensionless', unit: 'none', default: 250, min: 0, max: 365 },
  ],
  outputs: [
    { id: 'reynolds', label: 'Reynolds number Re = V L_PP/ν', group: 'dimensionless', unit: 'none' },
    { id: 'cf', label: 'ITTC-57 friction coefficient C_F', group: 'dimensionless', unit: 'none' },
    { id: 'dcf_clean', label: 'Roughness allowance ΔC_F, clean hull', group: 'dimensionless', unit: 'none' },
    { id: 'dcf_fouled', label: 'Roughness allowance ΔC_F, present condition', group: 'dimensionless', unit: 'none' },
    { id: 'dcf_increase', label: 'Increase of ΔC_F', group: 'dimensionless', unit: 'none' },
    { id: 'viscous_resistance_n', label: 'Viscous resistance of the clean hull (1 + k) C_F ½ρSV²', group: 'force', unit: 'N', display: 'kN' },
    { id: 'total_resistance_n', label: 'Total resistance of the clean hull R_T', group: 'force', unit: 'N', display: 'kN' },
    { id: 'added_resistance_n', label: 'Added resistance from the roughness increase ΔR', group: 'force', unit: 'N', display: 'kN' },
    { id: 'power_increase_pct', label: 'Power increase at constant speed ΔP/P', group: 'ratio', unit: 'pct' },
    { id: 'added_power_w', label: 'Added delivered power', group: 'power', unit: 'W', display: 'kW' },
    { id: 'speed_loss_pct', label: 'Speed loss at constant power (cubic law)', group: 'ratio', unit: 'pct' },
    { id: 'extra_fuel_t_day', label: 'Extra fuel per day at sea', group: 'mass', unit: 't' },
    { id: 'extra_fuel_t_year', label: 'Extra fuel per year', group: 'mass', unit: 't' },
    { id: 'extra_cost_year', label: 'Extra fuel cost per year', group: 'money', unit: 'cur' },
    { id: 'extra_co2_t_year', label: 'Extra CO₂ per year', group: 'mass', unit: 't' },
    { id: 'condition_text', label: 'Condition compared', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      viscous_resistance_n: '218 kN',
      total_resistance_n: '336 kN',
      added_resistance_n: '28.8 kN',
      power_increase_pct: '8.59 %',
      added_power_w: '275 kW',
      speed_loss_pct: '2.7 %',
      extra_fuel_t_day: '1.15',
      extra_fuel_t_year: '289',
      extra_cost_year: 'about 159 000',
      extra_co2_t_year: '899 t',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.lpp_m, 'lpp_m', 'Length');
  assertPositive(i.wetted_surface_m2, 'wetted_surface_m2', 'Wetted surface');
  assertPositive(i.speed_kn, 'speed_kn', 'Speed');
  assertRange(i.water_temp_c, -2, 40, 'water_temp_c', 'Water temperature');
  assertRange(i.salinity_g_kg, 0, 45, 'salinity_g_kg', 'Salinity');
  assertRange(i.form_factor, 1, 2, 'form_factor', 'Form factor');
  assertOneOf(i.allowance_method, ['iso15016', 'ittc78'], 'allowance_method', 'Allowance method');
  assertPositive(i.ks_clean_um, 'ks_clean_um', 'Clean roughness');
  assertOneOf(i.condition, Object.keys(CONDITIONS), 'condition', 'Condition');
  assertOneOf(i.resistance_mode, ['power', 'share'], 'resistance_mode', 'Resistance mode');
  assertRange(i.eta_d, 0.2, 1, 'eta_d', 'Propulsive efficiency');
  assertPositive(i.sfoc_g_kwh, 'sfoc_g_kwh', 'SFOC');
  assertNonNegative(i.fuel_price, 'fuel_price', 'Fuel price');
  assertNonNegative(i.co2_factor, 'co2_factor', 'CO₂ factor');
  assertRange(i.sea_days_per_year, 0, 366, 'sea_days_per_year', 'Sea days');

  const V = i.speed_kn * KN_TO_M_S;
  const rho = seawaterDensity(i.water_temp_c, i.salinity_g_kg);
  const nu = seawaterKinematicViscosity(i.water_temp_c, i.salinity_g_kg);
  const re = (V * i.lpp_m) / nu;
  const cf = cfIttc57(re);
  const ksClean = i.ks_clean_um * 1e-6;
  const ksFouled = (i.condition === 'custom' ? assertPositive(i.ks_custom_um, 'ks_custom_um', 'Custom roughness') : CONDITIONS[i.condition].ks_um) * 1e-6;
  const dcfClean = roughnessAllowance(re, i.lpp_m, ksClean, i.allowance_method);
  const dcfFouled = roughnessAllowance(re, i.lpp_m, ksFouled, i.allowance_method);
  const qS = 0.5 * rho * i.wetted_surface_m2 * V * V;
  const rViscous = qS * cf * i.form_factor;
  const addedR = qS * (dcfFouled - dcfClean);
  let rTotal;
  let powerW;
  if (i.resistance_mode === 'power') {
    assertPositive(i.delivered_power_kw, 'delivered_power_kw', 'Delivered power');
    powerW = i.delivered_power_kw * 1000;
    rTotal = (powerW * i.eta_d) / V;
  } else {
    assertRange(i.viscous_share, 0.2, 1, 'viscous_share', 'Viscous share');
    rTotal = (rViscous + qS * dcfClean) / i.viscous_share;
    powerW = (rTotal * V) / i.eta_d;
  }
  const dpRatio = addedR / rTotal;
  if (dpRatio <= -1) throw new Error('The roughness credit exceeds the total resistance implied by the power or viscous share entered: check the power, speed, wetted surface and the two roughness values');
  const addedPowerW = powerW * dpRatio;
  const speedLoss = 1 - (1 + dpRatio) ** (-1 / 3);
  const fuelPerDayT = (addedPowerW / 1000) * i.sfoc_g_kwh * 24 / 1e6;
  const fuelPerYearT = fuelPerDayT * i.sea_days_per_year;

  const warnings = [];
  if (i.water_temp_c < 0 || i.water_temp_c > 35) warnings.push('Water temperature outside the 0–35 °C ITTC table: properties held at the table end.');
  if (ksFouled < ksClean) warnings.push('Present roughness is smoother than the clean reference: the penalty is negative (a credit), check the two roughness values.');
  if (re < 1e7) warnings.push('Reynolds number below 1e7 (model scale or very low speed): the roughness allowance was derived for full-scale ships.');
  if (i.resistance_mode === 'share') warnings.push(`Total resistance estimated from a ${(i.viscous_share * 100).toFixed(0)} % viscous share: use the delivered power at this speed when known.`);
  if (dpRatio > 0.5) warnings.push('Power increase above 50 %: the constant-efficiency and cubic-law assumptions no longer hold; the propeller may not absorb the power.');
  warnings.push('Fouling is not sand-grain roughness: the Schultz equivalent k_s values carry about ±30 % uncertainty, and the propulsive efficiency drop with heavier propeller loading (5–10 % of the penalty) is not included.');
  warnings.push('Hull only: propeller roughness and fouling (typically a further 2–6 % of power) are a separate penalty.');

  return {
    outputs: {
      reynolds: re,
      cf,
      dcf_clean: dcfClean,
      dcf_fouled: dcfFouled,
      dcf_increase: dcfFouled - dcfClean,
      viscous_resistance_n: rViscous,
      total_resistance_n: rTotal,
      added_resistance_n: addedR,
      power_increase_pct: dpRatio * 100,
      added_power_w: addedPowerW,
      speed_loss_pct: speedLoss * 100,
      extra_fuel_t_day: fuelPerDayT,
      extra_fuel_t_year: fuelPerYearT,
      extra_cost_year: fuelPerYearT * i.fuel_price,
      extra_co2_t_year: fuelPerYearT * i.co2_factor,
      condition_text: `${(ksFouled * 1e6).toFixed(0)} µm (${i.condition === 'custom' ? 'custom' : CONDITIONS[i.condition].label.replace(/ \(.*\)$/, '')}) against a clean hull of ${i.ks_clean_um} µm, ${i.allowance_method === 'iso15016' ? 'ISO 15016' : 'ITTC-78'} allowance`,
    },
    warnings,
  };
}
