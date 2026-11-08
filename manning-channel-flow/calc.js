/**
 * manning-channel-flow/calc.js — uniform open-channel flow by Manning's equation for rectangular, trapezoidal,
 * triangular and partially full circular sections: velocity, discharge, normal depth for a given discharge, Froude
 * number, critical depth, specific energy and boundary shear stress.
 *
 * V = (1/n) R^(2/3) S^(1/2) (SI), Q = A V; Fr = V / √(g A / T); τ₀ = ρ g R S.
 * Schema units: SI — m, m/m, m/s, m³/s, Pa.
 */
import { GRAVITY_M_S2 } from '../shared/units.js';
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** Manning roughness coefficients n (Chow 1959, Table 5-6, "normal" values). */
export const ROUGHNESS = {
  pvc_smooth: { label: 'PVC, HDPE, glass (0.009)', n: 0.009 },
  steel_smooth: { label: 'Steel or cast iron, coated (0.012)', n: 0.012 },
  concrete_finished: { label: 'Concrete, trowel finished (0.013)', n: 0.013 },
  concrete_rough: { label: 'Concrete, unfinished or shotcrete (0.017)', n: 0.017 },
  corrugated_metal: { label: 'Corrugated metal pipe (0.024)', n: 0.024 },
  earth_clean: { label: 'Earth channel, clean and straight (0.022)', n: 0.022 },
  earth_weedy: { label: 'Earth channel, winding with some weeds (0.030)', n: 0.030 },
  gravel: { label: 'Gravel bed, clean (0.025)', n: 0.025 },
  riprap: { label: 'Rock riprap lining (0.035)', n: 0.035 },
  natural_clean: { label: 'Natural stream, clean, straight (0.030)', n: 0.030 },
  natural_weedy: { label: 'Natural stream, weedy, pools (0.050)', n: 0.050 },
  custom: { label: 'Custom n', n: null },
};

export const SHAPES = {
  rectangular: { label: 'Rectangular (bottom width b)' },
  trapezoidal: { label: 'Trapezoidal (bottom width b, side slope z horizontal : 1 vertical)' },
  triangular: { label: 'Triangular / V-ditch (side slope z : 1)' },
  circular: { label: 'Circular pipe or culvert, partially full (diameter D)' },
};

