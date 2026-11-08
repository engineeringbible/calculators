/**
 * enclosed-space-purge/calc.js — ventilation time for an enclosed space to reach the entry criteria for oxygen,
 * flammable gas and a toxic gas by dilution with fresh air, with a mixing factor for imperfect mixing.
 *
 * C(t) = C_fresh + (C_0 − C_fresh) e^(−Q t / (K V));  t = (K V / Q) ln((C_0 − C_fresh) / (C_target − C_fresh))
 * Schema units: m³, m³/h, % by volume, % LFL, ppm, minutes.
 */
import { withDefaults, assertPositive, assertRange, assertNonNegative } from '../shared/validate.js';

const O2_FRESH_PCT = 20.9;
const MAX_TABLE_ROWS = 30;
const TABLE_STEPS_MIN = [1, 2, 5, 10, 15, 20, 30, 60, 120, 240, 480];

export const schema = {
  id: 'enclosed-space-purge',
  name: 'Enclosed space purge time',
  category: 'maritime',
  summary: 'Ventilation time for a tank or enclosed space to reach the entry criteria for oxygen, flammable and toxic gas, by dilution with a mixing factor.',
  related: ['engine-room-ventilation', 'cargo-ventilation-dewpoint', 'co2-fire-system', 'tank-volume'],
  assumptions: [
    'Dilution ventilation of a stirred volume: fresh air at Q replaces the atmosphere, and each concentration moves exponentially from its initial value towards that of the supply air, C(t) = C_fresh + (C_0 − C_fresh) e^(−Q t/(K V)); oxygen rises towards 20.9 %, flammable and toxic gases fall towards zero (purge equation of the ACGIH Industrial Ventilation manual).',
    'Mixing factor K = 1 for perfect mixing; real spaces with structure, a single fan duct or short-circuiting flow need more air, and K of 3 to 10 is a matter of judgement. The ideal time with K = 1 is shown for comparison.',
    'No new gas is generated during ventilation (no cargo off-gassing, rusting or residues), and the fresh air contains no contaminant unless one is entered; displacement purging of stratified gas can be faster than dilution and is not modelled.',
    'Entry criteria of MSC.581(110) (2025), 7.4: steady readings of 20.9 % oxygen by volume, less than 0.5 % carbon dioxide, less than 1 % of the lower flammable limit, and less than 50 % of the occupational exposure limit of any toxic gas; the readings are taken with the ventilation stopped and after conditions have stabilised (7.6), at several levels.',
    'An oxygen meter cannot show 20.9 % before the atmosphere is practically all fresh air, which dilution only approaches; the oxygen target is therefore entered just below 20.9 %, and entry still requires the steady reading.',
  ],
  notes: [
    'Verification 2026-10-31: a 1200 m³ tank with 5000 m³/h of fresh air (V/Q = 14.4 min) and K = 3 needs 43.2 min × ln 29 = 145.5 min for oxygen from 18 % to 20.8 %, 43.2 × ln 10 = 99.5 min for 10 % LFL to 1 % and 43.2 × ln 4 = 59.9 min for 50 to 12.5 ppm; oxygen governs at 10.1 air changes.',
    'Design decision: the default toxic example is 50 % of a 25 ppm exposure limit; enter the limit of the gas actually expected.',
  ],
  sources: [
    'IMO, Resolution MSC.581(110) (2025), Revised recommendations for entering enclosed spaces aboard ships — 7.4 to 7.6',
    'ACGIH, Industrial Ventilation: A Manual of Recommended Practice for Design — dilution ventilation and the purge equation with mixing factor K',
    'O. Levenspiel, Chemical Reaction Engineering, 3rd ed., Wiley 1999, chapter 11 — washout of a stirred volume',
  ],
  inputs: [
    { id: 'space_volume_m3', label: 'Volume of the space', group: 'volume', unit: 'm3', default: 1200, min: 1, max: 200000 },
    { id: 'fan_flow_m3_h', label: 'Fresh air supplied', group: 'volume_flow', unit: 'm3_h', default: 5000, min: 1, max: 1000000 },
    { id: 'mixing_factor', label: 'Mixing factor K (1 = perfect mixing)', group: 'dimensionless', unit: 'none', default: 3, min: 1, max: 10 },
    { id: 'o2_initial_pct', label: 'Oxygen now', group: 'ratio', unit: 'pct', default: 18, min: 0, max: 25 },
    { id: 'o2_target_pct', label: 'Oxygen target (just below 20.9 %)', group: 'ratio', unit: 'pct', default: 20.8, min: 0, max: 25 },
    { id: 'lfl_initial_pct', label: 'Flammable gas now, % of LFL', group: 'ratio', unit: 'pct', default: 10, min: 0, max: 100 },
    { id: 'lfl_target_pct', label: 'Flammable gas target, % of LFL (criterion: below 1 %)', group: 'ratio', unit: 'pct', default: 1, min: 0, max: 100 },
    { id: 'toxic_initial_ppm', label: 'Toxic gas or CO₂ now', group: 'ratio', unit: 'ppm', default: 50, min: 0, max: 1000000 },
    { id: 'toxic_target_ppm', label: 'Toxic gas target (50 % of the OEL; CO₂ 5000 ppm)', group: 'ratio', unit: 'ppm', default: 12.5, min: 0, max: 1000000 },
    { id: 'toxic_fresh_ppm', label: 'Toxic gas in the supply air', group: 'ratio', unit: 'ppm', default: 0, min: 0, max: 1000000 },
  ],
  outputs: [
    { id: 'air_changes_per_h', label: 'Air changes per hour', group: 'dimensionless', unit: 'none' },
    { id: 'o2_time_min', label: 'Time for oxygen', group: 'time', unit: 'min' },
    { id: 'lfl_time_min', label: 'Time for flammable gas', group: 'time', unit: 'min' },
    { id: 'toxic_time_min', label: 'Time for the toxic gas', group: 'time', unit: 'min' },
    { id: 'purge_time_min', label: 'Ventilation time before testing', group: 'time', unit: 'min' },
    { id: 'air_changes', label: 'Air changes in that time', group: 'dimensionless', unit: 'none' },
    { id: 'ideal_time_min', label: 'Same with perfect mixing (K = 1)', group: 'time', unit: 'min' },
    { id: 'purge_table', label: 'Atmosphere during ventilation', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      o2_time_min: '145.5 min',
      lfl_time_min: '99.5 min',
      toxic_time_min: '59.9 min',
      purge_time_min: '145.5 min',
      air_changes: '10.1',
    },
  },
};

