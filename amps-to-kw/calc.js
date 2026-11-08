/**
 * amps-to-kw/calc.js — real power in kW from a measured or rated current, for three-phase, single-phase and DC
 * supplies, with the apparent and reactive power.
 *
 * P = k V I cos φ (k = √3 for three-phase, 1 otherwise);  S = k V I;  Q = S sin φ.
 * Schema units: SI — A, V, W, VA, var.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';
import { SYSTEMS, systemOptions, powerFromCurrent, reactiveFromReal } from '../shared/power.js';

export const schema = {
  id: 'amps-to-kw',
  name: 'Amps to kW',
  category: 'electrical',
  summary: 'Real power in kW from current and voltage for three-phase, single-phase and DC circuits, with kVA and kvar at the power factor.',
  related: ['kw-to-amps', 'amps-to-watts', 'kva-to-amps', 'generator-load'],
  assumptions: [
    'The current is the RMS line current, measured or rated; for three-phase the load is balanced and the voltage is line-to-line. With unbalanced phases, use the average of the three line currents as an estimate.',
    'The power factor is the displacement power factor at that load; a clamp meter reading current alone cannot tell the kW without it.',
    'Harmonic currents from drives and rectifiers add to the RMS current without adding real power, so for those loads this overstates the kW.',
  ],
  notes: [
    'Verification 2026-11-07: 100 A at 400 V three-phase and 0.8 power factor is 55.4 kW, 69.3 kVA and 41.6 kvar. Checked by hand.',
  ],
  sources: [
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. "Three-phase systems" (P = √3 V_L I_L cos φ, Q = √3 V_L I_L sin φ)',
    'IEEE Std 1459-2010 Definitions for the measurement of electric power quantities (apparent, real, reactive power)',
  ],
  inputs: [
    { id: 'system', label: 'Supply', type: 'select', default: 'ac3', options: systemOptions() },
    { id: 'current_a', label: 'Line current I', group: 'current', unit: 'A', default: 100, min: 0, max: 1e7 },
    { id: 'voltage_v', label: 'Voltage V', group: 'voltage', unit: 'V', default: 400, min: 0.1, max: 1e6 },
    { id: 'power_factor', label: 'Power factor cos φ', group: 'dimensionless', unit: 'none', default: 0.8, min: 0.05, max: 1, visibleWhen: { system: ['ac1', 'ac3'] } },
  ],
  outputs: [
    { id: 'power_w', label: 'Real power P', group: 'power', unit: 'W', display: 'kW' },
    { id: 'apparent_va', label: 'Apparent power S', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'reactive_var', label: 'Reactive power Q', group: 'reactive_power', unit: 'var', display: 'kvar' },
  ],
  example: {
    inputs: { system: 'ac3', current_a: [100, 'A'], voltage_v: [400, 'V'], power_factor: 0.8 },
    results: { power_w: '55.4 kW', apparent_va: '69.3 kVA', reactive_var: '41.6 kvar' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.system, Object.keys(SYSTEMS), 'system', 'Supply');
  const i = assertPositive(x.current_a, 'current_a', 'Line current');
  const v = assertPositive(x.voltage_v, 'voltage_v', 'Voltage');
  const pf = x.system === 'dc' ? 1 : assertRange(x.power_factor, 0.05, 1, 'power_factor', 'Power factor');
  const p = powerFromCurrent(x.system, i, v, pf);
  return { outputs: { power_w: p, apparent_va: p / pf, reactive_var: reactiveFromReal(p, pf) }, warnings: [] };
}
