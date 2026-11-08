/**
 * shared/features/panel.js — the "Tools" panel that mountCalculatorPage() adds below every calculator:
 *   share link and "send to" chaining, sweep and plot, heat map, goal seek, tornado, uncertainty band, scenarios,
 *   batch CSV and the
 *   calculation record (print / PDF, Markdown, JSON). The logic lives in core.js and chart.js; this file builds
 *   the DOM and converts between the user's display units and the schema units.
 */
import { convert } from '../units.js';
import { numberFromText } from '../expression.js';
import { el, formatNumber, renderTable, copyText, downloadText, DASH } from '../dom.js';
import * as core from './core.js';
import { renderLineChart, renderTornado, renderHeatmap } from './chart.js';
import { LIBRARY_VERSION, SHARED_HASH, CALC_HASHES, BUILD_DATE } from '../version.js';

/** Page of another calculator: the site build publishes its URLs in globalThis.EC_ROUTES; the plain library keeps its folders. */
const calculatorHref = (id) => globalThis.EC_ROUTES?.[id] ?? `../${id}/index.html`;

let uid = 0;
const nextId = () => `ec-tool-${(uid += 1)}`;

/** Round for an editable number field (10 significant digits). */
const forInput = (value) => (Number.isFinite(value) ? String(Number(value.toPrecision(10))) : '');

/**
 * Keep a number field typed in a display unit meaningful when the user switches that quantity's unit: the field
 * remembers the unit it was written in (data-unit) and is re-expressed in the new one. `delta` converts a
 * difference (a ± tolerance), which ignores the offset of temperature scales.
 */
function followUnit(ctx, field, spec, { delta = false } = {}) {
  const now = ctx.unitOf(spec);
  const was = field.dataset.unit;
  field.dataset.unit = now;
  if (!was || was === now || field.value === '' || !Number.isFinite(numberFromText(field.value))) return;
  const value = numberFromText(field.value);
  const converted = delta
    ? Math.abs(convert(value, was, now, spec.group) - convert(0, was, now, spec.group))
    : convert(value, was, now, spec.group);
  field.value = forInput(converted);
}

/** Default range of a swept input: ½× to 1.5× its current value (its limits when the value is 0), within its valid range. */
function defaultRange(spec, current) {
  let lo = spec.min ?? 0;
  let hi = spec.max ?? 1;
  if (Number.isFinite(current) && current !== 0) {
    lo = Math.min(current * 0.5, current * 1.5);
    hi = Math.max(current * 0.5, current * 1.5);
  }
  return [spec.min !== undefined ? Math.max(lo, spec.min) : lo, spec.max !== undefined ? Math.min(hi, spec.max) : hi];
}

function option(value, label, selected = false) {
  return el('option', { value, text: label, selected });
}

function labelled(labelText, control, help) {
  if (!control.id) control.id = nextId();
  return el('div', { class: 'ec-tool-field' }, [
    el('label', { class: 'ec-label', for: control.id, text: labelText }),
    control,
    help ? el('p', { class: 'ec-help', text: help }) : null,
  ]);
}

function toolSection(title, description) {
  const body = el('div', { class: 'ec-tool-body' }, description ? el('p', { class: 'ec-help', text: description }) : null);
  const details = el('details', { class: 'ec-tool' }, [el('summary', { class: 'ec-tool-summary', text: title }), body]);
  return { details, body };
}

function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Add the tools to a rendered calculator.
 * @param {{ schema: object, calculate: Function, api: object, anchor: HTMLElement }} options
 */
export function mountFeatures({ schema, calculate, api, anchor }) {
  const page = anchor.closest('main') || document.body;
  const banner = el('div', { class: 'ec-banner', role: 'status', hidden: true });
  anchor.before(banner);
  const printHeader = el('div', { class: 'ec-print-header' });
  page.prepend(printHeader);
  const section = el('section', { class: 'ec-tools', 'aria-labelledby': 'ec-tools-heading' }, [
    el('h2', { class: 'ec-panel-heading', id: 'ec-tools-heading', text: 'Tools' }),
  ]);
  anchor.after(section);

  const ctx = { schema, calculate, api, calcHash: CALC_HASHES[schema.id] || null };
  ctx.unitOf = (spec) => api.getState().units[spec.id] || spec.display || spec.unit;
  ctx.toDisplay = (spec, value) => (value === null || value === undefined ? null : convert(value, spec.unit, ctx.unitOf(spec), spec.group));
  ctx.fromDisplay = (spec, value) => convert(value, ctx.unitOf(spec), spec.unit, spec.group);
  ctx.deltaFromDisplay = (spec, delta) => ctx.fromDisplay(spec, delta) - ctx.fromDisplay(spec, 0);
  ctx.deltaToDisplay = (spec, delta) => ctx.toDisplay(spec, delta) - ctx.toDisplay(spec, 0);
  ctx.unitText = (spec) => core.labelOf(spec, ctx.unitOf(spec));
  ctx.withUnit = (spec) => (ctx.unitText(spec) && ctx.unitText(spec) !== '–' ? `${spec.label} (${ctx.unitText(spec)})` : spec.label);
  ctx.visibleNumericInputs = () => core.numericInputs(schema).filter((s) => core.isVisible(s, api.getLastInputs() || core.defaultInputs(schema)));
  ctx.visibleNumericOutputs = () => core.numericOutputs(schema).filter((s) => core.isVisible(s, api.getLastInputs() || core.defaultInputs(schema)));

  const tools = [buildShare(ctx), buildSweep(ctx), buildHeatmap(ctx), buildGoalSeek(ctx), buildTornado(ctx), buildUncertainty(ctx), buildScenarios(ctx), buildBatch(ctx), buildRecord(ctx)];
  for (const tool of tools) section.append(tool.details);

  const refreshAll = debounce(() => {
    for (const tool of tools) tool.refresh();
  }, 200);
  api.subscribe(() => {
    syncHash(ctx);
    refreshAll();
  });
  setupPrint(ctx, printHeader);
  restoreFromHash(ctx, banner, true);
  window.addEventListener('hashchange', () => restoreFromHash(ctx, banner, false));
  syncHash(ctx);
  for (const tool of tools) tool.refresh();
  return { refresh: refreshAll };
}

// ---- permalink ---------------------------------------------------------------------------------

function syncHash(ctx) {
  if (!ctx.api.getResult()) return;
  const encoded = core.encodeState(ctx.schema, ctx.api.getState());
  const target = encoded === `v=${core.STATE_VERSION}` ? '' : `#${encoded}`;
  if (location.hash === target || (target === '' && location.hash === '')) return;
  try {
    history.replaceState(null, '', `${location.pathname}${location.search}${target}`);
  } catch {
    // replaceState can be blocked (sandboxed frames); the link field still shows the state
  }
}

function showBanner(banner, text) {
  banner.innerHTML = '';
  const close = el('button', { type: 'button', class: 'ec-button ec-banner-close', text: 'Dismiss' });
  close.addEventListener('click', () => { banner.hidden = true; });
  banner.append(el('p', { class: 'ec-banner-text', text }), close);
  banner.hidden = false;
}

function restoreFromHash(ctx, banner, initial) {
  const decoded = core.decodeState(ctx.schema, location.hash);
  const count = Object.keys(decoded.inputs).length;
  const empty = !count && !Object.keys(decoded.units).length && !decoded.from && !decoded.ignored.length;
  if (empty && initial) return;
  // The hash carries only the non-default values, so everything it does not name goes back to its default
  // (matters when the hash changes on an open page: a pasted link or the browser's back button).
  ctx.api.setState({
    inputs: { ...core.defaultInputs(ctx.schema), ...decoded.inputs },
    units: { ...core.defaultUnits(ctx.schema), ...decoded.units },
  });
  if (empty) {
    banner.hidden = true;
    return;
  }
  const labels = ctx.schema.inputs.filter((i) => i.id in decoded.inputs).map((i) => i.label);
  const ignored = decoded.ignored.length ? ` ${decoded.ignored.length} entr${decoded.ignored.length === 1 ? 'y was' : 'ies were'} not recognised and ignored.` : '';
  if (decoded.from) {
    const write = (name) => showBanner(banner, `Values received from ${name}: ${labels.join(', ') || 'none'}. Check them before relying on the result.${ignored}`);
    write(decoded.from);
    const siteName = globalThis.EC_NAMES?.[decoded.from];
    if (siteName) write(siteName);
    else fetch('../manifest.json').then((r) => r.json()).then((m) => {
      const source = (m.calculators || []).find((c) => c.id === decoded.from);
      if (source) write(source.name);
    }).catch(() => {});
  } else if (count || decoded.ignored.length) {
    showBanner(banner, `Inputs loaded from the link: ${count} value${count === 1 ? ' differs' : 's differ'} from the defaults.${ignored}`);
  }
}

// ---- share and send to --------------------------------------------------------------------------

