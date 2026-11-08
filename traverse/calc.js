/**
 * traverse/calc.js — closed (loop) traverse from bearings or azimuths and distances: latitudes and departures, the
 * misclosure, the precision ratio, the Bowditch (compass rule) adjustment, adjusted coordinates and the enclosed area.
 *
 * Latitude = L cos Az, departure = L sin Az (Az from north, clockwise). Misclosure e = √(ΣLat² + ΣDep²),
 * precision 1 : (ΣL / e). Compass rule: C_lat,i = −ΣLat × L_i / ΣL, C_dep,i = −ΣDep × L_i / ΣL
 * (Ghilani & Wolf, Elementary Surveying, ch. 10). Area of the adjusted polygon by the coordinate (shoelace) formula.
 * Schema units: distances and coordinates are in whatever unit the legs are entered in (dimensionless here).
 */
import { withDefaults, assertFinite, assertRange } from '../shared/validate.js';

const DEFAULT_LEGS = [
  'N26°08\'E; 285.43',
  'S75°30\'10"E; 582.10',
  'S23°30\'20"W; 442.05',
  'N60°06\'20"W; 591.62',
].join('\n');

/** Parse "45°30'15"", "45 30 15", "45-30-15", "45.5" into decimal degrees; null when it is not an angle. */
function parseAngle(text) {
  const t = text.trim();
  if (!/^[\d.\s°º˚'’′"”″dDmMsS:-]+$/.test(t)) return null;
  const parts = t.match(/\d+(?:\.\d+)?/g);
  if (!parts || parts.length > 3) return null;
  if (parts.slice(0, -1).some((p) => p.includes('.'))) return null;
  const [d, m = 0, s = 0] = parts.map(Number);
  if (m >= 60 || s >= 60) return null;
  return d + m / 60 + s / 3600;
}

/** A bearing such as N45°30'E or S 12 15 W, or an azimuth from north such as 135.5 or 135°30'; returns the azimuth, degrees. */
export function parseDirection(text) {
  const t = String(text).trim().toUpperCase();
  const q = t.match(/^([NS])\s*(.+?)\s*([EW])$/);
  if (q) {
    const a = parseAngle(q[2]);
    if (a === null || a > 90) return null;
    if (q[1] === 'N') return q[3] === 'E' ? a : (360 - a) % 360;
    return q[3] === 'E' ? 180 - a : 180 + a;
  }
  const a = parseAngle(t);
  if (a === null || a >= 360) return null;
  return a;
}

/** Azimuth as a quadrant bearing text: 104.5 → S 75°30′00″ E. */
export function bearingText(az) {
  let quad; let a;
  if (az <= 90) { quad = ['N', 'E']; a = az; } else if (az <= 180) { quad = ['S', 'E']; a = 180 - az; } else if (az <= 270) { quad = ['S', 'W']; a = az - 180; } else { quad = ['N', 'W']; a = 360 - az; }
  const s = Math.round(a * 3600);
  const d = Math.floor(s / 3600); const m = Math.floor((s - d * 3600) / 60); const sec = s - d * 3600 - m * 60;
  return `${quad[0]} ${d}°${String(m).padStart(2, '0')}′${String(sec).padStart(2, '0')}″ ${quad[1]}`;
}

/** Parse the legs: one per line, "direction; distance". */
export function parseLegs(text) {
  const legs = [];
  String(text).split(/\r?\n/).forEach((raw, k) => {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) return;
    const parts = line.split(/[;\t,]/).map((p) => p.trim()).filter((p) => p !== '');
    if (parts.length !== 2) throw new Error(`Legs, line ${k + 1}: write "bearing; distance", for example N45°30'E; 120.50 or 135.5; 120.50.`);
    const az = parseDirection(parts[0]);
    if (az === null) throw new Error(`Legs, line ${k + 1}: "${parts[0]}" is not a bearing (N 0–90° E) or an azimuth (0 to under 360°).`);
    const dist = Number(parts[1].replace(/\s/g, ''));
    if (!Number.isFinite(dist) || dist <= 0) throw new Error(`Legs, line ${k + 1}: the distance "${parts[1]}" must be a number above zero.`);
    legs.push({ az, dist });
  });
  if (legs.length < 3) throw new Error('Legs: a closed traverse needs at least three legs.');
  return legs;
}

/** Compass-rule adjustment of a closed traverse. */
export function adjustTraverse(legs, n0 = 0, e0 = 0) {
  const rad = Math.PI / 180;
  const rows = legs.map(({ az, dist }) => ({ az, dist, lat: dist * Math.cos(az * rad), dep: dist * Math.sin(az * rad) }));
  const perimeter = rows.reduce((s, r) => s + r.dist, 0);
  const eLat = rows.reduce((s, r) => s + r.lat, 0);
  const eDep = rows.reduce((s, r) => s + r.dep, 0);
  let n = n0; let e = e0;
  const points = [[n0, e0]];
  rows.forEach((r) => {
    r.cLat = (-eLat * r.dist) / perimeter;
    r.cDep = (-eDep * r.dist) / perimeter;
    r.aLat = r.lat + r.cLat;
    r.aDep = r.dep + r.cDep;
    n += r.aLat; e += r.aDep;
    r.n = n; r.e = e;
    points.push([n, e]);
  });
  // the last point is the start again; close it exactly against rounding
  rows[rows.length - 1].n = n0; rows[rows.length - 1].e = e0;
  points.pop();
  let twiceArea = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [ni, ei] = points[i]; const [nj, ej] = points[(i + 1) % points.length];
    twiceArea += ei * nj - ej * ni;
  }
  const misclosure = Math.hypot(eLat, eDep);
  return { rows, perimeter, eLat, eDep, misclosure, area: Math.abs(twiceArea) / 2 };
}

