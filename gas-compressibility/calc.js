/**
 * gas-compressibility/calc.js — real-gas compressibility factor Z and density. Natural gas: pseudo-critical
 * properties from the gas specific gravity (Sutton 1985), the Wichert–Aziz (1972) correction for H₂S and CO₂, and Z
 * from the Dranchuk–Abou-Kassem (1975) fit of the Standing–Katz chart. Pure gases: the generalised second-virial
 * correlation of Pitzer with the Abbott coefficients, from Tc, Pc and the acentric factor ω, at low reduced density.
 *
 * Sutton: Tpc = 169.2 + 349.5 γ − 74.0 γ² (°R), ppc = 756.8 − 131.0 γ − 3.6 γ² (psia).
 * Wichert–Aziz: ε = 120 (A^0.9 − A^1.6) + 15 (B^0.5 − B^4) °R; T′pc = Tpc − ε; p′pc = ppc T′pc / (Tpc + B (1 − B) ε).
 * DAK: Z = 1 + (A1 + A2/Tr + A3/Tr³ + A4/Tr⁴ + A5/Tr⁵) ρr + (A6 + A7/Tr + A8/Tr²) ρr² − A9 (A7/Tr + A8/Tr²) ρr⁵
 *      + A10 (1 + A11 ρr²) (ρr²/Tr³) exp(−A11 ρr²),  ρr = 0.27 pr / (Z Tr).
 * Pitzer/Abbott: Z = 1 + (B⁰ + ω B¹) Pr/Tr, B⁰ = 0.083 − 0.422/Tr^1.6, B¹ = 0.139 − 0.172/Tr^4.2.
 * Schema units: SI — K, Pa, kg/m³; molar mass in g/mol.
 */
import { withDefaults, assertOneOf, assertRange } from '../shared/validate.js';

/** Molar gas constant, J/(mol·K), exact (CODATA 2018). */
export const R = 8.314462618;
/** Molar mass of dry air, g/mol (ISO 2533:1975). */
export const M_AIR = 28.9644;
const PSI = 6894.757293168;
const RANKINE = 5 / 9;
/** Standard conditions for Bg: 60 °F and 14.696 psia. */
const T_SC = 288.7055556;
const P_SC = 101325;

/** Dranchuk and Abou-Kassem (1975) constants A1…A11. */
export const DAK = [0.3265, -1.07, -0.5339, 0.01569, -0.05165, 0.5475, -0.7361, 0.1844, 0.1056, 0.6134, 0.721];

/** Sutton (1985) pseudo-critical temperature (°R) and pressure (psia) of a natural gas of specific gravity γ. */
export function sutton(sg) {
  return { tpcR: 169.2 + 349.5 * sg - 74.0 * sg * sg, ppcPsia: 756.8 - 131.0 * sg - 3.6 * sg * sg };
}

/** Wichert–Aziz correction of pseudo-critical properties for mole fractions of H₂S and CO₂; ε in °R. */
export function wichertAziz(tpcR, ppcPsia, yH2S, yCO2) {
  const A = yH2S + yCO2;
  const B = yH2S;
  const eps = 120 * (A ** 0.9 - A ** 1.6) + 15 * (B ** 0.5 - B ** 4);
  const t = tpcR - eps;
  return { tpcR: t, ppcPsia: (ppcPsia * t) / (tpcR + B * (1 - B) * eps), eps };
}

/** Z by Dranchuk–Abou-Kassem at Tpr, ppr: the lowest-density (gas) root, by a scan and bisection on ρr. */
export function zDAK(tpr, ppr) {
  const [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11] = DAK;
  const zOf = (r) => 1 + (a1 + a2 / tpr + a3 / tpr ** 3 + a4 / tpr ** 4 + a5 / tpr ** 5) * r
    + (a6 + a7 / tpr + a8 / tpr ** 2) * r * r - a9 * (a7 / tpr + a8 / tpr ** 2) * r ** 5
    + a10 * (1 + a11 * r * r) * (r * r / tpr ** 3) * Math.exp(-a11 * r * r);
  const f = (r) => zOf(r) - (0.27 * ppr) / (r * tpr);
  let lo = 1e-9;
  let hi = null;
  for (let r = 0.002; r <= 3.2; r += 0.002) {
    if (f(r) > 0) { hi = r; break; }
    lo = r;
  }
  if (hi === null) return null;
  for (let k = 0; k < 100; k += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid; else lo = mid;
  }
  const r = (lo + hi) / 2;
  return (0.27 * ppr) / (r * tpr);
}

