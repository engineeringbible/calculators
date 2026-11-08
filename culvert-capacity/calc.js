/**
 * culvert-capacity/calc.js — concrete pipe and box culverts by FHWA HDS-5: headwater for a flow, or the flow for an
 * allowable headwater, under inlet control and outlet control, plus the full-barrel Manning capacity.
 *
 * Inlet control (HDS-5 Appendix A, Form 1, English units, Ku = 1.0, Ks = −0.5):
 *   unsubmerged (Q/AD^0.5 ≤ 3.5):  HW/D = Hc/D + K (Q / A D^0.5)^M − 0.5 S
 *   submerged   (Q/AD^0.5 ≥ 4.0):  HW/D = c (Q / A D^0.5)² + Y − 0.5 S;  linear in Q/AD^0.5 between.
 * Outlet control, barrel full (HDS-5 ch. 3):  H = [1 + ke + 29 n² L / R^1.33] V²/2g;  HW = H + h_o − L S,
 *   h_o = max(TW, (d_c + D)/2).
 * Full-flow Manning:  Q = (1.486/n) A R^(2/3) S^(1/2).
 * Equations are evaluated in ft and ft³/s; schema units SI — m, m³/s, m/s.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertNonNegative } from '../shared/validate.js';

const FT = 0.3048;
const CFS = 0.028316846592;
const G = 9.80665 / FT; // ft/s²

/** HDS-5 Table A.1 inlet control constants (Form 1) and HDS-5 Table C.2 entrance loss coefficients ke. */
export const INLETS = {
  circ_square: { shape: 'circular', label: 'Square edge with headwall', K: 0.0098, M: 2.0, c: 0.0398, Y: 0.67, ke: 0.5 },
  circ_groove: { shape: 'circular', label: 'Groove end with headwall', K: 0.0018, M: 2.0, c: 0.0292, Y: 0.74, ke: 0.2 },
  circ_projecting: { shape: 'circular', label: 'Groove end projecting', K: 0.0045, M: 2.0, c: 0.0317, Y: 0.69, ke: 0.2 },
  box_30_75: { shape: 'box', label: 'Wingwalls flared 30° to 75°', K: 0.026, M: 1.0, c: 0.0347, Y: 0.81, ke: 0.4 },
  box_90_15: { shape: 'box', label: 'Wingwalls flared 90° (headwall) or 15°', K: 0.061, M: 0.75, c: 0.0400, Y: 0.80, ke: 0.5 },
  box_0: { shape: 'box', label: 'Wingwalls parallel to the barrel (0° flare)', K: 0.061, M: 0.75, c: 0.0423, Y: 0.82, ke: 0.7 },
};

