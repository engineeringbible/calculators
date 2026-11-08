/**
 * wind-resistance/calc.js — added resistance and power from wind by ISO 15016:2025 Annex C: the wind resistance
 * coefficient C_AA from the Fujiwara regression (C.12–C.19, Table C.19 constants) or from wind-tunnel data, air
 * density from pressure and temperature, and R_AA relative to the still-air resistance already in the calm-water
 * baseline.
 *
 * R_AA = ½ ρ_A C_AA(ψ_WR) A_XV V_WR² − ½ ρ_A C_AA(0) A_XV V_G²            (C.1)
 * ρ_A = p_A / (2.8705 (t_A + 273.15))   p_A in hPa                        (C.2)
 * C_AA(ψ) = C_LF cos ψ + C_XLI (sin ψ − ½ sin ψ cos² ψ) sin ψ cos ψ + C_ALF sin ψ cos³ ψ   (C.12)
 * Ported from atlas_physics/fujiwara_wind.py (the production implementation) and pinned to it in the tests.
 * Schema units: knots, degrees, metres, m², °C, hPa, newtons, watts.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

const DEG = Math.PI / 180;
const KNOT_M_S = 1852 / 3600;
/** ISO 15016:2025 Table C.19 (identical to the 2015 Table C.2). Keys: branch 1 head wind (0 ≤ ψ < 90°), branch 2 following. */
const BETA = { 10: 0.922, 11: -0.507, 12: -1.162, 20: -0.018, 21: 5.091, 22: -10.367, 23: 3.011, 24: 0.341 };
const DELTA = { 10: -0.458, 11: -3.245, 12: 2.313, 20: 1.901, 21: -12.727, 22: -24.407, 23: 40.31, 24: 5.481 };
const EPSILON = { 10: 0.585, 11: 0.906, 12: -3.239, 20: 0.314, 21: 1.117 };
/** Formula C.19 beam-wind half range μ (degrees). */
const BEAM_SMOOTHING_DEG = 10;
/** Formula C.2 gas constant in hPa·m³/(kg·K) × 100. */
const AIR_CONSTANT = 2.8705;

