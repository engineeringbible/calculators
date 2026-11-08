/**
 * relief-valve-api520/calc.js — pressure relief valve sizing to API 520 Part I (SI form): relieving and back pressure,
 * critical or sub-critical gas/vapour flow, liquid flow, the required effective discharge area and the API 526
 * orifice letter.
 *
 * Gas, critical:     A = W/(C K_d P₁ K_b K_c) √(T Z/M),  C = 0.03948 √(k (2/(k+1))^((k+1)/(k−1)))
 * Gas, sub-critical: A = 17.9 W/(F₂ K_d K_c) √(T Z/(M P₁ (P₁ − P₂))),  F₂ = √((k/(k−1)) r^(2/k) (1 − r^((k−1)/k))/(1 − r))
 * Liquid:            A = 11.78 Q/(K_d K_w K_c K_v) √(G/(p₁ − p₂))
 * Units of the API SI equations: A mm², W kg/h, P kPa (abs for gas), T K, Q L/min.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** API 526 standard effective orifice areas, in² (D … T); mm² = in² × 645.16. */
export const API526 = [
  ['D', 0.110], ['E', 0.196], ['F', 0.307], ['G', 0.503], ['H', 0.785], ['J', 1.287], ['K', 1.838],
  ['L', 2.853], ['M', 3.60], ['N', 4.34], ['P', 6.38], ['Q', 11.05], ['R', 16.0], ['T', 26.0],
].map(([letter, in2]) => ({ letter, in2, mm2: in2 * 645.16 }));

/** Ideal-gas molecular weight and specific heat ratio at about 15 °C (API 520 Part I, 9th ed., Table 7 values). */
export const GASES = {
  custom: { label: 'Custom gas (enter M and k)', M: null, k: null },
  air: { label: 'Air (M 28.96, k 1.40)', M: 28.96, k: 1.4 },
  nitrogen: { label: 'Nitrogen (M 28.01, k 1.40)', M: 28.01, k: 1.4 },
  methane: { label: 'Methane (M 16.04, k 1.31)', M: 16.04, k: 1.31 },
  propane: { label: 'Propane (M 44.10, k 1.13)', M: 44.1, k: 1.13 },
  butane: { label: 'n-Butane (M 58.12, k 1.09)', M: 58.12, k: 1.09 },
  co2: { label: 'Carbon dioxide (M 44.01, k 1.29)', M: 44.01, k: 1.29 },
  hydrogen: { label: 'Hydrogen (M 2.016, k 1.41)', M: 2.016, k: 1.41 },
  ammonia: { label: 'Ammonia (M 17.03, k 1.30)', M: 17.03, k: 1.3 },
};

/** Allowable overpressure (ASME VIII UG-125 / API 520): fraction of set pressure and minimum in kPa. */
export const OVERPRESSURE = {
  single: { label: 'Single valve, non-fire: 10 % (min 20.7 kPa)', fraction: 0.1, minKpa: 20.7 },
  multiple: { label: 'Multiple valves, non-fire: 16 % (min 27.6 kPa)', fraction: 0.16, minKpa: 27.6 },
  fire: { label: 'Fire case: 21 %', fraction: 0.21, minKpa: 0 },
};

