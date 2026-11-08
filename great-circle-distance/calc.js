/**
 * great-circle-distance/calc.js — great-circle and rhumb-line sailings between two positions, plus the WGS-84 geodesic.
 *
 * Great circle: haversine distance, initial and final courses, vertex and midpoint (vector method).
 * Rhumb line: Mercator sailing (meridional parts via ln tan(π/4 + φ/2)). Geodesic: Vincenty inverse on WGS-84.
 * Schema units: latitude/longitude in degrees (+N, +E), distances in nautical miles, courses in degrees true, speed in knots.
 */
import { withDefaults, assertRange, assertPositive, assertOneOf } from '../shared/validate.js';

const DEG = Math.PI / 180;
const METRES_PER_NMI = 1852;

/** Sphere radii used by the two spherical models, metres. */
export const EARTH_MODELS = {
  nautical: { label: 'Nautical sphere: 1 minute of arc = 1 nautical mile (R = 3 437.747 nmi)', radiusM: (METRES_PER_NMI * 180 * 60) / Math.PI },
  mean_radius: { label: 'IUGG mean Earth radius R = 6 371.0088 km', radiusM: 6371008.8 },
};

/** WGS-84 ellipsoid (NIMA TR8350.2): semi-major axis and flattening. */
export const WGS84 = { a: 6378137, f: 1 / 298.257223563 };

