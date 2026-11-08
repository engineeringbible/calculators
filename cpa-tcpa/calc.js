/**
 * cpa-tcpa/calc.js — relative-motion (radar plotting) solution for one target: direction and speed of relative motion,
 * the target's true course and speed, closest point of approach and the time to it, bow crossing, aspect, an
 * indicative COLREG encounter type, and the own-ship course or speed change that opens the CPA to a chosen limit.
 *
 * Target position from own ship P = R (sin B, cos B) with x east and y north in nautical miles; relative velocity
 * V_r = (P₂ − P₁)/Δt (or V_t − V_o when the target's course and speed are known); target velocity V_t = V_r + V_o;
 * TCPA = −(P·V_r)/|V_r|²; CPA = |P + V_r·TCPA|.
 * Schema units: degrees true, nautical miles, knots, minutes.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const DEG = Math.PI / 180;
/** Alteration search: course in 0.5° steps up to 90° to starboard, speed in 0.1 kn steps down to stopped. */
const COURSE_STEP_DEG = 0.5;
const MAX_ALTERATION_DEG = 90;
const SPEED_STEP_KN = 0.1;
/** Rule 13: overtaking when coming up from more than 22.5° abaft the beam (112.5° from the bow). */
const OVERTAKING_SECTOR_DEG = 112.5;
/** Head-on: reciprocal or nearly reciprocal courses with the other vessel nearly ahead. */
const HEAD_ON_TOLERANCE_DEG = 6;

const norm360 = (deg) => ((deg % 360) + 360) % 360;
const norm180 = (deg) => {
  const a = norm360(deg);
  return a > 180 ? a - 360 : a;
};
const vec = (bearingDeg, length) => ({ x: length * Math.sin(bearingDeg * DEG), y: length * Math.cos(bearingDeg * DEG) });
const dirOf = (v) => norm360(Math.atan2(v.x, v.y) / DEG);
const tidy = (x) => (Math.abs(x) < 1e-9 ? 0 : x);

