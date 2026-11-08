/**
 * solar-battery-bank/calc.js — battery bank for a solar or backup system: the energy the bank must deliver over the
 * days of autonomy, the nominal capacity after depth of discharge, temperature derating and margin, the Ah at the
 * system voltage, and the number of a chosen battery in series and in parallel.
 *
 * E_bank = E_day × days / η_inv;  C_nom = E_bank × k_T × (1 + margin) / DoD;  Ah = C_nom / V_sys;
 * N_series = V_sys / V_bat;  N_parallel = ceil(Ah / Ah_bat).  k_T from IEEE 485 Table 1 (vented lead-acid, 1.215 SG).
 * Schema units: Wh (display kWh), V, Ah, °C, fraction.
 */
import { withDefaults, assertRange, assertOneOf } from '../shared/validate.js';

/** IEEE 485 Table 1 (as reproduced in TSEWG TP-4, 2008): electrolyte temperature °F → cell size correction factor. */
export const IEEE485_TABLE = [
  [25, 1.52], [30, 1.43], [35, 1.35], [40, 1.3], [45, 1.25], [50, 1.19], [55, 1.15], [60, 1.11], [65, 1.08],
  [66, 1.072], [67, 1.064], [68, 1.056], [69, 1.048], [70, 1.04], [71, 1.034], [72, 1.029], [73, 1.023], [74, 1.017],
  [75, 1.011], [76, 1.006], [77, 1.0], [78, 0.994], [79, 0.987], [80, 0.98], [81, 0.976], [82, 0.972], [83, 0.968],
  [84, 0.964], [85, 0.96], [86, 0.956], [87, 0.952], [88, 0.948], [89, 0.944], [90, 0.94], [95, 0.93], [100, 0.91],
  [105, 0.89], [110, 0.88], [115, 0.87], [120, 0.86], [125, 0.85],
];

/** Usual depth of discharge for a long cycle life (Victron data sheets: AGM 600 cycles at 50 %, LiFePO4 2 500 at 80 %). */
export const CHEMISTRIES = {
  flooded: { label: 'Flooded lead-acid: 50 % depth of discharge', dod: 0.5, lead: true },
  agm: { label: 'AGM lead-acid: 50 % depth of discharge', dod: 0.5, lead: true },
  gel: { label: 'Gel lead-acid: 50 % depth of discharge', dod: 0.5, lead: true },
  lifepo4: { label: 'Lithium iron phosphate (LiFePO4): 80 % depth of discharge', dod: 0.8, lead: false },
  custom: { label: 'Custom depth of discharge', dod: null, lead: false },
};

/** IEEE 485 cell size correction factor at a temperature in °C, linear in °F between rows; null outside the table. */
export function ieee485Factor(tempC) {
  const f = (tempC * 9) / 5 + 32;
  const t = IEEE485_TABLE;
  if (f < t[0][0] - 0.1 || f > t[t.length - 1][0] + 0.1) return null;
  if (f <= t[0][0]) return t[0][1];
  for (let k = 1; k < t.length; k += 1) {
    if (f <= t[k][0]) {
      const [f0, k0] = t[k - 1];
      const [f1, k1] = t[k];
      return k0 + ((f - f0) / (f1 - f0)) * (k1 - k0);
    }
  }
  return t[t.length - 1][1];
}

