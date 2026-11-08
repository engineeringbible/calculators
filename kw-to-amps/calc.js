/**
 * kw-to-amps/calc.js — current from a load in kW: an electrical load, or a motor from its shaft output and
 * efficiency, for DC, single-phase and three-phase supplies.
 *
 * P_in = P (electrical) or P_shaft / η (motor);  I = P_in / (k V cos φ), k = 1 or √3.
 * Schema units: SI — W, V, A.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';
import { SYSTEMS, systemOptions, currentFromPower, apparentFromReal } from '../shared/power.js';

export const schema = {
  id: 'kw-to-amps',
  name: 'kW to amps',
  category: 'electrical',
  summary: 'Current from kW for single-phase, three-phase and DC loads, including motors from their shaft kW and efficiency, with the power factor.',
  related: ['amps-to-kw', 'watts-to-amps', 'three-phase-power', 'kva-to-amps'],
  assumptions: [
    'An electrical load\'s kW is the power it draws; a motor\'s nameplate kW is its shaft output, so the electrical input is the output divided by the efficiency.',
    'The power factor is the running value at that load; motors at part load have a lower power factor, so their current falls less than their kW.',
    'For three-phase the load is balanced and the voltage is line-to-line.',
  ],
  notes: [
    'Verification 2026-11-07: a 22 kW electrical load at 400 V three-phase and 0.85 draws 37.4 A; a 22 kW motor at 93 % efficiency draws 40.2 A. Checked by hand.',
  ],
  sources: [
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. "Three-phase systems" (I = P / (√3 V_L cos φ))',
    'IEC 60034-1 (motor rating is the mechanical output at the shaft); IEC 60034-30-1 efficiency classes',
  ],
  inputs: [
    { id: 'system', label: 'Supply', type: 'select', default: 'ac3', options: systemOptions() },
    { id: 'load', label: 'The kW are', type: 'select', default: 'electrical', options: [{ value: 'electrical', label: 'Electrical power drawn (heater, load, supply)' }, { value: 'motor', label: 'Motor shaft output (nameplate kW)' }] },
    { id: 'power_w', label: 'Power P', group: 'power', unit: 'W', display: 'kW', default: 22000, min: 0, max: 1e10 },
    { id: 'efficiency', label: 'Motor efficiency η', group: 'ratio', unit: 'frac', display: 'pct', default: 0.93, min: 0.3, max: 1, visibleWhen: { load: 'motor' } },
    { id: 'voltage_v', label: 'Voltage V', group: 'voltage', unit: 'V', default: 400, min: 0.1, max: 1e6 },
    { id: 'power_factor', label: 'Power factor cos φ', group: 'dimensionless', unit: 'none', default: 0.85, min: 0.05, max: 1, visibleWhen: { system: ['ac1', 'ac3'] } },
  ],
  outputs: [
    { id: 'current_a', label: 'Current I', group: 'current', unit: 'A' },
    { id: 'input_w', label: 'Electrical input power', group: 'power', unit: 'W', display: 'kW' },
    { id: 'apparent_va', label: 'Apparent power S', group: 'apparent_power', unit: 'VA', display: 'kVA' },
  ],
  example: {
    inputs: { system: 'ac3', load: 'electrical', power_w: [22, 'kW'], voltage_v: [400, 'V'], power_factor: 0.85 },
    results: { current_a: '37.4 A', apparent_va: '25.9 kVA' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.system, Object.keys(SYSTEMS), 'system', 'Supply');
  assertOneOf(x.load, ['electrical', 'motor'], 'load', 'The kW are');
  const p = assertPositive(x.power_w, 'power_w', 'Power');
  const v = assertPositive(x.voltage_v, 'voltage_v', 'Voltage');
  const pf = x.system === 'dc' ? 1 : assertRange(x.power_factor, 0.05, 1, 'power_factor', 'Power factor');
  const input = x.load === 'motor' ? p / assertRange(x.efficiency, 0.3, 1, 'efficiency', 'Motor efficiency') : p;
  const warnings = [];
  if (x.load === 'motor') warnings.push('This is the full-load running current; direct-on-line starting draws 6 to 8 times as much for a few seconds.');
  return { outputs: { current_a: currentFromPower(x.system, input, v, pf), input_w: input, apparent_va: apparentFromReal(input, pf) }, warnings };
}
