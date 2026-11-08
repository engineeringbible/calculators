/**
 * wire-rope-swl/tests.js — checks against EN 12385-4 (manufacturer tables), the ILO C152 coefficients and the chain WLL tables.
 * Run: node run-tests.js wire-rope-swl
 */
import { calculate, iloSwl } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const G = 9.80665;
const LB = 0.45359237;

export const tests = [
  {
    name: 'EN 12385-4 against PFEIFER tables: 6×36 IWRC 1770 at 8, 20 and 32 mm = 40.3, 252 and 645 kN; 1960 at 20 mm = 279 kN',
    source: 'PFEIFER data sheet 6x36WS-WC (rev. 10/2020), according to EN 12385-4',
    run: () => {
      const mbl = (d, grade) => calculate({ construction: '6x36_iwrc', grade, diameter_m: d / 1000 }).outputs.mbl_out_n / 1000;
      assertClose(mbl(8, '1770'), 40.3, { abs: 0.05 }, '8 mm');
      assertClose(mbl(20, '1770'), 252, { abs: 0.5 }, '20 mm');
      assertClose(mbl(32, '1770'), 645, { abs: 0.5 }, '32 mm');
      assertClose(mbl(20, '1960'), 279, { abs: 0.5 }, '20 mm 1960');
    },
  },
  {
    name: 'Fibre core K = 0.330: 6×36 FC 1770 at 20 mm = 234 kN and 1960 at 10 mm = 64.7 kN; 6×19 FC 1770 at 6 mm = 21 kN',
    source: 'PFEIFER data sheets 6x36WS-FC (rev. 5/2019) and 6x19S-FC, according to EN 12385-4',
    run: () => {
      assertClose(calculate({ construction: '6x36_fc', grade: '1770', diameter_m: 0.02 }).outputs.mbl_out_n / 1000, 234, { abs: 0.5 }, '20 mm');
      assertClose(calculate({ construction: '6x36_fc', grade: '1960', diameter_m: 0.01 }).outputs.mbl_out_n / 1000, 64.7, { abs: 0.05 }, '10 mm');
      assertClose(calculate({ construction: '6x19_fc', grade: '1770', diameter_m: 0.006 }).outputs.mbl_out_n / 1000, 21, { abs: 0.05 }, '6 mm');
    },
  },
  {
    name: 'SWL of 20 mm 6×36 IWRC 1770 with a ferrule eye (0.9) and factor 5: 226.8 / 5 = 45.4 kN = 4.63 t',
    source: 'EN 13414-1 (coefficient 5, ferrule-secured termination 0.9); hand calculation',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.effective_n, 226843.2, { abs: 0.1 }, 'effective');
      assertClose(o.swl_n, 45368.64, { abs: 0.01 }, 'SWL N');
      assertClose(o.swl_kg, 4626.31, { abs: 0.01 }, 'SWL kg');
    },
  },
  {
    name: 'ILO C152: the coefficient is 10⁴/(8.85 SWL + 1910): 5.00 at 10 t, 3.01 at 160 t, 3 above; a sling uses 5 up to 10 t',
    source: 'ILO C152 register form No. 4 instructions (OSHA 29 CFR 1918 Appendix I)',
    run: () => {
      const mbl10 = 10 * (1e4 / (8.85 * 10 + 1910));
      assertClose(iloSwl(mbl10, 'ilo_appliance'), 10, { rel: 1e-9 }, 'appliance at 10 t');
      const mbl160 = 160 * (1e4 / (8.85 * 160 + 1910));
      assertClose(iloSwl(mbl160, 'ilo_appliance'), 160, { rel: 1e-9 }, 'appliance at 160 t');
      assertClose(iloSwl(600, 'ilo_appliance'), 200, { rel: 1e-12 }, 'factor 3 above 160 t');
      assertClose(iloSwl(40, 'ilo_sling'), 8, { rel: 1e-12 }, 'sling factor 5');
      const o = calculate({ factor_basis: 'ilo_sling', mbl_basis: 'entered', mbl_n: 2e6, termination: 1 }).outputs;
      assertClose(o.factor_used, 1e4 / (8.85 * (o.swl_kg / 1000) + 1910), { rel: 1e-9 }, 'self-consistent');
    },
  },
  {
    name: 'Chain tables: Grade 8 13 mm 5.3 t; Grade 80 1/2 in 12 000 lb; Grade 100 3/8 in 8 800 lb; breaking force 4 × WLL',
    source: 'EN 818-4 (Brindley LINX-8 table); OSHA 29 CFR 1918 App. II Table 4A (NACM Grade 80); NACM / ASTM A973 Grade 100 (1st Chain Supply data)',
    run: () => {
      const g8 = calculate({ item: 'chain', chain_grade: 'g8_en', size_g8_en: '13' }).outputs;
      assertClose(g8.swl_kg, 5300, { rel: 1e-12 }, 'G8 13 mm');
      assertClose(g8.mbl_out_n, 4 * 5300 * G, { rel: 1e-12 }, '4 × WLL');
      assertClose(calculate({ item: 'chain', chain_grade: 'g80_us', size_g80_us: '13' }).outputs.swl_kg, 12000 * LB, { rel: 1e-12 }, 'G80 1/2 in');
      assertClose(calculate({ item: 'chain', chain_grade: 'g100_us', size_g100_us: '10' }).outputs.swl_kg, 8800 * LB, { rel: 1e-12 }, 'G100 3/8 in');
    },
  },
  {
    name: 'Overload warns; a diameter of 1 mm and a size that the grade does not have are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ load_kg: 6000 }).warnings.length, 1, 'overload');
      assertThrows(() => calculate({ diameter_m: 0.001 }), 'Rope diameter');
      assertThrows(() => calculate({ item: 'chain', chain_grade: 'g100_us', size_g100_us: '26' }), 'Chain size');
    },
  },
];
