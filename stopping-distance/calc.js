/**
 * stopping-distance/calc.js — vehicle stopping distance as perception-reaction distance plus braking distance, with the
 * AASHTO design deceleration or a tire-road friction coefficient, on a level road or a grade.
 *
 * d = v t + v² / (2 g (a/g + G))  (AASHTO Green Book, Section 3.2.2: SSD = 1.47 V t + V² / (30 (a/32.2 ± G)) in US units);
 * with friction a = μ g. Time to stop t + v / a_eff. Schema units: SI — m/s, s, m/s², m.
 */
import { withDefaults, assertOneOf, assertRange } from '../shared/validate.js';

const G = 9.80665;
const MPH = 0.44704;

/** Average sliding (locked-wheel) coefficients of road adhesion, J.Y. Wong, Theory of Ground Vehicles, 2nd ed., p. 26. */
export const SURFACES = {
  dry_asphalt: { mu: 0.75, label: 'Asphalt or concrete, dry (μ 0.75)' },
  wet_asphalt: { mu: 0.45, label: 'Asphalt, wet (μ 0.45 to 0.60; 0.45 used)' },
  wet_concrete: { mu: 0.7, label: 'Concrete, wet (μ 0.70)' },
  gravel: { mu: 0.55, label: 'Gravel (μ 0.55)' },
  earth_dry: { mu: 0.65, label: 'Earth road, dry (μ 0.65)' },
  earth_wet: { mu: 0.4, label: 'Earth road, wet (μ 0.40 to 0.50; 0.40 used)' },
  snow: { mu: 0.15, label: 'Snow, hard-packed (μ 0.15)' },
  ice: { mu: 0.07, label: 'Ice (μ 0.07)' },
};

