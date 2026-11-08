/**
 * beam-deflection/calc.js — bending moment, bending stress and deflection for the classic beam cases
 * (simply supported, cantilever, fixed–fixed; point load or UDL) with standard section properties.
 *
 * Euler–Bernoulli beam theory: linear elastic, small deflections, prismatic section, loads in the plane of symmetry.
 * Schema units: SI — m, N, N/m, Pa, m⁴, m³, m².
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf, assertRange } from '../shared/validate.js';
import { rectangleSection, hollowRectangleSection, circleSection, hollowCircleSection, iSection } from '../shared/sections.js';

export const LOAD_CASES = {
  ss_point_center: { label: 'Simply supported — point load at midspan', load: 'point' },
  ss_point_at_a: { label: 'Simply supported — point load at distance a from the left support', load: 'point_at_a' },
  ss_udl: { label: 'Simply supported — uniformly distributed load', load: 'udl' },
  cant_point_end: { label: 'Cantilever — point load at the free end', load: 'point' },
  cant_point_at_a: { label: 'Cantilever — point load at distance a from the fixed end', load: 'point_at_a' },
  cant_udl: { label: 'Cantilever — uniformly distributed load', load: 'udl' },
  ff_point_center: { label: 'Fixed at both ends — point load at midspan', load: 'point' },
  ff_udl: { label: 'Fixed at both ends — uniformly distributed load', load: 'udl' },
};

/** Young's modulus presets, Pa. */
export const MATERIALS = {
  steel_en: { label: 'Structural steel, EN 1993 (E = 210 GPa)', e: 210e9 },
  steel_aisc: { label: 'Structural steel, AISC (E = 200 GPa / 29 000 ksi)', e: 200e9 },
  stainless: { label: 'Austenitic stainless steel, EN 1993-1-4 (E = 200 GPa)', e: 200e9 },
  aluminium: { label: 'Aluminium alloy (E = 70 GPa)', e: 70e9 },
  timber_c24: { label: 'Softwood timber C24, EN 338 (E₀,mean = 11 GPa)', e: 11e9 },
  custom: { label: 'Custom modulus', e: null },
};

export const SECTIONS = {
  rectangle: { label: 'Solid rectangle b × h' },
  hollow_rectangle: { label: 'Hollow rectangle b × h, wall t' },
  circle: { label: 'Solid circle, diameter d' },
  hollow_circle: { label: 'Hollow circle / tube, outside diameter D, wall t' },
  i_beam: { label: 'I-section: flange b × t_f, overall depth h, web t_w (fillets ignored)' },
  custom: { label: 'Custom: enter I and distance to extreme fibre c' },
};

const POINT_CASES = ['ss_point_center', 'ss_point_at_a', 'cant_point_end', 'cant_point_at_a', 'ff_point_center'];
const POSITION_CASES = ['ss_point_at_a', 'cant_point_at_a'];
const UDL_CASES = ['ss_udl', 'cant_udl', 'ff_udl'];

