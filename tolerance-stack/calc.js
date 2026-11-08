/**
 * tolerance-stack/calc.js — one-dimensional tolerance stack-up of a chain of dimensions: worst case, root sum of
 * squares and a seeded Monte Carlo simulation with normal or uniform distributions, with the yield against limits.
 *
 * mean_i = nominal_i + (plus_i − minus_i)/2;  h_i = (plus_i + minus_i)/2;  gap = Σ s_i mean_i
 * worst case: gap ± Σ h_i;  RSS: gap ± √(Σ h_i²);  σ_gap = √(Σ σ_i²) with σ_i = h_i/z (normal) or h_i/√3 (uniform)
 * Schema units: mm (any consistent length unit).
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';
import { seededRandom, normalDeviate, normalCdf, quantile } from '../shared/stats.js';

const SEED = 20261031;
const DEFAULT_CHAIN = [
  '# name; direction (+ or −); nominal; plus tolerance; minus tolerance (optional)',
  'Housing length; +; 120.00; 0.10',
  'Bearing width; -; 25.00; 0.05',
  'Spacer; -; 70.00; 0.08',
  'Shaft shoulder to groove; -; 24.50; 0.06',
].join('\n');

export const schema = {
  id: 'tolerance-stack',
  name: 'Tolerance stack-up',
  category: 'mechanical',
  summary: 'Worst-case, root-sum-square and Monte Carlo results of a dimension chain, with the share of each dimension and the yield against limits.',
  related: ['quick-stats', 'gum-uncertainty', 'interference-fit', 'thermal-expansion'],
  assumptions: [
    'One-dimensional chain: the resulting dimension (gap) is the signed sum of the dimensions; an unequal tolerance is replaced by its mid-tolerance value with a symmetric half-width h = (plus + minus)/2.',
    'Worst case adds the half-widths, Σ h_i, and holds for every combination of parts; the root sum of squares, √(Σ h_i²), assumes independent dimensions centred in their tolerances, each spread over the same multiple of its standard deviation.',
    'Monte Carlo: each dimension is drawn independently, normal with σ = h/z (z = 3 makes the tolerance ±3σ) or uniform over ±h, with a fixed seed so that a rerun repeats; the yield is the share of simulated assemblies within the limits. The tools that run the calculator many times (uncertainty band, long sweeps) repeat the simulation each time, so switch it off for them.',
    'Process mean shifts, correlated dimensions, geometric tolerances (form, position) and two- or three-dimensional chains are not included.',
  ],
  notes: [
    'Verification 2026-10-31: the default chain 120 − 25 − 70 − 24.5 gives a 0.50 mm gap, ±0.29 mm worst case and ±√(0.0225) = ±0.15 mm by RSS; with normal parts at ±3σ the Monte Carlo SD converges on 0.05 mm.',
    'Design decision: the normal-approximation yield uses σ_gap from the chosen distribution; with uniform parts and few dimensions the true distribution is flatter than normal, and the Monte Carlo yield is the better estimate.',
  ],
  sources: [
    'P. J. Drake (ed.), Dimensioning and Tolerancing Handbook, McGraw-Hill 1999, ch. 9 — worst-case and statistical tolerance analysis',
    'A. Fortini, Dimensioning for Interchangeable Manufacture, Industrial Press 1967 — root-sum-square stack-up',
  ],
  inputs: [
    { id: 'chain', label: 'Dimension chain (one per line: name; + or −; nominal; plus tolerance; minus tolerance)', type: 'textarea', rows: 7, default: DEFAULT_CHAIN },
    {
      id: 'distribution',
      label: 'Distribution of each dimension',
      type: 'select',
      default: 'normal',
      options: [
        { value: 'normal', label: 'Normal, tolerance = z σ' },
        { value: 'uniform', label: 'Uniform over the tolerance' },
      ],
    },
    { id: 'z', label: 'Tolerance in standard deviations z', group: 'dimensionless', unit: 'none', default: 3, min: 1, max: 6, visibleWhen: { distribution: 'normal' } },
    {
      id: 'monte_carlo',
      label: 'Monte Carlo simulation',
      type: 'select',
      default: 'on',
      options: [
        { value: 'on', label: 'On' },
        { value: 'off', label: 'Off (worst case and RSS only; faster with the tools)' },
      ],
    },
    { id: 'trials', label: 'Monte Carlo trials', group: 'dimensionless', unit: 'none', default: 20000, min: 1000, max: 200000, visibleWhen: { monte_carlo: 'on' }, integer: true },
    { id: 'lower_limit', label: 'Lower limit of the gap', group: 'length', unit: 'mm', default: 0.35, min: -1e6, max: 1e6 },
    { id: 'upper_limit', label: 'Upper limit of the gap', group: 'length', unit: 'mm', default: 0.65, min: -1e6, max: 1e6 },
  ],
  outputs: [
    { id: 'nominal_mm', label: 'Gap at mid-tolerance', group: 'length', unit: 'mm' },
    { id: 'worst_min_mm', label: 'Worst case: smallest gap', group: 'length', unit: 'mm' },
    { id: 'worst_max_mm', label: 'Worst case: largest gap', group: 'length', unit: 'mm' },
    { id: 'rss_mm', label: 'Root sum of squares: ±', group: 'length', unit: 'mm' },
    { id: 'sigma_mm', label: 'Standard deviation of the gap', group: 'length', unit: 'mm' },
    { id: 'mc_sd_mm', label: 'Monte Carlo standard deviation', group: 'length', unit: 'mm', visibleWhen: { monte_carlo: 'on' } },
    { id: 'mc_low_mm', label: 'Monte Carlo 0.135 % percentile', group: 'length', unit: 'mm', visibleWhen: { monte_carlo: 'on' } },
    { id: 'mc_high_mm', label: 'Monte Carlo 99.865 % percentile', group: 'length', unit: 'mm', visibleWhen: { monte_carlo: 'on' } },
    { id: 'mc_yield_pct', label: 'Monte Carlo yield within the limits', group: 'ratio', unit: 'pct', visibleWhen: { monte_carlo: 'on' } },
    { id: 'normal_yield_pct', label: 'Normal-approximation yield within the limits', group: 'ratio', unit: 'pct' },
    { id: 'cpk', label: 'Cpk of the gap', group: 'dimensionless', unit: 'none' },
    { id: 'chain_table', label: 'Contributions', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      nominal_mm: '0.50 mm',
      worst_max_mm: '0.79 mm',
      rss_mm: '0.15 mm',
      mc_high_mm: '0.65 mm',
      mc_yield_pct: '99.73 %',
      normal_yield_pct: '99.73 %',
    },
  },
};

/** Lines of "name; + or −; nominal; plus; minus" → [{ name, sign, nominal, plus, minus }]. */
export function parseChain(text) {
  const dims = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const fields = clean.split(/;|\t/).map((f) => f.trim());
    const where = `Line ${index + 1}`;
    if (fields.length < 4) throw new Error(`${where}: expected name; + or −; nominal; plus tolerance[; minus tolerance]`);
    const sign = fields[1] === '+' ? 1 : ['-', '−', '–'].includes(fields[1]) ? -1 : 0;
    if (!sign) throw new Error(`${where}: the direction must be + or −`);
    const num = (v) => Number(String(v).replace(',', '.'));
    const nominal = num(fields[2]);
    const plus = num(fields[3]);
    const minus = fields[4] !== undefined && fields[4] !== '' ? num(fields[4]) : plus;
    if (![nominal, plus, minus].every(Number.isFinite)) throw new Error(`${where}: nominal and tolerances must be numbers`);
    if (plus < 0 || minus < 0) throw new Error(`${where}: tolerances are entered as positive amounts`);
    dims.push({ name: fields[0] || `Dimension ${dims.length + 1}`, sign, nominal, plus, minus });
  });
  if (!dims.length) throw new Error('Enter at least one dimension');
  return dims;
}

