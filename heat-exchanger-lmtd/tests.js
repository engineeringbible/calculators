/**
 * heat-exchanger-lmtd/tests.js — checks against Incropera's worked example, the Bowman F charts and the ε-NTU relation.
 * Run: node run-tests.js heat-exchanger-lmtd
 */
import { calculate, logMeanTemperatureDifference, correctionFactorShell1Pass } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** Incropera & DeWitt, Fundamentals of Heat and Mass Transfer, Example 11.1: oil 100→60 °C, water 30→40.2 °C, counterflow. */
const INCROPERA_11_1 = { arrangement: 'counterflow', th_in_c: 100, th_out_c: 60, tc_in_c: 30, tc_out_c: 40.2, duty_basis: 'hot', m_hot_kg_s: 0.1, cp_hot_j_kgk: 2131, u_w_m2k: 38.1 };

export const tests = [
  {
    name: 'Incropera Example 11.1: q = 8 524 W, ΔT_lm = 43.2 °C, area 5.18 m² (tube length 65.9 m on Ø25 mm)',
    source: 'Incropera, DeWitt, Bergman & Lavine, Fundamentals of Heat and Mass Transfer, 6th ed., Example 11.1 (counterflow oil cooler)',
    run: () => {
      const { outputs } = calculate(INCROPERA_11_1);
      assertClose(outputs.duty_out_w, 8524, { rel: 1e-9 }, 'duty');
      assertClose(outputs.dt1_k, 59.8, { rel: 1e-9 }, 'ΔT₁');
      assertClose(outputs.dt2_k, 30, { rel: 1e-9 }, 'ΔT₂');
      assertClose(outputs.lmtd_k, 43.2, { abs: 0.05 }, 'LMTD');
      assertEqual(outputs.f_factor, 1, 'F counterflow');
      assertClose(outputs.area_m2, 5.18, { abs: 0.01 }, 'area');
      assertClose(outputs.area_m2 / (Math.PI * 0.025), 65.9, { abs: 0.1 }, 'tube length');
    },
  },
  {
    name: 'Same temperatures in parallel flow: ΔT₁ = 70, ΔT₂ = 19.8, LMTD = 39.75 K (lower than counterflow)',
    source: 'Parallel-flow LMTD definition, Incropera §11.3; value computed by hand: (70 − 19.8)/ln(70/19.8)',
    run: () => {
      const { outputs } = calculate({ ...INCROPERA_11_1, arrangement: 'parallel' });
      assertClose(outputs.dt1_k, 70, { rel: 1e-9 }, 'ΔT₁');
      assertClose(outputs.dt2_k, 19.8, { rel: 1e-9 }, 'ΔT₂');
      assertClose(outputs.lmtd_k, 39.753, { abs: 2e-3 }, 'LMTD');
      assertEqual(outputs.lmtd_k < calculate(INCROPERA_11_1).outputs.lmtd_k, true, 'parallel LMTD below counterflow LMTD');
    },
  },
  {
    name: 'Equal terminal differences: 100→60 against 20→60 counterflow gives LMTD = 40 K (limit of the log mean)',
    source: 'Limit of (ΔT₁ − ΔT₂)/ln(ΔT₁/ΔT₂) as ΔT₁ → ΔT₂ (Incropera §11.3)',
    run: () => {
      assertClose(logMeanTemperatureDifference(40, 40), 40, { rel: 1e-12 }, 'helper');
      assertClose(logMeanTemperatureDifference(40, 40 + 1e-12), 40, { rel: 1e-9 }, 'near-equal');
      const { outputs } = calculate({ ...INCROPERA_11_1, tc_in_c: 20, tc_out_c: 60 });
      assertClose(outputs.lmtd_k, 40, { rel: 1e-9 }, 'LMTD');
    },
  },
  {
    name: 'Bowman F for 1 shell pass: R = 1, P = 0.5 → F = 0.802; R = 2, P = 0.1 → F = 0.995; P → 0 gives F → 1',
    source: 'Bowman, Mueller & Nagle, Trans. ASME 62 (1940); chart reproduced as Incropera Fig. 11.10 (R = 1, P = 0.5 reads ≈ 0.80)',
    run: () => {
      assertClose(correctionFactorShell1Pass(100, 60, 20, 60), 0.8023, { abs: 1e-3 }, 'F(R=1, P=0.5)');
      assertClose(correctionFactorShell1Pass(100, 84, 20, 28), 0.9954, { abs: 1e-3 }, 'F(R=2, P=0.1)');
      assertClose(correctionFactorShell1Pass(100, 99, 20, 20.5), 1.0, { abs: 1e-3 }, 'F → 1 for tiny P');
      const { outputs } = calculate({ ...INCROPERA_11_1, arrangement: 'shell_1_2', tc_in_c: 20, tc_out_c: 60 });
      assertClose(outputs.f_factor, 0.8023, { abs: 1e-3 }, 'F in calculate()');
      assertClose(outputs.effective_dt_k, 0.8023 * 40, { abs: 0.05 }, 'F × LMTD');
    },
  },
  {
    name: 'Effectiveness and NTU from temperatures: ε = 40/70 = 0.5714, NTU = 0.926, C_r = 0.255 — consistent with the counterflow ε-NTU relation',
    source: 'ε-NTU method, Incropera §11.4, Table 11.3 counterflow: ε = [1 − exp(−NTU(1 − C_r))] / [1 − C_r exp(−NTU(1 − C_r))]',
    run: () => {
      const { outputs } = calculate(INCROPERA_11_1);
      assertClose(outputs.effectiveness, 40 / 70, { rel: 1e-9 }, 'ε');
      assertClose(outputs.capacity_ratio, 10.2 / 40, { rel: 1e-9 }, 'C_r');
      assertClose(outputs.ntu, 0.926, { abs: 2e-3 }, 'NTU');
      const x = Math.exp(-outputs.ntu * (1 - outputs.capacity_ratio));
      const epsilonFromNtu = (1 - x) / (1 - outputs.capacity_ratio * x);
      assertClose(epsilonFromNtu, outputs.effectiveness, { rel: 1e-6 }, 'ε-NTU consistency');
    },
  },
  {
    name: 'Fouling: U = 1 000 with R_f = 0.0005 m²·K/W gives U_service = 666.7 and 1.5 × the clean area',
    source: '1/U_service = 1/U_clean + R_f — TEMA Standards, 10th ed., §RGP-T-2.4 (fouling resistances)',
    run: () => {
      const { outputs } = calculate({ ...INCROPERA_11_1, u_w_m2k: 1000, fouling_m2k_w: 0.0005 });
      assertClose(outputs.u_service_w_m2k, 666.667, { abs: 1e-3 }, 'U service');
      assertClose(outputs.area_m2 / outputs.area_clean_m2, 1.5, { rel: 1e-9 }, 'area ratio');
    },
  },
  {
    name: 'Duty from the cold stream or given directly reproduces the hot-stream duty (energy balance)',
    source: 'Energy balance q = ṁ_h c_p,h ΔT_h = ṁ_c c_p,c ΔT_c, Incropera eq. 11.6–11.7 (water outlet 40.2 °C from Example 11.1)',
    run: () => {
      const cold = calculate({ ...INCROPERA_11_1, duty_basis: 'cold', m_cold_kg_s: 0.2, cp_cold_j_kgk: 4178 }).outputs;
      assertClose(cold.duty_out_w, 8524, { rel: 2e-3 }, 'cold-side duty (40.2 °C is rounded)');
      const given = calculate({ ...INCROPERA_11_1, duty_basis: 'given', duty_w: 8524 }).outputs;
      assertClose(given.area_m2, calculate(INCROPERA_11_1).outputs.area_m2, { rel: 1e-12 }, 'given duty');
    },
  },
  {
    name: 'Unit layer: 100 °C = 212 °F, 20 °C = 293.15 K, a 10 K difference = 18 °F',
    source: 'Temperature scale definitions (BIPM SI Brochure, 9th ed.)',
    run: () => {
      assertClose(convert(100, 'C', 'F', 'temperature'), 212, { rel: 1e-12 }, '°C → °F');
      assertClose(convert(20, 'C', 'K', 'temperature'), 293.15, { rel: 1e-12 }, '°C → K');
      assertClose(convert(10, 'K', 'F', 'temperature_difference'), 18, { rel: 1e-12 }, 'ΔK → Δ°F');
      assertClose(convert(1, 'btu_hft2F', 'W_m2K', 'heat_transfer_coefficient'), 5.678263, { rel: 1e-6 }, 'U unit');
    },
  },
  {
    name: 'Invalid inputs fail fast: parallel flow with a temperature cross, hot fluid warming up, one-shell cross too deep',
    source: 'Second law: parallel flow cannot cross; Bowman F undefined beyond the achievable P for given R',
    run: () => {
      assertThrows(() => calculate({ ...INCROPERA_11_1, arrangement: 'parallel', tc_out_c: 65 }), 'Parallel flow cannot', 'parallel cross');
      assertThrows(() => calculate({ ...INCROPERA_11_1, th_out_c: 110 }), 'Hot fluid must cool', 'hot warming');
      assertThrows(() => calculate({ ...INCROPERA_11_1, arrangement: 'shell_1_2', tc_in_c: 20, tc_out_c: 95, th_out_c: 25 }), 'not achievable with one shell pass', 'deep cross');
    },
  },
];
