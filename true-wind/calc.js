/**
 * true-wind/calc.js — true wind from the relative (apparent) wind measured on board and back again, with the
 * anemometer height correction to the 10 m reference height of wind resistance coefficients, per ISO 15016:2025
 * Annex C.2.
 *
 * C.3  V_WT = √(V_WR² + V_G² − 2 V_WR V_G cos α_WR)
 * C.4  α_WT = atan2(V_WR sin(α_WR + ψ) − V_G sin ψ, V_WR cos(α_WR + ψ) − V_G cos ψ)
 * C.9  V_WTref = V_WT (Z_ref / Z_a)^(1/9)
 * C.10 V_WR = √(V_WT² + V_G² + 2 V_WT V_G cos(α_WT − ψ))
 * C.11 α_WR = atan2(V_WT sin(α_WT − ψ), V_G + V_WT cos(α_WT − ψ))
 * Directions are the directions the wind comes FROM; relative 0° = on the bow, positive from starboard.
 * Schema units: degrees, knots, metres.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const DEG = Math.PI / 180;
/** Profile exponents of the anemometer height correction: ISO 15016:2025 (C.9) and the earlier editions / ITTC 2017. */
const PROFILE_EXPONENTS = { iso2025: 1 / 9, iso2015: 1 / 7 };

const norm360 = (deg) => ((deg % 360) + 360) % 360;
const norm180 = (deg) => {
  const a = norm360(deg);
  return a > 180 ? a - 360 : a;
};
const tidy = (x) => (Math.abs(x) < 1e-9 ? 0 : x);

