/**
 * chip-load/calc.js — chip load (feed per tooth) from feed rate, rpm and flutes, or the feed rate for a target chip load,
 * with the radial chip thinning factor for light radial engagement (a_e < D/2).
 *
 * f_z = v_f / (z n);  v_f = f_z z n.  Engagement angle φ = arccos(1 − 2 a_e/D).
 * RCTF = 1 / √(1 − (1 − 2 a_e/D)²) for a_e < D/2, else 1;  h_ex = f_z / RCTF;  programmed f_z = h_target × RCTF.
 * Schema units: SI — m, rpm, rad; feed rates in in/min or mm/min (chosen with a select).
 */
import { withDefaults, assertOneOf, assertRange, assertInteger, assertPositive } from '../shared/validate.js';

const IN = 0.0254;

/** Radial chip thinning factor for a radial engagement ratio a_e/D (1 at half the diameter and above). */
export function rctf(ratio) {
  if (ratio >= 0.5) return 1;
  return 1 / Math.sqrt(1 - (1 - 2 * ratio) ** 2);
}

export const schema = {
  id: 'chip-load',
  name: 'Chip load calculator with chip thinning',
  category: 'manufacturing',
  summary: 'Chip load per tooth from feed rate, rpm and flutes, or the feed rate for a target chip load, with the radial chip thinning factor for light cuts.',
  related: ['speeds-feeds', 'machining-time', 'surface-finish', 'drill-point-length'],
  assumptions: [
    'Chip load is the feed per tooth, f_z = feed rate / (teeth × rpm); every tooth is assumed to cut equally, with no runout.',
    'At a radial engagement of half the diameter or more, the maximum chip thickness equals the feed per tooth. Below that the chip thins, and the maximum chip thickness is f_z × √(1 − (1 − 2 a_e/D)²).',
    'The chip thinning factor applies to the side of a straight-flute or helical end mill with a square end; ball-nose and chamfer tools also thin the chip axially, which is not included.',
    'Raising the feed by the thinning factor restores the chip thickness, not the cutting force per tooth; check the machine, the holder and the tool maker\'s maximum feed.',
  ],
  notes: [
    'Verification 2026-11-08: a 1/2 in four-flute end mill at 5 000 rpm and 0.05 in radial engagement (10 %) has RCTF = 1/√(1 − 0.8²) = 1.667; for a 0.002 in chip it needs 0.00333 in per tooth and 66.67 in/min instead of 40 in/min. Checked by hand.',
    'Dapra published adjustments: 35 % engagement 1.05 and 5 % engagement +130 % (2.29), both reproduced by the formula.',
  ],
  sources: [
    'Dapra Corporation, Radial chip thinning: radial engagement feed rate adjustment (35 % WOC × 1.05; 5 % WOC +130 %)',
    'Harvey Tool, General Machining Guidelines: IPM = RPM × IPT × T, chip load tables by cutter diameter',
  ],
  inputs: [
    { id: 'mode', label: 'Calculate', type: 'select', default: 'from_chip', options: [{ value: 'from_feed', label: 'Chip load from a feed rate' }, { value: 'from_chip', label: 'Feed rate for a target chip load' }] },
    { id: 'feed_units', label: 'Feed rate units', type: 'select', default: 'ipm', options: [{ value: 'ipm', label: 'in/min (ipm)' }, { value: 'mm_min', label: 'mm/min' }] },
    { id: 'feed_rate', label: 'Feed rate (in the units above)', group: 'dimensionless', unit: 'none', default: 40, min: 0.001, max: 1e6, visibleWhen: { mode: 'from_feed' } },
    { id: 'target_m', label: 'Target chip load (chip thickness)', group: 'length', unit: 'm', display: 'in', default: 0.002 * IN, min: 1e-7, max: 0.005, visibleWhen: { mode: 'from_chip' } },
    { id: 'rpm', label: 'Spindle speed', group: 'rotational_speed', unit: 'rpm', default: 5000, min: 1, max: 200000 },
    { id: 'flutes', label: 'Number of flutes (teeth) z', group: 'dimensionless', unit: 'none', default: 4, min: 1, max: 100, integer: true },
    { id: 'diameter_m', label: 'Cutter diameter D', group: 'length', unit: 'm', display: 'in', default: 0.5 * IN, min: 0.0001, max: 1 },
    { id: 'ae_m', label: 'Radial depth of cut a_e (width of cut, stepover)', group: 'length', unit: 'm', display: 'in', default: 0.05 * IN, min: 1e-6, max: 1 },
  ],
  outputs: [
    { id: 'fz_m', label: 'Feed per tooth f_z (programmed chip load)', group: 'length', unit: 'm', display: 'in' },
    { id: 'hex_m', label: 'Maximum chip thickness h_ex', group: 'length', unit: 'm', display: 'in' },
    { id: 'rctf', label: 'Radial chip thinning factor RCTF', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'ae_ratio', label: 'Radial engagement a_e / D', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'angle_rad', label: 'Engagement angle', group: 'angle', unit: 'rad', display: 'deg' },
    { id: 'feed_ipm', label: 'Feed rate, in/min (ipm)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'feed_mm_min', label: 'Feed rate, mm/min', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'feed_plain_ipm', label: 'Feed rate without thinning correction, in/min', group: 'dimensionless', unit: 'none', decimals: 2 },
  ],
  example: {
    inputs: { mode: 'from_chip', target_m: [0.002, 'in'], rpm: [5000, 'rpm'], flutes: 4, diameter_m: [0.5, 'in'], ae_m: [0.05, 'in'] },
    results: { rctf: '1.667', fz_m: '0.00333 in', feed_ipm: '66.67' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['from_feed', 'from_chip'], 'mode', 'Calculate');
  assertOneOf(x.feed_units, ['ipm', 'mm_min'], 'feed_units', 'Feed rate units');
  const n = assertRange(x.rpm, 1, 200000, 'rpm', 'Spindle speed');
  const z = assertInteger(assertRange(x.flutes, 1, 100, 'flutes', 'Number of flutes'), 'flutes', 'Number of flutes');
  const D = assertRange(x.diameter_m, 0.0001, 1, 'diameter_m', 'Cutter diameter D');
  const ae = assertPositive(x.ae_m, 'ae_m', 'Radial depth of cut a_e');
  if (ae > D) throw new Error('Radial depth of cut a_e: it cannot exceed the cutter diameter.');
  const ratio = ae / D;
  const k = rctf(ratio);
  const perMin = x.feed_units === 'ipm' ? IN : 0.001; // metres per unit of feed rate
  let fz;
  let hex;
  if (x.mode === 'from_feed') {
    const vf = assertPositive(x.feed_rate, 'feed_rate', 'Feed rate') * perMin; // m/min
    fz = vf / (z * n);
    hex = fz / k;
  } else {
    hex = assertRange(x.target_m, 1e-7, 0.005, 'target_m', 'Target chip load');
    fz = hex * k;
  }
  const vf = fz * z * n; // m/min
  const warnings = [];
  if (k > 3) warnings.push('The chip thinning factor is above 3: such light cuts multiply the feed rate; check the tool maker\'s limit and the machine\'s feed.');
  if (fz > 0.1 * D) warnings.push('The feed per tooth is above 10 % of the cutter diameter: check the units of the feed rate.');
  return {
    outputs: {
      fz_m: fz,
      hex_m: hex,
      rctf: k,
      ae_ratio: ratio,
      angle_rad: Math.acos(1 - 2 * ratio),
      feed_ipm: vf / IN,
      feed_mm_min: vf * 1000,
      feed_plain_ipm: (hex * z * n) / IN,
    },
    warnings,
  };
}
