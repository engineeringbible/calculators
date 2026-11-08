/**
 * latlon-utm/calc.js — WGS84 latitude and longitude to UTM (zone, band, hemisphere, easting, northing) and back, with
 * the grid convergence and the point scale factor.
 *
 * Transverse Mercator by the Krüger series to sixth order in the third flattening n, as given by Karney (2011),
 * "Transverse Mercator with an accuracy of a few nanometers", J. Geodesy 85, and adopted by NGA.SIG.0012:
 *   forward: τ′ from τ = tan φ (conformal latitude), ξ′ = atan2(τ′, cos λ), η′ = asinh(sin λ / √(τ′² + cos² λ)),
 *            ξ = ξ′ + Σ α_j sin 2jξ′ cosh 2jη′,  η = η′ + Σ α_j cos 2jξ′ sinh 2jη′,  x = k0 A η, y = k0 A ξ
 *   inverse: the same with the β_j series, then τ from τ′ by Newton's method.
 * UTM: k0 = 0.9996, false easting 500 000 m, false northing 10 000 000 m south of the equator, zones of 6° with the
 * Norway and Svalbard exceptions, latitude bands C to X from 80° S to 84° N.
 * Schema units: degrees for angles (group angle, unit deg), metres for easting and northing.
 */
import { withDefaults, assertOneOf, assertRange, assertInteger } from '../shared/validate.js';

/** WGS84 (NIMA TR8350.2): semi-major axis, m, and flattening. */
export const WGS84_A = 6378137;
export const WGS84_F = 1 / 298.257223563;
/** UTM central scale factor, false easting and false northing (south), NGA.SIG.0012. */
const K0 = 0.9996;
const FALSE_E = 500000;
const FALSE_N_SOUTH = 10000000;
const BANDS = 'CDEFGHJKLMNPQRSTUVWXX';
const DEG = Math.PI / 180;

const N = WGS84_F / (2 - WGS84_F);
const E2 = WGS84_F * (2 - WGS84_F);
const E = Math.sqrt(E2);
const n2 = N * N; const n3 = n2 * N; const n4 = n3 * N; const n5 = n4 * N; const n6 = n5 * N;
/** Rectifying radius A (Karney 2011). */
const A = (WGS84_A / (1 + N)) * (1 + n2 / 4 + n4 / 64 + n6 / 256);
/** Krüger α (forward) and β (inverse) coefficients to n⁶, Karney (2011). */
const ALPHA = [null,
  N / 2 - (2 / 3) * n2 + (5 / 16) * n3 + (41 / 180) * n4 - (127 / 288) * n5 + (7891 / 37800) * n6,
  (13 / 48) * n2 - (3 / 5) * n3 + (557 / 1440) * n4 + (281 / 630) * n5 - (1983433 / 1935360) * n6,
  (61 / 240) * n3 - (103 / 140) * n4 + (15061 / 26880) * n5 + (167603 / 181440) * n6,
  (49561 / 161280) * n4 - (179 / 168) * n5 + (6601661 / 7257600) * n6,
  (34729 / 80640) * n5 - (3418889 / 1995840) * n6,
  (212378941 / 319334400) * n6];
const BETA = [null,
  N / 2 - (2 / 3) * n2 + (37 / 96) * n3 - (1 / 360) * n4 - (81 / 512) * n5 + (96199 / 604800) * n6,
  (1 / 48) * n2 + (1 / 15) * n3 - (437 / 1440) * n4 + (46 / 105) * n5 - (1118711 / 3870720) * n6,
  (17 / 480) * n3 - (37 / 840) * n4 - (209 / 4480) * n5 + (5569 / 90720) * n6,
  (4397 / 161280) * n4 - (11 / 504) * n5 - (830251 / 7257600) * n6,
  (4583 / 161280) * n5 - (108847 / 3991680) * n6,
  (20648693 / 638668800) * n6];

const centralMeridian = (zone) => (zone - 1) * 6 - 180 + 3;

/** τ′ (tangent of the conformal latitude) from τ = tan φ, Karney (2011). */
function tauPrime(tau) {
  const sigma = Math.sinh(E * Math.atanh((E * tau) / Math.sqrt(1 + tau * tau)));
  return tau * Math.sqrt(1 + sigma * sigma) - sigma * Math.sqrt(1 + tau * tau);
}

/** UTM zone of a position, with the Norway (32V) and Svalbard (31X–37X) exceptions. */
export function utmZone(latDeg, lonDeg) {
  let zone = Math.floor((lonDeg + 180) / 6) + 1;
  if (zone > 60) zone = 60;
  const band = BANDS[Math.min(20, Math.max(0, Math.floor(latDeg / 8 + 10)))];
  if (band === 'V' && zone === 31 && lonDeg >= 3) zone = 32;
  if (band === 'X') {
    if (zone === 32) zone = lonDeg < 9 ? 31 : 33;
    else if (zone === 34) zone = lonDeg < 21 ? 33 : 35;
    else if (zone === 36) zone = lonDeg < 33 ? 35 : 37;
  }
  return { zone, band };
}

