/**
 * injection-clamp-tonnage/tests.js — checks against the RJG worked example, the Lexan and Makrolon clamp factors and unit
 * definitions.
 * Run: node run-tests.js injection-clamp-tonnage
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN2 = 0.00064516;
const PSI = 6894.757293168;

export const tests = [
  {
    name: 'RJG: 21.16 in² × 8 cavities = 169.28 in² × 3 tons/in² = 507.84 tons; the 2–3 tons/in² range gives 339 to 508 tons',
    source: 'RJG Inc., Clamp Tonnage: More is Better, Right? (worked example)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.total_area_m2 / IN2, 169.28, { rel: 1e-12 }, 'area');
      assertClose(o.clamp_us_tons, 507.84, { rel: 1e-9 }, 'tons');
      const low = calculate({ factor_mode: 'custom', factor_pa: 4000 * PSI }).outputs;
      assertClose(low.clamp_us_tons, 338.56, { rel: 1e-9 }, '2 tons/in²');
    },
  },
  {
    name: 'Units: 3 US tons/in² = 6 000 psi = 41.37 MPa = 4.14 kN/cm²; Makrolon 3.0–5.0 tons/in² is 4.1–6.9 kN/cm²',
    source: '1 US ton = 2 000 lbf; Covestro Makrolon 2558 datasheet (clamp tonnage 3.0–5.0 tons/in², 4.1–6.9 kN/cm²)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.factor_out_pa / PSI, 6000, { rel: 1e-12 }, 'psi');
      assertClose(o.factor_out_pa / 1e6, 41.3685, { abs: 0.0001 }, 'MPa');
      assertClose((5 * 2000 * PSI) / 1e7, 6.89, { abs: 0.005 }, '5 tons/in² in kN/cm²');
    },
  },
  {
    name: 'Machine size: 507.84 tons at an 80 % limit needs 634.8 tons; polycarbonate at 4 tons/in² needs 677.1 tons of clamp',
    source: 'Autodesk Moldflow (80 % of machine limit); SABIC Lexan guide 3–5 tons/in² (middle value 4)',
    run: () => {
      assertClose(calculate({}).outputs.machine_us_tons, 634.8, { rel: 1e-9 }, 'machine');
      assertClose(calculate({ factor_mode: 'pc' }).outputs.clamp_us_tons, 677.12, { rel: 1e-9 }, 'PC');
      assertClose(calculate({ factor_mode: 'pc_gf' }).outputs.factor_tons_in2, 5, { rel: 1e-12 }, 'PC-GF');
    },
  },
  {
    name: 'A cold runner adds its own area: 8 × 21.16 + 20 in² = 189.28 in²; one cavity of 10 in² at 3 tons/in² needs 30 tons',
    source: 'RJG method: add the projected area of a cold runner (hand calculation)',
    run: () => {
      assertClose(calculate({ runner_m2: 20 * IN2 }).outputs.total_area_m2 / IN2, 189.28, { rel: 1e-12 }, 'runner');
      assertClose(calculate({ area_m2: 10 * IN2, cavities: 1 }).outputs.clamp_us_tons, 30, { rel: 1e-12 }, 'single');
    },
  },
  {
    name: 'A factor outside 2–10 tons/in² warns; zero area, fractional cavities and a utilisation of 20 % are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ factor_mode: 'custom', factor_pa: 1000 * PSI }).warnings.length, 1, 'low factor');
      assertThrows(() => calculate({ area_m2: 0 }), 'Projected area');
      assertThrows(() => calculate({ cavities: 2.5 }), 'whole number');
      assertThrows(() => calculate({ utilisation: 0.2 }), 'machine rating');
    },
  },
];
