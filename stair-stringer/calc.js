/**
 * stair-stringer/calc.js — straight stairs: number of risers and treads from the total rise, the actual riser
 * height, total run, stringer length, stair angle and the 2R + T comfort rule, checked against the IRC or IBC limits.
 *
 * n = ceil(H / R_max);  R = H / n;  treads = n − 1;  run = treads × T;  stringer = √(H² + run²);  θ = atan(R / T).
 * Schema units: SI — m, rad.
 */
import { withDefaults, assertRange, assertOneOf, assertNonNegative } from '../shared/validate.js';

const IN = 0.0254;

/** Code limits in inches: IRC 2021 R311.7 (dwellings) and IBC 2021 §1011 (other buildings). */
export const CODES = {
  irc: { label: 'IRC 2021 R311.7 (one- and two-family dwellings)', maxRiser: 7.75, minRiser: 0, minTread: 10, headroom: 80, maxFlight: 151 },
  ibc: { label: 'IBC 2021 §1011 (commercial and other buildings)', maxRiser: 7, minRiser: 4, minTread: 11, headroom: 80, maxFlight: 144 },
};

export const schema = {
  id: 'stair-stringer',
  name: 'Stair calculator: risers, treads and stringer',
  category: 'civil',
  summary: 'Number of risers and treads, riser height, total run, stringer length and stair angle from the total rise, checked against IRC or IBC stair limits.',
  related: ['roof-pitch', 'slope', 'concrete-slab', 'concrete-block'],
  assumptions: [
    'A straight flight from floor to floor: the top riser lands on the upper floor, so there is one tread fewer than risers. Winders, spiral stairs and intermediate landings are not covered.',
    'All risers are equal: the total rise is divided by the smallest whole number of risers that keeps each riser at or below the maximum you enter. Measure the rise between finished floor surfaces.',
    'The tread depth is measured horizontally from nosing to nosing; the nosing projection is extra and is not part of the run.',
    'The stringer length is the length along the nosing line, √(rise² + run²); the board must be longer to allow for the cuts at the top and bottom.',
    'Code checks cover riser height, tread depth, headroom and the rise of a flight; width, handrails, guards and nosing rules also apply, and local amendments may differ.',
  ],
  notes: [
    'Verification 2026-11-08: a total rise of 108 in with risers of at most 7.5 in gives 15 risers of 7.2 in and 14 treads of 10 in; total run 140 in, stringer 176.8 in, angle 35.8°, 2R + T = 24.4 in. Checked by hand.',
  ],
  sources: [
    'International Residential Code 2021, R311.7.2 headroom 6 ft 8 in, R311.7.3 rise of a flight 151 in, R311.7.5.1 riser 7¾ in maximum, R311.7.5.2 tread 10 in minimum',
    'International Building Code 2021, §1011.3 headroom 80 in, §1011.5.2 risers 4 to 7 in and treads 11 in minimum, §1011.8 rise of a flight 12 ft',
    "F. Blondel, Cours d'architecture (Paris, 1675): the stride rule, two risers plus one tread equal one pace of 24 pouces; US practice keeps 2R + T between 24 and 25 in",
  ],
  inputs: [
    { id: 'rise_m', label: 'Total rise, finished floor to finished floor', group: 'length', unit: 'm', display: 'in', default: 108 * IN, min: 0.1, max: 10 },
    { id: 'max_riser_m', label: 'Maximum riser height you want', group: 'length', unit: 'm', display: 'in', default: 7.5 * IN, min: 0.08, max: 0.3 },
    { id: 'tread_m', label: 'Tread depth (run per step)', group: 'length', unit: 'm', display: 'in', default: 10 * IN, min: 0.1, max: 0.6 },
    { id: 'code', label: 'Check against', type: 'select', default: 'irc', options: Object.entries(CODES).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'headroom_m', label: 'Headroom available (optional, 0 = not checked)', group: 'length', unit: 'm', display: 'in', default: 0, min: 0, max: 10 },
  ],
  outputs: [
    { id: 'risers', label: 'Number of risers', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'riser_m', label: 'Riser height', group: 'length', unit: 'm', display: 'in', decimals: 3 },
    { id: 'treads', label: 'Number of treads', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'run_m', label: 'Total run', group: 'length', unit: 'm', display: 'in' },
    { id: 'stringer_m', label: 'Stringer length along the nosings', group: 'length', unit: 'm', display: 'in' },
    { id: 'angle_rad', label: 'Stair angle', group: 'angle', unit: 'rad', display: 'deg', decimals: 1 },
    { id: 'comfort_m', label: '2R + T (comfortable: 24 to 25 in)', group: 'length', unit: 'm', display: 'in' },
    { id: 'check', label: 'Code check', type: 'text' },
  ],
  example: {
    inputs: { rise_m: [108, 'in'], max_riser_m: [7.5, 'in'], tread_m: [10, 'in'], code: 'irc', headroom_m: [0, 'in'] },
    results: { risers: '15', riser_m: '7.2 in', treads: '14', run_m: '140 in', stringer_m: '176.8 in', comfort_m: '24.4 in' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.code, Object.keys(CODES), 'code', 'Check against');
  const H = assertRange(x.rise_m, 0.1, 10, 'rise_m', 'Total rise');
  const Rmax = assertRange(x.max_riser_m, 0.08, 0.3, 'max_riser_m', 'Maximum riser height');
  const T = assertRange(x.tread_m, 0.1, 0.6, 'tread_m', 'Tread depth');
  const head = assertNonNegative(x.headroom_m, 'headroom_m', 'Headroom available');
  const code = CODES[x.code];

  const n = Math.max(2, Math.ceil(H / Rmax - 1e-9));
  const R = H / n;
  const treads = n - 1;
  const run = treads * T;
  const stringer = Math.hypot(H, run);
  const angle = Math.atan(R / T);
  const comfort = 2 * R + T;

  const rIn = R / IN;
  const tIn = T / IN;
  const fails = [];
  if (rIn > code.maxRiser + 1e-9) fails.push(`riser ${rIn.toFixed(2)} in exceeds ${code.maxRiser} in`);
  if (rIn < code.minRiser - 1e-9) fails.push(`riser ${rIn.toFixed(2)} in is below ${code.minRiser} in`);
  if (tIn < code.minTread - 1e-9) fails.push(`tread ${tIn.toFixed(2)} in is below ${code.minTread} in`);
  if (head > 0 && head / IN < code.headroom - 1e-9) fails.push(`headroom ${(head / IN).toFixed(1)} in is below ${code.headroom} in (6 ft 8 in)`);
  const flightNote = H / IN > code.maxFlight + 1e-9 ? `; a landing is needed, the rise of one flight is limited to ${code.maxFlight} in` : '';
  const check = fails.length
    ? `Fails ${x.code.toUpperCase()}: ${fails.join('; ')}${flightNote}`
    : `Meets the ${x.code.toUpperCase()} riser and tread limits${head > 0 ? ' and headroom' : ''}${flightNote}`;

  const warnings = [];
  if (comfort / IN < 24 - 1e-9 || comfort / IN > 25 + 1e-9) warnings.push('2R + T is outside 24 to 25 in (610 to 635 mm): the stair will feel steep or long-striding; adjust the riser or tread.');
  if (H / IN > code.maxFlight + 1e-9) warnings.push('The total rise exceeds the code limit for one flight; split the stair with a landing.');
  if (head === 0) warnings.push('Headroom not checked: the code needs 6 ft 8 in (2 032 mm) clear, measured vertically from the nosing line.');
  return {
    outputs: { risers: n, riser_m: R, treads, run_m: run, stringer_m: stringer, angle_rad: angle, comfort_m: comfort, check },
    warnings,
  };
}
