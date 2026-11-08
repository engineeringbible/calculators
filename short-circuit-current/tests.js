/**
 * short-circuit-current/tests.js — checks against the IEC 60909-0 formulas and the textbook transformer case.
 * Run: node run-tests.js short-circuit-current
 */
import { calculate, peakFactor, thermalFactorM, VOLTAGE_FACTORS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const TX = { voltage_v: 400, c_select: 'lv_6', source_mode: 'infinite', network_mva: 250e6, hv_voltage_v: 11000, transformer_va: 1000e3, ukr_pct: 6, pkr_w: 10500, apply_kt: 'yes', cable_length_m: 0, cable_r_ohm_km: 0.1, cable_x_ohm_km: 0.08, cables_parallel: 1, theta_e_c: 160, frequency_hz: 50, duration_s: 1, breaker_icu_a: 36000, breaker_icm_a: 75600 };

export const tests = [
  {
    name: 'Transformer impedances: 1 000 kVA, 6 %, 10.5 kW at 400 V → Z_T = 0.06 × 400²/10⁶ = 9.60 mΩ, R_T = 10 500 × 400²/10¹² = 1.68 mΩ, X_T = 9.452 mΩ, x_T 0.0591, K_T = 0.95 × 1.05/(1 + 0.6 × 0.0591) = 0.963',
    source: 'IEC 60909-0 §6.3.2 eqs. 7–9 and eq. 12a (K_T)',
    run: () => {
      const { outputs } = calculate(TX);
      assertClose(outputs.z_transformer_ohm * 1000, 9.6, { rel: 1e-12 }, 'Z_T');
      assertClose(outputs.r_transformer_ohm * 1000, 1.68, { rel: 1e-12 }, 'R_T');
      assertClose(outputs.kt, (0.95 * 1.05) / (1 + 0.6 * (Math.sqrt(9.6 ** 2 - 1.68 ** 2) / 160)), { rel: 1e-9 }, 'K_T');
      assertClose(outputs.kt, 0.963, { abs: 1e-3 }, 'K_T value');
      assertEqual(calculate({ ...TX, apply_kt: 'no' }).outputs.kt, 1, 'K_T off');
    },
  },
  {
    name: 'Infinite source, fault at the terminals: I_k″ = 1.05 × 400/(√3 × 0.963 × 9.6 mΩ) = 26.2 kA (the classic I_r/u_k = 24.1 kA scaled by c_max and K_T); I_rT = 1 443 A; I_k″/I_rT = 18.2',
    source: 'IEC 60909-0 eq. 29 I_k″ = c U_n/(√3 Z_k); Schneider CT 158 transformer-only estimate I_r/u_k',
    run: () => {
      const { outputs } = calculate(TX);
      assertClose(outputs.transformer_rated_a, 1e6 / (Math.sqrt(3) * 400), { rel: 1e-12 }, 'I_rT');
      assertClose(outputs.transformer_rated_a, 1443.4, { abs: 0.1 }, 'I_rT value');
      assertClose(outputs.ik_max_a / 1000, (1.05 * 400) / (Math.sqrt(3) * outputs.z_total_ohm) / 1000, { rel: 1e-12 }, 'formula');
      assertClose(outputs.ik_max_a / 1000, 26.2, { abs: 0.1 }, 'I_k″ value');
      assertClose(outputs.ik_terminals_a, outputs.ik_max_a, { rel: 1e-12 }, 'terminals = fault (no cable)');
      const noKt = calculate({ ...TX, apply_kt: 'no' }).outputs;
      assertClose(noKt.ik_max_a / 1000, (1.05 * 1443.4) / 0.06 / 1000, { rel: 1e-3 }, 'without K_T: c × I_r/u_k = 25.3 kA');
    },
  },
  {
    name: 'Peak factor: R/X = 0.178 → κ = 1.02 + 0.98 e^(−0.533) = 1.595, i_p = 1.595 × √2 × 26.2 = 59 kA; κ → 2.0 for R/X → 0 and → 1.02 for R/X → ∞',
    source: 'IEC 60909-0 §4.3.1.1 eq. 55',
    run: () => {
      const { outputs } = calculate(TX);
      assertClose(outputs.rx_ratio, 1.68 / Math.sqrt(9.6 ** 2 - 1.68 ** 2), { rel: 1e-9 }, 'R/X');
      assertClose(outputs.kappa, peakFactor(outputs.rx_ratio), { rel: 1e-12 }, 'κ formula');
      assertClose(outputs.kappa, 1.595, { abs: 2e-3 }, 'κ value');
      assertClose(outputs.ip_a, outputs.kappa * Math.SQRT2 * outputs.ik_max_a, { rel: 1e-12 }, 'i_p');
      assertClose(outputs.ip_a / 1000, 59.1, { abs: 0.3 }, 'i_p value');
      assertClose(peakFactor(0), 2.0, { rel: 1e-12 }, 'κ max');
      assertClose(peakFactor(100), 1.02, { abs: 1e-9 }, 'κ min');
    },
  },
  {
    name: 'Thermal equivalent: m = (1/(2 f T_k ln(κ−1)))(e^(4 f T_k ln(κ−1)) − 1) = 0.0193 for κ 1.595, 50 Hz, 1 s → I_th = I_k″ √1.0193; m is larger for short durations (0.1 s → 0.19)',
    source: 'IEC 60909-0 §4.8 eq. 103 (m) with n = 1 for far-from-generator faults',
    run: () => {
      const { outputs } = calculate(TX);
      assertClose(outputs.m_factor, thermalFactorM(outputs.kappa, 50, 1), { rel: 1e-12 }, 'm formula');
      assertClose(outputs.m_factor, 0.0193, { abs: 5e-4 }, 'm value');
      assertClose(outputs.ith_a, outputs.ik_max_a * Math.sqrt(outputs.m_factor + 1), { rel: 1e-12 }, 'I_th');
      const short = calculate({ ...TX, duration_s: 0.1 }).outputs;
      assertEqual(short.m_factor > 0.15 && short.m_factor < 0.25, true, 'm at 0.1 s');
    },
  },
  {
    name: 'Network feeder: 250 MVA at the HV side → Z_Qt = 1.10 × 400²/250 MVA = 0.704 mΩ (X 0.700, R 0.070) in series, lowering I_k″ at the terminals to about 24.4 kA; an infinite source is the upper bound',
    source: 'IEC 60909-0 §6.2.2 eq. 5 with R_Q/X_Q = 0.1',
    run: () => {
      const net = calculate({ ...TX, source_mode: 'network' }).outputs;
      assertClose(net.z_network_ohm * 1000, (1.1 * 160000) / 250e6 * 1000, { rel: 1e-12 }, 'Z_Qt');
      assertClose(net.z_network_ohm * 1000, 0.704, { abs: 1e-3 }, 'value');
      assertEqual(net.ik_max_a < calculate(TX).outputs.ik_max_a, true, 'lower than infinite');
      assertClose(net.ik_max_a / 1000, 24.4, { abs: 0.3 }, 'I_k″ with network');
    },
  },
  {
    name: 'Cable: 50 m of 0.1 + j0.08 Ω/km adds 5 + j4 mΩ → Z_k = 6.62 + j13.10 = 14.68 mΩ, I_k″ at the fault 16.5 kA (vs 26.2 at the terminals); two parallel cables halve the cable impedance; minimum current with c_min 0.95 and copper at 160 °C (R × 1.56) is 13.6 kA',
    source: 'IEC 60909-0 §2.3.2.4 conductor temperature factor 1 + 0.004 (θ_e − 20); series impedance',
    run: () => {
      const cab = calculate({ ...TX, cable_length_m: 50 }).outputs;
      assertClose(cab.z_cable_ohm * 1000, Math.hypot(5, 4), { rel: 1e-9 }, 'Z_cable');
      assertClose(cab.r_total_ohm * 1000, 0.963 * 1.68 + 5, { abs: 2e-3 }, 'R_k');
      assertClose(cab.ik_max_a / 1000, (1.05 * 400) / (Math.sqrt(3) * cab.z_total_ohm) / 1000, { rel: 1e-12 }, 'I_k″ formula');
      assertClose(cab.ik_max_a / 1000, 16.5, { abs: 0.1 }, 'I_k″ at fault');
      const two = calculate({ ...TX, cable_length_m: 50, cables_parallel: 2 }).outputs;
      assertClose(two.z_cable_ohm, cab.z_cable_ohm / 2, { rel: 1e-12 }, 'parallel');
      const rMin = (0.963 * 1.68 + 5 * (1 + 0.004 * 140)) / 1000;
      const zMin = Math.hypot(rMin, cab.x_total_ohm);
      assertClose(cab.ik_min_a, (0.95 * 400) / (Math.sqrt(3) * zMin), { rel: 2e-3 }, 'I_k,min');
      assertClose(cab.ik_min_a / 1000, 13.6, { abs: 0.1 }, 'I_k,min value');
    },
  },
  {
    name: 'Voltage factors (Table 1): LV +6 % 1.05/0.95, LV +10 % 1.10/0.95, MV 1.10/1.00; breaker check passes for a 36 kA / 75.6 kA breaker at 26.2 / 59.1 kA and fails for 25 kA; with K_T applied c_max cancels out of the transformer-only I_k″ (K_T ∝ c_max), without K_T c 1.10 gives 4.8 % more',
    source: 'IEC 60909-0 Table 1 and eq. 12a; IEC 60947-2 I_cu and I_cm',
    run: () => {
      assertEqual(VOLTAGE_FACTORS.lv_6.cmax === 1.05 && VOLTAGE_FACTORS.lv_6.cmin === 0.95, true, 'LV 6 %');
      assertEqual(VOLTAGE_FACTORS.lv_10.cmax === 1.1 && VOLTAGE_FACTORS.mv.cmin === 1.0, true, 'LV 10 % / MV');
      const ok = calculate(TX).outputs;
      assertEqual(ok.breaker_check.includes('OK') && !ok.breaker_check.includes('INSUFFICIENT'), true, 'OK');
      const weak = calculate({ ...TX, breaker_icu_a: 25000 }).outputs;
      assertEqual(weak.breaker_check.includes('INSUFFICIENT'), true, 'insufficient');
      const lv10 = calculate({ ...TX, c_select: 'lv_10' }).outputs;
      assertClose(lv10.ik_max_a, ok.ik_max_a, { rel: 1e-9 }, 'c_max cancels with K_T (transformer only)');
      const lv10NoKt = calculate({ ...TX, c_select: 'lv_10', apply_kt: 'no' }).outputs;
      const lv6NoKt = calculate({ ...TX, apply_kt: 'no' }).outputs;
      assertClose(lv10NoKt.ik_max_a / lv6NoKt.ik_max_a, 1.1 / 1.05, { rel: 1e-9 }, 'without K_T the ratio is 1.10/1.05');
    },
  },
  {
    name: 'Invalid inputs fail fast: load losses implying R_T ≥ Z_T, fractional parallel cables, unknown voltage-factor class',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...TX, pkr_w: 80000 }), 'R_T ≥ Z_T', 'losses');
      assertThrows(() => calculate({ ...TX, cables_parallel: 1.5 }), 'whole number', 'cables');
      assertThrows(() => calculate({ ...TX, c_select: 'hv' }), 'must be one of', 'c');
    },
  },
];