export const schema = {
  id: 'stopping-distance',
  name: 'Stopping distance calculator',
  category: 'automotive',
  summary: 'Car stopping distance from speed as reaction plus braking distance, with AASHTO design values, road friction for dry, wet, snow or ice, and grade.',
  related: ['tire-size', 'gear-speed', 'quarter-mile', 'slope'],
  assumptions: [
    'Stopping distance is the distance travelled during the perception-reaction time at constant speed plus the braking distance at a constant deceleration: d = v t + v² / (2 (a + g G)).',
    'AASHTO design values: a perception-reaction time of 2.5 s, which covers most drivers including older ones in surprise situations, and a deceleration of 3.4 m/s² (11.2 ft/s²), which most drivers can achieve on wet pavement while keeping control (Green Book, Section 3.2.2).',
    'Friction values are Wong’s average sliding (locked-wheel) coefficients; with ABS and good tires the peak coefficient (0.8 to 0.9 on dry asphalt) can be used, while worn tires and standing water give less.',
    'The grade G is positive uphill and negative downhill, as a decimal of the rise over the run; the term g G is the small-angle form AASHTO uses.',
    'The calculation ignores brake response and pressure build-up beyond the reaction time, aerodynamic drag and load transfer; it is a single-vehicle estimate, not an accident reconstruction.',
  ],
  notes: [
    'Verification 2026-11-08: 60 mph, 2.5 s, 3.4 m/s² on the level: reaction 220.0 ft, braking 347.1 ft, total 567.1 ft (172.9 m); at 45 mph with 11.2 ft/s² it gives 165.0 + 194.5 = 359.5 ft against the Green Book Table 3-1 values 165.4 + 194.4 ≈ 360 ft (the table uses the rounded factor 1.47). Checked by hand.',
  ],
  sources: [
    'AASHTO, A Policy on Geometric Design of Highways and Streets (Green Book), 7th ed. 2018, Section 3.2.2 Stopping sight distance, Table 3-1 (level roadways) and the braking distance on grades',
    'J.Y. Wong, Theory of Ground Vehicles, 2nd ed., Wiley 1993, p. 26: average values of coefficient of road adhesion (peak and sliding)',
  ],
  inputs: [
    { id: 'speed_m_s', label: 'Speed', group: 'speed', unit: 'm_s', display: 'mph', default: 60 * MPH, min: 0.1, max: 120 },
    { id: 'reaction_s', label: 'Perception-reaction time', group: 'time', unit: 's', default: 2.5, min: 0, max: 10, help: 'AASHTO design value 2.5 s; an alert driver who expects to brake reacts faster.' },
    { id: 'method', label: 'Braking from', type: 'select', default: 'decel', options: [
      { value: 'decel', label: 'Deceleration rate (AASHTO 3.4 m/s² = 11.2 ft/s²)' },
      { value: 'surface', label: 'Road surface friction' },
      { value: 'mu', label: 'Friction coefficient μ entered' },
    ] },
    { id: 'decel_m_s2', label: 'Deceleration on a level road', group: 'acceleration', unit: 'm_s2', display: 'ft_s2', default: 3.4, min: 0.1, max: 15, visibleWhen: { method: 'decel' } },
    { id: 'surface', label: 'Road surface', type: 'select', default: 'dry_asphalt', options: Object.entries(SURFACES).map(([value, s]) => ({ value, label: s.label })), visibleWhen: { method: 'surface' } },
    { id: 'mu', label: 'Friction coefficient μ', group: 'dimensionless', unit: 'none', default: 0.7, min: 0.01, max: 1.5, visibleWhen: { method: 'mu' } },
    { id: 'grade', label: 'Road grade (+ uphill, − downhill)', group: 'ratio', unit: 'frac', display: 'pct', default: 0, min: -0.3, max: 0.3 },
  ],
  outputs: [
    { id: 'total_m', label: 'Total stopping distance', group: 'length', unit: 'm', display: 'ft', decimals: 1 },
    { id: 'total_metric_m', label: 'Total stopping distance in metres', group: 'length', unit: 'm', display: 'm', decimals: 1 },
    { id: 'reaction_m', label: 'Reaction distance', group: 'length', unit: 'm', display: 'ft', decimals: 1 },
    { id: 'braking_m', label: 'Braking distance', group: 'length', unit: 'm', display: 'ft', decimals: 1 },
    { id: 'decel_used_m_s2', label: 'Deceleration including the grade', group: 'acceleration', unit: 'm_s2', display: 'ft_s2', decimals: 2 },
    { id: 'time_s', label: 'Time to stop', group: 'time', unit: 's', decimals: 2 },
  ],
  example: {
    inputs: { speed_m_s: [60, 'mph'], reaction_s: [2.5, 's'], method: 'decel', decel_m_s2: [3.4, 'm_s2'], grade: [0, 'pct'] },
    results: { reaction_m: '220.0 ft', braking_m: '347.1 ft', total_m: '567.1 ft', total_metric_m: '172.9 m', time_s: '10.39 s' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.method, ['decel', 'surface', 'mu'], 'method', 'Braking from');
  const v = assertRange(x.speed_m_s, 0.1, 120, 'speed_m_s', 'Speed');
  const t = assertRange(x.reaction_s, 0, 10, 'reaction_s', 'Perception-reaction time');
  const grade = assertRange(x.grade, -0.3, 0.3, 'grade', 'Road grade');
  let a;
  if (x.method === 'decel') a = assertRange(x.decel_m_s2, 0.1, 15, 'decel_m_s2', 'Deceleration');
  else if (x.method === 'surface') a = SURFACES[assertOneOf(x.surface, Object.keys(SURFACES), 'surface', 'Road surface')].mu * G;
  else a = assertRange(x.mu, 0.01, 1.5, 'mu', 'Friction coefficient') * G;
  const aEff = a + G * grade;
  if (!(aEff > 0)) throw new Error('Road grade: the downhill grade is steeper than the friction allows; the vehicle cannot stop on it by braking.');
  const dr = v * t;
  const db = (v * v) / (2 * aEff);
  const warnings = [];
  if (t < 1) warnings.push('A reaction time under 1 s assumes a driver already braking or expecting to; AASHTO designs for 2.5 s.');
  if (a > 0.9 * G) warnings.push('A deceleration above 0.9 g is near the limit of road tires on dry pavement; check the value.');
  return {
    outputs: {
      total_m: dr + db, total_metric_m: dr + db, reaction_m: dr, braking_m: db, decel_used_m_s2: aEff, time_s: t + v / aEff,
    },
    warnings,
  };
}
