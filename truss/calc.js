/**
 * truss/calc.js — member forces of a simply supported Pratt, Howe or Warren truss under a uniform load on the top chord,
 * by the method of joints (two equilibrium equations per joint, solved together), with the reactions and the largest
 * tension and compression.
 *
 * Statically determinate plane truss: m + r = 2j. Panel loads: W/n at interior top joints, W/(2n) at the end joints of
 * Pratt and Howe trusses (W/n at every top joint of a Warren truss). Tension positive.
 * Schema units: SI — m, N.
 */
import { withDefaults, assertPositive, assertOneOf, assertInteger } from '../shared/validate.js';

export const TYPES = {
  pratt: 'Pratt (parallel chords, verticals; diagonals in tension)',
  howe: 'Howe (parallel chords, verticals; diagonals in compression)',
  warren: 'Warren (parallel chords, no verticals)',
};

/** Builds joints, members and joint loads. */
export function buildTruss(type, n, L, H, W) {
  const a = L / n;
  const joints = [];
  const members = [];
  const loads = [];
  const add = (name, x, y) => { joints.push({ name, x, y }); loads.push(0); return joints.length - 1; };
  const B = [];
  for (let i = 0; i <= n; i += 1) B.push(add(`B${i}`, i * a, 0));
  const link = (i, j, kind) => members.push({ i, j, kind, name: `${joints[i].name}–${joints[j].name}` });
  for (let i = 0; i < n; i += 1) link(B[i], B[i + 1], 'bottom chord');
  if (type === 'warren') {
    const T = [];
    for (let i = 0; i < n; i += 1) T.push(add(`T${i + 1}`, (i + 0.5) * a, H));
    for (let i = 0; i < n - 1; i += 1) link(T[i], T[i + 1], 'top chord');
    for (let i = 0; i < n; i += 1) { link(B[i], T[i], 'diagonal'); link(T[i], B[i + 1], 'diagonal'); }
    T.forEach((t) => { loads[t] = W / n; });
  } else {
    const T = [];
    for (let i = 0; i <= n; i += 1) T.push(add(`T${i}`, i * a, H));
    for (let i = 0; i < n; i += 1) link(T[i], T[i + 1], 'top chord');
    for (let i = 0; i <= n; i += 1) link(T[i], B[i], i === 0 || i === n ? 'end post' : 'vertical');
    for (let i = 0; i < n; i += 1) {
      const leftHalf = i < n / 2;
      const pratt = type === 'pratt';
      // Pratt: diagonals slope down towards midspan; Howe: up towards midspan.
      if (leftHalf === pratt) link(T[i], B[i + 1], 'diagonal'); else link(B[i], T[i + 1], 'diagonal');
    }
    T.forEach((t, i) => { loads[t] = i === 0 || i === n ? W / (2 * n) : W / n; });
  }
  return { joints, members, loads, left: B[0], right: B[n] };
}

/** Gaussian elimination with partial pivoting. */
function solve(A, b) {
  const n = b.length;
  for (let c = 0; c < n; c += 1) {
    let p = c;
    for (let r = c + 1; r < n; r += 1) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) throw new Error('The truss is unstable or not determinate.');
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = c + 1; r < n; r += 1) {
      const f = A[r][c] / A[c][c];
      if (!f) continue;
      for (let k = c; k < n; k += 1) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r -= 1) {
    let s = b[r];
    for (let k = r + 1; k < n; k += 1) s -= A[r][k] * x[k];
    x[r] = s / A[r][r];
  }
  return x;
}

/** Member forces (tension +) and reactions [Rx left, Ry left, Ry right]. */
export function analyse(t) {
  const m = t.members.length;
  const nUnknown = m + 3;
  const nEq = 2 * t.joints.length;
  if (nUnknown !== nEq) throw new Error('The truss is not statically determinate.');
  const A = Array.from({ length: nEq }, () => new Array(nUnknown).fill(0));
  const b = new Array(nEq).fill(0);
  t.members.forEach((mem, k) => {
    const p = t.joints[mem.i]; const q = t.joints[mem.j];
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    const cx = (q.x - p.x) / len; const cy = (q.y - p.y) / len;
    A[2 * mem.i][k] += cx; A[2 * mem.i + 1][k] += cy;   // tension pulls joint i towards j
    A[2 * mem.j][k] -= cx; A[2 * mem.j + 1][k] -= cy;
  });
  A[2 * t.left][m] = 1; A[2 * t.left + 1][m + 1] = 1; A[2 * t.right + 1][m + 2] = 1;
  t.loads.forEach((w, j) => { b[2 * j + 1] = w; });     // Σ forces + external (−w) = 0 → Σ = w
  const x = solve(A, b);
  return { forces: x.slice(0, m), reactions: x.slice(m) };
}

