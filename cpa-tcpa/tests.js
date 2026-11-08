/**
 * cpa-tcpa/tests.js — checks of the relative-motion solution against hand-worked plotting triangles.
 * Run: node run-tests.js cpa-tcpa
 */
import { calculate, closestApproach } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const DEG = Math.PI / 180;
const COLLISION = { own_course_deg: 0, own_speed_kn: 12, mode: 'plots', bearing_prev_deg: 45, range_prev_nmi: 8, bearing_deg: 45, range_nmi: 7, interval_min: 6 };

export const tests = [
  {
    name: 'Collision course: 045° 8.0 nmi then 045° 7.0 nmi six minutes later, own ship 000° at 12 kn → relative motion 225° at 10 kn, CPA 0 in 42 min, target 304.9° at 8.62 kn',
    source: 'NGA Pub. 1310 relative-motion triangle: e·r·m with em = own velocity, rm = relative velocity, er = target velocity',
    run: () => {
      const { outputs } = calculate(COLLISION);
      assertClose(outputs.relative_course_deg, 225, { abs: 1e-9 }, 'relative course');
      assertClose(outputs.relative_speed_kn, 10, { rel: 1e-12 }, 'relative speed (1 nmi in 6 min)');
      assertClose(outputs.cpa_nmi, 0, { abs: 1e-9 }, 'CPA');
      assertClose(outputs.tcpa_min, 42, { rel: 1e-12 }, 'TCPA = 7 nmi / 10 kn');
      const vx = -10 * Math.sin(45 * DEG);
      const vy = -10 * Math.cos(45 * DEG) + 12;
      assertClose(outputs.target_speed_out_kn, Math.hypot(vx, vy), { rel: 1e-12 }, 'target speed');
      assertClose(outputs.target_speed_out_kn, 8.619, { abs: 1e-3 }, 'target speed value');
      assertClose(outputs.target_course_out_deg, 360 + Math.atan2(vx, vy) / DEG, { rel: 1e-12 }, 'target course');
      assertClose(outputs.target_course_out_deg, 304.88, { abs: 0.01 }, 'target course value');
      assertClose(outputs.bcr_nmi, 0, { abs: 1e-9 }, 'crosses the bow at zero range');
      assertEqual(outputs.encounter.includes('starboard side'), true, 'crossing from starboard');
    },
  },
  {
    name: 'Stationary target: a buoy dead ahead closing from 6.0 to 4.8 nmi in 6 minutes at 12 kn has zero speed, CPA 0 and TCPA 24 minutes',
    source: 'Relative motion of a fixed object equals the reciprocal of own ship\'s motion (Pub. 1310)',
    run: () => {
      const { outputs } = calculate({ own_course_deg: 0, own_speed_kn: 12, bearing_prev_deg: 0, range_prev_nmi: 6, bearing_deg: 0, range_nmi: 4.8, interval_min: 6 });
      assertClose(outputs.target_speed_out_kn, 0, { abs: 1e-9 }, 'speed');
      assertEqual(outputs.target_course_out_deg, null, 'no course for a stationary target');
      assertClose(outputs.relative_course_deg, 180, { abs: 1e-9 }, 'relative motion reciprocal');
      assertClose(outputs.tcpa_min, 24, { rel: 1e-12 }, 'TCPA');
      assertEqual(outputs.encounter.startsWith('Target stationary'), true, 'encounter');
    },
  },
  {
    name: 'Known course and speed give the same answer as the plots: target 304.88° at 8.619 kn from 045° 7 nmi; a passing case 10 nmi off on 050° with the target crossing at 270° 10 kn gives CPA = 10 sin 5° × √2 and TCPA from the projection',
    source: 'Vector identity V_r = V_t − V_o; CPA = |P × V_r|/|V_r|, TCPA = −P·V_r/|V_r|²',
    run: () => {
      const plots = calculate(COLLISION).outputs;
      const known = calculate({ ...COLLISION, mode: 'known', target_course_deg: plots.target_course_out_deg, target_speed_kn: plots.target_speed_out_kn }).outputs;
      assertClose(known.cpa_nmi, 0, { abs: 1e-9 }, 'same CPA');
      assertClose(known.tcpa_min, 42, { rel: 1e-9 }, 'same TCPA');
      const pass = calculate({ own_course_deg: 0, own_speed_kn: 10, mode: 'known', target_course_deg: 270, target_speed_kn: 10, bearing_deg: 50, range_nmi: 10 }).outputs;
      const p = { x: 10 * Math.sin(50 * DEG), y: 10 * Math.cos(50 * DEG) };
      const rel = { x: -10, y: -10 };
      assertClose(pass.cpa_nmi, Math.abs(p.x * rel.y - p.y * rel.x) / Math.hypot(rel.x, rel.y), { rel: 1e-12 }, 'CPA by the cross product');
      assertClose(pass.cpa_nmi, 10 * Math.sin(5 * DEG), { rel: 1e-9 }, 'CPA = 10 sin(50° − 45°)');
      assertClose(pass.tcpa_min, (-(p.x * rel.x + p.y * rel.y) / 200) * 60, { rel: 1e-12 }, 'TCPA');
      const direct = closestApproach(p, rel);
      assertClose(direct.cpa, pass.cpa_nmi, { rel: 1e-12 }, 'helper');
    },
  },
  {
    name: 'Encounter types: a faster target 2 nmi dead astern on the same course is overtaking (CPA 0 in 24 min at 5 kn closing); a reciprocal target dead ahead is head-on; a target on the port bow is a crossing where own ship stands on',
    source: 'COLREG Rules 13, 14 and 15 (sector 22.5° abaft the beam = 112.5° from the bow)',
    run: () => {
      const overtaking = calculate({ own_course_deg: 0, own_speed_kn: 10, mode: 'known', target_course_deg: 0, target_speed_kn: 15, bearing_deg: 180, range_nmi: 2 }).outputs;
      assertEqual(overtaking.encounter.includes('Target overtaking'), true, 'being overtaken');
      assertClose(overtaking.tcpa_min, 24, { rel: 1e-12 }, '2 nmi at 5 kn');
      const headOn = calculate({ own_course_deg: 0, own_speed_kn: 10, mode: 'known', target_course_deg: 180, target_speed_kn: 10, bearing_deg: 2, range_nmi: 6 }).outputs;
      assertEqual(headOn.encounter.startsWith('Head-on'), true, 'head-on');
      const port = calculate({ own_course_deg: 0, own_speed_kn: 12, mode: 'known', target_course_deg: 60, target_speed_kn: 12, bearing_deg: 300, range_nmi: 6 }).outputs;
      assertEqual(port.encounter.includes('port side'), true, 'stand-on');
      assertClose(port.relative_bearing_deg, -60, { abs: 1e-9 }, 'relative bearing on the port bow');
    },
  },
  {
    name: 'Avoiding action: from the collision course, the returned starboard alteration gives CPA ≥ 2 nmi while 0.5° less does not; the returned speed reduction does the same for speed',
    source: 'Trial manoeuvre (IMO MSC.192(79) radar performance standard; Bole, Dineley & Wall ch. 8)',
    run: () => {
      const base = calculate(COLLISION).outputs;
      const target = { mode: 'known', target_course_deg: base.target_course_out_deg, target_speed_kn: base.target_speed_out_kn, bearing_deg: 45, range_nmi: 7 };
      const altered = calculate({ ...target, own_course_deg: base.new_course_deg, own_speed_kn: 12 }).outputs;
      assertEqual(altered.cpa_nmi >= 2 - 1e-9, true, `CPA after ${base.alteration_deg}° is ${altered.cpa_nmi}`);
      const short = calculate({ ...target, own_course_deg: base.new_course_deg - 0.5, own_speed_kn: 12 }).outputs;
      assertEqual(short.cpa_nmi < 2, true, 'half a degree less is not enough');
      const slowed = calculate({ ...target, own_course_deg: 0, own_speed_kn: base.new_speed_kn }).outputs;
      assertEqual(slowed.cpa_nmi >= 2 - 1e-9 || slowed.tcpa_min <= 0, true, 'reduced speed opens the CPA');
      assertEqual(calculate({ ...COLLISION, cpa_limit_nmi: 0.5, bearing_deg: 90, bearing_prev_deg: 80 }).outputs.alteration_deg, null, 'no action needed when clear');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero range, negative speed, an unknown data mode and a zero plot interval',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ range_nmi: 0 }), 'greater than zero', 'range');
      assertThrows(() => calculate({ own_speed_kn: -1 }), 'must not be negative', 'speed');
      assertThrows(() => calculate({ mode: 'sonar' }), 'must be one of', 'mode');
      assertThrows(() => calculate({ interval_min: 0 }), 'greater than zero', 'interval');
    },
  },
];