export const schema = {
  id: 'cpa-tcpa',
  name: 'CPA and TCPA from radar plots',
  category: 'maritime',
  summary: 'Target course and speed, closest point of approach and its time, bow crossing, aspect and the alteration for a safe passing distance.',
  related: ['course-to-steer', 'true-wind', 'light-range', 'great-circle-distance'],
  assumptions: [
    'Relative-motion triangle: both ships hold course and speed between the plots and until the closest point of approach; the target\'s relative motion line is the straight line through the two plots, its true velocity is the relative velocity plus own ship\'s velocity, CPA is the perpendicular distance from own ship to that line and TCPA the time to reach the foot of the perpendicular.',
    'Bearings are true (gyro-stabilised, north-up plot) and own ship\'s course and speed are those used for the plot: course and speed through the water give the target\'s course and speed through the water, which is what the anti-collision rules and the target\'s aspect refer to; over the ground (GPS) they include the current. A radar plot taken over 3–6 minutes is the minimum; a single bearing and range give no motion at all.',
    'Bow crossing range is the distance ahead (+) or astern (−) of own ship at which the target crosses own ship\'s heading line; it is shown only when the crossing is still to come.',
    'The encounter type follows Rules 13–15 of COLREG for vessels in sight of one another and is indicative only: overtaking when coming up from more than 22.5° abaft the other vessel\'s beam, head-on for nearly reciprocal courses (within 6°) with the other vessel within 6° of the bow, crossing otherwise (target on the starboard side: own ship gives way). In restricted visibility Rule 19 applies instead and there is no stand-on vessel.',
    'The avoiding action is the smallest alteration of course to starboard at constant speed (0.5° steps up to 90°), or the smallest speed reduction at constant course (0.1 kn steps), that gives a CPA at least the chosen limit, assuming the target holds its course and speed and the change takes effect immediately; a real ship needs time and distance to turn or slow down, so act early and by a substantial, readily apparent change (Rules 8 and 16).',
  ],
  notes: [
    'Verification 2026-10-31: a target plotted at 045° 8.0 nmi and six minutes later at 045° 7.0 nmi, with own ship on 000° at 12 kn, is on a collision course: relative motion 225° at 10 kn, CPA 0 in 42 minutes, target true course 304.9° at 8.62 kn; a stationary buoy dead ahead closing from 6.0 to 4.8 nmi in six minutes gives a target speed of zero.',
    'Design decision: the encounter type and avoiding action are aids for training and post-event analysis; the page says so in a runtime warning every time, because a plot from two noisy radar observations can be badly wrong in aspect.',
  ],
  sources: [
    'Radar Navigation and Maneuvering Board Manual, NGA Pub. 1310, 9th ed. (2019) — relative motion, CPA and target true course and speed',
    'A. Bole, B. Dineley, A. Wall, Radar and ARPA Manual, 3rd ed., Butterworth-Heinemann 2013 — the plotting triangle, CPA/TCPA, aspect, trial manoeuvre',
    'Convention on the International Regulations for Preventing Collisions at Sea, 1972 (COLREG), Rules 7, 8, 13–17 and 19',
    'IMO Resolution MSC.192(79) Performance standards for radar equipment — CPA/TCPA limits and trial manoeuvre',
  ],
  inputs: [
    { id: 'own_course_deg', label: 'Own ship course, true', group: 'angle', unit: 'deg', default: 0, min: 0, max: 360 },
    { id: 'own_speed_kn', label: 'Own ship speed', group: 'speed', unit: 'kn', default: 12, min: 0, max: 50 },
    {
      id: 'mode',
      label: 'Target data',
      type: 'select',
      default: 'plots',
      options: [
        { value: 'plots', label: 'Two radar plots (bearing and range)' },
        { value: 'known', label: 'Target course and speed known (AIS or ARPA)' },
      ],
    },
    { id: 'bearing_prev_deg', label: 'First plot: bearing of the target, true', group: 'angle', unit: 'deg', default: 40, min: 0, max: 360, visibleWhen: { mode: 'plots' } },
    { id: 'range_prev_nmi', label: 'First plot: range', group: 'length', unit: 'nmi', default: 9, min: 0.01, max: 100, visibleWhen: { mode: 'plots' } },
    { id: 'interval_min', label: 'Time between the two plots', group: 'time', unit: 'min', default: 6, min: 0.1, max: 120, visibleWhen: { mode: 'plots' } },
    { id: 'bearing_deg', label: 'Latest plot: bearing of the target, true', group: 'angle', unit: 'deg', default: 41, min: 0, max: 360 },
    { id: 'range_nmi', label: 'Latest plot: range', group: 'length', unit: 'nmi', default: 7.8, min: 0.01, max: 100 },
    { id: 'target_course_deg', label: 'Target course, true', group: 'angle', unit: 'deg', default: 300, min: 0, max: 360, visibleWhen: { mode: 'known' } },
    { id: 'target_speed_kn', label: 'Target speed', group: 'speed', unit: 'kn', default: 10, min: 0, max: 60, visibleWhen: { mode: 'known' } },
    { id: 'cpa_limit_nmi', label: 'CPA limit (closest acceptable passing distance)', group: 'length', unit: 'nmi', default: 2, min: 0.05, max: 20 },
    { id: 'tcpa_limit_min', label: 'TCPA limit (warning horizon)', group: 'time', unit: 'min', default: 20, min: 1, max: 240 },
  ],
  outputs: [
    { id: 'relative_course_deg', label: 'Direction of relative motion, true', group: 'angle', unit: 'deg' },
    { id: 'relative_speed_kn', label: 'Speed of relative motion', group: 'speed', unit: 'kn' },
    { id: 'target_course_out_deg', label: 'Target true course', group: 'angle', unit: 'deg' },
    { id: 'target_speed_out_kn', label: 'Target true speed', group: 'speed', unit: 'kn' },
    { id: 'cpa_nmi', label: 'Closest point of approach CPA', group: 'length', unit: 'nmi' },
    { id: 'tcpa_min', label: 'Time to CPA (negative: already passed)', group: 'time', unit: 'min' },
    { id: 'cpa_bearing_deg', label: 'True bearing of the target at CPA', group: 'angle', unit: 'deg' },
    { id: 'bcr_nmi', label: 'Bow crossing range (+ ahead, − astern)', group: 'length', unit: 'nmi' },
    { id: 'bct_min', label: 'Time to the bow crossing', group: 'time', unit: 'min' },
    { id: 'relative_bearing_deg', label: 'Relative bearing of the target (+ starboard, − port)', group: 'angle', unit: 'deg' },
    { id: 'aspect_deg', label: 'Aspect: own ship off the target\'s bow (+ green, − red)', group: 'angle', unit: 'deg' },
    { id: 'range_rate_kn', label: 'Range rate (− closing)', group: 'speed', unit: 'kn' },
    { id: 'bearing_change_deg', label: 'Bearing change between the plots (+ drawing right)', group: 'angle', unit: 'deg' },
    { id: 'encounter', label: 'Encounter type (indicative)', type: 'text' },
    { id: 'alteration_deg', label: 'Alteration to starboard for the CPA limit (speed kept)', group: 'angle', unit: 'deg' },
    { id: 'new_course_deg', label: 'New course for the CPA limit', group: 'angle', unit: 'deg' },
    { id: 'new_speed_kn', label: 'Reduced speed for the CPA limit (course kept)', group: 'speed', unit: 'kn' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      relative_speed_kn: '12 kn',
      cpa_nmi: '1.0 nmi',
    },
  },
};