export const schema = {
  id: 'wind-resistance',
  name: 'Wind resistance (ISO 15016)',
  category: 'maritime',
  summary: 'Added wind resistance and power from the relative wind by ISO 15016:2025 Annex C with the Fujiwara coefficients or wind-tunnel data.',
  related: ['true-wind', 'stawave-added-resistance', 'water-temperature-correction', 'shallow-water-speed'],
  assumptions: [
    'ISO 15016:2025 formula C.1: the resistance increase is the wind force at the relative wind minus the still-air resistance at the ship\'s own speed over ground, which is already contained in the calm-water baseline; both use the transverse projected area A_XV and the relative wind at the 10 m reference height (convert anemometer readings with the true-wind calculator, formulas C.3–C.11).',
    'C_AA from the Fujiwara et al. regression of ISO 15016:2025 C.3.5 (formulas C.12–C.18, Table C.19 constants) for the hull and superstructure geometry, with C.19 at exactly 90° (the mean of 80° and 100°, which makes the value at exactly 90° stand apart from its neighbours); positive C_AA is resistance, negative is assistance. When wind-tunnel or database coefficients for the ship type are available (Annex C.3.2–C.3.4) they take precedence and can be entered directly.',
    'Air density from formula C.2, ρ_A = p_A/(2.8705 (t_A + 273.15)) with p_A in hPa (1.225 kg/m³ at 1013.25 hPa and 15 °C).',
    'The added power uses the speed over ground and a quasi-propulsive efficiency, P = R_AA V_G/η_D, as the ISO 19030-2 Annex G wind correction does; directions are relative to the bow, 0° head wind and positive from starboard, and the coefficient is symmetric port–starboard.',
    'Steady wind only: gusts, the drift angle and rudder angle the wind induces, and the extra resistance of a yawed hull are not included.',
  ],
  notes: [
    'Verification 2026-10-31: the coefficients reproduce the production atlas_physics.fujiwara_wind implementation to 1e-12 for two ship geometries at head, bow, beam, quartering and following angles (pinned values in the tests); the air density is 1.2250 kg/m³ at 1013.25 hPa and 15 °C.',
  ],
  sources: [
    'ISO 15016:2025 Ships and marine technology — Guidelines for the assessment of speed and power performance by analysis of speed trial data, Annex C (C.1, C.2, C.3.5 formulas C.12–C.19, Table C.19)',
    'T. Fujiwara, M. Ueno, Y. Ikeda, "Cruising performance of a large passenger ship in heavy sea", Proc. ISOPE 2006 — the wind load regression',
    'ISO 19030-2:2016 Ships and marine technology — Measurement of changes in hull and propeller performance, Annex G (wind resistance correction)',
    'atlas-back atlas_physics/fujiwara_wind.py — production implementation this calculator is pinned to',
  ],
  inputs: [
    { id: 'relative_speed_kn', label: 'Relative wind speed at 10 m V_WR', group: 'speed', unit: 'kn', default: 30, min: 0, max: 150 },
    { id: 'relative_dir_deg', label: 'Relative wind direction ψ (0 = head wind, + from starboard)', group: 'angle', unit: 'deg', default: 20, min: -180, max: 360 },
    { id: 'sog_kn', label: 'Ship speed over ground V_G', group: 'speed', unit: 'kn', default: 14, min: 0, max: 50 },
    { id: 'air_temperature_c', label: 'Air temperature', group: 'temperature', unit: 'C', default: 15, min: -40, max: 50 },
    { id: 'air_pressure_hpa', label: 'Air pressure', group: 'pressure', unit: 'hPa', default: 1013.25, min: 900, max: 1080 },
    { id: 'axv_m2', label: 'Transverse projected area above the waterline A_XV', group: 'area', unit: 'm2', default: 600, min: 1, max: 20000 },
    {
      id: 'coefficients',
      label: 'Wind resistance coefficient',
      type: 'select',
      default: 'fujiwara',
      options: [
        { value: 'fujiwara', label: 'Fujiwara regression (ISO 15016 C.3.5)' },
        { value: 'given', label: 'Given from wind-tunnel or database data' },
      ],
    },
    { id: 'loa_m', label: 'Length overall L_OA', group: 'length', unit: 'm', default: 200, min: 5, max: 500, visibleWhen: { coefficients: 'fujiwara' } },
    { id: 'beam_m', label: 'Breadth B', group: 'length', unit: 'm', default: 32, min: 1, max: 80, visibleWhen: { coefficients: 'fujiwara' } },
    { id: 'alv_m2', label: 'Lateral projected area above the waterline A_LV', group: 'area', unit: 'm2', default: 1200, min: 1, max: 50000, visibleWhen: { coefficients: 'fujiwara' } },
    { id: 'aod_m2', label: 'Lateral projected area of superstructures above the upper deck A_OD', group: 'area', unit: 'm2', default: 800, min: 0, max: 50000, visibleWhen: { coefficients: 'fujiwara' } },
    { id: 'cmc_m', label: 'Centre of A_LV from amidships C_MC (+ forward)', group: 'length', unit: 'm', default: 10, min: -250, max: 250, visibleWhen: { coefficients: 'fujiwara' } },
    { id: 'hbr_m', label: 'Height of the top of the superstructure H_BR', group: 'length', unit: 'm', default: 25, min: 0.5, max: 100, visibleWhen: { coefficients: 'fujiwara' } },
    { id: 'hc_m', label: 'Height of the centre of A_LV above the waterline H_C', group: 'length', unit: 'm', default: 15, min: 0.1, max: 100, visibleWhen: { coefficients: 'fujiwara' } },
    { id: 'caa_psi', label: 'C_AA at the relative wind direction', group: 'dimensionless', unit: 'none', default: 0.9, min: -3, max: 3, visibleWhen: { coefficients: 'given' } },
    { id: 'caa_0', label: 'C_AA in head wind, C_AA(0)', group: 'dimensionless', unit: 'none', default: 0.8, min: -3, max: 3, visibleWhen: { coefficients: 'given' } },
    { id: 'eta_d', label: 'Quasi-propulsive efficiency η_D', group: 'dimensionless', unit: 'none', default: 0.7, min: 0.3, max: 0.9 },
  ],
  outputs: [
    { id: 'rho_air_kg_m3', label: 'Air density ρ_A', group: 'density', unit: 'kg_m3' },
    { id: 'caa_psi_out', label: 'C_AA at the relative wind direction', group: 'dimensionless', unit: 'none' },
    { id: 'caa_0_out', label: 'C_AA(0), head wind', group: 'dimensionless', unit: 'none' },
    { id: 'wind_force_n', label: 'Wind force ½ ρ C_AA(ψ) A_XV V_WR²', group: 'force', unit: 'N', display: 'kN' },
    { id: 'still_air_n', label: 'Still-air resistance ½ ρ C_AA(0) A_XV V_G² (in the baseline)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'raa_n', label: 'Resistance increase R_AA (+ resistance, − assistance)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'added_power_w', label: 'Added power R_AA V_G / η_D', group: 'power', unit: 'W', display: 'kW' },
    { id: 'coefficient_table', label: 'C_AA by relative wind direction', type: 'table', visibleWhen: { coefficients: 'fujiwara' } },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      rho_air_kg_m3: '1.225 kg/m³',
      caa_psi_out: '0.943',
      caa_0_out: '0.769',
      wind_force_n: '82.6 kN',
      still_air_n: '14.7 kN',
      raa_n: '67.9 kN',
      added_power_w: '699 kW',
    },
  },
};

