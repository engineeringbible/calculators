/**
 * proctor-compaction/calc.js — field compaction check: dry density from the wet density and moisture content,
 * relative compaction against the Proctor maximum dry density, void ratio, degree of saturation, air voids and the
 * zero-air-voids density.
 *
 * ρ_d = ρ / (1 + w);  RC = ρ_d / ρ_d,max;  e = G_s ρ_w / ρ_d − 1;  S = w G_s / e;
 * ρ_zav = G_s ρ_w / (1 + w G_s);  air voids V_a = 1 − (ρ_d / ρ_w)(1/G_s + w)  (Das, Principles of Geotechnical
 * Engineering, ch. 3 weight–volume relationships and ch. 6 compaction).
 * Schema units: kg/m³ for densities, fractions for moisture and ratios.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive } from '../shared/validate.js';

/** Density of water used in the weight–volume relations, kg/m³ (62.43 lb/ft³). */
const RHO_W = 1000;
const PCF = 16.01846337396;

export const schema = {
  id: 'proctor-compaction',
  name: 'Soil compaction calculator (Proctor relative compaction)',
  category: 'civil',
  summary: 'Field dry density from wet density and moisture, relative compaction against the Proctor maximum, saturation, air voids and the zero-air-voids density.',
  related: ['earthwork-volume', 'consolidation-settlement', 'soil-bearing', 'footing-size'],
  assumptions: [
    'The wet density and moisture content come from a field test such as the sand cone (ASTM D1556) or the nuclear gauge (ASTM D6938), and the oven moisture content is preferred to a gauge reading.',
    'The maximum dry density and optimum moisture come from a laboratory compaction test on the same soil: standard Proctor (ASTM D698, 600 kN·m/m³) or modified Proctor (ASTM D1557, 2 700 kN·m/m³).',
    'The density of water is 1 000 kg/m³ (62.43 lb/ft³). The specific gravity of solids should be measured (ASTM D854); 2.65 to 2.75 is typical of most soils.',
    'Oversize particles removed from the laboratory sample need the rock correction of ASTM D4718 before the relative compaction is meaningful.',
  ],
  notes: [
    'Verification 2026-11-08: a wet density of 124.0 lb/ft³ at 12.0 % moisture gives a dry density of 110.7 lb/ft³, 96.3 % of a 115.0 lb/ft³ maximum; with G_s = 2.70 the void ratio is 0.522, saturation 62.0 % and the zero-air-voids density 127.3 lb/ft³. Checked by hand.',
  ],
  sources: [
    'ASTM D698-12(2021), Standard Test Methods for Laboratory Compaction Characteristics of Soil Using Standard Effort (12 400 ft-lbf/ft³ (600 kN-m/m³)), and ASTM D1557-12(2021) for modified effort (56 000 ft-lbf/ft³ (2 700 kN-m/m³))',
    'Das, B.M. and Sobhan, K., Principles of Geotechnical Engineering, 9th ed., Cengage, ch. 3 Weight–Volume Relationships and ch. 6 Soil Compaction (zero-air-void unit weight)',
    'ASTM D1556/D1556M Density and Unit Weight of Soil in Place by Sand-Cone Method; ASTM D6938 In-Place Density and Water Content by Nuclear Methods',
  ],
  inputs: [
    { id: 'mode', label: 'Field result entered as', type: 'select', default: 'wet', options: [{ value: 'wet', label: 'Wet (bulk) density and moisture content' }, { value: 'dry', label: 'Dry density and moisture content' }] },
    { id: 'wet_density', label: 'Field wet density', group: 'density', unit: 'kg_m3', display: 'lb_ft3', default: 124 * PCF, min: 500, max: 3000, visibleWhen: { mode: 'wet' } },
    { id: 'dry_density', label: 'Field dry density', group: 'density', unit: 'kg_m3', display: 'lb_ft3', default: 110 * PCF, min: 500, max: 3000, visibleWhen: { mode: 'dry' } },
    { id: 'moisture', label: 'Field moisture content w', group: 'ratio', unit: 'frac', display: 'pct', default: 0.12, min: 0, max: 1 },
    { id: 'mdd', label: 'Proctor maximum dry density', group: 'density', unit: 'kg_m3', display: 'lb_ft3', default: 115 * PCF, min: 500, max: 3000 },
    { id: 'omc', label: 'Proctor optimum moisture content (0 if unknown)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.115, min: 0, max: 1 },
    { id: 'gs', label: 'Specific gravity of solids G_s', group: 'dimensionless', unit: 'none', default: 2.70, min: 2.0, max: 3.2 },
    { id: 'required', label: 'Required relative compaction', group: 'ratio', unit: 'frac', display: 'pct', default: 0.95, min: 0.5, max: 1.1 },
  ],
  outputs: [
    { id: 'dry_density_out', label: 'Field dry density', group: 'density', unit: 'kg_m3', display: 'lb_ft3', decimals: 1 },
    { id: 'rc', label: 'Relative compaction', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'verdict', label: 'Compaction check', type: 'text' },
    { id: 'target_density', label: 'Dry density needed for the required compaction', group: 'density', unit: 'kg_m3', display: 'lb_ft3', decimals: 1 },
    { id: 'moisture_diff', label: 'Moisture relative to optimum (w − OMC)', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'void_ratio', label: 'Void ratio e', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'porosity', label: 'Porosity n', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'saturation', label: 'Degree of saturation S', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'air_voids', label: 'Air voids V_a (share of total volume)', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'zav', label: 'Zero-air-voids dry density at the field moisture', group: 'density', unit: 'kg_m3', display: 'lb_ft3', decimals: 1 },
    { id: 'sat_at_opt', label: 'Saturation at the Proctor optimum', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
  ],
  example: {
    inputs: { mode: 'wet', wet_density: [124, 'lb_ft3'], moisture: [12, 'pct'], mdd: [115, 'lb_ft3'], omc: [11.5, 'pct'], gs: 2.70, required: [95, 'pct'] },
    results: { dry_density_out: '110.7 lb/ft³', rc: '96.3 %', void_ratio: '0.522', saturation: '62.0 %', zav: '127.3 lb/ft³' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['wet', 'dry'], 'mode', 'Field result entered as');
  const w = assertRange(x.moisture, 0, 1, 'moisture', 'Field moisture content');
  const rhoD = x.mode === 'wet'
    ? assertRange(x.wet_density, 500, 3000, 'wet_density', 'Field wet density') / (1 + w)
    : assertRange(x.dry_density, 500, 3000, 'dry_density', 'Field dry density');
  const mdd = assertRange(x.mdd, 500, 3000, 'mdd', 'Proctor maximum dry density');
  const omc = assertRange(x.omc, 0, 1, 'omc', 'Proctor optimum moisture content');
  const gs = assertRange(x.gs, 2.0, 3.2, 'gs', 'Specific gravity of solids');
  const req = assertRange(x.required, 0.5, 1.1, 'required', 'Required relative compaction');
  assertPositive(rhoD, 'dry_density', 'Field dry density');
  const e = (gs * RHO_W) / rhoD - 1;
  if (e <= 0) throw new Error('Field dry density: it is at or above the density of the solid grains (G_s × 1 000 kg/m³), which is impossible; check the density and G_s.');
  const s = (w * gs) / e;
  const rc = rhoD / mdd;
  const warnings = [];
  if (s > 1) warnings.push('The degree of saturation is above 100 %: the density, the moisture content or G_s is wrong, because a soil cannot lie above the zero-air-voids curve.');
  if (rc > 1.05) warnings.push('Relative compaction above 105 %: check that the Proctor test is for the same soil and effort, or apply the oversize correction.');
  let satOpt = null;
  if (omc > 0) {
    satOpt = (omc * gs) / ((gs * RHO_W) / mdd - 1);
    if (satOpt > 1) warnings.push('The Proctor maximum lies above the zero-air-voids curve for this G_s: G_s is probably too low.');
  }
  const pass = rc >= req - 1e-12;
  return {
    outputs: {
      dry_density_out: rhoD,
      rc,
      verdict: pass ? `Passes: ${(rc * 100).toFixed(1)} % ≥ ${(req * 100).toFixed(1)} % required` : `Fails: ${(rc * 100).toFixed(1)} % < ${(req * 100).toFixed(1)} % required; recompact`,
      target_density: req * mdd,
      moisture_diff: omc > 0 ? w - omc : null,
      void_ratio: e,
      porosity: e / (1 + e),
      saturation: s,
      air_voids: 1 - (rhoD / RHO_W) * (1 / gs + w),
      zav: (gs * RHO_W) / (1 + w * gs),
      sat_at_opt: satOpt,
    },
    warnings,
  };
}
