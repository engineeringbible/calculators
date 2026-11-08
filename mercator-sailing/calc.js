/**
 * mercator-sailing/calc.js — rhumb-line (Mercator) sailing: meridional parts on the sphere or the WGS84 ellipsoid,
 * course and distance between two positions, departure, the great-circle distance for comparison and the passage
 * time at a given speed.
 *
 * MP(φ) = (10800/π) [ln tan(45° + φ/2) − e² sin φ − e⁴ sin³φ/3 − e⁶ sin⁵φ/5]   (minutes; e = 0 on the sphere)
 * tan C = DLo / DMP;  departure = DLo × (DLat/DMP);  D = √(DLat² + departure²)   (1′ of latitude = 1 nmi)
 * Schema units: degrees, nautical miles, knots.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

const DEG = Math.PI / 180;
const MIN_PER_RAD = 10800 / Math.PI;
/** WGS84 first eccentricity squared. */
export const E2_WGS84 = 0.00669437999014;
/** Radius for the great-circle comparison on the same 1′ = 1 nmi basis as the rhumb line (10800/π nmi); atlas_physics uses 3440.065. */
export const EARTH_RADIUS_NMI = MIN_PER_RAD;
export const PRODUCTION_RADIUS_NMI = 3440.065;

/** Meridional parts in minutes of arc (sphere when e2 = 0). */
export function meridionalParts(latDeg, e2 = 0) {
  const phi = latDeg * DEG;
  const s = Math.sin(phi);
  const core = Math.log(Math.tan(Math.PI / 4 + phi / 2));
  const ell = e2 === 0 ? 0 : e2 * s + (e2 * e2 * s ** 3) / 3 + (e2 ** 3 * s ** 5) / 5;
  return MIN_PER_RAD * (core - ell);
}

/** Great-circle distance by the haversine formula, nmi. */
export function greatCircleNmi(lat1, lon1, lat2, lon2) {
  const dPhi = (lat2 - lat1) * DEG;
  const dLam = (lon2 - lon1) * DEG;
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLam / 2) ** 2;
  return 2 * EARTH_RADIUS_NMI * Math.asin(Math.sqrt(a));
}

