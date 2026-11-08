/**
 * wind-resistance/tests.js — pinned to the production atlas_physics Fujiwara implementation, and formula C.1/C.2 checks.
 * Run: node run-tests.js wind-resistance
 */
import { calculate, fujiwaraCoefficient, airDensity } from './calc.js';
import { assertClose, assertThrows } from '../shared/test-runner.js';

const KN = 1852 / 3600;
const SHIP_A = { loa: 200, beam: 32, aod: 800, axv: 600, alv: 1200, cmc: 10, hbr: 25, hc: 15 };
const SHIP_B = { loa: 300, beam: 48, aod: 1500, axv: 1100, alv: 3800, cmc: -20, hbr: 42, hc: 18 };

export const tests = [
  {
    name: 'Pinned to production, ship A (200 m × 32 m): C_AA 0.76884 at 0°, 0.95105 at 30°, 0.62042 at 60°, 0.31477 at exactly 90°, 0.66351 at 120°, −0.20705 at 150°, −0.27906 at 180°; 330° equals 30°',
    source: 'atlas_physics.fujiwara_wind.calculate_fujiwara_wind_coefficient (ISO 15016:2025 C.12–C.19, Table C.19), evaluated 2026-10-31',
    run: () => {
      const pins = [[0, 0.7688375000000001], [30, 0.9510493422315468], [60, 0.6204204937303064], [90, 0.31476518147035476], [120, 0.6635103465658594], [150, -0.20705476619555732], [180, -0.27905968750000015], [330, 0.9510493422315468]];
      for (const [angle, value] of pins) assertClose(fujiwaraCoefficient(angle, SHIP_A), value, { abs: 1e-12 }, `${angle}°`);
    },
  },
  {
    name: 'Pinned to production, ship B (300 m × 48 m, centre of A_LV 20 m aft): C_AA 0.86568 at 0°, 0.67193 at 45°, −0.57883 at 135°; −45° equals 45°',
    source: 'atlas_physics.fujiwara_wind.calculate_fujiwara_wind_coefficient, evaluated 2026-10-31',
    run: () => {
      assertClose(fujiwaraCoefficient(0, SHIP_B), 0.8656750000000001, { abs: 1e-12 }, '0°');
      assertClose(fujiwaraCoefficient(45, SHIP_B), 0.6719254776118813, { abs: 1e-12 }, '45°');
      assertClose(fujiwaraCoefficient(135, SHIP_B), -0.578826475123631, { abs: 1e-12 }, '135°');
      assertClose(fujiwaraCoefficient(-45, SHIP_B), fujiwaraCoefficient(45, SHIP_B), { abs: 1e-15 }, 'symmetry');
    },
  },
  {
    name: 'Air density by formula C.2: 1013.25 hPa and 15 °C give 1.2250 kg/m³; 1030 hPa and −5 °C give 1.3374 kg/m³',
    source: 'ISO 15016:2025 formula C.2, ρ_A = p_A/(2.8705 (t_A + 273.15))',
    run: () => {
      assertClose(airDensity(1013.25, 15), 1.225, { abs: 1e-4 }, 'standard');
      assertClose(airDensity(1030, -5), 1030 / (2.8705 * 268.15), { rel: 1e-12 }, 'cold and high');
    },
  },
  {
    name: 'Formula C.1 with given coefficients: C_AA(ψ) 0.9, C_AA(0) 0.8, A_XV 600 m², 30 kn relative wind, 14 kn over the ground: R_AA = ½ρA(0.9 V_WR² − 0.8 V_G²); power R_AA V_G/0.7',
    source: 'ISO 15016:2025 formula C.1; ISO 19030-2 Annex G power conversion',
    run: () => {
      const { outputs } = calculate({ coefficients: 'given', caa_psi: 0.9, caa_0: 0.8, axv_m2: 600, relative_speed_kn: 30, sog_kn: 14, air_pressure_hpa: 1013.25, air_temperature_c: 15, eta_d: 0.7 });
      const rho = 1013.25 / (2.8705 * 288.15);
      const raa = 0.5 * rho * 600 * (0.9 * (30 * KN) ** 2 - 0.8 * (14 * KN) ** 2);
      assertClose(outputs.raa_n, raa, { rel: 1e-12 }, 'R_AA');
      assertClose(outputs.added_power_w, (raa * 14 * KN) / 0.7, { rel: 1e-12 }, 'power');
    },
  },
  {
    name: 'No true wind: a relative wind equal to the speed over ground from dead ahead gives R_AA = 0 — the still-air resistance is already in the calm-water baseline',
    source: 'ISO 15016:2025 formula C.1 (second term)',
    run: () => {
      const { outputs } = calculate({ relative_speed_kn: 14, relative_dir_deg: 0, sog_kn: 14 });
      assertClose(outputs.raa_n, 0, { abs: 1e-9 }, 'zero');
    },
  },
  {
    name: 'Invalid inputs fail fast: negative wind speed, zero A_XV, an unknown coefficient source, η_D out of range',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ relative_speed_kn: -1 }), 'must be between', 'speed');
      assertThrows(() => calculate({ axv_m2: 0 }), 'greater than zero', 'area');
      assertThrows(() => calculate({ coefficients: 'guess' }), 'must be one of', 'source');
      assertThrows(() => calculate({ eta_d: 1.2 }), 'must be between', 'efficiency');
    },
  },
];
