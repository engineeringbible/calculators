/**
 * steam-table/tests.js — checks against published IAPWS-IF97 steam tables.
 * Run: node run-tests.js steam-table
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Saturated at 10 bar: 179.89 °C, h_f 762.68, h_fg 2014.4, h_g 2777.1 kJ/kg, s_f 2.1384, s_g 6.5850, v_f 0.0011272, v_g 0.19435',
    source: 'IAPWS-IF97 saturation table (Wagner and Kretzschmar, International Steam Tables, 1 MPa)',
    run: () => {
      const o = calculate({ mode: 'sat_p', pressure_pa: 1e6, quality: 1 }).outputs;
      assertClose(o.t_out_c, 179.886, { abs: 0.001 }, 'T_s');
      assertClose(o.hf_j_kg / 1e3, 762.68, { abs: 0.01 }, 'h_f');
      assertClose(o.hfg_j_kg / 1e3, 2014.44, { abs: 0.01 }, 'h_fg');
      assertClose(o.hg_j_kg / 1e3, 2777.12, { abs: 0.01 }, 'h_g');
      assertClose(o.sf_j_kgk / 1e3, 2.1384, { abs: 1e-4 }, 's_f');
      assertClose(o.sg_j_kgk / 1e3, 6.5850, { abs: 1e-4 }, 's_g');
      assertClose(o.vf_m3_kg, 0.0011272, { abs: 1e-7 }, 'v_f');
      assertClose(o.vg_m3_kg, 0.19435, { abs: 1e-5 }, 'v_g');
    },
  },
  {
    name: 'Saturated at 100 °C: 101.42 kPa, h_f 419.10, h_fg 2256.5 kJ/kg, v_g 1.6719 m³/kg',
    source: 'IAPWS-IF97 saturation table (100 °C)',
    run: () => {
      const o = calculate({ mode: 'sat_t', temp_c: 100 }).outputs;
      assertClose(o.p_out_pa / 1000, 101.418, { abs: 0.001 }, 'p_s');
      assertClose(o.hf_j_kg / 1e3, 419.10, { abs: 0.01 }, 'h_f');
      assertClose(o.hfg_j_kg / 1e3, 2256.47, { abs: 0.01 }, 'h_fg');
      assertClose(o.vg_m3_kg, 1.6719, { abs: 1e-4 }, 'v_g');
    },
  },
  {
    name: 'Superheated steam at 10 bar and 300 °C: h 3051.7 kJ/kg, s 7.1247 kJ/(kg·K), v 0.25798 m³/kg, 120.1 K of superheat',
    source: 'IAPWS-IF97 superheated steam table (1 MPa, 300 °C)',
    run: () => {
      const o = calculate({ mode: 'pt', pressure_pa: 1e6, temp_c: 300 }).outputs;
      assertClose(o.h_j_kg / 1e3, 3051.70, { abs: 0.01 }, 'h');
      assertClose(o.s_j_kgk / 1e3, 7.1247, { abs: 1e-4 }, 's');
      assertClose(o.v_m3_kg, 0.25798, { abs: 1e-5 }, 'v');
      assertClose(o.superheat_k, 120.114, { abs: 0.001 }, 'superheat');
      assertEqual(o.state.startsWith('Superheated'), true, 'state');
    },
  },
  {
    name: 'Wet steam at 1.01325 bar, 90 % dry: h = h_f + 0.9 h_fg = 2449.9 kJ/kg; compressed water at 50 bar and 100 °C is region 1',
    source: 'Mixture rule y = y_f + x (y_g − y_f); IF97 region boundaries',
    run: () => {
      const w = calculate({ mode: 'sat_p', pressure_pa: 101325, quality: 0.9 }).outputs;
      assertClose(w.h_j_kg, w.hf_j_kg + 0.9 * w.hfg_j_kg, { rel: 1e-12 }, 'mixture');
      assertClose(w.h_j_kg / 1e3, 2449.88, { abs: 0.01 }, 'value');
      assertEqual(calculate({ mode: 'pt', pressure_pa: 5e6, temp_c: 100 }).outputs.state.startsWith('Compressed'), true, 'region 1');
    },
  },
  {
    name: 'The near-critical region and saturation above 350 °C are refused rather than extrapolated',
    source: 'IAPWS-IF97 region 3 not implemented',
    run: () => {
      assertThrows(() => calculate({ mode: 'pt', pressure_pa: 25e6, temp_c: 380 }), 'region 3');
      assertThrows(() => calculate({ mode: 'sat_t', temp_c: 360 }), 'Temperature');
      assertThrows(() => calculate({ mode: 'sat_p', pressure_pa: 200e5 }), 'Pressure');
    },
  },
];
