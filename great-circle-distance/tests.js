/**
 * great-circle-distance/tests.js — checks against exact spherical cases, Bowditch sailings and the Vincenty reference line.
 * Run: node run-tests.js great-circle-distance
 */
import { calculate, greatCircle, rhumbLine, vincentyInverse, greatCircleVertex, normalizeLongitudeDeg, EARTH_MODELS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const R_NAUTICAL = EARTH_MODELS.nautical.radiusM;

export const tests = [
  {
    name: 'Along the equator from 0°E to 90°E: 90° of arc = 5 400 nmi on the nautical sphere, course 090° both ways of sailing; 5 403.6 nmi with the IUGG radius',
    source: 'Definition of the nautical sphere (1′ = 1 nmi, Bowditch ch. 24); IUGG mean radius 6 371.0088 km × π/2 = 10 007.5 km',
    run: () => {
      const nautical = calculate({ lat1_deg: 0, lon1_deg: 0, lat2_deg: 0, lon2_deg: 90, earth_model: 'nautical' }).outputs;
      assertClose(nautical.gc_distance_nmi, 5400, { rel: 1e-9 }, 'GC nautical');
      assertClose(nautical.rl_distance_nmi, 5400, { rel: 1e-9 }, 'RL nautical');
      assertClose(nautical.gc_initial_course_deg, 90, { abs: 1e-9 }, 'initial course');
      assertClose(nautical.rl_course_deg, 90, { abs: 1e-9 }, 'rhumb course');
      assertEqual(nautical.vertex_on_track, 'The great circle is the equator (no vertex)', 'equator vertex text');
      const mean = calculate({ lat1_deg: 0, lon1_deg: 0, lat2_deg: 0, lon2_deg: 90, earth_model: 'mean_radius' }).outputs;
      assertClose(mean.gc_distance_nmi, (6371008.8 * Math.PI) / 2 / 1852, { rel: 1e-9 }, 'GC mean radius');
      assertClose(mean.gc_distance_nmi, 5403.6, { abs: 0.1 }, 'GC mean radius value');
    },
  },
  {
    name: 'Parallel sailing at 60°N over 90° of longitude: rhumb line 2 700 nmi at 090°; great circle 2 484.6 nmi, initial course 049.1°, final 130.9°, vertex 67.79°N at mid-longitude',
    source: 'Bowditch ch. 24: parallel sailing p = DLo × cos L; great-circle cos D = sin L1 sin L2 + cos L1 cos L2 cos DLo = 0.75 → D = 41.41° = 2 484.6 nmi; vertex cos Lv = cos L1 sin C',
    run: () => {
      const { outputs } = calculate({ lat1_deg: 60, lon1_deg: 0, lat2_deg: 60, lon2_deg: 90, earth_model: 'nautical' });
      assertClose(outputs.rl_distance_nmi, 2700, { rel: 1e-9 }, 'RL distance');
      assertClose(outputs.rl_course_deg, 90, { abs: 1e-9 }, 'RL course');
      assertClose(outputs.gc_distance_nmi, 2484.58, { abs: 0.05 }, 'GC distance');
      assertClose(outputs.gc_initial_course_deg, 49.107, { abs: 0.01 }, 'initial course');
      assertClose(outputs.gc_final_course_deg, 130.893, { abs: 0.01 }, 'final course');
      assertClose(outputs.gc_vertex_lat_deg, 67.792, { abs: 0.01 }, 'vertex latitude');
      assertClose(outputs.gc_vertex_lon_deg, 45, { abs: 1e-6 }, 'vertex longitude (symmetry)');
      assertEqual(outputs.vertex_on_track.startsWith('Yes'), true, 'vertex on track');
      assertClose(outputs.midpoint_lat_deg, 67.792, { abs: 0.01 }, 'midpoint is the vertex here');
      assertClose(outputs.saving_nmi, 2700 - 2484.58, { abs: 0.05 }, 'saving');
    },
  },
  {
    name: 'Meridian sailing 10°N → 50°N on 20°E: 2 400 nmi for both sailings, course 000°; reversed track gives 180° and the same distance',
    source: 'Bowditch ch. 24: along a meridian D = Dlat in minutes',
    run: () => {
      const north = calculate({ lat1_deg: 10, lon1_deg: 20, lat2_deg: 50, lon2_deg: 20 }).outputs;
      assertClose(north.gc_distance_nmi, 2400, { rel: 1e-9 }, 'GC');
      assertClose(north.rl_distance_nmi, 2400, { rel: 1e-9 }, 'RL');
      assertClose(north.gc_initial_course_deg, 0, { abs: 1e-9 }, 'course north');
      const south = calculate({ lat1_deg: 50, lon1_deg: 20, lat2_deg: 10, lon2_deg: 20 }).outputs;
      assertClose(south.gc_initial_course_deg, 180, { abs: 1e-9 }, 'course south');
      assertClose(south.gc_distance_nmi, north.gc_distance_nmi, { rel: 1e-12 }, 'symmetric distance');
      assertEqual(north.vertex_on_track.startsWith('No'), true, 'vertex (the pole) not reached');
    },
  },
  {
    name: 'Vincenty inverse on WGS-84, Flinders Peak → Buninyong: 54 972.271 m, forward azimuth 306°52′05.37″, reverse azimuth 127°10′25.07″ (final heading 307°10′25.07″)',
    source: 'Vincenty (1975) test line as published by Geoscience Australia (Flinders Peak −37°57′03.72030″ 144°25′29.52440″; Buninyong −37°39′10.15610″ 143°55′35.38390″); the published reverse azimuth is the direction back to the start, i.e. the arrival heading minus 180°',
    run: () => {
      const lat1 = -(37 + 57 / 60 + 3.7203 / 3600);
      const lon1 = 144 + 25 / 60 + 29.5244 / 3600;
      const lat2 = -(37 + 39 / 60 + 10.1561 / 3600);
      const lon2 = 143 + 55 / 60 + 35.3839 / 3600;
      const geodesic = vincentyInverse(lat1, lon1, lat2, lon2);
      assertEqual(geodesic.converged, true, 'converged');
      assertClose(geodesic.distanceM, 54972.271, { abs: 0.002 }, 'distance');
      assertClose(geodesic.initialAzimuthDeg, 306 + 52 / 60 + 5.37 / 3600, { abs: 1e-5 }, 'initial azimuth');
      assertClose(geodesic.finalAzimuthDeg, 180 + 127 + 10 / 60 + 25.07 / 3600, { abs: 1e-5 }, 'final (arrival) azimuth = reverse azimuth + 180°');
      const sphere = greatCircle(lat1, lon1, lat2, lon2, R_NAUTICAL);
      assertClose(sphere.distanceM / geodesic.distanceM, 1, { abs: 0.006 }, 'sphere within 0.6 % of the ellipsoid');
    },
  },
  {
    name: 'Crossing the antimeridian: 170°E → 170°W on the equator is 20° = 1 200 nmi eastward, not 340° westward',
    source: 'Longitude difference normalised to ±180° (Bowditch: DLo is the smaller arc)',
    run: () => {
      assertEqual(normalizeLongitudeDeg(340), -20, 'normalise 340');
      assertEqual(normalizeLongitudeDeg(-200), 160, 'normalise −200');
      assertEqual(normalizeLongitudeDeg(180), 180, 'normalise 180');
      const { outputs } = calculate({ lat1_deg: 0, lon1_deg: 170, lat2_deg: 0, lon2_deg: -170 });
      assertClose(outputs.gc_distance_nmi, 1200, { rel: 1e-9 }, 'GC');
      assertClose(outputs.rl_distance_nmi, 1200, { rel: 1e-9 }, 'RL');
      assertClose(outputs.rl_course_deg, 90, { abs: 1e-9 }, 'eastward');
    },
  },
  {
    name: 'New York (40.7°N 74.0°W) → London (51.5°N 0.1°W): great circle 3 007 nmi, initial course 051.2°, final 108.3°, vertex 53.8°N 23.1°W; rhumb line 3 128 nmi at 078° (3.9 % longer); WGS-84 geodesic 5 588 km',
    source: 'Haversine and Mercator formulas (Bowditch ch. 24); vertex cross-checked with cos φ_v = cos φ₁ |sin C₁| = cos 40.7° × sin 51.2° → 53.8°; JFK–LHR airline great circle 5 555 km for comparison',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.gc_distance_nmi, 3007.0, { abs: 1 }, 'GC distance');
      assertClose(outputs.gc_initial_course_deg, 51.2, { abs: 0.1 }, 'initial course');
      assertClose(outputs.gc_final_course_deg, 108.3, { abs: 0.1 }, 'final course');
      assertClose(outputs.gc_vertex_lat_deg, Math.acos(Math.cos((40.7 * Math.PI) / 180) * Math.sin((outputs.gc_initial_course_deg * Math.PI) / 180)) * (180 / Math.PI), { abs: 1e-6 }, 'vertex by the classical formula');
      assertClose(outputs.gc_vertex_lat_deg, 53.78, { abs: 0.02 }, 'vertex latitude');
      assertClose(outputs.gc_vertex_lon_deg, -23.05, { abs: 0.02 }, 'vertex longitude');
      assertEqual(outputs.vertex_on_track.startsWith('Yes'), true, 'vertex reached');
      assertClose(outputs.midpoint_lat_deg, 52.36, { abs: 0.02 }, 'midpoint latitude');
      assertClose(outputs.rl_distance_nmi, 3128.0, { abs: 1 }, 'RL distance');
      assertClose(outputs.rl_course_deg, 78.0, { abs: 0.1 }, 'RL course');
      assertClose(outputs.saving_pct, 3.87, { abs: 0.05 }, 'saving %');
      assertClose(outputs.geodesic_distance_nmi * 1.852, 5588, { abs: 2 }, 'geodesic km');
      assertClose(outputs.gc_time_h, outputs.gc_distance_nmi / 14, { rel: 1e-12 }, 'time at 14 kn');
    },
  },
  {
    name: 'Rhumb-line helper: 45°N 0° → 45°N 10°E gives course 090° and distance 600 × cos 45° = 424.3 nmi; vertex helper returns null for antipodes',
    source: 'Parallel sailing (Bowditch); antipodal points have no unique great circle',
    run: () => {
      const rl = rhumbLine(45, 0, 45, 10, R_NAUTICAL);
      assertClose(rl.courseDeg, 90, { abs: 1e-9 }, 'course');
      assertClose(rl.distanceM / 1852, 600 * Math.cos(Math.PI / 4), { rel: 1e-9 }, 'distance');
      assertEqual(greatCircleVertex(10, 20, -10, -160), null, 'antipodal → null');
    },
  },
  {
    name: 'Invalid inputs fail fast: latitude 95°, longitude 200°, zero speed',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ lat1_deg: 95 }), 'between -90 and 90', 'latitude');
      assertThrows(() => calculate({ lon2_deg: 200 }), 'between -180 and 180', 'longitude');
      assertThrows(() => calculate({ speed_kn: 0 }), 'greater than zero', 'speed');
    },
  },
];
