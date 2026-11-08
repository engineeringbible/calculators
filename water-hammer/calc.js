/**
 * water-hammer/calc.js — pressure surge from a change of flow velocity in a pipeline: pressure wave speed with the pipe
 * elasticity (Korteweg), the Joukowsky surge for rapid closure, the Michaud estimate for slow closure, the critical
 * closure time, the maximum and minimum line pressures and the comparison with the pipe rating.
 *
 * a = √(K/ρ) / √(1 + (K/E)(D/e) c₁);  rapid (t_c ≤ 2L/a): Δp = ρ a Δv;  slow: Δp = 2 ρ L Δv / t_c
 * Schema units: mm, m, m/s, s, bar.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** Pipe materials: Young's modulus, GPa. */
export const MATERIALS = {
  steel: { label: 'Steel (E 207 GPa)', eGpa: 207 },
  ductile_iron: { label: 'Ductile iron (E 170 GPa)', eGpa: 170 },
  copper: { label: 'Copper / cupro-nickel (E 117 GPa)', eGpa: 117 },
  grp: { label: 'GRP / FRP (E 20 GPa)', eGpa: 20 },
  pvc: { label: 'PVC (E 3.0 GPa)', eGpa: 3.0 },
  hdpe: { label: 'HDPE (E 0.9 GPa)', eGpa: 0.9 },
  rigid: { label: 'Rigid pipe (no elasticity)', eGpa: Infinity },
};

/** Fluids: density kg/m³, bulk modulus GPa, vapour pressure at ~20 °C bar abs. */
export const FLUIDS = {
  fresh_water: { label: 'Fresh water 20 °C (ρ 998, K 2.19 GPa)', rho: 998, kGpa: 2.19, pvBarA: 0.023 },
  sea_water: { label: 'Sea water 15 °C (ρ 1 025, K 2.34 GPa)', rho: 1025, kGpa: 2.34, pvBarA: 0.017 },
  fuel_oil: { label: 'Fuel / diesel oil (ρ 850–950, K 1.5 GPa)', rho: 900, kGpa: 1.5, pvBarA: 0.001 },
  lube_oil: { label: 'Lubricating oil (ρ 880, K 1.7 GPa)', rho: 880, kGpa: 1.7, pvBarA: 0.0001 },
};

/** Pipe restraint condition factor c₁ (Wylie & Streeter, thin-walled). */
export const RESTRAINTS = {
  expansion_joints: { label: 'Expansion joints throughout (c₁ = 1)', c1: 1.0 },
  anchored_upstream: { label: 'Anchored at the upstream end only (c₁ = 1 − ν/2 = 0.85)', c1: 0.85 },
  anchored_fully: { label: 'Anchored against axial movement throughout (c₁ = 1 − ν² = 0.91)', c1: 0.91 },
};