/**
 * Minutes for a concentration to meet its criterion by dilution: kind 'min' (at least the target, oxygen) or 'max'
 * (at most the target, contaminants); 0 if it already does.
 */
export function dilutionTime(c0, target, fresh, timeConstantMin, kind) {
  const meets = (c) => (kind === 'min' ? c >= target : c <= target);
  if (meets(c0)) return 0;
  if (!meets(fresh) || fresh === target) throw new Error(`the supply air (${fresh}) does not get past the target ${target}, so dilution cannot reach it`);
  return timeConstantMin * Math.log((c0 - fresh) / (target - fresh));
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.space_volume_m3, 'space_volume_m3', 'Volume of the space');
  assertPositive(i.fan_flow_m3_h, 'fan_flow_m3_h', 'Fresh air supplied');
  assertRange(i.mixing_factor, 1, 20, 'mixing_factor', 'Mixing factor');
  assertRange(i.o2_initial_pct, 0, 100, 'o2_initial_pct', 'Oxygen now');
  assertRange(i.o2_target_pct, 0, 100, 'o2_target_pct', 'Oxygen target');
  assertRange(i.lfl_initial_pct, 0, 1000, 'lfl_initial_pct', 'Flammable gas now');
  assertRange(i.lfl_target_pct, 0, 1000, 'lfl_target_pct', 'Flammable gas target');
  assertNonNegative(i.toxic_initial_ppm, 'toxic_initial_ppm', 'Toxic gas now');
  assertNonNegative(i.toxic_target_ppm, 'toxic_target_ppm', 'Toxic gas target');
  assertNonNegative(i.toxic_fresh_ppm, 'toxic_fresh_ppm', 'Toxic gas in the supply air');

  const nominal = (i.space_volume_m3 / i.fan_flow_m3_h) * 60;
  const tc = i.mixing_factor * nominal;
  const tracks = [
    { name: 'oxygen', c0: i.o2_initial_pct, target: i.o2_target_pct, fresh: O2_FRESH_PCT, kind: 'min' },
    { name: 'flammable gas', c0: i.lfl_initial_pct, target: i.lfl_target_pct, fresh: 0, kind: 'max' },
    { name: 'toxic gas', c0: i.toxic_initial_ppm, target: i.toxic_target_ppm, fresh: i.toxic_fresh_ppm, kind: 'max' },
  ];
  const times = tracks.map((t) => {
    try {
      return dilutionTime(t.c0, t.target, t.fresh, tc, t.kind);
    } catch (error) {
      throw new Error(`${t.name[0].toUpperCase()}${t.name.slice(1)}: ${error.message}`);
    }
  });
  const purge = Math.max(...times);
  const governing = tracks[times.indexOf(purge)].name;
  const at = (minutes) => [minutes, ...tracks.map((t) => t.fresh + (t.c0 - t.fresh) * Math.exp(-minutes / tc))];
  const step = TABLE_STEPS_MIN.find((s) => purge / s <= MAX_TABLE_ROWS - 2) ?? TABLE_STEPS_MIN[TABLE_STEPS_MIN.length - 1];
  const rows = [];
  for (let m = 0; m < purge; m += step) rows.push(at(m));
  rows.push(at(purge));

  const warnings = [];
  if (purge === 0) warnings.push('All entered values already meet their targets; test the atmosphere before entry.');
  if (i.mixing_factor < 2) warnings.push('A mixing factor below 2 assumes nearly perfect mixing, rarely achieved in tanks with internal structure.');
  if (i.o2_target_pct > O2_FRESH_PCT - 0.05) warnings.push('An oxygen target this close to 20.9 % takes many air changes; the steady 20.9 % reading on the meter is the criterion.');
  warnings.push('The time is an estimate: test at several levels with the ventilation stopped after conditions have stabilised, and keep ventilating while the space is occupied (MSC.581(110)).');

  return {
    outputs: {
      air_changes_per_h: i.fan_flow_m3_h / i.space_volume_m3,
      o2_time_min: times[0],
      lfl_time_min: times[1],
      toxic_time_min: times[2],
      purge_time_min: purge,
      air_changes: purge / nominal,
      ideal_time_min: purge / i.mixing_factor,
      purge_table: {
        columns: ['Time (min)', 'Oxygen (%)', 'Flammable gas (% LFL)', 'Toxic gas (ppm)'],
        rows,
      },
      summary: purge > 0
        ? `${i.fan_flow_m3_h} m³/h into ${i.space_volume_m3} m³ (${(i.fan_flow_m3_h / i.space_volume_m3).toFixed(1)} changes per hour) with K = ${i.mixing_factor}: ventilate for ${purge.toFixed(0)} min (${(purge / nominal).toFixed(1)} air changes), governed by ${governing}, then test before entry.`
        : 'The entered values already meet their targets; test the atmosphere before entry.',
    },
    warnings,
  };
}
