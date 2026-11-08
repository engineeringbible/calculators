/**
 * mach-number/tests.js — checks against the ICAO standard atmosphere speeds of sound and a = √(γ R T).
 * Run: node run-tests.js mach-number
 */
import { calculate, regime } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const MPH = 0.44704;
const KN = 1852 / 3600;
const FT = 0.3048;

export const tests = [
  {
    name: 'Sea-level ISA, 15 °C: speed of sound 340.294 m/s, 761.2 mph, 661.48 kn',
    source: 'ICAO Doc 7488/3, a0 = 340.294 m/s',
    run: () => {
      const o = calculate({ temp_source: 'temp', temp_c: 15 }).outputs;
      assertClose(o.sound_m_s, 340.294, { abs: 0.001 }, 'm/s');
      assertClose(o.sound_m_s / MPH, 761.22, { abs: 0.01 }, 'mph');
      assertClose(o.sound_kn_m_s / KN, 661.48, { abs: 0.01 }, 'kn');
    },
  },
  {
    name: 'Tropopause and above (−56.5 °C): 295.07 m/s; Mach 2 at 15 km is 590.1 m/s (1 320 mph)',
    source: 'ICAO Doc 7488/3 table, a = 295.069 m/s from 11 to 20 km',
    run: () => {
      const o = calculate({ mode: 'speed', mach_in: 2, temp_source: 'altitude', altitude_m: 15000 }).outputs;
      assertClose(o.sound_m_s, 295.069, { abs: 0.001 }, 'a');
      assertClose(o.speed_out_m_s / MPH, 1320.1, { abs: 0.1 }, 'Mach 2');
      assertEqual(o.regime, 'Supersonic (1.2 to 5)', 'regime');
    },
  },
  {
    name: '500 mph at 35 000 ft (ISA −54.34 °C): a = 663.3 mph, Mach 0.754, total temperature −29.5 °C',
    source: 'Hand calculation, a = √(1.4 × 287.05 × 218.81 K), T_t = T (1 + 0.2 M²)',
    run: () => {
      const o = calculate({ speed_m_s: 500 * MPH, temp_source: 'altitude', altitude_m: 35000 * FT }).outputs;
      assertClose(o.temp_used_c, -54.342, { abs: 1e-3 }, 'ISA temperature');
      assertClose(o.mach, 0.75377, { abs: 1e-5 }, 'Mach');
      assertClose(o.total_temp_c, 218.808 * (1 + 0.2 * 0.75377 ** 2) - 273.15, { abs: 1e-3 }, 'total temperature');
    },
  },
  {
    name: 'Helium at 0 °C (γ = 5/3, R = 2 077 J/(kg·K)): about 972 m/s, nearly three times air',
    source: 'a = √(γ R T); handbook speed of sound in helium at 0 °C about 970 m/s',
    run: () => {
      const o = calculate({ temp_source: 'temp', temp_c: 0, gas: 'custom', gamma: 5 / 3, r_gas: 2077 }).outputs;
      assertClose(o.sound_m_s, Math.sqrt((5 / 3) * 2077 * 273.15), { rel: 1e-12 }, 'formula');
      assertClose(o.sound_m_s, 972, { abs: 3 }, 'handbook');
    },
  },
  {
    name: 'Regime bands: 0.5 subsonic, 1.0 transonic, 3 supersonic, 7 hypersonic',
    source: 'Anderson, Fundamentals of Aerodynamics, Section 1.10',
    run: () => {
      assertEqual(regime(0.5), 'Subsonic (M < 0.8)', '0.5');
      assertEqual(regime(1), 'Transonic (0.8 to 1.2)', '1');
      assertEqual(regime(3), 'Supersonic (1.2 to 5)', '3');
      assertEqual(regime(7), 'Hypersonic (M > 5)', '7');
    },
  },
  {
    name: 'A temperature below −150 °C, an altitude above 20 km and γ of 2 are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ temp_source: 'temp', temp_c: -200 }), 'Air temperature');
      assertThrows(() => calculate({ altitude_m: 25000 }), 'Altitude');
      assertThrows(() => calculate({ gas: 'custom', gamma: 2 }), 'Ratio of specific heats');
    },
  },
];
