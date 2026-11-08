/**
 * sea-state-statistics/calc.js — a short-term sea state from its significant wave height and peak (or zero-crossing)
 * period: the JONSWAP or Pierson–Moskowitz spectrum of DNV-RP-C205, its moments and characteristic periods, and the
 * Rayleigh wave-height statistics: mean, 1/10 and 1/100 highest waves, the maximum wave in a storm duration and the
 * probability of exceeding a chosen height.
 *
 * S_PM(ω) = (5/16) Hs² ωp⁴ ω⁻⁵ exp[−(5/4)(ω/ωp)⁻⁴];  S_J(ω) = (1 − 0.287 ln γ) S_PM(ω) γ^exp[−(ω − ωp)²/(2σ²ωp²)]
 * m_n = ∫ ωⁿ S dω;  Tz = 2π √(m0/m2),  T1 = 2π m0/m1,  Te = 2π m₋₁/m0
 * Rayleigh with H_rms = √(8 m0) = Hs/√2:  P(H > h) = exp[−(h/H_rms)²],  H_max,mp = H_rms √(ln N),  N = duration/Tz
 * Schema units: metres, seconds, hours.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';
import { normalCdf } from '../shared/stats.js';
import { GRAVITY_M_S2 } from '../shared/units.js';

/** JONSWAP spectral width parameters (DNV-RP-C205 3.5.5.2). */
const SIGMA_BELOW = 0.07;
const SIGMA_ABOVE = 0.09;
const EULER_GAMMA = 0.5772156649;
const INTEGRATION_STEPS = 6000;
const LOW_CUTOFF = 0.25;
const HIGH_CUTOFF = 12;

