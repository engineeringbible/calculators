/**
 * heat-exchanger-ntu/calc.js — effectiveness–NTU rating of a two-stream heat exchanger: from UA (or U and A), both
 * inlet temperatures and both heat capacity rates, the effectiveness, duty and both outlet temperatures.
 *
 * C = ṁ c_p, C_r = C_min / C_max, NTU = UA / C_min, q = ε C_min (T_h,in − T_c,in) (Incropera 7th ed., §11.4).
 * ε(NTU, C_r) from Incropera Table 11.3: parallel (11.28a), counterflow (11.29a), shell-and-tube with n shell passes
 * (11.30a, 11.31a), cross-flow both fluids unmixed (11.32, approximate), C_max mixed (11.33a), C_min mixed (11.34a),
 * and C_r = 0 for every exchanger (11.35a). T_h,out = T_h,in − q/C_h, T_c,out = T_c,in + q/C_c.
 * Schema units: SI — °C, kg/s, J/(kg·K), W/(m²·K), m², W; UA and C in W/K (dimensionless group).
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf, assertRange, assertInteger } from '../shared/validate.js';

export const ARRANGEMENTS = {
  counter: 'Counterflow',
  parallel: 'Parallel flow',
  shell: 'Shell-and-tube, n shell passes, 2, 4… tube passes each',
  cross_unmixed: 'Cross-flow, both fluids unmixed',
  cross_hot_mixed: 'Cross-flow, hot fluid mixed, cold unmixed',
  cross_cold_mixed: 'Cross-flow, cold fluid mixed, hot unmixed',
  condensing: 'Hot side condensing at constant temperature (C_r = 0)',
  boiling: 'Cold side boiling at constant temperature (C_r = 0)',
};

const NEAR_ONE = 1e-9;

/** One shell pass with 2, 4… tube passes, Incropera eq. 11.30a. */
function epsShell1(ntu1, cr) {
  const s = Math.sqrt(1 + cr * cr);
  const e = Math.exp(-ntu1 * s);
  return 2 / (1 + cr + (s * (1 + e)) / (1 - e));
}

/**
 * Effectiveness for an arrangement; `kind` picks the cross-flow mixed relation:
 * 'cmax_mixed' or 'cmin_mixed'. Returns { eps, relation }.
 */
export function effectiveness(arrangement, ntu, cr, shells = 1) {
  if (cr === 0) return { eps: -Math.expm1(-ntu), relation: 'ε = 1 − exp(−NTU), C_r = 0 (eq. 11.35a)' };
  switch (arrangement) {
    case 'parallel':
      return { eps: -Math.expm1(-ntu * (1 + cr)) / (1 + cr), relation: 'Parallel flow (eq. 11.28a)' };
    case 'counter': {
      if (Math.abs(1 - cr) < NEAR_ONE) return { eps: ntu / (1 + ntu), relation: 'Counterflow, C_r = 1 (eq. 11.29a)' };
      const e = Math.exp(-ntu * (1 - cr));
      return { eps: (1 - e) / (1 - cr * e), relation: 'Counterflow (eq. 11.29a)' };
    }
    case 'shell': {
      const e1 = epsShell1(ntu / shells, cr);
      if (shells === 1) return { eps: e1, relation: 'Shell-and-tube, one shell pass (eq. 11.30a)' };
      if (Math.abs(1 - cr) < NEAR_ONE) return { eps: (shells * e1) / (1 + (shells - 1) * e1), relation: `Shell-and-tube, ${shells} shell passes, C_r = 1 (eq. 11.31a limit)` };
      const r = ((1 - e1 * cr) / (1 - e1)) ** shells;
      return { eps: (r - 1) / (r - cr), relation: `Shell-and-tube, ${shells} shell passes (eq. 11.31a)` };
    }
    case 'cross_unmixed':
      return { eps: -Math.expm1((1 / cr) * ntu ** 0.22 * Math.expm1(-cr * ntu ** 0.78)), relation: 'Cross-flow, both unmixed (eq. 11.32, approximate)' };
    case 'cmax_mixed':
      return { eps: -Math.expm1(-cr * -Math.expm1(-ntu)) / cr, relation: 'Cross-flow, C_max mixed, C_min unmixed (eq. 11.33a)' };
    case 'cmin_mixed':
      return { eps: -Math.expm1(Math.expm1(-cr * ntu) / cr), relation: 'Cross-flow, C_min mixed, C_max unmixed (eq. 11.34a)' };
    default:
      throw new Error(`Flow arrangement: unknown arrangement ${arrangement}`);
  }
}

