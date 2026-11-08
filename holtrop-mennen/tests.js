/**
 * holtrop-mennen/tests.js — reproduces the numerical example of Holtrop & Mennen (1982) component by component,
 * and checks the 1984 variant for consistency.
 * Run: node run-tests.js holtrop-mennen
 */
import { calculate, resistanceBreakdown, halfAngleOfEntrance, schema } from './calc.js';
import { withDefaults } from '../shared/validate.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** The paper's hypothetical single-screw ship at 25 knots (lcb −0.75 % of L_WL reproduces L_R 81.385 m). */
const EXAMPLE = { variant: 'hm1982', lwl_m: 205, beam_m: 32, draft_fwd_m: 10, draft_aft_m: 10, displacement_m3: 37500, lcb_pct: -0.75, cm: 0.98, cwp: 0.75, abt_m2: 20, hb_m: 4, at_m2: 16, sapp_m2: 50, k2_app: 1.5, thruster_d_m: 0, stern_type: 'u_hogner', ie_mode: 'estimate', speed_kn: 25, rho_kg_m3: 1025, nu_m2_s: 1.18831e-6, roughness_um: 150, arrangement: 'single', prop_d_m: 8, ae_a0: 0.7393, eta_o: 0.6461, eta_s: 0.99 };
const full = (over = {}) => resistanceBreakdown(withDefaults(schema, { ...EXAMPLE, ...over }));