export const schema = {
  id: 'water-hammer',
  name: 'Water hammer (Joukowsky)',
  category: 'thermal',
  summary: 'Pressure surge from valve closure or pump trip: Korteweg wave speed with pipe elasticity, Joukowsky and Michaud surges, critical time, line pressure check.',
  related: ['pipe-flow', 'pump-affinity', 'pump-npsh', 'pipe-wall-thickness', 'pressure-vessel'],
  sendTo: [
    {
      target: 'pipe-wall-thickness',
      label: 'Pipe wall thickness for the surge pressure (ASME B31.3)',
      note: 'Takes the peak pressure (steady plus surge) as the design pressure, which is conservative: ASME B31.3 §302.2.4 allows short occasional excursions above the design pressure. Enter the outside diameter, material and temperature there.',
      links: [{ to: 'design_pressure_bar', from: 'max_pressure_pa' }],
    },
  ],
  assumptions: [
    'Joukowsky (1898): an instantaneous change of velocity Δv in a liquid-filled pipe produces a pressure change Δp = ρ a Δv that travels at the wave speed a; "instantaneous" means the valve closes in less than the critical time 2L/a, the time for the wave to travel to the reservoir and back — any closure faster than that gives the full Joukowsky surge, however short.',
    'Wave speed by Korteweg: a = √(K/ρ) / √(1 + (K/E)(D/e) c₁) for a thin-walled pipe (D/e > 25), with the bulk modulus K of the liquid, Young\'s modulus E of the pipe wall and the restraint factor c₁ (1.0 with expansion joints, 1 − ν/2 anchored upstream, 1 − ν² anchored throughout, ν 0.3); entrained air lowers the wave speed drastically (1 % free air can halve it), which is not modelled.',
    'Slow closure (t_c > 2L/a): the surge is estimated by Michaud\'s formula Δp = 2 ρ L Δv/t_c, which assumes a linear velocity decay and is conservative for most valves; the real surge depends on the valve characteristic and needs a method-of-characteristics transient analysis for design.',
    'Line pressures: maximum = steady pressure + surge; minimum = steady pressure − surge; when the minimum falls below the vapour pressure the column separates and the subsequent collapse produces a second, often higher, surge not covered here; the pipe rating entered (e.g. PN class) is compared with the maximum pressure.',
    'Single straight pipe from a constant-head reservoir to the valve; friction, branches, surge vessels, air valves and pump inertia (for pump-trip events the velocity change equals the steady velocity and the check valve closure time governs) are outside the formula.',
  ],
  notes: [
    'Verification 2026-10-31: fresh water in a 300 mm steel pipe with 8 mm wall → a = 1 481/√(1 + (2.19/207)(37.5)) = 1 254 m/s (the textbook 1 200–1 300 m/s for steel); stopping 2 m/s instantly gives 25.0 bar; a 200 m line has a critical time of 0.32 s, so a 1 s closure is "slow" and Michaud gives 8.0 bar — the upsurge (13 bar) is within PN16 at 5 bar steady, but the downsurge to −3 bar gauge separates the column, which the page flags; 5 s keeps the swing within 3.4–6.6 bar; an SDR 11 HDPE pipe of the same bore (27.3 mm wall) lowers the wave speed to 281 m/s and the Joukowsky surge to 5.6 bar (the same 8 mm wall in HDPE would give 154 m/s).',
    'Design decision: Michaud for slow closures because it is the standard first estimate and conservative; the page insists on a transient analysis for design where the result is close to the rating.',
  ],
  sources: [
    'N. Joukowsky, "Über den hydraulischen Stoss in Wasserleitungsröhren", 1898 (English: Simin, Proc. AWWA 1904)',
    'E. B. Wylie, V. L. Streeter, Fluid Transients in Systems, Prentice Hall 1993 — wave speed with pipe restraint (c₁), method of characteristics',
    'M. H. Chaudhry, Applied Hydraulic Transients, 3rd ed., Springer 2014 — Joukowsky, Michaud, column separation',
    'B. B. Sharp, D. B. Sharp, Water Hammer: Practical Solutions, Butterworth-Heinemann 1996 — closure times and surge protection',
  ],
  inputs: [
    { id: 'diameter_mm', label: 'Pipe internal diameter D', group: 'length', unit: 'mm', default: 300, min: 5, max: 5000 },
    { id: 'wall_mm', label: 'Wall thickness e', group: 'length', unit: 'mm', default: 8, min: 0.5, max: 200 },
    { id: 'material', label: 'Pipe material', type: 'select', default: 'steel', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'restraint', label: 'Pipe restraint', type: 'select', default: 'expansion_joints', options: Object.entries(RESTRAINTS).map(([value, r]) => ({ value, label: r.label })) },
    { id: 'fluid', label: 'Liquid', type: 'select', default: 'fresh_water', options: Object.entries(FLUIDS).map(([value, f]) => ({ value, label: f.label })) },
    { id: 'velocity_change_m_s', label: 'Velocity change Δv (steady velocity for full closure)', group: 'speed', unit: 'm_s', default: 2.0, min: 0.01, max: 20 },
    { id: 'length_m', label: 'Pipe length from the reservoir (or pump) to the valve L', group: 'length', unit: 'm', default: 200, min: 1, max: 50000 },
    { id: 'closure_time_s', label: 'Valve closure (or stoppage) time t_c', group: 'time', unit: 's', default: 1.0, min: 0.001, max: 600 },
    { id: 'steady_pressure_bar', label: 'Steady pressure at the valve', group: 'pressure', unit: 'bar', default: 5, min: 0, max: 400 },
    { id: 'pipe_rating_bar', label: 'Pipe / fitting pressure rating (PN)', group: 'pressure', unit: 'bar', default: 16, min: 0.5, max: 700 },
  ],
  outputs: [
    { id: 'wave_speed_fluid_m_s', label: 'Acoustic speed in the liquid √(K/ρ)', group: 'speed', unit: 'm_s' },
    { id: 'wave_speed_m_s', label: 'Pressure wave speed in the pipe a (Korteweg)', group: 'speed', unit: 'm_s' },
    { id: 'critical_time_s', label: 'Critical closure time 2L/a', group: 'time', unit: 's' },
    { id: 'closure_class', label: 'Closure classification', type: 'text' },
    { id: 'joukowsky_pa', label: 'Joukowsky surge ρ a Δv (instantaneous)', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'michaud_pa', label: 'Michaud surge 2 ρ L Δv / t_c (slow closure estimate)', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'design_surge_pa', label: 'Surge to design for', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'max_pressure_pa', label: 'Maximum line pressure (steady + surge)', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'min_pressure_pa', label: 'Minimum line pressure (steady − surge, gauge)', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'rating_check', label: 'Pipe rating check', type: 'text' },
    { id: 'period_s', label: 'Surge period 4L/a', group: 'time', unit: 's' },
    { id: 'safe_closure_time_s', label: 'Closure time for a surge no more than 10 % of the rating', group: 'time', unit: 's' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      wave_speed_fluid_m_s: '1 481 m/s',
      critical_time_s: '0.32 s',
      joukowsky_pa: '25.0 bar',
      michaud_pa: '8.0 bar',
      design_surge_pa: '8.0 bar',
      max_pressure_pa: '13.0 bar',
    },
  },
};

