/**
 * vertical-curve/calc.js — symmetrical parabolic vertical curve: PVC, PVI and PVT stations and elevations, the
 * elevation at any station, the high or low point, K = L/A, the stopping sight distance the curve provides and an
 * elevation table.
 *
 * y(x) = y_PVC + g1 x + (g2 − g1) x² / (2L), x from the PVC;  x_turn = −g1 L / (g2 − g1).
 * AASHTO Green Book (7th ed., 2018) section 3.4.6: crest, S < L: L = A S² / C, S > L: L = 2S − C/A with
 * C = 2 158 (ft, h1 = 3.5 ft, h2 = 2.0 ft) or 658 (m, h1 = 1.08 m, h2 = 0.60 m); sag headlight, S < L:
 * L = A S² / (400 + 3.5 S) (ft) or (120 + 3.5 S) (m); S > L: L = 2S − (400 + 3.5 S)/A.
 * Stopping sight distance (section 3.2.2): 1.47 V t + 1.075 V²/a (ft, mph) or 0.278 V t + 0.039 V²/a (m, km/h), t = 2.5 s,
 * a = 11.2 ft/s² (3.4 m/s²).
 * Schema units: m for stations, lengths and elevations; grades as fractions; speed in m/s.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive, assertNonNegative } from '../shared/validate.js';

const FT = 0.3048;
/** AASHTO constants by unit system: crest C, sag headlight constant, SSD formula. */
const SYSTEMS = {
  us: { len: FT, crest: 2158, sag: 400, ssd: (vMs) => { const v = vMs / 0.44704; return (1.47 * v * 2.5 + (1.075 * v * v) / 11.2) * FT; } },
  metric: { len: 1, crest: 658, sag: 120, ssd: (vMs) => { const v = vMs * 3.6; return 0.278 * v * 2.5 + (0.039 * v * v) / 3.4; } },
};

/** Station text: 2 560 ft → "25+60.00" (US) or 1 250 m → "1+250.000" (metric). */
export function stationText(m, system) {
  const neg = m < 0;
  if (system === 'us') {
    const ft = Math.round((Math.abs(m) / FT) * 100) / 100;
    const h = Math.floor(ft / 100 + 1e-9);
    return `${neg ? '−' : ''}${h}+${(ft - h * 100).toFixed(2).padStart(5, '0')}`;
  }
  const mm = Math.round(Math.abs(m) * 1000) / 1000;
  const k = Math.floor(mm / 1000 + 1e-12);
  return `${neg ? '−' : ''}${k}+${(mm - k * 1000).toFixed(3).padStart(7, '0')}`;
}

/** Sight distance (in the system's length unit) provided by a curve of length L (same unit) and A in percent. */
export function sightDistance(type, L, A, sys) {
  if (type === 'crest') {
    const s1 = Math.sqrt((L * sys.crest) / A);
    return s1 <= L ? s1 : (L + sys.crest / A) / 2;
  }
  const s1 = (3.5 * L + Math.sqrt(12.25 * L * L + 4 * A * sys.sag * L)) / (2 * A);
  if (s1 <= L) return s1;
  if (2 * A <= 3.5) return null; // the headlight beam never meets the road beyond the curve
  return (L * A + sys.sag) / (2 * A - 3.5);
}

