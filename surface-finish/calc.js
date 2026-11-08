/**
 * surface-finish/calc.js — surface roughness conversion between Ra (µm and µin), Rq (RMS), an Rz estimate and the
 * ISO 1302 roughness grade numbers N1–N12, and the theoretical finish of a turned surface from feed and nose radius.
 *
 * 1 µm = 39.37 µin;  Rq = (π / (2√2)) Ra ≈ 1.11 Ra for a sine profile;  Rz ≈ 4 Ra (exact for a triangular profile).
 * N grade: Ra = 0.025 µm × 2^(N − 1).  Turning (Boothroyd): R_t = f² / (8 r),  Ra = f² / (18√3 r) = 0.0321 f² / r.
 * Schema units: SI — m (roughness values reported in µm, µin as plain numbers).
 */
import { withDefaults, assertOneOf, assertPositive, assertRange } from '../shared/validate.js';

const UM = 1e-6;
const UIN_PER_UM = 1 / 0.0254; // 39.370 µin per µm
const RQ_RA = Math.PI / (2 * Math.SQRT2); // 1.1107 for a sine wave
const RZ_RA = 4;

/** Grade numbers N1–N12: Ra in µm and µin (ISO 1302 previous grades, Machinery's Handbook 31st ed. Surface Texture Table 4). */
export const GRADES_UM = [0.025, 0.05, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.3, 12.5, 25, 50];
export const GRADES_UIN = [1, 2, 4, 8, 16, 32, 63, 125, 250, 500, 1000, 2000];

/** Ra of a grade number N, µm. */
export const gradeRa = (n) => GRADES_UM[n - 1];

/** Grade number nearest to an Ra in µm on the logarithmic scale; 0 below N1 and 13 above N12 (beyond half a step). */
export function nGrade(raUm) {
  const l = Math.log2(raUm);
  if (l < Math.log2(GRADES_UM[0]) - 0.5) return 0;
  if (l > Math.log2(GRADES_UM[11]) + 0.5) return 13;
  let best = 1;
  GRADES_UM.forEach((g, k) => { if (Math.abs(Math.log2(g) - l) < Math.abs(Math.log2(GRADES_UM[best - 1]) - l)) best = k + 1; });
  return best;
}

