/**
 * steel-beam-size/tests.js — checks against AISC Design Example F.1-1A/B, AISC 360-22 F2 and G2, and EN 1993-1-1 6.2.
 * Run: node run-tests.js steel-beam-size
 */
import { calculate, checkSection, SECTIONS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const PLF = 14.593902937206;
const FT = 0.3048;
const IN = 0.0254;
const KIP = 4448.2216152605;
const KIP_FT = 1355.8179483314;
const IN4 = 4.162314256e-7;
const find = (series, label) => SECTIONS[series].find((s) => s.label === label);
const prep = (o) => ({ span: 6, wD: 0, wL: 0, pD: 0, pL: 0, limit: 360, addSelf: false, method: 'lrfd', fyKsi: 50, fyMpa: 275, ...o });

export const tests = [
  {
    name: 'AISC Example F.1-1A: 35 ft, 0.45 + 0.75 kip/ft, depth ≤ 18 in, L/360 selects W18x50; M_u 266.4 kip·ft, φM_n 378.8, M_a 183.8, M_n/Ω 252.0, I_req 748 in⁴',
    source: 'AISC Design Examples (v15.0/16.0), F.1-1A and F.1-1B; STAAD.Pro verification problem of the same example',
    run: () => {
      const base = { span_m: 35 * FT, dead_n_m: 450 * PLF, live_n_m: 750 * PLF, self_weight: 'included', max_depth_m: 18 * IN, limit: '360' };
      const l = calculate({ ...base, method: 'lrfd' }).outputs;
      assertEqual(l.section, 'W18x50', 'LRFD section');
      assertClose(l.moment_nm / KIP_FT, 266.4375, { abs: 1e-6 }, 'M_u = 1.74 × 35² / 8 = 266.4');
      assertClose(l.moment_cap_nm / KIP_FT, 378.75, { abs: 1e-6 }, 'φM_n = 0.9 × 50 × 101 / 12 = 378.8');
      assertClose(l.ix_req_m4 / IN4, 748, { abs: 0.5 }, 'I_x required');
      assertClose(l.shear_n / KIP, 30.45, { abs: 0.01 }, 'V_u = 1.74 × 17.5');
      const a = calculate({ ...base, method: 'asd' }).outputs;
      assertEqual(a.section, 'W18x50', 'ASD section');
      assertClose(a.moment_nm / KIP_FT, 183.75, { abs: 1e-6 }, 'M_a = 1.20 × 35² / 8 = 183.8');
      assertClose(a.moment_cap_nm / KIP_FT, 252.0, { abs: 0.05 }, 'M_n/Ω');
      // without the depth limit the lighter, deeper W21x44 works (I_x 843 ≥ 748 in⁴, Z_x 95.4 in³)
      assertEqual(calculate({ ...base, max_depth_m: 0 }).outputs.section, 'W21x44', 'no depth limit');
    },
  },
  {
    name: 'Worked example: 20 ft, 400 + 800 lb/ft plus self-weight, LRFD, A992: W14x22, M_u 89 320 lbf·ft, φM_n 124 500, φV_n 94.5 kip, δ_L 0.50 in ≤ 0.67 in',
    source: 'Hand calculation: w_u = 1.2 × 422 + 1.6 × 800 = 1 786.4 lb/ft, M_u = w_u L²/8; φM_n = 0.9 × 50 × 33.2 / 12; φV_n = 0.6 × 50 × 13.7 × 0.23 (AISC G2.1(a))',
    run: () => {
      const o = calculate({}).outputs;
      assertEqual(o.section, 'W14x22', 'section');
      assertClose(o.moment_nm / 1.3558179483314, 89320, { abs: 0.5 }, 'M_u');
      assertClose(o.moment_cap_nm / KIP_FT, 124.5, { abs: 1e-6 }, 'φM_n');
      assertClose(o.shear_cap_n / KIP, 94.53, { abs: 0.005 }, 'φV_n');
      assertClose(o.defl_live_m / IN, (5 * (800 / 12) * 240 ** 4) / (384 * 29e6 * 199), { rel: 1e-9 }, 'δ_L');
      assertClose(o.self_n_m / PLF, 22, { rel: 1e-9 }, 'self-weight');
    },
  },
  {
    name: 'AISC G2.1: W12x14 (h/t_w 54.3 > 2.24√(E/F_y) = 53.9) takes φ_v = 0.90, φV_n = 64.3 kip; W14x22 (53.3) takes φ_v = 1.00; A36 makes W8x10 compact (b_f/2t_f 9.61 ≤ 10.8) but A992 does not (> 9.15)',
    source: 'ANSI/AISC 360-22 G2.1(a) and (b), Table B4.1b case 10: λ_p = 0.38√(E/F_y); hand calculation 0.9 × 0.6 × 50 × 11.9 × 0.20',
    run: () => {
      const c = checkSection(find('w', 'W12x14'), prep({ wL: 1000 }));
      assertClose(c.vCap / KIP, 0.9 * 0.6 * 50 * 11.9 * 0.2, { rel: 1e-9 }, 'W12x14 φV_n');
      assertClose(checkSection(find('w', 'W14x22'), prep({ wL: 1000 })).vCap / KIP, 0.6 * 50 * 13.7 * 0.23, { rel: 1e-9 }, 'W14x22 φV_n');
      assertEqual(checkSection(find('w', 'W8x10'), prep({ wL: 1000 })), null, 'W8x10 at 50 ksi');
      assertEqual(checkSection(find('w', 'W8x10'), prep({ wL: 1000, fyKsi: 36 })) !== null, true, 'W8x10 at 36 ksi');
    },
  },
  {
    name: 'EN 1993-1-1: IPE 300 in S275 has M_c,Rd = 628.4 cm³ × 275 = 172.8 kN·m and V_pl,Rd = 25.68 cm² × 275/√3 = 407.7 kN; 6 m span, 5 + 10 kN/m picks IPE 270 (M_Ed 100.0 ≤ 133.1 kN·m)',
    source: 'EN 1993-1-1 6.2.5 and 6.2.6 with γ_M0 = 1.0; EN 1990 eq. 6.10; ArcelorMittal W_pl,y and A_vz',
    run: () => {
      const c = checkSection(find('ipe', 'IPE 300'), prep({ wL: 1000 }));
      assertClose(c.mCap / 1000, 172.81, { abs: 0.01 }, 'M_c,Rd');
      assertClose(c.vCap / 1000, 407.72, { abs: 0.01 }, 'V_pl,Rd');
      const o = calculate({ series: 'ipe', grade_ipe: 's275', span_m: 6, dead_n_m: 5000, live_n_m: 10000 }).outputs;
      assertEqual(o.section, 'IPE 270', 'section');
      assertClose(o.moment_nm / 1000, ((1.35 * (5000 + 36.1 * 9.80665) + 15000) * 36) / 8 / 1000, { rel: 1e-9 }, 'M_Ed');
      assertClose(o.moment_cap_nm / 1000, 133.1, { abs: 1e-6 }, 'M_c,Rd IPE 270');
      assertClose(o.defl_live_m * 1000, (5 * 10000 * 6 ** 4) / (384 * 210e9 * 5790e-8) * 1000, { rel: 1e-9 }, 'δ_L');
    },
  },
  {
    name: 'A central point load alone deflects P L³/(48 E I); a large point load on a short IPE span triggers the 6.2.8 bending–shear reduction',
    source: 'AISC Manual Table 3-23, simple beam with a concentrated load at the centre; EN 1993-1-1 6.2.8: ρ = (2V_Ed/V_pl,Rd − 1)², M_V,Rd = (W_pl − ρ h_w² t_w/4) f_y',
    run: () => {
      const s = find('w', 'W16x26');
      const c = checkSection(s, prep({ span: 6, pL: 20000 }));
      assertClose(c.dLive, (20000 * 216) / (48 * 29000 * 6894757.293168 * s.ix), { rel: 1e-12 }, 'P L³/48EI');
      const ipe = find('ipe', 'IPE 300');
      const v = checkSection(ipe, prep({ span: 1, pD: 0, pL: 400000 })); // V_Ed = 1.5 × 400/2 = 300 kN > 0.5 × 407.7
      const rho = ((2 * 300000) / v.vCap - 1) ** 2;
      const hw = 0.3 - 2 * 0.0107;
      assertClose(v.mCap, (628.4e-6 - (rho * hw * hw * 0.0071) / 4) * 275e6, { rel: 1e-9 }, 'M_V,Rd');
      assertEqual(v.mCap < 172810, true, 'reduced');
    },
  },
  {
    name: 'Invalid inputs: span outside 0.5–30 m, a depth limit below the shallowest section, and loads no section can carry are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ span_m: 40 }), 'Span L');
      assertThrows(() => calculate({ max_depth_m: 4 * IN }), 'Maximum nominal depth');
      assertThrows(() => calculate({ live_n_m: 1e6 }), 'no W-shape in the table works');
      assertThrows(() => calculate({ series: 'ipe', span_m: 30, live_n_m: 1e5 }), 'no IPE in the table works');
      assertThrows(() => calculate({ limit: '100' }), 'Live-load deflection limit');
    },
  },
];
