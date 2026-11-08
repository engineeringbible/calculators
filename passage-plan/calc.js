/**
 * passage-plan/calc.js — a passage from a pasted list of waypoints: course and distance of every leg by rhumb line
 * (Mercator sailing) or great circle, time at the leg speed, ETA at every waypoint from the departure time, and the
 * totals; the distance by the other method is given for comparison.
 *
 * Rhumb line: Δψ = ln[tan(π/4 + φ₂/2)/tan(π/4 + φ₁/2)], q = Δφ/Δψ (cos φ on an east–west leg),
 *             d = R √(Δφ² + q²Δλ²), course = atan2(Δλ, Δψ)
 * Great circle: d = 2R asin √(sin²(Δφ/2) + cos φ₁ cos φ₂ sin²(Δλ/2)),
 *             initial course = atan2(sin Δλ cos φ₂, cos φ₁ sin φ₂ − sin φ₁ cos φ₂ cos Δλ)
 * R = 10 800/π nmi (one minute of arc of a great circle = one nautical mile).
 * Schema units: degrees, nautical miles, knots, hours.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

const DEG = Math.PI / 180;
/** Sphere on which one minute of arc is one nautical mile. */
const EARTH_RADIUS_NMI = 10800 / Math.PI;
const MAX_WAYPOINTS = 500;

const norm360 = (deg) => ((deg % 360) + 360) % 360;
const wrapPi = (rad) => {
  let a = rad;
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a <= -Math.PI) a += 2 * Math.PI;
  return a;
};

const DEFAULT_ROUTE = [
  '# name; latitude; longitude; speed for the leg that starts here (kn, optional)',
  'Piraeus pilot station; 37 55.5 N; 023 35.0 E; 12',
  'Cape Sounion; 37 36.0 N; 024 02.0 E; 14',
  'Kafireas Strait; 38 05.0 N; 024 40.0 E; 14',
  'South of Lemnos; 39 40.0 N; 025 15.0 E; 14',
  'Dardanelles entrance; 40 00.0 N; 026 08.0 E',
].join('\n');

export const schema = {
  id: 'passage-plan',
  name: 'Passage plan from waypoints',
  category: 'maritime',
  summary: 'Leg courses, distances, times and ETAs from a pasted waypoint list, by rhumb line or great circle, with the passage totals.',
  related: ['mercator-sailing', 'great-circle-distance', 'fuel-voyage-cost', 'course-to-steer'],
  sendTo: [
    {
      target: 'fuel-voyage-cost',
      label: 'Fuel and cost for this passage',
      note: 'Total distance and the average speed of the passage; port time and consumption are entered there.',
      links: [
        { to: 'distance_nmi', from: 'total_distance_nmi' },
        { to: 'speed_kn', from: 'average_speed_kn' },
      ],
    },
  ],
  assumptions: [
    'The earth is a sphere on which one minute of great-circle arc is one nautical mile (R = 10 800/π nmi), the usual basis of passage planning; on the WGS-84 ellipsoid rhumb-line distances differ by up to about 0.5 % with latitude (the Mercator sailing calculator gives the ellipsoidal values for a single leg).',
    'Each leg is sailed either on a rhumb line at constant course or on a great circle starting on the initial course shown; a great-circle leg changes course continuously and is normally steered as a series of rhumb lines.',
    'Waypoint lines are "name; latitude; longitude; speed" separated by semicolons or tabs; coordinates may be decimal degrees with a sign (south and west negative) or degrees and minutes, with optional seconds, followed or preceded by N, S, E or W; the speed on a line applies to the leg that starts at that waypoint, otherwise the default speed; lines starting with # are comments.',
    'Times are at the speed over the ground entered for each leg, without allowance for current, weather, traffic or manoeuvring; ETAs count from the departure time on day 1 in a single time zone.',
    'Legs that cross the 180° meridian are handled by taking the shorter way round in longitude.',
  ],
  notes: [
    'Verification 2026-10-31: a leg from 0° to 1° N along a meridian is 60 nmi on 000°; one degree of longitude along the equator is 60 nmi on 090°, and at 60° N a parallel leg of one degree is 30 nmi; a great-circle leg from 40.7° N 74.0° W to 51.5° N 0.1° W is shorter than the rhumb line, as it must be.',
    'Design decision: the coordinate parser accepts the forms in which waypoints are copied from ECDIS route tables and pilot books, and reports the line number of anything it cannot read instead of guessing.',
  ],
  sources: [
    'The American Practical Navigator (Bowditch), NGA Pub. 9 — Mercator and great-circle sailing',
    'IMO Resolution A.893(21) Guidelines for voyage planning',
    'IHO S-421 Route Plan Based on S-100 / IEC 61174 (RTZ) — waypoint and leg conventions of ECDIS routes',
  ],
  inputs: [
    { id: 'waypoints', label: 'Waypoints (one per line: name; latitude; longitude; speed)', type: 'textarea', rows: 9, default: DEFAULT_ROUTE, help: 'Latitude and longitude as 37 55.5 N, 37°55.5′N, 37 55 30 N or 37.925; speed in knots for the leg that starts at the waypoint.' },
    {
      id: 'method',
      label: 'Sailing',
      type: 'select',
      default: 'rhumb',
      options: [
        { value: 'rhumb', label: 'Rhumb line (constant course)' },
        { value: 'gc', label: 'Great circle (initial course)' },
      ],
    },
    { id: 'default_speed_kn', label: 'Speed for legs without a speed', group: 'speed', unit: 'kn', default: 13, min: 0.1, max: 60 },
    { id: 'departure_h', label: 'Departure time on day 1 (hours after midnight)', group: 'time', unit: 'h', default: 6, min: 0, max: 24 },
  ],
  outputs: [
    { id: 'legs', label: 'Legs', type: 'table' },
    { id: 'legs_count', label: 'Number of legs', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'total_distance_nmi', label: 'Total distance', group: 'length', unit: 'nmi' },
    { id: 'other_distance_nmi', label: 'Total distance by the other sailing', group: 'length', unit: 'nmi' },
    { id: 'total_time_h', label: 'Total time on passage', group: 'time', unit: 'h' },
    { id: 'average_speed_kn', label: 'Average speed', group: 'speed', unit: 'kn' },
    { id: 'eta_text', label: 'Arrival', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      total_distance_nmi: '214.8 nmi',
      other_distance_nmi: '214.8 nmi',
      total_time_h: '15.7 h',
      average_speed_kn: '14 kn',
    },
  },
};