export const schema = {
  id: 'sea-state-statistics',
  name: 'Sea state statistics',
  category: 'maritime',
  summary: 'Wave spectrum moments and periods, the 1/10 and 1/100 highest waves, the expected maximum wave in a storm and exceedance probabilities from Hs and Tp.',
  related: ['wave-properties', 'beaufort-sea-state', 'stawave-added-resistance', 'roll-period'],
  assumptions: [
    'Short-term stationary sea state described by a single-peaked spectrum: Pierson–Moskowitz for a fully developed sea or JONSWAP for a developing sea, in the form of DNV-RP-C205 §3.5.5 with σ = 0.07 below and 0.09 above the peak and the normalising factor A_γ = 1 − 0.287 ln γ (accurate to about 1–2 % in Hs).',
    'When no peak-enhancement factor is given, γ follows the DNV rule: 5 for Tp/√Hs ≤ 3.6, exp(5.75 − 1.15 Tp/√Hs) up to 5, and 1 (Pierson–Moskowitz) above; the rule is for Hs in metres and Tp in seconds and applies to wind seas, not to swell.',
    'Spectral moments are integrated numerically between 0.25 and 12 times the peak frequency with Simpson\'s rule and the ω⁻⁵ tail added analytically, so Tz, T1 and Te are those of the spectrum shape, not empirical ratios.',
    'Wave heights follow the Rayleigh distribution of a narrow-band Gaussian sea with H_rms = √(8 m0) = Hs/√2, where Hs = 4√m0 (Longuet-Higgins 1952); real seas are slightly broad-banded and their largest waves somewhat smaller (Forristall), so the Rayleigh values are on the safe side. The number of waves in the duration is the duration divided by Tz.',
    'Deep water and no current; in shallow water waves steepen and break, and the Rayleigh distribution overestimates the largest waves.',
  ],
  notes: [
    'Verification 2026-10-31: for γ = 1 the integral reproduces m0 = Hs²/16, Tz = 0.711 Tp and T1 = 0.772 Tp; for γ = 3.3 Tz/Tp and T1/Tp agree with the DNV-RP-C205 regressions (0.778 and 0.835) within 1 %; the mean of the highest third, tenth and hundredth waves are 1.416, 1.800 and 2.360 H_rms; Hs 4 m with Tz 8 s over 3 hours gives 1350 waves and a most probable maximum of 7.59 m.',
  ],
  sources: [
    'DNV-RP-C205 Environmental conditions and environmental loads (2021), §3.5 Wave spectra (JONSWAP, γ rule, period relations) and §3.3 short-term wave statistics',
    'M. S. Longuet-Higgins, "On the statistical distribution of the heights of sea waves", Journal of Marine Research 11 (1952) 245–266',
    'K. Hasselmann et al., Measurements of wind-wave growth and swell decay during the Joint North Sea Wave Project (JONSWAP), Deutsche Hydrographische Zeitschrift A8 (1973)',
    'ITTC Recommended Procedure 7.5-02-07-02.1 Seakeeping Experiments — wave spectra definitions',
  ],
  inputs: [
    { id: 'hs_m', label: 'Significant wave height Hs', group: 'length', unit: 'm', default: 4, min: 0.05, max: 25 },
    {
      id: 'period_type',
      label: 'Period given',
      type: 'select',
      default: 'tp',
      options: [
        { value: 'tp', label: 'Peak period Tp' },
        { value: 'tz', label: 'Zero-crossing period Tz' },
      ],
    },
    { id: 'period_s', label: 'Period', group: 'time', unit: 's', default: 9, min: 1, max: 30 },
    {
      id: 'spectrum',
      label: 'Spectrum',
      type: 'select',
      default: 'dnv',
      options: [
        { value: 'dnv', label: 'JONSWAP with γ from the DNV rule' },
        { value: 'jonswap', label: 'JONSWAP with a given γ' },
        { value: 'pm', label: 'Pierson–Moskowitz (γ = 1, fully developed)' },
      ],
    },
    { id: 'gamma', label: 'Peak-enhancement factor γ', group: 'dimensionless', unit: 'none', default: 3.3, min: 1, max: 7, visibleWhen: { spectrum: 'jonswap' } },
    { id: 'duration_h', label: 'Duration of the sea state', group: 'time', unit: 'h', default: 3, min: 0.1, max: 48 },
    { id: 'threshold_m', label: 'Wave height of interest', group: 'length', unit: 'm', default: 7, min: 0.01, max: 50 },
  ],
  outputs: [
    { id: 'tp_s', label: 'Peak period Tp', group: 'time', unit: 's' },
    { id: 'tz_s', label: 'Zero-crossing period Tz', group: 'time', unit: 's' },
    { id: 't1_s', label: 'Mean period T1', group: 'time', unit: 's' },
    { id: 'te_s', label: 'Energy period Te', group: 'time', unit: 's' },
    { id: 'gamma_used', label: 'Peak-enhancement factor γ used', group: 'dimensionless', unit: 'none' },
    { id: 'm0_m2', label: 'Zeroth spectral moment m0 (integrated)', group: 'area', unit: 'm2' },
    { id: 'hs_from_m0_m', label: '4√m0 (check against Hs)', group: 'length', unit: 'm' },
    { id: 'hrms_m', label: 'Root-mean-square height H_rms', group: 'length', unit: 'm' },
    { id: 'hmean_m', label: 'Mean wave height', group: 'length', unit: 'm' },
    { id: 'h_tenth_m', label: 'Mean of the highest 1/10 of the waves', group: 'length', unit: 'm' },
    { id: 'h_hundredth_m', label: 'Mean of the highest 1/100 of the waves', group: 'length', unit: 'm' },
    { id: 'waves_count', label: 'Number of waves in the duration', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'hmax_mp_m', label: 'Most probable maximum wave in the duration', group: 'length', unit: 'm' },
    { id: 'hmax_expected_m', label: 'Expected maximum wave in the duration', group: 'length', unit: 'm' },
    { id: 'p_exceed_wave', label: 'Probability that one wave exceeds the height of interest', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'p_exceed_duration', label: 'Probability that the height is exceeded during the duration', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'steepness', label: 'Peak steepness 2π Hs / (g Tp²)', group: 'dimensionless', unit: 'none' },
    { id: 'wavelength_tp_m', label: 'Deep-water wavelength at Tp', group: 'length', unit: 'm' },
    { id: 'spectrum_table', label: 'Spectrum S(ω)', type: 'table' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      tz_s: '6.66 s',
      t1_s: '7.20 s',
      te_s: '7.91 s',
      gamma_used: '1.78',
      hrms_m: '2.83 m',
      h_tenth_m: '5.09 m',
      h_hundredth_m: '6.67 m',
      waves_count: '1622',
    },
  },
};