/** Pitzer second-virial correlation with the Abbott coefficients: Z, B⁰ and B¹. */
export function zPitzer(tr, pr, omega) {
  const b0 = 0.083 - 0.422 / tr ** 1.6;
  const b1 = 0.139 - 0.172 / tr ** 4.2;
  return { z: 1 + ((b0 + omega * b1) * pr) / tr, b0, b1 };
}

export const schema = {
  id: 'gas-compressibility',
  name: 'Gas compressibility factor Z calculator (natural gas and pure gases)',
  category: 'process',
  summary: 'Real-gas Z factor and density of natural gas by Sutton and Dranchuk–Abou-Kassem (Standing–Katz), with Wichert–Aziz, or of a pure gas from Tc, Pc and ω.',
  related: ['mass-flow', 'specific-gravity', 'ideal-gas-law', 'vapour-pressure'],
  assumptions: [
    'Natural gas: pseudo-critical properties follow Sutton (1985) from the gas specific gravity (fitted for 0.57 to 1.68), and Z follows the Dranchuk–Abou-Kassem (1975) fit of the Standing–Katz chart, used here for reduced temperatures 1.05 (the lowest chart isotherm) to 3.0 and reduced pressures up to 30, with an average error of about 0.5 % against the chart.',
    'The Wichert–Aziz correction for H₂S and CO₂ applies to sour gases with up to about 50 % acid gas; nitrogen and water vapour are not corrected and should be small.',
    'Pure gas: the Pitzer second-virial correlation with the Abbott coefficients is valid only at low density; the calculator refuses states where the molar volume falls below twice the critical volume, estimated with Z_c = 0.291 − 0.080 ω.',
    'Pressures and temperatures are absolute; the gas is a single vapour phase above its dew point.',
    'Density is P M / (Z R T) with M = 28.964 γ for natural gas; Bg is the reservoir volume per standard volume at 60 °F and 14.696 psia.',
  ],
  notes: [
    'Verification 2026-11-08: a gas of specific gravity 0.65 at 2 000 psia and 200 °F has Tpc = 365.1 °R and ppc = 670.1 psia (Sutton), Tpr = 1.807, ppr = 2.98, and Z = 0.897 by DAK; density 94.95 kg/m³ (5.93 lb/ft³) against 85.20 kg/m³ for an ideal gas. Checked by hand.',
    'DAK reproduces the Standing–Katz chart readings digitised by Reyes (zFactor package): Tpr 1.3 at ppr 1.5 and 2.5 gives 0.756 and 0.638, Tpr 1.5 0.859 and 0.794, Tpr 2.0 0.956 and 0.941, all within 1 %. Pitzer–Abbott reproduces the n-butane example of Smith, Van Ness and Abbott (510 K, 25 bar: Z = 0.879).',
  ],
  sources: [
    'Ahmed, T., Reservoir Engineering Handbook, 4th ed., Gulf Professional Publishing, ch. 2: Sutton (1985) pseudo-critical correlations, Wichert–Aziz (1972) correction and the Dranchuk–Abou-Kassem (1975) equation',
    'Dranchuk, P.M. and Abou-Kassem, J.H. (1975), Calculation of Z factors for natural gases using equations of state, J. Canadian Petroleum Technology 14(3), 34–36; Standing, M.B. and Katz, D.L. (1942), Trans. AIME 146, 140–149',
    'Smith, J.M., Van Ness, H.C. and Abbott, M.M., Introduction to Chemical Engineering Thermodynamics, 7th ed., §3.6, eqs. 3.61–3.66 (Pitzer correlation, Abbott B⁰ and B¹) and the n-butane worked example',
    'Poling, B.E., Prausnitz, J.M. and O\'Connell, J.P., The Properties of Gases and Liquids, 5th ed., ch. 4 (second-virial truncation adequate up to about half the critical density)',
  ],
  inputs: [
    { id: 'method', label: 'Gas and method', type: 'select', default: 'natural_gas', options: [{ value: 'natural_gas', label: 'Natural gas from specific gravity (Sutton + Dranchuk–Abou-Kassem)' }, { value: 'pitzer', label: 'Pure gas from Tc, Pc and ω (Pitzer–Abbott virial)' }] },
    { id: 'gas_sg', label: 'Gas specific gravity γ (air = 1)', group: 'dimensionless', unit: 'none', default: 0.65, min: 0.57, max: 1.68, visibleWhen: { method: 'natural_gas' } },
    { id: 'y_h2s', label: 'H₂S mole fraction', group: 'ratio', unit: 'frac', display: 'pct', default: 0, min: 0, max: 0.5, visibleWhen: { method: 'natural_gas' } },
    { id: 'y_co2', label: 'CO₂ mole fraction', group: 'ratio', unit: 'frac', display: 'pct', default: 0, min: 0, max: 0.5, visibleWhen: { method: 'natural_gas' } },
    { id: 'tc_k', label: 'Critical temperature Tc', group: 'temperature', unit: 'K', default: 425.1, min: 2, max: 1000, visibleWhen: { method: 'pitzer' }, help: 'n-butane 425.1 K, methane 190.6 K, CO₂ 304.2 K, N₂ 126.2 K' },
    { id: 'pc_pa', label: 'Critical pressure Pc', group: 'pressure', unit: 'Pa', display: 'bar', default: 3.796e6, min: 1e5, max: 1e8, visibleWhen: { method: 'pitzer' } },
    { id: 'omega', label: 'Acentric factor ω', group: 'dimensionless', unit: 'none', default: 0.2, min: -0.4, max: 1.5, visibleWhen: { method: 'pitzer' } },
    { id: 'molar_mass', label: 'Molar mass, g/mol', group: 'dimensionless', unit: 'none', default: 58.123, min: 2, max: 500, visibleWhen: { method: 'pitzer' } },
    { id: 'pressure_pa', label: 'Pressure (absolute)', group: 'pressure', unit: 'Pa', display: 'psi', default: 2000 * PSI, min: 1000, max: 2e8, visibleWhen: { method: 'natural_gas' } },
    { id: 'temp_k', label: 'Temperature', group: 'temperature', unit: 'K', display: 'F', default: (200 + 459.67) * RANKINE, min: 50, max: 1500, visibleWhen: { method: 'natural_gas' } },
    { id: 'p_pure_pa', label: 'Pressure (absolute)', group: 'pressure', unit: 'Pa', display: 'bar', default: 25e5, min: 1000, max: 2e8, visibleWhen: { method: 'pitzer' } },
    { id: 't_pure_k', label: 'Temperature', group: 'temperature', unit: 'K', default: 510, min: 2, max: 1500, visibleWhen: { method: 'pitzer' } },
  ],
  outputs: [
    { id: 'z', label: 'Compressibility factor Z', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'density', label: 'Gas density ρ = P M / (Z R T)', group: 'density', unit: 'kg_m3' },
    { id: 'density_ideal', label: 'Ideal-gas density, for comparison', group: 'density', unit: 'kg_m3' },
    { id: 'tpc_r', label: 'Pseudo-critical (or critical) temperature, °R', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'tpc_k', label: 'Pseudo-critical (or critical) temperature', group: 'temperature', unit: 'K' },
    { id: 'ppc_pa', label: 'Pseudo-critical (or critical) pressure', group: 'pressure', unit: 'Pa', display: 'psi' },
    { id: 'tpr', label: 'Reduced temperature T / Tpc', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'ppr', label: 'Reduced pressure P / ppc', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'eps_r', label: 'Wichert–Aziz correction ε, °R', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { method: 'natural_gas' } },
    { id: 'bg', label: 'Gas formation volume factor Bg (reservoir ft³/scf = m³/sm³)', group: 'dimensionless', unit: 'none', decimals: 5 },
    { id: 'vr', label: 'Reduced volume V / Vc (virial needs ≥ 2)', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { method: 'pitzer' } },
  ],
  example: {
    inputs: { method: 'natural_gas', gas_sg: 0.65, y_h2s: 0, y_co2: 0, pressure_pa: [2000, 'psi'], temp_k: [200, 'F'] },
    results: { tpc_r: '365.1', ppc_pa: '670.1 psi', tpr: '1.807', ppr: '2.98', z: '0.897', density: '94.95 kg/m³' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.method, ['natural_gas', 'pitzer'], 'method', 'Gas and method');
  const pure = x.method === 'pitzer';
  const P = pure ? assertRange(x.p_pure_pa, 1000, 2e8, 'p_pure_pa', 'Pressure') : assertRange(x.pressure_pa, 1000, 2e8, 'pressure_pa', 'Pressure');
  const T = pure ? assertRange(x.t_pure_k, 2, 1500, 't_pure_k', 'Temperature') : assertRange(x.temp_k, 50, 1500, 'temp_k', 'Temperature');
  const warnings = [];
  let tc;
  let pc;
  let M;
  let z;
  let eps = null;
  let vr = null;
  if (x.method === 'natural_gas') {
    const sg = assertRange(x.gas_sg, 0.57, 1.68, 'gas_sg', 'Gas specific gravity γ');
    const yh = assertRange(x.y_h2s, 0, 0.5, 'y_h2s', 'H₂S mole fraction');
    const yc = assertRange(x.y_co2, 0, 0.5, 'y_co2', 'CO₂ mole fraction');
    const s = sutton(sg);
    let tR = s.tpcR;
    let pPsia = s.ppcPsia;
    if (yh + yc > 0) ({ tpcR: tR, ppcPsia: pPsia, eps } = wichertAziz(tR, pPsia, yh, yc));
    else eps = 0;
    tc = tR * RANKINE;
    pc = pPsia * PSI;
    M = M_AIR * sg;
    const tpr = T / tc;
    const ppr = P / pc;
    if (tpr < 1.05 || tpr > 3) throw new Error(`Temperature: the reduced temperature T/Tpc is ${tpr.toFixed(3)}; the Standing–Katz chart and its Dranchuk–Abou-Kassem fit cover 1.05 to 3.0.`);
    if (ppr > 30) throw new Error(`Pressure: the reduced pressure p/ppc is ${ppr.toFixed(2)}; the Dranchuk–Abou-Kassem fit is valid up to 30.`);
    if (ppr < 0.2) warnings.push('Reduced pressure below 0.2, under the fitted range of the Standing–Katz chart; Z is close to 1 here and the result tends to the ideal gas.');
    if (tpr < 1.2 && ppr > 0.8 && ppr < 2.5) warnings.push('Reduced temperature below 1.2 near the pseudo-critical pressure: the Standing–Katz chart is steep here and Z is least accurate (a few per cent).');
    z = zDAK(tpr, ppr);
    if (z === null) throw new Error('Pressure: no gas-phase Z was found for these reduced conditions; check the pressure and temperature.');
  } else {
    tc = assertRange(x.tc_k, 2, 1000, 'tc_k', 'Critical temperature Tc');
    pc = assertRange(x.pc_pa, 1e5, 1e8, 'pc_pa', 'Critical pressure Pc');
    const w = assertRange(x.omega, -0.4, 1.5, 'omega', 'Acentric factor ω');
    M = assertRange(x.molar_mass, 2, 500, 'molar_mass', 'Molar mass');
    const tr = T / tc;
    const pr = P / pc;
    ({ z } = zPitzer(tr, pr, w));
    const zc = 0.291 - 0.08 * w;
    vr = z > 0 ? (z * tr) / (zc * pr) : 0;
    if (!(z > 0) || vr < 2) throw new Error('Pressure: the gas is too dense for the second-virial correlation (molar volume below twice the critical volume); use a lower pressure, or the Lee–Kesler tables or a cubic equation of state.');
    if (tr < 1) warnings.push('Below the critical temperature the gas condenses at its vapour pressure: check that the pressure is below the saturation pressure at this temperature.');
  }
  const rhoIdeal = (P * M) / 1000 / (R * T);
  return {
    outputs: {
      z,
      density: rhoIdeal / z,
      density_ideal: rhoIdeal,
      tpc_r: tc / RANKINE,
      tpc_k: tc,
      ppc_pa: pc,
      tpr: T / tc,
      ppr: P / pc,
      eps_r: eps,
      bg: (P_SC / T_SC) * ((z * T) / P),
      vr,
    },
    warnings,
  };
}
