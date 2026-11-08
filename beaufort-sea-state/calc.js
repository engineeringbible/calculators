/**
 * beaufort-sea-state/calc.js — Beaufort force, wind speed, wave height and Douglas sea state, from any one of them.
 *
 * Schema units: wind speed m/s (displayed in knots by default), wave height m, Beaufort and sea state as integers.
 * Tables: WMO Manual on Codes (WMO-No. 306) code table 1100 (Beaufort scale, knot bounds and WMO probable wave heights)
 * and code table 3700 (Douglas state of the sea).
 */
import { withDefaults, assertRange, assertInteger, assertOneOf, assertNonNegative } from '../shared/validate.js';

const KNOT_IN_M_S = 1852 / 3600;
/** WMO empirical mean wind speed for a Beaufort force: v = 0.836 × B^1.5 m/s. */
const BEAUFORT_EMPIRICAL_COEFFICIENT = 0.836;

/**
 * Beaufort scale: knot bounds per WMO code table 1100; probable and maximum wave heights (m) for a fully
 * developed open sea per WMO-No. 306 / UK Met Office Beaufort table. `waveMaxM` is undefined for force 12.
 */
export const BEAUFORT_TABLE = [
  { force: 0, description: 'Calm', lowerKn: 0, upperKn: 0, waveProbableM: 0, waveMaxM: 0 },
  { force: 1, description: 'Light air', lowerKn: 1, upperKn: 3, waveProbableM: 0.1, waveMaxM: 0.1 },
  { force: 2, description: 'Light breeze', lowerKn: 4, upperKn: 6, waveProbableM: 0.2, waveMaxM: 0.3 },
  { force: 3, description: 'Gentle breeze', lowerKn: 7, upperKn: 10, waveProbableM: 0.6, waveMaxM: 1.0 },
  { force: 4, description: 'Moderate breeze', lowerKn: 11, upperKn: 16, waveProbableM: 1.0, waveMaxM: 1.5 },
  { force: 5, description: 'Fresh breeze', lowerKn: 17, upperKn: 21, waveProbableM: 2.0, waveMaxM: 2.5 },
  { force: 6, description: 'Strong breeze', lowerKn: 22, upperKn: 27, waveProbableM: 3.0, waveMaxM: 4.0 },
  { force: 7, description: 'Near gale', lowerKn: 28, upperKn: 33, waveProbableM: 4.0, waveMaxM: 5.5 },
  { force: 8, description: 'Gale', lowerKn: 34, upperKn: 40, waveProbableM: 5.5, waveMaxM: 7.5 },
  { force: 9, description: 'Strong gale', lowerKn: 41, upperKn: 47, waveProbableM: 7.0, waveMaxM: 10.0 },
  { force: 10, description: 'Storm', lowerKn: 48, upperKn: 55, waveProbableM: 9.0, waveMaxM: 12.5 },
  { force: 11, description: 'Violent storm', lowerKn: 56, upperKn: 63, waveProbableM: 11.5, waveMaxM: 16.0 },
  { force: 12, description: 'Hurricane force', lowerKn: 64, upperKn: null, waveProbableM: 14.0, waveMaxM: null },
];

/** Douglas sea state (WMO code table 3700), significant wave height bounds in metres. */
export const SEA_STATE_TABLE = [
  { code: 0, description: 'Calm (glassy)', lowerM: 0, upperM: 0 },
  { code: 1, description: 'Calm (rippled)', lowerM: 0, upperM: 0.1 },
  { code: 2, description: 'Smooth (wavelets)', lowerM: 0.1, upperM: 0.5 },
  { code: 3, description: 'Slight', lowerM: 0.5, upperM: 1.25 },
  { code: 4, description: 'Moderate', lowerM: 1.25, upperM: 2.5 },
  { code: 5, description: 'Rough', lowerM: 2.5, upperM: 4 },
  { code: 6, description: 'Very rough', lowerM: 4, upperM: 6 },
  { code: 7, description: 'High', lowerM: 6, upperM: 9 },
  { code: 8, description: 'Very high', lowerM: 9, upperM: 14 },
  { code: 9, description: 'Phenomenal', lowerM: 14, upperM: null },
];

