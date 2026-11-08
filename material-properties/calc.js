/**
 * material-properties/calc.js — reference properties of common engineering materials (structural steels, stainless
 * steels, aluminium alloys, copper, brass, titanium, cast iron, concrete, timber, glass and plastics): density, Young's
 * modulus, yield or proof strength, tensile strength, thermal expansion, thermal conductivity, specific heat and melting
 * range, each from a cited standard or data sheet; with the mass of a given volume and the specific stiffness E/ρ and
 * specific strength f/ρ.
 *
 * m = ρ V;  specific stiffness = E / ρ (J/kg);  specific strength = f / ρ (J/kg).
 * Schema units: SI — kg/m³, Pa, 1/K, W/(m·K), J/(kg·K), m³, kg, J/kg.
 */
import { withDefaults, assertOneOf, assertNonNegative } from '../shared/validate.js';

// EN 1993-1-2 §3.4.1.2–3: carbon steel at 20 °C, λ = 54 − 3.33e-2 θ and c = 425 + 0.773 θ − 1.69e-3 θ² + 2.22e-6 θ³.
const STEEL_K = 54 - 3.33e-2 * 20;
const STEEL_CP = 425 + 7.73e-1 * 20 - 1.69e-3 * 20 ** 2 + 2.22e-6 * 20 ** 3;
const KSI = 6.894757293168;

/**
 * Each material: density kg/m³, E GPa, yield/proof MPa, tensile MPa, α µm/(m·K), k W/(m·K), c J/(kg·K) (null when no
 * cited value), melting range text, the basis of the strength values, and the source.
 */
