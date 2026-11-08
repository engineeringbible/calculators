/**
 * weld-deposition/calc.js — weld metal volume and mass of fillet, single-V and double-V butt welds (with root gap, root
 * face and a reinforcement allowance), the filler metal needed at the deposition efficiency of the process (SMAW, GMAW,
 * FCAW, SAW), the number of electrodes or the length of wire, and the arc time from a deposition rate.
 *
 * Fillet (equal legs z): A = z²/2.  Single V: A = g t + (t − f)² tan(α/2).  Double V (symmetric): A = g t + (t − f)² tan(α/2) / 2.
 * m = A (1 + r) L ρ;  filler = m / E (Kobelco: C = (A1 + A2) L G / E / 10);  wire length = filler / (ρ π d²/4);  arc time = m / rate.
 * Schema units: SI — m, m², kg, kg/m³, kg/s, s.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive, assertNonNegative } from '../shared/validate.js';

const IN = 0.0254;

/** Typical deposition efficiencies (Kobe Steel, The ABC's of Arc Welding: How to calculate welding consumption). */
export const EFFICIENCY = { smaw: 0.55, gmaw: 0.95, fcaw: 0.9, saw: 1.0 };

/** Weld cross-section without reinforcement, m². */
export function weldArea(joint, { leg, t, gap, face, angleRad }) {
  if (joint === 'fillet') return (leg * leg) / 2;
  const h = t - face;
  const bevel = h * h * Math.tan(angleRad / 2);
  return gap * t + (joint === 'single_v' ? bevel : bevel / 2);
}

const wireProcess = ['gmaw', 'fcaw', 'saw'];