export const schema = {
  id: 'beaufort-sea-state',
  name: 'Beaufort, wind speed and sea state converter',
  category: 'maritime',
  summary: 'Convert between Beaufort force, wind speed, probable wave height and Douglas sea state using the WMO tables.',
  related: ['fuel-voyage-cost', 'ship-squat', 'anchor-catenary', 'unit-converter'],
  notes: [
    'Provenance: knot bounds, descriptions and probable/maximum wave heights were transcribed from WMO code table 1100 and the UK Met Office Beaufort table; Douglas sea-state bounds from WMO code table 3700.',
    'Design decision: classification uses the knot bounds (the original definition) after rounding to the nearest knot, because the WMO m/s column is a rounded derivative and the two disagree at some boundaries.',
    'Design decision: the "typical" wind speed is the WMO empirical 0.836 B^1.5 m/s rather than the band midpoint, so that force 12 has a finite value.',
  ],
  assumptions: [
    'Beaufort force is classified on the official knot bounds of WMO code table 1100 after rounding the wind speed to the nearest knot; the WMO m/s column is a rounded equivalent and differs slightly at some boundaries.',
    'Wind speed means the 10-minute mean true wind at 10 m height; gusts (1.3–1.5 × mean) must not be used to pick the force.',
    'Wave heights against Beaufort force are WMO/Met Office guidance for a fully developed open sea with no swell; fetch, duration and swell change the real height by up to a factor of two.',
    'Going from wave height or sea state back to wind picks the Beaufort row with the nearest probable height (mid-range height for a sea-state code); it is a plausibility check, not a measurement.',
    'Douglas sea state is defined on significant wave height H_s (WMO code table 3700); individual waves reach about 1.9 × H_s and the "maximum" column is guidance, not a statistical extreme.',
    'The "typical" wind speed of a force is the WMO empirical relation v = 0.836 × B^1.5 m/s, not the midpoint of the knot band.',
  ],
  sources: [
    'WMO Manual on Codes, WMO-No. 306, Vol. I.1, code table 1100 (Beaufort scale) and code table 3700 (state of the sea)',
    'UK Met Office, Beaufort wind force scale table (probable and maximum wave heights)',
    'WMO-No. 8, Guide to Instruments and Methods of Observation, Beaufort equivalent wind speeds (v = 0.836 B^(3/2))',
  ],
  inputs: [
    {
      id: 'mode',
      label: 'Start from',
      type: 'select',
      default: 'beaufort',
      options: [
        { value: 'beaufort', label: 'Beaufort force' },
        { value: 'wind', label: 'Wind speed' },
        { value: 'wave', label: 'Significant wave height' },
        { value: 'sea_state', label: 'Douglas sea state' },
      ],
    },
    { id: 'beaufort', label: 'Beaufort force (0–12)', group: 'dimensionless', unit: 'none', default: 6, min: 0, max: 12, integer: true, visibleWhen: { mode: 'beaufort' } },
    {
      id: 'wind_speed_m_s',
      label: 'Wind speed (10 m height, 10-min mean)',
      group: 'speed',
      unit: 'm_s',
      display: 'kn',
      default: 24 * KNOT_IN_M_S,
      min: 0,
      max: 120,
      visibleWhen: { mode: 'wind' },
    },
    { id: 'wave_height_m', label: 'Significant wave height H_s', group: 'length', unit: 'm', default: 3, min: 0, max: 30, visibleWhen: { mode: 'wave' } },
    { id: 'sea_state', label: 'Douglas sea state (0–9)', group: 'dimensionless', unit: 'none', default: 5, min: 0, max: 9, integer: true, visibleWhen: { mode: 'sea_state' } },
  ],
  outputs: [
    { id: 'beaufort_out', label: 'Beaufort force', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'beaufort_description', label: 'Wind description', type: 'text' },
    { id: 'wind_lower_m_s', label: 'Wind speed, lower bound of the force', group: 'speed', unit: 'm_s', display: 'kn' },
    { id: 'wind_upper_m_s', label: 'Wind speed, upper bound of the force', group: 'speed', unit: 'm_s', display: 'kn' },
    { id: 'wind_typical_m_s', label: 'Typical wind speed (WMO 0.836 × B^1.5)', group: 'speed', unit: 'm_s', display: 'kn' },
    { id: 'wave_probable_m', label: 'Probable wave height (open sea, fully developed)', group: 'length', unit: 'm' },
    { id: 'wave_max_m', label: 'Maximum wave height', group: 'length', unit: 'm' },
    { id: 'sea_state_out', label: 'Douglas sea state', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'sea_state_description', label: 'Sea description', type: 'text' },
    { id: 'sea_wave_lower_m', label: 'Sea state wave height, lower bound', group: 'length', unit: 'm' },
    { id: 'sea_wave_upper_m', label: 'Sea state wave height, upper bound', group: 'length', unit: 'm' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      wind_typical_m_s: '12.3 m/s',
      wave_max_m: '4.0 m',
      sea_wave_upper_m: '4.0 m',
    },
  },
};

