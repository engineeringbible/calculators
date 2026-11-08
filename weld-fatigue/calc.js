/**
 * weld-fatigue/calc.js — Palmgren–Miner fatigue damage and life of a welded detail from a stress-range histogram on
 * the DNV-RP-C203 S-N curves (air, seawater with cathodic protection, free corrosion), with the thickness effect,
 * a stress concentration factor, the design fatigue factor and the fatigue-limit screening of section 2.11.
 *
 * log N = log a1 − m1 log Δσ_eff above the slope change (10^7 cycles in air, 10^6 with CP), log a2 − 5 log Δσ_eff below;
 * free corrosion: log a − 3 log Δσ_eff;  Δσ_eff = Δσ · SCF · (t/t_ref)^k for t > t_ref;  D = Σ n_i / N_i ≤ 1/DFF
 * Schema units: MPa, mm, cycles, years.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

/** DNV-RP-C203 (October 2011) Tables 2-1 to 2-3: m1, log a1 (air), log a1 (CP), log a2 (m2 = 5), log a (free corrosion, m = 3), k. */
export const SN_CURVES = {
  B1: { m1: 4, air: 15.117, cp: 14.917, a2: 17.146, fc: 12.436, k: 0 },
  B2: { m1: 4, air: 14.885, cp: 14.685, a2: 16.856, fc: 12.262, k: 0 },
  C: { m1: 3, air: 12.592, cp: 12.192, a2: 16.32, fc: 12.115, k: 0.15 },
  C1: { m1: 3, air: 12.449, cp: 12.049, a2: 16.081, fc: 11.972, k: 0.15 },
  C2: { m1: 3, air: 12.301, cp: 11.901, a2: 15.835, fc: 11.824, k: 0.15 },
  D: { m1: 3, air: 12.164, cp: 11.764, a2: 15.606, fc: 11.687, k: 0.2 },
  E: { m1: 3, air: 12.01, cp: 11.61, a2: 15.35, fc: 11.533, k: 0.2 },
  F: { m1: 3, air: 11.855, cp: 11.455, a2: 15.091, fc: 11.378, k: 0.25 },
  F1: { m1: 3, air: 11.699, cp: 11.299, a2: 14.832, fc: 11.222, k: 0.25 },
  F3: { m1: 3, air: 11.546, cp: 11.146, a2: 14.576, fc: 11.068, k: 0.25 },
  G: { m1: 3, air: 11.398, cp: 10.998, a2: 14.33, fc: 10.921, k: 0.25 },
  W1: { m1: 3, air: 11.261, cp: 10.861, a2: 14.101, fc: 10.784, k: 0.25 },
  W2: { m1: 3, air: 11.107, cp: 10.707, a2: 13.845, fc: 10.63, k: 0.25 },
  W3: { m1: 3, air: 10.97, cp: 10.57, a2: 13.617, fc: 10.493, k: 0.25 },
  T: { m1: 3, air: 12.164, cp: 11.764, a2: 15.606, fc: 11.687, k: null },
};
const SWITCH_CYCLES = { air: 1e7, cp: 1e6 };
const M2 = 5;
const M_FREE = 3;
const DEFAULT_HISTOGRAM = [
  '# stress range (MPa); number of cycles in the period',
  '120; 50',
  '100; 300',
  '80; 2000',
  '65; 10000',
  '50; 50000',
  '40; 200000',
  '30; 600000',
  '20; 1500000',
  '10; 2500000',
  '5; 1000000',
].join('\n');

