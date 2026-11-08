/**
 * reliability/calc.js — steady-state availability and mission reliability of a system of blocks in series, each block
 * k-out-of-n identical repairable units, and a two-parameter Weibull fit of failure times by median-rank regression.
 *
 * unit: A = MTBF / (MTBF + MTTR);  R(t) = e^(−t/MTBF)
 * block: P = Σ_{j=k..n} C(n, j) p^j (1 − p)^(n−j);  system: Π P_block
 * Weibull: F_i = (i − 0.3)/(n + 0.4);  ln t = ln η + (1/β) ln(−ln(1 − F))  (regression of x on y)
 * Schema units: hours, percent.
 */
import { withDefaults, assertRange, assertNonNegative } from '../shared/validate.js';
import { lgamma, linearFit, parseNumberList } from '../shared/stats.js';

const HOURS_PER_YEAR = 8766;
const DEFAULT_BLOCKS = [
  '# name; units installed n; units needed k; MTBF h; MTTR h',
  'Main engine; 1; 1; 5000; 24',
  'Generating sets; 3; 2; 4000; 12',
  'Steering gear pumps; 2; 1; 8000; 6',
  'Fuel supply pumps; 2; 1; 6000; 4',
].join('\n');
const DEFAULT_FAILURES = '# failure times (hours), one per line or separated by commas\n1200, 1850, 2400, 2900, 3500, 4200, 5100';

export const schema = {
  id: 'reliability',
  name: 'Reliability and redundancy',
  category: 'general',
  summary: 'Availability and mission reliability of series, parallel and k-out-of-n systems, and a Weibull fit of failure times by median-rank regression.',
  related: ['quick-stats', 'gum-uncertainty', 'bearing-life', 'generator-load'],
  assumptions: [
    'Reliability block diagram of independent blocks in series, each with n identical units of which k must work (k = n series, k = 1 parallel redundancy); unit failures and repairs are independent, every unit has its own repair (no queue), and switching to a standby unit is perfect (IEC 61078).',
    'Steady-state availability of a unit A = MTBF/(MTBF + MTTR); mission reliability without repair R(t) = e^(−t/MTBF) for a constant failure rate. A block works with probability Σ_{j=k..n} C(n, j) p^j (1 − p)^(n−j); the system is the product of its blocks.',
    'Weibull analysis (IEC 61649): complete (uncensored) failure times are ranked, given Bernard\'s median ranks F = (i − 0.3)/(n + 0.4) and fitted by least squares of ln t on ln(−ln(1 − F)); β is the shape and η the characteristic life. Suspended items, three-parameter fits and confidence bounds are not included.',
    'B10 life is the time by which 10 % of units fail, η (−ln 0.9)^(1/β); the mean life is η Γ(1 + 1/β).',
  ],
  notes: [
    'Verification 2026-10-31: a 2-out-of-3 block of units with A = 4000/4012 has A = 3A² − 2A³ = 0.999973; failure times generated exactly at the median ranks of a Weibull with β = 2, η = 3000 h return those parameters to 10⁻¹² by the regression.',
    'Design decision: the year for downtime is 8766 h (365.25 days); the fit regresses ln t on the ranks (rank regression on X), which the literature recommends because the times, not the ranks, carry the scatter.',
  ],
  sources: [
    'IEC 61078:2016 Reliability block diagrams — series, parallel and k-out-of-n structures',
    'IEC 61649:2008 Weibull analysis — median ranks and rank regression',
    'R. B. Abernethy, The New Weibull Handbook, 5th ed., 2006 — median rank regression, regression of X on Y, B lives',
  ],
  inputs: [
    { id: 'blocks', label: 'System blocks in series (one per line: name; units installed; units needed; MTBF h; MTTR h)', type: 'textarea', rows: 6, default: DEFAULT_BLOCKS },
    { id: 'mission_h', label: 'Mission time (no repair)', group: 'time', unit: 'h', default: 720, min: 0.01, max: 1e6 },
    { id: 'failures', label: 'Failure times for the Weibull fit (hours)', type: 'textarea', rows: 4, default: DEFAULT_FAILURES },
  ],
  outputs: [
    { id: 'availability_pct', label: 'System steady-state availability', group: 'ratio', unit: 'pct' },
    { id: 'downtime_h_year', label: 'Expected downtime per year', group: 'time', unit: 'h' },
    { id: 'mission_reliability_pct', label: 'System reliability over the mission (no repair)', group: 'ratio', unit: 'pct' },
    { id: 'blocks_table', label: 'Blocks', type: 'table' },
    { id: 'weibull_beta', label: 'Weibull shape β', group: 'dimensionless', unit: 'none' },
    { id: 'weibull_eta_h', label: 'Weibull characteristic life η', group: 'time', unit: 'h' },
    { id: 'weibull_r2', label: 'Coefficient of determination R²', group: 'dimensionless', unit: 'none' },
    { id: 'b10_h', label: 'B10 life', group: 'time', unit: 'h' },
    { id: 'mean_life_h', label: 'Mean life η Γ(1 + 1/β)', group: 'time', unit: 'h' },
    { id: 'weibull_table', label: 'Median ranks', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      availability_pct: '99.5195 %',
      downtime_h_year: '42 h',
      weibull_beta: '2.17',
      weibull_eta_h: '3464 h',
      b10_h: '1230 h',
    },
  },
};

/** Probability that at least k of n independent units with probability p work. */
export function kOutOfN(k, n, p) {
  let sum = 0;
  for (let j = k; j <= n; j += 1) sum += Math.exp(lgamma(n + 1) - lgamma(j + 1) - lgamma(n - j + 1)) * p ** j * (1 - p) ** (n - j);
  return Math.min(1, sum);
}

