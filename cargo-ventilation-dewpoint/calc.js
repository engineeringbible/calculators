/**
 * cargo-ventilation-dewpoint/calc.js — psychrometrics for cargo-hold ventilation decisions: dew point, relative
 * humidity and humidity ratio of the outside air and the hold air from dry- and wet-bulb readings (or RH), the
 * dew-point rule, the three-degree rule for hygroscopic cargoes and the ship-sweat / cargo-sweat risks.
 *
 * e_s(T) = 6.1094 exp(17.625 T/(T + 243.04)) hPa (Magnus, Alduchov–Eskridge);  e = e_s(T_w) − A p (T − T_w) (Sprung);
 * T_d = 243.04 ln(e/6.1094)/(17.625 − ln(e/6.1094));  W = 622 e/(p − e) g/kg.
 * Schema units: °C, hPa, %, g/kg.
 */
import { withDefaults, assertRange, assertOneOf, assertPositive } from '../shared/validate.js';

export const MAGNUS_A = 17.625;
export const MAGNUS_B_C = 243.04;
export const MAGNUS_ES0_HPA = 6.1094;
export const PSYCHROMETER_A = { aspirated: 0.000662, screen: 0.0008 };

export const schema = {
  id: 'cargo-ventilation-dewpoint',
  name: 'Cargo ventilation and dew point',
  category: 'maritime',
  summary: 'Dew point and humidity from dry and wet bulb, ventilate-or-not decision by the three-degree and dew-point rules, condensation risk.',
  related: ['beaufort-sea-state', 'tidal-height', 'fuel-blend-heating', 'unit-converter'],
  assumptions: [
    'Saturation vapour pressure over water by the Magnus formula with the Alduchov & Eskridge (1996) coefficients e_s = 6.1094 exp(17.625 T/(T + 243.04)) hPa, accurate to about 0.4 % between −40 and +50 °C; no ice-bulb correction below 0 °C.',
    'Wet-bulb to vapour pressure by the psychrometric (Sprung) equation e = e_s(T_w) − A p (T − T_w) with A = 6.62·10⁻⁴ K⁻¹ for an aspirated or whirling psychrometer (ISO 4677-1, WMO-No. 8) and 8.0·10⁻⁴ K⁻¹ for a non-ventilated screen or hand-held instrument; a wet bulb that is not wetted or ventilated reads high and understates the humidity.',
    'Dew point rule: ventilate when the outside dew point is below the dew point of the air in the hold headspace — the universal rule; three-degree rule (hygroscopic cargoes such as grain, rice, cocoa, coffee, timber): ventilate when the outside dry-bulb temperature is at least 3 °C below the average cargo temperature at loading. The rules are compared with margins the user can see; the P&I guidance treats them as decision aids, not laws.',
    'Sweat: ship sweat (condensation on steel) forms when the hold dew point exceeds the hull/steel temperature, approximated by the sea or deck temperature entered; cargo sweat forms when air with a dew point above the cargo temperature is admitted — the calculator flags both with the entered temperatures.',
    'Humidity ratio W = 622 e/(p − e) g/kg dry air and the absolute humidity assume ideal gas behaviour at the station pressure (default 1013.25 hPa).',
    'Records: P&I clubs expect ventilation decisions and the outside/hold readings to be logged every watch; this page gives the numbers, not the log.',
  ],
  notes: [
    'Verification 2026-10-30: Magnus e_s(20 °C) = 23.33 hPa (reference 23.39, 0.3 %); 20 °C at 50 % RH gives a dew point of 9.3 °C (psychrometric tables 9.3); dry bulb 25 / wet bulb 20 °C at 1013 hPa gives RH 63 % and dew point 17.5 °C, matching the ASHRAE chart (63 %, 17.5 °C).',
    'Design decision: both the dew-point and three-degree rules are evaluated every time with an explicit margin, and the overall advice follows the dew-point rule for non-hygroscopic cargo and requires both rules for hygroscopic cargo, as the club guidance does.',
    'Design decision: the hold air may be entered as dry/wet bulb or as dry bulb and RH, because many ships have hygrometers rather than psychrometers in the holds.',
  ],
  sources: [
    'O. A. Alduchov & R. E. Eskridge, "Improved Magnus form approximation of saturation vapor pressure", J. Appl. Meteor. 35 (1996) 601–609',
    'ISO 4677-1:1985 Atmospheres for conditioning and testing — Determination of relative humidity — Part 1: Aspirated psychrometer method (Sprung constant 6.6·10⁻⁴ K⁻¹); WMO-No. 8 Guide to Instruments and Methods of Observation, ch. 4',
    'Britannia P&I, "Cargo ventilation logs — three degree rule and when to ventilate the hold"; Steamship Mutual, "The problem of sweat"; West P&I loss prevention bulletin "Cargo ventilation and precautions to minimise sweat"',
    'ASHRAE Handbook — Fundamentals, ch. 1 Psychrometrics (humidity ratio, dew point, chart check values)',
  ],
  inputs: [
    { id: 'pressure_hpa', label: 'Barometric pressure', group: 'pressure', unit: 'hPa', default: 1013.25, min: 850, max: 1100 },
    { id: 'psychrometer', label: 'Psychrometer type', type: 'select', default: 'aspirated', options: [{ value: 'aspirated', label: 'Aspirated or whirling (A = 6.62·10⁻⁴ /K)' }, { value: 'screen', label: 'Non-ventilated screen / static (A = 8.0·10⁻⁴ /K)' }] },
    { id: 'out_dry_c', label: 'Outside air dry-bulb temperature', group: 'temperature', unit: 'C', default: 25, min: -40, max: 55 },
    { id: 'out_wet_c', label: 'Outside air wet-bulb temperature', group: 'temperature', unit: 'C', default: 20, min: -40, max: 55 },
    { id: 'hold_input', label: 'Hold air given as', type: 'select', default: 'wet_bulb', options: [{ value: 'wet_bulb', label: 'Dry and wet bulb' }, { value: 'rh', label: 'Dry bulb and relative humidity' }] },
    { id: 'hold_dry_c', label: 'Hold air dry-bulb temperature', group: 'temperature', unit: 'C', default: 22, min: -40, max: 60 },
    { id: 'hold_wet_c', label: 'Hold air wet-bulb temperature', group: 'temperature', unit: 'C', default: 20, min: -40, max: 60, visibleWhen: { hold_input: 'wet_bulb' } },
    { id: 'hold_rh_pct', label: 'Hold air relative humidity', group: 'ratio', unit: 'pct', default: 80, min: 1, max: 100, visibleWhen: { hold_input: 'rh' } },
    { id: 'cargo_type', label: 'Cargo', type: 'select', default: 'hygroscopic', options: [{ value: 'hygroscopic', label: 'Hygroscopic (grain, rice, cocoa, coffee, timber, bagged agricultural)' }, { value: 'non_hygroscopic', label: 'Non-hygroscopic (steel, machinery, ores, bagged fertiliser in plastic)' }] },
    { id: 'cargo_temp_c', label: 'Average cargo temperature at loading', group: 'temperature', unit: 'C', default: 18, min: -40, max: 70 },
    { id: 'steel_temp_c', label: 'Hull steel / sea water temperature (ship-sweat check)', group: 'temperature', unit: 'C', default: 16, min: -5, max: 45 },
  ],
  outputs: [
    { id: 'out_vapour_hpa', label: 'Outside vapour pressure', group: 'pressure', unit: 'hPa' },
    { id: 'out_rh_pct', label: 'Outside relative humidity', group: 'ratio', unit: 'pct' },
    { id: 'out_dewpoint_c', label: 'Outside dew point', group: 'temperature', unit: 'C' },
    { id: 'out_humidity_ratio', label: 'Outside humidity ratio', group: 'humidity_ratio', unit: 'g_kg' },
    { id: 'hold_vapour_hpa', label: 'Hold vapour pressure', group: 'pressure', unit: 'hPa' },
    { id: 'hold_rh_out_pct', label: 'Hold relative humidity', group: 'ratio', unit: 'pct' },
    { id: 'hold_dewpoint_c', label: 'Hold dew point', group: 'temperature', unit: 'C' },
    { id: 'hold_humidity_ratio', label: 'Hold humidity ratio', group: 'humidity_ratio', unit: 'g_kg' },
    { id: 'dewpoint_margin_k', label: 'Dew-point margin (hold − outside)', group: 'temperature_difference', unit: 'K' },
    { id: 'dewpoint_rule', label: 'Dew-point rule', type: 'text' },
    { id: 'three_degree_margin_k', label: 'Three-degree margin (cargo − outside dry bulb)', group: 'temperature_difference', unit: 'K' },
    { id: 'three_degree_rule', label: 'Three-degree rule (hygroscopic cargo)', type: 'text' },
    { id: 'advice', label: 'Ventilation advice', type: 'text' },
    { id: 'ship_sweat', label: 'Ship sweat risk (hold dew point vs steel temperature)', type: 'text' },
    { id: 'cargo_sweat', label: 'Cargo sweat risk if ventilating (outside dew point vs cargo temperature)', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      out_vapour_hpa: '20.0 hPa',
      out_rh_pct: '63 %',
      out_dewpoint_c: '17.5 °C',
      out_humidity_ratio: '12.5 g/kg',
      hold_vapour_hpa: '22.0 hPa',
      hold_rh_out_pct: '83 %',
      hold_dewpoint_c: '19.0 °C',
      dewpoint_margin_k: '1.5 K',
    },
  },
};

