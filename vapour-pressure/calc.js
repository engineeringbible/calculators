/**
 * vapour-pressure/calc.js — vapour pressure of a pure liquid at a temperature, or its boiling point at a pressure,
 * by the Antoine equation with constants from the NIST Chemistry WebBook (and the Dortmund Data Bank for water above
 * 100 °C), each used only inside its published temperature range.
 *
 * log10(P / bar) = A − B / (T / K + C);  inverse: T = B / (A − log10 P) − C (solved piecewise by bisection).
 * Schema units: SI — K, Pa.
 */
import { withDefaults, assertOneOf, assertRange } from '../shared/validate.js';
import { psat as iapwsPsat } from '../shared/iapws97.js';

const MMHG_PER_BAR = 750.061683;

/** Converts Antoine constants for log10(P/mmHg) with T in °C to log10(P/bar) with T in K. */
const fromMmHgC = (A, B, C) => [A - Math.log10(MMHG_PER_BAR), B, C - 273.15];

// Segments [T_min K, T_max K, A, B, C, reference]: log10(P/bar) = A − B/(T + C). NIST WebBook (Linstrom and Mallard,
// SRD 69) Antoine parameters, except water above 373.15 K (Dortmund Data Bank: 8.14019, 1810.94, 244.485 in mmHg, °C).
// Where two NIST ranges leave a 1 K gap (water) they are joined at its midpoint.
export const FLUIDS = {
  water: { label: 'Water', seg: [
    [273.15, 303.5, 5.40221, 1838.675, -31.737, 'Bridgeman and Aldrich (1964), NIST'],
    [303.5, 333.5, 5.20389, 1733.926, -39.485, 'Bridgeman and Aldrich (1964), NIST'],
    [333.5, 363, 5.0768, 1659.793, -45.854, 'Bridgeman and Aldrich (1964), NIST'],
    [363, 373.15, 5.08354, 1663.125, -45.622, 'Bridgeman and Aldrich (1964), NIST'],
    [373.15, 647, ...fromMmHgC(8.14019, 1810.94, 244.485), 'Dortmund Data Bank'],
  ] },
  ethanol: { label: 'Ethanol', seg: [
    [273, 292.77, 5.37229, 1670.409, -40.191, 'Kretschmer and Wiebe (1949), NIST'],
    [292.77, 366.63, 5.24677, 1598.673, -46.424, 'Ambrose and Sprake (1970), NIST'],
  ] },
  methanol: { label: 'Methanol', seg: [[288.1, 356.83, 5.20409, 1581.341, -33.5, 'Ambrose and Sprake (1970), NIST']] },
  acetone: { label: 'Acetone', seg: [[259.16, 507.6, 4.42448, 1312.253, -32.445, 'Ambrose, Sprake et al. (1974), NIST']] },
  benzene: { label: 'Benzene', seg: [
    [287.7, 354.07, 4.01814, 1203.835, -53.226, 'Williamham, Taylor et al. (1945), NIST'],
    [354.07, 373.5, 4.72583, 1660.652, -1.461, 'Eon, Pommier et al. (1971), NIST'],
  ] },
  toluene: { label: 'Toluene', seg: [
    [273, 323, 4.14157, 1377.578, -50.507, 'Pitzer and Scott (1943), NIST'],
    [323, 384.66, 4.07827, 1343.943, -53.773, 'Williamham, Taylor et al. (1945), NIST'],
  ] },
  pentane: { label: 'n-Pentane', seg: [[268.8, 341.37, 3.9892, 1070.617, -40.454, 'Osborn and Douslin (1974), NIST']] },
  hexane: { label: 'n-Hexane', seg: [[286.18, 342.69, 4.00266, 1171.53, -48.784, 'Williamham, Taylor et al. (1945), NIST']] },
  heptane: { label: 'n-Heptane', seg: [[299.07, 372.43, 4.02832, 1268.636, -56.199, 'Williamham, Taylor et al. (1945), NIST']] },
  cyclohexane: { label: 'Cyclohexane', seg: [
    [293.06, 354.73, 3.96988, 1203.526, -50.287, 'Williamham, Taylor et al. (1945), NIST'],
    [354.73, 523, 4.13983, 1316.554, -35.581, 'Kerns, Anthony et al. (1974), NIST'],
  ] },
  acetic_acid: { label: 'Acetic acid', seg: [[290.26, 391.01, 4.68206, 1642.54, -39.764, 'McDonald, Shrader et al. (1959), NIST']] },
  ammonia: { label: 'Ammonia', seg: [
    [164, 239.6, 3.18757, 506.713, -80.78, 'Stull (1947), NIST'],
    [239.6, 371.5, 4.86886, 1113.928, -10.409, 'Stull (1947), NIST'],
  ] },
  propane: { label: 'Propane', seg: [
    [166.02, 231.41, 4.01158, 834.26, -22.763, 'Kemp and Egan (1938), NIST'],
    [231.41, 277.6, 3.98292, 819.296, -24.417, 'Rips (1963), NIST'],
    [277.6, 360.8, 4.53678, 1149.36, 24.906, 'Helgeson and Sage (1967), NIST'],
  ] },
  butane: { label: 'n-Butane', seg: [
    [195.11, 272.81, 3.85002, 909.65, -36.146, 'Aston and Messerly (1940), NIST'],
    [272.81, 425, 4.35576, 1175.581, -2.071, 'Das, Reed et al. (1973), NIST'],
  ] },
};

