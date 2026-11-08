/**
 * speed-power-fit/calc.js — a speed–power curve P = a·Vⁿ fitted to trial or service data by least squares in log space,
 * and the comparison with a reference curve: power increase at a given speed, speed loss at a given power, and the
 * ISO 19030 performance value of every data point.
 *
 * ln P = ln a + n ln V  (least squares);  V(P) = (P/a)^(1/n)
 * ISO 19030-2 performance value of a point: PV = (V_measured − V_expected(P_measured)) / V_expected × 100 %
 * Schema units: knots, kilowatts.
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';
import { linearFit } from '../shared/stats.js';

const DEFAULT_DATA = [
  '# speed (kn); power (kW) — corrected for weather, draft and trim as far as possible',
  '11.0; 3573', '11.8; 4446', '12.4; 5327', '13.1; 6331', '13.6; 7314', '14.2; 8387', '14.7; 9547', '15.3; 10776',
].join('\n');
const DEFAULT_REFERENCE = ['# reference speed (kn); power (kW) — sea trial, clean hull', '11; 3300', '12; 4435', '13; 5823', '14; 7491', '15; 9472'].join('\n');

export const schema = {
  id: 'speed-power-fit',
  name: 'Speed–power curve fit',
  category: 'maritime',
  summary: 'Fit P = aVⁿ to speed and power data and compare it with a reference curve: power increase, speed loss and the ISO 19030 performance value.',
  related: ['admiralty-coefficient', 'propeller-curve', 'wind-resistance', 'hull-roughness-penalty'],
  assumptions: [
    'The power law P = a·Vⁿ is fitted by ordinary least squares on ln P against ln V, which weights relative (percentage) errors equally across the speed range; R² is that of the log fit. The exponent is typically 3 to 4.5 for displacement ships in their service range and rises towards hull speed.',
    'The data must be at one draft and trim and already corrected for wind, waves, current, water temperature and depth (ISO 15016, ISO 19030-2); otherwise the fitted curve mixes hull and propeller condition with weather.',
    'Speed is speed through the water (log speed or corrected GPS speed), power the shaft power at the propeller shaft, consistently for data and reference.',
    'Performance value as in ISO 19030-2: the percentage difference between the measured speed and the speed the reference curve gives for the measured power; negative values are a speed loss. The power increase at constant speed is the alternative indicator, (P_fit − P_ref)/P_ref at the evaluation speed.',
    'Extrapolating the fit or the reference beyond the speed range of its data is flagged: the exponent changes with speed and a power law is a local description.',
  ],
  notes: [
    'Verification 2026-10-31: data generated exactly on P = 0.95 V^3.4 are fitted with a = 0.95 and n = 3.4; data 6 % above that reference at every speed give a power increase of 6.0 % and a performance value of 1.06^(−1/3.4) − 1 = −1.70 % at every point.',
  ],
  sources: [
    'ISO 19030-2:2016 Ships and marine technology — Measurement of changes in hull and propeller performance, Part 2: Default method (performance value, reference curve)',
    'ISO 15016:2025 / ITTC Recommended Procedure 7.5-04-01-01.2 Analysis of speed/power trial data — power curve fitting',
    'MAN Energy Solutions, Basic Principles of Ship Propulsion (2018) — power and speed relationship P = c·Vⁿ',
  ],
  inputs: [
    { id: 'data', label: 'Data points (one per line: speed kn; power kW)', type: 'textarea', rows: 10, default: DEFAULT_DATA },
    {
      id: 'reference',
      label: 'Reference curve',
      type: 'select',
      default: 'points',
      options: [
        { value: 'none', label: 'None (fit only)' },
        { value: 'coefficients', label: 'Coefficients a and n of P = a·Vⁿ' },
        { value: 'points', label: 'Reference points (sea trial or model test)' },
      ],
    },
    { id: 'ref_a', label: 'Reference coefficient a (kW/knⁿ)', group: 'dimensionless', unit: 'none', default: 0.95, min: 1e-9, max: 1e9, visibleWhen: { reference: 'coefficients' } },
    { id: 'ref_n', label: 'Reference exponent n', group: 'dimensionless', unit: 'none', default: 3.4, min: 1, max: 8, visibleWhen: { reference: 'coefficients' } },
    { id: 'ref_points', label: 'Reference points (speed kn; power kW)', type: 'textarea', rows: 6, default: DEFAULT_REFERENCE, visibleWhen: { reference: 'points' } },
    { id: 'eval_speed_kn', label: 'Evaluation speed', group: 'speed', unit: 'kn', default: 14, min: 0.1, max: 60 },
    { id: 'eval_power_kw', label: 'Evaluation power', group: 'power', unit: 'kW', default: 8000, min: 0.1, max: 200000 },
  ],
  outputs: [
    { id: 'fit_a', label: 'Fitted coefficient a', group: 'dimensionless', unit: 'none' },
    { id: 'fit_n', label: 'Fitted exponent n', group: 'dimensionless', unit: 'none' },
    { id: 'r2', label: 'R² of the log fit', group: 'dimensionless', unit: 'none' },
    { id: 'power_at_speed_kw', label: 'Fitted power at the evaluation speed', group: 'power', unit: 'kW' },
    { id: 'speed_at_power_kn', label: 'Fitted speed at the evaluation power', group: 'speed', unit: 'kn' },
    { id: 'ref_power_at_speed_kw', label: 'Reference power at the evaluation speed', group: 'power', unit: 'kW' },
    { id: 'power_increase_pct', label: 'Power increase at the evaluation speed', group: 'ratio', unit: 'pct' },
    { id: 'ref_speed_at_power_kn', label: 'Reference speed at the evaluation power', group: 'speed', unit: 'kn' },
    { id: 'speed_loss_pct', label: 'Speed difference at the evaluation power (− loss)', group: 'ratio', unit: 'pct' },
    { id: 'mean_pv_pct', label: 'Mean ISO 19030 performance value of the points', group: 'ratio', unit: 'pct' },
    { id: 'points_table', label: 'Data points', type: 'table' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      fit_a: '1.058',
      fit_n: '3.385',
      r2: '0.9995',
      power_at_speed_kw: '8013 kW',
      speed_at_power_kn: '14 kn',
      ref_power_at_speed_kw: '7491 kW',
      power_increase_pct: '7.0 %',
      ref_speed_at_power_kn: '14 kn',
    },
  },
};

/** Parse "speed; power" lines into [{ v, p, line }]. */
export function parsePairs(text, label) {
  const rows = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const fields = clean.split(/[;\t ]+/).filter(Boolean).map((f) => Number(f.replace(',', '.')));
    if (fields.length < 2 || !fields.slice(0, 2).every(Number.isFinite)) throw new Error(`${label} line ${index + 1}: expected "speed; power" as two numbers`);
    if (!(fields[0] > 0) || !(fields[1] > 0)) throw new Error(`${label} line ${index + 1}: speed and power must be greater than zero`);
    rows.push({ v: fields[0], p: fields[1], line: index + 1 });
  });
  return rows;
}

