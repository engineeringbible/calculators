/**
 * tap-drill/calc.js — tap drill size for ISO metric coarse and fine threads (M2–M24) and UNC/UNF threads (#4 to 1 in):
 * the theoretical drill for a chosen percentage of thread, the nearest standard drill and the thread it gives, with the
 * basic pitch and minor diameters of ISO 724 / ASME B1.1.
 *
 * Basic profile (ISO 68-1, ASME B1.1): H = (√3/2) P;  d2 = D − (3√3/8) P = D − 0.649519 P;  D1 = D − (5√3/8) P = D − 1.082532 P.
 * Drill for a percentage of thread (OSG, Machinery's Handbook): drill = D − 1.299 P × %/100 (= D − 0.01299 × % / TPI,
 * = D − % × P / 76.98), so 100 % thread is a double thread depth of 1.299 P and the basic minor D1 is 83.3 %.
 * Schema units: SI — m.
 */
import { withDefaults, assertOneOf, assertRange } from '../shared/validate.js';

const IN = 0.0254;
const K_PITCH = (3 * Math.sqrt(3)) / 8; // 0.649519
const K_MINOR = (5 * Math.sqrt(3)) / 8; // 1.082532
const K_FULL = (3 * Math.sqrt(3)) / 4; // 1.299038: 100 % thread (0.01299 × 100)

/** Threads: [id, label, major diameter (m), pitch (m), system]. Pitches: ISO 261/262 and ASME B1.1. */
const METRIC = [
  [2, 0.4], [2.5, 0.45], [3, 0.5], [3, 0.35], [4, 0.7], [4, 0.5], [5, 0.8], [5, 0.5], [6, 1], [6, 0.75], [8, 1.25], [8, 1],
  [10, 1.5], [10, 1.25], [10, 1], [12, 1.75], [12, 1.5], [12, 1.25], [14, 2], [14, 1.5], [16, 2], [16, 1.5], [18, 2.5], [18, 1.5],
  [20, 2.5], [20, 1.5], [22, 2.5], [22, 1.5], [24, 3], [24, 2],
];
const COARSE = { 2: 0.4, 2.5: 0.45, 3: 0.5, 4: 0.7, 5: 0.8, 6: 1, 8: 1.25, 10: 1.5, 12: 1.75, 14: 2, 16: 2, 18: 2.5, 20: 2.5, 22: 2.5, 24: 3 };
/** Unified sizes: [label, major diameter in, UNC tpi, UNF tpi]. */
const UNIFIED = [
  ['#4', 0.112, 40, 48], ['#5', 0.125, 40, 44], ['#6', 0.138, 32, 40], ['#8', 0.164, 32, 36], ['#10', 0.19, 24, 32], ['#12', 0.216, 24, 28],
  ['1/4', 0.25, 20, 28], ['5/16', 0.3125, 18, 24], ['3/8', 0.375, 16, 24], ['7/16', 0.4375, 14, 20], ['1/2', 0.5, 13, 20], ['9/16', 0.5625, 12, 18],
  ['5/8', 0.625, 11, 18], ['3/4', 0.75, 10, 16], ['7/8', 0.875, 9, 14], ['1', 1, 8, 12],
];

export const THREADS = [
  ...METRIC.map(([d, p]) => [`m${d}x${p}`, `M${d} × ${p}${COARSE[d] === p ? ' (coarse)' : ' (fine)'}`, d / 1000, p / 1000, 'metric']),
  ...UNIFIED.flatMap(([s, d, c, f]) => [
    [`unc_${s}`, `${s}-${c} UNC`, d * IN, IN / c, 'unified'],
    [`unf_${s}`, `${s}-${f} UNF`, d * IN, IN / f, 'unified'],
  ]),
];
const METRIC_IDS = THREADS.filter((t) => t[4] === 'metric').map((t) => t[0]);
const UNIFIED_IDS = THREADS.filter((t) => t[4] === 'unified').map((t) => t[0]);

/** Metric jobber drills: 0.05 mm steps to 3 mm, 0.1 mm to 13 mm, 0.5 mm to 25 mm. [label, diameter m] */
const METRIC_DRILLS = [];
for (let d = 100; d <= 300; d += 5) METRIC_DRILLS.push(d / 100);
for (let d = 31; d <= 130; d += 1) METRIC_DRILLS.push(d / 10);
for (let d = 135; d <= 250; d += 5) METRIC_DRILLS.push(d / 10);
const MM_DRILLS = METRIC_DRILLS.map((mm) => [`${mm} mm`, mm / 1000]);

