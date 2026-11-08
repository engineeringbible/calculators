/**
 * draft-survey/calc.js — displacement draft survey: six drafts → corrected drafts, quarter-mean draft, trim corrections,
 * density correction, net displacement and cargo (or constant).
 *
 * Procedure per the UN ECE Code of Uniform Standards and Procedures for the Performance of Draught Surveys (1992) and
 * standard bulk-carrier practice: mark corrections to the perpendiculars, mean of means (quarter mean), first trim
 * correction (LCF layer), second trim correction (Nemoto, 50 × trim² × ΔMCTC / LBP), density correction, deductibles.
 * Longitudinal convention: LCF measured from midships, positive forward; trim positive by the stern.
 * Schema units: m, t, t/cm, t·m/cm, t/m³.
 */
import { withDefaults, assertPositive, assertNonNegative, assertFinite } from '../shared/validate.js';

const CM_PER_M = 100;
const TABLE_DENSITY_T_M3 = 1.025;

export const schema = {
  id: 'draft-survey',
  name: 'Draft survey',
  category: 'maritime',
  summary: 'Six observed drafts to corrected drafts, quarter-mean draft, trim and density corrections, net displacement and cargo or constant from the hydrostatic tables.',
  related: ['hydrostatics', 'bunker-quantity', 'ship-squat', 'initial-stability'],
  notes: [
    'Design decision: sign conventions follow surveying practice — trim positive by the stern, LCF from midships positive forward, mark distances positive inboard of the perpendiculars; the first trim correction is coded as −trim × LCF × TPC / LBP so that LCF aft with stern trim gives a positive correction, as the UN ECE code requires.',
    'Verification 2026-10-30: mark corrections, quarter mean, both trim corrections and the density correction were checked by hand on a 180 m example (FTC +91.2 t, STC +6.2 t, 47 329 → 47 099 t at 1.020).',
    'Design decision: no hydrostatic tables are embedded; the user enters the ship\'s values at the quarter-mean draft, which keeps the calculator ship-independent and avoids a false sense of precision.',
    'Design decision: the same output serves both surveys — with constant = 0 and no cargo it returns the constant; with the constant entered it returns the cargo.',
  ],
  assumptions: [
    'Drafts are read at the marks and corrected to the perpendiculars with the apparent trim over the length between marks (LBM = LBP − distance of forward marks aft of FP − distance of aft marks forward of AP); the same ratio corrects midship marks that are not exactly at midships.',
    'The mean draft entered into the tables is the "mean of means" (quarter mean) (F + A + 6M)/8, which approximates the draft at the LCF including hog or sag; the hydrostatic values (displacement, TPC, LCF, MCTC) must be read from the ship\'s tables at that draft and entered by the user — the calculator has no tables of its own.',
    'First trim correction = trim(cm) × LCF(m) × TPC / LBP with LCF measured from midships, positive forward, and trim positive by the stern; the correction is positive when the LCF lies towards the deeper end.',
    'Second trim correction (Nemoto) = 50 × trim(m)² × (MCTC at +50 cm − MCTC at −50 cm) / LBP and is always added; it is small for trims below about 1 m.',
    'Density correction scales the displacement by the measured dock-water density over the table density (1.025 t/m³ unless the tables state otherwise); the hydrometer reading must be the true density in vacuo or in air as the tables assume, sampled at mid-draft on both sides.',
    'Deductibles (ballast, fresh water, fuel, diesel, lube oil, others) are entered as surveyed masses; the calculator does not sound tanks or apply free-surface or trim corrections to tank tables.',
    'Cargo = corrected displacement − deductibles − lightship − constant; at a light-ship (initial) survey with no cargo the same output gives the vessel constant. Heel, hog/sag beyond the quarter mean, and draft-mark reading error (±1 cm ≈ ±TPC tonnes each) are not corrected.',
    'The result is an estimate for commercial draft surveys with a typical accuracy of ±0.5 % of cargo under good conditions; it is not a substitute for the surveyor\'s judgement of sea state, list and reading conditions.',
  ],
  sources: [
    'UN ECE, Code of Uniform Standards and Procedures for the Performance of Draught Surveys of Coal Cargoes (ECE/ENERGY/19, 1992)',
    'J. Isbester, Bulk Carrier Practice (Nautical Institute, 2nd ed. 2010), ch. "Draught surveys"',
    'W.J. Dibble & P. Mitchell, Draught Surveys — A Guide to Good Practice (North of England P&I Club, 2009)',
    'Barrass & Derrett, Ship Stability for Masters and Mates, 7th ed. (2012), trim and TPC chapters',
  ],
  inputs: [
    { id: 'draft_fwd_port_m', label: 'Forward draft, port', group: 'length', unit: 'm', default: 9.50, min: 0, max: 30 },
    { id: 'draft_fwd_stbd_m', label: 'Forward draft, starboard', group: 'length', unit: 'm', default: 9.50, min: 0, max: 30 },
    { id: 'draft_mid_port_m', label: 'Midship draft, port', group: 'length', unit: 'm', default: 10.03, min: 0, max: 30 },
    { id: 'draft_mid_stbd_m', label: 'Midship draft, starboard', group: 'length', unit: 'm', default: 10.03, min: 0, max: 30 },
    { id: 'draft_aft_port_m', label: 'Aft draft, port', group: 'length', unit: 'm', default: 10.50, min: 0, max: 30 },
    { id: 'draft_aft_stbd_m', label: 'Aft draft, starboard', group: 'length', unit: 'm', default: 10.50, min: 0, max: 30 },
    { id: 'lbp_m', label: 'Length between perpendiculars LBP', group: 'length', unit: 'm', default: 180, min: 10, max: 500 },
    { id: 'fwd_marks_aft_of_fp_m', label: 'Forward marks aft of FP (+ aft)', group: 'length', unit: 'm', default: 3.0, min: -50, max: 50 },
    { id: 'aft_marks_fwd_of_ap_m', label: 'Aft marks forward of AP (+ forward)', group: 'length', unit: 'm', default: 6.0, min: -50, max: 50 },
    { id: 'mid_marks_aft_of_midships_m', label: 'Midship marks aft of midships (+ aft)', group: 'length', unit: 'm', default: 0, min: -50, max: 50 },
    { id: 'displacement_table_t', label: 'Displacement from the tables at the quarter-mean draft (in 1.025 t/m³)', group: 'mass', unit: 't', default: 47232, min: 1, max: 1e6 },
    { id: 'tpc_t_cm', label: 'TPC at the quarter-mean draft', group: 'tpc', unit: 't_cm', default: 52.0, min: 0.1, max: 500 },
    { id: 'lcf_from_midships_m', label: 'LCF from midships (+ forward, − aft)', group: 'length', unit: 'm', default: -3.0, min: -100, max: 100 },
    { id: 'mctc_plus_t_m_cm', label: 'MCTC at quarter-mean draft + 50 cm', group: 'mctc', unit: 't_m_cm', default: 460, min: 0.1, max: 10000 },
    { id: 'mctc_minus_t_m_cm', label: 'MCTC at quarter-mean draft − 50 cm', group: 'mctc', unit: 't_m_cm', default: 440, min: 0.1, max: 10000 },
    { id: 'table_density_t_m3', label: 'Density the tables are based on', group: 'density', unit: 't_m3', default: TABLE_DENSITY_T_M3, min: 0.99, max: 1.05 },
    { id: 'dock_density_t_m3', label: 'Measured dock-water density', group: 'density', unit: 't_m3', default: 1.020, min: 0.95, max: 1.06 },
    { id: 'ballast_t', label: 'Ballast water', group: 'mass', unit: 't', default: 1500, min: 0, max: 2e5 },
    { id: 'fresh_water_t', label: 'Fresh water', group: 'mass', unit: 't', default: 250, min: 0, max: 1e4 },
    { id: 'fuel_oil_t', label: 'Fuel oil', group: 'mass', unit: 't', default: 900, min: 0, max: 2e4 },
    { id: 'diesel_oil_t', label: 'Diesel / gas oil', group: 'mass', unit: 't', default: 120, min: 0, max: 1e4 },
    { id: 'lube_oil_t', label: 'Lubricating oil', group: 'mass', unit: 't', default: 60, min: 0, max: 2000 },
    { id: 'other_deductibles_t', label: 'Other deductibles (sludge, slops, swimming pool…)', group: 'mass', unit: 't', default: 30, min: 0, max: 1e4 },
    { id: 'lightship_t', label: 'Lightship', group: 'mass', unit: 't', default: 11200, min: 0, max: 2e5 },
    { id: 'constant_t', label: 'Vessel constant (0 at the initial survey to find it)', group: 'mass', unit: 't', default: 350, min: -5000, max: 20000 },
  ],
  outputs: [
    { id: 'mean_fwd_m', label: 'Mean forward draft at the marks', group: 'length', unit: 'm' },
    { id: 'mean_mid_m', label: 'Mean midship draft at the marks', group: 'length', unit: 'm' },
    { id: 'mean_aft_m', label: 'Mean aft draft at the marks', group: 'length', unit: 'm' },
    { id: 'apparent_trim_m', label: 'Apparent trim at the marks (+ by stern)', group: 'length', unit: 'm' },
    { id: 'draft_fp_m', label: 'Draft at the forward perpendicular', group: 'length', unit: 'm' },
    { id: 'draft_midships_m', label: 'Draft at midships', group: 'length', unit: 'm' },
    { id: 'draft_ap_m', label: 'Draft at the aft perpendicular', group: 'length', unit: 'm' },
    { id: 'true_trim_m', label: 'True trim (+ by stern)', group: 'length', unit: 'm' },
    { id: 'hog_sag_m', label: 'Hog (−) / sag (+): midships minus mean of ends', group: 'length', unit: 'm', display: 'cm' },
    { id: 'quarter_mean_m', label: 'Quarter-mean draft (F + A + 6M) / 8 for the tables', group: 'length', unit: 'm' },
    { id: 'first_trim_correction_t', label: 'First trim correction (LCF layer)', group: 'mass', unit: 't' },
    { id: 'second_trim_correction_t', label: 'Second trim correction (Nemoto)', group: 'mass', unit: 't' },
    { id: 'displacement_trim_corrected_t', label: 'Displacement corrected for trim', group: 'mass', unit: 't' },
    { id: 'displacement_corrected_t', label: 'Displacement corrected for trim and density', group: 'mass', unit: 't' },
    { id: 'deductibles_t', label: 'Total deductibles', group: 'mass', unit: 't' },
    { id: 'net_displacement_t', label: 'Net displacement (cargo + constant)', group: 'mass', unit: 't' },
    { id: 'cargo_t', label: 'Cargo on board (net − constant); equals the constant when no cargo is on board', group: 'mass', unit: 't' },
    { id: 'reading_sensitivity_t', label: 'Sensitivity: tonnes per centimetre of mean-draft error', group: 'mass', unit: 't' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      apparent_trim_m: '1.00 m',
      draft_fp_m: '9.482 m',
      draft_ap_m: '10.535 m',
      true_trim_m: '1.053 m',
      hog_sag_m: '2.1 cm',
      quarter_mean_m: '10.025 m',
      first_trim_correction_t: '91.2 t',
      second_trim_correction_t: '6.2 t',
    },
  },
};