/** Closest approach of a target at position p (nmi) moving with relative velocity rel (kn): TCPA in hours and CPA in nmi. */
export function closestApproach(p, rel) {
  const v2 = rel.x * rel.x + rel.y * rel.y;
  if (v2 < 1e-12) return { tcpaH: null, cpa: Math.hypot(p.x, p.y), point: p };
  const t = -(p.x * rel.x + p.y * rel.y) / v2;
  const point = { x: p.x + rel.x * t, y: p.y + rel.y * t };
  return { tcpaH: t, cpa: Math.hypot(point.x, point.y), point };
}

/** True when the target passes at least `limit` nmi off: the CPA lies ahead and is wide enough, or the range is already opening. */
function clearOf(p, rel, limit) {
  const c = closestApproach(p, rel);
  const range = Math.hypot(p.x, p.y);
  if (c.tcpaH === null || c.tcpaH <= 0) return range >= limit;
  return c.cpa >= limit - 1e-9;
}

/** Bow crossing: where the relative track meets own ship's heading line; range ahead (+) or astern (−) and time in hours. */
function bowCrossing(p, rel, ownCourseDeg) {
  const h = vec(ownCourseDeg, 1);
  const lateral = p.x * h.y - p.y * h.x;
  const lateralRate = rel.x * h.y - rel.y * h.x;
  if (Math.abs(lateralRate) < 1e-9) return null;
  const t = -lateral / lateralRate;
  if (t < 0) return null;
  const at = { x: p.x + rel.x * t, y: p.y + rel.y * t };
  return { rangeNmi: at.x * h.x + at.y * h.y, timeH: t };
}

