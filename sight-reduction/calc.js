/**
 * sight-reduction/calc.js — a celestial sight from sextant altitude to position line: altitude corrections (index error,
 * dip, refraction with temperature and pressure, parallax, semi-diameter) give the observed altitude Ho; the computed
 * altitude Hc and azimuth Zn at the assumed position give the intercept (Marcq St Hilaire method) and the intercept
 * terminal point through which the position line runs.
 *
 * Ha = Hs − IE − dip,  dip = 1.76′ √h;  R = cot(Ha + 7.31/(Ha + 4.4))′ × (P/1010)(283/(273 + T))  (Bennett);
 * Ho = Ha − R + HP cos Ha ± SD;   sin Hc = sin Lat sin Dec + cos Lat cos Dec cos LHA,  LHA = GHA + longitude (E +);
 * Zn = atan2(−cos Dec sin LHA, sin Dec cos Lat − cos Dec sin Lat cos LHA);   intercept = (Ho − Hc) in minutes = nmi.
 * Schema units: degrees, minutes of arc, metres, °C, hPa, nautical miles.
 */
import { withDefaults, assertNonNegative, assertRange, assertOneOf, assertPositive } from '../shared/validate.js';

const DEG = Math.PI / 180;
/** Dip of the sea horizon, arcminutes per √metre (Nautical Almanac). */
const DIP_ARCMIN_PER_SQRT_M = 1.76;
/** Nautical Almanac standard atmosphere for the refraction tables. */
const STANDARD_PRESSURE_HPA = 1010;
const STANDARD_TEMPERATURE_K = 283;
/** Horizontal parallax of the sun, arcminutes (8.8″). */
const SUN_HP_ARCMIN = 0.15;
const BODIES = ['sun_ll', 'sun_ul', 'moon_ll', 'moon_ul', 'star', 'planet'];

const norm360 = (deg) => ((deg % 360) + 360) % 360;
const norm180 = (deg) => {
  const a = norm360(deg);
  return a > 180 ? a - 360 : a;
};
const clamp1 = (x) => Math.max(-1, Math.min(1, x));
/** Degrees and decimal minutes, e.g. 57° 28.9′ (minutes rounded to 0.1′ with the carry into degrees). */
export function toDegMin(deg) {
  const tenths = Math.round(Math.abs(deg) * 600);
  const d = Math.floor(tenths / 600);
  const m = (tenths - d * 600) / 10;
  return `${deg < 0 ? '−' : ''}${d}° ${m.toFixed(1).padStart(4, '0')}′`;
}

