/**
 * power-factor-correction/calc.js — shunt capacitor bank sizing for power factor correction: reactive power to raise
 * the power factor, capacitance per phase (delta or star), released apparent power and current, loss reduction, the
 * parallel resonance with the supply and the detuned-reactor tuning.
 *
 * Q_c = P (tan φ₁ − tan φ₂);  C_Δ = Q_c/(3 ω V²), C_Y = Q_c/(ω V²);  h_r = √(S_sc/Q_c);  detuned: h_t = 1/√p, V_C = V/(1 − p)
 * Schema units: kW, kvar, kVA, V, Hz, MVA, %.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const CHARACTERISTIC_HARMONICS = [5, 7, 11, 13];

export const schema = {
  id: 'power-factor-correction',
  name: 'Power factor correction',
  category: 'electrical',
  summary: 'Capacitor kvar and capacitance to raise the power factor, released kVA and current, loss saving, resonance with the supply and detuning.',
  related: ['three-phase-power', 'transformer-sizing', 'cable-sizing', 'generator-load', 'short-circuit-current'],
  assumptions: [
    'Balanced three-phase load of constant active power P at the existing displacement power factor cos φ₁ (sinusoidal voltage and current); the capacitor bank supplies Q_c = P (tan φ₁ − tan φ₂) to reach the target cos φ₂, the classic kvar-per-kW table of the Schneider Electric Installation Guide (chapter L) reproduced exactly; harmonic currents (true power factor) are not included.',
    'Capacitance per phase from the bank rating at the supply voltage and frequency: C = Q_c/(3 ω V²) for a delta connection (each unit at line voltage) and C = Q_c/(ω V²) for star (each unit at phase voltage); manufacturers rate units in kvar at a rated voltage, and capacitor tolerance (−5/+10 % IEC 60831-1) is not included.',
    'Released capacity S₁ − S₂ = P/cos φ₁ − P/cos φ₂ and line currents I = S/(√3 V); resistive losses in the cables and transformers upstream of the bank scale with I², so they fall by 1 − (cos φ₁/cos φ₂)² — the saving in kW applies the ratio to the existing losses entered (only upstream of the bank).',
    'Parallel resonance of the bank with the supply inductance at harmonic order h_r ≈ √(S_sc/Q_c), with S_sc the short-circuit power at the bank\'s busbar (IEEE 1036 / Schneider guide); h_r within ±10 % of a characteristic harmonic (5, 7, 11, 13) of six-pulse converters is a resonance risk and calls for a detuned bank.',
    'Detuned (series reactor) bank with relative reactance p: series tuning order h_t = 1/√p (7 % → 3.78, 189 Hz at 50 Hz) below the 5th harmonic, and the capacitor voltage rises to V/(1 − p) at the fundamental, so the capacitors must be rated for it and the bank\'s output is taken from the manufacturer\'s detuned data — the capacitance output is for an undetuned bank.',
  ],
  notes: [
    'Verification 2026-10-31: 500 kW from cos φ 0.75 to 0.93 → tan φ 0.8819 − 0.3952 = 0.4867 kvar/kW (Schneider table 0.487), Q_c 243.3 kvar, 1 614 µF per phase in delta at 400 V 50 Hz, released 129.0 kVA, current 962 → 776 A, losses −35.0 %; with S_sc 10 MVA the resonance order is 6.41 (321 Hz), within 10 % of the 7th harmonic — flagged.',
    'Design decision: the loss saving is expressed against existing upstream losses entered by the user rather than a cable model, because the I² ratio is exact while the absolute losses depend on the installation.',
  ],
  sources: [
    'Schneider Electric, Electrical Installation Guide, chapter L "Power factor correction" — kvar/kW table, resonance f_r = f √(S_sc/Q), detuned reactors',
    'IEC 60831-1:2014 Shunt power capacitors of the self-healing type for a.c. systems up to 1 000 V — ratings and tolerances',
    'IEEE Std 1036-2020 Guide for the Application of Shunt Power Capacitors — resonance and harmonic considerations',
    'IEC 61642:1997 Industrial a.c. networks affected by harmonics — application of filters and shunt capacitors',
  ],
  inputs: [
    { id: 'active_power_kw', label: 'Active power of the load P', group: 'power', unit: 'kW', default: 500, min: 0.1, max: 1e6 },
    { id: 'pf_existing', label: 'Existing power factor cos φ₁', group: 'dimensionless', unit: 'none', default: 0.75, min: 0.1, max: 0.999 },
    { id: 'pf_target', label: 'Target power factor cos φ₂', group: 'dimensionless', unit: 'none', default: 0.93, min: 0.1, max: 1 },
    { id: 'voltage_v', label: 'Line voltage V', group: 'voltage', unit: 'V', default: 400, min: 100, max: 36000 },
    { id: 'frequency_hz', label: 'Frequency', group: 'frequency', unit: 'Hz', default: 50, min: 40, max: 70 },
    { id: 'connection', label: 'Capacitor connection', type: 'select', default: 'delta', options: [{ value: 'delta', label: 'Delta (units at line voltage)' }, { value: 'star', label: 'Star (units at phase voltage)' }] },
    { id: 'short_circuit_mva', label: 'Short-circuit power at the capacitor busbar S_sc', group: 'apparent_power', unit: 'MVA', default: 10, min: 0.01, max: 10000 },
    { id: 'detuning_pct', label: 'Detuning reactor p (0 = no reactor; 5.67, 7 or 14 %)', group: 'ratio', unit: 'pct', default: 0, min: 0, max: 20 },
    { id: 'existing_losses_kw', label: 'Existing I²R losses upstream of the bank', group: 'power', unit: 'kW', default: 8, min: 0, max: 1e5 },
    { id: 'hours_per_year', label: 'Operating hours per year', group: 'dimensionless', unit: 'none', default: 4000, min: 0, max: 8784 },
  ],
  outputs: [
    { id: 'tan_phi1', label: 'tan φ₁', group: 'dimensionless', unit: 'none' },
    { id: 'tan_phi2', label: 'tan φ₂', group: 'dimensionless', unit: 'none' },
    { id: 'kvar_per_kw', label: 'Correction factor tan φ₁ − tan φ₂ (kvar per kW)', group: 'dimensionless', unit: 'none' },
    { id: 'q_required_var', label: 'Capacitor bank rating Q_c', group: 'reactive_power', unit: 'var', display: 'kvar' },
    { id: 'q_before_var', label: 'Reactive power drawn before correction', group: 'reactive_power', unit: 'var', display: 'kvar' },
    { id: 'q_after_var', label: 'Reactive power drawn after correction', group: 'reactive_power', unit: 'var', display: 'kvar' },
    { id: 's_before_va', label: 'Apparent power before', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 's_after_va', label: 'Apparent power after', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'released_va', label: 'Released capacity S₁ − S₂', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'current_before_a', label: 'Line current before', group: 'current', unit: 'A' },
    { id: 'current_after_a', label: 'Line current after', group: 'current', unit: 'A' },
    { id: 'capacitor_current_a', label: 'Capacitor bank line current', group: 'current', unit: 'A' },
    { id: 'capacitance_f', label: 'Capacitance per phase', group: 'capacitance', unit: 'F', display: 'uF' },
    { id: 'loss_reduction_pct', label: 'Reduction of upstream I²R losses 1 − (cos φ₁/cos φ₂)²', group: 'ratio', unit: 'pct' },
    { id: 'loss_saving_w', label: 'Loss saving', group: 'power', unit: 'W', display: 'kW' },
    { id: 'energy_saving_kwh', label: 'Energy saved per year (kWh)', group: 'dimensionless', unit: 'none' },
    { id: 'resonance_order', label: 'Parallel resonance order h_r = √(S_sc/Q_c)', group: 'dimensionless', unit: 'none' },
    { id: 'resonance_hz', label: 'Parallel resonance frequency', group: 'frequency', unit: 'Hz' },
    { id: 'tuning_order', label: 'Detuned bank tuning order 1/√p', group: 'dimensionless', unit: 'none' },
    { id: 'capacitor_voltage_factor', label: 'Capacitor voltage rise with the reactor 1/(1 − p)', group: 'dimensionless', unit: 'none' },
    { id: 'resonance_check', label: 'Resonance check', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      tan_phi1: '0.882',
      tan_phi2: '0.395',
      kvar_per_kw: '0.487',
      q_required_var: '243 kvar',
      s_after_va: '538 kVA',
      released_va: '129 kVA',
      current_after_a: '776 A',
      capacitor_current_a: '351 A',
    },
  },
};

/** tan(acos(pf)). */
export function tanPhi(pf) {
  return Math.sqrt(1 - pf * pf) / pf;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.active_power_kw, 'active_power_kw', 'Active power');
  assertRange(i.pf_existing, 0.05, 0.9999, 'pf_existing', 'Existing power factor');
  assertRange(i.pf_target, 0.05, 1, 'pf_target', 'Target power factor');
  if (i.pf_target <= i.pf_existing) throw new Error('Target power factor must be above the existing power factor');
  assertPositive(i.voltage_v, 'voltage_v', 'Voltage');
  assertPositive(i.frequency_hz, 'frequency_hz', 'Frequency');
  assertOneOf(i.connection, ['delta', 'star'], 'connection', 'Connection');
  assertPositive(i.short_circuit_mva, 'short_circuit_mva', 'Short-circuit power');
  assertRange(i.detuning_pct, 0, 50, 'detuning_pct', 'Detuning');
  assertNonNegative(i.existing_losses_kw, 'existing_losses_kw', 'Losses');
  assertRange(i.hours_per_year, 0, 8784, 'hours_per_year', 'Hours');

  const P = i.active_power_kw * 1000;
  const t1 = tanPhi(i.pf_existing);
  const t2 = tanPhi(i.pf_target);
  const qc = P * (t1 - t2);
  const s1 = P / i.pf_existing;
  const s2 = P / i.pf_target;
  const sqrt3V = Math.sqrt(3) * i.voltage_v;
  const omega = 2 * Math.PI * i.frequency_hz;
  const capacitance = i.connection === 'delta' ? qc / (3 * omega * i.voltage_v ** 2) : qc / (omega * i.voltage_v ** 2);
  const lossFraction = 1 - (i.pf_existing / i.pf_target) ** 2;
  const lossSavingW = i.existing_losses_kw * 1000 * lossFraction;
  const hr = Math.sqrt((i.short_circuit_mva * 1e6) / qc);
  const p = i.detuning_pct / 100;
  const nearHarmonic = CHARACTERISTIC_HARMONICS.find((h) => Math.abs(hr - h) <= 0.1 * h);

  let resonance;
  if (p > 0) resonance = `Detuned bank: tuned to h ${(1 / Math.sqrt(p)).toFixed(2)} (${(i.frequency_hz / Math.sqrt(p)).toFixed(0)} Hz), below the 5th harmonic — the bank is inductive for the characteristic harmonics`;
  else if (nearHarmonic) resonance = `RISK — parallel resonance at h ${hr.toFixed(2)} (${(hr * i.frequency_hz).toFixed(0)} Hz) is within 10 % of the ${nearHarmonic}th harmonic: use a detuned bank`;
  else resonance = `Resonance at h ${hr.toFixed(2)} (${(hr * i.frequency_hz).toFixed(0)} Hz), away from the 5th, 7th, 11th and 13th harmonics — check the actual harmonic spectrum`;

  const warnings = [];
  if (i.pf_target > 0.98) warnings.push('Target above 0.98: at light load a fixed bank over-compensates (leading power factor, voltage rise); use an automatic stepped bank.');
  if (!p && nearHarmonic) warnings.push(`Parallel resonance close to the ${nearHarmonic}th harmonic: harmonic currents from drives and rectifiers will be amplified — detune the bank (p 5.67–7 %) or use a filter.`);
  if (qc / (i.short_circuit_mva * 1e6) > 0.1) warnings.push('Bank above 10 % of the short-circuit power: noticeable voltage rise when switched in (ΔV ≈ Q_c/S_sc) — switch in steps.');
  if (p > 0) warnings.push(`With a ${i.detuning_pct} % reactor the capacitors see ${((1 / (1 - p)) * 100).toFixed(1)} % of the supply voltage: rate them accordingly and take the bank output from the manufacturer's detuned data.`);
  warnings.push('Displacement power factor of a sinusoidal load only: harmonic distortion lowers the true power factor and is not corrected by capacitors.');

  return {
    outputs: {
      tan_phi1: t1,
      tan_phi2: t2,
      kvar_per_kw: t1 - t2,
      q_required_var: qc,
      q_before_var: P * t1,
      q_after_var: P * t2,
      s_before_va: s1,
      s_after_va: s2,
      released_va: s1 - s2,
      current_before_a: s1 / sqrt3V,
      current_after_a: s2 / sqrt3V,
      capacitor_current_a: qc / sqrt3V,
      capacitance_f: capacitance,
      loss_reduction_pct: lossFraction * 100,
      loss_saving_w: lossSavingW,
      energy_saving_kwh: (lossSavingW / 1000) * i.hours_per_year,
      resonance_order: hr,
      resonance_hz: hr * i.frequency_hz,
      tuning_order: p > 0 ? 1 / Math.sqrt(p) : null,
      capacitor_voltage_factor: 1 / (1 - p),
      resonance_check: resonance,
    },
    warnings,
  };
}