export const schema = {
  id: 'manning-channel-flow',
  name: 'Open-channel flow (Manning)',
  category: 'civil',
  summary: "Manning flow in rectangular, trapezoidal, triangular and circular channels: velocity, discharge or normal depth, Froude number, critical depth, shear stress.",
  related: ['pipe-flow', 'tank-volume', 'concrete-volume', 'tidal-height'],
  assumptions: [
    'Steady uniform flow: the water surface is parallel to the channel bed, so the bed slope equals the energy slope; backwater, drawdown, bends, hydraulic jumps and unsteady flow need gradually varied or unsteady flow analysis.',
    "Manning's equation is empirical and dimensional (the 1/n coefficient is in SI with R in metres); it applies to fully rough turbulent flow, which excludes very smooth linings at low velocities and very shallow laminar sheet flow.",
    'The roughness coefficient n is the dominant uncertainty (±15–25 % between the minimum and maximum of Chow\'s ranges for one description); presets are Chow\'s "normal" values for clean, maintained channels and natural channels vary with stage, vegetation and season.',
    'Prismatic channel with a constant cross-section; the circular section assumes a free surface (the full-pipe case is the limit where the hydraulic radius is D/4, and the maximum discharge of a circular pipe occurs at about 94 % depth).',
    'Froude number uses the hydraulic depth A/T; the critical depth is found by bisection on Fr = 1 for the same discharge and section, and the specific energy is referred to the channel bottom.',
    'Boundary shear stress τ₀ = ρ g R S is the mean over the wetted perimeter; local values at the bed centre are higher (about 1.5 × on the bed of a wide channel), which matters for erosion checks.',
    'Water at 1 000 kg/m³; sediment-laden or saline water changes the density slightly and the roughness considerably.',
  ],
  notes: [
    'Verification 2026-10-30: a 3 m rectangular concrete channel 1 m deep on 0.1 % gives 1.73 m/s and 5.19 m³/s, with a Froude number of 0.55 and a critical depth of 0.673 m; the half-full and full circular pipe both give R = D/4 and the maximum discharge appears near 94 % depth, as in Chow.',
    'Design decision: normal depth and critical depth are found by bisection rather than iteration formulas, so every section shape is handled identically.',
    "Design decision: Manning n presets are the 'normal' column of Chow's Table 5-6; the register notes the range so users know the ±20 % band.",
  ],
  sources: [
    'V. T. Chow, Open-Channel Hydraulics (McGraw-Hill, 1959), ch. 5 (Manning formula, Table 5-6 roughness coefficients) and ch. 6 (uniform flow computation)',
    'F. M. Henderson, Open Channel Flow (Macmillan, 1966), ch. 2 (critical flow) and ch. 4 (uniform flow)',
    'R. H. French, Open-Channel Hydraulics (McGraw-Hill, 1985), circular sections and the maximum-discharge depth',
    'USGS Water-Supply Paper 2339 (Arcement & Schneider, 1989), roughness coefficients for natural channels',
  ],
  inputs: [
    { id: 'shape', label: 'Channel section', type: 'select', default: 'rectangular', options: Object.entries(SHAPES).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'bottom_width_m', label: 'Bottom width b', group: 'length', unit: 'm', default: 3, min: 0.01, max: 500, visibleWhen: { shape: ['rectangular', 'trapezoidal'] } },
    { id: 'side_slope_z', label: 'Side slope z (horizontal per 1 vertical)', group: 'dimensionless', unit: 'none', default: 2, min: 0.01, max: 20, visibleWhen: { shape: ['trapezoidal', 'triangular'] } },
    { id: 'diameter_m', label: 'Pipe diameter D', group: 'length', unit: 'm', default: 1.0, min: 0.01, max: 20, visibleWhen: { shape: 'circular' } },
    { id: 'bed_slope', label: 'Bed slope S (m/m)', group: 'ratio', unit: 'frac', default: 0.001, min: 1e-6, max: 1, help: '0.001 = 1 m per km = 0.1 %.' },
    { id: 'roughness', label: 'Lining / roughness', type: 'select', default: 'concrete_finished', options: Object.entries(ROUGHNESS).map(([value, r]) => ({ value, label: r.label })) },
    { id: 'manning_n', label: "Manning's n", group: 'dimensionless', unit: 'none', default: 0.013, min: 0.005, max: 0.2, visibleWhen: { roughness: 'custom' } },
    {
      id: 'mode',
      label: 'Find',
      type: 'select',
      default: 'flow',
      options: [
        { value: 'flow', label: 'Discharge for a given flow depth' },
        { value: 'depth', label: 'Normal depth for a given discharge' },
      ],
    },
    { id: 'depth_m', label: 'Flow depth y', group: 'length', unit: 'm', default: 1.0, min: 0.001, max: 100, visibleWhen: { mode: 'flow' } },
    { id: 'discharge_m3_s', label: 'Discharge Q', group: 'volume_flow', unit: 'm3_s', default: 5, min: 0.0001, max: 1e5, visibleWhen: { mode: 'depth' } },
  ],
  outputs: [
    { id: 'manning_n_out', label: "Manning's n used", group: 'dimensionless', unit: 'none' },
    { id: 'depth_out_m', label: 'Flow depth y (normal depth in discharge mode)', group: 'length', unit: 'm' },
    { id: 'area_m2', label: 'Flow area A', group: 'area', unit: 'm2' },
    { id: 'wetted_perimeter_m', label: 'Wetted perimeter P', group: 'length', unit: 'm' },
    { id: 'hydraulic_radius_m', label: 'Hydraulic radius R = A / P', group: 'length', unit: 'm' },
    { id: 'top_width_m', label: 'Top width T', group: 'length', unit: 'm' },
    { id: 'velocity_m_s', label: 'Mean velocity V = (1/n) R^(2/3) S^(1/2)', group: 'speed', unit: 'm_s' },
    { id: 'discharge_out_m3_s', label: 'Discharge Q = A V', group: 'volume_flow', unit: 'm3_s' },
    { id: 'froude', label: 'Froude number V / √(g A/T)', group: 'dimensionless', unit: 'none' },
    { id: 'regime', label: 'Flow regime', type: 'text' },
    { id: 'critical_depth_m', label: 'Critical depth for this discharge', group: 'length', unit: 'm' },
    { id: 'specific_energy_m', label: 'Specific energy E = y + V²/2g', group: 'length', unit: 'm' },
    { id: 'shear_stress_pa', label: 'Mean boundary shear stress τ₀ = ρ g R S', group: 'pressure', unit: 'Pa' },
    { id: 'fill_pct', label: 'Pipe fill y / D (circular)', group: 'ratio', unit: 'pct' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      area_m2: '3.0 m²',
      wetted_perimeter_m: '5.0 m',
      hydraulic_radius_m: '0.60 m',
      velocity_m_s: '1.73 m/s',
      discharge_out_m3_s: '5.19 m³/s',
      critical_depth_m: '0.67 m',
      specific_energy_m: '1.15 m',
      shear_stress_pa: '5.9 Pa',
    },
  },
};

