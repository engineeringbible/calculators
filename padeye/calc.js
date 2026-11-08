/**
 * padeye/calc.js — check of a lifting padeye and its shackle pin as a pin connection to EN 1993-1-8:2005 3.13:
 * the geometry of the plate around the hole (Table 3.9, type A), bearing of plate and pin, shear and bending of the
 * pin in double shear (Table 3.10, Figure 3.11) and, for a replaceable pin, the serviceability checks (3.14)–(3.16).
 *
 * a ≥ F γM0/(2 t fy) + 2 d0/3;  c ≥ F γM0/(2 t fy) + d0/3;  Fb,Rd = 1.5 t d fy/γM0;  Fv,Rd = 0.6 A fup/γM2
 * MEd = F (b + 4c + 2a)/8;  MRd = 1.5 Wel fyp/γM0;  (MEd/MRd)² + (Fv,Ed/Fv,Rd)² ≤ 1
 * σh,Ed = 0.591 √(E Fser (d0 − d)/(d² t)) ≤ 2.5 fy/γM6,ser
 * Schema units: kN, mm, MPa, kN·m.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const E_MPA = 210000;

export const schema = {
  id: 'padeye',
  name: 'Padeye design check',
  category: 'structural',
  summary: 'Plate geometry around the hole, bearing, and shear and bending of the shackle pin of a lifting padeye to EN 1993-1-8 pin connections.',
  related: ['lifting-sling', 'fillet-weld', 'stiffener-section', 'weld-fatigue'],
  assumptions: [
    'EN 1993-1-8:2005 3.13 (with corrigenda): the plate with the hole is checked as a type A pin-ended member of given thickness, a ≥ F γM0/(2 t fy) + 2d0/3 beyond the hole in the direction of the load and c ≥ F γM0/(2 t fy) + d0/3 at the sides (Table 3.9); the proportions of type B (t ≥ 0.7 √(F γM0/fy), d0 ≤ 2.5 t) are shown for information.',
    'Table 3.10: bearing of plate and pin 1.5 t d fy/γM0 with fy the lower of plate and pin; shear of the pin 0.6 A fup/γM2 per shear plane, the shackle pin being in double shear; bending of the pin 1.5 Wel fyp/γM0 with MEd = F (b + 4c + 2a)/8 for the padeye of thickness b between shackle jaws of thickness a with gaps c (Figure 3.11); and the interaction of bending and shear.',
    'A replaceable pin (a shackle) must also meet the serviceability checks under the characteristic load: bearing 0.6 t d fy/γM6,ser, bending 0.8 Wel fyp/γM6,ser, and the contact stress σh,Ed = 0.591 √(E Fser (d0 − d)/(d² t)) ≤ 2.5 fy/γM6,ser (3.14–3.16).',
    'Partial factors: γM0 = 1.00 (EN 1993-1-1 6.1), γM2 = 1.25 and γM6,ser = 1.0 (EN 1993-1-8 Table 2.1) as recommended; the National Annex may set others. E = 210 000 MPa.',
    'The design force must already include the factors of the lifting standard used (dynamic amplification, skew load, consequence); the load acts in the plane of the padeye along its axis. Out-of-plane loads, the welds of the padeye and cheek plates, and the supporting structure are outside this check.',
  ],
  notes: [
    'Verification 2026-10-31: 250 kN on a 30 mm padeye with a 53 mm hole and a 50 mm pin: a ≥ 11.74 + 35.33 = 47.07 mm, c ≥ 29.40 mm; Fb,Rd = 798.8 kN; Fv,Rd = 754.0 kN per plane; MEd = 3.125 kN·m against MRd = 11.78 kN·m; the replaceable-pin contact stress is 706 MPa against 887.5 MPa.',
    'Design decision: the thickness t is that of the plate at the hole, including cheek plates when they are welded to share the load; with cheek plates of a smaller radius, check the main plate alone for a and c.',
  ],
  sources: [
    'EN 1993-1-8:2005 incorporating corrigenda 2005 and 2009, Eurocode 3 Design of joints — 3.13, Tables 2.1, 3.9 and 3.10, Figure 3.11, eqs (3.14)–(3.16)',
    'EN 1993-1-1:2005, 6.1 NOTE 2B — recommended γM0, γM1, γM2',
  ],
  inputs: [
    { id: 'force_kn', label: 'Design force on the padeye (factored)', group: 'force', unit: 'kN', default: 250, min: 0.1, max: 100000 },
    { id: 'thickness_mm', label: 'Plate thickness at the hole (with cheek plates)', group: 'length', unit: 'mm', default: 30, min: 1, max: 500 },
    { id: 'hole_mm', label: 'Hole diameter d0', group: 'length', unit: 'mm', default: 53, min: 1, max: 1000 },
    { id: 'pin_mm', label: 'Pin diameter d', group: 'length', unit: 'mm', default: 50, min: 1, max: 1000 },
    { id: 'end_distance_mm', label: 'Hole edge to plate end in the load direction (a)', group: 'length', unit: 'mm', default: 73.5, min: 0, max: 5000 },
    { id: 'side_distance_mm', label: 'Hole edge to plate side (c)', group: 'length', unit: 'mm', default: 73.5, min: 0, max: 5000 },
    { id: 'fy_plate_mpa', label: 'Plate yield strength', group: 'pressure', unit: 'MPa', default: 355, min: 100, max: 1500 },
    { id: 'fy_pin_mpa', label: 'Pin yield strength', group: 'pressure', unit: 'MPa', default: 640, min: 100, max: 2000 },
    { id: 'fu_pin_mpa', label: 'Pin ultimate strength', group: 'pressure', unit: 'MPa', default: 800, min: 100, max: 2500 },
    { id: 'jaw_mm', label: 'Shackle jaw thickness (outer plates)', group: 'length', unit: 'mm', default: 25, min: 0, max: 500 },
    { id: 'gap_mm', label: 'Gap between padeye and each jaw', group: 'length', unit: 'mm', default: 5, min: 0, max: 500 },
    {
      id: 'replaceable',
      label: 'Pin intended to be replaceable (shackle)',
      type: 'select',
      default: 'yes',
      options: [
        { value: 'yes', label: 'Yes: add the serviceability checks' },
        { value: 'no', label: 'No' },
      ],
    },
    { id: 'service_force_kn', label: 'Characteristic (serviceability) force', group: 'force', unit: 'kN', default: 170, min: 0, max: 100000, visibleWhen: { replaceable: 'yes' } },
    { id: 'gamma_m0', label: 'γM0', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 2 },
    { id: 'gamma_m2', label: 'γM2', group: 'dimensionless', unit: 'none', default: 1.25, min: 1, max: 2 },
    { id: 'gamma_m6ser', label: 'γM6,ser', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 2, visibleWhen: { replaceable: 'yes' } },
  ],
  outputs: [
    { id: 'max_utilisation', label: 'Largest utilisation', group: 'dimensionless', unit: 'none' },
    { id: 'a_required_mm', label: 'Required end distance a', group: 'length', unit: 'mm' },
    { id: 'c_required_mm', label: 'Required side distance c', group: 'length', unit: 'mm' },
    { id: 'bearing_kn', label: 'Bearing resistance Fb,Rd', group: 'force', unit: 'kN' },
    { id: 'pin_shear_kn', label: 'Pin shear resistance per plane Fv,Rd', group: 'force', unit: 'kN' },
    { id: 'pin_moment_knm', label: 'Pin bending moment MEd', group: 'torque', unit: 'kN_m' },
    { id: 'pin_moment_rd_knm', label: 'Pin bending resistance MRd', group: 'torque', unit: 'kN_m' },
    { id: 'contact_stress_mpa', label: 'Contact stress σh,Ed (replaceable pin)', group: 'pressure', unit: 'MPa', visibleWhen: { replaceable: 'yes' } },
    { id: 'checks_table', label: 'Checks', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      a_required_mm: '47.1 mm',
      c_required_mm: '29.4 mm',
      bearing_kn: '798.8 kN',
      pin_shear_kn: '754.0 kN',
      pin_moment_knm: '3.13 kN·m',
      pin_moment_rd_knm: '11.78 kN·m',
      contact_stress_mpa: '706 MPa',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.force_kn, 'force_kn', 'Design force');
  assertPositive(i.thickness_mm, 'thickness_mm', 'Plate thickness');
  assertPositive(i.hole_mm, 'hole_mm', 'Hole diameter');
  assertPositive(i.pin_mm, 'pin_mm', 'Pin diameter');
  if (i.pin_mm > i.hole_mm) throw new Error('The pin diameter must not exceed the hole diameter');
  assertNonNegative(i.end_distance_mm, 'end_distance_mm', 'End distance');
  assertNonNegative(i.side_distance_mm, 'side_distance_mm', 'Side distance');
  assertPositive(i.fy_plate_mpa, 'fy_plate_mpa', 'Plate yield strength');
  assertPositive(i.fy_pin_mpa, 'fy_pin_mpa', 'Pin yield strength');
  assertPositive(i.fu_pin_mpa, 'fu_pin_mpa', 'Pin ultimate strength');
  if (i.fu_pin_mpa < i.fy_pin_mpa) throw new Error('The pin ultimate strength must not be below its yield strength');
  assertNonNegative(i.jaw_mm, 'jaw_mm', 'Jaw thickness');
  assertNonNegative(i.gap_mm, 'gap_mm', 'Gap');
  assertOneOf(i.replaceable, ['yes', 'no'], 'replaceable', 'Replaceable pin');
  assertNonNegative(i.service_force_kn, 'service_force_kn', 'Serviceability force');
  assertRange(i.gamma_m0, 0.5, 3, 'gamma_m0', 'γM0');
  assertRange(i.gamma_m2, 0.5, 3, 'gamma_m2', 'γM2');
  assertRange(i.gamma_m6ser, 0.5, 3, 'gamma_m6ser', 'γM6,ser');

  const force = i.force_kn * 1000;
  const t = i.thickness_mm;
  const d = i.pin_mm;
  const d0 = i.hole_mm;
  const fy = Math.min(i.fy_plate_mpa, i.fy_pin_mpa);
  const base = (force * i.gamma_m0) / (2 * t * i.fy_plate_mpa);
  const aRequired = base + (2 * d0) / 3;
  const cRequired = base + d0 / 3;
  const bearing = (1.5 * t * d * fy) / i.gamma_m0;
  const pinArea = (Math.PI * d ** 2) / 4;
  const shearRd = (0.6 * pinArea * i.fu_pin_mpa) / i.gamma_m2;
  const shearEd = force / 2;
  const lever = (t + 4 * i.gap_mm + 2 * i.jaw_mm) / 8;
  const momentEd = force * lever;
  const wel = (Math.PI * d ** 3) / 32;
  const momentRd = (1.5 * wel * i.fy_pin_mpa) / i.gamma_m0;
  const interaction = (momentEd / momentRd) ** 2 + (shearEd / shearRd) ** 2;
  const rows = [
    ['End distance a (Table 3.9)', aRequired, i.end_distance_mm, aRequired / Math.max(i.end_distance_mm, 1e-9), 'mm'],
    ['Side distance c (Table 3.9)', cRequired, i.side_distance_mm, cRequired / Math.max(i.side_distance_mm, 1e-9), 'mm'],
    ['Bearing of plate and pin', force / 1000, bearing / 1000, force / bearing, 'kN'],
    ['Shear of the pin, per plane', shearEd / 1000, shearRd / 1000, shearEd / shearRd, 'kN'],
    ['Bending of the pin', momentEd / 1e6, momentRd / 1e6, momentEd / momentRd, 'kN·m'],
    ['Bending and shear of the pin', interaction, 1, interaction, '–'],
  ];
  let contact = 0;
  if (i.replaceable === 'yes') {
    const service = i.service_force_kn * 1000;
    const bearingSer = (0.6 * t * d * fy) / i.gamma_m6ser;
    const momentSer = service * lever;
    const momentRdSer = (0.8 * wel * i.fy_pin_mpa) / i.gamma_m6ser;
    contact = 0.591 * Math.sqrt((E_MPA * service * (d0 - d)) / (d ** 2 * t));
    const contactRd = (2.5 * fy) / i.gamma_m6ser;
    rows.push(
      ['Bearing at serviceability (replaceable)', service / 1000, bearingSer / 1000, service / bearingSer, 'kN'],
      ['Pin bending at serviceability (replaceable)', momentSer / 1e6, momentRdSer / 1e6, momentSer / momentRdSer, 'kN·m'],
      ['Contact stress (3.15) against 2.5 fy/γM6,ser', contact, contactRd, contact / contactRd, 'MPa'],
    );
  }
  const governing = rows.reduce((worst, r) => (r[3] > worst[3] ? r : worst));
  const typeBThickness = 0.7 * Math.sqrt((force * i.gamma_m0) / i.fy_plate_mpa);
  const governingName = governing[0][0].toLowerCase() + governing[0].slice(1);

  const warnings = [];
  if (governing[3] > 1) warnings.push(`Not adequate: ${governingName} at a utilisation of ${governing[3].toFixed(2)}.`);
  if (d0 > 2.5 * t) warnings.push(`The hole is more than 2.5 times the plate thickness (${(d0 / t).toFixed(2)} t), beyond the type B proportions.`);
  if (t < typeBThickness) warnings.push(`The plate is thinner than 0.7 √(F γM0/fy) = ${typeBThickness.toFixed(1)} mm of the type B proportions; the type A distances govern.`);
  if (i.replaceable === 'yes' && i.service_force_kn > i.force_kn) warnings.push('The serviceability force exceeds the design force: check the load combinations.');
  warnings.push('Check the welds of the padeye and any cheek plates, out-of-plane and skew loads, and the structure behind the padeye separately; shackle pins are rated by their maker.');

  return {
    outputs: {
      max_utilisation: governing[3],
      a_required_mm: aRequired,
      c_required_mm: cRequired,
      bearing_kn: bearing / 1000,
      pin_shear_kn: shearRd / 1000,
      pin_moment_knm: momentEd / 1e6,
      pin_moment_rd_knm: momentRd / 1e6,
      contact_stress_mpa: contact,
      checks_table: {
        columns: ['Check', 'Demand', 'Resistance or limit', 'Utilisation', 'Unit'],
        rows,
      },
      summary: `${i.force_kn} kN on a ${t} mm padeye with a ${d0} mm hole and a ${d} mm pin: largest utilisation ${governing[3].toFixed(2)} (${governingName}); a ≥ ${aRequired.toFixed(1)} mm and c ≥ ${cRequired.toFixed(1)} mm are required.`,
    },
    warnings,
  };
}
