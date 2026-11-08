/**
 * consolidation-settlement/calc.js — primary consolidation settlement of a clay layer (normally or over-consolidated)
 * and its rate by Terzaghi's one-dimensional theory: time to a degree of consolidation and the degree reached at a time.
 *
 * NC: S = Cc H/(1 + e0) log(σ'1/σ'0).  OC, σ'1 ≤ σ'p: S = Cr H/(1 + e0) log(σ'1/σ'0).
 * OC, σ'1 > σ'p: S = Cr H/(1 + e0) log(σ'p/σ'0) + Cc H/(1 + e0) log(σ'1/σ'p),  σ'1 = σ'0 + Δσ.
 * Rate: T_v = c_v t / H_dr²;  U = 1 − Σ_{m≥0} (2/M²) exp(−M² T_v), M = π(2m + 1)/2 (Terzaghi 1925; Das, Principles of
 * Geotechnical Engineering, ch. 11). Schema units: m, Pa, s; c_v converted from the chosen unit to m²/s.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive, assertNonNegative } from '../shared/validate.js';

const YEAR_S = 31557600; // 365.25 days, as the time unit "year"
/** Coefficient of consolidation units in m²/s. */
export const CV_UNITS = { m2_yr: 1 / YEAR_S, cm2_s: 1e-4, ft2_day: 0.09290304 / 86400 };

/** Average degree of consolidation for a time factor (exact series; √(4T/π) below T = 1e-6 where the series is slow). */
export function degreeOfConsolidation(tv) {
  if (!(tv > 0)) return 0;
  if (tv < 1e-6) return Math.sqrt((4 * tv) / Math.PI);
  let sum = 0;
  for (let m = 0; m < 100000; m += 1) {
    const M = (Math.PI * (2 * m + 1)) / 2;
    const term = (2 / (M * M)) * Math.exp(-M * M * tv);
    sum += term;
    if (term < 1e-17) break;
  }
  return Math.min(1, Math.max(0, 1 - sum));
}

/** Time factor for an average degree of consolidation 0 < U < 1, by bisection on log T. */
export function timeFactor(u) {
  let lo = Math.log(1e-14); let hi = Math.log(50);
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    if (degreeOfConsolidation(Math.exp(mid)) < u) lo = mid; else hi = mid;
  }
  return Math.exp((lo + hi) / 2);
}

/** Primary consolidation settlement, m. */
export function settlement({ H, e0, cc, cr, s0, sp, ds }) {
  const s1 = s0 + ds;
  const k = H / (1 + e0);
  if (sp <= s0) return cc * k * Math.log10(s1 / s0);
  if (s1 <= sp) return cr * k * Math.log10(s1 / s0);
  return cr * k * Math.log10(sp / s0) + cc * k * Math.log10(s1 / sp);
}

