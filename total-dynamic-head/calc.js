/**
 * total-dynamic-head/calc.js — total dynamic head a pump must deliver: static lift, pressure difference between the
 * suction and discharge vessels, pipe friction (Darcy–Weisbach with Colebrook) and fitting losses, with the system curve
 * constant and the hydraulic power.
 *
 * TDH = (z_d − z_s) + (p_d − p_s)/(ρ g) + (f L/D + ΣK) v²/(2g);  system curve H(Q) ≈ H_static + C Q².
 * Schema units: SI — m, m³/s, Pa, kg/m³, m²/s, W.
 */
import { withDefaults, assertPositive, assertRange, assertNonNegative, assertFinite } from '../shared/validate.js';
import { frictionFactor, G } from '../shared/pipes.js';

export const schema = {
  id: 'total-dynamic-head',
  name: 'Total dynamic head (TDH) calculator',
  category: 'mechanical',
  summary: 'Total dynamic head for pump selection from static lift, tank pressures, pipe friction and fitting losses, with the system curve and hydraulic power.',
  related: ['pump-power', 'minor-losses', 'pipe-flow', 'pump-npsh'],
  assumptions: [
    'Steady flow of a liquid between two open or closed vessels; the head is referenced to the liquid surfaces, so the velocity heads in the tanks are zero and the exit loss is one of the fitting K values.',
    'Pipe friction by Darcy–Weisbach with the Colebrook friction factor (64/Re in laminar flow); one pipe size throughout. For several sizes add their losses separately.',
    'Fitting losses enter as a total K; the minor losses calculator adds up K from the fittings by the Crane method.',
    'The system curve H(Q) ≈ H_static + C Q² assumes the friction factor stays near its value at the design flow, which holds well in fully turbulent flow.',
  ],
  notes: [
    'Verification 2026-11-07: 20 m³/h of water at 20 °C in 100 m of 77.9 mm pipe with 15 m lift and ΣK = 8: v = 1.166 m/s, Re = 90 400, f = 0.0210 (Haaland 0.0207), friction 1.86 m, fittings 0.55 m, TDH 17.42 m. Checked by hand.',
  ],
  sources: [
    'Crane Co., Technical Paper No. 410 (2018), ch. 2 (Darcy–Weisbach, Colebrook) and ch. 3 (pump head)',
    'ANSI/HI 1.3 Rotodynamic centrifugal pumps for design and application (total head, system curve)',
  ],
  inputs: [
    { id: 'flow_m3s', label: 'Flow rate', group: 'volume_flow', unit: 'm3_s', display: 'm3_h', default: 20 / 3600, min: 1e-8, max: 100 },
    { id: 'diameter_m', label: 'Pipe inside diameter', group: 'length', unit: 'm', display: 'mm', default: 0.0779, min: 0.002, max: 5 },
    { id: 'length_m', label: 'Pipe length (suction + discharge)', group: 'length', unit: 'm', default: 100, min: 0, max: 1e6 },
    { id: 'roughness_m', label: 'Pipe roughness (steel 0.046 mm, plastic 0.0015 mm)', group: 'length', unit: 'm', display: 'mm', default: 0.000046, min: 0, max: 0.01 },
    { id: 'static_m', label: 'Static lift: discharge level − suction level', group: 'length', unit: 'm', default: 15, min: -1000, max: 5000 },
    { id: 'dp_pa', label: 'Pressure difference: discharge vessel − suction vessel (gauge)', group: 'pressure', unit: 'Pa', display: 'bar', default: 0, min: -1e7, max: 1e8 },
    { id: 'k_total', label: 'Total K of fittings, valves, entrance and exit', group: 'dimensionless', unit: 'none', default: 8, min: 0, max: 1e4 },
    { id: 'density', label: 'Liquid density', group: 'density', unit: 'kg_m3', default: 998.2, min: 1, max: 2500 },
    { id: 'viscosity_m2s', label: 'Kinematic viscosity (water at 20 °C: 1.004 mm²/s)', group: 'dimensionless', unit: 'none', default: 1.004e-6, min: 1e-8, max: 0.1 },
  ],
  outputs: [
    { id: 'velocity_m_s', label: 'Velocity in the pipe', group: 'speed', unit: 'm_s' },
    { id: 're', label: 'Reynolds number', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'f', label: 'Darcy friction factor', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'friction_m', label: 'Pipe friction head', group: 'length', unit: 'm' },
    { id: 'fittings_m', label: 'Fitting losses', group: 'length', unit: 'm' },
    { id: 'pressure_head_m', label: 'Pressure head difference', group: 'length', unit: 'm' },
    { id: 'tdh_m', label: 'Total dynamic head', group: 'length', unit: 'm' },
    { id: 'hydraulic_w', label: 'Hydraulic power ρ g Q TDH', group: 'power', unit: 'W', display: 'kW' },
    { id: 'curve', label: 'System curve', type: 'text' },
  ],
  example: {
    inputs: { flow_m3s: [20, 'm3_h'], diameter_m: [77.9, 'mm'], length_m: [100, 'm'], roughness_m: [0.046, 'mm'], static_m: [15, 'm'], dp_pa: [0, 'bar'], k_total: 8, density: [998.2, 'kg_m3'], viscosity_m2s: 1.004e-6 },
    results: { friction_m: '1.86 m', fittings_m: '0.55 m', tdh_m: '17.42 m' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const Q = assertPositive(x.flow_m3s, 'flow_m3s', 'Flow rate');
  const d = assertPositive(x.diameter_m, 'diameter_m', 'Pipe inside diameter');
  const L = assertNonNegative(x.length_m, 'length_m', 'Pipe length');
  const eps = assertRange(x.roughness_m, 0, 0.01, 'roughness_m', 'Pipe roughness');
  const zs = assertFinite(x.static_m, 'static_m', 'Static lift');
  const dp = assertFinite(x.dp_pa, 'dp_pa', 'Pressure difference');
  const K = assertNonNegative(x.k_total, 'k_total', 'Total K');
  const rho = assertRange(x.density, 1, 2500, 'density', 'Liquid density');
  const nu = assertPositive(x.viscosity_m2s, 'viscosity_m2s', 'Kinematic viscosity');
  const v = Q / ((Math.PI / 4) * d * d);
  const re = (v * d) / nu;
  const f = frictionFactor(re, eps / d);
  const vh = (v * v) / (2 * G);
  const hf = ((f * L) / d) * vh;
  const hk = K * vh;
  const hp = dp / (rho * G);
  const hStatic = zs + hp;
  const tdh = hStatic + hf + hk;
  const C = (hf + hk) / (Q * Q);
  const warnings = [];
  if (re > 2300 && re < 4000) warnings.push('Reynolds number in the transition zone (2 300–4 000): the friction factor is uncertain.');
  if (v > 3) warnings.push('Velocity above 3 m/s: friction losses and wear are high; consider a larger pipe.');
  if (tdh <= 0) warnings.push('The total head is zero or negative: the liquid flows by gravity or pressure without a pump at this rate.');
  const qh = 3600;
  return {
    outputs: {
      velocity_m_s: v, re, f, friction_m: hf, fittings_m: hk, pressure_head_m: hp, tdh_m: tdh,
      hydraulic_w: tdh > 0 ? rho * G * Q * tdh : null,
      curve: `H = ${hStatic.toFixed(2)} m + ${(C / (qh * qh)).toExponential(4)} × Q² (Q in m³/h)`,
    },
    warnings,
  };
}
