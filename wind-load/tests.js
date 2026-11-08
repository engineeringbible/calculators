/**
 * wind-load/tests.js — checks against EN 1991-1-4 Fig. 4.2 and ASCE 7-16 Table 26.10-1.
 * Run: node run-tests.js wind-load
 */
import { calculate, enPeakPressure, asceKz } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const PSF = 4.4482216152605 / 0.09290304;
const FT = 0.3048;

export const tests = [
  {
    name: 'EN: v_b 27 m/s, terrain II, z 10 m: c_r = 1.007, I_v = 0.189, c_e = 2.35, q_p = 1.07 kPa',
    source: 'EN 1991-1-4 eqs. (4.4), (4.7), (4.8); Fig. 4.2 (c_e ≈ 2.35 at 10 m, category II)',
    run: () => {
      const r = enPeakPressure(27, 'II', 10);
      assertClose(r.cr, 1.0066, { abs: 1e-4 }, 'c_r');
      assertClose(r.iv, 0.18874, { abs: 1e-5 }, 'I_v');
      assertClose(r.ce, 2.352, { abs: 0.002 }, 'c_e');
      assertClose(calculate({ code: 'en', vb_m_s: 27, terrain: 'II', height_m: 10 }).outputs.pressure_pa / 1000, 1.072, { abs: 0.001 }, 'q_p');
    },
  },
  {
    name: 'EN exposure factor at 10 m falls from about 3.0 (sea) to 1.2 (city), as on Fig. 4.2; below z_min the value at z_min is used',
    source: 'EN 1991-1-4 Fig. 4.2 and Table 4.1',
    run: () => {
      [['0', 2.98], ['I', 2.77], ['III', 1.71], ['IV', 1.18]].forEach(([c, ce]) => assertClose(enPeakPressure(27, c, 10).ce, ce, { abs: 0.01 }, c));
      assertClose(enPeakPressure(27, 'IV', 3).qp, enPeakPressure(27, 'IV', 10).qp, { rel: 1e-12 }, 'z_min');
    },
  },
  {
    name: 'ASCE 7-16 K_z: B 30 ft 0.70, C 15 ft 0.85, C 33 ft 1.00, D 30 ft 1.16, B 100 ft 0.99',
    source: 'ASCE 7-16 Table 26.10-1',
    run: () => {
      [['B', 30, 0.70], ['C', 15, 0.85], ['C', 33, 1.0], ['D', 30, 1.16], ['B', 100, 0.99]].forEach(([e, z, k]) => assertClose(asceKz(e, z), k, { abs: 0.006 }, `${e} ${z}`));
      assertClose(asceKz('C', 5), asceKz('C', 15), { rel: 1e-12 }, 'below 15 ft');
    },
  },
  {
    name: 'ASCE: V 115 mph, exposure C, 30 ft, K_d 0.85: q_z = 0.00256 × 0.982 × 0.85 × 115² = 28.27 psf',
    source: 'ASCE 7-16 eq. 26.10-1',
    run: () => {
      const o = calculate({ code: 'asce', v_asce_m_s: 115 * 0.44704, exposure: 'C', kzt: 1, kd: 0.85, ke: 1, height_m: 30 * FT }).outputs;
      assertClose(o.pressure_pa / PSF, 28.27, { abs: 0.01 }, 'q_z');
      assertEqual(o.mean_speed_m_s, null, 'no EN mean speed');
    },
  },
  {
    name: 'Force on a 20 m² sign with c_f 1.8 at 1.07 kPa is 38.6 kN; bad inputs are rejected',
    source: 'F = q_p c_f A (EN 1991-1-4 eq. 5.3 with c_s c_d = 1)',
    run: () => {
      const o = calculate({ code: 'en', vb_m_s: 27, terrain: 'II', height_m: 10, coef: 1.8, area_m2: 20 }).outputs;
      assertClose(o.force_n / 1000, 1.8 * 20 * o.pressure_pa / 1000, { rel: 1e-12 }, 'F');
      assertClose(o.force_n / 1000, 38.6, { abs: 0.1 }, 'F value');
      assertThrows(() => calculate({ terrain: 'V' }), 'Terrain category');
      assertThrows(() => calculate({ height_m: 0 }), 'Height must be greater than zero');
    },
  },
];