/** DNV-RP-C205 peak-enhancement factor from Hs (m) and Tp (s). */
export function dnvGamma(hs, tp) {
  const ratio = tp / Math.sqrt(hs);
  if (ratio <= 3.6) return 5;
  if (ratio >= 5) return 1;
  return Math.exp(5.75 - 1.15 * ratio);
}

/** JONSWAP spectral density S(ω) in m²·s/rad for Hs (m), peak frequency ωp (rad/s) and γ. */
export function jonswapDensity(omega, hs, omegaP, gamma) {
  const pm = (5 / 16) * hs * hs * omegaP ** 4 * omega ** -5 * Math.exp(-1.25 * (omega / omegaP) ** -4);
  if (gamma === 1) return pm;
  const sigma = omega <= omegaP ? SIGMA_BELOW : SIGMA_ABOVE;
  return (1 - 0.287 * Math.log(gamma)) * pm * gamma ** Math.exp(-((omega - omegaP) ** 2) / (2 * sigma * sigma * omegaP * omegaP));
}

/** Spectral moments m₋₁, m0, m1, m2 by Simpson's rule plus the analytic ω⁻⁵ tail. */
export function spectralMoments(hs, tp, gamma) {
  const omegaP = (2 * Math.PI) / tp;
  const a = LOW_CUTOFF * omegaP;
  const b = HIGH_CUTOFF * omegaP;
  const h = (b - a) / INTEGRATION_STEPS;
  const sums = { '-1': 0, 0: 0, 1: 0, 2: 0 };
  for (let k = 0; k <= INTEGRATION_STEPS; k += 1) {
    const w = a + k * h;
    const weight = k === 0 || k === INTEGRATION_STEPS ? 1 : k % 2 === 1 ? 4 : 2;
    const s = jonswapDensity(w, hs, omegaP, gamma) * weight;
    for (const n of [-1, 0, 1, 2]) sums[n] += s * w ** n;
  }
  const tailScale = (1 - 0.287 * Math.log(gamma)) * (5 / 16) * hs * hs * omegaP ** 4;
  const moment = (n) => (sums[n] * h) / 3 + (tailScale * b ** (n - 4)) / (4 - n);
  return { mMinus1: moment(-1), m0: moment(0), m1: moment(1), m2: moment(2) };
}

/** Complementary error function from the normal distribution (accurate in the tail). */
const erfc = (x) => 2 * normalCdf(-x * Math.SQRT2);

