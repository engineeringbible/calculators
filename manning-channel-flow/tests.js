/**
 * manning-channel-flow/tests.js — checks against Manning's equation, circular-section properties and critical-flow theory.
 * Run: node run-tests.js manning-channel-flow
 */
import { calculate, sectionGeometry, manningVelocity, dischargeAtDepth, normalDepth, criticalDepth, ROUGHNESS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const RECT = { shape: 'rectangular', bottom_width_m: 3, bed_slope: 0.001, roughness: 'concrete_finished', mode: 'flow', depth_m: 1 };

export const tests = [
  {
    name: 'Rectangular concrete channel 3 m wide, 1 m deep, S = 0.001, n = 0.013: A 3 m², P 5 m, R 0.6 m, V = (1/0.013) × 0.6^(2/3) × 0.001^(1/2) = 1.730 m/s, Q = 5.19 m³/s',
    source: "Manning's equation in SI (Chow 1959, eq. 5-7); n = 0.013 for finished concrete (Chow Table 5-6)",
    run: () => {
      assertClose(manningVelocity(0.013, 0.6, 0.001), (1 / 0.013) * 0.6 ** (2 / 3) * Math.sqrt(0.001), { rel: 1e-12 }, 'formula');
      const { outputs } = calculate(RECT);
      assertClose(outputs.area_m2, 3, { rel: 1e-12 }, 'A');
      assertClose(outputs.wetted_perimeter_m, 5, { rel: 1e-12 }, 'P');
      assertClose(outputs.hydraulic_radius_m, 0.6, { rel: 1e-12 }, 'R');
      assertClose(outputs.velocity_m_s, 1.7305, { abs: 1e-3 }, 'V');
      assertClose(outputs.discharge_out_m3_s, 5.191, { abs: 3e-3 }, 'Q');
      assertEqual(outputs.manning_n_out, ROUGHNESS.concrete_finished.n, 'n');
    },
  },
  {
    name: 'Trapezoidal earth channel b = 6 m, z = 2, y = 1.5 m, S = 0.0016, n = 0.025: A 13.5 m², P 12.71 m, R 1.062 m, V 1.666 m/s, Q 22.5 m³/s',
    source: 'Trapezoidal geometry A = (b + z y) y, P = b + 2 y √(1 + z²) (Chow Table 2-1); Manning with n = 0.025',
    run: () => {
      const i = { shape: 'trapezoidal', bottom_width_m: 6, side_slope_z: 2, bed_slope: 0.0016, roughness: 'custom', manning_n: 0.025, mode: 'flow', depth_m: 1.5 };
      const g = sectionGeometry(i, 1.5);
      assertClose(g.area, 13.5, { rel: 1e-12 }, 'A');
      assertClose(g.perimeter, 6 + 3 * Math.sqrt(5), { rel: 1e-12 }, 'P');
      assertClose(g.topWidth, 12, { rel: 1e-12 }, 'T');
      const { outputs } = calculate(i);
      assertClose(outputs.hydraulic_radius_m, 1.0623, { abs: 1e-4 }, 'R');
      assertClose(outputs.velocity_m_s, 1.666, { abs: 2e-3 }, 'V');
      assertClose(outputs.discharge_out_m3_s, 22.49, { abs: 0.03 }, 'Q');
    },
  },
  {
    name: 'Circular pipe: half full and completely full both have R = D/4; the free-surface discharge peaks near 94 % depth at about 1.08 × the full-pipe discharge',
    source: 'Chow (1959) §6-4 and French (1985): hydraulic elements of a circular section, maximum discharge at y/D ≈ 0.938',
    run: () => {
      const pipe = { shape: 'circular', diameter_m: 1, bed_slope: 0.002, roughness: 'concrete_finished' };
      const half = sectionGeometry(pipe, 0.5);
      assertClose(half.area, Math.PI / 8, { rel: 1e-9 }, 'half area');
      assertClose(half.perimeter, Math.PI / 2, { rel: 1e-9 }, 'half perimeter');
      assertClose(half.area / half.perimeter, 0.25, { rel: 1e-9 }, 'R half = D/4');
      assertClose(half.topWidth, 1, { rel: 1e-9 }, 'top width at half depth = D');
      const full = sectionGeometry(pipe, 1);
      assertClose(full.area / full.perimeter, 0.25, { rel: 1e-9 }, 'R full = D/4');
      const qFull = dischargeAtDepth(pipe, 0.013, 1);
      const qMax = dischargeAtDepth(pipe, 0.013, 0.938);
      assertClose(qMax / qFull, 1.076, { abs: 0.005 }, 'Q_max / Q_full');
      assertEqual(dischargeAtDepth(pipe, 0.013, 0.9) > qFull, true, '90 % depth exceeds full-pipe discharge');
    },
  },
  {
    name: 'Normal depth by bisection: 5.191 m³/s in the 3 m channel returns y = 1.000 m; the circular pipe refuses a discharge above its free-surface capacity',
    source: 'Inverse of Manning for the depth (Chow §6-4, uniform flow computation)',
    run: () => {
      const { outputs } = calculate({ ...RECT, mode: 'depth', discharge_m3_s: 5.1914 });
      assertClose(outputs.depth_out_m, 1.0, { abs: 1e-3 }, 'normal depth');
      const i = { ...RECT };
      assertClose(normalDepth(i, 0.013, dischargeAtDepth(i, 0.013, 0.7)), 0.7, { abs: 1e-9 }, 'round trip');
      assertThrows(() => calculate({ shape: 'circular', diameter_m: 1, bed_slope: 0.002, roughness: 'concrete_finished', mode: 'depth', discharge_m3_s: 10 }), 'exceeds the capacity', 'pipe capacity');
    },
  },
  {
    name: 'Froude number and critical depth: 1.73 m/s at 1 m depth → Fr = 0.553 (subcritical); critical depth (q²/g)^(1/3) = 0.673 m for q = 1.73 m²/s; at y_c the Froude number is 1',
    source: 'Henderson (1966) ch. 2: Fr = V/√(g y) for a rectangle, y_c = (q²/g)^(1/3)',
    run: () => {
      const { outputs } = calculate(RECT);
      assertClose(outputs.froude, 1.7305 / Math.sqrt(9.80665), { abs: 1e-3 }, 'Fr');
      assertEqual(outputs.regime.startsWith('Subcritical'), true, 'regime');
      const q = outputs.discharge_out_m3_s / 3;
      assertClose(outputs.critical_depth_m, (q * q / 9.80665) ** (1 / 3), { rel: 1e-6 }, 'y_c formula');
      assertClose(outputs.critical_depth_m, 0.673, { abs: 1e-3 }, 'y_c value');
      const atCritical = calculate({ ...RECT, depth_m: outputs.critical_depth_m, bed_slope: 1 }).outputs;
      const gc = sectionGeometry({ ...RECT }, outputs.critical_depth_m);
      assertClose(outputs.discharge_out_m3_s / gc.area / Math.sqrt(9.80665 * gc.area / gc.topWidth), 1, { rel: 1e-6 }, 'Fr = 1 at critical depth for the same Q');
      assertEqual(atCritical.depth_out_m > 0, true, 'calculation runs at critical depth');
    },
  },
  {
    name: 'Specific energy E = y + V²/2g = 1.153 m and mean shear stress ρ g R S = 5.88 Pa for the 3 m channel',
    source: 'Henderson ch. 2 (specific energy); Chow ch. 7 unit tractive force τ₀ = γ R S',
    run: () => {
      const { outputs } = calculate(RECT);
      assertClose(outputs.specific_energy_m, 1 + 1.7305 ** 2 / (2 * 9.80665), { abs: 1e-3 }, 'E');
      assertClose(outputs.shear_stress_pa, 1000 * 9.80665 * 0.6 * 0.001, { rel: 1e-12 }, 'τ₀');
      assertClose(outputs.shear_stress_pa, 5.884, { abs: 1e-3 }, 'τ₀ value');
    },
  },
  {
    name: 'Triangular ditch z = 2 at 0.5 m: A = 0.5 m², P = 2.236 m, T = 2 m; supercritical on a 5 % slope with a steep-slope regime text',
    source: 'Triangular geometry A = z y², P = 2 y √(1 + z²) (Chow Table 2-1)',
    run: () => {
      const i = { shape: 'triangular', side_slope_z: 2, bed_slope: 0.05, roughness: 'concrete_finished', mode: 'flow', depth_m: 0.5 };
      const g = sectionGeometry(i, 0.5);
      assertClose(g.area, 0.5, { rel: 1e-12 }, 'A');
      assertClose(g.perimeter, Math.sqrt(5), { rel: 1e-12 }, 'P');
      assertClose(g.topWidth, 2, { rel: 1e-12 }, 'T');
      const { outputs } = calculate(i);
      assertEqual(outputs.froude > 1, true, 'supercritical');
      assertEqual(outputs.regime.startsWith('Supercritical'), true, 'regime text');
      assertEqual(outputs.critical_depth_m > 0.5, true, 'critical depth above the supercritical depth');
    },
  },
  {
    name: 'Warnings: velocity above 3 m/s (steep channel) and below 0.6 m/s (flat channel) are flagged; at the critical slope (≈ 0.31 %) Fr = 1 and near-critical flow is flagged',
    source: 'Permissible velocities (Chow Table 7-3, Fortier and Scobey), deposition limit ≈ 0.6 m/s, critical slope from V_c = √(g y_c) in Manning',
    run: () => {
      const fast = calculate({ ...RECT, bed_slope: 0.02 });
      assertEqual(fast.warnings.some((w) => w.includes('above 3 m/s')), true, 'fast');
      const slow = calculate({ ...RECT, bed_slope: 0.00005 });
      assertEqual(slow.warnings.some((w) => w.includes('below 0.6 m/s')), true, 'slow');
      const yc = criticalDepth(RECT, 5.191);
      const gc = sectionGeometry(RECT, yc);
      const criticalSlope = ((Math.sqrt(9.80665 * yc) * 0.013) / (gc.area / gc.perimeter) ** (2 / 3)) ** 2;
      assertClose(criticalSlope, 0.0031, { abs: 2e-4 }, 'critical slope ≈ 0.31 %');
      const nearCritical = calculate({ ...RECT, mode: 'flow', depth_m: yc, bed_slope: criticalSlope });
      assertClose(nearCritical.outputs.froude, 1, { abs: 1e-6 }, 'Fr = 1 at the critical slope');
      assertEqual(nearCritical.warnings.some((w) => w.includes('Froude number within')), true, 'near-critical warning');
    },
  },
  {
    name: 'Invalid inputs fail fast: depth above the pipe diameter, zero slope, unknown roughness',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ shape: 'circular', diameter_m: 1, depth_m: 1.2, bed_slope: 0.001, roughness: 'concrete_finished', mode: 'flow' }), 'exceeds the pipe diameter', 'depth');
      assertThrows(() => calculate({ ...RECT, bed_slope: 0 }), 'greater than zero', 'slope');
      assertThrows(() => calculate({ ...RECT, roughness: 'ice' }), 'must be one of', 'roughness');
    },
  },
];
