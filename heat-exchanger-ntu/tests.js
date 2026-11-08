/**
 * heat-exchanger-ntu/tests.js — checks against Incropera Example 11.1, the LMTD method, Table 11.3 limits and the exact
 * cross-flow series of Kays and London.
 * Run: node run-tests.js heat-exchanger-ntu
 */
import { calculate, effectiveness } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const lmtd = (a, b) => (Math.abs(a - b) < 1e-12 ? a : (a - b) / Math.log(a / b));

/** Bowman, Mueller & Nagle (1940) F factor for one shell pass, 2, 4… tube passes (as in heat-exchanger-lmtd). */
function bowmanF(thIn, thOut, tcIn, tcOut) {
  const R = (thIn - thOut) / (tcOut - tcIn);
  const P = (tcOut - tcIn) / (thIn - tcIn);
  const s = Math.sqrt(R * R + 1);
  return (s * Math.log((1 - P) / (1 - R * P))) / ((R - 1) * Math.log((2 - P * (R + 1 - s)) / (2 - P * (R + 1 + s))));
}

/** Exact effectiveness of cross-flow with both fluids unmixed (series of Mason 1955, Kays and London Ch. 2). */
function crossExact(ntu, cr) {
  let sum = 0;
  for (let n = 0; n < 200; n += 1) {
    let a = 0; let b = 0; let t1 = 1; let t2 = 1;
    for (let k = 0; k <= n; k += 1) {
      if (k > 0) { t1 *= ntu / k; t2 *= (cr * ntu) / k; }
      a += t1; b += t2;
    }
    sum += (1 - Math.exp(-ntu) * a) * (1 - Math.exp(-cr * ntu) * b);
  }
  return sum / (cr * ntu);
}

