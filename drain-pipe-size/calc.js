/**
 * drain-pipe-size/calc.js — gravity drain or sewer pipe by Manning's equation: full-flow capacity and velocity for a
 * diameter, roughness and slope; the smallest standard diameter that carries a design flow; the depth and velocity
 * of the design flow in the chosen pipe; and the self-cleansing velocity check (2 ft/s flowing full).
 *
 * V = (1/n) R^(2/3) S^(1/2) (SI; 1.486/n in US units);  Q = A V;  full pipe R = D/4.
 * Partial depth y: θ = 2 acos(1 − 2y/D), A = D²(θ − sin θ)/8, P = Dθ/2.  Minimum slope for V_min: S = (n V_min / R^(2/3))².
 * Schema units: SI — m, m/m, m³/s, m/s.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

const IN = 0.0254;
/** Ten States Standards §33.41: mean velocity flowing full of at least 2.0 ft/s. */
export const V_MIN = 2 * 0.3048;

/** Manning n (Uni-Bell PVC Pipe Association; Ten States Standards §33.41; Chow 1959 Table 5-6). */
export const ROUGHNESS = {
  pvc: { label: 'PVC or smooth HDPE, n = 0.009 (Uni-Bell)', n: 0.009 },
  pvc_cons: { label: 'PVC, conservative n = 0.011', n: 0.011 },
  ductile: { label: 'Cast or ductile iron, lined, n = 0.012', n: 0.012 },
  concrete: { label: 'Concrete or vitrified clay, n = 0.013', n: 0.013 },
  custom: { label: "Custom Manning's n", n: null },
};

/** Common nominal sizes, used as the inside diameter. */
export const SERIES = {
  us: { label: 'US nominal sizes, in', sizes: [3, 4, 6, 8, 10, 12, 15, 18, 21, 24, 27, 30, 36, 42, 48, 54, 60], unit: 'in', factor: IN },
  metric: { label: 'Metric DN sizes, mm', sizes: [100, 150, 200, 225, 250, 300, 375, 450, 525, 600, 675, 750, 900, 1050, 1200, 1350, 1500], unit: 'mm', factor: 0.001 },
};

export const schema = {
  id: 'drain-pipe-size',
  name: 'Drain pipe size calculator (Manning)',
  category: 'civil',
  summary: 'Gravity drain and sewer pipe sizing by Manning: full-flow capacity and velocity, smallest standard diameter for a flow, flow depth and self-cleansing check.',
  related: ['manning-channel-flow', 'culvert-capacity', 'rational-runoff', 'pipe-flow'],
  assumptions: [
    'Steady, uniform gravity flow in a straight circular pipe of constant slope; the hydraulic gradient equals the pipe slope. Surcharged pipes, backwater from a downstream pipe and losses at manholes and bends are not included.',
    "Manning's n is a property of the pipe surface in service: smooth PVC tests near 0.009, but many agencies require 0.013 for every material to allow for joints, slime and deposits.",
    'The nominal size is taken as the inside diameter. PVC sewer pipe and some plastic pipes have a slightly smaller bore, so enter the actual inside diameter for a close check.',
    'The self-cleansing check uses the Ten States Standards rule of at least 2.0 ft/s (0.61 m/s) with the pipe flowing full; at low flows the actual velocity is lower, so check the partial-flow velocity too.',
    'This page sizes the pipe hydraulically. Building drains are sized by plumbing-code drainage fixture unit tables, which are not reproduced here.',
  ],
  notes: [
    'Verification 2026-11-08: an 8 in pipe at 0.40 % with n = 0.013 carries 0.764 ft³/s (343 US gpm) at 2.19 ft/s flowing full, meeting the Ten States 2 ft/s rule that sets 0.40 % as the minimum slope for 8 in. A design flow of 150 gpm runs 0.46 of the diameter deep at 2.12 ft/s; 6 in is the smallest US size that carries it full. Checked by hand.',
  ],
  sources: [
    'Great Lakes–Upper Mississippi River Board (Ten States Standards), Recommended Standards for Wastewater Facilities (2014), §33.41 minimum slopes for 2.0 ft/s flowing full with n = 0.013',
    "Uni-Bell PVC Pipe Association, Manning's n for PVC gravity sewer pipe (n = 0.009 for design), and Handbook of PVC Pipe Design and Construction, 5th ed.",
    'V. T. Chow, Open-Channel Hydraulics (McGraw-Hill, 1959), ch. 5 and 6: Manning formula, Table 5-6 roughness, partially full circular sections',
  ],
  inputs: [
    { id: 'diameter_m', label: 'Pipe inside diameter D', group: 'length', unit: 'm', display: 'in', default: 8 * IN, min: 0.02, max: 5 },
    { id: 'slope', label: 'Pipe slope S', group: 'ratio', unit: 'frac', display: 'pct', default: 0.004, min: 0.00001, max: 1, help: '¼ in per ft = 2.08 %; ⅛ in per ft = 1.04 %.' },
    { id: 'roughness', label: 'Pipe material', type: 'select', default: 'concrete', options: Object.entries(ROUGHNESS).map(([value, r]) => ({ value, label: r.label })) },
    { id: 'manning_n', label: "Manning's n", group: 'dimensionless', unit: 'none', default: 0.013, min: 0.008, max: 0.03, visibleWhen: { roughness: 'custom' } },
    { id: 'flow_m3s', label: 'Design flow Q', group: 'volume_flow', unit: 'm3_s', display: 'gpm_us', default: 150 * 0.003785411784 / 60, min: 1e-6, max: 100 },
    { id: 'series', label: 'Standard sizes to choose from', type: 'select', default: 'us', options: Object.entries(SERIES).map(([value, s]) => ({ value, label: s.label })) },
  ],
  outputs: [
    { id: 'q_full_m3s', label: 'Full-flow capacity', group: 'volume_flow', unit: 'm3_s', display: 'gpm_us' },
    { id: 'v_full_m_s', label: 'Velocity flowing full', group: 'speed', unit: 'm_s', display: 'ft_s' },
    { id: 'ratio', label: 'Design flow / full-flow capacity', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'depth_ratio', label: 'Depth of the design flow y/D', group: 'ratio', unit: 'frac', decimals: 2 },
    { id: 'depth_m', label: 'Depth of the design flow', group: 'length', unit: 'm', display: 'in' },
    { id: 'v_design_m_s', label: 'Velocity at the design flow', group: 'speed', unit: 'm_s', display: 'ft_s' },
    { id: 'smallest', label: 'Smallest standard size that carries the design flow full', type: 'text' },
    { id: 'self_cleansing', label: 'Self-cleansing check (2 ft/s flowing full)', type: 'text' },
    { id: 'min_slope', label: 'Minimum slope for 2 ft/s flowing full', group: 'ratio', unit: 'frac', display: 'pct' },
  ],
  example: {
    inputs: { diameter_m: [8, 'in'], slope: [0.4, 'pct'], roughness: 'concrete', flow_m3s: [150, 'gpm_us'], series: 'us' },
    results: { q_full_m3s: '343 US gpm', v_full_m_s: '2.19 ft/s', depth_ratio: '0.46', v_design_m_s: '2.12 ft/s' },
  },
};

