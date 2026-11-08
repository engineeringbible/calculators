/**
 * compass-error/calc.js — true bearing of a celestial body by amplitude (rising or setting) or by time azimuth (any
 * altitude), and the compass error and deviation from the observed compass bearing.
 *
 * Azimuth at altitude h:   cos Z = (sin Dec − sin Lat sin h) / (cos Lat cos h);  Zn = Z rising, 360° − Z setting
 *   with h = 0 (centre on the celestial horizon) this is the amplitude formula sin A = sin Dec / cos Lat, A = 90° − Z;
 *   with the centre on the visible horizon h = −(dip + refraction), dip = 1.76′ √(height of eye in m).
 * Time azimuth:  Zn = atan2(−cos Dec sin LHA, sin Dec cos Lat − cos Dec sin Lat cos LHA),  LHA = GHA + longitude (E +).
 * Compass error = true − compass (+ E);  deviation = compass error − variation.
 * Schema units: degrees, metres.
 */
import { withDefaults, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const DEG = Math.PI / 180;
/** Dip of the sea horizon, arcminutes per √metre (Nautical Almanac). */
const DIP_ARCMIN_PER_SQRT_M = 1.76;

const norm360 = (deg) => ((deg % 360) + 360) % 360;
const norm180 = (deg) => {
  const a = norm360(deg);
  return a > 180 ? a - 360 : a;
};
const clamp1 = (x) => Math.max(-1, Math.min(1, x));
const eastWest = (deg) => `${Math.abs(deg).toFixed(1)}° ${deg >= 0 ? 'E' : 'W'}`;

export const schema = {
  id: 'compass-error',
  name: 'Compass error by amplitude or azimuth',
  category: 'maritime',
  summary: 'True bearing of the sun or another body by amplitude or time azimuth, then the compass error and deviation from the observed bearing.',
  related: ['sight-reduction', 'great-circle-distance', 'course-to-steer', 'light-range'],
  assumptions: [
    'Spherical astronomy on the celestial sphere: the azimuth of a body of declination Dec at true altitude h seen from latitude Lat follows cos Z = (sin Dec − sin Lat sin h)/(cos Lat cos h); at the moment of theoretical rising or setting (centre on the celestial horizon, h = 0) this is the amplitude formula sin A = sin Dec / cos Lat.',
    'Amplitude observations: the sun\'s centre is on the celestial horizon when its lower limb is about half a diameter above the visible horizon, the usual moment for the observation. With the centre on the visible horizon instead, the true altitude is −(dip + refraction), with dip 1.76′ √h for a height of eye h in metres and the horizontal refraction from Bennett\'s formula (about 34′ to 36′), and the bearing is computed at that altitude (the visible-horizon amplitude correction).',
    'Time azimuth: LHA = GHA + longitude (east positive) from the almanac GHA at the time of the bearing; the azimuth is exact at any altitude, but bearings of bodies higher than about 30° are hard to take accurately with an azimuth circle.',
    'Compass error is true minus compass bearing, easterly when positive ("compass least, error east"); deviation is the compass error minus the magnetic variation from the chart, both east positive. The variation must be for the year of observation.',
    'The declination and GHA are taken as entered for the moment of the bearing (the sun\'s declination changes by up to 0.4′ per hour); parallax and semi-diameter are irrelevant for the bearing of the centre.',
  ],
  notes: [
    'Verification 2026-10-31: latitude 40° N, declination 20° N gives an amplitude of 26.5° and a rising bearing of 063.5°; at the equator the amplitude equals the declination; the time azimuth at the LHA of theoretical sunset equals the amplitude bearing; a true bearing of 063.5° read as 061.0° on the compass is an error of 2.5° E, which with 4° W variation is 6.5° E deviation.',
    'Design decision: a single altitude–azimuth formula serves both the celestial-horizon and the visible-horizon amplitude, so no amplitude-correction table is needed and the two cases agree by construction.',
  ],
  sources: [
    'The American Practical Navigator (Bowditch), NGA Pub. 9 — "Azimuths and Amplitudes" (amplitude formula, visible-horizon correction, time azimuth)',
    'The Nautical Almanac (HM Nautical Almanac Office / US Naval Observatory) — GHA and declination, dip = 1.76′ √h(m)',
    'G. G. Bennett, "The calculation of astronomical refraction in marine navigation", Journal of Navigation 35 (1982) 255–259',
    'A. Frost, The Principles and Practice of Navigation, Brown, Son & Ferguson — compass error by amplitude and azimuth',
  ],
  inputs: [
    {
      id: 'method',
      label: 'Method',
      type: 'select',
      default: 'amplitude',
      options: [
        { value: 'amplitude', label: 'Amplitude (body rising or setting)' },
        { value: 'azimuth', label: 'Time azimuth (any altitude)' },
      ],
    },
    { id: 'latitude_deg', label: 'Latitude (+ N, − S)', group: 'angle', unit: 'deg', default: 40, min: -89, max: 89 },
    { id: 'declination_deg', label: 'Declination of the body (+ N, − S)', group: 'angle', unit: 'deg', default: 20, min: -89, max: 89 },
    {
      id: 'event',
      label: 'Rising or setting',
      type: 'select',
      default: 'rising',
      options: [
        { value: 'rising', label: 'Rising (bearing east of the meridian)' },
        { value: 'setting', label: 'Setting (bearing west of the meridian)' },
      ],
      visibleWhen: { method: 'amplitude' },
    },
    {
      id: 'horizon',
      label: 'Moment of the bearing',
      type: 'select',
      default: 'celestial',
      options: [
        { value: 'celestial', label: 'Centre on the celestial horizon (lower limb about ½ diameter above the visible horizon)' },
        { value: 'visible', label: 'Centre on the visible horizon' },
      ],
      visibleWhen: { method: 'amplitude' },
    },
    { id: 'eye_height_m', label: 'Height of eye', group: 'length', unit: 'm', default: 15, min: 0, max: 100, visibleWhen: { method: 'amplitude', horizon: 'visible' } },
    { id: 'gha_deg', label: 'Greenwich hour angle GHA of the body', group: 'angle', unit: 'deg', default: 300, min: 0, max: 360, visibleWhen: { method: 'azimuth' } },
    { id: 'longitude_deg', label: 'Longitude (+ E, − W)', group: 'angle', unit: 'deg', default: 20, min: -180, max: 180, visibleWhen: { method: 'azimuth' } },
    { id: 'compass_bearing_deg', label: 'Observed compass bearing', group: 'angle', unit: 'deg', default: 61, min: 0, max: 360 },
    { id: 'variation_deg', label: 'Magnetic variation (+ E, − W)', group: 'angle', unit: 'deg', default: -4, min: -90, max: 90 },
  ],
  outputs: [
    { id: 'lha_deg', label: 'Local hour angle LHA', group: 'angle', unit: 'deg', visibleWhen: { method: 'azimuth' } },
    { id: 'altitude_deg', label: 'True altitude of the body\'s centre', group: 'angle', unit: 'deg' },
    { id: 'amplitude_deg', label: 'Amplitude (from E or W, + towards N)', group: 'angle', unit: 'deg', visibleWhen: { method: 'amplitude' } },
    { id: 'amplitude_text', label: 'Amplitude', type: 'text', visibleWhen: { method: 'amplitude' } },
    { id: 'true_bearing_deg', label: 'True bearing (azimuth Zn)', group: 'angle', unit: 'deg' },
    { id: 'compass_error_deg', label: 'Compass error (+ E, − W)', group: 'angle', unit: 'deg' },
    { id: 'deviation_deg', label: 'Deviation (+ E, − W)', group: 'angle', unit: 'deg' },
    { id: 'error_text', label: 'Result', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      amplitude_deg: '26.5°',
      true_bearing_deg: '063.5°',
      compass_error_deg: '2.5°',
      deviation_deg: '6.5°',
    },
  },
};

/** Refraction in arcminutes at apparent altitude `hDeg` (Bennett 1982). */
export function refractionArcmin(hDeg) {
  return 1 / Math.tan((hDeg + 7.31 / (hDeg + 4.4)) * DEG);
}

/** Azimuth angle Z (0–180° from north) of a body at true altitude `hDeg`; null when the body never reaches it. */
export function azimuthAtAltitude(latDeg, decDeg, hDeg) {
  const c = (Math.sin(decDeg * DEG) - Math.sin(latDeg * DEG) * Math.sin(hDeg * DEG)) / (Math.cos(latDeg * DEG) * Math.cos(hDeg * DEG));
  if (Math.abs(c) > 1 + 1e-12) return null;
  return Math.acos(clamp1(c)) / DEG;
}

/** Time azimuth Zn (0–360°) and true altitude of a body from latitude, declination and LHA. */
export function timeAzimuth(latDeg, decDeg, lhaDeg) {
  const lat = latDeg * DEG;
  const dec = decDeg * DEG;
  const lha = lhaDeg * DEG;
  const zn = norm360(Math.atan2(-Math.cos(dec) * Math.sin(lha), Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(lha)) / DEG);
  const alt = Math.asin(clamp1(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(lha))) / DEG;
  return { zn, alt };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.method, ['amplitude', 'azimuth'], 'method', 'Method');
  assertRange(i.latitude_deg, -89, 89, 'latitude_deg', 'Latitude');
  assertRange(i.declination_deg, -89, 89, 'declination_deg', 'Declination');
  assertRange(i.compass_bearing_deg, 0, 360, 'compass_bearing_deg', 'Compass bearing');
  assertRange(i.variation_deg, -90, 90, 'variation_deg', 'Variation');

  const warnings = [];
  let trueBearing;
  let altitude;
  let lha = null;
  let amplitude = null;
  let amplitudeText = null;
  if (i.method === 'amplitude') {
    assertOneOf(i.event, ['rising', 'setting'], 'event', 'Rising or setting');
    assertOneOf(i.horizon, ['celestial', 'visible'], 'horizon', 'Moment of the bearing');
    altitude = 0;
    if (i.horizon === 'visible') {
      assertNonNegative(i.eye_height_m, 'eye_height_m', 'Height of eye');
      const dipArcmin = DIP_ARCMIN_PER_SQRT_M * Math.sqrt(i.eye_height_m);
      altitude = -(dipArcmin + refractionArcmin(-dipArcmin / 60)) / 60;
    }
    const z = azimuthAtAltitude(i.latitude_deg, i.declination_deg, altitude);
    if (z === null) throw new Error(`At latitude ${i.latitude_deg}° a body of declination ${i.declination_deg}° does not rise or set (it is circumpolar or never above the horizon)`);
    trueBearing = i.event === 'rising' ? z : norm360(360 - z);
    amplitude = 90 - z;
    amplitudeText = `${i.event === 'rising' ? 'E' : 'W'} ${Math.abs(amplitude).toFixed(1)}° ${amplitude >= 0 ? 'N' : 'S'}`;
    if (Math.abs(i.latitude_deg) > 60) warnings.push('Above 60° latitude the body rises and sets at a shallow angle: the moment of the observation is uncertain and so is the bearing.');
  } else {
    assertRange(i.gha_deg, 0, 360, 'gha_deg', 'GHA');
    assertRange(i.longitude_deg, -180, 180, 'longitude_deg', 'Longitude');
    lha = norm360(i.gha_deg + i.longitude_deg);
    const t = timeAzimuth(i.latitude_deg, i.declination_deg, lha);
    trueBearing = t.zn;
    altitude = t.alt;
    if (altitude < 0) warnings.push(`The body is ${(-altitude).toFixed(1)}° below the horizon at this LHA: check the GHA, the longitude sign (east +) and the time.`);
    else if (altitude > 30) warnings.push(`Altitude ${altitude.toFixed(0)}°: bearings of high bodies are hard to take accurately with an azimuth circle.`);
  }

  const compassError = norm180(trueBearing - i.compass_bearing_deg);
  const deviation = norm180(compassError - i.variation_deg);
  if (Math.abs(compassError) > 10) warnings.push('Compass error over 10°: check the observation, the time and the body before correcting the compass.');

  return {
    outputs: {
      lha_deg: lha,
      altitude_deg: altitude,
      amplitude_deg: amplitude,
      amplitude_text: amplitudeText,
      true_bearing_deg: trueBearing,
      compass_error_deg: compassError,
      deviation_deg: deviation,
      error_text: `True bearing ${trueBearing.toFixed(1)}°, compass ${i.compass_bearing_deg}°: compass error ${eastWest(compassError)}, deviation ${eastWest(deviation)} (variation ${eastWest(i.variation_deg)}).`,
    },
    warnings,
  };
}
