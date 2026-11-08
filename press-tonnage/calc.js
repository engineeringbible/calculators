/**
 * press-tonnage/calc.js — punching and blanking force F = perimeter × thickness × shear strength, with stripping force
 * and a press size margin, and press brake air-bending tonnage per length from the press brake makers' formula.
 *
 * Punching: F = L t τ, τ entered or τ = k × UTS (k ≈ 0.75 wrought steel, 0.65 aluminium; Deutschman et al.);
 * press ≥ (F + F_strip) (1 + margin), F_strip = s F.
 * Air bending (Bystronic): tons per foot = 575 t² / V × UTS / 60 000 psi, t and V in inches, US tons (2 000 lbf).
 * Schema units: SI — m, Pa, N, N/m.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive, assertInteger } from '../shared/validate.js';

const IN = 0.0254;
const FT = 0.3048;
const PSI = 6894.757293168;
const US_TON_N = 2000 * 4.4482216152605;

/** Air-bending force per metre (N/m) for thickness t and die opening V (m) and tensile strength (Pa). */
export function airBendPerMetre(t, V, uts) {
  const tonsPerFt = ((575 * (t / IN) ** 2) / (V / IN)) * (uts / (60000 * PSI));
  return (tonsPerFt * US_TON_N) / FT;
}

const punchOut = { operation: 'punch' };
const brakeOut = { operation: 'brake' };

