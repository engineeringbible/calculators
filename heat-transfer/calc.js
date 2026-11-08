/**
 * heat-transfer/calc.js — heat flow by conduction through a plane wall, convection from a surface and radiation between
 * a surface and its surroundings, with the heat flux and thermal resistance.
 *
 * Conduction: Q = k A ΔT / L (Fourier); convection: Q = h A (T_s − T_∞) (Newton); radiation: Q = ε σ A (T_s⁴ − T_sur⁴)
 * (Stefan–Boltzmann, σ = 5.670374419e−8 W/(m²·K⁴)).  R = ΔT / Q.
 * Schema units: SI — m, m², °C, W.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';

export const SIGMA = 5.670374419e-8;

/** Thermal conductivity at about 300 K, W/(m·K) — Incropera Appendix A. */
export const CONDUCTORS = {
  copper: ['Copper (pure)', 401], aluminium: ['Aluminium (pure)', 237], steel: ['Carbon steel (AISI 1010)', 63.9],
  stainless: ['Stainless steel 304', 14.9], concrete: ['Concrete (stone mix)', 1.4], brick: ['Common brick', 0.72],
  glass: ['Glass (plate)', 1.4], water: ['Water (liquid)', 0.613], wood: ['Softwood (pine, across the grain)', 0.12],
  glassfibre: ['Glass fibre insulation', 0.046], eps: ['Expanded polystyrene', 0.04], xps: ['Extruded polystyrene', 0.027],
  air: ['Still air', 0.0263], custom: ['Other (enter k)', null],
};