/** Geometry { area, perimeter, topWidth } of the section at depth y. */
export function sectionGeometry(i, y) {
  switch (i.shape) {
    case 'rectangular':
      return { area: i.bottom_width_m * y, perimeter: i.bottom_width_m + 2 * y, topWidth: i.bottom_width_m };
    case 'trapezoidal':
      return { area: (i.bottom_width_m + i.side_slope_z * y) * y, perimeter: i.bottom_width_m + 2 * y * Math.sqrt(1 + i.side_slope_z ** 2), topWidth: i.bottom_width_m + 2 * i.side_slope_z * y };
    case 'triangular':
      return { area: i.side_slope_z * y * y, perimeter: 2 * y * Math.sqrt(1 + i.side_slope_z ** 2), topWidth: 2 * i.side_slope_z * y };
    case 'circular': {
      const D = i.diameter_m;
      const depth = Math.min(y, D);
      const theta = 2 * Math.acos(1 - (2 * depth) / D);
      const area = (D * D * (theta - Math.sin(theta))) / 8;
      const perimeter = (D * theta) / 2;
      const topWidth = depth < D ? D * Math.sin(theta / 2) : 0;
      return { area, perimeter, topWidth };
    }
    default:
      throw new Error(`Unknown channel section "${i.shape}"`);
  }
}

/** Manning velocity (m/s) in SI. */
export function manningVelocity(n, hydraulicRadius, slope) {
  return (1 / n) * hydraulicRadius ** (2 / 3) * Math.sqrt(slope);
}

/** Discharge at depth y. */
export function dischargeAtDepth(i, n, y) {
  const g = sectionGeometry(i, y);
  if (g.area <= 0) return 0;
  return g.area * manningVelocity(n, g.area / g.perimeter, i.bed_slope);
}

function maxDepth(i) {
  return i.shape === 'circular' ? i.diameter_m : 1000;
}

