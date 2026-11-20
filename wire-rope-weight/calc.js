/**
 * wire-rope-weight/calc.js — mass of steel wire rope per metre, per 100 m and for a length, from the nominal length mass
 * factor W of EN 12385-4 (m' = W d² / 100 kg/m, d in mm); the length on a reel from its net mass; the mass in water; the
 * minimum breaking force K d² R_r / 1000 kN; and the share of that force taken by the rope's own hanging weight.
 *
 * m' = W d² / 100 kg/m;  L = M / m';  m'_w = m' (1 − ρ_w / 7 850);  MBL = K d² R_r / 1000 kN;  share = m' g L / MBL.
 * Schema units: m, kg, N.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';

/** Steel density used for the mass in water, kg/m³. */
export const STEEL_KG_M3 = 7850;

/**
 * Nominal length mass factors W (kg per 100 m per mm²) and minimum breaking force factors K, as tabulated "according to
 * EN 12385-4" in the Hendrik Veder Group steel wire rope catalogue, chapter 4 (6-strand, 8-strand and rotation-resistant
 * ropes). Each pair was checked against the same catalogue's own table at 20 mm (see tests.js).
 */
export const ROPES = {
  '6x7_fc': { label: '6×7, fibre core', w: 0.345, k: 0.332 },
  '7x7': { label: '7×7 (6×7 with a steel strand core)', w: 0.384, k: 0.359 },
  '6x19_fc': { label: '6×19 class (6×19S, 6×19W, 6×25F, 6×26WS), fibre core', w: 0.359, k: 0.330 },
  '6x19_iwrc': { label: '6×19 class (6×19S, 6×19W, 6×25F, 6×26WS), steel core IWRC', w: 0.400, k: 0.356 },
  '6x36_fc': { label: '6×36 class (6×31WS, 6×36WS, 6×41WS), fibre core', w: 0.367, k: 0.330 },
  '6x36_iwrc': { label: '6×36 class (6×31WS to 6×49WS), steel core IWRC', w: 0.409, k: 0.356 },
  '8x19_fc': { label: '8×19 class (8×19S, 8×19W, 8×25F, 8×26WS), fibre core', w: 0.340, k: 0.293 },
  '8x19_iwrc': { label: '8×19 class (8×19S, 8×19W, 8×25F, 8×26WS), steel core IWRC', w: 0.407, k: 0.356 },
  '8x36_fc': { label: '8×36 class (8×31WS, 8×36WS, 8×41WS), fibre core', w: 0.348, k: 0.293 },
  '8x36_iwrc': { label: '8×36 class (8×31WS, 8×36WS, 8×41WS), steel core IWRC', w: 0.417, k: 0.356 },
  '18x7': { label: '18×7 rotation-resistant, fibre core', w: 0.382, k: 0.328 },
  '35x7': { label: '35×7 rotation-resistant (not compacted)', w: 0.454, k: 0.360 },
  custom: { label: 'Other: enter the factors from the rope maker' },
};

const WATER = { sea: 1025, fresh: 1000 };