export const tests = [
  {
    name: 'Incropera Example 11.1 rated by ε-NTU: counterflow oil cooler with U 38.1 W/(m²·K) on a 25 mm tube 65.9 m long returns oil at 60.0 °C, water at 40.2 °C and q ≈ 8 524 W',
    source: 'Incropera et al., Fundamentals of Heat and Mass Transfer, 7th ed., Example 11.1 (q = 8 524 W, L = 65.9 m)',
    run: () => {
      const o = calculate({ arrangement: 'counter', ua_mode: 'u_area', u_w_m2k: 38.1, area_m2: Math.PI * 0.025 * 65.9, th_in_c: 100, m_hot_kg_s: 0.1, cp_hot_j_kgk: 2131, tc_in_c: 30, m_cold_kg_s: 0.2, cp_cold_j_kgk: 4178 }).outputs;
      assertClose(o.th_out_c, 60.0, { abs: 0.05 }, 'oil outlet');
      assertClose(o.tc_out_c, 40.2, { abs: 0.05 }, 'water outlet');
      assertClose(o.duty_w, 8524, { rel: 0.002 }, 'duty');
      assertEqual(o.cmin_side, 'Hot fluid', 'C_min side');
    },
  },
  {
    name: 'Same duty as the LMTD method: counterflow q = UA × LMTD and one shell pass q = UA × F × LMTD with the Bowman F, from the outlet temperatures found here',
    source: 'Incropera 7th ed., §11.3 (q = UA ΔT_lm and the F factor); Bowman, Mueller & Nagle, Trans. ASME 62 (1940)',
    run: () => {
      const base = { ua_mode: 'ua', ua_w_k: 5000, th_in_c: 150, m_hot_kg_s: 2, cp_hot_j_kgk: 2200, tc_in_c: 20, m_cold_kg_s: 1.5, cp_cold_j_kgk: 4180 };
      const c = calculate({ ...base, arrangement: 'counter' }).outputs;
      assertClose(c.duty_w, 5000 * lmtd(150 - c.tc_out_c, c.th_out_c - 20), { rel: 1e-9 }, 'counterflow');
      const p = calculate({ ...base, arrangement: 'parallel' }).outputs;
      assertClose(p.duty_w, 5000 * lmtd(130, p.th_out_c - p.tc_out_c), { rel: 1e-9 }, 'parallel');
      const s = calculate({ ...base, arrangement: 'shell', shells: 1 }).outputs;
      const F = bowmanF(150, s.th_out_c, 20, s.tc_out_c);
      assertClose(s.duty_w, 5000 * F * lmtd(150 - s.tc_out_c, s.th_out_c - 20), { rel: 1e-9 }, 'shell 1-2');
      assertClose(s.mean_dt_k, F * lmtd(150 - s.tc_out_c, s.th_out_c - 20), { rel: 1e-9 }, 'mean ΔT');
    },
  },
  {
    name: 'Table 11.3 limits: counterflow C_r = 1, NTU 1 gives ε = 0.5; C_r → 0 gives 1 − e^−NTU for every arrangement; parallel flow tends to 1/(1 + C_r); many shells tend to counterflow',
    source: 'Incropera 7th ed., Table 11.3, eqs. 11.28a, 11.29a, 11.31a, 11.35a',
    run: () => {
      assertClose(effectiveness('counter', 1, 1).eps, 0.5, { rel: 1e-12 }, 'counter C_r = 1');
      assertClose(effectiveness('counter', 2, 0.5).eps, (1 - Math.exp(-1)) / (1 - 0.5 * Math.exp(-1)), { rel: 1e-12 }, 'counter C_r 0.5');
      for (const a of ['counter', 'parallel', 'shell', 'cross_unmixed', 'cmax_mixed', 'cmin_mixed']) {
        assertClose(effectiveness(a, 1.5, 1e-7).eps, 1 - Math.exp(-1.5), { rel: 1e-5 }, `${a} C_r → 0`);
      }
      assertClose(effectiveness('parallel', 50, 0.6).eps, 1 / 1.6, { rel: 1e-9 }, 'parallel limit');
      assertClose(effectiveness('shell', 3, 1, 2).eps, effectiveness('shell', 3, 1 - 1e-7, 2).eps, { rel: 1e-5 }, 'n shells at C_r = 1');
      assertClose(effectiveness('shell', 3, 0.8, 6).eps, effectiveness('counter', 3, 0.8).eps, { rel: 0.01 }, '6 shells ≈ counterflow');
      assertClose(effectiveness('cmax_mixed', 2, 1).eps, effectiveness('cmin_mixed', 2, 1).eps, { rel: 1e-12 }, 'mixed C_r = 1');
    },
  },
  {
    name: 'Cross-flow, both unmixed: the exact series gives ε = 0.476 at C_r = 1, NTU = 1 (Kays and London); the eq. 11.32 approximation is within 4 % from NTU 0.25 to 5',
    source: 'Kays & London, Compact Heat Exchangers, 3rd ed., cross-flow both fluids unmixed table; Incropera 7th ed., eq. 11.32',
    run: () => {
      assertClose(crossExact(1, 1), 0.476, { abs: 0.0005 }, 'exact series');
      for (const cr of [0.25, 0.5, 0.75, 1]) {
        for (const ntu of [0.25, 0.5, 1, 2, 3, 5]) {
          assertClose(effectiveness('cross_unmixed', ntu, cr).eps, crossExact(ntu, cr), { rel: 0.04 }, `C_r ${cr}, NTU ${ntu}`);
        }
      }
    },
  },
  {
    name: 'Condensing steam at 100 °C heating 0.2 kg/s of water from 30 °C with UA 1 000 W/K: ε = 1 − e^−1.197 = 0.698, water out 78.8 °C, 40.8 kW, 65.1 kg/h of condensate at 2 257 kJ/kg',
    source: 'Incropera 7th ed., eq. 11.35a (C_r = 0); hand calculation',
    run: () => {
      const o = calculate({ arrangement: 'condensing', ua_mode: 'ua', ua_w_k: 1000, th_in_c: 100, tc_in_c: 30, m_cold_kg_s: 0.2, cp_cold_j_kgk: 4178, hfg_j_kg: 2257000 }).outputs;
      const eps = 1 - Math.exp(-1000 / 835.6);
      assertClose(o.effectiveness, eps, { rel: 1e-12 }, 'ε');
      assertClose(o.tc_out_c, 30 + 70 * eps, { rel: 1e-12 }, 'water out');
      assertClose(o.duty_w, 835.6 * 70 * eps, { rel: 1e-12 }, 'duty');
      assertClose(o.phase_rate_kg_s * 3600, (835.6 * 70 * eps * 3600) / 2257000, { rel: 1e-12 }, 'condensate');
      assertEqual(o.th_out_c, 100, 'steam stays at 100 °C');
      assertEqual(o.c_hot_w_k, null, 'no hot capacity rate');
    },
  },
  {
    name: 'Invalid inputs: hot inlet not above cold inlet, zero flow, a fractional number of shells and an unknown arrangement are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ th_in_c: 30, tc_in_c: 30 }), 'Hot fluid inlet');
      assertThrows(() => calculate({ m_cold_kg_s: 0 }), 'Cold mass flow');
      assertThrows(() => calculate({ arrangement: 'shell', shells: 1.5 }), 'Number of shell passes');
      assertThrows(() => calculate({ arrangement: 'plate' }), 'Flow arrangement');
    },
  },
];
