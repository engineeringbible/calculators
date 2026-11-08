/**
 * light-range/calc.js — how far a light, a radar target or a VHF station can be seen or heard: geographic range of a
 * light from the heights of light and eye, luminous range from intensity and visibility by Allard's law, radar and
 * VHF line-of-sight horizons in the standard 4/3-earth atmosphere, and the COLREG Annex I minimum intensity of a
 * navigation light for its required range.
 *
 * Horizon: d = √(2 R h / β) (Bowditch Table 12, R = 3440.1 nmi, β = 0.8279) or d = c √h; geographic range = d_light + d_eye.
 * Allard: E = I T^d / (1852 d)²  with T = 0.05^(1/V), night threshold E = 2·10⁻⁷ lx; nominal range = luminous range at V = 10 nmi.
 * COLREG Annex I §8: I = 3.43·10⁶ × 2·10⁻⁷ × D² × 0.8^(−D).
 * Schema units: metres for heights, nautical miles for ranges, candela for intensity.
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf } from '../shared/validate.js';

const METRES_PER_NMI = 1852;
/** Bowditch Table 12: earth radius in nautical miles and the refraction parameter β. */
const EARTH_RADIUS_NMI = 3440.1;
const BOWDITCH_BETA = 0.8279;
/** Standard radio/radar atmosphere: effective earth radius 4/3 of the true radius. */
const RADIO_K = 4 / 3;
/** IALA (Allard's law): night-time threshold illuminance at the eye, lux; visibility defined at 5 % transmission. */
const NIGHT_THRESHOLD_LUX = 2e-7;
const VISIBILITY_CONTRAST = 0.05;
const NOMINAL_VISIBILITY_NMI = 10;
/** COLREG Annex I section 8: constant 3.43·10⁶ (≈ 1852²) and atmospheric transmissivity K = 0.8 (visibility ≈ 13 nmi). */
const COLREG_CONSTANT = 3.43e6;
const COLREG_K = 0.8;

const HORIZON_MODELS = {
  bowditch: (hM) => Math.sqrt((2 * EARTH_RADIUS_NMI * (hM / METRES_PER_NMI)) / BOWDITCH_BETA),
  rule208: (hM) => 2.08 * Math.sqrt(hM),
  geometric: (hM) => Math.sqrt(2 * EARTH_RADIUS_NMI * (hM / METRES_PER_NMI)),
};

