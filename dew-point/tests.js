/**
 * dew-point/tests.js — checks against ASHRAE psychrometric values and the Magnus approximation.
 * Run: node run-tests.js dew-point
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '20 °C and 50 % at sea level: dew point 9.27 °C, wet bulb 13.78 °C, 7.26 g/kg, 8.64 g/m³, 38.55 kJ/kg, 1.199 kg/m³',
    source: 'ASHRAE Handbook — Fundamentals, Chapter 1 (psychrometric chart and eqs. 20, 26, 30, 33)',
    run: () => {
      const { outputs } = calculate({ mode: 'dew', temp_c: 20, rh: 0.5 });
      assertClose(outputs.dew_point_c, 9.27, { abs: 0.01 }, 'dew point');
      assertClose(outputs.wet_bulb_c, 13.78, { abs: 0.02 }, 'wet bulb');
      assertClose(outputs.w_g_kg, 7.26, { abs: 0.01 }, 'W');
      assertClose(outputs.abs_g_m3, 8.64, { abs: 0.01 }, 'absolute');
      assertClose(outputs.enthalpy_j_kg / 1000, 38.55, { abs: 0.02 }, 'h');
      assertClose(outputs.density_kg_m3, 1.199, { abs: 0.001 }, 'ρ');
    },
  },
  {
    name: 'Agrees with the Magnus formula (b = 17.625, c = 243.04 °C) within 0.1 °C at 30 °C / 70 % and 5 °C / 80 %',
    source: 'Alduchov and Eskridge (1996), J. Appl. Meteor. 35, 601–609',
    run: () => {
      const magnus = (t, rh) => { const g = Math.log(rh) + (17.625 * t) / (243.04 + t); return (243.04 * g) / (17.625 - g); };
      for (const [t, rh] of [[30, 0.7], [5, 0.8]]) assertClose(calculate({ temp_c: t, rh }).outputs.dew_point_c, magnus(t, rh), { abs: 0.1 }, `${t} °C`);
    },
  },
  {
    name: 'Reverse: 30 °C air with a 20 °C dew point is at 55.1 % relative humidity; a saturated sample has dew point = air temperature',
    source: 'RH = p_ws(t_d) / p_ws(t), ASHRAE eq. (12) with (5)–(6)',
    run: () => {
      assertClose(calculate({ mode: 'rh', temp_c: 30, dew_c: 20 }).outputs.rh_out, 0.5508, { abs: 1e-4 }, 'RH');
      assertClose(calculate({ temp_c: 15, rh: 1 }).outputs.dew_point_c, 15, { abs: 1e-6 }, 'saturated');
    },
  },
  {
    name: 'Altitude lowers the pressure: at 1 500 m the humidity ratio rises to 8.7 g/kg while the dew point stays 9.27 °C; below freezing the frost point is used',
    source: 'ASHRAE eq. (3) standard pressure; eq. (5) over ice',
    run: () => {
      const high = calculate({ temp_c: 20, rh: 0.5, altitude_m: 1500 }).outputs;
      assertClose(high.dew_point_c, 9.27, { abs: 0.01 }, 'dew point unchanged');
      assertClose(high.w_g_kg, 8.73, { abs: 0.02 }, 'W at 84.6 kPa');
      assertEqual(calculate({ temp_c: -5, rh: 0.8 }).outputs.dew_point_c < -5, true, 'frost point below air');
    },
  },
  {
    name: 'Comfort bands, near-saturation warning, and a dew point above the air temperature rejected',
    source: 'US National Weather Service comfort levels; validation contract',
    run: () => {
      assertEqual(calculate({ temp_c: 32, rh: 0.7 }).outputs.comfort.startsWith('Oppressive'), true, 'oppressive');
      assertEqual(calculate({ temp_c: 25, rh: 0.4 }).outputs.comfort.startsWith('Dry'), true, 'dry');
      assertEqual(calculate({ temp_c: 10, rh: 0.9 }).warnings.length, 1, 'fog warning');
      assertThrows(() => calculate({ mode: 'rh', temp_c: 10, dew_c: 12 }), 'cannot be above the air temperature');
      assertThrows(() => calculate({ rh: 0 }), 'Relative humidity');
    },
  },
];
