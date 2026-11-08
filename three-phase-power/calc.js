/**
 * three-phase-power/calc.js — active, reactive and apparent power and line current for three-phase, single-phase and
 * DC circuits; motor full-load and starting current from rated output, efficiency and power factor; power-factor
 * correction capacitor rating.
 *
 * Three-phase: S = √3 V_LL I, P = S cos φ, Q = S sin φ; single-phase: S = V I; DC: P = V I.
 * Motor: P_in = P_out / η, I = P_in / (√3 V cos φ).  Capacitors: Q_c = P (tan φ₁ − tan φ₂).
 * Schema units: SI — V, A, W, VA, var.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

export const schema = {
  id: 'three-phase-power',
  name: 'Three-phase power and motor current',
  category: 'electrical',
  summary: 'kW, kVA, kvar and line current for three-phase, single-phase and DC circuits; motor full-load and starting current from the nameplate; power-factor correction.',
  related: ['cable-sizing', 'generator-load', 'battery-runtime', 'pump-affinity'],
  sendTo: [
    {
      target: 'cable-sizing',
      label: 'Cable size and voltage drop',
      note: 'The full-load line current is the design current; enter the cable length and installation there.',
      links: [
        { to: 'system', from: 'input:system' },
        { to: 'voltage_v', from: 'input:voltage_v' },
        { to: 'current_a', from: 'line_current_a' },
        { to: 'power_factor', from: 'input:power_factor' },
      ],
    },
    {
      target: 'power-factor-correction',
      label: 'Power-factor correction bank',
      when: { system: 'ac3' },
      whenNote: 'Available for three-phase AC only: the capacitor-bank calculator is three-phase.',
      note: 'Active power, present and target power factor, and voltage; enter the frequency and the supply short-circuit power there.',
      links: [
        { to: 'active_power_kw', from: 'active_power_out_w' },
        { to: 'pf_existing', from: 'input:power_factor' },
        { to: 'pf_target', from: 'input:target_pf' },
        { to: 'voltage_v', from: 'input:voltage_v' },
      ],
    },
    {
      target: 'motor-starting',
      label: 'Motor starting and voltage dip',
      when: { system: 'ac3', mode: 'motor' },
      whenNote: 'Available in motor mode on a three-phase supply.',
      note: 'Motor rating, efficiency, power factor and locked-rotor current multiple; choose the starting method and the supply there.',
      links: [
        { to: 'motor_power_kw', from: 'input:shaft_power_w' },
        { to: 'voltage_v', from: 'input:voltage_v' },
        { to: 'efficiency', from: 'input:efficiency' },
        { to: 'power_factor', from: 'input:power_factor' },
        { to: 'lrc_multiple', from: 'input:starting_multiple' },
      ],
    },
  ],
  assumptions: [
    'Balanced sinusoidal three-phase system with the line-to-line voltage entered; the formulas hold for star and delta connections alike because they use line quantities. Unbalanced loads and harmonics (drives, rectifiers) change the current and the real apparent power and are not modelled.',
    'Power factor is the displacement power factor cos φ between voltage and fundamental current, lagging for motors and transformers; the sign of Q is not tracked (leading loads enter the same magnitude).',
    'Motor mode: the rated output is mechanical shaft power (IEC 60034-1 nameplate kW); the electrical input is output ÷ efficiency, and the current uses the nameplate power factor. Efficiency and power factor fall at part load, so part-load currents are higher than a proportional scaling suggests.',
    'Starting current is the direct-on-line locked-rotor current as a multiple of full-load current (IEC 60034-12 design N motors typically 6–8 ×); star-delta reduces it to one third, soft starters and drives to 1.5–4 ×. Starting power factor is assumed 0.3 for the starting kVA.',
    'Power-factor correction capacitors are sized for the entered active power to reach the target cos φ at the fundamental; resonance with harmonics and over-correction at light load are not checked.',
    'Generator capacity is the apparent power the load draws; sizing a generator for motor starting needs the transient voltage-dip limit (typically 15–20 %) and the generator sub-transient reactance, not just the starting kVA.',
  ],
  notes: [
    'Verification 2026-10-30: the 30 kW, 400 V, η 0.92, cos φ 0.85 motor gives 55.4 A, matching typical IE3 4-pole nameplates (55–57 A); 400 V × 50 A × 0.85 gives 34.6 kVA / 29.4 kW / 18.3 kvar and the correction to 0.95 needs 8.6 kvar, all checked by hand.',
    'Design decision: three modes (from current, from load power, motor nameplate) share one output set so the same page serves generator-load estimates and motor-feeder sizing.',
    'Design decision: apparent and reactive power have their own unit groups (VA, var) rather than being mislabelled as watts.',
  ],
  sources: [
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. "Three-phase systems" (S = √3 V_L I_L, P = S cos φ)',
    'Wildi, Electrical Machines, Drives and Power Systems, 6th ed., ch. 8 (three-phase power), ch. 13–14 (induction motor efficiency, power factor, starting current)',
    'IEC 60034-1 (rating and performance of rotating machines), IEC 60034-12 (starting performance of induction motors), IEC 60034-30-1 (efficiency classes)',
    'IEEE Std 141 (Red Book) / Schneider Electric Electrical Installation Guide, power-factor correction Q_c = P (tan φ₁ − tan φ₂)',
  ],
  inputs: [
    {
      id: 'system',
      label: 'System',
      type: 'select',
      default: 'ac3',
      options: [
        { value: 'ac3', label: 'Three-phase AC (line-to-line voltage)' },
        { value: 'ac1', label: 'Single-phase AC' },
        { value: 'dc', label: 'DC' },
      ],
    },
    { id: 'voltage_v', label: 'Voltage (line-to-line for three-phase)', group: 'voltage', unit: 'V', default: 400, min: 1, max: 100000 },
    {
      id: 'mode',
      label: 'Known quantity',
      type: 'select',
      default: 'motor',
      options: [
        { value: 'current', label: 'Line current and power factor → powers' },
        { value: 'power', label: 'Electrical load (active power) → current' },
        { value: 'motor', label: 'Motor nameplate (shaft output, efficiency, power factor) → current' },
      ],
    },
    { id: 'current_a', label: 'Line current I', group: 'current', unit: 'A', default: 50, min: 0, max: 100000, visibleWhen: { mode: 'current' } },
    { id: 'active_power_w', label: 'Electrical active power P', group: 'power', unit: 'W', display: 'kW', default: 30000, min: 0, max: 1e9, visibleWhen: { mode: 'power' } },
    { id: 'shaft_power_w', label: 'Motor rated shaft output', group: 'power', unit: 'W', display: 'kW', default: 30000, min: 0, max: 1e8, visibleWhen: { mode: 'motor' } },
    { id: 'efficiency', label: 'Motor efficiency η at rated load', group: 'ratio', unit: 'frac', display: 'pct', default: 0.92, min: 0.3, max: 1, visibleWhen: { mode: 'motor' }, help: 'IE3 motors: 0.86 (1.1 kW) to 0.96 (200 kW); IEC 60034-30-1.' },
    { id: 'power_factor', label: 'Power factor cos φ (lagging)', group: 'dimensionless', unit: 'none', default: 0.85, min: 0.05, max: 1, visibleWhen: { system: ['ac3', 'ac1'] } },
    { id: 'starting_multiple', label: 'Starting current as a multiple of full-load current', group: 'dimensionless', unit: 'none', default: 7, min: 1, max: 12, visibleWhen: { mode: 'motor' }, help: 'DOL cage motors 6–8; star-delta ≈ 1/3 of DOL; soft starter 2–4; VFD 1–1.5.' },
    { id: 'target_pf', label: 'Target power factor for correction', group: 'dimensionless', unit: 'none', default: 0.95, min: 0.5, max: 1, visibleWhen: { system: ['ac3', 'ac1'] } },
  ],
  outputs: [
    { id: 'line_current_a', label: 'Line current I', group: 'current', unit: 'A' },
    { id: 'active_power_out_w', label: 'Active (real) power P', group: 'power', unit: 'W', display: 'kW' },
    { id: 'apparent_power_va', label: 'Apparent power S', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'reactive_power_var', label: 'Reactive power Q', group: 'reactive_power', unit: 'var', display: 'kvar' },
    { id: 'phase_angle_deg', label: 'Phase angle φ = acos(pf)', group: 'angle', unit: 'deg' },
    { id: 'shaft_power_out_w', label: 'Mechanical shaft output (motor mode)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'motor_losses_w', label: 'Motor losses P_in − P_out', group: 'power', unit: 'W', display: 'kW' },
    { id: 'starting_current_a', label: 'Direct-on-line starting current', group: 'current', unit: 'A' },
    { id: 'starting_kva', label: 'Starting apparent power (at cos φ ≈ 0.3)', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'correction_kvar', label: 'Capacitor rating to reach the target power factor Q_c = P (tan φ₁ − tan φ₂)', group: 'reactive_power', unit: 'var', display: 'kvar' },
    { id: 'current_after_correction_a', label: 'Line current after correction', group: 'current', unit: 'A' },
    { id: 'generator_kva', label: 'Generator apparent power drawn by this load', group: 'apparent_power', unit: 'VA', display: 'kVA' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      line_current_a: '55.4 A',
      active_power_out_w: '32.6 kW',
      apparent_power_va: '38.4 kVA',
      reactive_power_var: '20.2 kvar',
      motor_losses_w: '2.6 kW',
      starting_current_a: '388 A',
      starting_kva: '269 kVA',
      correction_kvar: '9.5 kvar',
    },
  },
};

/** Apparent power from voltage and current for the system type. */
export function apparentPowerVa(system, voltageV, currentA) {
  if (system === 'ac3') return Math.sqrt(3) * voltageV * currentA;
  return voltageV * currentA;
}

