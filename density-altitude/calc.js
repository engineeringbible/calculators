/**
 * density-altitude/calc.js — pressure altitude from field elevation and altimeter setting, and density altitude from the
 * station pressure and the outside air temperature, optionally with humidity from the dew point (virtual temperature).
 *
 * ISA troposphere (ICAO Doc 7488): T = T0 − L h, p = p0 (T/T0)^n, n = g0 / (L R) = 5.25588, ρ0 = 1.225 kg/m³.
 * Station pressure from the altimeter setting QNH: p = QNH (1 − L h_field / T0)^n.  Pressure altitude: p_isa(PA) = p.
 * Density ρ = p / (R T_v), T_v = T / (1 − (e/p)(1 − ε)), e = saturation pressure at the dew point.
 * Density altitude: ρ_isa(DA) = ρ, DA = (T0/L)(1 − (ρ/ρ0)^(1/(n − 1))).  Schema units: SI — m, Pa, °C, kg/m³.
 */
import { withDefaults, assertOneOf, assertRange } from '../shared/validate.js';
import { saturationPressure } from '../shared/psychro.js';

const T0 = 288.15;
const P0 = 101325;
const L = 0.0065;
const R = 287.05287;
const G0 = 9.80665;
const N = G0 / (L * R);
const RHO0 = P0 / (R * T0);
const EPS = 0.621945;
const FT = 0.3048;
const INHG = 3386.389;

export const schema = {
  id: 'density-altitude',
  name: 'Density altitude calculator',
  category: 'automotive',
  summary: 'Pressure altitude from field elevation and altimeter setting, and density altitude from temperature and dew point, with the ISA formula and the rule of thumb.',
  related: ['true-airspeed', 'mach-number', 'thrust-weight', 'air-density'],
  assumptions: [
    'The atmosphere below the tropopause (36 089 ft, 11 km) follows the ICAO standard atmosphere: 15 °C and 1 013.25 hPa (29.92 inHg) at sea level, a lapse rate of 1.98 °C per 1 000 ft, dry-air gas constant 287.053 J/(kg·K).',
    'The altimeter setting is QNH: the station pressure reduced to sea level through the standard atmosphere, so the station pressure is recovered with the same relation; the small instrument-height correction of US weather stations is ignored.',
    'Pressure altitude is the standard-atmosphere height with the station pressure; density altitude is the standard-atmosphere height with the actual air density.',
    'Humidity lowers the density through the virtual temperature T_v = T / (1 − (e/p)(1 − 0.622)), with e the saturation vapour pressure at the dew point (Hyland–Wexler, as in ASHRAE).',
    'The rule of thumb DA ≈ PA + 120 ft × (OAT − ISA temperature) is shown for comparison; it ignores humidity and drifts from the exact value at high altitude and large temperature deviations.',
  ],
  notes: [
    'Verification 2026-11-08: field 5 000 ft, altimeter 30.10 inHg, OAT 30 °C: station 25.04 inHg, pressure altitude 4 841 ft, ISA 5.4 °C, density altitude 7 608 ft dry; with a 15 °C dew point 7 855 ft; rule of thumb 7 792 ft. ICAO 10 000 ft: 696.8 hPa, −4.8 °C, σ 0.7385 reproduced. Checked by hand.',
  ],
  sources: [
    'ICAO Doc 7488/3, Manual of the ICAO Standard Atmosphere (extended to 80 km), 3rd ed. 1993 (troposphere relations and tables: 10 000 ft = 696.82 hPa, −4.81 °C, σ = 0.73848)',
    'FAA-P-8740-2, Density Altitude (FAA Aviation Safety Program, 2008): pressure altitude with the altimeter at 29.92 inHg; density altitude is pressure altitude corrected for nonstandard temperature',
    'J.M. Wallace and P.V. Hobbs, Atmospheric Science: An Introductory Survey, 2nd ed., Academic Press 2006, Section 3.1 (virtual temperature)',
  ],
  inputs: [
    { id: 'elevation_m', label: 'Field elevation', group: 'length', unit: 'm', display: 'ft', default: 5000 * FT, min: -500, max: 6000 },
    { id: 'altimeter_pa', label: 'Altimeter setting (QNH)', group: 'pressure', unit: 'Pa', display: 'inHg', default: 30.1 * INHG, min: 85000, max: 110000 },
    { id: 'oat_c', label: 'Outside air temperature', group: 'temperature', unit: 'C', default: 30, min: -60, max: 60 },
    { id: 'humidity', label: 'Humidity', type: 'select', default: 'dry', options: [{ value: 'dry', label: 'Dry air (the usual pilot method)' }, { value: 'dew', label: 'Include humidity from the dew point' }] },
    { id: 'dewpoint_c', label: 'Dew point', group: 'temperature', unit: 'C', default: 15, min: -80, max: 40, visibleWhen: { humidity: 'dew' } },
  ],
  outputs: [
    { id: 'pressure_alt_m', label: 'Pressure altitude', group: 'length', unit: 'm', display: 'ft', decimals: 0 },
    { id: 'density_alt_m', label: 'Density altitude', group: 'length', unit: 'm', display: 'ft', decimals: 0 },
    { id: 'rule_alt_m', label: 'Density altitude by the 120 ft/°C rule of thumb', group: 'length', unit: 'm', display: 'ft', decimals: 0 },
    { id: 'station_pa', label: 'Station pressure', group: 'pressure', unit: 'Pa', display: 'inHg', decimals: 2 },
    { id: 'isa_temp_c', label: 'ISA temperature at the pressure altitude', group: 'temperature', unit: 'C', decimals: 1 },
    { id: 'density_kg_m3', label: 'Air density', group: 'density', unit: 'kg_m3', decimals: 4 },
    { id: 'sigma', label: 'Density ratio σ = ρ / ρ0', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'virtual_c', label: 'Virtual temperature', group: 'temperature', unit: 'C', decimals: 1 },
  ],
  example: {
    inputs: { elevation_m: [5000, 'ft'], altimeter_pa: [30.1, 'inHg'], oat_c: [30, 'C'], humidity: 'dry' },
    results: { station_pa: '25.04 inHg', pressure_alt_m: '4 841 ft', isa_temp_c: '5.4 °C', density_alt_m: '7 608 ft', rule_alt_m: '7 792 ft', density_kg_m3: '0.9746 kg/m³' },
  },
};