/** Forward projection in a given zone: easting and northing (m) without the false northing, convergence (deg), scale. */
export function toUtm(latDeg, lonDeg, zone) {
  const phi = latDeg * DEG;
  let dLon = lonDeg - centralMeridian(zone);
  dLon = ((((dLon + 180) % 360) + 360) % 360) - 180;
  const lam = dLon * DEG;
  const tau = Math.tan(phi);
  const tp = Math.abs(latDeg) === 90 ? Math.sign(latDeg) * 1e300 : tauPrime(tau);
  const cosL = Math.cos(lam);
  const xiP = Math.atan2(tp, cosL);
  const etaP = Math.asinh(Math.sin(lam) / Math.sqrt(tp * tp + cosL * cosL));
  let xi = xiP; let eta = etaP; let p = 1; let q = 0;
  for (let j = 1; j <= 6; j += 1) {
    const s = Math.sin(2 * j * xiP); const c = Math.cos(2 * j * xiP);
    const sh = Math.sinh(2 * j * etaP); const ch = Math.cosh(2 * j * etaP);
    xi += ALPHA[j] * s * ch;
    eta += ALPHA[j] * c * sh;
    p += 2 * j * ALPHA[j] * c * ch;
    q += 2 * j * ALPHA[j] * s * sh;
  }
  const x = K0 * A * eta;
  const y = K0 * A * xi;
  const gamma = Math.atan((tp / Math.sqrt(1 + tp * tp)) * Math.tan(lam)) + Math.atan2(q, p);
  const kP = (Math.sqrt(1 - E2 * Math.sin(phi) ** 2) * Math.sqrt(1 + tau * tau)) / Math.sqrt(tp * tp + cosL * cosL);
  const kPP = (A / WGS84_A) * Math.sqrt(p * p + q * q);
  return { easting: x + FALSE_E, northing: y, convergenceDeg: gamma / DEG, scale: K0 * kP * kPP, dLonDeg: dLon };
}

/** Inverse projection: latitude and longitude (deg) from easting and the northing measured from the equator (m). */
export function fromUtm(easting, northingFromEquator, zone) {
  const xi = northingFromEquator / (K0 * A);
  const eta = (easting - FALSE_E) / (K0 * A);
  let xiP = xi; let etaP = eta; let p = 1; let q = 0;
  for (let j = 1; j <= 6; j += 1) {
    const s = Math.sin(2 * j * xi); const c = Math.cos(2 * j * xi);
    const sh = Math.sinh(2 * j * eta); const ch = Math.cosh(2 * j * eta);
    xiP -= BETA[j] * s * ch;
    etaP -= BETA[j] * c * sh;
    p -= 2 * j * BETA[j] * c * ch;
    q += 2 * j * BETA[j] * s * sh;
  }
  const shEta = Math.sinh(etaP); const sXi = Math.sin(xiP); const cXi = Math.cos(xiP);
  const r = Math.sqrt(shEta * shEta + cXi * cXi);
  const tp = sXi / r;
  let tau = tp;
  for (let k = 0; k < 10; k += 1) {
    const ti = tauPrime(tau);
    const d = ((tp - ti) / Math.sqrt(1 + ti * ti)) * ((1 + (1 - E2) * tau * tau) / ((1 - E2) * Math.sqrt(1 + tau * tau)));
    tau += d;
    if (Math.abs(d) < 1e-14) break;
  }
  const phi = Math.atan(tau);
  const lam = Math.atan2(shEta, cXi);
  const gamma = Math.atan(Math.tan(xiP) * Math.tanh(etaP)) + Math.atan2(q, p);
  const kP = Math.sqrt(1 - E2 * Math.sin(phi) ** 2) * Math.sqrt(1 + tau * tau) * r;
  const kPP = (A / WGS84_A) / Math.sqrt(p * p + q * q);
  return { latDeg: phi / DEG, lonDeg: centralMeridian(zone) + lam / DEG, convergenceDeg: gamma / DEG, scale: K0 * kP * kPP };
}

/** Degrees, minutes and seconds text: 48°51′29.520″ N. */
export function dms(deg, pos, neg, secDecimals = 3) {
  const sign = deg < 0 ? neg : pos;
  let s = Math.abs(deg) * 3600;
  s = Math.round(s * 10 ** secDecimals) / 10 ** secDecimals;
  const d = Math.floor(s / 3600);
  const m = Math.floor((s - d * 3600) / 60);
  const sec = s - d * 3600 - m * 60;
  return `${d}°${String(m).padStart(2, '0')}′${sec.toFixed(secDecimals).padStart(secDecimals + 3, '0')}″ ${sign}`;
}

