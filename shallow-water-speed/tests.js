/**
 * shallow-water-speed/tests.js — checks of the ISO 15016:2025 Annex G transcription and the Lackenby formula.
 * Run: node run-tests.js shallow-water-speed
 */
import { calculate, lackenbySpeedLoss, ravenSinkage } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const SHIP = { lpp_m: 180, beam_m: 32, draft_m: 11, cb: 0.8, cm: 0.98, cwp: 0.88, wetted_surface_m2: 7000, speed_kn: 12, depth_m: 30, water_temp_c: 15, salinity_g_kg: 35, ks_um: 150, delivered_power_kw: 5000, eta_d: 0.7 };
const V = 12 * 1852 / 3600;
const G = 9.80665;

export const tests = [
  {
    name: 'Depth Froude numbers and trial limit: Fr_h = 6.173/√(9.80665 × 30) = 0.3599, Fr_hd at 0.3 L_PP = 54 m → 0.2683; minimum depth max(2.5 × 11, 2.4 V²/g) = 27.5 m → 30 m is acceptable, 25 m is not',
    source: 'ISO 15016:2025 Formula (7) and G.13',
    run: () => {
      const { outputs } = calculate(SHIP);
      assertClose(outputs.fr_h, V / Math.sqrt(G * 30), { rel: 1e-12 }, 'Fr_h');
      assertClose(outputs.fr_h, 0.3599, { abs: 1e-4 }, 'Fr_h value');
      assertClose(outputs.fr_hd, V / Math.sqrt(G * 54), { rel: 1e-12 }, 'Fr_hd');
      assertClose(outputs.min_depth_m, 27.5, { rel: 1e-12 }, 'min depth');
      assertEqual(outputs.depth_check.startsWith('OK'), true, 'OK');
      const shallow = calculate({ ...SHIP, depth_m: 25 });
      assertEqual(shallow.outputs.depth_check.startsWith('NOT ACCEPTABLE'), true, 'not acceptable');
      assertEqual(shallow.warnings.some((w) => w.includes('below the ISO 15016 trial limit')), true, 'warning');
    },
  },
  {
    name: 'Sinkage term: ∇ = 50 688 m³, d = 1.46 ∇/L² [Fr_h²/√(1−Fr_h²) − Fr_hd²/√(1−Fr_hd²)] = 0.1465 m; δ = d A_W/∇ = 0.01465 with A_W 5 069 m²; r_sink = 1.00974; deep water (h = 54 m) gives d = 0',
    source: 'ISO 15016:2025 G.10–G.12 (Tuck sinkage form)',
    run: () => {
      const { outputs } = calculate(SHIP);
      const frH = V / Math.sqrt(G * 30);
      const frHd = V / Math.sqrt(G * 54);
      const term = (f) => (f * f) / Math.sqrt(1 - f * f);
      assertClose(outputs.sinkage_increase_m, 1.46 * (50688 / 32400) * (term(frH) - term(frHd)), { rel: 1e-12 }, 'd formula');
      assertClose(outputs.sinkage_increase_m, 0.1465, { abs: 5e-4 }, 'd value');
      assertClose(outputs.delta_volume_ratio, (outputs.sinkage_increase_m * 0.88 * 180 * 32) / 50688, { rel: 1e-12 }, 'δ');
      assertClose(outputs.r_sink, (1 + outputs.delta_volume_ratio) ** (2 / 3), { rel: 1e-12 }, 'r_sink');
      assertClose(outputs.r_sink, 1.00974, { abs: 2e-5 }, 'r_sink value');
      assertEqual(ravenSinkage(50688, 180, frHd, frHd), 0, 'zero at reference depth');
      assertEqual(calculate({ ...SHIP, depth_m: 54 }).outputs.sinkage_increase_m, 0, 'deep water');
    },
  },
  {
    name: 'Viscous term: Re 9.351e8, C_F 1.5434e-3, ΔC_F 8.91e-5, (1+k) = 1.017 + 20 × 0.8 × (32/180)² × √(11/32) = 1.3135, C_V\' 2.238e-3 → R_Vdeep 306.2 kN, R_SHV = R_Vdeep × 0.57 × (11/30)^1.79 = 29.0 kN',
    source: 'ISO 15016:2025 G.3–G.9; ITTC water properties',
    run: () => {
      const { outputs } = calculate(SHIP);
      assertClose(outputs.form_factor, 1.017 + 20 * 0.8 * (32 / 180) ** 2 * Math.sqrt(11 / 32), { rel: 1e-12 }, '(1+k) formula');
      assertClose(outputs.form_factor, 1.3135, { abs: 1e-4 }, '(1+k) value');
      assertClose(outputs.cf, 0.075 / (Math.log10(V * 180 / 1.1883e-6) - 2) ** 2, { rel: 1e-12 }, 'C_F');
      assertClose(outputs.cf, 1.5434e-3, { rel: 1e-4 }, 'C_F value');
      assertClose(outputs.dcf, 8.91e-5, { rel: 2e-3 }, 'ΔC_F');
      assertClose(outputs.cv, 1.06 * outputs.cf * outputs.form_factor + outputs.dcf, { rel: 1e-12 }, 'C_V\'');
      assertClose(outputs.r_v_deep_n, outputs.cv * 0.5 * 1025.9 * V * V * 7000, { rel: 1e-12 }, 'R_Vdeep');
      assertClose(outputs.r_v_deep_n / 1000, 306.2, { abs: 0.2 }, 'R_Vdeep value');
      assertClose(outputs.r_shv_n, outputs.r_v_deep_n * 0.57 * (11 / 30) ** 1.79, { rel: 1e-12 }, 'R_SHV');
      assertClose(outputs.r_shv_n / 1000, 29.0, { abs: 0.05 }, 'R_SHV value');
    },
  },
  {
    name: 'Power correction: P_Ddeep = (5 000 kW − 29.0 kN × 6.173/0.70)/1.00974 = 4 699 kW, P_SH = 301 kW = 6.0 %; P_SH falls with depth (60 m < 30 m) and is only the viscous term at 54 m and beyond',
    source: 'ISO 15016:2025 G.1–G.2',
    run: () => {
      const { outputs } = calculate(SHIP);
      assertClose(outputs.p_deep_w, (5e6 - (outputs.r_shv_n * V) / 0.7) / outputs.r_sink, { rel: 1e-12 }, 'P_Ddeep');
      assertClose(outputs.p_deep_w / 1000, 4699, { abs: 2 }, 'P_Ddeep value');
      assertClose(outputs.p_sh_w / 1000, 301, { abs: 2 }, 'P_SH');
      assertClose(outputs.p_sh_pct, 6.03, { abs: 0.05 }, '%');
      const deeper = calculate({ ...SHIP, depth_m: 60 }).outputs;
      assertEqual(deeper.p_sh_w < outputs.p_sh_w, true, 'less at 60 m');
      assertClose(deeper.p_sh_w, (deeper.r_shv_n * V) / 0.7, { rel: 1e-9 }, 'viscous only beyond 0.3 L_PP');
    },
  },
  {
    name: 'Lackenby: A_M = 0.98 × 32 × 11 = 345.0 m², A_M/h² = 0.3833, ΔV/V = 0.1242 (0.3833 − 0.05) + 1 − √tanh(gh/V²) = 4.14 %, deep-water speed 12.50 kn; at 200 m depth A_M/h² < 0.05 is flagged',
    source: 'Lackenby (1963); ISO 15016:2015 shallow-water correction',
    run: () => {
      const { outputs } = calculate(SHIP);
      assertClose(outputs.lackenby_am_h2, (0.98 * 32 * 11) / 900, { rel: 1e-12 }, 'A_M/h²');
      assertClose(outputs.lackenby_dv_pct / 100, lackenbySpeedLoss(0.98 * 32 * 11, 30, V), { rel: 1e-12 }, 'ΔV/V');
      assertClose(outputs.lackenby_dv_pct, 4.14, { abs: 0.01 }, 'value');
      assertClose(outputs.lackenby_deep_speed_kn, 12 * (1 + outputs.lackenby_dv_pct / 100), { rel: 1e-12 }, 'V_deep');
      assertClose(outputs.lackenby_deep_speed_kn, 12.50, { abs: 0.01 }, 'V_deep value');
      assertEqual(calculate({ ...SHIP, depth_m: 200 }).warnings.some((w) => w.includes('Lackenby A_M/h² below 0.05')), true, 'range warning');
    },
  },
  {
    name: 'Validation: depth not exceeding the draught, supercritical depth Froude number (30 kn in 12 m) and zero wetted surface are rejected',
    source: 'Validation contract; G.12 validity (Fr_h < 1)',
    run: () => {
      assertThrows(() => calculate({ ...SHIP, depth_m: 11 }), 'exceed the draught', 'depth');
      assertThrows(() => calculate({ ...SHIP, speed_kn: 30, depth_m: 12 }), 'supercritical', 'Fr_h');
      assertThrows(() => calculate({ ...SHIP, wetted_surface_m2: 0 }), 'greater than zero', 'S');
    },
  },
  {
    name: 'A short fast ship in water deeper than 0.3 L_PP gets no sinkage, even when the reference depth Froude number exceeds 1',
    source: 'Range fuzzing (fuzz.js): G.12 is evaluated only below the reference depth, where Fr_hd < Fr_h < 1',
    run: () => {
      assertEqual(ravenSinkage(1000, 10, 0.5, 1.2), 0, 'no sinkage beyond the reference depth');
      const { outputs } = calculate({ lpp_m: 10 });
      assertEqual(outputs.sinkage_increase_m, 0, 'sinkage');
      assertEqual(outputs.r_sink, 1, 'r_sink');
    },
  },
];
