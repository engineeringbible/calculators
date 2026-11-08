/**
 * duct-size/calc.js — round and rectangular duct size for an airflow by the equal-friction or velocity method, with
 * the velocity, friction rate and the nearest standard round sizes.
 *
 * Darcy–Weisbach Δp/L = f ρ V² / (2 D) with the Colebrook friction factor (ASHRAE Fundamentals Ch. 21 eqs. 18–19),
 * standard air ρ = 1.204 kg/m³, μ = 1.81e−5 Pa·s; rectangular equivalent D_e = 1.30 (ab)^0.625 / (a + b)^0.25 (eq. 25).
 * Schema units: SI — m³/s, m, m/s, Pa/m.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';

const RHO = 1.204;
const MU = 1.81e-5;
const IN = 0.0254;

/** Colebrook friction factor, iterated. */
export function colebrook(re, relRough) {
  if (re < 2300) return 64 / re;
  let f = 0.02;
  for (let k = 0; k < 50; k += 1) f = (-2 * Math.log10(relRough / 3.7 + 2.51 / (re * Math.sqrt(f)))) ** -2;
  return f;
}

/** Friction loss per metre (Pa/m) of a round duct of diameter d (m) carrying q (m³/s). */
export function frictionRate(q, d, roughness, rho = RHO) {
  const v = q / ((Math.PI / 4) * d * d);
  const re = (rho * v * d) / MU;
  return (colebrook(re, roughness / d) * rho * v * v) / (2 * d);
}

