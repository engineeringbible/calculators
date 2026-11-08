/**
 * joist-span/calc.js — maximum span of a rectangular sawn-timber floor joist or rafter under uniform load, from
 * bending and deflection by beam mechanics (simply supported, uniform load), with NDS allowable stress adjustment.
 *
 * M = w L²/8 ≤ F'b S → L_b = √(8 F'b S / w);  Δ = 5 w L⁴/(384 E I) ≤ L/n → L_Δ = (384 E I / (5 w n))^(1/3).
 * F'b = Fb × C_D × C_F × C_r (NDS 2018, 4.3: dry service, normal temperature, compression edge braced, C_L = 1).
 * Dead load alone is checked with C_D = 0.9. Schema units: m, Pa, Pa (area loads), m (spacing).
 */
import { withDefaults, assertOneOf, assertRange, assertPositive, assertNonNegative } from '../shared/validate.js';

const IN = 0.0254;
const PSI = 6894.757293168;
const PSF = 47.88025898033584;

/** NDS Supplement (2018) Table 4A reference values, 2"–4" thick visually graded dimension lumber: Fb, E (psi). */
export const GRADES = {
  dfl2: { label: 'Douglas Fir-Larch No. 2 (Fb 900 psi, E 1 600 000 psi)', fb: 900, e: 1.6e6 },
  hf2: { label: 'Hem-Fir No. 2 (Fb 850 psi, E 1 300 000 psi)', fb: 850, e: 1.3e6 },
  spf12: { label: 'Spruce-Pine-Fir No. 1/No. 2 (Fb 875 psi, E 1 400 000 psi)', fb: 875, e: 1.4e6 },
  custom: { label: 'Other: enter Fb, E and C_F', fb: null, e: null },
};
/** Dressed (actual) sizes of nominal 2× lumber, inches (PS 20 / NDS Supplement Table 1B). */
export const SIZES = {
  '2x6': { b: 1.5, d: 5.5 }, '2x8': { b: 1.5, d: 7.25 }, '2x10': { b: 1.5, d: 9.25 }, '2x12': { b: 1.5, d: 11.25 },
  custom: { b: null, d: null },
};

/** NDS Supplement Table 4A size factor C_F for Fb, 2" and 3" thick members, by actual depth in inches. */
export function sizeFactor(dIn) {
  if (dIn <= 3.5 + 1e-9) return 1.5;
  if (dIn <= 4.5 + 1e-9) return 1.4;
  if (dIn <= 5.5 + 1e-9) return 1.3;
  if (dIn <= 7.25 + 1e-9) return 1.2;
  if (dIn <= 9.25 + 1e-9) return 1.1;
  if (dIn <= 11.25 + 1e-9) return 1.0;
  return 0.9;
}

/** Longest simply supported span (m) for bending and for a deflection limit L/n under line loads (N/m). */
export function spanBending(fb, S, w) { return w > 0 ? Math.sqrt((8 * fb * S) / w) : Infinity; }
export function spanDeflection(E, I, w, n) { return w > 0 ? Math.cbrt((384 * E * I) / (5 * w * n)) : Infinity; }

const feetInches = (m) => {
  const totalIn = Math.floor(m / IN + 1e-9);
  return `${Math.floor(totalIn / 12)} ft ${totalIn % 12} in`;
};