export const schema = {
  id: 'solar-battery-bank',
  name: 'Solar battery bank calculator',
  category: 'electrical',
  summary: 'Battery bank for solar or backup power from daily energy, autonomy, depth of discharge and temperature: Ah needed, batteries in series and parallel.',
  related: ['solar-pv-sizing', 'inverter-size', 'battery-runtime', 'battery-charge-time'],
  assumptions: [
    'The bank must deliver the daily energy for the chosen days of autonomy without recharge; the energy drawn from the bank is the load energy divided by the inverter efficiency (enter 100 % for DC loads).',
    'Depth of discharge defaults are for a long cycle life: 50 % for flooded, AGM and gel lead-acid and 80 % for LiFePO4, in line with manufacturer cycle-life data (AGM about 600 cycles at 50 %, LiFePO4 about 2 500 cycles at 80 %).',
    'Temperature derating uses the IEEE 485 cell size correction factors for vented lead-acid cells (1.215 specific gravity), applied to AGM and gel as an approximation; above 25 °C no credit is taken for the higher capacity. For LiFePO4 enter the capacity factor from the data sheet.',
    'The margin covers ageing and load growth: IEEE 485 sizes stationary lead-acid batteries with an ageing factor of 1.25 so they still carry the load at 80 % of rated capacity, plus a 10 to 15 % design margin.',
    'Capacity is the battery rating at its standard discharge rate (often C/20 for lead-acid); high discharge currents give less (Peukert effect), which the battery runtime calculator handles.',
  ],
  notes: [
    'Verification 2026-11-08: 3 kWh a day for 3 days through a 90 % inverter is 10.0 kWh from the bank; flooded lead-acid at 50 % and 10 °C (50 °F, factor 1.19) needs 23.8 kWh, 992 Ah at 24 V, so 2 × 5 = 10 batteries of 12 V 200 Ah, 1 000 Ah and 24.0 kWh, of which 10.1 kWh is usable at 10 °C. Checked by hand.',
    'The IEEE 485 table was checked row by row against its reproduction in TSEWG TP-4 (2008); values between rows are interpolated linearly in °F.',
  ],
  sources: [
    'IEEE Std 485, Recommended Practice for Sizing Lead-Acid Batteries for Stationary Applications, Table 1 (temperature correction factors) and the ageing factor 1.25, as reproduced in Tri-Service Electrical Working Group TSEWG TP-4, Stationary Battery and Charger Sizing (2008), Table 1',
    'IEEE Std 1013, Recommended Practice for Sizing Lead-Acid Batteries for Stand-Alone Photovoltaic (PV) Systems (days of autonomy, depth of discharge)',
    'Victron Energy data sheets: Gel and AGM batteries (cycle life 400 at 80 %, 600 at 50 %, 1 500 at 30 % depth of discharge) and Lithium Battery Smart (2 500 cycles at 80 % depth of discharge)',
  ],
  inputs: [
    { id: 'daily_wh', label: 'Energy used per day', group: 'energy', unit: 'Wh', display: 'kWh', default: 3000, min: 1, max: 1e7 },
    { id: 'autonomy_days', label: 'Days of autonomy (no charging)', group: 'dimensionless', unit: 'none', default: 3, min: 0.05, max: 30 },
    { id: 'chemistry', label: 'Battery type', type: 'select', default: 'flooded', options: Object.entries(CHEMISTRIES).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'dod_custom', label: 'Depth of discharge', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.1, max: 1, visibleWhen: { chemistry: 'custom' } },
    { id: 'derating', label: 'Temperature derating', type: 'select', default: 'table', options: [{ value: 'table', label: 'Lead-acid: IEEE 485 factor at the battery temperature' }, { value: 'factor', label: 'Capacity factor from the data sheet' }, { value: 'none', label: 'None (battery at 25 °C or warmer)' }] },
    { id: 'temp_c', label: 'Lowest battery temperature', group: 'temperature', unit: 'C', display: 'F', default: 10, min: -3.9, max: 51.7, visibleWhen: { derating: 'table' } },
    { id: 'capacity_factor', label: 'Capacity available at the battery temperature', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.3, max: 1, visibleWhen: { derating: 'factor' } },
    { id: 'inverter_eff', label: 'Inverter efficiency (100 % for DC loads)', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.5, max: 1 },
    { id: 'margin', label: 'Ageing and design margin', group: 'ratio', unit: 'frac', display: 'pct', default: 0, min: 0, max: 1 },
    { id: 'system_v', label: 'System (bank) voltage', group: 'voltage', unit: 'V', default: 24, min: 1, max: 1500 },
    { id: 'battery_v', label: 'Voltage of one battery', group: 'voltage', unit: 'V', default: 12, min: 1, max: 1500 },
    { id: 'battery_ah', label: 'Capacity of one battery', group: 'electric_charge', unit: 'Ah', default: 200, min: 0.1, max: 1e5 },
  ],
  outputs: [
    { id: 'bank_energy_wh', label: 'Energy the bank must deliver', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'temp_factor', label: 'Temperature correction factor', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'required_wh', label: 'Nominal capacity required', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'required_ah', label: 'Capacity required at the system voltage', group: 'electric_charge', unit: 'Ah' },
    { id: 'series', label: 'Batteries in series per string', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'parallel', label: 'Strings in parallel', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'total', label: 'Batteries in total', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'bank', label: 'Battery bank', type: 'text' },
    { id: 'bank_ah', label: 'Bank capacity', group: 'electric_charge', unit: 'Ah' },
    { id: 'bank_wh', label: 'Bank nominal energy', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'usable_wh', label: 'Usable energy at the depth of discharge and temperature', group: 'energy', unit: 'Wh', display: 'kWh' },
    { id: 'actual_days', label: 'Days of autonomy of the bank as built', group: 'dimensionless', unit: 'none', decimals: 2 },
  ],
  example: {
    inputs: { daily_wh: [3, 'kWh'], autonomy_days: 3, chemistry: 'flooded', derating: 'table', temp_c: [50, 'F'], inverter_eff: [90, 'pct'], margin: [0, 'pct'], system_v: [24, 'V'], battery_v: [12, 'V'], battery_ah: [200, 'Ah'] },
    results: { bank_energy_wh: '10.0 kWh', temp_factor: '1.19', required_wh: '23.8 kWh', required_ah: '992 Ah', total: '10', bank_wh: '24.0 kWh', usable_wh: '10.1 kWh' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.chemistry, Object.keys(CHEMISTRIES), 'chemistry', 'Battery type');
  assertOneOf(x.derating, ['table', 'factor', 'none'], 'derating', 'Temperature derating');
  const daily = assertRange(x.daily_wh, 1, 1e7, 'daily_wh', 'Energy used per day');
  const days = assertRange(x.autonomy_days, 0.05, 30, 'autonomy_days', 'Days of autonomy');
  const chem = CHEMISTRIES[x.chemistry];
  const dod = x.chemistry === 'custom' ? assertRange(x.dod_custom, 0.1, 1, 'dod_custom', 'Depth of discharge') : chem.dod;
  const eta = assertRange(x.inverter_eff, 0.5, 1, 'inverter_eff', 'Inverter efficiency');
  const margin = assertRange(x.margin, 0, 1, 'margin', 'Ageing and design margin');
  const vSys = assertRange(x.system_v, 1, 1500, 'system_v', 'System voltage');
  const vBat = assertRange(x.battery_v, 1, 1500, 'battery_v', 'Voltage of one battery');
  const ahBat = assertRange(x.battery_ah, 0.1, 1e5, 'battery_ah', 'Capacity of one battery');
  let kT = 1;
  if (x.derating === 'table') {
    if (!chem.lead) throw new Error('Temperature derating: the IEEE 485 table applies to lead-acid batteries; for this battery choose "Capacity factor from the data sheet".');
    const t = assertRange(x.temp_c, -3.9, 51.7, 'temp_c', 'Lowest battery temperature (IEEE 485 table, °C)');
    const k = ieee485Factor(t);
    if (k === null) throw new Error('Lowest battery temperature: outside the IEEE 485 table, −3.9 to 51.7 °C (25 to 125 °F).');
    kT = Math.max(1, k);
  } else if (x.derating === 'factor') {
    kT = 1 / assertRange(x.capacity_factor, 0.3, 1, 'capacity_factor', 'Capacity available at the battery temperature');
  }
  const ratio = vSys / vBat;
  const series = Math.round(ratio);
  if (series < 1 || Math.abs(ratio - series) > 1e-6 * ratio) throw new Error('System voltage: it must be a whole multiple of the voltage of one battery (for example 24 V from two 12 V batteries).');

  const bankEnergy = (daily * days) / eta;
  const requiredWh = (bankEnergy * kT * (1 + margin)) / dod;
  const requiredAh = requiredWh / vSys;
  const parallel = Math.max(1, Math.ceil(requiredAh / ahBat - 1e-9));
  const total = series * parallel;
  const bankAh = parallel * ahBat;
  const bankWh = bankAh * vSys;
  const usable = (bankWh * dod) / kT;
  const warnings = [];
  if (parallel > 4) warnings.push('Many strings in parallel share the current unevenly and are hard to balance; consider larger batteries or a higher system voltage.');
  if (x.chemistry === 'custom' && dod > 0.9) warnings.push('A depth of discharge above 90 % shortens the life of most batteries; check the cycle-life curve on the data sheet.');
  if (x.derating === 'table' && x.temp_c < 0) warnings.push('Below 0 °C a partly discharged lead-acid battery can freeze; keep it charged or insulated.');
  const n = (v) => Number(v.toPrecision(6));
  return {
    outputs: {
      bank_energy_wh: bankEnergy,
      temp_factor: kT,
      required_wh: requiredWh,
      required_ah: requiredAh,
      series,
      parallel,
      total,
      bank: `${series} in series × ${parallel} in parallel = ${total} batteries of ${n(vBat)} V ${n(ahBat)} Ah: ${n(vSys)} V, ${n(bankAh)} Ah`,
      bank_ah: bankAh,
      bank_wh: bankWh,
      usable_wh: usable,
      actual_days: (usable * eta) / daily,
    },
    warnings,
  };
}