export const schema = {
  id: 'light-range',
  name: 'Light, radar and VHF range',
  category: 'maritime',
  summary: 'Geographic and luminous range of a light, radar and VHF line-of-sight ranges, and the COLREG minimum intensity of a navigation light.',
  related: ['cpa-tcpa', 'air-draft', 'tidal-height', 'great-circle-distance'],
  assumptions: [
    'Geographic range is the sum of the distances to the sea horizon from the light and from the eye. The default horizon model is Bowditch Table 12, d = √(2Rh/β) with R = 3440.1 nmi and the refraction parameter β = 0.8279 (1.17 √h for h in feet, 2.12 √h for h in metres); "2.08 √h" is a common rounded rule and "geometric" leaves refraction out (1.93 √h). Abnormal refraction (super-refraction over cold water, sub-refraction) can change the range considerably.',
    'Heights are above the actual sea level: charted light elevations refer to a high-water datum (MHWS in British charts), so at lower states of the tide the light stands higher and the geographic range is slightly greater.',
    'Luminous range by Allard\'s law for a point source at night, E = I·T^d/(1852 d)², with the IALA threshold illuminance of 2·10⁻⁷ lux and the transmissivity per nautical mile T = 0.05^(1/V) for a meteorological visibility V; the nominal range is the luminous range at V = 10 nmi (T = 0.741). Background lighting (a lit coastline) raises the threshold and shortens the range; daytime ranges are not covered.',
    'A light is seen at the lesser of its geographic and luminous ranges; the loom of a powerful light can be visible beyond the geographic range.',
    'Radar and VHF ranges are line-of-sight horizons in the standard atmosphere with an effective earth radius of 4/3 of the true one (radar 2.23 √h); whether a target is actually detected or a call heard also depends on its radar cross-section or the transmitter power, antenna gains and sea clutter, which are not modelled.',
    'The COLREG Annex I minimum intensity uses the regulation\'s own formula and K = 0.8 (meteorological visibility of about 13 nmi), which is why it differs from an IALA nominal-range intensity.',
  ],
  notes: [
    'Verification 2026-10-31: Bowditch Table 12 gives 12.8 nmi for 120 ft; the 2.08 rule gives 11.39 + 3.60 = 15.0 nmi for a 30 m light and a 3 m eye; the COLREG Annex I §8 table (0.9, 4.3, 12, 27, 52, 94 cd for 1–6 nmi) is reproduced; a 10 nmi nominal range needs 2·10⁻⁷ × 1852² × 100 × 20 = 1372 cd.',
    'Design decision: the Allard equation is solved by bisection on its logarithm, which is monotonic in distance, so every intensity and visibility has exactly one luminous range.',
  ],
  sources: [
    'The American Practical Navigator (Bowditch), NGA Pub. 9 — Table 12 "Distance of the horizon" (R = 3440.1 nmi, β = 0.8279) and the radar horizon',
    'IALA Recommendation E-200-2 (2008), now IALA R0202 — Allard\'s law, threshold illuminance 2·10⁻⁷ lx, luminous and nominal range',
    'COLREG 1972 Annex I, section 8 (intensity of lights) — I = 3.43·10⁶ × T × D² × K⁻ᴰ with T = 2·10⁻⁷ and K = 0.8; also 33 CFR 84.14',
    'ITU-R Recommendation P.453 / P.834 — effective earth radius factor 4/3 for radio and radar propagation in the standard atmosphere',
  ],
  inputs: [
    { id: 'light_height_m', label: 'Elevation of the light above the sea H', group: 'length', unit: 'm', default: 40, min: 0, max: 1000 },
    { id: 'eye_height_m', label: 'Observer\'s height of eye h', group: 'length', unit: 'm', default: 15, min: 0, max: 200 },
    {
      id: 'horizon_model',
      label: 'Horizon distance model',
      type: 'select',
      default: 'bowditch',
      options: [
        { value: 'bowditch', label: 'Bowditch Table 12: 1.17 √h (ft) = 2.12 √h (m)' },
        { value: 'rule208', label: 'Rounded rule 2.08 √h (m)' },
        { value: 'geometric', label: 'Geometric, no refraction: 1.93 √h (m)' },
      ],
    },
    {
      id: 'intensity_input',
      label: 'Light given by',
      type: 'select',
      default: 'nominal',
      options: [
        { value: 'nominal', label: 'Nominal range (chart or list of lights)' },
        { value: 'intensity', label: 'Luminous intensity in candela' },
      ],
    },
    { id: 'nominal_range_nmi', label: 'Nominal range', group: 'length', unit: 'nmi', default: 20, min: 0.1, max: 40, visibleWhen: { intensity_input: 'nominal' } },
    { id: 'intensity_cd', label: 'Luminous intensity I (cd)', group: 'dimensionless', unit: 'none', default: 100000, min: 0.01, max: 1e9, visibleWhen: { intensity_input: 'intensity' } },
    { id: 'visibility_nmi', label: 'Meteorological visibility V', group: 'length', unit: 'nmi', default: 5, min: 0.05, max: 60 },
    { id: 'antenna_height_m', label: 'Radar antenna height above the sea', group: 'length', unit: 'm', default: 30, min: 0, max: 200 },
    { id: 'target_height_m', label: 'Height of the radar target above the sea', group: 'length', unit: 'm', default: 10, min: 0, max: 1000 },
    { id: 'vhf_other_height_m', label: 'Other station\'s VHF antenna height (own = radar antenna height)', group: 'length', unit: 'm', default: 15, min: 0, max: 1000 },
    { id: 'required_range_nmi', label: 'Range required of a navigation light (COLREG)', group: 'length', unit: 'nmi', default: 6, min: 0.5, max: 12 },
  ],
  outputs: [
    { id: 'eye_horizon_nmi', label: 'Distance of the horizon from the eye', group: 'length', unit: 'nmi' },
    { id: 'light_horizon_nmi', label: 'Distance of the horizon from the light', group: 'length', unit: 'nmi' },
    { id: 'geographic_range_nmi', label: 'Geographic range (rising and dipping distance)', group: 'length', unit: 'nmi' },
    { id: 'intensity_out_cd', label: 'Luminous intensity I (cd)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'nominal_out_nmi', label: 'Nominal range (visibility 10 nmi)', group: 'length', unit: 'nmi' },
    { id: 'luminous_range_nmi', label: 'Luminous range at the visibility V', group: 'length', unit: 'nmi' },
    { id: 'visible_range_nmi', label: 'Range at which the light can be seen', group: 'length', unit: 'nmi' },
    { id: 'limiting_factor', label: 'Limited by', type: 'text' },
    { id: 'radar_horizon_nmi', label: 'Radar horizon of the antenna (4/3 earth)', group: 'length', unit: 'nmi' },
    { id: 'radar_target_range_nmi', label: 'Radar line-of-sight range of the target', group: 'length', unit: 'nmi' },
    { id: 'vhf_range_nmi', label: 'VHF line-of-sight range between the antennas', group: 'length', unit: 'nmi' },
    { id: 'colreg_intensity_cd', label: 'Minimum intensity for the required range, COLREG Annex I (cd)', group: 'dimensionless', unit: 'none' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      eye_horizon_nmi: '8.2 nmi',
      light_horizon_nmi: '13.4 nmi',
      geographic_range_nmi: '21.6 nmi',
      intensity_out_cd: '110 000',
      luminous_range_nmi: '11.8 nmi',
      visible_range_nmi: '11.8 nmi',
    },
  },
};

/** Distance of the sea horizon in nautical miles for a height in metres. */
export function horizonDistance(heightM, model = 'bowditch') {
  return HORIZON_MODELS[model](heightM);
}

/** Radio/radar horizon in nautical miles (effective earth radius 4/3). */
export function radioHorizon(heightM) {
  return Math.sqrt(2 * RADIO_K * EARTH_RADIUS_NMI * (heightM / METRES_PER_NMI));
}

/** Luminous intensity (cd) of a light seen at threshold at `rangeNmi` in visibility `visibilityNmi` (Allard). */
export function intensityForRange(rangeNmi, visibilityNmi) {
  const t = VISIBILITY_CONTRAST ** (1 / visibilityNmi);
  return NIGHT_THRESHOLD_LUX * (METRES_PER_NMI * rangeNmi) ** 2 * t ** -rangeNmi;
}

/** Luminous range (nmi) of a light of intensity `intensityCd` in visibility `visibilityNmi`: root of Allard's law. */
export function luminousRange(intensityCd, visibilityNmi) {
  const lnT = Math.log(VISIBILITY_CONTRAST) / visibilityNmi;
  const f = (d) => Math.log(intensityCd) + d * lnT - 2 * Math.log(METRES_PER_NMI * d) - Math.log(NIGHT_THRESHOLD_LUX);
  let lo = 1e-6;
  let hi = 1;
  while (f(hi) > 0 && hi < 1e4) hi *= 2;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-12 * hi) break;
  }
  return (lo + hi) / 2;
}

