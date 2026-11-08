/**
 * bollard-pull/tests.js — reproduces the Global Maritime Haewene Brim bollard pull calculation (DNV method) and checks
 * the component formulas.
 * Run: node run-tests.js bollard-pull
 */
import { calculate, waveDriftForceN, ittcCf, REFLECTION } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const G = 9.80665;
/** GM TN_24138_1: Σ C_s C_h A = 2113.06 m² (ten bands), bow area 292.74 m², C_d 0.50, R 0.45, η 0.75, 20 m/s / 5 m / 1 m/s. */
const BRIM = { condition: 'ocean_hold', wind_m_s: 20, hs_m: 5, current_m_s: 1, windage_area_m2: 2113.06, shape_coef: 1, height_coef: 1, rho_air: 1.22, rho_water: 1025, hull_method: 'frontal', frontal_area_m2: 292.74, cd_preset: 'barge', beam_m: 42, reflection: 'ship_bow', tug_efficiency: 0.75, available_bp_t: 165, free_running_kn: 14 };

export const tests = [
  {
    name: 'Haewene Brim, zero speed: wind 52.6 t, current 7.65 t, wave drift 27.24 t, total 87.5 t, required bollard pull 116.7 t (÷ 0.75); 165 t tug OK',
    source: 'Global Maritime TN_24138_1 (2013) spreadsheet results (wind 52.64 t, current 7.65 t, wave 27.24 t, total 87.53 t, required 116.71 t) — their g = 9.81 and ρ_air 0.00122 t/m³',
    run: () => {
      const { outputs } = calculate(BRIM);
      const t = (n) => n / (1000 * 9.81);
      assertClose(t(outputs.wind_force_n), 52.6, { rel: 3e-3 }, 'wind');
      assertClose(t(outputs.current_force_n), 7.65, { rel: 3e-3 }, 'current');
      assertClose(t(outputs.wave_force_n), 27.24, { rel: 3e-3 }, 'wave drift');
      assertClose(t(outputs.total_force_n), 87.5, { rel: 3e-3 }, 'total');
      assertClose(t(outputs.required_bp_n), 116.7, { rel: 3e-3 }, 'required BP');
      assertEqual(outputs.tug_check.startsWith('OK'), true, 'tug OK');
      assertClose(outputs.margin_pct, (165 / outputs.required_bp_t - 1) * 100, { rel: 1e-9 }, 'margin');
    },
  },
  {
    name: 'Haewene Brim, 2 knots over the ground: relative speed 2.03 m/s, current force 31.5 t, total 111.4 t, required 148.5 t',
    source: 'Global Maritime TN_24138_1 case 2 (current 31.47 t, total 111.36 t, required 148.48 t)',
    run: () => {
      const { outputs } = calculate({ ...BRIM, condition: 'coastal_2kn' });
      assertClose(outputs.relative_current_m_s, 1 + 2 * (1852 / 3600), { rel: 1e-9 }, 'relative speed');
      const t = (n) => n / (1000 * 9.81);
      assertClose(t(outputs.current_force_n), 31.47, { rel: 4e-3 }, 'current');
      assertClose(t(outputs.total_force_n), 111.36, { rel: 3e-3 }, 'total');
      assertClose(t(outputs.required_bp_n), 148.48, { rel: 3e-3 }, 'required');
    },
  },
  {
    name: 'Component formulas: wind ½·1.22·2113.06·400 = 515.6 kN; current ½·1025·0.5·292.74·1 = 75.0 kN; wave drift ⅛·1025·g·0.45²·42·25 = 267.2 kN',
    source: 'DNV-OS-C301 wind/current forms; DNV-RP-H103 §7.2.6.4 wave drift force with R 0.45 (ship bow)',
    run: () => {
      const { outputs } = calculate(BRIM);
      assertClose(outputs.wind_force_n, 0.5 * 1.22 * 2113.06 * 400, { rel: 1e-12 }, 'wind');
      assertClose(outputs.current_force_n, 0.5 * 1025 * 0.5 * 292.74, { rel: 1e-12 }, 'current');
      assertClose(outputs.wave_force_n, waveDriftForceN(1025, 0.45, 42, 5), { rel: 1e-12 }, 'wave helper');
      assertClose(outputs.wave_force_n, (1025 * G * 0.2025 * 42 * 25) / 8, { rel: 1e-12 }, 'wave formula');
      assertClose(outputs.wave_force_n / 1000, 267.2, { abs: 0.3 }, 'wave kN');
      assertEqual(outputs.reflection_used, 0.45, 'R');
    },
  },
  {
    name: 'Reflection table (DNV-RP-H103): square 1.00, Condeep 0.97, cylinder 0.88, raked barge 0.67, spoon barge 0.55, ship bow 0.45; a raked barge sees (0.67/0.45)² = 2.2 × the ship-bow drift force',
    source: 'DNV-RP-H103 (2011) §7.2.6.4 reflection coefficients',
    run: () => {
      assertEqual([REFLECTION.square.r, REFLECTION.condeep.r, REFLECTION.cylinder.r, REFLECTION.raked_barge.r, REFLECTION.spoon_barge.r, REFLECTION.ship_bow.r].join(','), '1,0.97,0.88,0.67,0.55,0.45', 'table');
      const ship = calculate(BRIM).outputs.wave_force_n;
      const barge = calculate({ ...BRIM, reflection: 'raked_barge' }).outputs.wave_force_n;
      assertClose(barge / ship, (0.67 / 0.45) ** 2, { rel: 1e-12 }, 'ratio');
      assertClose(calculate({ ...BRIM, reflection: 'custom', reflection_custom: 0.6 }).outputs.reflection_used, 0.6, { rel: 1e-12 }, 'custom R');
    },
  },
  {
    name: 'Ship-shaped hull by ITTC friction: S 12 000 m², L 252 m at 1 m/s → Rn 2.12·10⁸, C_F 0.001874, (1+k) 1.25 + ΔC_F 0.0004 → 16.9 kN; the design conditions scale forces with V²',
    source: 'ITTC-1957 friction line; DNV-RP-H103 recommends a calm-water resistance method for ship-shaped tows',
    run: () => {
      const cf = ittcCf(1, 252);
      assertClose(cf, 0.075 / (Math.log10(252 / 1.18831e-6) - 2) ** 2, { rel: 1e-12 }, 'C_F');
      const { outputs } = calculate({ ...BRIM, hull_method: 'friction', wetted_area_m2: 12000, length_m: 252, form_factor: 1.25, fouling_dcf: 0.0004 });
      assertClose(outputs.current_force_n, 0.5 * 1025 * 12000 * (cf * 1.25 + 0.0004), { rel: 1e-12 }, 'friction force');
      assertClose(cf, 0.001874, { abs: 3e-6 }, 'C_F value');
      assertClose(outputs.current_force_n / 1000, 16.87, { abs: 0.05 }, 'value');
      const windy = calculate({ ...BRIM, wind_m_s: 40 }).outputs;
      assertClose(windy.wind_force_n / calculate(BRIM).outputs.wind_force_n, 4, { rel: 1e-12 }, 'V² scaling');
    },
  },
  {
    name: 'Benign-weather tow (15 m/s, 2 m, 0.5 m/s): wave drift falls by (2/5)² and the requirement to about 48 t (wind 290 kN, current 19 kN, wave 43 kN); tug efficiency 0.80 lowers the requirement by 6.25 %',
    source: 'ND-0030 / DNVGL-ST-N001 benign criteria; η definition',
    run: () => {
      const benign = calculate({ ...BRIM, wind_m_s: 15, hs_m: 2, current_m_s: 0.5 }).outputs;
      const ocean = calculate(BRIM).outputs;
      assertClose(benign.wave_force_n / ocean.wave_force_n, 0.16, { rel: 1e-12 }, 'H_s²');
      assertClose(benign.required_bp_t, 47.8, { abs: 0.3 }, 'about 48 t');
      const eff = calculate({ ...BRIM, tug_efficiency: 0.8 }).outputs;
      assertClose(eff.required_bp_t / ocean.required_bp_t, 0.75 / 0.8, { rel: 1e-12 }, 'efficiency');
    },
  },
  {
    name: 'Tug adequacy and towing speed: 165 t tug holds the Brim with 41 % margin and makes ≈ 2–4 knots in the design weather; a 100 t tug is INSUFFICIENT with zero speed',
    source: 'Linear pull-reduction estimate (thenavalarch part II) — indicative only',
    run: () => {
      const ok = calculate(BRIM).outputs;
      assertEqual(ok.towing_speed_kn > 1.5 && ok.towing_speed_kn < 4.5, true, 'towing speed');
      const small = calculate({ ...BRIM, available_bp_t: 100 }).outputs;
      assertEqual(small.tug_check.startsWith('INSUFFICIENT'), true, 'insufficient');
      assertEqual(small.towing_speed_kn, 0, 'cannot hold');
      assertEqual(calculate({ ...BRIM, available_bp_t: 0 }).outputs.margin_pct, null, 'not compared');
    },
  },
  {
    name: 'Invalid inputs fail fast: no environment at all, tug efficiency above 1, unknown bow type',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...BRIM, wind_m_s: 0, hs_m: 0, current_m_s: 0 }), 'No environmental force', 'no force');
      assertThrows(() => calculate({ ...BRIM, tug_efficiency: 1.2 }), 'between', 'efficiency');
      assertThrows(() => calculate({ ...BRIM, reflection: 'dome' }), 'must be one of', 'reflection');
    },
  },
];
