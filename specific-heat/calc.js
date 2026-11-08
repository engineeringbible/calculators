/**
 * specific-heat/calc.js — sensible heat Q = m c ΔT solved for the heat, the temperature change, the mass or the specific
 * heat, with the heating time at a given power and efficiency.
 *
 * Q = m c (T2 − T1);  t = Q / (P η).  No phase change.
 * Schema units: SI — kg, J/(kg·K), °C, J, W, s.
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

/** Specific heat near room temperature, J/(kg·K): CRC Handbook (25 °C) and Incropera Appendix A (300 K). */
export const MATERIALS = {
  water: ['Water (liquid, 25 °C)', 4181],
  ice: ['Ice (−10 °C)', 2030],
  air: ['Air (constant pressure, 300 K)', 1007],
  steam: ['Steam (100 °C, constant pressure)', 2080],
  oil: ['Engine oil (300 K)', 1909],
  ethanol: ['Ethanol (25 °C)', 2440],
  aluminium: ['Aluminium', 897],
  copper: ['Copper', 385],
  iron: ['Iron', 449],
  steel: ['Carbon steel (AISI 1010)', 434],
  stainless: ['Stainless steel 304', 477],
  lead: ['Lead', 129],
  concrete: ['Concrete (stone mix)', 880],
  glass: ['Glass (plate)', 750],
  custom: ['Other (enter c)', null],
};