/** Normal depth for a discharge by bisection (circular sections are limited to the depth of maximum discharge, ≈ 0.94 D). */
export function normalDepth(i, n, targetQ) {
  let hi = maxDepth(i);
  if (i.shape === 'circular') {
    hi = 0.938 * i.diameter_m;
    if (dischargeAtDepth(i, n, hi) < targetQ) throw new Error(`Discharge ${targetQ} m³/s exceeds the capacity of the pipe flowing with a free surface (${dischargeAtDepth(i, n, hi).toFixed(3)} m³/s at 94 % depth)`);
  }
  let lo = 0;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    if (dischargeAtDepth(i, n, mid) < targetQ) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Critical depth for a discharge: Q² T / (g A³) = 1, by bisection. */
export function criticalDepth(i, targetQ) {
  const f = (y) => {
    const g = sectionGeometry(i, y);
    return g.topWidth > 0 && g.area > 0 ? (targetQ * targetQ * g.topWidth) / (GRAVITY_M_S2 * g.area ** 3) - 1 : -1;
  };
  let lo = 1e-6;
  let hi = i.shape === 'circular' ? i.diameter_m * 0.999 : 1000;
  if (f(hi) > 0) return null;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.shape, Object.keys(SHAPES), 'shape', 'Channel section');
  assertOneOf(i.roughness, Object.keys(ROUGHNESS), 'roughness', 'Roughness');
  assertOneOf(i.mode, ['flow', 'depth'], 'mode', 'Find');
  assertPositive(i.bed_slope, 'bed_slope', 'Bed slope');
  if (i.shape === 'rectangular' || i.shape === 'trapezoidal') assertPositive(i.bottom_width_m, 'bottom_width_m', 'Bottom width');
  if (i.shape === 'trapezoidal' || i.shape === 'triangular') assertPositive(i.side_slope_z, 'side_slope_z', 'Side slope');
  if (i.shape === 'circular') assertPositive(i.diameter_m, 'diameter_m', 'Diameter');
  const n = i.roughness === 'custom' ? assertRange(i.manning_n, 0.005, 0.5, 'manning_n', "Manning's n") : ROUGHNESS[i.roughness].n;

  let y;
  if (i.mode === 'flow') {
    y = assertPositive(i.depth_m, 'depth_m', 'Flow depth');
    if (i.shape === 'circular' && y > i.diameter_m) throw new Error(`Flow depth ${y} m exceeds the pipe diameter ${i.diameter_m} m`);
  } else {
    y = normalDepth(i, n, assertPositive(i.discharge_m3_s, 'discharge_m3_s', 'Discharge'));
  }

  const geometry = sectionGeometry(i, y);
  const R = geometry.area / geometry.perimeter;
  const V = manningVelocity(n, R, i.bed_slope);
  const Q = geometry.area * V;
  const hydraulicDepth = geometry.topWidth > 0 ? geometry.area / geometry.topWidth : null;
  const froude = hydraulicDepth ? V / Math.sqrt(GRAVITY_M_S2 * hydraulicDepth) : null;
  const yc = criticalDepth(i, Q);

  let regime;
  if (froude === null) regime = 'Closed conduit (pipe full): no free surface';
  else if (Math.abs(froude - 1) < 0.05) regime = 'Near critical (Fr ≈ 1): unstable water surface, avoid for design';
  else regime = froude < 1 ? 'Subcritical (tranquil): downstream control' : 'Supercritical (rapid): upstream control, hydraulic jump possible downstream';

  const warnings = [];
  if (froude !== null && Math.abs(froude - 1) < 0.15) warnings.push('Froude number within ±15 % of unity: standing waves and an unstable surface; change the slope or section.');
  if (V > 3) warnings.push('Velocity above 3 m/s: erosive for earth and most lined channels; check the lining permissible velocity or shear stress.');
  if (V < 0.6) warnings.push('Velocity below 0.6 m/s: sediment deposition likely in channels carrying silt.');
  if (i.shape === 'circular' && y / i.diameter_m > 0.8) warnings.push('Pipe more than 80 % full: air entrainment and surging; free-surface capacity peaks near 94 % and falls to the full-pipe value at 100 %.');
  if (i.roughness !== 'custom') warnings.push(`Manning's n = ${n} is the normal value for this description; Chow's range for the same description spans roughly ±20 %.`);
  warnings.push('Uniform flow: the bed slope is taken as the energy slope; backwater or a downstream control changes the depth.');

  return {
    outputs: {
      manning_n_out: n,
      depth_out_m: y,
      area_m2: geometry.area,
      wetted_perimeter_m: geometry.perimeter,
      hydraulic_radius_m: R,
      top_width_m: geometry.topWidth,
      velocity_m_s: V,
      discharge_out_m3_s: Q,
      froude,
      regime,
      critical_depth_m: yc,
      specific_energy_m: y + (V * V) / (2 * GRAVITY_M_S2),
      shear_stress_pa: 1000 * GRAVITY_M_S2 * R * i.bed_slope,
      fill_pct: i.shape === 'circular' ? (y / i.diameter_m) * 100 : null,
    },
    warnings,
  };
}