export const schema = {
  id: 'truss',
  name: 'Truss calculator (Pratt, Howe, Warren)',
  category: 'structural',
  summary: 'Member forces, reactions and the largest tension and compression in a Pratt, Howe or Warren truss under a uniform roof or bridge load, by the method of joints.',
  related: ['beam-deflection', 'column-buckling', 'moment-of-inertia', 'snow-load'],
  assumptions: [
    'The truss is planar and simply supported (pin at the left, roller at the right), with pinned joints and loads only at the top-chord joints, so members carry axial force only.',
    'A uniform load W over the span is lumped at the top joints: W/n at each interior joint and half that at the two end joints of a Pratt or Howe truss; a Warren truss has n top joints, each taking W/n.',
    'Self-weight of the members, secondary bending from continuous chords and eccentric connections are not included. Compression members must also be checked for buckling over their length.',
  ],
  notes: [
    'Verification 2026-11-07: a Pratt truss of 18 m span, 3 m deep, 6 panels, carrying 60 kN: reactions 30 kN; top chord at midspan 45 kN compression (M/H = 135/3 about the bottom middle joint); bottom chord in the middle panels 40 kN tension (M/H = 120/3 about the top joint 6 m in); end diagonal 35.36 kN tension; end post 30 kN compression. Checked by hand by the method of sections.',
  ],
  sources: [
    'Hibbeler, R.C., Structural Analysis, 10th ed., ch. 3 (method of joints, determinacy m + r = 2j, common truss forms)',
    'Megson, T.H.G., Structural and Stress Analysis, 4th ed., ch. 4 (statically determinate pin-jointed frameworks)',
  ],
  inputs: [
    { id: 'type', label: 'Truss type', type: 'select', default: 'pratt', options: Object.entries(TYPES).map(([value, label]) => ({ value, label })) },
    { id: 'span_m', label: 'Span L', group: 'length', unit: 'm', default: 18, min: 0.5, max: 500 },
    { id: 'height_m', label: 'Depth H (centre to centre of chords)', group: 'length', unit: 'm', default: 3, min: 0.05, max: 100 },
    { id: 'panels', label: 'Number of panels n (even)', group: 'dimensionless', unit: 'none', default: 6, min: 2, max: 40, integer: true },
    { id: 'load_n', label: 'Total load on the top chord W', group: 'force', unit: 'N', display: 'kN', default: 60000, min: 1e-3, max: 1e9 },
  ],
  outputs: [
    { id: 'reaction_n', label: 'Each support reaction', group: 'force', unit: 'N', display: 'kN' },
    { id: 'max_t_n', label: 'Largest tension', group: 'force', unit: 'N', display: 'kN' },
    { id: 'max_t_member', label: 'Member with the largest tension', type: 'text' },
    { id: 'max_c_n', label: 'Largest compression', group: 'force', unit: 'N', display: 'kN' },
    { id: 'max_c_member', label: 'Member with the largest compression', type: 'text' },
    { id: 'members', label: 'All member forces (+ tension, − compression), kN', type: 'text' },
    { id: 'count', label: 'Members', group: 'dimensionless', unit: 'none', decimals: 0 },
  ],
  example: {
    inputs: { type: 'pratt', span_m: [18, 'm'], height_m: [3, 'm'], panels: 6, load_n: [60, 'kN'] },
    results: { reaction_n: '30.0 kN', max_t_n: '40.0 kN', max_c_n: '45.0 kN' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.type, Object.keys(TYPES), 'type', 'Truss type');
  const L = assertPositive(x.span_m, 'span_m', 'Span');
  const H = assertPositive(x.height_m, 'height_m', 'Depth');
  const n = assertInteger(x.panels, 'panels', 'Number of panels');
  if (n < 2 || n > 40 || n % 2) throw new Error('Number of panels: enter an even number from 2 to 40.');
  const W = assertPositive(x.load_n, 'load_n', 'Total load');
  const t = buildTruss(x.type, n, L, H, W);
  const { forces, reactions } = analyse(t);
  let iT = 0; let iC = 0;
  forces.forEach((f, k) => { if (f > forces[iT]) iT = k; if (f < forces[iC]) iC = k; });
  const fmt = (f) => (Math.abs(f) < 1e-6 ? '0' : (f / 1000).toFixed(2));
  const warnings = [];
  const ratio = L / H;
  if (ratio > 12) warnings.push(`Span-to-depth ratio ${ratio.toFixed(1)}: trusses are usually 1/8 to 1/12 of the span deep; a shallower truss has large chord forces and deflects more.`);
  return {
    outputs: {
      reaction_n: reactions[1],
      max_t_n: forces[iT] > 0 ? forces[iT] : 0,
      max_t_member: forces[iT] > 0 ? `${t.members[iT].name} (${t.members[iT].kind})` : 'None',
      max_c_n: forces[iC] < 0 ? -forces[iC] : 0,
      max_c_member: forces[iC] < 0 ? `${t.members[iC].name} (${t.members[iC].kind})` : 'None',
      members: t.members.map((mem, k) => `${mem.name} ${fmt(forces[k])}`).join(' · '),
      count: t.members.length,
    },
    warnings,
  };
}