export const schema = {
  id: 'great-circle-distance',
  name: 'Great-circle and rhumb-line distance',
  category: 'maritime',
  summary: 'Great-circle distance, initial and final courses, vertex and midpoint, rhumb-line distance and course, WGS-84 geodesic and passage time.',
  related: ['fuel-voyage-cost', 'propeller-slip', 'tidal-height', 'unit-converter'],
  sendTo: [
    {
      target: 'fuel-voyage-cost',
      label: 'Fuel and cost for this passage',
      note: 'Great-circle distance and speed; add a routing margin there if the track departs from the great circle.',
      links: [
        { to: 'distance_nmi', from: 'gc_distance_nmi' },
        { to: 'speed_kn', from: 'input:speed_kn' },
      ],
    },
    {
      target: 'course-to-steer',
      label: 'Course to steer against the current (first leg)',
      note: 'The initial great-circle course becomes the track; a great-circle course changes along the way, so it holds for the first leg only.',
      links: [
        { to: 'track_deg', from: 'gc_initial_course_deg' },
        { to: 'speed_kn', from: 'input:speed_kn' },
        { to: 'distance_nmi', from: 'gc_distance_nmi' },
      ],
    },
    {
      target: 'optimal-speed-charter',
      label: 'Optimal speed for this passage',
      note: 'Sends the distance; enter the reference fuel consumption, the prices and the charter terms there.',
      links: [{ to: 'distance_nmi', from: 'gc_distance_nmi' }],
    },
  ],
  notes: [
    'Verification 2026-10-30: Vincenty reproduces the Geoscience Australia reference line (Flinders Peak – Buninyong) to 1 mm and both azimuths to 10⁻⁵ °. Note that Vincenty\'s α₂ is the arrival heading; the published "reverse azimuth" 127°10′25″ is α₂ − 180°, which first tripped the test, not the code.',
    'Verification: the 60°N parallel-sailing case reproduces Bowditch (2 700 nmi rhumb line, 2 484.6 nmi great circle, vertex 67.8°N) and the New York–London default was checked against the classical vertex formula cos φ_v = cos φ₁ |sin C₁|.',
    'Design decision: vertex and midpoint are computed with unit vectors (projection of the pole onto the great-circle plane) so that antipodal and equatorial cases are detected explicitly; the classical formula is kept as the test cross-check.',
    'Design decision: distances are reported in nautical miles with both spherical models selectable and the WGS-84 geodesic always shown alongside.',
  ],
  assumptions: [
    'Positions are geographic latitude and longitude in decimal degrees, north and east positive; longitude differences are normalised to ±180°, so tracks crossing the antimeridian are handled.',
    'Great-circle and rhumb-line results use a spherical Earth: the "nautical" sphere where one minute of arc equals one nautical mile (the convention of Bowditch and the sailings tables), or the IUGG mean radius; the two differ by about 0.07 %.',
    'The WGS-84 geodesic (Vincenty inverse) is the true shortest distance on the ellipsoid and differs from the spherical great circle by up to about 0.5 %; it is the figure to compare with GPS or ECDIS. Nearly antipodal points may not converge and fall back to the sphere with a warning.',
    'Courses are true courses measured clockwise from true north; no magnetic variation, deviation, set or drift is applied.',
    'The rhumb line is a loxodrome of constant true course; its distance is undefined at the poles and the Mercator formula is used only for latitudes within ±89.9°.',
    'Passage time is distance divided by the entered speed with no allowance for weather, currents, waypoints along the great circle or land in the way; a great-circle track is a sequence of rhumb-line legs in practice.',
    'The vertex reported is the point of highest latitude on the full great circle; whether the passage actually reaches it is stated separately.',
  ],
  sources: [
    'Bowditch, The American Practical Navigator (NGA Pub. 9, 2019), ch. 24 "The Sailings": great-circle, Mercator and parallel sailing formulas',
    'Vincenty, T., "Direct and inverse solutions of geodesics on the ellipsoid with application of nested equations", Survey Review 23(176), 1975',
    'Geoscience Australia, Vincenty inverse worked example (Flinders Peak to Buninyong: 54 972.271 m)',
    'NIMA TR8350.2, Department of Defense World Geodetic System 1984 (ellipsoid parameters); IUGG mean Earth radius 6 371.0088 km',
    'International Hydrographic Conference 1929 (nautical mile = 1852 m)',
  ],
  inputs: [
    { id: 'lat1_deg', label: 'Departure latitude (+N, −S)', group: 'angle', unit: 'deg', default: 40.7, min: -90, max: 90 },
    { id: 'lon1_deg', label: 'Departure longitude (+E, −W)', group: 'angle', unit: 'deg', default: -74.0, min: -180, max: 180 },
    { id: 'lat2_deg', label: 'Destination latitude (+N, −S)', group: 'angle', unit: 'deg', default: 51.5, min: -90, max: 90 },
    { id: 'lon2_deg', label: 'Destination longitude (+E, −W)', group: 'angle', unit: 'deg', default: -0.1, min: -180, max: 180 },
    { id: 'speed_kn', label: 'Speed of advance (for passage time)', group: 'speed', unit: 'kn', default: 14, min: 0.1, max: 60 },
    { id: 'earth_model', label: 'Spherical model for the sailings', type: 'select', default: 'nautical', options: Object.entries(EARTH_MODELS).map(([value, m]) => ({ value, label: m.label })) },
  ],
  outputs: [
    { id: 'gc_distance_nmi', label: 'Great-circle distance', group: 'length', unit: 'nmi' },
    { id: 'gc_initial_course_deg', label: 'Great-circle initial course (true)', group: 'angle', unit: 'deg', decimals: 1 },
    { id: 'gc_final_course_deg', label: 'Great-circle final course (true)', group: 'angle', unit: 'deg', decimals: 1 },
    { id: 'gc_vertex_lat_deg', label: 'Vertex latitude (highest latitude of the great circle)', group: 'angle', unit: 'deg', decimals: 3 },
    { id: 'gc_vertex_lon_deg', label: 'Vertex longitude', group: 'angle', unit: 'deg', decimals: 3 },
    { id: 'vertex_on_track', label: 'Does the passage reach the vertex?', type: 'text' },
    { id: 'midpoint_lat_deg', label: 'Great-circle midpoint latitude', group: 'angle', unit: 'deg', decimals: 3 },
    { id: 'midpoint_lon_deg', label: 'Great-circle midpoint longitude', group: 'angle', unit: 'deg', decimals: 3 },
    { id: 'rl_distance_nmi', label: 'Rhumb-line distance', group: 'length', unit: 'nmi' },
    { id: 'rl_course_deg', label: 'Rhumb-line course (true, constant)', group: 'angle', unit: 'deg', decimals: 1 },
    { id: 'saving_nmi', label: 'Distance saved by the great circle', group: 'length', unit: 'nmi' },
    { id: 'saving_pct', label: 'Saving relative to the rhumb line', group: 'ratio', unit: 'pct' },
    { id: 'geodesic_distance_nmi', label: 'WGS-84 geodesic distance (Vincenty)', group: 'length', unit: 'nmi' },
    { id: 'gc_time_h', label: 'Passage time on the great circle', group: 'time', unit: 'h' },
    { id: 'rl_time_h', label: 'Passage time on the rhumb line', group: 'time', unit: 'h' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      gc_distance_nmi: '3 007 nmi',
      rl_distance_nmi: '3 128 nmi',
      saving_pct: '3.9 %',
      geodesic_distance_nmi: '5 588 km',
    },
  },
};

