/**
 * shared/stats.js — statistical functions shared by the quick-stats and GUM calculators and the uncertainty feature:
 * log-gamma (Lanczos), regularised incomplete gamma and beta functions (series / continued fraction), the standard
 * normal and Student t distributions (CDF and quantile), descriptive statistics, quantiles, least-squares line and a
 * seeded random number generator for reproducible Monte Carlo runs.
 *
 * Every function is pure and dependency-free so it runs in Node (run-tests.js) and in the browser.
 */

const LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
const EPS = 1e-15;
const FPMIN = 1e-300;

/** Natural log of the gamma function for x > 0 (Lanczos g = 7, n = 9; relative error ≈ 1e-15). */
export function lgamma(x) {
  if (!(x > 0)) throw new Error(`lgamma needs a positive argument (got ${x})`);
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  const z = x - 1;
  let a = LANCZOS[0];
  for (let k = 1; k < 9; k += 1) a += LANCZOS[k] / (z + k);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Regularised lower incomplete gamma P(a, x). */
export function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let sum = 1 / a;
    let term = sum;
    for (let n = 1; n < 1000; n += 1) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * EPS) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  return 1 - gammaQ(a, x);
}

/** Regularised upper incomplete gamma Q(a, x) = 1 − P(a, x) (continued fraction for x ≥ a + 1). */
export function gammaQ(a, x) {
  if (x <= 0) return 1;
  if (x < a + 1) return 1 - gammaP(a, x);
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 1000; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

function betaContinuedFraction(a, b, x) {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 1000; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularised incomplete beta function I_x(a, b). */
export function betaI(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (front * betaContinuedFraction(a, b, x)) / a;
  return 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
}

/** Standard normal cumulative distribution Φ(z), accurate in both tails. */
export function normalCdf(z) {
  if (z >= 0) return 0.5 + 0.5 * gammaP(0.5, (z * z) / 2);
  return 0.5 * gammaQ(0.5, (z * z) / 2);
}

/** Standard normal quantile Φ⁻¹(p): Acklam's rational approximation refined by one Halley step. */
export function normalQuantile(p) {
  if (!(p > 0 && p < 1)) throw new Error(`normalQuantile needs 0 < p < 1 (got ${p})`);
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  let x;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pLow) {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const e = normalCdf(x) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
  return x - u / (1 + (x * u) / 2);
}

/** Student t cumulative distribution with ν degrees of freedom (ν = Infinity → normal). */
export function tCdf(t, nu) {
  if (!(nu > 0)) throw new Error(`tCdf needs ν > 0 (got ${nu})`);
  if (!Number.isFinite(nu) || nu > 1e7) return normalCdf(t);
  const tail = 0.5 * betaI(nu / 2, 0.5, nu / (nu + t * t));
  return t >= 0 ? 1 - tail : tail;
}

/** Student t quantile: the t with P(T ≤ t) = p (bracketing + bisection to machine precision). */
export function tQuantile(p, nu) {
  if (!(p > 0 && p < 1)) throw new Error(`tQuantile needs 0 < p < 1 (got ${p})`);
  if (!Number.isFinite(nu) || nu > 1e7) return normalQuantile(p);
  if (p === 0.5) return 0;
  let lo = -1;
  let hi = 1;
  while (tCdf(lo, nu) > p) lo *= 2;
  while (tCdf(hi, nu) < p) hi *= 2;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    if (tCdf(mid, nu) < p) lo = mid;
    else hi = mid;
    if (hi - lo <= 1e-14 * Math.max(1, Math.abs(mid))) break;
  }
  return (lo + hi) / 2;
}

/** Two-sided coverage factor for coverage probability `coverage` (e.g. 0.9545) and ν degrees of freedom. */
export function coverageFactor(coverage, nu) {
  return tQuantile((1 + coverage) / 2, nu);
}

/** Sum, mean, sample variance (n − 1) and standard deviation of an array of numbers. */
export function describe(values) {
  const n = values.length;
  if (n === 0) throw new Error('describe needs at least one value');
  const mean = values.reduce((s, v) => s + v, 0) / n;
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (const v of values) {
    const d = v - mean;
    m2 += d * d;
    m3 += d * d * d;
    m4 += d * d * d * d;
  }
  const variance = n > 1 ? m2 / (n - 1) : NaN;
  const sd = Math.sqrt(variance);
  const pm2 = m2 / n;
  const g1 = pm2 > 0 ? m3 / n / pm2 ** 1.5 : NaN;
  const g2 = pm2 > 0 ? m4 / n / (pm2 * pm2) - 3 : NaN;
  return {
    n,
    mean,
    variance,
    sd,
    populationSd: Math.sqrt(pm2),
    skewness: n > 2 ? (g1 * Math.sqrt(n * (n - 1))) / (n - 2) : NaN,
    excessKurtosis: n > 3 ? (((n + 1) * g2 + 6) * (n - 1)) / ((n - 2) * (n - 3)) : NaN,
  };
}

/** Quantile by linear interpolation between order statistics (Hyndman–Fan type 7, the Excel/NumPy default). */
export function quantile(sortedValues, p) {
  const n = sortedValues.length;
  if (n === 0) throw new Error('quantile needs at least one value');
  const h = (n - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.min(n - 1, lo + 1);
  return sortedValues[lo] + (h - lo) * (sortedValues[hi] - sortedValues[lo]);
}

/** Ordinary least-squares line y = a + b x with standard errors, R² and the two-sided p-value of the slope. */
export function linearFit(xs, ys) {
  const n = xs.length;
  if (n !== ys.length) throw new Error('linearFit needs x and y of equal length');
  if (n < 3) throw new Error('linearFit needs at least three points');
  const xm = xs.reduce((s, v) => s + v, 0) / n;
  const ym = ys.reduce((s, v) => s + v, 0) / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let k = 0; k < n; k += 1) {
    sxx += (xs[k] - xm) ** 2;
    sxy += (xs[k] - xm) * (ys[k] - ym);
    syy += (ys[k] - ym) ** 2;
  }
  if (sxx === 0) throw new Error('linearFit needs at least two different x values');
  const slope = sxy / sxx;
  const intercept = ym - slope * xm;
  const sse = Math.max(0, syy - slope * sxy);
  const s2 = sse / (n - 2);
  const slopeSe = Math.sqrt(s2 / sxx);
  const tStat = slopeSe > 0 ? slope / slopeSe : Infinity;
  const pValue = Number.isFinite(tStat) ? 2 * (1 - tCdf(Math.abs(tStat), n - 2)) : 0;
  return { n, slope, intercept, r2: syy > 0 ? (sxy * sxy) / (sxx * syy) : 1, slopeSe, interceptSe: Math.sqrt(s2 * (1 / n + (xm * xm) / sxx)), tStat, pValue, residualSd: Math.sqrt(s2) };
}

/** Grubbs' test critical value for n values at two-sided significance α (ISO 5725-2 single-outlier test). */
export function grubbsCritical(n, alpha) {
  const t = tQuantile(1 - alpha / (2 * n), n - 2);
  return ((n - 1) / Math.sqrt(n)) * Math.sqrt((t * t) / (n - 2 + t * t));
}

/** Seeded pseudo-random generator (mulberry32) returning numbers in [0, 1). */
export function seededRandom(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal deviate from a uniform generator (Box–Muller). */
export function normalDeviate(random) {
  let u = 0;
  while (u === 0) u = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

/** Parse a list of numbers separated by spaces, commas, semicolons, tabs or new lines (lines starting with # ignored). */
export function parseNumberList(text) {
  const values = [];
  for (const line of String(text).split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) continue;
    for (const token of clean.split(/[\s,;]+/)) {
      if (!token) continue;
      const v = Number(token);
      if (!Number.isFinite(v)) throw new Error(`"${token}" is not a number (use a point as decimal separator)`);
      values.push(v);
    }
  }
  return values;
}