export const tests = [
  {
    name: 'Example ship geometry: C_B 0.5717, C_P 0.5833, L_R 81.385 m, c12 route 1+k1 = 1.156, S = 7381.45 m²',
    source: 'Holtrop & Mennen (1982) numerical example, ISP 29 p. 170',
    run: () => {
      const r = full();
      assertClose(r.CB, 37500 / (205 * 32 * 10), { rel: 1e-12 }, 'C_B');
      assertClose(r.CP, 0.5833, { abs: 5e-4 }, 'C_P');
      assertClose(r.LR, 81.385, { abs: 0.02 }, 'L_R');
      assertClose(r.formFactor, 1.156, { abs: 1.5e-3 }, '1+k1');
      assertClose(r.S, 7381.45, { abs: 1 }, 'S');
    },
  },
  {
    name: 'Friction and appendages at 25 kn: Fn 0.2868, C_F 0.001390, R_F 869.63 kN, R_APP 8.83 kN (1+k2 = 1.5, 50 m²)',
    source: 'Holtrop & Mennen (1982) example; ITTC-1957 line',
    run: () => {
      const r = full();
      assertClose(r.Fn, 0.2868, { abs: 2e-4 }, 'Fn');
      assertClose(r.CF, 0.001390, { abs: 2e-6 }, 'C_F');
      assertClose(r.RF / 1000, 869.63, { rel: 3e-3 }, 'R_F');
      assertClose(r.RAPP / 1000, 8.83, { rel: 1e-2 }, 'R_APP');
    },
  },
  {
    name: 'Wave resistance intermediates: c7 0.1561, i_E 12.08°, c1 1.398, c3 0.02119, c2 0.7595, c5 0.9592, λ 0.6513, m1 −2.1274, c15 −1.69385, m2 −0.17087, R_W 557.11 kN',
    source: 'Holtrop & Mennen (1982) example',
    run: () => {
      const r = full();
      assertClose(r.c7, 32 / 205, { rel: 1e-12 }, 'c7');
      assertClose(r.iE, 12.08, { abs: 0.03 }, 'i_E');
      assertClose(halfAngleOfEntrance(205, 32, 0.75, r.CP, -0.75, r.LR, 37500), r.iE, { rel: 1e-12 }, 'helper');
      assertClose(r.c1, 1.398, { abs: 3e-3 }, 'c1');
      assertClose(r.c3, 0.02119, { abs: 2e-5 }, 'c3');
      assertClose(r.c2, 0.7595, { abs: 5e-4 }, 'c2');
      assertClose(r.c5, 0.9592, { abs: 2e-4 }, 'c5');
      assertClose(r.lambda, 0.6513, { abs: 2e-4 }, 'λ');
      assertClose(r.m1, -2.1274, { abs: 2e-3 }, 'm1');
      assertEqual(r.c15, -1.69385, 'c15');
      assertClose(r.m2, -0.17087, { abs: 3e-4 }, 'm2');
      assertClose(r.RW / 1000, 557.11, { rel: 5e-3 }, 'R_W');
    },
  },
  {
    name: 'Bulb and transom: P_B 0.6261, Fni 1.5084, R_B 0.049 kN, Fn_T 5.433 → c6 = 0 and R_TR = 0',
    source: 'Holtrop & Mennen (1982) example',
    run: () => {
      const r = full();
      assertClose(r.PB, 0.6261, { abs: 2e-4 }, 'P_B');
      assertClose(r.Fni, 1.5084, { abs: 2e-3 }, 'Fni');
      assertClose(r.RB / 1000, 0.049, { abs: 4e-3 }, 'R_B');
      assertClose(r.FnT, 5.433, { abs: 5e-3 }, 'Fn_T');
      assertEqual(r.RTR, 0, 'R_TR');
      assertEqual(full({ abt_m2: 0 }).RB, 0, 'no bulb');
    },
  },
  {
    name: 'Correlation allowance and totals: c4 0.04, C_A 0.000352 as printed, R_A = ½ρV² S C_A = 220.57 kN (the paper prints 221.98 kN, which is C_A over S + S_APP), R_T and P_E within 0.1 % of the printed 1793.26 kN and 23 063 kW',
    source: 'Holtrop & Mennen (1982) example; R_A = ½ ρ V² S C_A',
    run: () => {
      const { outputs } = calculate(EXAMPLE);
      assertClose(outputs.ca, 0.000352, { abs: 4e-6 }, 'C_A');
      assertClose(outputs.ra_n, 0.5 * 1025 * outputs.speed_m_s ** 2 * outputs.wetted_area_m2 * outputs.ca, { rel: 1e-9 }, 'R_A over the hull wetted surface');
      assertClose(outputs.ra_n / 1000, 221.98, { rel: 7e-3 }, 'R_A against the printed value');
      assertClose(outputs.rt_n / 1000, 1793.26, { rel: 1e-3 }, 'R_T');
      assertClose(outputs.pe_w / 1000, 23063, { rel: 1e-3 }, 'P_E');
      assertClose(outputs.rt_n, outputs.rf_form_n + outputs.rapp_n + outputs.rw_n + outputs.rb_n + outputs.rtr_n + outputs.ra_n, { rel: 1e-12 }, 'sum of components');
    },
  },
  {
    name: 'Propulsion factors (1982, single screw): C_P1 0.5477, w 0.2584, t 0.1747, η_R 0.9931; with η_O 0.6461 and η_S 0.99 the shaft power is 32 619 kW and the thrust 2171.3 kN, within 0.1 % of the printed 32 621 kW and 2172.75 kN (the difference follows R_A)',
    source: 'Holtrop & Mennen (1982) example (P_S 32 621 kW, T 2172.75 kN as printed)',
    run: () => {
      const r = full();
      assertClose(r.CP1, 0.5477, { abs: 5e-4 }, 'C_P1');
      assertClose(r.w, 0.2584, { abs: 2e-3 }, 'w');
      assertClose(r.t, 0.1747, { abs: 2e-3 }, 't');
      assertClose(r.etaR, 0.9931, { abs: 5e-4 }, 'η_R');
      const { outputs } = calculate(EXAMPLE);
      assertClose(outputs.ps_w / 1000, 32621, { rel: 1e-3 }, 'P_S');
      assertClose(outputs.thrust_n / 1000, 2172.75, { rel: 1e-3 }, 'thrust');
      assertClose(outputs.hull_eff, (1 - r.t) / (1 - r.w), { rel: 1e-12 }, 'η_H');
    },
  },
  {
    name: '1984 variant on the same ship: form factor 1.185 (+2.5 %), R_W within 10 % of 1982, wave resistance continuous at Fn 0.40 and 0.55, w and t within 15 % of the 1982 values',
    source: 'Holtrop (1984) ISP 31 — new form factor, m4, R_W-B and the 0.40–0.55 interpolation',
    run: () => {
      const r82 = full();
      const r84 = full({ variant: 'hm1984' });
      assertClose(r84.formFactor, 1.185, { abs: 5e-3 }, '1+k1 (1984)');
      assertEqual(Math.abs(r84.RW / r82.RW - 1) < 0.1, true, 'R_W similar');
      assertEqual(Math.abs(r84.w / r82.w - 1) < 0.15, true, 'w similar');
      assertEqual(Math.abs(r84.t / r82.t - 1) < 0.15, true, 't similar');
      const speedForFn = (fn) => (fn * Math.sqrt(9.80665 * 205)) / (1852 / 3600);
      const lo = full({ variant: 'hm1984', speed_kn: speedForFn(0.3999) });
      const hi = full({ variant: 'hm1984', speed_kn: speedForFn(0.4001) });
      assertClose(lo.RW, hi.RW, { rel: 5e-3 }, 'continuous at Fn 0.40');
      const lo2 = full({ variant: 'hm1984', speed_kn: speedForFn(0.5499) });
      const hi2 = full({ variant: 'hm1984', speed_kn: speedForFn(0.5501) });
      assertClose(lo2.RW, hi2.RW, { rel: 5e-3 }, 'continuous at Fn 0.55');
      const mid = calculate({ ...EXAMPLE, variant: 'hm1984', speed_kn: speedForFn(0.47) });
      assertEqual(mid.warnings.some((w) => w.includes('interpolation')), true, 'interpolation warning');
    },
  },
  {
    name: 'Twin-screw formulas (1982): w = 0.3095 C_B + 10 C_V C_B − 0.23 D/√(BT), t = 0.325 C_B − 0.1885 D/√(BT), η_R = 0.9737 + 0.111 (C_P − 0.0225 lcb) − 0.06325 P/D',
    source: 'Holtrop & Mennen (1982) twin-screw propulsion formulas',
    run: () => {
      const r = full({ arrangement: 'twin', prop_d_m: 6, pd_ratio: 1.0 });
      const D = 6;
      assertClose(r.w, 0.3095 * r.CB + 10 * r.CV * r.CB - (0.23 * D) / Math.sqrt(32 * 10), { rel: 1e-12 }, 'w');
      assertClose(r.t, 0.325 * r.CB - (0.1885 * D) / Math.sqrt(320), { rel: 1e-12 }, 't');
      assertClose(r.etaR, 0.9737 + 0.111 * (r.CP + 0.0225 * 0.75) - 0.06325, { rel: 1e-12 }, 'η_R');
    },
  },
  {
    name: 'Roughness: k_s = 150 µm adds nothing; 300 µm adds ΔC_A = (0.105·0.3e-3^(1/3) − 0.005579)/205^(1/3) ≈ 2.3·10⁻⁴',
    source: 'Holtrop & Mennen (1982): roughness increase of C_A derived from the ITTC-1978 formulation',
    run: () => {
      const r150 = full();
      const r300 = full({ roughness_um: 300 });
      assertClose(r150.CA, r150.CAstd, { rel: 1e-12 }, 'no increase at 150 µm');
      assertClose(r300.CA - r300.CAstd, (0.105 * 0.0003 ** (1 / 3) - 0.005579) / 205 ** (1 / 3), { rel: 1e-9 }, 'ΔC_A');
      assertEqual(r300.CA - r300.CAstd > 2e-4 && r300.CA - r300.CAstd < 2.6e-4, true, 'magnitude');
    },
  },
  {
    name: 'Invalid inputs fail fast: bulb centre too high, prismatic coefficient outside the method, pram stern with the 1982 variant',
    source: 'Validation contract (README, "Conventions") and the papers\' ranges',
    run: () => {
      assertThrows(() => calculate({ ...EXAMPLE, hb_m: 7 }), 'Bulb centre too high', 'bulb');
      assertThrows(() => calculate({ ...EXAMPLE, displacement_m3: 65000 }), 'outside the method', 'C_P');
      assertThrows(() => calculate({ ...EXAMPLE, stern_type: 'pram' }), 'exists only in the 1984', 'pram 1982');
      const fast = calculate({ ...EXAMPLE, speed_kn: 40 });
      assertEqual(fast.warnings.some((w) => w.includes('above the range')), true, 'Fn warning');
    },
  },
  {
    name: 'Chain outputs: mean draft (T_F + T_A)/2, η_D = η_H η_R η_O = P_E/P_D, thrust per propeller T/2 for twin screw',
    source: 'Definitions: η_D = P_E/P_D (ITTC Recommended Procedure 7.5-02-03-01.4); P_D = P_E/(η_H η_R η_O) as in Holtrop & Mennen (1982)',
    run: () => {
      const single = calculate({ draft_fwd_m: 9, draft_aft_m: 11 }).outputs;
      assertClose(single.draft_mean_m, 10, { rel: 1e-12 }, 'mean draft');
      assertClose(single.eta_d, single.pe_w / single.pd_w, { rel: 1e-12 }, 'η_D = P_E/P_D');
      assertClose(single.eta_d, single.hull_eff * single.rotative_eff * 0.62, { rel: 1e-12 }, 'η_D = η_H η_R η_O');
      assertClose(single.thrust_per_prop_n, single.thrust_n, { rel: 1e-12 }, 'single screw: one propeller takes the whole thrust');
      const twin = calculate({ arrangement: 'twin', prop_d_m: 5.5 }).outputs;
      assertClose(twin.thrust_per_prop_n, twin.thrust_n / 2, { rel: 1e-12 }, 'twin screw: half per propeller');
    },
  },
  {
    name: 'Outside the formulas: L/B ≤ 2, a single-screw afterbody with C_P1 ≥ 1, C_WP above 0.99 and negative roughness are rejected with a message instead of NaN',
    source: 'Range fuzzing (fuzz.js): domains of (L/B − 2)^1.40692 in c17, 1/(1 − C_P1) and √(1 − C_P1) in the wake formula, (90 − i_E) in c1',
    run: () => {
      assertThrows(() => calculate({ lwl_m: 60, beam_m: 32, displacement_m3: 11000 }), 'L/B');
      assertThrows(() => calculate({ cm: 0.9, displacement_m3: 54907.2 }), 'C_P1');
      assertThrows(() => calculate({ cwp: 1 }), 'must be between');
      assertThrows(() => calculate({ roughness_um: -1 }), 'must be between');
    },
  },
];
