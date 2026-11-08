/**
 * beam-deflection/tests.js — checks against the standard beam tables (Gere, Roark, Hibbeler) and rolled-section data.
 * Run: node run-tests.js beam-deflection
 */
import { calculate, solveBeam, sectionProperties, beamDiagrams } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** IPE 200 from the section tables (I_y = 1943 cm⁴, h = 200 mm) entered as a custom section, E = 210 GPa. */
const IPE200 = { section: 'custom', i_custom_m4: 1943e-8, c_custom_m: 0.1, material: 'steel_en' };
const EI = 210e9 * 1943e-8;

export const tests = [
  {
    name: 'Simply supported, 10 kN at midspan of 4 m on IPE 200: M = 10 kN·m, σ = 51.5 MPa, δ = P L³ / 48 EI = 3.27 mm',
    source: 'Gere & Goodno, Mechanics of Materials, 8th ed., Appendix G Table G-2 case 4; W_el,y of IPE 200 = 194.3 cm³ (ArcelorMittal tables) gives 10 kN·m / 194.3 cm³ = 51.5 MPa',
    run: () => {
      const { outputs } = calculate({ ...IPE200, load_case: 'ss_point_center', length_m: 4, point_load_n: 10000 });
      assertClose(outputs.m_max_nm, 10000, { rel: 1e-12 }, 'M');
      assertClose(outputs.sigma_max_pa, 51.47e6, { rel: 2e-3 }, 'σ');
      assertClose(outputs.delta_max_m, (10000 * 64) / (48 * EI), { rel: 1e-12 }, 'δ formula');
      assertClose(outputs.delta_max_m, 3.268e-3, { abs: 2e-6 }, 'δ value');
      assertClose(outputs.reaction_a_n, 5000, { rel: 1e-12 }, 'R_A');
      assertClose(outputs.z_m3, 194.3e-6, { rel: 1e-3 }, 'Z');
    },
  },
  {
    name: 'Simply supported UDL 5 kN/m over 4 m: M = w L²/8 = 10 kN·m, δ = 5 w L⁴ / 384 EI = 4.08 mm',
    source: 'Gere & Goodno, Appendix G Table G-2 case 1; Roark 8th ed. Table 8.1 case 2e',
    run: () => {
      const { outputs } = calculate({ ...IPE200, load_case: 'ss_udl', length_m: 4, udl_n_m: 5000 });
      assertClose(outputs.m_max_nm, 10000, { rel: 1e-12 }, 'M');
      assertClose(outputs.delta_max_m, 4.0847e-3, { abs: 2e-6 }, 'δ');
      assertClose(outputs.reaction_a_n + outputs.reaction_b_n, 20000, { rel: 1e-12 }, 'reactions sum to w L');
    },
  },
  {
    name: 'Cantilever 2 m: end load 10 kN → M = 20 kN·m, δ = P L³ / 3 EI = 6.54 mm; UDL 5 kN/m → M = 10 kN·m, δ = w L⁴ / 8 EI = 2.45 mm',
    source: 'Gere & Goodno, Appendix G Table G-1 cases 1 and 4; Hibbeler Appendix C',
    run: () => {
      const point = calculate({ ...IPE200, load_case: 'cant_point_end', length_m: 2, point_load_n: 10000 }).outputs;
      assertClose(point.m_max_nm, 20000, { rel: 1e-12 }, 'M point');
      assertClose(point.delta_max_m, 6.5355e-3, { abs: 2e-6 }, 'δ point');
      assertEqual(point.reaction_b_n, null, 'no second support');
      const udl = calculate({ ...IPE200, load_case: 'cant_udl', length_m: 2, udl_n_m: 5000 }).outputs;
      assertClose(udl.m_max_nm, 10000, { rel: 1e-12 }, 'M udl');
      assertClose(udl.delta_max_m, 2.4508e-3, { abs: 2e-6 }, 'δ udl');
    },
  },
  {
    name: 'Fixed both ends: central 10 kN → M = P L / 8 = 5 kN·m, δ = P L³ / 192 EI (¼ of simply supported); UDL → M = w L² / 12, δ = w L⁴ / 384 EI (⅕)',
    source: 'Roark 8th ed. Table 8.1 cases 1d and 2d (both ends fixed); Gere Appendix G',
    run: () => {
      const ssPoint = calculate({ ...IPE200, load_case: 'ss_point_center', length_m: 4, point_load_n: 10000 }).outputs;
      const ffPoint = calculate({ ...IPE200, load_case: 'ff_point_center', length_m: 4, point_load_n: 10000 }).outputs;
      assertClose(ffPoint.m_max_nm, 5000, { rel: 1e-12 }, 'M ff point');
      assertClose(ffPoint.delta_max_m, ssPoint.delta_max_m / 4, { rel: 1e-12 }, 'δ ratio point');
      const ssUdl = calculate({ ...IPE200, load_case: 'ss_udl', length_m: 4, udl_n_m: 5000 }).outputs;
      const ffUdl = calculate({ ...IPE200, load_case: 'ff_udl', length_m: 4, udl_n_m: 5000 }).outputs;
      assertClose(ffUdl.m_max_nm, (5000 * 16) / 12, { rel: 1e-12 }, 'M ff udl');
      assertClose(ffUdl.delta_max_m, ssUdl.delta_max_m / 5, { rel: 1e-12 }, 'δ ratio udl');
    },
  },
  {
    name: 'Off-centre point load a = 1 m on 4 m span: R_A = 7.5 kN, M = P a b / L = 7.5 kN·m, δmax = 2.284 mm at 1.764 m from the left; a = L/2 reproduces the midspan case',
    source: 'Gere & Goodno, Appendix G Table G-2 case 5: δmax = P b (L² − b²)^{3/2} / (9√3 E I L) at x = √((L² − b²)/3)',
    run: () => {
      const { outputs } = calculate({ ...IPE200, load_case: 'ss_point_at_a', length_m: 4, point_load_n: 10000, load_position_m: 1 });
      assertClose(outputs.reaction_a_n, 7500, { rel: 1e-12 }, 'R_A');
      assertClose(outputs.reaction_b_n, 2500, { rel: 1e-12 }, 'R_B');
      assertClose(outputs.m_max_nm, 7500, { rel: 1e-12 }, 'M');
      assertClose(outputs.delta_max_m, 2.2837e-3, { abs: 2e-6 }, 'δmax');
      assertEqual(outputs.delta_location.startsWith('1.764'), true, 'location');
      const central = solveBeam('ss_point_at_a', { L: 4, P: 10000, a: 2, EI });
      assertClose(central.deltaMax, (10000 * 64) / (48 * EI), { rel: 1e-9 }, 'a = L/2 equals P L³ / 48 EI');
    },
  },
  {
    name: 'Cantilever with the load 1.5 m from the fixed end of 2 m: M = P a = 15 kN·m, δ_end = P a² (3L − a) / 6 EI = 4.14 mm',
    source: 'Gere & Goodno, Appendix G Table G-1 case 5',
    run: () => {
      const { outputs } = calculate({ ...IPE200, load_case: 'cant_point_at_a', length_m: 2, point_load_n: 10000, load_position_m: 1.5 });
      assertClose(outputs.m_max_nm, 15000, { rel: 1e-12 }, 'M');
      assertClose(outputs.delta_max_m, 4.1357e-3, { abs: 2e-6 }, 'δ');
    },
  },
  {
    name: 'Section properties: circle Ø100 I = 490.9 cm⁴, Z = 98.2 cm³; rectangle 100×200 I = 6 667 cm⁴; tube Ø100×5 I = 168.8 cm⁴; IPE 200 by formula 1 846 cm⁴ (tables 1 943, fillets)',
    source: 'Standard section formulas (Gere Appendix E); ArcelorMittal / EN 10365 IPE 200: h 200, b 100, t_w 5.6, t_f 8.5, I_y 1943 cm⁴, A 28.5 cm²',
    run: () => {
      const circle = sectionProperties({ section: 'circle', diameter_m: 0.1 });
      assertClose(circle.i, 490.87e-8, { rel: 1e-4 }, 'I circle');
      assertClose(circle.i / circle.c, 98.17e-6, { rel: 1e-4 }, 'Z circle');
      const rect = sectionProperties({ section: 'rectangle', width_m: 0.1, height_m: 0.2 });
      assertClose(rect.i, 6666.67e-8, { rel: 1e-6 }, 'I rectangle');
      const tube = sectionProperties({ section: 'hollow_circle', diameter_m: 0.1, wall_m: 0.005 });
      assertClose(tube.i, 168.8e-8, { rel: 1e-3 }, 'I tube');
      const ipe = sectionProperties({ section: 'i_beam', width_m: 0.1, height_m: 0.2, flange_m: 0.0085, web_m: 0.0056 });
      assertClose(ipe.i, 1846e-8, { rel: 1e-3 }, 'I IPE formula');
      assertClose(ipe.i / 1943e-8, 0.95, { abs: 0.01 }, 'within 5 % of the table (fillets)');
      assertClose(ipe.area, 27.25e-4, { rel: 1e-3 }, 'area IPE formula (table 28.5 cm²)');
    },
  },
  {
    name: 'Utilisation and safety: σ 51.5 MPa against S235 → 21.9 %, factor 4.57; yielding case raises a warning',
    source: 'Utilisation = σ / f_y with f_y = 235 MPa (EN 10025-2 S235)',
    run: () => {
      const { outputs } = calculate({ ...IPE200, load_case: 'ss_point_center', length_m: 4, point_load_n: 10000, yield_pa: 235e6 });
      assertClose(outputs.utilisation_pct, 21.9, { abs: 0.05 }, 'utilisation');
      assertClose(outputs.safety_factor, 4.566, { abs: 5e-3 }, 'safety factor');
      const yielding = calculate({ ...IPE200, load_case: 'ss_point_center', length_m: 4, point_load_n: 60000 });
      assertEqual(yielding.warnings.some((w) => w.includes('exceeds the yield')), true, 'yield warning');
    },
  },
  {
    name: 'Unit layer: 1 in⁴ = 41.623 cm⁴, 1 kip·ft = 1.3558 kN·m, 1 ksi = 6.8948 MPa',
    source: 'NIST SP 811 Appendix B (exact inch and pound definitions)',
    run: () => {
      assertClose(convert(1, 'in4', 'cm4', 'second_moment_of_area'), 41.6231, { abs: 1e-4 }, 'in⁴');
      assertClose(convert(1, 'kN_m', 'lbf_ft', 'torque'), 737.562, { abs: 1e-3 }, 'kN·m → lbf·ft');
      assertClose(convert(1, 'ksi', 'MPa', 'pressure'), 6.894757, { abs: 1e-6 }, 'ksi');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero span, load position beyond the span, wall thicker than half the tube',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ length_m: 0 }), 'greater than zero', 'span');
      assertThrows(() => calculate({ load_case: 'ss_point_at_a', length_m: 4, load_position_m: 5 }), 'between 0 and 4', 'position');
      assertThrows(() => calculate({ section: 'hollow_circle', diameter_m: 0.1, wall_m: 0.06 }), 'less than half', 'wall');
    },
  },
  {
    name: 'Shear, moment and deflection diagrams agree with the closed-form maxima for all eight cases; fixed ends carry −PL/8 and −wL²/12',
    source: 'Gere and Goodno, Mechanics of Materials, Appendix G (beam deflections and slopes); equilibrium of the free body',
    run: () => {
      const L = 5; const P = 10000; const w = 4000; const a = 1.5; const EI = 1.6e6;
      for (const c of ['ss_point_center', 'ss_point_at_a', 'ss_udl', 'cant_point_end', 'cant_point_at_a', 'cant_udl', 'ff_point_center', 'ff_udl']) {
        const d = beamDiagrams(c, { L, P, w, a, EI }, 2001);
        const sol = solveBeam(c, { L, P, w, a, EI });
        assertClose(Math.max(...d.map((p) => Math.abs(p.M))), sol.mMax, { rel: 1e-4 }, `${c} M`);
        assertClose(Math.max(...d.map((p) => Math.abs(p.y))), sol.deltaMax, { rel: 1e-4 }, `${c} y`);
        assertClose(d[0].V, sol.reactionA, { rel: 1e-9 }, `${c} V at x = 0`);
      }
      assertClose(beamDiagrams('ff_point_center', { L, P, EI })[0].M, -P * L / 8, { rel: 1e-12 }, 'fixed end PL/8');
      assertClose(beamDiagrams('ff_udl', { L, w, EI })[0].M, -w * L * L / 12, { rel: 1e-12 }, 'fixed end wL²/12');
    },
  },
];
