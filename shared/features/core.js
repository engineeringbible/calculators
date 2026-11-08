/**
 * shared/features/core.js — the DOM-free logic behind the tools panel of every calculator page:
 *   permalink state (inputs and units in the URL), "send to" chaining between calculators, input sweeps and
 *   two-input grids, goal seek, one-at-a-time sensitivity (tornado), uncertainty propagation (linear and Monte
 *   Carlo), scenario comparison, batch CSV runs and the
 *   calculation record (JSON and Markdown).
 *
 * Every function works on (schema, calculate, inputs) with values in SCHEMA units, so Node can test it and the
 * browser panel only converts to and from the user's display units.
 */
import { convert, getGroup, unitLabel } from '../units.js';
import { seededRandom, normalDeviate, normalCdf, quantile, describe } from '../stats.js';
import { formatNumber } from '../format.js';

export const STATE_VERSION = '1';
export const RECORD_FORMAT = 'engineering-calculator-record';

// ---- schema helpers ---------------------------------------------------------------------------

/** visibleWhen: { field: value | [values] } — all conditions must hold. */
export function isVisible(spec, values) {
  if (!spec.visibleWhen) return true;
  return Object.entries(spec.visibleWhen).every(([fieldId, allowed]) => {
    const actual = values[fieldId];
    return Array.isArray(allowed) ? allowed.map(String).includes(String(actual)) : String(actual) === String(allowed);
  });
}

export const numericInputs = (schema) => schema.inputs.filter((i) => !i.type);
export const numericOutputs = (schema) => schema.outputs.filter((o) => !o.type);

export function defaultInputs(schema) {
  const values = {};
  for (const input of schema.inputs) values[input.id] = input.default;
  return values;
}

export function defaultUnits(schema) {
  const units = {};
  for (const spec of [...schema.inputs, ...schema.outputs]) if (!spec.type) units[spec.id] = spec.display || spec.unit;
  return units;
}

export function selectOptionValues(spec) {
  const list = spec.optionsBy ? Object.values(spec.optionsBy.options).flat() : spec.options || [];
  return [...new Set(list.map((o) => String(o.value)))];
}

/** Unit label of a spec in a given unit ('' for dimensionless). */
export function labelOf(spec, unitId) {
  return spec.type ? '' : unitLabel(spec.group, unitId || spec.unit) || '';
}

/** Run calculate() without throwing. */
export function evaluate(calculate, inputs) {
  try {
    return { ok: true, result: calculate(inputs) };
  } catch (error) {
    return { ok: false, error: error && error.message ? error.message : String(error) };
  }
}

const finite = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function sameValue(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a === b || Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
  return String(a) === String(b);
}

/** Validate raw values (from a URL, a record or a chain) against the schema: { inputs, ignored }. */
export function validateValues(schema, raw) {
  const inputs = {};
  const ignored = [];
  const byId = Object.fromEntries(schema.inputs.map((i) => [i.id, i]));
  for (const [id, value] of Object.entries(raw || {})) {
    const spec = byId[id];
    if (!spec) { ignored.push(id); continue; }
    if (spec.type === 'select') {
      if (selectOptionValues(spec).includes(String(value))) inputs[id] = String(value);
      else ignored.push(id);
    } else if (spec.type === 'textarea') {
      inputs[id] = String(value);
    } else {
      const n = typeof value === 'number' ? value : String(value).trim() === '' ? NaN : Number(value);
      if (Number.isFinite(n)) inputs[id] = n;
      else ignored.push(id);
    }
  }
  return { inputs, ignored };
}

// ---- permalink ---------------------------------------------------------------------------------

/**
 * Values reach the hash through number fields shown in the user's display unit (10 significant digits), so the
 * schema-unit value carries ~1e-10 conversion noise (13 kn shown in m/s comes back as 13.0000000004). Ten
 * significant digits is the precision the fields hold; rounding to it keeps links short and stable.
 */
const LINK_DIGITS = 10;
const compactNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? Number(value.toPrecision(LINK_DIGITS)) : value);

/**
 * Encode the inputs and display units that differ from the defaults into a URL hash string (without '#'):
 *   v=1 & i.<input id>=<value in schema units> & u.<input or output id>=<unit id> [& extras]
 * `keep` lists input ids written even when they equal the default (a chain link names everything it sends, so
 * the target page can list every value it received).
 */
export function encodeState(schema, { inputs = {}, units = {} } = {}, extras = {}, { keep = [] } = {}) {
  const params = new URLSearchParams();
  params.set('v', STATE_VERSION);
  for (const [key, value] of Object.entries(extras)) if (value !== undefined && value !== null) params.set(key, String(value));
  const defaults = defaultInputs(schema);
  for (const input of schema.inputs) {
    const value = compactNumber(inputs[input.id]);
    if (value === undefined || value === null || (typeof value === 'number' && !Number.isFinite(value))) continue;
    if (!keep.includes(input.id) && sameValue(value, compactNumber(defaults[input.id]))) continue;
    params.set(`i.${input.id}`, String(value));
  }
  const unitDefaults = defaultUnits(schema);
  for (const [id, unitId] of Object.entries(units)) {
    if (unitDefaults[id] === undefined || unitId === unitDefaults[id]) continue;
    params.set(`u.${id}`, unitId);
  }
  return params.toString();
}

