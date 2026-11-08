/**
 * shaft-critical-speed/calc.js — first critical (whirling) speed of a uniform shaft on two simple supports carrying up to
 * three point masses: Rayleigh's method with static deflections by superposition, the shaft's own critical speed, and
 * their Dunkerley combination; plus the pure Dunkerley estimate for comparison.
 *
 * Influence coefficient (simply supported, load W at a, b = L − a): δ(x ≤ a) = b x (L² − b² − x²) / (6 E I L),
 * δ(x > a) = a (L − x)(2 L x − x² − a²) / (6 E I L).  y_j = Σ W_i δ(x_j, a_i).
 * Rayleigh (Shigley eq. 7-23): ω = √(g Σ W y / Σ W y²).  Uniform shaft (eq. 7-22): ω_s = (π/L)² √(E I / (ρ A)).
 * Dunkerley (eq. 7-32): 1/ω² ≈ Σ 1/ω_ii², ω_ii² = 1/(m_i δ_ii); with the shaft: 1/ω² ≈ 1/ω_R² + 1/ω_s².
 * Schema units: SI — m, kg, Pa, kg/m³, rpm.
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf, assertRange } from '../shared/validate.js';
import { GRAVITY_M_S2 } from '../shared/units.js';

const TO_RPM = 60 / (2 * Math.PI);

/** Deflection at x per unit load at a on a simply supported span L of stiffness EI. */
export function influence(x, a, L, EI) {
  const b = L - a;
  return x <= a ? (b * x * (L * L - b * b - x * x)) / (6 * EI * L) : (a * (L - x) * (2 * L * x - x * x - a * a)) / (6 * EI * L);
}

/** Rayleigh and Dunkerley critical speeds (rad/s) of point masses m (kg) at positions a (m). */
export function pointMassSpeeds(masses, positions, L, EI, g = GRAVITY_M_S2) {
  const W = masses.map((m) => m * g);
  const y = positions.map((x) => W.reduce((s, w, i) => s + w * influence(x, positions[i], L, EI), 0));
  const swy = W.reduce((s, w, i) => s + w * y[i], 0);
  const swy2 = W.reduce((s, w, i) => s + w * y[i] ** 2, 0);
  const rayleigh = Math.sqrt((g * swy) / swy2);
  const dunkerley = 1 / Math.sqrt(masses.reduce((s, m, i) => s + m * influence(positions[i], positions[i], L, EI), 0));
  return { rayleigh, dunkerley, y };
}

export const shaftSpeed = (L, EI, rhoA) => (Math.PI / L) ** 2 * Math.sqrt(EI / rhoA);

const massInput = (k, m, a) => [
  { id: `m${k}_kg`, label: `Mass ${k} (0 if none)`, group: 'mass', unit: 'kg', default: m, min: 0, max: 1e6 },
  { id: `a${k}_m`, label: `Position of mass ${k} from the left bearing`, group: 'length', unit: 'm', display: 'mm', default: a, min: 0, max: 100 },
];

