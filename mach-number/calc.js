/**
 * mach-number/calc.js — speed of sound from the temperature, a = √(γ R T); Mach number from a speed and the temperature
 * or the altitude (ICAO standard atmosphere); or the speed for a given Mach number; with the total temperature.
 *
 * a = √(γ R T);  M = V / a;  V = M a;  T_total = T (1 + (γ − 1)/2 M²).  ISA: T = 288.15 − 0.0065 h to 11 km, then 216.65 K.
 * Schema units: SI — m/s, K or °C, m, J/(kg·K).
 */
import { withDefaults, assertOneOf, assertRange } from '../shared/validate.js';

const T0 = 288.15;
const L = 0.0065;
const R_AIR = 287.05287;
const GAMMA_AIR = 1.4;
const MPH = 0.44704;
const FT = 0.3048;

/** ISA temperature (K) at an altitude h (m), troposphere and lower stratosphere to 20 km (ICAO Doc 7488). */
export const isaTemperature = (h) => (h <= 11000 ? T0 - L * h : 216.65);

/** Flow regime by Mach number (Anderson, Fundamentals of Aerodynamics, Section 1.10). */
export function regime(m) {
  if (m < 0.8) return 'Subsonic (M < 0.8)';
  if (m <= 1.2) return 'Transonic (0.8 to 1.2)';
  if (m <= 5) return 'Supersonic (1.2 to 5)';
  return 'Hypersonic (M > 5)';
}

