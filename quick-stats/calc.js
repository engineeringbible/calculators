/**
 * quick-stats/calc.js — descriptive statistics of a pasted series: location and spread, the confidence interval of
 * the mean (Student t), quartiles, skewness and kurtosis, a least-squares trend with its significance, and outlier
 * screening by Tukey's fences, Chauvenet's criterion and Grubbs' test.
 *
 * x̄ ± t(1 − α/2, n − 1) s/√n;  y = a + b x (OLS), t = b/SE(b);  Tukey: outside Q1 − 1.5 IQR … Q3 + 1.5 IQR;
 * Chauvenet: n·P(|Z| > |x − x̄|/s) < 0.5;  Grubbs: G = max|x − x̄|/s > G_crit(n, α)
 */
import { withDefaults, assertOneOf } from '../shared/validate.js';
import { describe, quantile, linearFit, tQuantile, normalCdf, grubbsCritical, parseNumberList } from '../shared/stats.js';

const MAX_VALUES = 100000;

export const schema = {
  id: 'quick-stats',
  name: 'Quick statistics of a series',
  category: 'general',
  summary: 'Mean, standard deviation, confidence interval, quartiles, trend with significance and outliers (Tukey, Chauvenet, Grubbs) of a pasted series.',
  related: ['gum-uncertainty', 'admiralty-coefficient', 'fuel-voyage-cost', 'unit-converter'],
  sendTo: [
    {
      target: 'gum-uncertainty',
      label: 'Start an uncertainty budget (GUM) from these readings',
      note: 'Writes one Type A line (s and n of the data, so u = s/√n with n − 1 degrees of freedom) and the mean as the result; add the Type B components there.',
      links: [
        { to: 'components', template: '# name; type; value; c; dof; n\nRepeatability of the mean ({n} readings); typeA; {sd}; 1; ; {n}' },
        { to: 'result_value', from: 'mean' },
      ],
    },
  ],
  assumptions: [
    'The values are a random sample from one population; the confidence interval of the mean x̄ ± t(1 − α/2, n − 1) s/√n assumes approximately normal data or a sample large enough for the central limit theorem (n ≳ 30 for moderately skewed data); serially correlated data (time series of noon reports, sensor logs) make the interval too narrow, because the effective number of independent values is smaller than n.',
    'Sample standard deviation with n − 1; skewness G1 and excess kurtosis G2 with the small-sample corrections used by Excel SKEW/KURT; quartiles by linear interpolation between order statistics (type 7, the Excel PERCENTILE.INC / NumPy default — other software may differ slightly for small n).',
    'Trend: ordinary least-squares line against the observation number (one series) or against x (pairs), with the slope\'s two-sided p-value from the t distribution on n − 2 degrees of freedom; "significant" means p below 1 − confidence level; a linear trend through data with a step change or seasonality is a poor description of it.',
    'Outlier screening flags values for investigation; it does not justify deleting them (ISO 5725-2: remove only with a technical explanation). Tukey\'s fences (1.5 × IQR beyond the quartiles) need no distribution; Chauvenet\'s criterion (reject if n · P(|Z| > z) < 0.5) and Grubbs\' test (G = max|x − x̄|/s against the critical value at the chosen level, ISO 5725-2) assume normal data and test one value at a time; the "without outlier" statistics drop only the single Grubbs outlier.',
    'Input: numbers separated by new lines, spaces, commas, semicolons or tabs with a decimal point (comma-decimal locales must be converted); lines starting with # are ignored; at most 100 000 values.',
  ],
  notes: [
    'Verification 2026-10-31: 2, 4, 4, 4, 5, 5, 7, 9 gives mean 5, sample SD 2.138 (population 2), skewness 0.8185 and kurtosis 0.9406 (Excel), 95 % CI 3.21–6.79 with t 2.3646; the trend example 1, 3, 2, 5, 4 gives slope 0.8, R² 0.64, p 0.104; in the default fuel-consumption series 34.2 is flagged by all three tests (Grubbs G 2.75 > 2.290 for n = 10 at 5 %, Tukey fence 32.05).',
    'Design decision: the three outlier tests are shown side by side because practice differs between fields; none of them removes data automatically.',
  ],
  sources: [
    'NIST/SEMATECH e-Handbook of Statistical Methods, 1.3.5 (quantitative techniques: confidence limits, Grubbs\' test, Tukey) and 1.3.6.7.2 (t table)',
    'ISO 5725-2:2019 Accuracy (trueness and precision) of measurement methods and results — Part 2, 7.3.4 Grubbs\' test and Table 5',
    'J. R. Taylor, An Introduction to Error Analysis, 2nd ed., University Science Books 1997 — ch. 6 Chauvenet\'s criterion',
    'J. W. Tukey, Exploratory Data Analysis, Addison-Wesley 1977 (fences); D. C. Montgomery, G. C. Runger, Applied Statistics and Probability for Engineers, 7th ed. — regression inference',
  ],
  inputs: [
    { id: 'mode', label: 'Data layout', type: 'select', default: 'values', options: [{ value: 'values', label: 'One series (trend against the observation number)' }, { value: 'pairs', label: 'x y pairs, one pair per line (statistics of y, trend against x)' }] },
    { id: 'data', label: 'Data (paste from a spreadsheet or type)', type: 'textarea', rows: 10, default: '# Daily fuel consumption, t/day\n31.2\n30.8\n31.5\n30.9\n31.1\n31.4\n30.7\n31.0\n31.3\n34.2', help: 'Values separated by new lines, spaces, commas, semicolons or tabs; decimal point; lines starting with # are ignored.' },
    { id: 'confidence', label: 'Confidence level (interval, trend and Grubbs level)', type: 'select', default: '0.95', options: [{ value: '0.9', label: '90 %' }, { value: '0.95', label: '95 %' }, { value: '0.99', label: '99 %' }] },
  ],
  outputs: [
    { id: 'n', label: 'Number of values n', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'mean', label: 'Mean x̄', group: 'dimensionless', unit: 'none' },
    { id: 'median', label: 'Median', group: 'dimensionless', unit: 'none' },
    { id: 'sd', label: 'Standard deviation s (n − 1)', group: 'dimensionless', unit: 'none' },
    { id: 'population_sd', label: 'Population standard deviation (n)', group: 'dimensionless', unit: 'none' },
    { id: 'sem', label: 'Standard error of the mean s/√n', group: 'dimensionless', unit: 'none' },
    { id: 'ci_low', label: 'Confidence interval of the mean — lower', group: 'dimensionless', unit: 'none' },
    { id: 'ci_high', label: 'Confidence interval of the mean — upper', group: 'dimensionless', unit: 'none' },
    { id: 't_value', label: 'Student t used for the interval', group: 'dimensionless', unit: 'none' },
    { id: 'cv_pct', label: 'Coefficient of variation s/x̄', group: 'ratio', unit: 'pct' },
    { id: 'min', label: 'Minimum', group: 'dimensionless', unit: 'none' },
    { id: 'max', label: 'Maximum', group: 'dimensionless', unit: 'none' },
    { id: 'q1', label: 'First quartile Q1', group: 'dimensionless', unit: 'none' },
    { id: 'q3', label: 'Third quartile Q3', group: 'dimensionless', unit: 'none' },
    { id: 'iqr', label: 'Interquartile range', group: 'dimensionless', unit: 'none' },
    { id: 'skewness', label: 'Skewness G1', group: 'dimensionless', unit: 'none' },
    { id: 'kurtosis', label: 'Excess kurtosis G2', group: 'dimensionless', unit: 'none' },
    { id: 'trend_slope', label: 'Trend slope (per observation or per unit x)', group: 'dimensionless', unit: 'none' },
    { id: 'trend_intercept', label: 'Trend intercept', group: 'dimensionless', unit: 'none' },
    { id: 'trend_r2', label: 'Coefficient of determination R²', group: 'dimensionless', unit: 'none' },
    { id: 'trend_p', label: 'p-value of the slope (two-sided)', group: 'dimensionless', unit: 'none' },
    { id: 'trend_text', label: 'Trend', type: 'text' },
    { id: 'outliers_text', label: 'Outlier screening', type: 'text' },
    { id: 'outlier_table', label: 'Values flagged by any test', type: 'table' },
    { id: 'mean_clean', label: 'Mean without the Grubbs outlier', group: 'dimensionless', unit: 'none' },
    { id: 'sd_clean', label: 'Standard deviation without the Grubbs outlier', group: 'dimensionless', unit: 'none' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      mean: '31.41',
      median: '31.15',
      sd: '1.014',
      sem: '0.321',
      ci_low: '30.7',
      t_value: '2.262',
      min: '30.7',
      max: '34.2',
    },
  },
};

