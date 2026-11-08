/**
 * fuzz.js — robustness check of every calculator: calculate() runs with the defaults, every option of every select,
 * each numeric input at its limits and beyond them, broken text in the text areas, and random combinations inside the
 * input ranges (half of them spread around the defaults), from a fixed seed so that a finding can be reproduced.
 *
 *   node fuzz.js                       # every calculator in manifest.json, 300 random input sets each
 *   node fuzz.js pipe-flow tank-volume # one or more ids
 *   node fuzz.js --runs 1000 --seed 7  # more random sets, another seed
 *
 * A run may return results or reject the inputs with a plain Error whose message names the problem. Anything else is
 * a finding:
 *   crash     a TypeError, RangeError or other non-validation exception
 *   message   a rejection whose message shows NaN, undefined, Infinity or a JavaScript internal
 *   nan       a visible numeric output, table cell, text or warning that is NaN, undefined or of the wrong type
 *   infinite  an output that is ±Infinity (reported, not failed: some results are legitimately unbounded)
 *   integer   an input rejected as "not a whole number" although its schema lacks integer: true
 * The exit code is 1 when crash, message, nan or integer findings remain.
 */
import { readFile } from 'node:fs/promises';
import { seededRandom, normalDeviate } from './shared/stats.js';
import { isVisible } from './shared/features/core.js';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const k = args.indexOf(name);
  return k >= 0 ? Number(args[k + 1]) : fallback;
};
const RUNS = option('--runs', 300);
const SEED = option('--seed', 20261031);
const FULL = args.includes('--full');
const requested = args.filter((a, k) => !a.startsWith('--') && !(k > 0 && ['--runs', '--seed'].includes(args[k - 1])));
const FAILING = new Set(['crash', 'message', 'nan', 'integer']);
const BAD_TEXT = /NaN|undefined|\[object Object\]/;
const MAX_EXAMPLES = 3;

const manifest = JSON.parse(await readFile(new URL('./manifest.json', import.meta.url), 'utf8'));
const calculators = manifest.calculators.filter((c) => requested.length === 0 || requested.includes(c.id));
if (!calculators.length) {
  console.error(`No calculator matched ${requested.join(', ')}`);
  process.exit(1);
}

/** Random value for a numeric input inside its schema range (log-uniform over wide positive ranges). */
function randomValue(spec, random) {
  const def = Number(spec.default);
  const min = spec.min ?? (def > 0 ? def / 10 : def - 10 * Math.max(1, Math.abs(def)));
  const max = spec.max ?? (def > 0 ? def * 10 : def + 10 * Math.max(1, Math.abs(def)));
  const value = min > 0 && max / min > 100 ? Math.exp(Math.log(min) + random() * Math.log(max / min)) : min + random() * (max - min);
  return spec.integer ? Math.round(value) : value;
}

/** Options of a select for the current inputs: static, or those of `optionsBy` for its controlling select. */
const optionsOf = (spec, inputs) => (spec.optionsBy ? spec.optionsBy.options[inputs[spec.optionsBy.field]] || [] : spec.options);

/** Changes that set a select and move its dependent selects to their default option for the new value. */
function selectChange(schema, spec, value) {
  const changes = { [spec.id]: value };
  for (const dep of schema.inputs.filter((s) => s.optionsBy && s.optionsBy.field === spec.id)) {
    const choices = dep.optionsBy.options[value] || [];
    changes[dep.id] = (choices[dep.optionsBy.defaultIndex ?? 0] || choices[0] || {}).value;
  }
  return changes;
}

