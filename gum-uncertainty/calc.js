/**
 * gum-uncertainty/calc.js — measurement uncertainty budget to the GUM (JCGM 100:2008): standard uncertainties from
 * Type A and Type B evaluations, sensitivity coefficients, combined standard uncertainty (uncorrelated inputs),
 * Welch–Satterthwaite effective degrees of freedom, coverage factor and expanded uncertainty, with the budget table.
 *
 * u(xᵢ) = value/divisor;  u_c = √Σ(cᵢ u(xᵢ))²;  ν_eff = u_c⁴ / Σ((cᵢ u(xᵢ))⁴/νᵢ);  k = t_p(⌊ν_eff⌋);  U = k u_c
 */
import { withDefaults, assertFinite, assertOneOf } from '../shared/validate.js';
import { coverageFactor } from '../shared/stats.js';

/** Distribution types: divisor applied to the entered value. */
export const TYPES = {
  normal: { label: 'normal (value = standard uncertainty u)', divisor: () => 1 },
  k2: { label: 'expanded, k = 2 (value = U)', divisor: () => 2 },
  rect: { label: 'rectangular (value = half-width a)', divisor: () => Math.sqrt(3) },
  tri: { label: 'triangular (value = half-width a)', divisor: () => Math.sqrt(6) },
  arcsine: { label: 'U-shaped / arcsine (value = half-width a)', divisor: () => Math.SQRT2 },
  typea: { label: 'Type A (value = s of single readings, n = readings averaged)', divisor: (n) => Math.sqrt(n) },
};

const ALIASES = { k1: 'normal', gaussian: 'normal', rectangular: 'rect', uniform: 'rect', triangular: 'tri', u: 'arcsine', ushaped: 'arcsine', 'u-shaped': 'arcsine', a: 'typea', 'type a': 'typea' };

