/**
 * resistor-color-code/calc.js — resistance, tolerance and temperature coefficient from the colour bands of a 4, 5 or
 * 6-band resistor (IEC 60062), and the bands for a given value.
 *
 * 4 bands: d1 d2 × multiplier, tolerance;  5 bands: d1 d2 d3 × multiplier, tolerance;  6 bands: as 5 plus tempco.
 * Schema units: SI — Ω; tolerance as a fraction; temperature coefficient in ppm/K.
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';
import { seriesOf, formatOhms } from '../shared/eseries.js';

export { formatOhms };

// IEC 60062:2016 clause 4 colour code. Digits and multipliers are universal; the tolerances and temperature
// coefficients listed are those the standard and the major makers (Vishay, Yageo) agree on.
export const DIGITS = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
export const MULTIPLIERS = { silver: -2, gold: -1, black: 0, brown: 1, red: 2, orange: 3, yellow: 4, green: 5, blue: 6, violet: 7, grey: 8, white: 9 };
export const TOLERANCES = { brown: 0.01, red: 0.02, green: 0.005, blue: 0.0025, violet: 0.001, gold: 0.05, silver: 0.1, none: 0.2 };
export const TEMPCO_PPM = { black: 250, brown: 100, red: 50, orange: 15, yellow: 25, green: 20, blue: 10, violet: 5, grey: 1 };

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const digitOptions = DIGITS.map((c, i) => ({ value: c, label: `${cap(c)} (${i})` }));
const multOptions = Object.entries(MULTIPLIERS).map(([c, e]) => ({ value: c, label: `${cap(c)} (× 10${e < 0 ? '⁻' : ''}${String(Math.abs(e)).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])})` }));
const tolOptions = Object.entries(TOLERANCES).map(([c, t]) => ({ value: c, label: `${c === 'none' ? 'No band' : cap(c)} (± ${t * 100} %)` }));
const tcOptions = Object.entries(TEMPCO_PPM).map(([c, t]) => ({ value: c, label: `${cap(c)} (${t} ppm/K)` }));

export const schema = {
  id: 'resistor-color-code',
  name: 'Resistor colour code',
  category: 'electrical',
  summary: 'Resistance, tolerance and temperature coefficient from the colour bands of a 4, 5 or 6-band resistor, and the colour bands for any value.',
  related: ['ohms-law', 'voltage-divider', 'led-resistor', 'resistors-series-parallel'],
  assumptions: [
    'Colours follow IEC 60062:2016: ten digit colours from black (0) to white (9), multipliers from silver (× 0.01) to white (× 10⁹), and the tolerance and temperature-coefficient colours that the standard and the major makers agree on.',
    'Four-band resistors carry two significant digits, five- and six-band resistors three; a value with more significant digits than the bands allow is rounded and flagged.',
    'The band order is read from the end with the bands grouped closer together; the tolerance band is usually set apart, and gold or silver never appears as the first band.',
    'The tolerance is the manufacturing tolerance at 25 °C; the temperature coefficient adds a drift of its value in ppm per kelvin away from that.',
  ],
  notes: [
    'Verification 2026-11-07: yellow, violet, red, gold reads 4.7 kΩ ± 5 % (4.465 to 4.935 kΩ); brown, black, black, brown, brown reads 1 kΩ ± 1 %; encoding 4.7 kΩ in four bands returns yellow, violet, red. All checked against IEC 60062 tables.',
    'Design decision: tolerance colours with conflicting meanings between editions of the standard (orange, yellow, grey) are not offered, so a reading is never silently wrong.',
  ],
  sources: [
    'IEC 60062:2016 Marking codes for resistors and capacitors, clause 4 (colour code) and Tables 1–3',
    'IEC 60063:2015 Preferred number series for resistors and capacitors (to name the series a value belongs to)',
    'Vishay and Yageo through-hole resistor data sheets (colour coding, temperature coefficient bands)',
  ],
  inputs: [
    { id: 'mode', label: 'Task', type: 'select', default: 'decode', options: [{ value: 'decode', label: 'Read the bands' }, { value: 'encode', label: 'Find the bands for a value' }] },
    { id: 'bands', label: 'Number of bands', type: 'select', default: '4', options: [{ value: '4', label: '4 bands (2 digits)' }, { value: '5', label: '5 bands (3 digits)' }, { value: '6', label: '6 bands (3 digits and temperature coefficient)' }] },
    { id: 'band1', label: 'Band 1, first digit', type: 'select', default: 'yellow', options: digitOptions.filter((o) => o.value !== 'black'), visibleWhen: { mode: 'decode' } },
    { id: 'band2', label: 'Band 2, second digit', type: 'select', default: 'violet', options: digitOptions, visibleWhen: { mode: 'decode' } },
    { id: 'band3', label: 'Band 3, third digit', type: 'select', default: 'black', options: digitOptions, visibleWhen: { mode: 'decode', bands: ['5', '6'] } },
    { id: 'multiplier', label: 'Multiplier band', type: 'select', default: 'red', options: multOptions, visibleWhen: { mode: 'decode' } },
    { id: 'tolerance', label: 'Tolerance band', type: 'select', default: 'gold', options: tolOptions },
    { id: 'tempco', label: 'Temperature coefficient band', type: 'select', default: 'brown', options: tcOptions, visibleWhen: { mode: 'decode', bands: '6' } },
    { id: 'resistance_ohm', label: 'Resistance to mark', group: 'resistance', unit: 'ohm', display: 'kohm', default: 4700, min: 0.01, max: 1e10, visibleWhen: { mode: 'encode' } },
  ],
  outputs: [
    { id: 'resistance_out_ohm', label: 'Resistance', group: 'resistance', unit: 'ohm', display: 'kohm' },
    { id: 'label', label: 'Marking', type: 'text' },
    { id: 'colours', label: 'Colour bands, in order', type: 'text' },
    { id: 'tolerance_out', label: 'Tolerance', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 'min_ohm', label: 'Lowest value within tolerance', group: 'resistance', unit: 'ohm', display: 'kohm' },
    { id: 'max_ohm', label: 'Highest value within tolerance', group: 'resistance', unit: 'ohm', display: 'kohm' },
    { id: 'tempco_ppm', label: 'Temperature coefficient (ppm/K)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'series', label: 'Standard series', type: 'text' },
  ],
  example: {
    inputs: { mode: 'decode', bands: '4', band1: 'yellow', band2: 'violet', multiplier: 'red', tolerance: 'gold' },
    results: {
      resistance_out_ohm: '4.7 kΩ',
      min_ohm: '4.465 kΩ',
      max_ohm: '4.935 kΩ',
    },
  },
};

/** Bands for a value: the significant digits, the multiplier colour, and the value they represent. */
export function encode(value, digits) {
  let exponent = Math.floor(Math.log10(value)) - (digits - 1);
  let mantissa = Math.round(value / 10 ** exponent);
  if (mantissa >= 10 ** digits) { mantissa /= 10; exponent += 1; }
  const multiplier = Object.entries(MULTIPLIERS).find(([, e]) => e === exponent)?.[0];
  if (!multiplier) throw new Error(`Resistance cannot be marked with ${digits} digits and a standard multiplier (got ${value} Ω)`);
  const colours = String(mantissa).padStart(digits, '0').split('').map((d) => DIGITS[Number(d)]);
  return { colours: [...colours, multiplier], value: mantissa * 10 ** exponent };
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['decode', 'encode'], 'mode', 'Task');
  assertOneOf(String(x.bands), ['4', '5', '6'], 'bands', 'Number of bands');
  assertOneOf(x.tolerance, Object.keys(TOLERANCES), 'tolerance', 'Tolerance band');
  const bands = Number(x.bands);
  const digits = bands === 4 ? 2 : 3;
  if (x.tolerance === 'none' && bands !== 4) throw new Error('Tolerance band: only 4-band resistors may have no tolerance band (± 20 %)');
  const tolerance = TOLERANCES[x.tolerance];
  const warnings = [];
  let value;
  let colours;
  let tempco = null;
  if (x.mode === 'decode') {
    assertOneOf(x.band1, DIGITS.slice(1), 'band1', 'Band 1');
    assertOneOf(x.band2, DIGITS, 'band2', 'Band 2');
    assertOneOf(x.multiplier, Object.keys(MULTIPLIERS), 'multiplier', 'Multiplier band');
    const digitBands = digits === 2 ? [x.band1, x.band2] : [x.band1, x.band2, assertOneOf(x.band3, DIGITS, 'band3', 'Band 3')];
    const mantissa = Number(digitBands.map((c) => DIGITS.indexOf(c)).join(''));
    value = Number((mantissa * 10 ** MULTIPLIERS[x.multiplier]).toPrecision(6));
    colours = [...digitBands, x.multiplier];
    if (bands === 6) tempco = TEMPCO_PPM[assertOneOf(x.tempco, Object.keys(TEMPCO_PPM), 'tempco', 'Temperature coefficient band')];
  } else {
    const wanted = assertPositive(x.resistance_ohm, 'resistance_ohm', 'Resistance to mark');
    const encoded = encode(wanted, digits);
    value = encoded.value;
    colours = encoded.colours;
    if (Math.abs(value / wanted - 1) > 1e-9) warnings.push(`This value needs more significant digits than ${bands} bands carry; the bands mark ${formatOhms(value)} instead.`);
    if (bands === 6) tempco = TEMPCO_PPM[x.tempco] ?? null;
  }
  const allColours = [...colours, x.tolerance === 'none' ? null : x.tolerance, bands === 6 ? x.tempco : null].filter(Boolean);
  const series = seriesOf(value);
  if (!series) warnings.push('This is not a standard E6 to E96 value; check the reading, or the part may be special.');
  return {
    outputs: {
      resistance_out_ohm: value,
      label: `${formatOhms(value)} ± ${Number((tolerance * 100).toPrecision(3))} %${tempco !== null ? `, ${tempco} ppm/K` : ''}`,
      colours: allColours.map(cap).join(', '),
      tolerance_out: tolerance,
      min_ohm: value * (1 - tolerance),
      max_ohm: value * (1 + tolerance),
      tempco_ppm: tempco,
      series: series ? `${series} (and any larger series)` : 'Not a standard value',
    },
    warnings,
  };
}