function buildShare(ctx) {
  const { details, body } = toolSection('Share link and send to', 'The address bar always holds the current inputs and units. Copy the link to bookmark or share this calculation; opening it restores every value.');
  const urlField = el('input', { class: 'ec-input ec-tool-url', type: 'text', readonly: true, 'aria-label': 'Link to this calculation' });
  const copyButton = el('button', { type: 'button', class: 'ec-button', text: 'Copy link' });
  const status = el('p', { class: 'ec-tool-status', role: 'status' });
  copyButton.addEventListener('click', async () => {
    status.textContent = (await copyText(urlField.value)) ? 'Link copied.' : 'Copy failed: select the link above and copy it.';
  });
  body.append(el('div', { class: 'ec-tool-row' }, [urlField, copyButton]), status);

  let refreshChains = () => {};
  const sendTo = ctx.schema.sendTo || [];
  if (sendTo.length) {
    const list = el('ul', { class: 'ec-chain-list' });
    body.append(el('h3', { class: 'ec-tool-heading', text: 'Send the results to another calculator' }), list);
    const entries = sendTo.map((entry) => {
      const link = el('a', { class: 'ec-button ec-chain-link', text: entry.label });
      const what = el('p', { class: 'ec-help' });
      list.append(el('li', { class: 'ec-chain-item' }, [link, what]));
      return { entry, link, what, target: null };
    });
    const loaded = Promise.all(entries.map(async (e) => {
      try {
        e.target = (await import(`../../${e.entry.target}/calc.js`)).schema;
      } catch {
        e.what.textContent = 'The target calculator could not be loaded.';
      }
    }));
    refreshChains = async () => {
      await loaded;
      const result = ctx.api.getResult();
      const inputs = ctx.api.getLastInputs();
      for (const e of entries) {
        if (!e.target) continue;
        if (!result || !inputs) {
          e.link.removeAttribute('href');
          e.link.setAttribute('aria-disabled', 'true');
          e.what.textContent = 'Fix the inputs first.';
          continue;
        }
        if (!core.chainAvailable(e.entry, inputs)) {
          e.link.removeAttribute('href');
          e.link.setAttribute('aria-disabled', 'true');
          e.what.textContent = e.entry.whenNote;
          continue;
        }
        const values = core.buildChainValues(ctx.schema, e.entry, inputs, result.outputs, e.target);
        e.link.href = `${calculatorHref(e.entry.target)}#${core.encodeState(e.target, { inputs: values.inputs }, { from: ctx.schema.id }, { keep: Object.keys(values.inputs) })}`;
        e.link.removeAttribute('aria-disabled');
        const parts = [`Opens ${e.target.name} with: ${values.sent.join(', ') || 'no values'}.`];
        if (values.skipped.length) parts.push(`Not sent: ${values.skipped.join('; ')}.`);
        if (e.entry.note) parts.push(e.entry.note);
        e.what.textContent = parts.join(' ');
      }
    };
  }
  return { details, refresh: () => { urlField.value = location.href; refreshChains(); } };
}

// ---- sweep and plot ------------------------------------------------------------------------------

