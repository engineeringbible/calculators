/**
 * hydrostatics/calc.js — displacement, TPC, fresh/dock water allowance and trim from first principles.
 *
 * Schema units: lengths m, density t/m³, MCTC t·m/cm, outputs in m, m², m³, t, t/cm, mm, cm, t·m.
 * Longitudinal positions are measured from the aft perpendicular (AP), positive forward.
 * Trim sign convention: positive = by the stern, negative = by the head.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

const CM_PER_M = 100;
/** Barrass's empirical constant: MCTC ≈ 7.31 × TPC² / B for merchant hull forms in salt water. */
const BARRASS_MCTC_CONSTANT = 7.31;
/** Standard sea-water density used in the fresh-water allowance definition, t/m³. */
const SEA_WATER_DENSITY_T_M3 = 1.025;

export const schema = {
  id: 'hydrostatics',
  name: 'Hydrostatics basics',
  category: 'maritime',
  summary: 'Displacement from draft and block coefficient, TPC, fresh and dock water allowance, trim and end drafts from LCG, LCB and MCTC.',
  related: ['draft-survey', 'initial-stability', 'ship-squat', 'fuel-voyage-cost'],
  notes: [
    'Verification 2026-10-30: the FWA formula Δ/(4 TPC) was cross-checked independently against the volume change from 1.025 to 1.000 t/m³ on a box barge (125 mm both ways).',
    'Design decision: longitudinal positions are from the aft perpendicular, positive forward, and trim is positive by the stern, to match the way hydrostatic tables are printed; the draft-survey calculator uses LCF from midships instead because surveys do.',
    "Provenance: Barrass's MCTC ≈ 7.31 TPC²/B is quoted from Ship Design and Performance for Masters and Mates (2004) and kept only as a labelled estimate.",
  ],
  assumptions: [
    'C_B and C_W are the coefficients at the draft entered, not design values; both fall as the draft decreases, so summer-load values at ballast draft overstate displacement.',
    'Longitudinal positions are measured from the aft perpendicular, positive forward; trim is positive by the stern, negative by the head.',
    'The fresh water allowance assumes sea water of 1.025 t/m³ and a constant TPC over the small draft change (Load Line convention), with DWA scaled linearly to the dock density.',
    'Trim is treated as small: TPC, MCTC and LCF are constant and the draft at the LCF is unchanged by the trim; above about 1 % of the length use the hydrostatic tables iteratively.',
    "Barrass's MCTC ≈ 7.31 × TPC² / B is an order-of-magnitude estimate (±15 % or worse) for merchant forms in salt water and must not be used for a real loading condition.",
    'All drafts are moulded; add keel thickness for extreme drafts and apply hog/sag corrections separately.',
  ],
  sources: [
    'Derrett & Barrass, Ship Stability for Masters and Mates, 7th ed. (2012), ch. 2 form coefficients, ch. 9 TPC, ch. 10 FWA/DWA, ch. 15 trim',
    'C.B. Barrass, Ship Design and Performance for Masters and Mates (2004), MCTC approximation',
  ],
  inputs: [
    { id: 'lbp_m', label: 'Length between perpendiculars L', group: 'length', unit: 'm', default: 180, min: 1, max: 500 },
    { id: 'beam_m', label: 'Moulded breadth B', group: 'length', unit: 'm', default: 32, min: 0.5, max: 80 },
    { id: 'draft_m', label: 'Draft at the LCF (even-keel mean draft)', group: 'length', unit: 'm', default: 10, min: 0.01, max: 40 },
    { id: 'cb', label: 'Block coefficient C_B', group: 'dimensionless', unit: 'none', default: 0.80, min: 0.3, max: 1.0, help: 'Underwater volume ÷ (L × B × T) at this draft.' },
    { id: 'cw', label: 'Waterplane coefficient C_W', group: 'dimensionless', unit: 'none', default: 0.88, min: 0.3, max: 1.0, help: 'Waterplane area ÷ (L × B). Roughly (1 + 2 C_B) / 3 if unknown.' },
    { id: 'rho_t_m3', label: 'Water density', group: 'density', unit: 't_m3', default: 1.025, min: 0.9, max: 1.1, help: 'Sea water 1.025, fresh water 1.000.' },
    { id: 'lcb_m', label: 'LCB from AP (+ forward)', group: 'length', unit: 'm', default: 92, min: 0, max: 500 },
    { id: 'lcg_m', label: 'LCG from AP (+ forward)', group: 'length', unit: 'm', default: 91, min: 0, max: 500 },
    { id: 'lcf_m', label: 'LCF from AP (+ forward)', group: 'length', unit: 'm', default: 88, min: 0, max: 500 },
    {
      id: 'mctc_source',
      label: 'Moment to change trim 1 cm (MCTC)',
      type: 'select',
      default: 'given',
      options: [
        { value: 'given', label: 'From hydrostatic tables (enter below)' },
        { value: 'estimate', label: 'Estimate: Barrass 7.31 × TPC² / B' },
      ],
    },
    { id: 'mctc_t_m_cm', label: 'MCTC at this draft', group: 'mctc', unit: 't_m_cm', default: 450, min: 0.01, max: 5000, visibleWhen: { mctc_source: 'given' } },
    { id: 'dock_rho_t_m3', label: 'Dock water density (for the DWA)', group: 'density', unit: 't_m3', default: 1.010, min: 0.99, max: 1.03 },
  ],
  outputs: [
    { id: 'volume_m3', label: 'Underwater volume ∇ = L × B × T × C_B', group: 'volume', unit: 'm3' },
    { id: 'displacement_t', label: 'Displacement Δ = ∇ × ρ', group: 'mass', unit: 't' },
    { id: 'wpa_m2', label: 'Waterplane area A_W = L × B × C_W', group: 'area', unit: 'm2' },
    { id: 'tpc_t_cm', label: 'Tonnes per centimetre immersion (TPC)', group: 'tpc', unit: 't_cm' },
    { id: 'fwa_mm', label: 'Fresh water allowance (FWA)', group: 'length', unit: 'mm' },
    { id: 'dwa_mm', label: 'Dock water allowance (DWA)', group: 'length', unit: 'mm' },
    { id: 'mctc_used', label: 'MCTC used', group: 'mctc', unit: 't_m_cm' },
    { id: 'trimming_moment_t_m', label: 'Trimming moment Δ × (LCB − LCG), + by stern', group: 'mass_moment', unit: 't_m' },
    { id: 'trim_cm', label: 'Trim (+ by stern, − by head)', group: 'length', unit: 'cm' },
    { id: 'trim_text', label: 'Trim', type: 'text' },
    { id: 'draft_aft_m', label: 'Draft aft', group: 'length', unit: 'm' },
    { id: 'draft_fwd_m', label: 'Draft forward', group: 'length', unit: 'm' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      lbp_m: [100, 'm'],
      beam_m: [16, 'm'],
      draft_m: [5, 'm'],
      cb: 1,
      cw: 1,
      rho_t_m3: [1, 't_m3'],
      lcb_m: [50, 'm'],
      lcg_m: [49, 'm'],
      lcf_m: [50, 'm'],
      mctc_source: 'given',
      mctc_t_m_cm: [100, 't_m_cm'],
    },
    results: {
      volume_m3: '8 000 m³',
      displacement_t: '8 000 t',
      wpa_m2: '1 600 m²',
      tpc_t_cm: '16.0 t/cm',
      trimming_moment_t_m: '8 000 t·m',
      trim_cm: '80 cm',
      draft_aft_m: '5.40 m',
      draft_fwd_m: '4.60 m',
    },
  },
};

