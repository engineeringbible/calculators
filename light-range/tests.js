/**
 * light-range/tests.js — horizon distances, Allard's law and the COLREG Annex I intensity table.
 * Run: node run-tests.js light-range
 */
import { calculate, horizonDistance, radioHorizon, intensityForRange, luminousRange, colregIntensity } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;

export const tests = [
  {
    name: 'Bowditch Table 12: a height of 120 ft gives 12.8 nmi to the horizon, i.e. 1.17 √h with h in feet (2.12 √h in metres)',
    source: 'The American Practical Navigator (Bowditch), Table 12 "Distance of the horizon" (R = 3440.1 nmi, β = 0.8279)',
    run: () => {
      assertClose(horizonDistance(120 * FT), 12.8, { abs: 0.05 }, '120 ft');
      assertClose(horizonDistance(120 * FT) / Math.sqrt(120), 1.17, { abs: 0.005 }, 'coefficient for feet');
      assertClose(horizonDistance(1), 2.118, { abs: 1e-3 }, 'coefficient for metres');
    },
  },
  {
    name: 'Rounded 2.08 rule: a 30 m light seen from a 3 m height of eye has a geographic range of 11.39 + 3.60 = 15.0 nmi',
    source: 'Geographic range = 2.08 (√H + √h) nmi, H and h in metres (the common rounded rule)',
    run: () => {
      const { outputs } = calculate({ light_height_m: 30, eye_height_m: 3, horizon_model: 'rule208' });
      assertClose(outputs.light_horizon_nmi, 11.393, { abs: 1e-3 }, 'light');
      assertClose(outputs.eye_horizon_nmi, 3.603, { abs: 1e-3 }, 'eye');
      assertClose(outputs.geographic_range_nmi, 15.0, { abs: 0.01 }, 'sum');
      assertClose(horizonDistance(30, 'geometric') / Math.sqrt(30), 1.927, { abs: 1e-3 }, 'geometric coefficient');
    },
  },
  {
    name: 'COLREG Annex I §8 table of minimum luminous intensity: 1 nmi 0.9 cd, 2 nmi 4.3, 3 nmi 12, 4 nmi 27, 5 nmi 52, 6 nmi 94',
    source: 'COLREG 1972 Annex I section 8(b) table; 33 CFR 84.14',
    run: () => {
      const table = [[1, 0.9, 0.05], [2, 4.3, 0.05], [3, 12, 0.5], [4, 27, 0.5], [5, 52, 0.5], [6, 94, 0.5]];
      for (const [range, cd, tol] of table) assertClose(colregIntensity(range), cd, { abs: tol }, `${range} nmi`);
    },
  },
  {
    name: 'Allard\'s law: a 10 nmi nominal range needs 2·10⁻⁷ × 1852² × 100 × 20 = 1372 cd, and that light\'s luminous range at 10 nmi visibility is exactly 10 nmi; less visibility always means less range',
    source: 'IALA Recommendation E-200-2 (Allard\'s law, T = 0.05^(1/V), threshold 2·10⁻⁷ lx)',
    run: () => {
      const cd = intensityForRange(10, 10);
      assertClose(cd, 2e-7 * 1852 ** 2 * 100 * 20, { rel: 1e-12 }, 'intensity');
      assertClose(cd, 1371.96, { abs: 0.01 }, 'intensity value');
      assertClose(luminousRange(cd, 10), 10, { rel: 1e-9 }, 'range at nominal visibility');
      const page = calculate({ intensity_input: 'nominal', nominal_range_nmi: 20, visibility_nmi: 10 }).outputs;
      assertClose(page.nominal_out_nmi, 20, { rel: 1e-9 }, 'nominal round trip');
      assertClose(page.luminous_range_nmi, 20, { rel: 1e-9 }, 'luminous = nominal at V = 10');
      const ranges = [2, 5, 10, 20].map((v) => luminousRange(cd, v));
      assertEqual(ranges.every((r, k) => k === 0 || r > ranges[k - 1]), true, 'monotonic in visibility');
    },
  },
  {
    name: 'Radar horizon in the 4/3 atmosphere is 2.23 √h nmi (within 1 % of Bowditch\'s 1.22 √h for h in feet); target range adds the two horizons; the light is seen at the lesser of luminous and geographic range',
    source: 'Bowditch (radar horizon 1.22 √h ft); ITU-R effective earth radius factor 4/3',
    run: () => {
      assertClose(radioHorizon(1), Math.sqrt((2 * (4 / 3) * 3440.1) / 1852), { rel: 1e-12 }, 'coefficient');
      assertClose(radioHorizon(16) / (1.22 * Math.sqrt(16 / FT)), 1, { abs: 0.01 }, 'agrees with Bowditch');
      const { outputs } = calculate({ antenna_height_m: 25, target_height_m: 9, light_height_m: 60, eye_height_m: 15, intensity_input: 'nominal', nominal_range_nmi: 8, visibility_nmi: 10 });
      assertClose(outputs.radar_target_range_nmi, radioHorizon(25) + radioHorizon(9), { rel: 1e-12 }, 'target range');
      assertClose(outputs.visible_range_nmi, Math.min(outputs.luminous_range_nmi, outputs.geographic_range_nmi), { rel: 1e-12 }, 'lesser range');
      assertEqual(outputs.limiting_factor.startsWith('Luminous'), true, 'a weak high light is limited by luminous range');
    },
  },
  {
    name: 'Invalid inputs fail fast: negative heights, zero visibility, zero intensity and an unknown horizon model',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ eye_height_m: -1 }), 'must not be negative', 'eye');
      assertThrows(() => calculate({ visibility_nmi: 0 }), 'greater than zero', 'visibility');
      assertThrows(() => calculate({ intensity_input: 'intensity', intensity_cd: 0 }), 'greater than zero', 'intensity');
      assertThrows(() => calculate({ horizon_model: 'flat' }), 'must be one of', 'model');
    },
  },
];