/** Decode a URL hash into { inputs, units, from, ignored } — invalid entries are listed, never applied. */
export function decodeState(schema, hash) {
  const out = { inputs: {}, units: {}, from: null, ignored: [], version: null };
  const text = String(hash || '').replace(/^#/, '');
  if (!text) return out;
  const params = new URLSearchParams(text);
  out.version = params.get('v');
  out.from = params.get('from');
  const unitSpecs = Object.fromEntries([...schema.inputs, ...schema.outputs].filter((s) => !s.type).map((s) => [s.id, s]));
  const rawInputs = {};
  for (const [key, value] of params.entries()) {
    if (key === 'v' || key === 'from') continue;
    if (key.startsWith('i.')) rawInputs[key.slice(2)] = value;
    else if (key.startsWith('u.')) {
      const id = key.slice(2);
      const spec = unitSpecs[id];
      if (spec && getGroup(spec.group).units[value]) out.units[id] = value;
      else out.ignored.push(key);
    } else out.ignored.push(key);
  }
  const checked = validateValues(schema, rawInputs);
  out.inputs = checked.inputs;
  out.ignored.push(...checked.ignored.map((id) => `i.${id}`));
  return out;
}

// ---- chaining ("send to") ----------------------------------------------------------------------

function sourceRef(schema, from) {
  if (from.startsWith('input:')) return { kind: 'input', spec: schema.inputs.find((i) => i.id === from.slice(6)) };
  return { kind: 'output', spec: schema.outputs.find((o) => o.id === from) };
}

/**
 * Whether a sendTo entry applies to the current source inputs. `entry.when` uses the visibleWhen form
 * ({ <source input id>: value | [values] }); an entry whose condition fails is shown disabled with `whenNote`.
 */
export function chainAvailable(entry, sourceInputs) {
  return !entry.when || isVisible({ visibleWhen: entry.when }, sourceInputs);
}

function fillTemplate(template, sourceInputs, sourceOutputs) {
  return template.replace(/\{(input:)?([a-z0-9_]+)\}/g, (_, isInput, id) => {
    const value = isInput ? sourceInputs[id] : sourceOutputs[id];
    if (typeof value === 'number') return Number.isFinite(value) ? String(Number(value.toPrecision(6))) : '';
    return value === undefined || value === null ? '' : String(value);
  });
}

/**
 * Values to send to a target calculator for one sendTo entry, converted to the target's schema units.
 * @returns {{ inputs: object, sent: string[], skipped: string[] }}
 */
export function buildChainValues(sourceSchema, entry, sourceInputs, sourceOutputs, targetSchema) {
  const targetById = Object.fromEntries(targetSchema.inputs.map((i) => [i.id, i]));
  const inputs = {};
  const sent = [];
  const skipped = [];
  for (const link of entry.links) {
    const toId = link.to;
    const target = targetById[toId];
    let value;
    if ('value' in link) value = link.value;
    else if (link.template) value = fillTemplate(link.template, sourceInputs, sourceOutputs);
    else if (link.map) {
      const raw = String(sourceInputs[link.from.slice(6)]);
      if (!(raw in link.map)) {
        skipped.push(link.skipNote || `${target.label}: no equivalent for "${raw}"`);
        continue;
      }
      value = link.map[raw];
    } else {
      const { kind, spec } = sourceRef(sourceSchema, link.from);
      const raw = kind === 'input' ? sourceInputs[spec.id] : sourceOutputs[spec.id];
      if (raw === null || raw === undefined || (typeof raw === 'number' && !Number.isFinite(raw))) {
        skipped.push(`${target.label}: no value to send`);
        continue;
      }
      value = target.type || spec.type || link.raw ? raw : convert(raw, spec.unit, target.unit, spec.group);
    }
    inputs[toId] = value;
    sent.push(target.label);
  }
  return { inputs, sent: [...new Set(sent)], skipped };
}

/** Check one calculator's sendTo entries against the schemas of the whole library; returns error strings. */
export function validateSendTo(sourceSchema, schemasById) {
  const errors = [];
  for (const entry of sourceSchema.sendTo || []) {
    const where = `${sourceSchema.id} → ${entry.target}`;
    const target = schemasById[entry.target];
    if (!target) { errors.push(`${where}: unknown target calculator`); continue; }
    if (!entry.label) errors.push(`${where}: missing label`);
    if (!Array.isArray(entry.links) || !entry.links.length) { errors.push(`${where}: no links`); continue; }
    for (const [id, allowed] of Object.entries(entry.when || {})) {
      const controller = sourceSchema.inputs.find((i) => i.id === id);
      if (!controller) { errors.push(`${where}: "when" names an unknown input "${id}"`); continue; }
      if (controller.type === 'select') {
        for (const v of [].concat(allowed)) if (!selectOptionValues(controller).includes(String(v))) errors.push(`${where}: "when" value "${v}" is not an option of ${id}`);
      }
    }
    if (entry.when && !entry.whenNote) errors.push(`${where}: an entry with "when" needs a whenNote explaining when it is unavailable`);
    const targetById = Object.fromEntries(target.inputs.map((i) => [i.id, i]));
    for (const link of entry.links) {
      if (typeof link.to !== 'string') { errors.push(`${where}: a link needs "to": the id of a target input`); continue; }
      for (const toId of [link.to]) {
        const t = targetById[toId];
        if (!t) { errors.push(`${where}: target input "${toId}" does not exist`); continue; }
        if ('value' in link) {
          if (t.type === 'select' && !selectOptionValues(t).includes(String(link.value))) errors.push(`${where}: "${link.value}" is not an option of ${toId}`);
          if (!t.type && typeof link.value !== 'number') errors.push(`${where}: ${toId} needs a numeric value`);
          continue;
        }
        if (link.template) {
          if (t.type !== 'textarea') errors.push(`${where}: templates can only fill a textarea (${toId})`);
          continue;
        }
        if (link.map) {
          const controller = String(link.from || '').startsWith('input:') ? sourceSchema.inputs.find((i) => i.id === link.from.slice(6)) : null;
          if (!controller || controller.type !== 'select') { errors.push(`${where}: a value map needs from: 'input:<select id>' (got "${link.from}")`); continue; }
          if (t.type !== 'select') { errors.push(`${where}: a value map can only fill a select (${toId})`); continue; }
          for (const [key, value] of Object.entries(link.map)) {
            if (!selectOptionValues(controller).includes(key)) errors.push(`${where}: map key "${key}" is not an option of ${controller.id}`);
            if (!selectOptionValues(t).includes(String(value))) errors.push(`${where}: map value "${value}" is not an option of ${toId}`);
          }
          continue;
        }
        const { spec } = sourceRef(sourceSchema, link.from || '');
        if (!spec) { errors.push(`${where}: source "${link.from}" does not exist`); continue; }
        if (t.type === 'select' || spec.type === 'select') {
          if (t.type !== spec.type) errors.push(`${where}: ${link.from} → ${toId} mixes a select with a number`);
          else {
            const missing = selectOptionValues(spec).filter((v) => !selectOptionValues(t).includes(v));
            if (missing.length) errors.push(`${where}: options ${missing.join(', ')} of ${spec.id} do not exist in ${toId}`);
          }
          continue;
        }
        if (t.type || spec.type) { errors.push(`${where}: ${link.from} → ${toId} needs numeric fields`); continue; }
        if (!link.raw && spec.group !== t.group) errors.push(`${where}: ${link.from} (${spec.group}) → ${toId} (${t.group}) are different quantities; add raw: true only if the numbers share a unit`);
      }
    }
  }
  return errors;
}

/**
 * Run one sendTo entry at the given source inputs and open the target exactly as the browser would (target
 * defaults + the decoded link). Returns the problems found: values the target refuses, or a target that
 * cannot calculate. An entry that does not apply to these inputs (`when`) returns { skipped: true }.
 */
export function smokeTestChain(source, entry, target, sourceInputs = defaultInputs(source.schema)) {
  if (!chainAvailable(entry, sourceInputs)) return { skipped: true, problems: [] };
  const problems = [];
  const sourceRun = evaluate(source.calculate, sourceInputs);
  if (!sourceRun.ok) return { skipped: false, problems: [`source does not calculate: ${sourceRun.error}`] };
  const values = buildChainValues(source.schema, entry, sourceInputs, sourceRun.result.outputs, target.schema);
  if (values.skipped.length) problems.push(`not sent: ${values.skipped.join('; ')}`);
  const decoded = decodeState(target.schema, `#${encodeState(target.schema, { inputs: values.inputs }, { from: source.schema.id }, { keep: Object.keys(values.inputs) })}`);
  const unlisted = values.sent.filter((label) => !target.schema.inputs.some((i) => i.label === label && i.id in decoded.inputs));
  if (unlisted.length) problems.push(`sent but not received: ${unlisted.join(', ')}`);
  if (decoded.ignored.length) problems.push(`refused by the target: ${decoded.ignored.join(', ')}`);
  const targetRun = evaluate(target.calculate, { ...defaultInputs(target.schema), ...decoded.inputs });
  if (!targetRun.ok) problems.push(`target does not calculate: ${targetRun.error}`);
  return { skipped: false, problems, sent: values.sent };
}

// ---- sweep -------------------------------------------------------------------------------------

/** Evenly spaced (linear) or geometrically spaced (log) values from `from` to `to`, 2–500 points. */
export function sweepValues(from, to, steps, scale = 'linear') {
  const n = Math.max(2, Math.min(500, Math.round(steps)));
  if (!Number.isFinite(from) || !Number.isFinite(to)) throw new Error('Sweep limits must be numbers');
  if (scale === 'log') {
    if (!(from > 0 && to > 0)) throw new Error('A logarithmic sweep needs positive limits');
    const a = Math.log(from);
    const b = Math.log(to);
    return Array.from({ length: n }, (_, k) => Math.exp(a + ((b - a) * k) / (n - 1)));
  }
  return Array.from({ length: n }, (_, k) => from + ((to - from) * k) / (n - 1));
}

/** Evaluate the calculator at every x of one input; outputs that fail or are not numbers become null. */
export function runSweep(calculate, baseInputs, inputId, values, outputIds) {
  return values.map((x) => {
    const r = evaluate(calculate, { ...baseInputs, [inputId]: x });
    const y = {};
    for (const id of outputIds) y[id] = r.ok ? finite(r.result.outputs[id]) : null;
    return { x, y, error: r.ok ? null : r.error };
  });
}

/** One result over a grid of two inputs: values[j][i] at (xs[i], ys[j]); null where the calculator rejects the point or gives no number. */
export function runGrid(calculate, baseInputs, xId, xs, yId, ys, outputId) {
  return ys.map((y) => runSweep(calculate, { ...baseInputs, [yId]: y }, xId, xs, [outputId]).map((r) => r.y[outputId]));
}

// ---- tornado -----------------------------------------------------------------------------------

/**
 * One-at-a-time sensitivity: each input in turn is set to its value × (1 ∓ percent/100), moved by at least 1 when it
 * is a whole number and clamped to its valid range, with the other inputs held; the change of one result is recorded.
 * Rows are ranked by the larger of the two changes. An input at 0 cannot be scaled and is listed in `zero`.
 */
export function tornado(calculate, baseInputs, inputSpecs, outputId, percent = 10) {
  if (!(percent > 0)) throw new Error(`The percentage must be positive (got ${percent})`);
  const base = evaluate(calculate, baseInputs);
  if (!base.ok) throw new Error(`The current inputs do not calculate: ${base.error}`);
  const y0 = finite(base.result.outputs[outputId]);
  if (y0 === null) throw new Error('The chosen result has no value at the current inputs.');
  const at = (id, x) => {
    const r = evaluate(calculate, { ...baseInputs, [id]: x });
    return r.ok ? { x, y: finite(r.result.outputs[outputId]), error: null } : { x, y: null, error: r.error };
  };
  const change = (point) => (point && point.y !== null ? point.y - y0 : null);
  const rows = [];
  const zero = [];
  for (const spec of inputSpecs) {
    const x = baseInputs[spec.id];
    if (!Number.isFinite(x) || x === 0) {
      zero.push(spec.id);
      continue;
    }
    let lo = Math.min(x * (1 - percent / 100), x * (1 + percent / 100));
    let hi = Math.max(x * (1 - percent / 100), x * (1 + percent / 100));
    if (spec.integer) {
      lo = Math.min(Math.round(lo), x - 1);
      hi = Math.max(Math.round(hi), x + 1);
    }
    const clamped = [];
    if (spec.min !== undefined && lo < spec.min) { lo = spec.min; clamped.push('minimum'); }
    if (spec.max !== undefined && hi > spec.max) { hi = spec.max; clamped.push('maximum'); }
    const low = lo < x ? at(spec.id, lo) : null;
    const high = hi > x ? at(spec.id, hi) : null;
    const dLow = change(low);
    const dHigh = change(high);
    const swing = Math.max(0, ...[dLow, dHigh].filter((d) => d !== null).map(Math.abs));
    rows.push({ id: spec.id, low, high, dLow, dHigh, swing, clamped });
  }
  rows.sort((a, b) => b.swing - a.swing);
  return { base: y0, rows, zero };
}

// ---- goal seek ---------------------------------------------------------------------------------

/**
 * Find the value of one input that makes an output equal a target: scan the range for sign changes of
 * output − target, refine every bracket by bisection, return the root nearest to `start`.
 */
export function goalSeek(calculate, baseInputs, inputId, outputId, target, lo, hi, { scanPoints = 80, tol = 1e-12, maxIter = 200, start = null, scale = 'linear' } = {}) {
  if (!(hi > lo)) throw new Error('The search range needs a lower limit below the upper limit');
  if (!Number.isFinite(target)) throw new Error('The target must be a number');
  const f = (x) => {
    const r = evaluate(calculate, { ...baseInputs, [inputId]: x });
    const v = r.ok ? finite(r.result.outputs[outputId]) : null;
    return v === null ? null : v - target;
  };
  const xs = sweepValues(lo, hi, scanPoints, scale);
  const fs = xs.map(f);
  const brackets = [];
  for (let k = 0; k < xs.length; k += 1) {
    if (fs[k] === 0) brackets.push([xs[k], xs[k], 0, 0]);
    else if (k > 0 && fs[k - 1] !== null && fs[k] !== null && fs[k - 1] !== 0 && fs[k - 1] * fs[k] < 0) brackets.push([xs[k - 1], xs[k], fs[k - 1], fs[k]]);
  }
  if (!brackets.length) {
    let best = null;
    xs.forEach((x, k) => {
      if (fs[k] !== null && (best === null || Math.abs(fs[k]) < Math.abs(best.f))) best = { x, f: fs[k] };
    });
    return { status: best ? 'no-bracket' : 'invalid', x: best ? best.x : null, y: best ? best.f + target : null, roots: [], iterations: 0, scanned: xs.length };
  }
  const roots = brackets.map(([a, b, fa, fb]) => {
    if (fa === 0) return { x: a, iterations: 0 };
    let left = a;
    let right = b;
    let fLeft = fa;
    let k = 0;
    for (; k < maxIter; k += 1) {
      const mid = (left + right) / 2;
      const fm = f(mid);
      if (fm === null) break;
      if (fm === 0) { left = mid; right = mid; break; }
      if (fLeft * fm < 0) right = mid;
      else { left = mid; fLeft = fm; }
      if (right - left <= tol * Math.max(1, Math.abs(left), Math.abs(right))) break;
    }
    return { x: (left + right) / 2, iterations: k + 1 };
  });
  const reference = start ?? (lo + hi) / 2;
  const nearest = [...roots].sort((p, q) => Math.abs(p.x - reference) - Math.abs(q.x - reference))[0];
  const check = f(nearest.x);
  return { status: 'ok', x: nearest.x, y: check === null ? null : check + target, iterations: nearest.iterations, roots: roots.map((r) => r.x).sort((p, q) => p - q), scanned: xs.length };
}

// ---- uncertainty -------------------------------------------------------------------------------

/** Two-sided 95 % quantile of the standard normal distribution. */
export const Z95 = 1.959963985;

/** How a "±" entry is read: divisor from ± to the standard uncertainty, and the Monte Carlo distribution. */
export const SPREADS = {
  normal: { label: 'Standard uncertainty (1σ)', divisor: 1, dist: 'normal' },
  normal95: { label: '95 % half-width (u = ±/1.96)', divisor: Z95, dist: 'normal' },
  rect: { label: 'Rectangular limits (u = ±/√3)', divisor: Math.sqrt(3), dist: 'rect' },
};

/**
 * Law of propagation of uncertainty (GUM 5.1.2) with central-difference sensitivity coefficients:
 * u(y) = √Σ (∂y/∂xᵢ · u(xᵢ))², inputs uncorrelated. `uncertainties` maps input id → standard uncertainty.
 */
export function propagateLinear(calculate, baseInputs, uncertainties, outputIds) {
  const base = evaluate(calculate, baseInputs);
  if (!base.ok) throw new Error(`The current inputs do not calculate: ${base.error}`);
  const out = {};
  for (const id of outputIds) out[id] = { value: finite(base.result.outputs[id]), variance: 0, contributions: [] };
  const skipped = [];
  for (const [id, u] of Object.entries(uncertainties)) {
    if (!(u > 0)) continue;
    const x = baseInputs[id];
    const h = Math.max(Math.abs(x) * 1e-6, u * 1e-4, 1e-12);
    let plus = evaluate(calculate, { ...baseInputs, [id]: x + h });
    let minus = evaluate(calculate, { ...baseInputs, [id]: x - h });
    let span = 2 * h;
    if (!plus.ok && !minus.ok) { skipped.push(id); continue; }
    if (!plus.ok) { plus = base; span = h; }
    if (!minus.ok) { minus = base; span = h; }
    for (const oid of outputIds) {
      const a = finite(plus.result.outputs[oid]);
      const b = finite(minus.result.outputs[oid]);
      if (a === null || b === null) continue;
      const c = (a - b) / span;
      out[oid].variance += (c * u) ** 2;
      out[oid].contributions.push({ id, c, cu: Math.abs(c * u) });
    }
  }
  for (const oid of outputIds) {
    const r = out[oid];
    r.u = Math.sqrt(r.variance);
    r.contributions.sort((p, q) => q.cu - p.cu);
    for (const c of r.contributions) c.share = r.variance > 0 ? ((c.cu * c.cu) / r.variance) * 100 : 0;
  }
  return { outputs: out, skipped };
}

/**
 * Monte Carlo propagation (GUM Supplement 1 style): sample every input with its standard uncertainty from a
 * normal or rectangular distribution, evaluate, and summarise each output (mean, SD, 2.5 % and 97.5 % quantiles),
 * keeping its sorted draws for exceedance probabilities.
 * `spreads` maps input id → { u, dist }. Seeded, so a rerun gives the same numbers.
 */
export function propagateMonteCarlo(calculate, baseInputs, spreads, outputIds, { samples = 5000, seed = 1 } = {}) {
  const random = seededRandom(seed);
  const draws = Object.fromEntries(outputIds.map((id) => [id, []]));
  const ids = Object.keys(spreads).filter((id) => spreads[id].u > 0);
  let failures = 0;
  for (let s = 0; s < samples; s += 1) {
    const inputs = { ...baseInputs };
    for (const id of ids) {
      const { u, dist } = spreads[id];
      inputs[id] = dist === 'rect' ? baseInputs[id] + (2 * random() - 1) * u * Math.sqrt(3) : baseInputs[id] + u * normalDeviate(random);
    }
    const r = evaluate(calculate, inputs);
    if (!r.ok) { failures += 1; continue; }
    for (const id of outputIds) {
      const v = finite(r.result.outputs[id]);
      if (v !== null) draws[id].push(v);
    }
  }
  const outputs = {};
  for (const id of outputIds) {
    const arr = draws[id].sort((a, b) => a - b);
    if (arr.length < 2) { outputs[id] = null; continue; }
    const d = describe(arr);
    outputs[id] = { mean: d.mean, sd: d.sd, p025: quantile(arr, 0.025), p975: quantile(arr, 0.975), n: arr.length, draws: arr };
  }
  return { outputs, failures, samples };
}

/**
 * Probability that a result lies above (side 'above') or below a limit, estimated from Monte Carlo draws: the fraction
 * of valid draws beyond the limit with its 95 % Wilson score interval, which covers the sampling error only
 * (Wilson 1927; Newcombe 1998, method 3). A draw equal to the limit counts on neither side.
 */
export function exceedance(draws, limit, side = 'above') {
  const n = draws.length;
  if (!n) return null;
  let k = 0;
  for (const v of draws) if (side === 'above' ? v > limit : v < limit) k += 1;
  const p = k / n;
  const z2 = Z95 * Z95;
  const denominator = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denominator;
  const half = (Z95 * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denominator;
  return { k, n, p, lo: Math.max(0, centre - half), hi: Math.min(1, centre + half) };
}

/** The same probability from the linear propagation, reading the result as normal with mean y and SD u (u = 0: 0 or 1). */
export function normalExceedance(value, u, limit, side = 'above') {
  const margin = side === 'above' ? value - limit : limit - value;
  if (!(u > 0)) return margin > 0 ? 1 : 0;
  return normalCdf(margin / u);
}

// ---- scenarios ---------------------------------------------------------------------------------

/**
 * Compare saved scenarios column by column. columns: [{ name, inputs, outputs }] (schema units).
 * Returns rows for inputs (only differing ones unless showAll; free text included) and every non-table output,
 * with `changed`.
 */
export function compareScenarios(schema, columns, { showAll = false } = {}) {
  const rows = [];
  const differs = (values) => values.some((v) => !sameValue(v, values[0]));
  for (const input of schema.inputs) {
    const values = columns.map((c) => c.inputs?.[input.id]);
    const changed = differs(values);
    if (showAll || changed) rows.push({ kind: 'input', spec: input, values, changed });
  }
  for (const output of schema.outputs) {
    if (output.type === 'table' || output.type === 'chart') continue;
    const values = columns.map((c) => (c.outputs ? c.outputs[output.id] : undefined));
    rows.push({ kind: 'output', spec: output, values, changed: differs(values) });
  }
  return rows;
}

// ---- CSV and batch ------------------------------------------------------------------------------

/** Short preview of a free-text input for a table cell: its non-comment lines joined, cut at `max` characters. */
export function textPreview(text, max = 40) {
  const lines = String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const joined = lines.join(' / ');
  const cut = joined.length > max ? `${joined.slice(0, max - 1)}…` : joined;
  return `${cut} (${lines.length} line${lines.length === 1 ? '' : 's'})`;
}

/** Parse CSV text (comma, semicolon or tab, detected from the header line; quoted fields; # comment lines). */
export function parseCsv(text) {
  const src = String(text || '').replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/).find((line) => line.trim() && !line.trim().startsWith('#')) || '';
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.split(';').length > firstLine.split(',').length) delimiter = ';';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let k = 0; k < src.length; k += 1) {
    const ch = src[k];
    if (quoted) {
      if (ch === '"') {
        if (src[k + 1] === '"') { field += '"'; k += 1; } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field.trim() === '') { quoted = true; field = ''; }
    else if (ch === delimiter) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[k + 1] === '\n') k += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const clean = rows.filter((r) => r.some((c) => c.trim() !== '') && !r[0].trim().startsWith('#'));
  return { delimiter, header: (clean[0] || []).map((h) => h.trim()), rows: clean.slice(1) };
}

