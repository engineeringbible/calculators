/**
 * course-to-steer/calc.js — the navigator's vector triangle: course to steer to make good a required track through a
 * current of known set and drift, the resulting speed over ground and passage time, the leeway allowance, and the
 * course and speed made good if the current were ignored.
 *
 * cross = D sin(C − T);  sin δ = cross/S;  CTS = T − δ;  SOG = S cos δ + D cos(C − T);  time = distance/SOG
 * Schema units: degrees true, knots, nautical miles.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange } from '../shared/validate.js';

const DEG = Math.PI / 180;
const norm360 = (deg) => ((deg % 360) + 360) % 360;

export const schema = {
  id: 'course-to-steer',
  name: 'Course to steer with set and drift',
  category: 'maritime',
  summary: 'Course to steer, speed over ground and passage time to make good a track through a current of known set and drift, with leeway.',
  related: ['great-circle-distance', 'mercator-sailing', 'tidal-height', 'propeller-slip', 'optimal-speed-charter'],
  sendTo: [
    {
      target: 'fuel-voyage-cost',
      label: 'Fuel and cost at the speed over ground',
      note: 'The speed over ground sets the passage time; the engine power or daily consumption stays as entered there, because it belongs to the speed through the water.',
      links: [
        { to: 'distance_nmi', from: 'input:distance_nmi' },
        { to: 'speed_kn', from: 'sog_kn' },
      ],
    },
  ],
  assumptions: [
    'Velocity triangle: the ground velocity is the vector sum of the ship\'s velocity through the water (speed S on the heading) and the current (drift D towards the set C); to make good the track T the heading is offset to windward of the current by δ with sin δ = D sin(C − T)/S, giving the course to steer CTS = T − δ and the speed over ground SOG = S cos δ + D cos(C − T); all directions true, set = direction the current flows TOWARDS (navigational convention, opposite to wind).',
    'The current is uniform along the leg and constant in time (a tidal stream is averaged over the passage or the leg is split); when the cross-track component of the current exceeds the ship speed the track cannot be made good and the page says so.',
    'Leeway is the angle the wind pushes the ship off its heading; it is applied after the current triangle by steering into the wind by the leeway angle entered (positive when the wind is on the starboard side, pushing the ship to port, so the correction adds to the course); 2–5° in strong beam winds for high-sided ships, under 1° for loaded tankers in moderate weather.',
    'Plane (flat-earth) triangle: exact for the leg lengths of coastal and tidal navigation (tens of miles); for ocean legs apply it to each great-circle or rhumb-line segment with its own current.',
    'The "if current ignored" result is the course and speed made good when the ship steers the track course without allowance — the classic set-and-drift problem in reverse.',
  ],
  notes: [
    'Verification 2026-10-31: track 090° at 12 kn with a 2 kn current setting 180° (beam current from port) gives δ = asin(2/12) = 9.59°, course to steer 080.4°, SOG 11.83 kn and 10.14 h for 120 nmi; steering 090° without allowance makes good 099.5° at 12.17 kn; a head current (set 270°) gives SOG 10 kn with no heading change, a following one (set 090°) 14 kn — the textbook results.',
    'Design decision: set is the direction towards which the current flows, as on charts and in tidal atlases; the page states this in the label because wind directions follow the opposite convention and this is the usual source of error.',
  ],
  sources: [
    'The American Practical Navigator (Bowditch), NGA Pub. 9, 2019 edition, ch. 11 "Dead Reckoning" and ch. 10 — current triangle, set and drift, leeway',
    'Admiralty Manual of Navigation, BR 45, Vol. 1 — course to steer with tidal stream',
    'UK Hydrographic Office tidal stream atlases — set/rate conventions',
    'IMO Resolution A.893(21) Guidelines for voyage planning (allowance for currents and leeway)',
  ],
  inputs: [
    { id: 'track_deg', label: 'Required track (course over ground) T, true', group: 'angle', unit: 'deg', default: 90, min: 0, max: 360 },
    { id: 'speed_kn', label: 'Ship speed through the water S', group: 'speed', unit: 'kn', default: 12, min: 0.1, max: 50 },
    { id: 'set_deg', label: 'Current set (direction the current flows TOWARDS), true', group: 'angle', unit: 'deg', default: 180, min: 0, max: 360 },
    { id: 'drift_kn', label: 'Current drift (rate)', group: 'speed', unit: 'kn', default: 2, min: 0, max: 15 },
    { id: 'leeway_deg', label: 'Leeway angle (+ wind on starboard side, steer to starboard)', group: 'angle', unit: 'deg', default: 0, min: -15, max: 15 },
    { id: 'distance_nmi', label: 'Leg distance', group: 'length', unit: 'nmi', default: 120, min: 0.1, max: 20000 },
  ],
  outputs: [
    { id: 'relative_set_deg', label: 'Current direction relative to the track (C − T)', group: 'angle', unit: 'deg' },
    { id: 'cross_current_kn', label: 'Cross-track component of the current (+ to starboard)', group: 'speed', unit: 'kn' },
    { id: 'along_current_kn', label: 'Along-track component of the current (+ following)', group: 'speed', unit: 'kn' },
    { id: 'offset_deg', label: 'Heading offset δ = asin(cross/S)', group: 'angle', unit: 'deg' },
    { id: 'course_to_steer_deg', label: 'Course to steer (current only), true', group: 'angle', unit: 'deg' },
    { id: 'course_to_steer_leeway_deg', label: 'Course to steer with leeway, true', group: 'angle', unit: 'deg' },
    { id: 'sog_kn', label: 'Speed over ground along the track', group: 'speed', unit: 'kn' },
    { id: 'time_h', label: 'Passage time for the leg', group: 'time', unit: 'h' },
    { id: 'time_difference_h', label: 'Time difference against still water', group: 'time', unit: 'h' },
    { id: 'uncorrected_cmg_deg', label: 'Course made good if steering the track course without allowance', group: 'angle', unit: 'deg' },
    { id: 'uncorrected_smg_kn', label: 'Speed made good without allowance', group: 'speed', unit: 'kn' },
    { id: 'uncorrected_offtrack_nmi', label: 'Cross-track error at the end of the leg without allowance', group: 'length', unit: 'nmi' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      sog_kn: '11.83 kn',
      time_h: '10.14 h',
      uncorrected_smg_kn: '12.17 kn',
      uncorrected_offtrack_nmi: '20 nmi',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertRange(i.track_deg, 0, 360, 'track_deg', 'Track');
  assertPositive(i.speed_kn, 'speed_kn', 'Ship speed');
  assertRange(i.set_deg, 0, 360, 'set_deg', 'Set');
  assertNonNegative(i.drift_kn, 'drift_kn', 'Drift');
  assertRange(i.leeway_deg, -30, 30, 'leeway_deg', 'Leeway');
  assertPositive(i.distance_nmi, 'distance_nmi', 'Distance');

  const rel = i.set_deg - i.track_deg;
  const tidy = (x) => (Math.abs(x) < 1e-9 ? 0 : x);
  const cross = tidy(i.drift_kn * Math.sin(rel * DEG));
  const along = tidy(i.drift_kn * Math.cos(rel * DEG));
  if (Math.abs(cross) > i.speed_kn) throw new Error(`Cross-track current ${Math.abs(cross).toFixed(2)} kn exceeds the ship speed ${i.speed_kn} kn: the track cannot be made good`);
  const delta = Math.asin(cross / i.speed_kn) / DEG;
  const cts = norm360(i.track_deg - delta);
  const ctsLeeway = norm360(cts + i.leeway_deg);
  const sog = i.speed_kn * Math.cos(delta * DEG) + along;
  if (sog <= 0) throw new Error('Speed over ground is not positive: the current carries the ship backwards along the track');
  const time = i.distance_nmi / sog;
  const stillTime = i.distance_nmi / i.speed_kn;
  // Uncorrected: heading = track at speed S, plus current.
  const ex = i.speed_kn * Math.sin(i.track_deg * DEG) + i.drift_kn * Math.sin(i.set_deg * DEG);
  const ny = i.speed_kn * Math.cos(i.track_deg * DEG) + i.drift_kn * Math.cos(i.set_deg * DEG);
  const smg = Math.hypot(ex, ny);
  const cmg = norm360(Math.atan2(ex, ny) / DEG);
  const offTrack = Math.abs(cross) * stillTime;

  const warnings = [];
  if (Math.abs(cross) > 0.5 * i.speed_kn) warnings.push('Cross current above half the ship speed: large heading offset and strong sensitivity to the current estimate — check the tidal data.');
  if (Math.abs(i.leeway_deg) > 5) warnings.push('Leeway above 5°: only light high-sided ships in strong beam winds; verify against the observed track.');
  if (i.distance_nmi > 100) warnings.push('Leg longer than 100 nmi: the current is unlikely to be uniform; split the leg at the tidal-stream or current-chart boundaries.');
  warnings.push('Set is the direction the current flows towards (chart convention); wind directions are the opposite — a common source of error.');
  warnings.push('Uniform, steady current along the leg; tidal streams must be averaged over the hours of the passage.');

  return {
    outputs: {
      relative_set_deg: norm360(rel),
      cross_current_kn: cross,
      along_current_kn: along,
      offset_deg: delta,
      course_to_steer_deg: cts,
      course_to_steer_leeway_deg: ctsLeeway,
      sog_kn: sog,
      time_h: time,
      time_difference_h: time - stillTime,
      uncorrected_cmg_deg: cmg,
      uncorrected_smg_kn: smg,
      uncorrected_offtrack_nmi: offTrack,
      summary: `Steer ${ctsLeeway.toFixed(1).padStart(5, '0')}° (${delta >= 0 ? '' : '+'}${(-delta).toFixed(1)}° off the ${i.track_deg}° track${i.leeway_deg ? `, incl. ${i.leeway_deg}° leeway` : ''}) at ${i.speed_kn} kn to make good ${sog.toFixed(2)} kn over the ground; ${i.distance_nmi} nmi in ${time.toFixed(2)} h (${(time - stillTime) >= 0 ? '+' : ''}${((time - stillTime) * 60).toFixed(0)} min against still water).`,
    },
    warnings,
  };
}
