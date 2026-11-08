/**
 * gz-criteria/calc.js — intact stability criteria of the 2008 IS Code (MSC.267(85)) Part A from a pasted GZ curve:
 * the general criteria of 2.2 (areas, GZ at 30°, angle of maximum GZ, GM0), the severe wind and rolling (weather)
 * criterion of 2.3 (wind heeling levers, roll-back angle, areas a and b), and optionally the grain heeling criteria of
 * the International Grain Code A 7.
 *
 * Areas ∫GZ dθ (θ in radians) on a monotone cubic (PCHIP) interpolation of the curve, GZ(−θ) = −GZ(θ).
 * Weather: lw1 = P A Z/(1000 g Δ), lw2 = 1.5 lw1; θ1 = 109 k X1 X2 √(r s); r = 0.73 + 0.6 OG/d;
 *          T = 2 C B/√GM, C = 0.373 + 0.023 B/d − 0.043 Lwl/100; area b (to θ2) ≥ area a (from θ0 − θ1).
 * Grain:   λ0 = M_v/(SF Δ), λ40 = 0.8 λ0; heel ≤ 12° (or deck-edge immersion); residual area ≥ 0.075 m·rad; GM0 ≥ 0.30 m.
 * Schema units: degrees, metres, tonnes, m², Pa, seconds, m³/t.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const DEG = Math.PI / 180;
/** IS Code 2.3.2 gravitational acceleration (m/s²). */
const G_IS_CODE = 9.81;
/** Tables 2.3.4-1 to 2.3.4-4 of the 2008 IS Code (linear interpolation, end values held). */
const TABLE_X1 = [[2.4, 1.0], [2.5, 0.98], [2.6, 0.96], [2.7, 0.95], [2.8, 0.93], [2.9, 0.91], [3.0, 0.90], [3.1, 0.88], [3.2, 0.86], [3.4, 0.82], [3.5, 0.80]];
const TABLE_X2 = [[0.45, 0.75], [0.5, 0.82], [0.55, 0.89], [0.6, 0.95], [0.65, 0.97], [0.7, 1.0]];
const TABLE_K = [[0, 1.0], [1.0, 0.98], [1.5, 0.95], [2.0, 0.88], [2.5, 0.79], [3.0, 0.74], [3.5, 0.72], [4.0, 0.70]];
const TABLE_S = [[6, 0.1], [7, 0.098], [8, 0.093], [12, 0.065], [14, 0.053], [16, 0.044], [18, 0.038], [20, 0.035]];
/** Area step of the numerical integration (degrees). */
const STEP_DEG = 0.05;

const DEFAULT_CURVE = [
  '# heel (°); GZ (m) — 0° first, at least to 40° or the flooding angle',
  '0; 0', '5; 0.085', '10; 0.175', '15; 0.275', '20; 0.39', '25; 0.51', '30; 0.61', '35; 0.67', '40; 0.69', '45; 0.66', '50; 0.58', '60; 0.36', '70; 0.10',
].join('\n');

