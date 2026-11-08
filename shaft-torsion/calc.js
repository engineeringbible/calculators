/**
 * shaft-torsion/calc.js — torsion of solid and hollow round shafts: shear stress τ = T r / J, angle of twist
 * θ = T L / (G J), the largest torque for an allowable stress and twist, and the diameter needed for them; torque from
 * power and speed.
 *
 * J = π (d_o⁴ − d_i⁴) / 32;  τ = 16 T / (π d_o³ (1 − k⁴)), k = d_i/d_o;  θ = T L / (G J);  T = P / ω.
 * Required diameter: stress d = [16 T / (π τ_allow (1 − k⁴))]^(1/3); twist d = [32 T L / (π G θ_allow (1 − k⁴))]^(1/4).
 * Schema units: SI — N·m, W, rpm, m, Pa, rad.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

/** Shear modulus G (GPa) of the materials offered, with the source of each value. */
export const MATERIALS = {
  steel: { label: 'Carbon steel (G = 81 GPa, EN 1993-1-1)', g: 81 },
  stainless: { label: 'Stainless steel 304/316 (G = 77 GPa, Cleveland-Cliffs)', g: 77 },
  aluminium: { label: 'Aluminium alloy (G = 27 GPa, EN 1999-1-1)', g: 27 },
  titanium: { label: 'Titanium Ti-6Al-4V (G = 44 GPa, ASM data sheet)', g: 44 },
  brass: { label: 'Brass C26000 (G = 41.4 GPa, 6 000 ksi)', g: 6000 * 6.894757293168e-3 },
  copper: { label: 'Copper C11000 (G = 44.1 GPa, 6 400 ksi)', g: 6400 * 6.894757293168e-3 },
  custom: { label: 'Other: enter G', g: null },
};

