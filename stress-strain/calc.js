/**
 * stress-strain/calc.js — axial stress, strain and elongation of a bar in tension or compression (Hooke's law), solving
 * for the elongation, the force, Young's modulus, the area needed for an allowable stress, or the original length.
 *
 * σ = F / A;  ε = ΔL / L;  σ = E ε  →  ΔL = F L / (A E);  axial stiffness k = E A / L.
 * Schema units: SI — N, m², m, Pa.
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';

/** Young's modulus (GPa) and yield or proof strength (MPa, null if none) of the materials offered, with the source. */
export const MATERIALS = {
  steel_en: { label: 'Structural steel, Eurocode (E = 210 GPa)', e: 210, fy: 235, src: 'EN 1993-1-1 §3.2.6; fy of S235' },
  steel_aisc: { label: 'Structural steel, AISC (E = 200 GPa)', e: 200, fy: 248.2, src: 'AISC Manual (29 000 ksi); Fy of A36' },
  stainless: { label: 'Stainless steel 304 or 316 (193 GPa)', e: 193, fy: 205, src: 'Cleveland-Cliffs data bulletins; ASTM A240' },
  aluminium: { label: 'Aluminium alloy, Eurocode (70 GPa)', e: 70, fy: 125, src: 'EN 1999-1-1 §3.2.5; f0 of 5083-O' },
  al6061: { label: 'Aluminium 6061-T6 (68.9 GPa)', e: 68.9, fy: 276, src: 'ASM / Aluminum Association typical values' },
  copper: { label: 'Copper C11000 (117 GPa)', e: 117.2, fy: 69, src: 'National Bronze C11000 data sheet (17 000 ksi)' },
  brass: { label: 'Brass C26000 (110 GPa)', e: 110.3, fy: 103, src: 'National Bronze C26000 data sheet (16 000 ksi)' },
  titanium: { label: 'Titanium Grade 2 (105 GPa)', e: 105, fy: 275, src: 'ASM Aerospace Specification Metals, Ti Grade 2' },
  ti64: { label: 'Titanium Ti-6Al-4V (113.8 GPa)', e: 113.8, fy: 828, src: 'ASM data sheet; ASTM B265 Grade 5 minimum fy' },
  castiron: { label: 'Grey cast iron EN-GJL-250 (103 GPa)', e: 103, fy: null, src: 'Lower value of 103–118 GPa for EN-GJL-250' },
  concrete: { label: 'Concrete C30/37 (Ecm 33 GPa)', e: 33, fy: null, src: 'EN 1992-1-1 Table 3.1' },
  timber: { label: 'Softwood timber C24 (11 GPa)', e: 11, fy: null, src: 'EN 338:2016, E0,mean' },
  glass: { label: 'Soda-lime glass (70 GPa)', e: 70, fy: null, src: 'AGC Planibel data sheet; EN 572-1' },
  pvc: { label: 'Rigid PVC-U (3.0 GPa)', e: 3.0, fy: 55, src: 'APSOplast PVC-U data sheet' },
  hdpe: { label: 'HDPE (1.1 GPa)', e: 1.1, fy: 23, src: 'S-Polytec PE-HD data sheet' },
  custom: { label: 'Other: enter E', e: null, fy: null, src: null },
};