export const schema = {
  id: 'surface-finish',
  name: 'Surface finish converter (Ra, RMS, Rz, N grades)',
  category: 'manufacturing',
  summary: 'Convert surface roughness between Ra in µm and µin, RMS, Rz and ISO N grades, and the theoretical turning finish from feed and nose radius.',
  related: ['speeds-feeds', 'chip-load', 'machining-time', 'tolerance-stack'],
  assumptions: [
    'Ra and Rq (RMS) are not equal: Rq = 1.11 Ra holds exactly only for a sine-wave profile; other profiles give other ratios, so the RMS value here is an estimate.',
    'Rz is estimated as 4 × Ra, the ratio of a regular triangular profile; an ideal turned profile gives 3.9 and a sine 3.14. Measure Rz when the drawing specifies it.',
    'Grade numbers N1 to N12 are the previous ISO 1302 roughness grades: N1 = 0.025 µm and each grade roughly doubles Ra up to N12 = 50 µm; the nearest grade is chosen on the logarithmic scale.',
    'The turning finish is the ideal geometric value of a round-nosed tool, R_t = f²/(8 r) and Ra = 0.0321 f²/r; tool wear, built-up edge, vibration and material tearing make real finishes rougher.',
  ],
  notes: [
    'Verification 2026-11-08: turning at 0.2 mm/rev with a 0.8 mm nose radius gives R_t = 0.04 / 6.4 = 6.25 µm and Ra = 0.04 / (31.18 × 0.8) = 1.60 µm (63.1 µin, N7), Rq about 1.78 µm. Checked by hand.',
    'N grade table checked against Machinery\'s Handbook 31st ed., Surface Texture, Table 4 (preferred roughness values and previous ISO 1302 grade numbers N12 50 µm / 2 000 µin to N1 0.025 µm / 1 µin).',
  ],
  sources: [
    'ISO 1302:2002 Indication of surface texture in technical product documentation; grade numbers N1–N12 as in Machinery\'s Handbook, 31st ed., Surface Texture, Table 4',
    'ISO 4287:1997 Geometrical product specifications — Surface texture: Profile method — Terms, definitions and surface texture parameters (Ra, Rq, Rz)',
    'Boothroyd, G. and Knight, W. A., Fundamentals of Machining and Machine Tools, 3rd ed., CRC Press, 2006: ideal roughness of turning Ra = 0.0321 f² / r',
  ],
  inputs: [
    { id: 'mode', label: 'Calculate', type: 'select', default: 'convert', options: [{ value: 'convert', label: 'Convert a roughness value' }, { value: 'turning', label: 'Theoretical finish of turning' }] },
    { id: 'given', label: 'Given value is', type: 'select', default: 'ra_uin', options: [{ value: 'ra_um', label: 'Ra in µm' }, { value: 'ra_uin', label: 'Ra in µin (AA, CLA)' }, { value: 'rq_um', label: 'Rq (RMS) in µm' }, { value: 'rq_uin', label: 'RMS in µin' }, { value: 'rz_um', label: 'Rz in µm' }, { value: 'n', label: 'N grade number (1 to 12)' }], visibleWhen: { mode: 'convert' } },
    { id: 'value', label: 'Value', group: 'dimensionless', unit: 'none', default: 63, min: 0.001, max: 5000, visibleWhen: { mode: 'convert' } },
    { id: 'feed_m', label: 'Feed per revolution f', group: 'length', unit: 'm', display: 'in', default: 0.008 * 0.0254, min: 1e-6, max: 0.005, visibleWhen: { mode: 'turning' } },
    { id: 'radius_m', label: 'Tool nose radius r', group: 'length', unit: 'm', display: 'in', default: (1 / 32) * 0.0254, min: 1e-5, max: 0.01, visibleWhen: { mode: 'turning' } },
  ],
  outputs: [
    { id: 'ra_m', label: 'Ra (arithmetic mean roughness)', group: 'length', unit: 'm', display: 'um' },
    { id: 'ra_uin', label: 'Ra in µin', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'rq_m', label: 'Rq, RMS (sine profile, 1.11 Ra)', group: 'length', unit: 'm', display: 'um' },
    { id: 'rq_uin', label: 'RMS in µin', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'rz_m', label: 'Rz estimate (4 × Ra)', group: 'length', unit: 'm', display: 'um' },
    { id: 'rt_m', label: 'Theoretical peak-to-valley R_t = f²/(8 r)', group: 'length', unit: 'm', display: 'um', visibleWhen: { mode: 'turning' } },
    { id: 'grade', label: 'Nearest ISO 1302 grade number', type: 'text' },
    { id: 'grades', label: 'Roughness grades N1 to N12', type: 'table' },
  ],
  example: {
    inputs: { mode: 'turning', feed_m: [0.2, 'mm'], radius_m: [0.8, 'mm'] },
    results: { rt_m: '6.25 µm', ra_m: '1.60 µm', ra_uin: '63.1', rq_m: '1.78 µm' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['convert', 'turning'], 'mode', 'Calculate');
  let ra; // µm
  let rt = null;
  const warnings = [];
  if (x.mode === 'convert') {
    assertOneOf(x.given, ['ra_um', 'ra_uin', 'rq_um', 'rq_uin', 'rz_um', 'n'], 'given', 'Given value is');
    const v = assertPositive(x.value, 'value', 'Value');
    if (x.given === 'n') {
      const g = Math.round(v);
      if (g < 1 || g > 12) throw new Error('Value: N grades run from N1 to N12.');
      if (g !== v) warnings.push('N grades are whole numbers, so the value was rounded to N' + g + '.');
      ra = gradeRa(g);
    } else {
      ra = { ra_um: v, ra_uin: v / UIN_PER_UM, rq_um: v / RQ_RA, rq_uin: v / UIN_PER_UM / RQ_RA, rz_um: v / RZ_RA }[x.given];
    }
    if (x.given === 'rz_um' || x.given.startsWith('rq')) warnings.push('Ra was derived from Rz or RMS with a fixed profile ratio; the true ratio depends on the surface, so treat the other values as estimates.');
  } else {
    const f = assertRange(x.feed_m, 1e-6, 0.005, 'feed_m', 'Feed per revolution');
    const r = assertRange(x.radius_m, 1e-5, 0.01, 'radius_m', 'Tool nose radius');
    if (f >= 2 * r) throw new Error('Feed per revolution: it must be smaller than twice the nose radius for the nose to form the whole surface.');
    rt = (f * f) / (8 * r);
    ra = (f * f) / (18 * Math.sqrt(3) * r) / UM;
    if (f > r) warnings.push('The feed is larger than the nose radius: the cutting edges beside the nose shape part of the profile and the finish is rougher than shown.');
  }
  const n = nGrade(ra);
  const grade = n < 1 ? 'Finer than N1 (0.025 µm)' : n > 12 ? 'Rougher than N12 (50 µm)' : `N${n} (Ra ${gradeRa(n)} µm, ${GRADES_UIN[n - 1]} µin)`;
  return {
    outputs: {
      ra_m: ra * UM,
      ra_uin: ra * UIN_PER_UM,
      rq_m: ra * RQ_RA * UM,
      rq_uin: ra * RQ_RA * UIN_PER_UM,
      rz_m: ra * RZ_RA * UM,
      rt_m: rt,
      grade,
      grades: {
        columns: ['Grade', 'Ra (µm)', 'Ra (µin)'],
        rows: Array.from({ length: 12 }, (_, k) => 12 - k).map((g) => [`N${g}`, gradeRa(g), GRADES_UIN[g - 1]]),
      },
    },
    warnings,
  };
}
