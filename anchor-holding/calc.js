/**
 * anchor-holding/calc.js — holding capacity of a drag-embedment anchor from its mass and type (efficiency = holding
 * capacity / anchor weight, by anchor class from the Vryhof Anchor Manual), and the anchor mass needed for a design
 * force with a safety factor.
 *
 * Linear: H = η W.  Size-scaled (Vryhof UHC = A W^0.92): H = η W_ref (W / W_ref)^0.92 with W_ref = 10 t, the size at
 * which the class efficiencies are quoted.  Required mass: W = F SF / (η g), or W = W_ref (F SF / (η W_ref g))^(1/0.92).
 * Schema units: kg, N.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertOneOf, assertRange } from '../shared/validate.js';

/** Vryhof Anchor Manual (2000), "Characteristics of anchor types": efficiency ranges indicated for a 10 t anchor. */
export const CLASSES = {
  A: { label: 'Class A: Stevpris, Stevshark, FFTS (slender, ultra-penetrating), η 33–55', lo: 33, hi: 55 },
  B: { label: 'Class B: Bruce SS, Bruce TS, Hook (elbowed shank), η 17–25', lo: 17, hi: 25 },
  C: { label: 'Class C: Stevin, Stevfix, Stevmud, Flipper Delta, η 14–26', lo: 14, hi: 26 },
  D: { label: 'Class D: Danforth, LWT, Moorfast, Stato, Offdrill, Boss, η 8–15', lo: 8, hi: 15 },
  E: { label: 'Class E: AC14, Stokes, Snugstow, Weldhold, η 8–11', lo: 8, hi: 11 },
  F: { label: 'Class F: US Navy stockless, Beyers, Union, Spek (stockless), η 4–6', lo: 4, hi: 6 },
  custom: { label: 'Other: enter the efficiency (holding ÷ weight)' },
};
export const REF_MASS_KG = 10000;
export const SIZE_EXPONENT = 0.92;

export const schema = {
  id: 'anchor-holding',
  name: 'Anchor holding power calculator',
  category: 'maritime',
  summary: 'Holding capacity of an anchor from its mass and type (efficiency by anchor class) and the anchor mass needed to hold a design force.',
  related: ['anchor-catenary', 'wire-rope-swl', 'bollard-pull', 'mooring-line-meg4'],
  assumptions: [
    'Holding capacity = efficiency × anchor weight in air. The efficiency ranges by anchor class are those of the Vryhof Anchor Manual, quoted for a 10 t anchor fully embedded in good holding ground with the line horizontal at the seabed.',
    'The low end of the range is used by default. Holding is highest in sand and stiff clay and lower in very soft clay (mud), where the fluke angle must be set to about 50°; it can be close to nothing on rock, weed or a fouled anchor.',
    'Vryhof\'s holding-capacity charts follow UHC = A W^0.92, so efficiency falls slowly as anchors get bigger. The size-scaled option applies that law from the 10 t reference size; the linear option keeps the efficiency constant, which is conservative for anchors smaller than 10 t.',
    'Any uplift of the line at the anchor shank reduces the holding sharply: check the scope with the anchor catenary calculator. Dynamic loads from yawing and snatching in a seaway come on top of the static force.',
    'The safety factor divides the holding capacity. API RP 2SK uses 1.5 for drag anchors of permanent moorings in the intact condition with a dynamic analysis; ship anchoring relies on paying out cable and on the engine instead.',
  ],
  notes: [
    'Verification 2026-11-08: a 6 t stockless anchor (Class F, η 4) holds 4 × 6 t = 24 t, 235 kN, and 157 kN with a safety factor of 1.5; holding 300 kN with that factor needs 300 × 1.5 / (4 × 9.81) = 11.5 t of stockless anchor, or 5.7 t of a Class D anchor at η 8 (3.1 t at η 15). Checked by hand.',
  ],
  sources: [
    'Vryhof Anchors, Anchor Manual 2000 (Krimpen a/d IJssel), "Characteristics of anchor types" (classes A–G, efficiency for a 10 t anchor) and the UHC = A W^0.92 holding-capacity charts',
    'API RP 2SK, Design and Analysis of Stationkeeping Systems for Floating Structures, 3rd ed. (2005): factors of safety for drag anchor holding capacity',
    'IACS UR A1, Anchoring equipment: high holding power anchors with at least twice the holding power of an ordinary stockless anchor of the same mass',
  ],
  inputs: [
    {
      id: 'mode', label: 'What do you want to find?', type: 'select', default: 'holding',
      options: [{ value: 'holding', label: 'Holding capacity of an anchor' }, { value: 'mass', label: 'Anchor mass for a design force' }],
    },
    { id: 'anchor_class', label: 'Anchor type (Vryhof class)', type: 'select', default: 'F', options: Object.entries(CLASSES).map(([value, c]) => ({ value, label: c.label })) },
    {
      id: 'estimate', label: 'Efficiency to use', type: 'select', default: 'low',
      visibleWhen: { anchor_class: ['A', 'B', 'C', 'D', 'E', 'F'] },
      options: [{ value: 'low', label: 'Low end of the range (cautious)' }, { value: 'mid', label: 'Middle of the range' }, { value: 'high', label: 'High end of the range' }],
    },
    { id: 'eff_custom', label: 'Efficiency η (holding capacity ÷ anchor weight)', group: 'dimensionless', unit: 'none', default: 7, min: 0.5, max: 100, visibleWhen: { anchor_class: 'custom' } },
    {
      id: 'scaling', label: 'Size effect', type: 'select', default: 'linear',
      options: [{ value: 'linear', label: 'Linear: holding = η × weight' }, { value: 'vryhof', label: 'Vryhof size law: holding ∝ weight^0.92 from 10 t' }],
    },
    { id: 'anchor_kg', label: 'Anchor mass (in air)', group: 'mass', unit: 'kg', display: 't', default: 6000, min: 1, max: 1e6, visibleWhen: { mode: 'holding' } },
    { id: 'force_n', label: 'Design horizontal force at the anchor', group: 'force', unit: 'N', display: 'kN', default: 300000, min: 10, max: 1e8, visibleWhen: { mode: 'mass' } },
    { id: 'safety_factor', label: 'Safety factor on holding', group: 'dimensionless', unit: 'none', default: 1.5, min: 1, max: 5 },
  ],
  outputs: [
    { id: 'eff_used', label: 'Efficiency used (at this anchor size)', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'holding_n', label: 'Holding capacity', group: 'force', unit: 'N', display: 'kN' },
    { id: 'holding_tf', label: 'Holding capacity in tonnes-force', group: 'force', unit: 'N', display: 'tf', decimals: 1 },
    { id: 'allowable_n', label: 'Allowable force (holding ÷ safety factor)', group: 'force', unit: 'N', display: 'kN' },
    { id: 'range_text', label: 'Range for this anchor class', type: 'text' },
    { id: 'mass_req_kg', label: 'Anchor mass needed', group: 'mass', unit: 'kg', display: 't', decimals: 2 },
  ],
  example: {
    inputs: { mode: 'holding', anchor_class: 'F', estimate: 'low', scaling: 'linear', anchor_kg: [6, 't'], safety_factor: 1.5 },
    results: { holding_n: '235 kN', allowable_n: '157 kN' },
  },
};

