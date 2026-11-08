/**
 * fuel-blend-heating/calc.js — viscosity of a blend of two marine fuels by the Refutas blending-index method, blend
 * density and sulphur, the cutter fraction needed for a target viscosity or sulphur, and the fuel temperature for a
 * target viscosity (injection/preheating) from the ASTM D341 (Walther) viscosity–temperature relation.
 *
 * VBI = 14.534 ln(ln(ν + 0.8)) + 10.975;  VBI_blend = Σ w_i VBI_i;  ν = exp(exp((VBI − 10.975)/14.534)) − 0.8.
 * Walther: log10 log10(ν + 0.7) = A − B log10 T[K].
 * Schema units: cSt, °C, kg/m³, % m/m.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

export const REFUTAS_A = 14.534;
export const REFUTAS_B = 10.975;
export const REFUTAS_OFFSET = 0.8;
export const WALTHER_OFFSET = 0.7;

export const schema = {
  id: 'fuel-blend-heating',
  name: 'Fuel blending and heating viscosity',
  category: 'maritime',
  summary: 'Blend viscosity (Refutas), density and sulphur of two fuels, and the injection or preheating temperature from ASTM D341.',
  related: ['bunker-quantity', 'fuel-voyage-cost', 'eu-ets-fueleu', 'pipe-flow'],
  assumptions: [
    'Refutas blending-index method (ASTM D7152 Wright/Refutas family): the viscosity blending index VBI = 14.534 ln(ln(ν + 0.8)) + 10.975 blends linearly by MASS fraction and the result is inverted to the blend viscosity, all at one temperature; it is accurate to a few per cent for miscible petroleum fuels and does not account for the non-ideal behaviour of some residual/distillate pairs.',
    'Blend density by mass-weighted volumes (1/ρ = Σ w_i/ρ_i) and sulphur by mass fraction; both are ideal mixing and ignore small volume changes on blending.',
    'The viscosity–temperature relation is ASTM D341 (Walther): log10 log10(ν + 0.7) = A − B log10 T with T in kelvin, fitted through two known points of the fuel (e.g. the ISO 8217 viscosity at 50 °C and the value at 100 °C or another temperature); with only one point the default second point assumes a typical residual-fuel slope and the temperature result is approximate (±5 °C).',
    'Target viscosities: injection 10–15 cSt for most medium- and slow-speed engines (makers quote 12–14), transfer pumping below about 1 000 cSt, separator inlet about 98 °C for HFO; the minimum distillate viscosity at the injection pump (≈ 2 cSt) limits how hot MGO may be run — the page flags it.',
    'Compatibility and stability (asphaltene precipitation when a paraffinic distillate cuts an aromatic residual fuel) are NOT predicted: the Refutas method says nothing about them; check spot tests (ASTM D4740) or TSP before blending on board, and never blend across ISO 8217 categories without a compatibility test.',
    'Lower calorific value and other ISO 8217 parameters (water, ash, CCAI, pour point) are not blended here.',
  ],
  notes: [
    'Verification 2026-10-30: Refutas indices VBI(10 cSt) = 23.58 and VBI(100 cSt) = 33.20 give a 50/50 mass blend of 26.7 cSt (not the 55 cSt arithmetic mean); a 380 cSt @ 50 °C / 35 cSt @ 100 °C residual fuel needs 128 °C for 15 cSt and 138 °C for 12 cSt by Walther, matching the usual 125–140 °C HFO injection temperatures.',
    'Design decision: the blend is specified by the mass fraction of fuel A, with modes that solve for the fraction giving a target viscosity or sulphur, because that is how a cutter stock is actually dosed.',
    'Design decision: the Walther second reference point defaults to a typical residual slope (ν at 100 °C ≈ 35 cSt for a 380 cSt fuel) with a warning; users should enter the certificate value.',
  ],
  sources: [
    'ASTM D7152, Standard Practice for Calculating Viscosity of a Blend of Petroleum Products (Refutas / Wright methods); Refutas, Shell Oil Co. viscosity blending index (as reproduced in Maples, Petroleum Refinery Process Economics, 2000)',
    'ASTM D341, Standard Practice for Viscosity-Temperature Equations and Charts for Liquid Petroleum or Hydrocarbon Products (Walther equation, MacCoull chart)',
    'ISO 8217:2017 Petroleum products — Fuels (class F) — Specifications of marine fuels (viscosity at 50 °C for residual grades, at 40 °C for distillates; Annex on viscosity–temperature)',
    'CIMAC Guideline "Fuel quality guide — ISO 8217:2017" and engine makers\' fuel-oil heating recommendations (injection 10–15 cSt)',
  ],
  inputs: [
    { id: 'mode', label: 'Find', type: 'select', default: 'blend', options: [{ value: 'blend', label: 'Blend properties for a given mass fraction' }, { value: 'target_viscosity', label: 'Fraction of fuel A for a target blend viscosity' }, { value: 'target_sulphur', label: 'Fraction of fuel A for a target blend sulphur' }] },
    { id: 'visc_a_cst', label: 'Fuel A viscosity at the blending temperature', group: 'kinematic_viscosity', unit: 'cSt', default: 380, min: 0.5, max: 10000 },
    { id: 'density_a', label: 'Fuel A density at 15 °C', group: 'density', unit: 'kg_m3', default: 991, min: 700, max: 1100 },
    { id: 'sulphur_a_pct', label: 'Fuel A sulphur', group: 'ratio', unit: 'pct', default: 0.5, min: 0, max: 5 },
    { id: 'visc_b_cst', label: 'Fuel B (cutter) viscosity at the same temperature', group: 'kinematic_viscosity', unit: 'cSt', default: 2.5, min: 0.5, max: 10000 },
    { id: 'density_b', label: 'Fuel B density at 15 °C', group: 'density', unit: 'kg_m3', default: 860, min: 700, max: 1100 },
    { id: 'sulphur_b_pct', label: 'Fuel B sulphur', group: 'ratio', unit: 'pct', default: 0.1, min: 0, max: 5 },
    { id: 'fraction_a', label: 'Mass fraction of fuel A', group: 'ratio', unit: 'frac', display: 'pct', default: 0.8, min: 0, max: 1, visibleWhen: { mode: 'blend' } },
    { id: 'target_visc_cst', label: 'Target blend viscosity (at the blending temperature)', group: 'kinematic_viscosity', unit: 'cSt', default: 180, min: 0.5, max: 10000, visibleWhen: { mode: 'target_viscosity' } },
    { id: 'target_sulphur_pct', label: 'Target blend sulphur', group: 'ratio', unit: 'pct', default: 0.4, min: 0, max: 5, visibleWhen: { mode: 'target_sulphur' } },
    { id: 'heating_fuel', label: 'Heating calculation for', type: 'select', default: 'a', options: [{ value: 'a', label: 'Fuel A as delivered' }, { value: 'blend', label: 'The blend (viscosity at the blending temperature, same slope as fuel A)' }] },
    { id: 'ref_temp_c', label: 'Temperature of the viscosity values above (blending / reference temperature)', group: 'temperature', unit: 'C', default: 50, min: -20, max: 150 },
    { id: 'second_visc_cst', label: 'Fuel A viscosity at a second temperature (certificate or typical)', group: 'kinematic_viscosity', unit: 'cSt', default: 35, min: 0.5, max: 10000 },
    { id: 'second_temp_c', label: 'That second temperature', group: 'temperature', unit: 'C', default: 100, min: -20, max: 200 },
    { id: 'target_inj_cst', label: 'Target viscosity at the engine (injection)', group: 'kinematic_viscosity', unit: 'cSt', default: 13, min: 1, max: 50 },
    { id: 'pumping_cst', label: 'Maximum viscosity for transfer pumping', group: 'kinematic_viscosity', unit: 'cSt', default: 1000, min: 50, max: 5000 },
  ],
  outputs: [
    { id: 'vbi_a', label: 'Blending index of fuel A', group: 'dimensionless', unit: 'none' },
    { id: 'vbi_b', label: 'Blending index of fuel B', group: 'dimensionless', unit: 'none' },
    { id: 'fraction_a_out', label: 'Mass fraction of fuel A', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'volume_fraction_a', label: 'Volume fraction of fuel A (at 15 °C)', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'blend_visc_cst', label: 'Blend viscosity at the blending temperature', group: 'kinematic_viscosity', unit: 'cSt' },
    { id: 'blend_density', label: 'Blend density at 15 °C', group: 'density', unit: 'kg_m3' },
    { id: 'blend_sulphur_pct', label: 'Blend sulphur', group: 'ratio', unit: 'pct' },
    { id: 'walther_a', label: 'Walther constant A', group: 'dimensionless', unit: 'none' },
    { id: 'walther_b', label: 'Walther slope B', group: 'dimensionless', unit: 'none' },
    { id: 'injection_temp_c', label: 'Temperature for the target injection viscosity', group: 'temperature', unit: 'C' },
    { id: 'pumping_temp_c', label: 'Minimum temperature for transfer pumping', group: 'temperature', unit: 'C' },
    { id: 'visc_at_40_cst', label: 'Viscosity at 40 °C (ISO 8217 distillate basis)', group: 'kinematic_viscosity', unit: 'cSt' },
    { id: 'visc_at_50_cst', label: 'Viscosity at 50 °C (ISO 8217 residual basis)', group: 'kinematic_viscosity', unit: 'cSt' },
    { id: 'visc_at_100_cst', label: 'Viscosity at 100 °C', group: 'kinematic_viscosity', unit: 'cSt' },
    { id: 'heating_note', label: 'Heating remark', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      vbi_a: '36.88',
      vbi_b: '13.55',
      blend_visc_cst: '73.7 cSt',
      blend_density: '962 kg/m³',
      blend_sulphur_pct: '0.42 %',
      walther_a: '9.27',
      walther_b: '3.53',
      injection_temp_c: '134 °C',
    },
  },
};

/** Refutas viscosity blending index. */
export function blendingIndex(viscCst) {
  return REFUTAS_A * Math.log(Math.log(viscCst + REFUTAS_OFFSET)) + REFUTAS_B;
}