export const MATERIALS = {
  s235: { label: 'Structural steel S235 (EN 10025-2)', rho: 7850, e: 210, fy: 235, fu: 360, alpha: 12, k: STEEL_K, cp: STEEL_CP, melt: null,
    basis: 'fy and fu for t ≤ 40 mm, EN 1993-1-1 Table 3.1 (215 and 360 MPa for 40 < t ≤ 80 mm)', src: 'EN 1993-1-1 Table 3.1 and §3.2.6; EN 1993-1-2 §3.4.1 (k, c at 20 °C)' },
  s355: { label: 'Structural steel S355 (EN 10025-2)', rho: 7850, e: 210, fy: 355, fu: 490, alpha: 12, k: STEEL_K, cp: STEEL_CP, melt: null,
    basis: 'fy and fu for t ≤ 40 mm, EN 1993-1-1 Table 3.1 (335 and 470 MPa for 40 < t ≤ 80 mm)', src: 'EN 1993-1-1 Table 3.1 and §3.2.6; EN 1993-1-2 §3.4.1 (k, c at 20 °C)' },
  a36: { label: 'Structural steel ASTM A36', rho: 7850, e: 200, fy: 36 * KSI, fu: 58 * KSI, alpha: 11.7, k: STEEL_K, cp: STEEL_CP, melt: null,
    basis: 'Minimum Fy 36 ksi and Fu 58 ksi (Fu range 58–80 ksi); E = 29 000 ksi', src: 'ASTM A36; AISC Steel Construction Manual, Part 2 (E, α); EN 1993-1-2 (k, c)' },
  a572: { label: 'Structural steel ASTM A572 Grade 50', rho: 7850, e: 200, fy: 50 * KSI, fu: 65 * KSI, alpha: 11.7, k: STEEL_K, cp: STEEL_CP, melt: null,
    basis: 'Minimum Fy 50 ksi and Fu 65 ksi; E = 29 000 ksi', src: 'ASTM A572; AISC Steel Construction Manual, Part 2 (E, α); EN 1993-1-2 (k, c)' },
  ss304: { label: 'Stainless steel 304 / 1.4301', rho: 8030, e: 193, fy: 205, fu: 515, alpha: 16.9, k: 16.2, cp: 500, melt: '1 399–1 454 °C',
    basis: 'Annealed plate, sheet and strip, ASTM A240 minimum 0.2 % proof and tensile strength; α 0–100 °C; k at 100 °C', src: 'Cleveland-Cliffs 304/304L product data bulletin; ASTM A240' },
  ss316: { label: 'Stainless steel 316 / 1.4401', rho: 8030, e: 193, fy: 205, fu: 515, alpha: 16.0, k: 16.2, cp: 500, melt: '1 371–1 399 °C',
    basis: 'Annealed plate, sheet and strip, ASTM A240 minimum 0.2 % proof and tensile strength; α 0–100 °C; k at 100 °C', src: 'Cleveland-Cliffs 316/316L product data bulletin; ASTM A240' },
  al6061: { label: 'Aluminium 6061-T6', rho: 2700, e: 68.9, fy: 276, fu: 310, alpha: 23.6, k: 167, cp: 896, melt: '582–652 °C',
    basis: 'Typical values (Aluminum Association); ASTM B209 minimums are lower (240 and 290 MPa)', src: 'ASM Aerospace Specification Metals / Aluminum Association data sheet, 6061-T6' },
  al6082: { label: 'Aluminium 6082-T6 (EN AW-6082)', rho: 2700, e: 70, fy: 260, fu: 310, alpha: 23, k: null, cp: null, melt: null,
    basis: 'Characteristic f0 and fu, sheet and plate t ≤ 6 mm (255 and 300 MPa for 6–12.5 mm); extrusions 250/290 MPa for t ≤ 5 mm', src: 'EN 1999-1-1 Tables 3.2a and 3.2b, §3.2.5 (E, α, ρ)' },
  al5083: { label: 'Aluminium 5083-O/H111 (EN AW-5083)', rho: 2700, e: 70, fy: 125, fu: 275, alpha: 23, k: null, cp: null, melt: null,
    basis: 'Characteristic f0 and fu, sheet and plate t < 50 mm (115 and 270 MPa for 50–80 mm)', src: 'EN 1999-1-1 Table 3.2a, §3.2.5 (E, α, ρ)' },
  copper: { label: 'Copper C11000 (ETP), annealed', rho: 8910, e: 17000 * KSI / 1000, fy: 69, fu: 221, alpha: 9.4 * 1.8, k: 226 * 1.730735, cp: 0.092 * 4186.8, melt: '1 065–1 083 °C',
    basis: 'Typical, annealed (OS050) rod and strip; yield at 0.5 % extension under load', src: 'National Bronze & Metals data sheet C11000 (Copper Development Association data)' },
  brass: { label: 'Brass C26000 (cartridge brass 70/30), annealed', rho: 8530, e: 16000 * KSI / 1000, fy: 103, fu: 324, alpha: 11.1 * 1.8, k: 70 * 1.730735, cp: 0.09 * 4186.8, melt: '916–954 °C',
    basis: 'Typical, annealed (OS050) strip; yield at 0.5 % extension; α 20–300 °C', src: 'National Bronze & Metals data sheet C26000 (Copper Development Association data)' },
  ti2: { label: 'Titanium Grade 2 (commercially pure)', rho: 4510, e: 105, fy: 275, fu: 344, alpha: 8.6, k: 16.4, cp: 523, melt: '1 665 °C',
    basis: 'Annealed; yield range 275–410 MPa (275 = ASTM B265 minimum), typical tensile', src: 'ASM Aerospace Specification Metals data sheet, Titanium Grade 2; ASTM B265' },
  ti64: { label: 'Titanium Ti-6Al-4V (Grade 5), annealed', rho: 4430, e: 113.8, fy: 828, fu: 895, alpha: 8.6, k: 6.7, cp: 526, melt: '1 604–1 660 °C',
    basis: 'ASTM B265/B348 Grade 5 minimum strength; physical data for annealed Ti-6Al-4V', src: 'ASM Aerospace Specification Metals data sheet, Ti-6Al-4V annealed; ASTM B265, B348' },
  castiron: { label: 'Grey cast iron EN-GJL-250', rho: 7200, e: 103, fy: null, fu: 250, alpha: null, k: null, cp: null, melt: null,
    basis: 'Minimum tensile strength of separately cast test pieces (250–350 MPa); no yield point; E 103–118 GPa (lower value shown)', src: 'EN 1561 (tensile strength); Kipp and Total Materia data for EN-GJL-250 (density, E)' },
  concrete: { label: 'Concrete C30/37', rho: 2400, e: 33, fy: null, fu: 2.9, alpha: 10, k: 2 - 0.2451 * 0.2 + 0.0107 * 0.04, cp: 900, melt: null,
    basis: 'Compressive strength fck = 30 MPa (cylinder); tensile value is the mean axial tensile strength fctm; E = Ecm; k is the upper limit at 20 °C (lower limit 1.33)', src: 'EN 1992-1-1 Table 3.1 and §3.1.3; EN 1991-1-1 Table A.1 (density); EN 1992-1-2 §3.3 (k, c)' },
  c24: { label: 'Softwood timber C24', rho: 420, e: 11, fy: null, fu: 14.5, alpha: null, k: null, cp: null, melt: null,
    basis: 'Mean density; E0,mean parallel to grain; tensile value is the characteristic tension strength ft,0,k (bending fm,k = 24 MPa, compression fc,0,k = 21 MPa)', src: 'EN 338:2016 Table 1' },
  glass: { label: 'Soda-lime float glass (annealed)', rho: 2500, e: 70, fy: null, fu: 45, alpha: 9, k: 1.0, cp: 720, melt: null,
    basis: 'Brittle, no yield; strength shown is the characteristic bending strength fg,k of annealed glass; ν = 0.2; α 20–300 °C', src: 'EN 572-1 §6; AGC Planibel technical data sheet' },
  pvc: { label: 'Rigid PVC-U', rho: 1440, e: 3.0, fy: 55, fu: null, alpha: 75, k: 0.16, cp: null, melt: null,
    basis: 'Typical yield stress (ISO 527) of PVC-U sheet; amorphous, no melting point; maximum long-term service about 60 °C', src: 'Angst+Pfister APSOplast PVC-U technical data sheet' },
  hdpe: { label: 'HDPE (high-density polyethylene)', rho: 950, e: 1.1, fy: 23, fu: null, alpha: 180, k: 0.38, cp: null, melt: null,
    basis: 'Typical yield stress (ISO 527) of PE-HD sheet; service −50 to +80 °C', src: 'S-Polytec PE-HD sheet technical data sheet' },
  pa66: { label: 'Nylon PA66 (unfilled)', rho: 1140, e: 350 * KSI / 1000, fy: 12 * KSI, fu: 12.3 * KSI, alpha: 4.5e-5 * 1.8 * 1e6, k: null, cp: 0.4 * 4186.8, melt: '255 °C',
    basis: 'Typical, dry as moulded, ASTM D638; strength and stiffness fall with absorbed moisture', src: 'Ensinger TECAMID 66 natural stock-shapes data sheet' },
};

