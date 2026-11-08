/**
 * kw-to-kva/calc.js — apparent power in kVA needed for a real load in kW at its power factor, with the kvar and the
 * line current, for sizing generators, transformers and UPS units.
 *
 * S = P / cos φ;  Q = S sin φ;  I = S / (√3 V) or S / V.
 * Schema units: SI — W, VA, var, V, A.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';
import { apparentFromReal, reactiveFromReal } from '../shared/power.js';

export const schema = {
  id: 'kw-to-kva',
  name: 'kW to kVA',
  category: 'electrical',
  summary: 'Apparent power in kVA for a load in kW at its power factor, with kvar and the line current, to size a generator, transformer or UPS.',
  related: ['kva-to-kw', 'kva-to-amps', 'generator-load', 'transformer-sizing'],
  assumptions: [
    'The power factor is the overall power factor of the load; for a mix of loads use the combined value (total kW over total kVA), not an average of power factors.',
    'Generators are rated in kVA at 0.8 power factor by convention (ISO 8528-1); the engine limits the kW and the alternator the kVA.',
    'The result is the running load; motor starting, inrush and future growth need margin on top when sizing equipment.',
  ],
  notes: [
    'Verification 2026-11-07: 400 kW at 0.8 power factor needs 500 kVA and 300 kvar, 722 A at 400 V three-phase. Checked by hand.',
  ],
  sources: [
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. "Three-phase systems" (power triangle S = P / cos φ)',
    'ISO 8528-1:2018 Reciprocating internal combustion engine driven alternating current generating sets (rated power at power factor 0.8)',
  ],
  inputs: [
    { id: 'power_w', label: 'Real power P', group: 'power', unit: 'W', display: 'kW', default: 400000, min: 0, max: 1e11 },
    { id: 'power_factor', label: 'Power factor cos φ', group: 'dimensionless', unit: 'none', default: 0.8, min: 0.05, max: 1 },
    { id: 'phases', label: 'Supply, for the current', type: 'select', default: '3', options: [{ value: '3', label: 'Three-phase (line-to-line voltage)' }, { value: '1', label: 'Single-phase' }] },
    { id: 'voltage_v', label: 'Voltage V', group: 'voltage', unit: 'V', default: 400, min: 1, max: 1e6 },
  ],
  outputs: [
    { id: 'apparent_va', label: 'Apparent power S = P / cos φ', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'reactive_var', label: 'Reactive power Q', group: 'reactive_power', unit: 'var', display: 'kvar' },
    { id: 'current_a', label: 'Line current', group: 'current', unit: 'A' },
  ],
  example: {
    inputs: { power_w: [400, 'kW'], power_factor: 0.8, phases: '3', voltage_v: [400, 'V'] },
    results: { apparent_va: '500 kVA', reactive_var: '300 kvar', current_a: '722 A' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(String(x.phases), ['1', '3'], 'phases', 'Supply');
  const p = assertPositive(x.power_w, 'power_w', 'Real power');
  const pf = assertRange(x.power_factor, 0.05, 1, 'power_factor', 'Power factor');
  const v = assertPositive(x.voltage_v, 'voltage_v', 'Voltage');
  const s = apparentFromReal(p, pf);
  const warnings = [];
  if (pf < 0.7) warnings.push('A power factor below 0.7 makes the kVA much larger than the kW; power-factor correction would cut the generator or transformer size.');
  return {
    outputs: { apparent_va: s, reactive_var: reactiveFromReal(p, pf), current_a: s / (String(x.phases) === '3' ? Math.sqrt(3) * v : v) },
    warnings,
  };
}
