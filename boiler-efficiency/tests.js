/**
 * boiler-efficiency/tests.js — checks against the BEE direct-method example, IAPWS-IF97 steam table values, the
 * Siegert formula of the 1. BImSchV and hand calculations of the loss balance.
 * Run: node run-tests.js boiler-efficiency
 */
import { calculate, FUELS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'BEE example: 8 t/h steam at 10 kg/cm² g, feedwater 85 °C, 1.6 t/h coal of GCV 4 000 kcal/kg gives 72.5 %',
    source: 'Bureau of Energy Efficiency, Book 4 Ch. 1 Boilers, direct method example (72.5 % with h_s = 665 kcal/kg)',
    run: () => {
      const o = calculate({ method: 'direct', fuel: 'custom', lhv_j_kg: 0, hhv_j_kg: 4000 * 4186.8, p_steam_pa: 980665, steam_state: 'saturated', dryness: 1, t_feed_c: 85, steam_kg_s: 8000 / 3600, fuel_kg_s: 1600 / 3600 }).outputs;
      assertClose(o.eff_hhv, 0.725, { abs: 0.003 }, 'efficiency');
      assertClose(o.h_steam / 4186.8, 665, { abs: 1.5 }, 'steam enthalpy in kcal/kg');
      assertEqual(o.eff_lhv, null, 'no LHV given');
      assertClose(o.evaporation, 5, { rel: 1e-12 }, 'evaporation ratio');
    },
  },
  {
    name: 'Steam at 10 bar absolute: dry saturated h_g = 2 777.1 kJ/kg, wet x = 0.9 gives h_f + 0.9 h_fg = 2 575.7 kJ/kg; 250 °C superheated 2 943.1 kJ/kg',
    source: 'IAPWS-IF97 steam tables (saturation at 1 MPa: h_f 762.7, h_g 2 777.1 kJ/kg; 1 MPa, 250 °C: 2 943.1 kJ/kg; Çengel & Boles Tables A-5 and A-6)',
    run: () => {
      const base = { p_steam_pa: 1e6 - 101325, t_feed_c: 20 };
      assertClose(calculate({ ...base, steam_state: 'saturated', dryness: 1 }).outputs.h_steam / 1000, 2777.1, { abs: 0.3 }, 'h_g');
      assertClose(calculate({ ...base, steam_state: 'saturated', dryness: 0.9 }).outputs.h_steam / 1000, 762.7 + 0.9 * (2777.1 - 762.7), { abs: 0.3 }, 'wet');
      assertClose(calculate({ ...base, steam_state: 'superheated', t_steam_c: 250 }).outputs.h_steam / 1000, 2943.1, { abs: 0.3 }, 'superheated');
    },
  },
  {
    name: 'Siegert: natural gas, flue 180 °C, air 20 °C, 3 % O2 gives 7.31 % loss; heating oil 200 °C, 4 % O2 gives 8.46 %',
    source: '1. BImSchV Anlage 2 Nr. 3.4: q_A = (t_A − t_L)(A2/(21 − O2) + B), gas 0.66/0.009, oil 0.68/0.007; hand calculation',
    run: () => {
      const gas = calculate({ method: 'indirect', fuel: 'natural_gas', t_flue_c: 180, t_air_c: 20, o2: 0.03 }).outputs;
      assertClose(gas.flue_loss, 0.073067, { abs: 1e-6 }, 'gas');
      assertClose(gas.excess_air, 3 / 18, { rel: 1e-12 }, 'excess air');
      const oil = calculate({ method: 'indirect', fuel: 'heating_oil', t_flue_c: 200, t_air_c: 20, o2: 0.04 }).outputs;
      assertClose(oil.flue_loss, 0.0846, { abs: 1e-6 }, 'oil');
    },
  },
  {
    name: 'Indirect without blowdown: η_LHV = 1 − q_A − q_rad and η_HHV = η_LHV × LHV/HHV (natural gas 47.141 / 52.225 MJ/kg)',
    source: 'Loss balance; GREET heating values (ORNL Biomass Energy Data Book, Appendix A)',
    run: () => {
      const o = calculate({ method: 'indirect', fuel: 'natural_gas', t_flue_c: 150, t_air_c: 20, o2: 0.02, radiation: 0.015, blowdown: 0 }).outputs;
      const qa = 130 * (0.66 / 19 + 0.009) / 100;
      assertClose(o.eff_lhv, 1 - qa - 0.015, { rel: 1e-12 }, 'LHV');
      assertClose(o.eff_hhv, (1 - qa - 0.015) * 47.141 / 52.225, { rel: 1e-12 }, 'HHV');
      assertEqual(o.blowdown_loss, 0, 'no blowdown');
      assertEqual(FUELS.natural_gas[1], 47.141, 'table value');
    },
  },
  {
    name: 'Blowdown share: 5 % blowdown at 10 bar g, feedwater 80 °C takes (0.05/0.95)(h_f − h_fw) of the heat absorbed',
    source: 'Energy balance of the boiler water (blowdown leaves as saturated liquid); hand calculation',
    run: () => {
      const o = calculate({ method: 'indirect', fuel: 'natural_gas', t_flue_c: 180, t_air_c: 20, o2: 0.03, radiation: 0.01, blowdown: 0.05 }).outputs;
      const eta0 = 1 - 160 * (0.66 / 18 + 0.009) / 100 - 0.01;
      const hs = o.h_steam / 1000; const hfw = o.h_feed / 1000;
      const hf = 781.4; // saturated liquid at 11.01 bar abs, IAPWS-IF97
      const bd = (0.05 / 0.95) * (hf - hfw);
      assertClose(o.blowdown_loss, eta0 * bd / (hs - hfw + bd), { rel: 0.002 }, 'blowdown loss');
      assertClose(o.eff_lhv + o.blowdown_loss, eta0, { rel: 1e-9 }, 'balance');
    },
  },
  {
    name: 'Invalid input: Siegert table for coal, feedwater above saturation, superheat below saturation and LHV above HHV are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ method: 'indirect', fuel: 'coal' }), 'Siegert constants');
      assertThrows(() => calculate({ t_feed_c: 190 }), 'Feedwater temperature');
      assertThrows(() => calculate({ steam_state: 'superheated', t_steam_c: 150 }), 'Steam temperature');
      assertThrows(() => calculate({ fuel: 'custom', lhv_j_kg: 3e7, hhv_j_kg: 2e7 }), 'Lower heating value');
      assertThrows(() => calculate({ fuel_kg_s: 0.001 }), 'Fuel flow');
    },
  },
];