export const schema = {
  id: 'beam-deflection',
  name: 'Beam deflection and bending stress',
  category: 'structural',
  summary: 'Maximum bending moment, bending stress, deflection and reactions for simply supported, cantilever and fixed beams with standard sections.',
  related: ['column-buckling', 'shaft-torque', 'pressure-vessel', 'unit-converter'],
  notes: [
    'Verification 2026-10-30: the IPE 200 fillet-free formula gives 1 846 cm⁴ against the tabulated 1 943 cm⁴ (−5 %), so the self-tests use the tabulated I as a custom section and the page warns when the I-section formula is used.',
    'Verification: the off-centre point-load case reduces to P L³/48 EI at a = L/2 and the fixed-end cases are exactly ¼ and ⅕ of the simply supported deflections, as in Roark.',
    'Design decision: eight load cases only, all with closed-form solutions; superposition is left to the user and explained in content.md.',
  ],
  assumptions: [
    'Euler–Bernoulli beam theory: plane sections remain plane and shear deflection is neglected; accurate for span-to-depth ratios above about 10, and it understates deflection for deep or short beams.',
    'Linear elastic material and small deflections (deflection well below span/100); results are invalid once the extreme fibre yields.',
    'Prismatic beam with the load in the plane of symmetry: no torsion, and no check of lateral-torsional buckling, web crippling or local flange buckling — those need the relevant design code.',
    'Bending stress only (σ = M c / I); shear stress, stress concentrations at holes or welds and fatigue are not evaluated.',
    'Supports are ideal: frictionless pins/rollers or perfectly fixed ends. Real connections are between the two, so simply supported deflections are an upper bound and fixed-end moments an upper bound.',
    'Self-weight is not added automatically; include it in the distributed load if it matters.',
    'I-section properties use the thin-walled rectangle formula without root fillets, which gives about 5 % less I than the rolled-section tables (IPE 200: 1846 vs 1943 cm⁴); enter the tabulated I as a custom section for exact values.',
    'Utilisation compares the elastic bending stress with the yield strength only; design codes add partial factors and may allow plastic section moduli.',
  ],
  sources: [
    'Gere & Goodno, Mechanics of Materials, 8th ed., Appendix G (deflections and slopes of beams)',
    "Young, Budynas & Sadegh, Roark's Formulas for Stress and Strain, 8th ed., Table 8.1",
    'Hibbeler, Mechanics of Materials, 10th ed., Appendix C (slopes and deflections of beams)',
    'ArcelorMittal, Sections and Merchant Bars / EN 10365 (IPE 200 properties)',
    'EN 1993-1-1 §3.2.6 (E = 210 GPa); AISC Steel Construction Manual (E = 29 000 ksi); EN 338 (timber C24)',
  ],
  inputs: [
    { id: 'load_case', label: 'Support and load case', type: 'select', default: 'ss_point_center', options: Object.entries(LOAD_CASES).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'length_m', label: 'Span L (cantilever: length)', group: 'length', unit: 'm', default: 4, min: 0.01, max: 200 },
    { id: 'point_load_n', label: 'Point load P', group: 'force', unit: 'N', display: 'kN', default: 10000, min: 0, max: 1e9, visibleWhen: { load_case: POINT_CASES } },
    { id: 'load_position_m', label: 'Load position a (from the left support / fixed end)', group: 'length', unit: 'm', default: 1, min: 0, max: 200, visibleWhen: { load_case: POSITION_CASES } },
    { id: 'udl_n_m', label: 'Distributed load w', group: 'line_load', unit: 'N_m', display: 'kN_m', default: 5000, min: 0, max: 1e8, visibleWhen: { load_case: UDL_CASES } },
    { id: 'section', label: 'Cross-section', type: 'select', default: 'i_beam', options: Object.entries(SECTIONS).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'width_m', label: 'Width b (flange width for I-section)', group: 'length', unit: 'm', display: 'mm', default: 0.1, min: 0.001, max: 10, visibleWhen: { section: ['rectangle', 'hollow_rectangle', 'i_beam'] } },
    { id: 'height_m', label: 'Depth h (overall)', group: 'length', unit: 'm', display: 'mm', default: 0.2, min: 0.001, max: 10, visibleWhen: { section: ['rectangle', 'hollow_rectangle', 'i_beam'] } },
    { id: 'wall_m', label: 'Wall thickness t', group: 'length', unit: 'm', display: 'mm', default: 0.008, min: 0.0001, max: 1, visibleWhen: { section: ['hollow_rectangle', 'hollow_circle'] } },
    { id: 'diameter_m', label: 'Diameter d (outside, for a tube)', group: 'length', unit: 'm', display: 'mm', default: 0.1, min: 0.001, max: 10, visibleWhen: { section: ['circle', 'hollow_circle'] } },
    { id: 'flange_m', label: 'Flange thickness t_f', group: 'length', unit: 'm', display: 'mm', default: 0.0085, min: 0.0001, max: 1, visibleWhen: { section: 'i_beam' } },
    { id: 'web_m', label: 'Web thickness t_w', group: 'length', unit: 'm', display: 'mm', default: 0.0056, min: 0.0001, max: 1, visibleWhen: { section: 'i_beam' } },
    { id: 'i_custom_m4', label: 'Second moment of area I', group: 'second_moment_of_area', unit: 'm4', display: 'cm4', default: 1943e-8, min: 1e-14, max: 100, visibleWhen: { section: 'custom' } },
    { id: 'c_custom_m', label: 'Distance from neutral axis to extreme fibre c', group: 'length', unit: 'm', display: 'mm', default: 0.1, min: 1e-5, max: 10, visibleWhen: { section: 'custom' } },
    { id: 'material', label: 'Material (Young\'s modulus)', type: 'select', default: 'steel_en', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'e_pa', label: 'Young\'s modulus E', group: 'pressure', unit: 'Pa', display: 'GPa', default: 210e9, min: 1e6, max: 2e12, visibleWhen: { material: 'custom' } },
    { id: 'yield_pa', label: 'Yield strength f_y (for utilisation)', group: 'pressure', unit: 'Pa', display: 'MPa', default: 235e6, min: 1e5, max: 5e9, help: 'S235 235, S355 355, ASTM A36 250, aluminium 6061-T6 240, C24 timber bending 24 MPa.' },
  ],
  outputs: [
    { id: 'i_m4', label: 'Second moment of area I', group: 'second_moment_of_area', unit: 'm4', display: 'cm4' },
    { id: 'z_m3', label: 'Elastic section modulus Z = I / c', group: 'section_modulus', unit: 'm3', display: 'cm3' },
    { id: 'area_m2', label: 'Cross-section area', group: 'area', unit: 'm2', display: 'cm2' },
    { id: 'reaction_a_n', label: 'Reaction at left support / fixed end', group: 'force', unit: 'N', display: 'kN' },
    { id: 'reaction_b_n', label: 'Reaction at right support', group: 'force', unit: 'N', display: 'kN' },
    { id: 'm_max_nm', label: 'Maximum bending moment |M|max', group: 'torque', unit: 'N_m', display: 'kN_m' },
    { id: 'm_location', label: 'Location of maximum moment', type: 'text' },
    { id: 'sigma_max_pa', label: 'Maximum bending stress σ = M c / I', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'delta_max_m', label: 'Maximum deflection δmax', group: 'length', unit: 'm', display: 'mm' },
    { id: 'delta_location', label: 'Location of maximum deflection', type: 'text' },
    { id: 'span_over_deflection', label: 'Span-to-deflection ratio L / δmax', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'utilisation_pct', label: 'Utilisation σ / f_y', group: 'ratio', unit: 'pct' },
    { id: 'shear_diagram', label: 'Shear force diagram', type: 'chart' },
    { id: 'moment_diagram', label: 'Bending moment diagram', type: 'chart' },
    { id: 'deflection_diagram', label: 'Deflected shape', type: 'chart' },
    { id: 'safety_factor', label: 'Factor of safety f_y / σ', group: 'dimensionless', unit: 'none' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      length_m: [4, 'm'],
      point_load_n: [10, 'kN'],
      section: 'custom',
      i_custom_m4: [1943, 'cm4'],
      c_custom_m: [100, 'mm'],
    },
    results: {
      reaction_a_n: '5 kN',
      m_max_nm: '10 kN·m',
      z_m3: '194.3 cm³',
      sigma_max_pa: '51.5 MPa',
      utilisation_pct: '21.9 %',
      safety_factor: '4.57',
      delta_max_m: '3.27 mm',
      span_over_deflection: '1224',
    },
  },
};

