/**
 * capacitors-series-parallel/calc.js — equivalent capacitance of capacitors in series or in parallel, with the
 * charge and stored energy at a voltage and how the voltage (series) or the charge (parallel) is shared.
 *
 * Parallel: C = Σ Cᵢ.  Series: 1/C = Σ 1/Cᵢ.  Q = C V;  E = ½ C V².  Series: each holds Q, Vᵢ = Q / Cᵢ.
 * Schema units: SI — F, V, J; charge in microcoulombs.
 */
import { withDefaults, assertNonNegative, assertOneOf } from '../shared/validate.js';
import { parseComponentValues, formatWithPrefix } from '../shared/eseries.js';

export const schema = {
  id: 'capacitors-series-parallel',
  name: 'Series and parallel capacitors',
  category: 'electrical',
  summary: 'Equivalent capacitance of capacitors in series or parallel, with the charge, the stored energy and the voltage across each capacitor in a series stack.',
  related: ['resistors-series-parallel', 'rc-time-constant', 'ohms-law', 'power-factor-correction'],
  assumptions: [
    'The capacitors are ideal: no leakage, no equivalent series resistance and their nominal capacitance; electrolytic capacitors are often −20 % / +80 % of nominal.',
    'In series, every capacitor holds the same charge, so the voltage splits in inverse proportion to capacitance; in practice leakage currents decide the long-term DC sharing, which is why series stacks need balancing resistors.',
    'The applied voltage is DC, or the peak of an AC voltage for the stored energy; each capacitor\'s voltage rating must exceed its own share.',
    'Values are typed as marked: plain numbers are microfarads, and the prefixes p, n, u (µ) and m give pico-, nano-, micro- and millifarads.',
  ],
  notes: [
    'Verification 2026-11-07: 10, 22 and 47 µF in series give 6.00 µF; at 12 V the charge is 72.0 µC, the energy 0.432 mJ, and the voltages 7.20, 3.27 and 1.53 V add up to 12 V. Checked by hand.',
  ],
  sources: [
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. 5 (capacitors in series and parallel, Q = C V, W = ½ C V²)',
    'Boylestad, Introductory Circuit Analysis, 13th ed., ch. 10 (capacitors)',
    'IEC 60062:2016 clause 5, letter and digit code for capacitance values (4n7, 4u7)',
  ],
  inputs: [
    { id: 'values', label: 'Capacitor values (µF unless marked p, n or m)', type: 'textarea', rows: 6, default: '10\n22\n47', help: 'Examples: 100n, 4u7, 22p, 1000 (µF).' },
    { id: 'connection', label: 'Connection', type: 'select', default: 'series', options: [{ value: 'series', label: 'In series' }, { value: 'parallel', label: 'In parallel' }] },
    { id: 'voltage_v', label: 'Voltage across the combination', group: 'voltage', unit: 'V', default: 12, min: 0, max: 1e6 },
  ],
  outputs: [
    { id: 'total_f', label: 'Equivalent capacitance C', group: 'capacitance', unit: 'F', display: 'uF' },
    { id: 'other_f', label: 'Equivalent if connected the other way', group: 'capacitance', unit: 'F', display: 'uF' },
    { id: 'charge_uc', label: 'Charge Q = C V (µC)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'energy_j', label: 'Stored energy E = ½ C V²', group: 'energy', unit: 'J', display: 'mJ' },
    { id: 'max_voltage_v', label: 'Highest voltage on one capacitor', group: 'voltage', unit: 'V' },
    { id: 'each', label: 'Each capacitor', type: 'table' },
  ],
  example: {
    inputs: { values: '10\n22\n47', connection: 'series', voltage_v: [12, 'V'] },
    results: {
      total_f: '6.00 µF',
      charge_uc: '72.0',
      energy_j: '0.432 mJ',
      max_voltage_v: '7.20 V',
    },
  },
};

export const parallelCapacitance = (values) => values.reduce((s, c) => s + c, 0);
export const seriesCapacitance = (values) => 1 / values.reduce((s, c) => s + 1 / c, 0);

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.connection, ['series', 'parallel'], 'connection', 'Connection');
  const values = parseComponentValues(x.values, 1e-6);
  if (values.length < 1) throw new Error('Values: enter at least one capacitor');
  values.forEach((c, i) => { if (!(c > 0)) throw new Error(`Values: capacitor ${i + 1} must be greater than zero (got ${c})`); });
  const voltage = assertNonNegative(x.voltage_v, 'voltage_v', 'Voltage');
  const series = x.connection === 'series';
  const total = series ? seriesCapacitance(values) : parallelCapacitance(values);
  const charge = total * voltage;
  const fmtV = (v) => `${Number(v.toPrecision(3))} V`;
  const rows = values.map((c, i) => {
    const vi = series ? charge / c : voltage;
    const qi = c * vi;
    return [`C${i + 1}`, formatWithPrefix(c, 'F'), fmtV(vi), `${Number((qi * 1e6).toPrecision(3))} µC`, formatWithPrefix(0.5 * c * vi * vi, 'J')];
  });
  const maxVoltage = series ? charge / Math.min(...values) : voltage;
  const warnings = [];
  if (series && values.length > 1) warnings.push('In a series stack the smallest capacitor takes the largest voltage; check every capacitor\'s voltage rating, and fit balancing resistors across electrolytics.');
  return {
    outputs: {
      total_f: total,
      other_f: series ? parallelCapacitance(values) : seriesCapacitance(values),
      charge_uc: charge * 1e6,
      energy_j: 0.5 * total * voltage * voltage,
      max_voltage_v: maxVoltage,
      each: { columns: ['Capacitor', 'Value', 'Voltage', 'Charge', 'Energy'], rows },
    },
    warnings,
  };
}