export const schema = {
  id: 'weld-fatigue',
  name: 'Weld fatigue damage (DNV-RP-C203)',
  category: 'structural',
  summary: 'Miner damage and fatigue life of a welded detail from a stress-range histogram on the DNV-RP-C203 S-N curves, with thickness effect and DFF.',
  related: ['fillet-weld', 'stiffener-section', 'padeye', 'gum-uncertainty'],
  assumptions: [
    'S-N curves of DNV-RP-C203 (October 2011), Tables 2-1 to 2-3: in air the curves are bilinear with the slope change at 10^7 cycles and m2 = 5 below it; in seawater with cathodic protection the slope changes at 10^6 cycles; for free corrosion the curves have one slope m = 3 for all cycles. Later editions of the RP revised some values (for example the reference thickness of tubular joints), so check the edition your project uses.',
    'Thickness effect, eq. (2.4.3): Δσ is multiplied by (t/t_ref)^k for t > t_ref, with t_ref = 25 mm for welded connections other than tubular joints and 32 mm for tubular joints in this edition; k from the tables, and for the T curve 0.25 when SCF ≤ 10 and 0.30 above. The SCF entered multiplies the stress ranges of the histogram.',
    'Linear damage accumulation (Palmgren–Miner, eq. 2.2.1): D = Σ n_i/N_i over the histogram period, scaled to the design life; the design criterion is D ≤ η = 1/DFF, with the design fatigue factor from DNV-OS-C101. The RP asks for at least 20 blocks when a long-term distribution is discretised.',
    'Screening (section 2.11): a detailed fatigue analysis may be omitted if the largest stress range is below the fatigue limit at 10^7 cycles (air and cathodic protection), reduced by DFF^−0.33.',
    'Mean stress, residual stress relief, post-weld improvement, low-cycle fatigue and the high-strength-steel base material curve are not included.',
  ],
  notes: [
    'Verification 2026-10-31: the curve coefficients were read from the DNV-RP-C203 October 2011 PDF; the fatigue limits at 10^7 cycles follow from log a2 (D: 10^((15.606 − 7)/5) = 52.63 MPa, as tabulated) and the two segments meet at the slope change.',
    'Design decision: the equivalent stress range is defined on the same bilinear curve, as the constant range that gives the same damage in the same total number of cycles.',
  ],
  sources: [
    'DNV, DNV-RP-C203 Fatigue design of offshore steel structures, October 2011 — 2.2, 2.4.1–2.4.9, Tables 2-1 to 2-3, 2.11',
    'DNV-OS-C101 Design of offshore steel structures, section 6 — design fatigue factors',
  ],
  inputs: [
    {
      id: 'curve',
      label: 'S-N curve',
      type: 'select',
      default: 'D',
      options: Object.keys(SN_CURVES).map((value) => ({ value, label: value === 'T' ? 'T (tubular joints, hot spot)' : value })),
    },
    {
      id: 'environment',
      label: 'Environment',
      type: 'select',
      default: 'air',
      options: [
        { value: 'air', label: 'Air' },
        { value: 'cp', label: 'Seawater with cathodic protection' },
        { value: 'fc', label: 'Seawater, free corrosion' },
      ],
    },
    { id: 'thickness_mm', label: 'Thickness through which the crack grows', group: 'length', unit: 'mm', default: 25, min: 1, max: 300 },
    { id: 'reference_thickness_mm', label: 'Reference thickness (25 mm; tubular joints 32 mm)', group: 'length', unit: 'mm', default: 25, min: 1, max: 100 },
    { id: 'scf', label: 'Stress concentration factor on the ranges', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 30 },
    { id: 'histogram', label: 'Stress-range histogram (one per line: stress range MPa; cycles)', type: 'textarea', rows: 11, default: DEFAULT_HISTOGRAM },
    { id: 'histogram_years', label: 'Period covered by the histogram', group: 'time', unit: 'year', default: 1, min: 0.001, max: 100 },
    { id: 'design_life_years', label: 'Design life', group: 'time', unit: 'year', default: 20, min: 0.1, max: 200 },
    { id: 'dff', label: 'Design fatigue factor (DFF)', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 10 },
  ],
  outputs: [
    { id: 'damage_period', label: 'Damage in the histogram period', group: 'dimensionless', unit: 'none' },
    { id: 'damage_life', label: 'Damage over the design life', group: 'dimensionless', unit: 'none' },
    { id: 'utilisation', label: 'Utilisation (damage over life × DFF)', group: 'dimensionless', unit: 'none' },
    { id: 'fatigue_life_years', label: 'Calculated fatigue life', group: 'time', unit: 'year' },
    { id: 'fatigue_life_dff_years', label: 'Fatigue life divided by the DFF', group: 'time', unit: 'year' },
    { id: 'equivalent_range_mpa', label: 'Equivalent stress range (with SCF and thickness)', group: 'pressure', unit: 'MPa' },
    { id: 'thickness_factor', label: 'Thickness factor (t/t_ref)^k', group: 'dimensionless', unit: 'none' },
    { id: 'fatigue_limit_mpa', label: 'Fatigue limit at 10^7 cycles × DFF^−0.33', group: 'pressure', unit: 'MPa', visibleWhen: { environment: ['air', 'cp'] } },
    { id: 'blocks_table', label: 'Damage by block', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      damage_period: '0.0167',
      damage_life: '0.333',
    },
  },
};

/** Lines of "stress range; cycles" → [{ range, cycles }]. */
export function parseHistogram(text) {
  const blocks = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const fields = clean.split(/[;\t]+/).map((f) => Number(f.trim().replace(',', '.')));
    if (fields.length < 2 || !Number.isFinite(fields[0]) || !Number.isFinite(fields[1])) throw new Error(`Histogram line ${index + 1}: expected "stress range; cycles" as two numbers`);
    if (fields[0] < 0 || fields[1] < 0) throw new Error(`Histogram line ${index + 1}: stress range and cycles must not be negative`);
    blocks.push({ range: fields[0], cycles: fields[1] });
  });
  if (!blocks.length) throw new Error('The histogram needs at least one block');
  return blocks;
}

