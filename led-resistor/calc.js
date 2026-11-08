/**
 * led-resistor/calc.js — series resistor for one LED or a string of LEDs on a DC supply: exact value, the next
 * standard value above it, the current it actually gives, its power and the resistor rating to buy.
 *
 * R = (V_s − n V_f) / I;  P_R = I² R;  P_LED = n V_f I.
 * Schema units: SI — V, A, Ω, W.
 */
import { withDefaults, assertPositive, assertInteger, assertOneOf } from '../shared/validate.js';
import { standardAtOrAbove } from '../shared/eseries.js';

// Typical forward voltages at about 20 mA for standard indicator LEDs (manufacturer data sheets, e.g. Kingbright,
// Vishay and Cree families; the spread between makes is about ±0.2 V). Blue, true green and white are InGaN chips.
export const LED_COLOURS = {
  red: { label: 'Red (≈ 2.0 V)', vf: 2.0 },
  orange: { label: 'Orange or amber (≈ 2.1 V)', vf: 2.1 },
  yellow: { label: 'Yellow (≈ 2.1 V)', vf: 2.1 },
  green: { label: 'Yellow-green, standard (≈ 2.2 V)', vf: 2.2 },
  true_green: { label: 'True green (≈ 3.2 V)', vf: 3.2 },
  blue: { label: 'Blue (≈ 3.2 V)', vf: 3.2 },
  white: { label: 'White (≈ 3.2 V)', vf: 3.2 },
  infrared: { label: 'Infrared 850–940 nm (≈ 1.3 V)', vf: 1.3 },
  custom: { label: 'Custom forward voltage', vf: null },
};

// Resistor power ratings commonly stocked, W.
export const RATINGS_W = [0.125, 0.25, 0.5, 1, 2, 3, 5, 10];

export const schema = {
  id: 'led-resistor',
  name: 'LED series resistor',
  category: 'electrical',
  summary: 'Series resistor for an LED or a string of LEDs: exact value, next standard value, actual current, resistor power and the rating to buy.',
  related: ['ohms-law', 'voltage-divider', 'resistor-color-code', 'battery-runtime'],
  assumptions: [
    'The LED forward voltage is taken as constant at the design current; the built-in values are typical at about 20 mA, and the data sheet value of the actual part is better.',
    'The supply is a steady DC voltage; with a battery, design for its highest voltage so the current never exceeds the LED rating when the battery is fresh.',
    'The standard resistor is the next E-series value above the exact value, so the actual current is at or below the target.',
    'The resistor rating is chosen with a factor of two on its dissipation, so it runs well below its maximum temperature.',
    'All LEDs in a string carry the same current; parallel strings each need their own resistor.',
  ],
  notes: [
    'Verification 2026-11-07: 5 V and one white LED at 20 mA need 90 Ω exactly; the E24 value 91 Ω gives 19.8 mA and 36 mW, so a 1/8 W resistor is enough. Checked by hand.',
    'Design decision: the next value above, not the nearest, is chosen, because rounding down would push the LED above its rated current.',
  ],
  sources: [
    'Horowitz and Hill, The Art of Electronics, 3rd ed., §2.1.1 and §12.4 (LEDs and current limiting)',
    'Kingbright and Vishay indicator LED data sheets (typical forward voltage at 20 mA by colour)',
    'IEC 60063:2015 Preferred number series for resistors and capacitors (E12, E24)',
  ],
  inputs: [
    { id: 'supply_v', label: 'Supply voltage V_s', group: 'voltage', unit: 'V', default: 5, min: 0, max: 1000 },
    { id: 'led_colour', label: 'LED colour', type: 'select', default: 'white', options: Object.entries(LED_COLOURS).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'vf_v', label: 'Forward voltage per LED V_f', group: 'voltage', unit: 'V', default: 3.2, min: 0.5, max: 50, visibleWhen: { led_colour: 'custom' } },
    { id: 'current_a', label: 'LED current I', group: 'current', unit: 'A', display: 'mA', default: 0.02, min: 0, max: 10, help: 'Indicator LEDs: 5–20 mA. Check the data sheet maximum.' },
    { id: 'count', label: 'LEDs in series n', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 100 },
    { id: 'series', label: 'Standard values', type: 'select', default: 'E24', options: [{ value: 'E12', label: 'E12 (10 %)' }, { value: 'E24', label: 'E24 (5 %)' }] },
  ],
  outputs: [
    { id: 'r_exact_ohm', label: 'Exact resistor R = (V_s − n V_f) / I', group: 'resistance', unit: 'ohm' },
    { id: 'r_standard_ohm', label: 'Standard resistor (next value above)', group: 'resistance', unit: 'ohm' },
    { id: 'current_actual_a', label: 'Current with the standard resistor', group: 'current', unit: 'A', display: 'mA' },
    { id: 'p_resistor_w', label: 'Power in the resistor', group: 'power', unit: 'W' },
    { id: 'rating', label: 'Resistor rating to buy', type: 'text' },
    { id: 'p_leds_w', label: 'Power in the LEDs', group: 'power', unit: 'W' },
    { id: 'efficiency', label: 'Share of the supply power reaching the LEDs', group: 'ratio', unit: 'frac', display: 'pct' },
  ],
  example: {
    inputs: { supply_v: [5, 'V'], led_colour: 'white', current_a: [20, 'mA'], count: 1, series: 'E24' },
    results: {
      r_exact_ohm: '90 Ω',
      r_standard_ohm: '91 Ω',
      current_actual_a: '19.8 mA',
      p_resistor_w: '0.036 W',
    },
  },
};

