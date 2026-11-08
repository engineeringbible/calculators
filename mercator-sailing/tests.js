/**
 * mercator-sailing/tests.js — checks of meridional parts, the sailing formulas and the production rhumb-line pins.
 * Run: node run-tests.js mercator-sailing
 */
import { calculate, meridionalParts, greatCircleNmi, E2_WGS84 } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const PIRAEUS_PORT_SAID = { lat1: 37.9375, lon1: 23.6375, lat2: 31.25, lon2: 32.3, figure: 'sphere', speed_kn: 12 };
const PROD_RADIUS_RATIO = 3440.065 / (10800 / Math.PI);

export const tests = [
  {
    name: 'Meridional parts: sphere MP(45°) = 7915.7045 log₁₀ tan 67.5° = 3 029.94′; WGS84 MP(45°) = 3 013.65′ (Bowditch Table 6 form, 23.0134 sin φ leading correction); MP(0) = 0',
    source: 'Bowditch ch. 12 and Table 6; WGS84 e² 0.00669438',
    run: () => {
      assertClose(meridionalParts(45, 0), 7915.7045 * Math.log10(Math.tan(67.5 * Math.PI / 180)), { rel: 1e-7 }, 'sphere formula');
      assertClose(meridionalParts(45, 0), 3029.94, { abs: 0.01 }, 'sphere value');
      const s = Math.sin(45 * Math.PI / 180);
      const corr = (10800 / Math.PI) * (E2_WGS84 * s + (E2_WGS84 ** 2 * s ** 3) / 3 + (E2_WGS84 ** 3 * s ** 5) / 5);
      assertClose(meridionalParts(45, E2_WGS84), meridionalParts(45, 0) - corr, { rel: 1e-12 }, 'ellipsoid formula');
      assertClose((10800 / Math.PI) * E2_WGS84, 23.0134, { abs: 1e-3 }, '23.0134 constant');
      assertClose(meridionalParts(45, E2_WGS84), 3013.65, { abs: 0.02 }, 'WGS84 value');
      assertClose(meridionalParts(0, E2_WGS84), 0, { abs: 1e-9 }, 'equator');
    },
  },
  {
    name: 'Production pins (sphere): Piraeus → Port Said course 133.194° exactly as atlas_physics rhumb_course_deg; distance 586.2 nmi × 1.000674 = 586.62 nmi (production radius 3 440.065); New York → Lizard 78.374°, 2 979.33 nmi',
    source: 'atlas_physics.navigation rhumb_distance_nm / rhumb_course_deg (pins computed 2026-10-31); radius ratio 3440.065 / (10800/π)',
    run: () => {
      const pp = calculate(PIRAEUS_PORT_SAID).outputs;
      assertClose(pp.course_deg, 133.1936, { abs: 1e-3 }, 'course');
      assertClose(pp.distance_nmi * PROD_RADIUS_RATIO, 586.6186, { rel: 1e-5 }, 'distance vs production');
      const ny = calculate({ ...PIRAEUS_PORT_SAID, lat1: 40, lon1: -74, lat2: 50, lon2: -5 }).outputs;
      assertClose(ny.course_deg, 78.3739, { abs: 1e-3 }, 'NY course');
      assertClose(ny.distance_nmi * PROD_RADIUS_RATIO, 2979.3282, { rel: 1e-5 }, 'NY distance');
    },
  },
  {
    name: 'Special sailings: a 10° parallel leg at 10° N gives course 090° and 600′ cos 10° = 590.88 nmi (production 591.28 = × 1.000674); a 10° meridian leg gives 000° and exactly 600 nmi; a west-going leg gives a course in the 270° quadrant',
    source: 'Parallel and meridian sailing (Bowditch ch. 12)',
    run: () => {
      const par = calculate({ ...PIRAEUS_PORT_SAID, lat1: 10, lon1: 10, lat2: 10, lon2: 20 }).outputs;
      assertClose(par.course_deg, 90, { abs: 1e-9 }, 'parallel course');
      assertClose(par.distance_nmi, 600 * Math.cos(10 * Math.PI / 180), { rel: 1e-12 }, 'parallel distance');
      assertClose(par.distance_nmi * PROD_RADIUS_RATIO, 591.2831, { rel: 1e-5 }, 'vs production');
      const mer = calculate({ ...PIRAEUS_PORT_SAID, lat1: 60, lon1: 0, lat2: 70, lon2: 0 }).outputs;
      assertClose(mer.course_deg, 0, { abs: 1e-9 }, 'meridian course');
      assertClose(mer.distance_nmi, 600, { rel: 1e-12 }, 'meridian distance');
      assertClose(mer.distance_nmi * PROD_RADIUS_RATIO, 600.4046, { rel: 1e-5 }, 'vs production');
      const west = calculate({ ...PIRAEUS_PORT_SAID, lat1: 50, lon1: -5, lat2: 40, lon2: -74 }).outputs;
      assertClose(west.course_deg, 180 + 78.3739, { abs: 1e-3 }, 'reverse course');
      assertEqual(west.course_quadrantal.startsWith('S') && west.course_quadrantal.endsWith('W'), true, 'quadrantal');
    },
  },
  {
    name: 'WGS84 versus sphere: the Piraeus course changes by 0.13° and the great-circle comparison (haversine) is shorter than the rhumb line; dateline crossing (170° E → −170° E) takes the 20° short way',
    source: 'Ellipsoidal meridional parts; haversine great circle; longitude wrap',
    run: () => {
      const sph = calculate(PIRAEUS_PORT_SAID).outputs;
      const ell = calculate({ ...PIRAEUS_PORT_SAID, figure: 'wgs84' }).outputs;
      assertClose(Math.abs(ell.course_deg - sph.course_deg), 0.13, { abs: 0.02 }, 'course shift');
      assertEqual(sph.great_circle_nmi <= sph.distance_nmi + 1e-9, true, 'GC ≤ rhumb');
      assertClose(sph.great_circle_nmi, greatCircleNmi(37.9375, 23.6375, 31.25, 32.3), { rel: 1e-12 }, 'GC helper');
      const ny = calculate({ ...PIRAEUS_PORT_SAID, lat1: 40, lon1: -74, lat2: 50, lon2: -5 }).outputs;
      assertEqual(ny.great_circle_saving_pct > 1 && ny.great_circle_saving_pct < 5, true, 'Atlantic saving a few per cent');
      const dl = calculate({ ...PIRAEUS_PORT_SAID, lat1: 0, lon1: 170, lat2: 0, lon2: -170 }).outputs;
      assertClose(dl.dlo_min, 20 * 60, { rel: 1e-12 }, 'short way');
      assertClose(dl.distance_nmi, 1200, { rel: 1e-12 }, 'equator 20°');
    },
  },
  {
    name: 'Passage time and validation: 586.2 nmi at 12 kn = 48.9 h; identical positions, a latitude of 90° and an unknown figure are rejected',
    source: 'Arithmetic; validation contract',
    run: () => {
      const pp = calculate(PIRAEUS_PORT_SAID).outputs;
      assertClose(pp.passage_time_h, pp.distance_nmi / 12, { rel: 1e-12 }, 'time');
      assertThrows(() => calculate({ ...PIRAEUS_PORT_SAID, lat2: 37.9375, lon2: 23.6375 }), 'identical', 'same point');
      assertThrows(() => calculate({ ...PIRAEUS_PORT_SAID, lat2: 90 }), 'between', 'pole');
      assertThrows(() => calculate({ ...PIRAEUS_PORT_SAID, figure: 'flat' }), 'must be one of', 'figure');
    },
  },
];
