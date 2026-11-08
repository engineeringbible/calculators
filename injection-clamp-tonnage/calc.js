/**
 * injection-clamp-tonnage/calc.js — clamp force of an injection mould from the projected area of the cavities and cold
 * runner times the clamp factor (mean cavity pressure), the number of cavities and the machine size with a margin.
 *
 * A = n A_cavity + A_runner;  F = A × p (clamp factor, 1 US ton/in² = 2 000 psi);  machine ≥ F / utilisation.
 * Schema units: SI — m², Pa, N.
 */
import { withDefaults, assertOneOf, assertRange, assertPositive, assertNonNegative, assertInteger } from '../shared/validate.js';

const IN2 = 0.00064516;
const PSI = 6894.757293168;
const TON_IN2 = 2000 * PSI; // 1 US ton per square inch in Pa
const US_TON_N = 2000 * 4.4482216152605;

/** Clamp factors, US tons per in²: [id, label, value, range text]. */
export const FACTORS = [
  ['general', 'General starting value (RJG)', 3, '2–10 tons/in² by material and part; start at 3'],
  ['pc', 'Polycarbonate (SABIC Lexan, Covestro Makrolon guides)', 4, '3–5 tons/in² (4.1–6.9 kN/cm²)'],
  ['pc_gf', 'Glass-reinforced polycarbonate (Lexan guide)', 5, '4–6 tons/in²: about 1 ton/in² more than unfilled'],
];

