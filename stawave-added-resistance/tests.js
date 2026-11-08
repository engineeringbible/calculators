/**
 * stawave-added-resistance/tests.js — checks of Formula D.31, its scaling and the direction gate.
 * Run: node run-tests.js stawave-added-resistance
 */
import { calculate, stawave1 } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const CASE = { beam_m: 32, lbwl_m: 40, hs_m: 2, wave_dir_deg: 0, water_temp_c: 15, salinity_g_kg: 35, speed_kn: 12, eta_d: 0.7, delivered_power_kw: 5000 };

export const tests = [
  {
    name: 'Formula D.31: B 32 m, L_BWL 40 m, H_1/3 2 m, ρ 1025.9 → R_AW = 1/16 × 1025.9 × 9.80665 × 4 × 32 × √0.8 = 71.99 kN',
    source: 'ISO 15016:2025 D.5 Formula (D.31); ITTC water density at 15 °C',
    run: () => {
      const { outputs } = calculate(CASE);
      assertClose(outputs.rho, 1025.9, { rel: 1e-12 }, 'ρ');
      assertClose(outputs.r_aw_n, (1025.9 * 9.80665 * 4 * 32 * Math.sqrt(0.8)) / 16, { rel: 1e-12 }, 'formula');
      assertClose(outputs.r_aw_n / 1000, 71.99, { abs: 0.01 }, 'value');
      assertClose(stawave1(1025.9, 2, 32, 40), outputs.r_aw_n, { rel: 1e-12 }, 'helper');
      assertClose(outputs.beam_ratio, Math.sqrt(0.8), { rel: 1e-12 }, '√(B/L_BWL)');
    },
  },
  {
    name: 'Scaling: R_AW ∝ H² (3 m gives 2.25 × the 2 m value) and ∝ B^1.5 at fixed L_BWL; a longer bow (L_BWL 80 m) lowers it by 1/√2; R_AW/H² = 18.0 kN/m²',
    source: 'Structure of Formula D.31',
    run: () => {
      const base = calculate(CASE).outputs.r_aw_n;
      assertClose(calculate({ ...CASE, hs_m: 3 }).outputs.r_aw_n, base * 2.25, { rel: 1e-12 }, 'H²');
      assertClose(calculate({ ...CASE, beam_m: 64 }).outputs.r_aw_n, base * 2 ** 1.5, { rel: 1e-12 }, 'B^1.5');
      assertClose(calculate({ ...CASE, lbwl_m: 80 }).outputs.r_aw_n, base / Math.SQRT2, { rel: 1e-12 }, 'L_BWL');
      assertClose(calculate(CASE).outputs.r_aw_per_hs2, base / 1000 / 4, { rel: 1e-12 }, 'per H²');
      assertClose(calculate(CASE).outputs.r_aw_per_hs2, 18.0, { abs: 0.01 }, 'per H² value');
    },
  },
  {
    name: 'Power equivalent: 71.99 kN × 6.173 m/s / 0.70 = 634.9 kW = 12.7 % of 5 000 kW',
    source: 'ΔP = R_AW V_S/η_D at constant speed',
    run: () => {
      const { outputs } = calculate(CASE);
      const v = 12 * 1852 / 3600;
      assertClose(outputs.power_increase_w, (outputs.r_aw_n * v) / 0.7, { rel: 1e-12 }, 'ΔP');
      assertClose(outputs.power_increase_w / 1000, 634.9, { abs: 0.2 }, 'value');
      assertClose(outputs.power_increase_pct, (outputs.power_increase_w / 5e6) * 100, { rel: 1e-12 }, '%');
      assertClose(outputs.power_increase_pct, 12.7, { abs: 0.05 }, '% value');
    },
  },
  {
    name: 'Direction gate: 45° is still inside the bow sector; 46° and following seas (180°) give zero with a warning',
    source: 'ISO 15016:2025 D.5 — bow sector ±45°, no correction outside',
    run: () => {
      assertClose(calculate({ ...CASE, wave_dir_deg: 45 }).outputs.r_aw_n, calculate(CASE).outputs.r_aw_n, { rel: 1e-12 }, '45° inside');
      const out = calculate({ ...CASE, wave_dir_deg: 46 });
      assertEqual(out.outputs.r_aw_n, 0, 'zero at 46°');
      assertEqual(out.warnings.some((w) => w.includes('outside the bow sector')), true, 'warning');
      assertEqual(calculate({ ...CASE, wave_dir_deg: 180 }).outputs.r_aw_n, 0, 'following');
      assertEqual(out.outputs.applicability.startsWith('Outside'), true, 'text');
    },
  },
  {
    name: 'Water properties and limits: 25 °C gives ρ 1023.2 and 0.26 % less resistance; H_1/3 4 m is flagged as beyond trial sea states; zero breadth and a 200° direction are rejected',
    source: 'ITTC 7.5-02-01-03; ISO 15016 trial limits; validation contract',
    run: () => {
      const warm = calculate({ ...CASE, water_temp_c: 25 });
      assertClose(warm.outputs.rho, 1023.2, { rel: 1e-12 }, 'ρ 25 °C');
      assertClose(warm.outputs.r_aw_n / calculate(CASE).outputs.r_aw_n, 1023.2 / 1025.9, { rel: 1e-12 }, 'ratio');
      assertEqual(calculate({ ...CASE, hs_m: 4 }).warnings.some((w) => w.includes('above 3 m')), true, 'H warning');
      assertThrows(() => calculate({ ...CASE, beam_m: 0 }), 'greater than zero', 'B');
      assertThrows(() => calculate({ ...CASE, wave_dir_deg: 200 }), 'between', 'direction');
    },
  },
];