function buildSweep(ctx) {
  const { details, body } = toolSection('Sweep and plot', 'Vary one input over a range and plot how the results respond; the other inputs keep their current values. Each result gets its own chart; the table below the charts lists every value.');
  const outputs = core.numericOutputs(ctx.schema);
  if (!core.numericInputs(ctx.schema).length || !outputs.length) {
    body.append(el('p', { class: 'ec-help', text: 'This calculator has no numeric input and output pair to sweep.' }));
    return { details, refresh() {} };
  }
  const inputSelect = el('select', { class: 'ec-select' });
  const from = el('input', { class: 'ec-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false' });
  const to = el('input', { class: 'ec-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false' });
  const points = el('input', { class: 'ec-input', type: 'text', inputmode: 'numeric', autocomplete: 'off', value: '41' });
  const scale = el('select', { class: 'ec-select' }, [option('linear', 'Linear', true), option('log', 'Logarithmic')]);
  const fromField = labelled('From', from);
  const toField = labelled('To', to);
  const checks = el('fieldset', { class: 'ec-tool-checks' }, el('legend', { class: 'ec-label', text: 'Results to plot (up to 4)' }));
  const boxes = outputs.map((o, k) => {
    const box = el('input', { type: 'checkbox', value: o.id, checked: k === 0 });
    checks.append(el('label', { class: 'ec-check' }, [box, el('span', { text: o.label })]));
    return box;
  });
  const run = el('button', { type: 'button', class: 'ec-button ec-button-primary', text: 'Run sweep' });
  const csv = el('button', { type: 'button', class: 'ec-button', text: 'Download values (CSV)', disabled: true });
  const status = el('p', { class: 'ec-tool-status', role: 'status' });
  const charts = el('div', { class: 'ec-chart-list' });
  const tableWrap = el('div', { class: 'ec-table-wrap', role: 'region', tabindex: '0', 'aria-label': 'Sweep values' });
  body.append(
    el('div', { class: 'ec-tool-grid' }, [labelled('Input to vary', inputSelect), fromField, toField, labelled('Points', points), labelled('Spacing', scale)]),
    checks,
    el('div', { class: 'ec-tool-row' }, [run, csv]),
    status,
    charts,
    el('details', { class: 'ec-tool-table' }, [el('summary', { class: 'ec-tool-summary-small', text: 'Values (table view)' }), tableWrap]),
  );

  let last = null;
  let rangeEdited = false;
  const specOf = (id) => ctx.schema.inputs.find((i) => i.id === id);

  // The range follows the current value (½× to 1.5×) until the user edits it; an edited range is kept and only
  // re-expressed when the unit of the swept input changes.
  function fillInputs() {
    const keep = inputSelect.value;
    const visible = ctx.visibleNumericInputs();
    inputSelect.innerHTML = '';
    for (const s of visible) inputSelect.append(option(s.id, ctx.withUnit(s), s.id === keep));
    const spec = specOf(inputSelect.value);
    if (inputSelect.value !== keep || !rangeEdited) {
      rangeEdited = false;
      setRange();
    } else if (spec) {
      followUnit(ctx, from, spec);
      followUnit(ctx, to, spec);
    }
    updateLabels();
  }
  function updateLabels() {
    const spec = specOf(inputSelect.value);
    if (!spec) return;
    const unit = ctx.unitText(spec);
    fromField.querySelector('label').textContent = unit && unit !== '–' ? `From (${unit})` : 'From';
    toField.querySelector('label').textContent = unit && unit !== '–' ? `To (${unit})` : 'To';
  }
  function setRange() {
    const spec = specOf(inputSelect.value);
    const inputs = ctx.api.getLastInputs();
    if (!spec || !inputs) return;
    const [lo, hi] = defaultRange(spec, inputs[spec.id]);
    from.value = forInput(ctx.toDisplay(spec, lo));
    to.value = forInput(ctx.toDisplay(spec, hi));
    from.dataset.unit = ctx.unitOf(spec);
    to.dataset.unit = ctx.unitOf(spec);
    updateLabels();
  }
  inputSelect.addEventListener('change', () => { rangeEdited = false; setRange(); last = null; });
  for (const field of [from, to]) field.addEventListener('input', () => { rangeEdited = true; });

  function sweep({ quiet = false } = {}) {
    const spec = specOf(inputSelect.value);
    const base = ctx.api.getLastInputs();
    if (!spec || !base) { status.textContent = 'Fix the calculator inputs first.'; return; }
    const a = numberFromText(from.value);
    const b = numberFromText(to.value);
    const n = numberFromText(points.value);
    if (!Number.isFinite(a) || !Number.isFinite(b)) { status.textContent = 'From and To must be numbers or formulas such as 1500/60.'; return; }
    if (a === b) { status.textContent = 'Enter two different limits.'; return; }
    if (!Number.isInteger(n) || n < 2 || n > 200) { status.textContent = 'Points must be a whole number from 2 to 200.'; return; }
    let displayXs;
    try {
      displayXs = core.sweepValues(Math.min(a, b), Math.max(a, b), n, scale.value);
    } catch (error) {
      status.textContent = error.message;
      return;
    }
    let xs = displayXs.map((x) => ctx.fromDisplay(spec, x));
    if (spec.integer) xs = [...new Set(xs.map((x) => Math.round(x)))];
    const selected = boxes.filter((box) => box.checked).slice(0, 4).map((box) => box.value);
    if (!selected.length) { status.textContent = 'Tick at least one result to plot.'; return; }
    const rows = core.runSweep(ctx.calculate, base, spec.id, xs, selected);
    const current = ctx.api.getResult();
    last = { spec, rows, selected, logX: scale.value === 'log', current: { x: base[spec.id], outputs: current ? current.outputs : {} } };
    draw();
    const failed = rows.filter((r) => r.error).length;
    if (!quiet || failed) status.textContent = `${rows.length} points${failed ? `; ${failed} without a result (outside the calculator's valid range)` : ''}.`;
    csv.disabled = false;
  }
  function draw() {
    if (!last) return;
    // measure the tool body, not the list: an emptied list is display:none and reports zero width
    const width = Math.max(240, charts.parentElement.clientWidth || 600);
    charts.innerHTML = '';
    const { spec, rows, selected } = last;
    for (const oid of selected) {
      const ospec = ctx.schema.outputs.find((o) => o.id === oid);
      const figure = el('figure', { class: 'ec-chart' }, el('figcaption', { class: 'ec-chart-title', text: `${ctx.withUnit(ospec)} against ${spec.label}` }));
      const holder = el('div', { class: 'ec-chart-holder' });
      figure.append(holder);
      charts.append(figure);
      const currentY = last.current.outputs ? last.current.outputs[oid] : null;
      renderLineChart(holder, {
        width,
        points: rows.map((r) => ({ x: ctx.toDisplay(spec, r.x), y: r.y[oid] === null ? null : ctx.toDisplay(ospec, r.y[oid]) })),
        xLabel: spec.label,
        xUnit: ctx.unitText(spec) === '–' ? '' : ctx.unitText(spec),
        yLabel: ospec.label,
        yUnit: ctx.unitText(ospec) === '–' ? '' : ctx.unitText(ospec),
        logX: last.logX,
        current: typeof currentY === 'number' ? { x: ctx.toDisplay(spec, last.current.x), y: ctx.toDisplay(ospec, currentY) } : null,
      });
    }
    renderTable(tableWrap, {
      columns: [ctx.withUnit(spec), ...selected.map((oid) => ctx.withUnit(ctx.schema.outputs.find((o) => o.id === oid)))],
      rows: rows.map((r) => [ctx.toDisplay(spec, r.x), ...selected.map((oid) => (r.y[oid] === null ? null : ctx.toDisplay(ctx.schema.outputs.find((o) => o.id === oid), r.y[oid])))]),
    });
  }
  run.addEventListener('click', () => sweep());
  csv.addEventListener('click', () => {
    if (!last) return;
    const header = [ctx.withUnit(last.spec), ...last.selected.map((oid) => ctx.withUnit(ctx.schema.outputs.find((o) => o.id === oid)))];
    const rows = last.rows.map((r) => [ctx.toDisplay(last.spec, r.x), ...last.selected.map((oid) => (r.y[oid] === null ? '' : ctx.toDisplay(ctx.schema.outputs.find((o) => o.id === oid), r.y[oid])))]);
    downloadText(`${ctx.schema.id}-sweep-${last.spec.id}.csv`, core.toCsv([header, ...rows]), 'text/csv');
  });
  if (typeof ResizeObserver === 'function') {
    let width = 0;
    const observer = new ResizeObserver(debounce(() => {
      const now = charts.parentElement.clientWidth;
      if (now && Math.abs(now - width) > 8) { width = now; draw(); }
    }, 120));
    observer.observe(body);
  }
  details.addEventListener('toggle', () => { if (details.open) fillInputs(); });
  return {
    details,
    refresh() {
      fillInputs();
      if (details.open && last) sweep({ quiet: true });
    },
  };
}

// ---- heat map ------------------------------------------------------------------------------------

function buildHeatmap(ctx) {
  const { details, body } = toolSection('Heat map', 'Vary two inputs over a grid and colour one result; the other inputs keep their current values and every cell is a full calculation. The colours are seven equal steps between the smallest and the largest result of the map; the table lists every value.');
  if (core.numericInputs(ctx.schema).length < 2 || !core.numericOutputs(ctx.schema).length) {
    body.append(el('p', { class: 'ec-help', text: 'This calculator needs two numeric inputs and a numeric result for a heat map.' }));
    return { details, refresh() {} };
  }
  const outputSelect = el('select', { class: 'ec-select' });
  const axes = ['Across', 'Up'].map((side) => {
    const select = el('select', { class: 'ec-select' });
    const from = el('input', { class: 'ec-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false' });
    const to = el('input', { class: 'ec-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false' });
    return { side, select, from, to, selectField: labelled(`Input ${side.toLowerCase()}`, select), fromField: labelled(`${side} from`, from), toField: labelled(`${side} to`, to), edited: false };
  });
  const points = el('input', { class: 'ec-input', type: 'text', inputmode: 'numeric', autocomplete: 'off', value: '21' });
  const scale = el('select', { class: 'ec-select' }, [option('linear', 'Linear', true), option('log', 'Logarithmic')]);
  const run = el('button', { type: 'button', class: 'ec-button ec-button-primary', text: 'Draw heat map' });
  const csv = el('button', { type: 'button', class: 'ec-button', text: 'Download values (CSV)', disabled: true });
  const status = el('p', { class: 'ec-tool-status', role: 'status' });
  const caption = el('figcaption', { class: 'ec-chart-title' });
  const holder = el('div', { class: 'ec-chart-holder' });
  const figure = el('figure', { class: 'ec-chart', hidden: true }, [caption, holder]);
  const tableWrap = el('div', { class: 'ec-table-wrap', role: 'region', tabindex: '0', 'aria-label': 'Heat map values' });
  body.append(
    el('div', { class: 'ec-tool-grid' }, [labelled('Result', outputSelect), ...axes.flatMap((a) => [a.selectField, a.fromField, a.toField]), labelled('Points per input', points), labelled('Spacing', scale)]),
    el('div', { class: 'ec-tool-row' }, [run, csv]),
    status,
    figure,
    el('details', { class: 'ec-tool-table' }, [el('summary', { class: 'ec-tool-summary-small', text: 'Values (table view)' }), tableWrap]),
  );
  const specOf = (id) => ctx.schema.inputs.find((i) => i.id === id);
  const unitOf = (spec) => (ctx.unitText(spec) === '–' ? '' : ctx.unitText(spec));
  let last = null;
  let runs = 0;

  function setRange(axis) {
    const spec = specOf(axis.select.value);
    const inputs = ctx.api.getLastInputs();
    if (!spec || !inputs) return;
    const [lo, hi] = defaultRange(spec, inputs[spec.id]);
    axis.from.value = forInput(ctx.toDisplay(spec, lo));
    axis.to.value = forInput(ctx.toDisplay(spec, hi));
    axis.from.dataset.unit = ctx.unitOf(spec);
    axis.to.dataset.unit = ctx.unitOf(spec);
  }
  function updateLabels() {
    for (const axis of axes) {
      const spec = specOf(axis.select.value);
      const unit = spec && unitOf(spec) ? ` (${unitOf(spec)})` : '';
      axis.fromField.querySelector('label').textContent = `${axis.side} from${unit}`;
      axis.toField.querySelector('label').textContent = `${axis.side} to${unit}`;
    }
  }
  // like the sweep, each range follows the current value until it is edited, then only follows unit changes
  function fill() {
    const visible = ctx.visibleNumericInputs();
    const keepOut = outputSelect.value;
    outputSelect.innerHTML = '';
    for (const o of ctx.visibleNumericOutputs()) outputSelect.append(option(o.id, ctx.withUnit(o), o.id === keepOut));
    axes.forEach((axis, k) => {
      const keep = axis.select.value;
      axis.select.innerHTML = '';
      for (const s of visible) axis.select.append(option(s.id, ctx.withUnit(s), s.id === keep));
      if (!keep && visible[k]) axis.select.value = visible[k].id;
      const spec = specOf(axis.select.value);
      if (axis.select.value !== keep || !axis.edited) {
        axis.edited = false;
        setRange(axis);
      } else if (spec) {
        followUnit(ctx, axis.from, spec);
        followUnit(ctx, axis.to, spec);
      }
    });
    // two different inputs by default: the second axis moves off the first when they coincide
    if (axes[0].select.value === axes[1].select.value) {
      const other = visible.find((s) => s.id !== axes[0].select.value);
      if (other) {
        axes[1].select.value = other.id;
        axes[1].edited = false;
        setRange(axes[1]);
      }
    }
    updateLabels();
  }
  for (const axis of axes) {
    axis.select.addEventListener('change', () => { axis.edited = false; setRange(axis); updateLabels(); });
    for (const field of [axis.from, axis.to]) field.addEventListener('input', () => { axis.edited = true; });
  }

  // grid values of one axis in schema units (whole numbers rounded, duplicates dropped), or a message
  function gridOf(axis, n) {
    const spec = specOf(axis.select.value);
    const a = numberFromText(axis.from.value);
    const b = numberFromText(axis.to.value);
    const side = axis.side.toLowerCase();
    if (!Number.isFinite(a) || !Number.isFinite(b)) return { error: `The ${side} limits must be numbers or formulas such as 1500/60.` };
    if (a === b) return { error: `Enter two different ${side} limits.` };
    let values;
    try {
      values = core.sweepValues(Math.min(a, b), Math.max(a, b), n, scale.value).map((v) => ctx.fromDisplay(spec, v));
    } catch (error) {
      return { error: error.message };
    }
    if (spec.integer) values = [...new Set(values.map((v) => Math.round(v)))];
    if (values.length < 2) return { error: `The ${side} range holds fewer than two whole numbers.` };
    return { spec, values };
  }
  function clear(message) {
    runs += 1;
    last = null;
    figure.hidden = true;
    tableWrap.innerHTML = '';
    csv.disabled = true;
    status.textContent = message;
  }

  // rows are calculated in slices that yield to the browser every ~60 ms, so a large map never freezes the page;
  // a newer run (or a cleared map) abandons an older one
  async function compute({ quiet = false } = {}) {
    const base = ctx.api.getLastInputs();
    const ospec = ctx.schema.outputs.find((o) => o.id === outputSelect.value);
    if (!base || !ospec) { clear('Fix the calculator inputs first.'); return; }
    if (ctx.visibleNumericInputs().length < 2) { clear('A heat map needs two numeric inputs; with the current options this calculator shows only one.'); return; }
    if (axes[0].select.value === axes[1].select.value) { status.textContent = 'Choose two different inputs.'; return; }
    const n = numberFromText(points.value);
    if (!Number.isInteger(n) || n < 3 || n > 41) { status.textContent = 'Points per input must be a whole number from 3 to 41.'; return; }
    const [gx, gy] = axes.map((axis) => gridOf(axis, n));
    if (gx.error || gy.error) { status.textContent = gx.error || gy.error; return; }
    const mine = (runs += 1);
    const started = performance.now();
    let pause = started;
    const values = [];
    for (const y of gy.values) {
      values.push(...core.runGrid(ctx.calculate, base, gx.spec.id, gx.values, gy.spec.id, [y], ospec.id));
      if (performance.now() - pause > 60) {
        status.textContent = `Calculating… ${Math.round((100 * values.length) / gy.values.length)} %`;
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (mine !== runs) return;
        pause = performance.now();
      }
    }
    const slow = performance.now() - started > 2000;
    last = { key: JSON.stringify(base), base, ospec, gx, gy, values, log: scale.value === 'log', slow };
    draw();
    csv.disabled = false;
    const missing = values.flat().filter((v) => v === null).length;
    const summary = `${gx.values.length} × ${gy.values.length} points${missing ? `; ${missing} without a result (outside the calculator's valid range)` : ''}.`;
    if (!quiet || missing || status.textContent.startsWith('Calculating')) status.textContent = summary;
  }
  function draw() {
    if (!last) return;
    const { base, ospec, gx, gy } = last;
    const xs = gx.values.map((v) => ctx.toDisplay(gx.spec, v));
    const ys = gy.values.map((v) => ctx.toDisplay(gy.spec, v));
    const values = last.values.map((row) => row.map((v) => (v === null ? null : ctx.toDisplay(ospec, v))));
    figure.hidden = false;
    caption.textContent = `${ctx.withUnit(ospec)} over ${gx.spec.label} and ${gy.spec.label}`;
    renderHeatmap(holder, {
      width: Math.max(240, body.clientWidth || 600),
      xs,
      ys,
      values,
      xLabel: gx.spec.label,
      xUnit: unitOf(gx.spec),
      yLabel: gy.spec.label,
      yUnit: unitOf(gy.spec),
      zLabel: ospec.label,
      zUnit: unitOf(ospec),
      logX: last.log,
      logY: last.log,
      current: { x: ctx.toDisplay(gx.spec, base[gx.spec.id]), y: ctx.toDisplay(gy.spec, base[gy.spec.id]) },
    });
    renderTable(tableWrap, {
      columns: [`${ctx.withUnit(gy.spec)} ↓ · ${ctx.withUnit(gx.spec)} →`, ...xs.map((x) => formatNumber(x))],
      rows: ys.map((y, j) => [y, ...values[j]]),
    });
  }
  run.addEventListener('click', () => compute());
  csv.addEventListener('click', () => {
    if (!last) return;
    const { ospec, gx, gy } = last;
    const rows = [];
    gy.values.forEach((y, j) => gx.values.forEach((x, i) => {
      const v = last.values[j][i];
      rows.push([ctx.toDisplay(gx.spec, x), ctx.toDisplay(gy.spec, y), v === null ? '' : ctx.toDisplay(ospec, v)]);
    }));
    downloadText(`${ctx.schema.id}-heatmap-${gx.spec.id}-${gy.spec.id}.csv`, core.toCsv([[ctx.withUnit(gx.spec), ctx.withUnit(gy.spec), ctx.withUnit(ospec)], ...rows]), 'text/csv');
  });
  if (typeof ResizeObserver === 'function') {
    let width = 0;
    const observer = new ResizeObserver(debounce(() => {
      const now = body.clientWidth;
      if (now && Math.abs(now - width) > 8) { width = now; draw(); }
    }, 120));
    observer.observe(body);
  }
  details.addEventListener('toggle', () => { if (details.open) fill(); });
  return {
    details,
    refresh() {
      fill();
      if (!details.open || !last) return;
      if (last.key === JSON.stringify(ctx.api.getLastInputs())) draw();
      else if (!last.slow) compute({ quiet: true });
      else status.textContent = 'The calculator inputs changed: press Draw heat map to update (a full map takes more than 2 s here, so it is not redrawn on every change).';
    },
  };
}

// ---- tornado -------------------------------------------------------------------------------------

function buildTornado(ctx) {
  const { details, body } = toolSection('Tornado (sensitivity ranking)', 'Change each input in turn by ± a percentage, the others held at their current values, and rank the inputs by how far one result moves. Inputs at zero, inputs without effect and changed values the calculator rejects are listed below the chart; the table lists every value.');
  if (!core.numericInputs(ctx.schema).length || !core.numericOutputs(ctx.schema).length) {
    body.append(el('p', { class: 'ec-help', text: 'This calculator has no numeric input and output pair to rank.' }));
    return { details, refresh() {} };
  }
  const outputSelect = el('select', { class: 'ec-select' });
  const percent = el('input', { class: 'ec-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', value: '10' });
  const run = el('button', { type: 'button', class: 'ec-button ec-button-primary', text: 'Rank the inputs' });
  const status = el('p', { class: 'ec-tool-status', role: 'status' });
  const caption = el('figcaption', { class: 'ec-chart-title' });
  const holder = el('div', { class: 'ec-chart-holder' });
  const figure = el('figure', { class: 'ec-chart', hidden: true }, [caption, holder]);
  const tableWrap = el('div', { class: 'ec-table-wrap', role: 'region', tabindex: '0', 'aria-label': 'Tornado values' });
  body.append(
    el('div', { class: 'ec-tool-grid' }, [labelled('Result', outputSelect), labelled('Change each input by ± (%)', percent)]),
    el('div', { class: 'ec-tool-row' }, [run]),
    status,
    figure,
    el('details', { class: 'ec-tool-table' }, [el('summary', { class: 'ec-tool-summary-small', text: 'Values (table view)' }), tableWrap]),
  );
  const inputSpec = (id) => ctx.schema.inputs.find((s) => s.id === id);
  const unitOf = (spec) => (ctx.unitText(spec) === '–' ? '' : ctx.unitText(spec));
  const rejectedIn = (row) => Boolean(row.low?.error || row.high?.error);
  const moves = (result) => Boolean(result && result.rows.some((r) => r.swing > 0));
  let last = null;
  // until the user picks a result, the tornado shows the first one that some input moves
  let chosen = false;
  outputSelect.addEventListener('change', () => { chosen = true; });

  function fill() {
    const keep = outputSelect.value;
    outputSelect.innerHTML = '';
    for (const o of ctx.visibleNumericOutputs()) outputSelect.append(option(o.id, ctx.withUnit(o), o.id === keep));
  }
  function tornadoFor(base, outputId, p) {
    try {
      return core.tornado(ctx.calculate, base, ctx.visibleNumericInputs(), outputId, p);
    } catch {
      return null;
    }
  }
  function compute({ quiet = false } = {}) {
    const base = ctx.api.getLastInputs();
    let ospec = ctx.schema.outputs.find((o) => o.id === outputSelect.value);
    const p = numberFromText(percent.value);
    let result = null;
    let problem = null;
    if (!base || !ospec) problem = 'Fix the calculator inputs first.';
    else if (!(p > 0 && p < 100)) problem = 'The change must be a percentage above 0 and below 100, such as 10.';
    else {
      try {
        result = core.tornado(ctx.calculate, base, ctx.visibleNumericInputs(), ospec.id, p);
      } catch (error) {
        problem = error.message;
      }
      if (!chosen && !moves(result)) {
        for (const o of ctx.visibleNumericOutputs()) {
          const other = tornadoFor(base, o.id, p);
          if (moves(other)) {
            ospec = o;
            result = other;
            problem = null;
            outputSelect.value = o.id;
            break;
          }
        }
      }
    }
    if (problem) {
      last = null;
      figure.hidden = true;
      tableWrap.innerHTML = '';
      status.textContent = problem;
      return;
    }
    last = { ospec, p, result };
    draw();
    const names = (rows) => rows.map((r) => inputSpec(r.id).label).join(', ');
    const notes = [];
    const none = result.rows.filter((r) => r.swing === 0 && !rejectedIn(r));
    if (none.length) notes.push(`No effect on ${ospec.label}: ${names(none)}.`);
    if (result.zero.length) notes.push(`Not varied, because a percentage of 0 is 0: ${result.zero.map((id) => inputSpec(id).label).join(', ')}.`);
    const rejected = result.rows.filter(rejectedIn);
    if (rejected.length) notes.push(`The calculator rejects a changed value of ${names(rejected)} (see the table).`);
    const clamped = result.rows.filter((r) => r.clamped.length);
    if (clamped.length) notes.push(`Held at the edge of the valid range: ${names(clamped)}.`);
    status.textContent = notes.length ? notes.join(' ') : quiet ? '' : `${result.rows.length} inputs ranked by their effect on ${ospec.label}.`;
  }
  function draw() {
    if (!last) return;
    const { ospec, p, result } = last;
    const shown = result.rows.filter((r) => r.swing > 0 || rejectedIn(r));
    const point = (spec, pt) => (pt ? { x: ctx.toDisplay(spec, pt.x), y: pt.y === null ? null : ctx.toDisplay(ospec, pt.y) } : null);
    figure.hidden = !shown.length;
    caption.textContent = `${ctx.withUnit(ospec)} when each input is lowered or raised by ${formatNumber(p)} %`;
    if (shown.length) {
      renderTornado(holder, {
        width: Math.max(240, body.clientWidth || 600),
        base: ctx.toDisplay(ospec, result.base),
        xLabel: ospec.label,
        xUnit: unitOf(ospec),
        lowName: 'Lower input value',
        highName: 'Higher input value',
        rows: shown.map((r) => {
          const spec = inputSpec(r.id);
          const range = [r.low, r.high].filter(Boolean).map((pt) => formatNumber(ctx.toDisplay(spec, pt.x)));
          return { name: spec.label, unit: unitOf(spec), label: `${spec.label}: ${range.join(' to ')}${unitOf(spec) ? ` ${unitOf(spec)}` : ''}`, low: point(spec, r.low), high: point(spec, r.high) };
        }),
      });
    }
    const resultUnit = unitOf(ospec) ? ` (${unitOf(ospec)})` : '';
    const percentOf = (d) => (d === null || result.base === 0 ? null : (100 * d) / Math.abs(result.base));
    renderTable(tableWrap, {
      columns: ['Input', 'Lower value', `Result${resultUnit}`, 'Change (%)', 'Higher value', `Result${resultUnit}`, 'Change (%)', 'Note'],
      rows: result.rows.map((r) => {
        const spec = inputSpec(r.id);
        const valueText = (pt) => (pt ? `${formatNumber(ctx.toDisplay(spec, pt.x))}${unitOf(spec) ? ` ${unitOf(spec)}` : ''}` : null);
        const y = (pt) => (pt && pt.y !== null ? ctx.toDisplay(ospec, pt.y) : null);
        const note = r.low?.error || r.high?.error || (r.clamped.length ? `held at the ${r.clamped.join(' and ')}` : '');
        return [spec.label, valueText(r.low), y(r.low), percentOf(r.dLow), valueText(r.high), y(r.high), percentOf(r.dHigh), note];
      }),
    });
  }
  run.addEventListener('click', () => compute());
  if (typeof ResizeObserver === 'function') {
    let width = 0;
    const observer = new ResizeObserver(debounce(() => {
      const now = body.clientWidth;
      if (now && Math.abs(now - width) > 8) { width = now; draw(); }
    }, 120));
    observer.observe(body);
  }
  details.addEventListener('toggle', () => { if (details.open) fill(); });
  return {
    details,
    refresh() {
      fill();
      if (details.open && last) compute({ quiet: true });
    },
  };
}

// ---- goal seek ----------------------------------------------------------------------------------

function buildGoalSeek(ctx) {
  const { details, body } = toolSection('Goal seek', 'Find the value of one input that makes a result equal a target. The range is scanned for every solution; the one nearest the current value is reported.');
  if (!core.numericInputs(ctx.schema).filter((s) => !s.integer).length || !core.numericOutputs(ctx.schema).length) {
    body.append(el('p', { class: 'ec-help', text: 'This calculator has no numeric input and output pair to solve for.' }));
    return { details, refresh() {} };
  }
  const outputSelect = el('select', { class: 'ec-select' });
  const target = el('input', { class: 'ec-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false' });
  const inputSelect = el('select', { class: 'ec-select' });
  const lo = el('input', { class: 'ec-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false' });
  const hi = el('input', { class: 'ec-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false' });
  const targetField = labelled('Target value', target);
  const loField = labelled('Search from', lo);
  const hiField = labelled('Search to', hi);
  const solve = el('button', { type: 'button', class: 'ec-button ec-button-primary', text: 'Solve' });
  const apply = el('button', { type: 'button', class: 'ec-button', text: 'Apply to the calculator', hidden: true });
  const result = el('p', { class: 'ec-tool-result', role: 'status' });
  body.append(
    el('div', { class: 'ec-tool-grid' }, [labelled('Result', outputSelect), targetField, labelled('Input to change', inputSelect), loField, hiField]),
    el('div', { class: 'ec-tool-row' }, [solve, apply]),
    result,
  );
  let found = null;
  const outSpec = () => ctx.schema.outputs.find((o) => o.id === outputSelect.value);
  const inSpec = () => ctx.schema.inputs.find((i) => i.id === inputSelect.value);
  const unitSuffix = (spec) => (ctx.unitText(spec) && ctx.unitText(spec) !== '–' ? ` (${ctx.unitText(spec)})` : '');

  function fill() {
    const keepOut = outputSelect.value;
    const keepIn = inputSelect.value;
    outputSelect.innerHTML = '';
    for (const o of ctx.visibleNumericOutputs()) outputSelect.append(option(o.id, ctx.withUnit(o), o.id === keepOut));
    inputSelect.innerHTML = '';
    for (const i of ctx.visibleNumericInputs().filter((s) => !s.integer)) inputSelect.append(option(i.id, ctx.withUnit(i), i.id === keepIn));
    if (outputSelect.value !== keepOut || !target.value) setTarget();
    else if (outSpec()) followUnit(ctx, target, outSpec());
    if (inputSelect.value !== keepIn || !lo.value) setRange();
    else if (inSpec()) {
      followUnit(ctx, lo, inSpec());
      followUnit(ctx, hi, inSpec());
    }
    labels();
  }
  function labels() {
    if (outSpec()) targetField.querySelector('label').textContent = `Target value${unitSuffix(outSpec())}`;
    if (inSpec()) {
      loField.querySelector('label').textContent = `Search from${unitSuffix(inSpec())}`;
      hiField.querySelector('label').textContent = `Search to${unitSuffix(inSpec())}`;
    }
  }
  function setTarget() {
    const r = ctx.api.getResult();
    const spec = outSpec();
    if (r && spec && typeof r.outputs[spec.id] === 'number') {
      target.value = forInput(ctx.toDisplay(spec, r.outputs[spec.id]));
      target.dataset.unit = ctx.unitOf(spec);
    }
  }
  function setRange() {
    const spec = inSpec();
    const inputs = ctx.api.getLastInputs();
    if (!spec || !inputs) return;
    const x = inputs[spec.id];
    let a = spec.min;
    let b = spec.max;
    if (a === undefined || b === undefined) {
      const span = Math.abs(x) || 1;
      a = a ?? (x > 0 ? x / 10 : x - 10 * span);
      b = b ?? (x > 0 ? x * 10 : x + 10 * span);
    }
    lo.value = forInput(ctx.toDisplay(spec, a));
    hi.value = forInput(ctx.toDisplay(spec, b));
    lo.dataset.unit = ctx.unitOf(spec);
    hi.dataset.unit = ctx.unitOf(spec);
  }
  outputSelect.addEventListener('change', () => { setTarget(); labels(); });
  inputSelect.addEventListener('change', () => { setRange(); labels(); });
  solve.addEventListener('click', () => {
    apply.hidden = true;
    found = null;
    const base = ctx.api.getLastInputs();
    const ospec = outSpec();
    const ispec = inSpec();
    if (!base || !ospec || !ispec) { result.textContent = 'Fix the calculator inputs first.'; return; }
    const t = numberFromText(target.value);
    const a = numberFromText(lo.value);
    const b = numberFromText(hi.value);
    if (![t, a, b].every(Number.isFinite)) { result.textContent = 'The target and both search limits must be numbers or formulas such as 1500/60.'; return; }
    if (a === b) { result.textContent = 'Enter two different search limits.'; return; }
    const loS = ctx.fromDisplay(ispec, Math.min(a, b));
    const hiS = ctx.fromDisplay(ispec, Math.max(a, b));
    const tS = ctx.fromDisplay(ospec, t);
    let res;
    try {
      res = core.goalSeek(ctx.calculate, base, ispec.id, ospec.id, tS, loS, hiS, { start: base[ispec.id], scale: loS > 0 && hiS / loS >= 100 ? 'log' : 'linear' });
    } catch (error) {
      result.textContent = error.message;
      return;
    }
    const fmtIn = (v) => `${formatNumber(ctx.toDisplay(ispec, v))}${unitSuffix(ispec).replace(/[()]/g, '')}`;
    const fmtOut = (v) => `${formatNumber(ctx.toDisplay(ospec, v))}${unitSuffix(ospec).replace(/[()]/g, '')}`;
    if (res.status === 'ok') {
      found = { spec: ispec, value: res.x };
      const others = res.roots.filter((r) => Math.abs(r - res.x) > 1e-9 * Math.max(1, Math.abs(r)));
      result.textContent = `${ispec.label} = ${fmtIn(res.x)} gives ${ospec.label} = ${fmtOut(res.y)} (target ${fmtOut(tS)}).${others.length ? ` Other solutions in the range: ${others.map(fmtIn).join(', ')}.` : ''}`;
      apply.hidden = false;
    } else if (res.status === 'no-bracket') {
      result.textContent = `No solution between ${fmtIn(loS)} and ${fmtIn(hiS)}: the closest ${ospec.label} reached is ${fmtOut(res.y)} at ${fmtIn(res.x)}. Widen the range or check that the target is reachable.`;
    } else {
      result.textContent = 'The calculator gave no valid result anywhere in this range.';
    }
  });
  apply.addEventListener('click', () => {
    if (found) ctx.api.setState({ inputs: { [found.spec.id]: found.value } });
  });
  details.addEventListener('toggle', () => { if (details.open) fill(); });
  return { details, refresh() { if (details.open) fill(); } };
}

// ---- uncertainty band ----------------------------------------------------------------------------

function buildUncertainty(ctx) {
  const { details, body } = toolSection('Uncertainty band', 'Give inputs a ± tolerance and see how far the results can move: the linear law of propagation (GUM) with numerical sensitivity coefficients, and an optional Monte Carlo check. Inputs are treated as uncorrelated.');
  const candidates = core.numericInputs(ctx.schema).filter((s) => !s.integer);
  if (!candidates.length || !core.numericOutputs(ctx.schema).length) {
    body.append(el('p', { class: 'ec-help', text: 'This calculator has no numeric input to vary.' }));
    return { details, refresh() {} };
  }
  const meaning = el('select', { class: 'ec-select' }, Object.entries(core.SPREADS).map(([value, s]) => option(value, s.label, value === 'normal')));
  const mode = el('select', { class: 'ec-select' }, [option('abs', 'Absolute, in each input\'s unit', true), option('pct', 'Percent of the value')]);
  const samples = el('select', { class: 'ec-select' }, [option('0', 'Off (linear only)'), option('2000', '2 000'), option('10000', '10 000', true), option('50000', '50 000')]);
  const allOne = el('button', { type: 'button', class: 'ec-button', text: 'Set all to 1 %' });
  const clear = el('button', { type: 'button', class: 'ec-button', text: 'Clear' });
  const run = el('button', { type: 'button', class: 'ec-button ec-button-primary', text: 'Propagate' });
  const inputsWrap = el('div', { class: 'ec-table-wrap', role: 'region', tabindex: '0', 'aria-label': 'Input tolerances' });
  const resultsWrap = el('div', { class: 'ec-table-wrap', role: 'region', tabindex: '0', 'aria-label': 'Propagated uncertainty' });
  const status = el('p', { class: 'ec-tool-status', role: 'status' });
  const probOutput = el('select', { class: 'ec-select' });
  const probSide = el('select', { class: 'ec-select' }, [option('above', 'Above the limit', true), option('below', 'Below the limit')]);
  const probLimit = el('input', { class: 'ec-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false' });
  const probLimitField = labelled('Limit', probLimit);
  const probResult = el('p', { class: 'ec-tool-result', role: 'status' });
  const probBlock = el('div', { class: 'ec-tool-block', hidden: true }, [
    el('h3', { class: 'ec-tool-heading', text: 'Probability of passing a limit' }),
    el('div', { class: 'ec-tool-grid' }, [labelled('Result', probOutput), labelled('Probability of being', probSide), probLimitField]),
    probResult,
  ]);
  body.append(
    el('div', { class: 'ec-tool-grid' }, [labelled('± means', meaning), labelled('± entered as', mode), labelled('Monte Carlo samples', samples)]),
    el('div', { class: 'ec-tool-row' }, [allOne, clear]),
    inputsWrap,
    el('div', { class: 'ec-tool-row' }, [run]),
    status,
    resultsWrap,
    probBlock,
  );
  const fields = {};
  // the last propagation: its base inputs (to notice a change), the results it showed and the Monte Carlo draws
  let lastRun = null;

  function rows() {
    const inputs = ctx.api.getLastInputs() || core.defaultInputs(ctx.schema);
    const visible = candidates.filter((s) => core.isVisible(s, inputs));
    const table = el('table', { class: 'ec-table' }, [
      el('thead', {}, el('tr', {}, [el('th', { scope: 'col', text: 'Input' }), el('th', { scope: 'col', text: 'Value' }), el('th', { scope: 'col', text: '±' })])),
    ]);
    const tbody = el('tbody');
    for (const spec of visible) {
      if (!fields[spec.id]) fields[spec.id] = el('input', { class: 'ec-input ec-input-pm', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', 'aria-label': `± for ${spec.label}` });
      if (mode.value === 'abs') followUnit(ctx, fields[spec.id], spec, { delta: true });
      else fields[spec.id].dataset.unit = ctx.unitOf(spec);
      tbody.append(el('tr', {}, [
        el('td', { text: spec.label }),
        el('td', { class: 'ec-num', text: `${formatNumber(ctx.toDisplay(spec, inputs[spec.id]))} ${ctx.unitText(spec) === '–' ? '' : ctx.unitText(spec)}`.trim() }),
        el('td', {}, fields[spec.id]),
      ]));
    }
    table.append(tbody);
    inputsWrap.innerHTML = '';
    inputsWrap.append(table);
    return visible;
  }
  allOne.addEventListener('click', () => {
    mode.value = 'pct';
    for (const spec of rows()) fields[spec.id].value = '1';
  });
  clear.addEventListener('click', () => {
    for (const box of Object.values(fields)) box.value = '';
    resultsWrap.innerHTML = '';
    status.textContent = '';
  });
  run.addEventListener('click', () => {
    const base = ctx.api.getLastInputs();
    if (!base) { status.textContent = 'Fix the calculator inputs first.'; return; }
    const spread = core.SPREADS[meaning.value];
    const uMap = {};
    const mcMap = {};
    const invalid = [];
    for (const spec of rows()) {
      if (!fields[spec.id].value.trim()) continue;
      const raw = numberFromText(fields[spec.id].value);
      if (!Number.isFinite(raw) || raw < 0) { invalid.push(spec.label); continue; }
      if (raw === 0) continue;
      const pm = mode.value === 'pct' ? (Math.abs(base[spec.id]) * raw) / 100 : Math.abs(ctx.deltaFromDisplay(spec, raw));
      const u = pm / spread.divisor;
      if (u > 0) { uMap[spec.id] = u; mcMap[spec.id] = { u, dist: spread.dist }; }
    }
    if (invalid.length) { status.textContent = `A ± must be zero, a positive number or a formula such as 0.5*2: check ${invalid.join(', ')}.`; return; }
    if (!Object.keys(uMap).length) { status.textContent = 'Enter a ± for at least one input.'; return; }
    const outs = ctx.visibleNumericOutputs();
    const ids = outs.map((o) => o.id);
    let linear;
    try {
      linear = core.propagateLinear(ctx.calculate, base, uMap, ids);
    } catch (error) {
      status.textContent = error.message;
      return;
    }
    const n = Number(samples.value);
    const mc = n > 0 ? core.propagateMonteCarlo(ctx.calculate, base, mcMap, ids, { samples: n, seed: 1 }) : null;
    const labelOfInput = (id) => ctx.schema.inputs.find((s) => s.id === id)?.label || id;
    const columns = ['Result', 'Value', 'u (k = 1)', '± 95 % (1.96 u)', 'Largest contribution'];
    if (mc) columns.splice(4, 0, 'Monte Carlo 95 % interval');
    const tableRows = outs.map((o) => {
      const r = linear.outputs[o.id];
      const top = r.contributions[0];
      const row = [ctx.withUnit(o), r.value === null ? null : ctx.toDisplay(o, r.value), r.value === null ? null : Math.abs(ctx.deltaToDisplay(o, r.u)), r.value === null ? null : Math.abs(ctx.deltaToDisplay(o, core.Z95 * r.u)), top && top.share > 0 ? `${labelOfInput(top.id)} (${formatNumber(top.share)} %)` : DASH];
      if (mc) {
        const m = mc.outputs[o.id];
        row.splice(4, 0, m ? `${formatNumber(ctx.toDisplay(o, m.p025))} … ${formatNumber(ctx.toDisplay(o, m.p975))}` : DASH);
      }
      return row;
    });
    renderTable(resultsWrap, { columns, rows: tableRows }, { tableClass: 'ec-table-labelled ec-table-note-last' });
    const notes = [];
    if (linear.skipped.length) notes.push(`No sensitivity for ${linear.skipped.map(labelOfInput).join(', ')} (the calculator rejects values on both sides).`);
    if (mc && mc.failures) notes.push(`${mc.failures} of ${mc.samples} Monte Carlo samples fell outside the calculator's valid range and were dropped${mc.failures / mc.samples > 0.05 ? ' — the interval is not reliable' : ''}.`);
    if (mc) notes.push('Where the linear ±95 % and the Monte Carlo interval disagree, the result is non-linear in the inputs and the Monte Carlo interval is the better estimate.');
    status.textContent = notes.join(' ');
    lastRun = { key: JSON.stringify(base), outs: outs.filter((o) => linear.outputs[o.id].value !== null), linear, mc };
    const keep = probOutput.value;
    probOutput.innerHTML = '';
    for (const o of lastRun.outs) probOutput.append(option(o.id, ctx.withUnit(o), o.id === keep));
    if (probOutput.value !== keep) clearLimit();
    showProbability();
  });

  // three significant digits of the smaller tail (99.962 % keeps its digits); within 1 ppm of 0 or 1 the figure means nothing
  const pct = (p) => {
    if (p > 0 && p < 1e-6) return 'below 0.0001 %';
    if (p < 1 && p > 1 - 1e-6) return 'above 99.9999 %';
    const tail = Math.min(p, 1 - p) * 100;
    return `${formatNumber(p * 100, { decimals: tail > 0 ? Math.max(0, 2 - Math.floor(Math.log10(tail))) : 0 })} %`;
  };
  function clearLimit() {
    probLimit.value = '';
    delete probLimit.dataset.unit;
  }
  function showProbability() {
    probBlock.hidden = !lastRun;
    if (!lastRun) return;
    for (const opt of probOutput.options) opt.textContent = ctx.withUnit(lastRun.outs.find((o) => o.id === opt.value));
    const spec = lastRun.outs.find((o) => o.id === probOutput.value);
    if (!spec) { probResult.textContent = ''; return; }
    followUnit(ctx, probLimit, spec);
    const unit = ctx.unitText(spec) && ctx.unitText(spec) !== '–' ? ctx.unitText(spec) : '';
    probLimitField.querySelector('label').textContent = unit ? `Limit (${unit})` : 'Limit';
    if (!probLimit.value.trim()) { probResult.textContent = 'Enter a limit, such as an allowable value, to see the probability of passing it.'; return; }
    const limitDisplay = numberFromText(probLimit.value);
    if (!Number.isFinite(limitDisplay)) { probResult.textContent = 'The limit must be a number or a formula such as 1500/60.'; return; }
    const limit = ctx.fromDisplay(spec, limitDisplay);
    const side = probSide.value;
    const where = `${side} ${formatNumber(limitDisplay)}${unit ? ` ${unit}` : ''}`;
    const lin = lastRun.linear.outputs[spec.id];
    const normalText = `Normal approximation from the linear u: ${pct(core.normalExceedance(lin.value, lin.u, limit, side))}.`;
    if (!lastRun.mc) { probResult.textContent = `${normalText} Switch the Monte Carlo on for an estimate that does not assume a normal result.`; return; }
    const draws = lastRun.mc.outputs[spec.id]?.draws;
    if (!draws) { probResult.textContent = `No valid Monte Carlo draws for this result. ${normalText}`; return; }
    const e = core.exceedance(draws, limit, side);
    const n = formatNumber(e.n);
    let text;
    if (e.k === 0) text = `Probability ${where}: less than ${pct(e.hi)} (95 % confidence; none of ${n} valid Monte Carlo draws).`;
    else if (e.k === e.n) text = `Probability ${where}: more than ${pct(e.lo)} (95 % confidence; all ${n} valid Monte Carlo draws).`;
    else text = `Probability ${where}: ${pct(e.p)} (${formatNumber(e.k)} of ${n} valid Monte Carlo draws; sampling 95 % interval ${pct(e.lo)} to ${pct(e.hi)}).`;
    probResult.textContent = `${text} ${normalText}`;
  }
  probOutput.addEventListener('change', () => { clearLimit(); showProbability(); });
  probSide.addEventListener('change', showProbability);
  probLimit.addEventListener('input', showProbability);

  /** Rebuild the ± table; results of a propagation whose base inputs have since changed are cleared, not left stale. */
  function sync() {
    rows();
    if (lastRun && lastRun.key !== JSON.stringify(ctx.api.getLastInputs())) {
      lastRun = null;
      resultsWrap.innerHTML = '';
      status.textContent = 'The calculator inputs changed: press Propagate to update the results.';
    }
    showProbability();
  }
  details.addEventListener('toggle', () => { if (details.open) sync(); });
  return { details, refresh() { if (details.open) sync(); } };
}

// ---- scenarios -----------------------------------------------------------------------------------

function buildScenarios(ctx) {
  const { details, body } = toolSection('Scenarios', 'Save up to three sets of inputs (A, B, C) and compare them side by side with the current inputs; changed values are highlighted. Saved scenarios stay in this browser.');
  const key = `ec-scenarios-${ctx.schema.id}`;
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(key) || '{}') || {};
  } catch {
    saved = {};
  }
  const persist = () => {
    try {
      localStorage.setItem(key, JSON.stringify(saved));
    } catch {
      // storage blocked: scenarios last for this page view only
    }
  };
  const names = ['A', 'B', 'C'];
  const saveButtons = names.map((n) => el('button', { type: 'button', class: 'ec-button', text: `Save as ${n}` }));
  const loadButtons = names.map((n) => el('button', { type: 'button', class: 'ec-button', text: `Load ${n}` }));
  const clear = el('button', { type: 'button', class: 'ec-button', text: 'Clear all' });
  const showAll = el('input', { type: 'checkbox' });
  const wrap = el('div', { class: 'ec-table-wrap', role: 'region', tabindex: '0', 'aria-label': 'Scenario comparison' });
  const status = el('p', { class: 'ec-tool-status', role: 'status' });
  body.append(
    el('div', { class: 'ec-tool-row' }, saveButtons),
    el('div', { class: 'ec-tool-row' }, [...loadButtons, clear]),
    el('label', { class: 'ec-check' }, [showAll, el('span', { text: 'Show unchanged inputs' })]),
    status,
    wrap,
  );
  saveButtons.forEach((button, k) => button.addEventListener('click', () => {
    const state = ctx.api.getState();
    if (!ctx.api.getResult()) { status.textContent = 'Fix the calculator inputs before saving.'; return; }
    saved[names[k]] = { inputs: ctx.api.getLastInputs(), units: state.units, savedAt: new Date().toISOString() };
    persist();
    render();
  }));
  loadButtons.forEach((button, k) => button.addEventListener('click', () => {
    const s = saved[names[k]];
    if (s) ctx.api.setState({ inputs: core.validateValues(ctx.schema, s.inputs).inputs });
  }));
  clear.addEventListener('click', () => { saved = {}; persist(); render(); });
  showAll.addEventListener('change', render);

  function render() {
    names.forEach((n, k) => {
      loadButtons[k].disabled = !saved[n];
      saveButtons[k].textContent = saved[n] ? `Update ${n}` : `Save as ${n}`;
    });
    const present = names.filter((n) => saved[n]);
    if (!present.length) { wrap.innerHTML = ''; status.textContent = 'No scenario saved yet.'; return; }
    status.textContent = '';
    const currentInputs = ctx.api.getLastInputs();
    const currentResult = ctx.api.getResult();
    const columns = [{ name: 'Current', inputs: currentInputs || {}, outputs: currentResult ? currentResult.outputs : null }];
    for (const n of present) {
      const inputs = { ...core.defaultInputs(ctx.schema), ...core.validateValues(ctx.schema, saved[n].inputs).inputs };
      const r = core.evaluate(ctx.calculate, inputs);
      columns.push({ name: n, inputs, outputs: r.ok ? r.result.outputs : null });
    }
    const rows = core.compareScenarios(ctx.schema, columns, { showAll: showAll.checked });
    const show = (spec, value) => {
      if (value === undefined || value === null) return DASH;
      if (spec.type === 'select') return (spec.options || Object.values(spec.optionsBy?.options || {}).flat()).find((o) => String(o.value) === String(value))?.label ?? String(value);
      if (spec.type === 'textarea') return core.textPreview(value);
      if (spec.type) return String(value);
      return typeof value === 'number' ? ctx.toDisplay(spec, value) : String(value);
    };
    const tableRows = rows.map((r) => [r.kind === 'input' ? r.spec.label : `→ ${r.spec.label}`, r.spec.type ? '' : ctx.unitText(r.spec) === '–' ? '' : ctx.unitText(r.spec), ...r.values.map((v) => show(r.spec, v))]);
    renderTable(wrap, { columns: ['Quantity', 'Unit', ...columns.map((c) => c.name)], rows: tableRows }, {
      tableClass: 'ec-table-labelled',
      cellClass: (ri, ci) => {
        if (ci < 3) return null;
        const values = rows[ri].values;
        const a = values[0];
        const b = values[ci - 2];
        const differs = typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) > 1e-12 * Math.max(1, Math.abs(a)) : String(a) !== String(b);
        return differs ? 'ec-diff' : null;
      },
    });
  }
  details.addEventListener('toggle', () => { if (details.open) render(); });
  return { details, refresh() { if (details.open) render(); } };
}

// ---- batch CSV -----------------------------------------------------------------------------------

function buildBatch(ctx) {
  const { details, body } = toolSection('Batch (CSV)', 'Run one calculation per row. The header row holds input ids; values are in the unit named in the id or in the schema (see the template). Columns you leave out keep the current values. Comma, semicolon (decimal comma allowed) or tab separated.');
  const area = el('textarea', { class: 'ec-textarea', rows: '8', wrap: 'off', spellcheck: 'false', 'aria-label': 'Batch CSV' });
  const template = el('button', { type: 'button', class: 'ec-button', text: 'Insert template' });
  const run = el('button', { type: 'button', class: 'ec-button ec-button-primary', text: 'Run batch' });
  const download = el('button', { type: 'button', class: 'ec-button', text: 'Download results (CSV)', disabled: true });
  const status = el('p', { class: 'ec-tool-status', role: 'status' });
  const wrap = el('div', { class: 'ec-table-wrap', role: 'region', tabindex: '0', 'aria-label': 'Batch results' });
  body.append(el('div', { class: 'ec-tool-row' }, [template, run, download]), area, status, wrap);
  let last = null;
  template.addEventListener('click', () => {
    const inputs = ctx.api.getLastInputs() || core.defaultInputs(ctx.schema);
    area.value = core.batchTemplate(ctx.schema, inputs);
  });
  run.addEventListener('click', () => {
    const base = ctx.api.getLastInputs() || core.defaultInputs(ctx.schema);
    try {
      last = core.runBatch(ctx.schema, ctx.calculate, base, area.value);
    } catch (error) {
      status.textContent = error.message;
      wrap.innerHTML = '';
      download.disabled = true;
      return;
    }
    const shown = last.rows.slice(0, 200);
    renderTable(wrap, { columns: last.header, rows: shown });
    status.textContent = `${last.count} row${last.count === 1 ? '' : 's'} calculated, ${last.errors} with an error${last.count > 200 ? '; the first 200 are shown, the download has all' : ''}. Results are in schema units (named in the column headers).`;
    download.disabled = false;
  });
  download.addEventListener('click', () => {
    if (last) downloadText(`${ctx.schema.id}-batch.csv`, core.toCsv([last.header, ...last.rows]), 'text/csv');
  });
  return { details, refresh() {} };
}

// ---- calculation record ------------------------------------------------------------------------

function buildRecord(ctx) {
  const { details, body } = toolSection('Calculation record', 'Keep a reproducible record: print or save as PDF, copy or download a Markdown summary, or save the inputs and results as JSON and load them back later. Each record carries the version stamps below.');
  const stamp = el('p', { class: 'ec-help ec-version', text: `Library ${LIBRARY_VERSION} · calc.js ${ctx.calcHash || 'unknown'} · shared ${SHARED_HASH} · built ${BUILD_DATE}` });
  const print = el('button', { type: 'button', class: 'ec-button', text: 'Print or save as PDF' });
  const copyMd = el('button', { type: 'button', class: 'ec-button', text: 'Copy as Markdown' });
  const saveMd = el('button', { type: 'button', class: 'ec-button', text: 'Download Markdown' });
  const saveJson = el('button', { type: 'button', class: 'ec-button', text: 'Download JSON' });
  const file = el('input', { type: 'file', accept: '.json,application/json', class: 'ec-visually-hidden', tabindex: '-1', 'aria-hidden': 'true' });
  const loadJson = el('button', { type: 'button', class: 'ec-button', text: 'Load JSON…' });
  const status = el('p', { class: 'ec-tool-status', role: 'status' });
  body.append(stamp, el('div', { class: 'ec-tool-row' }, [print, copyMd, saveMd, saveJson, loadJson, file]), status);
  const record = () => core.buildRecord(ctx.schema, { inputs: ctx.api.getLastInputs() || ctx.api.getState().inputs, units: ctx.api.getState().units }, ctx.api.getResult(), {
    libraryVersion: LIBRARY_VERSION, calcHash: ctx.calcHash, sharedHash: SHARED_HASH, generated: new Date().toISOString(), url: location.href,
  });
  const stampName = () => `${ctx.schema.id}-${new Date().toISOString().slice(0, 10)}`;
  print.addEventListener('click', () => window.print());
  copyMd.addEventListener('click', async () => {
    status.textContent = (await copyText(core.recordToMarkdown(ctx.schema, record()))) ? 'Markdown copied.' : 'Copy failed: use Download Markdown.';
  });
  saveMd.addEventListener('click', () => downloadText(`${stampName()}.md`, core.recordToMarkdown(ctx.schema, record()), 'text/markdown'));
  saveJson.addEventListener('click', () => downloadText(`${stampName()}.json`, `${JSON.stringify(record(), null, 2)}\n`, 'application/json'));
  loadJson.addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const chosen = file.files && file.files[0];
    if (!chosen) return;
    try {
      const loaded = core.readRecord(ctx.schema, await chosen.text(), { calcHash: ctx.calcHash });
      ctx.api.setState({ inputs: loaded.inputs, units: loaded.units });
      status.textContent = `Loaded the record of ${loaded.generated || 'an unknown date'}. ${loaded.notes.join(' ')}`.trim();
    } catch (error) {
      status.textContent = error.message;
    }
    file.value = '';
  });
  return { details, refresh() {} };
}

