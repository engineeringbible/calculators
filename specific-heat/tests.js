/**
 * specific-heat/tests.js — checks against Q = m c ΔT by hand.
 * Run: node run-tests.js specific-heat
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '1.5 kg of water from 20 to 100 °C: 1.5 × 4 181 × 80 = 501.7 kJ = 0.139 kWh = 475.5 Btu; 4.65 min in a 2 kW kettle at 90 %',
    source: 'Q = m c ΔT, c_water = 4 181 J/(kg·K) at 25 °C (CRC Handbook)',
    run: () => {
      const o = calculate({ solve: 'heat', material: 'water', mass_kg: 1.5, t1_c: 20, t2_c: 100, power_w: 2000, efficiency: 0.9 }).outputs;
      assertClose(o.q_j, 501720, { rel: 1e-12 }, 'Q');
      assertClose(o.q_kwh_j / 3.6e6, 0.13937, { abs: 1e-5 }, 'kWh');
      assertClose(o.q_btu_j / 1055.05585262, 475.53, { abs: 0.01 }, 'Btu');
      assertClose(o.time_s / 60, 4.6456, { abs: 1e-4 }, 'time');
    },
  },
  {
    name: 'Final temperature: 89.7 kJ into 2 kg of aluminium (897 J/kg·K) from 20 °C reaches 70 °C',
    source: 'ΔT = Q / (m c)',
    run: () => {
      assertClose(calculate({ solve: 'dt', material: 'aluminium', mass_kg: 2, t1_c: 20, heat_j: 89700 }).outputs.t2_out_c, 70, { rel: 1e-12 }, 'T2');
    },
  },
  {
    name: 'Mass and specific heat: 418.1 kJ warms 10 kg of water by 10 K; 1 925 J warming 0.5 kg by 10 K means c = 385 J/(kg·K), copper',
    source: 'm = Q / (c ΔT); c = Q / (m ΔT)',
    run: () => {
      assertClose(calculate({ solve: 'mass', material: 'water', heat_j: 418100, t1_c: 20, t2_c: 30 }).outputs.mass_out_kg, 10, { rel: 1e-12 }, 'mass');
      assertClose(calculate({ solve: 'c', mass_kg: 0.5, heat_j: 1925, t1_c: 20, t2_c: 30 }).outputs.c_out, 385, { rel: 1e-12 }, 'c');
    },
  },
  {
    name: 'Cooling gives a negative heat (heat removed); the heating time uses its size; no power gives no time',
    source: 'Sign convention Q = m c (T2 − T1)',
    run: () => {
      const o = calculate({ solve: 'heat', material: 'water', mass_kg: 1, t1_c: 50, t2_c: 20, power_w: 1000, efficiency: 1 }).outputs;
      assertClose(o.q_j, -125430, { rel: 1e-12 }, 'Q');
      assertClose(o.time_s, 125.43, { rel: 1e-12 }, 'time');
      assertEqual(calculate({ power_w: 0 }).outputs.time_s, null, 'no power');
    },
  },
  {
    name: 'Water heated past 100 °C warns about boiling; equal temperatures and zero mass are rejected',
    source: 'Phase change not included; validation contract',
    run: () => {
      assertEqual(calculate({ t2_c: 120 }).warnings.length, 1, 'boiling');
      assertThrows(() => calculate({ solve: 'mass', t1_c: 20, t2_c: 20 }), 'must differ');
      assertThrows(() => calculate({ mass_kg: 0 }), 'Mass must be greater than zero');
    },
  },
];
