/**
 * shared/example.js — the worked example of a calculator's article (content.md) as data, and its check.
 *
 *   schema.example = {
 *     inputs:  { span_m: [4, 'm'], load_case: 'midspan' },      // [value, unit id] or a plain value in schema units;
 *                                                               // inputs not listed keep their defaults
 *     results: { m_max_nm: '10 kN·m', stress_pa: '51.5 MPa' },  // quoted from the article exactly as printed
 *   }
 *
 * "Load this example" puts the inputs into the page with the article's units and shows the results in the units of
 * the quotes. The check (a self-test of every calculator, and a build gate) requires each quote to appear in the
 * article's worked example and the calculator's output to round to it: within half a unit of the last printed decimal
 * (one unit when the quote is marked approximate with "≈", "~" or "about"), and for a whole number within half a unit
 * of its last significant digit, trailing zeros not counting (848 800 means 848 800 ± 50). A result may carry its own
 * tolerance: ['≈ 2 %', { rel: 0.05 }]. DOM-free.
 */
import { convert, getGroup } from './units.js';

const QUOTE = /^(≈|~|about )?\s*([−+-])?(\d{1,3}(?: \d{3})+|\d+)(?:\.(\d+))?\s*(.*)$/;

/** Read a quoted result: "≈ 106 700" → value 106 700, approximate, 0 decimals, 2 trailing zeros; "51.5 MPa" → 51.5 and "MPa". */
export function parseQuote(text) {
  const match = String(text).trim().match(QUOTE);
  if (!match) throw new Error(`"${text}" is not a number with an optional unit`);
  const [, approx, sign, whole, fraction, label] = match;
  const digits = whole.replace(/ /g, '');
  return {
    value: Number(`${sign && sign !== '+' ? '-' : ''}${digits}${fraction ? `.${fraction}` : ''}`),
    approx: Boolean(approx),
    decimals: fraction ? fraction.length : 0,
    trailingZeros: fraction ? 0 : digits.length - digits.replace(/0+$/, '').length,
    label: label.trim(),
  };
}

/** Allowed difference between the calculated value and a quote, from the way the quote is rounded. */
export function quoteTolerance(quote, options = {}) {
  if (options.abs !== undefined) return options.abs;
  if (options.rel !== undefined) return options.rel * Math.abs(quote.value);
  // trailing zeros of a whole number are not significant (848 800 is 8 488 hundreds); "≈" widens a decimal to one unit
  const digits = String(Math.abs(Math.trunc(quote.value))).length;
  const step = quote.decimals
    ? (quote.approx ? 1 : 0.5) * 10 ** -quote.decimals
    : 0.5 * 10 ** Math.min(quote.trailingZeros, digits - 1);
  return step + 1e-9 * Math.abs(quote.value);
}

const entryOf = (entry) => (Array.isArray(entry) ? { text: entry[0], options: entry[1] || {} } : { text: entry, options: {} });
const unitByLabel = (group, label) => Object.entries(getGroup(group).units).find(([, unit]) => unit.label === label)?.[0];

/**
 * The page state of the example: inputs in schema units, and display units for the inputs given with a unit and for
 * every quoted result that names one. Throws on an unknown id or a unit that does not belong to the quantity.
 */
export function exampleState(schema) {
  const example = schema.example;
  if (!example) throw new Error(`${schema.id}: no example`);
  const inputs = {};
  const units = {};
  for (const [id, entry] of Object.entries(example.inputs || {})) {
    const spec = schema.inputs.find((i) => i.id === id);
    if (!spec) throw new Error(`${schema.id}: example input "${id}" is not an input`);
    if (Array.isArray(entry)) {
      const [value, unit] = entry;
      if (!spec.group || !getGroup(spec.group).units[unit]) throw new Error(`${schema.id}: example input "${id}" has unit "${unit}", which is not a unit of ${spec.group}`);
      inputs[id] = convert(value, unit, spec.unit, spec.group);
      units[id] = unit;
    } else {
      inputs[id] = entry;
    }
  }
  for (const [id, entry] of Object.entries(example.results || {})) {
    const spec = schema.outputs.find((o) => o.id === id);
    if (!spec || spec.type) throw new Error(`${schema.id}: example result "${id}" is not a numeric output`);
    const { label } = parseQuote(entryOf(entry).text);
    if (!label) continue;
    const unit = spec.group ? unitByLabel(spec.group, label) : null;
    if (!unit) throw new Error(`${schema.id}: example result "${id}" is quoted in "${label}", which is not a unit of ${spec.group || 'this result'}`);
    units[id] = unit;
  }
  return { inputs, units };
}