// ---- print -------------------------------------------------------------------------------------

/**
 * Form controls print badly (a unit menu keeps the width of its longest option and clips the chosen one), so just
 * before printing every field and result gets a plain "value unit" text that the print stylesheet shows instead.
 */
function addPrintValues(root) {
  for (const node of root.querySelectorAll('.ec-print-value, .ec-print-unit')) node.remove();
  const chosen = (select) => (select && select.selectedOptions[0] ? select.selectedOptions[0].textContent : '');
  for (const field of root.querySelectorAll('.ec-field')) {
    const control = field.querySelector('.ec-control > .ec-input, .ec-control > .ec-select, .ec-control > .ec-textarea');
    if (!control) continue;
    if (control.tagName === 'TEXTAREA') {
      field.append(el('pre', { class: 'ec-print-value ec-print-text', text: control.value }));
      continue;
    }
    const unit = field.querySelector('.ec-control > select.ec-unit');
    const unitText = unit ? chosen(unit) : field.querySelector('.ec-control > .ec-output-unit-static')?.textContent || '';
    const value = control.tagName === 'SELECT' ? chosen(control) : control.value;
    field.append(el('span', { class: control.tagName === 'SELECT' ? 'ec-print-value ec-print-choice' : 'ec-print-value', text: [value, unitText].filter(Boolean).join(' ') }));
  }
  for (const select of root.querySelectorAll('.ec-output > select.ec-output-unit')) {
    select.after(el('span', { class: 'ec-print-unit', text: chosen(select) }));
  }
}

function setupPrint(ctx, header) {
  let opened = [];
  window.addEventListener('beforeprint', () => {
    addPrintValues(document.querySelector('#calculator') || document);
    header.textContent = '';
    header.append(
      el('p', { class: 'ec-print-title', text: `${ctx.schema.name} — printed ${new Date().toLocaleString()}` }),
      el('p', { text: `Library ${LIBRARY_VERSION} · calc.js ${ctx.calcHash || 'unknown'} · shared ${SHARED_HASH}` }),
      el('p', { class: 'ec-print-url', text: location.href }),
    );
    for (const d of document.querySelectorAll('.ec-notes')) if (!d.open) opened.push(d);
    for (const d of opened) d.open = true;
  });
  window.addEventListener('afterprint', () => {
    for (const d of opened) d.open = false;
    opened = [];
    for (const node of document.querySelectorAll('.ec-print-value, .ec-print-unit')) node.remove();
  });
}
