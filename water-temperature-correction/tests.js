/**
 * water-temperature-correction/tests.js — checks against the production Annex E implementation and the term structure.
 * Run: node run-tests.js water-temperature-correction
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const KN = 6.5 * 3600 / 1852;
const CASE = { lpp_m: 180, wetted_surface_m2: 5500, speed_kn: KN, sst_c: 25, density_mode: 'table', salinity_g_kg: 35, ks_um: 150, ref_mode: 'power', ref_power_kw: 8000, eta_d: 0.7 };
const R_TREF = (8000e3 * 0.7) / 6.5;

export const tests = [
  {
    name: 'Production pins (L_PP 180 m, S 5 500 m², 6.5 m/s, R_Tref 861.5 kN): R_AS = +2 683.0 N at 5 °C, −84.0 N at 15 °C, −3 578.9 N at 25 °C, −5 413.0 N at 30 °C',
    source: 'atlas_physics.temperature_resistance.compute_ras_vectorized (ISO 15016:2025 Annex E), values computed 2026-10-31',
    run: () => {
      assertClose(calculate(CASE).outputs.r_tref_n, R_TREF, { rel: 1e-12 }, 'R_Tref');
      assertClose(calculate({ ...CASE, sst_c: 5 }).outputs.r_as_n, 2683.009, { rel: 1e-6 }, '5 °C');
      assertClose(calculate({ ...CASE, sst_c: 15 }).outputs.r_as_n, -83.9706, { rel: 1e-5 }, '15 °C seam');
      assertClose(calculate({ ...CASE, sst_c: 25 }).outputs.r_as_n, -3578.903, { rel: 1e-6 }, '25 °C');
      assertClose(calculate({ ...CASE, sst_c: 30 }).outputs.r_as_n, -5412.964, { rel: 1e-6 }, '30 °C');
    },
  },
  {
    name: 'Term structure at 25 °C: density term R_Tref (1023.2/1026 − 1) = −2 351.1 N, friction term −1 227.8 N, sum = R_AS; R_AS = −0.415 % of R_Tref',
    source: 'ISO 15016:2025 E.1 decomposition',
    run: () => {
      const { outputs } = calculate(CASE);
      assertClose(outputs.rho_act, 1023.2, { rel: 1e-12 }, 'ρ');
      assertClose(outputs.density_term_n, R_TREF * (1023.2 / 1026 - 1), { rel: 1e-12 }, 'density term');
      assertClose(outputs.density_term_n, -2351.1, { abs: 0.1 }, 'density value');
      assertClose(outputs.density_term_n + outputs.friction_term_n, outputs.r_as_n, { rel: 1e-12 }, 'sum');
      assertClose(outputs.friction_term_n, -1227.8, { abs: 0.1 }, 'friction value');
      assertClose(outputs.r_as_pct, (outputs.r_as_n / R_TREF) * 100, { rel: 1e-12 }, '%');
      assertClose(outputs.r_as_pct, -0.4154, { abs: 1e-3 }, '% value');
    },
  },
  {
    name: 'Friction detail: ν 0.9425e-6 → Re_act 1.2414e9 against Re_ref 9.846e8; C_F + ΔC_F 1.6200e-3 actual vs 1.6303e-3 reference; R_Fact = ½ × 1023.2 × 5 500 × 6.5² × 1.6200e-3 = 192.6 kN',
    source: 'ISO 15016:2025 E.2, E.5–E.7; ITTC viscosity at 25 °C',
    run: () => {
      const { outputs } = calculate(CASE);
      assertClose(outputs.nu_act, 0.9425e-6, { rel: 1e-12 }, 'ν');
      assertClose(outputs.reynolds_act, 6.5 * 180 / 0.9425e-6, { rel: 1e-12 }, 'Re act');
      assertClose(outputs.reynolds_ref, 6.5 * 180 / 1.1883e-6, { rel: 1e-12 }, 'Re ref');
      assertClose(outputs.cf_total_act, 1.6200e-3, { rel: 1e-4 }, 'C_F act');
      assertClose(outputs.cf_total_ref, 1.6303e-3, { rel: 1e-4 }, 'C_F ref');
      assertClose(outputs.r_fact_n, 0.5 * 1023.2 * 5500 * 6.5 * 6.5 * outputs.cf_total_act, { rel: 1e-12 }, 'R_Fact');
      assertClose(outputs.r_fact_n / 1000, 192.6, { abs: 0.2 }, 'R_Fact value');
    },
  },
  {
    name: 'Power equivalent and sign: ΔP_AS = −3 578.9 × 6.5/0.7 = −33.2 kW at 25 °C (corrected power higher than measured); +24.9 kW at 5 °C; the sign note follows',
    source: 'ISO 15016:2025 clause 13 (corrections on speed through water); Annex E sign convention',
    run: () => {
      const warm = calculate(CASE).outputs;
      assertClose(warm.power_correction_w, (warm.r_as_n * 6.5) / 0.7, { rel: 1e-12 }, 'ΔP');
      assertClose(warm.power_correction_w / 1000, -33.23, { abs: 0.02 }, 'warm value');
      assertEqual(warm.sign_note.startsWith('Water warmer'), true, 'warm note');
      const cold = calculate({ ...CASE, sst_c: 5 }).outputs;
      assertClose(cold.power_correction_w / 1000, 24.91, { abs: 0.02 }, 'cold value');
      assertEqual(cold.sign_note.startsWith('Water colder'), true, 'cold note');
    },
  },
  {
    name: 'Resistance mode and measured density: entering R_Tref 861.538 kN reproduces the power mode; a measured density of 1023.2 at 25 °C equals the table result; salinity 38 makes the density term less negative',
    source: 'E.4 equivalence; EOS haline slope',
    run: () => {
      const direct = calculate({ ...CASE, ref_mode: 'resistance', ref_resistance_kn: R_TREF / 1000 }).outputs;
      assertClose(direct.r_as_n, calculate(CASE).outputs.r_as_n, { rel: 1e-9 }, 'resistance mode');
      const measured = calculate({ ...CASE, density_mode: 'measured', rho_measured: 1023.2 }).outputs;
      assertClose(measured.r_as_n, calculate(CASE).outputs.r_as_n, { rel: 1e-9 }, 'measured density');
      const salty = calculate({ ...CASE, salinity_g_kg: 38 }).outputs;
      assertClose(salty.rho_act, 1023.2 + 3 * 0.77, { rel: 1e-12 }, 'ρ at 38');
      assertEqual(salty.density_term_n > calculate(CASE).outputs.density_term_n, true, 'less negative');
    },
  },
  {
    name: 'Validation: zero wetted surface, η_D above 1 and an unknown reference mode are rejected; a 3 % correction is flagged',
    source: 'Validation contract; plausibility warning',
    run: () => {
      assertThrows(() => calculate({ ...CASE, wetted_surface_m2: 0 }), 'greater than zero', 'S');
      assertThrows(() => calculate({ ...CASE, eta_d: 1.5 }), 'between', 'η_D');
      assertThrows(() => calculate({ ...CASE, ref_mode: 'guess' }), 'must be one of', 'mode');
      assertEqual(calculate({ ...CASE, density_mode: 'measured', rho_measured: 990 }).warnings.some((w) => w.includes('above 3 %')), true, 'plausibility');
    },
  },
];
