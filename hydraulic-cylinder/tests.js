/**
 * hydraulic-cylinder/tests.js — checks against the catalogue formulas F = p A, v = Q/A, P = p Q and Euler rod buckling.
 * Run: node run-tests.js hydraulic-cylinder
 */
import { calculate, cylinderAreas, MOUNTINGS } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** 100 mm bore, 56 mm rod, 200 bar, 40 L/min, 500 mm stroke, η = 1 for exact arithmetic. */
const BASE = { bore_m: 0.1, rod_m: 0.056, pressure_pa: 200e5, flow_m3_s: 40 / 60000, stroke_m: 0.5, efficiency: 1, mounting: 'pinned_both' };

export const tests = [
  {
    name: 'Areas of a 100/56 cylinder: cap 78.54 cm², annulus 53.91 cm², ratio φ = 1.457 (ISO 3320 standard pairing)',
    source: 'A = π D²/4; ISO 3320 bore/rod series (100 mm bore with 56 mm rod, ratio ≈ 1.46)',
    run: () => {
      const a = cylinderAreas(0.1, 0.056);
      assertClose(a.cap * 1e4, 78.54, { abs: 0.01 }, 'cap');
      assertClose(a.annulus * 1e4, 53.91, { abs: 0.01 }, 'annulus');
      assertClose(a.rod * 1e4, 24.63, { abs: 0.01 }, 'rod');
      const { outputs } = calculate(BASE);
      assertClose(outputs.area_ratio, 1.4568, { abs: 1e-4 }, 'φ');
    },
  },
  {
    name: 'Forces at 200 bar: push 157.1 kN, pull 107.8 kN; with η = 0.9 both drop by 10 %',
    source: 'Parker HY08-1114 / Bosch Rexroth: F = p × A (× efficiency)',
    run: () => {
      const ideal = calculate(BASE).outputs;
      assertClose(ideal.push_force_n, 200e5 * (Math.PI * 0.01) / 4, { rel: 1e-12 }, 'push formula');
      assertClose(ideal.push_force_n, 157080, { abs: 1 }, 'push');
      assertClose(ideal.pull_force_n, 107819, { abs: 1 }, 'pull');
      const real = calculate({ ...BASE, efficiency: 0.9 }).outputs;
      assertClose(real.push_force_n / ideal.push_force_n, 0.9, { rel: 1e-12 }, 'efficiency');
    },
  },
  {
    name: 'Speeds at 40 L/min: extend 0.0849 m/s (5.09 m/min) in 5.89 s, retract 0.1237 m/s in 4.04 s; return flow while extending 27.5 L/min',
    source: 'v = Q / A; t = s / v; return flow Q × A_ann / A_cap (Rexroth Hydraulic Trainer Vol. 1)',
    run: () => {
      const { outputs } = calculate(BASE);
      assertClose(outputs.extend_speed_m_s, (40 / 60000) / 7.854e-3, { rel: 1e-4 }, 'extend formula');
      assertClose(outputs.extend_speed_m_s, 0.08488, { abs: 1e-5 }, 'extend');
      assertClose(convert(outputs.extend_speed_m_s, 'm_s', 'm_min', 'speed'), 5.093, { abs: 1e-3 }, 'extend m/min');
      assertClose(outputs.retract_speed_m_s, 0.12366, { abs: 1e-5 }, 'retract');
      assertClose(outputs.extend_time_s, 5.890, { abs: 2e-3 }, 'extend time');
      assertClose(outputs.retract_time_s, 4.043, { abs: 2e-3 }, 'retract time');
      assertClose(convert(outputs.return_flow_m3_s, 'm3_s', 'L_min', 'volume_flow'), 27.46, { abs: 0.01 }, 'return flow');
    },
  },
  {
    name: 'Regenerative extension: speed Q / A_rod = 0.271 m/s (3.2 × normal) at a force of p A_rod = 49.3 kN',
    source: 'Differential circuit: both sides at pressure, net area = rod area (Rexroth Hydraulic Trainer Vol. 1, regenerative circuits)',
    run: () => {
      const { outputs } = calculate(BASE);
      assertClose(outputs.regen_speed_m_s, (40 / 60000) / 2.4630e-3, { rel: 1e-4 }, 'speed');
      assertClose(outputs.regen_speed_m_s / outputs.extend_speed_m_s, (0.1 / 0.056) ** 2, { rel: 1e-9 }, 'ratio = (D/d)²');
      assertClose(outputs.regen_force_n, 200e5 * 2.4630e-3, { rel: 1e-4 }, 'force');
    },
  },
  {
    name: 'Hydraulic power p Q = 200 bar × 40 L/min = 13.33 kW; oil volumes 3.93 L to extend and 2.70 L to retract',
    source: 'P = p Q (1 bar × 1 L/min = 1.667 W); V = A × stroke',
    run: () => {
      const { outputs } = calculate(BASE);
      assertClose(outputs.hydraulic_power_w, 200e5 * (40 / 60000), { rel: 1e-12 }, 'power');
      assertClose(outputs.hydraulic_power_w, 13333, { abs: 1 }, 'power value');
      assertClose(convert(outputs.cap_volume_m3, 'm3', 'L', 'volume'), 3.927, { abs: 1e-3 }, 'cap volume');
      assertClose(convert(outputs.annulus_volume_m3, 'm3', 'L', 'volume'), 2.696, { abs: 1e-3 }, 'annulus volume');
    },
  },
  {
    name: 'Rod buckling: 56 mm rod, I = π d⁴/64 = 48.3 cm⁴, Euler load at 0.5 m pinned = 4.0 MN (factor 25); at 3 m stroke 111 kN, below the push force → warning; K = 2 quarters the load',
    source: "Euler P_cr = π² E I / (K L)² (Shigley §4-12); Parker column-load practice with safety factor 3.5",
    run: () => {
      const short = calculate(BASE).outputs;
      const I = (Math.PI * 0.056 ** 4) / 64;
      assertClose(short.rod_euler_load_n, (Math.PI ** 2 * 210e9 * I) / 0.25, { rel: 1e-12 }, 'Euler formula');
      assertClose(short.rod_euler_load_n, 4.00e6, { rel: 2e-3 }, 'Euler value');
      assertClose(short.rod_buckling_factor, short.rod_euler_load_n / short.push_force_n, { rel: 1e-12 }, 'factor');
      assertEqual(short.rod_buckling_factor > 20, true, 'short stroke safe');
      const long = calculate({ ...BASE, stroke_m: 3 });
      assertClose(long.outputs.rod_euler_load_n, 111.2e3, { rel: 3e-3 }, 'Euler at 3 m');
      assertEqual(long.warnings.some((w) => w.includes('Rod buckling factor')), true, 'buckling warning');
      const free = calculate({ ...BASE, mounting: 'fixed_free' }).outputs;
      assertEqual(MOUNTINGS.fixed_free.k, 2.0, 'K');
      assertClose(free.rod_euler_load_n / short.rod_euler_load_n, 0.25, { rel: 1e-12 }, 'K = 2 quarters the load');
    },
  },
  {
    name: 'Maximum stroke for the safety factor: with FS 3.5 the 56 mm rod at 157 kN may extend to √(π² E I / (3.5 F)) = 1.35 m pinned; the Euler load at that stroke is exactly 3.5 × the push force',
    source: 'Inversion of the Euler formula for the length',
    run: () => {
      const { outputs } = calculate({ ...BASE, buckling_safety_factor: 3.5 });
      assertClose(outputs.rod_max_stroke_m, Math.sqrt((Math.PI ** 2 * 210e9 * (Math.PI * 0.056 ** 4) / 64) / (3.5 * outputs.push_force_n)), { rel: 1e-12 }, 'formula');
      assertClose(outputs.rod_max_stroke_m, 1.349, { abs: 2e-3 }, 'value');
      const atLimit = calculate({ ...BASE, stroke_m: outputs.rod_max_stroke_m }).outputs;
      assertClose(atLimit.rod_buckling_factor, 3.5, { rel: 1e-9 }, 'factor at the limit');
    },
  },
  {
    name: 'Unit layer: 200 bar = 2 900 psi, 40 L/min = 10.57 US gpm, 157 kN = 35 310 lbf',
    source: 'NIST SP 811 conversion factors',
    run: () => {
      assertClose(convert(200e5, 'Pa', 'psi', 'pressure'), 2900.8, { abs: 0.1 }, 'psi');
      assertClose(convert(40 / 60000, 'm3_s', 'gpm_us', 'volume_flow'), 10.567, { abs: 1e-3 }, 'gpm');
      assertClose(convert(157080, 'N', 'lbf', 'force'), 35312, { abs: 1 }, 'lbf');
    },
  },
  {
    name: 'Invalid inputs fail fast: rod not smaller than the bore, zero stroke, unknown mounting',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...BASE, rod_m: 0.1 }), 'smaller than the bore', 'rod');
      assertThrows(() => calculate({ ...BASE, stroke_m: 0 }), 'greater than zero', 'stroke');
      assertThrows(() => calculate({ ...BASE, mounting: 'glued' }), 'must be one of', 'mounting');
    },
  },
];
