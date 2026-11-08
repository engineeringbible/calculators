/**
 * propeller-bseries/tests.js — checks the polynomial table and the design mode against the Holtrop & Mennen (1982)
 * example propeller, plus physical consistency of the open-water curves.
 * Run: node run-tests.js propeller-bseries
 */
import { calculate, KT_TERMS, KQ_TERMS, ktPolynomial, kqPolynomial, ittcCorrection, openWater, solveAdvanceCoefficient, optimumPitchRatio, kellerWithZ } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** Holtrop & Mennen (1982) example: Z 4, A_E/A_0 0.7393, D 8 m, V_A = 12.861 × (1 − 0.2584) = 9.538 m/s, T 2172.75 kN, h 5.8 m. */
const HM = { mode: 'design', blades: 4, ae_a0: 0.7393, diameter_m: 8, va_m_s: 12.8611 * (1 - 0.2584), rho_kg_m3: 1025, scale: 'full', kp_um: 30, thrust_n: 2172750, immersion_m: 5.8, keller_k: 0.2 };

export const tests = [
  {
    name: 'Coefficient table: 39 KT and 47 KQ terms with the published first and last entries (0.00880496 … −0.00146564; 0.00379368 … 0.0000554194) and exponents within s ≤ 3, t ≤ 6, u ≤ 2, v ≤ 2',
    source: 'Oosterveld & van Oossanen (1975) Table; reproduced in Fossen MSS WageningData.txt and Carlton Table 6.6',
    run: () => {
      assertEqual(KT_TERMS.length, 39, 'KT terms');
      assertEqual(KQ_TERMS.length, 47, 'KQ terms');
      assertEqual(KT_TERMS[0][0], 0.00880496, 'KT c0');
      assertEqual(KT_TERMS[38][0], -0.00146564, 'KT last');
      assertEqual(KQ_TERMS[0][0], 0.00379368, 'KQ c0');
      assertEqual(KQ_TERMS[46][0], 0.0000554194, 'KQ last');
      for (const [, s, t, u, v] of [...KT_TERMS, ...KQ_TERMS]) assertEqual(s <= 3 && t <= 6 && u <= 2 && v <= 2 && s >= 0, true, 'exponent ranges');
      assertClose(ktPolynomial(0, 1, 0.7, 4), 0.00880496 + 0.166351 + 0.158114 + 0.415437 * 0.7 + 0.0144043 * 4 + 0.0143481 * 4 - 0.0125894 * 0.7 * 4 - 0.133698 + 0.00638407 - 0.0507214 * 0.49 - 0.00841728 * 4 - 0.0317791 * 0.7 * 4 - 0.00410798 * 0.49 * 4 - 0.000606848 * 16 + 0.000690904 * 0.7 * 16 + 0.00421749 * 0.7 * 16 - 0.00146564 * 0.49 * 16, { rel: 1e-12 }, 'hand-expanded KT(J=0) for B4-70 P/D 1');
    },
  },
  {
    name: 'ITTC-1978 correction for the example propeller: c_0.75 = 3.065 m, t/c = 0.03524, ΔC_D = 0.000956',
    source: 'Holtrop & Mennen (1982) example (c_0.75 3.065 m, t/c 0.03524, ΔC_D 0.000956)',
    run: () => {
      const c = ittcCorrection(4, 0.7393, 8, 30e-6);
      assertClose(c.chord, 3.065, { abs: 2e-3 }, 'chord');
      assertClose(c.tc, 0.03524, { abs: 3e-5 }, 't/c');
      assertClose(c.dcd, 0.000956, { abs: 3e-6 }, 'ΔC_D');
    },
  },
  {
    name: 'Holtrop & Mennen example propeller (T 2172.75 kN, V_A 9.538 m/s, D 8 m): at the paper\'s point n = 1.6594 Hz, KT = 0.18802 the polynomials give P/D ≈ 1.037, KQ within 1.2 % of 0.033275 and η_O within 1.2 % of 0.6461; the design optimum (flat η curve) is within 2.5 % in rpm and 1.5 % in η_O',
    source: 'Holtrop & Mennen (1982) example, "From the B-series polynomials" block (KT 0.18802, n 1.6594 Hz, KQ 0.033275, η_O 0.6461)',
    run: () => {
      const corr = ittcCorrection(4, 0.7393, 8, 30e-6);
      const Jpaper = HM.va_m_s / (1.6594 * 8);
      let lo = 0.5;
      let hi = 1.4;
      for (let k = 0; k < 60; k += 1) {
        const mid = (lo + hi) / 2;
        if (openWater(Jpaper, mid, 0.7393, 4, corr).kt < 0.18802) lo = mid;
        else hi = mid;
      }
      const pdPaper = (lo + hi) / 2;
      const ow = openWater(Jpaper, pdPaper, 0.7393, 4, corr);
      assertClose(pdPaper, 1.037, { abs: 0.01 }, 'P/D at the paper point');
      assertClose(ow.kq, 0.033275, { rel: 1.2e-2 }, 'KQ');
      assertClose(ow.eta, 0.6461, { rel: 1.2e-2 }, 'η_O');
      const { outputs } = calculate(HM);
      assertClose(outputs.n_out_rpm / 60, 1.6594, { rel: 2.5e-2 }, 'optimum n');
      assertClose(outputs.eta_o, 0.6461, { rel: 1.5e-2 }, 'optimum η_O');
      assertEqual(outputs.eta_o >= ow.eta - 1e-6, true, 'optimum at least as efficient as the paper point on our curve');
      assertClose(outputs.thrust_out_n, 2172750, { rel: 1e-6 }, 'thrust identity');
      assertClose(outputs.eta_o, (outputs.j_out * outputs.kt) / (2 * Math.PI * outputs.kq), { rel: 1e-12 }, 'η identity');
      assertClose(outputs.delivered_power_w, outputs.thrust_power_w / outputs.eta_o, { rel: 1e-9 }, 'P_D = P_T/η_O');
    },
  },
  {
    name: 'Keller: K 0.2, Z 4, T 2172.75 kN, D 8 m, h 5.8 m, p0 − pv 99 047 Pa → A_E/A_0 = 0.7393 (the paper\'s value)',
    source: 'Keller formula as given in Holtrop & Mennen (1982) §4',
    run: () => {
      assertClose(kellerWithZ(2172750, 8, 5.8, 1025, 0.2, 4), 0.7393, { abs: 5e-4 }, 'Keller');
      const { outputs } = calculate(HM);
      assertClose(outputs.keller_ae_a0, 0.7393, { abs: 5e-4 }, 'output');
      assertEqual(outputs.keller_status.startsWith('OK'), true, 'status OK');
      const small = calculate({ ...HM, ae_a0: 0.55 });
      assertEqual(small.outputs.keller_status.startsWith('INSUFFICIENT'), true, 'insufficient');
    },
  },
  {
    name: 'Point mode at the design optimum returns the same KT, KQ and η_O; model-scale values have lower KT and higher KQ than full scale',
    source: 'Consistency between modes; ITTC-1978 sign convention (ΔKT > 0, ΔKQ < 0 for a smoother full-scale blade)',
    run: () => {
      const design = calculate(HM).outputs;
      const point = calculate({ ...HM, mode: 'point', pd_ratio: design.pd_out, n_rpm: design.n_out_rpm }).outputs;
      assertClose(point.kt, design.kt, { rel: 1e-9 }, 'KT');
      assertClose(point.kq, design.kq, { rel: 1e-9 }, 'KQ');
      assertClose(point.eta_o, design.eta_o, { rel: 1e-9 }, 'η_O');
      assertEqual(point.kt_model < point.kt, true, 'model KT lower');
      assertEqual(point.kq_model > point.kq, true, 'model KQ higher');
      const model = calculate({ ...HM, mode: 'point', pd_ratio: design.pd_out, n_rpm: design.n_out_rpm, scale: 'model' }).outputs;
      assertClose(model.kt, point.kt_model, { rel: 1e-12 }, 'model mode = polynomial');
      assertEqual(model.dcd, null, 'no ΔC_D at model scale');
    },
  },
  {
    name: 'B4-70 at P/D 1.0 (model scale): KT falls monotonically from J 0 to 0.9, KT(0) between 0.35 and 0.50, zero thrust near J ≈ 1.0–1.15, peak η_O between 0.60 and 0.72',
    source: 'Shape of the published B4-70 open-water diagram (van Lammeren et al. 1969; Bernitsas et al. 1981)',
    run: () => {
      let prev = ktPolynomial(0, 1, 0.7, 4);
      assertEqual(prev > 0.35 && prev < 0.5, true, 'KT(0)');
      let etaMax = 0;
      for (let J = 0.05; J <= 0.9; J += 0.05) {
        const kt = ktPolynomial(J, 1, 0.7, 4);
        assertEqual(kt < prev, true, `monotone at J ${J.toFixed(2)}`);
        prev = kt;
        etaMax = Math.max(etaMax, openWater(J, 1, 0.7, 4, null).eta);
      }
      const j0 = solveAdvanceCoefficient(0, 1, 0.7, 4, null);
      assertEqual(j0 > 1.0 && j0 < 1.15, true, 'zero-thrust J');
      assertEqual(etaMax > 0.6 && etaMax < 0.72, true, 'peak efficiency');
      assertEqual(kqPolynomial(0.5, 1, 0.7, 4) > 0, true, 'KQ positive');
    },
  },
  {
    name: 'Optimum search: a lighter loading (half the thrust) gives a higher optimum P/D and efficiency; a 2 m propeller for the same thrust is heavily loaded (η_O below 0.35, rpm far higher)',
    source: 'B-series behaviour: efficiency rises and the optimum pitch increases as thrust loading falls',
    run: () => {
      const K = 2172750 / (1025 * 9.538 ** 2 * 64);
      const heavy = optimumPitchRatio(K, 0.7393, 4, null);
      const light = optimumPitchRatio(K / 2, 0.7393, 4, null);
      assertEqual(light.eta > heavy.eta, true, 'lighter → higher η');
      assertEqual(light.pd > heavy.pd, true, 'lighter → higher P/D');
      const small = calculate({ ...HM, diameter_m: 2 }).outputs;
      assertEqual(small.eta_o < 0.35, true, 'heavily loaded small propeller');
      assertEqual(small.n_out_rpm > 300, true, 'high rpm');
    },
  },
  {
    name: 'Invalid inputs fail fast: fractional blade count, blade area outside 0.30–1.05, P/D outside 0.5–1.4',
    source: 'Validity ranges of the 1975 polynomials (Z 2–7, A_E/A_0 0.30–1.05, P/D 0.5–1.4)',
    run: () => {
      assertThrows(() => calculate({ ...HM, blades: 4.5 }), 'whole number', 'blades');
      assertThrows(() => calculate({ ...HM, ae_a0: 1.2 }), 'between', 'area');
      assertThrows(() => calculate({ ...HM, mode: 'point', pd_ratio: 1.6 }), 'between', 'P/D');
    },
  },
];