export const schema = {
  id: 'specific-heat',
  name: 'Specific heat calculator (Q = mcΔT)',
  category: 'thermal',
  summary: 'Heat to warm or cool a material, Q = m c ΔT, or the temperature change, mass or specific heat, with the heating time at a given power.',
  related: ['heat-transfer', 'electricity-cost', 'heat-loss', 'carnot-cop'],
  assumptions: [
    'Sensible heat only: no melting, boiling or other phase change between the two temperatures. Melting ice needs 334 kJ/kg more and boiling water 2 257 kJ/kg more.',
    'The specific heat is constant over the temperature range. For water it varies by less than 1 % from 10 to 90 °C; for gases over large ranges use the mean value.',
    'The heating time assumes all the power, reduced by the efficiency, goes into the material, with no losses to the surroundings during heating.',
    'Values for materials are typical room-temperature figures; alloys and composites vary.',
  ],
  notes: [
    'Verification 2026-11-07: 1.5 kg of water from 20 to 100 °C takes 501.7 kJ (0.139 kWh), 4.6 minutes in a 2 kW kettle at 90 % efficiency. Checked by hand.',
  ],
  sources: [
    'CRC Handbook of Chemistry and Physics, 97th ed., "Heat capacity of the elements at 25 °C" and "Properties of water"',
    'Incropera, F.P. et al., Fundamentals of Heat and Mass Transfer, 7th ed., Appendix A, Tables A.1, A.3, A.4, A.5 (300 K)',
  ],
  inputs: [
    { id: 'solve', label: 'Find', type: 'select', default: 'heat', options: [{ value: 'heat', label: 'Heat Q' }, { value: 'dt', label: 'Final temperature from the heat' }, { value: 'mass', label: 'Mass that the heat warms' }, { value: 'c', label: 'Specific heat from a measurement' }] },
    { id: 'material', label: 'Material', type: 'select', default: 'water', options: Object.entries(MATERIALS).map(([value, [label]]) => ({ value, label })), visibleWhen: { solve: ['heat', 'dt', 'mass'] } },
    { id: 'c_j_kgk', label: 'Specific heat c', group: 'specific_heat', unit: 'J_kgK', default: 4181, min: 1, max: 20000, visibleWhen: { material: 'custom' } },
    { id: 'mass_kg', label: 'Mass', group: 'mass', unit: 'kg', default: 1.5, min: 1e-9, max: 1e9, visibleWhen: { solve: ['heat', 'dt', 'c'] } },
    { id: 't1_c', label: 'Start temperature', group: 'temperature', unit: 'C', default: 20, min: -273, max: 5000 },
    { id: 't2_c', label: 'End temperature', group: 'temperature', unit: 'C', default: 100, min: -273, max: 5000, visibleWhen: { solve: ['heat', 'mass', 'c'] } },
    { id: 'heat_j', label: 'Heat supplied Q', group: 'energy', unit: 'J', display: 'kJ', default: 100000, min: 1e-6, max: 1e15, visibleWhen: { solve: ['dt', 'mass', 'c'] } },
    { id: 'power_w', label: 'Heater power (optional, for the time)', group: 'power', unit: 'W', display: 'kW', default: 2000, min: 0, max: 1e9 },
    { id: 'efficiency', label: 'Heating efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.01, max: 1 },
  ],
  outputs: [
    { id: 'q_j', label: 'Heat Q', group: 'energy', unit: 'J', display: 'kJ' },
    { id: 'q_kwh_j', label: 'Heat in kWh', group: 'energy', unit: 'J', display: 'kWh' },
    { id: 'q_btu_j', label: 'Heat in Btu', group: 'energy', unit: 'J', display: 'Btu' },
    { id: 't2_out_c', label: 'End temperature', group: 'temperature', unit: 'C' },
    { id: 'mass_out_kg', label: 'Mass', group: 'mass', unit: 'kg' },
    { id: 'c_out', label: 'Specific heat', group: 'specific_heat', unit: 'J_kgK' },
    { id: 'time_s', label: 'Heating time at the power', group: 'time', unit: 's', display: 'min' },
  ],
  example: {
    inputs: { solve: 'heat', material: 'water', mass_kg: [1.5, 'kg'], t1_c: [20, 'C'], t2_c: [100, 'C'], power_w: [2, 'kW'], efficiency: [90, 'pct'] },
    results: { q_j: '501.7 kJ', q_kwh_j: '0.139 kWh', time_s: '4.65 min' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.solve, ['heat', 'dt', 'mass', 'c'], 'solve', 'Find');
  assertOneOf(x.material, Object.keys(MATERIALS), 'material', 'Material');
  const c0 = x.solve === 'c' ? null : x.material === 'custom' ? assertPositive(x.c_j_kgk, 'c_j_kgk', 'Specific heat') : MATERIALS[x.material][1];
  const t1 = assertRange(x.t1_c, -273, 5000, 't1_c', 'Start temperature');
  const p = assertNonNegative(x.power_w, 'power_w', 'Heater power');
  const eta = assertRange(x.efficiency, 0.01, 1, 'efficiency', 'Heating efficiency');
  let m; let c; let t2; let q;
  if (x.solve === 'heat') {
    m = assertPositive(x.mass_kg, 'mass_kg', 'Mass'); c = c0; t2 = assertRange(x.t2_c, -273, 5000, 't2_c', 'End temperature');
    q = m * c * (t2 - t1);
  } else if (x.solve === 'dt') {
    m = assertPositive(x.mass_kg, 'mass_kg', 'Mass'); c = c0; q = assertPositive(x.heat_j, 'heat_j', 'Heat supplied');
    t2 = t1 + q / (m * c);
  } else {
    t2 = assertRange(x.t2_c, -273, 5000, 't2_c', 'End temperature'); q = assertPositive(x.heat_j, 'heat_j', 'Heat supplied');
    if (t2 === t1) throw new Error('End temperature: it must differ from the start temperature.');
    if (x.solve === 'mass') { c = c0; m = q / (c * Math.abs(t2 - t1)); }
    else { m = assertPositive(x.mass_kg, 'mass_kg', 'Mass'); c = q / (m * Math.abs(t2 - t1)); }
  }
  const warnings = [];
  const lo = Math.min(t1, t2); const hi = Math.max(t1, t2);
  if (x.solve !== 'c' && x.material === 'water' && (lo < 0 || hi > 100)) warnings.push('Water freezes at 0 °C and boils at 100 °C at sea level: the range crosses a phase change, which needs latent heat as well.');
  if (x.solve !== 'c' && x.material === 'ice' && hi > 0) warnings.push('Ice melts at 0 °C: above it, the heat to melt (334 kJ/kg) and the heat of the water must be added.');
  return {
    outputs: {
      q_j: q, q_kwh_j: q, q_btu_j: q, t2_out_c: t2, mass_out_kg: m, c_out: c,
      time_s: p > 0 ? Math.abs(q) / (p * eta) : null,
    },
    warnings,
  };
}
