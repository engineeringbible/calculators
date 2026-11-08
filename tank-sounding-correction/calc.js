/**
 * tank-sounding-correction/calc.js — trim and heel correction of a sounding or ullage taken at a sounding pipe that is
 * not at the geometric centre of a rectangular tank: the mean liquid depth, the volume and mass, and the check that
 * the liquid surface stays within the tank (otherwise the wedge formulas apply).
 *
 * mean depth = reading − (L/2 − x_p) × trim/L_BP − y_p × tan(heel);  volume = L B × mean depth (surface fully inside the tank)
 * Schema units: m, degrees, t/m³.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const DEG = Math.PI / 180;

export const schema = {
  id: 'tank-sounding-correction',
  name: 'Tank sounding trim and heel correction',
  category: 'maritime',
  summary: 'Corrected sounding or ullage of a rectangular tank for trim and heel at an off-centre sounding pipe, with volume, mass and the wedge check.',
  related: ['tank-volume', 'bunker-quantity', 'draft-survey', 'hydrostatics', 'fuel-blend-heating'],
  assumptions: [
    'Rectangular (box-shaped) tank of length L along the ship, breadth B and height H; the liquid surface is horizontal while the tank is inclined with the ship by the trim (positive by the stern, as a difference of draughts over L_BP) and the heel angle (positive to starboard); the sounding pipe is vertical in the ship and reads the local liquid depth at its position x_p from the aft bulkhead and y_p from the tank centreline (positive to starboard).',
    'Trim correction: the depth at the pipe differs from the mean depth at the tank centre by (L/2 − x_p) × trim/L_BP — a pipe aft of the centre reads more than the mean when trimmed by the stern; heel correction y_p × tan(heel) likewise — a pipe on the low side reads more; the mean depth is the reading minus both corrections, and the volume is L B × mean depth as long as the surface meets neither the bottom nor the top of the tank (checked), in which case the wedge formulas of the tank\'s calibration tables must be used instead.',
    'Ullage readings are converted with the tank height at the pipe (reading = H − ullage); the datum of the pipe (striking plate height, ullage reference above the tank top) is assumed included in the height entered.',
    'This is the correction the ship\'s sounding tables tabulate per tank for round trims and heels; it is exact for box tanks and a good approximation for prismatic tanks whose plan area does not change with depth, but not for hopper, wing or irregular tanks, where the calibration tables govern.',
    'Mass = volume × density at the liquid temperature (for fuels use the bunker-quantity calculator for the VCF); thermal expansion of the tank, list-induced free-surface effects and sediment are not included.',
  ],
  notes: [
    'Verification 2026-10-31: a 20 × 15 × 12 m tank with the pipe 1 m from the aft bulkhead and 6 m to starboard, 1.0 m trim by the stern on L_BP 180 m and 1° heel to starboard, sounding 6.00 m → trim correction 9 × 1/180 = 0.050 m, heel correction 6 tan 1° = 0.105 m, mean depth 5.845 m, 1 754 m³ (2.6 % less than the uncorrected 1 800 m³) — the order of the corrections printed in sounding tables.',
    'Design decision: signs follow the sounding-table convention (corrections subtracted from the reading when the pipe is on the low side); the page prints both corrections so a hand check against the ship\'s tables is one line.',
  ],
  sources: [
    'E. A. Stokoe, Reed\'s Naval Architecture for Marine Engineers, ch. on tank soundings and the effect of trim and heel',
    'D. R. Derrett, C. B. Barrass, Ship Stability for Masters and Mates, 7th ed., Elsevier 2012 — tank calibration, sounding/ullage corrections for trim and list',
    'ISO 7507-1 / API MPMS Ch. 2 — tank calibration principles (datum, reference height)',
    'UK P&I Club, Bunker and cargo measurement guidance — trim and list corrections of soundings',
  ],
  inputs: [
    { id: 'length_m', label: 'Tank length L (fore–aft)', group: 'length', unit: 'm', default: 20, min: 0.5, max: 60 },
    { id: 'breadth_m', label: 'Tank breadth B (athwartships)', group: 'length', unit: 'm', default: 15, min: 0.5, max: 60 },
    { id: 'height_m', label: 'Tank height H at the pipe', group: 'length', unit: 'm', default: 12, min: 0.5, max: 40 },
    { id: 'pipe_x_m', label: 'Sounding pipe distance from the aft bulkhead x_p', group: 'length', unit: 'm', default: 1, min: 0, max: 60 },
    { id: 'pipe_y_m', label: 'Sounding pipe distance from the tank centreline y_p (+ starboard)', group: 'length', unit: 'm', default: 6, min: -30, max: 30 },
    { id: 'lbp_m', label: 'Length between perpendiculars L_BP', group: 'length', unit: 'm', default: 180, min: 10, max: 450 },
    { id: 'trim_m', label: 'Trim (+ by the stern)', group: 'length', unit: 'm', default: 1.0, min: -10, max: 10 },
    { id: 'heel_deg', label: 'Heel (+ to starboard)', group: 'angle', unit: 'deg', default: 1.0, min: -20, max: 20 },
    { id: 'reading_mode', label: 'Reading taken', type: 'select', default: 'sounding', options: [{ value: 'sounding', label: 'Sounding (liquid depth at the pipe)' }, { value: 'ullage', label: 'Ullage (empty height at the pipe)' }] },
    { id: 'reading_m', label: 'Reading at the pipe', group: 'length', unit: 'm', default: 6.0, min: 0, max: 40 },
    { id: 'density_t_m3', label: 'Liquid density at tank temperature', group: 'density', unit: 't_m3', default: 0.98, min: 0.5, max: 2.5 },
  ],
  outputs: [
    { id: 'depth_at_pipe_m', label: 'Liquid depth at the pipe', group: 'length', unit: 'm' },
    { id: 'trim_angle_deg', label: 'Trim angle atan(trim/L_BP)', group: 'angle', unit: 'deg' },
    { id: 'trim_correction_m', label: 'Trim correction (L/2 − x_p) × trim/L_BP', group: 'length', unit: 'm' },
    { id: 'heel_correction_m', label: 'Heel correction y_p × tan(heel)', group: 'length', unit: 'm' },
    { id: 'mean_depth_m', label: 'Corrected mean depth (at the tank centre)', group: 'length', unit: 'm' },
    { id: 'surface_min_depth_m', label: 'Shallowest liquid depth in the tank', group: 'length', unit: 'm' },
    { id: 'surface_max_depth_m', label: 'Deepest liquid depth in the tank', group: 'length', unit: 'm' },
    { id: 'volume_m3', label: 'Liquid volume', group: 'volume', unit: 'm3' },
    { id: 'volume_uncorrected_m3', label: 'Volume if the reading were taken as the mean depth', group: 'volume', unit: 'm3' },
    { id: 'correction_pct', label: 'Correction as share of the uncorrected volume', group: 'ratio', unit: 'pct' },
    { id: 'mass_t', label: 'Liquid mass', group: 'mass', unit: 't' },
    { id: 'fill_pct', label: 'Fill level', group: 'ratio', unit: 'pct' },
    { id: 'validity', label: 'Surface check', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      trim_correction_m: '0.050 m',
      heel_correction_m: '0.105 m',
      mean_depth_m: '5.845 m',
      surface_max_depth_m: '6.03 m',
      volume_m3: '1 754 m³',
      volume_uncorrected_m3: '1 800 m³',
      correction_pct: '−2.6 %',
      fill_pct: '49 %',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.length_m, 'length_m', 'Tank length');
  assertPositive(i.breadth_m, 'breadth_m', 'Tank breadth');
  assertPositive(i.height_m, 'height_m', 'Tank height');
  assertRange(i.pipe_x_m, 0, i.length_m, 'pipe_x_m', 'Pipe position (fore–aft)');
  assertRange(i.pipe_y_m, -i.breadth_m / 2, i.breadth_m / 2, 'pipe_y_m', 'Pipe position (athwartships)');
  assertPositive(i.lbp_m, 'lbp_m', 'L_BP');
  assertRange(i.trim_m, -0.2 * i.lbp_m, 0.2 * i.lbp_m, 'trim_m', 'Trim');
  assertRange(i.heel_deg, -45, 45, 'heel_deg', 'Heel');
  assertOneOf(i.reading_mode, ['sounding', 'ullage'], 'reading_mode', 'Reading mode');
  assertNonNegative(i.reading_m, 'reading_m', 'Reading');
  assertPositive(i.density_t_m3, 'density_t_m3', 'Density');

  const depthAtPipe = i.reading_mode === 'sounding' ? i.reading_m : i.height_m - i.reading_m;
  if (depthAtPipe < 0) throw new Error('Ullage exceeds the tank height at the pipe');
  const trimSlope = i.trim_m / i.lbp_m;
  const heelTan = Math.tan(i.heel_deg * DEG);
  const trimCorr = (i.length_m / 2 - i.pipe_x_m) * trimSlope;
  const heelCorr = i.pipe_y_m * heelTan;
  const mean = depthAtPipe - trimCorr - heelCorr;
  const halfRangeL = (i.length_m / 2) * Math.abs(trimSlope);
  const halfRangeB = (i.breadth_m / 2) * Math.abs(heelTan);
  const minDepth = mean - halfRangeL - halfRangeB;
  const maxDepth = mean + halfRangeL + halfRangeB;
  const area = i.length_m * i.breadth_m;
  const inside = minDepth >= 0 && maxDepth <= i.height_m;
  const volume = area * Math.max(0, mean);
  const uncorrected = area * depthAtPipe;

  const warnings = [];
  if (minDepth < 0) warnings.push(`The liquid surface meets the tank bottom (shallowest depth ${minDepth.toFixed(2)} m < 0): the box formula over-estimates — use the wedge correction of the calibration tables.`);
  if (maxDepth > i.height_m) warnings.push(`The liquid surface meets the tank top (deepest depth ${maxDepth.toFixed(2)} m > ${i.height_m} m): the tank is pressed up on one side — use the calibration tables.`);
  if (Math.abs(trimCorr) + Math.abs(heelCorr) > 0.5) warnings.push('Corrections above 0.5 m: large trim or heel for a sounding — re-check the ship\'s condition or wait for an even keel.');
  if (mean < 0.3) warnings.push('Mean depth below 0.3 m: soundings near the bottom are dominated by the striking plate, sediment and structure; low-level accuracy is poor.');
  warnings.push('Exact for box-shaped tanks and good for prismatic tanks; hopper, wing and irregular tanks need their calibration tables.');
  warnings.push('Mass uses the density entered at tank temperature: apply the volume correction factor for fuels (bunker-quantity calculator).');

  return {
    outputs: {
      depth_at_pipe_m: depthAtPipe,
      trim_angle_deg: Math.atan(trimSlope) / DEG,
      trim_correction_m: trimCorr,
      heel_correction_m: heelCorr,
      mean_depth_m: mean,
      surface_min_depth_m: minDepth,
      surface_max_depth_m: maxDepth,
      volume_m3: volume,
      volume_uncorrected_m3: uncorrected,
      correction_pct: uncorrected > 0 ? ((volume - uncorrected) / uncorrected) * 100 : 0,
      mass_t: volume * i.density_t_m3,
      fill_pct: (mean / i.height_m) * 100,
      validity: inside ? `OK — surface between ${minDepth.toFixed(2)} and ${maxDepth.toFixed(2)} m, fully inside the ${i.height_m} m tank: box formula exact` : 'WEDGE — the surface intersects the tank bottom or top; use the calibration tables',
    },
    warnings,
  };
}