/** Input sets to try: label and the inputs that differ from the defaults. */
function* probes(schema, random) {
  const defaults = Object.fromEntries(schema.inputs.map((s) => [s.id, s.default]));
  yield ['defaults', {}];
  for (const spec of schema.inputs) {
    if (spec.type === 'select') {
      for (const o of optionsOf(spec, defaults)) yield [`${spec.id} = ${o.value}`, selectChange(schema, spec, o.value)];
    } else if (spec.type === 'textarea') {
      yield [`${spec.id} empty`, { [spec.id]: '' }];
      yield [`${spec.id} = "abc"`, { [spec.id]: 'abc' }];
      yield [`${spec.id} + bad line`, { [spec.id]: `${spec.default}\n1; x; ;` }];
    } else {
      const def = Number(spec.default);
      const values = [spec.min, spec.max, 0, -Math.abs(def || 1), spec.max !== undefined ? spec.max * 10 + 1 : def * 1e6, spec.min !== undefined ? spec.min - Math.abs((spec.max ?? def) - spec.min) - 1 : -1e6];
      for (const v of values) if (v !== undefined && Number.isFinite(v)) yield [`${spec.id} = ${v}`, { [spec.id]: v }];
    }
  }
  for (let k = 0; k < RUNS; k += 1) {
    const near = k % 2 === 1;
    const inputs = {};
    for (const spec of schema.inputs) {
      if (spec.type === 'select') {
        const choices = optionsOf(spec, { ...defaults, ...inputs });
        if (choices.length) inputs[spec.id] = choices[Math.floor(random() * choices.length)].value;
      } else if (!spec.type) inputs[spec.id] = near ? nearDefault(spec, random) : randomValue(spec, random);
    }
    yield [`${near ? 'near defaults' : 'random'} #${k + 1}`, inputs];
  }
}

/** Random value within ±50 % (one standard deviation, log-normal) of the default, kept inside the schema range. */
function nearDefault(spec, random) {
  const def = Number(spec.default);
  const span = (spec.max ?? def + 1) - (spec.min ?? def - 1);
  let value = def > 0 ? def * Math.exp(0.4 * normalDeviate(random)) : def + 0.1 * span * normalDeviate(random);
  if (spec.min !== undefined) value = Math.max(spec.min, value);
  if (spec.max !== undefined) value = Math.min(spec.max, value);
  return spec.integer ? Math.round(value) : value;
}