/** Line current from active power, voltage and power factor. */
export function lineCurrentA(system, activePowerW, voltageV, powerFactor) {
  if (system === 'dc') return activePowerW / voltageV;
  if (system === 'ac3') return activePowerW / (Math.sqrt(3) * voltageV * powerFactor);
  return activePowerW / (voltageV * powerFactor);
}

/** Capacitor reactive power to raise the power factor of an active power P from pf1 to pf2, var. */
export function correctionVar(activePowerW, pf1, pf2) {
  return activePowerW * (Math.tan(Math.acos(pf1)) - Math.tan(Math.acos(pf2)));
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.system, ['ac3', 'ac1', 'dc'], 'system', 'System');
  assertOneOf(i.mode, ['current', 'power', 'motor'], 'mode', 'Known quantity');
  assertPositive(i.voltage_v, 'voltage_v', 'Voltage');
  const isAc = i.system !== 'dc';
  const pf = isAc ? assertRange(i.power_factor, 0.01, 1, 'power_factor', 'Power factor') : 1;
  const targetPf = isAc ? assertRange(i.target_pf, 0.01, 1, 'target_pf', 'Target power factor') : 1;

  let current;
  let activePower;
  let shaftPower = null;
  let startingMultiple = null;
  if (i.mode === 'current') {
    current = assertNonNegative(i.current_a, 'current_a', 'Line current');
    activePower = apparentPowerVa(i.system, i.voltage_v, current) * pf;
  } else if (i.mode === 'power') {
    activePower = assertNonNegative(i.active_power_w, 'active_power_w', 'Active power');
    current = lineCurrentA(i.system, activePower, i.voltage_v, pf);
  } else {
    shaftPower = assertNonNegative(i.shaft_power_w, 'shaft_power_w', 'Shaft output');
    assertRange(i.efficiency, 0.1, 1, 'efficiency', 'Efficiency');
    startingMultiple = assertRange(i.starting_multiple, 1, 15, 'starting_multiple', 'Starting multiple');
    activePower = shaftPower / i.efficiency;
    current = lineCurrentA(i.system, activePower, i.voltage_v, pf);
  }
  const apparent = isAc ? apparentPowerVa(i.system, i.voltage_v, current) : activePower;
  const reactive = isAc ? Math.sqrt(Math.max(0, apparent * apparent - activePower * activePower)) : 0;
  const correction = isAc && targetPf > pf ? correctionVar(activePower, pf, targetPf) : 0;
  const currentAfter = isAc ? lineCurrentA(i.system, activePower, i.voltage_v, Math.max(pf, targetPf)) : current;

  const warnings = [];
  if (isAc && pf < 0.8) warnings.push('Power factor below 0.8: the current is 25 % or more above the minimum for this active power; utilities and ship generators penalise this — consider correction.');
  if (isAc && targetPf <= pf) warnings.push('Target power factor is not above the actual one: no correction needed.');
  if (isAc && targetPf > 0.98) warnings.push('Correcting above 0.98 risks over-correction (leading power factor) at part load and resonance with harmonics; 0.92–0.95 is the usual target.');
  if (i.mode === 'motor' && startingMultiple >= 6) warnings.push('Direct-on-line starting: check the generator or supply can hold the voltage dip (typically limited to 15–20 %) at the starting kVA; star-delta or a soft starter reduces it.');
  if (i.mode === 'motor') warnings.push('Nameplate efficiency and power factor apply at rated load; at 50 % load the power factor of an induction motor drops noticeably and the current falls less than proportionally.');
  if (i.system === 'ac1' && activePower > 7500) warnings.push('Single-phase load above about 7.5 kW is unusual; large loads are normally three-phase.');

  return {
    outputs: {
      line_current_a: current,
      active_power_out_w: activePower,
      apparent_power_va: apparent,
      reactive_power_var: reactive,
      phase_angle_deg: isAc ? (Math.acos(pf) * 180) / Math.PI : 0,
      shaft_power_out_w: shaftPower,
      motor_losses_w: shaftPower === null ? null : activePower - shaftPower,
      starting_current_a: startingMultiple === null ? null : current * startingMultiple,
      starting_kva: startingMultiple === null ? null : apparentPowerVa(i.system, i.voltage_v, current * startingMultiple),
      correction_kvar: isAc ? correction : null,
      current_after_correction_a: currentAfter,
      generator_kva: apparent,
    },
    warnings,
  };
}