export const schema = {
  id: 'stress-strain',
  name: 'Stress and strain calculator (Young\'s modulus)',
  category: 'mechanical',
  summary: 'Axial stress, strain and elongation of a bar from force, area, length and Young\'s modulus, or solve for the force, modulus, area or length.',
  related: ['elastic-constants', 'material-properties', 'thermal-expansion', 'mohr-circle'],
  assumptions: [
    'The bar is straight and prismatic and the load acts along its axis, so the stress is uniform over the section: σ = F/A. Near holes, notches, threads and the load points the local stress is higher.',
    'The material is linear elastic (Hooke\'s law σ = E ε) up to its yield or proportional limit; the calculator warns when the stress exceeds the yield or proof strength held for the material, beyond which the elongation is wrong.',
    'Strain is engineering strain, ΔL divided by the original length; the change in area with Poisson\'s ratio is neglected (true stress exceeds engineering stress by the strain itself, under 1 % in the elastic range of metals).',
    'Compression uses the same formulas, but a slender bar buckles before it reaches these stresses; check buckling separately.',
    'Moduli are the values of the cited standards and data sheets (steel 210 GPa in Eurocode, 200 GPa in AISC); real values scatter by a few per cent.',
  ],
  notes: [
    'Verification 2026-11-08: a 20 mm steel rod 2 m long carrying 50 kN (E = 210 GPa): A = 314.16 mm², σ = 159.2 MPa, ε = 7.58 × 10⁻⁴ (0.0758 %), ΔL = 1.516 mm, axial stiffness 32.99 kN/mm. Checked by hand.',
  ],
  sources: [
    'Hibbeler, Mechanics of Materials, 10th ed., ch. 1–4 (normal stress σ = P/A, Hooke\'s law, axial deformation δ = PL/(AE), eq. 4-2)',
    'Gere and Goodno, Mechanics of Materials, 9th ed., §1.4 and §2.2 (stress, strain, δ = PL/EA, axial stiffness k = EA/L)',
    'EN 1993-1-1:2005 §3.2.6 (E = 210 GPa for steel) and EN 1999-1-1:2007 §3.2.5 (E = 70 GPa for aluminium)',
  ],
  inputs: [
    {
      id: 'mode', label: 'Solve for', type: 'select', default: 'elongation',
      options: [
        { value: 'elongation', label: 'Stress, strain and elongation (from force)' },
        { value: 'force', label: 'Force (from a measured elongation)' },
        { value: 'modulus', label: 'Young\'s modulus (from force and elongation)' },
        { value: 'area', label: 'Area needed for an allowable stress' },
        { value: 'length', label: 'Original length (from force and elongation)' },
      ],
    },
    { id: 'material', label: 'Material (Young\'s modulus E)', type: 'select', default: 'steel_en', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })), visibleWhen: { mode: ['elongation', 'force', 'area', 'length'] } },
    { id: 'modulus_pa', label: 'Young\'s modulus E', group: 'pressure', unit: 'Pa', display: 'GPa', default: 200e9, min: 1e6, max: 1.2e12, visibleWhen: { material: 'custom' } },
    { id: 'section', label: 'Cross-section given as', type: 'select', default: 'round', options: [{ value: 'round', label: 'Solid round bar: diameter' }, { value: 'area', label: 'Area' }], visibleWhen: { mode: ['elongation', 'force', 'modulus', 'length'] } },
    { id: 'diameter_m', label: 'Bar diameter d', group: 'length', unit: 'm', display: 'mm', default: 0.02, min: 1e-5, max: 10, visibleWhen: { section: 'round', mode: ['elongation', 'force', 'modulus', 'length'] } },
    { id: 'area_m2', label: 'Cross-section area A', group: 'area', unit: 'm2', display: 'mm2', default: 314.159e-6, min: 1e-10, max: 100, visibleWhen: { section: 'area', mode: ['elongation', 'force', 'modulus', 'length'] } },
    { id: 'force_n', label: 'Axial force F', group: 'force', unit: 'N', display: 'kN', default: 50000, min: 1e-6, max: 1e10, visibleWhen: { mode: ['elongation', 'modulus', 'area', 'length'] } },
    { id: 'length_m', label: 'Original length L', group: 'length', unit: 'm', default: 2, min: 1e-6, max: 10000, visibleWhen: { mode: ['elongation', 'force', 'modulus', 'area'] } },
    { id: 'elongation_m', label: 'Elongation ΔL', group: 'length', unit: 'm', display: 'mm', default: 0.001, min: 1e-12, max: 100, visibleWhen: { mode: ['force', 'modulus', 'length'] } },
    { id: 'allow_pa', label: 'Allowable stress σ_allow', group: 'pressure', unit: 'Pa', display: 'MPa', default: 150e6, min: 1, max: 1e10, visibleWhen: { mode: 'area' } },
  ],
  outputs: [
    { id: 'stress_pa', label: 'Normal stress σ = F/A', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'strain', label: 'Strain ε = ΔL/L', group: 'ratio', unit: 'frac', display: 'pct', decimals: 4 },
    { id: 'elongation_out_m', label: 'Elongation ΔL', group: 'length', unit: 'm', display: 'mm' },
    { id: 'force_out_n', label: 'Axial force F', group: 'force', unit: 'N', display: 'kN' },
    { id: 'modulus_out_pa', label: 'Young\'s modulus E', group: 'pressure', unit: 'Pa', display: 'GPa' },
    { id: 'area_out_m2', label: 'Cross-section area A', group: 'area', unit: 'm2', display: 'mm2' },
    { id: 'diameter_out_m', label: 'Equivalent solid round bar diameter', group: 'length', unit: 'm', display: 'mm' },
    { id: 'length_out_m', label: 'Original length L', group: 'length', unit: 'm' },
    { id: 'stiffness_n_m', label: 'Axial stiffness k = EA/L', group: 'stiffness', unit: 'N_m', display: 'kN_m' },
  ],
  example: {
    inputs: { mode: 'elongation', material: 'steel_en', section: 'round', diameter_m: [20, 'mm'], force_n: [50, 'kN'], length_m: [2, 'm'] },
    results: { area_out_m2: '314.16 mm²', stress_pa: '159.2 MPa', strain: '0.0758 %', elongation_out_m: '1.516 mm' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['elongation', 'force', 'modulus', 'area', 'length'], 'mode', 'Solve for');
  assertOneOf(x.section, ['round', 'area'], 'section', 'Cross-section given as');
  let E = null;
  let fy = null;
  if (x.mode !== 'modulus') {
    assertOneOf(x.material, Object.keys(MATERIALS), 'material', 'Material');
    const m = MATERIALS[x.material];
    E = m.e === null ? assertPositive(x.modulus_pa, 'modulus_pa', 'Young\'s modulus') : m.e * 1e9;
    fy = m.fy === null ? null : m.fy * 1e6;
  }
  let A;
  if (x.mode === 'area') {
    A = assertPositive(x.force_n, 'force_n', 'Axial force') / assertPositive(x.allow_pa, 'allow_pa', 'Allowable stress');
  } else if (x.section === 'round') {
    A = (Math.PI / 4) * assertPositive(x.diameter_m, 'diameter_m', 'Bar diameter') ** 2;
  } else {
    A = assertPositive(x.area_m2, 'area_m2', 'Cross-section area');
  }
  let F; let L; let dL;
  if (x.mode === 'elongation' || x.mode === 'area') {
    F = assertPositive(x.force_n, 'force_n', 'Axial force');
    L = assertPositive(x.length_m, 'length_m', 'Original length');
    dL = (F * L) / (A * E);
  } else if (x.mode === 'force') {
    L = assertPositive(x.length_m, 'length_m', 'Original length');
    dL = assertPositive(x.elongation_m, 'elongation_m', 'Elongation');
    F = (E * A * dL) / L;
  } else if (x.mode === 'modulus') {
    F = assertPositive(x.force_n, 'force_n', 'Axial force');
    L = assertPositive(x.length_m, 'length_m', 'Original length');
    dL = assertPositive(x.elongation_m, 'elongation_m', 'Elongation');
    E = (F * L) / (A * dL);
  } else {
    F = assertPositive(x.force_n, 'force_n', 'Axial force');
    dL = assertPositive(x.elongation_m, 'elongation_m', 'Elongation');
    L = (dL * A * E) / F;
  }
  const sigma = F / A;
  const eps = dL / L;
  const warnings = [];
  if (fy !== null && sigma > fy) warnings.push('The stress exceeds the yield or proof strength held for this material: the bar yields and Hooke\'s law no longer gives the elongation.');
  if (eps > 0.01) warnings.push('Strain above 1 %: far beyond the elastic range of metals; check the inputs and units.');
  return {
    outputs: {
      stress_pa: sigma,
      strain: eps,
      elongation_out_m: dL,
      force_out_n: F,
      modulus_out_pa: E,
      area_out_m2: A,
      diameter_out_m: Math.sqrt((4 * A) / Math.PI),
      length_out_m: L,
      stiffness_n_m: (E * A) / L,
    },
    warnings,
  };
}