export const schema = {
  id: 'gz-criteria',
  name: 'GZ curve and intact stability criteria',
  category: 'maritime',
  summary: 'IS Code 2008 general criteria and the severe wind and rolling (weather) criterion from a pasted GZ curve, with the grain heeling check.',
  related: ['initial-stability', 'roll-period', 'hydrostatics', 'loading-condition'],
  assumptions: [
    'The GZ curve is the righting lever of the loading condition with the free-surface correction already applied, at the trim the ship takes when heeled; it is interpolated with a monotone cubic (PCHIP) through the pasted points and is odd-symmetric (GZ(−θ) = −GZ(θ)) for the roll to windward; areas are in metre-radians.',
    'General criteria (IS Code 2.2): area 0–30° ≥ 0.055 m·rad, area 0–40° (or 0–θf) ≥ 0.090 m·rad, area 30–40° (or 30–θf) ≥ 0.030 m·rad, GZ ≥ 0.20 m at an angle of 30° or more, maximum GZ at 25° or more, GM0 ≥ 0.15 m.',
    'Weather criterion (IS Code 2.3): steady wind lever lw1 = P A Z/(1000 g Δ) with P = 504 Pa and g = 9.81 m/s², gust lever lw2 = 1.5 lw1, constant with heel; θ0 at lw1 must not exceed 16° or 80 % of the deck-edge immersion angle; the roll to windward θ1 = 109 k X1 X2 √(r s) uses Tables 2.3.4-1 to -4 (linear interpolation) and, unless a roll period is entered, T = 2 C B/√GM; area b from the first lw2 intercept to θ2 = min(θf, 50°, second intercept) must be at least area a from θ0 − θ1 to the first intercept.',
    'Grain (International Grain Code A 7): heeling arm λ0 = assumed volumetric heeling moment / (stowage factor × Δ) at 0°, 0.8 λ0 at 40°, linear; heel due to the grain shift ≤ 12° (or the deck-edge immersion angle if less, ships built from 1994); residual area between the GZ and heeling arm curves up to the least of 40°, θf and the angle of maximum difference ≥ 0.075 m·rad; GM0 ≥ 0.30 m.',
    'Special ship types (passenger ships, timber deck cargo, containerships over 100 m, fishing vessels, offshore vessels) have additional or alternative criteria in Part A chapter 3 and Part B that are not checked here; the calculator does not replace the approved stability booklet or loading computer.',
  ],
  notes: [
    'Verification 2026-10-31: all four weather tables and the general criteria were transcribed from the MSC.267(85) text; for a wall-sided curve GZ = sin θ (GM + ½BM tan²θ) the areas agree with the closed form GM(1 − cos θ) + ½BM(sec θ + cos θ − 2) to 0.1 %; areas a and b and the grain residual area of a linear test curve agree with their closed forms.',
    'Design decision: PCHIP interpolation never overshoots between the pasted points, so a coarse curve is not given lever it does not have; the curve must reach every angle a criterion uses, otherwise the page says which angle is missing.',
  ],
  sources: [
    'IMO Resolution MSC.267(85) International Code on Intact Stability, 2008 (2008 IS Code), Part A 2.2 and 2.3, Tables 2.3.4-1 to 2.3.4-4',
    'IMO Resolution MSC.23(59) International Code for the Safe Carriage of Grain in Bulk (International Grain Code), A 7 Stability requirements',
    'MSC.1/Circ.1281 Explanatory notes to the 2008 IS Code; MSC.1/Circ.1537 Unified interpretations of the 2008 IS Code',
    'F. N. Fritsch, R. E. Carlson, "Monotone piecewise cubic interpolation", SIAM J. Numer. Anal. 17 (1980) 238–246',
  ],
  inputs: [
    { id: 'gz_curve', label: 'GZ curve (one point per line: heel °; GZ m)', type: 'textarea', rows: 10, default: DEFAULT_CURVE },
    { id: 'gm0_m', label: 'Initial metacentric height GM0 (corrected for free surface)', group: 'length', unit: 'm', default: 1.0, min: -5, max: 20 },
    { id: 'flooding_angle_deg', label: 'Down-flooding angle θf', group: 'angle', unit: 'deg', default: 55, min: 10, max: 90 },
    { id: 'deck_edge_angle_deg', label: 'Deck-edge immersion angle', group: 'angle', unit: 'deg', default: 24, min: 1, max: 90 },
    { id: 'displacement_t', label: 'Displacement Δ', group: 'mass', unit: 't', default: 20000, min: 1, max: 600000 },
    {
      id: 'check_weather',
      label: 'Weather criterion (IS Code 2.3)',
      type: 'select',
      default: 'yes',
      options: [
        { value: 'yes', label: 'Check' },
        { value: 'no', label: 'Do not check' },
      ],
    },
    { id: 'lateral_area_m2', label: 'Windage area A above the waterline (incl. deck cargo)', group: 'area', unit: 'm2', default: 1800, min: 1, max: 100000, visibleWhen: { check_weather: 'yes' } },
    { id: 'lever_z_m', label: 'Lever Z: centre of A to half the mean draft', group: 'length', unit: 'm', default: 14, min: 0.1, max: 100, visibleWhen: { check_weather: 'yes' } },
    { id: 'lwl_m', label: 'Waterline length Lwl', group: 'length', unit: 'm', default: 160, min: 5, max: 450, visibleWhen: { check_weather: 'yes' } },
    { id: 'beam_m', label: 'Moulded breadth B', group: 'length', unit: 'm', default: 26, min: 1, max: 80, visibleWhen: { check_weather: 'yes' } },
    { id: 'draft_m', label: 'Mean moulded draft d', group: 'length', unit: 'm', default: 9, min: 0.1, max: 30, visibleWhen: { check_weather: 'yes' } },
    { id: 'kg_m', label: 'Centre of gravity above the keel KG (fluid)', group: 'length', unit: 'm', default: 10.2, min: 0, max: 60, visibleWhen: { check_weather: 'yes' } },
    { id: 'cb', label: 'Block coefficient C_B', group: 'dimensionless', unit: 'none', default: 0.75, min: 0.3, max: 1, visibleWhen: { check_weather: 'yes' } },
    {
      id: 'bilge',
      label: 'Bilge form',
      type: 'select',
      default: 'bilge_keels',
      options: [
        { value: 'round', label: 'Round bilge, no bilge or bar keels (k = 1.0)' },
        { value: 'sharp', label: 'Sharp bilges (k = 0.7)' },
        { value: 'bilge_keels', label: 'Bilge keels and/or bar keel (k from Table 2.3.4-3)' },
      ],
      visibleWhen: { check_weather: 'yes' },
    },
    { id: 'bilge_keel_area_m2', label: 'Total area of bilge keels and bar keel Ak', group: 'area', unit: 'm2', default: 60, min: 0, max: 2000, visibleWhen: { check_weather: 'yes', bilge: 'bilge_keels' } },
    { id: 'roll_period_s', label: 'Natural roll period T (0 = IS Code formula)', group: 'time', unit: 's', default: 0, min: 0, max: 60, visibleWhen: { check_weather: 'yes' } },
    { id: 'wind_pressure_pa', label: 'Wind pressure P', group: 'pressure', unit: 'Pa', default: 504, min: 100, max: 1000, visibleWhen: { check_weather: 'yes' } },
    {
      id: 'check_grain',
      label: 'Grain heeling criteria (Grain Code A 7)',
      type: 'select',
      default: 'no',
      options: [
        { value: 'no', label: 'Do not check' },
        { value: 'yes', label: 'Check' },
      ],
    },
    { id: 'grain_moment_m4', label: 'Total assumed volumetric heeling moment of the grain', group: 'dimensionless', unit: 'none', default: 5000, min: 0, max: 1e7, visibleWhen: { check_grain: 'yes' }, help: 'm⁴, from the grain loading manual for the filled and partly filled holds.' },
    { id: 'stowage_factor_m3_t', label: 'Stowage factor of the grain (m³/t)', group: 'dimensionless', unit: 'none', default: 1.25, min: 0.5, max: 3, visibleWhen: { check_grain: 'yes' } },
  ],
  outputs: [
    { id: 'criteria_table', label: 'Criteria', type: 'table' },
    { id: 'overall', label: 'Result', type: 'text' },
    { id: 'area_0_30', label: 'Area 0–30° (m·rad)', group: 'dimensionless', unit: 'none' },
    { id: 'area_0_40', label: 'Area 0–40° or θf (m·rad)', group: 'dimensionless', unit: 'none' },
    { id: 'area_30_40', label: 'Area 30–40° or θf (m·rad)', group: 'dimensionless', unit: 'none' },
    { id: 'max_gz_m', label: 'Maximum GZ', group: 'length', unit: 'm' },
    { id: 'angle_max_gz_deg', label: 'Angle of maximum GZ', group: 'angle', unit: 'deg' },
    { id: 'vanishing_angle_deg', label: 'Angle of vanishing stability (within the curve)', group: 'angle', unit: 'deg' },
    { id: 'lw1_m', label: 'Steady wind heeling lever lw1', group: 'length', unit: 'm', visibleWhen: { check_weather: 'yes' } },
    { id: 'theta0_deg', label: 'Heel under steady wind θ0', group: 'angle', unit: 'deg', visibleWhen: { check_weather: 'yes' } },
    { id: 'roll_period_out_s', label: 'Roll period T used', group: 'time', unit: 's', visibleWhen: { check_weather: 'yes' } },
    { id: 'theta1_deg', label: 'Roll to windward θ1', group: 'angle', unit: 'deg', visibleWhen: { check_weather: 'yes' } },
    { id: 'theta2_deg', label: 'Limiting angle θ2', group: 'angle', unit: 'deg', visibleWhen: { check_weather: 'yes' } },
    { id: 'area_a', label: 'Area a (m·rad)', group: 'dimensionless', unit: 'none', visibleWhen: { check_weather: 'yes' } },
    { id: 'area_b', label: 'Area b (m·rad)', group: 'dimensionless', unit: 'none', visibleWhen: { check_weather: 'yes' } },
    { id: 'grain_heel_deg', label: 'Heel due to the grain shift', group: 'angle', unit: 'deg', visibleWhen: { check_grain: 'yes' } },
    { id: 'grain_residual_area', label: 'Residual area (m·rad)', group: 'dimensionless', unit: 'none', visibleWhen: { check_grain: 'yes' } },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      area_0_30: '0.152',
      area_0_40: '0.268',
      area_30_40: '0.116',
      max_gz_m: '0.69 m',
      lw1_m: '0.065 m',
      roll_period_out_s: '19.3 s',
      area_b: '0.301',
    },
  },
};

