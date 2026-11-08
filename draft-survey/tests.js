/**
 * draft-survey/tests.js — checks against the UN ECE draught-survey procedure with hand-verified values.
 * Run: node run-tests.js draft-survey
 */
import { calculate, correctDraftsToPerpendiculars, quarterMeanDraft, firstTrimCorrectionT, secondTrimCorrectionT } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** Even keel, marks at the perpendiculars, dock water = table density: nothing to correct. */
const EVEN_KEEL = {
  draft_fwd_port_m: 10, draft_fwd_stbd_m: 10, draft_mid_port_m: 10, draft_mid_stbd_m: 10, draft_aft_port_m: 10, draft_aft_stbd_m: 10,
  lbp_m: 180, fwd_marks_aft_of_fp_m: 0, aft_marks_fwd_of_ap_m: 0, mid_marks_aft_of_midships_m: 0,
  displacement_table_t: 47232, tpc_t_cm: 52, lcf_from_midships_m: -3, mctc_plus_t_m_cm: 460, mctc_minus_t_m_cm: 440,
  table_density_t_m3: 1.025, dock_density_t_m3: 1.025,
  ballast_t: 600, fresh_water_t: 200, fuel_oil_t: 150, diesel_oil_t: 30, lube_oil_t: 15, other_deductibles_t: 5, lightship_t: 10000, constant_t: 300,
};