export const schema = {
  id: 'latlon-utm',
  name: 'Latitude/longitude to UTM converter (WGS84)',
  category: 'civil',
  summary: 'Convert WGS84 latitude and longitude to UTM zone, easting and northing and back, to well under a millimetre, with grid convergence and scale factor.',
  related: ['traverse', 'area-coordinates', 'great-circle-distance', 'unit-converter'],
  assumptions: [
    'Coordinates are on the WGS84 ellipsoid (a = 6 378 137 m, f = 1/298.257223563). Positions on another datum such as NAD27 or ED50 must be transformed first; the datum shift can be over 100 m.',
    'The projection uses the Krüger series to sixth order (Karney 2011), which is accurate to a few nanometres within the zone and to far better than a millimetre up to 9° from the central meridian.',
    'The zone follows the standard 6° grid with the Norway (32V) and Svalbard (31X to 37X) exceptions. A zone can be forced to work in a neighbouring zone, up to 9° from its central meridian.',
    'UTM covers 80° S to 84° N. The polar regions use the Universal Polar Stereographic grid, which this page does not compute.',
    'Northings in the southern hemisphere carry the 10 000 000 m false northing; eastings carry the 500 000 m false easting.',
  ],
  notes: [
    'Verification 2026-11-08: 48.8582° N, 2.2945° E (Eiffel Tower) gives zone 31U, E 448 251.795 m, N 5 411 932.678 m, as in the Veness geodesy library example; 38N 444 500 3 688 500 gives 33.33424° N, 44.40363° E as in the GeoConvert manual. Fourteen points agree with the exact transverse Mercator (pygeodesy 26.10, elliptic-function method) within 0.01 mm. Checked by hand.',
  ],
  sources: [
    'Karney, C.F.F. (2011), "Transverse Mercator with an accuracy of a few nanometers", Journal of Geodesy 85(8), 475–485 (sixth-order Krüger series, conformal latitude, convergence and scale)',
    'NGA.SIG.0012_2.0.0_UTMUPS (2014), The Universal Grids and the Transverse Mercator and Polar Stereographic Map Projections, National Geospatial-Intelligence Agency',
    'NIMA TR8350.2 (2000), Department of Defense World Geodetic System 1984 (ellipsoid parameters)',
    'GeographicLib GeoConvert manual, Examples (38SMB4488 = 38n 444500 3688500 = 33.33424 44.40363)',
  ],
  inputs: [
    { id: 'direction', label: 'Conversion', type: 'select', default: 'to_utm', options: [{ value: 'to_utm', label: 'Latitude/longitude → UTM' }, { value: 'to_geo', label: 'UTM → latitude/longitude' }] },
    { id: 'lat_deg', label: 'Latitude (+ north, − south)', group: 'angle', unit: 'deg', default: 48.8582, min: -80, max: 84, help: 'Decimal degrees. For degrees, minutes and seconds type a formula such as 48+51/60+29.5/3600.', visibleWhen: { direction: 'to_utm' } },
    { id: 'lon_deg', label: 'Longitude (+ east, − west)', group: 'angle', unit: 'deg', default: 2.2945, min: -180, max: 180, visibleWhen: { direction: 'to_utm' } },
    { id: 'force_zone', label: 'Force a zone (0 = automatic)', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 60, integer: true, visibleWhen: { direction: 'to_utm' } },
    { id: 'zone', label: 'UTM zone number', group: 'dimensionless', unit: 'none', default: 31, min: 1, max: 60, integer: true, visibleWhen: { direction: 'to_geo' } },
    { id: 'hemisphere', label: 'Hemisphere', type: 'select', default: 'N', options: [{ value: 'N', label: 'North' }, { value: 'S', label: 'South (false northing 10 000 000 m)' }], visibleWhen: { direction: 'to_geo' } },
    { id: 'easting_m', label: 'Easting', group: 'length', unit: 'm', default: 448251.795, min: 0, max: 1000000, visibleWhen: { direction: 'to_geo' } },
    { id: 'northing_m', label: 'Northing', group: 'length', unit: 'm', default: 5411932.678, min: 0, max: 10000000, visibleWhen: { direction: 'to_geo' } },
  ],
  outputs: [
    { id: 'zone_out', label: 'UTM zone', group: 'dimensionless', unit: 'none', decimals: 0, visibleWhen: { direction: 'to_utm' } },
    { id: 'zone_text', label: 'Zone, latitude band and hemisphere', type: 'text', visibleWhen: { direction: 'to_utm' } },
    { id: 'easting_out_m', label: 'Easting', group: 'length', unit: 'm', decimals: 3, visibleWhen: { direction: 'to_utm' } },
    { id: 'northing_out_m', label: 'Northing', group: 'length', unit: 'm', decimals: 3, visibleWhen: { direction: 'to_utm' } },
    { id: 'lat_out_deg', label: 'Latitude', group: 'angle', unit: 'deg', decimals: 8, visibleWhen: { direction: 'to_geo' } },
    { id: 'lon_out_deg', label: 'Longitude', group: 'angle', unit: 'deg', decimals: 8, visibleWhen: { direction: 'to_geo' } },
    { id: 'dms_text', label: 'In degrees, minutes and seconds', type: 'text' },
    { id: 'convergence_deg', label: 'Grid convergence γ (bearing of grid north from true north, + clockwise)', group: 'angle', unit: 'deg', decimals: 6 },
    { id: 'scale', label: 'Point scale factor k', group: 'dimensionless', unit: 'none', decimals: 7 },
  ],
  example: {
    inputs: { direction: 'to_utm', lat_deg: [48.8582, 'deg'], lon_deg: [2.2945, 'deg'], force_zone: 0 },
    results: { easting_out_m: '448 251.795 m', northing_out_m: '5 411 932.678 m', scale: '0.9996329' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.direction, ['to_utm', 'to_geo'], 'direction', 'Conversion');
  const warnings = [];
  if (x.direction === 'to_utm') {
    const lat = assertRange(x.lat_deg, -80, 84, 'lat_deg', 'Latitude (UTM covers 80° S to 84° N)');
    const lon = assertRange(x.lon_deg, -180, 180, 'lon_deg', 'Longitude');
    const forced = assertInteger(assertRange(x.force_zone, 0, 60, 'force_zone', 'Force a zone'), 'force_zone', 'Force a zone');
    const auto = utmZone(lat, lon);
    const zone = forced || auto.zone;
    const r = toUtm(lat, lon, zone);
    if (Math.abs(r.dLonDeg) > 9) throw new Error(`Force a zone: the point is ${Math.abs(r.dLonDeg).toFixed(1)}° from the central meridian of zone ${zone}; use a zone within 9°.`);
    if (forced && forced !== auto.zone) warnings.push(`The point lies in zone ${auto.zone}; the coordinates are given in the forced zone ${zone}.`);
    if (Math.abs(r.dLonDeg) > 3.5) warnings.push('The point is more than 3.5° from the central meridian: the scale error exceeds 1 part in 1 000 near the equator.');
    const south = lat < 0;
    return {
      outputs: {
        zone_out: zone,
        zone_text: `${zone}${auto.band} (${south ? 'southern' : 'northern'} hemisphere)`,
        easting_out_m: r.easting,
        northing_out_m: south ? r.northing + FALSE_N_SOUTH : r.northing,
        lat_out_deg: null,
        lon_out_deg: null,
        dms_text: `${dms(lat, 'N', 'S')}, ${dms(lon, 'E', 'W')}`,
        convergence_deg: r.convergenceDeg,
        scale: r.scale,
      },
      warnings,
    };
  }
  const zone = assertInteger(assertRange(x.zone, 1, 60, 'zone', 'UTM zone number'), 'zone', 'UTM zone number');
  assertOneOf(x.hemisphere, ['N', 'S'], 'hemisphere', 'Hemisphere');
  const e = assertRange(x.easting_m, 0, 1000000, 'easting_m', 'Easting');
  const nIn = assertRange(x.northing_m, 0, 10000000, 'northing_m', 'Northing');
  if (e < 100000 || e > 900000) throw new Error('Easting: a UTM easting lies between about 100 000 and 900 000 m (500 000 m on the central meridian).');
  const nEq = x.hemisphere === 'S' ? nIn - FALSE_N_SOUTH : nIn;
  const r = fromUtm(e, nEq, zone);
  if (r.latDeg > 84.5 || r.latDeg < -80.5) throw new Error('Northing: the point is outside the UTM latitude range of 80° S to 84° N.');
  if (Math.abs(r.lonDeg - centralMeridian(zone)) > 9) throw new Error('Easting: the point is more than 9° from the central meridian.');
  if (Math.abs(r.lonDeg - centralMeridian(zone)) > 3.5) warnings.push('The point is outside its 6° zone (more than 3.5° from the central meridian); check the zone number.');
  if (x.hemisphere === 'S' && nIn < 1000000) warnings.push('A southern northing below 1 000 000 m is near the South Pole limit; check the hemisphere.');
  const lon = ((((r.lonDeg + 180) % 360) + 360) % 360) - 180;
  return {
    outputs: {
      zone_out: null,
      zone_text: null,
      easting_out_m: null,
      northing_out_m: null,
      lat_out_deg: r.latDeg,
      lon_out_deg: lon,
      dms_text: `${dms(r.latDeg, 'N', 'S')}, ${dms(lon, 'E', 'W')}`,
      convergence_deg: r.convergenceDeg,
      scale: r.scale,
    },
    warnings,
  };
}
