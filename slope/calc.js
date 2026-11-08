/**
 * slope/calc.js — slope as percent grade, angle, ratio (1 in n), rise over run and roof pitch (x in 12), from any one
 * of them, with the slope length and the rise for a given run.
 *
 * grade = rise / run;  θ = atan(grade);  pitch = 12 × grade;  1 in n with n = run / rise;  length = √(run² + rise²).
 * Schema units: SI — m, rad as degrees in the schema, fraction.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

export const schema = {
  id: 'slope',
  name: 'Slope calculator: percent, degrees, ratio and pitch',
  category: 'civil',
  summary: 'Convert slope between percent grade, degrees, ratio 1 in n and roof pitch, or find it from rise and run, with the slope length and height change.',
  related: ['earthwork-volume', 'manning-channel-flow', 'concrete-slab', 'concrete-footing'],
  assumptions: [
    'Slope is rise over horizontal run. Percent grade is that ratio × 100, so 100 % is 45°, not vertical.',
    'Roof pitch is the rise in inches per 12 in of run; a ratio "1 : n" is one unit of rise per n units of run (road and drainage practice). Embankment batters written "n H : 1 V" use the same n.',
    'The slope length is measured along the surface, the length of material for a ramp, roof or pipe.',
  ],
  notes: [
    'Verification 2026-11-07: a rise of 1 m over a 12 m run is 8.33 %, 4.76°, 1 : 12 and 1 in 12 pitch; the ADA ramp limit of 1 : 12 is 8.33 %.',
  ],
  sources: [
    'US Access Board, 2010 ADA Standards for Accessible Design, §405.2 (maximum ramp running slope 1 : 12)',
    'Trigonometry of the right triangle: tan θ = rise / run',
  ],
  inputs: [
    { id: 'mode', label: 'Slope given as', type: 'select', default: 'rise_run', options: [
      { value: 'rise_run', label: 'Rise and run' }, { value: 'percent', label: 'Percent grade' }, { value: 'degrees', label: 'Angle in degrees' },
      { value: 'ratio', label: 'Ratio 1 in n' }, { value: 'pitch', label: 'Roof pitch (inches per 12)' },
    ] },
    { id: 'rise_m', label: 'Rise (vertical)', group: 'length', unit: 'm', default: 1, min: 0, max: 1e6, visibleWhen: { mode: 'rise_run' } },
    { id: 'run_m', label: 'Run (horizontal)', group: 'length', unit: 'm', default: 12, min: 1e-9, max: 1e7 },
    { id: 'percent', label: 'Grade', group: 'ratio', unit: 'frac', display: 'pct', default: 0.05, min: 0, max: 100, visibleWhen: { mode: 'percent' } },
    { id: 'degrees', label: 'Angle', group: 'dimensionless', unit: 'none', default: 30, min: 0, max: 89.99, visibleWhen: { mode: 'degrees' } },
    { id: 'ratio_n', label: 'n in 1 : n (run per unit rise)', group: 'dimensionless', unit: 'none', default: 20, min: 0.01, max: 1e6, visibleWhen: { mode: 'ratio' } },
    { id: 'pitch', label: 'Pitch: rise per 12 of run', group: 'dimensionless', unit: 'none', default: 6, min: 0, max: 100, visibleWhen: { mode: 'pitch' } },
  ],
  outputs: [
    { id: 'grade', label: 'Percent grade', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'degrees_out', label: 'Angle (degrees)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'ratio', label: 'Ratio', type: 'text' },
    { id: 'pitch_out', label: 'Roof pitch', type: 'text' },
    { id: 'rise_out_m', label: 'Rise over the run', group: 'length', unit: 'm' },
    { id: 'length_m', label: 'Slope length along the surface', group: 'length', unit: 'm' },
    { id: 'check', label: 'Typical limits', type: 'text' },
  ],
  example: {
    inputs: { mode: 'rise_run', rise_m: [1, 'm'], run_m: [12, 'm'] },
    results: { grade: '8.33 %', length_m: '12.04 m' },
  },
};

const fmt = (v) => (Math.abs(v - Math.round(v)) < 0.005 ? String(Math.round(v)) : v.toFixed(2));

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['rise_run', 'percent', 'degrees', 'ratio', 'pitch'], 'mode', 'Slope given as');
  const run = assertPositive(x.run_m, 'run_m', 'Run');
  let g;
  switch (x.mode) {
    case 'rise_run': g = assertNonNegative(x.rise_m, 'rise_m', 'Rise') / run; break;
    case 'percent': g = assertRange(x.percent, 0, 100, 'percent', 'Grade'); break;
    case 'degrees': g = Math.tan((assertRange(x.degrees, 0, 89.99, 'degrees', 'Angle') * Math.PI) / 180); break;
    case 'ratio': g = 1 / assertPositive(x.ratio_n, 'ratio_n', 'n in 1 : n'); break;
    default: g = assertNonNegative(x.pitch, 'pitch', 'Pitch') / 12;
  }
  const deg = (Math.atan(g) * 180) / Math.PI;
  let check;
  if (g <= 0.02) check = 'Flat: about the minimum fall for paving and flat roofs to drain (1–2 %).';
  else if (g <= 1 / 20 + 1e-12) check = 'Walkway: at or below 1 : 20 (5 %), not a ramp under the ADA Standards.';
  else if (g <= 1 / 12 + 1e-12) check = 'Within the ADA ramp limit of 1 : 12 (8.33 %).';
  else if (g <= 0.15) check = 'Steeper than an accessible ramp; within the range of steep streets and driveways (up to about 15 %).';
  else if (deg <= 45) check = 'Steep: typical of pitched roofs and embankment batters.';
  else check = 'Very steep: more than 45°, beyond 100 % grade.';
  return {
    outputs: {
      grade: g,
      degrees_out: deg,
      ratio: g > 0 ? `1 : ${fmt(1 / g)}` : 'Level (1 : ∞)',
      pitch_out: `${fmt(12 * g)} in 12`,
      rise_out_m: g * run,
      length_m: run * Math.sqrt(1 + g * g),
      check,
    },
    warnings: [],
  };
}