export const schema = {
  id: 'true-wind',
  name: 'True wind from apparent wind',
  category: 'maritime',
  summary: 'True and relative wind conversion per ISO 15016 with the anemometer height correction to the 10 m reference height of wind data.',
  related: ['beaufort-sea-state', 'cpa-tcpa', 'course-to-steer', 'stawave-added-resistance'],
  sendTo: [
    {
      target: 'beaufort-sea-state',
      label: 'Beaufort force and sea state of the true wind',
      note: 'The true wind speed at the 10 m reference height, the height the Beaufort scale refers to.',
      links: [
        { to: 'mode', value: 'wind' },
        { to: 'wind_speed_m_s', from: 'true_speed_ref_kn' },
      ],
    },
    {
      target: 'wind-resistance',
      label: 'Added wind resistance (ISO 15016)',
      note: 'The relative wind at the reference height and the speed over ground; enter the ship\'s projected areas there.',
      links: [
        { to: 'relative_speed_kn', from: 'relative_speed_ref_kn' },
        { to: 'relative_dir_deg', from: 'relative_dir_ref_deg' },
        { to: 'sog_kn', from: 'input:sog_kn' },
      ],
    },
  ],
  assumptions: [
    'Vector triangle of ISO 15016:2025 Annex C.2 (formulas C.3, C.4, C.10 and C.11): the relative wind measured on board is the true wind minus the wind of the ship\'s own motion, which comes from ahead at the ship\'s speed over ground along the heading. Speed over ground is used because the true wind of meteorology is relative to the earth; with speed through the water the result is the wind relative to the water, which differs by the current.',
    'Directions are those the wind comes FROM: true wind in degrees true, relative wind in degrees off the bow, 0° on the bow and positive from starboard (ISO 15016 convention); a relative angle of 330° is entered as 330 or −30.',
    'Height correction by the power-law boundary-layer profile V(Z_ref) = V(Z_a)·(Z_ref/Z_a)^p with p = 1/9 (ISO 15016:2025 formula C.9) or 1/7 (earlier ISO 15016 editions and ITTC 7.5-04-01-01.1); the reference height of wind resistance coefficients and of the Beaufort scale is 10 m above the sea. The real exponent varies with atmospheric stability (about 0.10–0.20), and the profile does not hold in the airflow disturbed by the superstructure around the anemometer.',
    'In "true to relative" mode the true wind is taken as given at the reference height (a weather report or forecast is a 10 m wind); the relative wind at the anemometer is then found by moving the true wind up the same profile and recombining it with the ship\'s motion.',
    'Steady wind: the inputs are means over the same period (ISO 15016 uses 10-minute means); gusts and the ship\'s rolling and pitching are not modelled.',
  ],
  notes: [
    'Verification 2026-10-31: a 20 kn relative wind on the bow at 10 kn over the ground is a 10 kn true wind from ahead; a 25 kn relative wind on the starboard beam at 15 kn on 090° is 29.15 kn true from 211.0°; from 40 m to 10 m the 1/9 profile multiplies the speed by 0.8572 and the 1/7 profile by 0.8203; true to relative and back returns the input to 1e-9.',
    'The 1/9 exponent was cross-checked against ISO 15016:2025 C.2.3 and the atlas-back wind resistance documentation, which records the edition change from 1/7.',
  ],
  sources: [
    'ISO 15016:2025 Ships and marine technology — Guidelines for the assessment of speed and power performance by analysis of speed trial data, Annex C.2 (formulas C.3, C.4, C.9, C.10, C.11)',
    'ITTC Recommended Procedure 7.5-04-01-01.1 Preparation, Conduct and Analysis of Speed/Power Trials (2017) — wind profile exponent 1/7',
    'The American Practical Navigator (Bowditch), NGA Pub. 9 — true and apparent wind',
    'WMO-No. 8 Guide to Instruments and Methods of Observation, Volume I, chapter 5 (surface wind at 10 m) and Volume III (marine observations)',
  ],
  inputs: [
    { id: 'heading_deg', label: 'Ship heading ψ, true', group: 'angle', unit: 'deg', default: 0, min: 0, max: 360 },
    { id: 'sog_kn', label: 'Ship speed over ground V_G', group: 'speed', unit: 'kn', default: 14, min: 0, max: 50 },
    {
      id: 'mode',
      label: 'Conversion',
      type: 'select',
      default: 'relative_to_true',
      options: [
        { value: 'relative_to_true', label: 'Relative (apparent) wind measured on board → true wind' },
        { value: 'true_to_relative', label: 'True wind (10 m, e.g. a forecast) → relative wind on board' },
      ],
    },
    { id: 'relative_dir_deg', label: 'Relative wind direction α_WR (0 = on the bow, + from starboard)', group: 'angle', unit: 'deg', default: 30, min: -180, max: 360, visibleWhen: { mode: 'relative_to_true' } },
    { id: 'relative_speed_kn', label: 'Relative wind speed V_WR at the anemometer', group: 'speed', unit: 'kn', default: 30, min: 0, max: 150, visibleWhen: { mode: 'relative_to_true' } },
    { id: 'true_dir_deg', label: 'True wind direction α_WT (from), true', group: 'angle', unit: 'deg', default: 60, min: 0, max: 360, visibleWhen: { mode: 'true_to_relative' } },
    { id: 'true_speed_kn', label: 'True wind speed at the reference height', group: 'speed', unit: 'kn', default: 20, min: 0, max: 150, visibleWhen: { mode: 'true_to_relative' } },
    { id: 'anemometer_height_m', label: 'Anemometer height above the sea Z_a', group: 'length', unit: 'm', default: 35, min: 1, max: 120 },
    { id: 'reference_height_m', label: 'Reference height Z_ref', group: 'length', unit: 'm', default: 10, min: 1, max: 120 },
    {
      id: 'profile',
      label: 'Height profile exponent',
      type: 'select',
      default: 'iso2025',
      options: [
        { value: 'iso2025', label: '1/9 — ISO 15016:2025 (C.9)' },
        { value: 'iso2015', label: '1/7 — earlier ISO 15016 editions, ITTC 2017' },
      ],
    },
  ],
  outputs: [
    { id: 'true_dir_out_deg', label: 'True wind direction (from), true', group: 'angle', unit: 'deg' },
    { id: 'true_speed_za_kn', label: 'True wind speed at the anemometer height', group: 'speed', unit: 'kn' },
    { id: 'true_speed_ref_kn', label: 'True wind speed at the reference height', group: 'speed', unit: 'kn' },
    { id: 'relative_dir_za_deg', label: 'Relative wind direction at the anemometer (+ from starboard)', group: 'angle', unit: 'deg' },
    { id: 'relative_speed_za_kn', label: 'Relative wind speed at the anemometer', group: 'speed', unit: 'kn' },
    { id: 'relative_dir_ref_deg', label: 'Relative wind direction at the reference height', group: 'angle', unit: 'deg' },
    { id: 'relative_speed_ref_kn', label: 'Relative wind speed at the reference height (for wind resistance)', group: 'speed', unit: 'kn' },
    { id: 'head_component_kn', label: 'Head-wind component of the relative wind at Z_ref (+ on the bow)', group: 'speed', unit: 'kn' },
    { id: 'cross_component_kn', label: 'Cross-wind component of the relative wind at Z_ref (+ from starboard)', group: 'speed', unit: 'kn' },
    { id: 'profile_factor', label: 'Height factor (Z_ref / Z_a)^p', group: 'dimensionless', unit: 'none' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      heading_deg: [90, 'deg'],
      sog_kn: [15, 'kn'],
      relative_dir_deg: [90, 'deg'],
      relative_speed_kn: [25, 'kn'],
    },
    results: {
      true_speed_za_kn: '29.15 kn',
      true_dir_out_deg: '211.0°',
      profile_factor: '0.870',
      true_speed_ref_kn: '25.4 kn',
      relative_speed_ref_kn: '21.8 kn',
      relative_dir_ref_deg: '85°',
    },
  },
};

