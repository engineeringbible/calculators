/**
 * distillation-stages/calc.js — binary distillation by the Fenske–Underwood–Gilliland shortcut: minimum stages at
 * total reflux (Fenske), minimum reflux (Underwood, any feed condition q), stages at the chosen reflux (Gilliland
 * correlation in Molokanov's form) and the feed stage (Kirkbride).
 *
 * Fenske: N_min = ln[(x_D/(1−x_D)) ((1−x_B)/x_B)] / ln α.  Underwood: α z/(α−θ) + (1−z)/(1−θ) = 1 − q, 1 < θ < α;
 * R_min + 1 = α x_D/(α−θ) + (1−x_D)/(1−θ).  Molokanov: X = (R−R_min)/(R+1), Y = (N−N_min)/(N+1)
 * = 1 − exp[(1 + 54.4X)/(11 + 117.2X) × (X − 1)/√X].  Kirkbride: N_R/N_S = [(z_HK/z_LK)(x_B,LK/x_D,HK)² B/D]^0.206.
 * Compositions are mole fractions of the light key. Stages are theoretical and include a partial reboiler.
 */
import { withDefaults, assertRange, assertNonNegative } from '../shared/validate.js';

/** Fenske minimum number of theoretical stages (including the reboiler) at total reflux. */
export const fenske = (alpha, xd, xb) => Math.log((xd / (1 - xd)) * ((1 - xb) / xb)) / Math.log(alpha);