export const schema = {
  id: 'injection-clamp-tonnage',
  name: 'Injection molding clamp tonnage calculator',
  category: 'manufacturing',
  summary: 'Clamp force for an injection mould from projected area, cavities, cold runner and clamp factor or cavity pressure, with the machine size for a margin.',
  related: ['press-tonnage', 'oee-takt', 'hydraulic-cylinder', 'tolerance-stack'],
  assumptions: [
    'Clamp force is the projected area of everything under melt pressure at the parting line (all cavities and a cold runner) times the clamp factor, which is the mean cavity pressure over that area; 1 US ton/in² equals 2 000 psi or 13.8 MPa.',
    'Clamp factors depend on the resin, wall thickness and flow length: RJG gives 2 to 10 tons/in² with 3 as a starting point; the SABIC Lexan guide gives 3 to 5 tons/in² for polycarbonate and about 1 ton/in² more for glass-reinforced grades; resin datasheets give the value for a grade.',
    'Projected area is the area seen along the direction of mould opening, with through-holes and cored-out areas taken away; side cores and hot runners are not included.',
    'The machine should run below its rating: Autodesk Moldflow advises keeping the peak clamp force under about 80 % of the machine limit.',
    'Too much clamp force can damage the mould: RJG reports a cavity block that failed when clamped at four times the required tonnage, so size to the need.',
  ],
  notes: [
    'Verification 2026-11-08: RJG example, a 4.6 × 4.6 in part (21.16 in²) in 8 cavities at 3 tons/in² needs 169.28 × 3 = 507.84 US tons; at an 80 % limit the machine should be rated at least 634.8 tons. Checked by hand.',
  ],
  sources: [
    'RJG Inc., Clamp Tonnage: More is Better, Right? (2017): projected area × cavities + cold runner × tonnage factor; 2–10 tons/in², 3 as a start; example 507.84 tons',
    'SABIC (GE Plastics) LEXAN resin processing guide: 3 to 5 tons of clamp force per in² of projected area, about 1 ton/in² more for glass-reinforced grades; Covestro Makrolon 2558 datasheet 3.0–5.0 tons/in² (4.1–6.9 kN/cm²)',
    'Autodesk Moldflow Insight help, Clamp force result: keep the maximum clamp force below approximately 80 % of the machine limit',
  ],
  inputs: [
    { id: 'area_m2', label: 'Projected area of one cavity (part)', group: 'area', unit: 'm2', display: 'in2', default: 21.16 * IN2, min: 1e-7, max: 10 },
    { id: 'cavities', label: 'Number of cavities', group: 'dimensionless', unit: 'none', default: 8, min: 1, max: 512, integer: true },
    { id: 'runner_m2', label: 'Projected area of the cold runner (0 for a hot runner)', group: 'area', unit: 'm2', display: 'in2', default: 0, min: 0, max: 10 },
    { id: 'factor_mode', label: 'Clamp factor', type: 'select', default: 'general', options: [...FACTORS.map(([value, label, v]) => ({ value, label: `${label}: ${v} tons/in²` })), { value: 'custom', label: 'Enter a cavity pressure or factor' }] },
    { id: 'factor_pa', label: 'Clamp factor as mean cavity pressure (6 000 psi = 3 tons/in²)', group: 'pressure', unit: 'Pa', display: 'psi', default: 6000 * PSI, min: 1e5, max: 3e8, visibleWhen: { factor_mode: 'custom' } },
    { id: 'utilisation', label: 'Highest share of the machine rating to use', group: 'ratio', unit: 'frac', display: 'pct', default: 0.8, min: 0.3, max: 1 },
  ],
  outputs: [
    { id: 'total_area_m2', label: 'Total projected area', group: 'area', unit: 'm2', display: 'in2' },
    { id: 'factor_out_pa', label: 'Clamp factor used (mean cavity pressure)', group: 'pressure', unit: 'Pa', display: 'psi' },
    { id: 'factor_tons_in2', label: 'Clamp factor, US tons per in²', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'clamp_n', label: 'Clamp force needed', group: 'force', unit: 'N', display: 'kN' },
    { id: 'clamp_us_tons', label: 'Clamp force needed, US tons', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'machine_n', label: 'Smallest machine rating', group: 'force', unit: 'N', display: 'kN' },
    { id: 'machine_us_tons', label: 'Smallest machine rating, US tons', group: 'dimensionless', unit: 'none', decimals: 1 },
    { id: 'factor_note', label: 'Clamp factor source', type: 'text' },
  ],
  example: {
    inputs: { area_m2: [21.16, 'in2'], cavities: 8, runner_m2: [0, 'in2'], factor_mode: 'general', utilisation: [80, 'pct'] },
    results: { total_area_m2: '169.28 in²', clamp_us_tons: '507.8', machine_us_tons: '634.8', clamp_n: '4 518 kN' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.factor_mode, [...FACTORS.map((f) => f[0]), 'custom'], 'factor_mode', 'Clamp factor');
  const a = assertPositive(x.area_m2, 'area_m2', 'Projected area of one cavity');
  const n = assertInteger(assertRange(x.cavities, 1, 512, 'cavities', 'Number of cavities'), 'cavities', 'Number of cavities');
  const runner = assertNonNegative(x.runner_m2, 'runner_m2', 'Projected area of the cold runner');
  const u = assertRange(x.utilisation, 0.3, 1, 'utilisation', 'Highest share of the machine rating');
  const row = FACTORS.find((f) => f[0] === x.factor_mode);
  const p = row ? row[2] * TON_IN2 : assertRange(x.factor_pa, 1e5, 3e8, 'factor_pa', 'Clamp factor');
  const area = n * a + runner;
  const F = area * p;
  const warnings = [];
  if (p / TON_IN2 < 2 || p / TON_IN2 > 10) warnings.push('The clamp factor is outside the 2 to 10 tons/in² range RJG quotes for most moulding: check the units of the pressure.');
  return {
    outputs: {
      total_area_m2: area,
      factor_out_pa: p,
      factor_tons_in2: p / TON_IN2,
      clamp_n: F,
      clamp_us_tons: F / US_TON_N,
      machine_n: F / u,
      machine_us_tons: F / u / US_TON_N,
      factor_note: row ? `${row[1]}: ${row[3]}` : 'Your cavity pressure or clamp factor',
    },
    warnings,
  };
}