/** Seeded Monte Carlo of the gap: standard deviation, 0.135 % and 99.865 % percentiles and share within the limits. */
export function simulate(parts, distribution, trials, lower, upper) {
  const random = seededRandom(SEED);
  const samples = new Float64Array(trials);
  let inside = 0;
  for (let t = 0; t < trials; t += 1) {
    let value = 0;
    for (const p of parts) {
      const draw = distribution === 'normal' ? p.mean + p.sigma * normalDeviate(random) : p.mean + p.half * (2 * random() - 1);
      value += p.sign * draw;
    }
    samples[t] = value;
    if (value >= lower && value <= upper) inside += 1;
  }
  const mean = samples.reduce((s, v) => s + v, 0) / trials;
  const sd = Math.sqrt(samples.reduce((s, v) => s + (v - mean) ** 2, 0) / (trials - 1));
  const sorted = Array.from(samples).sort((a, b) => a - b);
  return { sd, low: quantile(sorted, 0.00135), high: quantile(sorted, 0.99865), yieldPct: (inside / trials) * 100 };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.distribution, ['normal', 'uniform'], 'distribution', 'Distribution');
  assertRange(i.z, 0.5, 10, 'z', 'Tolerance in standard deviations');
  assertOneOf(i.monte_carlo, ['on', 'off'], 'monte_carlo', 'Monte Carlo simulation');
  assertInteger(i.trials, 'trials', 'Monte Carlo trials');
  assertRange(i.trials, 100, 2e6, 'trials', 'Monte Carlo trials');
  if (!(i.upper_limit > i.lower_limit)) throw new Error('The upper limit must be above the lower limit');
  const dims = parseChain(i.chain);

  const parts = dims.map((d) => {
    const half = (d.plus + d.minus) / 2;
    const mean = d.nominal + (d.plus - d.minus) / 2;
    const sigma = i.distribution === 'normal' ? half / i.z : half / Math.sqrt(3);
    return { ...d, half, mean, sigma };
  });
  const gap = parts.reduce((sum, p) => sum + p.sign * p.mean, 0);
  const worst = parts.reduce((sum, p) => sum + p.half, 0);
  const rss = Math.sqrt(parts.reduce((sum, p) => sum + p.half ** 2, 0));
  const sigma = Math.sqrt(parts.reduce((sum, p) => sum + p.sigma ** 2, 0));
  const mc = i.monte_carlo === 'on' ? simulate(parts, i.distribution, i.trials, i.lower_limit, i.upper_limit) : null;
  const normalYield = sigma > 0 ? normalCdf((i.upper_limit - gap) / sigma) - normalCdf((i.lower_limit - gap) / sigma) : gap >= i.lower_limit && gap <= i.upper_limit ? 1 : 0;
  const cpk = sigma > 0 ? Math.min(i.upper_limit - gap, gap - i.lower_limit) / (3 * sigma) : Infinity;
  const variance = sigma ** 2;
  const yieldPct = mc ? mc.yieldPct : normalYield * 100;

  const warnings = [];
  if (gap - worst < i.lower_limit || gap + worst > i.upper_limit) warnings.push(`The worst case (${(gap - worst).toFixed(4)} to ${(gap + worst).toFixed(4)}) goes outside the limits; about ${(100 - yieldPct).toFixed(3)} % of assemblies would.`);
  if (gap < i.lower_limit || gap > i.upper_limit) warnings.push('Even the mid-tolerance gap is outside the limits: change a nominal dimension.');
  if (dims.length < 4 && i.distribution === 'uniform') warnings.push('With few uniform dimensions the gap is far from normal; rely on the Monte Carlo yield.');

  return {
    outputs: {
      nominal_mm: gap,
      worst_min_mm: gap - worst,
      worst_max_mm: gap + worst,
      rss_mm: rss,
      sigma_mm: sigma,
      mc_sd_mm: mc ? mc.sd : null,
      mc_low_mm: mc ? mc.low : null,
      mc_high_mm: mc ? mc.high : null,
      mc_yield_pct: mc ? mc.yieldPct : null,
      normal_yield_pct: normalYield * 100,
      cpk,
      chain_table: {
        columns: ['Dimension', 'Direction', 'Mid-tolerance value', 'Half-width ±', 'Share of variance (%)'],
        rows: parts.map((p) => [p.name, p.sign > 0 ? '+' : '−', p.mean, p.half, variance > 0 ? ((p.sigma ** 2) / variance) * 100 : 0]),
      },
      summary: `Gap ${gap.toFixed(4)}: worst case ±${worst.toFixed(4)}, RSS ±${rss.toFixed(4)}; ${mc ? `Monte Carlo SD ${mc.sd.toFixed(4)} and ` : ''}${yieldPct.toFixed(3)} % within ${i.lower_limit} to ${i.upper_limit} (Cpk ${Number.isFinite(cpk) ? cpk.toFixed(2) : '∞'}).`,
    },
    warnings,
  };
}
