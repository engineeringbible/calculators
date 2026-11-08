/**
 * engine-bmep/tests.js — checks against the textbook definitions and two engine classes.
 * Run: node run-tests.js engine-bmep
 */
import { calculate, CYCLES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const MEDIUM = { cylinders: 6, bore_mm: 320, stroke_mm: 400, cycle: 'four_stroke', rpm: 750, mode: 'power', power_kw: 3000, eta_m: 0.9 };

export const tests = [
  {
    name: 'Medium-speed four-stroke 6 × 320 × 400 mm at 750 rpm, 3 000 kW: V_d = π/4 × 0.32² × 0.4 = 32.17 L per cylinder (193.0 L total), BMEP = P × 60 × 2/(V_d,tot N) = 24.87 bar',
    source: 'Heywood, Internal Combustion Engine Fundamentals, eq. 2.5 (P = p_me V_d N/(60 n_R), n_R = 2)',
    run: () => {
      const { outputs } = calculate(MEDIUM);
      assertClose(outputs.swept_cylinder_m3, (Math.PI / 4) * 0.32 ** 2 * 0.4, { rel: 1e-12 }, 'V_d');
      assertClose(outputs.swept_cylinder_m3 * 1000, 32.17, { abs: 0.01 }, 'V_d litres');
      assertClose(outputs.swept_total_m3 * 1000, 193.02, { abs: 0.01 }, 'total');
      assertClose(outputs.bmep_pa, (3e6 * 60 * 2) / (outputs.swept_total_m3 * 750), { rel: 1e-12 }, 'BMEP formula');
      assertClose(outputs.bmep_pa / 1e5, 24.87, { abs: 0.01 }, 'BMEP value');
      assertClose(outputs.power_per_cylinder_w, 500e3, { rel: 1e-12 }, 'per cylinder');
    },
  },
  {
    name: 'Torque, piston speed and specific power: T = 60 × 3e6/(2π × 750) = 38.20 kN·m, c_m = 2 × 0.4 × 750/60 = 10.0 m/s, 15.5 kW/L, stroke/bore 1.25, work per cycle 80 kJ',
    source: 'Heywood eqs. 2.2 (torque) and 2.9 (mean piston speed)',
    run: () => {
      const { outputs } = calculate(MEDIUM);
      assertClose(outputs.torque_nm, (60 * 3e6) / (2 * Math.PI * 750), { rel: 1e-12 }, 'torque');
      assertClose(outputs.torque_nm / 1000, 38.20, { abs: 0.01 }, 'torque value');
      assertClose(outputs.piston_speed_m_s, 10, { rel: 1e-12 }, 'c_m');
      assertClose(outputs.specific_power_kw_l, 3000 / 193.02, { rel: 1e-4 }, 'kW/L');
      assertClose(outputs.stroke_bore_ratio, 1.25, { rel: 1e-12 }, 'S/D');
      assertClose(outputs.work_per_cycle_j, outputs.bmep_pa * outputs.swept_cylinder_m3, { rel: 1e-12 }, 'work per cycle');
      assertClose(outputs.work_per_cycle_j / 1000, 80, { rel: 1e-9 }, '80 kJ (= 500 kW / 6.25 cycles/s)');
    },
  },
  {
    name: 'Two-stroke cylinder 500 × 2 214 mm at 127 rpm with 1 780 kW: n_R = 1 → BMEP 19.3 bar (catalogue order 20 bar), c_m = 9.37 m/s',
    source: 'MAN B&W S50ME-C class data (L1 point ≈ 1 780 kW/cyl at 127 rpm, MEP ≈ 20 bar); Heywood eq. 2.5 with n_R = 1',
    run: () => {
      const r = calculate({ cylinders: 1, bore_mm: 500, stroke_mm: 2214, cycle: 'two_stroke', rpm: 127, mode: 'power', power_kw: 1780, eta_m: 0.9 }).outputs;
      const vd = (Math.PI / 4) * 0.5 ** 2 * 2.214;
      assertClose(r.bmep_pa, (1.78e6 * 60) / (vd * 127), { rel: 1e-12 }, 'BMEP two-stroke');
      assertClose(r.bmep_pa / 1e5, 19.3, { abs: 0.1 }, 'value');
      assertClose(r.piston_speed_m_s, (2 * 2.214 * 127) / 60, { rel: 1e-12 }, 'c_m');
      assertEqual(CYCLES.two_stroke.nR === 1 && CYCLES.four_stroke.nR === 2, true, 'n_R');
      assertEqual(r.classification.startsWith('Within the large two-stroke range'), true, 'class');
    },
  },
  {
    name: 'Inverse mode: BMEP 24.87 bar on the same engine returns 3 000 kW; IMEP = BMEP/0.9 = 27.63 bar, FMEP 2.76 bar; halving the speed at constant BMEP halves the power and leaves the torque unchanged',
    source: 'Definitions of IMEP, FMEP and mechanical efficiency (Heywood §2.4); P ∝ N at constant p_me',
    run: () => {
      const inv = calculate({ ...MEDIUM, mode: 'bmep', bmep_bar: calculate(MEDIUM).outputs.bmep_pa / 1e5 }).outputs;
      assertClose(inv.power_w / 1000, 3000, { rel: 1e-9 }, 'power back');
      assertClose(inv.imep_pa / 1e5, 27.63, { abs: 0.01 }, 'IMEP');
      assertClose(inv.fmep_pa, inv.imep_pa - inv.bmep_pa, { rel: 1e-12 }, 'FMEP');
      const half = calculate({ ...MEDIUM, mode: 'bmep', bmep_bar: 24.87, rpm: 375 }).outputs;
      const full = calculate({ ...MEDIUM, mode: 'bmep', bmep_bar: 24.87, rpm: 750 }).outputs;
      assertClose(half.power_w, full.power_w / 2, { rel: 1e-12 }, 'P ∝ N');
      assertClose(half.torque_nm, full.torque_nm, { rel: 1e-12 }, 'T constant');
    },
  },
  {
    name: 'Warnings and validation: a high-speed engine at 14 m/s piston speed is flagged; a two-stroke at 1 000 rpm is flagged; fractional cylinders, zero bore and an unknown cycle are rejected',
    source: 'Typical piston-speed ranges (Pounder\'s); validation contract',
    run: () => {
      const fast = calculate({ ...MEDIUM, bore_mm: 170, stroke_mm: 210, rpm: 2000, power_kw: 2000 });
      assertEqual(fast.outputs.piston_speed_m_s === 14 && fast.warnings.some((w) => w.includes('piston speed')), true, 'piston speed warning');
      assertEqual(calculate({ ...MEDIUM, cycle: 'two_stroke', rpm: 1000 }).warnings.some((w) => w.includes('two-stroke above 300 rpm')), true, 'two-stroke rpm');
      assertThrows(() => calculate({ ...MEDIUM, cylinders: 6.5 }), 'whole number', 'cylinders');
      assertThrows(() => calculate({ ...MEDIUM, bore_mm: 0 }), 'greater than zero', 'bore');
      assertThrows(() => calculate({ ...MEDIUM, cycle: 'six_stroke' }), 'must be one of', 'cycle');
    },
  },
];
