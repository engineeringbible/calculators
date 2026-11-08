/**
 * watts-to-amps/calc.js — current drawn by a load from its power in watts and the voltage, for DC, single-phase and
 * three-phase supplies.
 *
 * DC I = P / V;  single-phase I = P / (V cos φ);  three-phase I = P / (√3 V cos φ).
 * Schema units: SI — W, V, A.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';
import { SYSTEMS, systemOptions, currentFromPower, apparentFromReal } from '../shared/power.js';

export const schema = {
  id: 'watts-to-amps',
  name: 'Watts to amps',
  category: 'electrical',
  summary: 'Amps drawn by a load from its watts and the voltage, for DC, single-phase and three-phase circuits, with the power factor for AC loads.',
  related: ['amps-to-watts', 'kw-to-amps', 'ohms-law', 'cable-sizing'],
  assumptions: [
    'The watts are the real power the load draws from the supply (its input power); for a motor the nameplate gives the shaft output, so divide by its efficiency first.',
    'For AC the current is the RMS value at the stated power factor; heaters, kettles and incandescent lamps are 1, motors 0.75 to 0.9, and electronic loads without power-factor correction can be 0.5 to 0.7.',
    'For three-phase the voltage is the line-to-line voltage and the load is balanced.',
  ],
  notes: [
    'Verification 2026-11-07: a 1500 W kettle draws 6.52 A at 230 V and 12.5 A at 120 V; 3 kW three-phase at 400 V and unity power factor is 4.33 A per line. Checked by hand.',
  ],
  sources: [
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. 2 (P = V I) and ch. "Three-phase systems" (P = √3 V_L I_L cos φ)',
    'IEC 60038:2009 IEC standard voltages (230/400 V; 120/240 V)',
  ],
  inputs: [
    { id: 'system', label: 'Supply', type: 'select', default: 'ac1', options: systemOptions() },
    { id: 'power_w', label: 'Power P', group: 'power', unit: 'W', default: 1500, min: 0, max: 1e10 },
    { id: 'voltage_v', label: 'Voltage V', group: 'voltage', unit: 'V', default: 230, min: 0.1, max: 1e6, help: 'Mains: 230 V in Europe, 120 V in North America; three-phase 400 V or 480 V line-to-line.' },
    { id: 'power_factor', label: 'Power factor cos φ', group: 'dimensionless', unit: 'none', default: 1, min: 0.05, max: 1, visibleWhen: { system: ['ac1', 'ac3'] } },
  ],
  outputs: [
    { id: 'current_a', label: 'Current I', group: 'current', unit: 'A' },
    { id: 'apparent_va', label: 'Apparent power S = P / cos φ', group: 'apparent_power', unit: 'VA' },
  ],
  example: {
    inputs: { system: 'ac1', power_w: [1500, 'W'], voltage_v: [230, 'V'], power_factor: 1 },
    results: { current_a: '6.52 A' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.system, Object.keys(SYSTEMS), 'system', 'Supply');
  const p = assertPositive(x.power_w, 'power_w', 'Power');
  const v = assertPositive(x.voltage_v, 'voltage_v', 'Voltage');
  const pf = x.system === 'dc' ? 1 : assertRange(x.power_factor, 0.05, 1, 'power_factor', 'Power factor');
  const i = currentFromPower(x.system, p, v, pf);
  const warnings = [];
  if (x.system !== 'dc' && v <= 50 && p > 1000) warnings.push('More than 1 kW at extra-low voltage draws a very large current; check the conductor size.');
  if (x.system === 'ac1' && i > 16) warnings.push('More than 16 A single-phase is beyond an ordinary socket outlet in most countries; the load needs a dedicated circuit.');
  return { outputs: { current_a: i, apparent_va: apparentFromReal(p, pf) }, warnings };
}