/** Korteweg wave speed, m/s. */
export function waveSpeed(rhoKgM3, kPa, ePa, diameterM, wallM, c1 = 1) {
  const a0 = Math.sqrt(kPa / rhoKgM3);
  if (!Number.isFinite(ePa)) return a0;
  return a0 / Math.sqrt(1 + (kPa / ePa) * (diameterM / wallM) * c1);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.diameter_mm, 'diameter_mm', 'Diameter');
  assertPositive(i.wall_mm, 'wall_mm', 'Wall thickness');
  assertOneOf(i.material, Object.keys(MATERIALS), 'material', 'Material');
  assertOneOf(i.restraint, Object.keys(RESTRAINTS), 'restraint', 'Restraint');
  assertOneOf(i.fluid, Object.keys(FLUIDS), 'fluid', 'Fluid');
  assertPositive(i.velocity_change_m_s, 'velocity_change_m_s', 'Velocity change');
  assertPositive(i.length_m, 'length_m', 'Length');
  assertPositive(i.closure_time_s, 'closure_time_s', 'Closure time');
  assertNonNegative(i.steady_pressure_bar, 'steady_pressure_bar', 'Steady pressure');
  assertPositive(i.pipe_rating_bar, 'pipe_rating_bar', 'Rating');

  const fluid = FLUIDS[i.fluid];
  const E = MATERIALS[i.material].eGpa * 1e9;
  const K = fluid.kGpa * 1e9;
  const a0 = Math.sqrt(K / fluid.rho);
  const a = waveSpeed(fluid.rho, K, E, i.diameter_mm / 1000, i.wall_mm / 1000, RESTRAINTS[i.restraint].c1);
  const tCrit = (2 * i.length_m) / a;
  const joukowsky = fluid.rho * a * i.velocity_change_m_s;
  const michaud = (2 * fluid.rho * i.length_m * i.velocity_change_m_s) / i.closure_time_s;
  const rapid = i.closure_time_s <= tCrit;
  const surge = rapid ? joukowsky : Math.min(joukowsky, michaud);
  const steady = i.steady_pressure_bar * 1e5;
  const pMax = steady + surge;
  const pMin = steady - surge;
  const rating = i.pipe_rating_bar * 1e5;
  const safeTime = Math.max(tCrit, (2 * fluid.rho * i.length_m * i.velocity_change_m_s) / (0.1 * rating));

  const warnings = [];
  if (i.diameter_mm / i.wall_mm < 25) warnings.push('D/e below 25: thick-walled pipe — the thin-wall Korteweg formula over-estimates the elasticity effect slightly (conservative on wave speed).');
  if (pMax > rating) warnings.push(`Maximum pressure ${(pMax / 1e5).toFixed(1)} bar exceeds the ${i.pipe_rating_bar} bar rating: slow the closure, add a surge vessel or air valve, or re-rate the line.`);
  if (pMin < -1e5 + fluid.pvBarA * 1e5) warnings.push('Minimum pressure below the vapour pressure: column separation — the cavity collapse can produce a surge above the Joukowsky value; a transient analysis is required.');
  else if (pMin < 0) warnings.push('Minimum pressure below atmospheric (sub-atmospheric gauge): check for air ingress at vents and joints.');
  if (!rapid) warnings.push('Slow closure: the Michaud estimate assumes a linear velocity decay and is conservative for most valves; use a transient analysis for design where the margin is small.');
  if (i.material === 'rigid') warnings.push('Rigid pipe: the wave speed is the liquid acoustic speed — the upper bound of the surge.');
  warnings.push('Entrained air, friction, branches and pump inertia are not modelled: 1 % of free air can halve the wave speed; pump trips need the check-valve closure time as t_c.');
  warnings.push('For design, confirm with a method-of-characteristics transient analysis (Wylie & Streeter), especially for long lines and column separation.');

  return {
    outputs: {
      wave_speed_fluid_m_s: a0,
      wave_speed_m_s: a,
      critical_time_s: tCrit,
      closure_class: rapid ? `RAPID — t_c ${i.closure_time_s} s ≤ 2L/a ${tCrit.toFixed(3)} s: full Joukowsky surge` : `SLOW — t_c ${i.closure_time_s} s > 2L/a ${tCrit.toFixed(3)} s: surge reduced (Michaud estimate)`,
      joukowsky_pa: joukowsky,
      michaud_pa: michaud,
      design_surge_pa: surge,
      max_pressure_pa: pMax,
      min_pressure_pa: pMin,
      rating_check: pMax <= rating ? `OK — ${(pMax / 1e5).toFixed(1)} bar ≤ PN ${i.pipe_rating_bar} (${((pMax / rating) * 100).toFixed(0)} % of rating)` : `EXCEEDED — ${(pMax / 1e5).toFixed(1)} bar > PN ${i.pipe_rating_bar}`,
      period_s: (4 * i.length_m) / a,
      safe_closure_time_s: safeTime,
    },
    warnings,
  };
}
