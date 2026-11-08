/**
 * kva-to-kw/calc.js — real power in kW available from an apparent power rating in kVA at a power factor, with the
 * kvar and the rated line current.
 *
 * P = S cos φ;  Q = S sin φ;  I = S / (√3 V) or S / V.
 * Schema units: SI — VA, W, var, V, A.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

export const schema = {
  id: 'kva-to-kw',
  name: 'kVA to kW',
  category: 'electrical',
  summary: 'Real power in kW from a kVA rating at the power factor, with the kvar and the rated line current of a generator, transformer or UPS.',
  related: ['kw-to-kva', 'kva-to-amps', 'generator-load', 'transformer-sizing'],
  assumptions: [
    'The kVA is the rated or measured apparent power; the kW available depends on the power factor of the load connected, not on the equipment.',
    'For generators the engine also limits the kW: a set rated 500 kVA at 0.8 delivers at most 400 kW even to a unity power factor load (ISO 8528-1).',
    'Harmonics from non-linear loads add current without kW, reducing the kW a kVA rating can carry.',
  ],
  notes: [
    'Verification 2026-11-07: 500 kVA at 0.8 gives 400 kW and 300 kvar; at 400 V three-phase its rated current is 722 A. Checked by hand.',
  ],
  sources: [
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. "Three-phase systems" (P = S cos φ)',
    'ISO 8528-1:2018 Generating sets (rated active power at power factor 0.8)',
  ],
  inputs: [
    { id: 'apparent_va', label: 'Apparent power S', group: 'apparent_power', unit: 'VA', display: 'kVA', default: 500000, min: 0, max: 1e11 },
    { id: 'power_factor', label: 'Power factor cos φ', group: 'dimensionless', unit: 'none', default: 0.8, min: 0.05, max: 1 },
    { id: 'phases', label: 'Supply, for the current', type: 'select', default: '3', options: [{ value: '3', label: 'Three-phase (line-to-line voltage)' }, { value: '1', label: 'Single-phase' }] },
    { id: 'voltage_v', label: 'Voltage V', group: 'voltage', unit: 'V', default: 400, min: 1, max: 1e6 },
  ],
  outputs: [
    { id: 'power_w', label: 'Real power P = S cos φ', group: 'power', unit: 'W', display: 'kW' },
    { id: 'reactive_var', label: 'Reactive power Q', group: 'reactive_power', unit: 'var', display: 'kvar' },
    { id: 'current_a', label: 'Line current at this kVA', group: 'current', unit: 'A' },
  ],
  example: {
    inputs: { apparent_va: [500, 'kVA'], power_factor: 0.8, phases: '3', voltage_v: [400, 'V'] },
    results: { power_w: '400 kW', reactive_var: '300 kvar', current_a: '722 A' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(String(x.phases), ['1', '3'], 'phases', 'Supply');
  const s = assertPositive(x.apparent_va, 'apparent_va', 'Apparent power');
  const pf = assertRange(x.power_factor, 0.05, 1, 'power_factor', 'Power factor');
  const v = assertPositive(x.voltage_v, 'voltage_v', 'Voltage');
  return {
    outputs: {
      power_w: s * pf,
      reactive_var: s * Math.sqrt(1 - pf * pf),
      current_a: s / (String(x.phases) === '3' ? Math.sqrt(3) * v : v),
    },
    warnings: [],
  };
}