export const schema = {
  id: 'press-tonnage',
  name: 'Press tonnage calculator (punching and press brake)',
  category: 'manufacturing',
  summary: 'Punching and blanking force from perimeter, thickness and shear strength, with stripping force and press margin, and press brake air-bending tonnage.',
  related: ['bend-allowance', 'injection-clamp-tonnage', 'hydraulic-cylinder', 'tap-drill'],
  assumptions: [
    'Punching force is the sheared area (perimeter × thickness) times the ultimate shear strength, with flat-faced punches and normal clearance; shear angles on the punch or die lower the peak force, dull tools raise it.',
    'When only the tensile strength is known, shear strength is taken as a fraction of it: about 0.75 for wrought and alloy steels and 0.65 for aluminium alloys (Deutschman, Michels and Wilson, via Roymech); these are rough rules, so use measured shear strength where you can.',
    'Stripping force is entered as a share of the punching force; spring or urethane strippers load the press during the stroke, so it is added to the punching force.',
    'Press brake tonnage uses the makers\' air-bending formula, 575 t² / V tons per foot for steel of 60 000 psi tensile strength, scaled by the tensile strength of the material; bottoming and coining need several times more.',
    'The margin sizes the press above the calculated load for tool wear, material variation and thickness tolerance.',
  ],
  notes: [
    'Verification 2026-11-08: a 20 mm hole in 3 mm steel with 300 MPa shear strength needs π × 20 × 3 × 300 = 56.55 kN (5.77 tf, as in Durma\'s example); with 10 % stripping and a 20 % margin the press should have 74.64 kN. A 1/4 in plate on a 2 in V-die needs 575 × 0.0625 / 2 = 17.97 tons per foot. Checked by hand.',
  ],
  sources: [
    'Durma (press maker), How to calculate punching force: F = L × t × τ, worked example 20 mm hole in 3 mm steel at 300 MPa = 56 547 N',
    'Bystronic (press brake maker), How to calculate press brake tonnage: [575 × t² / V / 12] per inch of bend, material factor = UTS / 60 000 psi, air bending factor 1.0',
    'Deutschman, A. D., Michels, W. A. and Wilson, C. E., Machine Design: Theory and Practice (Macmillan, 1975), ratio of ultimate shear to tensile strength (as tabulated by Roymech)',
  ],
  inputs: [
    { id: 'operation', label: 'Operation', type: 'select', default: 'punch', options: [{ value: 'punch', label: 'Punching or blanking' }, { value: 'brake', label: 'Press brake air bending' }] },
    { id: 'shape', label: 'Hole or blank shape', type: 'select', default: 'round', options: [{ value: 'round', label: 'Round' }, { value: 'rect', label: 'Rectangle or square' }, { value: 'perimeter', label: 'Any shape: enter the cut perimeter' }], visibleWhen: punchOut },
    { id: 'diameter_m', label: 'Hole diameter', group: 'length', unit: 'm', display: 'in', default: 1 * IN, min: 0.0001, max: 5, visibleWhen: { operation: 'punch', shape: 'round' } },
    { id: 'side_a_m', label: 'Side a', group: 'length', unit: 'm', display: 'in', default: 1 * IN, min: 0.0001, max: 10, visibleWhen: { operation: 'punch', shape: 'rect' } },
    { id: 'side_b_m', label: 'Side b', group: 'length', unit: 'm', display: 'in', default: 2 * IN, min: 0.0001, max: 10, visibleWhen: { operation: 'punch', shape: 'rect' } },
    { id: 'perimeter_m', label: 'Cut perimeter', group: 'length', unit: 'm', display: 'in', default: 6 * IN, min: 0.0001, max: 100, visibleWhen: { operation: 'punch', shape: 'perimeter' } },
    { id: 'holes', label: 'Holes or blanks per stroke', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 1000, integer: true, visibleWhen: punchOut },
    { id: 'thickness_m', label: 'Material thickness t', group: 'length', unit: 'm', display: 'in', default: 0.25 * IN, min: 0.00005, max: 0.1 },
    { id: 'strength_mode', label: 'Shear strength', type: 'select', default: 'uts', options: [{ value: 'uts', label: 'From tensile strength × ratio' }, { value: 'shear', label: 'Enter the shear strength' }], visibleWhen: punchOut },
    { id: 'shear_pa', label: 'Ultimate shear strength τ', group: 'pressure', unit: 'Pa', display: 'ksi', default: 45000 * PSI, min: 1e6, max: 3e9, visibleWhen: { operation: 'punch', strength_mode: 'shear' } },
    { id: 'uts_pa', label: 'Ultimate tensile strength', group: 'pressure', unit: 'Pa', display: 'ksi', default: 60000 * PSI, min: 1e6, max: 3e9 },
    { id: 'ratio', label: 'Shear ÷ tensile strength (0.75 steel, 0.65 aluminium)', group: 'dimensionless', unit: 'none', default: 0.75, min: 0.4, max: 1.3, visibleWhen: { operation: 'punch', strength_mode: 'uts' } },
    { id: 'strip', label: 'Stripping force (share of the punching force)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.1, min: 0, max: 1, visibleWhen: punchOut },
    { id: 'die_v_m', label: 'V-die opening V', group: 'length', unit: 'm', display: 'in', default: 2 * IN, min: 0.0005, max: 1, visibleWhen: brakeOut },
    { id: 'bend_length_m', label: 'Length of the bend', group: 'length', unit: 'm', display: 'ft', default: 10 * FT, min: 0.001, max: 20, visibleWhen: brakeOut },
    { id: 'margin', label: 'Press capacity margin', group: 'ratio', unit: 'frac', display: 'pct', default: 0.2, min: 0, max: 3 },
  ],
  outputs: [
    { id: 'perimeter_out_m', label: 'Total cut perimeter per stroke', group: 'length', unit: 'm', display: 'in', visibleWhen: punchOut },
    { id: 'tau_pa', label: 'Shear strength used', group: 'pressure', unit: 'Pa', display: 'ksi', visibleWhen: punchOut },
    { id: 'punch_n', label: 'Punching force F', group: 'force', unit: 'N', display: 'kN', visibleWhen: punchOut },
    { id: 'strip_n', label: 'Stripping force', group: 'force', unit: 'N', display: 'kN', visibleWhen: punchOut },
    { id: 'per_m', label: 'Bending force per length', group: 'line_load', unit: 'N_m', display: 'kN_m', visibleWhen: brakeOut },
    { id: 'tons_ft', label: 'Bending force, US tons per foot', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: brakeOut },
    { id: 'v_ratio', label: 'Die opening ÷ thickness', group: 'dimensionless', unit: 'none', decimals: 1, visibleWhen: brakeOut },
    { id: 'load_n', label: 'Load on the press', group: 'force', unit: 'N', display: 'kN' },
    { id: 'load_us_tons', label: 'Load on the press, US tons (2 000 lbf)', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'press_n', label: 'Press capacity needed with margin', group: 'force', unit: 'N', display: 'kN' },
    { id: 'press_us_tons', label: 'Press capacity needed, US tons', group: 'dimensionless', unit: 'none', decimals: 1 },
  ],
  example: {
    inputs: { operation: 'punch', shape: 'round', diameter_m: [20, 'mm'], holes: 1, thickness_m: [3, 'mm'], strength_mode: 'shear', shear_pa: [300, 'MPa'], strip: [10, 'pct'], margin: [20, 'pct'] },
    results: { punch_n: '56.55 kN', load_n: '62.20 kN', press_n: '74.64 kN' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.operation, ['punch', 'brake'], 'operation', 'Operation');
  const t = assertRange(x.thickness_m, 0.00005, 0.1, 'thickness_m', 'Material thickness t');
  const margin = assertRange(x.margin, 0, 3, 'margin', 'Press capacity margin');
  const warnings = [];
  const out = { perimeter_out_m: null, tau_pa: null, punch_n: null, strip_n: null, per_m: null, tons_ft: null, v_ratio: null };
  let load;
  if (x.operation === 'punch') {
    assertOneOf(x.shape, ['round', 'rect', 'perimeter'], 'shape', 'Hole or blank shape');
    assertOneOf(x.strength_mode, ['uts', 'shear'], 'strength_mode', 'Shear strength');
    const n = assertInteger(assertRange(x.holes, 1, 1000, 'holes', 'Holes per stroke'), 'holes', 'Holes per stroke');
    let per;
    if (x.shape === 'round') per = Math.PI * assertPositive(x.diameter_m, 'diameter_m', 'Hole diameter');
    else if (x.shape === 'rect') per = 2 * (assertPositive(x.side_a_m, 'side_a_m', 'Side a') + assertPositive(x.side_b_m, 'side_b_m', 'Side b'));
    else per = assertPositive(x.perimeter_m, 'perimeter_m', 'Cut perimeter');
    const tau = x.strength_mode === 'shear'
      ? assertRange(x.shear_pa, 1e6, 3e9, 'shear_pa', 'Ultimate shear strength')
      : assertRange(x.uts_pa, 1e6, 3e9, 'uts_pa', 'Ultimate tensile strength') * assertRange(x.ratio, 0.4, 1.3, 'ratio', 'Shear ÷ tensile strength');
    const s = assertRange(x.strip, 0, 1, 'strip', 'Stripping force');
    const F = per * n * t * tau;
    out.perimeter_out_m = per * n;
    out.tau_pa = tau;
    out.punch_n = F;
    out.strip_n = s * F;
    load = F * (1 + s);
    if (x.shape === 'round' && x.diameter_m < t) warnings.push('The hole is smaller than the material thickness: the punch is very highly stressed and may buckle or break; check with the tooling maker.');
  } else {
    const V = assertRange(x.die_v_m, 0.0005, 1, 'die_v_m', 'V-die opening');
    const uts = assertRange(x.uts_pa, 1e6, 3e9, 'uts_pa', 'Ultimate tensile strength');
    const len = assertRange(x.bend_length_m, 0.001, 20, 'bend_length_m', 'Length of the bend');
    if (V <= 2 * t) throw new Error('V-die opening V: it must be well over twice the thickness for air bending.');
    out.per_m = airBendPerMetre(t, V, uts);
    out.tons_ft = (out.per_m * FT) / US_TON_N;
    out.v_ratio = V / t;
    load = out.per_m * len;
  }
  const press = load * (1 + margin);
  return {
    outputs: { ...out, load_n: load, load_us_tons: load / US_TON_N, press_n: press, press_us_tons: press / US_TON_N },
    warnings,
  };
}
