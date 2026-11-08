/**
 * distillation-stages/tests.js — checks of the Fenske, Underwood, Gilliland (Molokanov) and Kirkbride equations
 * against a published Fenske example, the McCabe–Thiele pinch for constant α, and hand calculations.
 * Run: node run-tests.js distillation-stages
 */
import { calculate, fenske, underwoodTheta, molokanov } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Fenske: benzene–toluene α = 2.4, x_D = 0.90, x_W = 0.10 needs n + 1 = 5.0 stages at total reflux',
    source: 'Al-Mustaqbal University College, Mass transfer lecture (Fenske example: n + 1 = 5.0, 4 plates plus the reboiler)',
    run: () => {
      assertClose(fenske(2.4, 0.9, 0.1), 5.0, { abs: 0.05 }, 'N_min');
      assertClose(fenske(2.4, 0.9, 0.1), Math.log(81) / Math.log(2.4), { rel: 1e-12 }, 'formula');
      assertClose(calculate({ alpha: 2.4, zf: 0.5, xd: 0.9, xb: 0.1 }).outputs.nmin, 5.019, { abs: 0.001 }, 'calculator');
    },
  },
  {
    name: 'Underwood for a saturated liquid feed equals the constant-α closed form [x_D/z − α(1 − x_D)/(1 − z)]/(α − 1) = 1.10',
    source: 'Seader, Henley & Roper, Ch. 9 (Underwood); McCabe–Thiele pinch at the feed composition for constant α',
    run: () => {
      const o = calculate({ alpha: 2.5, zf: 0.5, xd: 0.95, xb: 0.05, q: 1 }).outputs;
      assertClose(o.rmin, (0.95 / 0.5 - (2.5 * 0.05) / 0.5) / 1.5, { rel: 1e-9 }, 'R_min q = 1');
      const p = calculate({ alpha: 3, zf: 0.3, xd: 0.98, xb: 0.02, q: 1 }).outputs;
      assertClose(p.rmin, (0.98 / 0.3 - (3 * 0.02) / 0.7) / 2, { rel: 1e-9 }, 'second case');
    },
  },
  {
    name: 'Saturated vapour feed (q = 0): the pinch is at y = z, x = z/(α − (α − 1) z), so R_min = 2.10 for α = 2.5, z = 0.5, x_D = 0.95',
    source: 'McCabe–Thiele construction with constant α (q-line horizontal through y = z); hand calculation',
    run: () => {
      const o = calculate({ alpha: 2.5, zf: 0.5, xd: 0.95, xb: 0.05, q: 0 }).outputs;
      const xp = 0.5 / (2.5 - 1.5 * 0.5);
      const slope = (0.95 - 0.5) / (0.95 - xp);
      assertClose(o.rmin, slope / (1 - slope), { rel: 1e-9 }, 'R_min q = 0');
      assertClose(underwoodTheta(2.5, 0.5, 0), 1.75, { rel: 1e-9 }, 'θ');
    },
  },
  {
    name: 'Molokanov: Y = 0 at X = 1 (infinite reflux gives N = N_min), Y → 1 as X → 0; X = 0.1358 gives Y = 0.5185, N = 14.42',
    source: 'Molokanov et al. (1972), Int. Chem. Eng. 12, 209; Seader, Henley & Roper Ch. 9; hand calculation',
    run: () => {
      assertClose(molokanov(1), 0, { abs: 1e-12 }, 'X = 1');
      assertClose(molokanov(1e-8), 1, { abs: 1e-6 }, 'X → 0');
      const o = calculate({ alpha: 2.5, zf: 0.5, xd: 0.95, xb: 0.05, q: 1, r_ratio: 1.3 }).outputs;
      assertClose(o.y_gill, 0.51847, { abs: 1e-5 }, 'Y');
      assertClose(o.n, (o.nmin + o.y_gill) / (1 - o.y_gill), { rel: 1e-12 }, 'N');
      assertClose(o.n, 14.42, { abs: 0.01 }, 'N value');
    },
  },
  {
    name: 'Kirkbride: z = 0.4, x_D = 0.98, x_B = 0.02 gives B/D = 1.526 and N_R/N_S = (1.5 × 1 × 1.526)^0.206 = 1.186',
    source: 'Kirkbride equation (Seader, Henley & Roper Ch. 9); hand calculation',
    run: () => {
      const o = calculate({ alpha: 2.5, zf: 0.4, xd: 0.98, xb: 0.02, q: 1, feed_rate: 100 }).outputs;
      assertClose(o.nr / o.ns, (1.5 * ((0.98 - 0.4) / (0.4 - 0.02))) ** 0.206, { rel: 1e-9 }, 'ratio');
      assertClose(o.nr / o.ns, 1.186, { abs: 0.001 }, 'value');
      assertClose(o.distillate, 100 * 0.38 / 0.96, { rel: 1e-12 }, 'D');
      assertClose(o.nr + o.ns, o.n, { rel: 1e-12 }, 'sum');
    },
  },
  {
    name: 'More reflux means fewer stages; real trays are (N − 1)/E rounded up; impossible compositions are rejected',
    source: 'Gilliland correlation trend; validation contract',
    run: () => {
      const a = calculate({ r_ratio: 1.2 }).outputs.n;
      const b = calculate({ r_ratio: 2 }).outputs.n;
      assertEqual(a > b, true, 'trend');
      const o = calculate({ efficiency: 0.6 }).outputs;
      assertEqual(o.trays, Math.ceil((o.n - 1) / 0.6), 'trays');
      assertThrows(() => calculate({ xb: 0.6 }), 'x_B < z < x_D');
      assertThrows(() => calculate({ alpha: 1 }), 'Relative volatility');
    },
  },
];
