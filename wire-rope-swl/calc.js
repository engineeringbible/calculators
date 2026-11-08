/**
 * wire-rope-swl/calc.js — safe working load of steel wire rope from its minimum breaking load (EN 12385-4 formula
 * F_min = K d² R_r / 1000 or an entered MBL), a termination efficiency and a coefficient of utilisation (EN 13414-1
 * slings, or the ILO Convention 152 formulas for ship's lifting appliances and slings); and the working load limit of
 * Grade 80 / Grade 100 alloy lifting chain from the standard tables.
 *
 * Wire: MBL = K d² R_r / 1000 kN (d mm, R_r N/mm²);  SWL = MBL × η_t / Z.  ILO: Z = 10⁴ / (8.85 SWL + 1910) (SWL in t)
 * from 10 t (slings) or from 0 (appliances) up to 160 t, 3 above.  Chain: WLL from the table, breaking force ≥ 4 WLL.
 * Schema units: m, N, kg.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const LB = 0.45359237;

/** EN 12385-4 Table B.1 minimum breaking force factors K (checked against PFEIFER data sheets 6x36WS-FC: 20 mm 1770 = 234 kN,
 * 6x36WS-WC: 20 mm 1770 = 252 kN, 32 mm = 645 kN; 6x19S-FC: 6 mm 1770 = 21 kN). */
export const ROPES = {
  '6x36_iwrc': { label: '6×36 class, steel core (IWRC), K = 0.356', k: 0.356 },
  '6x36_fc': { label: '6×36 class, fibre core, K = 0.330', k: 0.330 },
  '6x19_iwrc': { label: '6×19 class, steel core (IWRC), K = 0.356', k: 0.356 },
  '6x19_fc': { label: '6×19 class, fibre core, K = 0.330', k: 0.330 },
};

/** Coefficient of utilisation (safety factor) options. */
export const FACTORS = {
  en13414: { label: 'Wire rope sling, general lifting: 5 (EN 13414-1, ASME B30.9)' },
  ilo_sling: { label: 'Wire rope in a sling, ILO C152: 5 up to 10 t, then 10⁴/(8.85 SWL + 1910), 3 above 160 t' },
  ilo_appliance: { label: 'Wire rope in a ship\'s derrick or crane, ILO C152: 10⁴/(8.85 SWL + 1910), 3 above 160 t' },
  custom: { label: 'Other: enter the factor' },
};

/** Working load limits of alloy lifting chain, single leg straight pull. */
export const CHAINS = {
  g8_en: {
    label: 'Grade 8, metric (EN 818-2 / EN 818-4)',
    sizes: { 6: [1.12, '6 mm'], 7: [1.5, '7 mm'], 8: [2.0, '8 mm'], 10: [3.15, '10 mm'], 13: [5.3, '13 mm'], 16: [8.0, '16 mm'], 20: [12.5, '20 mm'], 22: [15.0, '22 mm'], 26: [21.2, '26 mm'], 32: [31.5, '32 mm'] },
    unit: 't',
  },
  g80_us: {
    label: 'Grade 80, US sizes (NACM, ASTM A391; OSHA 29 CFR 1918 App. II Table 4A)',
    sizes: { 7: [3500, '9/32 in (7 mm)'], 10: [7100, '3/8 in (10 mm)'], 13: [12000, '1/2 in (13 mm)'], 16: [18100, '5/8 in (16 mm)'], 20: [28300, '3/4 in (20 mm)'], 22: [34200, '7/8 in (22 mm)'], 26: [47700, '1 in (26 mm)'], 32: [72300, '1 1/4 in (32 mm)'] },
    unit: 'lb',
  },
  g100_us: {
    label: 'Grade 100, US sizes (NACM, ASTM A973)',
    sizes: { 5.5: [2700, '7/32 in (5.5 mm)'], 7: [4300, '9/32 in (7 mm)'], 10: [8800, '3/8 in (10 mm)'], 13: [15000, '1/2 in (13 mm)'], 16: [22600, '5/8 in (16 mm)'], 20: [35300, '3/4 in (20 mm)'] },
    unit: 'lb',
  },
};
/** Grade 80 and 100 lifting chain: minimum breaking force at least 4 × WLL (EN 818-2 Annex A; NACM 4:1). */
export const CHAIN_DESIGN_FACTOR = 4;

