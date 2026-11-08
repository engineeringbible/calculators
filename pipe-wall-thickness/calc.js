/**
 * pipe-wall-thickness/calc.js — ASME B31.3 straight pipe under internal pressure: pressure design thickness, minimum
 * required thickness with allowances, nominal thickness with the mill tolerance, the check of an available (schedule)
 * wall and its maximum allowable working pressure, hoop stress and the thin-wall validity.
 *
 * t = P D / (2 (S E W + P Y));  t_m = t + c;  t_nom ≥ t_m / (1 − tol);  MAWP = 2 S E W t_eff / (D − 2 Y t_eff),  t_eff = t_avail (1 − tol) − c
 * Schema units: bar, mm, MPa, %.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** Common pipe materials: ASME B31.3 Table A-1 basic allowable stress at 100 °C (MPa) and the Y coefficient class. */
export const MATERIALS = {
  a106_b: { label: 'ASTM A106 Gr B / A53 B carbon steel seamless — S 137.9 MPa (≤ 200 °C)', s: 137.9, y: 'ferritic' },
  a333_6: { label: 'ASTM A333 Gr 6 low-temperature carbon steel — S 137.9 MPa', s: 137.9, y: 'ferritic' },
  a312_tp316l: { label: 'ASTM A312 TP316L stainless — S 115.1 MPa (≤ 100 °C)', s: 115.1, y: 'austenitic' },
  a312_tp304: { label: 'ASTM A312 TP304 stainless — S 138 MPa (≤ 100 °C)', s: 138, y: 'austenitic' },
  cuni_9010: { label: 'Copper-nickel 90/10 (C70600) — S 68.9 MPa', s: 68.9, y: 'other_ductile' },
  custom: { label: 'Custom allowable stress', s: null, y: 'ferritic' },
};

/** B31.3 Table 304.1.1 Y coefficient for t < D/6. */
export const Y_TABLE = {
  ferritic: { label: 'Ferritic steels', y: (tC) => (tC <= 482 ? 0.4 : tC <= 510 ? 0.5 : 0.7) },
  austenitic: { label: 'Austenitic steels', y: (tC) => (tC <= 566 ? 0.4 : tC <= 593 ? 0.5 : 0.7) },
  other_ductile: { label: 'Other ductile metals', y: () => 0.4 },
  cast_iron: { label: 'Cast iron', y: () => 0.0 },
};

export const JOINT_FACTORS = {
  seamless: { label: 'Seamless pipe (E 1.00)', e: 1.0 },
  erw: { label: 'Electric resistance welded (E 0.85)', e: 0.85 },
  efw_single: { label: 'Electric fusion welded, single butt weld (E 0.80)', e: 0.8 },
  efw_double: { label: 'Electric fusion welded, double butt weld, spot radiographed (E 0.90)', e: 0.9 },
  furnace_butt: { label: 'Furnace butt welded (E 0.60)', e: 0.6 },
};