/** Section properties { i, c, area } about the strong axis (shared/sections.js) for the schema's section inputs. */
export function sectionProperties(i) {
  const major = (s) => ({ i: s.iMajor, c: s.cMajor, area: s.area });
  switch (i.section) {
    case 'rectangle':
      return major(rectangleSection(i.width_m, i.height_m));
    case 'hollow_rectangle':
      return major(hollowRectangleSection(i.width_m, i.height_m, i.wall_m));
    case 'circle':
      return major(circleSection(i.diameter_m));
    case 'hollow_circle':
      return major(hollowCircleSection(i.diameter_m, i.wall_m));
    case 'i_beam':
      return major(iSection(i.width_m, i.height_m, i.flange_m, i.web_m));
    case 'custom':
      return { i: assertPositive(i.i_custom_m4, 'i_custom_m4', 'Second moment of area'), c: assertPositive(i.c_custom_m, 'c_custom_m', 'Distance to extreme fibre'), area: null };
    default:
      throw new Error(`Unknown section "${i.section}"`);
  }
}

/**
 * Closed-form beam solution for one load case (Gere Appendix G / Roark Table 8.1).
 * @returns {{ mMax, mLocation, deltaMax, deltaLocation, reactionA, reactionB }}
 */
export function solveBeam(loadCase, { L, P = 0, w = 0, a = 0, EI }) {
  switch (loadCase) {
    case 'ss_point_center':
      return { mMax: (P * L) / 4, mLocation: 'at midspan', deltaMax: (P * L ** 3) / (48 * EI), deltaLocation: 'at midspan', reactionA: P / 2, reactionB: P / 2 };
    case 'ss_point_at_a': {
      const b = L - a;
      const reactionA = (P * b) / L;
      const reactionB = (P * a) / L;
      const mMax = (P * a * b) / L;
      // Max deflection lies on the longer segment, at x = sqrt((L² − s²)/3) from the far support, where s is the shorter distance.
      const shorter = Math.min(a, b);
      const xFromFarSupport = Math.sqrt((L * L - shorter * shorter) / 3);
      const deltaMax = (P * shorter * (L * L - shorter * shorter) ** 1.5) / (9 * Math.sqrt(3) * EI * L);
      const xFromLeft = a >= b ? xFromFarSupport : L - xFromFarSupport;
      return { mMax, mLocation: `under the load, ${a.toFixed(3)} m from the left support`, deltaMax, deltaLocation: `${xFromLeft.toFixed(3)} m from the left support`, reactionA, reactionB };
    }
    case 'ss_udl':
      return { mMax: (w * L * L) / 8, mLocation: 'at midspan', deltaMax: (5 * w * L ** 4) / (384 * EI), deltaLocation: 'at midspan', reactionA: (w * L) / 2, reactionB: (w * L) / 2 };
    case 'cant_point_end':
      return { mMax: P * L, mLocation: 'at the fixed end', deltaMax: (P * L ** 3) / (3 * EI), deltaLocation: 'at the free end', reactionA: P, reactionB: null };
    case 'cant_point_at_a':
      return { mMax: P * a, mLocation: 'at the fixed end', deltaMax: (P * a * a * (3 * L - a)) / (6 * EI), deltaLocation: 'at the free end', reactionA: P, reactionB: null };
    case 'cant_udl':
      return { mMax: (w * L * L) / 2, mLocation: 'at the fixed end', deltaMax: (w * L ** 4) / (8 * EI), deltaLocation: 'at the free end', reactionA: w * L, reactionB: null };
    case 'ff_point_center':
      return { mMax: (P * L) / 8, mLocation: 'at both fixed ends and at midspan (equal magnitude)', deltaMax: (P * L ** 3) / (192 * EI), deltaLocation: 'at midspan', reactionA: P / 2, reactionB: P / 2 };
    case 'ff_udl':
      return { mMax: (w * L * L) / 12, mLocation: 'at the fixed ends (midspan moment is w L² / 24)', deltaMax: (w * L ** 4) / (384 * EI), deltaLocation: 'at midspan', reactionA: (w * L) / 2, reactionB: (w * L) / 2 };
    default:
      throw new Error(`Unknown load case "${loadCase}"`);
  }
}