export const schema = {
  id: 'sight-reduction',
  name: 'Sight reduction (intercept method)',
  category: 'maritime',
  summary: 'Observed altitude from the sextant reading, then the intercept, azimuth and intercept terminal point from the assumed position.',
  related: ['compass-error', 'great-circle-distance', 'mercator-sailing', 'light-range'],
  assumptions: [
    'Altitude corrections as in the Nautical Almanac: index error (on the arc subtracted), dip of the sea horizon 1.76′ √h for a height of eye h in metres, refraction from Bennett\'s formula scaled by (P/1010)·(283/(273 + T)) for non-standard pressure and temperature, parallax HP·cos Ha (0.15′ for the sun, the almanac HP for the moon, nil for stars), and the semi-diameter added for a lower limb and subtracted for an upper limb.',
    'Planets are observed at their centre; the almanac\'s small additional correction for Venus and Mars (phase and parallax) is entered by hand. The moon\'s semi-diameter is taken as entered; its small augmentation with altitude (up to 0.3′) is neglected.',
    'Computed altitude and azimuth from the navigational triangle at the assumed or dead-reckoning position with the GHA and declination for the time of the sight (UT); LHA = GHA + longitude with east longitude positive.',
    'Marcq St Hilaire intercept: one minute of altitude is one nautical mile; the position line is the straight tangent to the circle of equal altitude at the intercept terminal point, perpendicular to the azimuth. The tangent approximation is good while the intercept is under about 30 nmi and the altitude below about 85°.',
    'Sights below about 10° carry refraction errors of a few tenths of a minute that grow quickly towards the horizon; non-standard dip from abnormal refraction is not corrected.',
  ],
  notes: [
    'Verification 2026-10-31: refraction 9.9′, 5.3′ and 1.7′ at 5°, 10° and 30° (Nautical Almanac standard values); dip 7.0′ for 16 m; at latitude 40° N, declination 20° N and LHA 30° the computed altitude is 57.485° (57° 29.1′) and the azimuth 240.9°; an observed altitude 5′ above Hc puts the intercept terminal point 5 nmi towards the body.',
    'Design decision: the sextant altitude is entered as degrees plus minutes, as it is read; latitude, longitude, GHA and declination are decimal degrees (32° 15.4′ = 32.2567°).',
  ],
  sources: [
    'The Nautical Almanac (HM Nautical Almanac Office / US Naval Observatory) — altitude correction tables, dip 1.76′ √h(m), standard atmosphere 10 °C and 1010 hPa',
    'G. G. Bennett, "The calculation of astronomical refraction in marine navigation", Journal of Navigation 35 (1982) 255–259',
    'The American Practical Navigator (Bowditch), NGA Pub. 9 — "Sight Reduction" (navigational triangle, intercept method, position lines)',
    'A. Frost, The Principles and Practice of Navigation; R. Hughes / Nicholls\'s Concise Guide to Navigation — Marcq St Hilaire method',
  ],
  inputs: [
    {
      id: 'body',
      label: 'Body observed',
      type: 'select',
      default: 'sun_ll',
      options: [
        { value: 'sun_ll', label: 'Sun, lower limb' },
        { value: 'sun_ul', label: 'Sun, upper limb' },
        { value: 'moon_ll', label: 'Moon, lower limb' },
        { value: 'moon_ul', label: 'Moon, upper limb' },
        { value: 'star', label: 'Star' },
        { value: 'planet', label: 'Planet (centre)' },
      ],
    },
    { id: 'hs_deg', label: 'Sextant altitude Hs, whole degrees (°)', group: 'dimensionless', unit: 'none', default: 57, min: 0, max: 90, integer: true },
    { id: 'hs_min', label: 'Sextant altitude Hs, minutes', group: 'angle', unit: 'arcmin', default: 22.0, min: 0, max: 59.999 },
    { id: 'index_error_arcmin', label: 'Index error (+ on the arc, − off the arc)', group: 'angle', unit: 'arcmin', default: 1.5, min: -20, max: 20 },
    { id: 'eye_height_m', label: 'Height of eye above the sea', group: 'length', unit: 'm', default: 16, min: 0, max: 100 },
    { id: 'temperature_c', label: 'Air temperature', group: 'temperature', unit: 'C', default: 10, min: -40, max: 50 },
    { id: 'pressure_hpa', label: 'Atmospheric pressure', group: 'pressure', unit: 'hPa', default: 1010, min: 900, max: 1080 },
    { id: 'semi_diameter_arcmin', label: 'Semi-diameter SD (almanac)', group: 'angle', unit: 'arcmin', default: 16.0, min: 10, max: 20, visibleWhen: { body: ['sun_ll', 'sun_ul', 'moon_ll', 'moon_ul'] } },
    { id: 'moon_hp_arcmin', label: 'Moon\'s horizontal parallax HP (almanac)', group: 'angle', unit: 'arcmin', default: 57.0, min: 52, max: 62, visibleWhen: { body: ['moon_ll', 'moon_ul'] } },
    { id: 'planet_correction_arcmin', label: 'Additional correction for Venus or Mars (almanac)', group: 'angle', unit: 'arcmin', default: 0, min: -2, max: 2, visibleWhen: { body: 'planet' } },
    { id: 'latitude_deg', label: 'Assumed or DR latitude (+ N, − S)', group: 'angle', unit: 'deg', default: 40, min: -89, max: 89 },
    { id: 'longitude_deg', label: 'Assumed or DR longitude (+ E, − W)', group: 'angle', unit: 'deg', default: -30, min: -180, max: 180 },
    { id: 'gha_deg', label: 'GHA of the body at the time of the sight', group: 'angle', unit: 'deg', default: 60, min: 0, max: 360 },
    { id: 'declination_deg', label: 'Declination of the body (+ N, − S)', group: 'angle', unit: 'deg', default: 20, min: -89, max: 89 },
  ],
  outputs: [
    { id: 'index_correction_arcmin', label: 'Index correction', group: 'angle', unit: 'arcmin' },
    { id: 'dip_arcmin', label: 'Dip', group: 'angle', unit: 'arcmin' },
    { id: 'ha_deg', label: 'Apparent altitude Ha', group: 'angle', unit: 'deg' },
    { id: 'refraction_arcmin', label: 'Refraction', group: 'angle', unit: 'arcmin' },
    { id: 'parallax_arcmin', label: 'Parallax in altitude', group: 'angle', unit: 'arcmin' },
    { id: 'semi_diameter_used_arcmin', label: 'Semi-diameter applied', group: 'angle', unit: 'arcmin' },
    { id: 'total_correction_arcmin', label: 'Total correction Ho − Hs', group: 'angle', unit: 'arcmin' },
    { id: 'ho_deg', label: 'Observed altitude Ho', group: 'angle', unit: 'deg' },
    { id: 'lha_deg', label: 'Local hour angle LHA', group: 'angle', unit: 'deg' },
    { id: 'hc_deg', label: 'Computed altitude Hc', group: 'angle', unit: 'deg' },
    { id: 'zn_deg', label: 'Azimuth Zn', group: 'angle', unit: 'deg' },
    { id: 'intercept_nmi', label: 'Intercept Ho − Hc (+ towards, − away)', group: 'length', unit: 'nmi' },
    { id: 'itp_latitude_deg', label: 'Intercept terminal point, latitude', group: 'angle', unit: 'deg' },
    { id: 'itp_longitude_deg', label: 'Intercept terminal point, longitude', group: 'angle', unit: 'deg' },
    { id: 'position_line', label: 'Position line', type: 'text' },
    { id: 'dm_text', label: 'In degrees and minutes', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      index_correction_arcmin: '−1.5′',
      dip_arcmin: '7.0′',
      refraction_arcmin: '0.6′',
      parallax_arcmin: '0.1′',
      semi_diameter_used_arcmin: '+16.0′',
      lha_deg: '30°',
      zn_deg: '240.9°',
      intercept_nmi: '−0.2 nmi',
    },
  },
};

