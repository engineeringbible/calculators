/**
 * resistors-series-parallel/calc.js — equivalent resistance of any number of resistors in series and in parallel,
 * with how the voltage (series) or the current (parallel) divides between them, and the totals at a given voltage.
 *
 * Series: R = Σ Rᵢ.  Parallel: 1/R = Σ 1/Rᵢ.  Series share of voltage Rᵢ/ΣR; parallel share of current (1/Rᵢ)/Σ(1/R).
 * Schema units: SI — Ω, V, A, W.
 */
import { withDefaults, assertNonNegative } from '../shared/validate.js';
import { parseComponentValues, formatOhms } from '../shared/eseries.js';

export const schema = {
  id: 'resistors-series-parallel',
  name: 'Series and parallel resistors',
  category: 'electrical',
  summary: 'Equivalent resistance of any number of resistors in series and in parallel, how the voltage or current divides, and the totals at a given voltage.',
  related: ['ohms-law', 'voltage-divider', 'resistor-color-code', 'capacitors-series-parallel'],
  assumptions: [
    'The resistors are ideal and linear, at their nominal values; tolerances add up in series and average out only statistically.',
    'Series means every resistor carries the same current; parallel means every resistor sees the same voltage. Mixed networks are reduced step by step: work out each parallel group, then add the groups in series.',
    'With a voltage entered, it is applied across the whole series chain or across the parallel group.',
  ],
  notes: [
    'Verification 2026-11-07: 100, 220 and 470 Ω give 790 Ω in series and 59.98 Ω in parallel; two equal resistors in parallel give half their value. Checked by hand.',
    'Design decision: values are typed the way parts are marked (4k7, 2R2, 1M) so a list can be copied from a bill of materials.',
  ],
  sources: [
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. 2 (series and parallel resistors, current and voltage division)',
    'Boylestad, Introductory Circuit Analysis, 13th ed., ch. 5 and 6 (series and parallel circuits)',
    'IEC 60062:2016 clause 5, letter and digit code for resistance values (4K7, 2R2)',
  ],
  inputs: [
    { id: 'values', label: 'Resistor values (Ω unless marked k or M)', type: 'textarea', rows: 6, default: '100\n220\n470', help: 'One or more per line. Examples: 470, 4.7k, 4k7, 2R2 (2.2 Ω), 1M.' },
    { id: 'voltage_v', label: 'Applied voltage (0 to skip)', group: 'voltage', unit: 'V', default: 0, min: 0, max: 1e6 },
  ],
  outputs: [
    { id: 'series_ohm', label: 'In series R = R₁ + R₂ + …', group: 'resistance', unit: 'ohm' },
    { id: 'parallel_ohm', label: 'In parallel 1/R = 1/R₁ + 1/R₂ + …', group: 'resistance', unit: 'ohm' },
    { id: 'count', label: 'Number of resistors', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'series_current_a', label: 'Series current at the applied voltage', group: 'current', unit: 'A', display: 'mA' },
    { id: 'parallel_current_a', label: 'Total parallel current at the applied voltage', group: 'current', unit: 'A', display: 'mA' },
    { id: 'parallel_power_w', label: 'Total parallel power at the applied voltage', group: 'power', unit: 'W' },
    { id: 'shares', label: 'How the voltage and current divide', type: 'table' },
  ],
  example: {
    inputs: { values: '100\n220\n470', voltage_v: [0, 'V'] },
    results: {
      series_ohm: '790 Ω',
      parallel_ohm: '60.0 Ω',
    },
  },
};

export const seriesResistance = (values) => values.reduce((s, r) => s + r, 0);
export const parallelResistance = (values) => 1 / values.reduce((s, r) => s + 1 / r, 0);

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  const values = parseComponentValues(x.values, 1);
  if (values.length < 1) throw new Error('Values: enter at least one resistor');
  values.forEach((r, i) => { if (!(r > 0)) throw new Error(`Values: resistor ${i + 1} must be greater than zero (got ${r})`); });
  const voltage = assertNonNegative(x.voltage_v, 'voltage_v', 'Applied voltage');
  const series = seriesResistance(values);
  const parallel = parallelResistance(values);
  const conductance = 1 / parallel;
  const pct = (v) => `${Number((v * 100).toPrecision(3))} %`;
  const warnings = [];
  if (values.length === 1) warnings.push('Only one resistor: series and parallel are both its own value.');
  const spread = Math.max(...values) / Math.min(...values);
  if (values.length > 1 && spread > 1000) warnings.push('The values differ by more than a factor of 1000: in series the smallest hardly counts, in parallel the largest hardly counts.');
  return {
    outputs: {
      series_ohm: series,
      parallel_ohm: parallel,
      count: values.length,
      series_current_a: voltage > 0 ? voltage / series : null,
      parallel_current_a: voltage > 0 ? voltage / parallel : null,
      parallel_power_w: voltage > 0 ? (voltage * voltage) / parallel : null,
      shares: {
        columns: ['Resistor', 'Value', 'Series: share of the voltage', 'Parallel: share of the current'],
        rows: values.map((r, i) => [`R${i + 1}`, formatOhms(r), pct(r / series), pct((1 / r) / conductance)]),
      },
    },
    warnings,
  };
}
