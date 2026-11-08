/**
 * wave-properties/tests.js — checks against the analytical limits and tabulated values of linear wave theory.
 * Run: node run-tests.js wave-properties
 */
import { calculate, wavenumber, periodFromLength } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const G = 9.80665;
const DEEP10 = { wave_input: 'period', period_s: 10, height_m: 3, depth_mode: 'deep', eval_depth_m: 10, speed_kn: 15, heading_deg: 0, rho_kg_m3: 1025 };

export const tests = [
  {
    name: 'Deep water, T = 10 s: λ₀ = g T²/2π = 156.1 m, c = 15.6 m/s, c_g = c/2 = 7.8 m/s, k = 0.0402 1/m; the 1.56 T² rule of thumb',
    source: 'Dean & Dalrymple (1991) eq. 3.34; MSC.1/Circ.1228 λ = 1.56 T²',
    run: () => {
      const { outputs } = calculate(DEEP10);
      assertClose(outputs.length_out_m, (G * 100) / (2 * Math.PI), { rel: 1e-12 }, 'λ₀');
      assertClose(outputs.length_out_m, 156.1, { abs: 0.1 }, '156 m');
      assertClose(outputs.celerity_m_s, outputs.length_out_m / 10, { rel: 1e-12 }, 'c');
      assertClose(outputs.group_velocity_m_s, outputs.celerity_m_s / 2, { rel: 1e-12 }, 'c_g = c/2');
      assertClose(outputs.wavenumber, (2 * Math.PI) / outputs.length_out_m, { rel: 1e-12 }, 'k');
      assertEqual(outputs.regime.startsWith('Deep'), true, 'regime');
      assertEqual(outputs.depth_ratio, null, 'no depth ratio in deep mode');
    },
  },
  {
    name: 'Dispersion table: h/λ₀ = 0.10 (T 8 s, h 10.0 m) gives kh = 0.886, h/λ = 0.1410 and tanh(kh) = 0.709; wavelength 70.9 m instead of 99.9 m',
    source: 'Wiegel (1964) Table A1 / USACE CEM Part II-1 Table II-1-1: d/L₀ 0.1000 → d/L 0.1410, tanh(kd) 0.7093 (kd tanh kd = 2π·0.1)',
    run: () => {
      const L0 = (G * 64) / (2 * Math.PI);
      const h = 0.1 * L0;
      const { outputs } = calculate({ ...DEEP10, period_s: 8, depth_mode: 'finite', depth_m: h });
      assertClose(outputs.depth_ratio, 0.1410, { abs: 2e-4 }, 'h/λ');
      assertClose(outputs.wavenumber * h, 0.886, { abs: 1e-3 }, 'kh');
      assertClose(Math.tanh(outputs.wavenumber * h), 0.7093, { abs: 1e-3 }, 'tanh kh');
      assertClose(outputs.length_out_m, h / 0.1410, { rel: 2e-3 }, 'λ');
      assertEqual(outputs.regime.startsWith('Intermediate'), true, 'regime');
      assertClose(outputs.deep_length_m, L0, { rel: 1e-12 }, 'λ₀ reported');
    },
  },
  {
    name: 'Shallow limit: T 30 s in 1 m of water → c → √(gh) = 3.13 m/s within 1 %, c_g → c, regime shallow; Newton solver satisfies ω² = g k tanh(kh) to 1e-10',
    source: 'Dean & Dalrymple (1991) §3.4 shallow-water asymptote; dispersion relation',
    run: () => {
      const { outputs } = calculate({ ...DEEP10, period_s: 30, depth_mode: 'finite', depth_m: 1 });
      assertClose(outputs.celerity_m_s, Math.sqrt(G * 1), { rel: 1e-2 }, 'c ≈ √(gh)');
      assertClose(outputs.group_velocity_m_s / outputs.celerity_m_s, 1, { abs: 1e-2 }, 'c_g ≈ c');
      assertEqual(outputs.regime.startsWith('Shallow'), true, 'regime');
      for (const [T, h] of [[6, 5], [10, 30], [14, 200], [3, 0.5]]) {
        const omega = (2 * Math.PI) / T;
        const k = wavenumber(omega, h);
        assertClose(G * k * Math.tanh(k * h), omega * omega, { rel: 1e-10 }, `dispersion T ${T} h ${h}`);
      }
    },
  },
  {
    name: 'Wavelength input: λ = 156.13 m in deep water returns T = 10.00 s; in 30 m depth the same λ needs T = 10.63 s (shoaling lengthens the period for a given length)',
    source: 'Inverse of the dispersion relation T = 2π/√(g k tanh kh)',
    run: () => {
      const L0 = (G * 100) / (2 * Math.PI);
      assertClose(periodFromLength(L0, Infinity), 10, { rel: 1e-12 }, 'deep inverse');
      const r = calculate({ ...DEEP10, wave_input: 'length', length_m: L0 }).outputs;
      assertClose(r.period_out_s, 10, { rel: 1e-9 }, 'in calculate');
      const finite = calculate({ ...DEEP10, wave_input: 'length', length_m: L0, depth_mode: 'finite', depth_m: 30 }).outputs;
      assertClose(finite.period_out_s, (2 * Math.PI) / Math.sqrt(G * (2 * Math.PI / L0) * Math.tanh((2 * Math.PI * 30) / L0)), { rel: 1e-12 }, 'finite inverse');
      assertEqual(finite.period_out_s > 10, true, 'longer period');
    },
  },
  {
    name: 'Orbital velocities (deep, H 3 m, T 10 s): surface amplitude π H/T = 0.942 m/s, at 10 m depth × e^(−k z) = 0.630 m/s, bottom 0; finite depth 30 m: bottom velocity a ω/sinh(kh) > 0',
    source: 'Dean & Dalrymple (1991) eq. 4.14 horizontal velocity u = a ω cosh(k(h+z))/sinh(kh)',
    run: () => {
      const deep = calculate(DEEP10).outputs;
      assertClose(deep.surface_velocity_m_s, (Math.PI * 3) / 10, { rel: 1e-12 }, 'surface');
      assertClose(deep.depth_velocity_m_s, deep.surface_velocity_m_s * Math.exp(-deep.wavenumber * 10), { rel: 1e-12 }, 'decay');
      assertClose(deep.depth_velocity_m_s, 0.630, { abs: 2e-3 }, 'value at 10 m');
      assertEqual(deep.bottom_velocity_m_s, 0, 'deep bottom');
      const finite = calculate({ ...DEEP10, depth_mode: 'finite', depth_m: 30 }).outputs;
      const k = finite.wavenumber;
      assertClose(finite.bottom_velocity_m_s, (1.5 * (2 * Math.PI / 10)) / Math.sinh(k * 30), { rel: 1e-12 }, 'bottom finite');
      assertEqual(finite.bottom_velocity_m_s > 0, true, 'bottom moves');
    },
  },
  {
    name: 'Energy flux: H 3 m, T 10 s deep → ρ g H² c_g/8 = 1025·9.807·9·7.81/8 = 88.3 kW/m; equals ρ g² H² T/(32π) in deep water',
    source: 'Holthuijsen (2007) §5.5; Dean & Dalrymple eq. 4.73 energy flux E c_g',
    run: () => {
      const { outputs } = calculate(DEEP10);
      assertClose(outputs.energy_flux_kw_m, (1025 * G * 9 * outputs.group_velocity_m_s) / 8, { rel: 1e-12 }, 'formula');
      assertClose(outputs.energy_flux_kw_m, (1025 * G * G * 9 * 10) / (32 * Math.PI), { rel: 1e-9 }, 'deep-water form');
      assertClose(outputs.energy_flux_kw_m / 1000, 88.3, { abs: 0.3 }, 'kW/m');
    },
  },
  {
    name: 'Breaking (Miche): deep water H_max = 0.142 λ = 22.2 m for λ 156 m (3 m wave stable); in 2 m depth with T 10 s the limit falls to ≈ 1.7 m so a 3 m wave is BREAKING',
    source: 'Miche (1944) H/λ = 0.142 tanh(kh)',
    run: () => {
      const deep = calculate(DEEP10).outputs;
      assertClose(deep.breaking_height_m, 0.142 * deep.length_out_m, { rel: 1e-12 }, 'deep limit');
      assertEqual(deep.breaking_status.startsWith('Stable'), true, 'stable');
      const shallow = calculate({ ...DEEP10, depth_mode: 'finite', depth_m: 2 }).outputs;
      assertEqual(shallow.breaking_height_m < 2, true, 'limit below depth');
      assertEqual(shallow.breaking_status.startsWith('BREAKING'), true, 'breaking');
    },
  },
  {
    name: 'Encounter period: 15 kn head seas in 10 s waves → T_e = 2π/(ω + k V) = 6.69 s vs 6.67 s by Circ.1228 (within 1.5 %); beam seas 10 s; following seas 19.8 s; overtaking waves flagged',
    source: 'Linear kinematics ω_e = ω + k V cos α; MSC.1/Circ.1228 §1.6 approximation',
    run: () => {
      const head = calculate(DEEP10).outputs;
      const k = head.wavenumber;
      assertClose(head.encounter_period_s, (2 * Math.PI) / ((2 * Math.PI) / 10 + k * 15 * (1852 / 3600)), { rel: 1e-12 }, 'formula');
      assertClose(head.encounter_period_s, 6.69, { abs: 0.01 }, 'value');
      assertClose(head.encounter_circ_s, 300 / 45, { rel: 1e-12 }, 'circular');
      assertEqual(Math.abs(head.encounter_period_s / head.encounter_circ_s - 1) < 0.015, true, 'within 1.5 %');
      assertClose(calculate({ ...DEEP10, heading_deg: 90 }).outputs.encounter_period_s, 10, { rel: 1e-9 }, 'beam');
      const following = calculate({ ...DEEP10, heading_deg: 180 }).outputs;
      assertClose(following.encounter_period_s, (2 * Math.PI) / ((2 * Math.PI) / 10 - k * 15 * (1852 / 3600)), { rel: 1e-12 }, 'following');
      const fast = calculate({ ...DEEP10, heading_deg: 180, speed_kn: 40 });
      assertEqual(fast.warnings.some((w) => w.includes('overtaking')), true, 'overtaking warning');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero period, negative height, heading above 360°',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...DEEP10, period_s: 0 }), 'greater than zero', 'period');
      assertThrows(() => calculate({ ...DEEP10, height_m: -1 }), 'must not be negative', 'height');
      assertThrows(() => calculate({ ...DEEP10, heading_deg: 400 }), 'between', 'heading');
    },
  },
  {
    name: 'In very deep finite water (kh far above 710) the orbital velocity equals the deep-water value instead of overflowing to NaN',
    source: 'Range fuzzing (fuzz.js): cosh(k(h − z))/sinh(kh) evaluated as e^(−kz)(1 + e^(−2k(h−z)))/(1 − e^(−2kh))',
    run: () => {
      const deep = calculate({ depth_mode: 'deep' }).outputs.surface_velocity_m_s;
      assertClose(calculate({ depth_m: 120001 }).outputs.surface_velocity_m_s, deep, { rel: 1e-12 }, 'surface velocity');
    },
  },
];
