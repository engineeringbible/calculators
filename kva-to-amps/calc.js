/**
 * kva-to-amps/calc.js — current from apparent power (kVA) and voltage for single-phase and three-phase supplies, and
 * kVA from current, with the active power at a power factor.
 *
 * Three-phase: I = S / (√3 V_LL);  single-phase: I = S / V;  P = S cos φ.
 * Schema units: SI — VA, V, A, W.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

export const schema = {
  id: 'kva-to-amps',
  name: 'kVA to amps',
  category: 'electrical',
  summary: 'Line current from kVA and voltage for single-phase and three-phase supplies, kVA from amps, and the kW at a given power factor.',
  related: ['three-phase-power', 'transformer-sizing', 'generator-load', 'cable-sizing'],
  assumptions: [
    'The supply is balanced and sinusoidal; for three-phase the voltage is the line-to-line voltage and the current the line current, whatever the connection (star or delta).',
    'Apparent power (kVA) sets the current; the power factor only converts it to active power (kW), so a generator or transformer rated in kVA carries its rated current at any power factor.',
    'For a transformer, the current is the rated current of the winding at the voltage entered; enter the secondary voltage for the secondary current.',
  ],
  notes: [
    'Verification 2026-11-07: 1000 kVA at 400 V three-phase gives 1 443 A; at 0.8 power factor that is 800 kW. 10 kVA at 230 V single-phase is 43.5 A. Checked by hand.',
  ],
  sources: [
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. "Three-phase systems" (S = √3 V_L I_L)',
    'IEC 60076-1:2011 Power transformers, clause 3.4 (rated power and rated current)',
  ],
  inputs: [
    { id: 'mode', label: 'Convert', type: 'select', default: 'to_amps', options: [{ value: 'to_amps', label: 'kVA to amps' }, { value: 'to_kva', label: 'Amps to kVA' }] },
    { id: 'phases', label: 'Supply', type: 'select', default: '3', options: [{ value: '3', label: 'Three-phase (line-to-line voltage)' }, { value: '1', label: 'Single-phase' }] },
    { id: 'apparent_va', label: 'Apparent power S', group: 'apparent_power', unit: 'VA', display: 'kVA', default: 1e6, min: 0, max: 1e10, visibleWhen: { mode: 'to_amps' } },
    { id: 'current_a', label: 'Line current I', group: 'current', unit: 'A', default: 100, min: 0, max: 1e7, visibleWhen: { mode: 'to_kva' } },
    { id: 'voltage_v', label: 'Voltage V', group: 'voltage', unit: 'V', default: 400, min: 1, max: 1e6 },
    { id: 'power_factor', label: 'Power factor cos φ (for kW)', group: 'dimensionless', unit: 'none', default: 0.8, min: 0.05, max: 1 },
  ],
  outputs: [
    { id: 'current_out_a', label: 'Line current I', group: 'current', unit: 'A' },
    { id: 'apparent_out_va', label: 'Apparent power S', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'active_w', label: 'Active power P = S cos φ', group: 'power', unit: 'W', display: 'kW' },
    { id: 'reactive_var', label: 'Reactive power Q', group: 'reactive_power', unit: 'var', display: 'kvar' },
  ],
  example: {
    inputs: { mode: 'to_amps', phases: '3', apparent_va: [1000, 'kVA'], voltage_v: [400, 'V'], power_factor: 0.8 },
    results: {
      current_out_a: '1 443 A',
      active_w: '800 kW',
    },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['to_amps', 'to_kva'], 'mode', 'Convert');
  assertOneOf(String(x.phases), ['1', '3'], 'phases', 'Supply');
  const voltage = assertPositive(x.voltage_v, 'voltage_v', 'Voltage');
  const pf = assertRange(x.power_factor, 0.05, 1, 'power_factor', 'Power factor');
  const k = String(x.phases) === '3' ? Math.sqrt(3) * voltage : voltage;
  let s;
  let i;
  if (x.mode === 'to_amps') {
    s = assertPositive(x.apparent_va, 'apparent_va', 'Apparent power');
    i = s / k;
  } else {
    i = assertPositive(x.current_a, 'current_a', 'Line current');
    s = i * k;
  }
  const warnings = [];
  if (i > 4000) warnings.push('Above about 4000 A a low-voltage busbar or several parallel cables are needed; check the switchgear rating.');
  return {
    outputs: { current_out_a: i, apparent_out_va: s, active_w: s * pf, reactive_var: s * Math.sqrt(1 - pf * pf) },
    warnings,
  };
}