export const schema = {
  id: 'gum-uncertainty',
  name: 'Measurement uncertainty (GUM)',
  category: 'general',
  summary: 'GUM uncertainty budget: Type A/B components, sensitivity coefficients, combined and expanded uncertainty with Welch–Satterthwaite degrees of freedom.',
  related: ['quick-stats', 'unit-converter', 'orifice-flow', 'draft-survey'],
  assumptions: [
    'GUM law of propagation of uncertainty for uncorrelated input quantities: u_c(y) = √Σ (cᵢ u(xᵢ))², a first-order Taylor expansion of the measurement model; strongly non-linear models, or a dominant non-normal input, need the Monte Carlo method of GUM Supplement 1 (JCGM 101); correlated inputs need the covariance terms of GUM 5.2, which this page does not include.',
    'Standard uncertainties from the entered value and distribution: normal (the value is u), expanded at k = 2 (u = U/2, as on calibration certificates), rectangular (u = a/√3), triangular (u = a/√6), U-shaped (u = a/√2), and Type A as the experimental standard deviation of the mean s/√n of n readings averaged (with ν = n − 1 unless a pooled value with more degrees of freedom is entered); Type B components have infinite degrees of freedom unless a finite ν is entered (GUM G.4.2).',
    'Effective degrees of freedom by the Welch–Satterthwaite formula (GUM G.4.1); a non-integer ν_eff is truncated to the next lower integer by default (GUM G.4.1 and EA-4/02 practice, conservative) or used as it is (equivalent to interpolating Table G.2, also allowed by G.4.1), and the coverage factor k = t_p(ν_eff) of the Student distribution for the chosen coverage probability (95.45 % gives k = 2 for large ν, GUM Table G.2); the result assumes the output quantity is approximately normal (central limit theorem).',
    'The reported result rounds the expanded uncertainty to two significant digits and the measured value to the same decimal place (GUM 7.2.6); all values must be in the same unit as the result (or relative values throughout).',
    'Component lines: name; type; value; sensitivity coefficient cᵢ (default 1); degrees of freedom νᵢ (number or inf, default ∞, Type A default n − 1); n (Type A only); separated by semicolons or tabs, lines starting with # ignored.',
  ],
  notes: [
    'Verification 2026-10-31 (degrees of freedom): the GUM G.4.1 example has ν_eff = 18.9988, printed as 19.0 and read as t₉₅(19) = 2.09; truncation gives ν 18 and k 2.10 — both lead to U₉₅ = 2.2 %, so the option changes the third digit of k only.',
    'Verification 2026-10-31: EA-4/02 example S2 (calibration of a 10 kg weight: reference U 45 mg at k = 2, drift ±15 mg, s_p 25 mg over 3 readings, comparator ±10 mg, buoyancy ±10 mg) gives u_c = 29.3 mg and U = 59 mg (k = 2), as published; note that EA-4/02 rev00 prints 8.95 mg for the drift row although ±15 mg rectangular is 8.66 mg — the combined value rounds to 29.3 mg either way. GUM G.4.1 example (relative 0.25 %, 0.57 %, 0.82 % with 9, 4, 14 degrees of freedom) gives u_c 1.03 %, ν_eff 19.0, t₉₅(19) 2.09, U₉₅ 2.2 %.',
    'Design decision: a text table of components rather than fixed input rows, so a budget of any length can be pasted from a spreadsheet; the budget table output shows each contribution and its share of the variance.',
  ],
  sources: [
    'JCGM 100:2008 Evaluation of measurement data — Guide to the expression of uncertainty in measurement (GUM), 4.2–4.3, 5.1, 6.2–6.3, 7.2.6, Annex G (G.4.1 example, Table G.2)',
    'EA-4/02 M Evaluation of the Uncertainty of Measurement in Calibration (European co-operation for Accreditation), example S2 "Calibration of a weight of nominal value 10 kg"',
    'JCGM 101:2008 Supplement 1 to the GUM — propagation of distributions using a Monte Carlo method (limits of the linear method)',
    'UKAS M3003 The Expression of Uncertainty and Confidence in Measurement, 4th ed., 2019 — divisors and budget practice',
  ],
  inputs: [
    { id: 'components', label: 'Uncertainty components (one per line)', type: 'textarea', rows: 9, default: '# name; type; value; c; dof; n   (EA-4/02 S2, 10 kg weight, values in mg)\nReference standard m_S; k2; 45; 1; inf\nDrift of the standard; rect; 15; 1; inf\nObserved difference (pooled s, 3 readings); typeA; 25; 1; inf; 3\nComparator eccentricity and magnetism; rect; 10; 1; inf\nAir buoyancy (±1e-6 of 10 kg); rect; 10; 1; inf', help: 'Types: normal (value = u), k2 (value = U at k = 2), rect / tri / arcsine (value = half-width), typeA (value = s, give n). Separate fields with ; or tab.' },
    { id: 'result_value', label: 'Measured result y (same unit; 0 to omit the relative value)', group: 'dimensionless', unit: 'none', default: 10000025 },
    { id: 'dof_rounding', label: 'Non-integer effective degrees of freedom', type: 'select', default: 'truncate', options: [{ value: 'truncate', label: 'Truncate to the next lower integer (GUM G.4.1 / EA-4/02, conservative)' }, { value: 'exact', label: 'Use the exact value (equivalent to interpolating Table G.2)' }] },
    { id: 'coverage', label: 'Coverage probability', type: 'select', default: '0.9545', options: [{ value: '0.9545', label: '95.45 % (k = 2 for large ν, GUM default)' }, { value: '0.95', label: '95 %' }, { value: '0.99', label: '99 %' }, { value: '0.6827', label: '68.27 % (k = 1)' }] },
  ],
  outputs: [
    { id: 'components_count', label: 'Number of components', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'combined_u', label: 'Combined standard uncertainty u_c', group: 'dimensionless', unit: 'none' },
    { id: 'nu_eff', label: 'Effective degrees of freedom ν_eff (Welch–Satterthwaite)', group: 'dimensionless', unit: 'none' },
    { id: 'k', label: 'Coverage factor k', group: 'dimensionless', unit: 'none' },
    { id: 'expanded_u', label: 'Expanded uncertainty U = k u_c', group: 'dimensionless', unit: 'none' },
    { id: 'relative_u', label: 'Relative expanded uncertainty U/|y|', group: 'ratio', unit: 'frac', display: 'ppm' },
    { id: 'statement', label: 'Result statement', type: 'text' },
    { id: 'dominant', label: 'Largest contribution', type: 'text' },
    { id: 'budget', label: 'Uncertainty budget', type: 'table' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      combined_u: '29.3',
      k: '2',
      expanded_u: '59',
    },
  },
};

/** Parse the component lines into objects with the standard uncertainty and degrees of freedom. */
export function parseComponents(text) {
  const components = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const f = clean.split(/;|\t/).map((s) => s.trim());
    const where = `Line ${index + 1}`;
    if (f.length < 3) throw new Error(`${where}: expected at least name; type; value`);
    const name = f[0] || `Component ${components.length + 1}`;
    const typeKey = f[1].toLowerCase().replace(/\s+/g, ' ');
    const type = TYPES[typeKey] ? typeKey : ALIASES[typeKey];
    if (!type) throw new Error(`${where}: unknown type "${f[1]}" (use normal, k2, rect, tri, arcsine or typeA)`);
    const value = Number(f[2]);
    if (!Number.isFinite(value) || value < 0) throw new Error(`${where}: value "${f[2]}" must be a number ≥ 0`);
    const c = f[3] === undefined || f[3] === '' ? 1 : Number(f[3]);
    if (!Number.isFinite(c)) throw new Error(`${where}: sensitivity coefficient "${f[3]}" is not a number`);
    let n = null;
    if (type === 'typea') {
      n = Number(f[5]);
      if (!Number.isInteger(n) || n < 2) throw new Error(`${where}: Type A needs the number of readings averaged n ≥ 2 in the sixth field`);
    }
    let nu;
    const dofText = (f[4] ?? '').toLowerCase();
    if (dofText === '' ) nu = type === 'typea' ? n - 1 : Infinity;
    else if (dofText === 'inf' || dofText === '∞' || dofText === 'infinity') nu = Infinity;
    else {
      nu = Number(dofText);
      if (!Number.isFinite(nu) || nu <= 0) throw new Error(`${where}: degrees of freedom "${f[4]}" must be a positive number or inf`);
    }
    const divisor = TYPES[type].divisor(n);
    const u = value / divisor;
    components.push({ name, type, value, divisor, u, c, contribution: Math.abs(c) * u, nu, n });
  });
  return components;
}

