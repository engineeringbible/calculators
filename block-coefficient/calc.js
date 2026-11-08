/**
 * block-coefficient/calc.js — hull form coefficients from the main dimensions: block C_B, midship C_M, prismatic C_P,
 * waterplane C_WP and vertical prismatic C_VP, and the displacement in salt and fresh water.
 *
 * C_B = ∇ / (L B T);  C_M = A_M / (B T);  C_P = ∇ / (A_M L) = C_B / C_M;  C_WP = A_WP / (L B);  C_VP = ∇ / (A_WP T) = C_B / C_WP.
 * Δ = C_B L B T ρ.  Schema units: m, m², m³, kg, kg/m³.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

/** Standard densities used in hydrostatics, kg/m³. */
export const SALT_WATER = 1025;
export const FRESH_WATER = 1000;

export const schema = {
  id: 'block-coefficient',
  name: 'Block coefficient and hull form coefficients',
  category: 'maritime',
  summary: 'Block, midship, prismatic and waterplane coefficients of a hull from its dimensions, and the displacement Δ = C_B L B T ρ in salt or fresh water.',
  related: ['hydrostatics', 'buoyancy', 'trim-change', 'shallow-water-speed'],
  assumptions: [
    'L, B and T are the length, breadth and draught at the waterline of the condition considered (for ships usually L_PP, moulded breadth and moulded draught). Coefficients from different length definitions are not comparable.',
    'The coefficients describe the underwater hull at that draught; they fall as the draught decreases, so design values do not apply at ballast draught.',
    'The displacement volume ∇ is moulded (inside the shell plating, without appendages). The displacement of the shell plating and appendages (rudder, propeller, bilge keels) comes on top.',
    'Salt water is taken as 1.025 t/m³ and fresh water as 1.000 t/m³, the values of the load line rules; other densities can be entered.',
  ],
  notes: [
    'Verification 2026-11-08: a hull 100 m × 16 m × 6 m with ∇ = 7 200 m³, A_M = 92 m² and A_WP = 1 300 m² has C_B = 0.750, C_M = 0.958, C_P = 0.783, C_WP = 0.813, C_VP = 0.923 and displaces 7 380 t in salt water and 7 200 t in fresh water. Checked by hand.',
  ],
  sources: [
    'Derrett, D.R. and Barrass, C.B., Ship Stability for Masters and Mates, 7th ed. (Butterworth-Heinemann, 2012), ch. 2: form coefficients C_B, C_M, C_P, C_W',
    'Lewis, E.V. (ed.), Principles of Naval Architecture, 2nd rev. (SNAME, 1988), Vol. I ch. 1: hull form coefficients',
    'International Convention on Load Lines 1966, Annex I: sea water density 1.025 t/m³ for the fresh water allowance',
    'MAN Energy Solutions, Basic Principles of Ship Propulsion (2018): examples of block coefficients by ship type',
  ],
  inputs: [
    { id: 'length_m', label: 'Length L (between perpendiculars or on the waterline)', group: 'length', unit: 'm', default: 100, min: 0.5, max: 500 },
    { id: 'beam_m', label: 'Breadth B (moulded, at the waterline)', group: 'length', unit: 'm', default: 16, min: 0.1, max: 100 },
    { id: 'draft_m', label: 'Draught T (moulded)', group: 'length', unit: 'm', default: 6, min: 0.01, max: 40 },
    {
      id: 'basis', label: 'Underwater volume given as', type: 'select', default: 'volume',
      options: [
        { value: 'volume', label: 'Displacement volume ∇' },
        { value: 'mass', label: 'Displacement Δ (mass) and water density' },
        { value: 'cb', label: 'Block coefficient C_B (to find ∇ and Δ)' },
      ],
    },
    { id: 'volume_m3', label: 'Displacement volume ∇', group: 'volume', unit: 'm3', default: 7200, min: 0.001, max: 2e6, visibleWhen: { basis: 'volume' } },
    { id: 'mass_kg', label: 'Displacement Δ', group: 'mass', unit: 'kg', display: 't', default: 7380000, min: 1, max: 2e9, visibleWhen: { basis: 'mass' } },
    { id: 'density_kg_m3', label: 'Density of the water for Δ', group: 'density', unit: 'kg_m3', display: 't_m3', default: 1025, min: 990, max: 1050, visibleWhen: { basis: 'mass' } },
    { id: 'cb_in', label: 'Block coefficient C_B', group: 'dimensionless', unit: 'none', default: 0.75, min: 0.2, max: 1, visibleWhen: { basis: 'cb' } },
    { id: 'midship_area_m2', label: 'Midship section area A_M below the waterline (0 = unknown)', group: 'area', unit: 'm2', default: 92, min: 0, max: 5000 },
    { id: 'waterplane_area_m2', label: 'Waterplane area A_WP (0 = unknown)', group: 'area', unit: 'm2', default: 1300, min: 0, max: 50000 },
  ],
  outputs: [
    { id: 'volume_out_m3', label: 'Displacement volume ∇', group: 'volume', unit: 'm3' },
    { id: 'cb', label: 'Block coefficient C_B = ∇ / (L B T)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'cm', label: 'Midship coefficient C_M = A_M / (B T)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'cp', label: 'Prismatic coefficient C_P = C_B / C_M', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'cwp', label: 'Waterplane coefficient C_WP = A_WP / (L B)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'cvp', label: 'Vertical prismatic coefficient C_VP = C_B / C_WP', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'disp_salt_kg', label: 'Displacement in salt water (1.025 t/m³)', group: 'mass', unit: 'kg', display: 't' },
    { id: 'disp_fresh_kg', label: 'Displacement in fresh water (1.000 t/m³)', group: 'mass', unit: 'kg', display: 't' },
    { id: 'tpc_salt', label: 'TPC in salt water (from A_WP)', group: 'tpc', unit: 't_cm' },
    { id: 'hull_type', label: 'Typical hull with this C_B', type: 'text' },
  ],
  example: {
    inputs: { length_m: [100, 'm'], beam_m: [16, 'm'], draft_m: [6, 'm'], basis: 'volume', volume_m3: [7200, 'm3'], midship_area_m2: [92, 'm2'], waterplane_area_m2: [1300, 'm2'] },
    results: { cb: '0.750', cm: '0.958', cp: '0.783', cwp: '0.813', cvp: '0.923', disp_salt_kg: '7 380 t', disp_fresh_kg: '7 200 t' },
  },
};

/** Rough guide to the hull type from C_B (MAN, Basic Principles of Ship Propulsion: examples of block coefficients). */
function hullType(cb) {
  if (cb < 0.5) return 'Finer than merchant ships: yachts, fast craft and warships';
  if (cb < 0.7) return 'Container ships and ferries (0.50 to 0.70) or finer general cargo ships';
  if (cb < 0.8) return 'General cargo ships (0.55 to 0.75) up to the finer tankers and bulk carriers';
  if (cb < 0.9) return 'Tankers and bulk carriers (0.80 to 0.85)';
  return 'Barges and lighters (about 0.90) or box-shaped pontoons';
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.basis, ['volume', 'mass', 'cb'], 'basis', 'Underwater volume given as');
  const L = assertPositive(x.length_m, 'length_m', 'Length L');
  const B = assertPositive(x.beam_m, 'beam_m', 'Breadth B');
  const T = assertPositive(x.draft_m, 'draft_m', 'Draught T');
  const am = assertNonNegative(x.midship_area_m2, 'midship_area_m2', 'Midship section area');
  const aw = assertNonNegative(x.waterplane_area_m2, 'waterplane_area_m2', 'Waterplane area');
  const box = L * B * T;
  let vol;
  if (x.basis === 'volume') vol = assertPositive(x.volume_m3, 'volume_m3', 'Displacement volume');
  else if (x.basis === 'mass') vol = assertPositive(x.mass_kg, 'mass_kg', 'Displacement') / assertRange(x.density_kg_m3, 990, 1050, 'density_kg_m3', 'Density of the water');
  else vol = assertRange(x.cb_in, 0.2, 1, 'cb_in', 'Block coefficient') * box;
  const cb = vol / box;
  if (cb > 1 + 1e-9) throw new Error('Displacement volume: it is larger than L × B × T, so the block coefficient would exceed 1. Check the dimensions and the volume.');
  if (am > B * T * (1 + 1e-9)) throw new Error('Midship section area: it is larger than B × T, which no hull section can be.');
  if (aw > L * B * (1 + 1e-9)) throw new Error('Waterplane area: it is larger than L × B, which no waterplane can be.');
  const cm = am > 0 ? am / (B * T) : null;
  const cwp = aw > 0 ? aw / (L * B) : null;
  const cp = cm ? cb / cm : null;
  const cvp = cwp ? cb / cwp : null;
  const warnings = [];
  if (cp !== null && cp > 1 + 1e-9) warnings.push('C_P is above 1: the volume exceeds the midship section × length. Check A_M and ∇.');
  if (cvp !== null && cvp > 1 + 1e-9) warnings.push('C_VP is above 1 (C_B larger than C_WP): no normal hull has this. Check A_WP and ∇.');
  if (cb < 0.3) warnings.push('C_B below 0.3 is unusually fine even for a planing hull: check the units of the volume and dimensions.');
  return {
    outputs: {
      volume_out_m3: vol,
      cb,
      cm,
      cp,
      cwp,
      cvp,
      disp_salt_kg: vol * SALT_WATER,
      disp_fresh_kg: vol * FRESH_WATER,
      tpc_salt: aw > 0 ? (aw * (SALT_WATER / 1000)) / 100 : null,
      hull_type: hullType(cb),
    },
    warnings,
  };
}
