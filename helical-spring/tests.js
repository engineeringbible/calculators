/**
 * helical-spring/tests.js — reproduces Shigley Example 10-1 and checks the ch. 10 formulas.
 * Run: node run-tests.js helical-spring
 */
import { calculate, curvatureFactor, tensileStrengthPa, MATERIALS, END_TYPES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const LBF = 4.4482216152605;
const PSI = 6894.757293168;
/** Shigley Example 10-1: No. 16 music wire d 0.037 in, OD 7/16 in, 12.5 total coils squared and ground, L₀ 1.25 in, G 11.75 Mpsi. */
const SHIGLEY = { wire_d_m: 0.037 * IN, diameter_basis: 'outer', coil_d_m: 0.4375 * IN, end_type: 'squared_ground', coil_basis: 'total', coils: 12.5, free_length_m: 1.25 * IN, material: 'custom', sut_custom_pa: 324.3e3 * PSI, fraction_custom: 0.45, g_custom_pa: 11.75e6 * PSI, curvature: 'bergstrasser', load_mode: 'force', force_n: 2 * LBF, buckling_ends: 'fixed_fixed' };

export const tests = [
  {
    name: 'Shigley Example 10-1 geometry: D = 0.4375 − 0.037 = 0.4005 in, C = 10.8, K_B = (4C + 2)/(4C − 3) = 1.124, N_a = 10.5, L_s = d N_t = 0.4625 in',
    source: 'Shigley\'s Mechanical Engineering Design, Example 10-1, Tables 10-1 and eq. 10-6',
    run: () => {
      const { outputs } = calculate(SHIGLEY);
      assertClose(outputs.mean_d_m / IN, 0.4005, { rel: 1e-9 }, 'D');
      assertClose(outputs.index, 10.82, { abs: 0.01 }, 'C');
      assertClose(outputs.curvature_factor, 1.124, { abs: 1e-3 }, 'K_B');
      assertClose(curvatureFactor(10.82, 'bergstrasser'), (4 * 10.82 + 2) / (4 * 10.82 - 3), { rel: 1e-12 }, 'K_B formula');
      assertClose(outputs.active_coils, 10.5, { rel: 1e-12 }, 'N_a');
      assertClose(outputs.solid_height_m / IN, 0.4625, { rel: 1e-9 }, 'L_s');
    },
  },
  {
    name: 'Shigley Example 10-1 rate and solid force: k = d⁴G/(8D³N_a) = 4.08 lbf/in (714 N/m); deflection to solid 0.7875 in; F_s = 3.21 lbf',
    source: 'Shigley Example 10-1 (a)–(c): k 4.08 lbf/in, y_s 0.7875 in, F_s 3.21 lbf',
    run: () => {
      const { outputs } = calculate(SHIGLEY);
      assertClose(outputs.rate_n_m / (LBF / IN), 4.08, { abs: 0.01 }, 'k lbf/in');
      assertClose(outputs.rate_n_m, 714, { abs: 2 }, 'k N/m');
      assertClose(outputs.deflection_to_solid_m / IN, 0.7875, { rel: 1e-9 }, 'y_s');
      assertClose(outputs.force_solid_n / LBF, 3.21, { abs: 0.01 }, 'F_s');
    },
  },
  {
    name: 'Shigley Example 10-1 stress: S_ut = A/d^m = 201/0.037^0.145 = 324 kpsi (SI constants give 2 231 MPa for 0.94 mm), S_sy = 0.45 S_ut = 146 kpsi, τ_s = K_B 8 F_s D/(π d³) = 72.6 kpsi, n_s = 2.0; buckling 2.63 D/α = 2.11 in > L₀ → stable',
    source: 'Shigley Example 10-1 (d)–(f): S_ut 324 kpsi, τ_s 72.6 kpsi, n_s 2.01, stable',
    run: () => {
      const { outputs } = calculate(SHIGLEY);
      assertClose(tensileStrengthPa('music_wire', 0.037 * IN) / 1e6, 2231, { rel: 3e-3 }, 'SI constants ≈ 324 kpsi');
      assertClose(outputs.ssy_pa / PSI / 1000, 145.9, { abs: 0.2 }, 'S_sy');
      assertClose(outputs.stress_solid_pa / PSI / 1000, 72.6, { abs: 0.3 }, 'τ_s');
      assertClose(outputs.safety_solid, 2.01, { abs: 0.02 }, 'n_s');
      assertClose(outputs.buckling_limit_m / IN, 2.63 * 0.4005 / 0.5, { rel: 1e-9 }, '2.63 D/α');
      assertEqual(outputs.buckling_status.startsWith('Stable'), true, 'stable');
      assertEqual(outputs.design_check.startsWith('OK'), true, 'design OK');
    },
  },
  {
    name: 'Material table (Shigley 10-4/10-5/10-6): music wire 2211/0.145/45 %/81 GPa, hard-drawn 1783/0.190, oil-tempered 1855/0.187/50 %, Cr-V 2005/0.168, Cr-Si 1974/0.108, stainless 302 1867/0.146/35 %; S_ut of 2 mm hard-drawn wire = 1783/2^0.19 = 1563 MPa',
    source: 'Shigley Tables 10-4 (A, m), 10-5 (G) and 10-6 (static torsional yield fraction)',
    run: () => {
      assertEqual(MATERIALS.music_wire.A === 2211 && MATERIALS.music_wire.m === 0.145 && MATERIALS.music_wire.fraction === 0.45 && MATERIALS.music_wire.G === 81e9, true, 'music wire');
      assertEqual(MATERIALS.hard_drawn.A === 1783 && MATERIALS.hard_drawn.m === 0.19, true, 'hard-drawn');
      assertEqual(MATERIALS.oil_tempered.A === 1855 && MATERIALS.oil_tempered.fraction === 0.5, true, 'oil-tempered');
      assertEqual(MATERIALS.chrome_vanadium.A === 2005 && MATERIALS.chrome_silicon.A === 1974 && MATERIALS.chrome_silicon.m === 0.108, true, 'alloys');
      assertEqual(MATERIALS.stainless_302.fraction === 0.35, true, 'stainless');
      assertClose(tensileStrengthPa('hard_drawn', 0.002) / 1e6, 1783 / 2 ** 0.19, { rel: 1e-12 }, 'S_ut 2 mm');
      assertClose(tensileStrengthPa('hard_drawn', 0.002) / 1e6, 1563, { abs: 1 }, 'value');
    },
  },
  {
    name: 'Wahl versus Bergsträsser: at C = 6 K_W = 23/20 + 0.1025 = 1.2525 and K_B = 26/21 = 1.2381 (1.2 % apart); end types: plain N_t = N_a, plain-ground +1, squared +2, squared-ground +2 with the Table 10-1 solid heights',
    source: 'Shigley eqs. 10-5/10-6 and Table 10-1',
    run: () => {
      assertClose(curvatureFactor(6, 'wahl'), 23 / 20 + 0.615 / 6, { rel: 1e-12 }, 'K_W');
      assertClose(curvatureFactor(6, 'bergstrasser'), 26 / 21, { rel: 1e-12 }, 'K_B');
      assertEqual(END_TYPES.plain.extra === 0 && END_TYPES.plain_ground.extra === 1 && END_TYPES.squared.extra === 2 && END_TYPES.squared_ground.extra === 2, true, 'extra coils');
      assertClose(END_TYPES.plain.solid(1, 10), 11, { rel: 1e-12 }, 'plain L_s = d(N_t + 1)');
      assertClose(END_TYPES.plain_ground.solid(1, 10), 10, { rel: 1e-12 }, 'plain ground L_s = d N_t');
      assertClose(END_TYPES.squared.solid(1, 10), 11, { rel: 1e-12 }, 'squared');
      assertClose(END_TYPES.squared_ground.solid(1, 10), 10, { rel: 1e-12 }, 'squared ground');
      const wahl = calculate({ ...SHIGLEY, curvature: 'wahl' }).outputs;
      const berg = calculate(SHIGLEY).outputs;
      assertEqual(Math.abs(wahl.stress_solid_pa / berg.stress_solid_pa - 1) < 0.02, true, 'stresses within 2 %');
    },
  },
  {
    name: 'Working point: 2 lbf on the Example 10-1 spring deflects 0.49 in (F/k), stress 45.2 kpsi, safety 3.2; deflection mode returns the same force; a 5 lbf request closes the spring solid and is capped at F_s with a warning',
    source: 'Linear spring F = k y; solid-height cap',
    run: () => {
      const { outputs } = calculate(SHIGLEY);
      assertClose(outputs.deflection_out_m / IN, 2 / 4.08, { rel: 5e-3 }, 'y');
      assertClose(outputs.stress_pa / outputs.stress_solid_pa, 2 / 3.21, { rel: 5e-3 }, 'stress ∝ F');
      const byDeflection = calculate({ ...SHIGLEY, load_mode: 'deflection', deflection_m: outputs.deflection_out_m }).outputs;
      assertClose(byDeflection.force_out_n, 2 * LBF, { rel: 1e-9 }, 'round trip');
      const closed = calculate({ ...SHIGLEY, force_n: 5 * LBF });
      assertClose(closed.outputs.force_out_n, closed.outputs.force_solid_n, { rel: 1e-12 }, 'capped at F_s');
      assertEqual(closed.warnings.some((w) => w.includes('closes the spring solid')), true, 'warning');
    },
  },
  {
    name: 'Surge frequency: music-wire spring of Example 10-1 has active mass 7850 × (π d²/4) × π D N_a = 2.6 g and f = ½ √(k/m) ≈ 260 Hz; a long slender spring (L₀ 60 mm, D 10 mm, fixed–free) is flagged for buckling',
    source: 'Shigley eq. 10-25 (f = ½ √(k g/W) for fixed ends) and eq. 10-13 (buckling)',
    run: () => {
      const { outputs } = calculate(SHIGLEY);
      const d = 0.037 * IN;
      const D = 0.4005 * IN;
      const m = 7850 * (Math.PI * d * d / 4) * Math.PI * D * 10.5;
      assertClose(outputs.wire_mass_kg, m, { rel: 1e-9 }, 'mass');
      assertClose(outputs.surge_frequency_hz, 0.5 * Math.sqrt(outputs.rate_n_m / m), { rel: 1e-9 }, 'f');
      assertEqual(outputs.surge_frequency_hz > 200 && outputs.surge_frequency_hz < 320, true, 'order of magnitude');
      const slender = calculate({ ...SHIGLEY, free_length_m: 0.06, buckling_ends: 'fixed_free' }).outputs;
      assertEqual(slender.buckling_status.startsWith('BUCKLING RISK'), true, 'buckling flagged');
    },
  },
  {
    name: 'Invalid inputs fail fast: outside diameter not larger than the wire, free length below the solid height, unknown material',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...SHIGLEY, coil_d_m: 0.0005 }), 'must exceed the wire diameter', 'D');
      assertThrows(() => calculate({ ...SHIGLEY, free_length_m: 0.005 }), 'not greater than the solid height', 'L₀');
      assertThrows(() => calculate({ ...SHIGLEY, material: 'titanium' }), 'must be one of', 'material');
    },
  },
];
