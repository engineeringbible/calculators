/**
 * truss/tests.js — checks against the method of sections and joint equilibrium.
 * Run: node run-tests.js truss
 */
import { calculate, buildTruss, analyse } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const force = (type, name, opts = {}) => {
  const t = buildTruss(type, opts.n ?? 6, opts.L ?? 18, opts.H ?? 3, opts.W ?? 60000);
  const { forces } = analyse(t);
  const k = t.members.findIndex((m) => m.name === name);
  if (k < 0) throw new Error(`no member ${name}`);
  return forces[k];
};

export const tests = [
  {
    name: 'Pratt, 18 m × 3 m, 6 panels, 60 kN: reactions 30 kN; top chord at midspan −45 kN (M/H = 135/3); bottom chord in panel 3 +40 kN (120/3)',
    source: 'Method of sections, Hibbeler, Structural Analysis, ch. 3: chord force = moment about the opposite joint / depth',
    run: () => {
      const o = calculate({ type: 'pratt', span_m: 18, height_m: 3, panels: 6, load_n: 60000 }).outputs;
      assertClose(o.reaction_n, 30000, { rel: 1e-9 }, 'R');
      assertClose(o.max_c_n, 45000, { rel: 1e-9 }, 'top chord');
      assertClose(o.max_t_n, 40000, { rel: 1e-9 }, 'bottom chord');
      assertEqual(o.max_c_member.startsWith('T2–T3') || o.max_c_member.startsWith('T3–T4'), true, 'location');
    },
  },
  {
    name: 'Pratt end diagonal +35.36 kN (shear 25 kN × 4.243/3), end post −30 kN, midspan vertical −10 kN (the joint load)',
    source: 'Method of joints at B0, T0 and B3',
    run: () => {
      assertClose(force('pratt', 'T0–B1'), 25000 * Math.hypot(3, 3) / 3, { rel: 1e-9 }, 'end diagonal');
      assertClose(force('pratt', 'T0–B0'), -30000, { rel: 1e-9 }, 'end post');
      assertClose(force('pratt', 'T3–B3'), -10000, { rel: 1e-9 }, 'mid vertical');
    },
  },
  {
    name: 'Howe mirrors Pratt: diagonals in compression, bottom chord at midspan +45 kN, end diagonal −35.36 kN',
    source: 'Howe truss: diagonals slope the other way',
    run: () => {
      assertClose(force('howe', 'B2–B3'), 45000, { rel: 1e-9 }, 'bottom chord');
      assertClose(force('howe', 'B0–T1'), -25000 * Math.hypot(3, 3) / 3, { rel: 1e-9 }, 'end diagonal');
    },
  },
  {
    name: 'Warren and every type are in equilibrium: reactions add up to W, and the reactions are equal for a symmetric load',
    source: 'Global equilibrium ΣF_y = 0',
    run: () => {
      for (const type of ['pratt', 'howe', 'warren']) {
        const t = buildTruss(type, 8, 24, 3, 80000);
        const { reactions } = analyse(t);
        assertClose(reactions[1] + reactions[2], 80000, { rel: 1e-9 }, `${type} ΣR`);
        assertClose(reactions[1], reactions[2], { rel: 1e-9 }, `${type} symmetric`);
        assertClose(reactions[0], 0, { abs: 1e-6 }, `${type} no horizontal`);
      }
    },
  },
  {
    name: 'Odd panel counts and zero depth are rejected; a very shallow truss warns',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ panels: 5 }), 'even number');
      assertThrows(() => calculate({ height_m: 0 }), 'Depth must be greater than zero');
      assertEqual(calculate({ span_m: 40, height_m: 2 }).warnings.length, 1, 'shallow');
    },
  },
];