/** Serialise rows to CSV, quoting fields that contain the delimiter, quotes or line breaks. */
export function toCsv(rows, delimiter = ',') {
  const escape = (v) => {
    let s = v === null || v === undefined ? '' : String(v);
    // A text cell that starts with = + - @, a tab or a carriage return is run as a formula by
    // spreadsheets (OWASP "CSV injection"), so it gets a leading apostrophe. Numbers, including
    // negative numbers written as text, are left as they are.
    if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(s) && !Number.isFinite(Number(s))) s = `'${s}`;
    return /[",;\t\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return `${rows.map((r) => r.map(escape).join(delimiter)).join('\r\n')}\r\n`;
}

const columnName = (spec) => {
  const label = labelOf(spec);
  return spec.type || !label || label === '–' ? spec.id : `${spec.id} (${label})`;
};

/** CSV template: header of input ids and one row with the current values (schema units). */
export function batchTemplate(schema, inputs) {
  const specs = schema.inputs.filter((i) => i.type !== 'textarea');
  return toCsv([specs.map((s) => s.id), specs.map((s) => inputs[s.id] ?? s.default)]);
}

/**
 * Run one calculation per CSV row. Header cells are input ids (an optional "(unit)" suffix is ignored);
 * columns left out take `baseInputs`. Semicolon files may use decimal commas.
 */
export function runBatch(schema, calculate, baseInputs, csvText, { maxRows = 5000 } = {}) {
  const { header, rows, delimiter } = parseCsv(csvText);
  if (!header.length) throw new Error('The CSV needs a header row of input ids');
  const byId = Object.fromEntries(schema.inputs.map((i) => [i.id, i]));
  const ids = header.map((h) => h.replace(/\s*\(.*\)\s*$/, '').trim());
  const unknown = ids.filter((id) => id && !byId[id]);
  if (unknown.length) throw new Error(`Unknown column(s): ${unknown.join(', ')}. Valid input ids: ${schema.inputs.map((i) => i.id).join(', ')}`);
  if (!rows.length) throw new Error('The CSV has a header but no data rows');
  if (rows.length > maxRows) throw new Error(`At most ${maxRows} rows per batch`);
  const outSpecs = schema.outputs.filter((o) => o.type !== 'table' && o.type !== 'chart');
  const inSpecs = schema.inputs.filter((i) => i.type !== 'textarea');
  let errors = 0;
  const table = rows.map((cells) => {
    const inputs = { ...baseInputs };
    const problems = [];
    ids.forEach((id, c) => {
      if (!id) return;
      let raw = (cells[c] ?? '').trim();
      if (raw === '') return;
      const spec = byId[id];
      if (spec.type) { inputs[id] = raw; return; }
      if (delimiter === ';') raw = raw.replace(/^(-?\d+),(\d+)$/, '$1.$2');
      const n = Number(raw);
      if (Number.isFinite(n)) inputs[id] = n;
      else problems.push(`${id}: "${raw}" is not a number`);
    });
    let outputs = null;
    let error = problems.join('; ');
    if (!error) {
      const r = evaluate(calculate, inputs);
      if (r.ok) outputs = r.result.outputs;
      else error = r.error;
    }
    if (error) errors += 1;
    return [...inSpecs.map((s) => inputs[s.id]), ...outSpecs.map((o) => (outputs ? outputs[o.id] ?? null : null)), error || ''];
  });
  return { header: [...inSpecs.map(columnName), ...outSpecs.map(columnName), 'error'], rows: table, errors, count: rows.length };
}

// ---- calculation record ------------------------------------------------------------------------

/** The JSON calculation record: everything needed to reproduce and audit a result. */
export function buildRecord(schema, { inputs, units }, result, meta = {}) {
  const outputs = {};
  for (const o of schema.outputs) outputs[o.id] = result && result.outputs ? result.outputs[o.id] ?? null : null;
  return {
    format: RECORD_FORMAT,
    format_version: 1,
    calculator: schema.id,
    name: schema.name,
    library_version: meta.libraryVersion ?? null,
    calc_hash: meta.calcHash ?? null,
    shared_hash: meta.sharedHash ?? null,
    generated: meta.generated ?? null,
    url: meta.url ?? null,
    inputs,
    display_units: units,
    outputs,
    warnings: result && result.warnings ? result.warnings : [],
  };
}

/** Read a JSON record back: { inputs, units, notes } validated against the schema. */
export function readRecord(schema, json, { calcHash } = {}) {
  let data;
  try {
    data = typeof json === 'string' ? JSON.parse(json) : json;
  } catch {
    throw new Error('The file is not valid JSON');
  }
  if (!data || data.format !== RECORD_FORMAT) throw new Error('Not a calculation record (the "format" field is missing or different)');
  if (data.calculator !== schema.id) throw new Error(`The record belongs to "${data.calculator}", not to "${schema.id}"`);
  const notes = [];
  if (calcHash && data.calc_hash && data.calc_hash !== calcHash) notes.push(`The record was made with calc.js ${data.calc_hash}; this page runs ${calcHash} — results may differ.`);
  const { inputs, ignored } = validateValues(schema, data.inputs);
  if (ignored.length) notes.push(`Ignored inputs that are not valid for this calculator: ${ignored.join(', ')}.`);
  const units = {};
  const specs = Object.fromEntries([...schema.inputs, ...schema.outputs].filter((s) => !s.type).map((s) => [s.id, s]));
  for (const [id, unitId] of Object.entries(data.display_units || {})) if (specs[id] && getGroup(specs[id].group).units[unitId]) units[id] = unitId;
  return { inputs, units, notes, generated: data.generated, savedOutputs: data.outputs || {} };
}

const mdEscape = (s) => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

function mdValue(spec, value, units) {
  if (value === null || value === undefined) return ['—', ''];
  if (spec.type === 'text' || spec.type === 'select' || spec.type === 'textarea') return [String(value), ''];
  const unitId = units[spec.id] || spec.display || spec.unit;
  const shown = typeof value === 'number' ? formatNumber(convert(value, spec.unit, unitId, spec.group), { decimals: spec.decimals, grouping: false }) : String(value);
  return [shown, labelOf(spec, unitId)];
}

/** Markdown version of a record: inputs, results, warnings, assumptions, notes and sources, with version stamps. */
export function recordToMarkdown(schema, record) {
  const units = record.display_units || {};
  const lines = [`# ${schema.name}`, ''];
  lines.push(`Calculated ${record.generated || '—'} · library ${record.library_version || '—'} · calc.js ${record.calc_hash || '—'} · shared ${record.shared_hash || '—'}`, '');
  if (record.url) lines.push(`Link: ${record.url}`, '');
  lines.push('## Inputs', '', '| Input | Value | Unit |', '| --- | ---: | --- |');
  for (const input of schema.inputs) {
    if (!isVisible(input, record.inputs || {})) continue;
    const raw = record.inputs ? record.inputs[input.id] : undefined;
    if (input.type === 'textarea') {
      lines.push(`| ${mdEscape(input.label)} | (text, see below) | |`);
      continue;
    }
    let value = raw;
    if (input.type === 'select') value = (input.options || Object.values(input.optionsBy?.options || {}).flat()).find((o) => String(o.value) === String(raw))?.label ?? raw;
    const [shown, unit] = mdValue(input, value, units);
    lines.push(`| ${mdEscape(input.label)} | ${mdEscape(shown)} | ${mdEscape(unit)} |`);
  }
  for (const input of schema.inputs.filter((i) => i.type === 'textarea')) {
    lines.push('', `### ${input.label}`, '', '```', String(record.inputs?.[input.id] ?? ''), '```');
  }
  lines.push('', '## Results', '', '| Result | Value | Unit |', '| --- | ---: | --- |');
  const tables = [];
  for (const output of schema.outputs) {
    if (!isVisible(output, record.inputs || {})) continue;
    const value = record.outputs ? record.outputs[output.id] : null;
    if (output.type === 'table') { tables.push([output, value]); continue; }
    if (output.type === 'chart') continue;
    const [shown, unit] = mdValue(output, value, units);
    lines.push(`| ${mdEscape(output.label)} | ${mdEscape(shown)} | ${mdEscape(unit)} |`);
  }
  for (const [output, table] of tables) {
    if (!table || !table.columns) continue;
    lines.push('', `### ${output.label}`, '', `| ${table.columns.map(mdEscape).join(' | ')} |`, `| ${table.columns.map(() => '---').join(' | ')} |`);
    for (const row of table.rows) lines.push(`| ${row.map((v) => mdEscape(typeof v === 'number' ? formatNumber(v, { grouping: false }) : v ?? '—')).join(' | ')} |`);
  }
  if (record.warnings && record.warnings.length) lines.push('', '## Warnings', '', ...record.warnings.map((w) => `- ${w}`));
  if (schema.assumptions && schema.assumptions.length) lines.push('', '## Assumptions', '', ...schema.assumptions.map((a) => `- ${a}`));
  if (schema.notes && schema.notes.length) lines.push('', '## Notes', '', ...schema.notes.map((n) => `- ${n}`));
  if (schema.sources && schema.sources.length) lines.push('', '## Sources', '', ...schema.sources.map((s) => `- ${s}`));
  return `${lines.join('\n')}\n`;
}