export const schema = {
  id: 'culvert-capacity',
  name: 'Culvert capacity and headwater calculator (HDS-5)',
  category: 'civil',
  summary: 'Headwater for a flow, or flow for an allowed headwater, in concrete pipe and box culverts by FHWA HDS-5 inlet and outlet control, with Manning full flow.',
  related: ['manning-channel-flow', 'rational-runoff', 'drain-pipe-size', 'weir-flow'],
  assumptions: [
    'Single-barrel concrete culvert, circular pipe or rectangular box, with one of the HDS-5 inlet types listed; the inlet-control constants are those of HDS-5 Table A.1 for Form 1 and the entrance loss coefficients those of HDS-5 Table C.2.',
    'Inlet control uses the HDS-5 regression equations: unsubmerged up to Q/AD^0.5 = 3.5, submerged from 4.0 (ft and ft³/s), with straight-line interpolation between. Results are as good as the laboratory tests behind them, about ±10 %.',
    'Outlet control uses the HDS-5 full-barrel method with h_o = max(TW, (d_c + D)/2); it is accurate when the barrel flows full and approximate when it runs partly full. The higher of the two headwaters controls.',
    'Headwater is measured from the invert at the inlet. Approach velocity, debris blockage, skew and improved (tapered) inlets are not included.',
    "Manning's n for concrete culverts is 0.011 to 0.013 (Chow); 0.012 is a common design value. The full-flow Manning capacity is only a reference: a culvert's real capacity is set by the headwater.",
  ],
  notes: [
    'Verification 2026-11-08: a 36 in concrete pipe with a square-edged headwall, 100 ft long on 1 %, n = 0.012, carrying 50 ft³/s with no tailwater: Q/AD^0.5 = 4.08, inlet control HW = 3 × (0.0398 × 4.08² + 0.67 − 0.005) = 3.99 ft; outlet control H = (1 + 0.5 + 0.612) × 0.778 = 1.64 ft, h_o = (2.30 + 3)/2 = 2.65 ft, HW = 1.64 + 2.65 − 1.00 = 3.29 ft; inlet control governs. Checked by hand.',
    'Check against the HDS-5 Chart 1 nomograph values tabulated by V. M. Ponce (SDSU online culvert tables): 36 in square edge, S = 0: HW/D 0.695 at 20 ft³/s, 1.12 at 40, 3.28 at 100; the equations agree within 2.5 % up to HW/D 3.3 and within 7 % at HW/D 3.9 (24 in, 40 ft³/s), where the nomograph is read off its scale.',
  ],
  sources: [
    'FHWA, Hydraulic Design of Highway Culverts, HDS-5, 3rd ed. (FHWA-HIF-12-026, 2012), Appendix A: inlet control equations A.1 to A.3 and Table A.1 constants; Appendix C, Table C.2 entrance loss coefficients',
    'FHWA HDS-5, chapter 3: outlet control full-flow head loss H = [1 + ke + 29 n² L / R^1.33] V²/2g and the tailwater rule h_o = max(TW, (d_c + D)/2)',
    'V. T. Chow, Open-Channel Hydraulics (McGraw-Hill, 1959), Table 5-6: n for concrete culverts 0.010 to 0.013',
  ],
  inputs: [
    { id: 'shape', label: 'Barrel', type: 'select', default: 'circular', options: [{ value: 'circular', label: 'Circular concrete pipe' }, { value: 'box', label: 'Rectangular concrete box' }] },
    { id: 'inlet_circ', label: 'Inlet', type: 'select', default: 'circ_square', options: Object.entries(INLETS).filter(([, i]) => i.shape === 'circular').map(([value, i]) => ({ value, label: i.label })), visibleWhen: { shape: 'circular' } },
    { id: 'inlet_box', label: 'Inlet', type: 'select', default: 'box_30_75', options: Object.entries(INLETS).filter(([, i]) => i.shape === 'box').map(([value, i]) => ({ value, label: i.label })), visibleWhen: { shape: 'box' } },
    { id: 'diameter_m', label: 'Pipe diameter D', group: 'length', unit: 'm', display: 'in', default: 36 * 0.0254, min: 0.2, max: 6, visibleWhen: { shape: 'circular' } },
    { id: 'span_m', label: 'Box span B (inside width)', group: 'length', unit: 'm', display: 'ft', default: 6 * FT, min: 0.3, max: 12, visibleWhen: { shape: 'box' } },
    { id: 'rise_m', label: 'Box rise D (inside height)', group: 'length', unit: 'm', display: 'ft', default: 4 * FT, min: 0.3, max: 12, visibleWhen: { shape: 'box' } },
    { id: 'length_m', label: 'Culvert length L', group: 'length', unit: 'm', display: 'ft', default: 100 * FT, min: 1, max: 2000 },
    { id: 'slope', label: 'Barrel slope S', group: 'ratio', unit: 'frac', display: 'pct', default: 0.01, min: 0, max: 0.2 },
    { id: 'manning_n', label: "Manning's n", group: 'dimensionless', unit: 'none', default: 0.012, min: 0.009, max: 0.03 },
    { id: 'tailwater_m', label: 'Tailwater depth above the outlet invert TW', group: 'length', unit: 'm', display: 'ft', default: 0, min: 0, max: 30 },
    { id: 'mode', label: 'Find', type: 'select', default: 'headwater', options: [{ value: 'headwater', label: 'Headwater for a flow' }, { value: 'capacity', label: 'Flow for an allowable headwater' }] },
    { id: 'flow_m3s', label: 'Flow Q', group: 'volume_flow', unit: 'm3_s', display: 'cfs', default: 50 * CFS, min: 0.001, max: 2000, visibleWhen: { mode: 'headwater' } },
    { id: 'hw_allow_m', label: 'Allowable headwater above the inlet invert', group: 'length', unit: 'm', display: 'ft', default: 4.5 * FT, min: 0.05, max: 50, visibleWhen: { mode: 'capacity' } },
  ],
  outputs: [
    { id: 'flow_out_m3s', label: 'Flow Q', group: 'volume_flow', unit: 'm3_s', display: 'cfs' },
    { id: 'hw_m', label: 'Headwater (controlling)', group: 'length', unit: 'm', display: 'ft' },
    { id: 'control', label: 'Control', type: 'text' },
    { id: 'hw_inlet_m', label: 'Headwater, inlet control', group: 'length', unit: 'm', display: 'ft' },
    { id: 'hw_outlet_m', label: 'Headwater, outlet control', group: 'length', unit: 'm', display: 'ft' },
    { id: 'hw_d', label: 'Headwater / barrel height HW/D', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'discharge_index', label: 'Q / (A D^0.5), ft³/s per ft^2.5', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'critical_depth_m', label: 'Critical depth d_c', group: 'length', unit: 'm', display: 'ft' },
    { id: 'velocity_m_s', label: 'Barrel velocity Q / A (full)', group: 'speed', unit: 'm_s', display: 'ft_s' },
    { id: 'q_full_m3s', label: 'Full-flow Manning capacity of the barrel', group: 'volume_flow', unit: 'm3_s', display: 'cfs' },
  ],
  example: {
    inputs: { shape: 'circular', inlet_circ: 'circ_square', diameter_m: [36, 'in'], length_m: [100, 'ft'], slope: [1, 'pct'], manning_n: 0.012, tailwater_m: [0, 'ft'], mode: 'headwater', flow_m3s: [50, 'cfs'] },
    results: { discharge_index: '4.08', hw_inlet_m: '3.99 ft', hw_outlet_m: '3.29 ft', velocity_m_s: '7.07 ft/s' },
  },
};

