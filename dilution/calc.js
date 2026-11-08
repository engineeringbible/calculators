/**
 * dilution/calc.js — dilution by C1V1 = C2V2: solve for the stock concentration, stock volume, final concentration or
 * final volume, with the dilution factor, the diluent to add and the stock : diluent ratio; plus a serial dilution of
 * n equal steps (total factor, concentration after each step, volumes per tube).
 *
 * C1 V1 = C2 V2;  DF = C1 / C2 = V2 / V1;  diluent = V2 − V1;  serial: DF_total = f^n, C_k = C1 / f^k,
 * per tube: transfer v_t into (f − 1) v_t of diluent.
 * Schema units: SI — m³; concentrations in any one unit (the same for C1 and C2).
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertInteger } from '../shared/validate.js';

const fmt = (v) => (v >= 1e4 || v < 1e-3 ? v.toExponential(3).replace('e', ' × 10^').replace('^+', '^') : String(+v.toPrecision(4)));

export const schema = {
  id: 'dilution',
  name: 'Dilution calculator (C1V1 = C2V2 and serial dilution)',
  category: 'process',
  summary: 'Solve C1V1 = C2V2 for any one term, with the dilution factor, diluent volume and ratio, plus serial dilution steps and their concentrations.',
  related: ['molarity', 'ppm-concentration', 'mass-balance', 'chemical-dosing'],
  assumptions: [
    'The amount of solute is conserved: what is taken from the stock ends up in the final solution, so C1 V1 = C2 V2 in any consistent concentration unit (mol/L, mg/L, % w/v, cells/mL).',
    'V2 is the final volume after making up, not the volume of diluent added; the diluent is V2 − V1 when volumes are additive, which holds closely for dilute aqueous solutions but not for concentrated acids or alcohol and water.',
    'Mass-based concentrations (% w/w, mg/kg) dilute exactly by mass, not by volume; use masses in place of volumes for them, or convert with the densities.',
    'Serial dilution uses equal steps: each tube receives the transfer volume from the previous one and (f − 1) times that volume of diluent, mixed before the next transfer.',
  ],
  notes: [
    'Verification 2026-11-08: 500 mL of 1 M HCl from a 12 M stock needs 1 × 500 / 12 = 41.67 mL of stock and 458.3 mL of water, a dilution factor of 12 (1 : 11 stock to diluent). Checked by hand.',
    'Serial check: six 1 : 10 steps give a total factor of 10⁶; with 1 mL transfers each tube holds 1 mL of the previous one and 9 mL of diluent.',
  ],
  sources: [
    'Harris, D.C., Quantitative Chemical Analysis, 9th ed., W.H. Freeman, ch. 1 (dilution formula M_conc V_conc = M_dil V_dil)',
    'Skoog, D.A., West, D.M., Holler, F.J. and Crouch, S.R., Fundamentals of Analytical Chemistry, 9th ed., ch. 4 (preparing solutions by dilution)',
  ],
  inputs: [
    { id: 'solve', label: 'Solve for', type: 'select', default: 'v1', options: [{ value: 'v1', label: 'Stock volume V1' }, { value: 'c2', label: 'Final concentration C2' }, { value: 'v2', label: 'Final volume V2' }, { value: 'c1', label: 'Stock concentration C1' }] },
    { id: 'c1', label: 'Stock concentration C1 (any unit, the same as C2)', group: 'dimensionless', unit: 'none', default: 12, min: 1e-15, max: 1e15, visibleWhen: { solve: ['v1', 'c2', 'v2'] } },
    { id: 'v1_m3', label: 'Stock volume V1', group: 'volume', unit: 'm3', display: 'mL', default: 1e-5, min: 1e-15, max: 1e6, visibleWhen: { solve: ['c2', 'v2', 'c1'] } },
    { id: 'c2', label: 'Final concentration C2', group: 'dimensionless', unit: 'none', default: 1, min: 1e-15, max: 1e15, visibleWhen: { solve: ['v1', 'v2', 'c1'] } },
    { id: 'v2_m3', label: 'Final volume V2 (after making up)', group: 'volume', unit: 'm3', display: 'mL', default: 0.0005, min: 1e-15, max: 1e6, visibleWhen: { solve: ['v1', 'c2', 'c1'] } },
    { id: 'serial', label: 'Serial dilution', type: 'select', default: 'no', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes: equal steps from C1' }] },
    { id: 'steps', label: 'Number of serial steps n', group: 'dimensionless', unit: 'none', default: 6, min: 1, max: 20, integer: true, visibleWhen: { serial: 'yes' } },
    { id: 'step_factor', label: 'Dilution factor per step f', group: 'dimensionless', unit: 'none', default: 10, min: 1.01, max: 1e6, visibleWhen: { serial: 'yes' } },
    { id: 'transfer_m3', label: 'Transfer volume per step', group: 'volume', unit: 'm3', display: 'mL', default: 1e-6, min: 1e-12, max: 1, visibleWhen: { serial: 'yes' } },
  ],
  outputs: [
    { id: 'c1_out', label: 'Stock concentration C1', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'v1_out', label: 'Stock volume V1', group: 'volume', unit: 'm3', display: 'mL' },
    { id: 'c2_out', label: 'Final concentration C2', group: 'dimensionless', unit: 'none', decimals: 4 },
    { id: 'v2_out', label: 'Final volume V2', group: 'volume', unit: 'm3', display: 'mL' },
    { id: 'diluent', label: 'Diluent to add, V2 − V1', group: 'volume', unit: 'm3', display: 'mL' },
    { id: 'df', label: 'Dilution factor C1 / C2', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'ratio', label: 'Ratio, stock : diluent', type: 'text' },
    { id: 'serial_df', label: 'Serial: total dilution factor f^n', group: 'dimensionless', unit: 'none', visibleWhen: { serial: 'yes' } },
    { id: 'serial_final', label: 'Serial: concentration after the last step', group: 'dimensionless', unit: 'none', visibleWhen: { serial: 'yes' } },
    { id: 'serial_diluent', label: 'Serial: diluent in each tube', group: 'volume', unit: 'm3', display: 'mL', visibleWhen: { serial: 'yes' } },
    { id: 'serial_list', label: 'Serial: concentration after each step', type: 'text', visibleWhen: { serial: 'yes' } },
  ],
  example: {
    inputs: { solve: 'v1', c1: 12, c2: 1, v2_m3: [500, 'mL'], serial: 'no' },
    results: { v1_out: '41.67 mL', diluent: '458.3 mL', df: '12.0' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.solve, ['c1', 'v1', 'c2', 'v2'], 'solve', 'Solve for');
  assertOneOf(x.serial, ['no', 'yes'], 'serial', 'Serial dilution');
  const get = (id, label) => assertPositive(x[id], id, label);
  let c1 = x.solve === 'c1' ? null : get('c1', 'Stock concentration C1');
  let v1 = x.solve === 'v1' ? null : get('v1_m3', 'Stock volume V1');
  let c2 = x.solve === 'c2' ? null : get('c2', 'Final concentration C2');
  let v2 = x.solve === 'v2' ? null : get('v2_m3', 'Final volume V2');
  if (x.solve === 'v1') v1 = (c2 * v2) / c1;
  else if (x.solve === 'c2') c2 = (c1 * v1) / v2;
  else if (x.solve === 'v2') v2 = (c1 * v1) / c2;
  else c1 = (c2 * v2) / v1;
  if (c2 > c1 * (1 + 1e-12)) throw new Error(x.solve === 'c1' || x.solve === 'c2' ? 'Final volume V2: it must be at least the stock volume V1 for a dilution.' : 'Final concentration C2: it must not exceed the stock concentration C1; a dilution can only lower the concentration.');
  const df = c1 / c2;
  const diluent = Math.max(0, v2 - v1);
  const out = { c1_out: c1, v1_out: v1, c2_out: c2, v2_out: v2, diluent, df, ratio: `1 : ${fmt(df - 1)} (1 part stock to ${fmt(df - 1)} parts diluent; a "1 in ${fmt(df)}" dilution)`, serial_df: null, serial_final: null, serial_diluent: null, serial_list: null };
  const warnings = [];
  if (df > 1000 && x.serial === 'no') warnings.push('A dilution factor above 1 000 in one step needs a very small stock volume; a serial dilution is more accurate.');
  if (x.serial === 'yes') {
    const n = assertInteger(assertRange(x.steps, 1, 20, 'steps', 'Number of serial steps n'), 'steps', 'Number of serial steps n');
    const f = assertRange(x.step_factor, 1.01, 1e6, 'step_factor', 'Dilution factor per step f');
    const vt = assertPositive(x.transfer_m3, 'transfer_m3', 'Transfer volume per step');
    const list = Array.from({ length: n }, (_, k) => `${k + 1}: ${fmt(c1 / f ** (k + 1))}`);
    Object.assign(out, { serial_df: f ** n, serial_final: c1 / f ** n, serial_diluent: (f - 1) * vt, serial_list: list.join('; ') });
  }
  return { outputs: out, warnings };
}