/** Cycles to failure and its inverse for one curve and environment. */
export function snCurve(curve, environment) {
  const c = SN_CURVES[curve];
  if (environment === 'fc') {
    return { cycles: (s) => 10 ** (c.fc - M_FREE * Math.log10(s)), range: (n) => 10 ** ((c.fc - Math.log10(n)) / M_FREE) };
  }
  const logA1 = environment === 'cp' ? c.cp : c.air;
  const nSwitch = SWITCH_CYCLES[environment];
  const sSwitch = 10 ** ((logA1 - Math.log10(nSwitch)) / c.m1);
  return {
    cycles: (s) => (s >= sSwitch ? 10 ** (logA1 - c.m1 * Math.log10(s)) : 10 ** (c.a2 - M2 * Math.log10(s))),
    range: (n) => (n <= nSwitch ? 10 ** ((logA1 - Math.log10(n)) / c.m1) : 10 ** ((c.a2 - Math.log10(n)) / M2)),
  };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.curve, Object.keys(SN_CURVES), 'curve', 'S-N curve');
  assertOneOf(i.environment, ['air', 'cp', 'fc'], 'environment', 'Environment');
  assertPositive(i.thickness_mm, 'thickness_mm', 'Thickness');
  assertPositive(i.reference_thickness_mm, 'reference_thickness_mm', 'Reference thickness');
  assertRange(i.scf, 1, 100, 'scf', 'Stress concentration factor');
  assertPositive(i.histogram_years, 'histogram_years', 'Period of the histogram');
  assertPositive(i.design_life_years, 'design_life_years', 'Design life');
  assertRange(i.dff, 1, 100, 'dff', 'Design fatigue factor');
  const blocks = parseHistogram(i.histogram);

  const curveData = SN_CURVES[i.curve];
  const k = curveData.k ?? (i.scf <= 10 ? 0.25 : 0.3);
  const thicknessFactor = Math.max(1, i.thickness_mm / i.reference_thickness_mm) ** k;
  const sn = snCurve(i.curve, i.environment);
  const rows = blocks.map((b) => {
    const effective = b.range * i.scf * thicknessFactor;
    const cycles = effective > 0 ? sn.cycles(effective) : Infinity;
    return { ...b, effective, n: cycles, damage: b.cycles / cycles };
  });
  const damage = rows.reduce((sum, r) => sum + r.damage, 0);
  const totalCycles = rows.reduce((sum, r) => sum + r.cycles, 0);
  const damageLife = (damage * i.design_life_years) / i.histogram_years;
  const life = damage > 0 ? i.histogram_years / damage : Infinity;
  const equivalent = damage > 0 && totalCycles > 0 ? sn.range(totalCycles / damage) : 0;
  const limit = i.environment === 'fc' ? null : 10 ** ((curveData.a2 - 7) / M2) * i.dff ** -0.33;
  const largest = Math.max(...rows.map((r) => r.effective));

  const warnings = [];
  if (damageLife * i.dff > 1) warnings.push(`The damage over the design life, ${damageLife.toFixed(3)}, exceeds the allowable 1/DFF = ${(1 / i.dff).toFixed(3)}.`);
  if (limit !== null && largest < limit) warnings.push(`The largest stress range, ${largest.toFixed(1)} MPa, is below the reduced fatigue limit of ${limit.toFixed(1)} MPa: a detailed fatigue analysis may be omitted (DNV-RP-C203 2.11).`);
  if (blocks.length < 20) warnings.push(`The histogram has ${blocks.length} blocks; DNV-RP-C203 asks for at least 20 when a long-term distribution is discretised.`);
  if (i.curve === 'T' && i.scf === 1) warnings.push('For the T curve the thickness exponent depends on the joint SCF: enter nominal stress ranges with the hot-spot SCF.');

  return {
    outputs: {
      damage_period: damage,
      damage_life: damageLife,
      utilisation: damageLife * i.dff,
      fatigue_life_years: life,
      fatigue_life_dff_years: life / i.dff,
      equivalent_range_mpa: equivalent,
      thickness_factor: thicknessFactor,
      fatigue_limit_mpa: limit ?? 0,
      blocks_table: {
        columns: ['Stress range (MPa)', 'Effective range (MPa)', 'Cycles n', 'Cycles to failure N', 'Damage n/N', 'Share of damage (%)'],
        rows: rows.map((r) => [r.range, r.effective, r.cycles, r.n, r.damage, damage > 0 ? (r.damage / damage) * 100 : 0]),
      },
      summary: `Curve ${i.curve} (${i.environment === 'air' ? 'air' : i.environment === 'cp' ? 'seawater with CP' : 'free corrosion'}): damage ${damage.toExponential(3)} per ${i.histogram_years} year${i.histogram_years === 1 ? '' : 's'}, fatigue life ${Number.isFinite(life) ? life.toFixed(1) : 'unlimited'} years; over ${i.design_life_years} years D = ${damageLife.toFixed(3)} against 1/DFF = ${(1 / i.dff).toFixed(3)} (utilisation ${(damageLife * i.dff).toFixed(2)}).`,
    },
    warnings,
  };
}