export const schema = {
  id: 'joist-span',
  name: 'Joist span calculator (bending and deflection)',
  category: 'structural',
  summary: 'Maximum span of a wood floor joist or rafter from its size, spacing, grade and loads, by bending and deflection mechanics with NDS adjustment factors.',
  related: ['deflection-limits', 'beam-deflection', 'load-combinations', 'snow-load'],
  assumptions: [
    'Spans are computed from mechanics for a simply supported member under uniform load: M = wL²/8 and Δ = 5wL⁴/(384EI). They are not copied from code span tables, which may include other checks and rounding.',
    'Allowable bending stress F\'b = Fb × C_D × C_F × C_r by the NDS: dry service, normal temperature, the compression edge held by sheathing (C_L = 1) and C_r = 1.15 for joists at 24 in or less with at least three members sharing the load.',
    'The dead load is also checked alone with C_D = 0.9. Shear, bearing at the supports, vibration and notches are not checked; shear rarely governs uniformly loaded joists of usual spans.',
    'Loads are area loads on plan for floors; for a sloping rafter enter the horizontal projection of the span and loads per horizontal area. Self-weight belongs in the dead load.',
    'The preset grades use NDS Supplement Table 4A reference values for 2 in thick dimension lumber, with C_F from the depth; other species, grades or sizes take Fb, E and C_F as entered.',
  ],
  notes: [
    'Verification 2026-11-08: a Douglas Fir-Larch No. 2 2×10 at 16 in with 10 psf dead and 40 psf live: F\'b = 900 × 1.0 × 1.1 × 1.15 = 1 138.5 psi, S = 21.39 in³, I = 98.93 in⁴; bending allows 187.3 in (15.6 ft), live deflection L/360 allows 16.4 ft and total L/240 17.4 ft, so bending governs at 15.6 ft. Checked by hand.',
  ],
  sources: [
    'AWC National Design Specification (NDS) for Wood Construction, 2018 ed., 4.3 adjustment factors (C_D Table 2.3.2, C_F, C_r 4.3.9) and 3.3 bending members',
    'AWC NDS Supplement, Design Values for Wood Construction, 2018 ed., Table 1B (section properties of standard dressed lumber) and Table 4A (reference values and size factors)',
    'Gere, J.M. and Goodno, B.J., Mechanics of Materials, Cengage (simply supported beam under uniform load: M = wL²/8, Δ = 5wL⁴/384EI)',
  ],
  inputs: [
    { id: 'grade', label: 'Species and grade', type: 'select', default: 'dfl2', options: Object.entries(GRADES).map(([value, g]) => ({ value, label: g.label })) },
    { id: 'fb_pa', label: 'Reference bending stress Fb', group: 'pressure', unit: 'Pa', display: 'psi', default: 900 * PSI, min: 1e6, max: 100e6, visibleWhen: { grade: 'custom' } },
    { id: 'e_pa', label: 'Modulus of elasticity E', group: 'pressure', unit: 'Pa', display: 'psi', default: 1.6e6 * PSI, min: 1e9, max: 30e9, visibleWhen: { grade: 'custom' } },
    { id: 'cf', label: 'Size factor C_F', group: 'dimensionless', unit: 'none', default: 1.0, min: 0.5, max: 1.5, visibleWhen: { grade: 'custom' } },
    { id: 'size', label: 'Joist size', type: 'select', default: '2x10', options: [{ value: '2x6', label: '2×6 (1.5 × 5.5 in)' }, { value: '2x8', label: '2×8 (1.5 × 7.25 in)' }, { value: '2x10', label: '2×10 (1.5 × 9.25 in)' }, { value: '2x12', label: '2×12 (1.5 × 11.25 in)' }, { value: 'custom', label: 'Other: enter width and depth' }] },
    { id: 'b_m', label: 'Actual width b', group: 'length', unit: 'm', display: 'in', default: 1.5 * IN, min: 0.01, max: 0.5, visibleWhen: { size: 'custom' } },
    { id: 'd_m', label: 'Actual depth d', group: 'length', unit: 'm', display: 'in', default: 9.25 * IN, min: 0.02, max: 1, visibleWhen: { size: 'custom' } },
    { id: 'spacing_m', label: 'Spacing, centre to centre', group: 'length', unit: 'm', display: 'in', default: 16 * IN, min: 0.05, max: 2 },
    { id: 'dead_pa', label: 'Dead load (including self-weight)', group: 'pressure', unit: 'Pa', display: 'psf', default: 10 * PSF, min: 0, max: 50000 },
    { id: 'live_pa', label: 'Live or snow load', group: 'pressure', unit: 'Pa', display: 'psf', default: 40 * PSF, min: 0, max: 50000 },
    { id: 'cd', label: 'Load duration factor C_D for dead + live', type: 'select', default: '1', options: [{ value: '1', label: '1.0: occupancy live load (10 years)' }, { value: '1.15', label: '1.15: snow load (2 months)' }, { value: '1.25', label: '1.25: construction load (7 days)' }, { value: '0.9', label: '0.9: permanent load' }] },
    { id: 'repetitive', label: 'Repetitive members (C_r = 1.15)', type: 'select', default: 'yes', options: [{ value: 'yes', label: 'Yes: 3 or more joists at 24 in or less, sheathed' }, { value: 'no', label: 'No' }] },
    { id: 'n_live', label: 'Live load deflection limit L/n (n)', group: 'dimensionless', unit: 'none', default: 360, min: 60, max: 2000 },
    { id: 'n_total', label: 'Total load deflection limit L/n (n)', group: 'dimensionless', unit: 'none', default: 240, min: 60, max: 2000 },
    { id: 'span_m', label: 'Span to check (0 = none)', group: 'length', unit: 'm', display: 'ft', default: 0, min: 0, max: 30 },
  ],
  outputs: [
    { id: 'max_span_m', label: 'Maximum span', group: 'length', unit: 'm', display: 'ft', decimals: 2 },
    { id: 'max_span_text', label: 'Maximum span in feet and inches (rounded down)', type: 'text' },
    { id: 'governs', label: 'Governing check', type: 'text' },
    { id: 'span_bending_m', label: 'Span limited by bending', group: 'length', unit: 'm', display: 'ft', decimals: 2 },
    { id: 'span_live_m', label: 'Span limited by live load deflection', group: 'length', unit: 'm', display: 'ft', decimals: 2 },
    { id: 'span_total_m', label: 'Span limited by total load deflection', group: 'length', unit: 'm', display: 'ft', decimals: 2 },
    { id: 'fb_adj_pa', label: 'Allowable bending stress F\'b', group: 'pressure', unit: 'Pa', display: 'psi', decimals: 0 },
    { id: 'stress_ratio', label: 'Bending stress / F\'b at the span checked', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'defl_live_m', label: 'Live load deflection at the span checked', group: 'length', unit: 'm', display: 'in', decimals: 3 },
    { id: 'defl_total_m', label: 'Total load deflection at the span checked', group: 'length', unit: 'm', display: 'in', decimals: 3 },
  ],
  example: {
    inputs: { grade: 'dfl2', size: '2x10', spacing_m: [16, 'in'], dead_pa: [10, 'psf'], live_pa: [40, 'psf'], cd: '1', repetitive: 'yes', n_live: 360, n_total: 240 },
    results: { fb_adj_pa: '1 139 psi', span_bending_m: '15.61 ft', span_live_m: '16.38 ft', span_total_m: '17.41 ft', max_span_m: '15.61 ft' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.grade, Object.keys(GRADES), 'grade', 'Species and grade');
  assertOneOf(x.size, Object.keys(SIZES), 'size', 'Joist size');
  assertOneOf(String(x.cd), ['1', '1.15', '1.25', '0.9'], 'cd', 'Load duration factor');
  assertOneOf(x.repetitive, ['yes', 'no'], 'repetitive', 'Repetitive members');
  const custom = x.grade === 'custom';
  const b = x.size === 'custom' ? assertRange(x.b_m, 0.01, 0.5, 'b_m', 'Actual width b') : SIZES[x.size].b * IN;
  const d = x.size === 'custom' ? assertRange(x.d_m, 0.02, 1, 'd_m', 'Actual depth d') : SIZES[x.size].d * IN;
  if (d < b) throw new Error('Actual depth d: the joist must be deeper than it is wide; enter the larger dimension as the depth.');
  let cf;
  if (custom) cf = assertRange(x.cf, 0.5, 1.5, 'cf', 'Size factor C_F');
  else {
    if (b > 2.5 * IN + 1e-9) throw new Error('Actual width b: the preset grades use the size factors for 2 in and 3 in thick lumber (up to 2.5 in actual); choose "Other" for thicker members.');
    cf = sizeFactor(d / IN);
  }
  const fb = custom ? assertRange(x.fb_pa, 1e6, 100e6, 'fb_pa', 'Reference bending stress Fb') : GRADES[x.grade].fb * PSI;
  const E = custom ? assertRange(x.e_pa, 1e9, 30e9, 'e_pa', 'Modulus of elasticity E') : GRADES[x.grade].e * PSI;
  const s = assertRange(x.spacing_m, 0.05, 2, 'spacing_m', 'Spacing');
  const qD = assertNonNegative(x.dead_pa, 'dead_pa', 'Dead load');
  const qL = assertNonNegative(x.live_pa, 'live_pa', 'Live load');
  if (qD + qL <= 0) throw new Error('Live or snow load: enter a dead or a live load.');
  const nL = assertRange(x.n_live, 60, 2000, 'n_live', 'Live load deflection limit');
  const nT = assertRange(x.n_total, 60, 2000, 'n_total', 'Total load deflection limit');
  const span = assertNonNegative(x.span_m, 'span_m', 'Span to check');
  const cd = Number(x.cd);
  const cr = x.repetitive === 'yes' && s <= 24 * IN + 1e-9 ? 1.15 : 1;
  const warnings = [];
  if (x.repetitive === 'yes' && s > 24 * IN + 1e-9) warnings.push('C_r = 1.15 applies only to members at 24 in (610 mm) or less; it is not used at this spacing.');
  const fbAdj = fb * cd * cf * cr;
  const fbDead = fb * 0.9 * cf * cr;
  const S = (b * d * d) / 6;
  const I = (b * d ** 3) / 12;
  const wD = qD * s; const wL = qL * s;
  const lBend = Math.min(spanBending(fbAdj, S, wD + wL), spanBending(fbDead, S, wD));
  const lLive = spanDeflection(E, I, wL, nL);
  const lTot = spanDeflection(E, I, wD + wL, nT);
  const max = Math.min(lBend, lLive, lTot);
  const governs = max === lBend ? (spanBending(fbDead, S, wD) < spanBending(fbAdj, S, wD + wL) ? 'Bending under dead load alone (C_D = 0.9)' : 'Bending') : max === lLive ? `Live load deflection L/${nL}` : `Total load deflection L/${nT}`;
  if (max / d > 30) warnings.push('The span is more than 30 times the depth: check floor vibration, which deflection limits alone do not control.');
  if (max / d < 10) warnings.push('The span is less than 10 times the depth: check shear and bearing, which this page does not.');
  const w = wD + wL;
  return {
    outputs: {
      max_span_m: max,
      max_span_text: feetInches(max),
      governs,
      span_bending_m: lBend,
      span_live_m: Number.isFinite(lLive) ? lLive : null,
      span_total_m: lTot,
      fb_adj_pa: fbAdj,
      stress_ratio: span > 0 ? Math.max((w * span * span) / 8 / S / fbAdj, (wD * span * span) / 8 / S / fbDead) : null,
      defl_live_m: span > 0 ? (5 * wL * span ** 4) / (384 * E * I) : null,
      defl_total_m: span > 0 ? (5 * w * span ** 4) / (384 * E * I) : null,
    },
    warnings,
  };
}