export function ratingFor(powerW) {
  const needed = 2 * powerW;
  const rating = RATINGS_W.find((r) => r >= needed);
  if (!rating) return `More than ${RATINGS_W.at(-1)} W: use a constant-current driver instead of a resistor`;
  const names = { 0.125: '1/8 W', 0.25: '1/4 W', 0.5: '1/2 W' };
  return `${names[rating] ?? `${rating} W`} (twice the ${Number(powerW.toPrecision(2))} W dissipated is ${Number(needed.toPrecision(2))} W)`;
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.led_colour, Object.keys(LED_COLOURS), 'led_colour', 'LED colour');
  assertOneOf(x.series, ['E12', 'E24'], 'series', 'Standard values');
  const supply = assertPositive(x.supply_v, 'supply_v', 'Supply voltage');
  const current = assertPositive(x.current_a, 'current_a', 'LED current');
  const count = assertInteger(assertPositive(x.count, 'count', 'LEDs in series'), 'count', 'LEDs in series');
  const vf = x.led_colour === 'custom' ? assertPositive(x.vf_v, 'vf_v', 'Forward voltage') : LED_COLOURS[x.led_colour].vf;
  const headroom = supply - count * vf;
  if (headroom <= 0) throw new Error(`The supply must exceed the LEDs' total forward voltage (${count} × ${vf} V = ${Number((count * vf).toFixed(2))} V is not below ${supply} V)`);
  const exact = headroom / current;
  const standard = standardAtOrAbove(exact, x.series);
  const actual = headroom / standard;
  const pResistor = actual * actual * standard;
  const warnings = [];
  if (headroom < 1) warnings.push('Less than 1 V is left across the resistor, so small changes in supply or forward voltage swing the current a lot; use fewer LEDs in series or a higher supply.');
  if (current > 0.03) warnings.push('More than 30 mA is above the rating of most indicator LEDs; check the data sheet, and consider a constant-current driver for power LEDs.');
  return {
    outputs: {
      r_exact_ohm: exact,
      r_standard_ohm: standard,
      current_actual_a: actual,
      p_resistor_w: pResistor,
      rating: ratingFor(pResistor),
      p_leds_w: count * vf * actual,
      efficiency: (count * vf) / supply,
    },
    warnings,
  };
}