/** Parse the data text into { xs, ys } for the chosen layout. */
export function parseData(text, mode) {
  if (mode === 'values') {
    const ys = parseNumberList(text);
    return { xs: ys.map((_, k) => k + 1), ys };
  }
  const xs = [];
  const ys = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const parts = parseNumberList(clean);
    if (parts.length !== 2) throw new Error(`Line ${index + 1}: expected two numbers (x y), found ${parts.length}`);
    xs.push(parts[0]);
    ys.push(parts[1]);
  });
  return { xs, ys };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.mode, ['values', 'pairs'], 'mode', 'Data layout');
  assertOneOf(String(i.confidence), ['0.9', '0.95', '0.99'], 'confidence', 'Confidence level');
  const level = Number(i.confidence);
  const { xs, ys } = parseData(i.data, i.mode);
  const n = ys.length;
  if (n < 2) throw new Error('Enter at least two values');
  if (n > MAX_VALUES) throw new Error(`At most ${MAX_VALUES} values`);

  const d = describe(ys);
  const sorted = [...ys].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const t = tQuantile(1 - (1 - level) / 2, n - 1);
  const sem = d.sd / Math.sqrt(n);

  let fit = null;
  if (n >= 3 && new Set(xs).size > 1) fit = linearFit(xs, ys);

  const flagged = new Map();
  const flag = (k, test) => {
    if (!flagged.has(k)) flagged.set(k, new Set());
    flagged.get(k).add(test);
  };
  const lowFence = q1 - 1.5 * iqr;
  const highFence = q3 + 1.5 * iqr;
  ys.forEach((v, k) => { if (v < lowFence || v > highFence) flag(k, 'Tukey'); });
  if (d.sd > 0) {
    ys.forEach((v, k) => {
      const z = Math.abs(v - d.mean) / d.sd;
      if (n * 2 * (1 - normalCdf(z)) < 0.5) flag(k, 'Chauvenet');
    });
  }
  let grubbsIndex = -1;
  let gStat = null;
  let gCrit = null;
  if (n >= 3 && d.sd > 0) {
    ys.forEach((v, k) => {
      const g = Math.abs(v - d.mean) / d.sd;
      if (gStat === null || g > gStat) { gStat = g; grubbsIndex = k; }
    });
    gCrit = grubbsCritical(n, 1 - level);
    if (gStat > gCrit) flag(grubbsIndex, 'Grubbs');
    else grubbsIndex = -1;
  }
  const clean = grubbsIndex >= 0 ? ys.filter((_, k) => k !== grubbsIndex) : ys;
  const dClean = clean.length >= 2 ? describe(clean) : null;

  const rows = [...flagged.entries()].sort((a, b) => a[0] - b[0]).map(([k, tests]) => [
    ys[k],
    i.mode === 'values' ? k + 1 : xs[k],
    d.sd > 0 ? (ys[k] - d.mean) / d.sd : null,
    [...tests].join(', '),
  ]);
  const alphaPct = Math.round((1 - level) * 100);
  const outliersText = flagged.size === 0
    ? `No value flagged: Tukey fences ${lowFence.toPrecision(5)} … ${highFence.toPrecision(5)}; Grubbs G ${gStat === null ? '—' : gStat.toFixed(3)} ≤ ${gCrit === null ? '—' : gCrit.toFixed(3)} (α ${alphaPct} %).`
    : `${flagged.size} value(s) flagged — Tukey fences ${lowFence.toPrecision(5)} … ${highFence.toPrecision(5)}; Grubbs G ${gStat.toFixed(3)} vs critical ${gCrit.toFixed(3)} (α ${alphaPct} %)${grubbsIndex >= 0 ? `: ${ys[grubbsIndex]} is a Grubbs outlier` : ': no Grubbs outlier'}.`;

  let trendText = 'Not computed (needs at least three values with different x).';
  if (fit) {
    const significant = fit.pValue < 1 - level;
    trendText = `${significant ? 'Significant' : 'Not significant'} at ${Math.round(level * 100)} %: slope ${fit.slope.toPrecision(4)} ± ${(tQuantile(1 - (1 - level) / 2, n - 2) * fit.slopeSe).toPrecision(3)} per ${i.mode === 'values' ? 'observation' : 'unit of x'} (p = ${fit.pValue.toPrecision(3)}, R² = ${fit.r2.toFixed(3)}).`;
  }

  const warnings = [];
  if (n < 10) warnings.push('Fewer than 10 values: the interval is wide and outlier tests have little power.');
  if (Math.abs(d.skewness) > 1) warnings.push(`Strong skewness (G1 = ${d.skewness.toFixed(2)}): the normal-theory interval and the Chauvenet/Grubbs tests are unreliable; the median and quartiles describe the data better.`);
  if (flagged.size > 0) warnings.push('Flagged values should be investigated for a physical cause (sensor fault, transcription error, different condition) — do not delete data without one.');
  if (fit && fit.pValue < 1 - level) warnings.push('A significant trend means the values are not one stationary population: the mean and its interval describe the period, not a stable level.');
  warnings.push('Serial correlation (consecutive readings, noon reports) narrows the interval artificially; the values are treated as independent.');

  return {
    outputs: {
      n,
      mean: d.mean,
      median: quantile(sorted, 0.5),
      sd: d.sd,
      population_sd: d.populationSd,
      sem,
      ci_low: d.mean - t * sem,
      ci_high: d.mean + t * sem,
      t_value: t,
      cv_pct: d.mean !== 0 ? (d.sd / Math.abs(d.mean)) * 100 : null,
      min: sorted[0],
      max: sorted[n - 1],
      q1,
      q3,
      iqr,
      skewness: Number.isFinite(d.skewness) ? d.skewness : null,
      kurtosis: Number.isFinite(d.excessKurtosis) ? d.excessKurtosis : null,
      trend_slope: fit ? fit.slope : null,
      trend_intercept: fit ? fit.intercept : null,
      trend_r2: fit ? fit.r2 : null,
      trend_p: fit ? fit.pValue : null,
      trend_text: trendText,
      outliers_text: outliersText,
      outlier_table: rows.length ? { columns: ['Value', i.mode === 'values' ? 'Position' : 'x', 'z = (x − x̄)/s', 'Flagged by'], rows } : { columns: ['Value', 'Flagged by'], rows: [['—', 'none']] },
      mean_clean: dClean ? dClean.mean : null,
      sd_clean: dClean ? dClean.sd : null,
    },
    warnings,
  };
}