/** Fit P = a·Vⁿ by least squares on the logarithms: { a, n, r2 }. */
export function fitPowerLaw(points) {
  if (points.length < 2) throw new Error('At least two points are needed for a fit');
  const lv = points.map((pt) => Math.log(pt.v));
  if (Math.max(...lv) - Math.min(...lv) < 1e-9) throw new Error('All points have the same speed: the exponent cannot be fitted');
  const fit = linearFit(lv, points.map((pt) => Math.log(pt.p)));
  return { a: Math.exp(fit.intercept), n: fit.slope, r2: fit.r2 };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.reference, ['none', 'coefficients', 'points'], 'reference', 'Reference curve');
  assertPositive(i.eval_speed_kn, 'eval_speed_kn', 'Evaluation speed');
  assertPositive(i.eval_power_kw, 'eval_power_kw', 'Evaluation power');

  const data = parsePairs(i.data, 'Data');
  if (data.length < 3) throw new Error('Enter at least three data points');
  const fit = fitPowerLaw(data);
  const powerOf = (c, v) => c.a * v ** c.n;
  const speedOf = (c, p) => (p / c.a) ** (1 / c.n);

  let ref = null;
  let refRange = null;
  if (i.reference === 'coefficients') {
    assertPositive(i.ref_a, 'ref_a', 'Reference coefficient');
    assertPositive(i.ref_n, 'ref_n', 'Reference exponent');
    ref = { a: i.ref_a, n: i.ref_n };
  } else if (i.reference === 'points') {
    const refPoints = parsePairs(i.ref_points, 'Reference');
    if (refPoints.length < 2) throw new Error('Enter at least two reference points');
    ref = fitPowerLaw(refPoints);
    refRange = [Math.min(...refPoints.map((p) => p.v)), Math.max(...refPoints.map((p) => p.v))];
  }

  const rows = data.map((pt) => {
    const fitted = powerOf(fit, pt.v);
    const row = [pt.v, pt.p, fitted, ((pt.p - fitted) / fitted) * 100];
    if (ref) {
      const expected = speedOf(ref, pt.p);
      row.push(expected, ((pt.v - expected) / expected) * 100);
    }
    return row;
  });
  const meanPv = ref ? rows.reduce((s, r) => s + r[5], 0) / rows.length : null;

  const warnings = [];
  const vMin = Math.min(...data.map((p) => p.v));
  const vMax = Math.max(...data.map((p) => p.v));
  if (i.eval_speed_kn < vMin || i.eval_speed_kn > vMax) warnings.push(`Evaluation speed ${i.eval_speed_kn} kn is outside the data (${vMin}–${vMax} kn): the fitted power is an extrapolation.`);
  if (refRange && (i.eval_speed_kn < refRange[0] || i.eval_speed_kn > refRange[1])) warnings.push('Evaluation speed outside the reference points: the reference power is extrapolated.');
  if (fit.n < 2 || fit.n > 5) warnings.push(`Fitted exponent n = ${fit.n.toFixed(2)} is unusual for a displacement ship (2–5): check the data for mixed drafts, weather or units.`);
  if (fit.r2 < 0.95) warnings.push(`R² = ${fit.r2.toFixed(3)}: scattered data — filter for steady conditions and one draft before trusting the curve.`);
  if (vMax / vMin < 1.1) warnings.push('The data span less than 10 % in speed: the exponent is poorly determined.');

  const columns = ['Speed (kn)', 'Power (kW)', 'Fitted power (kW)', 'Residual (%)'];
  if (ref) columns.push('Reference speed at this power (kn)', 'Performance value (%)');

  return {
    outputs: {
      fit_a: fit.a,
      fit_n: fit.n,
      r2: fit.r2,
      power_at_speed_kw: powerOf(fit, i.eval_speed_kn),
      speed_at_power_kn: speedOf(fit, i.eval_power_kw),
      ref_power_at_speed_kw: ref ? powerOf(ref, i.eval_speed_kn) : null,
      power_increase_pct: ref ? ((powerOf(fit, i.eval_speed_kn) - powerOf(ref, i.eval_speed_kn)) / powerOf(ref, i.eval_speed_kn)) * 100 : null,
      ref_speed_at_power_kn: ref ? speedOf(ref, i.eval_power_kw) : null,
      speed_loss_pct: ref ? ((speedOf(fit, i.eval_power_kw) - speedOf(ref, i.eval_power_kw)) / speedOf(ref, i.eval_power_kw)) * 100 : null,
      mean_pv_pct: meanPv,
      points_table: { columns, rows },
    },
    warnings,
  };
}
