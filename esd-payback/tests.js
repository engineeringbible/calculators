/**
 * esd-payback/tests.js — checks against the engineering-economics textbook annuity and the ETS arithmetic.
 * Run: node run-tests.js esd-payback
 */
import { calculate, npv, irr, capitalRecoveryFactor } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

// 5 % of 20 t/day over 200 days = 200 t/yr at 500 per t = 100 000 per year, no ETS, no maintenance → the textbook annuity.
const ANNUITY = { capex: 300000, install_offhire_days: 0, hire_rate: 0, annual_maintenance: 0, saving_pct: 5, fuel_t_per_day: 20, sea_days_per_year: 200, fuel_type: 'hfo', fuel_price: 500, eua_price: 0, ets_share_pct: 0, project_life_years: 5, discount_rate_pct: 10, fuel_escalation_pct: 0, saving_degradation_pct: 0 };
const DEFAULTS = { capex: 400000, install_offhire_days: 3, hire_rate: 20000, annual_maintenance: 5000, saving_pct: 5, fuel_t_per_day: 30, sea_days_per_year: 250, fuel_type: 'hfo', fuel_price: 550, eua_price: 70, ets_share_pct: 50, project_life_years: 10, discount_rate_pct: 8, fuel_escalation_pct: 2, saving_degradation_pct: 0 };

