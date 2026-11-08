/**
 * bearing-life/calc.js — rolling bearing rating life by ISO 281: dynamic equivalent load, basic rating life L10 in
 * revolutions and hours, the reliability factor a1 (ISO 281:2007 Table 1) and an optional a_ISO life modification
 * factor, static safety factor and a quick check against a target life.
 *
 * P = X F_r + Y F_a;  L10 = (C/P)^p [10⁶ rev];  L10h = 10⁶ L10/(60 n);  Lnm = a1 a_ISO L10.
 * Schema units: N (display kN), rpm, hours.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** ISO 281:2007 Table 1 — reliability factor a1 (the 1990 edition used 0.62/0.53/0.44/0.33/0.21). */
export const A1_TABLE = { 90: 1.0, 95: 0.64, 96: 0.55, 97: 0.47, 98: 0.37, 99: 0.25, 99.2: 0.22, 99.4: 0.19, 99.6: 0.16, 99.8: 0.12, 99.9: 0.093, 99.92: 0.087, 99.94: 0.08, 99.95: 0.077 };

export const BEARING_TYPES = {
  ball: { label: 'Ball bearings (deep groove, angular contact, self-aligning) — p = 3', p: 3 },
  roller: { label: 'Roller bearings (cylindrical, tapered, spherical, needle) — p = 10/3', p: 10 / 3 },
};