function encounterType(relBearing, aspect, ownCourse, targetCourse, ownSpeed, targetSpeed) {
  if (targetSpeed < 1e-9) return 'Target stationary or stopped: keep clear and pass at a safe distance.';
  if (ownSpeed > 1e-9 && aspect !== null && Math.abs(aspect) > OVERTAKING_SECTOR_DEG) return 'Own ship overtaking (Rule 13): keep out of the way of the target.';
  if (Math.abs(relBearing) > OVERTAKING_SECTOR_DEG) return 'Target overtaking own ship (Rule 13): the target keeps clear; own ship stands on (Rule 17).';
  if (Math.abs(norm180(targetCourse - ownCourse - 180)) <= HEAD_ON_TOLERANCE_DEG && Math.abs(relBearing) <= HEAD_ON_TOLERANCE_DEG) return 'Head-on (Rule 14): both ships alter course to starboard.';
  if (relBearing > 0) return 'Crossing with the target on the starboard side (Rule 15): own ship gives way, avoiding crossing ahead.';
  return 'Crossing with the target on the port side (Rule 15): own ship stands on (Rule 17) and acts if the target does not.';
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertRange(i.own_course_deg, 0, 360, 'own_course_deg', 'Own course');
  assertNonNegative(i.own_speed_kn, 'own_speed_kn', 'Own speed');
  assertOneOf(i.mode, ['plots', 'known'], 'mode', 'Target data');
  assertRange(i.bearing_deg, 0, 360, 'bearing_deg', 'Bearing of the latest plot');
  assertPositive(i.range_nmi, 'range_nmi', 'Range of the latest plot');
  assertPositive(i.cpa_limit_nmi, 'cpa_limit_nmi', 'CPA limit');
  assertPositive(i.tcpa_limit_min, 'tcpa_limit_min', 'TCPA limit');

  const own = vec(i.own_course_deg, i.own_speed_kn);
  const p = vec(i.bearing_deg, i.range_nmi);
  let rel;
  let target;
  let bearingChange = null;
  if (i.mode === 'plots') {
    assertRange(i.bearing_prev_deg, 0, 360, 'bearing_prev_deg', 'Bearing of the first plot');
    assertPositive(i.range_prev_nmi, 'range_prev_nmi', 'Range of the first plot');
    assertPositive(i.interval_min, 'interval_min', 'Time between the plots');
    const p1 = vec(i.bearing_prev_deg, i.range_prev_nmi);
    const dtH = i.interval_min / 60;
    rel = { x: tidy((p.x - p1.x) / dtH), y: tidy((p.y - p1.y) / dtH) };
    target = { x: tidy(rel.x + own.x), y: tidy(rel.y + own.y) };
    bearingChange = norm180(i.bearing_deg - i.bearing_prev_deg);
  } else {
    assertRange(i.target_course_deg, 0, 360, 'target_course_deg', 'Target course');
    assertNonNegative(i.target_speed_kn, 'target_speed_kn', 'Target speed');
    target = vec(i.target_course_deg, i.target_speed_kn);
    rel = { x: tidy(target.x - own.x), y: tidy(target.y - own.y) };
  }

  const relSpeed = Math.hypot(rel.x, rel.y);
  const targetSpeed = Math.hypot(target.x, target.y);
  const targetCourse = targetSpeed > 1e-9 ? dirOf(target) : null;
  const closest = closestApproach(p, rel);
  const tcpaMin = closest.tcpaH === null ? null : closest.tcpaH * 60;
  const cpaBearing = closest.cpa > 1e-9 ? dirOf(closest.point) : null;
  const crossing = bowCrossing(p, rel, i.own_course_deg);
  const relBearing = norm180(i.bearing_deg - i.own_course_deg);
  const aspect = targetCourse === null ? null : norm180(i.bearing_deg + 180 - targetCourse);
  const rangeRate = (p.x * rel.x + p.y * rel.y) / i.range_nmi;

  const risk = closest.tcpaH !== null && closest.tcpaH > 0 && closest.cpa < i.cpa_limit_nmi;
  const encounter = risk
    ? encounterType(relBearing, aspect, i.own_course_deg, targetCourse ?? 0, i.own_speed_kn, targetSpeed)
    : `No close-quarters situation within the CPA limit: the target passes ${closest.cpa.toFixed(2)} nmi off${tcpaMin !== null && tcpaMin < 0 ? ' and the range is already opening' : ''}.`;

  let alteration = null;
  let newCourse = null;
  let newSpeed = null;
  const warnings = [];
  if (risk) {
    if (i.range_nmi < i.cpa_limit_nmi) {
      warnings.push(`The target is already inside the CPA limit (${i.range_nmi} nmi < ${i.cpa_limit_nmi} nmi): no alteration can restore it; take the action that best opens the range.`);
    } else {
      for (let d = COURSE_STEP_DEG; d <= MAX_ALTERATION_DEG + 1e-9; d += COURSE_STEP_DEG) {
        const ownNew = vec(i.own_course_deg + d, i.own_speed_kn);
        if (clearOf(p, { x: target.x - ownNew.x, y: target.y - ownNew.y }, i.cpa_limit_nmi)) {
          alteration = d;
          newCourse = norm360(i.own_course_deg + d);
          break;
        }
      }
      const steps = Math.ceil(i.own_speed_kn / SPEED_STEP_KN - 1e-9);
      for (let k = 1; k <= steps; k += 1) {
        const speed = Math.max(0, Math.round((i.own_speed_kn - k * SPEED_STEP_KN) * 10) / 10);
        const ownNew = vec(i.own_course_deg, speed);
        if (clearOf(p, { x: target.x - ownNew.x, y: target.y - ownNew.y }, i.cpa_limit_nmi)) {
          newSpeed = speed;
          break;
        }
      }
      if (alteration === null) warnings.push(`No alteration to starboard of up to ${MAX_ALTERATION_DEG}° gives a CPA of ${i.cpa_limit_nmi} nmi at the present speed; combine a course change with a speed reduction.`);
      if (newSpeed === null) warnings.push('Even stopping does not give the CPA limit (the target itself is closing): alter course as well.');
    }
  }

  if (risk && tcpaMin !== null && tcpaMin < i.tcpa_limit_min) warnings.push(`CPA ${closest.cpa.toFixed(2)} nmi in ${tcpaMin.toFixed(1)} min — inside both limits: take early and substantial action (Rules 8 and 16).`);
  else if (risk) warnings.push(`CPA ${closest.cpa.toFixed(2)} nmi is inside the ${i.cpa_limit_nmi} nmi limit, ${tcpaMin.toFixed(0)} min ahead: monitor and plan the avoiding action.`);
  if (i.mode === 'plots' && bearingChange !== null && Math.abs(bearingChange) < 1 && rangeRate < 0) warnings.push('Compass bearing not appreciably changing while the range closes: risk of collision exists (Rule 7(d)).');
  if (i.mode === 'plots' && i.interval_min < 3) warnings.push('Plot interval under 3 minutes: small bearing and range errors give large errors in the target\'s course and speed.');
  if (crossing && crossing.rangeNmi > 0 && crossing.rangeNmi < i.cpa_limit_nmi && closest.tcpaH > 0) warnings.push(`The target crosses ahead at only ${crossing.rangeNmi.toFixed(2)} nmi.`);
  warnings.push('Indicative aid for training and analysis: the encounter type assumes vessels in sight of one another (Rules 13–17); in restricted visibility Rule 19 applies and there is no stand-on vessel.');

  const fmt = (v, d = 1) => (v === null ? '—' : v.toFixed(d));
  return {
    outputs: {
      relative_course_deg: relSpeed > 1e-9 ? dirOf(rel) : null,
      relative_speed_kn: relSpeed,
      target_course_out_deg: targetCourse,
      target_speed_out_kn: tidy(targetSpeed),
      cpa_nmi: tidy(closest.cpa),
      tcpa_min: tcpaMin,
      cpa_bearing_deg: cpaBearing,
      bcr_nmi: crossing ? tidy(crossing.rangeNmi) : null,
      bct_min: crossing ? crossing.timeH * 60 : null,
      relative_bearing_deg: relBearing,
      aspect_deg: aspect,
      range_rate_kn: tidy(rangeRate),
      bearing_change_deg: bearingChange,
      encounter,
      alteration_deg: alteration,
      new_course_deg: newCourse,
      new_speed_kn: newSpeed,
      summary: `Target ${targetCourse === null ? 'stationary' : `on ${fmt(targetCourse)}° at ${fmt(targetSpeed)} kn`}; CPA ${fmt(closest.cpa, 2)} nmi ${tcpaMin === null ? '(no relative motion)' : tcpaMin >= 0 ? `in ${fmt(tcpaMin)} min` : `passed ${fmt(-tcpaMin)} min ago`}${crossing ? `; crosses ${crossing.rangeNmi >= 0 ? 'ahead' : 'astern'} at ${fmt(Math.abs(crossing.rangeNmi), 2)} nmi` : ''}${alteration !== null ? `; ${alteration}° to starboard (course ${fmt(newCourse)}°) opens the CPA to ${i.cpa_limit_nmi} nmi` : ''}.`,
    },
    warnings,
  };
}