export const schema = {
  id: 'weld-deposition',
  name: 'Weld metal and filler consumption calculator',
  category: 'manufacturing',
  summary: 'Weld metal mass of fillet, single-V and double-V welds, filler needed for SMAW, GMAW, FCAW or SAW, electrodes or wire length and arc time.',
  related: ['fillet-weld', 'weld-fatigue', 'bend-allowance', 'machining-time'],
  assumptions: [
    'Fillet welds have equal legs and a flat face (area z²/2); groove welds are symmetric, with the bevel measured as the included angle, a root gap and a root face; convexity and cap reinforcement are added as a percentage of the area.',
    'Deposition efficiency is the deposited weld metal divided by the filler consumed: 55 % for covered electrodes (stub ends, slag and spatter), 95 % for solid and metal-cored wire, 90 % for flux-cored wire and 100 % for SAW wire (Kobe Steel); the flux of SAW is extra.',
    'Wire length uses the density of the weld metal for a solid wire; flux-cored wire is lighter per metre, so it needs more length than shown.',
    'Arc time is the deposited mass divided by the deposition rate of the welding procedure; it excludes slag removal, positioning and other non-arc time.',
    'Steel weld metal is taken at 7 850 kg/m³; change the density for stainless steel or aluminium.',
  ],
  notes: [
    'Verification 2026-11-08: a 10 mm single-V butt weld with a 60° included angle, 2 mm gap, 2 mm root face and 10 % reinforcement has 56.95 mm² of bevel and gap and 62.65 mm² in all; 1 m weighs 0.4918 kg, needs 0.5176 kg of GMAW wire (95 %), 58.3 m of 1.2 mm wire and 9.8 minutes of arc time at 3 kg/h. Checked by hand.',
  ],
  sources: [
    'Kobe Steel, The ABC\'s of Arc Welding — How to calculate welding consumption: C = (A1 + A2) × L × G / E × 1/10, E = 55 % SMAW, 95 % GMAW, 90 % FCAW, 100 % SAW',
    'The Lincoln Electric Company, The Procedure Handbook of Arc Welding, 14th ed.: weld metal weight per foot from joint cross-sections',
  ],
  inputs: [
    { id: 'joint', label: 'Joint', type: 'select', default: 'fillet', options: [{ value: 'fillet', label: 'Fillet weld (equal legs)' }, { value: 'single_v', label: 'Single-V butt weld' }, { value: 'double_v', label: 'Double-V (X) butt weld' }] },
    { id: 'leg_m', label: 'Fillet leg size z', group: 'length', unit: 'm', display: 'in', default: 0.25 * IN, min: 0.0005, max: 0.1, visibleWhen: { joint: 'fillet' } },
    { id: 'thickness_m', label: 'Plate thickness t', group: 'length', unit: 'm', display: 'in', default: 0.375 * IN, min: 0.001, max: 0.3, visibleWhen: { joint: ['single_v', 'double_v'] } },
    { id: 'angle_deg', label: 'Included groove angle α', group: 'angle', unit: 'deg', default: 60, min: 0, max: 120, visibleWhen: { joint: ['single_v', 'double_v'] } },
    { id: 'gap_m', label: 'Root gap g', group: 'length', unit: 'm', display: 'in', default: 0.0625 * IN, min: 0, max: 0.05, visibleWhen: { joint: ['single_v', 'double_v'] } },
    { id: 'face_m', label: 'Root face f', group: 'length', unit: 'm', display: 'in', default: 0.0625 * IN, min: 0, max: 0.3, visibleWhen: { joint: ['single_v', 'double_v'] } },
    { id: 'reinforcement', label: 'Reinforcement and convexity allowance', group: 'ratio', unit: 'frac', display: 'pct', default: 0.1, min: 0, max: 1 },
    { id: 'length_m', label: 'Weld length', group: 'length', unit: 'm', display: 'ft', default: 3.048, min: 0.001, max: 100000 },
    { id: 'density', label: 'Weld metal density', group: 'density', unit: 'kg_m3', default: 7850, min: 1000, max: 20000 },
    { id: 'process', label: 'Welding process', type: 'select', default: 'gmaw', options: [{ value: 'smaw', label: 'SMAW (stick, covered electrodes)' }, { value: 'gmaw', label: 'GMAW (MIG/MAG, solid or metal-cored wire)' }, { value: 'fcaw', label: 'FCAW (flux-cored wire)' }, { value: 'saw', label: 'SAW (submerged arc)' }] },
    { id: 'eff_mode', label: 'Deposition efficiency', type: 'select', default: 'typical', options: [{ value: 'typical', label: 'Typical for the process' }, { value: 'custom', label: 'Enter my own' }] },
    { id: 'efficiency', label: 'Deposition efficiency (deposited ÷ consumed)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.2, max: 1, visibleWhen: { eff_mode: 'custom' } },
    { id: 'electrode_kg', label: 'Mass of one electrode (box mass ÷ rods)', group: 'mass', unit: 'kg', display: 'lb', default: 0.03, min: 0.001, max: 2, visibleWhen: { process: 'smaw' } },
    { id: 'wire_d_m', label: 'Wire diameter', group: 'length', unit: 'm', display: 'in', default: 0.045 * IN, min: 0.0004, max: 0.01, visibleWhen: { process: wireProcess } },
    { id: 'rate_kg_s', label: 'Deposition rate of the procedure', group: 'mass_flow', unit: 'kg_s', display: 'lb_h', default: (6 * 0.45359237) / 3600, min: 1e-6, max: 0.02 },
  ],
  outputs: [
    { id: 'area_m2', label: 'Weld cross-section with allowance', group: 'area', unit: 'm2', display: 'in2' },
    { id: 'mass_per_m', label: 'Weld metal per length', group: 'linear_density', unit: 'kg_m', display: 'lb_ft' },
    { id: 'weld_kg', label: 'Weld metal deposited', group: 'mass', unit: 'kg', display: 'lb' },
    { id: 'eff_used', label: 'Deposition efficiency used', group: 'ratio', unit: 'frac', display: 'pct', decimals: 0 },
    { id: 'filler_kg', label: 'Filler metal needed', group: 'mass', unit: 'kg', display: 'lb' },
    { id: 'electrodes', label: 'Electrodes needed (rounded up)', group: 'dimensionless', unit: 'none', decimals: 0, visibleWhen: { process: 'smaw' } },
    { id: 'wire_m', label: 'Wire length needed', group: 'length', unit: 'm', display: 'ft', visibleWhen: { process: wireProcess } },
    { id: 'arc_s', label: 'Arc time', group: 'time', unit: 's', display: 'min' },
  ],
  example: {
    inputs: { joint: 'single_v', thickness_m: [10, 'mm'], angle_deg: [60, 'deg'], gap_m: [2, 'mm'], face_m: [2, 'mm'], reinforcement: [10, 'pct'], length_m: [1, 'm'], density: [7850, 'kg_m3'], process: 'gmaw', eff_mode: 'typical', wire_d_m: [1.2, 'mm'], rate_kg_s: [3, 'kg_h'] },
    results: { area_m2: '62.65 mm²', weld_kg: '0.4918 kg', filler_kg: '0.5176 kg', wire_m: '58.3 m', arc_s: '9.8 min' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.joint, ['fillet', 'single_v', 'double_v'], 'joint', 'Joint');
  assertOneOf(x.process, ['smaw', 'gmaw', 'fcaw', 'saw'], 'process', 'Welding process');
  assertOneOf(x.eff_mode, ['typical', 'custom'], 'eff_mode', 'Deposition efficiency');
  const geom = {};
  if (x.joint === 'fillet') geom.leg = assertRange(x.leg_m, 0.0005, 0.1, 'leg_m', 'Fillet leg size z');
  else {
    geom.t = assertRange(x.thickness_m, 0.001, 0.3, 'thickness_m', 'Plate thickness t');
    geom.angleRad = (assertRange(x.angle_deg, 0, 120, 'angle_deg', 'Included groove angle') * Math.PI) / 180;
    geom.gap = assertNonNegative(x.gap_m, 'gap_m', 'Root gap g');
    geom.face = assertNonNegative(x.face_m, 'face_m', 'Root face f');
    if (geom.face > geom.t) throw new Error('Root face f: it cannot be larger than the plate thickness.');
  }
  const r = assertRange(x.reinforcement, 0, 1, 'reinforcement', 'Reinforcement allowance');
  const L = assertPositive(x.length_m, 'length_m', 'Weld length');
  const rho = assertRange(x.density, 1000, 20000, 'density', 'Weld metal density');
  const E = x.eff_mode === 'custom' ? assertRange(x.efficiency, 0.2, 1, 'efficiency', 'Deposition efficiency') : EFFICIENCY[x.process];
  const rate = assertPositive(x.rate_kg_s, 'rate_kg_s', 'Deposition rate');
  const area = weldArea(x.joint, geom) * (1 + r);
  if (area <= 0) throw new Error('Joint: the weld has no cross-section; give a gap, a bevel angle or a thinner root face.');
  const perM = area * rho;
  const weld = perM * L;
  const filler = weld / E;
  let electrodes = null;
  let wire = null;
  const warnings = [];
  if (x.process === 'smaw') electrodes = Math.ceil(filler / assertPositive(x.electrode_kg, 'electrode_kg', 'Mass of one electrode') - 1e-9);
  else {
    const d = assertRange(x.wire_d_m, 0.0004, 0.01, 'wire_d_m', 'Wire diameter');
    wire = filler / (rho * (Math.PI / 4) * d * d);
    if (x.process === 'fcaw') warnings.push('Flux-cored wire weighs less per metre than solid wire of the same diameter: order by mass, the length shown is a lower bound.');
  }
  if (x.joint !== 'fillet' && geom.angleRad * 180 / Math.PI < 30 && geom.gap < 0.003) warnings.push('A groove angle below 30° with a small gap is hard to fuse at the root; check the joint design.');
  return {
    outputs: {
      area_m2: area,
      mass_per_m: perM,
      weld_kg: weld,
      eff_used: E,
      filler_kg: filler,
      electrodes,
      wire_m: wire,
      arc_s: weld / rate,
    },
    warnings,
  };
}