export const schema = {
  id: 'vertical-curve',
  name: 'Vertical curve calculator (crest and sag)',
  category: 'civil',
  summary: 'Parabolic vertical curve: PVC, PVI and PVT stations and elevations, elevation at any station, high or low point, K value and AASHTO sight distance.',
  related: ['slope', 'earthwork-volume', 'traverse', 'latlon-utm'],
  assumptions: [
    'The curve is a symmetrical parabola, half its length on each side of the PVI, with stations measured horizontally. Unsymmetrical curves need two parabolas and are not covered.',
    'Grades are in percent, positive uphill in the direction of increasing stations.',
    'Sight distance uses the AASHTO Green Book formulas: on crests a 3.5 ft (1.08 m) eye height and a 2.0 ft (0.60 m) object; on sags the headlight criterion with a 2.0 ft (0.60 m) headlight and a 1° upward beam.',
    'The stopping sight distance needed for a design speed uses a 2.5 s reaction time and 11.2 ft/s² (3.4 m/s²) deceleration on level ground; grade corrections and comfort or appearance criteria for sags are not included.',
    'Stations before the PVC or after the PVT take the elevation of the tangent. On sag curves the AASHTO comfort length A V²/46.5 (A V²/395 in metric) is checked as a warning.',
  ],
  notes: [
    'Verification 2026-11-08: g1 = +3 %, g2 = −2 %, L = 600 ft, PVI at 25+00 and 500.00 ft gives PVC 22+00 at 491.00 ft, PVT 28+00 at 494.00 ft, 495.33 ft at 24+00, high point at 25+60 and 496.40 ft, K = 120 ft and a sight distance of 508.9 ft against 423.7 ft needed at 50 mph. Checked by hand.',
  ],
  sources: [
    'AASHTO, A Policy on Geometric Design of Highways and Streets, 7th ed. (2018), section 3.2.2 Stopping Sight Distance and section 3.4.6 Vertical Curves (crest and sag length formulas, K = L/A)',
    'Ghilani, C.D. and Wolf, P.R., Elementary Surveying: An Introduction to Geomatics, 13th ed., ch. 25 Vertical Curves (equal-tangent parabolic curves, high and low points)',
  ],
  inputs: [
    { id: 'system', label: 'Station format and AASHTO units', type: 'select', default: 'us', options: [{ value: 'us', label: 'US customary: 100 ft stations (25+60.00)' }, { value: 'metric', label: 'Metric: kilometre stations (1+250.000)' }] },
    { id: 'g1', label: 'Grade in, g1', group: 'ratio', unit: 'frac', display: 'pct', default: 0.03, min: -0.3, max: 0.3 },
    { id: 'g2', label: 'Grade out, g2', group: 'ratio', unit: 'frac', display: 'pct', default: -0.02, min: -0.3, max: 0.3 },
    { id: 'length_m', label: 'Length of curve L (horizontal)', group: 'length', unit: 'm', display: 'ft', default: 182.88, min: 1, max: 10000 },
    { id: 'pvi_station_m', label: 'PVI station (as a distance, e.g. 25+00 = 2 500 ft)', group: 'length', unit: 'm', display: 'ft', default: 762, min: 0, max: 1e6 },
    { id: 'pvi_elev_m', label: 'PVI elevation', group: 'length', unit: 'm', display: 'ft', default: 152.4, min: -1000, max: 10000 },
    { id: 'station_m', label: 'Station to find the elevation at', group: 'length', unit: 'm', display: 'ft', default: 731.52, min: 0, max: 1e6 },
    { id: 'interval_m', label: 'Station interval for the table', group: 'length', unit: 'm', display: 'ft', default: 30.48, min: 0.1, max: 10000 },
    { id: 'speed_m_s', label: 'Design speed for the sight distance check (0 = none)', group: 'speed', unit: 'm_s', display: 'mph', default: 22.352, min: 0, max: 60 },
  ],
  outputs: [
    { id: 'curve_type', label: 'Type of curve', type: 'text' },
    { id: 'pvc_station', label: 'PVC station', type: 'text' },
    { id: 'pvc_elev_m', label: 'PVC elevation', group: 'length', unit: 'm', display: 'ft', decimals: 2 },
    { id: 'pvt_station', label: 'PVT station', type: 'text' },
    { id: 'pvt_elev_m', label: 'PVT elevation', group: 'length', unit: 'm', display: 'ft', decimals: 2 },
    { id: 'elev_m', label: 'Elevation at the chosen station', group: 'length', unit: 'm', display: 'ft', decimals: 2 },
    { id: 'grade_at', label: 'Grade at the chosen station', group: 'ratio', unit: 'frac', display: 'pct', decimals: 3 },
    { id: 'turn_station', label: 'High or low point station', type: 'text' },
    { id: 'turn_elev_m', label: 'High or low point elevation', group: 'length', unit: 'm', display: 'ft', decimals: 2 },
    { id: 'a_pct', label: 'Algebraic difference of grades A (percent)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'k_m', label: 'K = L/A (length per 1 % change of grade)', group: 'length', unit: 'm', display: 'ft', decimals: 1 },
    { id: 'sight_m', label: 'Stopping sight distance the curve provides (AASHTO)', group: 'length', unit: 'm', display: 'ft', decimals: 1 },
    { id: 'ssd_m', label: 'Stopping sight distance needed at the design speed', group: 'length', unit: 'm', display: 'ft', decimals: 1 },
    { id: 'sight_check', label: 'Sight distance check', type: 'text' },
    { id: 'table', label: 'Elevations along the curve', type: 'table' },
  ],
  example: {
    inputs: { system: 'us', g1: [3, 'pct'], g2: [-2, 'pct'], length_m: [600, 'ft'], pvi_station_m: [2500, 'ft'], pvi_elev_m: [500, 'ft'], station_m: [2400, 'ft'], speed_m_s: [50, 'mph'] },
    results: { pvc_elev_m: '491.00 ft', pvt_elev_m: '494.00 ft', elev_m: '495.33 ft', turn_elev_m: '496.40 ft', k_m: '120.0 ft', sight_m: '508.9 ft', ssd_m: '423.7 ft' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.system, ['us', 'metric'], 'system', 'Station format');
  const sys = SYSTEMS[x.system];
  const g1 = assertRange(x.g1, -0.3, 0.3, 'g1', 'Grade in g1');
  const g2 = assertRange(x.g2, -0.3, 0.3, 'g2', 'Grade out g2');
  if (Math.abs(g2 - g1) < 1e-9) throw new Error('Grade out g2: it equals the grade in, so no vertical curve is needed.');
  const L = assertPositive(x.length_m, 'length_m', 'Length of curve L');
  const pvi = assertNonNegative(x.pvi_station_m, 'pvi_station_m', 'PVI station');
  const yPvi = assertRange(x.pvi_elev_m, -1000, 10000, 'pvi_elev_m', 'PVI elevation');
  const sta = assertNonNegative(x.station_m, 'station_m', 'Station');
  const step = assertPositive(x.interval_m, 'interval_m', 'Station interval');
  const v = assertRange(x.speed_m_s, 0, 60, 'speed_m_s', 'Design speed');
  const pvc = pvi - L / 2;
  if (pvc < -1e-9) throw new Error('PVI station: it must be at least half the curve length, so that the PVC station is not negative.');
  const yPvc = yPvi - g1 * (L / 2);
  const yPvt = yPvi + g2 * (L / 2);
  const r = (g2 - g1) / L;
  const elevAt = (s) => {
    if (s <= pvc) return yPvc + g1 * (s - pvc);
    if (s >= pvc + L) return yPvt + g2 * (s - pvc - L);
    const d = s - pvc;
    return yPvc + g1 * d + (r * d * d) / 2;
  };
  const gradeAt = (s) => (s <= pvc ? g1 : s >= pvc + L ? g2 : g1 + r * (s - pvc));
  const crest = g2 < g1;
  const A = Math.abs(g2 - g1) * 100;
  const xTurn = -g1 / r;
  const hasTurn = xTurn >= 0 && xTurn <= L;
  const lenU = L / sys.len;
  const sightU = sightDistance(crest ? 'crest' : 'sag', lenU, A, sys);
  const sight = sightU === null ? null : sightU * sys.len;
  const ssd = v > 0 ? sys.ssd(v) : null;
  const unitLabel = x.system === 'us' ? 'ft' : 'm';
  let check = 'No design speed entered.';
  if (ssd !== null) {
    if (sight === null || sight >= ssd) check = `Adequate: the curve provides ${sight === null ? 'unlimited headlight' : `${(sight / sys.len).toFixed(1)} ${unitLabel} of`} sight distance against ${(ssd / sys.len).toFixed(1)} ${unitLabel} needed.`;
    else check = `Not adequate: ${(sight / sys.len).toFixed(1)} ${unitLabel} provided, ${(ssd / sys.len).toFixed(1)} ${unitLabel} needed. Lengthen the curve to L ≥ ${(((crest ? sightLengthCrest(ssd / sys.len, A, sys) : sightLengthSag(ssd / sys.len, A, sys))) || 0).toFixed(0)} ${unitLabel}.`;
  }
  const warnings = [];
  if (sta < pvc || sta > pvc + L) warnings.push('The chosen station is outside the curve; its elevation is on the tangent.');
  if (!crest && v > 0) {
    // AASHTO comfort criterion for sag curves: L = A V² / 46.5 (ft, mph) or A V² / 395 (m, km/h)
    const lComfort = x.system === 'us' ? (A * (v / 0.44704) ** 2) / 46.5 : (A * (v * 3.6) ** 2) / 395;
    if (lenU < lComfort) warnings.push(`The sag curve is shorter than the AASHTO comfort length A V²/46.5 (A V²/395 in metric), ${lComfort.toFixed(0)} ${x.system === 'us' ? 'ft' : 'm'}.`);
  }
  // table
  const dec = x.system === 'us' ? 2 : 3;
  const f = (m) => (m / sys.len).toFixed(dec);
  const stations = new Set([pvc, pvi, pvc + L]);
  const first = Math.ceil((pvc + 1e-9) / step) * step;
  const nRows = Math.floor((pvc + L - first) / step) + 1;
  if (nRows > 400) throw new Error('Station interval for the table: it gives more than 400 rows; choose a larger interval.');
  for (let k = 0; k < nRows; k += 1) stations.add(first + k * step);
  if (hasTurn) stations.add(pvc + xTurn);
  const sorted = [...stations].filter((s) => s >= pvc - 1e-9 && s <= pvc + L + 1e-9).sort((a, b) => a - b)
    .filter((s, i, arr) => i === 0 || s - arr[i - 1] > 1e-6);
  const name = (s) => {
    if (Math.abs(s - pvc) < 1e-6) return 'PVC';
    if (Math.abs(s - pvc - L) < 1e-6) return 'PVT';
    if (hasTurn && Math.abs(s - pvc - xTurn) < 1e-6) return crest ? 'High point' : 'Low point';
    if (Math.abs(s - pvi) < 1e-6) return 'PVI (on the curve)';
    return '';
  };
  const rows = sorted.map((s) => {
    const d = s - pvc;
    return [name(s), stationText(s, x.system), f(d), f(yPvc + g1 * d), f((r * d * d) / 2), f(elevAt(s)), `${(gradeAt(s) * 100).toFixed(3)} %`];
  });
  return {
    outputs: {
      curve_type: crest ? 'Crest curve (grade decreases)' : 'Sag curve (grade increases)',
      pvc_station: stationText(pvc, x.system),
      pvc_elev_m: yPvc,
      pvt_station: stationText(pvc + L, x.system),
      pvt_elev_m: yPvt,
      elev_m: elevAt(sta),
      grade_at: gradeAt(sta),
      turn_station: hasTurn ? stationText(pvc + xTurn, x.system) : `None on the curve: the ${crest ? 'highest' : 'lowest'} point is at the ${(crest ? yPvc >= yPvt : yPvc <= yPvt) ? 'PVC' : 'PVT'}`,
      turn_elev_m: hasTurn ? yPvc + g1 * xTurn + (r * xTurn * xTurn) / 2 : null,
      a_pct: A,
      k_m: L / A,
      sight_m: sight,
      ssd_m: ssd,
      sight_check: check,
      table: { columns: ['Point', 'Station', `Distance from PVC (${unitLabel})`, `Tangent elevation (${unitLabel})`, `Tangent offset (${unitLabel})`, `Curve elevation (${unitLabel})`, 'Grade'], rows },
    },
    warnings,
  };
}

/** Crest curve length (system unit) for a sight distance S: A S²/C when S < L, else 2S − C/A. */
export function sightLengthCrest(S, A, sys) {
  const l1 = (A * S * S) / sys.crest;
  return l1 >= S ? l1 : Math.max(0, 2 * S - sys.crest / A);
}

/** Sag curve length (system unit) for a headlight sight distance S. */
export function sightLengthSag(S, A, sys) {
  const l1 = (A * S * S) / (sys.sag + 3.5 * S);
  return l1 >= S ? l1 : Math.max(0, 2 * S - (sys.sag + 3.5 * S) / A);
}