/** Beaufort row for a 10-m wind speed in m/s, classified on the official knot bounds (rounded to the nearest knot). */
export function beaufortFromWindSpeed(windSpeedMS) {
  const knots = Math.round(windSpeedMS / KNOT_IN_M_S);
  return BEAUFORT_TABLE.find((row) => row.upperKn === null || knots <= row.upperKn);
}

/** Douglas sea-state row for a significant wave height in metres (upper bound inclusive). */
export function seaStateFromWaveHeight(waveHeightM) {
  if (waveHeightM <= 0) return SEA_STATE_TABLE[0];
  return SEA_STATE_TABLE.find((row) => row.upperM === null || waveHeightM <= row.upperM);
}

/** Beaufort row whose probable wave height is nearest to the given height (fully developed sea assumption). */
export function beaufortFromWaveHeight(waveHeightM) {
  let best = BEAUFORT_TABLE[0];
  for (const row of BEAUFORT_TABLE) {
    if (Math.abs(row.waveProbableM - waveHeightM) < Math.abs(best.waveProbableM - waveHeightM)) best = row;
  }
  return best;
}

/** WMO empirical mean wind speed (m/s) for a Beaufort force. */
export function typicalWindSpeedMS(force) {
  return BEAUFORT_EMPIRICAL_COEFFICIENT * force ** 1.5;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.mode, ['beaufort', 'wind', 'wave', 'sea_state'], 'mode', 'Start from');
  const warnings = [];
  let beaufortRow;
  let seaRow;

  if (i.mode === 'beaufort') {
    assertInteger(i.beaufort, 'beaufort', 'Beaufort force');
    assertRange(i.beaufort, 0, 12, 'beaufort', 'Beaufort force');
    beaufortRow = BEAUFORT_TABLE[i.beaufort];
    seaRow = seaStateFromWaveHeight(beaufortRow.waveProbableM);
  } else if (i.mode === 'wind') {
    assertNonNegative(i.wind_speed_m_s, 'wind_speed_m_s', 'Wind speed');
    beaufortRow = beaufortFromWindSpeed(i.wind_speed_m_s);
    seaRow = seaStateFromWaveHeight(beaufortRow.waveProbableM);
  } else if (i.mode === 'wave') {
    assertNonNegative(i.wave_height_m, 'wave_height_m', 'Wave height');
    seaRow = seaStateFromWaveHeight(i.wave_height_m);
    beaufortRow = beaufortFromWaveHeight(i.wave_height_m);
    warnings.push('Wind from wave height assumes a fully developed open sea with no swell; actual wind may differ by one or two forces.');
  } else {
    assertInteger(i.sea_state, 'sea_state', 'Sea state');
    assertRange(i.sea_state, 0, 9, 'sea_state', 'Sea state');
    seaRow = SEA_STATE_TABLE[i.sea_state];
    const representativeHeight = seaRow.upperM === null ? seaRow.lowerM : (seaRow.lowerM + seaRow.upperM) / 2;
    beaufortRow = beaufortFromWaveHeight(representativeHeight);
    warnings.push('Wind from sea state uses the mid-range wave height of the Douglas code and the fully developed sea assumption.');
  }

  if (beaufortRow.force >= 10) warnings.push('Storm force and above: the wave heights are indicative only; actual seas depend on fetch, duration and swell.');

  return {
    outputs: {
      beaufort_out: beaufortRow.force,
      beaufort_description: beaufortRow.description,
      wind_lower_m_s: beaufortRow.lowerKn * KNOT_IN_M_S,
      wind_upper_m_s: beaufortRow.upperKn === null ? null : beaufortRow.upperKn * KNOT_IN_M_S,
      wind_typical_m_s: typicalWindSpeedMS(beaufortRow.force),
      wave_probable_m: beaufortRow.waveProbableM,
      wave_max_m: beaufortRow.waveMaxM,
      sea_state_out: seaRow.code,
      sea_state_description: seaRow.description,
      sea_wave_lower_m: seaRow.lowerM,
      sea_wave_upper_m: seaRow.upperM,
    },
    warnings,
  };
}
