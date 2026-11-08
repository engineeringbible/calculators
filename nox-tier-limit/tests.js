/**
 * nox-tier-limit/tests.js — checks of the Regulation 13 curves, breakpoints and applicability logic.
 * Run: node run-tests.js nox-tier-limit
 */
import { calculate, noxLimit, TIERS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const ENGINE = { rated_rpm: 500, rated_power_kw: 4000, construction_year: 2018, area: 'neca_north_sea_baltic', certified_g_kwh: 2.2, load_factor: 0.75, hours_per_year: 6000 };

export const tests = [
  {
    name: 'Curves at 500 rpm: Tier I 45 × 500^−0.2 = 12.98, Tier II 44 × 500^−0.23 = 10.54, Tier III 9 × 500^−0.2 = 2.60 g/kWh; Tier III is 75.4 % below Tier II',
    source: 'MARPOL Annex VI Regulation 13.3, 13.4, 13.5',
    run: () => {
      const { outputs } = calculate(ENGINE);
      assertClose(outputs.tier1_limit, 45 * 500 ** -0.2, { rel: 1e-12 }, 'I');
      assertClose(outputs.tier1_limit, 12.98, { abs: 0.01 }, 'I value');
      assertClose(outputs.tier2_limit, 44 * 500 ** -0.23, { rel: 1e-12 }, 'II');
      assertClose(outputs.tier2_limit, 10.54, { abs: 0.01 }, 'II value');
      assertClose(outputs.tier3_limit, 9 * 500 ** -0.2, { rel: 1e-12 }, 'III');
      assertClose(outputs.tier3_limit, 2.60, { abs: 0.01 }, 'III value');
      assertClose(outputs.tier3_reduction_pct, (1 - outputs.tier3_limit / outputs.tier2_limit) * 100, { rel: 1e-12 }, 'reduction');
    },
  },
  {
    name: 'Plateaus and continuity: below 130 rpm 17.0/14.4/3.4; at and above 2 000 rpm 9.8/7.7/2.0; the curves meet the plateaus within 1 % at 130 and 2 000 rpm (Tier II: 7.66 vs 7.7)',
    source: 'Regulation 13 breakpoints (n < 130, 130 ≤ n < 2000, n ≥ 2000)',
    run: () => {
      assertEqual([noxLimit('I', 100), noxLimit('II', 100), noxLimit('III', 100)].join(), '17,14.4,3.4', 'low');
      assertEqual([noxLimit('I', 2000), noxLimit('II', 2000), noxLimit('III', 2000)].join(), '9.8,7.7,2', 'high');
      assertClose(45 * 130 ** -0.2, 17.0, { rel: 5e-3 }, 'I at 130');
      assertClose(44 * 130 ** -0.23, 14.4, { rel: 5e-3 }, 'II at 130');
      assertClose(9 * 130 ** -0.2, 3.4, { rel: 5e-3 }, 'III at 130');
      assertClose(45 * 1999.99 ** -0.2, 9.8, { rel: 5e-3 }, 'I at 2000');
      assertClose(44 * 1999.99 ** -0.23, 7.7, { rel: 1e-2 }, 'II at 2000');
      assertClose(9 * 1999.99 ** -0.2, 2.0, { rel: 2e-2 }, 'III at 2000');
      assertEqual(TIERS.II.exp === -0.23 && TIERS.I.exp === -0.2 && TIERS.III.coef === 9, true, 'coefficients');
    },
  },
  {
    name: 'Applicability: built 2018 in the Baltic/North Sea NECA → Tier II (NECA date 2021); built 2022 there → Tier III; built 2018 in the North American NECA → Tier III (2016); built 2005 → Tier I; built 1995 → no tier (Reg. 13.7 note)',
    source: 'Regulation 13.5.1 NECA dates (MEPC.286(71)); Reg. 13.3–13.4 construction dates; Reg. 13.7',
    run: () => {
      assertEqual(calculate(ENGINE).outputs.applicable_tier.startsWith('Tier II'), true, '2018 Baltic');
      assertEqual(calculate({ ...ENGINE, construction_year: 2022 }).outputs.applicable_tier.startsWith('Tier III'), true, '2022 Baltic');
      assertEqual(calculate({ ...ENGINE, area: 'neca_north_america' }).outputs.applicable_tier.startsWith('Tier III'), true, '2018 North America');
      assertEqual(calculate({ ...ENGINE, construction_year: 2005 }).outputs.applicable_tier.startsWith('Tier I '), true, '2005');
      assertEqual(calculate({ ...ENGINE, area: 'global', construction_year: 2022 }).outputs.applicable_tier.startsWith('Tier II'), true, 'global 2022');
      const old = calculate({ ...ENGINE, construction_year: 1995 }).outputs;
      assertEqual(old.applicable_limit, null, 'no limit');
      assertEqual(old.compliance.startsWith('No tier limit'), true, 'text');
    },
  },
  {
    name: 'Compliance and margin: 2.2 g/kWh against Tier III 2.60 at 500 rpm → complies with 15.3 % margin; 3.0 g/kWh exceeds; annual NOx at 4 000 kW × 0.75 × 6 000 h: 46.7 t at the limit, 39.6 t certified',
    source: 'Arithmetic; EIAPP certified value against the limit',
    run: () => {
      const r = calculate({ ...ENGINE, construction_year: 2022 });
      assertClose(r.outputs.applicable_limit, 9 * 500 ** -0.2, { rel: 1e-12 }, 'limit');
      assertClose(r.outputs.margin_pct, ((r.outputs.applicable_limit - 2.2) / r.outputs.applicable_limit) * 100, { rel: 1e-12 }, 'margin');
      assertClose(r.outputs.margin_pct, 15.28, { abs: 0.02 }, 'margin value');
      assertEqual(r.outputs.compliance.startsWith('COMPLIES'), true, 'complies');
      const kwh = 4000 * 0.75 * 6000;
      assertClose(r.outputs.annual_nox_at_limit_t, (kwh * r.outputs.applicable_limit) / 1e6, { rel: 1e-12 }, 'annual at limit');
      assertClose(r.outputs.annual_nox_at_limit_t, 46.74, { abs: 0.02 }, 'annual value');
      assertClose(r.outputs.annual_nox_certified_t, (kwh * 2.2) / 1e6, { rel: 1e-12 }, 'annual certified');
      const bad = calculate({ ...ENGINE, construction_year: 2022, certified_g_kwh: 3.0 });
      assertEqual(bad.outputs.compliance.startsWith('EXCEEDS'), true, 'exceeds');
      assertEqual(bad.warnings.some((w) => w.includes('exceeds the applicable limit')), true, 'warning');
    },
  },
  {
    name: 'Validation and threshold: an engine of 100 kW is flagged as below the 130 kW threshold; a fractional construction year, zero rpm and an unknown area are rejected',
    source: 'Regulation 13.1.1 (engines > 130 kW); validation contract',
    run: () => {
      assertEqual(calculate({ ...ENGINE, rated_power_kw: 100 }).warnings.some((w) => w.includes('130 kW')), true, 'threshold');
      assertThrows(() => calculate({ ...ENGINE, construction_year: 2018.5 }), 'whole number', 'year');
      assertThrows(() => calculate({ ...ENGINE, rated_rpm: 0 }), 'greater than zero', 'rpm');
      assertThrows(() => calculate({ ...ENGINE, area: 'mediterranean' }), 'must be one of', 'area');
    },
  },
];