/** Parse a latitude or longitude written as signed decimal degrees or degrees, minutes (and seconds) with N/S/E/W. */
export function parseCoordinate(text, kind) {
  const raw = String(text).trim().toUpperCase();
  if (!raw) throw new Error(`empty ${kind === 'lat' ? 'latitude' : 'longitude'}`);
  const hemispheres = raw.match(/[NSEW]/g) || [];
  if (hemispheres.length > 1) throw new Error(`"${text}" has more than one hemisphere letter`);
  const hemisphere = hemispheres[0] || null;
  if (hemisphere && kind === 'lat' && 'EW'.includes(hemisphere)) throw new Error(`"${text}" is a longitude, expected a latitude (N or S)`);
  if (hemisphere && kind === 'lon' && 'NS'.includes(hemisphere)) throw new Error(`"${text}" is a latitude, expected a longitude (E or W)`);
  const negative = /^\s*-/.test(raw);
  const numbers = (raw.match(/\d+(?:[.,]\d+)?/g) || []).map((s) => Number(s.replace(',', '.')));
  if (!numbers.length || numbers.length > 3) throw new Error(`cannot read "${text}"`);
  const [d, m = 0, s = 0] = numbers;
  if (numbers.length > 1 && !Number.isInteger(d)) throw new Error(`"${text}": degrees must be whole when minutes follow`);
  if (m >= 60 || s >= 60) throw new Error(`"${text}": minutes and seconds must be below 60`);
  let value = d + m / 60 + s / 3600;
  if (negative || hemisphere === 'S' || hemisphere === 'W') value = -value;
  if (negative && (hemisphere === 'S' || hemisphere === 'W')) throw new Error(`"${text}": use either a minus sign or S/W, not both`);
  const limit = kind === 'lat' ? 90 : 180;
  if (Math.abs(value) > limit) throw new Error(`"${text}" is outside ±${limit}°`);
  return value;
}

/** Parse the waypoint list: [{ name, lat, lon, speed|null, line }]. */
export function parseWaypoints(text) {
  const points = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const fields = clean.split(/;|\t/).map((f) => f.trim());
    const where = `Line ${index + 1}`;
    if (fields.length < 3) throw new Error(`${where}: expected name; latitude; longitude[; speed]`);
    let lat;
    let lon;
    try {
      lat = parseCoordinate(fields[1], 'lat');
      lon = parseCoordinate(fields[2], 'lon');
    } catch (error) {
      throw new Error(`${where}: ${error.message}`);
    }
    let speed = null;
    if (fields[3] !== undefined && fields[3] !== '') {
      speed = Number(fields[3].replace(',', '.'));
      if (!Number.isFinite(speed) || speed <= 0) throw new Error(`${where}: speed "${fields[3]}" must be a number greater than zero`);
    }
    points.push({ name: fields[0] || `WP ${points.length + 1}`, lat, lon, speed, line: index + 1 });
  });
  if (points.length > MAX_WAYPOINTS) throw new Error(`At most ${MAX_WAYPOINTS} waypoints`);
  return points;
}

