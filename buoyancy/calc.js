/**
 * buoyancy/calc.js — Archimedes' principle: buoyant force on a body, net force and whether it floats, the draught of a
 * floating box, vertical cylinder or horizontal cylinder (pontoon tube), and the payload a raft or pontoon can carry
 * to a required freeboard, in fresh or sea water.
 *
 * F_B = ρ g V_submerged;  floats when m < ρ V.  Box: T = m / (ρ n L B).  Vertical cylinder: T = m / (ρ n π D²/4).
 * Horizontal cylinder: segment area A(h) = r² acos((r − h)/r) − (r − h) √(2 r h − h²), solved for ρ n L A(h) = m.
 * Payload to a freeboard f: ρ × (submerged volume at draught H − f) − own mass.  Schema units: m, m³, kg, kg/m³, N.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative, assertInteger } from '../shared/validate.js';

export const WATERS = {
  sea: { label: 'Sea water (1 025 kg/m³)', rho: 1025 },
  fresh: { label: 'Fresh water (1 000 kg/m³)', rho: 1000 },
  custom: { label: 'Other density' },
};

/** Submerged cross-section area of a horizontal circle of radius r immersed to depth h (0 ≤ h ≤ 2r). */
export function segmentArea(r, h) {
  if (h <= 0) return 0;
  if (h >= 2 * r) return Math.PI * r * r;
  return r * r * Math.acos((r - h) / r) - (r - h) * Math.sqrt(2 * r * h - h * h);
}