/** Underwood root θ (1 < θ < α) for a binary feed of light-key fraction z and thermal condition q. */
export function underwoodTheta(alpha, z, q) {
  const f = (th) => (alpha * z) / (alpha - th) + (1 - z) / (1 - th) - (1 - q);
  let lo = 1 + 1e-12 * alpha; let hi = alpha * (1 - 1e-12);
  for (let k = 0; k < 300; k += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Molokanov et al. (1972) form of the Gilliland correlation: Y from X, 0 < X < 1. */
export const molokanov = (X) => 1 - Math.exp(((1 + 54.4 * X) / (11 + 117.2 * X)) * ((X - 1) / Math.sqrt(X)));

export const schema = {
  id: 'distillation-stages',
  name: 'Distillation stages calculator (Fenske–Underwood–Gilliland)',
  category: 'process',
  summary: 'Minimum stages (Fenske), minimum reflux (Underwood), theoretical stages at a reflux ratio (Gilliland, Molokanov) and feed stage (Kirkbride) of a binary column.',
  related: ['heat-exchanger-lmtd', 'boiler-efficiency', 'pump-power', 'steam-table'],
  assumptions: [
    'The mixture is binary with a constant relative volatility α of the light component to the heavy one; use the geometric mean of the top and bottom values. Constant molar overflow is assumed, so the method suits ideal and near-ideal mixtures and not azeotropes.',
    'Compositions are mole fractions of the light component: x_D in the distillate, x_B in the bottoms and z in the feed. The feed condition q is the fraction of the feed that is liquid: 1 for saturated liquid, 0 for saturated vapour, above 1 for subcooled liquid.',
    'Stage counts are theoretical (equilibrium) stages including a partial reboiler, with a total condenser not counted. Real trays = (N − 1) divided by the overall tray efficiency, rounded up.',
    'The Gilliland correlation (Molokanov form) is a fit to plate-to-plate results and is good for estimates: typically within about 7 % and occasionally 30 % (Wankat). Check the final design with a stage-by-stage or simulation calculation.',
    'The Kirkbride equation places the feed so that the rectifying and stripping sections have N_R and N_S stages; the feed stage is the first stage below N_R, counted from the top.',
  ],
  notes: [
    'Verification 2026-11-08: α = 2.5, z = 0.5, x_D = 0.95, x_B = 0.05, saturated liquid feed, R = 1.3 R_min: N_min = 6.43, R_min = 1.10, R = 1.43, X = 0.136, Y = 0.518, N = 14.4 including the reboiler, N_R = N_S = 7.2, feed on stage 8. Checked by hand.',
  ],
  sources: [
    'J. D. Seader, E. J. Henley & D. K. Roper, Separation Process Principles, 3rd ed., Ch. 9 (Fenske eq., Underwood eqs., Gilliland correlation with the Molokanov equation, Kirkbride equation)',
    'P. C. Wankat, Separation Process Engineering, 5th ed., Ch. 7 Approximate shortcut methods for multicomponent distillation (Fenske, Underwood, Gilliland; accuracy of the Gilliland correlation)',
    'Y. K. Molokanov, T. P. Korablina, N. I. Mazurina & G. A. Nikiforov, An approximation method for calculating the basic parameters of multicomponent fractionation, Int. Chem. Eng. 12 (2), 209–212 (1972)',
  ],
  inputs: [
    { id: 'alpha', label: 'Relative volatility α (light / heavy)', group: 'dimensionless', unit: 'none', default: 2.5, min: 1.01, max: 100, help: 'Benzene–toluene about 2.4–2.5; methanol–water about 3–7 (varies).' },
    { id: 'zf', label: 'Feed mole fraction of the light component z', group: 'ratio', unit: 'frac', display: 'pct', default: 0.5, min: 0.001, max: 0.999 },
    { id: 'xd', label: 'Distillate mole fraction x_D', group: 'ratio', unit: 'frac', display: 'pct', default: 0.95, min: 0.001, max: 0.99999 },
    { id: 'xb', label: 'Bottoms mole fraction x_B', group: 'ratio', unit: 'frac', display: 'pct', default: 0.05, min: 0.00001, max: 0.999 },
    { id: 'q', label: 'Feed condition q (1 saturated liquid, 0 saturated vapour)', group: 'dimensionless', unit: 'none', default: 1, min: -2, max: 3 },
    { id: 'r_ratio', label: 'Reflux ratio as a multiple of the minimum, R/R_min', group: 'dimensionless', unit: 'none', default: 1.3, min: 1.01, max: 20, help: 'Usual design range 1.1 to 1.5.' },
    { id: 'efficiency', label: 'Overall tray efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 1, min: 0.1, max: 1, help: 'Leave at 100 % for theoretical stages; typical trays 50–80 %.' },
    { id: 'feed_rate', label: 'Feed rate (optional, any molar unit such as kmol/h)', group: 'dimensionless', unit: 'none', default: 100, min: 0, max: 1e9 },
  ],
  outputs: [
    { id: 'nmin', label: 'Minimum stages N_min (Fenske, total reflux)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'rmin', label: 'Minimum reflux ratio R_min (Underwood)', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'r', label: 'Reflux ratio R = L/D', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'theta', label: 'Underwood root θ', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'x_gill', label: 'Gilliland X = (R − R_min)/(R + 1)', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'y_gill', label: 'Gilliland Y = (N − N_min)/(N + 1)', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'n', label: 'Theoretical stages N (including the reboiler)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'nr', label: 'Stages above the feed N_R (Kirkbride)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'ns', label: 'Stages below the feed N_S, reboiler included', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'feed_stage', label: 'Feed location', type: 'text' },
    { id: 'trays', label: 'Real trays in the column (N − 1)/efficiency, rounded up', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'distillate', label: 'Distillate rate D', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'bottoms', label: 'Bottoms rate B', group: 'dimensionless', unit: 'none', decimals: 2 },
  ],
  example: {
    inputs: { alpha: 2.5, zf: [50, 'pct'], xd: [95, 'pct'], xb: [5, 'pct'], q: 1, r_ratio: 1.3, efficiency: [100, 'pct'], feed_rate: 100 },
    results: { nmin: '6.43', rmin: '1.10', r: '1.43', x_gill: '0.136', y_gill: '0.518', n: '14.4', nr: '7.2' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const alpha = assertRange(x.alpha, 1.01, 100, 'alpha', 'Relative volatility');
  const z = assertRange(x.zf, 0.001, 0.999, 'zf', 'Feed mole fraction');
  const xd = assertRange(x.xd, 0.001, 0.99999, 'xd', 'Distillate mole fraction');
  const xb = assertRange(x.xb, 0.00001, 0.999, 'xb', 'Bottoms mole fraction');
  const q = assertRange(x.q, -2, 3, 'q', 'Feed condition q');
  const ratio = assertRange(x.r_ratio, 1.01, 20, 'r_ratio', 'Reflux ratio multiple');
  const eff = assertRange(x.efficiency, 0.1, 1, 'efficiency', 'Overall tray efficiency');
  const feed = assertNonNegative(x.feed_rate, 'feed_rate', 'Feed rate');
  if (!(xb < z && z < xd)) throw new Error('Distillate mole fraction: the compositions must satisfy x_B < z < x_D for the light component.');
  const nmin = fenske(alpha, xd, xb);
  const theta = underwoodTheta(alpha, z, q);
  const rmin = (alpha * xd) / (alpha - theta) + (1 - xd) / (1 - theta) - 1;
  if (!(rmin > 0)) throw new Error('Feed condition q: with this feed condition the Underwood minimum reflux is not positive; check q and the compositions.');
  const r = ratio * rmin;
  const X = (r - rmin) / (r + 1);
  const Y = molokanov(X);
  const n = (nmin + Y) / (1 - Y);
  const dOverF = (z - xb) / (xd - xb);
  const bOverD = (1 - dOverF) / dOverF;
  const kirk = (((1 - z) / z) * (xb / (1 - xd)) ** 2 * bOverD) ** 0.206;
  const nr = (n * kirk) / (1 + kirk);
  const ns = n - nr;
  const warnings = [];
  if (ratio < 1.05) warnings.push('R/R_min below 1.05: the stage count rises steeply near minimum reflux and the Gilliland correlation is least reliable there.');
  if (alpha < 1.2) warnings.push('Relative volatility below 1.2: a very difficult separation; check α carefully, as N_min grows with 1/ln α.');
  if (q < 0 || q > 1.5) warnings.push('Feed condition q outside 0 to 1.5: a superheated vapour or strongly subcooled feed changes the internal flows; check the result with a stage-by-stage calculation.');
  const feedStage = Math.round(nr) + 1;
  return {
    outputs: {
      nmin, rmin, r, theta, x_gill: X, y_gill: Y, n, nr, ns,
      feed_stage: `Feed onto stage ${feedStage} from the top of ${Math.ceil(n - 1e-9)} theoretical stages (the last being the reboiler)`,
      trays: Math.ceil((n - 1) / eff - 1e-9),
      distillate: feed > 0 ? feed * dOverF : null,
      bottoms: feed > 0 ? feed * (1 - dOverF) : null,
    },
    warnings,
  };
}