const toRad = (deg) => deg * DEG;
const toDeg = (rad) => rad / DEG;

/** Wrap a longitude or longitude difference into (−180°, 180°]. */
export function normalizeLongitudeDeg(deg) {
  const wrapped = ((((deg + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 ? 180 : wrapped;
}

/** Wrap a bearing into [0°, 360°). */
export function normalizeBearingDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

/** Great-circle distance (haversine) and initial/final true courses on a sphere of radius `radiusM`. */
export function greatCircle(lat1Deg, lon1Deg, lat2Deg, lon2Deg, radiusM) {
  const phi1 = toRad(lat1Deg);
  const phi2 = toRad(lat2Deg);
  const dLambda = toRad(normalizeLongitudeDeg(lon2Deg - lon1Deg));
  const dPhi = phi2 - phi1;
  const h = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const sigma = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
  const initial = Math.atan2(Math.sin(dLambda) * Math.cos(phi2), Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda));
  const final = Math.atan2(Math.sin(dLambda) * Math.cos(phi1), -Math.cos(phi2) * Math.sin(phi1) + Math.sin(phi2) * Math.cos(phi1) * Math.cos(dLambda));
  return {
    distanceM: sigma * radiusM,
    angularDistanceDeg: toDeg(sigma),
    initialCourseDeg: normalizeBearingDeg(toDeg(initial)),
    finalCourseDeg: normalizeBearingDeg(toDeg(final)),
  };
}

/** Rhumb-line (Mercator sailing) distance and constant course on a sphere. */
export function rhumbLine(lat1Deg, lon1Deg, lat2Deg, lon2Deg, radiusM) {
  const phi1 = toRad(lat1Deg);
  const phi2 = toRad(lat2Deg);
  const dLambda = toRad(normalizeLongitudeDeg(lon2Deg - lon1Deg));
  const dPhi = phi2 - phi1;
  const dPsi = Math.log(Math.tan(Math.PI / 4 + phi2 / 2) / Math.tan(Math.PI / 4 + phi1 / 2));
  const q = Math.abs(dPsi) > 1e-12 ? dPhi / dPsi : Math.cos(phi1);
  return {
    distanceM: Math.sqrt(dPhi * dPhi + q * q * dLambda * dLambda) * radiusM,
    courseDeg: normalizeBearingDeg(toDeg(Math.atan2(dLambda, dPsi))),
  };
}

function toVector(latDeg, lonDeg) {
  const phi = toRad(latDeg);
  const lambda = toRad(lonDeg);
  return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
}

function toLatLon(v) {
  const n = Math.hypot(v[0], v[1], v[2]);
  return { latDeg: toDeg(Math.asin(v[2] / n)), lonDeg: toDeg(Math.atan2(v[1], v[0])) };
}

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const angleBetween = (a, b) => Math.atan2(Math.hypot(...cross(a, b)), dot(a, b));

/**
 * Vertex (point of greatest |latitude|) of the great circle through two points, and whether the minor arc reaches it.
 * Returns null for coincident or antipodal points, and { equator: true } when the great circle is the equator.
 */
export function greatCircleVertex(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
  const r1 = toVector(lat1Deg, lon1Deg);
  const r2 = toVector(lat2Deg, lon2Deg);
  const n = cross(r1, r2);
  const nLength = Math.hypot(...n);
  if (nLength < 1e-12) return null;
  const unitN = n.map((c) => c / nLength);
  const projection = [-unitN[2] * unitN[0], -unitN[2] * unitN[1], 1 - unitN[2] * unitN[2]];
  const projectionLength = Math.hypot(...projection);
  if (projectionLength < 1e-12) return { equator: true };
  const north = projection.map((c) => c / projectionLength);
  const south = north.map((c) => -c);
  const arc = angleBetween(r1, r2);
  const onArc = (v) => Math.abs(angleBetween(r1, v) + angleBetween(v, r2) - arc) < 1e-9;
  if (onArc(north)) return { ...toLatLon(north), onTrack: true };
  if (onArc(south)) return { ...toLatLon(south), onTrack: true };
  return { ...toLatLon(north), onTrack: false };
}

/** Midpoint of the minor great-circle arc (null for antipodal points). */
export function greatCircleMidpoint(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
  const r1 = toVector(lat1Deg, lon1Deg);
  const r2 = toVector(lat2Deg, lon2Deg);
  const sum = [r1[0] + r2[0], r1[1] + r2[1], r1[2] + r2[2]];
  if (Math.hypot(...sum) < 1e-12) return null;
  return toLatLon(sum);
}

/**
 * Vincenty inverse solution on the WGS-84 ellipsoid.
 * @returns {{ distanceM: number, initialAzimuthDeg: number, finalAzimuthDeg: number, converged: boolean }}
 */
export function vincentyInverse(lat1Deg, lon1Deg, lat2Deg, lon2Deg, ellipsoid = WGS84) {
  const { a, f } = ellipsoid;
  const b = a * (1 - f);
  const L = toRad(normalizeLongitudeDeg(lon2Deg - lon1Deg));
  const U1 = Math.atan((1 - f) * Math.tan(toRad(lat1Deg)));
  const U2 = Math.atan((1 - f) * Math.tan(toRad(lat2Deg)));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);

  let lambda = L;
  let sinSigma = 0;
  let cosSigma = 0;
  let sigma = 0;
  let cos2Alpha = 0;
  let cos2SigmaM = 0;
  let converged = false;
  for (let iteration = 0; iteration < 200; iteration += 1) {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    sinSigma = Math.hypot(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda);
    if (sinSigma === 0) return { distanceM: 0, initialAzimuthDeg: 0, finalAzimuthDeg: 0, converged: true };
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cos2Alpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cos2Alpha !== 0 ? cosSigma - (2 * sinU1 * sinU2) / cos2Alpha : 0;
    const C = (f / 16) * cos2Alpha * (4 + f * (4 - 3 * cos2Alpha));
    const previousLambda = lambda;
    lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    if (Math.abs(lambda - previousLambda) < 1e-12) {
      converged = true;
      break;
    }
  }
  if (!converged) return { distanceM: NaN, initialAzimuthDeg: NaN, finalAzimuthDeg: NaN, converged: false };

  const u2 = (cos2Alpha * (a * a - b * b)) / (b * b);
  const A = 1 + (u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)));
  const B = (u2 / 1024) * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
  const deltaSigma = B * sinSigma * (cos2SigmaM + (B / 4) * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - (B / 6) * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
  const sinLambda = Math.sin(lambda);
  const cosLambda = Math.cos(lambda);
  return {
    distanceM: b * A * (sigma - deltaSigma),
    initialAzimuthDeg: normalizeBearingDeg(toDeg(Math.atan2(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda))),
    finalAzimuthDeg: normalizeBearingDeg(toDeg(Math.atan2(cosU1 * sinLambda, -sinU1 * cosU2 + cosU1 * sinU2 * cosLambda))),
    converged: true,
  };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertRange(i.lat1_deg, -90, 90, 'lat1_deg', 'Departure latitude');
  assertRange(i.lat2_deg, -90, 90, 'lat2_deg', 'Destination latitude');
  assertRange(i.lon1_deg, -180, 180, 'lon1_deg', 'Departure longitude');
  assertRange(i.lon2_deg, -180, 180, 'lon2_deg', 'Destination longitude');
  assertPositive(i.speed_kn, 'speed_kn', 'Speed');
  assertOneOf(i.earth_model, Object.keys(EARTH_MODELS), 'earth_model', 'Earth model');

  const radiusM = EARTH_MODELS[i.earth_model].radiusM;
  const gc = greatCircle(i.lat1_deg, i.lon1_deg, i.lat2_deg, i.lon2_deg, radiusM);
  const warnings = [];

  let rl = { distanceM: null, courseDeg: null };
  if (Math.abs(i.lat1_deg) > 89.9 || Math.abs(i.lat2_deg) > 89.9) warnings.push('Rhumb-line sailing is not defined within 0.1° of the poles; rhumb-line outputs are omitted.');
  else rl = rhumbLine(i.lat1_deg, i.lon1_deg, i.lat2_deg, i.lon2_deg, radiusM);

  const vertex = greatCircleVertex(i.lat1_deg, i.lon1_deg, i.lat2_deg, i.lon2_deg);
  const midpoint = greatCircleMidpoint(i.lat1_deg, i.lon1_deg, i.lat2_deg, i.lon2_deg);
  if (vertex === null) warnings.push('Departure and destination are coincident or antipodal: the great circle is not unique, so vertex and midpoint are omitted.');

  let geodesic = vincentyInverse(i.lat1_deg, i.lon1_deg, i.lat2_deg, i.lon2_deg);
  if (!geodesic.converged) {
    warnings.push('Vincenty did not converge (nearly antipodal points); the WGS-84 geodesic shown is the spherical great-circle distance.');
    geodesic = { distanceM: gc.distanceM };
  }

  const gcNmi = gc.distanceM / METRES_PER_NMI;
  const rlNmi = rl.distanceM === null ? null : rl.distanceM / METRES_PER_NMI;
  let vertexText;
  if (vertex === null) vertexText = '—';
  else if (vertex.equator) vertexText = 'The great circle is the equator (no vertex)';
  else vertexText = vertex.onTrack ? 'Yes — the vertex lies on the passage' : 'No — the highest latitude on the passage is at departure or destination';

  if (gcNmi > 0 && gc.angularDistanceDeg > 150) warnings.push('Angular distance above 150°: the great circle passes near the antipode and small position changes swing the route far.');

  return {
    outputs: {
      gc_distance_nmi: gcNmi,
      gc_initial_course_deg: gc.initialCourseDeg,
      gc_final_course_deg: gc.finalCourseDeg,
      gc_vertex_lat_deg: vertex && !vertex.equator ? vertex.latDeg : null,
      gc_vertex_lon_deg: vertex && !vertex.equator ? vertex.lonDeg : null,
      vertex_on_track: vertexText,
      midpoint_lat_deg: midpoint ? midpoint.latDeg : null,
      midpoint_lon_deg: midpoint ? midpoint.lonDeg : null,
      rl_distance_nmi: rlNmi,
      rl_course_deg: rl.courseDeg,
      saving_nmi: rlNmi === null ? null : rlNmi - gcNmi,
      saving_pct: rlNmi === null || rlNmi === 0 ? null : ((rlNmi - gcNmi) / rlNmi) * 100,
      geodesic_distance_nmi: geodesic.distanceM / METRES_PER_NMI,
      gc_time_h: gcNmi / i.speed_kn,
      rl_time_h: rlNmi === null ? null : rlNmi / i.speed_kn,
    },
    warnings,
  };
}