/** Saturation vapour pressure over water, hPa. */
export function saturationVapourPressureHpa(tC) {
  return MAGNUS_ES0_HPA * Math.exp((MAGNUS_A * tC) / (tC + MAGNUS_B_C));
}

/** Dew point (°C) from vapour pressure (hPa). */
export function dewPointC(eHpa) {
  const l = Math.log(eHpa / MAGNUS_ES0_HPA);
  return (MAGNUS_B_C * l) / (MAGNUS_A - l);
}

/** Vapour pressure (hPa) from dry- and wet-bulb temperatures (Sprung). */
export function vapourPressureFromWetBulbHpa(tDryC, tWetC, pHpa, coefficient) {
  return saturationVapourPressureHpa(tWetC) - coefficient * pHpa * (tDryC - tWetC);
}

/** Humidity ratio, g water per kg dry air. */
export function humidityRatioGkg(eHpa, pHpa) {
  return (622 * eHpa) / (pHpa - eHpa);
}

function airState(tDry, eHpa, pHpa) {
  const es = saturationVapourPressureHpa(tDry);
  return { e: eHpa, rh: (eHpa / es) * 100, dewPoint: dewPointC(eHpa), w: humidityRatioGkg(eHpa, pHpa) };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.pressure_hpa, 'pressure_hpa', 'Pressure');
  assertOneOf(i.psychrometer, Object.keys(PSYCHROMETER_A), 'psychrometer', 'Psychrometer type');
  assertOneOf(i.hold_input, ['wet_bulb', 'rh'], 'hold_input', 'Hold input');
  assertOneOf(i.cargo_type, ['hygroscopic', 'non_hygroscopic'], 'cargo_type', 'Cargo type');
  for (const id of ['out_dry_c', 'out_wet_c', 'hold_dry_c', 'cargo_temp_c', 'steel_temp_c']) assertRange(i[id], -60, 80, id, id);
  if (i.out_wet_c > i.out_dry_c + 1e-9) throw new Error(`Outside wet bulb ${i.out_wet_c} °C cannot exceed the dry bulb ${i.out_dry_c} °C`);
  const A = PSYCHROMETER_A[i.psychrometer];
  const p = i.pressure_hpa;

  const eOut = vapourPressureFromWetBulbHpa(i.out_dry_c, i.out_wet_c, p, A);
  if (eOut <= 0) throw new Error('Outside wet-bulb depression is too large for the pressure: check the readings');
  const out = airState(i.out_dry_c, eOut, p);

  let eHold;
  if (i.hold_input === 'wet_bulb') {
    assertRange(i.hold_wet_c, -60, 80, 'hold_wet_c', 'Hold wet bulb');
    if (i.hold_wet_c > i.hold_dry_c + 1e-9) throw new Error(`Hold wet bulb ${i.hold_wet_c} °C cannot exceed the dry bulb ${i.hold_dry_c} °C`);
    eHold = vapourPressureFromWetBulbHpa(i.hold_dry_c, i.hold_wet_c, p, A);
    if (eHold <= 0) throw new Error('Hold wet-bulb depression is too large: check the readings');
  } else {
    assertRange(i.hold_rh_pct, 0.1, 100, 'hold_rh_pct', 'Hold relative humidity');
    eHold = (saturationVapourPressureHpa(i.hold_dry_c) * i.hold_rh_pct) / 100;
  }
  const hold = airState(i.hold_dry_c, eHold, p);

  const dewMargin = hold.dewPoint - out.dewPoint;
  const dewRule = dewMargin > 0.5 ? `VENTILATE — outside dew point ${out.dewPoint.toFixed(1)} °C is ${dewMargin.toFixed(1)} K below the hold dew point ${hold.dewPoint.toFixed(1)} °C` : dewMargin > -0.5 ? `MARGINAL — dew points within ±0.5 K (${out.dewPoint.toFixed(1)} vs ${hold.dewPoint.toFixed(1)} °C): ventilation brings no drying benefit` : `DO NOT VENTILATE — outside dew point ${out.dewPoint.toFixed(1)} °C is above the hold dew point ${hold.dewPoint.toFixed(1)} °C: admitting it adds moisture`;
  const threeMargin = i.cargo_temp_c - i.out_dry_c;
  const threeRule = threeMargin >= 3 ? `VENTILATE — outside air ${i.out_dry_c} °C is ${threeMargin.toFixed(1)} K cooler than the cargo (${i.cargo_temp_c} °C), at least 3 K` : `DO NOT VENTILATE — outside air is only ${threeMargin.toFixed(1)} K cooler than the cargo (needs ≥ 3 K)${i.cargo_type === 'non_hygroscopic' ? ' — rule not applicable to non-hygroscopic cargo' : ''}`;

  let advice;
  if (i.cargo_type === 'hygroscopic') {
    const both = dewMargin > 0.5 && threeMargin >= 3;
    advice = both ? 'Ventilate (both the dew-point and three-degree rules are satisfied); log readings every watch' : dewMargin > 0.5 ? 'Dew-point rule allows ventilation but the three-degree rule does not: most club guidance says do not ventilate a hygroscopic cargo (risk of cargo sweat as warm air meets cooler cargo); keep hatches closed and record the decision' : 'Do not ventilate: close vents, record outside and hold readings and the reason';
  } else advice = dewMargin > 0.5 ? 'Ventilate (dew-point rule satisfied; the three-degree rule does not apply to non-hygroscopic cargo)' : 'Do not ventilate: outside air would raise the hold dew point; record the readings and the reason';

  const shipSweat = hold.dewPoint > i.steel_temp_c ? `RISK — hold dew point ${hold.dewPoint.toFixed(1)} °C exceeds the steel temperature ${i.steel_temp_c} °C: condensation on the hull, frames and hatch covers; ventilate if the dew-point rule allows` : `No ship sweat — hold dew point ${hold.dewPoint.toFixed(1)} °C below the steel temperature ${i.steel_temp_c} °C`;
  const cargoSweat = out.dewPoint > i.cargo_temp_c ? `RISK — outside dew point ${out.dewPoint.toFixed(1)} °C exceeds the cargo temperature ${i.cargo_temp_c} °C: ventilating would condense moisture on the cargo (cargo sweat)` : `No cargo sweat from ventilation — outside dew point ${out.dewPoint.toFixed(1)} °C below the cargo temperature ${i.cargo_temp_c} °C`;

  const warnings = [];
  if (i.psychrometer === 'screen') warnings.push('Non-ventilated psychrometer coefficient used (8.0·10⁻⁴ /K): readings from hand-held or screen instruments are less reliable than a whirling or aspirated psychrometer.');
  if (i.out_dry_c - i.out_wet_c < 0.5) warnings.push('Outside wet-bulb depression under 0.5 K: the air is nearly saturated; small reading errors change the dew point by several tenths of a degree.');
  if (i.hold_input === 'rh') warnings.push('Hold humidity from a hygrometer: check its calibration — electronic sensors drift in dusty holds.');
  if (i.out_dry_c < 0 || i.hold_dry_c < 0) warnings.push('Below 0 °C the wet bulb may be iced; the Magnus formula over water and the water-bulb coefficient are used regardless.');
  warnings.push('The rules are decision aids from P&I guidance; the master decides with the cargo, voyage and weather in mind, and the readings and decisions should be logged every watch.');

  return {
    outputs: {
      out_vapour_hpa: out.e,
      out_rh_pct: out.rh,
      out_dewpoint_c: out.dewPoint,
      out_humidity_ratio: out.w,
      hold_vapour_hpa: hold.e,
      hold_rh_out_pct: hold.rh,
      hold_dewpoint_c: hold.dewPoint,
      hold_humidity_ratio: hold.w,
      dewpoint_margin_k: dewMargin,
      dewpoint_rule: dewRule,
      three_degree_margin_k: threeMargin,
      three_degree_rule: threeRule,
      advice,
      ship_sweat: shipSweat,
      cargo_sweat: cargoSweat,
    },
    warnings,
  };
}
