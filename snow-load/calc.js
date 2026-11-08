/**
 * snow-load/calc.js — roof snow load from the ground snow load by EN 1991-1-3 or ASCE 7-16, for flat and pitched roofs
 * without drifting, with the total snow weight on the roof.
 *
 * EN: s = μ1 C_e C_t s_k; μ1 = 0.8 (0–30°), 0.8 (60 − α)/30 (30–60°), 0 (≥ 60°).
 * ASCE 7-16: p_f = 0.7 C_e C_t I_s p_g; p_s = C_s p_f (Fig. 7.4-1); minimum p_m for slopes < 15°.
 * Schema units: SI — Pa, m², degrees (numbers).
 */
import { withDefaults, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const PSF = 4.4482216152605 / 0.09290304;

/** EN 1991-1-3 Table 5.2 shape coefficient μ1 (no snow fences). */
export function mu1(alpha) {
  if (alpha <= 30) return 0.8;
  if (alpha < 60) return (0.8 * (60 - alpha)) / 30;
  return 0;
}

/** ASCE 7-16 Fig. 7.4-1 roof slope factor C_s: 1 up to a slope, then linear to 0 at 70°. */
export function slopeFactor(alpha, ct, slippery) {
  let start;
  if (ct <= 1.0) start = slippery ? 5 : 30;
  else if (ct <= 1.1) start = slippery ? 10 : 37.5;
  else start = slippery ? 15 : 45;
  if (alpha <= start) return 1;
  if (alpha >= 70) return 0;
  return (70 - alpha) / (70 - start);
}

export const schema = {
  id: 'snow-load',
  name: 'Snow load calculator (Eurocode and ASCE 7)',
  category: 'structural',
  summary: 'Roof snow load from the ground snow load for flat and pitched roofs by EN 1991-1-3 or ASCE 7-16, with exposure, thermal and slope factors.',
  related: ['wind-load', 'beam-deflection', 'moment-of-inertia', 'footing-size'],
  assumptions: [
    'The ground snow load s_k or p_g is the characteristic value for the site from the national annex map (Eurocode) or the ASCE 7 map and local amendments; the calculator does not look it up.',
    'Balanced (undrifted) load on a monopitch or each side of a duopitch roof. Drifts at parapets, steps and valleys, sliding snow, unbalanced loads and rain-on-snow can be much larger and must be added for design.',
    'Eurocode: C_e = 0.8 windswept, 1.0 normal, 1.2 sheltered (Table 5.1); C_t = 1.0 unless the roof is highly glazed and heated. The slope coefficient assumes snow can slide off; with snow guards μ stays 0.8.',
    'ASCE 7-16: C_e from Table 7.3-1 (simplified to fully exposed 0.9, partially exposed 1.0, sheltered 1.2 for surface roughness B and C); C_t from Table 7.3-2; I_s from Table 1.5-2. ASCE 7-22 changed the ground snow maps and removed I_s; use the edition your building code adopts.',
  ],
  notes: [
    'Verification 2026-11-07: EN with s_k = 1.0 kPa, normal exposure and a 35° roof gives μ1 = 0.667 and 0.667 kPa; ASCE 7-16 with p_g = 30 psf, partially exposed, heated, risk category II, flat roof: p_f = 21 psf, minimum 20 psf, so 21 psf. Checked by hand.',
  ],
  sources: [
    'EN 1991-1-3:2003 + A1:2015, Actions on structures — Snow loads: eq. (5.1), Tables 5.1 and 5.2',
    'ASCE/SEI 7-16, Minimum Design Loads and Associated Criteria for Buildings and Other Structures, Chapter 7: eqs. 7.3-1 and 7.4-1, Tables 7.3-1 and 7.3-2, Fig. 7.4-1, §7.3.4; Table 1.5-2',
  ],
  inputs: [
    { id: 'code', label: 'Code', type: 'select', default: 'en', options: [{ value: 'en', label: 'Eurocode EN 1991-1-3' }, { value: 'asce', label: 'ASCE 7-16 (US)' }] },
    { id: 'ground_pa', label: 'Ground snow load s_k or p_g', group: 'pressure', unit: 'Pa', display: 'kPa', default: 1000, min: 0, max: 50000 },
    { id: 'slope_deg', label: 'Roof slope (degrees)', group: 'dimensionless', unit: 'none', default: 35, min: 0, max: 90 },
    { id: 'exposure', label: 'Exposure', type: 'select', default: 'normal', options: [{ value: 'windswept', label: 'Windswept / fully exposed' }, { value: 'normal', label: 'Normal / partially exposed' }, { value: 'sheltered', label: 'Sheltered' }] },
    { id: 'thermal', label: 'Thermal condition (ASCE C_t)', type: 'select', default: 'heated', options: [{ value: 'heated', label: 'Heated building (1.0)' }, { value: 'cold_vent', label: 'Kept just above freezing / ventilated cold roof (1.1)' }, { value: 'unheated', label: 'Unheated or open (1.2)' }, { value: 'freezer', label: 'Freezer building (1.3)' }], visibleWhen: { code: 'asce' } },
    { id: 'surface', label: 'Roof surface (ASCE)', type: 'select', default: 'other', options: [{ value: 'other', label: 'Shingles, tiles, rough or obstructed' }, { value: 'slippery', label: 'Unobstructed slippery (metal, membrane, glass)' }], visibleWhen: { code: 'asce' } },
    { id: 'risk', label: 'Risk category (ASCE I_s)', type: 'select', default: 'II', options: [{ value: 'I', label: 'I — low hazard (0.8)' }, { value: 'II', label: 'II — normal buildings (1.0)' }, { value: 'III', label: 'III — assembly, schools (1.1)' }, { value: 'IV', label: 'IV — essential facilities (1.2)' }], visibleWhen: { code: 'asce' } },
    { id: 'ct_en', label: 'Thermal coefficient C_t (Eurocode)', group: 'dimensionless', unit: 'none', default: 1, min: 0.5, max: 1, visibleWhen: { code: 'en' } },
    { id: 'roof_area_m2', label: 'Roof plan area (optional, for the total)', group: 'area', unit: 'm2', default: 0, min: 0, max: 1e6 },
  ],
  outputs: [
    { id: 'shape_factor', label: 'Shape or slope factor (μ1 or C_s)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'flat_pa', label: 'Flat-roof snow load (μ = 0.8 for EN, p_f for ASCE)', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'roof_pa', label: 'Roof snow load on the slope (per plan area)', group: 'pressure', unit: 'Pa', display: 'kPa' },
    { id: 'total_n', label: 'Total snow on the roof plan area', group: 'force', unit: 'N', display: 'kN' },
    { id: 'note', label: 'Governing case', type: 'text' },
  ],
  example: {
    inputs: { code: 'en', ground_pa: [1, 'kPa'], slope_deg: 35, exposure: 'normal', ct_en: 1, roof_area_m2: [0, 'm2'] },
    results: { shape_factor: '0.667', roof_pa: '0.667 kPa' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.code, ['en', 'asce'], 'code', 'Code');
  assertOneOf(x.exposure, ['windswept', 'normal', 'sheltered'], 'exposure', 'Exposure');
  const g = assertNonNegative(x.ground_pa, 'ground_pa', 'Ground snow load');
  const a = assertRange(x.slope_deg, 0, 90, 'slope_deg', 'Roof slope');
  const area = assertNonNegative(x.roof_area_m2, 'roof_area_m2', 'Roof plan area');
  let factor; let flat; let roof; let note;
  if (x.code === 'en') {
    const ce = { windswept: 0.8, normal: 1.0, sheltered: 1.2 }[x.exposure];
    const ct = assertRange(x.ct_en, 0.5, 1, 'ct_en', 'Thermal coefficient');
    factor = mu1(a);
    flat = 0.8 * ce * ct * g;
    roof = factor * ce * ct * g;
    note = `s = μ1 C_e C_t s_k with μ1 = ${factor.toFixed(3)}, C_e = ${ce}, C_t = ${ct}`;
  } else {
    assertOneOf(x.thermal, ['heated', 'cold_vent', 'unheated', 'freezer'], 'thermal', 'Thermal condition');
    assertOneOf(x.surface, ['other', 'slippery'], 'surface', 'Roof surface');
    assertOneOf(x.risk, ['I', 'II', 'III', 'IV'], 'risk', 'Risk category');
    const ce = { windswept: 0.9, normal: 1.0, sheltered: 1.2 }[x.exposure];
    const ct = { heated: 1.0, cold_vent: 1.1, unheated: 1.2, freezer: 1.3 }[x.thermal];
    const is = { I: 0.8, II: 1.0, III: 1.1, IV: 1.2 }[x.risk];
    flat = 0.7 * ce * ct * is * g;
    factor = slopeFactor(a, ct, x.surface === 'slippery');
    roof = factor * flat;
    note = `p_s = C_s × 0.7 C_e C_t I_s p_g with C_s = ${factor.toFixed(3)}, C_e = ${ce}, C_t = ${ct}, I_s = ${is}`;
    if (a < 15) {
      const pgPsf = g / PSF;
      const pm = (pgPsf <= 20 ? is * pgPsf : 20 * is) * PSF;
      if (pm > roof) { roof = pm; note = `Minimum roof snow load p_m governs (ASCE 7-16 §7.3.4): ${(pm / PSF).toFixed(1)} psf`; }
    }
  }
  const warnings = [];
  if (roof > 0) warnings.push('Balanced load only: add drifts at parapets, higher roofs and valleys, and unbalanced load on pitched roofs, as the code requires.');
  return { outputs: { shape_factor: factor, flat_pa: flat, roof_pa: roof, total_n: area > 0 ? roof * area : null, note }, warnings };
}
