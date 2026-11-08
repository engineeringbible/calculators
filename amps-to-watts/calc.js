/**
 * amps-to-watts/calc.js — power a circuit or load can take from its current and voltage, for DC, single-phase and
 * three-phase supplies.
 *
 * DC P = V I;  single-phase P = V I cos φ;  three-phase P = √3 V I cos φ.
 * Schema units: SI — A, V, W.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';
import { SYSTEMS, systemOptions, powerFromCurrent } from '../shared/power.js';

export const schema = {
  id: 'amps-to-watts',
  name: 'Amps to watts',
  category: 'electrical',
  summary: 'Watts from amps and voltage for DC, single-phase and three-phase circuits, with the power factor: what a circuit, fuse or socket can supply.',
  related: ['watts-to-amps', 'amps-to-kw', 'ohms-law', 'cable-sizing'],
  assumptions: [
    'The current is the RMS current in each line; for three-phase the voltage is the line-to-line voltage and the load is balanced.',
    'For AC the real power is the volt-amperes times the power factor; with a power factor of 1 the watts equal the volt-amperes.',
    'A circuit\'s rated current gives the most it can supply; continuous loads are usually limited to 80 % of a breaker\'s rating in North American practice.',
  ],
  notes: [
    'Verification 2026-11-07: a 13 A socket at 230 V supplies 2 990 W; a 15 A circuit at 120 V 1 800 W; 32 A three-phase at 400 V and 0.9 power factor 19.95 kW. Checked by hand.',
  ],
  sources: [
    'Hughes, Electrical and Electronic Technology, 12th ed., ch. 2 (P = V I) and ch. "Three-phase systems" (P = √3 V_L I_L cos φ)',
    'BS 1363 (13 A plugs and sockets) and IEC 60038 standard voltages',
  ],
  inputs: [
    { id: 'system', label: 'Supply', type: 'select', default: 'ac1', options: systemOptions() },
    { id: 'current_a', label: 'Current I', group: 'current', unit: 'A', default: 13, min: 0, max: 1e7 },
    { id: 'voltage_v', label: 'Voltage V', group: 'voltage', unit: 'V', default: 230, min: 0.1, max: 1e6 },
    { id: 'power_factor', label: 'Power factor cos φ', group: 'dimensionless', unit: 'none', default: 1, min: 0.05, max: 1, visibleWhen: { system: ['ac1', 'ac3'] } },
  ],
  outputs: [
    { id: 'power_w', label: 'Power P', group: 'power', unit: 'W' },
    { id: 'apparent_va', label: 'Apparent power S', group: 'apparent_power', unit: 'VA' },
  ],
  example: {
    inputs: { system: 'ac1', current_a: [13, 'A'], voltage_v: [230, 'V'], power_factor: 1 },
    results: { power_w: '2 990 W' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.system, Object.keys(SYSTEMS), 'system', 'Supply');
  const i = assertPositive(x.current_a, 'current_a', 'Current');
  const v = assertPositive(x.voltage_v, 'voltage_v', 'Voltage');
  const pf = x.system === 'dc' ? 1 : assertRange(x.power_factor, 0.05, 1, 'power_factor', 'Power factor');
  const p = powerFromCurrent(x.system, i, v, pf);
  return { outputs: { power_w: p, apparent_va: p / pf }, warnings: [] };
}
