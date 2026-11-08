/**
 * heat-exchanger-lmtd/calc.js — log-mean temperature difference, correction factor, duty and required area.
 *
 * LMTD for counterflow and parallel flow; analytical F correction for one shell pass with 2, 4, 6… tube passes
 * (Bowman, Mueller & Nagle 1940); duty from either stream's m·cp·ΔT or given directly; service U with fouling.
 * Effectiveness and NTU follow from the four temperatures alone.
 *
 * Schema units: temperatures °C, mass flow kg/s, cp J/(kg·K), U W/(m²·K), fouling m²·K/W, duty W, area m².
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf, assertFinite } from '../shared/validate.js';

const R_EQUAL_ONE_TOLERANCE = 1e-9;

export const schema = {
  id: 'heat-exchanger-lmtd',
  name: 'Heat exchanger LMTD',
  category: 'thermal',
  summary: 'LMTD for counter, parallel and 1-2 shell-and-tube flow, duty from either stream, F correction, fouling and required area from U.',
  related: ['pipe-flow', 'pump-affinity', 'thermal-expansion', 'unit-converter'],
  notes: [
    'Verification 2026-10-30: Incropera Example 11.1 is reproduced to the published tube length (65.9 m); the Bowman factor F(R = 1, P = 0.5) = 0.802 matches the chart; the ε-NTU counterflow relation closes on the LMTD result to 10⁻⁶.',
    'Design decision: the one-shell-pass F factor is computed analytically (Bowman 1940) instead of read from charts, with a hard error when the temperature cross is not achievable.',
    'Design decision: effectiveness, NTU and capacity ratio are derived from the four temperatures alone, which is possible because the stream with the larger temperature change is C_min.',
  ],
  assumptions: [
    'Steady state, no heat loss to the surroundings, constant specific heats and constant U along the exchanger; split the exchanger into zones for phase change or large property changes.',
    'The LMTD method needs all four terminal temperatures (sizing problem); effectiveness, NTU and capacity ratio are reported as the bridge to the ε-NTU rating method.',
    'F is the Bowman analytical correction for one shell pass with any even number of tube passes, applied to the counterflow LMTD; multi-shell, cross-flow and plate arrangements have different F curves. F below 0.75 is flagged.',
    'Parallel flow cannot deliver a temperature cross and one shell pass cannot achieve crosses beyond the Bowman limit; both raise an error instead of a number.',
    'Fouling is a total resistance in series with 1/U (TEMA design values); actual fouling depends on velocity, temperature and cleaning interval, and both sides should be referred to the same area basis as U.',
    'The U ranges in the help text are pre-sizing orders of magnitude; a real design computes U from film coefficients, wall resistance and fin efficiency.',
    'Duty from the cold or hot stream uses the entered mass flow and c_p; the other stream is not checked for energy balance.',
  ],
  sources: [
    'Incropera, DeWitt, Bergman & Lavine, Fundamentals of Heat and Mass Transfer, 6th ed., ch. 11 (Example 11.1, Fig. 11.10, Table 11.3)',
    'R.A. Bowman, A.C. Mueller & W.M. Nagle, "Mean temperature difference in design", Trans. ASME 62 (1940)',
    'TEMA Standards of the Tubular Exchanger Manufacturers Association, 10th ed., §RGP-T-2.4 (fouling resistances)',
  ],
  inputs: [
    {
      id: 'arrangement',
      label: 'Flow arrangement',
      type: 'select',
      default: 'counterflow',
      options: [
        { value: 'counterflow', label: 'Counterflow (F = 1)' },
        { value: 'parallel', label: 'Parallel (co-current) flow (F = 1)' },
        { value: 'shell_1_2', label: 'Shell-and-tube, 1 shell pass, 2/4/6… tube passes (F from Bowman)' },
      ],
    },
    { id: 'th_in_c', label: 'Hot fluid inlet T_h,in', group: 'temperature', unit: 'C', default: 100, min: -273.15, max: 2000 },
    { id: 'th_out_c', label: 'Hot fluid outlet T_h,out', group: 'temperature', unit: 'C', default: 60, min: -273.15, max: 2000 },
    { id: 'tc_in_c', label: 'Cold fluid inlet T_c,in', group: 'temperature', unit: 'C', default: 30, min: -273.15, max: 2000 },
    { id: 'tc_out_c', label: 'Cold fluid outlet T_c,out', group: 'temperature', unit: 'C', default: 40.2, min: -273.15, max: 2000 },
    {
      id: 'duty_basis',
      label: 'Heat duty from',
      type: 'select',
      default: 'hot',
      options: [
        { value: 'hot', label: 'Hot stream: ṁ_h × c_p,h × (T_h,in − T_h,out)' },
        { value: 'cold', label: 'Cold stream: ṁ_c × c_p,c × (T_c,out − T_c,in)' },
        { value: 'given', label: 'Given directly' },
      ],
    },
    { id: 'm_hot_kg_s', label: 'Hot mass flow ṁ_h', group: 'mass_flow', unit: 'kg_s', default: 0.1, min: 0, max: 10000, visibleWhen: { duty_basis: 'hot' } },
    { id: 'cp_hot_j_kgk', label: 'Hot specific heat c_p,h', group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK', default: 2131, min: 1, max: 20000, visibleWhen: { duty_basis: 'hot' }, help: 'Water 4 180, lubricating oil ≈ 2 100, air 1 005, sea water 3 990 J/(kg·K).' },
    { id: 'm_cold_kg_s', label: 'Cold mass flow ṁ_c', group: 'mass_flow', unit: 'kg_s', default: 0.2, min: 0, max: 10000, visibleWhen: { duty_basis: 'cold' } },
    { id: 'cp_cold_j_kgk', label: 'Cold specific heat c_p,c', group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK', default: 4178, min: 1, max: 20000, visibleWhen: { duty_basis: 'cold' } },
    { id: 'duty_w', label: 'Heat duty Q', group: 'power', unit: 'W', display: 'kW', default: 8524, min: 0, max: 1e9, visibleWhen: { duty_basis: 'given' } },
    { id: 'u_w_m2k', label: 'Clean overall heat transfer coefficient U', group: 'heat_transfer_coefficient', unit: 'W_m2K', default: 38.1, min: 0.1, max: 50000, help: 'Typical: water–water 800–1 500; oil–water 100–350; gas–water 20–60; steam–water 1 500–4 000 W/(m²·K).' },
    { id: 'fouling_m2k_w', label: 'Total fouling resistance R_f (both sides)', group: 'thermal_resistance_area', unit: 'm2K_W', default: 0, min: 0, max: 0.1, help: 'TEMA typical per side: treated cooling water 0.00018, sea water 0.00009, fuel oil 0.0009, lube oil 0.00018 m²·K/W.' },
  ],
  outputs: [
    { id: 'duty_out_w', label: 'Heat duty Q', group: 'power', unit: 'W', display: 'kW' },
    { id: 'dt1_k', label: 'Terminal difference ΔT₁', group: 'temperature_difference', unit: 'K' },
    { id: 'dt2_k', label: 'Terminal difference ΔT₂', group: 'temperature_difference', unit: 'K' },
    { id: 'lmtd_k', label: 'Log-mean temperature difference', group: 'temperature_difference', unit: 'K' },
    { id: 'f_factor', label: 'Correction factor F', group: 'dimensionless', unit: 'none' },
    { id: 'effective_dt_k', label: 'Effective mean difference F × LMTD', group: 'temperature_difference', unit: 'K' },
    { id: 'u_service_w_m2k', label: 'Service U with fouling', group: 'heat_transfer_coefficient', unit: 'W_m2K' },
    { id: 'area_m2', label: 'Required area A = Q / (U_service × F × LMTD)', group: 'area', unit: 'm2' },
    { id: 'area_clean_m2', label: 'Area with clean U', group: 'area', unit: 'm2' },
    { id: 'effectiveness', label: 'Effectiveness ε', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'ntu', label: 'Number of transfer units NTU', group: 'dimensionless', unit: 'none' },
    { id: 'capacity_ratio', label: 'Capacity ratio C_min / C_max', group: 'dimensionless', unit: 'none' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      dt1_k: '59.8 K',
      dt2_k: '30 K',
      lmtd_k: '43.2 K',
      effective_dt_k: '43.2 K',
      area_m2: '5.18 m²',
      area_clean_m2: '5.18 m²',
      capacity_ratio: '0.255',
    },
  },
};

/** Log-mean of two terminal temperature differences (both > 0); returns ΔT₁ when they are equal. */
export function logMeanTemperatureDifference(dt1, dt2) {
  if (dt1 <= 0 || dt2 <= 0) throw new Error(`Terminal temperature differences must be positive (got ${dt1} and ${dt2})`);
  if (Math.abs(dt1 - dt2) < 1e-9 * Math.max(dt1, dt2)) return dt1;
  return (dt1 - dt2) / Math.log(dt1 / dt2);
}