/** Mean of the highest 1/n of the waves for a Rayleigh distribution with scale H_rms. */
export function meanOfHighest(n, hrms) {
  const r = Math.sqrt(Math.log(n));
  return hrms * (r + ((n * Math.sqrt(Math.PI)) / 2) * erfc(r));
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.hs_m, 'hs_m', 'Significant wave height');
  assertOneOf(i.period_type, ['tp', 'tz'], 'period_type', 'Period given');
  assertPositive(i.period_s, 'period_s', 'Period');
  assertOneOf(i.spectrum, ['dnv', 'jonswap', 'pm'], 'spectrum', 'Spectrum');
  assertPositive(i.duration_h, 'duration_h', 'Duration');
  assertPositive(i.threshold_m, 'threshold_m', 'Wave height of interest');
  if (i.spectrum === 'jonswap') assertRange(i.gamma, 1, 7, 'gamma', 'Peak-enhancement factor');

  const gammaFor = (tp) => (i.spectrum === 'pm' ? 1 : i.spectrum === 'jonswap' ? i.gamma : dnvGamma(i.hs_m, tp));
  const tzOver = (tp) => {
    const m = spectralMoments(i.hs_m, tp, gammaFor(tp));
    return (2 * Math.PI * Math.sqrt(m.m0 / m.m2)) / tp;
  };
  let tp = i.period_s;
  if (i.period_type === 'tz') {
    tp = i.period_s / 0.72;
    for (let k = 0; k < 60; k += 1) {
      const next = i.period_s / tzOver(tp);
      if (Math.abs(next - tp) < 1e-10 * tp) {
        tp = next;
        break;
      }
      tp = next;
    }
  }
  const gamma = gammaFor(tp);
  const m = spectralMoments(i.hs_m, tp, gamma);
  const tz = 2 * Math.PI * Math.sqrt(m.m0 / m.m2);
  const t1 = (2 * Math.PI * m.m0) / m.m1;
  const te = (2 * Math.PI * m.mMinus1) / m.m0;

  const hrms = i.hs_m / Math.SQRT2;
  const waves = (i.duration_h * 3600) / tz;
  const lnN = Math.log(waves);
  const pWave = Math.exp(-((i.threshold_m / hrms) ** 2));
  const pDuration = 1 - (1 - pWave) ** waves;
  const steepness = (2 * Math.PI * i.hs_m) / (GRAVITY_M_S2 * tp * tp);

  const omegaP = (2 * Math.PI) / tp;
  const rows = [];
  for (let r = 0.5; r <= 3.0001; r += r < 1.5 ? 0.1 : 0.25) {
    const w = r * omegaP;
    rows.push([Number(r.toFixed(2)), w, (2 * Math.PI) / w, jonswapDensity(w, i.hs_m, omegaP, gamma)]);
  }

  const warnings = [];
  if (steepness > 1 / 15) warnings.push(`Peak steepness 1/${(1 / steepness).toFixed(1)} is steeper than 1/15: such a sea is breaking-limited and unlikely in deep water (DNV-RP-C205 §3.5.5.4).`);
  if (i.spectrum === 'dnv' && tp / Math.sqrt(i.hs_m) > 5) warnings.push('Tp/√Hs above 5: swell-dominated sea; the DNV rule gives γ = 1, but a swell spectrum may be narrower than Pierson–Moskowitz.');
  if (waves < 50) warnings.push('Fewer than 50 waves in the duration: the maximum-wave estimates are very uncertain.');
  warnings.push('Rayleigh statistics of a narrow-band sea; measured storm maxima are typically 5–10 % lower (Forristall), and shallow water changes both distribution and breaking.');

  return {
    outputs: {
      tp_s: tp,
      tz_s: tz,
      t1_s: t1,
      te_s: te,
      gamma_used: gamma,
      m0_m2: m.m0,
      hs_from_m0_m: 4 * Math.sqrt(m.m0),
      hrms_m: hrms,
      hmean_m: (Math.sqrt(Math.PI) / 2) * hrms,
      h_tenth_m: meanOfHighest(10, hrms),
      h_hundredth_m: meanOfHighest(100, hrms),
      waves_count: waves,
      hmax_mp_m: hrms * Math.sqrt(lnN),
      hmax_expected_m: hrms * (Math.sqrt(lnN) + EULER_GAMMA / (2 * Math.sqrt(lnN))),
      p_exceed_wave: pWave,
      p_exceed_duration: pDuration,
      steepness,
      wavelength_tp_m: (GRAVITY_M_S2 * tp * tp) / (2 * Math.PI),
      spectrum_table: { columns: ['ω/ωp', 'ω (rad/s)', 'Period (s)', 'S(ω) (m²·s/rad)'], rows },
    },
    warnings,
  };
}
