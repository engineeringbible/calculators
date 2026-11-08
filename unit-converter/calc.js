/**
 * unit-converter/calc.js — convert a value between any two units of a quantity, using the shared unit table.
 *
 * The unit lists are generated from shared/units.js, so adding a unit there makes it available here automatically.
 */
import { UNIT_GROUPS, convert, getUnit } from '../shared/units.js';
import { withDefaults, assertFinite, assertOneOf } from '../shared/validate.js';

/** Groups offered for conversion: every group with more than one unit. */
export const CONVERTIBLE_GROUPS = Object.fromEntries(Object.entries(UNIT_GROUPS).filter(([, group]) => Object.keys(group.units).length > 1));

const UNIT_OPTIONS = Object.fromEntries(
  Object.entries(CONVERTIBLE_GROUPS).map(([groupId, group]) => [groupId, Object.entries(group.units).map(([unitId, unit]) => ({ value: unitId, label: `${unit.label} — ${unit.name}` }))]),
);

const SIGNIFICANT_DIGITS = 7;

export const schema = {
  id: 'unit-converter',
  name: 'Engineering unit converter',
  category: 'general',
  summary: 'Convert pressure, torque, power, flow, length, mass, speed, temperature, energy and marine units (knots, nautical miles, long tons) from one table.',
  related: ['fuel-voyage-cost', 'pipe-flow', 'beam-deflection', 'cable-sizing'],
  notes: [
    'Verification 2026-10-30: a round-trip identity test covers every unit pair of every convertible group, and spot values are checked against NIST SP 811 Appendix B.',
    'Design decision: the unit lists are generated from shared/units.js at load time, so a unit added there appears here without any change to this calculator; single-unit groups (dimensionless, money, carbon intensity) are excluded.',
    'Design decision: the renderer gained dependent selects (optionsBy) for this calculator — the quantity choice drives the unit lists.',
  ],
  assumptions: [
    'All factors come from shared/units.js, the single conversion table used by every calculator; exact definitions are used where they exist (1 nmi = 1852 m, 1 in = 25.4 mm, 1 lb = 0.45359237 kg, 1 hp = 550 ft·lbf/s = 745.69987 W, 1 PS = 75 kgf·m/s = 735.49875 W, 1 Btu(IT) = 1055.05585 J, 1 kcal = 4184 J thermochemical).',
    'Temperature converts with offsets (°C, °F, K); the separate "temperature difference" group converts intervals, where 1 K = 1 °C = 1.8 °F without offset.',
    'Currency units are placeholders with factor 1 and are not offered for conversion; no exchange rates.',
    'Horsepower means mechanical horsepower (550 ft·lbf/s); metric horsepower is listed separately as PS. Calories are thermochemical (4.184 J); Btu is the International Table Btu.',
    'Results are shown to seven significant digits; intermediate conversions through the base unit can introduce rounding in the last digit for chained non-exact factors.',
    'Gallons must be chosen explicitly as US or imperial; "ton" exists as tonne (1000 kg), long ton (2240 lb) and short ton (2000 lb).',
  ],
  sources: [
    'NIST Special Publication 811 (2008), Guide for the Use of the SI, Appendix B (conversion factors)',
    'BIPM, The International System of Units (SI Brochure), 9th ed. (2019), Table 8 (non-SI units accepted for use)',
    'IEEE/ASTM SI 10-2016, American National Standard for Metric Practice',
    'International Hydrographic Conference 1929 (nautical mile = 1852 m); 1959 international yard and pound agreement',
  ],
  inputs: [
    { id: 'quantity', label: 'Quantity', type: 'select', default: 'speed', options: Object.entries(CONVERTIBLE_GROUPS).map(([value, group]) => ({ value, label: group.name })) },
    { id: 'value', label: 'Value', group: 'dimensionless', unit: 'none', default: 1, min: -1e30, max: 1e30 },
    { id: 'from_unit', label: 'From unit', type: 'select', default: 'kn', optionsBy: { field: 'quantity', options: UNIT_OPTIONS, defaultIndex: 1 } },
    { id: 'to_unit', label: 'To unit', type: 'select', default: 'm_s', optionsBy: { field: 'quantity', options: UNIT_OPTIONS, defaultIndex: 0 } },
  ],
  outputs: [
    { id: 'result_value', label: 'Converted value', group: 'dimensionless', unit: 'none' },
    { id: 'result_text', label: 'Conversion', type: 'text' },
    { id: 'factor', label: 'Factor (1 from-unit in to-units; not defined for temperature)', group: 'dimensionless', unit: 'none' },
    { id: 'all_units', label: 'The same value in every unit of the quantity', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      quantity: 'volume_flow',
      value: 440,
      from_unit: 'gpm_us',
      to_unit: 'm3_h',
    },
    results: {
      result_value: '99.9',
    },
  },
};

function formatSignificant(value) {
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return '0';
  const rounded = Number(value.toPrecision(SIGNIFICANT_DIGITS));
  return Math.abs(rounded) >= 1e15 || Math.abs(rounded) < 1e-6 ? rounded.toExponential(SIGNIFICANT_DIGITS - 1) : String(rounded);
}

/** Convert `value` between two units of a group; thin wrapper so the converter's logic is reusable. */
export function convertValue(groupId, value, fromUnitId, toUnitId) {
  return convert(value, fromUnitId, toUnitId, groupId);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.quantity, Object.keys(CONVERTIBLE_GROUPS), 'quantity', 'Quantity');
  assertFinite(i.value, 'value', 'Value');
  const group = CONVERTIBLE_GROUPS[i.quantity];
  assertOneOf(i.from_unit, Object.keys(group.units), 'from_unit', 'From unit');
  assertOneOf(i.to_unit, Object.keys(group.units), 'to_unit', 'To unit');

  const result = convertValue(i.quantity, i.value, i.from_unit, i.to_unit);
  const fromLabel = getUnit(i.quantity, i.from_unit).label;
  const toLabel = getUnit(i.quantity, i.to_unit).label;
  const hasOffset = Object.values(group.units).some((unit) => unit.offset);
  const factor = hasOffset ? null : convertValue(i.quantity, 1, i.from_unit, i.to_unit);
  const allUnits = Object.entries(group.units)
    .map(([unitId, unit]) => `${formatSignificant(convertValue(i.quantity, i.value, i.from_unit, unitId))} ${unit.label}`)
    .join('\n');

  const warnings = [];
  if (i.quantity === 'temperature' && result < -273.15 + 1e-9 && i.to_unit === 'C') warnings.push('Below absolute zero — check the input.');
  if (i.quantity === 'temperature') warnings.push('This converts temperature levels with offsets; for a temperature difference or tolerance use the "Temperature difference" quantity.');

  return {
    outputs: {
      result_value: result,
      result_text: `${formatSignificant(i.value)} ${fromLabel} = ${formatSignificant(result)} ${toLabel}`,
      factor,
      all_units: allUnits,
    },
    warnings,
  };
}
