/**
 * tap-drill/tests.js — checks against ISO 724 and ASME B1.1 basic dimensions, the OSG percentage-of-thread formula and
 * the usual tap drill charts.
 * Run: node run-tests.js tap-drill
 */
import { calculate, drillFor, threadPct, nearestDrill } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;

export const tests = [
  {
    name: 'ISO 724: M6 d2 5.350 / D1 4.917, M10 9.026 / 8.376, M24 × 3 22.051 / 20.752 mm',
    source: 'ISO 724:1993 basic dimensions table',
    run: () => {
      for (const [id, d2, d1] of [['m6x1', 5.35, 4.917], ['m10x1.5', 9.026, 8.376], ['m24x3', 22.051, 20.752]]) {
        const o = calculate({ thread: id }).outputs;
        assertClose(o.d2_mm * 1000, d2, { abs: 0.0005 }, `${id} d2`);
        assertClose(o.d1_mm * 1000, d1, { abs: 0.0005 }, `${id} D1`);
      }
    },
  },
  {
    name: 'ASME B1.1: 1/4-20 UNC E 0.2175 / D1 0.1959 in, 1/2-13 UNC 0.4500 / 0.4167 in, 1-8 UNC 0.9188 / 0.8647 in',
    source: 'ASME B1.1, Table 2 basic pitch and minor diameters',
    run: () => {
      for (const [id, e, d1] of [['unc_1/4', 0.2175, 0.1959], ['unc_1/2', 0.45, 0.4167], ['unc_1', 0.9188, 0.8647]]) {
        const o = calculate({ thread: id }).outputs;
        assertClose(o.d2_in / IN, e, { abs: 0.00005 }, `${id} E`);
        assertClose(o.d1_in / IN, d1, { abs: 0.00005 }, `${id} D1`);
      }
    },
  },
  {
    name: 'OSG: a 2"-12 tap with a 1.9242" drill gives 70 % thread; 70 % needs 2 − 0.01299 × 70 / 12 = 1.9242 in',
    source: 'OSG Tap Drill Size and Pitch Diameter Limit chart, Vol. 3 (2024)',
    run: () => {
      assertClose(threadPct(2 * IN, IN / 12, 1.9242 * IN), 70, { abs: 0.05 }, 'percentage');
      assertClose(drillFor(2, 1 / 12, 70), 1.92423, { abs: 0.00001 }, 'drill');
    },
  },
  {
    name: 'At 75 %: 1/4-20 → #7 (75.4 %), 10-32 → #21, 3/8-16 → 5/16 in, 1/2-13 → 27/64 in, M6 → 5.0 mm, M10 → 8.5 mm (77 %), as on tap drill charts',
    source: 'Standard tap drill charts (OSG, Machinery\'s Handbook); D − P rule for metric coarse threads',
    run: () => {
      assertEqual(calculate({ thread: 'unc_1/4' }).outputs.drill.startsWith('#7 '), true, '1/4-20');
      assertEqual(calculate({ thread: 'unf_#10' }).outputs.drill.startsWith('#21 '), true, '10-32');
      assertEqual(calculate({ thread: 'unc_3/8' }).outputs.drill.startsWith('5/16 in'), true, '3/8-16');
      assertEqual(calculate({ thread: 'unc_1/2' }).outputs.drill.startsWith('27/64 in'), true, '1/2-13');
      assertEqual(calculate({ thread: 'm6x1' }).outputs.drill, '5 mm', 'M6');
      const m10 = calculate({ thread: 'm10x1.5' }).outputs;
      assertEqual(m10.drill, '8.5 mm', 'M10');
      assertClose(m10.drill_pct, 0.7698, { abs: 0.0001 }, 'M10 percentage');
      assertClose(calculate({}).outputs.drill_pct, 0.7544, { abs: 0.0001 }, '1/4-20 percentage');
    },
  },
  {
    name: 'Limiting case: 83.3 % thread drills exactly the basic minor diameter D1; nearest drill to 0.2013 in is #7 not #8',
    source: 'D1 = D − 1.082532 P and 100 % = 1.299038 P (ratio 5/6)',
    run: () => {
      const o = calculate({ thread: 'm10x1.5', pct: 5 / 6 }).outputs;
      assertClose(o.theory_mm, o.d1_mm, { rel: 1e-12 }, 'D1');
      assertEqual(nearestDrill(0.2013 * IN, 'unified')[0], '#7', 'nearest');
    },
  },
  {
    name: 'High and low percentages warn; an unknown thread and a percentage outside 40–100 % are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ pct: 0.9 }).warnings.length, 1, 'above 83 %');
      assertEqual(calculate({ pct: 0.5 }).warnings.length, 1, 'below 55 %');
      assertThrows(() => calculate({ thread: 'm7x1' }), 'Thread');
      assertThrows(() => calculate({ pct: 1.2 }), 'Percentage of thread');
    },
  },
];
