/**
 * newtons-cooling/calc.js — Newton's law of cooling (lumped capacitance): temperature after a time or time to reach a
 * temperature, with the time constant entered, from h, A, ρ, V, c (with the Biot-number check) or from two readings.
 *
 * T(t) = T∞ + (T0 − T∞) e^(−t/τ);  t = τ ln[(T0 − T∞)/(T − T∞)];  τ = ρ V c / (h A);  Bi = h (V/A) / k < 0.1
 * (Incropera, Fundamentals of Heat and Mass Transfer, Section 5.1–5.2, eqs. 5.6, 5.10);  from two readings:
 * τ = t1 / ln[(T0 − T∞)/(T1 − T∞)].  Schema units: SI — °C, s, m, kg/m³, J/(kg·K), W/(m·K), W/(m²·K), J.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

/** Volume and surface area of the body: sphere (diameter), cylinder (diameter, length, ends included) or as entered. */
export function geometry(shape, d, l, v, a) {
  if (shape === 'sphere') return { v: (Math.PI * d ** 3) / 6, a: Math.PI * d * d };
  if (shape === 'cylinder') return { v: (Math.PI / 4) * d * d * l, a: Math.PI * d * l + (Math.PI / 2) * d * d };
  return { v, a };
}

export const schema = {
  id: 'newtons-cooling',
  name: "Newton's law of cooling calculator",
  category: 'thermal',
  summary: "Temperature after a time or time to cool or heat by Newton's law of cooling, with the time constant from h, A, m, c (Biot check) or from two readings.",
  related: ['heat-transfer', 'specific-heat', 'water-heating-time', 'thermal-expansion'],
  assumptions: [
    'The body has one uniform temperature at any instant (lumped capacitance). This holds when the Biot number h L_c / k, with L_c = V/A, is below 0.1 (Incropera Section 5.2); above that the surface cools faster than the core and the result is only indicative.',
    'The surrounding temperature T∞, the heat transfer coefficient h and the properties are constant. Radiation can be included in h as a linearised coefficient; for large temperature differences it varies and the curve is no longer a pure exponential.',
    'The same equation covers heating: a body colder than its surroundings approaches T∞ from below with the same time constant.',
    'From two readings, the first is taken as the start (t = 0) and the time constant follows from the ratio of the temperature differences; both readings must lie on the same side of T∞.',
    'A cylinder includes both ends in its surface area; for a long rod or wire whose ends are insulated, use the custom shape.',
  ],
  notes: [
    'Verification 2026-11-08: Incropera Example 5.1, thermocouple bead D = 0.706 mm, h = 400 W/(m²·K), k = 20 W/(m·K), c = 400 J/(kg·K), ρ = 8 500 kg/m³: τ = 1.00 s, Bi = 2.35 × 10⁻³, 25 → 199 °C in a 200 °C gas stream in 5.2 s. Checked by hand.',
  ],
  sources: [
    'F. P. Incropera, D. P. DeWitt, T. L. Bergman & A. S. Lavine, Fundamentals of Heat and Mass Transfer, 7th ed., Sections 5.1–5.2 (lumped capacitance, eqs. 5.6 and 5.10, Biot number criterion) and Example 5.1',
    'Y. A. Çengel & A. J. Ghajar, Heat and Mass Transfer: Fundamentals and Applications, 5th ed., Section 4.1 (lumped system analysis, Bi ≤ 0.1)',
  ],
  inputs: [
    { id: 'find', label: 'Find', type: 'select', default: 'temperature', options: [{ value: 'temperature', label: 'Temperature after a time' }, { value: 'time', label: 'Time to reach a temperature' }] },
    { id: 'tau_from', label: 'Time constant from', type: 'select', default: 'lumped', options: [{ value: 'direct', label: 'Entered directly' }, { value: 'lumped', label: 'Body properties h, A, ρ, V, c (lumped capacitance)' }, { value: 'measured', label: 'Two temperature readings' }] },
    { id: 't0_c', label: 'Initial temperature T0 (first reading)', group: 'temperature', unit: 'C', default: 25, min: -273, max: 3000 },
    { id: 'tinf_c', label: 'Surrounding temperature T∞', group: 'temperature', unit: 'C', default: 200, min: -273, max: 3000 },
    { id: 'time_s', label: 'Time t', group: 'time', unit: 's', default: 5, min: 0, max: 1e9, visibleWhen: { find: 'temperature' } },
    { id: 't_target_c', label: 'Target temperature', group: 'temperature', unit: 'C', default: 199, min: -273, max: 3000, visibleWhen: { find: 'time' } },
    { id: 'tau_s', label: 'Time constant τ', group: 'time', unit: 's', display: 'min', default: 600, min: 1e-6, max: 1e9, visibleWhen: { tau_from: 'direct' } },
    { id: 'shape', label: 'Body shape', type: 'select', default: 'sphere', options: [{ value: 'sphere', label: 'Sphere' }, { value: 'cylinder', label: 'Cylinder (ends included)' }, { value: 'custom', label: 'Any shape: enter volume and surface area' }], visibleWhen: { tau_from: 'lumped' } },
    { id: 'diameter_m', label: 'Diameter', group: 'length', unit: 'm', display: 'mm', default: 0.000706, min: 1e-7, max: 100, visibleWhen: { tau_from: 'lumped', shape: ['sphere', 'cylinder'] } },
    { id: 'length_m', label: 'Cylinder length', group: 'length', unit: 'm', display: 'mm', default: 0.1, min: 1e-7, max: 1000, visibleWhen: { tau_from: 'lumped', shape: 'cylinder' } },
    { id: 'volume_m3', label: 'Volume V', group: 'volume', unit: 'm3', display: 'L', default: 0.001, min: 1e-15, max: 1e6, visibleWhen: { tau_from: 'lumped', shape: 'custom' } },
    { id: 'area_m2', label: 'Surface area A exposed to the fluid', group: 'area', unit: 'm2', default: 0.06, min: 1e-12, max: 1e6, visibleWhen: { tau_from: 'lumped', shape: 'custom' } },
    { id: 'density', label: 'Density ρ', group: 'density', unit: 'kg_m3', default: 8500, min: 1, max: 25000, visibleWhen: { tau_from: 'lumped' } },
    { id: 'cp', label: 'Specific heat c', group: 'specific_heat', unit: 'J_kgK', default: 400, min: 50, max: 20000, visibleWhen: { tau_from: 'lumped' } },
    { id: 'k', label: 'Thermal conductivity k of the body (for the Biot number)', group: 'thermal_conductivity', unit: 'W_mK', default: 20, min: 0.01, max: 5000, visibleWhen: { tau_from: 'lumped' } },
    { id: 'h', label: 'Heat transfer coefficient h', group: 'heat_transfer_coefficient', unit: 'W_m2K', default: 400, min: 0.1, max: 1e6, visibleWhen: { tau_from: 'lumped' }, help: 'Incropera Table 1.1: free convection gases 2–25, liquids 50–1 000; forced convection gases 25–250, liquids 100–20 000 W/(m²·K).' },
    { id: 't_meas_s', label: 'Time of the second reading', group: 'time', unit: 's', display: 'min', default: 600, min: 1e-6, max: 1e9, visibleWhen: { tau_from: 'measured' } },
    { id: 't_meas_c', label: 'Temperature at the second reading', group: 'temperature', unit: 'C', default: 70, min: -273, max: 3000, visibleWhen: { tau_from: 'measured' } },
  ],
  outputs: [
    { id: 'temp_c', label: 'Temperature at time t', group: 'temperature', unit: 'C', visibleWhen: { find: 'temperature' } },
    { id: 'time_out_s', label: 'Time to reach the target', group: 'time', unit: 's', display: 'min', visibleWhen: { find: 'time' } },
    { id: 'tau_out_s', label: 'Time constant τ', group: 'time', unit: 's', display: 'min' },
    { id: 'half_s', label: 'Time for the difference to halve, τ ln 2', group: 'time', unit: 's', display: 'min' },
    { id: 'k_per_h', label: 'Cooling constant k = 1/τ, per hour', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'biot', label: 'Biot number h (V/A) / k', group: 'dimensionless', unit: 'none', decimals: 5, visibleWhen: { tau_from: 'lumped' } },
    { id: 'validity', label: 'Lumped capacitance check', type: 'text', visibleWhen: { tau_from: 'lumped' } },
    { id: 'mass_kg', label: 'Mass of the body', group: 'mass', unit: 'kg', visibleWhen: { tau_from: 'lumped' } },
    { id: 'heat_j', label: 'Heat gained by the body (negative: lost)', group: 'energy', unit: 'J', visibleWhen: { tau_from: 'lumped' } },
  ],
  example: {
    inputs: { find: 'time', tau_from: 'lumped', t0_c: [25, 'C'], tinf_c: [200, 'C'], t_target_c: [199, 'C'], shape: 'sphere', diameter_m: [0.706, 'mm'], density: [8500, 'kg_m3'], cp: [400, 'J_kgK'], k: [20, 'W_mK'], h: [400, 'W_m2K'] },
    results: { tau_out_s: '1.00 s', time_out_s: '5.2 s', biot: '0.00235' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.find, ['temperature', 'time'], 'find', 'Find');
  assertOneOf(x.tau_from, ['direct', 'lumped', 'measured'], 'tau_from', 'Time constant from');
  assertOneOf(x.shape, ['sphere', 'cylinder', 'custom'], 'shape', 'Body shape');
  const t0 = assertRange(x.t0_c, -273, 3000, 't0_c', 'Initial temperature');
  const tinf = assertRange(x.tinf_c, -273, 3000, 'tinf_c', 'Surrounding temperature');
  const d0 = t0 - tinf;
  const out = { temp_c: null, time_out_s: null, tau_out_s: null, half_s: null, k_per_h: null, biot: null, validity: null, mass_kg: null, heat_j: null };
  const warnings = [];
  let tau;
  let mc = null;
  if (x.tau_from === 'direct') tau = assertPositive(x.tau_s, 'tau_s', 'Time constant');
  else if (x.tau_from === 'measured') {
    const tm = assertPositive(x.t_meas_s, 't_meas_s', 'Time of the second reading');
    const d1 = assertRange(x.t_meas_c, -273, 3000, 't_meas_c', 'Temperature at the second reading') - tinf;
    if (d0 === 0) throw new Error('Initial temperature: it equals the surrounding temperature, so nothing changes.');
    if (d1 / d0 <= 0 || d1 / d0 >= 1) throw new Error('Temperature at the second reading: it must lie between the first reading and the surrounding temperature.');
    tau = tm / Math.log(d0 / d1);
  } else {
    const d = assertPositive(x.diameter_m, 'diameter_m', 'Diameter');
    const l = assertPositive(x.length_m, 'length_m', 'Cylinder length');
    const g = geometry(x.shape, d, l, assertPositive(x.volume_m3, 'volume_m3', 'Volume'), assertPositive(x.area_m2, 'area_m2', 'Surface area'));
    const rho = assertPositive(x.density, 'density', 'Density');
    const c = assertPositive(x.cp, 'cp', 'Specific heat');
    const k = assertPositive(x.k, 'k', 'Thermal conductivity');
    const h = assertPositive(x.h, 'h', 'Heat transfer coefficient');
    mc = rho * g.v * c;
    tau = mc / (h * g.a);
    const bi = (h * (g.v / g.a)) / k;
    out.biot = bi;
    out.mass_kg = rho * g.v;
    out.validity = bi < 0.1 ? `Bi = ${bi < 0.01 ? bi.toExponential(2) : bi.toFixed(3)} < 0.1: lumped capacitance is valid` : `Bi = ${bi.toFixed(2)} ≥ 0.1: the core lags the surface; use the transient conduction charts`;
    if (bi >= 0.1) warnings.push('Biot number 0.1 or more: the temperature inside the body is not uniform, so the lumped result is only an estimate (Incropera Section 5.2).');
  }
  let tEnd;
  if (x.find === 'temperature') {
    const t = assertNonNegative(x.time_s, 'time_s', 'Time');
    tEnd = tinf + d0 * Math.exp(-t / tau);
    out.temp_c = tEnd;
  } else {
    const tt = assertRange(x.t_target_c, -273, 3000, 't_target_c', 'Target temperature');
    const r = (tt - tinf) / d0;
    if (!(r > 0 && r <= 1)) throw new Error('Target temperature: it must lie between the initial and the surrounding temperature; the body only approaches T∞ and never passes it.');
    out.time_out_s = tau * Math.log(1 / r);
    tEnd = tt;
  }
  out.tau_out_s = tau;
  out.half_s = tau * Math.LN2;
  out.k_per_h = 3600 / tau;
  if (mc !== null) out.heat_j = mc * (tEnd - t0);
  return { outputs: out, warnings };
}
