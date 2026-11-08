/**
 * air-density/calc.js — density of dry or humid air from temperature, humidity and pressure or altitude, with the
 * specific volume, the ratio to the standard sea-level density and the density altitude.
 *
 * ρ = (1 + W) / v,  v = 287.042 T (1 + 1.607858 W) / p  (ASHRAE Fundamentals Ch. 1 eq. 26, via shared/psychro.js).
 * Density altitude from the ISA troposphere: ρ/ρ0 = (1 − 2.25577e−5 h)^4.2559.
 * Schema units: SI — °C, Pa, m, kg/m³.
 */
import { withDefaults, assertRange, assertOneOf, assertPositive } from '../shared/validate.js';
import { stateFromRh, standardPressure } from '../shared/psychro.js';

const RHO_ISA = 1.225;

export const schema = {
  id: 'air-density',
  name: 'Air density calculator',
  category: 'hvac',
  summary: 'Density of dry or humid air from temperature, humidity and altitude or pressure, with specific volume, the ratio to standard air and the density altitude.',
  related: ['dew-point', 'duct-size', 'air-changes', 'ideal-gas-law'],
  assumptions: [
    'Moist air is an ideal-gas mixture of dry air and water vapour (ASHRAE Fundamentals Chapter 1); the error is below 0.5 % at normal pressures.',
    'Altitude converts to pressure with the standard atmosphere; on a given day the station pressure can differ by a few percent, so enter it directly when known.',
    'The density altitude is the height in the ISA standard atmosphere that has the same density; it is used for engine, fan and aircraft performance.',
  ],
  notes: [
    'Verification 2026-11-07: dry air at 15 °C and 101.325 kPa is 1.2250 kg/m³, the ISA sea-level value; 30 °C at 60 % is 1.153 kg/m³.',
  ],
  sources: [
    'ASHRAE Handbook — Fundamentals (SI), Chapter 1 Psychrometrics, eqs. (3), (20) and (26)',
    'ISO 2533:1975 Standard Atmosphere (sea-level density 1.225 kg/m³, troposphere lapse rate 6.5 K/km)',
  ],
  inputs: [
    { id: 'temp_c', label: 'Air temperature', group: 'temperature', unit: 'C', default: 30, min: -60, max: 100 },
    { id: 'rh', label: 'Relative humidity', group: 'ratio', unit: 'frac', display: 'pct', default: 0.6, min: 0, max: 1 },
    { id: 'pressure_mode', label: 'Air pressure from', type: 'select', default: 'altitude', options: [{ value: 'altitude', label: 'Altitude (standard atmosphere)' }, { value: 'pressure', label: 'Barometric pressure' }] },
    { id: 'altitude_m', label: 'Altitude', group: 'length', unit: 'm', default: 0, min: -400, max: 11000, visibleWhen: { pressure_mode: 'altitude' } },
    { id: 'pressure_pa', label: 'Barometric pressure (station)', group: 'pressure', unit: 'Pa', display: 'kPa', default: 101325, min: 20000, max: 120000, visibleWhen: { pressure_mode: 'pressure' } },
  ],
  outputs: [
    { id: 'density_kg_m3', label: 'Air density', group: 'density', unit: 'kg_m3' },
    { id: 'dry_density_kg_m3', label: 'Density of dry air at the same temperature and pressure', group: 'density', unit: 'kg_m3' },
    { id: 'volume_m3_kg', label: 'Specific volume (per kg of dry air), m³/kg', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'ratio', label: 'Ratio to standard air (1.225 kg/m³)', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'density_altitude_m', label: 'Density altitude', group: 'length', unit: 'm', display: 'ft' },
    { id: 'pressure_out_pa', label: 'Pressure used', group: 'pressure', unit: 'Pa', display: 'kPa' },
  ],
  example: {
    inputs: { temp_c: [30, 'C'], rh: [60, 'pct'], pressure_mode: 'altitude', altitude_m: [0, 'm'] },
    results: { density_kg_m3: '1.153 kg/m³', dry_density_kg_m3: '1.164 kg/m³', ratio: '94.2 %' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.pressure_mode, ['altitude', 'pressure'], 'pressure_mode', 'Air pressure from');
  const t = assertRange(x.temp_c, -60, 100, 'temp_c', 'Air temperature');
  const rh = assertRange(x.rh, 0, 1, 'rh', 'Relative humidity');
  const p = x.pressure_mode === 'altitude'
    ? standardPressure(assertRange(x.altitude_m, -400, 11000, 'altitude_m', 'Altitude'))
    : assertPositive(x.pressure_pa, 'pressure_pa', 'Barometric pressure');
  const s = stateFromRh(t, rh, p);
  const dry = stateFromRh(t, 0, p).density;
  const ratio = s.density / RHO_ISA;
  return {
    outputs: {
      density_kg_m3: s.density,
      dry_density_kg_m3: dry,
      volume_m3_kg: s.volume,
      ratio,
      density_altitude_m: (1 - ratio ** (1 / 4.2559)) / 2.25577e-5,
      pressure_out_pa: p,
    },
    warnings: [],
  };
}