/** Refraction in arcminutes at apparent altitude `haDeg` for pressure (hPa) and temperature (°C) — Bennett 1982. */
export function refractionArcmin(haDeg, pressureHpa = STANDARD_PRESSURE_HPA, temperatureC = 10) {
  const standard = 1 / Math.tan((haDeg + 7.31 / (haDeg + 4.4)) * DEG);
  return standard * (pressureHpa / STANDARD_PRESSURE_HPA) * (STANDARD_TEMPERATURE_K / (273 + temperatureC));
}

/** Computed altitude and azimuth (degrees) of a body from latitude, declination and LHA. */
export function computedAltitude(latDeg, decDeg, lhaDeg) {
  const lat = latDeg * DEG;
  const dec = decDeg * DEG;
  const lha = lhaDeg * DEG;
  const hc = Math.asin(clamp1(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(lha))) / DEG;
  const zn = norm360(Math.atan2(-Math.cos(dec) * Math.sin(lha), Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(lha)) / DEG);
  return { hc, zn };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.body, BODIES, 'body', 'Body observed');
  assertRange(i.hs_deg, 0, 90, 'hs_deg', 'Sextant altitude (degrees)');
  if (!Number.isInteger(i.hs_deg)) throw new Error('Sextant altitude degrees must be a whole number; enter the rest as minutes');
  assertRange(i.hs_min, 0, 59.999, 'hs_min', 'Sextant altitude minutes');
  assertRange(i.index_error_arcmin, -20, 20, 'index_error_arcmin', 'Index error');
  assertNonNegative(i.eye_height_m, 'eye_height_m', 'Height of eye');
  assertRange(i.temperature_c, -40, 50, 'temperature_c', 'Air temperature');
  assertPositive(i.pressure_hpa, 'pressure_hpa', 'Atmospheric pressure');
  assertRange(i.latitude_deg, -89, 89, 'latitude_deg', 'Latitude');
  assertRange(i.longitude_deg, -180, 180, 'longitude_deg', 'Longitude');
  assertRange(i.gha_deg, 0, 360, 'gha_deg', 'GHA');
  assertRange(i.declination_deg, -89, 89, 'declination_deg', 'Declination');

  const hs = i.hs_deg + i.hs_min / 60;
  const indexCorrection = -i.index_error_arcmin;
  const dip = DIP_ARCMIN_PER_SQRT_M * Math.sqrt(i.eye_height_m);
  const ha = hs + (indexCorrection - dip) / 60;
  if (ha <= 0) throw new Error(`Apparent altitude ${ha.toFixed(2)}° is not above the horizon: check the sextant reading, the index error and the height of eye`);
  const refraction = refractionArcmin(ha, i.pressure_hpa, i.temperature_c);

  const isSun = i.body.startsWith('sun');
  const isMoon = i.body.startsWith('moon');
  let hp = 0;
  if (isSun) hp = SUN_HP_ARCMIN;
  if (isMoon) {
    assertRange(i.moon_hp_arcmin, 52, 62, 'moon_hp_arcmin', 'Moon\'s horizontal parallax');
    hp = i.moon_hp_arcmin;
  }
  const parallax = hp * Math.cos(ha * DEG);
  let sd = 0;
  if (isSun || isMoon) {
    assertRange(i.semi_diameter_arcmin, 10, 20, 'semi_diameter_arcmin', 'Semi-diameter');
    sd = i.body.endsWith('_ll') ? i.semi_diameter_arcmin : -i.semi_diameter_arcmin;
  }
  let extra = 0;
  if (i.body === 'planet') {
    assertRange(i.planet_correction_arcmin, -2, 2, 'planet_correction_arcmin', 'Planet correction');
    extra = i.planet_correction_arcmin;
  }
  const ho = ha + (-refraction + parallax + sd + extra) / 60;

  const lha = norm360(i.gha_deg + i.longitude_deg);
  const { hc, zn } = computedAltitude(i.latitude_deg, i.declination_deg, lha);
  const intercept = (ho - hc) * 60;
  const itpLat = i.latitude_deg + (intercept * Math.cos(zn * DEG)) / 60;
  const itpLon = norm180(i.longitude_deg + (intercept * Math.sin(zn * DEG)) / (60 * Math.cos(i.latitude_deg * DEG)));
  const lineA = norm360(zn + 90);
  const lineB = norm360(zn - 90);

  const warnings = [];
  if (ha < 10) warnings.push(`Apparent altitude ${ha.toFixed(1)}°: refraction near the horizon is uncertain; prefer sights above 10° (avoid below 5°).`);
  if (hc > 85 || ho > 85) warnings.push('Altitude above 85°: the circle of equal altitude is small and the straight position line is a poor approximation; plot the circle or use a better assumed position.');
  if (Math.abs(intercept) > 30) warnings.push(`Intercept of ${Math.abs(intercept).toFixed(1)} nmi: the assumed position is far from the true one; rework the sight from the intercept terminal point.`);
  if (hc < 0) warnings.push('Computed altitude below the horizon: check the GHA, the longitude sign (east +) and the time of the sight.');
  if (i.body === 'planet' && extra === 0) warnings.push('For Venus and Mars add the almanac\'s additional correction (phase and parallax), up to about 0.5′.');

  return {
    outputs: {
      index_correction_arcmin: indexCorrection,
      dip_arcmin: dip,
      ha_deg: ha,
      refraction_arcmin: refraction,
      parallax_arcmin: parallax,
      semi_diameter_used_arcmin: sd,
      total_correction_arcmin: (ho - hs) * 60,
      ho_deg: ho,
      lha_deg: lha,
      hc_deg: hc,
      zn_deg: zn,
      intercept_nmi: intercept,
      itp_latitude_deg: itpLat,
      itp_longitude_deg: itpLon,
      dm_text: `Ho ${toDegMin(ho)}, Hc ${toDegMin(hc)}, Zn ${zn.toFixed(1).padStart(5, '0')}°, intercept ${Math.abs(intercept).toFixed(1)}′ ${intercept >= 0 ? 'T (towards)' : 'A (away)'}; ITP ${toDegMin(Math.abs(itpLat))} ${itpLat >= 0 ? 'N' : 'S'}, ${toDegMin(Math.abs(itpLon))} ${itpLon >= 0 ? 'E' : 'W'}.`,
      position_line: `Intercept ${Math.abs(intercept).toFixed(1)} nmi ${intercept >= 0 ? 'towards' : 'away from'} the body on ${zn.toFixed(1)}°; the position line runs ${Math.min(lineA, lineB).toFixed(1)}°–${Math.max(lineA, lineB).toFixed(1)}° through ${Math.abs(itpLat).toFixed(4)}° ${itpLat >= 0 ? 'N' : 'S'}, ${Math.abs(itpLon).toFixed(4)}° ${itpLon >= 0 ? 'E' : 'W'}.`,
    },
    warnings,
  };
}