export const schema = {
  id: 'wire-rope-weight',
  name: 'Wire rope weight calculator',
  category: 'mechanical',
  summary: 'Steel wire rope weight per metre and per foot for 6×19, 6×36, 8-strand and rotation-resistant rope, the length on a reel from its weight, and the breaking load.',
  related: ['wire-rope-swl', 'lifting-sling', 'metal-weight', 'mooring-line-meg4'],
  assumptions: [
    'The mass per metre is W d² / 100 kg/m, with d the nominal diameter in mm and W the nominal length mass factor of the rope construction in EN 12385-4. The factors here are those a rope maker tabulates according to EN 12385-4; a rope\'s own data sheet or certificate overrides them.',
    'The mass is for a new, lubricated rope at its nominal diameter. EN 12385-4 allows the measured diameter of most sizes to be up to 5 % over nominal, so a real rope may weigh a few per cent more. US tables (ASTM A1023, the Wire Rope Users Manual) list slightly heavier figures for the same nominal size.',
    'The length on a reel is the net rope mass divided by the mass per metre. Weigh the reel full and subtract the empty reel, whose mass is stamped on it or given by the supplier.',
    'The mass in water treats the whole rope as steel of 7 850 kg/m³. The fibre core and the lubricant are close to the density of water, so a fibre-core rope weighs a little less in water than shown.',
    'The minimum breaking force is K d² R_r / 1 000 kN by EN 12385-4. The share of it taken by the rope\'s own weight is for the given length hanging straight down; it ignores sheaves, drums and dynamic loads.',
  ],
  notes: [
    'Verification 2026-11-20: 20 mm 6×36 IWRC rope has W = 0.409, so 0.409 × 20² / 100 = 1.636 kg/m and 163.6 kg per 100 m (catalogue table: 164 kg); its MBL in grade 1770 is 0.356 × 400 × 1 770 / 1 000 = 252.0 kN (catalogue: 252 kN). Checked by hand.',
    'Verification 2026-11-20: a 500 kg net coil of 16 mm 6×19 IWRC rope (1.024 kg/m) holds 500 / 1.024 = 488.3 m. Checked by hand.',
    'Design decision: the rope grade is offered for every construction, though makers do not stock every grade in every construction; the mass does not depend on the grade.',
  ],
  sources: [
    'EN 12385-4:2002+A1:2008 Steel wire ropes — Safety — Part 4: Stranded ropes for general lifting applications (nominal length mass factor W, minimum breaking force factor K, diameter tolerance)',
    'Hendrik Veder Group, Steel wire rope catalogue, chapter 4 (6-strand, 8-strand and rotation-resistant ropes according to EN 12385-4): factors W and K and the tables of weight per 100 m and minimum breaking load',
    'Wire Rope Technical Board, Wire Rope Users Manual, 4th ed. (2005), and ASTM A1023/A1023M: approximate weights of US ropes, for comparison',
  ],
  inputs: [
    { id: 'construction', label: 'Rope construction', type: 'select', default: '6x36_iwrc', options: Object.entries(ROPES).map(([value, r]) => ({ value, label: r.w ? `${r.label}: W ${r.w.toFixed(3)}` : r.label })) },
    { id: 'w_custom', label: 'Length mass factor W (kg per 100 m per mm²)', group: 'dimensionless', unit: 'none', default: 0.4, min: 0.1, max: 1, visibleWhen: { construction: 'custom' } },
    { id: 'k_custom', label: 'Breaking force factor K', group: 'dimensionless', unit: 'none', default: 0.356, min: 0.1, max: 1, visibleWhen: { construction: 'custom' } },
    { id: 'diameter_m', label: 'Nominal rope diameter d', group: 'length', unit: 'm', display: 'mm', default: 0.02, min: 0.002, max: 0.12 },
    { id: 'mode', label: 'What do you know?', type: 'select', default: 'length', options: [{ value: 'length', label: 'The length: find the weight' }, { value: 'mass', label: 'The net weight on a reel: find the length' }] },
    { id: 'length_m', label: 'Rope length', group: 'length', unit: 'm', display: 'm', default: 100, min: 0.1, max: 100000, visibleWhen: { mode: 'length' } },
    { id: 'mass_kg', label: 'Net rope weight (full reel less empty reel)', group: 'mass', unit: 'kg', display: 'kg', default: 500, min: 0.01, max: 1e6, visibleWhen: { mode: 'mass' } },
    { id: 'grade', label: 'Rope grade R_r (for the breaking load)', type: 'select', default: '1770', options: [{ value: '1770', label: '1770 N/mm²' }, { value: '1960', label: '1960 N/mm²' }, { value: '2160', label: '2160 N/mm²' }] },
    { id: 'water', label: 'Water (for the weight in water)', type: 'select', default: 'sea', options: [{ value: 'sea', label: 'Seawater, 1 025 kg/m³' }, { value: 'fresh', label: 'Fresh water, 1 000 kg/m³' }] },
  ],
  outputs: [
    { id: 'w_factor', label: 'Length mass factor W', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'unit_kg_m', label: 'Weight per length', group: 'linear_density', unit: 'kg_m', display: 'kg_m', decimals: 3 },
    { id: 'per100_kg', label: 'Weight per 100 m', group: 'mass', unit: 'kg', display: 'kg', decimals: 1 },
    { id: 'length_out_m', label: 'Rope length', group: 'length', unit: 'm', display: 'm' },
    { id: 'total_kg', label: 'Total rope weight', group: 'mass', unit: 'kg', display: 'kg' },
    { id: 'submerged_kg_m', label: 'Weight per length in water', group: 'linear_density', unit: 'kg_m', display: 'kg_m', decimals: 3 },
    { id: 'mbl_n', label: 'Minimum breaking load', group: 'force', unit: 'N', display: 'kN', decimals: 1 },
    { id: 'self_share', label: 'Own weight of the hanging length as a share of the MBL', group: 'ratio', unit: 'frac', display: 'pct', decimals: 2 },
    { id: 'basis_text', label: 'Basis', type: 'text' },
  ],
  example: {
    inputs: { construction: '6x36_iwrc', diameter_m: [20, 'mm'], mode: 'length', length_m: [100, 'm'], grade: '1770', water: 'sea' },
    results: { unit_kg_m: '1.636 kg/m', total_kg: '163.6 kg', mbl_n: '252.0 kN' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.construction, Object.keys(ROPES), 'construction', 'Rope construction');
  assertOneOf(x.mode, ['length', 'mass'], 'mode', 'What do you know');
  assertOneOf(x.grade, ['1770', '1960', '2160'], 'grade', 'Rope grade');
  assertOneOf(x.water, Object.keys(WATER), 'water', 'Water');
  const dMm = assertRange(x.diameter_m, 0.002, 0.12, 'diameter_m', 'Rope diameter') * 1000;
  const custom = x.construction === 'custom';
  const w = custom ? assertRange(x.w_custom, 0.1, 1, 'w_custom', 'Length mass factor W') : ROPES[x.construction].w;
  const k = custom ? assertRange(x.k_custom, 0.1, 1, 'k_custom', 'Breaking force factor K') : ROPES[x.construction].k;
  const warnings = [];
  if (custom && (w < 0.3 || w > 0.5)) warnings.push('W outside 0.3 to 0.5 is unusual for stranded steel rope: check the factor and its unit (kg per 100 m per mm²).');

  const perM = w * dMm * dMm / 100; // kg/m
  let length;
  let total;
  if (x.mode === 'length') {
    length = assertPositive(x.length_m, 'length_m', 'Rope length');
    total = perM * length;
  } else {
    total = assertPositive(x.mass_kg, 'mass_kg', 'Net rope weight');
    length = total / perM;
  }
  const mbl = k * dMm * dMm * Number(x.grade); // N (K d² R_r / 1000 kN)
  const share = perM * GRAVITY_M_S2 * length / mbl;
  if (share >= 0.2) warnings.push('Hanging straight down, this length of rope weighs a fifth of its breaking load or more: with a safety factor of 5 it could lift nothing more.');
  const label = custom ? `entered W ${w} and K ${k}` : ROPES[x.construction].label;
  return {
    outputs: {
      w_factor: w,
      unit_kg_m: perM,
      per100_kg: perM * 100,
      length_out_m: length,
      total_kg: total,
      submerged_kg_m: perM * (1 - WATER[x.water] / STEEL_KG_M3),
      mbl_n: mbl,
      self_share: share,
      basis_text: `EN 12385-4: ${label}; m' = ${w} × ${+dMm.toFixed(3)}² / 100; grade ${x.grade}`,
    },
    warnings,
  };
}