/** Inverse of the blending index. */
export function viscosityFromIndex(vbi) {
  return Math.exp(Math.exp((vbi - REFUTAS_B) / REFUTAS_A)) - REFUTAS_OFFSET;
}

/** Walther constants from two (temperature °C, viscosity cSt) points. */
export function waltherFit(t1C, v1, t2C, v2) {
  const x1 = Math.log10(t1C + 273.15);
  const x2 = Math.log10(t2C + 273.15);
  const y1 = Math.log10(Math.log10(v1 + WALTHER_OFFSET));
  const y2 = Math.log10(Math.log10(v2 + WALTHER_OFFSET));
  const B = (y1 - y2) / (x2 - x1);
  return { A: y1 + B * x1, B };
}

/** Viscosity (cSt) at temperature °C from Walther constants. */
export function waltherViscosity(fit, tC) {
  const y = fit.A - fit.B * Math.log10(tC + 273.15);
  return 10 ** (10 ** y) - WALTHER_OFFSET;
}

/** Temperature (°C) at which the fuel has the given viscosity. */
export function waltherTemperature(fit, viscCst) {
  const y = Math.log10(Math.log10(viscCst + WALTHER_OFFSET));
  return 10 ** ((fit.A - y) / fit.B) - 273.15;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.mode, ['blend', 'target_viscosity', 'target_sulphur'], 'mode', 'Find');
  assertOneOf(i.heating_fuel, ['a', 'blend'], 'heating_fuel', 'Heating fuel');
  for (const id of ['visc_a_cst', 'visc_b_cst', 'density_a', 'density_b', 'second_visc_cst', 'target_inj_cst', 'pumping_cst']) assertPositive(i[id], id, id);
  assertNonNegative(i.sulphur_a_pct, 'sulphur_a_pct', 'Sulphur A');
  assertNonNegative(i.sulphur_b_pct, 'sulphur_b_pct', 'Sulphur B');
  assertRange(i.ref_temp_c, -30, 200, 'ref_temp_c', 'Reference temperature');
  assertRange(i.second_temp_c, -30, 250, 'second_temp_c', 'Second temperature');
  if (Math.abs(i.second_temp_c - i.ref_temp_c) < 5) throw new Error('The two viscosity reference temperatures must differ by at least 5 °C');

  const vbiA = blendingIndex(i.visc_a_cst);
  const vbiB = blendingIndex(i.visc_b_cst);
  let wA;
  if (i.mode === 'blend') wA = assertRange(i.fraction_a, 0, 1, 'fraction_a', 'Mass fraction of A');
  else if (i.mode === 'target_viscosity') {
    const vbiT = blendingIndex(assertPositive(i.target_visc_cst, 'target_visc_cst', 'Target viscosity'));
    if (Math.abs(vbiA - vbiB) < 1e-9) throw new Error('Fuels A and B have the same viscosity: no blend fraction changes it');
    wA = (vbiT - vbiB) / (vbiA - vbiB);
    if (wA < 0 || wA > 1) throw new Error(`Target viscosity ${i.target_visc_cst} cSt is outside the range of the two fuels (${Math.min(i.visc_a_cst, i.visc_b_cst)}–${Math.max(i.visc_a_cst, i.visc_b_cst)} cSt)`);
  } else {
    assertNonNegative(i.target_sulphur_pct, 'target_sulphur_pct', 'Target sulphur');
    if (Math.abs(i.sulphur_a_pct - i.sulphur_b_pct) < 1e-9) throw new Error('Fuels A and B have the same sulphur content: no blend fraction changes it');
    wA = (i.target_sulphur_pct - i.sulphur_b_pct) / (i.sulphur_a_pct - i.sulphur_b_pct);
    if (wA < 0 || wA > 1) throw new Error(`Target sulphur ${i.target_sulphur_pct} % is outside the range of the two fuels (${Math.min(i.sulphur_a_pct, i.sulphur_b_pct)}–${Math.max(i.sulphur_a_pct, i.sulphur_b_pct)} %)`);
  }
  const wB = 1 - wA;
  const blendVisc = viscosityFromIndex(wA * vbiA + wB * vbiB);
  const blendDensity = 1 / (wA / i.density_a + wB / i.density_b);
  const blendSulphur = wA * i.sulphur_a_pct + wB * i.sulphur_b_pct;
  const volumeFractionA = (wA / i.density_a) * blendDensity;

  // Walther fit on fuel A; the blend uses the same slope through its viscosity at the reference temperature
  const fitA = waltherFit(i.ref_temp_c, i.visc_a_cst, i.second_temp_c, i.second_visc_cst);
  if (!(fitA.B > 0)) throw new Error('Viscosity must decrease with temperature: check the two reference points');
  let fit = fitA;
  if (i.heating_fuel === 'blend') {
    const y = Math.log10(Math.log10(blendVisc + WALTHER_OFFSET));
    fit = { A: y + fitA.B * Math.log10(i.ref_temp_c + 273.15), B: fitA.B };
  }
  const injectionTemp = waltherTemperature(fit, i.target_inj_cst);
  const pumpingTemp = waltherTemperature(fit, i.pumping_cst);
  const finiteOrNull = (v) => (Number.isFinite(v) ? v : null);
  const v40 = finiteOrNull(waltherViscosity(fit, 40));
  const v50 = finiteOrNull(waltherViscosity(fit, 50));
  const v100 = finiteOrNull(waltherViscosity(fit, 100));

  let heatingNote;
  if (injectionTemp > 150) heatingNote = `${injectionTemp.toFixed(0)} °C needed for ${i.target_inj_cst} cSt — above the usual 150 °C heater limit; this fuel cannot reach the target viscosity`;
  else if (injectionTemp < 40) heatingNote = `${injectionTemp.toFixed(0)} °C for ${i.target_inj_cst} cSt — a distillate-like fuel: watch the minimum viscosity at the injection pump (≈ 2 cSt) rather than heating`;
  else heatingNote = `Heat to ${injectionTemp.toFixed(0)} °C for ${i.target_inj_cst} cSt at the engine; transfer pumps need ≥ ${pumpingTemp.toFixed(0)} °C for ≤ ${i.pumping_cst} cSt`;

  const warnings = [];
  if (v40 === null || v50 === null || v100 === null) warnings.push('The viscosity–temperature line through the two points is too steep to extrapolate to 40, 50 or 100 °C: check the second viscosity point.');
  if (i.second_visc_cst === 35 && i.second_temp_c === 100 && i.visc_a_cst !== 380) warnings.push('Second viscosity point left at the default (35 cSt at 100 °C, typical of a 380 cSt fuel): enter the certificate value for your fuel or the heating temperature is approximate (±5 °C).');
  if (i.mode !== 'blend' && (wA < 0.05 || wA > 0.95)) warnings.push('Required fraction below 5 % or above 95 %: dosing accuracy on board is unlikely to achieve the target reliably.');
  if (i.visc_b_cst < 15 && i.visc_a_cst > 100 && wB > 0) warnings.push('Residual fuel cut with a distillate: check compatibility (ASTM D4740 spot test or TSP) — paraffinic distillates can precipitate asphaltenes and sludge the separators.');
  if (i.heating_fuel === 'blend') warnings.push('Blend heating uses the Walther slope of fuel A through the blend viscosity: an approximation, since the blend\'s slope lies between the two components.');
  if (blendSulphur > 0.5) warnings.push(`Blend sulphur ${blendSulphur.toFixed(2)} % exceeds the 0.50 % global cap (MARPOL Annex VI) — compliant only with a scrubber; 0.10 % applies in ECAs.`);
  else if (blendSulphur > 0.1) warnings.push('Blend sulphur above 0.10 %: not compliant inside Emission Control Areas.');
  warnings.push('Refutas blending is accurate to a few per cent for miscible fuels; viscosity, density and sulphur blend ideally here — stability, water, ash and CCAI are not predicted.');

  return {
    outputs: {
      vbi_a: vbiA,
      vbi_b: vbiB,
      fraction_a_out: wA,
      volume_fraction_a: volumeFractionA,
      blend_visc_cst: blendVisc,
      blend_density: blendDensity,
      blend_sulphur_pct: blendSulphur,
      walther_a: fit.A,
      walther_b: fit.B,
      injection_temp_c: injectionTemp,
      pumping_temp_c: pumpingTemp,
      visc_at_40_cst: v40,
      visc_at_50_cst: v50,
      visc_at_100_cst: v100,
      heating_note: heatingNote,
    },
    warnings,
  };
}
