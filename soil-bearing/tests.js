/**
 * soil-bearing/tests.js — checks against Eurocode 7 Annex D and Terzaghi's tabulated factors.
 * Run: node run-tests.js soil-bearing
 */
import { calculate, factorsEc7, factorsTerzaghi } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Eurocode 7 factors: φ 20° N_c 14.83, N_q 6.40, N_γ 3.93; φ 30° 30.14, 18.40, 20.09; φ 40° 75.31, 64.20, 106.05',
    source: 'EN 1997-1 Annex D.4: N_q = e^{π tan φ} tan²(45 + φ/2), N_c = (N_q − 1) cot φ, N_γ = 2 (N_q − 1) tan φ',
    run: () => {
      [[20, 14.83, 6.40, 3.93], [30, 30.14, 18.40, 20.09], [40, 75.31, 64.20, 106.05]].forEach(([p, c, q, g]) => {
        const f = factorsEc7(p);
        assertClose(f.Nc, c, { abs: 0.01 }, `Nc ${p}`);
        assertClose(f.Nq, q, { abs: 0.01 }, `Nq ${p}`);
        assertClose(f.Ng, g, { abs: 0.01 }, `Nγ ${p}`);
      });
    },
  },
  {
    name: 'Terzaghi factors match Das Table 3.1: φ 20° N_c 17.69, N_q 7.44; φ 30° 37.16, 22.46; φ 40° 95.66, 81.27; N_γ within 6 % at 30–40°',
    source: 'Das, Principles of Foundation Engineering, Table 3.1 (N_γ after Kumbhojkar 1993: 19.13 at 30°, 115.31 at 40°)',
    run: () => {
      [[20, 17.69, 7.44], [30, 37.16, 22.46], [40, 95.66, 81.27]].forEach(([p, c, q]) => {
        const f = factorsTerzaghi(p);
        assertClose(f.Nc, c, { abs: 0.01 }, `Nc ${p}`);
        assertClose(f.Nq, q, { abs: 0.01 }, `Nq ${p}`);
      });
      assertClose(factorsTerzaghi(30).Ng, 19.13, { rel: 0.06 }, 'Nγ 30');
      assertClose(factorsTerzaghi(40).Ng, 115.31, { rel: 0.06 }, 'Nγ 40');
      assertEqual(factorsTerzaghi(0).Nc, 5.7, 'φ = 0');
    },
  },
  {
    name: 'EC7 drained, 2 m square, 1 m deep, φ 30°, γ 18: q_ult = 18 × 18.40 × 1.5 + 0.5 × 18 × 2 × 20.09 × 0.7 = 750 kPa; 250 kPa at FS 3; 1 000 kN',
    source: 'EN 1997-1 Annex D.4 with s_q = 1 + sin φ, s_γ = 0.7 for a square',
    run: () => {
      const o = calculate({ method: 'ec7', condition: 'drained', shape: 'square', width_m: 2, depth_m: 1, phi_deg: 30, c_pa: 0, gamma_kn_m3: 18, fs: 3 }).outputs;
      assertClose(o.q_ult_pa / 1000, 750.0, { abs: 0.1 }, 'q_ult');
      assertClose(o.q_all_pa / 1000, 250.0, { abs: 0.05 }, 'q_all');
      assertClose(o.capacity_n / 1000, 1000, { abs: 0.1 }, 'load');
    },
  },
  {
    name: 'EC7 undrained strip, c_u 50 kPa, 1 m deep: (π + 2) × 50 + 18 = 275.1 kPa; a square adds 20 % to the c_u term',
    source: 'EN 1997-1 Annex D.3: R/A′ = (π + 2) c_u b_c s_c i_c + q, s_c = 1.2 for a square',
    run: () => {
      assertClose(calculate({ condition: 'undrained', cu_pa: 50000, shape: 'strip' }).outputs.q_ult_pa / 1000, 275.08, { abs: 0.01 }, 'strip');
      assertClose(calculate({ condition: 'undrained', cu_pa: 50000, shape: 'square' }).outputs.q_ult_pa / 1000, (Math.PI + 2) * 50 * 1.2 + 18, { abs: 0.01 }, 'square');
    },
  },
  {
    name: 'Terzaghi strip, B 1.5 m, D_f 1 m, φ 25°, c 10 kPa, γ 17: q_ult = 10 × 25.13 + 17 × 12.72 + 0.5 × 17 × 1.5 × N_γ; L < B, deep footings and bad inputs handled',
    source: 'Terzaghi (1943) strip footing: q_ult = c N_c + q N_q + ½ γ B N_γ',
    run: () => {
      const f = factorsTerzaghi(25);
      const expected = 10 * f.Nc + 17 * f.Nq + 0.5 * 17 * 1.5 * f.Ng;
      assertClose(calculate({ method: 'terzaghi', shape: 'strip', width_m: 1.5, depth_m: 1, phi_deg: 25, c_pa: 10000, gamma_kn_m3: 17 }).outputs.q_ult_pa / 1000, expected, { rel: 1e-12 }, 'strip');
      assertThrows(() => calculate({ shape: 'rect', width_m: 3, length_m: 2 }), 'Length L');
      assertEqual(calculate({ width_m: 1, depth_m: 3 }).warnings.length > 0, true, 'deep');
      assertThrows(() => calculate({ phi_deg: 60 }), 'Friction angle');
    },
  },
];