const segAt = (fluid, T) => FLUIDS[fluid].seg.find((s) => T >= s[0] - 1e-9 && T <= s[1] + 1e-9);
const rangeOf = (fluid) => { const s = FLUIDS[fluid].seg; return [s[0][0], s[s.length - 1][1]]; };
const fmtK = (t) => `${t.toFixed(2)} K (${(t - 273.15).toFixed(1)} °C)`;

/** Vapour pressure in Pa at T (K); null outside the tabulated range. */
export function vapourPressure(fluid, T) {
  const s = segAt(fluid, T);
  return s ? 10 ** (s[2] - s[3] / (T + s[4])) * 1e5 : null;
}

/** Boiling temperature in K at P (Pa) by bisection on the piecewise Antoine curve; null outside its pressure range. */
export function boilingPoint(fluid, P) {
  let [lo, hi] = rangeOf(fluid);
  const f = (T) => Math.log(vapourPressure(fluid, T) / P);
  if (f(lo) > 0 || f(hi) < 0) return null;
  for (let k = 0; k < 200 && hi - lo > 1e-10; k += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export const schema = {
  id: 'vapour-pressure',
  name: 'Vapour pressure calculator (Antoine equation)',
  category: 'process',
  summary: 'Vapour pressure at a temperature, or boiling point at a pressure, of water, alcohols, acetone, aromatics, alkanes, ammonia and more by the Antoine equation.',
  related: ['steam-table', 'gas-compressibility', 'pump-npsh', 'ppm-concentration'],
  assumptions: [
    'The Antoine equation log10 P = A − B / (T + C) is a fit to measured vapour pressures; each set of constants is used only inside the temperature range it was fitted to, and the calculator refuses temperatures and pressures outside the tabulated ranges rather than extrapolate.',
    'Constants are those of the NIST Chemistry WebBook (P in bar, T in K); water above 100 °C uses the Dortmund Data Bank set. Where a fluid has more than one range, the calculator switches at the range limits, so the curve can step by up to 3 % there.',
    'Checked against the NIST reference equations of state: most ranges agree within 0.3 %; water above 100 °C within 1.3 % (IAPWS-IF97), n-butane within 2.6 %, propane between 231 and 278 K within 3 % and ammonia within 5 %.',
    'The liquid is pure. Dissolved salts lower the vapour pressure, and a mixture follows Raoult\'s law only roughly; this page does not treat mixtures.',
  ],
  notes: [
    'Verification 2026-11-08: ethanol at 50 °C: log10 P = 5.24677 − 1598.673 / (323.15 − 46.424) = −0.5303, P = 29.49 kPa; the same constants give a normal boiling point of 351.45 K (78.3 °C), against 351.44 K in the NIST WebBook. Checked by hand.',
    'Water against IAPWS-IF97: within 0.11 % from 0 to 100 °C (Bridgeman and Aldrich ranges) and 1.3 % from 100 to 374 °C (DDB). Ethanol and methanol ranges above their normal boiling points on the NIST page (Ambrose et al. 1975) are 6 to 8 % below the NIST equation of state and are not used; nor is the low-temperature n-heptane range (up to 5 % off).',
  ],
  sources: [
    'NIST Chemistry WebBook, NIST Standard Reference Database 69 (Linstrom and Mallard, eds.), phase-change data: Antoine equation parameters for each fluid',
    'Dortmund Data Bank (DDBST GmbH), Antoine constants of water, 99–374 °C: A = 8.14019, B = 1810.94, C = 244.485 (mmHg, °C)',
    'IAPWS R7-97(2012), Revised Release on the IAPWS Industrial Formulation 1997, eq. 30 (saturation pressure of water, used for the comparison)',
  ],
  inputs: [
    { id: 'fluid', label: 'Liquid', type: 'select', default: 'water', options: Object.entries(FLUIDS).map(([value, f]) => { const [a, b] = rangeOf(value); return { value, label: `${f.label} (${(a - 273.15).toFixed(0)} to ${(b - 273.15).toFixed(0)} °C)` }; }) },
    { id: 'mode', label: 'Find', type: 'select', default: 'pressure', options: [{ value: 'pressure', label: 'Vapour pressure at a temperature' }, { value: 'boiling', label: 'Boiling point at a pressure' }] },
    { id: 'temp_k', label: 'Temperature', group: 'temperature', unit: 'K', display: 'C', default: 323.15, min: 150, max: 700, visibleWhen: { mode: 'pressure' } },
    { id: 'pressure_pa', label: 'Pressure (absolute)', group: 'pressure', unit: 'Pa', display: 'kPa', default: 101325, min: 1, max: 3e7, visibleWhen: { mode: 'boiling' } },
  ],
  outputs: [
    { id: 'psat_pa', label: 'Vapour pressure', group: 'pressure', unit: 'Pa', display: 'kPa', visibleWhen: { mode: 'pressure' } },
    { id: 'tsat_k', label: 'Boiling point at this pressure', group: 'temperature', unit: 'K', display: 'C', decimals: 2, visibleWhen: { mode: 'boiling' } },
    { id: 'nbp_k', label: 'Normal boiling point (at 101.325 kPa)', group: 'temperature', unit: 'K', display: 'C', decimals: 2 },
    { id: 'iapws_pa', label: 'Water by IAPWS-IF97, for comparison', group: 'pressure', unit: 'Pa', display: 'kPa', visibleWhen: { fluid: 'water', mode: 'pressure' } },
    { id: 'constants', label: 'Antoine constants used (log10 P/bar = A − B / (T/K + C))', type: 'text' },
    { id: 'range', label: 'Temperature range of the constants', type: 'text' },
  ],
  example: {
    inputs: { fluid: 'ethanol', mode: 'pressure', temp_k: [50, 'C'] },
    results: { psat_pa: '29.49 kPa' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.fluid, Object.keys(FLUIDS), 'fluid', 'Liquid');
  assertOneOf(x.mode, ['pressure', 'boiling'], 'mode', 'Find');
  const name = FLUIDS[x.fluid].label;
  const [tLo, tHi] = rangeOf(x.fluid);
  let T;
  let P;
  if (x.mode === 'pressure') {
    T = assertRange(x.temp_k, 150, 700, 'temp_k', 'Temperature');
    if (T < tLo - 1e-9 || T > tHi + 1e-9) throw new Error(`Temperature: the Antoine constants for ${name} cover ${fmtK(tLo)} to ${fmtK(tHi)}; the calculator does not extrapolate.`);
    P = vapourPressure(x.fluid, T);
  } else {
    P = assertRange(x.pressure_pa, 1, 3e7, 'pressure_pa', 'Pressure');
    T = boilingPoint(x.fluid, P);
    if (T === null) {
      const pLo = vapourPressure(x.fluid, tLo) / 1000;
      const pHi = vapourPressure(x.fluid, tHi) / 1000;
      throw new Error(`Pressure: the Antoine constants for ${name} cover ${pLo.toPrecision(3)} to ${pHi.toPrecision(4)} kPa; the calculator does not extrapolate.`);
    }
  }
  const s = segAt(x.fluid, T);
  const nbp = boilingPoint(x.fluid, 101325);
  const warnings = [];
  if (x.fluid === 'water' && T > 373.15) warnings.push('Above 100 °C the water constants are within about 1.3 % of IAPWS-IF97; the steam table calculator gives the exact saturation pressure.');
  if (x.fluid === 'ammonia' || (x.fluid === 'propane' && T > 231.41 && T < 277.6) || x.fluid === 'butane') warnings.push('These constants are within 2 to 5 % of the NIST reference equation of state; use refrigerant or hydrocarbon property tables for design.');
  return {
    outputs: {
      psat_pa: x.mode === 'pressure' ? P : null,
      tsat_k: x.mode === 'boiling' ? T : null,
      nbp_k: nbp,
      iapws_pa: x.fluid === 'water' && x.mode === 'pressure' ? iapwsPsat(T) * 1e6 : null,
      constants: `A = ${+s[2].toFixed(5)}, B = ${s[3]}, C = ${+s[4].toFixed(3)} (${s[5]})`,
      range: `${fmtK(s[0])} to ${fmtK(s[1])}; whole table for ${name}: ${fmtK(tLo)} to ${fmtK(tHi)}`,
    },
    warnings,
  };
}
