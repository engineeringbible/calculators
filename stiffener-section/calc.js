/**
 * stiffener-section/calc.js — section properties of a stiffener with its attached plating: area, neutral axis,
 * moment of inertia about the neutral axis parallel to the plate, and the section moduli at the plate and at the
 * free flange; the profile is built from a web and flange or taken from a profile table (bulb flats, rolled sections).
 *
 * z̄ = Σ A_i z_i / Σ A_i;  I = Σ (I_i + A_i (z_i − z̄)²);  Z_plate = I / z̄;  Z_flange = I / (h − z̄)
 * z measured from the outer (unstiffened) surface of the plate.  Schema units: mm, cm², cm⁴, cm³.
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf } from '../shared/validate.js';

export const schema = {
  id: 'stiffener-section',
  name: 'Stiffener with attached plating',
  category: 'structural',
  summary: 'Neutral axis, moment of inertia and section moduli at the plate and the flange of a stiffener with its effective plate flange.',
  related: ['beam-deflection', 'weld-fatigue', 'column-buckling', 'padeye'],
  assumptions: [
    'Composite section of rectangles (or a tabulated profile) by the parallel-axis theorem; bending about the axis parallel to the plate, with heights measured from the outer surface of the plate.',
    'The effective breadth of the attached plating is an input: classification rules set it, for example as the stiffener spacing for local strength or a reduced breadth for shear lag and plate buckling.',
    'A flange on one side (angle) gives the same properties about this axis as a symmetric tee; the unsymmetric angle also bends sideways and twists, which this check does not cover.',
    'Tabulated profiles (bulb flats and rolled sections) are entered by their area, the height of their centroid above the plate surface, their own moment of inertia about that centroid and their height, from the maker\'s table.',
    'Corrosion additions, net thickness rules, fillet radii of built-up sections and weld material are not included.',
  ],
  notes: [
    'Verification 2026-10-31: a 600 × 12 mm plate with a 300 × 10 mm web and a 100 × 15 mm flange gives A = 117 cm², a neutral axis 86.19 mm above the plate surface, I = 16 781 cm⁴ and Z = 1947 cm³ at the plate and 697 cm³ at the flange, the same as a separate hand calculation with the parallel-axis theorem.',
    'Design decision: the profile alone (without the plate) is also reported, because rules often state the required section modulus of the stiffener with or without its plating.',
  ],
  sources: [
    'W. C. Young, R. G. Budynas, A. M. Sadegh, Roark\'s Formulas for Stress and Strain, 8th ed., McGraw-Hill 2012, Appendix A — properties of plane areas, parallel-axis theorem',
    'O. F. Hughes, J. K. Paik, Ship Structural Analysis and Design, SNAME 2010 — stiffened panels and the effective breadth of plating',
  ],
  inputs: [
    { id: 'plate_breadth_mm', label: 'Effective breadth of the plating', group: 'length', unit: 'mm', default: 600, min: 1, max: 10000 },
    { id: 'plate_thickness_mm', label: 'Plate thickness', group: 'length', unit: 'mm', default: 12, min: 0.1, max: 200 },
    {
      id: 'profile',
      label: 'Stiffener profile',
      type: 'select',
      default: 'tee',
      options: [
        { value: 'tee', label: 'Tee or angle (web and flange)' },
        { value: 'flat', label: 'Flat bar (web only)' },
        { value: 'table', label: 'From a profile table (bulb flat, rolled section)' },
      ],
    },
    { id: 'web_height_mm', label: 'Web height (plate surface to flange)', group: 'length', unit: 'mm', default: 300, min: 1, max: 5000, visibleWhen: { profile: ['tee', 'flat'] } },
    { id: 'web_thickness_mm', label: 'Web thickness', group: 'length', unit: 'mm', default: 10, min: 0.1, max: 200, visibleWhen: { profile: ['tee', 'flat'] } },
    { id: 'flange_width_mm', label: 'Flange width', group: 'length', unit: 'mm', default: 100, min: 0, max: 2000, visibleWhen: { profile: 'tee' } },
    { id: 'flange_thickness_mm', label: 'Flange thickness', group: 'length', unit: 'mm', default: 15, min: 0, max: 200, visibleWhen: { profile: 'tee' } },
    { id: 'table_area_cm2', label: 'Profile area', group: 'area', unit: 'cm2', default: 30, min: 0.01, max: 2000, visibleWhen: { profile: 'table' } },
    { id: 'table_centroid_mm', label: 'Profile centroid above the plate surface', group: 'length', unit: 'mm', default: 120, min: 0, max: 5000, visibleWhen: { profile: 'table' } },
    { id: 'table_inertia_cm4', label: 'Profile moment of inertia about its centroid', group: 'second_moment_of_area', unit: 'cm4', default: 3000, min: 0, max: 1e7, visibleWhen: { profile: 'table' } },
    { id: 'table_height_mm', label: 'Profile height', group: 'length', unit: 'mm', default: 220, min: 1, max: 5000, visibleWhen: { profile: 'table' } },
  ],
  outputs: [
    { id: 'area_cm2', label: 'Area with plating', group: 'area', unit: 'cm2' },
    { id: 'neutral_axis_mm', label: 'Neutral axis above the outer plate surface', group: 'length', unit: 'mm' },
    { id: 'inertia_cm4', label: 'Moment of inertia about the neutral axis', group: 'second_moment_of_area', unit: 'cm4' },
    { id: 'z_plate_cm3', label: 'Section modulus at the plate', group: 'section_modulus', unit: 'cm3' },
    { id: 'z_flange_cm3', label: 'Section modulus at the free flange', group: 'section_modulus', unit: 'cm3' },
    { id: 'profile_inertia_cm4', label: 'Profile alone: moment of inertia', group: 'second_moment_of_area', unit: 'cm4' },
    { id: 'profile_z_cm3', label: 'Profile alone: section modulus at the free edge', group: 'section_modulus', unit: 'cm3' },
    { id: 'parts_table', label: 'Parts of the section', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      area_cm2: '117 cm²',
      neutral_axis_mm: '86.2 mm',
      inertia_cm4: '16 781 cm⁴',
      z_plate_cm3: '1947 cm³',
      z_flange_cm3: '697 cm³',
    },
  },
};

/** Area, first moment and own inertia of a list of parts {name, area, z, own} (mm units) about their common centroid. */
export function composite(parts) {
  const area = parts.reduce((sum, p) => sum + p.area, 0);
  const centroid = parts.reduce((sum, p) => sum + p.area * p.z, 0) / area;
  const inertia = parts.reduce((sum, p) => sum + p.own + p.area * (p.z - centroid) ** 2, 0);
  return { area, centroid, inertia };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.plate_breadth_mm, 'plate_breadth_mm', 'Effective breadth');
  assertPositive(i.plate_thickness_mm, 'plate_thickness_mm', 'Plate thickness');
  assertOneOf(i.profile, ['tee', 'flat', 'table'], 'profile', 'Stiffener profile');
  const tp = i.plate_thickness_mm;
  let profile;
  let height;
  if (i.profile === 'table') {
    assertPositive(i.table_area_cm2, 'table_area_cm2', 'Profile area');
    assertNonNegative(i.table_inertia_cm4, 'table_inertia_cm4', 'Profile moment of inertia');
    assertPositive(i.table_height_mm, 'table_height_mm', 'Profile height');
    if (i.table_centroid_mm <= 0 || i.table_centroid_mm >= i.table_height_mm) throw new Error('The profile centroid must lie within the profile height');
    profile = [{ name: 'Profile (table)', area: i.table_area_cm2 * 100, z: tp + i.table_centroid_mm, own: i.table_inertia_cm4 * 1e4 }];
    height = i.table_height_mm;
  } else {
    assertPositive(i.web_height_mm, 'web_height_mm', 'Web height');
    assertPositive(i.web_thickness_mm, 'web_thickness_mm', 'Web thickness');
    const hw = i.web_height_mm;
    const tw = i.web_thickness_mm;
    profile = [{ name: 'Web', area: hw * tw, z: tp + hw / 2, own: (tw * hw ** 3) / 12 }];
    height = hw;
    if (i.profile === 'tee') {
      assertPositive(i.flange_width_mm, 'flange_width_mm', 'Flange width');
      assertPositive(i.flange_thickness_mm, 'flange_thickness_mm', 'Flange thickness');
      const bf = i.flange_width_mm;
      const tf = i.flange_thickness_mm;
      profile.push({ name: 'Flange', area: bf * tf, z: tp + hw + tf / 2, own: (bf * tf ** 3) / 12 });
      height = hw + tf;
    }
  }
  const plate = { name: 'Plating', area: i.plate_breadth_mm * tp, z: tp / 2, own: (i.plate_breadth_mm * tp ** 3) / 12 };
  const parts = [plate, ...profile];
  const all = composite(parts);
  const alone = composite(profile);
  const top = tp + height;

  const warnings = [];
  if (all.centroid < tp) warnings.push('The neutral axis lies within the plate: the plate flange dominates and the stress at the free flange governs.');
  if (i.profile === 'flat' && i.web_height_mm / i.web_thickness_mm > 15) warnings.push(`A flat bar with a height/thickness ratio of ${(i.web_height_mm / i.web_thickness_mm).toFixed(1)} may trip or buckle locally; check the rule slenderness limit.`);
  if (i.profile === 'tee' && i.web_height_mm / i.web_thickness_mm > 90) warnings.push('A slender web: check the rule limit on web height to thickness.');

  return {
    outputs: {
      area_cm2: all.area / 100,
      neutral_axis_mm: all.centroid,
      inertia_cm4: all.inertia / 1e4,
      z_plate_cm3: all.inertia / all.centroid / 1e3,
      z_flange_cm3: all.inertia / (top - all.centroid) / 1e3,
      profile_inertia_cm4: alone.inertia / 1e4,
      profile_z_cm3: alone.inertia / (top - alone.centroid) / 1e3,
      parts_table: {
        columns: ['Part', 'Area (cm²)', 'Centroid above the plate surface (mm)', 'Own inertia (cm⁴)', 'A (z − z̄)² (cm⁴)'],
        rows: [...parts.map((p) => [p.name, p.area / 100, p.z, p.own / 1e4, (p.area * (p.z - all.centroid) ** 2) / 1e4]), ['Total', all.area / 100, all.centroid, parts.reduce((sum, p) => sum + p.own, 0) / 1e4, parts.reduce((sum, p) => sum + p.area * (p.z - all.centroid) ** 2, 0) / 1e4]],
      },
      summary: `A = ${(all.area / 100).toFixed(1)} cm², neutral axis ${all.centroid.toFixed(1)} mm above the plate, I = ${(all.inertia / 1e4).toFixed(0)} cm⁴; Z = ${(all.inertia / all.centroid / 1e3).toFixed(0)} cm³ at the plate and ${(all.inertia / (top - all.centroid) / 1e3).toFixed(0)} cm³ at the flange.`,
    },
    warnings,
  };
}