/** TPC in t/cm from waterplane area (m²) and density (t/m³). */
export function tonnesPerCentimetre(waterplaneAreaM2, densityTM3) {
  return (waterplaneAreaM2 * densityTM3) / CM_PER_M;
}

/** Fresh water allowance in mm from displacement (t) and TPC in salt water (t/cm). */
export function freshWaterAllowanceMm(displacementT, tpcSaltWater) {
  return displacementT / (4 * tpcSaltWater);
}

/** Dock water allowance in mm: FWA scaled by how far the dock density is from 1.025 towards 1.000. */
export function dockWaterAllowanceMm(fwaMm, dockDensityTM3) {
  return (fwaMm * (SEA_WATER_DENSITY_T_M3 - dockDensityTM3) * 1000) / 25;
}

/** Barrass's approximation of MCTC (t·m/cm) from TPC (t/cm) and breadth (m). */
export function estimateMctcBarrass(tpc, beamM) {
  return (BARRASS_MCTC_CONSTANT * tpc * tpc) / beamM;
}

function describeTrim(trimCm) {
  if (Math.abs(trimCm) < 0.05) return 'Even keel';
  return `${Math.abs(trimCm).toFixed(1)} cm by the ${trimCm > 0 ? 'stern' : 'head'}`;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.lbp_m, 'lbp_m', 'Length between perpendiculars');
  assertPositive(i.beam_m, 'beam_m', 'Breadth');
  assertPositive(i.draft_m, 'draft_m', 'Draft');
  assertRange(i.cb, 0.1, 1.0, 'cb', 'Block coefficient');
  assertRange(i.cw, 0.1, 1.0, 'cw', 'Waterplane coefficient');
  assertPositive(i.rho_t_m3, 'rho_t_m3', 'Water density');
  assertRange(i.lcb_m, 0, i.lbp_m, 'lcb_m', 'LCB from AP');
  assertRange(i.lcg_m, 0, i.lbp_m, 'lcg_m', 'LCG from AP');
  assertRange(i.lcf_m, 0, i.lbp_m, 'lcf_m', 'LCF from AP');
  assertOneOf(i.mctc_source, ['given', 'estimate'], 'mctc_source', 'MCTC source');
  assertPositive(i.dock_rho_t_m3, 'dock_rho_t_m3', 'Dock water density');

  const volume = i.lbp_m * i.beam_m * i.draft_m * i.cb;
  const displacement = volume * i.rho_t_m3;
  const wpa = i.lbp_m * i.beam_m * i.cw;
  const tpc = tonnesPerCentimetre(wpa, i.rho_t_m3);
  const tpcSaltWater = tonnesPerCentimetre(wpa, SEA_WATER_DENSITY_T_M3);
  const fwa = freshWaterAllowanceMm(displacement, tpcSaltWater);
  const dwa = dockWaterAllowanceMm(fwa, i.dock_rho_t_m3);

  let mctc;
  if (i.mctc_source === 'given') {
    assertPositive(i.mctc_t_m_cm, 'mctc_t_m_cm', 'MCTC');
    mctc = i.mctc_t_m_cm;
  } else {
    mctc = estimateMctcBarrass(tpc, i.beam_m);
  }

  const trimmingMoment = displacement * (i.lcb_m - i.lcg_m);
  const trimCm = trimmingMoment / mctc;
  const trimM = trimCm / CM_PER_M;
  const draftAft = i.draft_m + (trimM * i.lcf_m) / i.lbp_m;
  const draftFwd = i.draft_m - (trimM * (i.lbp_m - i.lcf_m)) / i.lbp_m;

  const warnings = [];
  if (i.cb < 0.45 || i.cb > 0.9) warnings.push('Block coefficient outside 0.45–0.90 is unusual for a displacement ship — check the value.');
  if (i.cw < i.cb) warnings.push('Waterplane coefficient is below the block coefficient, which no normal hull form has — check both values.');
  if (i.mctc_source === 'estimate') warnings.push('MCTC is Barrass\'s rough estimate (±15 % or worse). Use the hydrostatic tables for any real trim calculation.');
  if (Math.abs(trimCm) > i.lbp_m) warnings.push('Trim exceeds 1 % of the ship length; the linear trim formulas lose accuracy and LCF moves — recheck LCG and MCTC.');
  if (draftFwd < 0 || draftAft < 0) warnings.push('An end draft is negative: the combination of draft and trim is not physical.');
  if (i.cw < (1 + 2 * i.cb) / 3 - 0.1) warnings.push('C_W is well below the usual (1 + 2 C_B) / 3 relation for merchant hulls — TPC may be underestimated.');

  return {
    outputs: {
      volume_m3: volume,
      displacement_t: displacement,
      wpa_m2: wpa,
      tpc_t_cm: tpc,
      fwa_mm: fwa,
      dwa_mm: dwa,
      mctc_used: mctc,
      trimming_moment_t_m: trimmingMoment,
      trim_cm: trimCm,
      trim_text: describeTrim(trimCm),
      draft_aft_m: draftAft,
      draft_fwd_m: draftFwd,
    },
    warnings,
  };
}
