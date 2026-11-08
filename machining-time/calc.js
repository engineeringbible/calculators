/**
 * machining-time/calc.js — cutting time of turning, facing, drilling and milling passes from the length of cut, the
 * approach and overtravel, the feed and the spindle speed, and the job time for a batch with set-up and handling.
 *
 * t_pass = L_travel / v_f;  v_f = f n (turning, facing, drilling) or f_z z n (milling).
 * L_travel: turning and milling L + allowance; facing (D − d)/2 + allowance; drilling depth + D / (2 tan(θ/2)) + allowance.
 * Job time = set-up + parts × (passes × t_pass + handling).  Schema units: SI — m, rpm, s.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive, assertNonNegative, assertInteger } from '../shared/validate.js';

const IN = 0.0254;

export const schema = {
  id: 'machining-time',
  name: 'Machining time calculator (turning, facing, drilling, milling)',
  category: 'manufacturing',
  summary: 'Cutting time per pass and per part for turning, facing, drilling and milling from length, feed and rpm, and total job time with set-up and handling.',
  related: ['speeds-feeds', 'chip-load', 'drill-point-length', 'oee-takt'],
  assumptions: [
    'The tool feeds at a constant rate over the whole travel: the length of cut plus the approach and overtravel you enter; rapid moves, tool changes and acceleration are part of the handling time.',
    'Facing runs at a constant spindle speed from the outside diameter to the centre (or to the bore); a lathe with constant surface speed raises the rpm towards the centre and finishes sooner.',
    'Drilling travel adds the length of the drill point, D / (2 tan(θ/2)), so that the full diameter reaches the stated depth; add the breakthrough allowance for a through hole.',
    'In milling the travel is the path length of the cutter centre; for a face mill to clear the part completely the overtravel must include the cutter diameter.',
  ],
  notes: [
    'Verification 2026-11-08: turning 100 mm plus 3 mm of approach at 0.2 mm/rev and 1 000 rpm takes 0.515 min a pass; two passes are 1.03 min, and 50 parts with 30 min set-up and 0.5 min handling each take 106.5 min. Checked by hand.',
  ],
  sources: [
    'Groover, M. P., Fundamentals of Modern Manufacturing, Wiley, chapter on machining operations: T_m = L / f_r with f_r = N f (turning, drilling) and T_m = (L + A) / f_r with f_r = N n_t f (milling)',
    'Kalpakjian, S. and Schmid, S. R., Manufacturing Engineering and Technology, 7th ed., Pearson: cutting time t = l / (f N) for turning and drilling',
  ],
  inputs: [
    { id: 'operation', label: 'Operation', type: 'select', default: 'turning', options: [{ value: 'turning', label: 'Turning (along the length)' }, { value: 'facing', label: 'Facing (across the end)' }, { value: 'drilling', label: 'Drilling' }, { value: 'milling', label: 'Milling' }] },
    { id: 'length_m', label: 'Length of cut L', group: 'length', unit: 'm', display: 'in', default: 4 * IN, min: 0, max: 100, visibleWhen: { operation: ['turning', 'milling'] } },
    { id: 'outer_m', label: 'Outside diameter D', group: 'length', unit: 'm', display: 'in', default: 2 * IN, min: 0.0001, max: 5, visibleWhen: { operation: 'facing' } },
    { id: 'inner_m', label: 'Bore diameter d (0 for solid)', group: 'length', unit: 'm', display: 'in', default: 0, min: 0, max: 5, visibleWhen: { operation: 'facing' } },
    { id: 'drill_m', label: 'Drill diameter', group: 'length', unit: 'm', display: 'in', default: 0.5 * IN, min: 0.0001, max: 0.2, visibleWhen: { operation: 'drilling' } },
    { id: 'depth_m', label: 'Hole depth at full diameter', group: 'length', unit: 'm', display: 'in', default: 1 * IN, min: 0, max: 5, visibleWhen: { operation: 'drilling' } },
    { id: 'point_deg', label: 'Drill point angle', group: 'angle', unit: 'deg', default: 118, min: 60, max: 180, visibleWhen: { operation: 'drilling' } },
    { id: 'allow_m', label: 'Approach and overtravel', group: 'length', unit: 'm', display: 'in', default: 0.1 * IN, min: 0, max: 10 },
    { id: 'f_rev_m', label: 'Feed per revolution f', group: 'length', unit: 'm', display: 'in', default: 0.008 * IN, min: 1e-6, max: 0.01, visibleWhen: { operation: ['turning', 'facing', 'drilling'] } },
    { id: 'fz_m', label: 'Feed per tooth f_z', group: 'length', unit: 'm', display: 'in', default: 0.003 * IN, min: 1e-7, max: 0.005, visibleWhen: { operation: 'milling' } },
    { id: 'teeth', label: 'Number of teeth z', group: 'dimensionless', unit: 'none', default: 4, min: 1, max: 100, integer: true, visibleWhen: { operation: 'milling' } },
    { id: 'rpm', label: 'Spindle speed', group: 'rotational_speed', unit: 'rpm', default: 800, min: 1, max: 200000 },
    { id: 'passes', label: 'Number of passes', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 1000, integer: true },
    { id: 'parts', label: 'Parts in the batch', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 1e7, integer: true },
    { id: 'setup_s', label: 'Set-up time for the batch', group: 'time', unit: 's', display: 'min', default: 0, min: 0, max: 1e7 },
    { id: 'handling_s', label: 'Load, unload and rapid moves per part', group: 'time', unit: 's', display: 'min', default: 0, min: 0, max: 1e6 },
  ],
  outputs: [
    { id: 'travel_m', label: 'Feed travel per pass', group: 'length', unit: 'm', display: 'in' },
    { id: 'feed_ipm', label: 'Feed rate, in/min', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'feed_mm_min', label: 'Feed rate, mm/min', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'pass_s', label: 'Cutting time per pass', group: 'time', unit: 's', display: 'min' },
    { id: 'part_s', label: 'Cutting time per part', group: 'time', unit: 's', display: 'min' },
    { id: 'cycle_s', label: 'Floor-to-floor time per part (cutting + handling)', group: 'time', unit: 's', display: 'min' },
    { id: 'job_s', label: 'Total job time with set-up', group: 'time', unit: 's', display: 'h' },
    { id: 'per_hour', label: 'Parts per hour after set-up', group: 'dimensionless', unit: 'none', decimals: 1 },
  ],
  example: {
    inputs: { operation: 'turning', length_m: [100, 'mm'], allow_m: [3, 'mm'], f_rev_m: [0.2, 'mm'], rpm: [1000, 'rpm'], passes: 2, parts: 50, setup_s: [30, 'min'], handling_s: [0.5, 'min'] },
    results: { pass_s: '0.515 min', part_s: '1.03 min', job_s: '106.5 min' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.operation, ['turning', 'facing', 'drilling', 'milling'], 'operation', 'Operation');
  const n = assertRange(x.rpm, 1, 200000, 'rpm', 'Spindle speed');
  const allow = assertNonNegative(x.allow_m, 'allow_m', 'Approach and overtravel');
  const passes = assertInteger(assertRange(x.passes, 1, 1000, 'passes', 'Number of passes'), 'passes', 'Number of passes');
  const parts = assertInteger(assertRange(x.parts, 1, 1e7, 'parts', 'Parts in the batch'), 'parts', 'Parts in the batch');
  const setup = assertNonNegative(x.setup_s, 'setup_s', 'Set-up time');
  const handling = assertNonNegative(x.handling_s, 'handling_s', 'Handling time');
  let travel;
  let fRev;
  const warnings = [];
  if (x.operation === 'milling') {
    const z = assertInteger(assertRange(x.teeth, 1, 100, 'teeth', 'Number of teeth'), 'teeth', 'Number of teeth');
    fRev = assertRange(x.fz_m, 1e-7, 0.005, 'fz_m', 'Feed per tooth') * z;
    travel = assertNonNegative(x.length_m, 'length_m', 'Length of cut') + allow;
  } else {
    fRev = assertRange(x.f_rev_m, 1e-6, 0.01, 'f_rev_m', 'Feed per revolution');
    if (x.operation === 'turning') travel = assertNonNegative(x.length_m, 'length_m', 'Length of cut') + allow;
    else if (x.operation === 'facing') {
      const D = assertPositive(x.outer_m, 'outer_m', 'Outside diameter');
      const d = assertNonNegative(x.inner_m, 'inner_m', 'Bore diameter');
      if (d >= D) throw new Error('Bore diameter d: it must be smaller than the outside diameter.');
      travel = (D - d) / 2 + allow;
      warnings.push('Facing at a constant rpm: the surface speed falls to zero at the centre; with constant surface speed the face is finished sooner.');
    } else {
      const D = assertRange(x.drill_m, 0.0001, 0.2, 'drill_m', 'Drill diameter');
      const theta = (assertRange(x.point_deg, 60, 180, 'point_deg', 'Drill point angle') * Math.PI) / 180;
      travel = assertNonNegative(x.depth_m, 'depth_m', 'Hole depth') + D / (2 * Math.tan(theta / 2)) + allow;
    }
  }
  if (travel <= 0) throw new Error('Length of cut: the tool travel is zero; enter a length or an approach.');
  const vf = (fRev * n) / 60; // m/s
  const tPass = travel / vf;
  const tPart = tPass * passes;
  const cycle = tPart + handling;
  return {
    outputs: {
      travel_m: travel,
      feed_ipm: (vf * 60) / IN,
      feed_mm_min: vf * 60000,
      pass_s: tPass,
      part_s: tPart,
      cycle_s: cycle,
      job_s: setup + parts * cycle,
      per_hour: 3600 / cycle,
    },
    warnings,
  };
}