export const tests = [
  {
    name: 'Textbook annuity: 300 000 invested, 100 000 per year for 5 years at 10 % → PV of benefits 379 078.68, NPV 79 078.68, BCR 1.2636, simple payback 3.0 years',
    source: 'Newnan et al., Engineering Economic Analysis — (P/A, 10 %, 5) = 3.7908',
    run: () => {
      const { outputs } = calculate(ANNUITY);
      assertClose(outputs.fuel_saved_t_year, 200, { rel: 1e-12 }, 'fuel saved');
      assertClose(outputs.net_benefit_year1, 100000, { rel: 1e-12 }, 'net benefit');
      assertClose(outputs.pv_benefits, 379078.68, { abs: 0.01 }, 'PV');
      assertClose(outputs.npv, 79078.68, { abs: 0.01 }, 'NPV');
      assertClose(outputs.benefit_cost_ratio, 379078.68 / 300000, { rel: 1e-6 }, 'BCR');
      assertClose(outputs.simple_payback_years, 3, { rel: 1e-12 }, 'payback');
      assertClose(npv(0.1, [-300000, 100000, 100000, 100000, 100000, 100000]), 79078.68, { abs: 0.01 }, 'npv()');
    },
  },
  {
    name: 'IRR 19.86 % and discounted payback 3.751 years (cumulative PV 248 685 after year 3, 316 987 after year 4) for the same annuity; CRF(10 %, 5) = 0.26380 → levelized cost 395.7 per t against 500',
    source: 'IRR tables; discounted payback by interpolation; CRF = i(1+i)ⁿ/((1+i)ⁿ−1)',
    run: () => {
      const { outputs } = calculate(ANNUITY);
      assertClose(outputs.irr_pct, 19.858, { abs: 0.01 }, 'IRR');
      assertClose(irr([-300000, 100000, 100000, 100000, 100000, 100000]), 0.19858, { abs: 1e-4 }, 'irr()');
      assertClose(outputs.discounted_payback_years, 3 + (300000 - 248685.2) / 68301.35, { abs: 1e-3 }, 'discounted payback');
      assertClose(outputs.discounted_payback_years, 3.751, { abs: 1e-3 }, 'value');
      assertClose(capitalRecoveryFactor(0.1, 5), 0.26380, { abs: 1e-5 }, 'CRF');
      assertClose(outputs.levelized_cost_saved_fuel, (0.2637975 * 300000) / 200, { rel: 1e-5 }, 'LCSF');
      assertClose(outputs.levelized_cost_saved_fuel, 395.7, { abs: 0.1 }, 'LCSF value');
      assertEqual(outputs.verdict.startsWith('Pays back'), true, 'verdict');
    },
  },
  {
    name: 'ETS and CO₂: default case saves 375 t fuel and 1 167.75 t CO₂ (HFO 3.114) per year; allowances 70 at 50 % share → 40 871; fuel 206 250; net 242 121 after 5 000 maintenance; investment 460 000 (incl. 3 × 20 000 off-hire)',
    source: 'MEPC.364(79) carbon factors; EU ETS 50 % share for extra-EU voyages',
    run: () => {
      const { outputs } = calculate(DEFAULTS);
      assertClose(outputs.investment, 460000, { rel: 1e-12 }, 'investment');
      assertClose(outputs.fuel_saved_t_year, 375, { rel: 1e-12 }, 'fuel');
      assertClose(outputs.co2_saved_t_year, 375 * 3.114, { rel: 1e-12 }, 'CO₂');
      assertClose(outputs.ets_saving_year1, 375 * 3.114 * 70 * 0.5, { rel: 1e-12 }, 'ETS');
      assertClose(outputs.fuel_saving_year1, 375 * 550, { rel: 1e-12 }, 'fuel saving');
      assertClose(outputs.net_benefit_year1, 375 * 550 + 375 * 3.114 * 35 - 5000, { rel: 1e-12 }, 'net');
      assertClose(outputs.simple_payback_years, 460000 / outputs.net_benefit_year1, { rel: 1e-12 }, 'payback');
      assertClose(calculate({ ...DEFAULTS, fuel_type: 'lng' }).outputs.co2_saved_t_year, 375 * 2.75, { rel: 1e-12 }, 'LNG factor');
    },
  },
  {
    name: 'Escalation and degradation: 2 % fuel escalation makes year-3 fuel savings 1.0404 × year 1 and raises the NPV; 10 % degradation lowers it; zero discount rate gives NPV = Σ benefits − investment and CRF = 1/n',
    source: 'Cash-flow definitions; CRF limit at i → 0',
    run: () => {
      const base = calculate({ ...ANNUITY, fuel_escalation_pct: 0 }).outputs;
      const esc = calculate({ ...ANNUITY, fuel_escalation_pct: 2 }).outputs;
      assertEqual(esc.npv > base.npv, true, 'escalation raises NPV');
      const expectedPv = [1, 2, 3, 4, 5].reduce((s, t) => s + (100000 * 1.02 ** (t - 1)) / 1.1 ** t, 0);
      assertClose(esc.pv_benefits, expectedPv, { rel: 1e-9 }, 'escalated PV');
      const deg = calculate({ ...ANNUITY, saving_degradation_pct: 10 }).outputs;
      assertEqual(deg.npv < base.npv, true, 'degradation lowers NPV');
      const zero = calculate({ ...ANNUITY, discount_rate_pct: 0 }).outputs;
      assertClose(zero.npv, 500000 - 300000, { rel: 1e-12 }, 'NPV at 0 %');
      assertClose(zero.crf, 0.2, { rel: 1e-12 }, 'CRF at 0 %');
    },
  },
  {
    name: 'No-payback case: zero saving leaves only maintenance → net benefit negative, payback and IRR null, NPV negative, warnings; a saving above 15 % is flagged',
    source: 'Behaviour specification',
    run: () => {
      const r = calculate({ ...DEFAULTS, saving_pct: 0 });
      assertEqual(r.outputs.simple_payback_years, null, 'payback null');
      assertEqual(r.outputs.irr_pct, null, 'IRR null');
      assertEqual(r.outputs.discounted_payback_years, null, 'discounted null');
      assertEqual(r.outputs.npv < 0, true, 'NPV negative');
      assertEqual(r.warnings.some((w) => w.includes('no payback')), true, 'warning');
      assertEqual(r.outputs.verdict.startsWith('Does not pay back'), true, 'verdict');
      assertEqual(calculate({ ...DEFAULTS, saving_pct: 20 }).warnings.some((w) => w.includes('rarely verified')), true, 'claim warning');
    },
  },
  {
    name: 'Validation: zero investment, fractional project life and unknown fuel are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ ...DEFAULTS, capex: 0, install_offhire_days: 0 }), 'investment is zero', 'investment');
      assertThrows(() => calculate({ ...DEFAULTS, project_life_years: 7.5 }), 'whole number', 'life');
      assertThrows(() => calculate({ ...DEFAULTS, fuel_type: 'coal' }), 'must be one of', 'fuel');
    },
  },
];