/** Corrected drafts at the perpendiculars and midships from the mean drafts at the marks. */
export function correctDraftsToPerpendiculars({ fwd, mid, aft, lbp, fwdMarksAftOfFp, aftMarksFwdOfAp, midMarksAftOfMidships }) {
  const lbm = lbp - fwdMarksAftOfFp - aftMarksFwdOfAp;
  if (lbm <= 0) throw new Error('Length between marks must be positive — check the mark distances against LBP');
  const apparentTrim = aft - fwd;
  const slope = apparentTrim / lbm;
  return {
    lbm,
    apparentTrim,
    fp: fwd - fwdMarksAftOfFp * slope,
    ap: aft + aftMarksFwdOfAp * slope,
    midships: mid - midMarksAftOfMidships * slope,
  };
}

/** Quarter-mean ("mean of means") draft. */
export function quarterMeanDraft(fp, midships, ap) {
  return (fp + ap + 6 * midships) / 8;
}

/** First trim correction, tonnes: trim(cm) × LCF(m, + fwd) × TPC / LBP, positive when LCF is towards the deeper end. */
export function firstTrimCorrectionT(trimM, lcfFromMidshipsM, tpc, lbp) {
  return (-trimM * CM_PER_M * lcfFromMidshipsM * tpc) / lbp;
}