/** Round the expanded uncertainty to two significant digits and the value to the same decimal place (GUM 7.2.6). */
export function roundResult(y, U) {
  if (!(U > 0)) return { y: String(y), U: String(U) };
  const decimals = 1 - Math.floor(Math.log10(U));
  const factor = 10 ** decimals;
  const fmt = (v) => (decimals > 0 ? (Math.round(v * factor) / factor).toFixed(decimals) : String(Math.round(v * factor) / factor));
  return { y: fmt(y), U: fmt(U) };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertFinite(i.result_value, 'result_value', 'Measured result');
  assertOneOf(String(i.coverage), ['0.9545', '0.95', '0.99', '0.6827'], 'coverage', 'Coverage probability');
  assertOneOf(i.dof_rounding, ['truncate', 'exact'], 'dof_rounding', 'Degrees-of-freedom rounding');
  const p = Number(i.coverage);
  const comps = parseComponents(i.components);
  if (comps.length === 0) throw new Error('Enter at least one uncertainty component');

  const variance = comps.reduce((s, c) => s + c.contribution ** 2, 0);
  const uc = Math.sqrt(variance);
  const wsDenominator = comps.reduce((s, c) => s + (Number.isFinite(c.nu) ? c.contribution ** 4 / c.nu : 0), 0);
  const nuEff = wsDenominator > 0 ? variance ** 2 / wsDenominator : Infinity;
  const nuForK = !Number.isFinite(nuEff) ? Infinity : i.dof_rounding === 'truncate' ? Math.max(1, Math.floor(nuEff + 1e-9)) : nuEff;
  const k = coverageFactor(p, nuForK);
  const U = k * uc;
  const rounded = roundResult(i.result_value, U);
  const shares = comps.map((c) => (variance > 0 ? (c.contribution ** 2 / variance) * 100 : 0));
  const top = comps.reduce((best, c, idx) => (shares[idx] > shares[best] ? idx : best), 0);

  const warnings = [];
  if (shares[top] > 80 && comps.length > 1) warnings.push(`"${comps[top].name}" contributes ${shares[top].toFixed(0)} % of the variance: the combined distribution follows its shape — if it is rectangular, the coverage factor 2 overstates the interval (GUM G.6.5) and a Monte Carlo evaluation (JCGM 101) is advisable.`);
  if (Number.isFinite(nuEff) && nuEff < 10) warnings.push(`Only ${nuEff.toFixed(1)} effective degrees of freedom: the coverage factor rises to ${k.toFixed(2)}; more readings or a pooled standard deviation would reduce it.`);
  if (uc === 0) warnings.push('All components are zero: check the values.');
  warnings.push('Uncorrelated inputs and a linear (first-order) model are assumed; correlated inputs need covariance terms (GUM 5.2).');

  return {
    outputs: {
      components_count: comps.length,
      combined_u: uc,
      nu_eff: nuEff,
      k,
      expanded_u: U,
      relative_u: i.result_value !== 0 ? U / Math.abs(i.result_value) : null,
      statement: `y = ${rounded.y} ± ${rounded.U} (U = k u_c with k = ${k.toFixed(2)}, coverage probability ${(p * 100).toFixed(2).replace(/\.?0+$/, '')} %, ν_eff = ${Number.isFinite(nuEff) ? nuEff.toFixed(1) : '∞'})`,
      dominant: `${comps[top].name}: ${shares[top].toFixed(1)} % of u_c²`,
      budget: {
        columns: ['Component', 'Type', 'Value', 'Divisor', 'u(xᵢ)', 'cᵢ', '|cᵢ| u(xᵢ)', 'νᵢ', 'Share of u_c² %'],
        rows: comps.map((c, idx) => [c.name, c.type === 'typea' ? `Type A (n = ${c.n})` : c.type, c.value, c.divisor, c.u, c.c, c.contribution, Number.isFinite(c.nu) ? c.nu : '∞', shares[idx]]),
      },
    },
    warnings,
  };
}
