/**
 * hull-roughness-penalty/tests.js — checks against the production roughness-allowance pins and hand-computed resistance.
 * Run: node run-tests.js hull-roughness-penalty
 */
import { calculate, CONDITIONS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const V_MS = 6.5;
const KN = V_MS * 3600 / 1852;
const SHIP = { lpp_m: 180, wetted_surface_m2: 5500, speed_kn: KN, water_temp_c: 15, salinity_g_kg: 35, form_factor: 1.2, allowance_method: 'iso15016', ks_clean_um: 150, condition: 'heavy_slime', resistance_mode: 'power', delivered_power_kw: 3200, eta_d: 0.68, sfoc_g_kwh: 175, fuel_price: 550, co2_factor: 3.114, sea_days_per_year: 250 };
const Q_S = 0.5 * 1025.9 * 5500 * V_MS * V_MS;

export const tests = [
  {
    name: 'Friction and allowance pins: L 180 m at 6.5 m/s in 15 °C sea water → Re 9.846e8, C_F 1.5336e-3, ΔC_F 9.677e-5 (150 µm), 3.400e-4 (600 µm), 1.3616e-3 (10 000 µm)',
    source: 'ISO 15016:2025 E.5–E.7 as implemented in atlas_physics (pins 2026-10-31); ITTC 7.5-02-01-03 water properties',
    run: () => {
      const { outputs } = calculate(SHIP);
      assertClose(outputs.reynolds, 6.5 * 180 / 1.1883e-6, { rel: 1e-9 }, 'Re');
      assertClose(outputs.cf, 1.533564e-3, { rel: 1e-6 }, 'C_F');
      assertClose(outputs.dcf_clean, 9.677369e-5, { rel: 1e-6 }, '150 µm');
      assertClose(outputs.dcf_fouled, 3.399905e-4, { rel: 1e-6 }, '600 µm');
      assertClose(calculate({ ...SHIP, condition: 'heavy_calcareous' }).outputs.dcf_fouled, 1.361632e-3, { rel: 1e-6 }, '10 000 µm');
    },
  },
  {
    name: 'Heavy slime penalty: ½ρSV² = 119.20 MN, ΔC_F increase 2.432e-4 → ΔR 28.99 kN; clean viscous resistance 219.4 kN; R_T from 3 200 kW and η_D 0.68 = 334.8 kN → ΔP/P 8.66 %, 277 kW, 1.164 t/day, 291 t/yr, 160 k/yr, 906 t CO₂/yr',
    source: 'ITTC-78 resistance decomposition; Schultz (2007) heavy slime 10–20 % band; arithmetic',
    run: () => {
      const { outputs } = calculate(SHIP);
      assertClose(Q_S, 119196756.25, { rel: 1e-9 }, 'q S');
      assertClose(outputs.dcf_increase, 3.399905e-4 - 9.677369e-5, { rel: 1e-6 }, 'ΔC_F increase');
      assertClose(outputs.added_resistance_n, Q_S * (3.399905e-4 - 9.677369e-5), { rel: 1e-6 }, 'ΔR formula');
      assertClose(outputs.added_resistance_n / 1000, 28.99, { abs: 0.01 }, 'ΔR value');
      assertClose(outputs.viscous_resistance_n, Q_S * 1.533564e-3 * 1.2, { rel: 1e-6 }, 'R_V');
      assertClose(outputs.total_resistance_n, (3200e3 * 0.68) / 6.5, { rel: 1e-12 }, 'R_T');
      assertClose(outputs.power_increase_pct, 8.66, { abs: 0.01 }, 'ΔP/P');
      assertClose(outputs.added_power_w / 1000, 3200 * 0.0866, { rel: 2e-3 }, 'ΔP');
      assertClose(outputs.extra_fuel_t_day, (outputs.added_power_w / 1000) * 175 * 24 / 1e6, { rel: 1e-12 }, 'fuel/day');
      assertClose(outputs.extra_fuel_t_day, 1.164, { abs: 0.002 }, 'fuel value');
      assertClose(outputs.extra_fuel_t_year, outputs.extra_fuel_t_day * 250, { rel: 1e-12 }, 'fuel/yr');
      assertClose(outputs.extra_cost_year, outputs.extra_fuel_t_year * 550, { rel: 1e-12 }, 'cost');
      assertClose(outputs.extra_co2_t_year, outputs.extra_fuel_t_year * 3.114, { rel: 1e-12 }, 'CO₂');
    },
  },
  {
    name: 'Speed loss at constant power: ΔV/V = 1 − (1.0866)^(−1/3) = 2.73 %; the cubic law gives ΔP/P ≈ 3 ΔV/V for small penalties',
    source: 'Cubic speed-power law (ISO 19030-2 speed-loss indicator logic)',
    run: () => {
      const { outputs } = calculate(SHIP);
      assertClose(outputs.speed_loss_pct, (1 - (1 + outputs.power_increase_pct / 100) ** (-1 / 3)) * 100, { rel: 1e-12 }, 'formula');
      assertClose(outputs.speed_loss_pct, 2.73, { abs: 0.01 }, 'value');
      assertClose(outputs.power_increase_pct / outputs.speed_loss_pct, 3.17, { abs: 0.05 }, '≈ 3 ratio');
    },
  },
  {
    name: 'Viscous-share mode: R_T = (219.4 + 11.5 kN)/0.8 = 288.6 kN, delivered power 2 759 kW, ΔP/P 10.0 % — flagged as an estimate',
    source: 'Resistance decomposition with an assumed viscous share',
    run: () => {
      const r = calculate({ ...SHIP, resistance_mode: 'share', viscous_share: 0.8 });
      const rClean = Q_S * 1.533564e-3 * 1.2 + Q_S * 9.677369e-5;
      assertClose(r.outputs.total_resistance_n, rClean / 0.8, { rel: 1e-6 }, 'R_T');
      assertClose(r.outputs.power_increase_pct, (Q_S * (3.399905e-4 - 9.677369e-5)) / (rClean / 0.8) * 100, { rel: 1e-6 }, 'ΔP/P');
      assertClose(r.outputs.added_power_w, (rClean / 0.8) * 6.5 / 0.68 * (r.outputs.power_increase_pct / 100), { rel: 1e-6 }, 'ΔP from R_T V/η_D');
      assertEqual(r.warnings.some((w) => w.includes('viscous share')), true, 'estimate warning');
    },
  },
  {
    name: 'ITTC-78 allowance and the condition table: 150 µm → 3.481e-4, 600 µm → 9.285e-4 with the 1978 formula; custom 600 µm equals the heavy-slime preset; Schultz table 150/300/600/1 000/3 000/10 000 µm',
    source: 'ITTC 7.5-02-03-01.4 (1978) ΔC_F = [105 (k_s/L)^(1/3) − 0.64]·10⁻³; Schultz 2007 Table 1',
    run: () => {
      const r = calculate({ ...SHIP, allowance_method: 'ittc78' });
      assertClose(r.outputs.dcf_clean, (105 * (150e-6 / 180) ** (1 / 3) - 0.64) * 1e-3, { rel: 1e-12 }, '150 µm');
      assertClose(r.outputs.dcf_fouled, (105 * (600e-6 / 180) ** (1 / 3) - 0.64) * 1e-3, { rel: 1e-12 }, '600 µm');
      assertClose(r.outputs.dcf_fouled, 9.285e-4, { abs: 1e-6 }, '600 µm value');
      const custom = calculate({ ...SHIP, condition: 'custom', ks_custom_um: 600 });
      assertClose(custom.outputs.added_resistance_n, calculate(SHIP).outputs.added_resistance_n, { rel: 1e-12 }, 'custom = preset');
      assertEqual([150, 300, 600, 1000, 3000, 10000].every((v, k) => Object.values(CONDITIONS)[k].ks_um === v), true, 'table');
    },
  },
  {
    name: 'Credit and validation: a 100 µm hull against a 150 µm reference gives a negative penalty with a warning; zero wetted surface, unknown condition and η_D above 1 are rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      const smooth = calculate({ ...SHIP, condition: 'custom', ks_custom_um: 100 });
      assertEqual(smooth.outputs.added_resistance_n < 0, true, 'negative');
      assertEqual(smooth.warnings.some((w) => w.includes('smoother than the clean reference')), true, 'warning');
      assertThrows(() => calculate({ ...SHIP, wetted_surface_m2: 0 }), 'greater than zero', 'S');
      assertThrows(() => calculate({ ...SHIP, condition: 'barnacles' }), 'must be one of', 'condition');
      assertThrows(() => calculate({ ...SHIP, eta_d: 1.2 }), 'between', 'η_D');
    },
  },
  {
    name: 'A roughness credit larger than the whole resistance (smoother "fouled" hull and a tiny power) is rejected instead of a NaN speed loss',
    source: 'Range fuzzing (fuzz.js): (1 + ΔP/P)^(−1/3) needs ΔP/P > −1',
    run: () => {
      assertThrows(() => calculate({ condition: 'custom', ks_custom_um: 10, ks_clean_um: 1000, resistance_mode: 'power', delivered_power_kw: 20 }), 'exceeds the total resistance');
    },
  },
];