/**
 * Shear V(x), bending moment M(x) and deflection y(x) along the beam, closed form for each case (Gere Appendix G).
 * x from the left support or the fixed end; V by the left-hand convention (upward on the left part positive),
 * M sagging positive, y downward positive.
 */
export function beamDiagrams(loadCase, { L, P = 0, w = 0, a = 0, EI }, n = 101) {
  const at = (x) => {
    switch (loadCase) {
      case 'ss_point_center': case 'ss_point_at_a': {
        const pa = loadCase === 'ss_point_center' ? L / 2 : a;
        const b = L - pa;
        const ra = (P * b) / L;
        const left = x <= pa;
        return {
          V: left ? ra : ra - P,
          M: left ? ra * x : ra * x - P * (x - pa),
          y: left ? (P * b * x * (L * L - b * b - x * x)) / (6 * L * EI) : (P * pa * (L - x) * (L * L - pa * pa - (L - x) ** 2)) / (6 * L * EI),
        };
      }
      case 'ss_udl':
        return { V: w * (L / 2 - x), M: (w * x * (L - x)) / 2, y: (w * x * (L ** 3 - 2 * L * x * x + x ** 3)) / (24 * EI) };
      case 'cant_point_end': case 'cant_point_at_a': {
        const pa = loadCase === 'cant_point_end' ? L : a;
        const left = x <= pa;
        return { V: left ? P : 0, M: left ? -P * (pa - x) : 0, y: left ? (P * x * x * (3 * pa - x)) / (6 * EI) : (P * pa * pa * (3 * x - pa)) / (6 * EI) };
      }
      case 'cant_udl':
        return { V: w * (L - x), M: (-w * (L - x) ** 2) / 2, y: (w * x * x * (6 * L * L - 4 * L * x + x * x)) / (24 * EI) };
      case 'ff_point_center': {
        const xs = Math.min(x, L - x);
        return { V: x <= L / 2 ? P / 2 : -P / 2, M: (-P * L) / 8 + (P * xs) / 2, y: (P * xs * xs * (3 * L - 4 * xs)) / (48 * EI) };
      }
      case 'ff_udl':
        return { V: w * (L / 2 - x), M: (w * (6 * L * x - 6 * x * x - L * L)) / 12, y: (w * x * x * (L - x) ** 2) / (24 * EI) };
      default:
        throw new Error(`Unknown load case "${loadCase}"`);
    }
  };
  const xs = Array.from({ length: n }, (_, k) => (L * k) / (n - 1));
  const pa = loadCase === 'ss_point_center' || loadCase === 'ff_point_center' ? L / 2 : loadCase === 'cant_point_end' ? L : a;
  if (/point/.test(loadCase) && pa > 0 && pa < L) xs.push(pa - 1e-9 * L, pa + 1e-9 * L); // the jump in shear under a point load
  xs.sort((p, q) => p - q);
  return xs.map((x) => ({ x, ...at(x) }));
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.load_case, Object.keys(LOAD_CASES), 'load_case', 'Load case');
  assertOneOf(i.section, Object.keys(SECTIONS), 'section', 'Cross-section');
  assertOneOf(i.material, Object.keys(MATERIALS), 'material', 'Material');
  assertPositive(i.length_m, 'length_m', 'Span');
  assertPositive(i.yield_pa, 'yield_pa', 'Yield strength');
  const loadType = LOAD_CASES[i.load_case].load;
  if (loadType === 'udl') assertNonNegative(i.udl_n_m, 'udl_n_m', 'Distributed load');
  else assertNonNegative(i.point_load_n, 'point_load_n', 'Point load');
  if (loadType === 'point_at_a') assertRange(i.load_position_m, 0, i.length_m, 'load_position_m', 'Load position');

  for (const id of ['width_m', 'height_m', 'wall_m', 'diameter_m', 'flange_m', 'web_m']) assertPositive(i[id], id, id);
  const e = i.material === 'custom' ? assertPositive(i.e_pa, 'e_pa', "Young's modulus") : MATERIALS[i.material].e;
  const section = sectionProperties(i);
  const EI = e * section.i;

  const beam = solveBeam(i.load_case, { L: i.length_m, P: i.point_load_n, w: i.udl_n_m, a: i.load_position_m, EI });
  const sigma = (beam.mMax * section.c) / section.i;
  const diagram = beamDiagrams(i.load_case, { L: i.length_m, P: i.point_load_n, w: i.udl_n_m, a: i.load_position_m, EI });
  const utilisation = (sigma / i.yield_pa) * 100;

  const warnings = [];
  if (sigma > i.yield_pa) warnings.push('Bending stress exceeds the yield strength: the elastic formulas no longer apply and the beam would yield.');
  const depth = section.c * 2;
  if (i.length_m / depth < 10) warnings.push('Span-to-depth ratio below 10: shear deflection (neglected here) adds roughly 10 % or more to the deflection.');
  if (beam.deltaMax > i.length_m / 100) warnings.push('Deflection exceeds span/100: the small-deflection assumption is strained and serviceability limits (typically span/250 to span/360) are exceeded.');
  if (i.section === 'i_beam') warnings.push('I-section I ignores root fillets and is about 5 % below rolled-section tables; use a custom I for a tabulated profile.');
  if (i.section === 'i_beam' || i.section === 'hollow_rectangle' || i.section === 'rectangle') warnings.push('Lateral-torsional buckling of the compression flange is not checked; verify it for unrestrained spans per the design code.');

  return {
    outputs: {
      i_m4: section.i,
      z_m3: section.i / section.c,
      area_m2: section.area,
      reaction_a_n: beam.reactionA,
      reaction_b_n: beam.reactionB,
      m_max_nm: beam.mMax,
      m_location: beam.mLocation,
      sigma_max_pa: sigma,
      delta_max_m: beam.deltaMax,
      delta_location: beam.deltaLocation,
      span_over_deflection: beam.deltaMax > 0 ? i.length_m / beam.deltaMax : null,
      utilisation_pct: utilisation,
      safety_factor: sigma > 0 ? i.yield_pa / sigma : null,
      shear_diagram: { points: diagram.map((d) => ({ x: d.x, y: d.V / 1000 })), xLabel: 'Position along the beam', xUnit: 'm', yLabel: 'Shear force V', yUnit: 'kN' },
      moment_diagram: { points: diagram.map((d) => ({ x: d.x, y: d.M / 1000 })), xLabel: 'Position along the beam', xUnit: 'm', yLabel: 'Bending moment M (sagging +)', yUnit: 'kN·m' },
      deflection_diagram: { points: diagram.map((d) => ({ x: d.x, y: -d.y * 1000 })), xLabel: 'Position along the beam', xUnit: 'm', yLabel: 'Deflection (down −)', yUnit: 'mm' },
    },
    warnings,
  };
}