/** COLREG Annex I §8 minimum intensity (cd) for a light visible at `rangeNmi`. */
export function colregIntensity(rangeNmi) {
  return COLREG_CONSTANT * NIGHT_THRESHOLD_LUX * rangeNmi ** 2 * COLREG_K ** -rangeNmi;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertNonNegative(i.light_height_m, 'light_height_m', 'Light elevation');
  assertNonNegative(i.eye_height_m, 'eye_height_m', 'Height of eye');
  assertOneOf(i.horizon_model, Object.keys(HORIZON_MODELS), 'horizon_model', 'Horizon distance model');
  assertOneOf(i.intensity_input, ['nominal', 'intensity'], 'intensity_input', 'Light given by');
  assertPositive(i.visibility_nmi, 'visibility_nmi', 'Visibility');
  assertNonNegative(i.antenna_height_m, 'antenna_height_m', 'Antenna height');
  assertNonNegative(i.target_height_m, 'target_height_m', 'Target height');
  assertNonNegative(i.vhf_other_height_m, 'vhf_other_height_m', 'Other VHF antenna height');
  assertPositive(i.required_range_nmi, 'required_range_nmi', 'Required range');

  const eye = horizonDistance(i.eye_height_m, i.horizon_model);
  const light = horizonDistance(i.light_height_m, i.horizon_model);
  const geographic = eye + light;
  let intensity;
  if (i.intensity_input === 'nominal') {
    assertPositive(i.nominal_range_nmi, 'nominal_range_nmi', 'Nominal range');
    intensity = intensityForRange(i.nominal_range_nmi, NOMINAL_VISIBILITY_NMI);
  } else {
    assertPositive(i.intensity_cd, 'intensity_cd', 'Luminous intensity');
    intensity = i.intensity_cd;
  }
  const nominal = luminousRange(intensity, NOMINAL_VISIBILITY_NMI);
  const luminous = luminousRange(intensity, i.visibility_nmi);
  const visible = Math.min(luminous, geographic);
  const limiting = luminous < geographic
    ? `Luminous range: in ${i.visibility_nmi} nmi visibility the light is too weak beyond ${luminous.toFixed(1)} nmi, inside its geographic range.`
    : `Geographic range: the light dips below the horizon at ${geographic.toFixed(1)} nmi before it becomes too faint (its loom may show further).`;

  const radarHorizon = radioHorizon(i.antenna_height_m);
  const radarTarget = radarHorizon + radioHorizon(i.target_height_m);
  const vhf = radarHorizon + radioHorizon(i.vhf_other_height_m);

  const warnings = [];
  if (i.visibility_nmi < 2) warnings.push('Visibility under 2 nmi: restricted visibility (COLREG Rule 19) — lights are of little help; rely on radar and sound signals.');
  if (i.eye_height_m === 0 || i.light_height_m === 0) warnings.push('A height of zero means that eye or light is at the sea surface: its horizon distance is zero.');
  if (i.intensity_input === 'nominal' && i.nominal_range_nmi > 30) warnings.push('Nominal ranges above about 30 nmi are rare: check the light list entry.');
  warnings.push('Abnormal refraction can change geographic and radar ranges a lot; background lights on shore raise the visibility threshold and shorten the luminous range.');

  return {
    outputs: {
      eye_horizon_nmi: eye,
      light_horizon_nmi: light,
      geographic_range_nmi: geographic,
      intensity_out_cd: intensity,
      nominal_out_nmi: nominal,
      luminous_range_nmi: luminous,
      visible_range_nmi: visible,
      limiting_factor: limiting,
      radar_horizon_nmi: radarHorizon,
      radar_target_range_nmi: radarTarget,
      vhf_range_nmi: vhf,
      colreg_intensity_cd: colregIntensity(i.required_range_nmi),
    },
    warnings,
  };
}
