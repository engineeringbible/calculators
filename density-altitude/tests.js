/**
 * density-altitude/tests.js — checks against the ICAO standard atmosphere table, the NWS pressure-altitude formula and
 * the virtual temperature. Run: node run-tests.js density-altitude
 */
import { calculate } from './calc.js';
import { saturationPressure } from '../shared/psychro.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const INHG = 3386.389;

export const tests = [
  {
    name: 'Standard day at sea level (29.92 inHg, 15 °C): pressure and density altitude 0 ft, density 1.2250 kg/m³',
    source: 'ICAO Doc 7488/3, sea-level values (101 325 Pa, 288.15 K, 1.2250 kg/m³)',
    run: () => {
      const o = calculate({ elevation_m: 0, altimeter_pa: 101325, oat_c: 15 }).outputs;
      assertClose(o.pressure_alt_m, 0, { abs: 1e-6 }, 'PA');
      assertClose(o.density_alt_m, 0, { abs: 1e-3 }, 'DA');
      assertClose(o.density_kg_m3, 1.225, { abs: 5e-5 }, 'density');
    },
  },
  {
    name: 'ISA at 10 000 ft: station pressure 696.82 hPa (20.58 inHg), σ = 0.73848, density altitude 10 000 ft',
    source: 'ICAO Doc 7488/3 table at 3 048 m: 696.82 hPa, 268.34 K, σ 0.73848',
    run: () => {
      const o = calculate({ elevation_m: 3048, altimeter_pa: 101325, oat_c: -4.812 }).outputs;
      assertClose(o.station_pa / 100, 696.82, { abs: 0.01 }, 'pressure');
      assertClose(o.sigma, 0.73848, { abs: 1e-5 }, 'sigma');
      assertClose(o.density_alt_m / FT, 10000, { abs: 0.5 }, 'DA');
      assertClose(o.isa_temp_c, -4.81, { abs: 0.01 }, 'ISA temperature');
    },
  },
  {
    name: 'Field 1 165 ft, altimeter 30.10 inHg: pressure altitude 1 001 ft, matching the NWS formula (1 − (p/1013.25)^0.190284) × 145 366.45',
    source: 'NOAA/NWS pressure altitude formula; FAA rule (29.92 − 30.10) × 1 000 + 1 165 = 985 ft for comparison',
    run: () => {
      const o = calculate({ elevation_m: 1165 * FT, altimeter_pa: 30.1 * INHG, oat_c: 15 }).outputs;
      const nws = (1 - (o.station_pa / 100 / 1013.25) ** 0.190284) * 145366.45;
      assertClose(o.pressure_alt_m / FT, nws, { abs: 3 }, 'against NWS');
      assertClose(o.pressure_alt_m / FT, 1001.4, { abs: 0.5 }, 'PA');
      assertEqual(Math.abs(o.pressure_alt_m / FT - 985) < 20, true, 'near the rule of thumb');
    },
  },
  {
    name: 'Hot day: 5 000 ft, 30.10 inHg, 30 °C gives 7 608 ft; the 120 ft/°C rule gives 7 792 ft, within 3 %',
    source: 'Hand calculation from the ISA relations; rule of thumb DA ≈ PA + 120 (OAT − ISA)',
    run: () => {
      const o = calculate({ elevation_m: 5000 * FT, altimeter_pa: 30.1 * INHG, oat_c: 30 }).outputs;
      assertClose(o.pressure_alt_m / FT, 4840.8, { abs: 0.5 }, 'PA');
      assertClose(o.density_alt_m / FT, 7608.0, { abs: 0.5 }, 'DA');
      assertClose(o.rule_alt_m / FT, 4840.76 + 120 * (30 - o.isa_temp_c), { abs: 0.01 }, 'rule');
      assertEqual(Math.abs(o.rule_alt_m / o.density_alt_m - 1) < 0.03, true, 'rule within 3 %');
    },
  },
  {
    name: 'A 15 °C dew point raises the virtual temperature to 32.3 °C and the density altitude to 7 855 ft',
    source: 'T_v = T / (1 − (e/p)(1 − ε)), Wallace and Hobbs Section 3.1; e from Hyland–Wexler (shared psychrometrics)',
    run: () => {
      const o = calculate({ elevation_m: 5000 * FT, altimeter_pa: 30.1 * INHG, oat_c: 30, humidity: 'dew', dewpoint_c: 15 }).outputs;
      const p = o.station_pa;
      const tv = 303.15 / (1 - (saturationPressure(15) / p) * (1 - 0.621945));
      assertClose(o.virtual_c, tv - 273.15, { rel: 1e-12 }, 'Tv');
      assertClose(o.virtual_c, 32.32, { abs: 0.01 }, 'Tv value');
      assertClose(o.density_alt_m / FT, 7854.9, { abs: 0.5 }, 'DA');
    },
  },
  {
    name: 'A dew point above the temperature and an altimeter setting of 25 inHg are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ humidity: 'dew', oat_c: 10, dewpoint_c: 12 }), 'Dew point');
      assertThrows(() => calculate({ altimeter_pa: 25 * INHG }), 'Altimeter setting');
    },
  },
];