/** Flow area and wetted perimeter of a circular pipe of diameter D at depth y. */
export function circleSection(D, y) {
  const theta = 2 * Math.acos(1 - (2 * Math.min(y, D)) / D);
  return { area: (D * D * (theta - Math.sin(theta))) / 8, perimeter: (D * theta) / 2 };
}

/** Manning discharge (m³/s) at depth y. */
export function flowAtDepth(D, n, S, y) {
  const { area, perimeter } = circleSection(D, y);
  if (area <= 0) return 0;
  return (area / n) * (area / perimeter) ** (2 / 3) * Math.sqrt(S);
}

/** Full-pipe capacity, m³/s. */
export const fullFlow = (D, n, S) => (Math.PI * D * D / 4 / n) * (D / 4) ** (2 / 3) * Math.sqrt(S);

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.roughness, Object.keys(ROUGHNESS), 'roughness', 'Pipe material');
  assertOneOf(x.series, Object.keys(SERIES), 'series', 'Standard sizes');
  const D = assertRange(x.diameter_m, 0.02, 5, 'diameter_m', 'Pipe inside diameter');
  const S = assertRange(x.slope, 0.00001, 1, 'slope', 'Pipe slope');
  const n = x.roughness === 'custom' ? assertRange(x.manning_n, 0.008, 0.03, 'manning_n', "Manning's n") : ROUGHNESS[x.roughness].n;
  const Q = assertPositive(x.flow_m3s, 'flow_m3s', 'Design flow');

  const Qf = fullFlow(D, n, S);
  const Vf = Qf / (Math.PI * D * D / 4);
  // depth of the design flow, by bisection below the depth of maximum discharge (about 0.938 D)
  const yMax = 0.9381 * D;
  let depth = null;
  let vDesign = null;
  if (Q <= flowAtDepth(D, n, S, yMax)) {
    let lo = 0;
    let hi = yMax;
    for (let k = 0; k < 100; k += 1) {
      const mid = (lo + hi) / 2;
      if (flowAtDepth(D, n, S, mid) < Q) lo = mid; else hi = mid;
    }
    depth = (lo + hi) / 2;
    vDesign = Q / circleSection(D, depth).area;
  }
  const ser = SERIES[x.series];
  const size = ser.sizes.find((s) => fullFlow(s * ser.factor, n, S) >= Q);
  const smallest = size
    ? `${size} ${ser.unit} (full-flow capacity ${(fullFlow(size * ser.factor, n, S) / Q * 100).toFixed(0)} % of the design flow)`
    : `Larger than ${ser.sizes[ser.sizes.length - 1]} ${ser.unit}: use several pipes or a box section`;
  const minSlope = (n * V_MIN / (D / 4) ** (2 / 3)) ** 2;
  const selfCleansing = Vf >= V_MIN - 1e-12
    ? `Meets 2 ft/s (0.61 m/s) flowing full: ${(Vf / 0.3048).toFixed(2)} ft/s`
    : `Below 2 ft/s (0.61 m/s) flowing full: ${(Vf / 0.3048).toFixed(2)} ft/s; steepen to at least ${(minSlope * 100).toFixed(2)} %`;

  const warnings = [];
  if (depth === null) warnings.push('The design flow exceeds the free-surface capacity of this pipe: it would run surcharged under pressure; choose a larger pipe or a steeper slope.');
  else if (depth / D > 0.75) warnings.push('Design flow deeper than 75 % of the diameter: many sewer standards limit the depth to 50 to 75 % to leave room for ventilation and peaks.');
  if (Vf > 3.05) warnings.push('Velocity flowing full above 10 ft/s (3 m/s): check the pipe for abrasion and anchor it on steep slopes.');
  if (D < 0.2 && x.series === 'us' && Q > 0) warnings.push('Public gravity sewers are usually at least 8 in (200 mm); smaller sizes are building drains and laterals sized by the plumbing code.');
  return {
    outputs: {
      q_full_m3s: Qf,
      v_full_m_s: Vf,
      ratio: Q / Qf,
      depth_ratio: depth === null ? null : depth / D,
      depth_m: depth,
      v_design_m_s: vDesign,
      smallest,
      self_cleansing: selfCleansing,
      min_slope: minSlope,
    },
    warnings,
  };
}