const fmt = (v, d = 3) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
const groups = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const schema = {
  id: 'traverse',
  name: 'Closed traverse calculator (compass rule)',
  category: 'civil',
  summary: 'Latitudes and departures of a closed traverse from bearings and distances, misclosure, precision ratio, Bowditch adjustment and adjusted coordinates.',
  related: ['area-coordinates', 'latlon-utm', 'slope', 'earthwork-volume'],
  assumptions: [
    'The traverse is a closed loop that returns to its starting point, and the directions are already balanced so the angular misclosure has been distributed.',
    'The compass (Bowditch) rule spreads the misclosure in proportion to leg length. It suits traverses where angles and distances are measured with similar precision; least squares is the rigorous alternative.',
    'Distances are horizontal and in one unit, and every output length and coordinate is in that unit. Slope distances must be reduced to horizontal first.',
    'Azimuths are measured clockwise from north. Grid, true or magnetic north may be used, but all legs must share the same reference.',
    'The area is that of the adjusted polygon by the coordinate method, in the square of the distance unit. It assumes the legs do not cross.',
  ],
  notes: [
    'Verification 2026-11-08: the default four-leg traverse (285.43, 582.10, 442.05 and 591.62 ft, total 1 901.20 ft) has latitude misclosure 0.028, departure misclosure 0.078, linear misclosure 0.083 ft, precision 1 : 22 818 and adjusted area 211 322 ft². The compass rule sums of corrections equal the misclosures exactly. Checked by hand.',
  ],
  sources: [
    'Ghilani, C.D. and Wolf, P.R., Elementary Surveying: An Introduction to Geomatics, 13th ed., Pearson, ch. 10 Traverse Computations (latitudes and departures, compass rule, coordinates)',
    'Ghilani, C.D., Adjustment Computations: Spatial Data Analysis, 6th ed., Wiley, 2017 (least squares adjustment of traverses, the rigorous alternative)',
  ],
  inputs: [
    { id: 'legs', label: 'Legs (one per line: bearing or azimuth; horizontal distance)', type: 'textarea', rows: 8, default: DEFAULT_LEGS, help: 'Bearings like N45°30\'E or N 45 30 00 E; azimuths from north like 135.5 or 135°30\'. Go round the loop in order.' },
    { id: 'start_n', label: 'Northing of the starting point (distance units)', group: 'dimensionless', unit: 'none', default: 5000, min: -1e8, max: 1e8 },
    { id: 'start_e', label: 'Easting of the starting point (distance units)', group: 'dimensionless', unit: 'none', default: 5000, min: -1e8, max: 1e8 },
    { id: 'required_ratio', label: 'Required precision 1 : N (N)', group: 'dimensionless', unit: 'none', default: 10000, min: 100, max: 1e7, help: 'The closure your survey standard or contract requires; a worse closure gives a warning.' },
  ],
  outputs: [
    { id: 'perimeter', label: 'Total length of the traverse (distance units)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'error_lat', label: 'Misclosure in latitude ΣLat', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'error_dep', label: 'Misclosure in departure ΣDep', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'misclosure', label: 'Linear misclosure', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'misclosure_dir', label: 'Direction of the misclosure', type: 'text' },
    { id: 'precision_n', label: 'Precision ratio N (1 : N)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'precision_text', label: 'Precision', type: 'text' },
    { id: 'area', label: 'Area of the adjusted traverse (square distance units)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'table', label: 'Latitudes, departures, compass rule corrections and adjusted coordinates', type: 'table' },
  ],
  example: {
    inputs: {},
    results: { perimeter: '1 901.20', misclosure: '0.083', precision_n: '22 818', area: '211 322' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const n0 = assertFinite(x.start_n, 'start_n', 'Northing of the starting point');
  const e0 = assertFinite(x.start_e, 'start_e', 'Easting of the starting point');
  const required = assertRange(x.required_ratio, 100, 1e7, 'required_ratio', 'Required precision');
  const legs = parseLegs(x.legs);
  const t = adjustTraverse(legs, n0, e0);
  const warnings = [];
  const ratio = t.misclosure > 0 ? t.perimeter / t.misclosure : null;
  if (t.misclosure > 0.01 * t.perimeter) throw new Error(`Legs: the traverse misses closing by ${t.misclosure.toFixed(2)}, more than 1 % of its length; a leg is probably missing, reversed or mistyped.`);
  if (ratio !== null && ratio < required) warnings.push(`The precision 1 : ${groups(ratio)} is worse than the required 1 : ${groups(required)}; check the field work before adjusting.`);
  const dirAz = ((Math.atan2(t.eDep, t.eLat) * 180) / Math.PI + 360) % 360;
  const rows = t.rows.map((r, i) => [
    `${i + 1}–${i + 2 > t.rows.length ? 1 : i + 2}`, bearingText(r.az), fmt(r.dist), fmt(r.lat), fmt(r.dep), fmt(r.cLat), fmt(r.cDep), fmt(r.aLat), fmt(r.aDep),
    String(i + 2 > t.rows.length ? 1 : i + 2), fmt(r.n), fmt(r.e),
  ]);
  return {
    outputs: {
      perimeter: t.perimeter,
      error_lat: t.eLat,
      error_dep: t.eDep,
      misclosure: t.misclosure,
      misclosure_dir: t.misclosure > 0 ? `${bearingText(dirAz)} (from the start point to where the unadjusted traverse ends)` : 'None: the traverse closes exactly',
      precision_n: ratio,
      precision_text: ratio === null ? 'Exact closure' : `1 : ${groups(ratio)}`,
      area: t.area,
      table: { columns: ['Leg', 'Bearing', 'Distance', 'Latitude', 'Departure', 'Corr. lat.', 'Corr. dep.', 'Adj. lat.', 'Adj. dep.', 'Point', 'Northing', 'Easting'], rows },
    },
    warnings,
  };
}
