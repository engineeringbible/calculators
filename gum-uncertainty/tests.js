/**
 * gum-uncertainty/tests.js — checks against the EA-4/02 weight example, the GUM G.4.1 example and Table G.2.
 * Run: node run-tests.js gum-uncertainty
 */
import { calculate, parseComponents, roundResult } from './calc.js';
import { schema } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const EA = schema.inputs.find((x) => x.id === 'components').default;
const GUM_G41 = 'x1; normal; 0.25; 1; 9\nx2; normal; 0.57; 1; 4\nx3; normal; 0.82; 1; 14';

export const tests = [
  {
    name: 'EA-4/02 example S2 (10 kg weight): 22.5 + 8.66 + 14.43 + 5.77 + 5.77 mg in quadrature → u_c = 29.3 mg, U = 59 mg (k = 2); result 10 000 025 ± 59 mg',
    source: 'EA-4/02 Evaluation of the Uncertainty of Measurement in Calibration, example S2 (u = 29.3 mg, U = 59 mg)',
    run: () => {
      const { outputs } = calculate({ components: EA, result_value: 10000025, coverage: '0.9545' });
      assertEqual(outputs.components_count, 5, 'five components');
      assertClose(outputs.combined_u, Math.sqrt(22.5 ** 2 + 75 + 625 / 3 + 100 / 3 + 100 / 3), { rel: 1e-12 }, 'u_c formula');
      assertClose(outputs.combined_u, 29.3, { abs: 0.05 }, 'u_c 29.3 mg');
      assertClose(outputs.k, 2.0, { abs: 1e-5 }, 'k = 2');
      assertClose(Math.round(outputs.expanded_u), 59, { abs: 0 }, 'U 59 mg');
      assertEqual(outputs.statement.startsWith('y = 10000025 ± 59'), true, 'statement');
      assertClose(outputs.relative_u, outputs.expanded_u / 10000025, { rel: 1e-12 }, 'relative');
      assertEqual(outputs.dominant.startsWith('Reference standard m_S'), true, 'dominant component');
    },
  },
  {
    name: 'GUM G.4.1 example: relative 0.25 % (ν 9), 0.57 % (ν 4), 0.82 % (ν 14) → u_c = 1.03 %, ν_eff = 18.9988 ("19.0"), exact-ν k = 2.093 (Table G.2: t₉₅(19) = 2.09), truncated ν 18 → k 2.10; U₉₅ = 2.2 % either way',
    source: 'JCGM 100:2008 (GUM) G.4.1 example and Table G.2',
    run: () => {
      const { outputs } = calculate({ components: GUM_G41, result_value: 0, coverage: '0.95', dof_rounding: 'exact' });
      assertClose(outputs.combined_u, Math.sqrt(0.25 ** 2 + 0.57 ** 2 + 0.82 ** 2), { rel: 1e-12 }, 'u_c');
      assertClose(outputs.combined_u, 1.03, { abs: 0.005 }, 'u_c 1.03 %');
      assertClose(outputs.nu_eff, 19.0, { abs: 0.05 }, 'ν_eff');
      assertClose(outputs.k, 2.09, { abs: 0.005 }, 't₉₅(19)');
      const truncated = calculate({ components: GUM_G41, result_value: 0, coverage: '0.95', dof_rounding: 'truncate' }).outputs;
      assertClose(truncated.k, 2.10, { abs: 0.005 }, 't₉₅(18) = 2.10');
      assertEqual(roundResult(0, truncated.expanded_u).U, '2.2', 'U₉₅ 2.2 % when truncated');
      assertEqual(roundResult(0, outputs.expanded_u).U, '2.2', 'U₉₅ 2.2 %');
      assertEqual(outputs.relative_u, null, 'no relative value for y = 0');
    },
  },
  {
    name: 'Divisors: rectangular a/√3, triangular a/√6, U-shaped a/√2, expanded U/2, Type A s/√n with ν = n − 1 by default',
    source: 'GUM 4.3.7, 4.3.9, 4.2.3; UKAS M3003 divisors',
    run: () => {
      const c = parseComponents('r; rect; 3\nt; tri; 6\nu; arcsine; 2\nk; k2; 4\na; typeA; 5; 1; ; 25');
      assertClose(c[0].u, Math.sqrt(3), { rel: 1e-12 }, 'rect');
      assertClose(c[1].u, Math.sqrt(6), { rel: 1e-12 }, 'tri');
      assertClose(c[2].u, Math.SQRT2, { rel: 1e-12 }, 'arcsine');
      assertClose(c[3].u, 2, { rel: 1e-12 }, 'k2');
      assertClose(c[4].u, 1, { rel: 1e-12 }, 'Type A s/√n');
      assertEqual(c[4].nu, 24, 'ν = n − 1');
      assertEqual(c[0].nu, Infinity, 'Type B ν = ∞');
    },
  },
  {
    name: 'Welch–Satterthwaite: u₁ = 1 (ν 4) and u₂ = 1 (ν ∞) give ν_eff = 2²/(1/4) = 16 and k(95.45 %) = 2.17 (Table G.2); sensitivity coefficients scale contributions (c = 3 → 3 u)',
    source: 'GUM G.4.1 eq. (G.2b) and Table G.2',
    run: () => {
      const r = calculate({ components: 'a; normal; 1; 1; 4\nb; normal; 1; 1; inf', result_value: 0, coverage: '0.9545' }).outputs;
      assertClose(r.nu_eff, 16, { rel: 1e-12 }, 'ν_eff');
      assertClose(r.k, 2.17, { abs: 0.005 }, 'k');
      const c = calculate({ components: 'a; normal; 2; 3', result_value: 0, coverage: '0.6827' }).outputs;
      assertClose(c.combined_u, 6, { rel: 1e-12 }, 'c = 3');
      assertClose(c.k, 1.0, { abs: 1e-3 }, 'k = 1 at 68.27 %');
      assertClose(calculate({ components: 'a; normal; 1', result_value: 0, coverage: '0.99' }).outputs.k, 2.5758, { abs: 1e-4 }, 'k at 99 %');
    },
  },
  {
    name: 'Budget table and warnings: one row per component with its share of u_c²; a dominant rectangular component (> 80 %) and few degrees of freedom are flagged',
    source: 'GUM G.6.5 (dominant non-normal component); behaviour specification',
    run: () => {
      const r = calculate({ components: EA, result_value: 10000025, coverage: '0.9545' });
      assertEqual(r.outputs.budget.rows.length, 5, 'rows');
      const shareSum = r.outputs.budget.rows.reduce((s, row) => s + row[8], 0);
      assertClose(shareSum, 100, { rel: 1e-9 }, 'shares add to 100 %');
      const dom = calculate({ components: 'big; rect; 10\nsmall; normal; 0.5', result_value: 0, coverage: '0.9545' });
      assertEqual(dom.warnings.some((w) => w.includes('of the variance')), true, 'dominant warning');
      const few = calculate({ components: 'a; typeA; 1; 1; ; 3', result_value: 0, coverage: '0.9545' });
      assertEqual(few.warnings.some((w) => w.includes('effective degrees of freedom')), true, 'few dof warning');
      assertClose(few.outputs.k, 4.53, { abs: 0.005 }, 'k for ν = 2');
    },
  },
  {
    name: 'Validation: unknown type, negative value, Type A without n and an empty budget are rejected with the line number',
    source: 'Input contract',
    run: () => {
      assertThrows(() => parseComponents('x; gamma; 1'), 'Line 1: unknown type', 'type');
      assertThrows(() => parseComponents('# c\nx; rect; -1'), 'Line 2: value', 'negative');
      assertThrows(() => parseComponents('x; typeA; 1; 1'), 'needs the number of readings', 'n');
      assertThrows(() => calculate({ components: '# nothing', result_value: 0, coverage: '0.95' }), 'at least one', 'empty');
    },
  },
];