export const schema = {
  id: 'mach-number',
  name: 'Speed of sound and Mach number calculator',
  category: 'automotive',
  summary: 'Speed of sound from temperature or altitude, Mach number from a speed, and the speed for a given Mach, in mph, knots, km/h and m/s.',
  related: ['true-airspeed', 'density-altitude', 'drag-lift', 'rocket-equation'],
  assumptions: [
    'Air is an ideal gas with γ = 1.4 and R = 287.05 J/(kg·K) (ICAO Doc 7488), so the speed of sound depends on temperature only, not on pressure or altitude as such; at very high temperatures γ falls and the formula reads slightly high.',
    'The altitude option uses the ICAO standard atmosphere temperature: 15 °C at sea level, falling 6.5 °C per km to −56.5 °C at 11 km (36 089 ft), constant to 20 km; altitudes are geopotential, which differ from geometric height by less than 0.3 % below 20 km.',
    'Humidity raises the speed of sound slightly; the calculator uses dry air.',
    'Another gas can be entered with its own ratio of specific heats and specific gas constant, such as γ = 1.67 and R = 2 077 J/(kg·K) for helium.',
    'The regime bands (subsonic below 0.8, transonic 0.8 to 1.2, supersonic to 5, hypersonic beyond) are the usual aerodynamic classification.',
  ],
  notes: [
    'Verification 2026-11-08: ISA sea level (15 °C) a = 340.29 m/s = 761.2 mph = 661.5 kn; 500 mph at 35 000 ft (ISA −54.3 °C, a = 663.3 mph) is Mach 0.754; total temperature −29.5 °C. Checked by hand.',
  ],
  sources: [
    'ICAO Doc 7488/3, Manual of the ICAO Standard Atmosphere, 3rd ed. 1993 (a0 = 340.294 m/s at 288.15 K; γ = 1.4; R = 287.05287 J/(kg·K); temperature profile)',
    'J.D. Anderson, Fundamentals of Aerodynamics, 6th ed., McGraw-Hill 2017, Section 1.10 (flow regimes by Mach number) and Chapter 8 (speed of sound a = √(γ R T), total temperature)',
  ],
  inputs: [
    { id: 'mode', label: 'Calculate', type: 'select', default: 'mach', options: [{ value: 'mach', label: 'Mach number from a speed' }, { value: 'speed', label: 'Speed for a Mach number' }] },
    { id: 'speed_m_s', label: 'Speed', group: 'speed', unit: 'm_s', display: 'mph', default: 500 * MPH, min: 0, max: 20000, visibleWhen: { mode: 'mach' } },
    { id: 'mach_in', label: 'Mach number', group: 'dimensionless', unit: 'none', default: 2, min: 0, max: 30, visibleWhen: { mode: 'speed' } },
    { id: 'temp_source', label: 'Air temperature from', type: 'select', default: 'altitude', options: [{ value: 'altitude', label: 'Altitude (standard atmosphere)' }, { value: 'temp', label: 'Measured temperature' }] },
    { id: 'altitude_m', label: 'Altitude', group: 'length', unit: 'm', display: 'ft', default: 35000 * FT, min: -600, max: 20000, visibleWhen: { temp_source: 'altitude' } },
    { id: 'temp_c', label: 'Air temperature', group: 'temperature', unit: 'C', default: 15, min: -150, max: 2000, visibleWhen: { temp_source: 'temp' } },
    { id: 'gas', label: 'Gas', type: 'select', default: 'air', options: [{ value: 'air', label: 'Dry air (γ = 1.4, R = 287.05)' }, { value: 'custom', label: 'Other gas' }] },
    { id: 'gamma', label: 'Ratio of specific heats γ', group: 'dimensionless', unit: 'none', default: 1.4, min: 1.01, max: 1.7, visibleWhen: { gas: 'custom' } },
    { id: 'r_gas', label: 'Specific gas constant R', group: 'specific_heat', unit: 'J_kgK', default: 287.05287, min: 50, max: 5000, visibleWhen: { gas: 'custom' } },
  ],
  outputs: [
    { id: 'sound_m_s', label: 'Speed of sound', group: 'speed', unit: 'm_s', display: 'mph', decimals: 1 },
    { id: 'sound_kn_m_s', label: 'Speed of sound in knots', group: 'speed', unit: 'm_s', display: 'kn', decimals: 1 },
    { id: 'mach', label: 'Mach number', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'speed_out_m_s', label: 'Speed', group: 'speed', unit: 'm_s', display: 'mph', decimals: 1 },
    { id: 'temp_used_c', label: 'Static air temperature used', group: 'temperature', unit: 'C', decimals: 2 },
    { id: 'total_temp_c', label: 'Total (stagnation) temperature', group: 'temperature', unit: 'C', decimals: 1 },
    { id: 'regime', label: 'Flow regime', type: 'text' },
  ],
  example: {
    inputs: { mode: 'mach', speed_m_s: [500, 'mph'], temp_source: 'altitude', altitude_m: [35000, 'ft'], gas: 'air' },
    results: { temp_used_c: '−54.34 °C', sound_m_s: '663.3 mph', mach: '0.754', total_temp_c: '−29.5 °C' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['mach', 'speed'], 'mode', 'Calculate');
  assertOneOf(x.temp_source, ['altitude', 'temp'], 'temp_source', 'Air temperature from');
  assertOneOf(x.gas, ['air', 'custom'], 'gas', 'Gas');
  const gamma = x.gas === 'air' ? GAMMA_AIR : assertRange(x.gamma, 1.01, 1.7, 'gamma', 'Ratio of specific heats');
  const r = x.gas === 'air' ? R_AIR : assertRange(x.r_gas, 50, 5000, 'r_gas', 'Specific gas constant');
  const T = x.temp_source === 'altitude'
    ? isaTemperature(assertRange(x.altitude_m, -600, 20000, 'altitude_m', 'Altitude'))
    : assertRange(x.temp_c, -150, 2000, 'temp_c', 'Air temperature') + 273.15;
  const a = Math.sqrt(gamma * r * T);
  let m;
  let v;
  if (x.mode === 'mach') {
    v = assertRange(x.speed_m_s, 0, 20000, 'speed_m_s', 'Speed');
    m = v / a;
  } else {
    m = assertRange(x.mach_in, 0, 30, 'mach_in', 'Mach number');
    v = m * a;
  }
  const warnings = [];
  if (m > 5 && x.gas === 'air') warnings.push('Above Mach 5 the air heats so much that γ is no longer 1.4; the total temperature shown is an ideal-gas value and too high.');
  return {
    outputs: {
      sound_m_s: a, sound_kn_m_s: a, mach: m, speed_out_m_s: v, temp_used_c: T - 273.15,
      total_temp_c: T * (1 + ((gamma - 1) / 2) * m * m) - 273.15, regime: regime(m),
    },
    warnings,
  };
}