/** Second trim correction (Nemoto), tonnes: 50 × trim(m)² × (MCTC₊ − MCTC₋) / LBP. */
export function secondTrimCorrectionT(trimM, mctcPlus, mctcMinus, lbp) {
  return (50 * trimM * trimM * (mctcPlus - mctcMinus)) / lbp;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  for (const id of ['draft_fwd_port_m', 'draft_fwd_stbd_m', 'draft_mid_port_m', 'draft_mid_stbd_m', 'draft_aft_port_m', 'draft_aft_stbd_m']) assertNonNegative(i[id], id, 'Draft');
  assertPositive(i.lbp_m, 'lbp_m', 'LBP');
  for (const id of ['fwd_marks_aft_of_fp_m', 'aft_marks_fwd_of_ap_m', 'mid_marks_aft_of_midships_m', 'lcf_from_midships_m', 'constant_t']) assertFinite(i[id], id, id);
  assertPositive(i.displacement_table_t, 'displacement_table_t', 'Table displacement');
  assertPositive(i.tpc_t_cm, 'tpc_t_cm', 'TPC');
  assertPositive(i.mctc_plus_t_m_cm, 'mctc_plus_t_m_cm', 'MCTC+');
  assertPositive(i.mctc_minus_t_m_cm, 'mctc_minus_t_m_cm', 'MCTC−');
  assertPositive(i.table_density_t_m3, 'table_density_t_m3', 'Table density');
  assertPositive(i.dock_density_t_m3, 'dock_density_t_m3', 'Dock density');
  for (const id of ['ballast_t', 'fresh_water_t', 'fuel_oil_t', 'diesel_oil_t', 'lube_oil_t', 'other_deductibles_t', 'lightship_t']) assertNonNegative(i[id], id, id);

  const fwd = (i.draft_fwd_port_m + i.draft_fwd_stbd_m) / 2;
  const mid = (i.draft_mid_port_m + i.draft_mid_stbd_m) / 2;
  const aft = (i.draft_aft_port_m + i.draft_aft_stbd_m) / 2;
  const corrected = correctDraftsToPerpendiculars({
    fwd,
    mid,
    aft,
    lbp: i.lbp_m,
    fwdMarksAftOfFp: i.fwd_marks_aft_of_fp_m,
    aftMarksFwdOfAp: i.aft_marks_fwd_of_ap_m,
    midMarksAftOfMidships: i.mid_marks_aft_of_midships_m,
  });
  const trueTrim = corrected.ap - corrected.fp;
  const quarterMean = quarterMeanDraft(corrected.fp, corrected.midships, corrected.ap);
  const hogSag = corrected.midships - (corrected.fp + corrected.ap) / 2;

  const ftc = firstTrimCorrectionT(trueTrim, i.lcf_from_midships_m, i.tpc_t_cm, i.lbp_m);
  const stc = secondTrimCorrectionT(trueTrim, i.mctc_plus_t_m_cm, i.mctc_minus_t_m_cm, i.lbp_m);
  const displacementTrim = i.displacement_table_t + ftc + stc;
  const displacementCorrected = displacementTrim * (i.dock_density_t_m3 / i.table_density_t_m3);
  const deductibles = i.ballast_t + i.fresh_water_t + i.fuel_oil_t + i.diesel_oil_t + i.lube_oil_t + i.other_deductibles_t;
  const netDisplacement = displacementCorrected - deductibles - i.lightship_t;
  const cargo = netDisplacement - i.constant_t;

  const warnings = [];
  const heel = Math.max(Math.abs(i.draft_fwd_port_m - i.draft_fwd_stbd_m), Math.abs(i.draft_mid_port_m - i.draft_mid_stbd_m), Math.abs(i.draft_aft_port_m - i.draft_aft_stbd_m));
  if (heel > 0.10) warnings.push(`Port/starboard draft difference up to ${(heel * 100).toFixed(0)} cm: the ship is listing; the midship mean only approximates the displacement and the survey accuracy degrades.`);
  if (Math.abs(trueTrim) > 0.01 * i.lbp_m) warnings.push('Trim exceeds 1 % of LBP: the trim corrections are large and the tables\' LCF/MCTC should be read at the actual trimmed waterline where available.');
  if (Math.abs(hogSag) > 0.10) warnings.push(`Hog/sag of ${(hogSag * 100).toFixed(0)} cm: the quarter-mean draft only approximates the deflected hull; large deflection adds uncertainty.`);
  if (cargo < 0) warnings.push('Negative cargo: check the constant, lightship and deductibles — at an initial survey enter constant = 0 to obtain the constant itself.');
  if (i.mctc_plus_t_m_cm < i.mctc_minus_t_m_cm) warnings.push('MCTC at the deeper draft is lower than at the shallower draft, which is unusual — check the two MCTC values.');
  warnings.push(`A 1 cm error in the quarter-mean draft moves the result by about ${i.tpc_t_cm.toFixed(1)} t; read both sides at the same moment and average several wave cycles.`);

  return {
    outputs: {
      mean_fwd_m: fwd,
      mean_mid_m: mid,
      mean_aft_m: aft,
      apparent_trim_m: corrected.apparentTrim,
      draft_fp_m: corrected.fp,
      draft_midships_m: corrected.midships,
      draft_ap_m: corrected.ap,
      true_trim_m: trueTrim,
      hog_sag_m: hogSag,
      quarter_mean_m: quarterMean,
      first_trim_correction_t: ftc,
      second_trim_correction_t: stc,
      displacement_trim_corrected_t: displacementTrim,
      displacement_corrected_t: displacementCorrected,
      deductibles_t: deductibles,
      net_displacement_t: netDisplacement,
      cargo_t: cargo,
      reading_sensitivity_t: i.tpc_t_cm,
    },
    warnings,
  };
}
