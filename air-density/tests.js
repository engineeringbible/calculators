/**
 * air-density/tests.js — checks against the standard atmosphere and ASHRAE moist-air relations.
 * Run: node run-tests.js air-density
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Dry air at 15 °C and sea level is 1.2250 kg/m³ (ISA), ratio 100 %, density altitude 0',
    source: 'ISO 2533 Standard Atmosphere: ρ0 = 1.225 kg/m³ at 15 °C and 101.325 kPa',
    run: () => {
      const { outputs } = calculate({ temp_c: 15, rh: 0, altitude_m: 0 });
      assertClose(outputs.density_kg_m3, 1.225, { abs: 1e-4 }, 'ρ');
      assertClose(outputs.ratio, 1, { abs: 1e-4 }, 'ratio');
      assertClose(outputs.density_altitude_m, 0, { abs: 1 }, 'DA');
    },
  },
  {
    name: '30 °C at 60 % and sea level: 1.153 kg/m³ humid against 1.164 kg/m³ dry; humid air is lighter',
    source: 'ASHRAE Fundamentals Ch. 1 eq. (26): v = 287.042 T (1 + 1.607858 W)/p, ρ = (1 + W)/v',
    run: () => {
      const { outputs } = calculate({ temp_c: 30, rh: 0.6, altitude_m: 0 });
      assertClose(outputs.density_kg_m3, 1.1534, { abs: 1e-4 }, 'humid');
      assertClose(outputs.dry_density_kg_m3, 1.1644, { abs: 1e-4 }, 'dry');
      assertEqual(outputs.density_kg_m3 < outputs.dry_density_kg_m3, true, 'lighter');
    },
  },
  {
    name: 'Dry air agrees with the ideal gas law ρ = p / (287.05 T) at 0 °C and 100 kPa: 1.2754 kg/m³',
    source: 'Ideal gas, R_dry air = 287.05 J/(kg·K)',
    run: () => {
      assertClose(calculate({ temp_c: 0, rh: 0, pressure_mode: 'pressure', pressure_pa: 100000 }).outputs.density_kg_m3, 100000 / (287.042 * 273.15), { rel: 1e-9 }, 'ρ');
    },
  },
  {
    name: 'Denver, 1 609 m: standard pressure 83.4 kPa; dry 15 °C air at that pressure is 1.008 kg/m³, density altitude equals the altitude when the air is standard',
    source: 'ASHRAE eq. (3); ISA troposphere ρ/ρ0 = (1 − 2.25577e−5 h)^4.2559',
    run: () => {
      const d = calculate({ temp_c: 15 - 0.0065 * 1609, rh: 0, altitude_m: 1609 }).outputs;
      assertClose(d.pressure_out_pa, 83436, { abs: 30 }, 'p');
      assertClose(d.density_altitude_m, 1609, { abs: 5 }, 'DA = h in ISA air');
      assertClose(calculate({ temp_c: 15, rh: 0, altitude_m: 1609 }).outputs.density_kg_m3, 1.0089, { abs: 5e-4 }, 'warm Denver');
    },
  },
  {
    name: 'Out-of-range humidity and altitude are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ rh: 1.2 }), 'Relative humidity');
      assertThrows(() => calculate({ altitude_m: 20000 }), 'Altitude');
    },
  },
];