export const schema = {
  id: 'shaft-torsion',
  name: 'Shaft torsion calculator (shear stress, twist, diameter)',
  category: 'mechanical',
  summary: 'Shear stress and angle of twist of solid and hollow round shafts, the torque they can carry, the diameter for an allowable stress or twist, and power to torque.',
  related: ['shaft-torque', 'torque-power-rpm', 'mohr-circle', 'shaft-critical-speed'],
  assumptions: [
    'Elastic torsion of a straight, uniform, circular shaft (solid or hollow) under a constant torque: plane sections stay plane and the shear stress grows linearly from the centre to its maximum at the surface.',
    'Keyways, splines, shoulders and cross holes raise the local stress; apply a stress-concentration factor, or use the allowable stress of a code that already includes one.',
    'Only torsion is checked. Shafts usually also carry bending, which needs a combined (von Mises or Tresca) check, and fluctuating loads need a fatigue check.',
    'Torque from power assumes steady running, T = P/ω; starting, shock and torsional vibration can raise the peak torque well above it.',
    'The twist limit is the allowable angle over the length entered, so a limit per metre is entered with a length of 1 m.',
  ],
  notes: [
    'Verification 2026-11-08: data of Gere and Goodno Example 3-1 (solid steel bar d = 40 mm, L = 1.3 m, G = 80 GPa): T = 340 N·m gives τmax = 27.1 MPa and θ = 0.0220 rad (1.26°); with τ_allow = 42 MPa and θ_allow = 2.5° the permissible torque is 528 N·m, set by the stress (675 N·m by twist). 15 kW at 1 450 rpm is 98.8 N·m and needs 23.3 mm at 40 MPa. Checked by hand.',
  ],
  sources: [
    'Gere and Goodno, Mechanics of Materials, 9th ed., §3.3 to §3.8 (torsion of circular bars, eqs. 3-13, 3-17, 3-24, power transmission) and Example 3-1',
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §3-12 (torsion, eqs. 3-35 to 3-37) and §4-5 (angle of twist)",
    'EN 1993-1-1:2005 §3.2.6 (G = 81 GPa for steel); EN 1999-1-1:2007 §3.2.5 (G = 27 GPa for aluminium)',
  ],
  inputs: [
    { id: 'mode', label: 'Task', type: 'select', default: 'check', options: [{ value: 'check', label: 'Check a shaft: stress, twist and allowable torque' }, { value: 'size', label: 'Size a shaft: diameter for the allowable stress and twist' }] },
    { id: 'torque_from', label: 'Torque given as', type: 'select', default: 'torque', options: [{ value: 'torque', label: 'Torque T' }, { value: 'power', label: 'Power and speed' }] },
    { id: 'torque_nm', label: 'Torque T', group: 'torque', unit: 'N_m', default: 340, min: 1e-6, max: 1e10, visibleWhen: { torque_from: 'torque' } },
    { id: 'power_w', label: 'Power P', group: 'power', unit: 'W', display: 'kW', default: 15000, min: 1e-3, max: 1e9, visibleWhen: { torque_from: 'power' } },
    { id: 'speed_rpm', label: 'Shaft speed n', group: 'rotational_speed', unit: 'rpm', default: 1450, min: 0.01, max: 1e6, visibleWhen: { torque_from: 'power' } },
    { id: 'section', label: 'Section', type: 'select', default: 'solid', options: [{ value: 'solid', label: 'Solid round' }, { value: 'hollow', label: 'Hollow round (tube)' }] },
    { id: 'do_m', label: 'Outside diameter d_o', group: 'length', unit: 'm', display: 'mm', default: 0.04, min: 1e-4, max: 10, visibleWhen: { mode: 'check' } },
    { id: 'di_m', label: 'Inside diameter d_i', group: 'length', unit: 'm', display: 'mm', default: 0.025, min: 0, max: 10, visibleWhen: { mode: 'check', section: 'hollow' } },
    { id: 'k_ratio', label: 'Bore ratio k = d_i/d_o', group: 'dimensionless', unit: 'none', default: 0.6, min: 0, max: 0.95, visibleWhen: { mode: 'size', section: 'hollow' } },
    { id: 'length_m', label: 'Length L between the torques', group: 'length', unit: 'm', default: 1.3, min: 1e-4, max: 10000 },
    { id: 'material', label: 'Material (shear modulus G)', type: 'select', default: 'custom', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'g_pa', label: 'Shear modulus G', group: 'pressure', unit: 'Pa', display: 'GPa', default: 80e9, min: 1e6, max: 5e11, visibleWhen: { material: 'custom' } },
    { id: 'tau_allow_pa', label: 'Allowable shear stress τ_allow (0 to skip)', group: 'pressure', unit: 'Pa', display: 'MPa', default: 42e6, min: 0, max: 5e9 },
    { id: 'twist_allow_rad', label: 'Allowable twist over the length L (0 to skip)', group: 'angle', unit: 'rad', display: 'deg', default: (2.5 * Math.PI) / 180, min: 0, max: 6.3 },
  ],
  outputs: [
    { id: 'torque_out_nm', label: 'Torque T', group: 'torque', unit: 'N_m' },
    { id: 'tau_pa', label: 'Maximum shear stress τ = T r / J', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'twist_rad', label: 'Angle of twist θ = T L / (G J)', group: 'angle', unit: 'rad', display: 'deg', decimals: 3 },
    { id: 'twist_per_m', label: 'Twist per metre (degrees per m)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'j_m4', label: 'Polar moment of area J', group: 'second_moment_of_area', unit: 'm4', display: 'mm4' },
    { id: 'stiffness', label: 'Torsional stiffness G J / L (N·m per rad)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 't_allow_stress_nm', label: 'Torque allowed by the stress limit', group: 'torque', unit: 'N_m', visibleWhen: { mode: 'check' } },
    { id: 't_allow_twist_nm', label: 'Torque allowed by the twist limit', group: 'torque', unit: 'N_m', visibleWhen: { mode: 'check' } },
    { id: 'd_stress_m', label: 'Diameter needed for the stress limit', group: 'length', unit: 'm', display: 'mm', visibleWhen: { mode: 'size' } },
    { id: 'd_twist_m', label: 'Diameter needed for the twist limit', group: 'length', unit: 'm', display: 'mm', visibleWhen: { mode: 'size' } },
    { id: 'd_required_m', label: 'Required outside diameter (larger of the two)', group: 'length', unit: 'm', display: 'mm', visibleWhen: { mode: 'size' } },
    { id: 'governs', label: 'Governing limit', type: 'text' },
  ],
  example: {
    inputs: { mode: 'check', torque_from: 'torque', torque_nm: [340, 'N_m'], section: 'solid', do_m: [40, 'mm'], length_m: [1.3, 'm'], material: 'custom', g_pa: [80, 'GPa'], tau_allow_pa: [42, 'MPa'], twist_allow_rad: [2.5, 'deg'] },
    results: { tau_pa: '27.1 MPa', twist_rad: ['0.0220 rad', { abs: 0.00005 }], t_allow_stress_nm: '528 N·m', t_allow_twist_nm: '675 N·m' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['check', 'size'], 'mode', 'Task');
  assertOneOf(x.torque_from, ['torque', 'power'], 'torque_from', 'Torque given as');
  assertOneOf(x.section, ['solid', 'hollow'], 'section', 'Section');
  assertOneOf(x.material, Object.keys(MATERIALS), 'material', 'Material');
  const T = x.torque_from === 'torque'
    ? assertPositive(x.torque_nm, 'torque_nm', 'Torque')
    : assertPositive(x.power_w, 'power_w', 'Power') / ((assertPositive(x.speed_rpm, 'speed_rpm', 'Shaft speed') * 2 * Math.PI) / 60);
  const L = assertPositive(x.length_m, 'length_m', 'Length');
  const G = MATERIALS[x.material].g === null ? assertPositive(x.g_pa, 'g_pa', 'Shear modulus') : MATERIALS[x.material].g * 1e9;
  const tauA = assertNonNegative(x.tau_allow_pa, 'tau_allow_pa', 'Allowable shear stress');
  const thA = assertRange(x.twist_allow_rad, 0, 6.3, 'twist_allow_rad', 'Allowable twist');
  let d; let k;
  let dStress = null; let dTwist = null;
  if (x.mode === 'check') {
    d = assertPositive(x.do_m, 'do_m', 'Outside diameter');
    const di = x.section === 'hollow' ? assertNonNegative(x.di_m, 'di_m', 'Inside diameter') : 0;
    if (di >= d) throw new Error('Inside diameter: it must be smaller than the outside diameter.');
    k = di / d;
  } else {
    k = x.section === 'hollow' ? assertRange(x.k_ratio, 0, 0.95, 'k_ratio', 'Bore ratio') : 0;
    if (tauA === 0 && thA === 0) throw new Error('Allowable shear stress: enter an allowable stress, an allowable twist, or both, to size the shaft.');
    const f = 1 - k ** 4;
    dStress = tauA > 0 ? ((16 * T) / (Math.PI * tauA * f)) ** (1 / 3) : null;
    dTwist = thA > 0 ? ((32 * T * L) / (Math.PI * G * thA * f)) ** (1 / 4) : null;
    d = Math.max(dStress ?? 0, dTwist ?? 0);
  }
  const J = (Math.PI / 32) * d ** 4 * (1 - k ** 4);
  const tau = (T * d) / (2 * J);
  const theta = (T * L) / (G * J);
  const tStress = tauA > 0 ? (tauA * 2 * J) / d : null;
  const tTwist = thA > 0 ? (thA * G * J) / L : null;
  let governs;
  if (x.mode === 'size') governs = dStress !== null && (dTwist === null || dStress >= dTwist) ? 'Shear stress governs the diameter.' : 'Angle of twist governs the diameter.';
  else if (tStress === null && tTwist === null) governs = 'No limits entered.';
  else {
    const allowed = Math.min(tStress ?? Infinity, tTwist ?? Infinity);
    const by = tStress !== null && (tTwist === null || tStress <= tTwist) ? 'stress' : 'twist';
    governs = `Largest torque ${allowed.toFixed(1)} N·m, set by the ${by} limit; the applied torque uses ${((100 * T) / allowed).toFixed(0)} % of it.`;
  }
  const warnings = [];
  if (x.mode === 'check' && tStress !== null && T > tStress) warnings.push('The shear stress exceeds the allowable stress.');
  if (x.mode === 'check' && tTwist !== null && T > tTwist) warnings.push('The angle of twist exceeds the allowable twist.');
  if (k > 0.9) warnings.push('Very thin-walled tube (k > 0.9): local buckling of the wall may govern before the shear stress limit.');
  return {
    outputs: {
      torque_out_nm: T,
      tau_pa: tau,
      twist_rad: theta,
      twist_per_m: (theta * 180) / Math.PI / L,
      j_m4: J,
      stiffness: (G * J) / L,
      t_allow_stress_nm: x.mode === 'check' ? tStress : null,
      t_allow_twist_nm: x.mode === 'check' ? tTwist : null,
      d_stress_m: dStress,
      d_twist_m: dTwist,
      d_required_m: x.mode === 'size' ? d : null,
      governs,
    },
    warnings,
  };
}
