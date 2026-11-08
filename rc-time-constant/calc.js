/**
 * rc-time-constant/calc.js — time constant, charging and discharging voltage and cutoff frequency of a series
 * resistor-capacitor circuit (RC timer, RC low-pass or high-pass filter).
 *
 * τ = R C;  charging V_C(t) = V_s (1 − e^(−t/τ));  discharging V_C(t) = V_0 e^(−t/τ);  f_c = 1 / (2π R C).
 * Schema units: SI — Ω, F, s, V, Hz.
 */
import { withDefaults, assertPositive, assertNonNegative } from '../shared/validate.js';

export const schema = {
  id: 'rc-time-constant',
  name: 'RC time constant and filter',
  category: 'electrical',
  summary: 'Time constant τ = RC, capacitor voltage while charging or discharging, time to 99 %, and the −3 dB cutoff frequency of an RC filter.',
  related: ['capacitors-series-parallel', 'resistors-series-parallel', 'ohms-law', 'voltage-divider'],
  assumptions: [
    'A single resistor in series with a single capacitor, driven by an ideal step from 0 to V_s (charging) or released from V_s (discharging); the source has no internal resistance of its own unless it is added to R.',
    'The capacitor is ideal: no leakage and no equivalent series resistance; electrolytic capacitors leak, which matters for long timing periods.',
    'The cutoff frequency is the −3 dB point of a first-order RC low-pass or high-pass filter feeding a high-impedance load; a load in parallel with the output lowers the effective resistance.',
  ],
  notes: [
    'Verification 2026-11-07: 10 kΩ and 100 µF give τ = 1.00 s and f_c = 0.159 Hz; at t = τ a 5 V charge reaches 3.16 V (63.2 %), and at 5 τ 99.3 %. Checked by hand.',
  ],
  sources: [
    'Horowitz and Hill, The Art of Electronics, 3rd ed., §1.4.2 (RC circuits: V = V_f (1 − e^(−t/RC))) and §1.7.1 (RC filters, f_3dB = 1/(2π R C))',
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. 10 (transients in RC circuits)',
  ],
  inputs: [
    { id: 'r_ohm', label: 'Resistance R', group: 'resistance', unit: 'ohm', display: 'kohm', default: 10000, min: 0, max: 1e12 },
    { id: 'c_f', label: 'Capacitance C', group: 'capacitance', unit: 'F', display: 'uF', default: 100e-6, min: 0, max: 100 },
    { id: 'supply_v', label: 'Supply or starting voltage V_s', group: 'voltage', unit: 'V', default: 5, min: 0, max: 1e6 },
    { id: 'time_s', label: 'Time after the step t', group: 'time', unit: 's', default: 1, min: 0, max: 1e9 },
  ],
  outputs: [
    { id: 'tau_s', label: 'Time constant τ = R C', group: 'time', unit: 's' },
    { id: 'cutoff_hz', label: 'Cutoff frequency f_c = 1 / (2π R C)', group: 'frequency', unit: 'Hz' },
    { id: 'v_charge_v', label: 'Capacitor voltage at t while charging', group: 'voltage', unit: 'V' },
    { id: 'v_discharge_v', label: 'Capacitor voltage at t while discharging', group: 'voltage', unit: 'V' },
    { id: 'fraction', label: 'Charge reached at t, 1 − e^(−t/τ)', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 't99_s', label: 'Time to 99 % (4.6 τ)', group: 'time', unit: 's' },
    { id: 't5tau_s', label: 'Five time constants (99.3 %)', group: 'time', unit: 's' },
    { id: 'peak_current_a', label: 'Current at the first instant V_s / R', group: 'current', unit: 'A', display: 'mA' },
    { id: 'energy_j', label: 'Energy in the full capacitor ½ C V_s²', group: 'energy', unit: 'J', display: 'mJ' },
  ],
  example: {
    inputs: { r_ohm: [10, 'kohm'], c_f: [100, 'uF'], supply_v: [5, 'V'], time_s: [1, 's'] },
    results: {
      tau_s: '1.00 s',
      cutoff_hz: '0.159 Hz',
      v_charge_v: '3.16 V',
      t5tau_s: '5.00 s',
    },
  },
};

export const timeConstant = (r, c) => r * c;
export const cutoffFrequency = (r, c) => 1 / (2 * Math.PI * r * c);

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const r = assertPositive(x.r_ohm, 'r_ohm', 'Resistance');
  const c = assertPositive(x.c_f, 'c_f', 'Capacitance');
  const vs = assertNonNegative(x.supply_v, 'supply_v', 'Supply voltage');
  const t = assertNonNegative(x.time_s, 'time_s', 'Time');
  const tau = timeConstant(r, c);
  const decay = Math.exp(-t / tau);
  const warnings = [];
  if (tau > 60 && c >= 1e-4) warnings.push('A time constant above a minute with a large capacitor: electrolytic leakage makes long RC timing inaccurate; use a timer IC or a microcontroller.');
  if (r < 100 && vs > 0) warnings.push('Under 100 Ω the first-instant current is large; the source and the capacitor\'s ripple-current rating may limit it.');
  return {
    outputs: {
      tau_s: tau,
      cutoff_hz: cutoffFrequency(r, c),
      v_charge_v: vs * (1 - decay),
      v_discharge_v: vs * decay,
      fraction: 1 - decay,
      t99_s: tau * Math.log(100),
      t5tau_s: 5 * tau,
      peak_current_a: vs / r,
      energy_j: 0.5 * c * vs * vs,
    },
    warnings,
  };
}