export const schema = {
  id: 'heat-exchanger-ntu',
  name: 'Heat exchanger effectiveness–NTU calculator',
  category: 'thermal',
  summary: 'Effectiveness, NTU, duty and both outlet temperatures of a heat exchanger from UA and the inlet conditions: counter, parallel, shell-and-tube, cross-flow.',
  related: ['heat-exchanger-lmtd', 'heat-transfer', 'specific-heat', 'pipe-insulation'],
  assumptions: [
    'Steady state, no heat loss to the surroundings, constant specific heats and a uniform overall coefficient U over the whole area, as in the ε-NTU relations of Incropera Table 11.3.',
    'The shell-and-tube relation is for n identical shells in series, each with one shell pass and an even number of tube passes; the cross-flow relation for both fluids unmixed is the usual approximation (eq. 11.32): it is exact as C_r tends to 0 and stays within 4 % of the exact series for C_r up to 1 and NTU from 0.25 to 5 (1.6 % low at C_r = 1, NTU = 1).',
    'A condensing or boiling stream is treated as having an infinite heat capacity rate (C_r = 0) at its inlet temperature; subcooling or superheat sections need a separate zone.',
    'UA is the clean or service value the user enters; fouling, fin efficiency and wall resistance must already be in it.',
  ],
  notes: [
    'Verification 2026-11-08: Incropera Example 11.1 rated with ε-NTU (oil 0.1 kg/s, 2 131 J/(kg·K), 100 °C in; water 0.2 kg/s, 4 178 J/(kg·K), 30 °C in; U = 38.1 W/(m²·K), A = 5.176 m², counterflow) gives NTU 0.925, C_r 0.255, ε 0.571, q = 8 521 W, oil out 60.0 °C and water out 40.2 °C, matching the LMTD solution of the example and the heat-exchanger-lmtd calculator. Checked by hand.',
    'Verification: for one shell pass the duty equals U A F LMTD with the Bowman F factor of the LMTD calculator to 10⁻⁹, and the cross-flow approximation stays within 4 % of the exact series (Kays and London: ε = 0.476 at C_r = 1, NTU = 1) for C_r 0.25 to 1 and NTU 0.25 to 5.',
  ],
  sources: [
    'Incropera, DeWitt, Bergman & Lavine, Fundamentals of Heat and Mass Transfer, 7th ed., §11.4, Table 11.3 (eqs. 11.28a–11.35a) and Example 11.1',
    'Kays, W.M. & London, A.L., Compact Heat Exchangers, 3rd ed., Chapter 2 (ε-NTU relations and the exact cross-flow series)',
    'Shah, R.K. & Sekulić, D.P., Fundamentals of Heat Exchanger Design, Wiley 2003, Chapter 3 (ε-NTU method)',
  ],
  inputs: [
    { id: 'arrangement', label: 'Flow arrangement', type: 'select', default: 'counter', options: Object.entries(ARRANGEMENTS).map(([value, label]) => ({ value, label })) },
    { id: 'shells', label: 'Number of shell passes n', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 6, integer: true, visibleWhen: { arrangement: 'shell' } },
    { id: 'ua_mode', label: 'Conductance given as', type: 'select', default: 'u_area', options: [{ value: 'u_area', label: 'U and area A' }, { value: 'ua', label: 'UA directly' }] },
    { id: 'u_w_m2k', label: 'Overall heat transfer coefficient U', group: 'heat_transfer_coefficient', unit: 'W_m2K', default: 38.1, min: 0.1, max: 50000, visibleWhen: { ua_mode: 'u_area' }, help: 'Typical: water–water 800–1 500; oil–water 100–350; gas–water 20–60 W/(m²·K).' },
    { id: 'area_m2', label: 'Heat transfer area A', group: 'area', unit: 'm2', default: 5.176, min: 1e-4, max: 1e6, visibleWhen: { ua_mode: 'u_area' } },
    { id: 'ua_w_k', label: 'UA, W/K', group: 'dimensionless', unit: 'none', default: 197.2, min: 1e-3, max: 1e9, visibleWhen: { ua_mode: 'ua' } },
    { id: 'th_in_c', label: 'Hot fluid inlet T_h,in', group: 'temperature', unit: 'C', default: 100, min: -200, max: 2000 },
    { id: 'm_hot_kg_s', label: 'Hot mass flow ṁ_h', group: 'mass_flow', unit: 'kg_s', default: 0.1, min: 1e-6, max: 1e5, visibleWhen: { arrangement: ['counter', 'parallel', 'shell', 'cross_unmixed', 'cross_hot_mixed', 'cross_cold_mixed', 'boiling'] } },
    { id: 'cp_hot_j_kgk', label: 'Hot specific heat c_p,h', group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK', default: 2131, min: 100, max: 20000, visibleWhen: { arrangement: ['counter', 'parallel', 'shell', 'cross_unmixed', 'cross_hot_mixed', 'cross_cold_mixed', 'boiling'] }, help: 'Water 4 180, lubricating oil about 2 100, air 1 005, sea water 3 990 J/(kg·K).' },
    { id: 'tc_in_c', label: 'Cold fluid inlet T_c,in', group: 'temperature', unit: 'C', default: 30, min: -200, max: 2000 },
    { id: 'm_cold_kg_s', label: 'Cold mass flow ṁ_c', group: 'mass_flow', unit: 'kg_s', default: 0.2, min: 1e-6, max: 1e5, visibleWhen: { arrangement: ['counter', 'parallel', 'shell', 'cross_unmixed', 'cross_hot_mixed', 'cross_cold_mixed', 'condensing'] } },
    { id: 'cp_cold_j_kgk', label: 'Cold specific heat c_p,c', group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK', default: 4178, min: 100, max: 20000, visibleWhen: { arrangement: ['counter', 'parallel', 'shell', 'cross_unmixed', 'cross_hot_mixed', 'cross_cold_mixed', 'condensing'] } },
    { id: 'hfg_j_kg', label: 'Latent heat of the phase-change stream (optional)', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg', default: 0, min: 0, max: 1e7, visibleWhen: { arrangement: ['condensing', 'boiling'] }, help: 'Steam at 1 atm: 2 257 kJ/kg.' },
  ],
  outputs: [
    { id: 'c_hot_w_k', label: 'Hot capacity rate C_h = ṁ_h c_p,h, W/K', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'c_cold_w_k', label: 'Cold capacity rate C_c = ṁ_c c_p,c, W/K', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'c_min_w_k', label: 'C_min, W/K', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'cmin_side', label: 'Stream with C_min', type: 'text' },
    { id: 'cr', label: 'Capacity ratio C_r = C_min / C_max', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'ua_out_w_k', label: 'UA, W/K', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'ntu', label: 'Number of transfer units NTU = UA / C_min', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'effectiveness', label: 'Effectiveness ε', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'relation', label: 'Relation used (Incropera Table 11.3)', type: 'text' },
    { id: 'q_max_w', label: 'Maximum possible duty C_min (T_h,in − T_c,in)', group: 'power', unit: 'W', display: 'kW' },
    { id: 'duty_w', label: 'Heat duty q', group: 'power', unit: 'W', display: 'kW' },
    { id: 'th_out_c', label: 'Hot outlet T_h,out', group: 'temperature', unit: 'C' },
    { id: 'tc_out_c', label: 'Cold outlet T_c,out', group: 'temperature', unit: 'C' },
    { id: 'mean_dt_k', label: 'Mean temperature difference q / UA', group: 'temperature_difference', unit: 'K' },
    { id: 'phase_rate_kg_s', label: 'Rate of condensation or evaporation', group: 'mass_flow', unit: 'kg_s', display: 'kg_h' },
  ],
  example: {
    inputs: { arrangement: 'counter', ua_mode: 'u_area', u_w_m2k: [38.1, 'W_m2K'], area_m2: [5.176, 'm2'], th_in_c: [100, 'C'], m_hot_kg_s: [0.1, 'kg_s'], cp_hot_j_kgk: [2131, 'J_kgK'], tc_in_c: [30, 'C'], m_cold_kg_s: [0.2, 'kg_s'], cp_cold_j_kgk: [4178, 'J_kgK'] },
    results: { c_hot_w_k: '213.1', c_cold_w_k: '835.6', cr: '0.255', ua_out_w_k: '197.2', ntu: '0.925', duty_w: '8.52 kW', th_out_c: '60.0 °C', tc_out_c: '40.2 °C' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.arrangement, Object.keys(ARRANGEMENTS), 'arrangement', 'Flow arrangement');
  assertOneOf(x.ua_mode, ['u_area', 'ua'], 'ua_mode', 'Conductance given as');
  const ua = x.ua_mode === 'ua'
    ? assertPositive(x.ua_w_k, 'ua_w_k', 'UA')
    : assertPositive(x.u_w_m2k, 'u_w_m2k', 'Overall heat transfer coefficient U') * assertPositive(x.area_m2, 'area_m2', 'Heat transfer area A');
  const thIn = assertRange(x.th_in_c, -200, 2000, 'th_in_c', 'Hot fluid inlet');
  const tcIn = assertRange(x.tc_in_c, -200, 2000, 'tc_in_c', 'Cold fluid inlet');
  if (thIn <= tcIn) throw new Error('Hot fluid inlet: it must be warmer than the cold fluid inlet.');
  const phase = x.arrangement === 'condensing' || x.arrangement === 'boiling';
  const ch = x.arrangement === 'condensing' ? Infinity : assertPositive(x.m_hot_kg_s, 'm_hot_kg_s', 'Hot mass flow') * assertPositive(x.cp_hot_j_kgk, 'cp_hot_j_kgk', 'Hot specific heat');
  const cc = x.arrangement === 'boiling' ? Infinity : assertPositive(x.m_cold_kg_s, 'm_cold_kg_s', 'Cold mass flow') * assertPositive(x.cp_cold_j_kgk, 'cp_cold_j_kgk', 'Cold specific heat');
  let shells = 1;
  if (x.arrangement === 'shell') shells = assertInteger(assertRange(x.shells, 1, 6, 'shells', 'Number of shell passes'), 'shells', 'Number of shell passes');
  const hfg = phase ? assertNonNegative(x.hfg_j_kg, 'hfg_j_kg', 'Latent heat') : 0;
  const cmin = Math.min(ch, cc);
  const cmax = Math.max(ch, cc);
  const cr = phase ? 0 : cmin / cmax;
  const ntu = ua / cmin;
  let kind = x.arrangement;
  if (kind === 'cross_hot_mixed') kind = ch >= cc ? 'cmax_mixed' : 'cmin_mixed';
  if (kind === 'cross_cold_mixed') kind = cc >= ch ? 'cmax_mixed' : 'cmin_mixed';
  const { eps, relation } = effectiveness(kind, ntu, cr, shells);
  const qMax = cmin * (thIn - tcIn);
  const q = eps * qMax;
  const thOut = Number.isFinite(ch) ? thIn - q / ch : thIn;
  const tcOut = Number.isFinite(cc) ? tcIn + q / cc : tcIn;
  const warnings = [];
  if (ntu > 5) warnings.push('NTU above 5: the effectiveness is close to its limit, so extra area adds little duty.');
  if (x.arrangement === 'parallel' && cr > 0) warnings.push('Parallel flow can never exceed ε = 1/(1 + C_r); counterflow gives more duty from the same area.');
  if (x.arrangement === 'shell' && shells === 1 && tcOut > thOut + 1e-9) warnings.push('Temperature cross in a single shell: the LMTD correction factor is low here; consider more shells in series or counterflow.');
  return {
    outputs: {
      c_hot_w_k: Number.isFinite(ch) ? ch : null,
      c_cold_w_k: Number.isFinite(cc) ? cc : null,
      c_min_w_k: cmin,
      cmin_side: ch < cc ? 'Hot fluid' : cc < ch ? 'Cold fluid' : 'Both equal (C_r = 1)',
      cr,
      ua_out_w_k: ua,
      ntu,
      effectiveness: eps,
      relation,
      q_max_w: qMax,
      duty_w: q,
      th_out_c: thOut,
      tc_out_c: tcOut,
      mean_dt_k: q / ua,
      phase_rate_kg_s: phase && hfg > 0 ? q / hfg : null,
    },
    warnings,
  };
}