function holdingFor(massKg, eff, scaling) {
  const g = GRAVITY_M_S2;
  return scaling === 'linear' ? eff * massKg * g : eff * REF_MASS_KG * g * (massKg / REF_MASS_KG) ** SIZE_EXPONENT;
}

function massFor(forceN, eff, scaling) {
  const g = GRAVITY_M_S2;
  return scaling === 'linear' ? forceN / (eff * g) : REF_MASS_KG * (forceN / (eff * REF_MASS_KG * g)) ** (1 / SIZE_EXPONENT);
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['holding', 'mass'], 'mode', 'What do you want to find');
  assertOneOf(x.anchor_class, Object.keys(CLASSES), 'anchor_class', 'Anchor type');
  assertOneOf(x.estimate, ['low', 'mid', 'high'], 'estimate', 'Efficiency to use');
  assertOneOf(x.scaling, ['linear', 'vryhof'], 'scaling', 'Size effect');
  const sf = assertRange(x.safety_factor, 1, 5, 'safety_factor', 'Safety factor');
  const cls = CLASSES[x.anchor_class];
  let eff;
  if (x.anchor_class === 'custom') eff = assertRange(x.eff_custom, 0.5, 100, 'eff_custom', 'Efficiency');
  else eff = x.estimate === 'low' ? cls.lo : x.estimate === 'high' ? cls.hi : (cls.lo + cls.hi) / 2;
  const g = GRAVITY_M_S2;
  const warnings = [];
  let mass;
  let holding;
  if (x.mode === 'holding') {
    mass = assertPositive(x.anchor_kg, 'anchor_kg', 'Anchor mass');
    holding = holdingFor(mass, eff, x.scaling);
  } else {
    const F = assertPositive(x.force_n, 'force_n', 'Design force');
    mass = massFor(F * sf, eff, x.scaling);
    holding = F * sf;
  }
  if (x.scaling === 'vryhof' && (mass < 1000 || mass > 65000)) warnings.push('The Vryhof size law is drawn from anchors of about 1 to 65 t; outside that range it is an extrapolation.');
  if (mass < 1000) warnings.push('Small anchors: the class efficiencies are quoted for 10 t offshore anchors. Small boat anchors in good sand often hold more per kilogram, and much less in weed, rock or soft mud.');
  const effAtSize = holding / (mass * g);
  const kn = (n) => (n >= 1e5 ? (n / 1000).toFixed(0) : (n / 1000).toPrecision(3));
  const range = x.anchor_class === 'custom'
    ? `Efficiency ${eff} entered`
    : `Efficiency ${cls.lo} to ${cls.hi} for a 10 t anchor: ${kn(holdingFor(mass, cls.lo, x.scaling))} to ${kn(holdingFor(mass, cls.hi, x.scaling))} kN at this mass`;
  return {
    outputs: {
      eff_used: effAtSize,
      holding_n: holding,
      holding_tf: holding,
      allowable_n: holding / sf,
      range_text: range,
      mass_req_kg: x.mode === 'mass' ? mass : null,
    },
    warnings,
  };
}
