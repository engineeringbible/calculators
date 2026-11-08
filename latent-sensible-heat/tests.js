/**
 * latent-sensible-heat/tests.js — checks against the standard-air rules (1.08 / 1.10, 4 840, 4.5), the exact
 * psychrometric split, Serway's heating curve of ice to steam, and the latent heats of water.
 * Run: node run-tests.js latent-sensible-heat
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const CFM = 0.028316846592 / 60;
const BTU_H = 0.29307107017;
const F = (f) => (f - 32) / 1.8;
const coil = { mode: 'air', flow_m3s: 1000 * CFM, altitude_m: 0, hum: 'wb', t1_c: F(80), wb1_c: F(67), t2_c: F(55), wb2_c: F(54) };

export const tests = [
  {
    name: 'Rules for 1 000 cfm cooled 25 °F: 1.08 × 1 000 × 25 = 27 000 Btu/h, 1.10 gives 27 500; latent 4 840 cfm ΔW; total 4.5 cfm Δh',
    source: 'ASHRAE Handbook — Fundamentals Ch. 18 (q_s = 1.10 Q Δt, q_l = 4 840 Q ΔW, q_t = 4.5 Q Δh); classic 1.08 = 0.075 × 60 × 0.24',
    run: () => {
      const a = calculate({ ...coil, rule: 'classic' }).outputs;
      assertClose(a.rule_qs_w / BTU_H, 27000, { rel: 1e-9 }, '1.08');
      assertClose(calculate({ ...coil, rule: 'ashrae' }).outputs.rule_qs_w / BTU_H, 27500, { rel: 1e-9 }, '1.10');
      assertClose(a.rule_ql_w / BTU_H, 4840 * 1000 * 0.0025348, { rel: 1e-4 }, '4 840 × cfm × ΔW (W1 0.0111659, W2 0.0086311)');
      assertClose(a.rule_qt_w / BTU_H, 4.5 * 1000 * 8.8824, { rel: 1e-4 }, '4.5 × cfm × Δh (8.882 Btu/lb)');
      assertClose(a.rule_ql_w / BTU_H, 12269, { abs: 1 }, 'latent rule value');
    },
  },
  {
    name: 'Exact split for 80/67 °F to 55/54 °F at 1 000 cfm: sensible 26 440, latent 12 040, total 38 480 Btu/h; sensible + latent = total',
    source: 'ASHRAE Fundamentals Ch. 1 eq. 30, h = 1.006 t + W (2 501 + 1.86 t); hand calculation (ṁ = 0.546 kg/s, Δh = 20.66 kJ/kg)',
    run: () => {
      const o = calculate(coil).outputs;
      assertClose(o.qs_w / BTU_H, 26440, { abs: 5 }, 'sensible');
      assertClose(o.ql_w / BTU_H, 12040, { abs: 5 }, 'latent');
      assertClose(o.qs_w + o.ql_w, o.qt_w, { rel: 1e-12 }, 'identity');
      assertClose(o.shr, 0.687, { abs: 0.001 }, 'SHR');
      assertClose(o.coil_w, o.qt_w - o.condensate_kg_s * 4186 * F(55), { rel: 1e-9 }, 'coil load minus condensate enthalpy');
    },
  },
  {
    name: 'Dry air at 70 °F (0.0749 lb/ft³, close to standard 0.075) cooled by 10 °F: the exact sensible heat equals the 1.08 rule within 0.1 %',
    source: 'Standard air 0.075 lb/ft³ and c_p 0.24 Btu/(lb·°F) behind the 1.08 constant; ASHRAE Fundamentals Ch. 1',
    run: () => {
      const o = calculate({ mode: 'air', flow_m3s: 1000 * CFM, hum: 'rh', t1_c: F(70), rh1: 0, t2_c: F(60), rh2: 0, rule: 'classic' }).outputs;
      assertClose(o.qs_w / o.rule_qs_w, 1, { abs: 0.001 }, 'exact vs rule');
      assertEqual(o.ql_w, 0, 'no latent heat');
      assertClose(o.shr, 1, { abs: 1e-12 }, 'SHR 1');
    },
  },
  {
    name: 'Serway heating curve: 1 g of ice at −30 °C to steam at 120 °C needs 62.7 + 333 + 419 + 2 260 + 40.2 J = 3.11 kJ',
    source: 'Serway & Jewett, Physics for Scientists and Engineers, 9th ed., Ch. 20 (c_ice 2 090, c_w 4 186, c_steam 2 010 J/(kg·K); L_f 3.33e5, L_v 2.26e6 J/kg)',
    run: () => {
      const o = calculate({ mode: 'water', mass_kg: 0.001, phase1: 'solid', tw1_c: -30, phase2: 'vapour', tw2_c: 120, c_ice: 2090, c_water: 4186, c_steam: 2010, lf: 333000, lv: 2260000 }).outputs;
      assertClose(o.q_water_j / 1000, 3.11, { abs: 0.005 }, 'total');
      assertClose(o.q_water_j, 62.7 + 333 + 418.6 + 2260 + 40.2, { rel: 1e-9 }, 'stages');
      assertClose(o.q_lat_j, 2593, { rel: 1e-12 }, 'latent');
    },
  },
  {
    name: 'Latent heats: melting 1 kg of ice at 0 °C takes 334 kJ, boiling 1 kg at 100 °C 2 257 kJ; condensing gives them back; 1 kW boils it in 37.6 min',
    source: 'Latent heats of water 334 and 2 257 kJ/kg (IAPWS-IF97: 2 256.5 kJ/kg at 1 atm)',
    run: () => {
      assertClose(calculate({ mode: 'water', phase1: 'solid', tw1_c: 0, phase2: 'liquid', tw2_c: 0 }).outputs.q_water_j, 334000, { rel: 1e-12 }, 'melt');
      const b = calculate({ mode: 'water', phase1: 'liquid', tw1_c: 100, phase2: 'vapour', tw2_c: 100, power_w: 1000 }).outputs;
      assertClose(b.q_water_j, 2257000, { rel: 1e-12 }, 'boil');
      assertClose(b.time_s / 60, 37.62, { abs: 0.01 }, 'time');
      assertClose(calculate({ mode: 'water', phase1: 'vapour', tw1_c: 100, phase2: 'liquid', tw2_c: 100 }).outputs.q_water_j, -2257000, { rel: 1e-12 }, 'condense');
    },
  },
  {
    name: 'Invalid input: ice above 0 °C, steam below 100 °C, a wet bulb above the dry bulb and zero airflow are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ mode: 'water', phase1: 'solid', tw1_c: 5 }), 'ice must be');
      assertThrows(() => calculate({ mode: 'water', phase2: 'vapour', tw2_c: 90 }), 'steam must be');
      assertThrows(() => calculate({ ...coil, wb1_c: F(85) }), 'wet bulb');
      assertThrows(() => calculate({ flow_m3s: 0 }), 'Airflow');
    },
  },
];
