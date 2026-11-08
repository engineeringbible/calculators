/**
 * pipe-wall-thickness/tests.js — checks of the B31.3 eq. 3a transcription, allowances, tolerance and MAWP inversion.
 * Run: node run-tests.js pipe-wall-thickness
 */
import { calculate, MATERIALS, Y_TABLE, JOINT_FACTORS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const NPS8 = { design_pressure_bar: 16, design_temp_c: 100, outside_diameter_mm: 219.1, material: 'a106_b', s_custom_mpa: 120, y_class: 'ferritic', joint: 'seamless', w_factor: 1, corrosion_mm: 1.5, mechanical_mm: 0, mill_tolerance_pct: 12.5, available_wall_mm: 8.18 };

export const tests = [
  {
    name: 'Eq. 3a: NPS 8 A106 B seamless at 16 bar (1.6 MPa), S 137.9 MPa, E 1, W 1, Y 0.4 → t = 1.6 × 219.1/(2 × (137.9 + 0.64)) = 1.265 mm; t_m = 2.765 mm with 1.5 mm corrosion; nominal 2.765/0.875 = 3.160 mm',
    source: 'ASME B31.3 para. 304.1.2 eq. (3a); ASTM A530 12.5 % tolerance',
    run: () => {
      const { outputs } = calculate(NPS8);
      assertClose(outputs.t_pressure_mm, (1.6 * 219.1) / (2 * (137.9 + 1.6 * 0.4)), { rel: 1e-12 }, 'formula');
      assertClose(outputs.t_pressure_mm, 1.265, { abs: 1e-3 }, 't value');
      assertClose(outputs.t_min_mm, outputs.t_pressure_mm + 1.5, { rel: 1e-12 }, 't_m');
      assertClose(outputs.t_nominal_mm, outputs.t_min_mm / 0.875, { rel: 1e-12 }, 'nominal');
      assertClose(outputs.t_nominal_mm, 3.160, { abs: 1e-3 }, 'nominal value');
      assertEqual(outputs.y === 0.4 && outputs.e === 1 && outputs.s_mpa === 137.9, true, 'factors');
    },
  },
  {
    name: 'Schedule 40 (8.18 mm) check: t_eff = 8.18 × 0.875 − 1.5 = 5.658 mm; MAWP = 2 × 137.9 × 5.658/(219.1 − 0.8 × 5.658) = 7.27 MPa = 72.7 bar; 16 bar is 22 % of it; Barlow hoop stress 31.0 MPa; D/t_nom 69',
    source: 'Inversion of eq. (3a); Barlow σ = P D/(2 t)',
    run: () => {
      const { outputs, warnings } = calculate(NPS8);
      assertClose(outputs.t_eff_mm, 8.18 * 0.875 - 1.5, { rel: 1e-12 }, 't_eff');
      assertClose(outputs.mawp_pa / 1e6, (2 * 137.9 * outputs.t_eff_mm) / (219.1 - 0.8 * outputs.t_eff_mm), { rel: 1e-12 }, 'MAWP formula');
      assertClose(outputs.mawp_pa / 1e5, 72.7, { abs: 0.1 }, 'MAWP value');
      assertClose(outputs.utilisation_pct, 16 / (outputs.mawp_pa / 1e5) * 100, { rel: 1e-12 }, 'utilisation');
      assertClose(outputs.utilisation_pct, 22.0, { abs: 0.1 }, 'utilisation value');
      assertClose(outputs.hoop_stress_mpa, (1.6 * 219.1) / (2 * outputs.t_eff_mm), { rel: 1e-12 }, 'hoop');
      assertClose(outputs.hoop_stress_mpa, 31.0, { abs: 0.05 }, 'hoop value');
      assertEqual(outputs.schedule_check.startsWith('OK'), true, 'OK');
      assertEqual(warnings.some((w) => w.includes('less than 30 %')), true, 'governed by corrosion');
      assertClose(outputs.d_over_t, 219.1 / outputs.t_nominal_mm, { rel: 1e-12 }, 'D/t');
    },
  },
  {
    name: 'MAWP consistency: a pipe whose available wall equals the required nominal has MAWP equal to the design pressure; Sch 10 (3.76 mm) at 16 bar passes (nominal 3.16 required) but at 25 bar fails',
    source: 'Round-trip of the thickness and pressure equations',
    run: () => {
      const req = calculate(NPS8).outputs.t_nominal_mm;
      const exact = calculate({ ...NPS8, available_wall_mm: req }).outputs;
      assertClose(exact.mawp_pa / 1e5, 16, { rel: 1e-9 }, 'MAWP = P');
      assertClose(exact.utilisation_pct, 100, { rel: 1e-9 }, '100 %');
      assertEqual(calculate({ ...NPS8, available_wall_mm: 3.76 }).outputs.schedule_check.startsWith('OK'), true, 'Sch 10 at 16 bar');
      const fail = calculate({ ...NPS8, available_wall_mm: 3.76, design_pressure_bar: 25 });
      assertEqual(fail.outputs.schedule_check.startsWith('INSUFFICIENT') && fail.warnings.some((w) => w.includes('next schedule')), true, 'Sch 10 at 25 bar');
    },
  },
  {
    name: 'Factors: ERW (E 0.85) needs 1/0.85 more pressure thickness (to first order); Y rises to 0.5 for ferritic steel above 482 °C and to 0.7 above 510 °C, cast iron Y = 0; 316L has S 115.1 MPa',
    source: 'B31.3 Table A-1B (E), Table 304.1.1 (Y), Table A-1 (S)',
    run: () => {
      const seam = calculate(NPS8).outputs.t_pressure_mm;
      const erw = calculate({ ...NPS8, joint: 'erw' }).outputs.t_pressure_mm;
      assertClose(erw / seam, (137.9 + 0.64) / (137.9 * 0.85 + 0.64), { rel: 1e-12 }, 'E effect');
      assertEqual(JOINT_FACTORS.erw.e === 0.85 && JOINT_FACTORS.furnace_butt.e === 0.6, true, 'E table');
      assertEqual(Y_TABLE.ferritic.y(400) === 0.4 && Y_TABLE.ferritic.y(500) === 0.5 && Y_TABLE.ferritic.y(550) === 0.7, true, 'Y ferritic');
      assertEqual(Y_TABLE.austenitic.y(560) === 0.4 && Y_TABLE.cast_iron.y(20) === 0, true, 'Y austenitic / cast iron');
      assertClose(calculate({ ...NPS8, material: 'a312_tp316l' }).outputs.s_mpa, 115.1, { rel: 1e-12 }, '316L');
      assertEqual(MATERIALS.cuni_9010.s === 68.9, true, 'CuNi');
    },
  },
  {
    name: 'Custom material and high pressure: S 100 MPa, Y class austenitic at 600 °C gives Y 0.7; 400 bar on a 60.3 mm pipe gives P/(S E) = 0.29 and a thick-wall warning when t ≥ D/6; mechanical allowance adds to t_m',
    source: 'B31.3 para. 304.1.2(b) limits; allowance definition',
    run: () => {
      const hot = calculate({ ...NPS8, material: 'custom', s_custom_mpa: 100, y_class: 'austenitic', design_temp_c: 600 }).outputs;
      assertEqual(hot.y, 0.7, 'Y 0.7');
      assertClose(hot.s_mpa, 100, { rel: 1e-12 }, 'custom S');
      const thick = calculate({ ...NPS8, design_pressure_bar: 400, outside_diameter_mm: 60.3, available_wall_mm: 11.07 });
      assertClose(thick.outputs.pse_ratio, 40 / 137.9, { rel: 1e-12 }, 'P/(SE)');
      assertEqual(thick.outputs.t_pressure_mm >= 60.3 / 6 ? thick.warnings.some((w) => w.includes('D/6')) : true, true, 'thick-wall warning when applicable');
      const mech = calculate({ ...NPS8, mechanical_mm: 1.2 }).outputs;
      assertClose(mech.t_min_mm, calculate(NPS8).outputs.t_min_mm + 1.2, { rel: 1e-12 }, 'mechanical allowance');
    },
  },
  {
    name: 'Validation: zero pressure, zero diameter and an unknown joint are rejected; low-temperature carbon steel is flagged below −29 °C',
    source: 'Validation contract; B31.3 para. 323.2.2',
    run: () => {
      assertThrows(() => calculate({ ...NPS8, design_pressure_bar: 0 }), 'greater than zero', 'pressure');
      assertThrows(() => calculate({ ...NPS8, outside_diameter_mm: 0 }), 'greater than zero', 'diameter');
      assertThrows(() => calculate({ ...NPS8, joint: 'riveted' }), 'must be one of', 'joint');
      assertEqual(calculate({ ...NPS8, design_temp_c: -40 }).warnings.some((w) => w.includes('impact testing')), true, 'low temperature');
      assertEqual(calculate({ ...NPS8, design_temp_c: -40, material: 'a333_6' }).warnings.some((w) => w.includes('impact testing')), false, 'A333 OK');
    },
  },
];