export const schema = {
  id: 'relief-valve-api520',
  name: 'Relief valve sizing (API 520)',
  category: 'mechanical',
  summary: 'API 520 required relief area for gas/vapour (critical and sub-critical) and liquid service, with the API 526 orifice letter and margin.',
  related: ['pressure-vessel', 'control-valve-cv', 'orifice-flow', 'pipe-wall-thickness', 'water-hammer'],
  assumptions: [
    'API Standard 520 Part I sizing equations in SI units (A in mm², W in kg/h, P in kPa absolute for gas, T in K, Q in L/min): gas or vapour in critical flow A = W/(C K_d P₁ K_b K_c) √(T Z/M) with C = 0.03948 √(k (2/(k+1))^((k+1)/(k−1))); sub-critical flow (back pressure above the critical pressure ratio (2/(k+1))^(k/(k−1)) × P₁) A = 17.9 W/(F₂ K_d K_c) √(T Z/(M P₁ (P₁ − P₂))); liquid A = 11.78 Q/(K_d K_w K_c K_v) √(G/(p₁ − p₂)) for valves certified for liquid service.',
    'Relieving pressure P₁ = set pressure + allowable overpressure + atmospheric pressure, the overpressure being 10 % of set (minimum 20.7 kPa) for a single valve, 16 % (minimum 27.6 kPa) for multiple valves and 21 % for the fire case (ASME VIII UG-125); inlet pressure losses and superimposed back pressure effects on the set pressure are the user\'s inputs, and the 3 % inlet-loss rule (API 520 Part II) is a separate check.',
    'Coefficients: effective discharge coefficient K_d = 0.975 for gas and 0.65 for liquid for preliminary sizing with the API 526 effective areas (0.62 with a rupture disk in place of a valve); K_b back-pressure correction 1.0 for conventional valves with built-up back pressure below 10 % (balanced-bellows values from the manufacturer or API 520 Figure 30/31); K_w = 1.0 for conventional valves in liquid service (bellows: Figure 32); K_c = 0.9 for a rupture disk upstream of the valve; K_v = 1.0 for low-viscosity liquids — viscous liquids need the Reynolds-number correction of API 520 5.9, entered here as K_v.',
    'Gas properties: ideal-gas specific heat ratio k and molecular weight from the preset list (API 520 Part I Table 7 values) or entered; the compressibility factor Z at relieving conditions must be entered (1.0 for an ideal gas); the critical-flow equation is the ideal-gas nozzle formula, and two-phase or flashing flow (API 520 Annex C) and steam (Napier) are outside this page.',
    'API 526 effective orifice areas (D 0.110 in² … T 26.0 in², converted at 645.16 mm²/in²) are used for selection: the smallest orifice with an area not below the required one; above T, several valves are needed (and the multiple-valve overpressure applies). The effective areas are valid only together with the API 520 equations and K_d values; certified manufacturer areas and coefficients govern the final selection.',
  ],
  notes: [
    'Verification 2026-10-31: API 520 Part I example 1 (24 270 kg/h, T 348 K, Z 0.90, M 51, k 1.11, P₁ 670 kPa, K_d 0.975) gives C 0.02489 and A 3 699 mm², and example 2 (same, P₂ 532 kPa, sub-critical) gives F₂ 0.8548 and A 4 248 mm², as reproduced by the open-source fluids library (fluids.safety_valve, doctests "matches"); liquid example 5 (6 814 L/min, G 0.90, Δp 1 551.6 kPa, K_d 0.65, K_w 0.97) gives 3 066 mm². API 526 table from the same library (API526_A_sq_inch).',
    'Design decision: steam (Napier) and two-phase sizing are left out because the current API 520 edition changed the steam method; the page states what it covers.',
  ],
  sources: [
    'API Standard 520 Part I, Sizing, Selection, and Installation of Pressure-relieving Devices — Sizing and Selection (9th ed. 2014 / 10th ed. 2020), sections 5.6 (gas/vapour) and 5.8 (liquid), examples 1, 2 and 5',
    'API Standard 526, Flanged Steel Pressure-relief Valves — effective orifice areas D–T',
    'ASME Boiler and Pressure Vessel Code Section VIII Division 1, UG-125 (allowable overpressure 10/16/21 %)',
    'C. Bell, fluids (Python library), safety_valve module — API520_C, API520_A_g, API520_A_l and API526_A_sq_inch with the API example doctests',
  ],
  inputs: [
    { id: 'service', label: 'Service', type: 'select', default: 'gas', options: [{ value: 'gas', label: 'Gas or vapour' }, { value: 'liquid', label: 'Liquid (valve certified for liquid service)' }] },
    { id: 'flow_kg_h', label: 'Required relieving mass flow W', group: 'mass_flow', unit: 'kg_h', default: 24270, min: 0.01, max: 1e7, visibleWhen: { service: 'gas' } },
    { id: 'gas', label: 'Gas', type: 'select', default: 'custom', options: Object.entries(GASES).map(([value, g]) => ({ value, label: g.label })), visibleWhen: { service: 'gas' } },
    { id: 'molecular_weight', label: 'Molecular weight M (g/mol)', group: 'dimensionless', unit: 'none', default: 51, min: 1, max: 500, visibleWhen: { service: 'gas', gas: 'custom' } },
    { id: 'k_ratio', label: 'Specific heat ratio k = c_p/c_v', group: 'dimensionless', unit: 'none', default: 1.11, min: 1.001, max: 1.7, visibleWhen: { service: 'gas', gas: 'custom' } },
    { id: 'temperature_c', label: 'Relieving temperature T', group: 'temperature', unit: 'C', default: 74.85, min: -200, max: 800, visibleWhen: { service: 'gas' } },
    { id: 'z_factor', label: 'Compressibility factor Z at relieving conditions', group: 'dimensionless', unit: 'none', default: 0.9, min: 0.1, max: 2, visibleWhen: { service: 'gas' } },
    { id: 'kd_gas', label: 'Effective discharge coefficient K_d (gas)', group: 'dimensionless', unit: 'none', default: 0.975, min: 0.3, max: 1, visibleWhen: { service: 'gas' } },
    { id: 'kb', label: 'Back-pressure correction K_b (critical flow)', group: 'dimensionless', unit: 'none', default: 1, min: 0.1, max: 1, visibleWhen: { service: 'gas' } },
    { id: 'flow_l_min', label: 'Required relieving liquid flow Q', group: 'volume_flow', unit: 'L_min', default: 6814, min: 0.01, max: 1e7, visibleWhen: { service: 'liquid' } },
    { id: 'specific_gravity', label: 'Liquid specific gravity G (water at 15 °C = 1)', group: 'dimensionless', unit: 'none', default: 0.9, min: 0.1, max: 3, visibleWhen: { service: 'liquid' } },
    { id: 'kd_liquid', label: 'Effective discharge coefficient K_d (liquid)', group: 'dimensionless', unit: 'none', default: 0.65, min: 0.3, max: 1, visibleWhen: { service: 'liquid' } },
    { id: 'kw', label: 'Back-pressure correction K_w (liquid, bellows)', group: 'dimensionless', unit: 'none', default: 0.97, min: 0.1, max: 1, visibleWhen: { service: 'liquid' } },
    { id: 'kv', label: 'Viscosity correction K_v', group: 'dimensionless', unit: 'none', default: 1, min: 0.1, max: 1, visibleWhen: { service: 'liquid' } },
    { id: 'set_pressure_kpa', label: 'Set pressure (gauge)', group: 'pressure', unit: 'kPa', default: 516.98, min: 1, max: 1e5 },
    { id: 'overpressure', label: 'Allowable overpressure', type: 'select', default: 'single', options: Object.entries(OVERPRESSURE).map(([value, o]) => ({ value, label: o.label })) },
    { id: 'back_pressure_kpa', label: 'Total back pressure (gauge)', group: 'pressure', unit: 'kPa', default: 0, min: 0, max: 1e5 },
    { id: 'atmospheric_kpa', label: 'Atmospheric pressure', group: 'pressure', unit: 'kPa', default: 101.325, min: 50, max: 110 },
    { id: 'rupture_disk', label: 'Rupture disk upstream (K_c)', type: 'select', default: 'no', options: [{ value: 'no', label: 'No rupture disk (K_c 1.0)' }, { value: 'yes', label: 'Rupture disk upstream of the valve (K_c 0.9)' }] },
  ],
  outputs: [
    { id: 'relieving_pressure_kpa', label: 'Relieving pressure P₁ (absolute for gas, gauge for liquid)', group: 'pressure', unit: 'kPa' },
    { id: 'back_pressure_abs_kpa', label: 'Back pressure P₂ (absolute for gas, gauge for liquid)', group: 'pressure', unit: 'kPa' },
    { id: 'critical_ratio', label: 'Critical pressure ratio (2/(k+1))^(k/(k−1))', group: 'dimensionless', unit: 'none', visibleWhen: { service: 'gas' } },
    { id: 'flow_regime', label: 'Flow regime', type: 'text' },
    { id: 'coefficient_c', label: 'Coefficient C (critical) or F₂ (sub-critical)', group: 'dimensionless', unit: 'none', visibleWhen: { service: 'gas' } },
    { id: 'required_area_mm2', label: 'Required effective discharge area', group: 'area', unit: 'mm2' },
    { id: 'orifice', label: 'API 526 orifice', type: 'text' },
    { id: 'selected_area_mm2', label: 'Effective area of the selected orifice', group: 'area', unit: 'mm2' },
    { id: 'utilisation_pct', label: 'Required area as share of the selected orifice', group: 'ratio', unit: 'pct' },
    { id: 'capacity_gas_kg_h', label: 'Capacity of the selected orifice(s) at these conditions', group: 'mass_flow', unit: 'kg_h', visibleWhen: { service: 'gas' } },
    { id: 'capacity_liquid_l_min', label: 'Capacity of the selected orifice(s) at these conditions', group: 'volume_flow', unit: 'L_min', visibleWhen: { service: 'liquid' } },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      relieving_pressure_kpa: '670 kPa',
      critical_ratio: '0.583',
      coefficient_c: '0.02489',
      required_area_mm2: '3 699 mm²',
      selected_area_mm2: '4 116 mm²',
      utilisation_pct: '90 %',
      capacity_gas_kg_h: '27 000 kg/h',
    },
  },
};