export const schema = {
  id: 'pipe-wall-thickness',
  name: 'Pipe wall thickness (ASME B31.3)',
  category: 'mechanical',
  summary: 'ASME B31.3 pressure design thickness, allowances and mill tolerance, nominal wall required, schedule check and MAWP of the available wall.',
  related: ['pressure-vessel', 'pipe-flow', 'water-hammer', 'thermal-expansion', 'bolt-torque'],
  assumptions: [
    'ASME B31.3 para. 304.1.2 for straight pipe under internal pressure with t < D/6: pressure design thickness t = P D/(2 (S E W + P Y)) using the outside diameter D, the basic allowable stress S at the design temperature (Table A-1), the longitudinal weld joint quality factor E (Table A-1B), the weld joint strength reduction factor W (1.0 below about 510 °C for most materials) and the coefficient Y from Table 304.1.1 (0.4 for ferritic steel up to 482 °C and austenitic up to 566 °C, rising to 0.5 and 0.7 at higher temperatures, 0.0 for cast iron); for t ≥ D/6 or P/(S E) > 0.385 the code requires special consideration.',
    'Minimum required thickness t_m = t + c, where c is the sum of the corrosion/erosion allowance and the mechanical allowance for threading or grooving (thread depth per ASME B1.20.1); the nominal (ordered) wall must satisfy t_nom × (1 − mill tolerance) ≥ t_m, with 12.5 % under-tolerance for seamless and most welded pipe to ASTM A106/A53/A312 (ASTM A530), 10 % or an absolute value for some plate-made pipe.',
    'MAWP of the available wall inverts the formula with the effective thickness t_eff = t_avail (1 − tol) − c: P = 2 S E W t_eff/(D − 2 Y t_eff); hoop stress at design pressure by Barlow σ = P D/(2 t_eff) is shown as a conventional check; longitudinal, bending, external pressure, thermal and occasional loads (para. 302.3.5–6) and flange ratings are separate.',
    'Allowable stresses in the material table are the Table A-1 values at or below 100–200 °C for quick sizing; at higher temperatures S falls and must be read from the table for the design temperature (custom material option); the stainless values are the lower "conservative" set, B31.3 also lists higher values where slight deformation is acceptable.',
    'Marine class rules (e.g. DNV, LR, ABS pipe thickness formulas) use the same form with their own allowances and a minimum wall by diameter; this page follows B31.3 and should be compared with the class table where the class governs.',
  ],
  notes: [
    'Verification 2026-10-31: NPS 8 (219.1 mm) A106 B seamless at 16 bar: t = 1.6 × 219.1/(2 × (137.9 + 0.64)) = 1.265 mm, t_m 2.77 mm with 1.5 mm corrosion, nominal 3.16 mm with 12.5 % tolerance; schedule 40 (8.18 mm) has MAWP 72.7 bar and the design pressure uses 22 % of it — the familiar result that process pipe in the 10–20 bar range is governed by corrosion, handling and minimum wall rather than pressure.',
    'Design decision: a short material table with Table A-1 values at low temperature and a custom entry, rather than the whole stress table; the Y coefficient is derived from the material class and the design temperature per Table 304.1.1.',
  ],
  sources: [
    'ASME B31.3-2022 Process Piping, para. 304.1.1–304.1.2 (eqs. 3a, 3b), Table 304.1.1 (Y), Table A-1 (allowable stresses), Table A-1B (E), para. 302.3.5 (W)',
    'ASTM A530/A530M — general requirements for specialized carbon and alloy steel pipe (12.5 % wall tolerance); ASTM A106, A53, A312, A333',
    'ASME B36.10M / B36.19M — welded and seamless wrought steel pipe dimensions (schedules)',
    'C. Becht IV, Process Piping: The Complete Guide to ASME B31.3, 4th ed., ASME Press 2019 — ch. 3 pressure design',
  ],
  inputs: [
    { id: 'design_pressure_bar', label: 'Internal design pressure P (gauge)', group: 'pressure', unit: 'bar', default: 16, min: 0.1, max: 1000 },
    { id: 'design_temp_c', label: 'Design temperature', group: 'temperature', unit: 'C', default: 100, min: -200, max: 800 },
    { id: 'outside_diameter_mm', label: 'Pipe outside diameter D', group: 'length', unit: 'mm', default: 219.1, min: 5, max: 3000, help: 'NPS 2: 60.3, 3: 88.9, 4: 114.3, 6: 168.3, 8: 219.1, 10: 273.0, 12: 323.9 mm.' },
    { id: 'material', label: 'Material (allowable stress S)', type: 'select', default: 'a106_b', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 's_custom_mpa', label: 'Custom allowable stress S at design temperature', group: 'pressure', unit: 'MPa', default: 120, min: 10, max: 500, visibleWhen: { material: 'custom' } },
    { id: 'y_class', label: 'Y coefficient class (Table 304.1.1)', type: 'select', default: 'ferritic', options: Object.entries(Y_TABLE).map(([value, y]) => ({ value, label: y.label })), visibleWhen: { material: 'custom' } },
    { id: 'joint', label: 'Longitudinal weld joint (quality factor E)', type: 'select', default: 'seamless', options: Object.entries(JOINT_FACTORS).map(([value, j]) => ({ value, label: j.label })) },
    { id: 'w_factor', label: 'Weld joint strength reduction factor W', group: 'dimensionless', unit: 'none', default: 1.0, min: 0.5, max: 1 },
    { id: 'corrosion_mm', label: 'Corrosion / erosion allowance', group: 'length', unit: 'mm', default: 1.5, min: 0, max: 10 },
    { id: 'mechanical_mm', label: 'Mechanical allowance (thread / groove depth)', group: 'length', unit: 'mm', default: 0, min: 0, max: 10 },
    { id: 'mill_tolerance_pct', label: 'Mill under-tolerance on wall', group: 'ratio', unit: 'pct', default: 12.5, min: 0, max: 25 },
    { id: 'available_wall_mm', label: 'Available (schedule) nominal wall to check', group: 'length', unit: 'mm', default: 8.18, min: 0.5, max: 100, help: 'NPS 8: Sch 10 3.76, Sch 40 8.18, Sch 80 12.70 mm.' },
  ],
  outputs: [
    { id: 's_mpa', label: 'Allowable stress S used', group: 'pressure', unit: 'MPa' },
    { id: 'y', label: 'Coefficient Y', group: 'dimensionless', unit: 'none' },
    { id: 'e', label: 'Quality factor E', group: 'dimensionless', unit: 'none' },
    { id: 't_pressure_mm', label: 'Pressure design thickness t = P D/(2 (S E W + P Y))', group: 'length', unit: 'mm' },
    { id: 't_min_mm', label: 'Minimum required thickness t_m = t + c', group: 'length', unit: 'mm' },
    { id: 't_nominal_mm', label: 'Nominal wall required t_m/(1 − tol)', group: 'length', unit: 'mm' },
    { id: 'schedule_check', label: 'Available wall check', type: 'text' },
    { id: 't_eff_mm', label: 'Effective thickness of the available wall (after tolerance and allowances)', group: 'length', unit: 'mm' },
    { id: 'mawp_pa', label: 'MAWP of the available wall', group: 'pressure', unit: 'Pa', display: 'bar' },
    { id: 'utilisation_pct', label: 'Design pressure as share of the MAWP', group: 'ratio', unit: 'pct' },
    { id: 'hoop_stress_mpa', label: 'Barlow hoop stress at design pressure P D/(2 t_eff)', group: 'pressure', unit: 'MPa' },
    { id: 'd_over_t', label: 'D / t_nominal (thin-wall validity needs t < D/6, i.e. D/t > 6)', group: 'dimensionless', unit: 'none' },
    { id: 'pse_ratio', label: 'P/(S E) (special consideration above 0.385)', group: 'dimensionless', unit: 'none' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      s_mpa: '137.9 MPa',
      t_pressure_mm: '1.27 mm',
      t_min_mm: '2.77 mm',
      t_nominal_mm: '3.16 mm',
      t_eff_mm: '5.66 mm',
      mawp_pa: '72.7 bar',
      utilisation_pct: '22 %',
      hoop_stress_mpa: '31 MPa',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.design_pressure_bar, 'design_pressure_bar', 'Design pressure');
  assertRange(i.design_temp_c, -273, 1000, 'design_temp_c', 'Design temperature');
  assertPositive(i.outside_diameter_mm, 'outside_diameter_mm', 'Outside diameter');
  assertOneOf(i.material, Object.keys(MATERIALS), 'material', 'Material');
  assertOneOf(i.joint, Object.keys(JOINT_FACTORS), 'joint', 'Joint');
  assertRange(i.w_factor, 0.3, 1, 'w_factor', 'W factor');
  assertNonNegative(i.corrosion_mm, 'corrosion_mm', 'Corrosion allowance');
  assertNonNegative(i.mechanical_mm, 'mechanical_mm', 'Mechanical allowance');
  assertRange(i.mill_tolerance_pct, 0, 50, 'mill_tolerance_pct', 'Mill tolerance');
  assertPositive(i.available_wall_mm, 'available_wall_mm', 'Available wall');

  const mat = MATERIALS[i.material];
  const S = i.material === 'custom' ? assertPositive(i.s_custom_mpa, 's_custom_mpa', 'Allowable stress') : mat.s;
  const yClass = i.material === 'custom' ? assertOneOf(i.y_class, Object.keys(Y_TABLE), 'y_class', 'Y class') : mat.y;
  const Y = Y_TABLE[yClass].y(i.design_temp_c);
  const E = JOINT_FACTORS[i.joint].e;
  const P = i.design_pressure_bar / 10; // MPa
  const D = i.outside_diameter_mm;
  const SEW = S * E * i.w_factor;
  const t = (P * D) / (2 * (SEW + P * Y));
  const c = i.corrosion_mm + i.mechanical_mm;
  const tMin = t + c;
  const tol = i.mill_tolerance_pct / 100;
  const tNom = tMin / (1 - tol);
  const tEff = i.available_wall_mm * (1 - tol) - c;
  const mawpMpa = tEff > 0 ? (2 * SEW * tEff) / (D - 2 * Y * tEff) : 0;
  const ok = i.available_wall_mm >= tNom - 1e-9;

  const warnings = [];
  if (t >= D / 6) warnings.push('Pressure design thickness at or above D/6: thick-wall pipe — B31.3 requires special consideration (para. 304.1.2(b)); the formula is not valid.');
  if (P / (S * E) > 0.385) warnings.push('P/(S E) above 0.385: outside the range of the simple formula (para. 304.1.2(b)).');
  if (i.material !== 'custom' && i.design_temp_c > 200) warnings.push('Design temperature above 200 °C: the allowable stress of the table value falls with temperature — enter S at the design temperature (custom material).');
  if (i.material !== 'custom' && i.design_temp_c < -29 && mat.y === 'ferritic' && i.material !== 'a333_6') warnings.push('Below −29 °C carbon steel needs impact testing or a low-temperature grade (A333) per B31.3 para. 323.2.2.');
  if (!ok) warnings.push(`Available wall ${i.available_wall_mm} mm is below the required nominal ${tNom.toFixed(2)} mm: choose the next schedule.`);
  if (tEff <= 0) warnings.push('The available wall is consumed by tolerance and allowances: no pressure capacity remains.');
  if (ok && i.design_pressure_bar / (mawpMpa * 10) < 0.3) warnings.push('Pressure uses less than 30 % of the available wall: the schedule is governed by corrosion, handling or a minimum-wall rule, not by pressure — normal for low-pressure process pipe.');
  warnings.push('Internal pressure only: sustained, occasional and thermal stresses (para. 302.3.5–6), external pressure, bending at supports and flange ratings are separate checks.');
  warnings.push('Table values of S are the low-temperature basic allowable stresses; class rules (DNV/LR/ABS) have their own formula constants and minimum wall tables for shipboard piping.');

  return {
    outputs: {
      s_mpa: S,
      y: Y,
      e: E,
      t_pressure_mm: t,
      t_min_mm: tMin,
      t_nominal_mm: tNom,
      schedule_check: ok ? `OK — ${i.available_wall_mm} mm ≥ ${tNom.toFixed(2)} mm required (${((tNom / i.available_wall_mm) * 100).toFixed(0)} % of the available wall)` : `INSUFFICIENT — ${i.available_wall_mm} mm < ${tNom.toFixed(2)} mm required`,
      t_eff_mm: tEff,
      mawp_pa: mawpMpa * 1e6,
      utilisation_pct: mawpMpa > 0 ? (i.design_pressure_bar / (mawpMpa * 10)) * 100 : null,
      hoop_stress_mpa: tEff > 0 ? (P * D) / (2 * tEff) : null,
      d_over_t: D / tNom,
      pse_ratio: P / (S * E),
    },
    warnings,
  };
}
