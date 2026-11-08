/**
 * earthwork-volume/calc.js — earthwork volumes between cross-sections by the average end area and prismoidal
 * methods, with swell and shrinkage factors to convert bank volume to loose (haul) and compacted volumes, truck loads
 * and mass.
 *
 * V_AEA = L (A₁ + A₂)/2;  V_prism = L (A₁ + 4 A_m + A₂)/6;  V_loose = V_bank (1 + swell);  V_compacted = V_bank (1 − shrinkage).
 * Schema units: m², m, m³, t.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** Typical swell (bank → loose) and shrinkage (bank → compacted) with bank densities. */
export const SOILS = {
  sand_gravel: { label: 'Sand and gravel (swell 12 %, shrinkage 12 %, 1 900 kg/m³)', swell: 0.12, shrink: 0.12, density: 1900 },
  loam: { label: 'Loam / sandy clay (swell 25 %, shrinkage 10 %, 1 700 kg/m³)', swell: 0.25, shrink: 0.1, density: 1700 },
  clay: { label: 'Clay (swell 33 %, shrinkage 10 %, 1 800 kg/m³)', swell: 0.33, shrink: 0.1, density: 1800 },
  topsoil: { label: 'Topsoil (swell 25 %, shrinkage 15 %, 1 400 kg/m³)', swell: 0.25, shrink: 0.15, density: 1400 },
  rock_blasted: { label: 'Blasted rock (swell 50 %, bulks 30 % when placed, 2 500 kg/m³)', swell: 0.5, shrink: -0.3, density: 2500 },
  custom: { label: 'Custom factors', swell: null, shrink: null, density: null },
};