/** Text normalised for finding a quote: emphasis and code marks removed, runs of white space made one space. */
export const normaliseText = (text) => String(text).replace(/\*\*|[*`]/g, '').replace(/\s+/g, ' ');

/**
 * Whether a quote stands in the text as a whole: not part of a longer number ("−490" inside "−490.4") or of a longer
 * unit ("4.0 m" inside "4.0 m³" or "4.0 m/s").
 */
export function quoteIn(text, quote) {
  const escaped = normaliseText(quote).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}.])${escaped}(?=$|[\\s,;:!?)\\]′″]|\\.(?!\\d))`, 'u').test(normaliseText(text));
}

/** The "Worked example" section of a content.md (up to the next "##" heading). */
export function workedExampleText(markdown) {
  const text = String(markdown).replace(/\r\n?/g, '\n');
  const start = text.search(/^## Worked example/m);
  if (start < 0) return '';
  const rest = text.slice(start + 3);
  const end = rest.search(/^## /m);
  return end < 0 ? rest : rest.slice(0, end);
}

/**
 * Check the example: calculate with the defaults overridden by the example inputs and compare every quoted result.
 * With `articleText`, each quote must also appear in it. Returns the compared rows and the problems found.
 */
export function checkExample(schema, calculate, articleText = null) {
  const problems = [];
  const rows = [];
  let state;
  try {
    state = exampleState(schema);
  } catch (error) {
    return { rows, problems: [error.message] };
  }
  const inputs = Object.fromEntries(schema.inputs.map((i) => [i.id, i.default]));
  Object.assign(inputs, state.inputs);
  let outputs;
  try {
    outputs = calculate(inputs).outputs;
  } catch (error) {
    return { rows, problems: [`the example inputs do not calculate: ${error.message}`] };
  }
  for (const [id, entry] of Object.entries(schema.example.results || {})) {
    const { text, options } = entryOf(entry);
    const spec = schema.outputs.find((o) => o.id === id);
    const quote = parseQuote(text);
    const unit = state.units[id];
    const raw = outputs[id];
    const calculated = typeof raw === 'number' && unit ? convert(raw, spec.unit, unit, spec.group) : raw;
    const tolerance = quoteTolerance(quote, options);
    const ok = typeof calculated === 'number' && Number.isFinite(calculated) && Math.abs(calculated - quote.value) <= tolerance;
    rows.push({ id, label: spec.label, quote: text, calculated, ok });
    if (!ok) problems.push(`${spec.label}: the article says ${text}, the calculator gives ${typeof calculated === 'number' ? Number(calculated.toPrecision(8)) : calculated}${quote.label ? ` ${quote.label}` : ''}`);
    if (articleText !== null && !quoteIn(articleText, text)) problems.push(`${spec.label}: "${text}" does not appear as such in the worked example of content.md`);
  }
  if (!rows.length) problems.push('the example quotes no result');
  return { rows, problems };
}

/** The example as a self-test: { name, source, run } like the entries of a tests.js. */
export function exampleTest(schema, calculate, articleText = null) {
  const quotes = Object.values(schema.example.results || {}).map((entry) => entryOf(entry).text);
  return {
    name: `Worked example of the article: the calculator reproduces ${quotes.join(', ')} to the digits printed`,
    source: 'content.md, Worked example (the numbers as printed there)',
    run: () => {
      const { problems } = checkExample(schema, calculate, articleText);
      if (problems.length) throw new Error(problems.join('; '));
    },
  };
}