/** Findings for one run: [kind, detail] pairs. */
function check(schema, inputs, run) {
  const found = [];
  let result;
  try {
    result = run();
  } catch (error) {
    if (!(error instanceof Error)) return [['crash', `threw a non-Error: ${String(error)}`]];
    if (error.constructor !== Error) return [['crash', `${error.constructor.name}: ${error.message}`]];
    if (/NaN|undefined|Infinity|Cannot read|is not a function|is not defined|\[object/.test(error.message)) return [['message', error.message]];
    const integer = schema.inputs.find((s) => !s.type && !s.integer && error.message.includes('whole number') && error.message.startsWith(s.label || s.id));
    if (integer) return [['integer', `${integer.id} is validated as a whole number but has no integer: true`]];
    return [];
  }
  if (!result || typeof result !== 'object' || !result.outputs) return [['nan', 'calculate() returned no outputs object']];
  if (!Array.isArray(result.warnings)) found.push(['nan', 'warnings is not an array']);
  for (const w of result.warnings || []) {
    if (typeof w !== 'string') found.push(['nan', `warning of type ${typeof w}`]);
    else if (BAD_TEXT.test(w)) found.push(['nan', `warning: ${w.slice(0, 140)}`]);
    else if (/Infinity/.test(w)) found.push(['infinite', `warning: ${w.slice(0, 140)}`]);
  }
  for (const spec of schema.outputs) {
    if (!isVisible(spec, inputs)) continue;
    const value = result.outputs[spec.id];
    if (spec.type === 'text') {
      if (value === undefined) found.push(['nan', `${spec.id} missing`]);
      else if (value !== null && BAD_TEXT.test(String(value))) found.push(['nan', `${spec.id}: ${String(value).slice(0, 140)}`]);
      else if (/Infinity/.test(String(value))) found.push(['infinite', `${spec.id}: ${String(value).slice(0, 140)}`]);
    } else if (spec.type === 'chart') {
      if (value === undefined) found.push(['nan', `${spec.id} missing`]);
      else if (value !== null) {
        if (!Array.isArray(value.points)) found.push(['nan', `${spec.id} is not { points }`]);
        else value.points.forEach((p, k) => { if (!Number.isFinite(p.x) || (p.y !== null && !Number.isFinite(p.y))) found.push(['nan', `${spec.id} point ${k + 1} is not finite`]); });
      }
    } else if (spec.type === 'table') {
      if (value === undefined) found.push(['nan', `${spec.id} missing`]);
      else if (value !== null) {
        if (!Array.isArray(value.columns) || !Array.isArray(value.rows)) found.push(['nan', `${spec.id} is not { columns, rows }`]);
        else {
          value.rows.forEach((row, r) => {
            if (!Array.isArray(row) || row.length !== value.columns.length) found.push(['nan', `${spec.id} row ${r + 1} has ${Array.isArray(row) ? row.length : 'no'} cells for ${value.columns.length} columns`]);
            else row.forEach((cell, c) => {
              if (typeof cell === 'number' && Number.isNaN(cell)) found.push(['nan', `${spec.id} row ${r + 1} "${value.columns[c]}" is NaN`]);
              else if (typeof cell === 'number' && !Number.isFinite(cell)) found.push(['infinite', `${spec.id} row ${r + 1} "${value.columns[c]}" is ${cell}`]);
              else if (cell === undefined || (typeof cell === 'string' && BAD_TEXT.test(cell))) found.push(['nan', `${spec.id} row ${r + 1} "${value.columns[c]}": ${String(cell)}`]);
            });
          });
        }
      }
    } else if (value === undefined) found.push(['nan', `${spec.id} missing`]);
    else if (value !== null && typeof value !== 'number') found.push(['nan', `${spec.id} is a ${typeof value}`]);
    else if (typeof value === 'number' && Number.isNaN(value)) found.push(['nan', `${spec.id} is NaN`]);
    else if (typeof value === 'number' && !Number.isFinite(value)) found.push(['infinite', `${spec.id} is ${value}`]);
  }
  return found;
}

let failing = 0;
let infinite = 0;
let totalRuns = 0;
for (const calc of calculators) {
  const { schema, calculate } = await import(new URL(`./${calc.id}/calc.js`, import.meta.url));
  const random = seededRandom(SEED);
  const findings = new Map();
  let runs = 0;
  let rejected = 0;
  for (const [label, changes] of probes(schema, random)) {
    const inputs = { ...Object.fromEntries(schema.inputs.map((s) => [s.id, s.default])), ...changes };
    let threw = false;
    const found = check(schema, inputs, () => {
      try {
        return calculate(inputs);
      } catch (error) {
        threw = true;
        throw error;
      }
    });
    runs += 1;
    if (threw && !found.length) rejected += 1;
    for (const [kind, detail] of found) {
      const key = `${kind}|${detail.replace(/-?\d[\d.e+-]*/g, '#')}`;
      const entry = findings.get(key) || { kind, detail, count: 0, examples: [] };
      entry.count += 1;
      if (entry.examples.length < MAX_EXAMPLES) entry.examples.push({ label, changes });
      findings.set(key, entry);
    }
  }
  totalRuns += runs;
  const list = [...findings.values()];
  const bad = list.filter((f) => FAILING.has(f.kind));
  failing += bad.length;
  infinite += list.length - bad.length;
  const tag = bad.length ? 'FAIL' : list.length ? 'note' : 'ok  ';
  console.log(`${tag}  ${calc.id}: ${runs} runs, ${rejected} rejected${list.length ? `, ${list.length} finding(s)` : ''}`);
  for (const f of list) {
    console.log(`        [${f.kind}] ${f.detail} (${f.count}×)`);
    for (const e of f.examples) console.log(`            ${e.label}: ${FULL ? JSON.stringify(e.changes) : JSON.stringify(e.changes).slice(0, 300)}`);
  }
}
console.log(`\n${totalRuns} runs over ${calculators.length} calculator(s): ${failing} failing finding(s), ${infinite} infinite-value note(s) (seed ${SEED}, ${RUNS} random sets each)`);
process.exitCode = failing > 0 ? 1 : 0;
