/**
 * shared/eseries.js — the preferred number series for resistors and capacitors (IEC 60063:2015): E6, E12, E24, E96,
 * with the nearest standard value and the next one above or below. DOM-free.
 */

// Mantissas of one decade, IEC 60063:2015 Tables 1 and 2. E3 to E24 have two significant digits, E48 to E192 three.
export const E_SERIES = {
  E6: [1.0, 1.5, 2.2, 3.3, 4.7, 6.8],
  E12: [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2],
  E24: [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1],
  E96: [1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.30, 1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58,
    1.62, 1.65, 1.69, 1.74, 1.78, 1.82, 1.87, 1.91, 1.96, 2.00, 2.05, 2.10, 2.15, 2.21, 2.26, 2.32, 2.37, 2.43, 2.49, 2.55,
    2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09, 3.16, 3.24, 3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12,
    4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49, 5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65,
    6.81, 6.98, 7.15, 7.32, 7.50, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76],
};

// Usual tolerance of each series (IEC 60063 clause 4).
export const E_TOLERANCE = { E6: 0.2, E12: 0.1, E24: 0.05, E96: 0.01 };

/** Standard values of a series in the decades around `value`, ascending. */
export function standardValuesAround(value, series = 'E24') {
  const mantissas = E_SERIES[series];
  if (!mantissas) throw new Error(`Unknown E series "${series}"`);
  if (!(value > 0) || !Number.isFinite(value)) throw new Error(`A standard value needs a positive number (got ${value})`);
  const decade = Math.floor(Math.log10(value));
  const digits = series === 'E96' ? 3 : 2;
  const out = [];
  for (let d = decade - 1; d <= decade + 1; d += 1) for (const m of mantissas) out.push(Number((m * 10 ** d).toPrecision(digits)));
  return out;
}

/** Nearest standard value on a logarithmic scale, which is how the series are spaced. */
export function nearestStandard(value, series = 'E24') {
  return standardValuesAround(value, series).reduce((best, c) => (Math.abs(Math.log(c / value)) < Math.abs(Math.log(best / value)) ? c : best));
}

/** Smallest standard value at or above `value`. */
export function standardAtOrAbove(value, series = 'E24') {
  return standardValuesAround(value, series).find((c) => c >= value * (1 - 1e-9));
}

/** Largest standard value at or below `value`. */
export function standardAtOrBelow(value, series = 'E24') {
  return standardValuesAround(value, series).reverse().find((c) => c <= value * (1 + 1e-9));
}

/** The smallest series (E6, E12, E24, E96) that contains `value` exactly, or null. */
export function seriesOf(value) {
  for (const series of ['E6', 'E12', 'E24', 'E96']) {
    if (standardValuesAround(value, series).some((c) => Math.abs(c / value - 1) < 1e-9)) return series;
  }
  return null;
}

// SI prefixes used on component markings. "R" is the decimal point in resistor notation (2R2 = 2.2 Ω).
const PREFIX = { p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, m: 1e-3, R: 1, r: 1, k: 1e3, K: 1e3, M: 1e6, G: 1e9 };

/**
 * Component values from free text, one or more per line, separated by spaces, commas, semicolons or tabs. Accepts
 * plain numbers (multiplied by `plainFactor`), prefixed values (4.7k, 100n, 10u) and the marking notation with the
 * prefix as the decimal point (4k7, 2R2, 4u7, 1M5). A unit symbol after the value (Ω, ohm, F) is ignored. Lines
 * starting with # are comments. Returns the values in base units; throws on anything it cannot read.
 */
export function parseComponentValues(text, plainFactor = 1) {
  const values = [];
  for (const line of String(text).split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) continue;
    for (const token of clean.split(/[\s,;\t]+/).filter(Boolean)) {
      const t = token.replace(/(Ω|ohms?|F)$/i, '');
      let m = t.match(/^(\d+(?:\.\d+)?)$/);
      if (m) { values.push(Number(m[1]) * plainFactor); continue; }
      m = t.match(/^(\d+(?:\.\d+)?)([pnuµμmRrkKMG])$/);
      if (m) { values.push(Number(m[1]) * PREFIX[m[2]]); continue; }
      m = t.match(/^(\d+)([pnuµμmRrkKMG])(\d+)$/);
      if (m) { values.push(Number(`${m[1]}.${m[3]}`) * PREFIX[m[2]]); continue; }
      throw new Error(`Values: "${token}" is not a component value (examples: 470, 4.7k, 4k7, 2R2, 100n, 4u7)`);
    }
  }
  return values;
}

/** A value with its SI prefix, four significant digits at most, no prefix below `smallest`: 4700 → "4.7 kΩ", 1e-7 → "100 nF". */
export function formatWithPrefix(value, unit, smallest = 1e-12) {
  const steps = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']].filter(([f]) => f >= smallest);
  const [factor, prefix] = steps.find(([f]) => Math.abs(value) >= f * (1 - 1e-12)) ?? steps.at(-1);
  return `${Number((value / factor).toPrecision(4))} ${prefix}${unit}`;
}

/** Resistance with its prefix: 4700 → "4.7 kΩ". */
export const formatOhms = (value) => formatWithPrefix(value, 'Ω', 1);