const sizeOptions = (grade) => Object.entries(CHAINS[grade].sizes)
  .sort((a, b) => Number(a[0]) - Number(b[0]))
  .map(([value, [wll, name]]) => ({ value, label: `${name}: WLL ${wll.toLocaleString('en-US').replace(/,/g, ' ')} ${CHAINS[grade].unit}` }));

/** SWL in tonnes from an effective breaking load in tonnes-force by the ILO C152 coefficients. */
export function iloSwl(mblT, kind) {
  if (kind === 'ilo_sling' && mblT / 5 <= 10) return mblT / 5;
  const denominator = 1e4 - 8.85 * mblT;
  const s = denominator > 0 ? (1910 * mblT) / denominator : Infinity;
  return s <= 160 ? s : mblT / 3;
}

export const schema = {
  id: 'wire-rope-swl',
  name: 'Wire rope and chain safe working load calculator',
  category: 'maritime',
  summary: 'Wire rope breaking load (EN 12385-4) and safe working load with EN 13414 or ILO safety factors, and Grade 80 or 100 chain working load limits.',
  related: ['lifting-sling', 'mooring-line-meg4', 'padeye', 'anchor-holding'],
  assumptions: [
    'The minimum breaking force of stranded rope is K d² R_r / 1000 kN by EN 12385-4, with K = 0.330 for fibre core and 0.356 for steel core ropes of the 6×19 and 6×36 classes, d the nominal diameter in mm and R_r the rope grade in N/mm². A manufacturer\'s certificate overrides it.',
    'The termination efficiency covers the strength lost at the end fitting or over a sheave or pin: about 0.9 for a ferrule-secured eye (EN 13414-1) and lower for wedge sockets or bulldog grips. Bending a rope over a pin smaller than about 25 rope diameters cuts its strength further; use the maker\'s D/d curve.',
    'The ILO coefficients (ILO Convention 152, certificate form 4) are 10⁴ / (8.85 SWL + 1 910) with SWL in tonnes: about 5 for small loads, falling to 3 at 160 t. Slings use 5 up to 10 t. National rules and class may set other values.',
    'Chain working load limits are for a single leg in a straight pull at normal temperature, from the EN 818-4 table for metric Grade 8 and from the NACM tables for US Grade 80 and Grade 100 chain. Their minimum breaking force is at least four times the WLL.',
    'Sling angle, hitch type, dynamic loads and wear are not included: use the lifting sling calculator for multi-leg slings and reduce for worn, kinked or corroded rope or chain.',
  ],
  notes: [
    'Verification 2026-11-08: 20 mm 6×36 IWRC rope of grade 1770 has MBL 0.356 × 20² × 1 770 / 1 000 = 252.0 kN (PFEIFER 6x36WS-WC table: 252 kN); with a ferrule-secured eye (0.9) and factor 5 the SWL is 45.4 kN or 4.63 t. Checked by hand.',
    'Verification 2026-11-08: the ILO coefficient is continuous: 10⁴ / (8.85 × 10 + 1 910) = 5.00 at 10 t and 10⁴ / (8.85 × 160 + 1 910) = 3.01 at 160 t.',
    'Design decision: the D/d bending reduction is left to an efficiency input because published efficiency curves differ between rope makers.',
  ],
  sources: [
    'EN 12385-4:2002+A1:2008 Steel wire ropes — Safety — Part 4: Stranded ropes for general lifting applications, Table B.1 (minimum breaking force factors); PFEIFER data sheets 6x36WS-WC and 6x36WS-FC (2019–2020)',
    'EN 13414-1:2003+A2:2008 Steel wire rope slings — Part 1: Slings for general lifting service (coefficient 5, termination efficiency 0.9 for ferrule-secured eyes)',
    'ILO Convention C152 (1979), Occupational Safety and Health (Dock Work), register form No. 4 instructions as reproduced in OSHA 29 CFR 1918 Appendix I: coefficient of utilisation of wire rope',
    'EN 818-4:1996+A1:2008 (Grade 8 chain slings, WLL table); OSHA 29 CFR 1918 Appendix II Table 4A (NACM Grade 80 rated loads); NACM Welded Steel Chain Specifications and ASTM A973 (Grade 100)',
  ],
  inputs: [
    { id: 'item', label: 'Item', type: 'select', default: 'wire', options: [{ value: 'wire', label: 'Steel wire rope' }, { value: 'chain', label: 'Alloy lifting chain (Grade 80 / 100)' }] },
    { id: 'mbl_basis', label: 'Breaking load of the rope', type: 'select', default: 'en12385', visibleWhen: { item: 'wire' }, options: [{ value: 'en12385', label: 'From construction, grade and diameter (EN 12385-4)' }, { value: 'entered', label: 'From the rope certificate (enter the MBL)' }] },
    { id: 'construction', label: 'Rope construction', type: 'select', default: '6x36_iwrc', visibleWhen: { item: 'wire', mbl_basis: 'en12385' }, options: Object.entries(ROPES).map(([value, r]) => ({ value, label: r.label })) },
    { id: 'grade', label: 'Rope grade R_r', type: 'select', default: '1770', visibleWhen: { item: 'wire', mbl_basis: 'en12385' }, options: [{ value: '1770', label: '1770 N/mm²' }, { value: '1960', label: '1960 N/mm²' }, { value: '2160', label: '2160 N/mm²' }] },
    { id: 'diameter_m', label: 'Nominal rope diameter d', group: 'length', unit: 'm', display: 'mm', default: 0.02, min: 0.002, max: 0.12, visibleWhen: { item: 'wire', mbl_basis: 'en12385' } },
    { id: 'mbl_n', label: 'Minimum breaking load from the certificate', group: 'force', unit: 'N', display: 'kN', default: 252000, min: 100, max: 5e7, visibleWhen: { item: 'wire', mbl_basis: 'entered' } },
    { id: 'termination', label: 'Termination or bending efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.3, max: 1, visibleWhen: { item: 'wire' } },
    { id: 'factor_basis', label: 'Coefficient of utilisation (safety factor)', type: 'select', default: 'en13414', visibleWhen: { item: 'wire' }, options: Object.entries(FACTORS).map(([value, f]) => ({ value, label: f.label })) },
    { id: 'factor_custom', label: 'Safety factor', group: 'dimensionless', unit: 'none', default: 6, min: 1, max: 20, visibleWhen: { item: 'wire', factor_basis: 'custom' } },
    { id: 'chain_grade', label: 'Chain grade', type: 'select', default: 'g8_en', visibleWhen: { item: 'chain' }, options: Object.entries(CHAINS).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'size_g8_en', label: 'Chain size', type: 'select', default: '10', visibleWhen: { item: 'chain', chain_grade: 'g8_en' }, options: sizeOptions('g8_en') },
    { id: 'size_g80_us', label: 'Chain size', type: 'select', default: '10', visibleWhen: { item: 'chain', chain_grade: 'g80_us' }, options: sizeOptions('g80_us') },
    { id: 'size_g100_us', label: 'Chain size', type: 'select', default: '10', visibleWhen: { item: 'chain', chain_grade: 'g100_us' }, options: sizeOptions('g100_us') },
    { id: 'load_kg', label: 'Load to check (optional, 0 = none)', group: 'mass', unit: 'kg', display: 't', default: 0, min: 0, max: 1e7 },
  ],
  outputs: [
    { id: 'k_factor', label: 'Breaking force factor K', group: 'dimensionless', unit: 'none', decimals: 3, visibleWhen: { item: 'wire' } },
    { id: 'mbl_out_n', label: 'Minimum breaking load', group: 'force', unit: 'N', display: 'kN' },
    { id: 'effective_n', label: 'Breaking load after the termination', group: 'force', unit: 'N', display: 'kN', visibleWhen: { item: 'wire' } },
    { id: 'factor_used', label: 'Coefficient of utilisation used', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'swl_kg', label: 'Safe working load (WLL)', group: 'mass', unit: 'kg', display: 't' },
    { id: 'swl_n', label: 'Safe working load as a force', group: 'force', unit: 'N', display: 'kN' },
    { id: 'utilisation', label: 'Utilisation by the load', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'basis_text', label: 'Basis', type: 'text' },
  ],
  example: {
    inputs: { item: 'wire', mbl_basis: 'en12385', construction: '6x36_iwrc', grade: '1770', diameter_m: [20, 'mm'], termination: [90, 'pct'], factor_basis: 'en13414', load_kg: [0, 't'] },
    results: { mbl_out_n: '252.0 kN', effective_n: '226.8 kN', swl_n: '45.4 kN', swl_kg: '4.63 t' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const g = GRAVITY_M_S2;
  assertOneOf(x.item, ['wire', 'chain'], 'item', 'Item');
  const load = assertNonNegative(x.load_kg, 'load_kg', 'Load to check');
  const warnings = [];
  let k = null;
  let mbl;
  let effective = null;
  let factor;
  let swlKg;
  let basis;
  if (x.item === 'wire') {
    assertOneOf(x.mbl_basis, ['en12385', 'entered'], 'mbl_basis', 'Breaking load of the rope');
    assertOneOf(x.factor_basis, Object.keys(FACTORS), 'factor_basis', 'Coefficient of utilisation');
    if (x.mbl_basis === 'en12385') {
      assertOneOf(x.construction, Object.keys(ROPES), 'construction', 'Rope construction');
      assertOneOf(x.grade, ['1770', '1960', '2160'], 'grade', 'Rope grade');
      const dMm = assertRange(x.diameter_m, 0.002, 0.12, 'diameter_m', 'Rope diameter') * 1000;
      k = ROPES[x.construction].k;
      mbl = k * dMm * dMm * Number(x.grade); // N (K d² R_r / 1000 kN)
      basis = `EN 12385-4: ${ROPES[x.construction].label.split(',').slice(0, 2).join(',')}, grade ${x.grade}`;
    } else {
      mbl = assertPositive(x.mbl_n, 'mbl_n', 'Minimum breaking load');
      basis = 'Certificate MBL';
    }
    const eta = assertRange(x.termination, 0.3, 1, 'termination', 'Termination efficiency');
    effective = mbl * eta;
    const mblT = effective / g / 1000;
    if (x.factor_basis === 'en13414') {
      factor = 5;
      swlKg = (effective / factor / g);
    } else if (x.factor_basis === 'custom') {
      factor = assertRange(x.factor_custom, 1, 20, 'factor_custom', 'Safety factor');
      swlKg = effective / factor / g;
    } else {
      const s = iloSwl(mblT, x.factor_basis);
      swlKg = s * 1000;
      factor = mblT / s;
    }
    basis += `; termination ${(eta * 100).toFixed(0)} %; factor ${factor.toFixed(2)}`;
    if (factor < 3) warnings.push('A coefficient of utilisation below 3 is lower than any lifting standard allows for wire rope.');
  } else {
    assertOneOf(x.chain_grade, Object.keys(CHAINS), 'chain_grade', 'Chain grade');
    const grade = CHAINS[x.chain_grade];
    const size = x[`size_${x.chain_grade}`];
    if (!Object.prototype.hasOwnProperty.call(grade.sizes, String(size))) throw new Error(`Chain size: ${size} is not a size of ${grade.label}.`);
    const [wll, name] = grade.sizes[String(size)];
    swlKg = grade.unit === 't' ? wll * 1000 : wll * LB;
    factor = CHAIN_DESIGN_FACTOR;
    mbl = swlKg * g * CHAIN_DESIGN_FACTOR;
    basis = `${grade.label}, ${name}: WLL ${wll} ${grade.unit}; breaking force at least 4 × WLL`;
  }
  const utilisation = load > 0 ? load / swlKg : null;
  if (utilisation !== null && utilisation > 1) warnings.push('The load exceeds the safe working load: do not lift.');
  return {
    outputs: {
      k_factor: k,
      mbl_out_n: mbl,
      effective_n: effective,
      factor_used: factor,
      swl_kg: swlKg,
      swl_n: swlKg * g,
      utilisation,
      basis_text: basis,
    },
    warnings,
  };
}