const OPTIONS = Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label }));

export const schema = {
  id: 'material-properties',
  name: 'Material properties table (steel, aluminium, plastics)',
  category: 'mechanical',
  summary: 'Density, Young\'s modulus, yield and tensile strength, thermal expansion, conductivity, specific heat and melting range of common materials, with mass.',
  related: ['stress-strain', 'elastic-constants', 'metal-weight', 'thermal-expansion'],
  assumptions: [
    'Each value comes from the standard or data sheet named with the material: code minimums or characteristic values for structural steels, aluminium (EN 1999-1-1), stainless steel (ASTM A240), concrete and timber, and typical data-sheet values for copper, brass, 6061-T6, titanium physical data and plastics. The basis line says which.',
    'Strengths are room-temperature values for the product form and thickness stated; thicker sections, other tempers, welding and higher temperatures lower them. Use the mill certificate or the design code for a real design.',
    'Physical properties are at about 20 °C (expansion over the range stated). A dash means no cited value is held for that property rather than a guess.',
    'Mass is density × volume; specific stiffness E/ρ and specific strength f/ρ use the yield strength, or the tensile or characteristic strength where no yield is defined.',
  ],
  notes: [
    'Verification 2026-11-08: 2 L of 6061-T6 has a mass of 5.40 kg; E/ρ = 68.9 GPa / 2 700 = 25.52 MJ/kg; 276 MPa / 2 700 = 102.2 kJ/kg. S355: E/ρ = 26.75 MJ/kg and 45.2 kJ/kg. Checked by hand.',
    'Table provenance: EN 1993-1-1 Table 3.1 S355 fu = 490 MPa for t ≤ 40 mm was confirmed against a published implementation of the table (blueprints, EN 1993-1-1:2005 Table 3.1); EN 1999-1-1 Tables 3.2a/b from a reproduction of the standard; stainless physical data read from the Cleveland-Cliffs 304/304L and 316/316L bulletins (2021); copper and brass from the National Bronze data sheets (k 226 and 70 Btu·ft/(h·ft²·°F), α 9.40 and 11.1 µin/(in·°F), c 0.092 and 0.090 Btu/(lb·°F) converted); titanium from the ASM Aerospace Specification Metals data sheets; glass from the AGC Planibel data sheet (2 500 kg/m³, 70 GPa, 9e-6/K, 720 J/(kg·K)).',
    'Design decision: no melting range, conductivity or expansion is shown for the carbon steels, the EN aluminium alloys, cast iron and timber, because no source read for this page states them for those grades.',
  ],
  sources: [
    'EN 1993-1-1:2005 Table 3.1 and §3.2.6; EN 1993-1-2:2005 §3.4.1 (thermal properties of carbon steel); EN 1999-1-1:2007 Tables 3.2a, 3.2b and §3.2.5',
    'EN 1992-1-1:2004 Table 3.1 and §3.1.3; EN 1992-1-2:2004 §3.3; EN 1991-1-1 Table A.1; EN 338:2016 Table 1; EN 572-1 §6',
    'ASTM A36, A572, A240, B265, B348; Cleveland-Cliffs 304/304L and 316/316L product data bulletins (2021); ASM Aerospace Specification Metals data sheets (6061-T6, Ti Grade 2, Ti-6Al-4V)',
    'National Bronze & Metals C11000 and C26000 data sheets; Ensinger TECAMID 66, Angst+Pfister APSOplast PVC-U and S-Polytec PE-HD technical data sheets',
  ],
  inputs: [
    { id: 'material', label: 'Material', type: 'select', default: 'al6061', options: OPTIONS },
    { id: 'volume_m3', label: 'Volume (optional, for the mass)', group: 'volume', unit: 'm3', display: 'L', default: 0.002, min: 0, max: 1e4 },
  ],
  outputs: [
    { id: 'density', label: 'Density ρ', group: 'density', unit: 'kg_m3' },
    { id: 'modulus_pa', label: 'Young\'s modulus E', group: 'pressure', unit: 'Pa', display: 'GPa' },
    { id: 'yield_pa', label: 'Yield or 0.2 % proof strength', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'tensile_pa', label: 'Tensile strength (or characteristic strength, see basis)', group: 'pressure', unit: 'Pa', display: 'MPa' },
    { id: 'alpha_per_k', label: 'Thermal expansion coefficient α', group: 'thermal_expansion', unit: 'per_K', display: 'ppm_K' },
    { id: 'k_w_mk', label: 'Thermal conductivity', group: 'thermal_conductivity', unit: 'W_mK' },
    { id: 'cp_j_kgk', label: 'Specific heat', group: 'specific_heat', unit: 'J_kgK' },
    { id: 'melting', label: 'Melting range', type: 'text' },
    { id: 'basis', label: 'Basis of the values', type: 'text' },
    { id: 'source', label: 'Source', type: 'text' },
    { id: 'mass_kg', label: 'Mass of the volume', group: 'mass', unit: 'kg' },
    { id: 'specific_stiffness', label: 'Specific stiffness E/ρ', group: 'specific_energy', unit: 'J_kg', display: 'MJ_kg' },
    { id: 'specific_strength', label: 'Specific strength f/ρ', group: 'specific_energy', unit: 'J_kg', display: 'kJ_kg' },
  ],
  example: {
    inputs: { material: 'al6061', volume_m3: [2, 'L'] },
    results: { mass_kg: '5.40 kg', specific_stiffness: '25.52 MJ/kg', specific_strength: '102.2 kJ/kg' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.material, Object.keys(MATERIALS), 'material', 'Material');
  const v = assertNonNegative(x.volume_m3, 'volume_m3', 'Volume');
  const m = MATERIALS[x.material];
  const strength = m.fy ?? m.fu;
  const warnings = [];
  if (['pvc', 'hdpe', 'pa66'].includes(x.material)) warnings.push('Plastics creep under sustained load and lose stiffness as they warm: short-term data-sheet values overstate long-term strength and stiffness.');
  if (['castiron', 'concrete', 'glass'].includes(x.material)) warnings.push('Brittle material: there is no yield point, and the tensile strength depends strongly on flaws and section size.');
  return {
    outputs: {
      density: m.rho,
      modulus_pa: m.e * 1e9,
      yield_pa: m.fy === null ? null : m.fy * 1e6,
      tensile_pa: m.fu === null ? null : m.fu * 1e6,
      alpha_per_k: m.alpha === null ? null : m.alpha * 1e-6,
      k_w_mk: m.k,
      cp_j_kgk: m.cp,
      melting: m.melt ?? 'not stated in the sources used',
      basis: m.basis,
      source: m.src,
      mass_kg: v > 0 ? m.rho * v : null,
      specific_stiffness: (m.e * 1e9) / m.rho,
      specific_strength: (strength * 1e6) / m.rho,
    },
    warnings,
  };
}
