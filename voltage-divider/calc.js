/**
 * voltage-divider/calc.js — output of a two-resistor voltage divider, or the R2 that gives a target output, with the
 * nearest standard resistor, the divider current and power, the effect of a load and the source resistance.
 *
 * V_out = V_in R2 / (R1 + R2);  R2 = R1 V_out / (V_in − V_out);  loaded: R2 → R2 ∥ R_L;  R_th = R1 ∥ R2.
 * Schema units: SI — V, Ω, A, W.
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf } from '../shared/validate.js';
import { nearestStandard } from '../shared/eseries.js';

export const schema = {
  id: 'voltage-divider',
  name: 'Voltage divider',
  category: 'electrical',
  summary: 'Output voltage of a two-resistor divider, or the R2 for a target voltage with the nearest E24 or E96 value, plus current, power and the effect of a load.',
  related: ['ohms-law', 'resistors-series-parallel', 'led-resistor', 'resistor-color-code'],
  assumptions: [
    'The resistors are ideal and linear; their tolerance moves the real output by up to the sum of the two tolerances (about ±10 % of the ratio for 5 % parts in the worst case).',
    'With no load entered, nothing draws current from the output; a load in parallel with R2 lowers the output, which the loaded result shows.',
    'The input is an ideal voltage source with no internal resistance; for DC or for AC at frequencies where stray capacitance is negligible.',
    'A divider sets a voltage, not a supply: it cannot deliver power to a varying load without the output moving, so a regulator is the right part for powering a circuit.',
  ],
  notes: [
    'Verification 2026-11-07: 12 V to 3.3 V with R1 = 10 kΩ needs R2 = 3 793 Ω; the E24 value 3.9 kΩ gives 3.37 V and 0.863 mA, checked by hand.',
    'Design decision: the design mode picks the nearest standard value on a logarithmic scale and reports the output it actually gives, because the exact R2 is rarely a part you can buy.',
  ],
  sources: [
    'Horowitz and Hill, The Art of Electronics, 3rd ed., §1.2.3 (voltage dividers), §1.2.6 (Thévenin equivalent)',
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. 3 (network theorems, potential divider)',
    'IEC 60063:2015 Preferred number series for resistors and capacitors (E24, E96)',
  ],
  inputs: [
    {
      id: 'mode',
      label: 'Task',
      type: 'select',
      default: 'design',
      options: [
        { value: 'output', label: 'Find the output from R1 and R2' },
        { value: 'design', label: 'Find R2 for a target output' },
      ],
    },
    { id: 'vin_v', label: 'Input voltage V_in', group: 'voltage', unit: 'V', default: 12, min: 0, max: 1e5 },
    { id: 'r1_ohm', label: 'Top resistor R1', group: 'resistance', unit: 'ohm', display: 'kohm', default: 10000, min: 0, max: 1e10 },
    { id: 'r2_ohm', label: 'Bottom resistor R2', group: 'resistance', unit: 'ohm', display: 'kohm', default: 3900, min: 0, max: 1e10, visibleWhen: { mode: 'output' } },
    { id: 'vout_target_v', label: 'Target output V_out', group: 'voltage', unit: 'V', default: 3.3, min: 0, max: 1e5, visibleWhen: { mode: 'design' } },
    {
      id: 'series', label: 'Standard values', type: 'select', default: 'E24', visibleWhen: { mode: 'design' },
      options: [{ value: 'E12', label: 'E12 (10 %)' }, { value: 'E24', label: 'E24 (5 %)' }, { value: 'E96', label: 'E96 (1 %)' }],
    },
    { id: 'load_ohm', label: 'Load on the output R_L (0 for none)', group: 'resistance', unit: 'ohm', display: 'kohm', default: 0, min: 0, max: 1e12, help: 'For example the input resistance of the circuit fed by the divider.' },
  ],
  outputs: [
    { id: 'vout_v', label: 'Output voltage V_out (no load)', group: 'voltage', unit: 'V' },
    { id: 'r2_exact_ohm', label: 'Exact R2 for the target', group: 'resistance', unit: 'ohm' },
    { id: 'r2_used_ohm', label: 'R2 used', group: 'resistance', unit: 'ohm', display: 'kohm' },
    { id: 'ratio', label: 'Divider ratio V_out / V_in', group: 'ratio', unit: 'frac', decimals: 4 },
    { id: 'current_a', label: 'Divider current', group: 'current', unit: 'A', display: 'mA' },
    { id: 'p_r1_w', label: 'Power in R1', group: 'power', unit: 'W' },
    { id: 'p_r2_w', label: 'Power in R2', group: 'power', unit: 'W' },
    { id: 'vout_loaded_v', label: 'Output voltage with the load', group: 'voltage', unit: 'V' },
    { id: 'source_ohm', label: 'Source resistance at the output R1 ∥ R2', group: 'resistance', unit: 'ohm', display: 'kohm' },
  ],
  example: {
    inputs: { mode: 'design', vin_v: [12, 'V'], r1_ohm: [10, 'kohm'], vout_target_v: [3.3, 'V'], series: 'E24', load_ohm: [0, 'kohm'] },
    results: {
      r2_exact_ohm: '3 793 Ω',
      r2_used_ohm: '3.9 kΩ',
      vout_v: '3.37 V',
      current_a: '0.863 mA',
    },
  },
};

const parallel = (a, b) => (a * b) / (a + b);

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['output', 'design'], 'mode', 'Task');
  const vin = assertPositive(x.vin_v, 'vin_v', 'Input voltage');
  const r1 = assertPositive(x.r1_ohm, 'r1_ohm', 'Top resistor R1');
  const load = assertNonNegative(x.load_ohm, 'load_ohm', 'Load');
  let r2;
  let r2Exact = null;
  if (x.mode === 'design') {
    assertOneOf(x.series, ['E12', 'E24', 'E96'], 'series', 'Standard values');
    const target = assertPositive(x.vout_target_v, 'vout_target_v', 'Target output');
    if (target >= vin) throw new Error(`Target output must be below the input voltage (${target} V is not below ${vin} V)`);
    r2Exact = (r1 * target) / (vin - target);
    r2 = nearestStandard(r2Exact, x.series);
  } else {
    r2 = assertPositive(x.r2_ohm, 'r2_ohm', 'Bottom resistor R2');
  }
  const current = vin / (r1 + r2);
  const vout = current * r2;
  const r2Loaded = load > 0 ? parallel(r2, load) : null;
  const warnings = [];
  if (load > 0 && load < 10 * r2) warnings.push('The load is less than ten times R2, so it pulls the output down noticeably; buffer the output or lower both resistors.');
  if (current > 0.01) warnings.push('More than 10 mA flows through the divider: check the resistors\' power ratings, or use higher values.');
  return {
    outputs: {
      vout_v: vout,
      r2_exact_ohm: r2Exact,
      r2_used_ohm: r2,
      ratio: r2 / (r1 + r2),
      current_a: current,
      p_r1_w: current * current * r1,
      p_r2_w: current * current * r2,
      vout_loaded_v: r2Loaded === null ? null : (vin * r2Loaded) / (r1 + r2Loaded),
      source_ohm: parallel(r1, r2),
    },
    warnings,
  };
}