export const tests = [
  {
    name: 'Even keel, no mark offsets, dock water 1.025: no corrections; cargo = 47 232 − 1 000 − 10 000 − 300 = 35 932 t',
    source: 'UN ECE Code (1992) survey sequence: displacement − deductibles − lightship − constant = cargo',
    run: () => {
      const { outputs } = calculate(EVEN_KEEL);
      assertClose(outputs.true_trim_m, 0, { abs: 1e-12 }, 'trim');
      assertClose(outputs.quarter_mean_m, 10, { rel: 1e-12 }, 'quarter mean');
      assertClose(outputs.first_trim_correction_t, 0, { abs: 1e-12 }, 'FTC');
      assertClose(outputs.second_trim_correction_t, 0, { abs: 1e-12 }, 'STC');
      assertClose(outputs.displacement_corrected_t, 47232, { rel: 1e-12 }, 'displacement');
      assertClose(outputs.deductibles_t, 1000, { rel: 1e-12 }, 'deductibles');
      assertClose(outputs.net_displacement_t, 36232, { rel: 1e-12 }, 'net');
      assertClose(outputs.cargo_t, 35932, { rel: 1e-12 }, 'cargo');
    },
  },
  {
    name: 'Mark corrections: F 9.50 / A 10.50 at marks 3 m aft of FP and 6 m fwd of AP (LBM 171 m): FP 9.4825, AP 10.5351, true trim 1.0526 m',
    source: 'UN ECE Code (1992) §: draft correction = distance to perpendicular × apparent trim / LBM; Isbester, Bulk Carrier Practice, "Draught surveys"',
    run: () => {
      const c = correctDraftsToPerpendiculars({ fwd: 9.5, mid: 10.0, aft: 10.5, lbp: 180, fwdMarksAftOfFp: 3, aftMarksFwdOfAp: 6, midMarksAftOfMidships: 0 });
      assertClose(c.lbm, 171, { rel: 1e-12 }, 'LBM');
      assertClose(c.apparentTrim, 1.0, { rel: 1e-12 }, 'apparent trim');
      assertClose(c.fp, 9.5 - (3 * 1) / 171, { rel: 1e-12 }, 'FP');
      assertClose(c.ap, 10.5 + (6 * 1) / 171, { rel: 1e-12 }, 'AP');
      assertClose(c.fp, 9.48246, { abs: 1e-5 }, 'FP value');
      assertClose(c.ap, 10.53509, { abs: 1e-5 }, 'AP value');
      assertClose(c.ap - c.fp, 1.05263, { abs: 1e-5 }, 'true trim');
      assertClose(quarterMeanDraft(c.fp, c.midships, c.ap), (9.48246 + 10.53509 + 60) / 8, { abs: 1e-5 }, 'quarter mean 10.0022');
    },
  },
  {
    name: 'Midship marks 2 m aft of midships with 1 m apparent trim over 171 m move the midship draft by −1.17 cm',
    source: 'Same proportional correction applied to the midship marks (Dibble & Mitchell, Draught Surveys, 2009)',
    run: () => {
      const c = correctDraftsToPerpendiculars({ fwd: 9.5, mid: 10.0, aft: 10.5, lbp: 180, fwdMarksAftOfFp: 3, aftMarksFwdOfAp: 6, midMarksAftOfMidships: 2 });
      assertClose(c.midships, 10.0 - (2 * 1) / 171, { rel: 1e-12 }, 'midships corrected');
    },
  },
  {
    name: 'First trim correction: 100 cm by the stern with LCF 3 m aft of midships and TPC 50 on 180 m = +83.3 t; LCF 3 m forward gives −83.3 t',
    source: 'UN ECE Code (1992): FTC = trim × LCF × TPC / LBP, positive when LCF is on the side of the deeper draft',
    run: () => {
      assertClose(firstTrimCorrectionT(1.0, -3, 50, 180), 83.333, { abs: 1e-3 }, 'LCF aft, trim by stern');
      assertClose(firstTrimCorrectionT(1.0, 3, 50, 180), -83.333, { abs: 1e-3 }, 'LCF forward, trim by stern');
      assertClose(firstTrimCorrectionT(-1.0, -3, 50, 180), -83.333, { abs: 1e-3 }, 'LCF aft, trim by head');
    },
  },
  {
    name: 'Second trim correction (Nemoto): 1.0 m trim, MCTC 460/440 on 180 m = 50 × 1² × 20 / 180 = 5.56 t, always positive; 0.5 m trim gives a quarter of it',
    source: 'UN ECE Code (1992) second trim correction 50 × trim² × (MCTC₊ − MCTC₋) / LBP',
    run: () => {
      assertClose(secondTrimCorrectionT(1.0, 460, 440, 180), 5.5556, { abs: 1e-3 }, 'STC');
      assertClose(secondTrimCorrectionT(-1.0, 460, 440, 180), 5.5556, { abs: 1e-3 }, 'sign-independent');
      assertClose(secondTrimCorrectionT(0.5, 460, 440, 180), 5.5556 / 4, { abs: 1e-3 }, 'quadratic');
    },
  },
  {
    name: 'Density correction: 47 232 t from tables in 1.025 floating in 1.010 → 46 540.8 t',
    source: 'UN ECE Code (1992): displacement × ρ_dock / ρ_table',
    run: () => {
      const { outputs } = calculate({ ...EVEN_KEEL, dock_density_t_m3: 1.010 });
      assertClose(outputs.displacement_corrected_t, 47232 * (1.01 / 1.025), { rel: 1e-12 }, 'density corrected');
      assertClose(outputs.displacement_corrected_t, 46540.8, { abs: 0.1 }, 'value');
    },
  },
  {
    name: 'Hog/sag: F 9.90, A 10.10, M 10.05 → sag +5 cm; quarter mean 10.0375 m (M weighted 6/8)',
    source: 'Mean-of-means (quarter mean) definition (F + A + 6M)/8, UN ECE Code (1992)',
    run: () => {
      const { outputs } = calculate({ ...EVEN_KEEL, draft_fwd_port_m: 9.9, draft_fwd_stbd_m: 9.9, draft_aft_port_m: 10.1, draft_aft_stbd_m: 10.1, draft_mid_port_m: 10.05, draft_mid_stbd_m: 10.05 });
      assertClose(outputs.hog_sag_m, 0.05, { abs: 1e-9 }, 'sag');
      assertClose(outputs.quarter_mean_m, 10.0375, { abs: 1e-9 }, 'quarter mean');
    },
  },
  {
    name: 'Default survey (trim 1.05 m by stern, LCF 3 m aft, dock 1.020): FTC +91.2 t, STC +6.2 t, displacement 47 329.4 × 1.020/1.025 = 47 098.5 t, cargo 33 288.5 t',
    source: 'Hand calculation with the formulas above',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.true_trim_m, 1.05263, { abs: 1e-5 }, 'trim');
      assertClose(outputs.first_trim_correction_t, (1.05263 * 100 * 3 * 52) / 180, { abs: 0.01 }, 'FTC');
      assertClose(outputs.second_trim_correction_t, (50 * 1.05263 ** 2 * 20) / 180, { abs: 0.01 }, 'STC');
      assertClose(outputs.displacement_trim_corrected_t, 47232 + 91.228 + 6.156, { abs: 0.05 }, 'trim corrected');
      assertClose(outputs.displacement_corrected_t, (47232 + 91.228 + 6.156) * (1.02 / 1.025), { abs: 0.05 }, 'density corrected');
      assertClose(outputs.deductibles_t, 2860, { rel: 1e-12 }, 'deductibles');
      assertClose(outputs.cargo_t, outputs.displacement_corrected_t - 2860 - 11200 - 350, { rel: 1e-12 }, 'cargo');
      assertClose(outputs.reading_sensitivity_t, 52, { rel: 1e-12 }, 'TPC sensitivity');
    },
  },
  {
    name: 'Warnings: 15 cm list, negative cargo and inverted MCTC values are flagged',
    source: 'Survey good-practice notes (Dibble & Mitchell 2009)',
    run: () => {
      const listing = calculate({ ...EVEN_KEEL, draft_mid_port_m: 10.15, draft_mid_stbd_m: 10.0 });
      assertEqual(listing.warnings.some((w) => w.includes('listing')), true, 'list warning');
      const negative = calculate({ ...EVEN_KEEL, constant_t: 40000 });
      assertEqual(negative.warnings.some((w) => w.includes('Negative cargo')), true, 'negative cargo warning');
      const inverted = calculate({ ...EVEN_KEEL, mctc_plus_t_m_cm: 430 });
      assertEqual(inverted.warnings.some((w) => w.includes('unusual')), true, 'MCTC warning');
    },
  },
  {
    name: 'Invalid inputs fail fast: marks outside the hull (LBM ≤ 0), negative draft, zero TPC',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...EVEN_KEEL, fwd_marks_aft_of_fp_m: 100, aft_marks_fwd_of_ap_m: 100 }), 'Length between marks', 'LBM');
      assertThrows(() => calculate({ ...EVEN_KEEL, draft_aft_port_m: -1 }), 'must not be negative', 'draft');
      assertThrows(() => calculate({ ...EVEN_KEEL, tpc_t_cm: 0 }), 'greater than zero', 'TPC');
    },
  },
];
