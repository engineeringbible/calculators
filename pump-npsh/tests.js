/**
 * pump-npsh/tests.js — checks against steam-table vapour pressures and the Hydraulic Institute NPSH definitions.
 * Run: node run-tests.js pump-npsh
 */
import { calculate, waterVapourPressureKpa, npshAvailable } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const G = 9.80665;
const COLD = { liquid: 'water', temperature_c: 20, density_kg_m3: 998, atmospheric_kpa: 101.325, vessel_gauge_kpa: 0, static_head_m: -3, friction_loss_m: 1, npshr_m: 3, margin_m: 1, margin_ratio: 1.2, flow_m3_h: 100, speed_rpm: 1450, head_m: 40 };

export const tests = [
  {
    name: 'IAPWS-IF97 saturation pressure of water: 0.6117 kPa at 0.01 °C, 2.3393 at 20 °C, 7.3849 at 40 °C, 19.947 at 60 °C, 70.182 at 90 °C, 101.42 at 100 °C (steam tables)',
    source: 'IAPWS-IF97 region 4 eq. 30; IAPWS steam tables (triple point 611.657 Pa; 100 °C → 101.42 kPa on ITS-90)',
    run: () => {
      assertClose(waterVapourPressureKpa(0.01), 0.611657, { rel: 1e-4 }, 'triple point');
      assertClose(waterVapourPressureKpa(20), 2.3393, { rel: 1e-3 }, '20 °C');
      assertClose(waterVapourPressureKpa(40), 7.3849, { rel: 1e-3 }, '40 °C');
      assertClose(waterVapourPressureKpa(60), 19.947, { rel: 1e-3 }, '60 °C');
      assertClose(waterVapourPressureKpa(90), 70.182, { rel: 1e-3 }, '90 °C');
      assertClose(waterVapourPressureKpa(100), 101.42, { rel: 1e-3 }, '100 °C');
    },
  },
  {
    name: 'Theoretical lift of 20 °C water at sea level: (101.325 − 2.339)/(998 × 9.81) = 10.1 m; with a 3 m lift and 1 m friction NPSHa = 6.1 m, margin 3.1 m, ratio 2.0 → OK',
    source: 'Karassik Pump Handbook ch. 2 (NPSHa definition, ≈ 10 m theoretical lift); ANSI/HI 9.6.1 margin forms',
    run: () => {
      const { outputs } = calculate(COLD);
      assertClose(outputs.theoretical_lift_m, ((101.325 - waterVapourPressureKpa(20)) * 1000) / (998 * G), { rel: 1e-12 }, 'pressure head');
      assertClose(outputs.theoretical_lift_m, 10.11, { abs: 0.02 }, '10.1 m');
      assertClose(outputs.npsha_m, outputs.theoretical_lift_m - 3 - 1, { rel: 1e-12 }, 'NPSHa');
      assertClose(outputs.npsha_m, 6.11, { abs: 0.02 }, 'value');
      assertClose(outputs.margin_out_m, outputs.npsha_m - 3, { rel: 1e-12 }, 'margin');
      assertEqual(outputs.status.startsWith('OK'), true, 'OK');
      assertClose(npshAvailable(101.325, 2.339, 998, -3, 1), 6.11, { abs: 0.02 }, 'helper');
    },
  },
  {
    name: 'Maximum lift: NPSHr 3 m with margin max(1 m, ×1.2 = 0.6 m) → required 4 m; z_max = −(4 + 1 − 10.11) = 5.1 m lift; at 90 °C the pressure head is only 3.3 m so a flooded suction of 1.7 m is needed',
    source: 'Rearranged NPSHa definition; vapour pressure of water at 90 °C 70.1 kPa (ρ 965 kg/m³)',
    run: () => {
      const cold = calculate(COLD).outputs;
      assertClose(cold.max_lift_m, -(4 + 1 - cold.pressure_head_m), { rel: 1e-9 }, 'z_max formula');
      assertClose(cold.max_lift_m, 5.11, { abs: 0.03 }, 'value (5.1 m lift, level below the pump)');
      const hot = calculate({ ...COLD, temperature_c: 90, density_kg_m3: 965, static_head_m: 1 }).outputs;
      assertClose(hot.pressure_head_m, ((101.325 - waterVapourPressureKpa(90)) * 1000) / (965 * G), { rel: 1e-12 }, 'hot head');
      assertClose(hot.pressure_head_m, 3.3, { abs: 0.05 }, '3.3 m');
      assertEqual(hot.max_lift_m < -1.5 && hot.max_lift_m > -1.9, true, 'flooded suction ≈ 1.7 m needed (negative lift)');
      assertEqual(hot.status.startsWith('CAVITATION') || hot.status.startsWith('MARGINAL'), true, '1 m flooded is not enough');
    },
  },
  {
    name: 'Closed vessel: 50 kPa gauge adds 5.1 m of head; a vessel under 50 kPa vacuum removes it; surface pressure below the vapour pressure is rejected (boiling)',
    source: 'Absolute surface pressure = atmospheric + gauge (HI 9.6.1)',
    run: () => {
      const base = calculate(COLD).outputs;
      const pressurised = calculate({ ...COLD, vessel_gauge_kpa: 50 }).outputs;
      assertClose(pressurised.npsha_m - base.npsha_m, 50000 / (998 * G), { rel: 1e-9 }, '+50 kPa');
      const vacuum = calculate({ ...COLD, vessel_gauge_kpa: -50 }).outputs;
      assertClose(base.npsha_m - vacuum.npsha_m, 50000 / (998 * G), { rel: 1e-9 }, '−50 kPa');
      assertThrows(() => calculate({ ...COLD, vessel_gauge_kpa: -100 }), 'boiling', 'boiling surface');
    },
  },
  {
    name: 'Temperature at which NPSHa falls to NPSHr for the cold-water layout: pressure head must drop to 7 m, i.e. p_v ≈ 32.8 kPa, about 71 °C; the solver finds the root where NPSHa = NPSHr',
    source: 'Bisection on the IF97 vapour pressure; steam tables 70 °C 31.2 kPa, 72 °C 34.0 kPa',
    run: () => {
      const { outputs } = calculate(COLD);
      const t = outputs.boiling_margin_k;
      assertEqual(t > 69 && t < 74, true, 'root around 71 °C');
      assertClose(npshAvailable(101.325, waterVapourPressureKpa(t), 998, -3, 1), 3, { abs: 1e-6 }, 'NPSHa = NPSHr at the root');
    },
  },
  {
    name: 'Suction specific speed and Thoma: 1450 rpm, 100 m³/h (440.3 gpm), NPSHr 3 m (9.84 ft) → N_ss = 1450 × √440.3 / 9.84^0.75 = 5 480; σ = 3/40 = 0.075; both null when the flow or head is zero',
    source: 'Karassik ch. 2: N_ss = n √Q / NPSHr^0.75 in rpm, US gpm, ft; Thoma σ = NPSHr/H',
    run: () => {
      const { outputs } = calculate(COLD);
      const gpm = 100 / 0.227124707;
      assertClose(outputs.nss_us, (1450 * Math.sqrt(gpm)) / (3 / 0.3048) ** 0.75, { rel: 1e-12 }, 'N_ss');
      assertClose(outputs.nss_us, 5480, { rel: 2e-3 }, 'value');
      assertClose(outputs.thoma, 0.075, { rel: 1e-12 }, 'σ');
      assertEqual(calculate({ ...COLD, flow_m3_h: 0 }).outputs.nss_us, null, 'no flow');
      assertEqual(calculate({ ...COLD, head_m: 0 }).outputs.thoma, null, 'no head');
      const fast = calculate({ ...COLD, speed_rpm: 3500, npshr_m: 2 });
      assertEqual(fast.outputs.nss_us > 11000 && fast.warnings.some((w) => w.includes('above 11 000')), true, 'high N_ss warning');
    },
  },
  {
    name: 'Custom liquid: entering 2.34 kPa directly reproduces the water case; invalid inputs fail fast (zero NPSHr, temperature outside 1–100 °C, unknown liquid)',
    source: 'Consistency and validation contract',
    run: () => {
      const custom = calculate({ ...COLD, liquid: 'custom', vapour_pressure_kpa: 2.34 }).outputs;
      assertClose(custom.npsha_m, calculate(COLD).outputs.npsha_m, { abs: 2e-3 }, 'same NPSHa');
      assertEqual(custom.boiling_margin_k, null, 'no boiling temperature for custom liquids');
      assertThrows(() => calculate({ ...COLD, npshr_m: 0 }), 'greater than zero', 'NPSHr');
      assertThrows(() => calculate({ ...COLD, temperature_c: 120 }), 'between', 'temperature');
      assertThrows(() => calculate({ ...COLD, liquid: 'mercury' }), 'must be one of', 'liquid');
    },
  },
];
