/**
 * conduit-fill/tests.js — checks against the NEC Chapter 9 rules, a published worked example and Annex C counts.
 * Run: node run-tests.js conduit-fill
 */
import { calculate, maxSameSize, fillLimit, CONDUITS, WIRES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN2 = 0.00064516;
const max = (c, s, w) => maxSameSize(CONDUITS[c].sizes[s][1], WIRES[w][1], false);

export const tests = [
  {
    name: '3 × 12, 4 × 10 and 8 × 8 AWG THWN: 0.4171 in², too full for 1 in EMT (0.346 in² at 40 %), so 1-1/4 in EMT (0.598 in²)',
    source: 'Steel Tube Institute, "NEC Conduit and EMT Fill Tables" worked example (NEC Chapter 9 Tables 1, 4 and 5)',
    run: () => {
      const { outputs } = calculate({ conduit: 'emt', size: '1', wire1: '12', count1: 3, wire2: '10', count2: 4, wire3: '8', count3: 8 });
      assertEqual(outputs.count, 15, 'count');
      assertClose(outputs.wire_area_m2 / IN2, 0.4171, { abs: 1e-9 }, 'area');
      assertClose(outputs.allowed_m2 / IN2, 0.3456, { abs: 1e-9 }, '1 in at 40 %');
      assertEqual(outputs.status.startsWith('Too full'), true, 'fails');
      assertEqual(outputs.smallest, '1-1/4 in (metric 35)', 'smallest');
      assertClose(calculate({ conduit: 'emt', size: '1-1/4', wire1: '12', count1: 3, wire2: '10', count2: 4, wire3: '8', count3: 8 }).outputs.allowed_m2 / IN2, 0.5984, { abs: 1e-9 }, '1-1/4 in at 40 %');
    },
  },
  {
    name: 'Same-size counts in EMT: 1/2 in holds 12 × 14, 9 × 12, 5 × 10 AWG; 3/4 in 22, 16, 10; 1 in 26 × 12 and 9 × 8 AWG',
    source: 'NEC (2023) Annex C Table C.1 (EMT, THHN/THWN/THWN-2), which applies Chapter 9 Note 7',
    run: () => {
      [['1/2', '14', 12], ['1/2', '12', 9], ['1/2', '10', 5], ['3/4', '14', 22], ['3/4', '12', 16], ['3/4', '10', 10], ['1', '12', 26], ['1', '8', 9]]
        .forEach(([s, w, n]) => assertEqual(max('emt', s, w), n, `${s} in, ${w} AWG`));
    },
  },
  {
    name: 'Same-size counts in PVC Schedule 40: 1/2 in holds 8 × 12 AWG, 3/4 in 15, 1 in 25',
    source: 'NEC (2023) Annex C Table C.11 (rigid PVC Schedule 40, THHN/THWN/THWN-2)',
    run: () => {
      [['1/2', 8], ['3/4', 15], ['1', 25]].forEach(([s, n]) => assertEqual(max('pvc40', s, '12'), n, `${s} in`));
    },
  },
  {
    name: 'Fill limits 53 %, 31 %, 40 % and 60 % for a nipple; table areas agree with π d²/4 of the listed diameters',
    source: 'NEC Chapter 9 Table 1 and Note 4; Tables 4 and 5 (area and diameter columns)',
    run: () => {
      assertEqual(fillLimit(1, false), 0.53, 'one');
      assertEqual(fillLimit(2, false), 0.31, 'two');
      assertEqual(fillLimit(7, false), 0.4, 'many');
      assertEqual(fillLimit(7, true), 0.6, 'nipple');
      for (const t of Object.values(CONDUITS)) for (const [d, a] of Object.values(t.sizes)) assertClose(Math.PI / 4 * d * d, a, { rel: 0.002 }, `conduit ${d}`);
      for (const [d, a] of Object.values(WIRES)) assertClose(Math.PI / 4 * d * d, a, { rel: 0.006 }, `wire ${d}`);
      const one = calculate({ size: '1', wire1: '250', count1: 1, count2: 0, count3: 0, conduit: 'pvc40' }).outputs;
      assertEqual(one.limit, 0.53, 'single 250 kcmil');
      assertEqual(one.status.startsWith('OK'), true, '250 kcmil fits alone in 1 in PVC (0.397 ≤ 0.441 in²)');
    },
  },
  {
    name: 'No conductors, a negative count and an unknown size are rejected; more than 3 conductors warns about derating',
    source: 'Validation contract; NEC 310.15(C)(1)',
    run: () => {
      assertThrows(() => calculate({ count1: 0, count2: 0, count3: 0 }), 'enter at least one conductor');
      assertThrows(() => calculate({ count1: -1 }), 'Wire 1: number of conductors');
      assertThrows(() => calculate({ size: '5' }), 'Trade size to check');
      assertEqual(calculate({}).warnings.some((w) => w.includes('310.15(C)(1)')), true, 'derating warning');
    },
  },
];