/** Lines of "name; n; k; MTBF; MTTR" → [{ name, n, k, mtbf, mttr }]. */
export function parseBlocks(text) {
  const blocks = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const fields = clean.split(/;|\t/).map((f) => f.trim());
    const where = `Line ${index + 1}`;
    if (fields.length < 5) throw new Error(`${where}: expected name; units installed; units needed; MTBF h; MTTR h`);
    const [n, k, mtbf, mttr] = fields.slice(1, 5).map((f) => Number(f.replace(',', '.')));
    if (!Number.isInteger(n) || !Number.isInteger(k) || n < 1 || k < 1 || k > n) throw new Error(`${where}: units installed and needed must be whole numbers with 1 ≤ needed ≤ installed`);
    if (!(mtbf > 0) || !(mttr >= 0)) throw new Error(`${where}: MTBF must be greater than zero and MTTR not negative`);
    blocks.push({ name: fields[0] || `Block ${blocks.length + 1}`, n, k, mtbf, mttr });
  });
  if (!blocks.length) throw new Error('Enter at least one block');
  return blocks;
}

/** Two-parameter Weibull by median-rank regression of ln t on ln(−ln(1 − F)), Bernard ranks. */
export function weibullFit(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const n = sorted.length;
  const ranks = sorted.map((_, idx) => (idx + 1 - 0.3) / (n + 0.4));
  const y = ranks.map((f) => Math.log(-Math.log(1 - f)));
  const x = sorted.map((t) => Math.log(t));
  const fit = linearFit(y, x);
  const beta = 1 / fit.slope;
  const eta = Math.exp(fit.intercept);
  return { beta, eta, r2: fit.r2, sorted, ranks };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertRange(i.mission_h, 0, 1e9, 'mission_h', 'Mission time');
  const blocks = parseBlocks(i.blocks);
  const times = parseNumberList(i.failures);
  times.forEach((t, idx) => assertNonNegative(t, 'failures', `Failure time ${idx + 1}`));
  if (times.some((t) => t === 0)) throw new Error('Failure times must be greater than zero');
  if (times.length >= 3 && new Set(times).size < 2) throw new Error('The failure times must not all be equal');

  const rows = blocks.map((b) => {
    const unitA = b.mtbf / (b.mtbf + b.mttr);
    const unitR = Math.exp(-i.mission_h / b.mtbf);
    return { ...b, unitA, blockA: kOutOfN(b.k, b.n, unitA), blockR: kOutOfN(b.k, b.n, unitR) };
  });
  const availability = rows.reduce((p, r) => p * r.blockA, 1);
  const missionR = rows.reduce((p, r) => p * r.blockR, 1);
  const weakest = rows.reduce((w, r) => (r.blockA < w.blockA ? r : w));

  const warnings = [];
  let weibull = null;
  if (times.length >= 3) {
    weibull = weibullFit(times);
    if (weibull.r2 < 0.9) warnings.push(`R² = ${weibull.r2.toFixed(3)}: the failure times do not follow one Weibull line well; look for mixed failure modes or a failure-free period.`);
    if (weibull.beta < 1) warnings.push(`β = ${weibull.beta.toFixed(2)} < 1: early failures dominate (infant mortality); preventive replacement would not help.`);
    else if (weibull.beta > 1.5) warnings.push(`β = ${weibull.beta.toFixed(2)}: wear-out; planned replacement before the B10 life can reduce failures.`);
  } else warnings.push('At least three failure times are needed for the Weibull fit.');
  if (times.length > 0 && times.length < 6) warnings.push('Fewer than six failures: the Weibull parameters are very uncertain.');
  warnings.push(`The weakest block is "${weakest.name}" (availability ${(weakest.blockA * 100).toFixed(4)} %).`);

  return {
    outputs: {
      availability_pct: availability * 100,
      downtime_h_year: (1 - availability) * HOURS_PER_YEAR,
      mission_reliability_pct: missionR * 100,
      blocks_table: {
        columns: ['Block', 'Units (needed of installed)', 'Unit availability (%)', 'Block downtime (h/year)', `Block reliability over ${i.mission_h} h (%)`],
        rows: rows.map((r) => [r.name, `${r.k} of ${r.n}`, r.unitA * 100, (1 - r.blockA) * HOURS_PER_YEAR, r.blockR * 100]),
      },
      weibull_beta: weibull ? weibull.beta : null,
      weibull_eta_h: weibull ? weibull.eta : null,
      weibull_r2: weibull ? weibull.r2 : null,
      b10_h: weibull ? weibull.eta * (-Math.log(0.9)) ** (1 / weibull.beta) : null,
      mean_life_h: weibull ? weibull.eta * Math.exp(lgamma(1 + 1 / weibull.beta)) : null,
      weibull_table: weibull ? { columns: ['Order i', 'Failure time (h)', 'Median rank (%)'], rows: weibull.sorted.map((t, idx) => [idx + 1, t, weibull.ranks[idx] * 100]) } : null,
      summary: `System availability ${(availability * 100).toFixed(4)} % (${((1 - availability) * HOURS_PER_YEAR).toFixed(1)} h of downtime a year) and ${(missionR * 100).toFixed(2)} % reliability over ${i.mission_h} h without repair${weibull ? `; Weibull β = ${weibull.beta.toFixed(2)}, η = ${weibull.eta.toFixed(0)} h` : ''}.`,
    },
    warnings,
  };
}
