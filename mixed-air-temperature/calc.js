/**
 * mixed-air-temperature/calc.js — adiabatic mixing of outdoor and return air: mixed dry bulb, humidity ratio,
 * enthalpy, relative humidity, wet bulb and dew point by mass balance of dry air, water and energy; and the
 * outdoor-air fraction from measured temperatures.
 *
 * ṁ_i = Q_i / v_i (per kg dry air);  W_m = Σ ṁ_i W_i / Σ ṁ_i;  h_m = Σ ṁ_i h_i / Σ ṁ_i;  t_m = (h_m − 2501 W_m)/(1.006 + 1.86 W_m)
 * (ASHRAE Fundamentals Ch. 1, eqs. 30, 46–48).  OA fraction from temperatures: x = (t_RA − t_MA)/(t_RA − t_OA).
 * Schema units: SI — m³/s, °C, m, g/kg, J/kg.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';
import {
  saturationPressure, humidityRatio, vapourPressureFromW, specificVolume, enthalpy, wetBulb, dewPointFromVapourPressure, standardPressure,
} from '../shared/psychro.js';

/** Humidity ratio (kg/kg) from dry bulb and thermodynamic wet bulb (ASHRAE Fundamentals Ch. 1, eqs. 33 and 35). */
export function wFromWetBulb(t, tw, p) {
  const ws = humidityRatio(saturationPressure(tw), p);
  return tw >= 0
    ? ((2501 - 2.326 * tw) * ws - 1.006 * (t - tw)) / (2501 + 1.86 * t - 4.186 * tw)
    : ((2830 - 0.24 * tw) * ws - 1.006 * (t - tw)) / (2830 + 1.86 * t - 2.1 * tw);
}

/** Moist-air enthalpy on the IP basis (0 °F dry air), Btu/lb dry air: 0.240 t + W (1061 + 0.444 t), t in °F. */
export const enthalpyIP = (tC, w) => { const f = tC * 1.8 + 32; return 0.24 * f + w * (1061 + 0.444 * f); };

function stream(t, hum, rh, tw, p, name) {
  let w;
  if (hum === 'rh') {
    const pw = rh * saturationPressure(t);
    if (pw >= p) throw new Error(`${name} relative humidity: the vapour pressure reaches the total pressure.`);
    w = humidityRatio(pw, p);
  } else {
    if (tw > t + 1e-9) throw new Error(`${name} wet bulb: it cannot be above the dry bulb temperature.`);
    w = wFromWetBulb(t, tw, p);
    if (w < 0) throw new Error(`${name} wet bulb: too low for this dry bulb; the air would have negative moisture.`);
  }
  return { t, w, v: specificVolume(t, w, p), h: enthalpy(t, w) };
}

