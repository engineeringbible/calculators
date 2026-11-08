/**
 * steam-table/calc.js — steam tables by IAPWS-IF97: saturated water and steam by temperature or pressure (with a wet
 * mixture at any quality), and compressed water or superheated steam at a pressure and temperature.
 *
 * Saturation: p_s(T) and T_s(p) (region 4); liquid from region 1 and vapour from region 2 at (p_s, T_s).
 * Mixture: y = y_f + x (y_g − y_f).  Single phase: region 1 or 2 by the IF97 region boundaries.
 * Schema units: SI — °C, Pa, m³/kg, J/kg, J/(kg·K), m/s.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive } from '../shared/validate.js';
import { region1, region2, psat, tsat, regionOf } from '../shared/iapws97.js';

const K = 273.15;

export const schema = {
  id: 'steam-table',
  name: 'Steam table calculator (IAPWS-IF97)',
  category: 'thermal',
  summary: 'Saturated and superheated steam and compressed water properties by IAPWS-IF97: temperature, pressure, enthalpy, entropy, specific volume and density.',
  related: ['specific-heat', 'carnot-cop', 'heat-exchanger-lmtd', 'pipe-insulation'],
  assumptions: [
    'Properties follow the IAPWS Industrial Formulation 1997 (IAPWS-IF97), the international standard for steam tables in industry; regions 1, 2 and 4 are implemented and reproduce the release\'s verification values to nine digits.',
    'Saturation properties are covered from 0 °C to 350 °C (0.6 kPa to 16.5 MPa). The near-critical region 3 (above 350 °C and above about 16.5 MPa) and temperatures above 800 °C are not included and give an error rather than an extrapolated value.',
    'Enthalpy, entropy and internal energy are measured from the IF97 reference: liquid water at the triple point has u = 0 and s = 0, the same as most published steam tables.',
    'A wet mixture is defined by its dryness fraction (quality) x, the mass fraction of vapour; x = 0 is saturated liquid and x = 1 dry saturated steam.',
  ],
  notes: [
    'Verification 2026-11-07: at 10 bar (1 MPa) the calculator gives T_s = 179.89 °C, h_f = 762.68, h_fg = 2014.4, h_g = 2777.1 kJ/kg and v_g = 0.19435 m³/kg; superheated steam at 1 MPa and 300 °C has h = 3051.7 kJ/kg and s = 7.1247 kJ/(kg·K), matching published IF97 steam tables.',
  ],
  sources: [
    'IAPWS R7-97(2012), Revised Release on the IAPWS Industrial Formulation 1997 for the Thermodynamic Properties of Water and Steam',
    'Wagner, W. and Kretzschmar, H.-J., International Steam Tables, 3rd ed., Springer (2019), tables used as a cross-check',
  ],
  inputs: [
    { id: 'mode', label: 'Look up', type: 'select', default: 'sat_p', options: [{ value: 'sat_p', label: 'Saturated water and steam, by pressure' }, { value: 'sat_t', label: 'Saturated water and steam, by temperature' }, { value: 'pt', label: 'Superheated steam or compressed water, by pressure and temperature' }] },
    { id: 'pressure_pa', label: 'Pressure (absolute)', group: 'pressure', unit: 'Pa', display: 'bar', default: 1e6, min: 611.213, max: 1e8, visibleWhen: { mode: ['sat_p', 'pt'] } },
    { id: 'temp_c', label: 'Temperature', group: 'temperature', unit: 'C', default: 300, min: 0, max: 800, visibleWhen: { mode: ['sat_t', 'pt'] } },
    { id: 'quality', label: 'Dryness fraction x of a wet mixture (1 = dry saturated steam)', group: 'ratio', unit: 'frac', display: 'pct', default: 1, min: 0, max: 1, visibleWhen: { mode: ['sat_p', 'sat_t'] } },
  ],
  outputs: [
    { id: 'state', label: 'State', type: 'text' },
    { id: 't_out_c', label: 'Temperature (saturation temperature when saturated)', group: 'temperature', unit: 'C' },
    { id: 'p_out_pa', label: 'Pressure (saturation pressure when saturated)', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'h_j_kg', label: 'Specific enthalpy h', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg' },
    { id: 's_j_kgk', label: 'Specific entropy s', group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK' },
    { id: 'v_m3_kg', label: 'Specific volume v', group: 'specific_volume', unit: 'm3_kg' },
    { id: 'rho_kg_m3', label: 'Density', group: 'density', unit: 'kg_m3' },
    { id: 'u_j_kg', label: 'Specific internal energy u', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg' },
    { id: 'hf_j_kg', label: 'Saturated liquid enthalpy h_f', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg', visibleWhen: { mode: ['sat_p', 'sat_t'] } },
    { id: 'hfg_j_kg', label: 'Latent heat of evaporation h_fg', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg', visibleWhen: { mode: ['sat_p', 'sat_t'] } },
    { id: 'hg_j_kg', label: 'Saturated vapour enthalpy h_g', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg', visibleWhen: { mode: ['sat_p', 'sat_t'] } },
    { id: 'sf_j_kgk', label: 'Saturated liquid entropy s_f', group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK', visibleWhen: { mode: ['sat_p', 'sat_t'] } },
    { id: 'sg_j_kgk', label: 'Saturated vapour entropy s_g', group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK', visibleWhen: { mode: ['sat_p', 'sat_t'] } },
    { id: 'vf_m3_kg', label: 'Saturated liquid specific volume v_f', group: 'specific_volume', unit: 'm3_kg', visibleWhen: { mode: ['sat_p', 'sat_t'] } },
    { id: 'vg_m3_kg', label: 'Saturated vapour specific volume v_g', group: 'specific_volume', unit: 'm3_kg', visibleWhen: { mode: ['sat_p', 'sat_t'] } },
    { id: 'cp_j_kgk', label: 'Isobaric heat capacity c_p', group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK', visibleWhen: { mode: 'pt' } },
    { id: 'w_m_s', label: 'Speed of sound', group: 'speed', unit: 'm_s', visibleWhen: { mode: 'pt' } },
    { id: 'superheat_k', label: 'Degrees of superheat (or subcooling, negative)', group: 'temperature_difference', unit: 'K', visibleWhen: { mode: 'pt' } },
  ],
  example: {
    inputs: { mode: 'sat_p', pressure_pa: [10, 'bar'], quality: [100, 'pct'] },
    results: { t_out_c: '179.89 °C', hf_j_kg: '762.68 kJ/kg', hg_j_kg: '2777.1 kJ/kg', vg_m3_kg: '0.19435 m³/kg' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['sat_p', 'sat_t', 'pt'], 'mode', 'Look up');
  const warnings = [];
  const pack = (o) => ({ h: o.h * 1000, s: o.s * 1000, v: o.v, u: o.u * 1000 });
  if (x.mode === 'pt') {
    const p = assertPositive(x.pressure_pa, 'pressure_pa', 'Pressure') / 1e6;
    const T = assertRange(x.temp_c, 0, 800, 'temp_c', 'Temperature') + K;
    const reg = regionOf(p, T);
    if (reg === 3) throw new Error('Pressure and temperature: this state is in the near-critical region 3 of IAPWS-IF97, which this calculator does not cover.');
    const o = reg === 1 ? region1(p, T) : region2(p, T);
    let ts = null;
    if (p <= 22.064) ts = tsat(p);
    const state = reg === 1 ? 'Compressed (subcooled) liquid water, IF97 region 1' : (p <= 22.064 ? 'Superheated steam, IF97 region 2' : 'Supercritical steam, IF97 region 2');
    if (ts !== null && Math.abs(T - ts) < 0.01) warnings.push('The temperature equals the saturation temperature: the state could be liquid, vapour or a mixture; use a saturation look-up with a dryness fraction.');
    return {
      outputs: {
        state, t_out_c: T - K, p_out_pa: p * 1e6, h_j_kg: o.h * 1000, s_j_kgk: o.s * 1000, v_m3_kg: o.v, rho_kg_m3: 1 / o.v, u_j_kg: o.u * 1000,
        hf_j_kg: null, hfg_j_kg: null, hg_j_kg: null, sf_j_kgk: null, sg_j_kgk: null, vf_m3_kg: null, vg_m3_kg: null,
        cp_j_kgk: o.cp * 1000, w_m_s: o.w, superheat_k: ts === null ? null : T - ts,
      },
      warnings,
    };
  }
  let T; let p;
  if (x.mode === 'sat_t') {
    T = assertRange(x.temp_c, 0, 350, 'temp_c', 'Temperature') + K;
    p = psat(T);
  } else {
    p = assertPositive(x.pressure_pa, 'pressure_pa', 'Pressure') / 1e6;
    if (p > psat(623.15)) throw new Error('Pressure: saturation properties are covered up to 165.29 bar (350 °C); above it the near-critical region 3 applies.');
    if (p < 0.000611213) throw new Error('Pressure: below the triple-point pressure (611.2 Pa) water cannot be liquid.');
    T = tsat(p);
    if (T < K) T = K; // 611.213 Pa to the 0 °C saturation pressure: the 0 °C state is used
  }
  const xq = assertRange(x.quality, 0, 1, 'quality', 'Dryness fraction');
  const f = pack(region1(p, T));
  const g = pack(region2(p, T));
  const mix = (k) => f[k] + xq * (g[k] - f[k]);
  const v = mix('v');
  return {
    outputs: {
      state: xq === 1 ? 'Dry saturated steam' : xq === 0 ? 'Saturated liquid water' : `Wet steam, ${(xq * 100).toFixed(1)} % dry`,
      t_out_c: T - K, p_out_pa: p * 1e6, h_j_kg: mix('h'), s_j_kgk: mix('s'), v_m3_kg: v, rho_kg_m3: 1 / v, u_j_kg: mix('u'),
      hf_j_kg: f.h, hfg_j_kg: g.h - f.h, hg_j_kg: g.h, sf_j_kgk: f.s, sg_j_kgk: g.s, vf_m3_kg: f.v, vg_m3_kg: g.v,
      cp_j_kgk: null, w_m_s: null, superheat_k: null,
    },
    warnings,
  };
}
