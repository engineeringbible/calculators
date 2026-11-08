/**
 * mah-to-wh/calc.js — battery capacity in mAh or Ah to energy in Wh at its nominal voltage, and back, with the
 * airline limit the battery falls under.
 *
 * E = Q × V   (Wh = Ah × V);  Q = E / V.
 * Schema units: SI — C (charge), V, J (energy).
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';

// IATA Dangerous Goods Regulations, lithium-ion batteries carried by passengers (Table 2.3.A): up to 100 Wh
// without approval, over 100 Wh up to 160 Wh with the airline's approval, over 160 Wh not in passenger baggage.
export const AIRLINE_FREE_WH = 100;
export const AIRLINE_MAX_WH = 160;
const J_PER_WH = 3600;

export const schema = {
  id: 'mah-to-wh',
  name: 'mAh to Wh battery capacity',
  category: 'electrical',
  summary: 'Battery capacity in mAh or Ah converted to energy in Wh at the nominal voltage, and back, with the airline carry-on limit it falls under.',
  related: ['battery-charge-time', 'battery-runtime', 'electricity-cost', 'solar-pv-sizing'],
  assumptions: [
    'Energy is capacity times the nominal voltage, which is the average voltage over a discharge (3.6 or 3.7 V for a lithium-ion cell, 3.2 V for LiFePO4, 2.0 V per lead-acid cell); the voltage falls as the battery empties, so the energy at a high discharge rate is a few per cent lower.',
    'A pack\'s capacity in mAh is quoted at its own voltage; a power bank rated in mAh at 3.7 V delivers fewer mAh at its 5 V USB output.',
    'The airline status follows the IATA limits for lithium-ion batteries carried by passengers; the airline and the country of departure can be stricter, and spare batteries must go in the cabin.',
  ],
  notes: [
    'Verification 2026-11-07: 3000 mAh at 3.7 V is 11.1 Wh; a 20 000 mAh power bank at 3.7 V is 74 Wh, under the 100 Wh limit. Checked by hand.',
  ],
  sources: [
    'IEC 61960-3:2017 Secondary lithium cells and batteries for portable applications (rated capacity, nominal voltage)',
    'IATA Dangerous Goods Regulations, 66th ed. (2025), Table 2.3.A and IATA Lithium Battery Guidance Document (100 Wh and 160 Wh limits)',
    'Linden\'s Handbook of Batteries, 4th ed., ch. 1 (energy = capacity × voltage)',
  ],
  inputs: [
    { id: 'mode', label: 'Convert', type: 'select', default: 'to_energy', options: [{ value: 'to_energy', label: 'Capacity (mAh or Ah) to energy (Wh)' }, { value: 'to_capacity', label: 'Energy (Wh) to capacity (mAh or Ah)' }] },
    { id: 'capacity_c', label: 'Capacity Q', group: 'electric_charge', unit: 'C', display: 'mAh', default: 10800, min: 0, max: 1e12, visibleWhen: { mode: 'to_energy' } },
    { id: 'energy_j', label: 'Energy E', group: 'energy', unit: 'J', display: 'Wh', default: 360000, min: 0, max: 1e15, visibleWhen: { mode: 'to_capacity' } },
    { id: 'voltage_v', label: 'Nominal voltage V', group: 'voltage', unit: 'V', default: 3.7, min: 0.1, max: 2000, help: 'Li-ion cell 3.6–3.7 V, LiFePO4 3.2 V, lead-acid 2.0 V per cell (12 V battery), NiMH 1.2 V.' },
  ],
  outputs: [
    { id: 'energy_out_j', label: 'Energy E = Q × V', group: 'energy', unit: 'J', display: 'Wh' },
    { id: 'capacity_out_c', label: 'Capacity Q = E / V', group: 'electric_charge', unit: 'C', display: 'mAh' },
    { id: 'capacity_ah_c', label: 'Capacity in Ah', group: 'electric_charge', unit: 'C', display: 'Ah' },
    { id: 'airline', label: 'Airline status (lithium-ion, passenger)', type: 'text' },
  ],
  example: {
    inputs: { mode: 'to_energy', capacity_c: [3000, 'mAh'], voltage_v: [3.7, 'V'] },
    results: {
      energy_out_j: '11.1 Wh',
      capacity_ah_c: '3 Ah',
    },
  },
};

export function airlineStatus(wh) {
  if (wh <= AIRLINE_FREE_WH) return `Allowed in carry-on without approval (${AIRLINE_FREE_WH} Wh or less)`;
  if (wh <= AIRLINE_MAX_WH) return `Needs the airline's approval (over ${AIRLINE_FREE_WH} Wh, up to ${AIRLINE_MAX_WH} Wh); at most two spares`;
  return `Not allowed in passenger baggage (over ${AIRLINE_MAX_WH} Wh); ship as dangerous goods`;
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['to_energy', 'to_capacity'], 'mode', 'Convert');
  const voltage = assertPositive(x.voltage_v, 'voltage_v', 'Nominal voltage');
  let charge;
  let energy;
  if (x.mode === 'to_energy') {
    charge = assertPositive(x.capacity_c, 'capacity_c', 'Capacity');
    energy = charge * voltage;
  } else {
    energy = assertPositive(x.energy_j, 'energy_j', 'Energy');
    charge = energy / voltage;
  }
  const wh = energy / J_PER_WH;
  const warnings = [];
  if (voltage > 60) warnings.push('Above 60 V DC the battery is no longer extra-low voltage; it needs protection against electric shock.');
  return {
    outputs: { energy_out_j: energy, capacity_out_c: charge, capacity_ah_c: charge, airline: airlineStatus(wh) },
    warnings,
  };
}