/** Fold any angle into 0–180° (the coefficient is symmetric port–starboard). */
const fold = (deg) => {
  const a = ((deg % 360) + 360) % 360;
  return a > 180 ? 360 - a : a;
};

/** Fujiwara C_AA(ψ) for the geometry g = { loa, beam, aod, axv, alv, cmc, hbr, hc } (ISO 15016:2025 C.12–C.19). */
export function fujiwaraCoefficient(psiDeg, g) {
  const psi = fold(psiDeg);
  if (psi === 90) return 0.5 * (fujiwaraCoefficient(90 - BEAM_SMOOTHING_DEG, g) + fujiwaraCoefficient(90 + BEAM_SMOOTHING_DEG, g));
  let cLF;
  let cXLI;
  let cALF;
  if (psi < 90) {
    cLF = BETA[10] + BETA[11] * (g.alv / (g.loa * g.beam)) + BETA[12] * (g.cmc / g.loa);
    cXLI = DELTA[10] + DELTA[11] * (g.alv / (g.loa * g.hbr)) + DELTA[12] * (g.axv / (g.beam * g.hbr));
    cALF = EPSILON[10] + EPSILON[11] * (g.aod / g.alv) + EPSILON[12] * (g.beam / g.loa);
  } else {
    cLF = BETA[20] + BETA[21] * (g.beam / g.loa) + BETA[22] * (g.hc / g.loa) + BETA[23] * (g.aod / g.loa ** 2) + BETA[24] * (g.axv / g.beam ** 2);
    cXLI = DELTA[20] + DELTA[21] * (g.alv / (g.loa * g.hbr)) + DELTA[22] * (g.axv / g.alv) + DELTA[23] * (g.beam / g.loa) + DELTA[24] * (g.axv / (g.beam * g.hbr));
    cALF = EPSILON[20] + EPSILON[21] * (g.aod / g.alv);
  }
  const s = Math.sin(psi * DEG);
  const c = Math.cos(psi * DEG);
  return cLF * c + cXLI * (s - 0.5 * s * c * c) * s * c + cALF * s * c ** 3;
}

