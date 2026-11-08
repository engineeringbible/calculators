/**
 * ship-tonnage/calc.js — gross and net tonnage by the International Convention on Tonnage Measurement of Ships 1969
 * (ITC 69), Annex I regulations 3 and 4.
 *
 * GT = K1 V,  K1 = 0.2 + 0.02 log10 V.
 * NT = K2 Vc (4d / 3D)² + K3 (N1 + N2 / 10),  K2 = 0.2 + 0.02 log10 Vc,  K3 = 1.25 (GT + 10 000) / 10 000,
 * with (4d/3D)² ≤ 1, K2 Vc (4d/3D)² ≥ 0.25 GT, NT ≥ 0.30 GT, and N1 = N2 = 0 when N1 + N2 < 13.
 * Schema units: m³, m, persons. GT and NT are dimensionless.
 */
import { withDefaults, assertPositive, assertNonNegative, assertInteger, assertRange } from '../shared/validate.js';

/** K1 or K2 of regulations 3 and 4 (Appendix 2 tabulates the same function). */
export function kCoefficient(volume) {
  return 0.2 + 0.02 * Math.log10(volume);
}

export const schema = {
  id: 'ship-tonnage',
  name: 'Gross and net tonnage calculator (ITC 1969)',
  category: 'maritime',
  summary: 'Gross tonnage GT = K1 V and net tonnage NT by the 1969 Tonnage Convention (Annex I, regulations 3 and 4), with the convention\'s limits applied.',
  related: ['block-coefficient', 'hydrostatics', 'cii-rating', 'loading-condition'],
  assumptions: [
    'V is the total moulded volume of all enclosed spaces (hull and superstructures) and Vc the volume of the cargo spaces, both in cubic metres and measured as regulation 6 requires. Their measurement is the work of the Administration or a recognised organisation; this page applies the formulas only.',
    'K1 and K2 use the formula 0.2 + 0.02 log10 V. Appendix 2 of the convention tabulates the same function and permits linear interpolation between its rows, which can differ from the formula in the fourth decimal.',
    'D is the moulded depth amidships (regulation 2(2)) and d the moulded draught of regulation 4(2): the summer load line draught for cargo ships, the deepest subdivision load line for passenger ships, and 75 % of D for ships without either.',
    'The limits of regulation 4(1) are applied: (4d/3D)² not more than 1, the cargo term not less than 0.25 GT, NT not less than 0.30 GT, and passengers counted only when there are 13 or more.',
    'Results are shown to the nearest whole number; the tonnage certificate states whole numbers as the Administration determines them.',
  ],
  notes: [
    'Verification 2026-11-08: V = 30 000 m³ gives K1 = 0.28954 and GT = 8 686.3; Vc = 16 000 m³ with d = 8.5 m and D = 12 m gives K2 = 0.28408, (4d/3D)² = 0.8920 and NT = 4 054.3. Appendix 2 values K1 = 0.22 at 10 m³ and 0.32 at 1 000 000 m³ are reproduced. Checked by hand.',
  ],
  sources: [
    'International Convention on Tonnage Measurement of Ships, 1969 (IMO), Annex I, regulation 3 (gross tonnage) and regulation 4 (net tonnage)',
    'ITC 1969, Annex I, regulation 2 (moulded depth) and Appendix 2 (coefficients K1 and K2, linear interpolation)',
    'UK Merchant Shipping (Tonnage) Regulations 1997 (SI 1997/1510), Part II: the convention formulas as enacted in national law',
  ],
  inputs: [
    { id: 'v_m3', label: 'Total volume of all enclosed spaces V', group: 'volume', unit: 'm3', default: 30000, min: 1, max: 1e7 },
    { id: 'vc_m3', label: 'Total volume of cargo spaces Vc', group: 'volume', unit: 'm3', default: 16000, min: 0, max: 1e7 },
    { id: 'depth_m', label: 'Moulded depth amidships D', group: 'length', unit: 'm', default: 12, min: 0.5, max: 60 },
    { id: 'draft_m', label: 'Moulded draught d (regulation 4(2))', group: 'length', unit: 'm', default: 8.5, min: 0.1, max: 40 },
    { id: 'n1', label: 'Passengers in cabins of not more than 8 berths N1', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 20000, integer: true },
    { id: 'n2', label: 'Other passengers N2', group: 'dimensionless', unit: 'none', default: 0, min: 0, max: 20000, integer: true },
  ],
  outputs: [
    { id: 'k1', label: 'K1 = 0.2 + 0.02 log10 V', group: 'dimensionless', unit: 'none', decimals: 5 },
    { id: 'gt', label: 'Gross tonnage GT', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'k2', label: 'K2 = 0.2 + 0.02 log10 Vc', group: 'dimensionless', unit: 'none', decimals: 5 },
    { id: 'draft_factor', label: '(4d / 3D)², at most 1', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'cargo_term', label: 'Cargo term K2 Vc (4d/3D)², at least 0.25 GT', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'k3', label: 'K3 = 1.25 (GT + 10 000) / 10 000', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'passenger_term', label: 'Passenger term K3 (N1 + N2/10)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'nt', label: 'Net tonnage NT', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'nt_gt', label: 'NT / GT', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'limits', label: 'Limits of regulation 4(1) applied', type: 'text' },
  ],
  example: {
    inputs: { v_m3: [30000, 'm3'], vc_m3: [16000, 'm3'], depth_m: [12, 'm'], draft_m: [8.5, 'm'], n1: 0, n2: 0 },
    results: { k1: '0.28954', gt: '8 686', k2: '0.28408', draft_factor: '0.8920', nt: '4 054' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const V = assertPositive(x.v_m3, 'v_m3', 'Total volume V');
  const Vc = assertNonNegative(x.vc_m3, 'vc_m3', 'Cargo space volume Vc');
  const D = assertPositive(x.depth_m, 'depth_m', 'Moulded depth D');
  const d = assertPositive(x.draft_m, 'draft_m', 'Moulded draught d');
  const n1 = assertInteger(assertRange(x.n1, 0, 20000, 'n1', 'Passengers N1'), 'n1', 'Passengers N1');
  const n2 = assertInteger(assertRange(x.n2, 0, 20000, 'n2', 'Passengers N2'), 'n2', 'Passengers N2');
  if (Vc > V) throw new Error('Cargo space volume Vc: it cannot exceed the total enclosed volume V.');
  if (V < 10) throw new Error('Total volume V: the convention\'s coefficient table starts at 10 m³; a space this small has no meaningful tonnage.');
  const k1 = kCoefficient(V);
  const gt = k1 * V;
  const limits = [];
  let factor = ((4 * d) / (3 * D)) ** 2;
  if (factor > 1) { factor = 1; limits.push('(4d/3D)² taken as 1'); }
  const k2 = Vc > 0 ? kCoefficient(Vc) : 0;
  let cargo = Vc > 0 ? k2 * Vc * factor : 0;
  if (cargo < 0.25 * gt) { cargo = 0.25 * gt; limits.push('cargo term raised to 0.25 GT'); }
  const counted = n1 + n2 >= 13;
  if (!counted && n1 + n2 > 0) limits.push('fewer than 13 passengers, so N1 and N2 taken as zero');
  const k3 = (1.25 * (gt + 10000)) / 10000;
  const pax = counted ? k3 * (n1 + n2 / 10) : 0;
  let nt = cargo + pax;
  if (nt < 0.3 * gt) { nt = 0.3 * gt; limits.push('NT raised to 0.30 GT'); }
  const warnings = [];
  if (d > D) warnings.push('The draught is greater than the moulded depth: check d and D.');
  return {
    outputs: {
      k1,
      gt,
      k2: Vc > 0 ? k2 : null,
      draft_factor: factor,
      cargo_term: cargo,
      k3,
      passenger_term: pax,
      nt,
      nt_gt: nt / gt,
      limits: limits.length ? limits.join('; ') : 'None: the formula values stand',
    },
    warnings,
  };
}