/** Round diameter (m) giving the target friction rate, by bisection (friction falls as the diameter grows). */
export function diameterForFriction(q, target, roughness, rho = RHO) {
  let lo = 0.005;
  let hi = 10;
  for (let k = 0; k < 200; k += 1) {
    const mid = Math.sqrt(lo * hi);
    if (frictionRate(q, mid, roughness, rho) > target) lo = mid; else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

/** Huebscher equivalent diameter of a rectangular duct a × b. */
export const equivalentDiameter = (a, b) => (1.3 * (a * b) ** 0.625) / (a + b) ** 0.25;

/** Side b of a rectangular duct with one side a that has the equivalent diameter de; null if a alone is too small. */
export function otherSide(a, de) {
  if (equivalentDiameter(a, 100 * a) < de) return null;
  let lo = 1e-4;
  let hi = 100 * a;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    if (equivalentDiameter(a, mid) < de) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Common round sizes: inch sizes 3–10 in steps of 1, then even to 36; EN 1506 metric diameters, mm. */
export const ROUND_IN = [3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
export const ROUND_MM = [63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 710, 800, 900, 1000, 1120, 1250];

export const schema = {
  id: 'duct-size',
  name: 'Duct size calculator',
  category: 'hvac',
  summary: 'Round and rectangular duct size for an airflow by friction rate or velocity, with the velocity, pressure loss per 100 ft or per metre, and standard sizes.',
  related: ['air-changes', 'air-density', 'pipe-flow', 'reynolds-number'],
  assumptions: [
    'Friction follows Darcy–Weisbach with the Colebrook friction factor, the method of ASHRAE Fundamentals Chapter 21, for standard air at 20 °C (1.204 kg/m³); a duct friction chart (ductulator) gives the same results within its reading accuracy.',
    'The default roughness 0.09 mm is galvanized steel with joints every 1.2 m (ASHRAE "medium smooth"); flexible duct is much rougher and needs a larger size, especially when not fully stretched.',
    'The rectangular duct has the same friction loss as the round size at the same airflow (Huebscher equivalent diameter); keep the aspect ratio below about 4 : 1.',
    'Only straight-duct friction is sized here; fittings add losses that the system design must include. The equal-friction rate 0.08 to 0.1 in. w.c. per 100 ft (0.65 to 0.8 Pa/m) is common for residential and low-pressure supply ducts.',
  ],
  notes: [
    'Verification 2026-11-07: at 0.10 in. w.c. per 100 ft the calculator gives 5.8 in for 100 cfm, 9.7 in for 400 cfm, 13.65 in for 1 000 cfm and 17.7 in for 2 000 cfm, matching readings of the ASHRAE friction chart for galvanized duct (6, 10, 14 and 18 in standard sizes).',
  ],
  sources: [
    'ASHRAE Handbook — Fundamentals (SI), Chapter 21 Duct Design: eqs. (18) Darcy–Weisbach, (19) Colebrook, (25) Huebscher equivalent diameter; Table 1 duct roughness',
    'EN 1506:2007 Ventilation for buildings — Sheet metal air ducts with circular cross-section (nominal diameters)',
  ],
  inputs: [
    { id: 'flow_m3s', label: 'Airflow', group: 'volume_flow', unit: 'm3_s', display: 'cfm', default: 0.4719474432, min: 1e-4, max: 1000 },
    { id: 'method', label: 'Size by', type: 'select', default: 'friction', options: [{ value: 'friction', label: 'Friction rate (equal friction method)' }, { value: 'velocity', label: 'Air velocity' }] },
    { id: 'friction_pa_m', label: 'Friction rate', group: 'pressure_gradient', unit: 'Pa_m', display: 'inwc_100ft', default: 0.8172208, min: 0.01, max: 50, visibleWhen: { method: 'friction' } },
    { id: 'velocity_m_s', label: 'Air velocity', group: 'speed', unit: 'm_s', display: 'fpm', default: 4.572, min: 0.1, max: 40, visibleWhen: { method: 'velocity' } },
    { id: 'roughness_m', label: 'Duct roughness (galvanized 0.09 mm)', group: 'length', unit: 'm', display: 'mm', default: 0.00009, min: 0, max: 0.01 },
    { id: 'side_a_m', label: 'Rectangular duct: fixed side', group: 'length', unit: 'm', display: 'in', default: 0.2032, min: 0.02, max: 5 },
  ],
  outputs: [
    { id: 'diameter_m', label: 'Round duct diameter (exact)', group: 'length', unit: 'm', display: 'in' },
    { id: 'velocity_out_m_s', label: 'Velocity at that diameter', group: 'speed', unit: 'm_s', display: 'fpm' },
    { id: 'friction_out_pa_m', label: 'Friction rate at that diameter', group: 'pressure_gradient', unit: 'Pa_m', display: 'inwc_100ft' },
    { id: 'round_in', label: 'Next standard round size, inches', type: 'text' },
    { id: 'round_mm', label: 'Next standard round size, metric (EN 1506)', type: 'text' },
    { id: 'side_b_m', label: 'Rectangular duct: other side', group: 'length', unit: 'm', display: 'in' },
    { id: 'aspect', label: 'Rectangular aspect ratio', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'velocity_pressure_pa', label: 'Velocity pressure', group: 'pressure', unit: 'Pa', display: 'inH2O' },
  ],
  example: {
    inputs: { flow_m3s: [1000, 'cfm'], method: 'friction', friction_pa_m: [0.1, 'inwc_100ft'], roughness_m: [0.09, 'mm'], side_a_m: [8, 'in'] },
    results: { diameter_m: '13.65 in', velocity_out_m_s: '983 ft/min' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.method, ['friction', 'velocity'], 'method', 'Size by');
  const q = assertPositive(x.flow_m3s, 'flow_m3s', 'Airflow');
  const eps = assertRange(x.roughness_m, 0, 0.01, 'roughness_m', 'Duct roughness');
  const a = assertPositive(x.side_a_m, 'side_a_m', 'Rectangular duct: fixed side');
  let d;
  if (x.method === 'friction') d = diameterForFriction(q, assertPositive(x.friction_pa_m, 'friction_pa_m', 'Friction rate'), eps);
  else d = Math.sqrt((4 * q) / (Math.PI * assertPositive(x.velocity_m_s, 'velocity_m_s', 'Air velocity')));
  const v = q / ((Math.PI / 4) * d * d);
  const inch = ROUND_IN.find((s) => s * IN >= d - 1e-9);
  const mm = ROUND_MM.find((s) => s / 1000 >= d - 1e-9);
  const b = otherSide(a, d);
  const warnings = [];
  if (b === null) warnings.push('The fixed side is too small to reach this size at any reasonable width; enter a larger fixed side.');
  else if (Math.max(a, b) / Math.min(a, b) > 4) warnings.push('Aspect ratio above 4 : 1: friction, noise and material rise; choose a squarer duct.');
  if (v > 5.08) warnings.push('Velocity above 1 000 ft/min (5 m/s): fine for mains, but branches and runouts in homes are usually kept below 600–900 ft/min to limit noise.');
  return {
    outputs: {
      diameter_m: d,
      velocity_out_m_s: v,
      friction_out_pa_m: frictionRate(q, d, eps),
      round_in: inch ? `${inch} in` : 'Larger than 36 in',
      round_mm: mm ? `${mm} mm` : 'Larger than 1 250 mm',
      side_b_m: b,
      aspect: b === null ? null : Math.max(a, b) / Math.min(a, b),
      velocity_pressure_pa: 0.5 * RHO * v * v,
    },
    warnings,
  };
}
