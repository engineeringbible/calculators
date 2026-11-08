/**
 * ohms-law/calc.js — voltage, current, resistance and power from any two of them, for a resistive (DC or
 * unity-power-factor AC) circuit.
 *
 * Ohm's law V = I R and Joule's law P = V I = I² R = V² / R.
 * Schema units: SI — V, A, Ω, W.
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';

const PAIRS = ['vi', 'vr', 'ir', 'pv', 'pi', 'pr'];

export const schema = {
  id: 'ohms-law',
  name: "Ohm's law and electrical power",
  category: 'electrical',
  summary: "Voltage, current, resistance and power from any two of them, with Ohm's law V = I R and P = V I, for DC and resistive AC circuits.",
  related: ['three-phase-power', 'cable-sizing', 'battery-runtime', 'generator-load'],
  assumptions: [
    'The circuit element is a linear resistor: its resistance does not change with the voltage or current applied (no diodes, lamps warming up, or semiconductors).',
    'For AC, the voltage and current are RMS values and the load is purely resistive (power factor 1). Inductive or capacitive loads need the power factor; use the three-phase power calculator for those.',
    'Resistance is taken at its operating temperature; a conductor heated by the current has a higher resistance than its cold value (copper rises about 0.39 % per kelvin).',
    'All four quantities refer to the same element: the voltage across it, the current through it, its resistance and the power it dissipates.',
  ],
  notes: [
    'Verification 2026-11-07: every pair mode reproduces the same four values for the worked example (24 V, 0.5 A, 48 Ω, 12 W), and the 1 kW, 230 V heater and 100 W, 4 Ω loudspeaker cases were checked by hand.',
    'Design decision: one page for all six pairs, because people search for "Ohm\'s law calculator" whichever two values they know; the pair selector keeps only the two inputs that matter visible.',
  ],
  sources: [
    'Ohm, G. S., Die galvanische Kette, mathematisch bearbeitet, Berlin, 1827 (V = I R)',
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. 2 "Simple DC circuits" (Ohm\'s law, power P = V I = I² R = V² / R)',
    'Boylestad, Introductory Circuit Analysis, 13th ed., ch. 4 "Ohm\'s law, power and energy"',
    'IEC 60050-131:2002, International Electrotechnical Vocabulary, circuit theory (resistance, power)',
  ],
  inputs: [
    {
      id: 'pair',
      label: 'Known values',
      type: 'select',
      default: 'vr',
      options: [
        { value: 'vi', label: 'Voltage and current' },
        { value: 'vr', label: 'Voltage and resistance' },
        { value: 'ir', label: 'Current and resistance' },
        { value: 'pv', label: 'Power and voltage' },
        { value: 'pi', label: 'Power and current' },
        { value: 'pr', label: 'Power and resistance' },
      ],
    },
    { id: 'voltage_v', label: 'Voltage V', group: 'voltage', unit: 'V', default: 24, min: 0, max: 1e6, visibleWhen: { pair: ['vi', 'vr', 'pv'] } },
    { id: 'current_a', label: 'Current I', group: 'current', unit: 'A', default: 0.5, min: 0, max: 1e6, visibleWhen: { pair: ['vi', 'ir', 'pi'] } },
    { id: 'resistance_ohm', label: 'Resistance R', group: 'resistance', unit: 'ohm', default: 48, min: 0, max: 1e9, visibleWhen: { pair: ['vr', 'ir', 'pr'] } },
    { id: 'power_w', label: 'Power P', group: 'power', unit: 'W', default: 12, min: 0, max: 1e9, visibleWhen: { pair: ['pv', 'pi', 'pr'] } },
  ],
  outputs: [
    { id: 'voltage_out_v', label: 'Voltage V', group: 'voltage', unit: 'V' },
    { id: 'current_out_a', label: 'Current I', group: 'current', unit: 'A' },
    { id: 'resistance_out_ohm', label: 'Resistance R', group: 'resistance', unit: 'ohm' },
    { id: 'power_out_w', label: 'Power P', group: 'power', unit: 'W' },
    { id: 'conductance_s', label: 'Conductance G = 1/R (siemens)', group: 'dimensionless', unit: 'none', decimals: 6 },
  ],
  example: {
    inputs: { pair: 'vr', voltage_v: [24, 'V'], resistance_ohm: [48, 'ohm'] },
    results: {
      current_out_a: '0.5 A',
      power_out_w: '12 W',
    },
  },
};

/** The four quantities of a resistive element from any two, as { v, i, r, p }. */
export function solve(pair, { v, i, r, p }) {
  switch (pair) {
    case 'vi': return { v, i, r: v / i, p: v * i };
    case 'vr': return { v, i: v / r, r, p: (v * v) / r };
    case 'ir': return { v: i * r, i, r, p: i * i * r };
    case 'pv': return { v, i: p / v, r: (v * v) / p, p };
    case 'pi': return { v: p / i, i, r: p / (i * i), p };
    case 'pr': { const current = Math.sqrt(p / r); return { v: current * r, i: current, r, p }; }
    default: throw new Error(`Unknown pair "${pair}"`);
  }
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.pair, PAIRS, 'pair', 'Known values');
  const known = {};
  if (x.pair.includes('v')) known.v = assertPositive(x.voltage_v, 'voltage_v', 'Voltage');
  if (x.pair.includes('i')) known.i = assertPositive(x.current_a, 'current_a', 'Current');
  if (x.pair.includes('r')) known.r = assertPositive(x.resistance_ohm, 'resistance_ohm', 'Resistance');
  if (x.pair.includes('p')) known.p = assertPositive(x.power_w, 'power_w', 'Power');
  const { v, i, r, p } = solve(x.pair, known);
  const warnings = [];
  if (p > 2000 && v <= 50) warnings.push('More than 2 kW at extra-low voltage means a very large current: check the conductor size and the protective device.');
  if (r < 0.01) warnings.push('Resistance below 0.01 Ω is close to a short circuit; contact and lead resistance will dominate a real measurement.');
  return {
    outputs: { voltage_out_v: v, current_out_a: i, resistance_out_ohm: r, power_out_w: p, conductance_s: 1 / r },
    warnings,
  };
}