export const schema = {
  id: 'earthwork-volume',
  name: 'Earthwork cut and fill volumes',
  category: 'civil',
  summary: 'Volumes by the average end area and prismoidal methods from cross-sections, with swell, shrinkage and haul mass.',
  related: ['concrete-volume', 'rational-runoff', 'manning-channel-flow', 'tank-volume'],
  assumptions: [
    'Volume between two parallel cross-sections of areas A₁ and A₂ a distance L apart: average end area V = L (A₁ + A₂)/2, exact for prismoids with linearly varying area and over-estimating when the sections differ greatly (up to 25 % for a pyramid); prismoidal formula V = L (A₁ + 4 A_m + A₂)/6 with the true mid-section area A_m, exact for any prismoid — when A_m is not measured it is estimated from the mean of the linear dimensions, A_m ≈ ((√A₁ + √A₂)/2)², which is exact for similar sections.',
    'The section areas are net cut or fill areas from the cross-sections (ground minus design); cut and fill between the same stations are handled as two separate calculations; curved alignments need the curvature correction (Pappus) which is not applied.',
    'Earth states: bank (in place) volume is what the cross-sections give; excavated material swells to the loose volume hauled in trucks, V_loose = V_bank (1 + swell); placed and compacted fill occupies V_compacted = V_bank (1 − shrinkage) — blasted rock bulks instead of shrinking (negative shrinkage); typical factors (sand 12 %, loam 25 %/10 %, clay 33 %/10 %, topsoil 25 %/15 %, rock 50 %/−30 %) vary by ±30 % and should be replaced by project test data.',
    'Fill required: the compacted fill volume needed divided by (1 − shrinkage) gives the bank volume to excavate, and ×(1 + swell) the loose volume to haul; truck loads = loose volume / truck capacity (struck or heaped as entered); mass from the bank density (loose density = bank density/(1 + swell)).',
    'No allowance for topsoil stripping, over-excavation, unsuitable material, settlement of the foundation or compaction testing; quantities are for estimating and mass-haul planning, not for payment unless the contract uses these methods.',
  ],
  notes: [
    'Verification 2026-10-31: the published example A₁ 150.25 m², A_m 201.375 m², A₂ 259.375 m², L 20 m gives 4 050.42 m³ by the prismoidal formula and 4 096.25 m³ by the average end area, as tabulated in the earthworks lecture notes; the clay factors (swell 33 %, shrink to 90 %) match the quoted reference values.',
    'Design decision: the mid-section area may be entered or estimated; the estimate is flagged in the output so a surveyed A_m is preferred for payment quantities.',
  ],
  sources: [
    'FHWA Federal Lands Highway Project Development and Design Manual, ch. 9 Earthwork design (average end area, prismoidal, mass haul)',
    'Caterpillar Performance Handbook (material swell and load factors); Peurifoy & Schexnayder, Construction Planning, Equipment and Methods (swell, shrinkage, bank/loose/compacted)',
    'Earthworks and mass diagram lecture notes (Scribd, "Earthworks" ch. 5) — worked example 4 050.42 / 4 096.25 m³',
    'BS 6031:2009 Code of practice for earthworks; Specification for Highway Works Series 600 (bulking and compaction)',
  ],
  inputs: [
    { id: 'area1_m2', label: 'Cross-section area at station 1, A₁', group: 'area', unit: 'm2', default: 150.25, min: 0, max: 1e5 },
    { id: 'area2_m2', label: 'Cross-section area at station 2, A₂', group: 'area', unit: 'm2', default: 259.375, min: 0, max: 1e5 },
    { id: 'mid_mode', label: 'Mid-section area A_m (prismoidal)', type: 'select', default: 'given', options: [{ value: 'given', label: 'Measured mid-section area' }, { value: 'estimate', label: 'Estimate from A₁ and A₂ (similar sections)' }] },
    { id: 'area_mid_m2', label: 'Mid-section area A_m', group: 'area', unit: 'm2', default: 201.375, min: 0, max: 1e5, visibleWhen: { mid_mode: 'given' } },
    { id: 'length_m', label: 'Distance between the stations L', group: 'length', unit: 'm', default: 20, min: 0.1, max: 1000 },
    { id: 'count', label: 'Number of identical intervals (1 for a single pair of sections)', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 1000 },
    { id: 'operation', label: 'The volume is', type: 'select', default: 'cut', options: [{ value: 'cut', label: 'Cut (excavation): bank → loose for haul' }, { value: 'fill', label: 'Fill required (compacted): how much to excavate and haul' }] },
    { id: 'soil', label: 'Material', type: 'select', default: 'clay', options: Object.entries(SOILS).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'swell_custom', label: 'Custom swell (bank → loose)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.25, min: 0, max: 1, visibleWhen: { soil: 'custom' } },
    { id: 'shrink_custom', label: 'Custom shrinkage (bank → compacted; negative = bulking)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.1, min: -0.5, max: 0.5, visibleWhen: { soil: 'custom' } },
    { id: 'density_custom', label: 'Custom bank density', group: 'density', unit: 'kg_m3', default: 1800, min: 800, max: 3000, visibleWhen: { soil: 'custom' } },
    { id: 'truck_m3', label: 'Truck capacity (loose volume per load)', group: 'volume', unit: 'm3', default: 12, min: 0.1, max: 200 },
  ],
  outputs: [
    { id: 'mid_area_used_m2', label: 'Mid-section area used', group: 'area', unit: 'm2' },
    { id: 'volume_aea_m3', label: 'Average end area volume (all intervals, bank)', group: 'volume', unit: 'm3' },
    { id: 'volume_prismoidal_m3', label: 'Prismoidal volume (all intervals, bank)', group: 'volume', unit: 'm3' },
    { id: 'prismoidal_correction_m3', label: 'Prismoidal correction (AEA − prismoidal)', group: 'volume', unit: 'm3' },
    { id: 'correction_pct', label: 'Correction as share of the AEA volume', group: 'ratio', unit: 'pct' },
    { id: 'bank_m3', label: 'Bank volume to excavate', group: 'volume', unit: 'm3' },
    { id: 'loose_m3', label: 'Loose volume to haul', group: 'volume', unit: 'm3' },
    { id: 'compacted_m3', label: 'Compacted volume when placed', group: 'volume', unit: 'm3' },
    { id: 'swell_used', label: 'Swell factor used (loose/bank)', group: 'dimensionless', unit: 'none' },
    { id: 'shrinkage_used', label: 'Shrinkage factor used (compacted/bank)', group: 'dimensionless', unit: 'none' },
    { id: 'mass_t', label: 'Mass of the material', group: 'mass', unit: 't' },
    { id: 'loose_density_kg_m3', label: 'Loose density', group: 'density', unit: 'kg_m3' },
    { id: 'truck_loads', label: 'Truck loads (loose volume / truck capacity)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      volume_aea_m3: '4 096.25 m³',
      volume_prismoidal_m3: '4 050.42 m³',
      prismoidal_correction_m3: '45.8 m³',
      correction_pct: '1.1 %',
      bank_m3: '4 050.42 m³',
      loose_m3: '5 387 m³',
      compacted_m3: '3 645 m³',
      mass_t: '7 290 t',
    },
  },
};

/** Average end area volume. */
export function averageEndArea(a1, a2, L) {
  return (L * (a1 + a2)) / 2;
}

/** Prismoidal volume. */
export function prismoidal(a1, am, a2, L) {
  return (L * (a1 + 4 * am + a2)) / 6;
}

/** Mid-area estimate for similar sections. */
export function estimatedMidArea(a1, a2) {
  return ((Math.sqrt(a1) + Math.sqrt(a2)) / 2) ** 2;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertNonNegative(i.area1_m2, 'area1_m2', 'Area 1');
  assertNonNegative(i.area2_m2, 'area2_m2', 'Area 2');
  assertOneOf(i.mid_mode, ['given', 'estimate'], 'mid_mode', 'Mid-section mode');
  assertPositive(i.length_m, 'length_m', 'Length');
  assertRange(i.count, 1, 10000, 'count', 'Intervals');
  assertOneOf(i.operation, ['cut', 'fill'], 'operation', 'Operation');
  assertOneOf(i.soil, Object.keys(SOILS), 'soil', 'Material');
  assertPositive(i.truck_m3, 'truck_m3', 'Truck capacity');
  if (i.area1_m2 + i.area2_m2 <= 0) throw new Error('Both cross-section areas are zero');

  const soil = SOILS[i.soil];
  const swell = i.soil === 'custom' ? assertRange(i.swell_custom, 0, 2, 'swell_custom', 'Swell') : soil.swell;
  const shrink = i.soil === 'custom' ? assertRange(i.shrink_custom, -0.9, 0.9, 'shrink_custom', 'Shrinkage') : soil.shrink;
  const density = i.soil === 'custom' ? assertPositive(i.density_custom, 'density_custom', 'Density') : soil.density;
  const am = i.mid_mode === 'given' ? assertNonNegative(i.area_mid_m2, 'area_mid_m2', 'Mid-section area') : estimatedMidArea(i.area1_m2, i.area2_m2);
  const vAea = averageEndArea(i.area1_m2, i.area2_m2, i.length_m) * i.count;
  const vPrism = prismoidal(i.area1_m2, am, i.area2_m2, i.length_m) * i.count;
  const correction = vAea - vPrism;

  let bank;
  let loose;
  let compacted;
  if (i.operation === 'cut') {
    bank = vPrism;
    loose = bank * (1 + swell);
    compacted = bank * (1 - shrink);
  } else {
    compacted = vPrism;
    bank = compacted / (1 - shrink);
    loose = bank * (1 + swell);
  }
  const mass = (bank * density) / 1000;
  const looseDensity = density / (1 + swell);
  const loads = Math.ceil(loose / i.truck_m3);
  const summary = i.operation === 'cut'
    ? `Cut ${bank.toFixed(0)} m³ bank → haul ${loose.toFixed(0)} m³ loose (${loads} loads) → ${compacted.toFixed(0)} m³ if placed and compacted; ${mass.toFixed(0)} t`
    : `Fill ${compacted.toFixed(0)} m³ compacted needs ${bank.toFixed(0)} m³ bank excavation and ${loose.toFixed(0)} m³ loose haul (${loads} loads); ${mass.toFixed(0)} t`;

  const warnings = [];
  if (i.mid_mode === 'estimate') warnings.push('Mid-section area estimated from A₁ and A₂ assuming similar sections; survey the mid-section for payment quantities.');
  const ratio = Math.max(i.area1_m2, i.area2_m2) / Math.max(1e-9, Math.min(i.area1_m2, i.area2_m2));
  if (ratio > 2) warnings.push(`End areas differ by a factor ${ratio.toFixed(1)}: the average end area over-estimates (correction ${((correction / vAea) * 100).toFixed(1)} %); use the prismoidal volume or shorter intervals.`);
  if (i.soil !== 'custom') warnings.push(`Typical factors for ${soil.label.split(' (')[0].toLowerCase()} (swell ${(swell * 100).toFixed(0)} %, shrinkage ${(shrink * 100).toFixed(0)} %): project test data vary by ±30 %.`);
  if (shrink < 0) warnings.push('Negative shrinkage: blasted rock bulks when placed and never returns to bank volume.');
  warnings.push('Cut and fill between the same stations are separate calculations; curved alignments need the curvature (Pappus) correction; topsoil strip, over-break and unsuitable material are extra.');

  return {
    outputs: {
      mid_area_used_m2: am,
      volume_aea_m3: vAea,
      volume_prismoidal_m3: vPrism,
      prismoidal_correction_m3: correction,
      correction_pct: vAea > 0 ? (correction / vAea) * 100 : 0,
      bank_m3: bank,
      loose_m3: loose,
      compacted_m3: compacted,
      swell_used: 1 + swell,
      shrinkage_used: 1 - shrink,
      mass_t: mass,
      loose_density_kg_m3: looseDensity,
      truck_loads: loads,
      summary,
    },
    warnings,
  };
}