/** Rhumb-line course (°) and distance (nmi) between two points on the sphere. */
export function rhumbLeg(lat1, lon1, lat2, lon2) {
  const p1 = lat1 * DEG;
  const p2 = lat2 * DEG;
  const dPhi = p2 - p1;
  const dLambda = wrapPi((lon2 - lon1) * DEG);
  const dPsi = Math.log(Math.tan(Math.PI / 4 + p2 / 2) / Math.tan(Math.PI / 4 + p1 / 2));
  const q = Math.abs(dPsi) > 1e-12 ? dPhi / dPsi : Math.cos(p1);
  const distance = EARTH_RADIUS_NMI * Math.sqrt(dPhi * dPhi + q * q * dLambda * dLambda);
  const course = distance < 1e-12 ? 0 : norm360(Math.atan2(dLambda, dPsi) / DEG);
  return { course, distance };
}

/** Great-circle initial course (°) and distance (nmi) between two points on the sphere. */
export function greatCircleLeg(lat1, lon1, lat2, lon2) {
  const p1 = lat1 * DEG;
  const p2 = lat2 * DEG;
  const dLambda = wrapPi((lon2 - lon1) * DEG);
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLambda / 2) ** 2;
  const distance = 2 * EARTH_RADIUS_NMI * Math.asin(Math.min(1, Math.sqrt(h)));
  const course = distance < 1e-12 ? 0 : norm360(Math.atan2(Math.sin(dLambda) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLambda)) / DEG);
  return { course, distance };
}

function clockText(hours) {
  const totalMinutes = Math.round(hours * 60);
  const day = Math.floor(totalMinutes / 1440) + 1;
  const minutesOfDay = totalMinutes % 1440;
  const hh = String(Math.floor(minutesOfDay / 60)).padStart(2, '0');
  const mm = String(minutesOfDay % 60).padStart(2, '0');
  return `Day ${day} ${hh}:${mm}`;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.method, ['rhumb', 'gc'], 'method', 'Sailing');
  assertPositive(i.default_speed_kn, 'default_speed_kn', 'Default speed');
  assertRange(i.departure_h, 0, 24, 'departure_h', 'Departure time');
  const points = parseWaypoints(i.waypoints);
  if (points.length < 2) throw new Error('Enter at least two waypoints');

  const legOf = i.method === 'rhumb' ? rhumbLeg : greatCircleLeg;
  const otherOf = i.method === 'rhumb' ? greatCircleLeg : rhumbLeg;
  const rows = [];
  let distance = 0;
  let other = 0;
  let hours = 0;
  const warnings = [];
  for (let k = 0; k < points.length - 1; k += 1) {
    const a = points[k];
    const b = points[k + 1];
    const leg = legOf(a.lat, a.lon, b.lat, b.lon);
    const speed = a.speed ?? i.default_speed_kn;
    const time = leg.distance / speed;
    distance += leg.distance;
    other += otherOf(a.lat, a.lon, b.lat, b.lon).distance;
    hours += time;
    if (leg.distance < 0.01) warnings.push(`Leg ${k + 1} (${a.name} to ${b.name}) has no length: duplicate waypoint.`);
    if (Math.abs(wrapPi((b.lon - a.lon) * DEG)) > Math.PI / 2) warnings.push(`Leg ${k + 1} spans more than 90° of longitude: split it into shorter legs for planning.`);
    rows.push([k + 1, a.name, b.name, leg.course, leg.distance, speed, time, clockText(i.departure_h + hours)]);
  }
  if (Math.max(...points.map((p) => Math.abs(p.lat))) > 70) warnings.push('Waypoints above 70° latitude: rhumb lines become long spirals near the poles; plan high-latitude legs as great circles.');
  warnings.push('Planning figures: times use the entered speeds over the ground without current, weather or traffic allowances.');

  return {
    outputs: {
      legs: {
        columns: ['Leg', 'From', 'To', i.method === 'rhumb' ? 'Course (°)' : 'Initial course (°)', 'Distance (nmi)', 'Speed (kn)', 'Time (h)', 'ETA'],
        rows,
      },
      legs_count: rows.length,
      total_distance_nmi: distance,
      other_distance_nmi: other,
      total_time_h: hours,
      average_speed_kn: distance / hours,
      eta_text: `Depart ${clockText(i.departure_h)}, arrive ${points[points.length - 1].name} ${clockText(i.departure_h + hours)} after ${hours.toFixed(1)} h (${(hours / 24).toFixed(2)} days); ${distance.toFixed(1)} nmi by ${i.method === 'rhumb' ? 'rhumb line' : 'great circle'}, ${other.toFixed(1)} nmi by ${i.method === 'rhumb' ? 'great circle' : 'rhumb line'}.`,
    },
    warnings,
  };
}
