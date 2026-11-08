/**
 * battery-charge-time/calc.js — time to charge a battery from one state of charge to another with a charger of
 * given current, allowing for the charge efficiency of the chemistry, with the charge rate in C.
 *
 * Q_in = Q × (SoC_target − SoC_start);  t = Q_in / (I × η);  C-rate = I / Q.
 * Schema units: SI — C (charge), A, s; states of charge and efficiency as fractions.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

// Typical charge (coulombic) efficiency and the highest charge rate for a long life (Linden's Handbook of
// Batteries, 4th ed.; battery makers' data). Lead-acid figures include the gassing at the end of charge.
export const CHEMISTRIES = {
  flooded: { label: 'Lead-acid, flooded (≈ 85 %)', eta: 0.85, maxC: 0.2, slowAbove: 0.8 },
  agm: { label: 'Lead-acid, AGM or gel (≈ 90 %)', eta: 0.9, maxC: 0.3, slowAbove: 0.8 },
  liion: { label: 'Lithium-ion, NMC or NCA (≈ 95 %)', eta: 0.95, maxC: 1, slowAbove: 0.8 },
  lifepo4: { label: 'Lithium iron phosphate LiFePO4 (≈ 97 %)', eta: 0.97, maxC: 1, slowAbove: 0.9 },
  nimh: { label: 'Nickel-metal hydride (≈ 70 %)', eta: 0.7, maxC: 1, slowAbove: 0.8 },
  custom: { label: 'Custom efficiency', eta: null, maxC: null, slowAbove: null },
};

export const schema = {
  id: 'battery-charge-time',
  name: 'Battery charge time',
  category: 'electrical',
  summary: 'Time to charge a battery from any state of charge with a given charger, allowing for the chemistry\'s charge efficiency, with the charge rate in C.',
  related: ['mah-to-wh', 'battery-runtime', 'solar-pv-sizing', 'electricity-cost'],
  assumptions: [
    'The charger delivers its rated current for the whole charge; in practice lithium batteries switch to constant voltage near full and lead-acid batteries need a long absorption stage, which the warning shows.',
    'The charge efficiency is the typical share of the charge put in that the battery stores; it falls when a battery is hot, old or charged fast.',
    'The state of charge is the share of the rated capacity; a battery that has aged holds less than its rating, which shortens the charge.',
    'The charger\'s own losses and any load running from the battery while it charges are not included.',
  ],
  notes: [
    'Verification 2026-11-07: a 100 Ah flooded lead-acid battery from 50 % to 100 % at 10 A needs 50 Ah / (10 × 0.85) = 5.88 h at 0.10 C. Checked by hand.',
  ],
  sources: [
    'Linden\'s Handbook of Batteries, 4th ed., ch. 16 (lead-acid charging and efficiency), ch. 26 (lithium-ion charging, CC-CV)',
    'IEC 61427-1:2013 Secondary cells and batteries for renewable energy storage (charge efficiency in cycling)',
  ],
  inputs: [
    { id: 'capacity_c', label: 'Rated capacity', group: 'electric_charge', unit: 'C', display: 'Ah', default: 360000, min: 0, max: 1e12 },
    { id: 'chemistry', label: 'Chemistry', type: 'select', default: 'flooded', options: Object.entries(CHEMISTRIES).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'efficiency', label: 'Charge efficiency η', group: 'ratio', unit: 'frac', display: 'pct', default: 0.85, min: 0.3, max: 1, visibleWhen: { chemistry: 'custom' } },
    { id: 'start_soc', label: 'State of charge now', group: 'ratio', unit: 'frac', display: 'pct', default: 0.5, min: 0, max: 1 },
    { id: 'target_soc', label: 'Charge to', group: 'ratio', unit: 'frac', display: 'pct', default: 1, min: 0, max: 1 },
    { id: 'current_a', label: 'Charger current I', group: 'current', unit: 'A', default: 10, min: 0, max: 1e6 },
  ],
  outputs: [
    { id: 'time_s', label: 'Charge time', group: 'time', unit: 's', display: 'h' },
    { id: 'charge_needed_c', label: 'Charge to put back into the battery', group: 'electric_charge', unit: 'C', display: 'Ah' },
    { id: 'charge_from_charger_c', label: 'Charge the charger must supply', group: 'electric_charge', unit: 'C', display: 'Ah' },
    { id: 'c_rate', label: 'Charge rate (C)', group: 'dimensionless', unit: 'none', decimals: 2 },
  ],
  example: {
    inputs: { capacity_c: [100, 'Ah'], chemistry: 'flooded', start_soc: [50, 'pct'], target_soc: [100, 'pct'], current_a: [10, 'A'] },
    results: {
      time_s: '5.88 h',
      charge_needed_c: '50 Ah',
      c_rate: '0.10',
    },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.chemistry, Object.keys(CHEMISTRIES), 'chemistry', 'Chemistry');
  const capacity = assertPositive(x.capacity_c, 'capacity_c', 'Rated capacity');
  const current = assertPositive(x.current_a, 'current_a', 'Charger current');
  const start = assertRange(x.start_soc, 0, 1, 'start_soc', 'State of charge now');
  const target = assertRange(x.target_soc, 0, 1, 'target_soc', 'Charge to');
  if (target <= start) throw new Error(`Charge to must be above the state of charge now (${target * 100} % is not above ${start * 100} %)`);
  const chem = CHEMISTRIES[x.chemistry];
  const eta = x.chemistry === 'custom' ? assertRange(x.efficiency, 0.3, 1, 'efficiency', 'Charge efficiency') : chem.eta;
  const needed = capacity * (target - start);
  const fromCharger = needed / eta;
  const cRate = current / (capacity / 3600);
  const warnings = [];
  if (chem.maxC !== null && cRate > chem.maxC) warnings.push(`A charge rate of ${Number(cRate.toFixed(2))} C is above the usual ${chem.maxC} C for this chemistry; it shortens the battery's life or trips the battery's protection.`);
  if (chem.slowAbove !== null && target > chem.slowAbove) warnings.push(x.chemistry === 'flooded' || x.chemistry === 'agm'
    ? 'Above about 80 % a lead-acid battery needs a long absorption stage at reducing current; allow 2 to 4 hours more to reach 100 %.'
    : 'Near full the charger switches to constant voltage and the current tapers; the last 10 to 20 % takes longer than this estimate.');
  return {
    outputs: {
      time_s: fromCharger / current,
      charge_needed_c: needed,
      charge_from_charger_c: fromCharger,
      c_rate: cRate,
    },
    warnings,
  };
}