export const schema = {
  id: 'bearing-life',
  name: 'Rolling bearing L10 life (ISO 281)',
  category: 'mechanical',
  summary: 'Basic rating life in revolutions and hours from dynamic load rating, equivalent load and speed, with reliability and lubrication factors.',
  related: ['shaft-torque', 'three-phase-power', 'pump-affinity', 'hydraulic-cylinder'],
  assumptions: [
    'Basic rating life L10 = (C/P)^p million revolutions (ISO 281:2007 §5), the life 90 % of a population of identical bearings reaches under constant load and speed with adequate lubrication and no contamination, with p = 3 for ball and 10/3 for roller bearings; C is the catalogue basic dynamic load rating (for 10⁶ revolutions) and P the dynamic equivalent load.',
    'Dynamic equivalent load P = X F_r + Y F_a with the catalogue factors X and Y for the bearing type and the ratio F_a/(F_r) relative to the limiting value e — the user enters X, Y and e (defaults 0.56 / 1.55 / 0.28, a deep-groove ball bearing at F_a/C0 ≈ 0.08, for which 0.56 + Y e ≈ 1 so P is continuous at e); when F_a/F_r ≤ e the radial load alone applies (X = 1, Y = 0). Shock, vibration and misalignment are not included in P unless the user adds an application factor.',
    'Reliability: Lnm = a1 L10 with a1 from ISO 281:2007 Table 1 (90 % 1.00, 95 % 0.64, 96 % 0.55, 97 % 0.47, 98 % 0.37, 99 % 0.25, down to 99.95 % 0.077; three-parameter Weibull). The 1990 edition tabulated 0.62/0.53/0.44/0.33/0.21.',
    'Life modification factor a_ISO (lubricant film, contamination, fatigue load limit) is an input: 1 for the basic life; manufacturers\' diagrams give 0.1–50 depending on the viscosity ratio κ and the contamination factor η_c — the calculator does not reproduce them.',
    'Static safety s0 = C0/P0 uses the static load rating C0 and the static equivalent load, approximated here by the dynamic equivalent load unless entered; ISO 76 recommends s0 ≥ 1–2 for smooth running, more for shock or quiet running.',
    'Constant load and speed: variable duty cycles need the cubic-mean (Miner) combination of loads and the time-weighted speed before using this page.',
  ],
  notes: [
    'Verification 2026-10-30: the catalogue illustration C/P = 4 at 1 500 rpm gives L10 = 64 million revolutions and 711 hours (ball), 101.6 million and 1 129 hours (roller); a1 values transcribed from ISO 281:2007 Table 1 (99 % → 0.25, confirmed against the 1990 value 0.21 in the Accendo comparison); P = 0.56 × 4 + 1.55 × 1.5 = 4.565 kN for the default deep-groove case (F_a/F_r 0.375 > e 0.28); P never falls below F_r.',
    'Design decision: X and Y are inputs with deep-groove defaults because they vary with bearing series and F_a/C0; the register records this.',
  ],
  sources: [
    'ISO 281:2007 Rolling bearings — Dynamic load ratings and rating life (§5 basic rating life, Table 1 reliability factor a1, §9 modified rating life)',
    'ISO 76:2006 Rolling bearings — Static load ratings (static safety factor s0)',
    'ISO/TR 1281-2:2008 Rolling bearings — Explanatory notes on ISO 281 — Part 2: Modified rating life calculation (three-parameter Weibull a1)',
    'SKF Rolling Bearings catalogue (bearing selection, X/Y factors, a_SKF diagrams) and Schaeffler/FAG technical pocket guide',
  ],
  inputs: [
    { id: 'bearing_type', label: 'Bearing type', type: 'select', default: 'ball', options: Object.entries(BEARING_TYPES).map(([value, b]) => ({ value, label: b.label })) },
    { id: 'c_dynamic_n', label: 'Basic dynamic load rating C', group: 'force', unit: 'N', display: 'kN', default: 35000, min: 10, max: 1e8 },
    { id: 'c_static_n', label: 'Basic static load rating C0 (0 = skip the static check)', group: 'force', unit: 'N', display: 'kN', default: 20000, min: 0, max: 1e8 },
    { id: 'load_mode', label: 'Equivalent load', type: 'select', default: 'xy', options: [{ value: 'xy', label: 'From radial and axial loads with X and Y' }, { value: 'direct', label: 'Enter P directly' }] },
    { id: 'radial_n', label: 'Radial load F_r', group: 'force', unit: 'N', display: 'kN', default: 4000, min: 0, max: 1e8, visibleWhen: { load_mode: 'xy' } },
    { id: 'axial_n', label: 'Axial load F_a', group: 'force', unit: 'N', display: 'kN', default: 1500, min: 0, max: 1e8, visibleWhen: { load_mode: 'xy' } },
    { id: 'e_limit', label: 'Limiting ratio e (F_a/F_r above which Y applies)', group: 'dimensionless', unit: 'none', default: 0.28, min: 0.05, max: 2, visibleWhen: { load_mode: 'xy' }, help: 'Deep-groove: e 0.22–0.44 with Y 1.99–0.99 as F_a/C0 rises (catalogue).' },
    { id: 'x_factor', label: 'Radial factor X (when F_a/F_r > e)', group: 'dimensionless', unit: 'none', default: 0.56, min: 0.1, max: 1.5, visibleWhen: { load_mode: 'xy' } },
    { id: 'y_factor', label: 'Axial factor Y (when F_a/F_r > e)', group: 'dimensionless', unit: 'none', default: 1.55, min: 0, max: 5, visibleWhen: { load_mode: 'xy' } },
    { id: 'p_direct_n', label: 'Dynamic equivalent load P', group: 'force', unit: 'N', display: 'kN', default: 8750, min: 1, max: 1e8, visibleWhen: { load_mode: 'direct' } },
    { id: 'application_factor', label: 'Application / shock factor on P (1.0 smooth, 1.2–1.5 light shock, 1.5–3 heavy)', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 5 },
    { id: 'speed_rpm', label: 'Speed n', group: 'rotational_speed', unit: 'rpm', default: 1500, min: 0.1, max: 100000 },
    { id: 'reliability', label: 'Required reliability', type: 'select', default: '90', options: Object.keys(A1_TABLE).map((k) => ({ value: k, label: `${k} % (a1 = ${A1_TABLE[k]})` })) },
    { id: 'a_iso', label: 'Life modification factor a_ISO (1 = basic life)', group: 'dimensionless', unit: 'none', default: 1, min: 0.1, max: 50 },
    { id: 'target_hours', label: 'Required life for the application', group: 'time', unit: 'h', default: 20000, min: 1, max: 500000, help: 'Pumps/fans 20–40 000 h, marine auxiliaries 20–30 000 h, gearboxes 30–50 000 h.' },
    { id: 'hours_per_year', label: 'Operating hours per year', group: 'dimensionless', unit: 'none', default: 6000, min: 1, max: 8760 },
  ],
  outputs: [
    { id: 'ratio_fa_fr', label: 'F_a / F_r', group: 'dimensionless', unit: 'none' },
    { id: 'p_n', label: 'Dynamic equivalent load P (incl. application factor)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'c_over_p', label: 'Load ratio C/P', group: 'dimensionless', unit: 'none' },
    { id: 'l10_mrev', label: 'Basic rating life L10 (million revolutions)', group: 'dimensionless', unit: 'none' },
    { id: 'l10_h', label: 'Basic rating life L10h', group: 'time', unit: 'h' },
    { id: 'a1', label: 'Reliability factor a1', group: 'dimensionless', unit: 'none' },
    { id: 'lnm_mrev', label: 'Modified rating life Lnm = a1 a_ISO L10 (million revolutions)', group: 'dimensionless', unit: 'none' },
    { id: 'lnm_h', label: 'Modified rating life Lnmh', group: 'time', unit: 'h' },
    { id: 'life_years', label: 'Modified life in years at the operating hours', group: 'dimensionless', unit: 'none' },
    { id: 'target_check', label: 'Against the required life', type: 'text' },
    { id: 'c_required_n', label: 'Dynamic rating needed for the required life at this reliability', group: 'force', unit: 'N', display: 'kN' },
    { id: 'static_safety', label: 'Static safety factor s0 = C0 / P', group: 'dimensionless', unit: 'none' },
    { id: 'load_share_pct', label: 'P as share of C', group: 'ratio', unit: 'pct' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      ratio_fa_fr: '0.375',
      p_n: '4.57 kN',
      c_over_p: '7.67',
      l10_mrev: '450',
      l10_h: '5 000 h',
      lnm_mrev: '450',
      lnm_h: '5 000 h',
      c_required_n: '55.5 kN',
    },
  },
};

/** Basic rating life in million revolutions. */
export function basicLifeMrev(C, P, exponent) {
  return (C / P) ** exponent;
}

/** Hours from million revolutions and rpm. */
export function hoursFromMrev(lMrev, rpm) {
  return (lMrev * 1e6) / (60 * rpm);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.bearing_type, Object.keys(BEARING_TYPES), 'bearing_type', 'Bearing type');
  assertOneOf(i.load_mode, ['xy', 'direct'], 'load_mode', 'Load mode');
  assertOneOf(String(i.reliability), Object.keys(A1_TABLE), 'reliability', 'Reliability');
  assertPositive(i.c_dynamic_n, 'c_dynamic_n', 'Dynamic load rating');
  assertNonNegative(i.c_static_n, 'c_static_n', 'Static load rating');
  assertRange(i.application_factor, 1, 10, 'application_factor', 'Application factor');
  assertPositive(i.speed_rpm, 'speed_rpm', 'Speed');
  assertRange(i.a_iso, 0.01, 100, 'a_iso', 'a_ISO');
  assertPositive(i.target_hours, 'target_hours', 'Required life');
  assertPositive(i.hours_per_year, 'hours_per_year', 'Hours per year');

  let P;
  let ratio = null;
  if (i.load_mode === 'xy') {
    assertNonNegative(i.radial_n, 'radial_n', 'Radial load');
    assertNonNegative(i.axial_n, 'axial_n', 'Axial load');
    assertPositive(i.e_limit, 'e_limit', 'Limiting ratio e');
    assertPositive(i.x_factor, 'x_factor', 'X');
    assertNonNegative(i.y_factor, 'y_factor', 'Y');
    if (i.radial_n + i.axial_n <= 0) throw new Error('Enter a radial or axial load');
    ratio = i.radial_n > 0 ? i.axial_n / i.radial_n : Infinity;
    P = ratio > i.e_limit ? i.x_factor * i.radial_n + i.y_factor * i.axial_n : i.radial_n;
    if (P < i.radial_n) P = i.radial_n;
  } else P = assertPositive(i.p_direct_n, 'p_direct_n', 'Equivalent load');
  P *= i.application_factor;

  const p = BEARING_TYPES[i.bearing_type].p;
  const l10 = basicLifeMrev(i.c_dynamic_n, P, p);
  const l10h = hoursFromMrev(l10, i.speed_rpm);
  const a1 = A1_TABLE[i.reliability];
  const lnm = a1 * i.a_iso * l10;
  const lnmh = hoursFromMrev(lnm, i.speed_rpm);
  const years = lnmh / i.hours_per_year;
  const requiredMrev = (i.target_hours * 60 * i.speed_rpm) / 1e6;
  const cRequired = P * (requiredMrev / (a1 * i.a_iso)) ** (1 / p);
  const targetCheck = lnmh >= i.target_hours ? `OK — ${lnmh.toFixed(0)} h ≥ ${i.target_hours} h required (${(lnmh / i.target_hours).toFixed(2)} × )` : `SHORT — ${lnmh.toFixed(0)} h < ${i.target_hours} h required: a rating of ${(cRequired / 1000).toFixed(1)} kN would be needed (${(cRequired / i.c_dynamic_n).toFixed(2)} × C)`;
  const s0 = i.c_static_n > 0 ? i.c_static_n / P : null;

  const warnings = [];
  if (P / i.c_dynamic_n > 0.5) warnings.push('P above 0.5 C: outside the normal range of the rating-life formula (ISO 281 limits P to 0.5 C for ball bearings).');
  if (s0 !== null && s0 < 1) warnings.push('Static safety s0 below 1: permanent indentation of raceways under the static or shock load (ISO 76 recommends ≥ 1–2).');
  if (i.a_iso === 1) warnings.push('a_ISO = 1 (basic life): with good lubrication and clean conditions the modified life can be several times longer; with contamination or thin films, shorter — see the manufacturer\'s a_ISO diagram.');
  if (i.load_mode === 'xy' && ratio !== null && ratio > i.e_limit && i.x_factor === 0.56 && i.y_factor === 1.55) warnings.push('Default X 0.56 / Y 1.55 / e 0.28 (deep-groove ball bearing at F_a/C0 ≈ 0.08): Y and e depend on F_a/C0 and the series — take the catalogue values.');
  if (i.speed_rpm > 10000) warnings.push('High speed: check the bearing\'s limiting speed and lubrication; the rating life formula ignores centrifugal and thermal effects.');
  warnings.push('Constant load and speed assumed; combine duty cycles with the cubic-mean load before entering P.');

  return {
    outputs: {
      ratio_fa_fr: ratio !== null && Number.isFinite(ratio) ? ratio : null,
      p_n: P,
      c_over_p: i.c_dynamic_n / P,
      l10_mrev: l10,
      l10_h: l10h,
      a1,
      lnm_mrev: lnm,
      lnm_h: lnmh,
      life_years: years,
      target_check: targetCheck,
      c_required_n: cRequired,
      static_safety: s0,
      load_share_pct: (P / i.c_dynamic_n) * 100,
    },
    warnings,
  };
}