export const schema = {
  id: 'shaft-critical-speed',
  name: 'Shaft critical speed calculator (Rayleigh and Dunkerley)',
  category: 'mechanical',
  summary: 'First critical speed of a simply supported shaft with up to three masses by Rayleigh\'s method, with the shaft\'s own mass by Dunkerley\'s rule.',
  related: ['shaft-torsion', 'flywheel-energy', 'vibration-isolation', 'beam-deflection'],
  assumptions: [
    'A uniform round shaft, solid or hollow, on two simple supports (short or self-aligning bearings) at its ends; the masses are rigid discs treated as points, and their gyroscopic effect and rotary inertia are neglected.',
    'Rayleigh\'s method uses the static deflection curve under the weights as the mode shape (Shigley eq. 7-23); it slightly overestimates the true first critical speed. Dunkerley\'s rule underestimates it, so the two bracket the answer.',
    'The shaft\'s own mass enters through its uniform-shaft critical speed (Shigley eq. 7-22) combined with the masses by Dunkerley\'s rule, 1/ω² = 1/ω_R² + 1/ω_s², the modification Shigley suggests in Example 7-5; the result is conservative.',
    'Stepped shafts, overhung masses, flexible bearings and supports, and fixed ends change the critical speed and are not covered. Bearing and housing flexibility lowers it.',
  ],
  notes: [
    'Verification 2026-11-08: Shigley Example 7-5 data (1 in steel shaft, 31 in span, E 30 Mpsi, γ 0.282 lbf/in³, 35 lbf at 7 in and 55 lbf at 23 in): influence coefficients 2.061, 1.734 and 2.472 × 10⁻⁴ in/lbf; Σ W y = 1.668 lbf·in, Σ W y² = 0.03109 lbf·in²; Rayleigh 143.9 rad/s (1 374 rpm); Dunkerley 136.2 rad/s (1 301 rpm); shaft alone 520.4 rad/s (4 969 rpm); combined 138.7 rad/s (1 325 rpm). Checked by hand.',
  ],
  sources: [
    "Budynas and Nisbett, Shigley's Mechanical Engineering Design, 10th ed., §7-6 Critical speeds for shafts: eqs. 7-22 (uniform shaft), 7-23 (Rayleigh), 7-32 (Dunkerley), Table A-9 (beam deflections) and Example 7-5",
    'Roark\'s Formulas for Stress and Strain, 8th ed., Table 8.1 case 1e (simply supported beam with a point load, deflection equations)',
  ],
  inputs: [
    { id: 'span_m', label: 'Bearing span L', group: 'length', unit: 'm', display: 'mm', default: 0.7874, min: 0.01, max: 100 },
    { id: 'd_m', label: 'Shaft outside diameter d', group: 'length', unit: 'm', display: 'mm', default: 0.0254, min: 0.001, max: 5 },
    { id: 'di_m', label: 'Bore diameter (0 for a solid shaft)', group: 'length', unit: 'm', display: 'mm', default: 0, min: 0, max: 5 },
    { id: 'e_pa', label: 'Young\'s modulus E', group: 'pressure', unit: 'Pa', display: 'GPa', default: 30e6 * 6894.757293168, min: 1e9, max: 1e12 },
    { id: 'density', label: 'Shaft density ρ', group: 'density', unit: 'kg_m3', default: 0.282 * 27679.9047, min: 500, max: 25000 },
    { id: 'shaft_mass', label: 'Shaft\'s own mass', type: 'select', default: 'include', options: [{ value: 'include', label: 'Include (Dunkerley combination)' }, { value: 'ignore', label: 'Ignore (point masses only)' }] },
    ...massInput(1, 35 * 0.45359237, 0.1778), ...massInput(2, 55 * 0.45359237, 0.5842), ...massInput(3, 0, 0.3),
    { id: 'n_op_rpm', label: 'Operating speed (optional)', group: 'rotational_speed', unit: 'rpm', default: 0, min: 0, max: 1e6 },
  ],
  outputs: [
    { id: 'n_crit_rpm', label: 'First critical speed (masses by Rayleigh, plus shaft by Dunkerley)', group: 'rotational_speed', unit: 'rpm' },
    { id: 'n_rayleigh_rpm', label: 'Rayleigh, point masses only', group: 'rotational_speed', unit: 'rpm' },
    { id: 'n_dunkerley_rpm', label: 'Dunkerley, point masses only (lower bound)', group: 'rotational_speed', unit: 'rpm' },
    { id: 'n_shaft_rpm', label: 'Uniform shaft alone', group: 'rotational_speed', unit: 'rpm' },
    { id: 'f_crit_hz', label: 'First critical frequency', group: 'frequency', unit: 'Hz' },
    { id: 'y_max_m', label: 'Largest static deflection under the masses', group: 'length', unit: 'm', display: 'mm', decimals: 4 },
    { id: 'i_m4', label: 'Second moment of area I', group: 'second_moment_of_area', unit: 'm4', display: 'mm4' },
    { id: 'speed_ratio', label: 'Operating speed / critical speed', group: 'dimensionless', unit: 'none', decimals: 3 },
  ],
  example: {
    inputs: {
      span_m: [31, 'in'], d_m: [1, 'in'], di_m: [0, 'in'], e_pa: [30000, 'ksi'], density: [7806, 'kg_m3'], shaft_mass: 'include',
      m1_kg: [35, 'lb'], a1_m: [7, 'in'], m2_kg: [55, 'lb'], a2_m: [23, 'in'], m3_kg: [0, 'kg'], n_op_rpm: [0, 'rpm'],
    },
    results: { n_rayleigh_rpm: '1 374 rpm', n_dunkerley_rpm: '1 301 rpm', n_shaft_rpm: '4 969 rpm', n_crit_rpm: '1 325 rpm' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.shaft_mass, ['include', 'ignore'], 'shaft_mass', 'Shaft\'s own mass');
  const L = assertPositive(x.span_m, 'span_m', 'Bearing span');
  const d = assertPositive(x.d_m, 'd_m', 'Shaft outside diameter');
  const di = assertNonNegative(x.di_m, 'di_m', 'Bore diameter');
  if (di >= d) throw new Error('Bore diameter: it must be smaller than the outside diameter.');
  const E = assertPositive(x.e_pa, 'e_pa', 'Young\'s modulus');
  const rho = assertRange(x.density, 500, 25000, 'density', 'Shaft density');
  const nOp = assertNonNegative(x.n_op_rpm, 'n_op_rpm', 'Operating speed');
  const I = (Math.PI / 64) * (d ** 4 - di ** 4);
  const A = (Math.PI / 4) * (d * d - di * di);
  const EI = E * I;
  const masses = [];
  const pos = [];
  for (const k of [1, 2, 3]) {
    const m = assertNonNegative(x[`m${k}_kg`], `m${k}_kg`, `Mass ${k}`);
    if (m === 0) continue;
    const a = assertNonNegative(x[`a${k}_m`], `a${k}_m`, `Position of mass ${k}`);
    if (a <= 0 || a >= L) throw new Error(`Position of mass ${k}: it must lie between the bearings, more than 0 and less than the span.`);
    masses.push(m);
    pos.push(a);
  }
  const include = x.shaft_mass === 'include';
  if (!masses.length && !include) throw new Error('Mass 1: enter at least one mass, or include the shaft\'s own mass.');
  const ws = shaftSpeed(L, EI, rho * A);
  let wr = null; let wd = null; let ymax = null;
  if (masses.length) {
    const r = pointMassSpeeds(masses, pos, L, EI);
    wr = r.rayleigh; wd = r.dunkerley; ymax = Math.max(...r.y);
  }
  let w;
  if (wr === null) w = ws;
  else w = include ? 1 / Math.sqrt(1 / wr ** 2 + 1 / ws ** 2) : wr;
  const nCrit = w * TO_RPM;
  const warnings = [];
  const ratio = nOp > 0 ? nOp / nCrit : null;
  if (ratio !== null && ratio > 0.7 && ratio < 1.3) warnings.push('The operating speed is within 30 % of the first critical speed: resonant whirling is likely. Stiffen the shaft, shorten the span or move the masses.');
  if (!include && masses.length) warnings.push('The shaft\'s own mass is ignored: the critical speed shown is higher than the real one.');
  return {
    outputs: {
      n_crit_rpm: nCrit,
      n_rayleigh_rpm: wr === null ? null : wr * TO_RPM,
      n_dunkerley_rpm: wd === null ? null : wd * TO_RPM,
      n_shaft_rpm: ws * TO_RPM,
      f_crit_hz: w / (2 * Math.PI),
      y_max_m: ymax,
      i_m4: I,
      speed_ratio: ratio,
    },
    warnings,
  };
}