export const schema = {
  id: 'mixed-air-temperature',
  name: 'Mixed air temperature calculator (outdoor and return air)',
  category: 'hvac',
  summary: 'Mixed air dry bulb, humidity ratio, enthalpy, RH and wet bulb of outdoor and return air streams by psychrometric mass balance, and the outdoor-air fraction.',
  related: ['latent-sensible-heat', 'dew-point', 'air-density', 'air-changes'],
  assumptions: [
    'Mixing is adiabatic and at constant pressure: dry air, water and energy are conserved, and the mixed state lies on the straight line between the two states on a psychrometric chart (ASHRAE Fundamentals Ch. 1).',
    'Each airflow is the actual volume at its own temperature and humidity; it is turned into a mass of dry air with the moist-air specific volume. The quick volume-weighted average is shown for comparison and is usually within a few tenths of a degree.',
    'Moist-air properties follow ASHRAE Fundamentals Ch. 1 (Hyland–Wexler saturation pressure, ideal-gas mixture); pressure is the standard atmosphere at the altitude entered.',
    'The outdoor-air fraction from measured temperatures assumes well-mixed air at the sensor and becomes unreliable when the outdoor and return temperatures are close: with 10 °F (5.6 K) between them, a 1 °F sensor error shifts the fraction by 10 points.',
    'If the mixed state is beyond saturation, the excess moisture appears as fog; the dry bulb is then slightly higher than calculated.',
  ],
  notes: [
    'Verification 2026-11-08: ASHRAE Fundamentals Ch. 1 mixing example, 2 m³/s at 4 °C dry bulb and 2 °C wet bulb with 6.25 m³/s at 25 °C and 50 %: mixed 19.6 °C dry bulb (ASHRAE reads 19.5 °C from the chart), 14.6 °C wet bulb as printed, W = 8.25 g/kg, h = 40.7 kJ/kg, 25.8 % outdoor air by mass. Checked by hand.',
  ],
  sources: [
    'ASHRAE Handbook — Fundamentals (2017), Chapter 1 Psychrometrics: eqs. 30, 33, 35 and adiabatic mixing of two moist airstreams (eqs. 46–48) with its worked example',
    'Y. A. Çengel & M. A. Boles, Thermodynamics: An Engineering Approach, Ch. 14 Gas–vapor mixtures and air-conditioning (adiabatic mixing of airstreams)',
  ],
  inputs: [
    { id: 'mode', label: 'Calculate', type: 'select', default: 'flows', options: [{ value: 'flows', label: 'Mixed air from two airflows' }, { value: 'temps', label: 'Outdoor-air fraction from measured temperatures' }] },
    { id: 'altitude_m', label: 'Altitude (sets the air pressure)', group: 'length', unit: 'm', display: 'ft', default: 0, min: -400, max: 6000 },
    { id: 'oa_flow_m3s', label: 'Outdoor airflow', group: 'volume_flow', unit: 'm3_s', display: 'cfm', default: 2000 * 0.028316846592 / 60, min: 0, max: 1000, visibleWhen: { mode: 'flows' } },
    { id: 'oa_t_c', label: 'Outdoor air dry bulb', group: 'temperature', unit: 'C', display: 'F', default: 35, min: -40, max: 60 },
    { id: 'oa_hum', label: 'Outdoor air humidity given as', type: 'select', default: 'wb', options: [{ value: 'rh', label: 'Relative humidity' }, { value: 'wb', label: 'Wet bulb temperature' }], visibleWhen: { mode: 'flows' } },
    { id: 'oa_rh', label: 'Outdoor air relative humidity', group: 'ratio', unit: 'frac', display: 'pct', default: 0.4, min: 0, max: 1, visibleWhen: { mode: 'flows', oa_hum: 'rh' } },
    { id: 'oa_wb_c', label: 'Outdoor air wet bulb', group: 'temperature', unit: 'C', display: 'F', default: 23.888888888889, min: -40, max: 60, visibleWhen: { mode: 'flows', oa_hum: 'wb' } },
    { id: 'ra_flow_m3s', label: 'Return airflow', group: 'volume_flow', unit: 'm3_s', display: 'cfm', default: 8000 * 0.028316846592 / 60, min: 0, max: 1000, visibleWhen: { mode: 'flows' } },
    { id: 'ra_t_c', label: 'Return air dry bulb', group: 'temperature', unit: 'C', display: 'F', default: 23.888888888889, min: -40, max: 60 },
    { id: 'ra_hum', label: 'Return air humidity given as', type: 'select', default: 'rh', options: [{ value: 'rh', label: 'Relative humidity' }, { value: 'wb', label: 'Wet bulb temperature' }], visibleWhen: { mode: 'flows' } },
    { id: 'ra_rh', label: 'Return air relative humidity', group: 'ratio', unit: 'frac', display: 'pct', default: 0.5, min: 0, max: 1, visibleWhen: { mode: 'flows', ra_hum: 'rh' } },
    { id: 'ra_wb_c', label: 'Return air wet bulb', group: 'temperature', unit: 'C', display: 'F', default: 17, min: -40, max: 60, visibleWhen: { mode: 'flows', ra_hum: 'wb' } },
    { id: 'ma_t_c', label: 'Measured mixed air dry bulb', group: 'temperature', unit: 'C', display: 'F', default: 26.111111111111, min: -40, max: 60, visibleWhen: { mode: 'temps' } },
    { id: 'total_flow_m3s', label: 'Total supply airflow (optional, for the outdoor airflow)', group: 'volume_flow', unit: 'm3_s', display: 'cfm', default: 10000 * 0.028316846592 / 60, min: 0, max: 1000, visibleWhen: { mode: 'temps' } },
  ],
  outputs: [
    { id: 't_mix_c', label: 'Mixed air dry bulb', group: 'temperature', unit: 'C', display: 'F', visibleWhen: { mode: 'flows' } },
    { id: 'w_mix', label: 'Mixed air humidity ratio', group: 'humidity_ratio', unit: 'g_kg', display: 'gr_lb', visibleWhen: { mode: 'flows' } },
    { id: 'rh_mix', label: 'Mixed air relative humidity', group: 'ratio', unit: 'frac', display: 'pct', visibleWhen: { mode: 'flows' } },
    { id: 'wb_mix_c', label: 'Mixed air wet bulb', group: 'temperature', unit: 'C', display: 'F', visibleWhen: { mode: 'flows' } },
    { id: 'dp_mix_c', label: 'Mixed air dew point', group: 'temperature', unit: 'C', display: 'F', visibleWhen: { mode: 'flows' } },
    { id: 'h_mix', label: 'Mixed air enthalpy (SI basis, 0 °C)', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg', visibleWhen: { mode: 'flows' } },
    { id: 'h_mix_ip', label: 'Mixed air enthalpy, Btu/lb dry air (IP chart basis, 0 °F)', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { mode: 'flows' } },
    { id: 'oa_frac_mass', label: 'Outdoor-air fraction by mass of dry air', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'oa_frac_vol', label: 'Outdoor-air fraction by volume', group: 'ratio', unit: 'frac', display: 'pct', visibleWhen: { mode: 'flows' } },
    { id: 't_simple_c', label: 'Volume-weighted average temperature (quick check)', group: 'temperature', unit: 'C', display: 'F', visibleWhen: { mode: 'flows' } },
    { id: 'total_out_m3s', label: 'Mixed airflow', group: 'volume_flow', unit: 'm3_s', display: 'cfm', visibleWhen: { mode: 'flows' } },
    { id: 'oa_flow_out_m3s', label: 'Outdoor airflow in the supply', group: 'volume_flow', unit: 'm3_s', display: 'cfm', visibleWhen: { mode: 'temps' } },
  ],
  example: {
    inputs: { mode: 'flows', altitude_m: [0, 'm'], oa_flow_m3s: [2, 'm3_s'], oa_t_c: [4, 'C'], oa_hum: 'wb', oa_wb_c: [2, 'C'], ra_flow_m3s: [6.25, 'm3_s'], ra_t_c: [25, 'C'], ra_hum: 'rh', ra_rh: [50, 'pct'] },
    results: { t_mix_c: '19.6 °C', wb_mix_c: '14.6 °C', w_mix: '8.25 g/kg', h_mix: '40.7 kJ/kg', oa_frac_mass: '25.8 %' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['flows', 'temps'], 'mode', 'Calculate');
  assertOneOf(x.oa_hum, ['rh', 'wb'], 'oa_hum', 'Outdoor air humidity given as');
  assertOneOf(x.ra_hum, ['rh', 'wb'], 'ra_hum', 'Return air humidity given as');
  const p = standardPressure(assertRange(x.altitude_m, -400, 6000, 'altitude_m', 'Altitude'));
  const toa = assertRange(x.oa_t_c, -40, 60, 'oa_t_c', 'Outdoor air dry bulb');
  const tra = assertRange(x.ra_t_c, -40, 60, 'ra_t_c', 'Return air dry bulb');
  const out = {
    t_mix_c: null, w_mix: null, rh_mix: null, wb_mix_c: null, dp_mix_c: null, h_mix: null, h_mix_ip: null,
    oa_frac_mass: null, oa_frac_vol: null, t_simple_c: null, total_out_m3s: null, oa_flow_out_m3s: null,
  };
  const warnings = [];
  if (x.mode === 'temps') {
    const tma = assertRange(x.ma_t_c, -40, 60, 'ma_t_c', 'Measured mixed air dry bulb');
    const qt = assertRange(x.total_flow_m3s, 0, 1000, 'total_flow_m3s', 'Total supply airflow');
    if (Math.abs(tra - toa) < 0.5) throw new Error('Outdoor air dry bulb: it must differ from the return air temperature by at least 0.5 K to find the fraction.');
    const frac = (tra - tma) / (tra - toa);
    if (frac < -0.02 || frac > 1.02) throw new Error('Measured mixed air dry bulb: it must lie between the outdoor and return temperatures.');
    out.oa_frac_mass = Math.min(1, Math.max(0, frac));
    out.oa_flow_out_m3s = qt > 0 ? out.oa_frac_mass * qt : null;
    if (Math.abs(tra - toa) < 10 / 1.8) warnings.push('Outdoor and return temperatures differ by less than 10 °F (5.6 K): a small sensor error gives a large error in the fraction.');
    return { outputs: out, warnings };
  }
  const q1 = assertRange(x.oa_flow_m3s, 0, 1000, 'oa_flow_m3s', 'Outdoor airflow');
  const q2 = assertRange(x.ra_flow_m3s, 0, 1000, 'ra_flow_m3s', 'Return airflow');
  if (q1 + q2 <= 0) throw new Error('Outdoor airflow: enter at least one airflow above zero.');
  const a = stream(toa, x.oa_hum, assertRange(x.oa_rh, 0, 1, 'oa_rh', 'Outdoor air relative humidity'), assertRange(x.oa_wb_c, -40, 60, 'oa_wb_c', 'Outdoor air wet bulb'), p, 'Outdoor air');
  const b = stream(tra, x.ra_hum, assertRange(x.ra_rh, 0, 1, 'ra_rh', 'Return air relative humidity'), assertRange(x.ra_wb_c, -40, 60, 'ra_wb_c', 'Return air wet bulb'), p, 'Return air');
  const m1 = q1 / a.v;
  const m2 = q2 / b.v;
  const m = m1 + m2;
  const w = (m1 * a.w + m2 * b.w) / m;
  const h = (m1 * a.h + m2 * b.h) / m;
  const t = (h - 2501 * w) / (1.006 + 1.86 * w);
  const pw = vapourPressureFromW(w, p);
  const rh = pw / saturationPressure(t);
  out.t_mix_c = t;
  out.w_mix = w * 1000;
  out.rh_mix = Math.min(rh, 1);
  out.wb_mix_c = rh >= 1 ? t : wetBulb(t, w, p);
  out.dp_mix_c = w > 0 ? Math.min(dewPointFromVapourPressure(pw), t) : null;
  out.h_mix = h * 1000;
  out.h_mix_ip = enthalpyIP(t, w);
  out.oa_frac_mass = m1 / m;
  out.oa_frac_vol = q1 / (q1 + q2);
  out.t_simple_c = (q1 * toa + q2 * tra) / (q1 + q2);
  out.total_out_m3s = m * specificVolume(t, w, p);
  if (rh > 1) warnings.push('The mixture is beyond saturation: the excess moisture forms fog in the mixing box. Preheat the outdoor air or reduce the outdoor-air fraction.');
  return { outputs: out, warnings };
}