export const schema = {
  id: 'heat-transfer',
  name: 'Heat transfer calculator: conduction, convection, radiation',
  category: 'thermal',
  summary: 'Heat flow by conduction through a wall (Fourier), convection from a surface (Newton) and radiation (Stefan–Boltzmann), with heat flux and thermal resistance.',
  related: ['specific-heat', 'heat-loss', 'pipe-insulation', 'heat-exchanger-lmtd'],
  assumptions: [
    'Steady state, one-dimensional heat flow; properties constant. Conduction is through a flat wall of uniform thickness; for pipes and cylinders use the pipe insulation calculator.',
    'The convection coefficient h depends on the flow: about 2–25 W/(m²·K) for free convection in gases, 25–250 for forced convection in gases, 50–1 000 for free and 100–20 000 for forced convection in liquids (Incropera Table 1.1).',
    'Radiation is between a small grey surface and large surroundings at T_sur (view factor 1); the emissivity ε is 0.9–0.95 for paint, brick and most non-metals, 0.05–0.1 for polished metal.',
    'Conductivities are typical values near room temperature; insulation values depend on density and moisture.',
  ],
  notes: [
    'Verification 2026-11-07: a 200 mm brick wall of 10 m² with 20 K across it conducts 0.72 × 10 × 20 / 0.2 = 720 W; a black (ε = 1) surface at 100 °C radiates 680.6 W/m² net to 20 °C surroundings (1 099 W/m² gross). Checked by hand.',
  ],
  sources: [
    'Incropera, F.P., DeWitt, D.P., Bergman, T.L. and Lavine, A.S., Fundamentals of Heat and Mass Transfer, 7th ed., eqs. 1.2, 1.3a, 1.7; Table 1.1; Appendix A (Tables A.1, A.3, A.6)',
    'CODATA 2018 value of the Stefan–Boltzmann constant, 5.670374419 × 10⁻⁸ W m⁻² K⁻⁴',
  ],
  inputs: [
    { id: 'mode', label: 'Heat transfer mode', type: 'select', default: 'conduction', options: [{ value: 'conduction', label: 'Conduction through a wall' }, { value: 'convection', label: 'Convection from a surface' }, { value: 'radiation', label: 'Radiation to surroundings' }] },
    { id: 'area_m2', label: 'Area A', group: 'area', unit: 'm2', default: 10, min: 1e-9, max: 1e9 },
    { id: 'material', label: 'Wall material', type: 'select', default: 'brick', options: Object.entries(CONDUCTORS).map(([value, [label]]) => ({ value, label })), visibleWhen: { mode: 'conduction' } },
    { id: 'k', label: 'Thermal conductivity k, W/(m·K)', group: 'dimensionless', unit: 'none', default: 1, min: 1e-4, max: 5000, visibleWhen: { material: 'custom' } },
    { id: 'thickness_m', label: 'Wall thickness L', group: 'length', unit: 'm', display: 'mm', default: 0.2, min: 1e-6, max: 100, visibleWhen: { mode: 'conduction' } },
    { id: 'h', label: 'Convection coefficient h, W/(m²·K)', group: 'dimensionless', unit: 'none', default: 10, min: 0.1, max: 1e5, visibleWhen: { mode: 'convection' } },
    { id: 'emissivity', label: 'Emissivity ε', group: 'dimensionless', unit: 'none', default: 0.9, min: 0.01, max: 1, visibleWhen: { mode: 'radiation' } },
    { id: 't_hot_c', label: 'Temperature of the hot side or surface', group: 'temperature', unit: 'C', default: 20, min: -273, max: 3000 },
    { id: 't_cold_c', label: 'Temperature of the cold side, fluid or surroundings', group: 'temperature', unit: 'C', default: 0, min: -273, max: 3000 },
  ],
  outputs: [
    { id: 'q_w', label: 'Heat flow Q', group: 'power', unit: 'W' },
    { id: 'flux_w_m2', label: 'Heat flux q″ (W/m²)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'r_k_w', label: 'Thermal resistance R = ΔT / Q (K/W)', group: 'dimensionless', unit: 'none', decimals: 6 },
    { id: 'h_eff', label: 'Equivalent coefficient Q / (A ΔT), W/(m²·K)', group: 'dimensionless', unit: 'none', decimals: 3 },
  ],
  example: {
    inputs: { mode: 'conduction', area_m2: [10, 'm2'], material: 'brick', thickness_m: [200, 'mm'], t_hot_c: [20, 'C'], t_cold_c: [0, 'C'] },
    results: { q_w: '720 W', flux_w_m2: '72.00' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['conduction', 'convection', 'radiation'], 'mode', 'Heat transfer mode');
  const A = assertPositive(x.area_m2, 'area_m2', 'Area');
  const th = assertRange(x.t_hot_c, -273, 3000, 't_hot_c', 'Hot side temperature');
  const tc = assertRange(x.t_cold_c, -273, 3000, 't_cold_c', 'Cold side temperature');
  const dT = th - tc;
  if (dT === 0) throw new Error('Temperatures: they must differ for heat to flow.');
  let Q;
  const warnings = [];
  if (x.mode === 'conduction') {
    assertOneOf(x.material, Object.keys(CONDUCTORS), 'material', 'Wall material');
    const k = x.material === 'custom' ? assertPositive(x.k, 'k', 'Thermal conductivity') : CONDUCTORS[x.material][1];
    Q = (k * A * dT) / assertPositive(x.thickness_m, 'thickness_m', 'Wall thickness');
  } else if (x.mode === 'convection') {
    const h = assertRange(x.h, 0.1, 1e5, 'h', 'Convection coefficient');
    Q = h * A * dT;
    if (h > 250 && h < 1000) warnings.push('h above 250 W/(m²·K) implies a liquid or a fast gas flow; check the value for gases.');
  } else {
    const e = assertRange(x.emissivity, 0.01, 1, 'emissivity', 'Emissivity');
    const Ts = th + 273.15; const Tsur = tc + 273.15;
    if (Ts < 0 || Tsur < 0) throw new Error('Temperatures: they must be above absolute zero.');
    Q = e * SIGMA * A * (Ts ** 4 - Tsur ** 4);
  }
  return {
    outputs: { q_w: Q, flux_w_m2: Q / A, r_k_w: dT / Q, h_eff: Q / (A * dT) },
    warnings,
  };
}