/** Air density (kg/m³) from pressure (hPa) and temperature (°C), ISO 15016 formula C.2. */
export function airDensity(pressureHpa, temperatureC) {
  return pressureHpa / (AIR_CONSTANT * (temperatureC + 273.15));
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertRange(i.relative_speed_kn, 0, 150, 'relative_speed_kn', 'Relative wind speed');
  assertRange(i.relative_dir_deg, -180, 360, 'relative_dir_deg', 'Relative wind direction');
  assertRange(i.sog_kn, 0, 50, 'sog_kn', 'Speed over ground');
  assertRange(i.air_temperature_c, -40, 50, 'air_temperature_c', 'Air temperature');
  assertPositive(i.air_pressure_hpa, 'air_pressure_hpa', 'Air pressure');
  assertPositive(i.axv_m2, 'axv_m2', 'A_XV');
  assertOneOf(i.coefficients, ['fujiwara', 'given'], 'coefficients', 'Wind resistance coefficient');
  assertRange(i.eta_d, 0.3, 0.9, 'eta_d', 'Quasi-propulsive efficiency');

  let caaPsi;
  let caa0;
  let table = null;
  if (i.coefficients === 'fujiwara') {
    for (const [id, label] of [['loa_m', 'L_OA'], ['beam_m', 'B'], ['alv_m2', 'A_LV'], ['hbr_m', 'H_BR'], ['hc_m', 'H_C']]) assertPositive(i[id], id, label);
    if (!(i.aod_m2 >= 0)) throw new Error('A_OD must not be negative');
    const g = { loa: i.loa_m, beam: i.beam_m, aod: i.aod_m2, axv: i.axv_m2, alv: i.alv_m2, cmc: i.cmc_m, hbr: i.hbr_m, hc: i.hc_m };
    caaPsi = fujiwaraCoefficient(i.relative_dir_deg, g);
    caa0 = fujiwaraCoefficient(0, g);
    const rows = [];
    for (let a = 0; a <= 180; a += 10) rows.push([a, fujiwaraCoefficient(a, g)]);
    table = { columns: ['Relative direction (°)', 'C_AA'], rows };
  } else {
    assertRange(i.caa_psi, -3, 3, 'caa_psi', 'C_AA(ψ)');
    assertRange(i.caa_0, -3, 3, 'caa_0', 'C_AA(0)');
    caaPsi = i.caa_psi;
    caa0 = i.caa_0;
  }
  const rho = airDensity(i.air_pressure_hpa, i.air_temperature_c);
  const vwr = i.relative_speed_kn * KNOT_M_S;
  const vg = i.sog_kn * KNOT_M_S;
  const windForce = 0.5 * rho * caaPsi * i.axv_m2 * vwr * vwr;
  const stillAir = 0.5 * rho * caa0 * i.axv_m2 * vg * vg;
  const raa = windForce - stillAir;
  const power = vg > 0 ? (raa * vg) / i.eta_d : 0;

  const warnings = [];
  if (i.coefficients === 'fujiwara' && fold(i.relative_dir_deg) === 90) warnings.push('Exactly 90°: ISO 15016 formula C.19 replaces C_AA by the mean of 80° and 100°, which differs from the values just either side of 90°; check a few degrees off the beam too.');
  if (raa < 0) warnings.push('Negative R_AA: the wind assists the ship (following wind stronger than the ship\'s own wind).');
  if (i.relative_speed_kn > 2 * Math.max(i.sog_kn, 1) && fold(i.relative_dir_deg) > 30 && fold(i.relative_dir_deg) < 150) warnings.push('Strong wind well off the bow: the drift and rudder angles it causes add resistance that this formula does not include.');
  warnings.push('Use the relative wind at the 10 m reference height (ISO 15016 C.9–C.11); anemometer readings are disturbed by the superstructure.');

  return {
    outputs: {
      rho_air_kg_m3: rho,
      caa_psi_out: caaPsi,
      caa_0_out: caa0,
      wind_force_n: windForce,
      still_air_n: stillAir,
      raa_n: raa,
      added_power_w: power,
      coefficient_table: table,
    },
    warnings,
  };
}