/** Parse "heel; GZ" lines into sorted points; the first angle must be 0. */
export function parseCurve(text) {
  const points = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const fields = clean.split(/[;,\t ]+/).filter(Boolean);
    const angle = Number(fields[0]);
    const gz = Number(fields[1]);
    if (fields.length < 2 || !Number.isFinite(angle) || !Number.isFinite(gz)) throw new Error(`GZ curve line ${index + 1}: expected "heel; GZ" as two numbers`);
    points.push([angle, gz]);
  });
  if (points.length < 4) throw new Error('The GZ curve needs at least 4 points');
  for (let k = 1; k < points.length; k += 1) {
    if (!(points[k][0] > points[k - 1][0])) throw new Error(`GZ curve: heel angles must increase (line with ${points[k][0]}°)`);
  }
  if (points[0][0] !== 0) throw new Error('GZ curve: the first point must be at 0°');
  if (Math.abs(points[0][1]) > 1e-6) throw new Error('GZ curve: GZ must be 0 at 0° heel (correct an initial list first)');
  return points;
}

/** Monotone cubic (Fritsch–Carlson) interpolant through (x, y); evaluation outside the data throws. */
export function pchip(xs, ys) {
  const n = xs.length;
  const h = xs.slice(1).map((x, k) => x - xs[k]);
  const d = h.map((hk, k) => (ys[k + 1] - ys[k]) / hk);
  const m = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let k = 1; k < n - 1; k += 1) {
    if (d[k - 1] * d[k] <= 0) m[k] = 0;
    else {
      const w1 = 2 * h[k] + h[k - 1];
      const w2 = h[k] + 2 * h[k - 1];
      m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k]);
    }
  }
  return (x) => {
    if (x < xs[0] - 1e-9 || x > xs[n - 1] + 1e-9) throw new Error(`The GZ curve ends at ${xs[n - 1]}°; a criterion needs ${x.toFixed(1)}°`);
    let k = 0;
    while (k < n - 2 && x > xs[k + 1]) k += 1;
    const t = (x - xs[k]) / h[k];
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[k] + (t3 - 2 * t2 + t) * h[k] * m[k] + (-2 * t3 + 3 * t2) * ys[k + 1] + (t3 - t2) * h[k] * m[k + 1];
  };
}