/** Geometry of the full barrel and critical depth, all in ft. */
function barrel(x) {
  if (x.shape === 'circular') {
    const D = x.D;
    const A = Math.PI * D * D / 4;
    return { D, A, R: D / 4, B: null };
  }
  const A = x.B * x.D;
  return { D: x.D, A, R: A / (2 * (x.B + x.D)), B: x.B };
}

/** Critical depth (ft) and specific head at critical depth Hc (ft) for flow Q (ft³/s). */
export function criticalDepth(shape, D, B, Q) {
  if (shape === 'box') {
    const dc = ((Q / B) ** 2 / G) ** (1 / 3);
    return { dc, Hc: 1.5 * dc };
  }
  const sec = (y) => {
    const th = 2 * Math.acos(1 - (2 * y) / D);
    return { A: (D * D * (th - Math.sin(th))) / 8, T: D * Math.sin(th / 2) };
  };
  let lo = 1e-9 * D;
  let hi = 0.9999 * D;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    const { A, T } = sec(mid);
    if ((Q * Q * T) / (G * A ** 3) > 1) lo = mid; else hi = mid;
  }
  const dc = (lo + hi) / 2;
  const { A, T } = sec(dc);
  return { dc, Hc: dc + A / (2 * T) };
}

/** Inlet-control headwater (ft) for flow Q (ft³/s), HDS-5 Form 1 with Ku = 1, Ks = −0.5. */
export function inletHeadwater(shape, D, B, A, S, inlet, Q) {
  const xq = (q) => q / (A * Math.sqrt(D));
  const unsub = (q) => criticalDepth(shape, D, B, q).Hc / D + inlet.K * xq(q) ** inlet.M - 0.5 * S;
  const sub = (q) => inlet.c * xq(q) ** 2 + inlet.Y - 0.5 * S;
  const xi = xq(Q);
  let r;
  if (xi <= 3.5) r = unsub(Q);
  else if (xi >= 4.0) r = sub(Q);
  else {
    const q35 = 3.5 * A * Math.sqrt(D);
    const q40 = 4.0 * A * Math.sqrt(D);
    const a = unsub(q35);
    r = a + ((xi - 3.5) / 0.5) * (sub(q40) - a);
  }
  return r * D;
}

