/**
 * course-to-steer/tests.js — checks of the current triangle against the textbook cases.
 * Run: node run-tests.js course-to-steer
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const LEG = { track_deg: 90, speed_kn: 12, set_deg: 180, drift_kn: 2, leeway_deg: 0, distance_nmi: 120 };

export const tests = [
  {
    name: 'Beam current: track 090° at 12 kn, current 2 kn setting 180° → cross 2 kn to starboard, δ = asin(2/12) = 9.59°, course to steer 080.4°, SOG 12 cos 9.59° = 11.83 kn, 120 nmi in 10.14 h',
    source: 'Bowditch ch. 11, current triangle (course to steer and speed of advance)',
    run: () => {
      const { outputs } = calculate(LEG);
      assertClose(outputs.cross_current_kn, 2, { abs: 1e-12 }, 'cross');
      assertClose(outputs.along_current_kn, 0, { abs: 1e-12 }, 'along');
      assertClose(outputs.offset_deg, Math.asin(2 / 12) * 180 / Math.PI, { rel: 1e-12 }, 'δ');
      assertClose(outputs.offset_deg, 9.594, { abs: 1e-3 }, 'δ value');
      assertClose(outputs.course_to_steer_deg, 90 - 9.594, { abs: 1e-3 }, 'CTS');
      assertClose(outputs.sog_kn, 12 * Math.cos(Math.asin(2 / 12)), { rel: 1e-12 }, 'SOG');
      assertClose(outputs.sog_kn, 11.832, { abs: 1e-3 }, 'SOG value');
      assertClose(outputs.time_h, 120 / outputs.sog_kn, { rel: 1e-12 }, 'time');
      assertClose(outputs.time_h, 10.14, { abs: 0.01 }, 'time value');
    },
  },
  {
    name: 'Head and following currents: set 270° (against the 090° track) gives SOG 10 kn with no heading change; set 090° gives 14 kn; a 45° quartering current from astern (set 045°) gives cross −1.414 kn and along +1.414 kn',
    source: 'Vector addition along the track',
    run: () => {
      const head = calculate({ ...LEG, set_deg: 270 }).outputs;
      assertClose(head.sog_kn, 10, { rel: 1e-12 }, 'head');
      assertClose(head.course_to_steer_deg, 90, { abs: 1e-9 }, 'no offset');
      assertClose(head.time_difference_h, 120 / 10 - 120 / 12, { rel: 1e-12 }, 'delay');
      const follow = calculate({ ...LEG, set_deg: 90 }).outputs;
      assertClose(follow.sog_kn, 14, { rel: 1e-12 }, 'following');
      const quarter = calculate({ ...LEG, set_deg: 45 }).outputs;
      assertClose(quarter.cross_current_kn, -Math.SQRT2, { rel: 1e-12 }, 'cross port');
      assertClose(quarter.along_current_kn, Math.SQRT2, { rel: 1e-12 }, 'along');
      assertEqual(quarter.course_to_steer_deg > 90, true, 'offset to starboard for a current from port side pushing to port');
    },
  },
  {
    name: 'Without allowance: steering 090° at 12 kn in the 2 kn southerly current makes good 099.5° at 12.17 kn and ends 20 nmi off track after 120 nmi (10 h × 2 kn)',
    source: 'Set-and-drift problem (Bowditch ch. 11)',
    run: () => {
      const { outputs } = calculate(LEG);
      assertClose(outputs.uncorrected_cmg_deg, 90 + Math.atan2(2, 12) * 180 / Math.PI, { rel: 1e-12 }, 'CMG');
      assertClose(outputs.uncorrected_cmg_deg, 99.46, { abs: 0.01 }, 'CMG value');
      assertClose(outputs.uncorrected_smg_kn, Math.hypot(12, 2), { rel: 1e-12 }, 'SMG');
      assertClose(outputs.uncorrected_offtrack_nmi, 2 * (120 / 12), { rel: 1e-12 }, 'off track');
    },
  },
  {
    name: 'Leeway and wrap-around: +3° leeway adds to the course (080.4° → 083.4°); a track of 005° with a 2 kn current setting 090° (pushing to starboard) gives a course to steer of 355.4°, wrapped past north',
    source: 'Leeway convention (steer into the wind); compass arithmetic',
    run: () => {
      const lee = calculate({ ...LEG, leeway_deg: 3 }).outputs;
      assertClose(lee.course_to_steer_leeway_deg, lee.course_to_steer_deg + 3, { rel: 1e-12 }, 'leeway added');
      const wrap = calculate({ ...LEG, track_deg: 5, set_deg: 90 }).outputs;
      assertClose(wrap.course_to_steer_deg, 355.45, { abs: 0.01 }, '355.4°');
      assertEqual(wrap.course_to_steer_deg > 355 && wrap.course_to_steer_deg < 360, true, 'wrapped');
      assertEqual(wrap.summary.startsWith('Steer 3'), true, 'summary formatted with leading digits');
    },
  },
  {
    name: 'Impossible and invalid cases: a 3 kn beam current against a 2 kn ship cannot make good the track; a head current faster than the ship gives no progress; zero distance is rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      assertThrows(() => calculate({ ...LEG, speed_kn: 2, drift_kn: 3 }), 'cannot be made good', 'too strong');
      assertThrows(() => calculate({ ...LEG, speed_kn: 2, drift_kn: 3, set_deg: 270 }), 'not positive', 'backwards');
      assertThrows(() => calculate({ ...LEG, distance_nmi: 0 }), 'greater than zero', 'distance');
      assertEqual(calculate({ ...LEG, speed_kn: 3 }).warnings.some((w) => w.includes('above half the ship speed')), true, 'strong current warning');
    },
  },
];