/** ISO 15016 C.3–C.4: true wind (speed, direction from) from the relative wind, heading and speed over ground. */
export function relativeToTrue(relSpeed, relDirDeg, headingDeg, sog) {
  const x = relSpeed * Math.sin((relDirDeg + headingDeg) * DEG) - sog * Math.sin(headingDeg * DEG);
  const y = relSpeed * Math.cos((relDirDeg + headingDeg) * DEG) - sog * Math.cos(headingDeg * DEG);
  const speed = Math.sqrt(Math.max(0, relSpeed ** 2 + sog ** 2 - 2 * relSpeed * sog * Math.cos(relDirDeg * DEG)));
  return { speed: tidy(speed), dirDeg: Math.hypot(x, y) < 1e-9 ? null : norm360(Math.atan2(x, y) / DEG) };
}

/** ISO 15016 C.10–C.11: relative wind (speed, direction off the bow, + from starboard) from the true wind. */
export function trueToRelative(trueSpeed, trueDirDeg, headingDeg, sog) {
  const a = ((trueDirDeg ?? headingDeg) - headingDeg) * DEG;
  const across = trueSpeed * Math.sin(a);
  const along = sog + trueSpeed * Math.cos(a);
  const speed = Math.sqrt(Math.max(0, trueSpeed ** 2 + sog ** 2 + 2 * trueSpeed * sog * Math.cos(a)));
  return { speed: tidy(speed), dirDeg: Math.hypot(across, along) < 1e-9 ? null : tidy(norm180(Math.atan2(across, along) / DEG)) };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertRange(i.heading_deg, 0, 360, 'heading_deg', 'Heading');
  assertNonNegative(i.sog_kn, 'sog_kn', 'Speed over ground');
  assertOneOf(i.mode, ['relative_to_true', 'true_to_relative'], 'mode', 'Conversion');
  assertPositive(i.anemometer_height_m, 'anemometer_height_m', 'Anemometer height');
  assertPositive(i.reference_height_m, 'reference_height_m', 'Reference height');
  assertOneOf(i.profile, Object.keys(PROFILE_EXPONENTS), 'profile', 'Height profile exponent');

  const factor = (i.reference_height_m / i.anemometer_height_m) ** PROFILE_EXPONENTS[i.profile];
  let trueAtZa;
  let trueAtRef;
  let relAtZa;
  if (i.mode === 'relative_to_true') {
    assertRange(i.relative_dir_deg, -180, 360, 'relative_dir_deg', 'Relative wind direction');
    assertNonNegative(i.relative_speed_kn, 'relative_speed_kn', 'Relative wind speed');
    relAtZa = { speed: i.relative_speed_kn, dirDeg: norm180(i.relative_dir_deg) };
    trueAtZa = relativeToTrue(i.relative_speed_kn, i.relative_dir_deg, i.heading_deg, i.sog_kn);
    trueAtRef = { speed: trueAtZa.speed * factor, dirDeg: trueAtZa.dirDeg };
  } else {
    assertRange(i.true_dir_deg, 0, 360, 'true_dir_deg', 'True wind direction');
    assertNonNegative(i.true_speed_kn, 'true_speed_kn', 'True wind speed');
    trueAtRef = { speed: i.true_speed_kn, dirDeg: norm360(i.true_dir_deg) };
    trueAtZa = { speed: i.true_speed_kn / factor, dirDeg: trueAtRef.dirDeg };
    relAtZa = trueToRelative(trueAtZa.speed, trueAtZa.dirDeg, i.heading_deg, i.sog_kn);
  }
  const relAtRef = trueToRelative(trueAtRef.speed, trueAtRef.dirDeg, i.heading_deg, i.sog_kn);
  const head = relAtRef.dirDeg === null ? 0 : relAtRef.speed * Math.cos(relAtRef.dirDeg * DEG);
  const cross = relAtRef.dirDeg === null ? 0 : relAtRef.speed * Math.sin(relAtRef.dirDeg * DEG);

  const warnings = [];
  if (trueAtZa.dirDeg === null) warnings.push('True wind is calm: the relative wind is the ship\'s own motion, and the true direction is undefined.');
  if (relAtRef.dirDeg !== null && Math.abs(relAtRef.dirDeg) > 150 && trueAtRef.speed > 0) warnings.push('Following relative wind: the anemometer sits in the wake of the funnel and superstructure, and small direction errors give large true-wind errors.');
  if (i.sog_kn > 0 && trueAtZa.speed < 0.3 * i.sog_kn && trueAtZa.speed > 0) warnings.push('True wind much weaker than the ship\'s own wind: the true direction is very sensitive to errors in the measured relative direction.');
  if (i.anemometer_height_m < i.reference_height_m) warnings.push('Anemometer below the reference height: the profile extrapolates upwards; check the sensor height above the actual waterline.');
  warnings.push('The anemometer reading is disturbed by the superstructure; ISO 15016 checks the true wind for consistency between the runs of a double run before use.');

  const fmt = (v, d = 1) => (v === null ? '—' : v.toFixed(d));
  return {
    outputs: {
      true_dir_out_deg: trueAtZa.dirDeg,
      true_speed_za_kn: tidy(trueAtZa.speed),
      true_speed_ref_kn: tidy(trueAtRef.speed),
      relative_dir_za_deg: relAtZa.dirDeg,
      relative_speed_za_kn: tidy(relAtZa.speed),
      relative_dir_ref_deg: relAtRef.dirDeg,
      relative_speed_ref_kn: relAtRef.speed,
      head_component_kn: tidy(head),
      cross_component_kn: tidy(cross),
      profile_factor: factor,
      summary: `True wind ${fmt(trueAtRef.speed)} kn from ${fmt(trueAtRef.dirDeg, 0)}° at ${i.reference_height_m} m (${fmt(trueAtZa.speed)} kn at the ${i.anemometer_height_m} m anemometer); relative wind at ${i.reference_height_m} m ${fmt(relAtRef.speed)} kn from ${fmt(relAtRef.dirDeg, 0)}° off the bow.`,
    },
    warnings,
  };
}
