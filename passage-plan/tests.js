/**
 * passage-plan/tests.js — coordinate parsing, rhumb-line and great-circle legs, and the timing of the passage.
 * Run: node run-tests.js passage-plan
 */
import { calculate, parseCoordinate, parseWaypoints, rhumbLeg, greatCircleLeg } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const DEG = Math.PI / 180;
const R = 10800 / Math.PI;

export const tests = [
  {
    name: 'Coordinates: 37 55.5 N = 37.925°, 023°35.0′E = 23.5833°, 37 55 30 N = 37.925°, −12.5 and 12 30.0 S = −12.5°, 74 00.0 W = −74°; a decimal comma is accepted',
    source: 'Degrees, decimal minutes and seconds notation (Bowditch); ECDIS route table formats',
    run: () => {
      assertClose(parseCoordinate('37 55.5 N', 'lat'), 37.925, { rel: 1e-12 }, 'deg min N');
      assertClose(parseCoordinate('023°35.0′E', 'lon'), 23 + 35 / 60, { rel: 1e-12 }, 'symbols');
      assertClose(parseCoordinate('37 55 30 N', 'lat'), 37.925, { rel: 1e-12 }, 'seconds');
      assertClose(parseCoordinate('-12.5', 'lat'), -12.5, { rel: 1e-12 }, 'signed');
      assertClose(parseCoordinate('12 30.0 S', 'lat'), -12.5, { rel: 1e-12 }, 'south');
      assertClose(parseCoordinate('74 00.0 W', 'lon'), -74, { rel: 1e-12 }, 'west');
      assertClose(parseCoordinate('37,925', 'lat'), 37.925, { rel: 1e-12 }, 'decimal comma');
      assertThrows(() => parseCoordinate('37 61.0 N', 'lat'), 'below 60', 'minutes');
      assertThrows(() => parseCoordinate('23 35 E', 'lat'), 'expected a latitude', 'wrong hemisphere');
    },
  },
  {
    name: 'Basic legs: 0° to 1° N on a meridian is 60 nmi on 000°; one degree of longitude on the equator is 60 nmi on 090° by both sailings; at 60° N one degree of longitude is 60 cos 60° = 30 nmi by rhumb line',
    source: 'One minute of latitude = one nautical mile; departure = d.long × cos lat (parallel sailing)',
    run: () => {
      const north = rhumbLeg(0, 0, 1, 0);
      assertClose(north.distance, 60, { rel: 1e-12 }, 'meridian');
      assertClose(north.course, 0, { abs: 1e-9 }, 'north');
      for (const leg of [rhumbLeg(0, 0, 0, 1), greatCircleLeg(0, 0, 0, 1)]) {
        assertClose(leg.distance, 60, { rel: 1e-12 }, 'equator');
        assertClose(leg.course, 90, { abs: 1e-9 }, 'east');
      }
      assertClose(rhumbLeg(60, 10, 60, 11).distance, 30, { rel: 1e-9 }, 'parallel at 60°');
    },
  },
  {
    name: 'Long leg 40.7° N 74.0° W to 51.5° N 0.1° W: the great circle equals the haversine distance on R = 10 800/π nmi and is shorter than the rhumb line, which equals Δφ/cos(course) × R',
    source: 'Bowditch: great-circle sailing and Mercator sailing',
    run: () => {
      const gc = greatCircleLeg(40.7, -74, 51.5, -0.1);
      const p1 = 40.7 * DEG;
      const p2 = 51.5 * DEG;
      const dl = 73.9 * DEG;
      const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
      assertClose(gc.distance, 2 * R * Math.asin(Math.sqrt(h)), { rel: 1e-12 }, 'haversine');
      const rl = rhumbLeg(40.7, -74, 51.5, -0.1);
      assertEqual(gc.distance < rl.distance, true, 'great circle is shorter');
      assertClose(rl.distance, ((p2 - p1) / Math.cos(rl.course * DEG)) * R, { rel: 1e-9 }, 'rhumb distance');
      assertEqual(gc.course < rl.course, true, 'great circle starts further north');
    },
  },
  {
    name: 'Timing: two legs of 60 nmi at 12 and 10 kn take 5 h and 6 h; leaving at 20:00 the arrival is Day 2 07:00 and the average speed 120/11 kn',
    source: 'Time = distance / speed; clock arithmetic across midnight',
    run: () => {
      const route = 'A; 0 00.0 N; 0 00.0 E; 12\nB; 1 00.0 N; 0 00.0 E; 10\nC; 2 00.0 N; 0 00.0 E';
      const { outputs } = calculate({ waypoints: route, departure_h: 20 });
      assertEqual(outputs.legs.rows.length, 2, 'two legs');
      assertClose(outputs.legs.rows[0][6], 5, { rel: 1e-12 }, 'first leg time');
      assertClose(outputs.legs.rows[1][6], 6, { rel: 1e-12 }, 'second leg time');
      assertEqual(outputs.legs.rows[1][7], 'Day 2 07:00', 'ETA');
      assertClose(outputs.average_speed_kn, 120 / 11, { rel: 1e-12 }, 'average');
      assertClose(outputs.total_distance_nmi, 120, { rel: 1e-12 }, 'total');
    },
  },
  {
    name: 'Default speed and the date line: a leg without a speed uses the default; a leg from 179° E to 179° W is 2° of longitude the short way',
    source: 'Waypoint format of this calculator; longitude difference reduced to ±180°',
    run: () => {
      const { outputs } = calculate({ waypoints: 'A; 0 N; 179 E\nB; 0 N; 179 W', default_speed_kn: 10 });
      assertClose(outputs.total_distance_nmi, 120, { rel: 1e-9 }, 'across the date line');
      assertClose(outputs.legs.rows[0][5], 10, { rel: 1e-12 }, 'default speed');
      assertClose(outputs.legs.rows[0][3], 90, { abs: 1e-9 }, 'eastbound');
    },
  },
  {
    name: 'Invalid inputs fail fast with the line number: a missing longitude, an unreadable latitude, a zero speed, a single waypoint',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => parseWaypoints('A; 10 N'), 'Line 1', 'missing longitude');
      assertThrows(() => parseWaypoints('# c\nA; 10 N; 20 E\nB; ten N; 20 E'), 'Line 3', 'unreadable');
      assertThrows(() => parseWaypoints('A; 10 N; 20 E; 0'), 'greater than zero', 'speed');
      assertThrows(() => calculate({ waypoints: 'A; 10 N; 20 E' }), 'at least two waypoints', 'single');
    },
  },
];
