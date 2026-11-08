/**
 * oee-takt/calc.js — overall equipment effectiveness OEE = availability × performance × quality from shift data, takt
 * time from the available time and the demand, and the comparison of the cycle time with takt.
 *
 * Planned production time = shift − planned breaks;  run time = planned − downtime.
 * A = run / planned;  P = ideal cycle × total count / run;  Q = good / total;  OEE = A P Q = ideal cycle × good / planned.
 * Takt = planned production time / demand.  Schema units: SI — s; counts as plain numbers.
 */
import { withDefaults, assertNonNegative, assertPositive, assertInteger } from '../shared/validate.js';

export const schema = {
  id: 'oee-takt',
  name: 'OEE and takt time calculator',
  category: 'manufacturing',
  summary: 'OEE from availability, performance and quality using shift times and part counts, plus takt time from demand and a cycle-time check against it.',
  related: ['machining-time', 'reliability', 'speeds-feeds', 'injection-clamp-tonnage'],
  assumptions: [
    'Planned production time is the shift minus planned stops (breaks, meals, planned maintenance); downtime is every unplanned stop and changeover inside it.',
    'Performance compares the ideal (fastest sustainable) cycle time with the run time; a value above 100 % means the ideal cycle time is set too slow.',
    'Quality counts only parts good the first time; reworked parts count as rejects.',
    'Takt time is the planned production time divided by the customer demand for the same period; a line meets demand when its planned time per good part is at or below takt.',
  ],
  notes: [
    'Verification 2026-11-08: the oee.com example (480 min shift, 60 min of breaks, 47 min downtime, 1.0 s ideal cycle, 19 271 parts, 423 rejects) gives availability 88.81 %, performance 86.11 %, quality 97.80 % and OEE 74.79 %; for a demand of 18 000 parts takt is 1.40 s. Checked by hand.',
  ],
  sources: [
    'Vorne Industries, OEE.com, Calculate OEE: definitions and worked example (availability 88.81 %, performance 86.11 %, quality 97.80 %, OEE 74.79 %)',
    'ISO 22400-2:2014 Automation systems and integration — Key performance indicators for manufacturing operations management, Part 2: OEE index = availability × effectiveness × quality ratio',
    'Nakajima, S., Introduction to TPM: Total Productive Maintenance, Productivity Press, 1988 (the six big losses and OEE)',
  ],
  inputs: [
    { id: 'shift_s', label: 'Shift length', group: 'time', unit: 's', display: 'min', default: 480 * 60, min: 1, max: 1e7 },
    { id: 'breaks_s', label: 'Planned stops (breaks, meals, planned maintenance)', group: 'time', unit: 's', display: 'min', default: 60 * 60, min: 0, max: 1e7 },
    { id: 'downtime_s', label: 'Unplanned downtime and changeovers', group: 'time', unit: 's', display: 'min', default: 47 * 60, min: 0, max: 1e7 },
    { id: 'ideal_cycle_s', label: 'Ideal cycle time per part', group: 'time', unit: 's', display: 's', default: 1, min: 1e-4, max: 1e6 },
    { id: 'total_count', label: 'Total parts made', group: 'dimensionless', unit: 'none', default: 19271, min: 1, max: 1e9, integer: true },
    { id: 'reject_count', label: 'Rejected parts (scrap and rework)', group: 'dimensionless', unit: 'none', default: 423, min: 0, max: 1e9, integer: true },
    { id: 'demand', label: 'Customer demand in the same period (parts)', group: 'dimensionless', unit: 'none', default: 18000, min: 1, max: 1e9, integer: true },
  ],
  outputs: [
    { id: 'planned_s', label: 'Planned production time', group: 'time', unit: 's', display: 'min' },
    { id: 'run_s', label: 'Run time', group: 'time', unit: 's', display: 'min' },
    { id: 'availability', label: 'Availability', group: 'ratio', unit: 'frac', display: 'pct', decimals: 2 },
    { id: 'performance', label: 'Performance', group: 'ratio', unit: 'frac', display: 'pct', decimals: 2 },
    { id: 'quality', label: 'Quality', group: 'ratio', unit: 'frac', display: 'pct', decimals: 2 },
    { id: 'oee', label: 'OEE', group: 'ratio', unit: 'frac', display: 'pct', decimals: 2 },
    { id: 'good_count', label: 'Good parts', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'takt_s', label: 'Takt time', group: 'time', unit: 's', display: 's' },
    { id: 'avg_cycle_s', label: 'Average cycle time while running', group: 'time', unit: 's', display: 's' },
    { id: 'per_good_s', label: 'Planned time per good part', group: 'time', unit: 's', display: 's' },
    { id: 'verdict', label: 'Cycle time against takt', type: 'text' },
  ],
  example: {
    inputs: {},
    results: { availability: '88.81 %', performance: '86.11 %', quality: '97.80 %', oee: '74.79 %', takt_s: '1.40 s' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const shift = assertPositive(x.shift_s, 'shift_s', 'Shift length');
  const breaks = assertNonNegative(x.breaks_s, 'breaks_s', 'Planned stops');
  const down = assertNonNegative(x.downtime_s, 'downtime_s', 'Unplanned downtime');
  const ideal = assertPositive(x.ideal_cycle_s, 'ideal_cycle_s', 'Ideal cycle time');
  const total = assertInteger(assertPositive(x.total_count, 'total_count', 'Total parts made'), 'total_count', 'Total parts made');
  const rejects = assertInteger(assertNonNegative(x.reject_count, 'reject_count', 'Rejected parts'), 'reject_count', 'Rejected parts');
  const demand = assertInteger(assertPositive(x.demand, 'demand', 'Customer demand'), 'demand', 'Customer demand');
  if (breaks >= shift) throw new Error('Planned stops: they must be shorter than the shift.');
  const planned = shift - breaks;
  if (down >= planned) throw new Error('Unplanned downtime: it must be shorter than the planned production time.');
  if (rejects > total) throw new Error('Rejected parts: they cannot exceed the total parts made.');
  const run = planned - down;
  const good = total - rejects;
  const A = run / planned;
  const P = (ideal * total) / run;
  const Q = good / total;
  const takt = planned / demand;
  const perGood = good > 0 ? planned / good : null;
  const warnings = [];
  if (P > 1) warnings.push('Performance is above 100 %: the ideal cycle time is slower than the machine really ran; use the nameplate or best demonstrated cycle time.');
  let verdict;
  if (perGood === null) verdict = 'No good parts: demand cannot be met.';
  else if (perGood <= takt) verdict = `Meets demand: ${perGood.toFixed(3)} s of planned time per good part is within the ${takt.toFixed(3)} s takt (${good} good parts against ${demand}).`;
  else verdict = `Falls short: ${perGood.toFixed(3)} s per good part is above the ${takt.toFixed(3)} s takt; ${demand - good} more good parts are needed, so raise OEE or add time.`;
  if (ideal > takt) warnings.push('The ideal cycle time is longer than takt: even at 100 % OEE one machine cannot meet the demand.');
  return {
    outputs: {
      planned_s: planned,
      run_s: run,
      availability: A,
      performance: P,
      quality: Q,
      oee: A * P * Q,
      good_count: good,
      takt_s: takt,
      avg_cycle_s: run / total,
      per_good_s: perGood,
      verdict,
    },
    warnings,
  };
}
