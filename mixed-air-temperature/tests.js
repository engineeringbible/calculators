/**
 * mixed-air-temperature/tests.js — checks against the ASHRAE Fundamentals Ch. 1 adiabatic mixing example and mass and
 * energy balances.
 * Run: node run-tests.js mixed-air-temperature
 */
import { calculate, wFromWetBulb, enthalpyIP } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';
import { wetBulb } from '../shared/psychro.js';

const CFM = 0.028316846592 / 60;
const F = (f) => (f - 32) / 1.8;

export const tests = [
  {
    name: 'ASHRAE example: 2 m³/s at 4 °C db / 2 °C wb mixed with 6.25 m³/s at 25 °C, 50 % gives 19.5 °C db and 14.6 °C wb',
    source: 'ASHRAE Handbook — Fundamentals (2017), Ch. 1, adiabatic mixing example (v1 = 0.789, v2 = 0.858 m³/kg; ṁ1 = 2.535, ṁ2 = 7.284 kg/s)',
    run: () => {
      const o = calculate({ mode: 'flows', altitude_m: 0, oa_flow_m3s: 2, oa_t_c: 4, oa_hum: 'wb', oa_wb_c: 2, ra_flow_m3s: 6.25, ra_t_c: 25, ra_hum: 'rh', ra_rh: 0.5 }).outputs;
      assertClose(o.t_mix_c, 19.5, { abs: 0.15 }, 'dry bulb (chart reading)');
      assertClose(o.wb_mix_c, 14.6, { abs: 0.05 }, 'wet bulb');
      assertClose(o.oa_frac_mass, 2.535 / (2.535 + 7.284), { abs: 0.001 }, 'mass fraction');
    },
  },
  {
    name: 'Mass and energy balance: W and h of the mix are the dry-air-mass weighted means of the two streams',
    source: 'ASHRAE Fundamentals Ch. 1, eqs. 46–48 (hand calculation from the stream states)',
    run: () => {
      const o = calculate({ oa_flow_m3s: 1, oa_t_c: 30, oa_hum: 'rh', oa_rh: 0.6, ra_flow_m3s: 3, ra_t_c: 24, ra_hum: 'rh', ra_rh: 0.5 }).outputs;
      const x = o.oa_frac_mass;
      const a = calculate({ oa_flow_m3s: 1, oa_t_c: 30, oa_hum: 'rh', oa_rh: 0.6, ra_flow_m3s: 0, ra_t_c: 24 }).outputs;
      const b = calculate({ oa_flow_m3s: 0, oa_t_c: 30, ra_flow_m3s: 3, ra_t_c: 24, ra_hum: 'rh', ra_rh: 0.5 }).outputs;
      assertClose(o.w_mix, x * a.w_mix + (1 - x) * b.w_mix, { rel: 1e-12 }, 'W');
      assertClose(o.h_mix, x * a.h_mix + (1 - x) * b.h_mix, { rel: 1e-12 }, 'h');
      assertClose(a.t_mix_c, 30, { abs: 1e-9 }, 'single stream keeps its temperature');
      assertClose(a.rh_mix, 0.6, { abs: 1e-9 }, 'and its humidity');
    },
  },
  {
    name: 'US case: 2 000 cfm at 95/75 °F with 8 000 cfm at 75 °F, 50 % mixes to 78.9 °F (volume average 79.0 °F), 20 % outdoor air by volume',
    source: 'Psychrometric mass balance; volume-weighted check (2 000 × 95 + 8 000 × 75) / 10 000 = 79 °F',
    run: () => {
      const o = calculate({ oa_flow_m3s: 2000 * CFM, oa_t_c: F(95), oa_hum: 'wb', oa_wb_c: F(75), ra_flow_m3s: 8000 * CFM, ra_t_c: F(75), ra_hum: 'rh', ra_rh: 0.5 }).outputs;
      assertClose(o.t_mix_c * 1.8 + 32, 78.9, { abs: 0.05 }, 'mixed °F');
      assertClose(o.t_simple_c * 1.8 + 32, 79, { abs: 1e-9 }, 'simple');
      assertClose(o.oa_frac_vol, 0.2, { rel: 1e-12 }, 'volume fraction');
    },
  },
  {
    name: 'Outdoor-air fraction from temperatures: return 75 °F, outdoor 95 °F, mixed 79 °F gives 20 % and 2 000 of 10 000 cfm',
    source: 'Energy balance x = (t_RA − t_MA)/(t_RA − t_OA) (hand calculation)',
    run: () => {
      const o = calculate({ mode: 'temps', ra_t_c: F(75), oa_t_c: F(95), ma_t_c: F(79), total_flow_m3s: 10000 * CFM }).outputs;
      assertClose(o.oa_frac_mass, 0.2, { rel: 1e-9 }, 'fraction');
      assertClose(o.oa_flow_out_m3s / CFM, 2000, { rel: 1e-9 }, 'outdoor cfm');
    },
  },
  {
    name: 'Wet bulb and IP enthalpy: W from 25 °C db / 18 °C wb gives back 18 °C wb; 75 °F, 50 % is about 28.1 Btu/lb on the IP chart',
    source: 'ASHRAE Fundamentals Ch. 1 eq. 33 and IP eq. h = 0.240 t + W (1061 + 0.444 t); ASHRAE IP psychrometric chart No. 1',
    run: () => {
      assertClose(wetBulb(25, wFromWetBulb(25, 18, 101325), 101325), 18, { abs: 1e-6 }, 'round trip');
      assertClose(wetBulb(5, wFromWetBulb(5, -2, 101325), 101325), -2, { abs: 1e-6 }, 'round trip over ice');
      const o = calculate({ oa_flow_m3s: 1, oa_t_c: F(75), oa_hum: 'rh', oa_rh: 0.5, ra_flow_m3s: 0 }).outputs;
      assertClose(o.h_mix_ip, 28.1, { abs: 0.15 }, 'h IP');
      assertClose(enthalpyIP(0, 0), 7.68, { rel: 1e-12 }, '0 °C dry air is 7.68 Btu/lb above 0 °F');
    },
  },
  {
    name: 'Cold saturated air mixed with warm humid air fogs (warning); wet bulb above dry bulb and no airflow are rejected',
    source: 'Validation contract; ASHRAE Fundamentals Ch. 1 (mixing line crossing the saturation curve)',
    run: () => {
      const r = calculate({ oa_flow_m3s: 1, oa_t_c: -10, oa_hum: 'rh', oa_rh: 1, ra_flow_m3s: 1, ra_t_c: 30, ra_hum: 'rh', ra_rh: 0.95 });
      assertEqual(r.warnings.length, 1, 'fog');
      assertThrows(() => calculate({ oa_hum: 'wb', oa_t_c: 20, oa_wb_c: 25 }), 'wet bulb');
      assertThrows(() => calculate({ oa_flow_m3s: 0, ra_flow_m3s: 0 }), 'airflow');
      assertThrows(() => calculate({ mode: 'temps', ma_t_c: 40 }), 'Measured mixed air');
    },
  },
];
