/**
 * sea-state-statistics/tests.js — spectrum moments against DNV-RP-C205 and Rayleigh statistics against Longuet-Higgins.
 * Run: node run-tests.js sea-state-statistics
 */
import { calculate, spectralMoments, dnvGamma, meanOfHighest } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const tzOverTp = (m, tp) => (2 * Math.PI * Math.sqrt(m.m0 / m.m2)) / tp;
const t1OverTp = (m, tp) => (2 * Math.PI * m.m0) / m.m1 / tp;

export const tests = [
  {
    name: 'Pierson–Moskowitz (γ = 1): the integral returns m0 = Hs²/16 exactly, Tz = 0.710 Tp and T1 = 0.772 Tp',
    source: 'DNV-RP-C205 (2021) §3.5.5, Pierson–Moskowitz period relations Tz = 0.710 Tp and T1 = 0.772 Tp',
    run: () => {
      const m = spectralMoments(4, 10, 1);
      assertClose(m.m0, 1, { rel: 1e-6 }, 'm0 = 16/16');
      assertClose(tzOverTp(m, 10), 0.7104, { abs: 5e-4 }, 'Tz/Tp');
      assertClose(t1OverTp(m, 10), 0.7718, { abs: 5e-4 }, 'T1/Tp');
    },
  },
  {
    name: 'JONSWAP γ = 3.3: Tz/Tp = 0.6673 + 0.05037γ − 0.006230γ² + 0.0003341γ³ = 0.778 and T1/Tp = 0.835 from the DNV regressions agree with the integrated spectrum within 1 %; m0 is within 1 % of Hs²/16',
    source: 'DNV-RP-C205 (2021) §3.5.5.6 regressions for Tz/Tp and T1/Tp (1 ≤ γ < 7)',
    run: () => {
      const g = 3.3;
      const m = spectralMoments(4, 10, g);
      const tz = 0.6673 + 0.05037 * g - 0.006230 * g * g + 0.0003341 * g ** 3;
      const t1 = 0.7303 + 0.04936 * g - 0.006556 * g * g + 0.0003610 * g ** 3;
      assertClose(tzOverTp(m, 10), tz, { rel: 0.01 }, 'Tz/Tp');
      assertClose(t1OverTp(m, 10), t1, { rel: 0.01 }, 'T1/Tp');
      assertClose(m.m0, 1, { rel: 0.01 }, 'normalisation A_γ');
    },
  },
  {
    name: 'DNV γ rule: Hs 4 m with Tp 6 s (Tp/√Hs = 3) gives 5, with Tp 8 s (4.0) gives exp(5.75 − 4.6) = 3.158, with Tp 10 s (5.0) gives 1',
    source: 'DNV-RP-C205 (2021) §3.5.5.5',
    run: () => {
      assertClose(dnvGamma(4, 6), 5, { rel: 1e-12 }, 'steep sea');
      assertClose(dnvGamma(4, 8), Math.exp(1.15), { rel: 1e-12 }, 'intermediate');
      assertClose(dnvGamma(4, 10), 1, { rel: 1e-12 }, 'developed sea');
      assertClose(calculate({ hs_m: 4, period_s: 8 }).outputs.gamma_used, Math.exp(1.15), { rel: 1e-12 }, 'page uses the rule');
    },
  },
  {
    name: 'Rayleigh heights: the highest third, tenth and hundredth average 1.416, 1.800 and 2.360 H_rms; one wave in e² = 7.4 exceeds Hs; the mean height is 0.886 H_rms',
    source: 'Longuet-Higgins (1952), Rayleigh distribution of wave heights',
    run: () => {
      assertClose(meanOfHighest(3, 1), 1.416, { abs: 1e-3 }, 'H1/3');
      assertClose(meanOfHighest(10, 1), 1.800, { abs: 1e-3 }, 'H1/10');
      assertClose(meanOfHighest(100, 1), 2.360, { abs: 1e-3 }, 'H1/100');
      const { outputs } = calculate({ hs_m: 4, threshold_m: 4 });
      assertClose(outputs.p_exceed_wave, Math.exp(-2), { rel: 1e-12 }, 'P(H > Hs)');
      assertClose(outputs.hmean_m, 0.8862 * outputs.hrms_m, { rel: 1e-4 }, 'mean');
    },
  },
  {
    name: 'Storm maximum: Hs 4 m and Tz 8 s for 3 hours give 1350 waves, a most probable maximum of 2.83 × √(ln 1350) = 7.59 m and an expected maximum about 0.3 m higher; Tz input finds Tp',
    source: 'Longuet-Higgins (1952): H_max,mp = H_rms √(ln N), E[H_max] ≈ H_rms (√ln N + 0.5772/(2√ln N))',
    run: () => {
      const { outputs } = calculate({ hs_m: 4, period_type: 'tz', period_s: 8, spectrum: 'pm', duration_h: 3 });
      assertClose(outputs.tz_s, 8, { rel: 1e-9 }, 'Tz recovered');
      assertClose(outputs.tp_s, 8 / 0.7104, { rel: 2e-3 }, 'Tp from Tz');
      assertClose(outputs.waves_count, 1350, { rel: 1e-9 }, 'waves');
      assertClose(outputs.hmax_mp_m, (4 / Math.SQRT2) * Math.sqrt(Math.log(1350)), { rel: 1e-9 }, 'most probable maximum');
      assertClose(outputs.hmax_mp_m, 7.594, { abs: 1e-3 }, 'value');
      assertEqual(outputs.hmax_expected_m - outputs.hmax_mp_m > 0.25 && outputs.hmax_expected_m - outputs.hmax_mp_m < 0.35, true, 'expected above most probable');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero Hs, zero period, γ outside 1–7, an unknown spectrum',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ hs_m: 0 }), 'greater than zero', 'Hs');
      assertThrows(() => calculate({ period_s: 0 }), 'greater than zero', 'period');
      assertThrows(() => calculate({ spectrum: 'jonswap', gamma: 9 }), 'must be between', 'gamma');
      assertThrows(() => calculate({ spectrum: 'bretschneider' }), 'must be one of', 'spectrum');
    },
  },
];