/**
 * LMTD correction factor for one shell pass and an even number of tube passes (Bowman, Mueller & Nagle 1940).
 * R = (Th,in − Th,out)/(Tc,out − Tc,in), P = (Tc,out − Tc,in)/(Th,in − Tc,in). Returns NaN when the duty is not achievable.
 */
export function correctionFactorShell1Pass(thIn, thOut, tcIn, tcOut) {
  const R = (thIn - thOut) / (tcOut - tcIn);
  const P = (tcOut - tcIn) / (thIn - tcIn);
  const root = Math.sqrt(R * R + 1);
  const denominatorArg = (2 - P * (R + 1 - root)) / (2 - P * (R + 1 + root));
  if (!(denominatorArg > 0)) return NaN;
  if (Math.abs(R - 1) < R_EQUAL_ONE_TOLERANCE) {
    return (P * Math.SQRT2) / ((1 - P) * Math.log(denominatorArg));
  }
  const numerator = root * Math.log((1 - P) / (1 - R * P));
  const denominator = (R - 1) * Math.log(denominatorArg);
  return numerator / denominator;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.arrangement, ['counterflow', 'parallel', 'shell_1_2'], 'arrangement', 'Flow arrangement');
  assertOneOf(i.duty_basis, ['hot', 'cold', 'given'], 'duty_basis', 'Duty basis');
  for (const id of ['th_in_c', 'th_out_c', 'tc_in_c', 'tc_out_c']) assertFinite(i[id], id, 'Temperature');
  assertPositive(i.u_w_m2k, 'u_w_m2k', 'Overall heat transfer coefficient');
  assertNonNegative(i.fouling_m2k_w, 'fouling_m2k_w', 'Fouling resistance');

  const dtHot = i.th_in_c - i.th_out_c;
  const dtCold = i.tc_out_c - i.tc_in_c;
  if (dtHot <= 0) throw new Error('Hot fluid must cool down: T_h,in must exceed T_h,out');
  if (dtCold <= 0) throw new Error('Cold fluid must warm up: T_c,out must exceed T_c,in');
  if (i.th_in_c <= i.tc_in_c) throw new Error('Hot inlet must be warmer than cold inlet');

  let duty;
  if (i.duty_basis === 'hot') {
    duty = assertNonNegative(i.m_hot_kg_s, 'm_hot_kg_s', 'Hot mass flow') * assertPositive(i.cp_hot_j_kgk, 'cp_hot_j_kgk', 'Hot specific heat') * dtHot;
  } else if (i.duty_basis === 'cold') {
    duty = assertNonNegative(i.m_cold_kg_s, 'm_cold_kg_s', 'Cold mass flow') * assertPositive(i.cp_cold_j_kgk, 'cp_cold_j_kgk', 'Cold specific heat') * dtCold;
  } else {
    duty = assertNonNegative(i.duty_w, 'duty_w', 'Heat duty');
  }

  let dt1;
  let dt2;
  let fFactor = 1;
  const warnings = [];
  if (i.arrangement === 'parallel') {
    if (i.th_out_c <= i.tc_out_c) throw new Error('Parallel flow cannot deliver a cold outlet at or above the hot outlet — use counterflow');
    dt1 = i.th_in_c - i.tc_in_c;
    dt2 = i.th_out_c - i.tc_out_c;
  } else {
    if (i.th_in_c <= i.tc_out_c) throw new Error('Cold outlet must stay below the hot inlet');
    if (i.th_out_c <= i.tc_in_c) throw new Error('Hot outlet must stay above the cold inlet');
    dt1 = i.th_in_c - i.tc_out_c;
    dt2 = i.th_out_c - i.tc_in_c;
    if (i.arrangement === 'shell_1_2') {
      fFactor = correctionFactorShell1Pass(i.th_in_c, i.th_out_c, i.tc_in_c, i.tc_out_c);
      if (!Number.isFinite(fFactor) || fFactor <= 0) {
        throw new Error('This temperature cross is not achievable with one shell pass — use counterflow or more shell passes in series');
      }
      if (fFactor < 0.75) warnings.push('F below 0.75: the exchanger would operate near the steep part of the F curve. Add shell passes or go to counterflow.');
    }
  }

  const lmtd = logMeanTemperatureDifference(dt1, dt2);
  const effectiveDt = fFactor * lmtd;
  const uService = 1 / (1 / i.u_w_m2k + i.fouling_m2k_w);
  const area = duty / (uService * effectiveDt);
  const areaClean = duty / (i.u_w_m2k * effectiveDt);

  const dtMax = Math.max(dtHot, dtCold);
  const effectiveness = dtMax / (i.th_in_c - i.tc_in_c);
  const ntu = dtMax / effectiveDt;
  const capacityRatio = Math.min(dtHot, dtCold) / dtMax;

  if (i.tc_out_c > i.th_out_c) warnings.push('Temperature cross (cold outlet above hot outlet): only counterflow or multi-shell arrangements can achieve this.');
  if (i.fouling_m2k_w === 0) warnings.push('No fouling allowance: design practice adds TEMA fouling resistances, which typically increase the area by 10–40 %.');

  return {
    outputs: {
      duty_out_w: duty,
      dt1_k: dt1,
      dt2_k: dt2,
      lmtd_k: lmtd,
      f_factor: fFactor,
      effective_dt_k: effectiveDt,
      u_service_w_m2k: uService,
      area_m2: area,
      area_clean_m2: areaClean,
      effectiveness,
      ntu,
      capacity_ratio: capacityRatio,
    },
    warnings,
  };
}