/** Linear interpolation in a table of [x, y] rows, holding the end values. */
export function tableValue(table, x) {
  if (x <= table[0][0]) return table[0][1];
  if (x >= table[table.length - 1][0]) return table[table.length - 1][1];
  let k = 0;
  while (x > table[k + 1][0]) k += 1;
  const [x0, y0] = table[k];
  const [x1, y1] = table[k + 1];
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/** ∫ f(θ) dθ from a to b (degrees in, metre-radians out) by Simpson's rule. */
function integrate(f, aDeg, bDeg) {
  if (bDeg <= aDeg) return 0;
  const n = 2 * Math.max(10, Math.ceil((bDeg - aDeg) / STEP_DEG / 2));
  const h = (bDeg - aDeg) / n;
  let sum = f(aDeg) + f(bDeg);
  for (let k = 1; k < n; k += 1) sum += (k % 2 ? 4 : 2) * f(aDeg + k * h);
  return ((sum * h) / 3) * DEG;
}

/** Angle in [a, b] where f is largest: scan on a grid that includes both ends, then golden-section refinement. */
export function maximize(f, a, b, step = 0.1) {
  if (b <= a) return { x: a, y: f(a) };
  const n = Math.max(1, Math.ceil((b - a) / step));
  let best = { x: a, y: f(a) };
  for (let k = 1; k <= n; k += 1) {
    const x = k === n ? b : a + k * step;
    const y = f(x);
    if (y > best.y) best = { x, y };
  }
  let lo = Math.max(a, best.x - step);
  let hi = Math.min(b, best.x + step);
  const ratio = (Math.sqrt(5) - 1) / 2;
  for (let k = 0; k < 60; k += 1) {
    const x1 = hi - ratio * (hi - lo);
    const x2 = lo + ratio * (hi - lo);
    if (f(x1) >= f(x2)) hi = x2;
    else lo = x1;
  }
  const x = (lo + hi) / 2;
  const y = f(x);
  return y >= best.y ? { x, y } : best;
}

/** First angle in [from, to] where g(θ) changes sign from negative to non-negative, by scanning and bisection; null if none. */
function firstCrossing(g, from, to, step = 0.25) {
  if (from > to) return null;
  let a = from;
  if (g(a) >= 0) return a;
  for (let b = from + step; ; b += step) {
    const bb = Math.min(b, to);
    if (g(bb) >= 0) {
      let lo = a;
      let hi = bb;
      for (let k = 0; k < 60; k += 1) {
        const mid = (lo + hi) / 2;
        if (g(mid) >= 0) hi = mid;
        else lo = mid;
      }
      return (lo + hi) / 2;
    }
    if (bb >= to) return null;
    a = bb;
  }
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertRange(i.gm0_m, -5, 20, 'gm0_m', 'GM0');
  assertRange(i.flooding_angle_deg, 10, 90, 'flooding_angle_deg', 'Down-flooding angle');
  assertRange(i.deck_edge_angle_deg, 1, 90, 'deck_edge_angle_deg', 'Deck-edge immersion angle');
  assertPositive(i.displacement_t, 'displacement_t', 'Displacement');
  assertOneOf(i.check_weather, ['yes', 'no'], 'check_weather', 'Weather criterion');
  assertOneOf(i.check_grain, ['yes', 'no'], 'check_grain', 'Grain criteria');

  const points = parseCurve(i.gz_curve);
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const lastAngle = xs[xs.length - 1];
  const curve = pchip(xs, ys);
  const gz = (deg) => (deg < 0 ? -curve(-deg) : curve(deg));

  const warnings = [];
  const rows = [];
  const add = (criterion, required, attained, pass) => rows.push([criterion, required, attained, pass ? 'Pass' : 'FAIL']);

  const limit40 = Math.min(40, i.flooding_angle_deg);
  if (lastAngle < limit40) throw new Error(`The GZ curve must reach ${limit40}° (40° or θf); it ends at ${lastAngle}°`);
  const area030 = integrate(gz, 0, 30);
  const area040 = integrate(gz, 0, limit40);
  const area3040 = limit40 > 30 ? integrate(gz, 30, limit40) : 0;
  const peak = maximize(curve, 0, lastAngle);
  const maxGz = peak.y;
  const maxAngle = peak.x;
  const gzAbove30 = maximize(curve, 30, lastAngle).y;
  const vanishing = firstCrossing((a) => -curve(a), Math.max(maxAngle, 0.1), lastAngle);

  add('Area 0–30° (m·rad)', '≥ 0.055', area030, area030 >= 0.055);
  add(`Area 0–${limit40 === 40 ? '40°' : `θf (${limit40}°)`} (m·rad)`, '≥ 0.090', area040, area040 >= 0.09);
  add(`Area 30–${limit40 === 40 ? '40°' : 'θf'} (m·rad)`, '≥ 0.030', area3040, limit40 > 30 && area3040 >= 0.03);
  add('GZ at 30° or more (m)', '≥ 0.20', gzAbove30, gzAbove30 >= 0.2);
  add('Angle of maximum GZ (°)', '≥ 25', maxAngle, maxAngle >= 25);
  add('GM0 (m)', '≥ 0.15', i.gm0_m, i.gm0_m >= 0.15);
  if (limit40 <= 30) warnings.push('Down-flooding angle at or below 30°: the 30–θf area cannot be met.');

  const chord = ys[1] / (xs[1] * DEG);
  if (i.gm0_m > 0 && Math.abs(chord - i.gm0_m) > 0.25 * i.gm0_m) warnings.push(`The first segment of the curve has a slope of ${chord.toFixed(2)} m/rad, far from GM0 = ${i.gm0_m} m: check GM0 or add points at small angles.`);

  const out = { lw1_m: null, theta0_deg: null, roll_period_out_s: null, theta1_deg: null, theta2_deg: null, area_a: null, area_b: null, grain_heel_deg: null, grain_residual_area: null };
  if (i.check_weather === 'yes') {
    assertPositive(i.lateral_area_m2, 'lateral_area_m2', 'Windage area');
    assertPositive(i.lever_z_m, 'lever_z_m', 'Lever Z');
    assertPositive(i.lwl_m, 'lwl_m', 'Waterline length');
    assertPositive(i.beam_m, 'beam_m', 'Breadth');
    assertPositive(i.draft_m, 'draft_m', 'Draft');
    assertNonNegative(i.kg_m, 'kg_m', 'KG');
    assertRange(i.cb, 0.3, 1, 'cb', 'Block coefficient');
    assertOneOf(i.bilge, ['round', 'sharp', 'bilge_keels'], 'bilge', 'Bilge form');
    assertNonNegative(i.roll_period_s, 'roll_period_s', 'Roll period');
    assertPositive(i.wind_pressure_pa, 'wind_pressure_pa', 'Wind pressure');

    const lw1 = (i.wind_pressure_pa * i.lateral_area_m2 * i.lever_z_m) / (1000 * G_IS_CODE * i.displacement_t);
    const lw2 = 1.5 * lw1;
    const theta0 = firstCrossing((a) => curve(a) - lw1, 0, lastAngle);
    if (theta0 === null) throw new Error(`The GZ curve never reaches the steady wind lever lw1 = ${lw1.toFixed(3)} m: the ship would capsize under the steady wind`);
    const theta0Limit = Math.min(16, 0.8 * i.deck_edge_angle_deg);

    let period = i.roll_period_s;
    if (!(period > 0)) {
      if (!(i.gm0_m > 0)) throw new Error('A positive GM0 is needed for the roll period formula (or enter the roll period)');
      const c = 0.373 + 0.023 * (i.beam_m / i.draft_m) - 0.043 * (i.lwl_m / 100);
      period = (2 * c * i.beam_m) / Math.sqrt(i.gm0_m);
    }
    const x1 = tableValue(TABLE_X1, i.beam_m / i.draft_m);
    const x2 = tableValue(TABLE_X2, i.cb);
    let k = 1.0;
    if (i.bilge === 'sharp') k = 0.7;
    if (i.bilge === 'bilge_keels') {
      assertNonNegative(i.bilge_keel_area_m2, 'bilge_keel_area_m2', 'Bilge keel area');
      k = tableValue(TABLE_K, (i.bilge_keel_area_m2 * 100) / (i.lwl_m * i.beam_m));
    }
    const r = 0.73 + (0.6 * (i.kg_m - i.draft_m)) / i.draft_m;
    const s = tableValue(TABLE_S, period);
    if (r * s < 0) throw new Error('r × s is negative (G far below the waterline): the roll-back formula does not apply');
    const theta1 = 109 * k * x1 * x2 * Math.sqrt(r * s);

    const intercept = firstCrossing((a) => curve(a) - lw2, 0, lastAngle);
    if (intercept === null) throw new Error(`The GZ curve never reaches the gust lever lw2 = ${lw2.toFixed(3)} m: the weather criterion fails`);
    const secondIntercept = firstCrossing((a) => lw2 - curve(a), Math.max(intercept + 0.5, maxAngle), lastAngle);
    const theta2 = Math.min(i.flooding_angle_deg, 50, secondIntercept ?? Infinity, lastAngle);
    if (lastAngle < Math.min(i.flooding_angle_deg, 50) && secondIntercept === null) warnings.push(`The curve ends at ${lastAngle}° before θf and 50°: area b is counted only up to ${lastAngle}°.`);
    const start = theta0 - theta1;
    if (-start > lastAngle) throw new Error(`The roll to windward reaches ${(-start).toFixed(1)}°, beyond the end of the GZ curve`);
    const areaA = integrate((a) => lw2 - gz(a), start, intercept);
    const areaB = integrate((a) => gz(a) - lw2, intercept, theta2);

    add('Weather: heel under steady wind θ0 (°)', `≤ ${theta0Limit.toFixed(1)}`, theta0, theta0 <= theta0Limit);
    add('Weather: area b ≥ area a (m·rad)', `≥ ${areaA.toFixed(4)}`, areaB, areaB >= areaA);
    Object.assign(out, { lw1_m: lw1, theta0_deg: theta0, roll_period_out_s: period, theta1_deg: theta1, theta2_deg: theta2, area_a: areaA, area_b: areaB });
    if (period > 20) warnings.push('Roll period above 20 s: the s table is held at its last value (0.035).');
  }

  if (i.check_grain === 'yes') {
    assertNonNegative(i.grain_moment_m4, 'grain_moment_m4', 'Volumetric heeling moment');
    assertPositive(i.stowage_factor_m3_t, 'stowage_factor_m3_t', 'Stowage factor');
    const lambda0 = i.grain_moment_m4 / (i.stowage_factor_m3_t * i.displacement_t);
    const lambda = (a) => lambda0 * (1 - (0.2 * a) / 40);
    const heel = firstCrossing((a) => curve(a) - lambda(a), 0, lastAngle);
    if (heel === null) throw new Error('The GZ curve never exceeds the grain heeling arm: the grain criteria fail');
    const heelLimit = Math.min(12, i.deck_edge_angle_deg);
    const upper = Math.min(40, i.flooding_angle_deg, lastAngle);
    const bestAngle = maximize((a) => curve(a) - lambda(a), heel, upper).x;
    const residual = integrate((a) => curve(a) - lambda(a), heel, bestAngle);
    add('Grain: heel due to the grain shift (°)', `≤ ${heelLimit}`, heel, heel <= heelLimit);
    add('Grain: residual area (m·rad)', '≥ 0.075', residual, residual >= 0.075);
    add('Grain: GM0 (m)', '≥ 0.30', i.gm0_m, i.gm0_m >= 0.3);
    out.grain_heel_deg = heel;
    out.grain_residual_area = residual;
  }

  const failed = rows.filter((row) => row[3] === 'FAIL').map((row) => row[0]);
  warnings.push('Check against the approved stability booklet: special ship types have additional criteria, and the curve must already include free-surface effects.');

  return {
    outputs: {
      criteria_table: { columns: ['Criterion', 'Required', 'Attained', 'Result'], rows },
      overall: failed.length ? `Does NOT comply: ${failed.join('; ')}.` : `Complies with all ${rows.length} criteria checked.`,
      area_0_30: area030,
      area_0_40: area040,
      area_30_40: area3040,
      max_gz_m: maxGz,
      angle_max_gz_deg: maxAngle,
      vanishing_angle_deg: vanishing,
      ...out,
    },
    warnings,
  };
}