/** Outlet-control headwater (ft), HDS-5 full-barrel method. */
export function outletHeadwater(shape, D, B, A, R, L, S, n, ke, TW, Q) {
  const V = Q / A;
  const H = (1 + ke + (29 * n * n * L) / R ** 1.33) * V * V / (2 * G);
  const dc = Math.min(criticalDepth(shape, D, B, Q).dc, D);
  const ho = Math.max(TW, (dc + D) / 2);
  return H + ho - L * S;
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.shape, ['circular', 'box'], 'shape', 'Barrel');
  assertOneOf(x.mode, ['headwater', 'capacity'], 'mode', 'Find');
  const key = x.shape === 'circular' ? x.inlet_circ : x.inlet_box;
  assertOneOf(key, Object.keys(INLETS).filter((k) => INLETS[k].shape === x.shape), x.shape === 'circular' ? 'inlet_circ' : 'inlet_box', 'Inlet');
  const inlet = INLETS[key];
  const geo = x.shape === 'circular'
    ? { D: assertRange(x.diameter_m, 0.2, 6, 'diameter_m', 'Pipe diameter') / FT }
    : { B: assertRange(x.span_m, 0.3, 12, 'span_m', 'Box span') / FT, D: assertRange(x.rise_m, 0.3, 12, 'rise_m', 'Box rise') / FT };
  const { D, A, R, B } = barrel({ shape: x.shape, ...geo });
  const L = assertRange(x.length_m, 1, 2000, 'length_m', 'Culvert length') / FT;
  const S = assertRange(x.slope, 0, 0.2, 'slope', 'Barrel slope');
  const n = assertRange(x.manning_n, 0.009, 0.03, 'manning_n', "Manning's n");
  const TW = assertNonNegative(x.tailwater_m, 'tailwater_m', 'Tailwater depth') / FT;

  const hwi = (q) => inletHeadwater(x.shape, D, B, A, S, inlet, q);
  const hwo = (q) => outletHeadwater(x.shape, D, B, A, R, L, S, n, inlet.ke, TW, q);
  const hw = (q) => Math.max(hwi(q), hwo(q));

  let Q;
  if (x.mode === 'headwater') {
    Q = assertPositive(x.flow_m3s, 'flow_m3s', 'Flow') / CFS;
  } else {
    const allow = assertPositive(x.hw_allow_m, 'hw_allow_m', 'Allowable headwater') / FT;
    if (hw(1e-6) >= allow) throw new Error(`Allowable headwater: ${allow.toFixed(2)} ft is below the headwater the culvert needs for even a trickle (tailwater ${TW.toFixed(2)} ft); raise it or lower the tailwater`);
    let lo = 1e-6;
    let hi = 1;
    while (hw(hi) < allow && hi < 1e6) hi *= 2;
    for (let k = 0; k < 100; k += 1) {
      const mid = (lo + hi) / 2;
      if (hw(mid) < allow) lo = mid; else hi = mid;
    }
    Q = (lo + hi) / 2;
  }
  const hIn = hwi(Q);
  const hOut = hwo(Q);
  const HW = Math.max(hIn, hOut);
  const control = hIn >= hOut ? 'Inlet control: the entrance limits the flow; a better inlet helps, a smoother or steeper barrel does not' : 'Outlet control: barrel friction, length and tailwater limit the flow';
  const qFull = S > 0 ? (1.486 / n) * A * R ** (2 / 3) * Math.sqrt(S) : null;
  const dc = Math.min(criticalDepth(x.shape, D, B, Q).dc, D);

  const warnings = [];
  if (HW / D > 3) warnings.push('Headwater more than three times the barrel height: far beyond usual design practice; check roadway overtopping and the embankment.');
  if (hOut > hIn && hOut < 0.75 * D) warnings.push('Outlet control with headwater below 0.75 D: the barrel runs partly full and the HDS-5 approximation h_o = (d_c + D)/2 is rough; use a water-surface profile for a precise value.');
  if (Q / A > 15) warnings.push('Barrel velocity above 15 ft/s (4.6 m/s): provide outlet protection against scour.');
  if (S === 0) warnings.push('Zero slope: no full-flow Manning capacity is given; inlet and outlet control headwaters are still valid.');
  return {
    outputs: {
      flow_out_m3s: Q * CFS,
      hw_m: HW * FT,
      control,
      hw_inlet_m: hIn * FT,
      hw_outlet_m: hOut * FT,
      hw_d: HW / D,
      discharge_index: Q / (A * Math.sqrt(D)),
      critical_depth_m: dc * FT,
      velocity_m_s: (Q / A) * FT,
      q_full_m3s: qFull === null ? null : qFull * CFS,
    },
    warnings,
  };
}