export const schema = {
  id: 'mercator-sailing',
  name: 'Mercator (rhumb-line) sailing',
  category: 'maritime',
  summary: 'Rhumb-line course and distance from meridional parts (sphere or WGS84), departure, great-circle comparison and passage time.',
  related: ['great-circle-distance', 'course-to-steer', 'fuel-voyage-cost', 'optimal-speed-charter', 'tidal-height'],
  sendTo: [
    {
      target: 'fuel-voyage-cost',
      label: 'Fuel and cost for this passage',
      note: 'Rhumb-line distance and speed.',
      links: [
        { to: 'distance_nmi', from: 'distance_nmi' },
        { to: 'speed_kn', from: 'input:speed_kn' },
      ],
    },
    {
      target: 'course-to-steer',
      label: 'Course to steer against the current',
      note: 'The rhumb-line course becomes the track; it is constant along a rhumb line.',
      links: [
        { to: 'track_deg', from: 'course_deg' },
        { to: 'speed_kn', from: 'input:speed_kn' },
        { to: 'distance_nmi', from: 'distance_nmi' },
      ],
    },
  ],
  assumptions: [
    'Mercator sailing solves the rhumb line (loxodrome, constant true course) between two positions with meridional parts: tan C = DLo/DMP, where DLo is the difference of longitude in minutes (the shorter way round, ≤ 180°) and DMP the difference of meridional parts; MP(φ) = (10800/π)[ln tan(45° + φ/2) − e² sin φ − e⁴ sin³φ/3 − e⁶ sin⁵φ/5] in minutes, with e = 0 on the sphere (7915.7045 log₁₀ tan(45° + φ/2)) and e² = 0.00669438 for WGS84 (the familiar 23.0133633 sin φ correction term).',
    'Distance by the standard navigational convention that one minute of latitude is one nautical mile: departure = DLo × DLat/DMP (or DLo cos φ on a parallel) and D = √(DLat² + departure²), which equals DLat/cos C away from east–west courses; the true meridian minute on the ellipsoid varies between 1 843 and 1 862 m, so the ellipsoidal course is exact while the distance keeps the 1′ = 1 nmi basis (±0.5 %), as in Bowditch.',
    'The great-circle comparison uses the haversine formula on the same 1′ = 1 nmi basis (R = 10800/π = 3 437.75 nmi) so that both distances share one convention and the saving is meaningful; the atlas_physics navigation module uses a mean radius of 3 440.065 nmi, 1.000674 × these values.',
    'The rhumb line cannot pass over a pole; positions within 0.1° of a pole are rejected because the meridional parts diverge; for courses within 0.5° of east–west the parallel-sailing form is used to avoid dividing by a vanishing DMP.',
    'Positions are geodetic latitude and longitude (east and north positive); no corrections for compass error, current or leeway (see the course-to-steer calculator).',
  ],
  notes: [
    'Verification 2026-10-31: Piraeus (37.9375 N, 23.6375 E) to Port Said (31.25 N, 32.30 E) gives course 133.19° on the sphere, identical to the production rhumb_course_deg, and 586.2 nmi, which × 1.000674 equals the production 586.62 nmi (different Earth radius convention); a 10° parallel leg (10 N, 10 E → 10 N, 20 E) gives 590.9 nmi = 600′ cos 10°, and a meridian leg of 10° gives exactly 600 nmi; WGS84 changes the Piraeus course by 0.13° (the ellipsoid shrinks the meridional parts by about 0.5 %).',
    'Design decision: 1′ = 1 nmi is kept for the distance even on the ellipsoid because that is what the Mercator sailing method and sight-reduction tables assume; the note explains the 0.07 % difference to the production spherical radius so the two can be reconciled.',
    'Article check 2026-10-31 (schema.example): the worked example printed MP₁ 2 453.5′ (a typo for 2 463.5′) and MP₂ 1 963.1′ (the spherical value is 1 975.5′, recomputed independently), hence DMP −490.4′ instead of −488.0′, S 46.7° E instead of S 46.8° E and a great circle of 586.1 instead of 586.0 nmi; the course of 133.2° and the rhumb-line distance were right. Corrected in content.md; the calculator was right.',
  ],
  sources: [
    'The American Practical Navigator (Bowditch), NGA Pub. 9, 2019 edition, ch. 12 "The Sailings" — Mercator sailing, meridional parts (Table 6 formula with WGS84 eccentricity)',
    'Admiralty Manual of Navigation, BR 45, Vol. 1 — Mercator sailing and meridional parts',
    'NIMA TR8350.2, Department of Defense World Geodetic System 1984 — e² = 0.00669437999014',
    'atlas_physics.navigation (rhumb_distance_nm, rhumb_course_deg, R = 3440.065 nmi) — cross-check values',
  ],
  inputs: [
    { id: 'lat1', label: 'Departure latitude (N +, S −)', group: 'angle', unit: 'deg', default: 37.9375, min: -89.9, max: 89.9 },
    { id: 'lon1', label: 'Departure longitude (E +, W −)', group: 'angle', unit: 'deg', default: 23.6375, min: -180, max: 180 },
    { id: 'lat2', label: 'Arrival latitude', group: 'angle', unit: 'deg', default: 31.25, min: -89.9, max: 89.9 },
    { id: 'lon2', label: 'Arrival longitude', group: 'angle', unit: 'deg', default: 32.3, min: -180, max: 180 },
    { id: 'figure', label: 'Earth figure for the meridional parts', type: 'select', default: 'wgs84', options: [{ value: 'wgs84', label: 'WGS84 ellipsoid (Bowditch Table 6)' }, { value: 'sphere', label: 'Sphere (7915.7045 log tan(45° + φ/2))' }] },
    { id: 'speed_kn', label: 'Speed for the passage time', group: 'speed', unit: 'kn', default: 12, min: 0.1, max: 60 },
  ],
  outputs: [
    { id: 'dlat_min', label: 'Difference of latitude DLat (′, N +)', group: 'dimensionless', unit: 'none' },
    { id: 'dlo_min', label: 'Difference of longitude DLo (′, E +, shorter way)', group: 'dimensionless', unit: 'none' },
    { id: 'mp1', label: 'Meridional parts of departure (′)', group: 'dimensionless', unit: 'none' },
    { id: 'mp2', label: 'Meridional parts of arrival (′)', group: 'dimensionless', unit: 'none' },
    { id: 'dmp', label: 'Difference of meridional parts DMP (′)', group: 'dimensionless', unit: 'none' },
    { id: 'course_deg', label: 'Rhumb-line course, true', group: 'angle', unit: 'deg' },
    { id: 'course_quadrantal', label: 'Course, quadrantal notation', type: 'text' },
    { id: 'departure_nmi', label: 'Departure (east–west distance)', group: 'length', unit: 'nmi' },
    { id: 'distance_nmi', label: 'Rhumb-line distance (1′ = 1 nmi)', group: 'length', unit: 'nmi' },
    { id: 'great_circle_nmi', label: 'Great-circle distance (haversine, same 1′ = 1 nmi basis)', group: 'length', unit: 'nmi' },
    { id: 'great_circle_saving_pct', label: 'Great-circle saving against the rhumb line', group: 'ratio', unit: 'pct' },
    { id: 'passage_time_h', label: 'Passage time at the speed entered', group: 'time', unit: 'h' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      figure: 'sphere',
    },
    results: {
      dlat_min: '−401.25',
      dlo_min: '+519.75',
      mp1: '2 463.5',
      mp2: '1 975.5',
      dmp: '−488.0',
      course_deg: '133.2°',
      departure_nmi: '427.4 nmi',
      distance_nmi: '586.2 nmi',
      great_circle_nmi: '586.0 nmi',
      passage_time_h: '48.9 h',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  for (const key of ['lat1', 'lat2']) assertRange(i[key], -89.9, 89.9, key, 'Latitude');
  for (const key of ['lon1', 'lon2']) assertRange(i[key], -180, 180, key, 'Longitude');
  assertOneOf(i.figure, ['wgs84', 'sphere'], 'figure', 'Earth figure');
  assertPositive(i.speed_kn, 'speed_kn', 'Speed');

  const e2 = i.figure === 'wgs84' ? E2_WGS84 : 0;
  const dLatMin = (i.lat2 - i.lat1) * 60;
  let dLoDeg = i.lon2 - i.lon1;
  if (dLoDeg > 180) dLoDeg -= 360;
  if (dLoDeg < -180) dLoDeg += 360;
  const dLoMin = dLoDeg * 60;
  const mp1 = meridionalParts(i.lat1, e2);
  const mp2 = meridionalParts(i.lat2, e2);
  const dmp = mp2 - mp1;
  if (dLatMin === 0 && dLoMin === 0) throw new Error('Departure and arrival positions are identical');
  const course = ((Math.atan2(dLoMin, dmp) / DEG) % 360 + 360) % 360;
  const parallel = Math.abs(dmp) < 1e-9 || Math.abs(dLatMin) < 1e-9;
  const departure = parallel ? dLoMin * Math.cos(((i.lat1 + i.lat2) / 2) * DEG) : dLoMin * (dLatMin / dmp);
  const distance = Math.hypot(dLatMin, departure);
  const gc = greatCircleNmi(i.lat1, i.lon1, i.lat2, i.lon2);
  const ns = dLatMin >= 0 ? 'N' : 'S';
  const ew = dLoMin >= 0 ? 'E' : 'W';
  const quad = Math.abs(Math.atan2(Math.abs(dLoMin), Math.abs(dmp)) / DEG);

  const warnings = [];
  if (Math.abs(i.lat1) > 80 || Math.abs(i.lat2) > 80) warnings.push('Latitude above 80°: meridional parts grow fast and the rhumb line becomes a long spiral; use great-circle or composite sailing.');
  if (distance > 600 && gc < distance * 0.995) warnings.push(`The great circle is ${(distance - gc).toFixed(1)} nmi shorter: consider great-circle or composite sailing for this leg.`);
  if (Math.abs(dLoDeg) > 90) warnings.push('Longitude difference above 90°: a single rhumb line is far from the shortest route; the great-circle comparison matters.');
  warnings.push('Distance on the 1′ = 1 nmi convention (±0.5 % against the true ellipsoidal meridian); the course is exact for the figure chosen.');
  warnings.push('Geographic positions only: no current, leeway or compass error (course-to-steer calculator).');

  return {
    outputs: {
      dlat_min: dLatMin,
      dlo_min: dLoMin,
      mp1,
      mp2,
      dmp,
      course_deg: course,
      course_quadrantal: `${ns} ${quad.toFixed(2)}° ${ew}`,
      departure_nmi: departure,
      distance_nmi: distance,
      great_circle_nmi: gc,
      great_circle_saving_pct: ((distance - gc) / distance) * 100,
      passage_time_h: distance / i.speed_kn,
      summary: `Course ${course.toFixed(1).padStart(5, '0')}° true, ${distance.toFixed(1)} nmi (great circle ${gc.toFixed(1)} nmi), ${(distance / i.speed_kn).toFixed(1)} h at ${i.speed_kn} kn`,
    },
    warnings,
  };
}