export const schema = {
  id: 'consolidation-settlement',
  name: 'Consolidation settlement calculator (clay layer)',
  category: 'civil',
  summary: 'Primary consolidation settlement of a normally or over-consolidated clay layer, and the time to reach a degree of consolidation by Terzaghi\'s theory.',
  related: ['soil-bearing', 'footing-size', 'proctor-compaction', 'pile-capacity'],
  assumptions: [
    'One-dimensional consolidation: the clay is laterally confined, saturated and loaded over a wide area, and the stresses are those at the middle of the layer. Thick layers should be split into sublayers and the settlements added.',
    'Cc, Cr (also called Cs), e0 and the preconsolidation pressure come from an oedometer test (ASTM D2435) on undisturbed samples; the void ratio changes linearly with the logarithm of effective stress on each branch.',
    'The rate follows Terzaghi\'s theory with a constant c_v, an instantly applied load and a uniform initial excess pore pressure. Double drainage halves the drainage path.',
    'Immediate (elastic) settlement and secondary compression (creep) are not included; secondary compression can be significant in organic and soft clays.',
  ],
  notes: [
    'Verification 2026-11-08: a 3 m clay layer with e0 0.9, Cc 0.30, Cr 0.05, σ\'0 80 kPa, σ\'p 120 kPa and Δσ 60 kPa settles 13.9 + 31.7 = 45.6 mm. With c_v 2 m²/year and double drainage, 90 % consolidation (T_v 0.848) takes 0.954 years. Checked by hand.',
  ],
  sources: [
    'Das, B.M. and Sobhan, K., Principles of Geotechnical Engineering, 9th ed., Cengage, ch. 11 Compressibility of Soil (settlement equations for normally and overconsolidated clay; Terzaghi time factor table and approximations)',
    'Terzaghi, K. (1925), Erdbaumechanik auf bodenphysikalischer Grundlage, Deuticke, Vienna (one-dimensional consolidation theory)',
    'ASTM D2435/D2435M, Standard Test Methods for One-Dimensional Consolidation Properties of Soils Using Incremental Loading',
  ],
  inputs: [
    { id: 'thickness_m', label: 'Thickness of the clay layer H', group: 'length', unit: 'm', default: 3, min: 0.01, max: 200 },
    { id: 'e0', label: 'Initial void ratio e0', group: 'dimensionless', unit: 'none', default: 0.9, min: 0.1, max: 15 },
    { id: 'cc', label: 'Compression index Cc', group: 'dimensionless', unit: 'none', default: 0.3, min: 0.001, max: 10 },
    { id: 'history', label: 'Stress history', type: 'select', default: 'oc', options: [{ value: 'nc', label: 'Normally consolidated (σ\'p = σ\'0)' }, { value: 'oc', label: 'Over-consolidated (enter σ\'p and Cr)' }] },
    { id: 'cr', label: 'Recompression (swelling) index Cr', group: 'dimensionless', unit: 'none', default: 0.05, min: 0, max: 5, visibleWhen: { history: 'oc' } },
    { id: 's0_pa', label: 'Initial effective stress σ\'0 at mid-layer', group: 'pressure', unit: 'Pa', display: 'kPa', default: 80000, min: 1, max: 1e8 },
    { id: 'sp_pa', label: 'Preconsolidation pressure σ\'p', group: 'pressure', unit: 'Pa', display: 'kPa', default: 120000, min: 1, max: 1e8, visibleWhen: { history: 'oc' } },
    { id: 'ds_pa', label: 'Stress increase Δσ at mid-layer', group: 'pressure', unit: 'Pa', display: 'kPa', default: 60000, min: 0, max: 1e8 },
    { id: 'drainage', label: 'Drainage', type: 'select', default: 'double', options: [{ value: 'double', label: 'Double (sand or gravel above and below): H_dr = H/2' }, { value: 'single', label: 'Single (impermeable base): H_dr = H' }] },
    { id: 'cv', label: 'Coefficient of consolidation c_v', group: 'dimensionless', unit: 'none', default: 2, min: 1e-9, max: 1e6 },
    { id: 'cv_unit', label: 'Unit of c_v', type: 'select', default: 'm2_yr', options: [{ value: 'm2_yr', label: 'm²/year' }, { value: 'cm2_s', label: 'cm²/s' }, { value: 'ft2_day', label: 'ft²/day' }] },
    { id: 'u_target', label: 'Degree of consolidation to find the time for', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.01, max: 0.999 },
    { id: 'time_s', label: 'Elapsed time to find the settlement at (0 = none)', group: 'time', unit: 's', display: 'year', default: YEAR_S / 2, min: 0, max: 1e11 },
  ],
  outputs: [
    { id: 'ocr', label: 'Over-consolidation ratio OCR = σ\'p/σ\'0', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 's1_pa', label: 'Final effective stress σ\'0 + Δσ', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'case_text', label: 'Case', type: 'text' },
    { id: 'settlement_m', label: 'Primary consolidation settlement', group: 'length', unit: 'm', display: 'mm', decimals: 1 },
    { id: 'strain', label: 'Average vertical strain', group: 'ratio', unit: 'frac', display: 'pct', decimals: 2 },
    { id: 'hdr_m', label: 'Drainage path H_dr', group: 'length', unit: 'm' },
    { id: 'tv_target', label: 'Time factor T_v for the chosen degree', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 't_target_s', label: 'Time to reach the chosen degree of consolidation', group: 'time', unit: 's', display: 'year', decimals: 3 },
    { id: 't50_s', label: 'Time for 50 % consolidation', group: 'time', unit: 's', display: 'year', decimals: 3 },
    { id: 'u_at_t', label: 'Degree of consolidation at the elapsed time', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'settlement_t_m', label: 'Settlement at the elapsed time', group: 'length', unit: 'm', display: 'mm', decimals: 1 },
  ],
  example: {
    inputs: { thickness_m: [3, 'm'], e0: 0.9, cc: 0.3, history: 'oc', cr: 0.05, s0_pa: [80, 'kPa'], sp_pa: [120, 'kPa'], ds_pa: [60, 'kPa'], drainage: 'double', cv: 2, cv_unit: 'm2_yr', u_target: [90, 'pct'] },
    results: { settlement_m: '45.6 mm', tv_target: '0.848', t_target_s: '0.954 year', ocr: '1.50' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.history, ['nc', 'oc'], 'history', 'Stress history');
  assertOneOf(x.drainage, ['double', 'single'], 'drainage', 'Drainage');
  assertOneOf(x.cv_unit, Object.keys(CV_UNITS), 'cv_unit', 'Unit of c_v');
  const H = assertPositive(x.thickness_m, 'thickness_m', 'Thickness of the clay layer');
  const e0 = assertRange(x.e0, 0.1, 15, 'e0', 'Initial void ratio');
  const cc = assertPositive(x.cc, 'cc', 'Compression index');
  const s0 = assertPositive(x.s0_pa, 's0_pa', 'Initial effective stress');
  const ds = assertNonNegative(x.ds_pa, 'ds_pa', 'Stress increase');
  const oc = x.history === 'oc';
  const cr = oc ? assertNonNegative(x.cr, 'cr', 'Recompression index') : 0;
  const sp = oc ? assertPositive(x.sp_pa, 'sp_pa', 'Preconsolidation pressure') : s0;
  if (oc && sp < s0) throw new Error('Preconsolidation pressure: it is below the present effective stress, which would make the clay under-consolidated; enter σ\'p ≥ σ\'0 or choose normally consolidated.');
  if (oc && cr > cc) throw new Error('Recompression index Cr: it must not exceed the compression index Cc (Cr is usually 1/5 to 1/10 of Cc).');
  const cv = assertPositive(x.cv, 'cv', 'Coefficient of consolidation') * CV_UNITS[x.cv_unit];
  const uT = assertRange(x.u_target, 0.01, 0.999, 'u_target', 'Degree of consolidation');
  const t = assertNonNegative(x.time_s, 'time_s', 'Elapsed time');
  const s1 = s0 + ds;
  const S = settlement({ H, e0, cc, cr, s0, sp, ds });
  const hdr = x.drainage === 'double' ? H / 2 : H;
  const tv = timeFactor(uT);
  const tv50 = timeFactor(0.5);
  const uAt = t > 0 ? degreeOfConsolidation((cv * t) / (hdr * hdr)) : null;
  let caseText;
  if (!oc || sp <= s0) caseText = 'Normally consolidated: the whole load is on the virgin compression line (Cc).';
  else if (s1 <= sp) caseText = 'Over-consolidated and stays below σ\'p: recompression only (Cr).';
  else caseText = 'Over-consolidated and loaded past σ\'p: Cr up to σ\'p, then Cc.';
  const warnings = [];
  if (H > 10) warnings.push('A layer thicker than about 10 m should be divided into sublayers, each with its own mid-layer stresses, for an accurate settlement.');
  if (S / H > 0.2) warnings.push('The strain exceeds 20 %: small-strain consolidation theory overestimates the settlement; consider finite-strain methods.');
  return {
    outputs: {
      ocr: sp / s0,
      s1_pa: s1,
      case_text: caseText,
      settlement_m: S,
      strain: S / H,
      hdr_m: hdr,
      tv_target: tv,
      t_target_s: (tv * hdr * hdr) / cv,
      t50_s: (tv50 * hdr * hdr) / cv,
      u_at_t: uAt,
      settlement_t_m: uAt === null ? null : uAt * S,
    },
    warnings,
  };
}