/** Inch drills (ASME B94.11M): number sizes #1–#60, letter sizes A–Z and fractions in 1/64 in to 1 in. */
const NUMBER = [0.228, 0.221, 0.213, 0.209, 0.2055, 0.204, 0.201, 0.199, 0.196, 0.1935, 0.191, 0.189, 0.185, 0.182, 0.18, 0.177, 0.173, 0.1695, 0.166, 0.161,
  0.159, 0.157, 0.154, 0.152, 0.1495, 0.147, 0.144, 0.1405, 0.136, 0.1285, 0.12, 0.116, 0.113, 0.111, 0.11, 0.1065, 0.104, 0.1015, 0.0995, 0.098,
  0.096, 0.0935, 0.089, 0.086, 0.082, 0.081, 0.0785, 0.076, 0.073, 0.07, 0.067, 0.0635, 0.0595, 0.055, 0.052, 0.0465, 0.043, 0.042, 0.041, 0.04];
const LETTER = [0.234, 0.238, 0.242, 0.246, 0.25, 0.257, 0.261, 0.266, 0.272, 0.277, 0.281, 0.29, 0.295, 0.302, 0.316, 0.323, 0.332, 0.339, 0.348, 0.358,
  0.368, 0.377, 0.386, 0.397, 0.404, 0.413];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const IN_DRILLS = [
  ...Array.from({ length: 64 }, (_, k) => { const n = k + 1; const g = gcd(n, 64); return [n === 64 ? '1 in' : `${n / g}/${64 / g} in`, (n / 64) * IN]; }),
  ...NUMBER.map((d, k) => [`#${k + 1}`, d * IN]),
  ...LETTER.map((d, k) => [String.fromCharCode(65 + k), d * IN]).filter(([l]) => l !== 'E'), // E = 1/4 in
];

/** Theoretical drill for a percentage of thread (OSG / Machinery's Handbook convention). */
export function drillFor(D, P, pct) {
  return D - (K_FULL * P * pct) / 100;
}

/** Percentage of thread a drill gives. */
export function threadPct(D, P, drill) {
  return ((D - drill) / (K_FULL * P)) * 100;
}

/** Nearest standard drill: [label, diameter m]. */
export function nearestDrill(target, system) {
  const list = system === 'metric' ? MM_DRILLS : IN_DRILLS;
  return list.reduce((best, d) => (Math.abs(d[1] - target) < Math.abs(best[1] - target) - 1e-12 ? d : best));
}

const drillText = (d, system) => (system === 'metric' ? d[0] : d[0].endsWith('in') ? `${d[0]} (${(d[1] / IN).toFixed(4)} in)` : `${d[0]} drill (${(d[1] / IN).toFixed(4)} in)`);

const metricOut = { thread: METRIC_IDS };
const unifiedOut = { thread: UNIFIED_IDS };

export const schema = {
  id: 'tap-drill',
  name: 'Tap drill size calculator (metric and UNC/UNF)',
  category: 'manufacturing',
  summary: 'Tap drill for metric coarse and fine and UNC/UNF threads at any percentage of thread, with the nearest standard drill and the basic pitch and minor diameters.',
  related: ['drill-point-length', 'speeds-feeds', 'bolt-torque', 'bend-allowance'],
  assumptions: [
    'Percentage of thread follows the tap makers\' and Machinery\'s Handbook convention: drill = D − 0.01299 × % / TPI = D − % × P / 76.98, so 100 % is a double thread depth of 1.299 P and the basic minor diameter D1 corresponds to 83.3 %.',
    'Pitch and minor diameters are the basic values of ISO 724 and ASME B1.1 (d2 = D − 0.649519 P, D1 = D − 1.082532 P); the tolerance class (6H, 2B) adds a small band above D1 that the drilled hole should fall into.',
    'The standard drill is the nearest size in metric jobber drills (0.05 mm steps to 3 mm, 0.1 mm to 13 mm, 0.5 mm to 25 mm) or in fractional, number and letter drills; a drill cuts slightly oversize, so the real thread percentage is a little lower. Published charts sometimes take the next smaller drill (10.2 mm for M12, 12 mm for M14).',
    'About 75 % thread is the usual choice for cut taps in steel: it keeps most of the strength and eases tapping. Form (roll) taps need a larger hole; use the tap maker\'s chart for them.',
  ],
  notes: [
    'Verification 2026-11-08: 1/4-20 UNC at 75 % thread needs 0.25 − 0.01299 × 75 / 20 = 0.2013 in; the #7 drill (0.2010 in) gives 75.4 %. Basic pitch diameter 0.2175 in and minor diameter 0.1959 in (ASME B1.1). Checked by hand.',
    'Drill sizes checked against the number and letter tables of ASME B94.11M (via the Wikipedia drill size tables); ISO 724 values reproduced for M6, M10 and M24.',
  ],
  sources: [
    'ISO 724:1993 ISO general-purpose metric screw threads — Basic dimensions (d2 = d − 0.6495 P, D1 = d − 1.0825 P); ISO 261 and ISO 262 (pitches)',
    'ASME B1.1-2019 Unified Inch Screw Threads, Table 2 (basic pitch and minor diameters, UNC and UNF series)',
    'OSG USA, Tap Drill Size and Pitch Diameter Limit chart, Vol. 3 (2024): percentage-of-thread formulas (2"-12 with a 1.9242" drill = 70 %)',
    'ASME B94.11M Twist drills (number and letter drill sizes)',
  ],
  inputs: [
    { id: 'thread', label: 'Thread', type: 'select', default: 'unc_1/4', options: THREADS.map(([value, label]) => ({ value, label })) },
    { id: 'pct', label: 'Percentage of thread', group: 'ratio', unit: 'frac', display: 'pct', default: 0.75, min: 0.4, max: 1 },
  ],
  outputs: [
    { id: 'pitch_m', label: 'Pitch P', group: 'length', unit: 'm', display: 'mm', visibleWhen: metricOut },
    { id: 'tpi', label: 'Threads per inch', group: 'dimensionless', unit: 'none', decimals: 0, visibleWhen: unifiedOut },
    { id: 'major_mm', label: 'Major diameter D', group: 'length', unit: 'm', display: 'mm', visibleWhen: metricOut },
    { id: 'd2_mm', label: 'Basic pitch diameter d2 (ISO 724)', group: 'length', unit: 'm', display: 'mm', visibleWhen: metricOut },
    { id: 'd1_mm', label: 'Basic minor diameter D1 (ISO 724)', group: 'length', unit: 'm', display: 'mm', visibleWhen: metricOut },
    { id: 'theory_mm', label: 'Theoretical tap drill for this percentage', group: 'length', unit: 'm', display: 'mm', visibleWhen: metricOut },
    { id: 'major_in', label: 'Major diameter D', group: 'length', unit: 'm', display: 'in', visibleWhen: unifiedOut },
    { id: 'd2_in', label: 'Basic pitch diameter E (ASME B1.1)', group: 'length', unit: 'm', display: 'in', visibleWhen: unifiedOut },
    { id: 'd1_in', label: 'Basic minor diameter D1 (ASME B1.1)', group: 'length', unit: 'm', display: 'in', visibleWhen: unifiedOut },
    { id: 'theory_in', label: 'Theoretical tap drill for this percentage', group: 'length', unit: 'm', display: 'in', visibleWhen: unifiedOut },
    { id: 'drill', label: 'Nearest standard drill', type: 'text' },
    { id: 'drill_pct', label: 'Thread percentage with that drill', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'family', label: 'Tap drills for every size of this system', type: 'table' },
  ],
  example: {
    inputs: { thread: 'unc_1/4', pct: [75, 'pct'] },
    results: { theory_in: '0.2013 in', drill_pct: '75.4 %', d2_in: '0.2175 in', d1_in: '0.1959 in' },
  },
};