/** API 520 critical-flow coefficient C (SI). */
export function coefficientC(k) {
  if (Math.abs(k - 1) < 1e-9) return 0.03948 * Math.sqrt(1 / Math.E);
  return 0.03948 * Math.sqrt(k * (2 / (k + 1)) ** ((k + 1) / (k - 1)));
}

/** API 520 sub-critical coefficient F₂ for r = P₂/P₁. */
export function coefficientF2(k, r) {
  return Math.sqrt((k / (k - 1)) * r ** (2 / k) * ((1 - r ** ((k - 1) / k)) / (1 - r)));
}

/** Smallest API 526 orifice with an effective area ≥ the required area, or the number of T orifices needed. */
export function selectOrifice(requiredMm2) {
  const fit = API526.find((o) => o.mm2 >= requiredMm2 - 1e-9);
  if (fit) return { letter: fit.letter, count: 1, areaMm2: fit.mm2 };
  const t = API526[API526.length - 1];
  const count = Math.ceil(requiredMm2 / t.mm2);
  return { letter: 'T', count, areaMm2: count * t.mm2 };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.service, ['gas', 'liquid'], 'service', 'Service');
  assertPositive(i.set_pressure_kpa, 'set_pressure_kpa', 'Set pressure');
  assertOneOf(i.overpressure, Object.keys(OVERPRESSURE), 'overpressure', 'Overpressure');
  assertNonNegative(i.back_pressure_kpa, 'back_pressure_kpa', 'Back pressure');
  assertRange(i.atmospheric_kpa, 30, 120, 'atmospheric_kpa', 'Atmospheric pressure');
  assertOneOf(i.rupture_disk, ['no', 'yes'], 'rupture_disk', 'Rupture disk');

  const op = OVERPRESSURE[i.overpressure];
  const overKpa = Math.max(op.fraction * i.set_pressure_kpa, op.minKpa);
  const kc = i.rupture_disk === 'yes' ? 0.9 : 1.0;
  const warnings = [];
  let p1;
  let p2;
  let area;
  let regime;
  let coefficient = null;
  let criticalRatio = null;

  if (i.service === 'gas') {
    assertPositive(i.flow_kg_h, 'flow_kg_h', 'Mass flow');
    assertOneOf(i.gas, Object.keys(GASES), 'gas', 'Gas');
    const g = GASES[i.gas];
    const M = i.gas === 'custom' ? assertRange(i.molecular_weight, 0.5, 1000, 'molecular_weight', 'Molecular weight') : g.M;
    const k = i.gas === 'custom' ? assertRange(i.k_ratio, 1.0001, 2, 'k_ratio', 'Specific heat ratio') : g.k;
    const T = i.temperature_c + 273.15;
    if (T <= 0) throw new Error('Relieving temperature must be above absolute zero');
    assertPositive(i.z_factor, 'z_factor', 'Compressibility');
    assertRange(i.kd_gas, 0.1, 1, 'kd_gas', 'K_d');
    assertRange(i.kb, 0.05, 1, 'kb', 'K_b');
    p1 = i.set_pressure_kpa + overKpa + i.atmospheric_kpa;
    p2 = i.back_pressure_kpa + i.atmospheric_kpa;
    if (p2 >= p1) throw new Error('Back pressure is at or above the relieving pressure: no flow through the valve');
    criticalRatio = (2 / (k + 1)) ** (k / (k - 1));
    const r = p2 / p1;
    if (r <= criticalRatio) {
      coefficient = coefficientC(k);
      area = (i.flow_kg_h / (coefficient * i.kd_gas * p1 * i.kb * kc)) * Math.sqrt((T * i.z_factor) / M);
      regime = `Critical (choked) flow — P₂/P₁ ${r.toFixed(3)} ≤ ${criticalRatio.toFixed(3)}`;
    } else {
      coefficient = coefficientF2(k, r);
      area = ((17.9 * i.flow_kg_h) / (coefficient * i.kd_gas * kc)) * Math.sqrt((T * i.z_factor) / (M * p1 * (p1 - p2)));
      regime = `Sub-critical flow — P₂/P₁ ${r.toFixed(3)} > ${criticalRatio.toFixed(3)}`;
      if (i.kb < 1) warnings.push('Sub-critical flow with K_b < 1: the sub-critical equation is for conventional valves; for balanced-bellows valves API 520 uses the critical-flow equation with the manufacturer\'s K_b.');
    }
    if (i.back_pressure_kpa > 0.1 * i.set_pressure_kpa && i.kb === 1) warnings.push('Back pressure above 10 % of set pressure: a conventional valve\'s capacity and stability are affected — use a balanced-bellows or pilot valve with its K_b.');
  } else {
    assertPositive(i.flow_l_min, 'flow_l_min', 'Liquid flow');
    assertPositive(i.specific_gravity, 'specific_gravity', 'Specific gravity');
    assertRange(i.kd_liquid, 0.1, 1, 'kd_liquid', 'K_d');
    assertRange(i.kw, 0.05, 1, 'kw', 'K_w');
    assertRange(i.kv, 0.05, 1, 'kv', 'K_v');
    p1 = i.set_pressure_kpa + overKpa;
    p2 = i.back_pressure_kpa;
    if (p2 >= p1) throw new Error('Back pressure is at or above the relieving pressure: no flow through the valve');
    area = ((11.78 * i.flow_l_min) / (i.kd_liquid * i.kw * kc * i.kv)) * Math.sqrt(i.specific_gravity / (p1 - p2));
    regime = `Liquid — differential pressure ${(p1 - p2).toFixed(1)} kPa`;
    if (i.kv === 1) warnings.push('K_v = 1 assumes a low-viscosity liquid; for viscous liquids compute the valve Reynolds number and apply the API 520 viscosity correction.');
  }

  const sel = selectOrifice(area);
  const flow = i.service === 'gas' ? i.flow_kg_h : i.flow_l_min;
  const capacity = flow * (sel.areaMm2 / area);
  if (sel.count > 1) warnings.push(`Required area exceeds the largest API 526 orifice (T): ${sel.count} valves are needed, and the multiple-valve overpressure (16 %) applies.`);
  if (i.overpressure === 'fire' && i.service === 'liquid') warnings.push('Fire case with a liquid-full system: the relief load is usually vapour generated by the fire — check whether vapour or liquid sizing governs.');
  warnings.push('Preliminary sizing with API 526 effective areas and K_d; the certified area and coefficient of the selected valve govern, together with inlet pressure loss (≤ 3 % of set, API 520 Part II) and outlet back-pressure checks.');

  return {
    outputs: {
      relieving_pressure_kpa: p1,
      back_pressure_abs_kpa: p2,
      critical_ratio: criticalRatio,
      flow_regime: regime,
      coefficient_c: coefficient,
      required_area_mm2: area,
      orifice: sel.count === 1 ? `${sel.letter} — ${sel.areaMm2.toFixed(0)} mm² (${API526.find((o) => o.letter === sel.letter).in2} in²)` : `${sel.count} × T — ${(sel.areaMm2 / sel.count).toFixed(0)} mm² each`,
      selected_area_mm2: sel.areaMm2,
      utilisation_pct: (area / sel.areaMm2) * 100,
      capacity_gas_kg_h: i.service === 'gas' ? capacity : null,
      capacity_liquid_l_min: i.service === 'liquid' ? capacity : null,
    },
    warnings,
  };
}
