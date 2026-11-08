/**
 * dew-point/calc.js — dew point from air temperature and relative humidity (or relative humidity from the dew point),
 * with wet bulb, humidity ratio, absolute humidity, enthalpy and moist-air density.
 *
 * ASHRAE Fundamentals Ch. 1 via shared/psychro.js: p_w = RH p_ws(t); dew point t_d where p_ws(t_d) = p_w.
 * Schema units: SI — °C, Pa, fraction, g/kg, kg/m³, J/kg.
 */
import { withDefaults, assertRange, assertOneOf, assertPositive } from '../shared/validate.js';
import { saturationPressure, stateFromRh, standardPressure } from '../shared/psychro.js';

export const schema = {
  id: 'dew-point',
  name: 'Dew point calculator',
  category: 'hvac',
  summary: 'Dew point from temperature and relative humidity, or humidity from the dew point, with wet bulb, humidity ratio, absolute humidity and enthalpy.',
  related: ['air-density', 'air-changes', 'btu-ac-size', 'cargo-ventilation-dewpoint'],
  assumptions: [
    'Moist-air properties follow ASHRAE Fundamentals Chapter 1 with the Hyland–Wexler saturation pressure; below 0 °C the saturation is over ice, so the result is the frost point.',
    'Relative humidity is the ratio of the vapour pressure to the saturation pressure at the air temperature, as weather stations and hygrometers report it.',
    'The pressure sets the humidity ratio, wet bulb and density but not the dew point; enter the altitude or the local barometric pressure.',
  ],
  notes: [
    'Verification 2026-11-07: 20 °C at 50 % gives a dew point of 9.27 °C, wet bulb 13.8 °C and 7.26 g/kg at sea level, as read from the ASHRAE psychrometric chart.',
  ],
  sources: [
    'ASHRAE Handbook — Fundamentals (SI), Chapter 1 Psychrometrics',
    'US National Weather Service, "The Dew Point" (comfort levels by dew point), weather.gov',
    'Alduchov, O.A. and Eskridge, R.E. (1996), Improved Magnus form approximation of saturation vapor pressure, Journal of Applied Meteorology 35(4) (the common Magnus rule, used only in the article)',
  ],
  inputs: [
    { id: 'mode', label: 'Find', type: 'select', default: 'dew', options: [{ value: 'dew', label: 'Dew point from temperature and humidity' }, { value: 'rh', label: 'Relative humidity from temperature and dew point' }] },
    { id: 'temp_c', label: 'Air (dry-bulb) temperature', group: 'temperature', unit: 'C', default: 20, min: -60, max: 100 },
    { id: 'rh', label: 'Relative humidity', group: 'ratio', unit: 'frac', display: 'pct', default: 0.5, min: 0.001, max: 1, visibleWhen: { mode: 'dew' } },
    { id: 'dew_c', label: 'Dew point', group: 'temperature', unit: 'C', default: 10, min: -80, max: 100, visibleWhen: { mode: 'rh' } },
    { id: 'pressure_mode', label: 'Air pressure from', type: 'select', default: 'altitude', options: [{ value: 'altitude', label: 'Altitude (standard atmosphere)' }, { value: 'pressure', label: 'Barometric pressure' }] },
    { id: 'altitude_m', label: 'Altitude', group: 'length', unit: 'm', default: 0, min: -400, max: 8000, visibleWhen: { pressure_mode: 'altitude' } },
    { id: 'pressure_pa', label: 'Barometric pressure (station, not sea-level corrected)', group: 'pressure', unit: 'Pa', display: 'kPa', default: 101325, min: 30000, max: 110000, visibleWhen: { pressure_mode: 'pressure' } },
  ],
  outputs: [
    { id: 'dew_point_c', label: 'Dew point (frost point below 0 °C)', group: 'temperature', unit: 'C' },
    { id: 'rh_out', label: 'Relative humidity', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'spread_c', label: 'Dew point spread (air − dew point)', group: 'temperature_difference', unit: 'K', display: 'C' },
    { id: 'wet_bulb_c', label: 'Wet-bulb temperature', group: 'temperature', unit: 'C' },
    { id: 'w_g_kg', label: 'Humidity ratio (moisture content)', group: 'humidity_ratio', unit: 'g_kg' },
    { id: 'abs_g_m3', label: 'Absolute humidity, g of water per m³ of air', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'enthalpy_j_kg', label: 'Enthalpy per kg of dry air', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg' },
    { id: 'density_kg_m3', label: 'Moist-air density', group: 'density', unit: 'kg_m3' },
    { id: 'comfort', label: 'How it feels (dew point)', type: 'text' },
  ],
  example: {
    inputs: { mode: 'dew', temp_c: [20, 'C'], rh: [50, 'pct'], pressure_mode: 'altitude', altitude_m: [0, 'm'] },
    results: { dew_point_c: '9.27 °C', wet_bulb_c: '13.78 °C', w_g_kg: '7.26 g/kg' },
  },
};

/** Comfort by dew point, after the US National Weather Service: 55 °F and below dry and comfortable, 55–65 °F sticky, above 65 °F oppressive. */
function comfort(td) {
  if (td <= 12.78) return 'Dry and comfortable (dew point 55 °F / 12.8 °C or lower)';
  if (td <= 18.33) return 'Sticky and muggy (dew point 55–65 °F / 12.8–18.3 °C)';
  return 'Oppressive (dew point above 65 °F / 18.3 °C)';
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['dew', 'rh'], 'mode', 'Find');
  assertOneOf(x.pressure_mode, ['altitude', 'pressure'], 'pressure_mode', 'Air pressure from');
  const t = assertRange(x.temp_c, -60, 100, 'temp_c', 'Air temperature');
  const p = x.pressure_mode === 'altitude'
    ? standardPressure(assertRange(x.altitude_m, -400, 8000, 'altitude_m', 'Altitude'))
    : assertPositive(x.pressure_pa, 'pressure_pa', 'Barometric pressure');
  let rh;
  if (x.mode === 'dew') rh = assertRange(x.rh, 0.001, 1, 'rh', 'Relative humidity');
  else {
    const td = assertRange(x.dew_c, -80, 100, 'dew_c', 'Dew point');
    if (td > t + 1e-9) throw new Error('Dew point: it cannot be above the air temperature (the air would be more than saturated).');
    rh = saturationPressure(td) / saturationPressure(t);
  }
  const s = stateFromRh(t, rh, p);
  const warnings = [];
  if (t - s.dewPoint < 2.5) warnings.push('The air is within 2.5 °C of its dew point: fog, condensation on cold surfaces and mould risk are likely.');
  return {
    outputs: {
      dew_point_c: s.dewPoint,
      rh_out: rh,
      spread_c: t - s.dewPoint,
      wet_bulb_c: s.wetBulb,
      w_g_kg: s.w * 1000,
      abs_g_m3: s.absoluteHumidity * 1000,
      enthalpy_j_kg: s.enthalpy * 1000,
      density_kg_m3: s.density,
      comfort: comfort(s.dewPoint),
    },
    warnings,
  };
}