/** Draught of a horizontal cylinder of radius r carrying `area` m² of submerged section (bisection). */
export function cylinderDraft(r, area) {
  let lo = 0;
  let hi = 2 * r;
  for (let k = 0; k < 100; k += 1) {
    const mid = (lo + hi) / 2;
    if (segmentArea(r, mid) < area) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export const schema = {
  id: 'buoyancy',
  name: 'Buoyancy calculator (Archimedes)',
  category: 'maritime',
  summary: 'Buoyant force, net force and whether an object floats, the draft of a floating box or cylinder, and the load a pontoon or raft can carry.',
  related: ['block-coefficient', 'hydrostatic-pressure', 'hydrostatics', 'metal-weight'],
  assumptions: [
    'Archimedes\' principle: the upward force equals the weight of the water displaced, ρ g V. The body is rigid and watertight, and the water is still.',
    'Sea water is taken as 1 025 kg/m³ and fresh water as 1 000 kg/m³; brackish dock water lies in between and can be entered as another density.',
    'The floating body floats upright and level, with its weight shared equally by the floats. Stability against capsizing is not checked: a tall narrow float can be buoyant enough and still roll over.',
    'For a horizontal cylinder the end caps are ignored: the submerged volume is the segment area × length. Rounded or conical ends of real pontoons add a little volume.',
    'The payload is what the floats can support down to the required freeboard; a working margin is still needed for people moving about, waves and water shipped on deck.',
  ],
  notes: [
    'Verification 2026-11-08: two horizontal pontoon tubes 0.6 m in diameter and 6 m long (3.39 m³) carrying 1 500 kg in fresh water need 0.125 m² of submerged section each and float at 0.273 m draught; at 0.15 m freeboard (0.45 m immersion, segment 0.2275 m²) they carry 2 730 kg, 1 230 kg more. Checked by hand.',
  ],
  sources: [
    'Archimedes\' principle as stated in F.M. White, Fluid Mechanics, 8th ed. (McGraw-Hill, 2016), §2.8 Buoyancy and stability',
    'Derrett, D.R. and Barrass, C.B., Ship Stability for Masters and Mates, 7th ed. (2012), ch. 1–2: displacement, density and the draught of box-shaped vessels',
    'ITTC Recommended Procedure 7.5-02-01-03, Fresh water and seawater properties (2011): standard sea water of 35 g/kg is 1 026 kg/m³ at 15 °C and 1 025 kg/m³ at about 19 °C',
  ],
  inputs: [
    {
      id: 'shape', label: 'Body', type: 'select', default: 'hcyl',
      options: [
        { value: 'volume', label: 'Any shape: enter its volume' },
        { value: 'box', label: 'Box or rectangular pontoon' },
        { value: 'vcyl', label: 'Vertical cylinder (drum standing upright)' },
        { value: 'hcyl', label: 'Horizontal cylinder (pontoon tube, drum on its side)' },
      ],
    },
    { id: 'volume_m3', label: 'Volume of the body (each)', group: 'volume', unit: 'm3', default: 0.2, min: 1e-6, max: 1e6, visibleWhen: { shape: 'volume' } },
    { id: 'length_m', label: 'Length (each float)', group: 'length', unit: 'm', default: 6, min: 0.01, max: 500, visibleWhen: { shape: ['box', 'hcyl'] } },
    { id: 'width_m', label: 'Width (each box)', group: 'length', unit: 'm', default: 2, min: 0.01, max: 200, visibleWhen: { shape: 'box' } },
    { id: 'height_m', label: 'Height (each box or upright cylinder)', group: 'length', unit: 'm', default: 1, min: 0.01, max: 100, visibleWhen: { shape: ['box', 'vcyl'] } },
    { id: 'diameter_m', label: 'Diameter (each cylinder)', group: 'length', unit: 'm', default: 0.6, min: 0.01, max: 50, visibleWhen: { shape: ['vcyl', 'hcyl'] } },
    { id: 'count', label: 'Number of identical floats', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 1000, integer: true },
    { id: 'mass_kg', label: 'Total mass carried by the floats (floats, deck and load)', group: 'mass', unit: 'kg', default: 1500, min: 0, max: 1e9 },
    { id: 'water', label: 'Water', type: 'select', default: 'fresh', options: Object.entries(WATERS).map(([value, w]) => ({ value, label: w.label })) },
    { id: 'density_kg_m3', label: 'Water density', group: 'density', unit: 'kg_m3', default: 1012, min: 990, max: 1250, visibleWhen: { water: 'custom' } },
    { id: 'freeboard_m', label: 'Freeboard to keep for the payload limit', group: 'length', unit: 'm', default: 0.15, min: 0, max: 50, visibleWhen: { shape: ['box', 'vcyl', 'hcyl'] } },
  ],
  outputs: [
    { id: 'total_volume_m3', label: 'Total volume of the floats', group: 'volume', unit: 'm3' },
    { id: 'max_buoyancy_n', label: 'Buoyant force fully submerged ρ g V', group: 'force', unit: 'N', display: 'kN' },
    { id: 'weight_n', label: 'Weight of the mass carried', group: 'force', unit: 'N', display: 'kN' },
    { id: 'net_n', label: 'Net upward force when fully submerged (+ floats)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'floats', label: 'Does it float?', type: 'text' },
    { id: 'submerged_frac', label: 'Share of the volume under water', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'draft_m', label: 'Draught (depth of immersion)', group: 'length', unit: 'm', decimals: 3 },
    { id: 'freeboard_out_m', label: 'Freeboard (height above the water)', group: 'length', unit: 'm', decimals: 3 },
    { id: 'capacity_kg', label: 'Total mass the floats can carry at the required freeboard', group: 'mass', unit: 'kg' },
    { id: 'spare_kg', label: 'Extra payload beyond the present mass', group: 'mass', unit: 'kg' },
  ],
  example: {
    inputs: { shape: 'hcyl', length_m: [6, 'm'], diameter_m: [0.6, 'm'], count: 2, mass_kg: [1500, 'kg'], water: 'fresh', freeboard_m: [0.15, 'm'] },
    results: { total_volume_m3: '3.39 m³', draft_m: '0.273 m', capacity_kg: '2 730 kg', spare_kg: '1 230 kg' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.shape, ['volume', 'box', 'vcyl', 'hcyl'], 'shape', 'Body');
  assertOneOf(x.water, Object.keys(WATERS), 'water', 'Water');
  const n = assertInteger(assertRange(x.count, 1, 1000, 'count', 'Number of floats'), 'count', 'Number of floats');
  const m = assertNonNegative(x.mass_kg, 'mass_kg', 'Total mass');
  const rho = x.water === 'custom' ? assertRange(x.density_kg_m3, 990, 1250, 'density_kg_m3', 'Water density') : WATERS[x.water].rho;
  const g = GRAVITY_M_S2;
  let each;
  let height = null;
  let draftFor = null; // function: mass per float → draught
  let volumeAt = null; // function: draught → submerged volume per float
  if (x.shape === 'volume') {
    each = assertPositive(x.volume_m3, 'volume_m3', 'Volume of the body');
  } else if (x.shape === 'box') {
    const L = assertPositive(x.length_m, 'length_m', 'Length');
    const B = assertPositive(x.width_m, 'width_m', 'Width');
    height = assertPositive(x.height_m, 'height_m', 'Height');
    each = L * B * height;
    draftFor = (mf) => mf / (rho * L * B);
    volumeAt = (t) => L * B * t;
  } else if (x.shape === 'vcyl') {
    const D = assertPositive(x.diameter_m, 'diameter_m', 'Diameter');
    height = assertPositive(x.height_m, 'height_m', 'Height');
    const A = (Math.PI * D * D) / 4;
    each = A * height;
    draftFor = (mf) => mf / (rho * A);
    volumeAt = (t) => A * t;
  } else {
    const L = assertPositive(x.length_m, 'length_m', 'Length');
    const D = assertPositive(x.diameter_m, 'diameter_m', 'Diameter');
    height = D;
    each = (Math.PI * D * D * L) / 4;
    draftFor = (mf) => cylinderDraft(D / 2, mf / (rho * L));
    volumeAt = (t) => segmentArea(D / 2, t) * L;
  }
  const V = each * n;
  const Fb = rho * g * V;
  const W = m * g;
  const floats = m < rho * V;
  const frac = floats ? m / (rho * V) : 1;
  let draft = null;
  let freeboard = null;
  let capacity = null;
  const warnings = [];
  if (draftFor) {
    if (floats) {
      draft = draftFor(m / n);
      freeboard = height - draft;
    }
    const fb = assertNonNegative(x.freeboard_m, 'freeboard_m', 'Freeboard to keep');
    if (fb >= height) throw new Error('Freeboard to keep: it must be less than the height (or diameter) of the float.');
    capacity = rho * volumeAt(height - fb) * n;
    if (floats && freeboard < fb) warnings.push('The freeboard is below the value you asked for: the floats are overloaded for that margin.');
  } else {
    capacity = rho * V;
  }
  if (!floats) warnings.push('The mass is more than the water the body can displace: it sinks unless more buoyancy is added.');
  return {
    outputs: {
      total_volume_m3: V,
      max_buoyancy_n: Fb,
      weight_n: W,
      net_n: Fb - W,
      floats: floats
        ? `Floats, with ${(100 * frac).toFixed(1)} % of its volume under water`
        : `Sinks: it needs ${((m / rho - V)).toFixed(3)} m³ more buoyant volume`,
      submerged_frac: frac,
      draft_m: draft,
      freeboard_out_m: freeboard,
      capacity_kg: capacity,
      spare_kg: capacity - m,
    },
    warnings,
  };
}