/** ISA temperature (K) and pressure (Pa) at a height h (m) in the troposphere. */
export const isaTropo = (h) => { const T = T0 - L * h; return { T, p: P0 * (T / T0) ** N }; };

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.humidity, ['dry', 'dew'], 'humidity', 'Humidity');
  const elev = assertRange(x.elevation_m, -500, 6000, 'elevation_m', 'Field elevation');
  const qnh = assertRange(x.altimeter_pa, 85000, 110000, 'altimeter_pa', 'Altimeter setting');
  const oat = assertRange(x.oat_c, -60, 60, 'oat_c', 'Outside air temperature');
  const p = qnh * (1 - (L * elev) / T0) ** N;
  const pa = (T0 / L) * (1 - (p / P0) ** (1 / N));
  const T = oat + 273.15;
  let e = 0;
  let tv = null;
  if (x.humidity === 'dew') {
    const dp = assertRange(x.dewpoint_c, -80, 40, 'dewpoint_c', 'Dew point');
    if (dp > oat + 1e-9) throw new Error('Dew point: it cannot be above the outside air temperature.');
    e = saturationPressure(dp);
  }
  const Tv = T / (1 - (e / p) * (1 - EPS));
  if (x.humidity === 'dew') tv = Tv - 273.15;
  const rho = p / (R * Tv);
  const sigma = rho / RHO0;
  const da = (T0 / L) * (1 - sigma ** (1 / (N - 1)));
  if (da > 11000) throw new Error('Outside air temperature: the density altitude is above the tropopause (36 089 ft), beyond the troposphere formula.');
  const isaC = T0 - L * pa - 273.15;
  const rule = pa + (120 * FT) * (oat - isaC);
  const warnings = [];
  if (da / FT > 8000) warnings.push('Density altitude above 8 000 ft: expect much longer take-off runs and weak climb in normally aspirated aircraft; check the POH performance charts.');
  return {
    outputs: {
      pressure_alt_m: pa, density_alt_m: da, rule_alt_m: rule, station_pa: p, isa_temp_c: isaC,
      density_kg_m3: rho, sigma, virtual_c: tv,
    },
    warnings,
  };
}