function row(t, pct) {
  const [, label, D, P, system] = t;
  const theory = drillFor(D, P, pct);
  const drill = nearestDrill(theory, system);
  return { label, D, P, system, theory, drill, drillPct: threadPct(D, P, drill[1]), d2: D - K_PITCH * P, d1: D - K_MINOR * P };
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.thread, THREADS.map((t) => t[0]), 'thread', 'Thread');
  const pct = assertRange(x.pct, 0.4, 1, 'pct', 'Percentage of thread') * 100;
  const t = THREADS.find((th) => th[0] === x.thread);
  const r = row(t, pct);
  const metric = r.system === 'metric';
  const warnings = [];
  if (pct > 83.34) warnings.push('Above 83 % the drill is smaller than the basic minor diameter: tapping torque and tap breakage rise sharply for little extra strength.');
  if (pct < 55) warnings.push('Below about 55 % thread the strip strength drops noticeably; check the engagement length.');
  const fmt = (v) => (metric ? `${(v * 1000).toFixed(3)}` : `${(v / IN).toFixed(4)}`);
  return {
    outputs: {
      pitch_m: metric ? r.P : null,
      tpi: metric ? null : IN / r.P,
      major_mm: metric ? r.D : null,
      d2_mm: metric ? r.d2 : null,
      d1_mm: metric ? r.d1 : null,
      theory_mm: metric ? r.theory : null,
      major_in: metric ? null : r.D,
      d2_in: metric ? null : r.d2,
      d1_in: metric ? null : r.d1,
      theory_in: metric ? null : r.theory,
      drill: drillText(r.drill, r.system),
      drill_pct: r.drillPct / 100,
      family: {
        columns: metric
          ? ['Thread', 'Pitch (mm)', 'd2 (mm)', 'D1 (mm)', `Drill at ${pct.toFixed(0)} % (mm)`, 'Standard drill', 'Thread %']
          : ['Thread', 'TPI', 'E (in)', 'D1 (in)', `Drill at ${pct.toFixed(0)} % (in)`, 'Standard drill', 'Thread %'],
        rows: THREADS.filter((th) => th[4] === r.system).map((th) => {
          const q = row(th, pct);
          return [q.label, metric ? q.P * 1000 : Math.round(IN / q.P), fmt(q.d2), fmt(q.d1), fmt(q.theory), drillText(q.drill, q.system), Number(q.drillPct.toFixed(1))];
        }),
      },
    },
    warnings,
  };
}
