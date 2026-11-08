/**
 * bilged-compartment/calc.js — a box-shaped vessel with one compartment open to the sea (bilged), by the lost
 * buoyancy (constant displacement) method: parallel sinkage, the new KB, BM and GM with the lost waterplane inertia,
 * the shift of the centre of flotation, the trim when the compartment is not amidships, the end drafts and the
 * remaining freeboard.
 *
 * v = μ l b d;  A' = L B − μ l b;  s = v / A';  KB' = d/2 + v (d + s) / (2 V);  I_T' = L B³/12 − μ l b³/12;  BM' = I_T'/V
 * x_F = −μ l b x / A';  I_L' = B L³/12 − μ b l³/12 − μ l b x² − A' x_F²;  tan τ = v (x − x_F) / I_L'
 * Schema units: metres.
 */
import { withDefaults, assertPositive, assertRange, assertNonNegative } from '../shared/validate.js';

export const schema = {
  id: 'bilged-compartment',
  name: 'Bilged compartment (lost buoyancy)',
  category: 'maritime',
  summary: 'Sinkage, end drafts, trim, freeboard and the new GM of a box-shaped vessel after a compartment is bilged, by the lost buoyancy method.',
  related: ['initial-stability', 'hydrostatics', 'drydock-critical-instant', 'gz-criteria'],
  assumptions: [
    'Lost buoyancy (constant displacement) method: the flooded compartment no longer provides buoyancy, displacement and KG are unchanged, and the ship sinks until the intact volume replaces the lost volume v = μ·l·b·d; the added water is not treated as a weight. Both methods give the same final waterline; this one is the standard for bilging and avoids recomputing KG.',
    'Box-shaped vessel (rectangular sections, constant waterplane) with a compartment of length l and breadth b centred on the centreline, open from the keel to above the final waterline; the permeability μ is the fraction of the compartment volume that floods (SOLAS typical values: 0.95 accommodation and voids, 0.85 machinery, 0.60 stores, cargo 0.60–0.95 by type).',
    'Small trims: the vessel trims about the centre of flotation of the intact waterplane by tan τ = moment / I_L\' with the longitudinal inertia about that centre; drafts at the ends are reckoned from the length L. A wing compartment (off the centreline), which also causes list, is not covered.',
    'GM after bilging uses the transverse inertia of the intact waterplane (the lost part has no waterplane) and the new KB; it is the initial GM only — damage stability rules (SOLAS II-1, ICLL) assess the whole GZ curve and the intermediate stages of flooding.',
  ],
  notes: [
    'Verification 2026-10-31: a box 75 m × 10 m at 6 m draft with KG 4 m and a 15 m midship compartment bilged (μ = 1) sinks 1.5 m to 7.5 m; KB rises to 3.75 m, BM falls to 1.111 m and GM rises from 0.389 m to 0.861 m (the classic result: bilging a midship compartment of a box increases GM). A 10 m end compartment of a 100 m × 10 m box at 5 m draft gives tan τ = 0.04115 and drafts of 7.82 m forward and 3.70 m aft, matching the trimmed-box geometry.',
  ],
  sources: [
    'C. B. Barrass, D. R. Derrett, Ship Stability for Masters and Mates, 7th ed. — "Bilging and permeability" (lost buoyancy method, box-shaped vessels)',
    'Rawson & Tupper, Basic Ship Theory, 5th ed., ch. 5 (flooding and damaged stability: lost buoyancy and added weight methods)',
    'SOLAS 1974 Chapter II-1 Part B-1, Regulation 7-3 (permeability)',
  ],
  inputs: [
    { id: 'length_m', label: 'Length L', group: 'length', unit: 'm', default: 75, min: 1, max: 500 },
    { id: 'beam_m', label: 'Breadth B', group: 'length', unit: 'm', default: 10, min: 0.5, max: 100 },
    { id: 'depth_m', label: 'Depth to the deck D', group: 'length', unit: 'm', default: 9, min: 0.5, max: 60 },
    { id: 'draft_m', label: 'Draft before bilging d', group: 'length', unit: 'm', default: 6, min: 0.1, max: 40 },
    { id: 'kg_m', label: 'KG', group: 'length', unit: 'm', default: 4, min: 0, max: 60 },
    { id: 'comp_length_m', label: 'Compartment length l', group: 'length', unit: 'm', default: 15, min: 0.1, max: 500 },
    { id: 'comp_breadth_m', label: 'Compartment breadth b (centred)', group: 'length', unit: 'm', default: 10, min: 0.1, max: 100 },
    { id: 'comp_position_m', label: 'Compartment centre from amidships x (+ forward)', group: 'length', unit: 'm', default: 0, min: -250, max: 250 },
    { id: 'permeability', label: 'Permeability μ', group: 'ratio', unit: 'frac', default: 1, min: 0.01, max: 1 },
  ],
  outputs: [
    { id: 'lost_volume_m3', label: 'Lost buoyancy v = μ l b d', group: 'volume', unit: 'm3' },
    { id: 'intact_area_m2', label: 'Intact waterplane area', group: 'area', unit: 'm2' },
    { id: 'sinkage_m', label: 'Parallel sinkage', group: 'length', unit: 'm' },
    { id: 'mean_draft_m', label: 'Draft at the new centre of flotation', group: 'length', unit: 'm' },
    { id: 'gm_before_m', label: 'GM before bilging', group: 'length', unit: 'm' },
    { id: 'kb_after_m', label: 'KB after bilging', group: 'length', unit: 'm' },
    { id: 'bm_after_m', label: 'BM after bilging', group: 'length', unit: 'm' },
    { id: 'gm_after_m', label: 'GM after bilging', group: 'length', unit: 'm' },
    { id: 'lcf_shift_m', label: 'Centre of flotation from amidships (+ forward)', group: 'length', unit: 'm' },
    { id: 'trim_m', label: 'Trim (+ by the head)', group: 'length', unit: 'm' },
    { id: 'draft_fwd_m', label: 'Draft forward', group: 'length', unit: 'm' },
    { id: 'draft_aft_m', label: 'Draft aft', group: 'length', unit: 'm' },
    { id: 'min_freeboard_m', label: 'Least freeboard after bilging', group: 'length', unit: 'm' },
    { id: 'status', label: 'Assessment', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      lost_volume_m3: '900 m³',
      intact_area_m2: '600 m²',
      sinkage_m: '1.5 m',
      mean_draft_m: '7.5 m',
      gm_before_m: '0.389 m',
      kb_after_m: '3.75 m',
      bm_after_m: '1.111 m',
      gm_after_m: '0.861 m',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  const L = i.length_m;
  const B = i.beam_m;
  const d = i.draft_m;
  assertPositive(L, 'length_m', 'Length');
  assertPositive(B, 'beam_m', 'Breadth');
  assertPositive(i.depth_m, 'depth_m', 'Depth');
  assertRange(d, 1e-9, i.depth_m, 'draft_m', 'Draft');
  assertNonNegative(i.kg_m, 'kg_m', 'KG');
  assertRange(i.comp_length_m, 1e-9, L, 'comp_length_m', 'Compartment length');
  assertRange(i.comp_breadth_m, 1e-9, B, 'comp_breadth_m', 'Compartment breadth');
  const half = (L - i.comp_length_m) / 2;
  assertRange(i.comp_position_m, -half, half, 'comp_position_m', 'Compartment position');
  assertRange(i.permeability, 0.01, 1, 'permeability', 'Permeability');

  const mu = i.permeability;
  const l = i.comp_length_m;
  const b = i.comp_breadth_m;
  const x = i.comp_position_m;
  const volume = L * B * d;
  const lost = mu * l * b * d;
  const area = L * B - mu * l * b;
  const sinkage = lost / area;
  const gmBefore = d / 2 + (L * B ** 3) / 12 / volume - i.kg_m;
  const kb = d / 2 + (lost * (d + sinkage)) / (2 * volume);
  const it = (L * B ** 3) / 12 - (mu * l * b ** 3) / 12;
  const bm = it / volume;
  const gm = kb + bm - i.kg_m;
  const xf = (-mu * l * b * x) / area || 0;
  const il = (B * L ** 3) / 12 - (mu * b * l ** 3) / 12 - mu * l * b * x * x - area * xf * xf;
  const tanTrim = (lost * (x - xf)) / il;
  const meanDraft = d + sinkage;
  const draftFwd = meanDraft + tanTrim * (L / 2 - xf);
  const draftAft = meanDraft - tanTrim * (L / 2 + xf);
  const minFreeboard = i.depth_m - Math.max(draftFwd, draftAft);

  let status;
  if (minFreeboard <= 0) status = `SINKS or floods over the deck: the ${draftFwd >= draftAft ? 'forward' : 'after'} draft ${Math.max(draftFwd, draftAft).toFixed(2)} m reaches the ${i.depth_m} m depth.`;
  else if (gm <= 0) status = `Afloat but unstable: GM after bilging is ${gm.toFixed(3)} m — the vessel will list or capsize.`;
  else status = `Afloat: least freeboard ${minFreeboard.toFixed(2)} m, GM ${gm.toFixed(3)} m (was ${gmBefore.toFixed(3)} m).`;

  const warnings = [];
  if (Math.abs(tanTrim) > 0.05) warnings.push(`Large trim (${(Math.atan(tanTrim) * 180 / Math.PI).toFixed(1)}°): the small-trim assumption loses accuracy and the deck edge may immerse.`);
  if (draftFwd < 0 || draftAft < 0) warnings.push('One end lifts out of the water: the box formulas no longer hold.');
  warnings.push('Initial GM of a box-shaped vessel only; real damage stability needs the hull form, the whole GZ curve and the intermediate stages of flooding.');

  return {
    outputs: {
      lost_volume_m3: lost,
      intact_area_m2: area,
      sinkage_m: sinkage,
      mean_draft_m: meanDraft,
      gm_before_m: gmBefore,
      kb_after_m: kb,
      bm_after_m: bm,
      gm_after_m: gm,
      lcf_shift_m: xf,
      trim_m: tanTrim * L,
      draft_fwd_m: draftFwd,
      draft_aft_m: draftAft,
      min_freeboard_m: minFreeboard,
      status,
    },
    warnings,
  };
}
