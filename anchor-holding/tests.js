/**
 * anchor-holding/tests.js — checks against holding = efficiency × weight (Vryhof anchor classes) and the inverse.
 * Run: node run-tests.js anchor-holding
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const G = 9.80665;

export const tests = [
  {
    name: '6 t stockless anchor (Class F, η 4): holding 24 tf = 235.4 kN, allowable 156.9 kN at a safety factor of 1.5',
    source: 'Vryhof Anchor Manual (2000), Class F efficiency 4–6; hand calculation',
    run: () => {
      const o = calculate({ mode: 'holding', anchor_class: 'F', estimate: 'low', scaling: 'linear', anchor_kg: 6000, safety_factor: 1.5 }).outputs;
      assertClose(o.holding_n, 24000 * G, { rel: 1e-12 }, 'holding');
      assertClose(o.allowable_n, 156906.4, { abs: 0.1 }, 'allowable');
    },
  },
  {
    name: 'Class ranges: a 10 t Class A anchor holds 33 to 55 times its weight; Class D middle is 11.5',
    source: 'Vryhof Anchor Manual (2000), "Characteristics of anchor types" (efficiency for a 10 t anchor)',
    run: () => {
      assertClose(calculate({ anchor_class: 'A', estimate: 'low', anchor_kg: 10000 }).outputs.holding_n, 33 * 10000 * G, { rel: 1e-12 }, 'A low');
      assertClose(calculate({ anchor_class: 'A', estimate: 'high', anchor_kg: 10000 }).outputs.holding_n, 55 * 10000 * G, { rel: 1e-12 }, 'A high');
      assertClose(calculate({ anchor_class: 'D', estimate: 'mid' }).outputs.eff_used, 11.5, { rel: 1e-12 }, 'D mid');
    },
  },
  {
    name: 'Required mass: 300 kN with SF 1.5 needs 450 / (4 × 9.80665) = 11.47 t of Class F, 5.74 t of Class D at η 8',
    source: 'W = F SF / (η g); hand calculation',
    run: () => {
      assertClose(calculate({ mode: 'mass', anchor_class: 'F', force_n: 300000 }).outputs.mass_req_kg, 11471.81, { abs: 0.01 }, 'F');
      assertClose(calculate({ mode: 'mass', anchor_class: 'D', force_n: 300000 }).outputs.mass_req_kg, 5735.90, { abs: 0.01 }, 'D');
    },
  },
  {
    name: 'Vryhof size law UHC ∝ W^0.92: equal to the linear rule at 10 t; a 20 t anchor holds 2^0.92 = 1.892 times a 10 t one; inverse round trip',
    source: 'Vryhof Anchor Manual (2000), UHC = A W^0.92 charts; consistency check',
    run: () => {
      const a = calculate({ scaling: 'vryhof', anchor_kg: 10000 }).outputs.holding_n;
      assertClose(a, calculate({ scaling: 'linear', anchor_kg: 10000 }).outputs.holding_n, { rel: 1e-12 }, 'same at 10 t');
      const b = calculate({ scaling: 'vryhof', anchor_kg: 20000 }).outputs.holding_n;
      assertClose(b / a, 2 ** 0.92, { rel: 1e-12 }, 'exponent');
      const m = calculate({ mode: 'mass', scaling: 'vryhof', force_n: b / 1.5 }).outputs.mass_req_kg;
      assertClose(m, 20000, { rel: 1e-9 }, 'inverse');
    },
  },
  {
    name: 'Small anchors warn; a safety factor below 1 and a zero mass are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ anchor_kg: 20 }).warnings.length > 0, true, 'small anchor');
      assertThrows(() => calculate({ safety_factor: 0.8 }), 'Safety factor');
      assertThrows(() => calculate({ anchor_kg: 0 }), 'Anchor mass must be greater than zero');
    },
  },
];
