/**
 * shared/ui.js — generic renderer: builds a working calculator from any schema + calculate() pair.
 *
 * The renderer knows nothing about physics. It:
 *   1. renders one field per schema input (number input, select or text area, plus a unit dropdown),
 *   2. converts what the user typed (a number or a formula such as 1500/60, see expression.js) from the chosen display
 *      unit to the schema unit, and shows "= value" under a field that holds a formula,
 *   3. validates min/max/integer in the schema unit and shows errors next to the field,
 *   4. calls calculate(inputs) and renders every output in its chosen display unit,
 *   5. exposes a small API (getState / setState / getResult / subscribe) that the tools panel builds on.
 *
 * Schema contract (see README.md):
 *   input:  { id, label, group, unit, default, min?, max?, integer?, help?, display?, visibleWhen? }
 *           { id, label, type: 'select', options: [{ value, label }], default, help?, visibleWhen? }
 *           { id, label, type: 'textarea', default: string, rows?, help?, visibleWhen? }  — raw text passed to calculate()
 *   output: { id, label, group, unit, decimals?, display?, visibleWhen? }
 *           { id, label, type: 'text', visibleWhen? }
 *           { id, label, type: 'table', visibleWhen? }  — calculate() returns { columns: [..], rows: [[..], ..] }
 *           { id, label, type: 'chart', visibleWhen? }  — calculate() returns { points: [{x, y}], xLabel, xUnit, yLabel, yUnit }
 *   visibleWhen: { <inputId>: value | [values] }  — all conditions must hold (AND).
 */
import { convert, unitsOf, unitLabel, getGroup } from './units.js';
import { evaluateExpression, isPlainNumber, numberFromText } from './expression.js';
import { exampleState, exampleTest } from './example.js';
import { runTests } from './test-runner.js';
import { DASH, formatNumber, el, renderTable } from './dom.js';
import { isVisible } from './features/core.js';
import { mountFeatures } from './features/panel.js';
import { renderLineChart } from './features/chart.js';

/** Outputs drawn full width in the Details panel instead of as a value with a unit. */
const isWide = (output) => output.type === 'table' || output.type === 'chart';

export { formatNumber, renderTable };

function groupHasChoice(groupId) {
  return groupId && unitsOf(groupId).length > 1;
}

function roundForInput(value) {
  if (!Number.isFinite(value)) return '';
  return String(Number(value.toPrecision(10)));
}

function fillSelectOptions(select, options, selectedValue) {
  select.innerHTML = '';
  for (const option of options) {
    select.append(el('option', { value: option.value, text: option.label, selected: String(option.value) === String(selectedValue) }));
  }
  if (options.length && !options.some((option) => String(option.value) === String(selectedValue))) select.value = options[0].value;
}

/** Options of a select at first render: static `options`, or the `optionsBy` map entry for the controlling select's default. */
function initialSelectOptions(schema, input) {
  if (!input.optionsBy) return input.options;
  const controller = schema.inputs.find((candidate) => candidate.id === input.optionsBy.field);
  if (!controller) throw new Error(`renderCalculator: "${input.id}" depends on unknown field "${input.optionsBy.field}"`);
  return input.optionsBy.options[controller.default] || [];
}

function buildUnitSelect(groupId, selectedUnitId, ariaLabel) {
  const select = el('select', { class: 'ec-unit', 'aria-label': ariaLabel });
  for (const unit of unitsOf(groupId)) {
    select.append(el('option', { value: unit.id, text: unit.label || unit.name, selected: unit.id === selectedUnitId }));
  }
  return select;
}

/**
 * Render a calculator into `root`.
 * @param {HTMLElement} root
 * @param {object} schema
 * @param {(inputs: object) => { outputs: object, warnings?: string[] }} calculate
 * @param {{ onUpdate?: (result, inputs) => void }} [options]
 * @returns {{ update, reset, getInputs, getState, setState, getResult, getLastInputs, getError, subscribe, schema }}
 */
export function renderCalculator(root, schema, calculate, options = {}) {
  if (!root) throw new Error('renderCalculator: root element is missing');
  if (!schema || !Array.isArray(schema.inputs) || !Array.isArray(schema.outputs)) {
    throw new Error('renderCalculator: schema needs inputs[] and outputs[]');
  }
  const prefix = `ec-${schema.id}`;
  const displayUnits = {};
  const fields = {};
  const outputRows = {};
  const listeners = [];
  let lastResult = null;
  let lastInputs = null;
  let lastError = null;

  root.innerHTML = '';
  root.classList.add('ec-calc');

  // ---- inputs -------------------------------------------------------------------------------
  const form = el('form', { class: 'ec-form', novalidate: true, 'aria-labelledby': `${prefix}-inputs-heading` });
  form.addEventListener('submit', (event) => event.preventDefault());
  const inputsPanel = el('section', { class: 'ec-panel' }, [
    el('h2', { class: 'ec-panel-heading', id: `${prefix}-inputs-heading`, text: 'Inputs' }),
    form,
  ]);

  for (const input of schema.inputs) {
    const controlId = `${prefix}-${input.id}`;
    const helpId = `${controlId}-help`;
    const errorId = `${controlId}-error`;
    const computedId = `${controlId}-computed`;
    const numeric = !input.type;
    const describedBy = [input.help ? helpId : null, numeric ? computedId : null, errorId].filter(Boolean).join(' ');
    let control;
    let unitSelect = null;

    if (input.type === 'select') {
      control = el('select', { class: 'ec-select', id: controlId, 'aria-describedby': describedBy });
      fillSelectOptions(control, initialSelectOptions(schema, input), input.default);
    } else if (input.type === 'textarea') {
      control = el('textarea', { class: 'ec-textarea', id: controlId, rows: String(input.rows || 8), wrap: 'off', spellcheck: 'false', autocomplete: 'off', 'aria-describedby': describedBy });
      control.value = input.default ?? '';
    } else {
      if (!input.group) throw new Error(`renderCalculator: input "${input.id}" needs a unit group`);
      getGroup(input.group);
      displayUnits[input.id] = input.display || input.unit;
      // a text field (not type=number) so that formulas such as 1500/60 can be typed; the arrow keys still step by 1
      control = el('input', {
        class: 'ec-input',
        id: controlId,
        type: 'text',
        inputmode: input.integer ? 'numeric' : 'decimal',
        value: roundForInput(convert(input.default, input.unit, displayUnits[input.id], input.group)),
        'aria-describedby': describedBy,
        autocomplete: 'off',
        spellcheck: 'false',
      });
      control.addEventListener('keydown', (event) => {
        if ((event.key !== 'ArrowUp' && event.key !== 'ArrowDown') || !isPlainNumber(control.value)) return;
        event.preventDefault();
        const step = (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 10 : 1);
        control.value = String(Number((Number(control.value) + step).toPrecision(12)));
        scheduleUpdate();
      });
      if (groupHasChoice(input.group)) {
        unitSelect = buildUnitSelect(input.group, displayUnits[input.id], `Unit for ${input.label}`);
      } else if (unitLabel(input.group, input.unit)) {
        unitSelect = el('span', { class: 'ec-output-unit-static', text: unitLabel(input.group, input.unit) });
      }
    }

    const field = el('div', { class: 'ec-field', 'data-field': input.id }, [
      el('label', { class: 'ec-label', for: controlId, text: input.label }),
      el('div', { class: 'ec-control' }, [control, unitSelect]),
      input.help ? el('p', { class: 'ec-help', id: helpId, text: input.help }) : null,
      numeric ? el('p', { class: 'ec-computed', id: computedId, hidden: true }) : null,
      el('p', { class: 'ec-error', id: errorId, hidden: true }),
    ]);
    form.append(field);
    fields[input.id] = { spec: input, field, control, unitSelect, errorEl: field.querySelector('.ec-error'), computedEl: field.querySelector('.ec-computed') };

    control.addEventListener('input', scheduleUpdate);
    control.addEventListener('change', update);
    if (unitSelect && unitSelect.tagName === 'SELECT') {
      unitSelect.addEventListener('change', () => {
        const previousUnit = displayUnits[input.id];
        const nextUnit = unitSelect.value;
        const current = numberFromText(control.value);
        if (control.value !== '' && Number.isFinite(current)) {
          control.value = roundForInput(convert(current, previousUnit, nextUnit, input.group));
        }
        displayUnits[input.id] = nextUnit;
        update();
      });
    }
  }

  const resetButton = el('button', { type: 'button', class: 'ec-button', text: 'Reset to defaults' });
  resetButton.addEventListener('click', reset);
  form.append(el('div', { class: 'ec-actions' }, [resetButton]));

  // ---- outputs ------------------------------------------------------------------------------
  const status = el('p', { class: 'ec-status ec-status-error', role: 'alert', hidden: true });
  const outputList = el('ul', { class: 'ec-outputs', 'aria-live': 'polite', 'aria-labelledby': `${prefix}-outputs-heading` });
  const warningsEl = el('ul', { class: 'ec-warnings', 'aria-live': 'polite', hidden: true });
  const outputsPanel = el('section', { class: 'ec-panel' }, [
    el('h2', { class: 'ec-panel-heading', id: `${prefix}-outputs-heading`, text: 'Results' }),
    status,
    outputList,
    warningsEl,
  ]);
  // Table outputs get a full-width panel below inputs and results so their columns have room.
  const hasTables = schema.outputs.some(isWide);
  const tableList = hasTables ? el('ul', { class: 'ec-outputs' }) : null;
  const tablesPanel = hasTables ? el('section', { class: 'ec-panel ec-panel-wide' }, [el('h2', { class: 'ec-panel-heading', text: 'Details' }), tableList]) : null;

  for (const output of schema.outputs) {
    const labelId = `${prefix}-${output.id}-label`;
    const valueEl = isWide(output)
      ? el('div', { class: `ec-output-value ${output.type === 'chart' ? 'ec-chart-wrap' : 'ec-table-wrap'}`, role: 'region', tabindex: '0', 'aria-labelledby': labelId, text: DASH })
      : el('output', {
        class: `ec-output-value${output.type === 'text' ? ' ec-output-text' : ''}`,
        'aria-labelledby': labelId,
        text: DASH,
      });
    let unitControl = null;
    if (output.type !== 'text' && !isWide(output)) {
      if (!output.group) throw new Error(`renderCalculator: output "${output.id}" needs a unit group or type "text"`);
      displayUnits[output.id] = output.display || output.unit;
      if (groupHasChoice(output.group)) {
        unitControl = buildUnitSelect(output.group, displayUnits[output.id], `Unit for ${output.label}`);
        unitControl.classList.add('ec-output-unit');
        unitControl.addEventListener('change', () => {
          displayUnits[output.id] = unitControl.value;
          update();
        });
      } else if (unitLabel(output.group, output.unit)) {
        unitControl = el('span', { class: 'ec-output-unit-static', text: unitLabel(output.group, output.unit) });
      }
    }
    const row = el('li', { class: `ec-output${isWide(output) ? ' ec-output-wide' : ''}`, 'data-output': output.id }, [
      el('span', { class: 'ec-output-label', id: labelId, text: output.label }),
      valueEl,
      unitControl,
    ]);
    (isWide(output) ? tableList : outputList).append(row);
    outputRows[output.id] = { spec: output, row, valueEl, unitControl };
  }

  root.append(inputsPanel, outputsPanel);
  if (tablesPanel) root.append(tablesPanel);

  // ---- behaviour ----------------------------------------------------------------------------
  function readSelectValues() {
    const values = {};
    for (const [id, { spec, control }] of Object.entries(fields)) {
      if (spec.type === 'select') values[id] = control.value;
    }
    return values;
  }

  function validateField({ spec, control }) {
    const raw = control.value;
    if (spec.type === 'select' || spec.type === 'textarea') return { value: raw };
    let typed;
    try {
      typed = evaluateExpression(raw);
    } catch (error) {
      return { error: error.message };
    }
    if (spec.integer && !Number.isInteger(typed)) return { error: 'Enter a whole number.', typed };
    const displayUnit = displayUnits[spec.id];
    const value = convert(typed, displayUnit, spec.unit, spec.group);
    const label = unitLabel(spec.group, displayUnit);
    const limit = (schemaValue) => `${formatNumber(convert(schemaValue, spec.unit, displayUnit, spec.group))}${label ? ` ${label}` : ''}`;
    const tolerance = 1e-9 * Math.max(1, Math.abs(value));
    if (spec.min !== undefined && value < spec.min - tolerance) return { error: `Must be at least ${limit(spec.min)}.`, typed };
    if (spec.max !== undefined && value > spec.max + tolerance) return { error: `Must be at most ${limit(spec.max)}.`, typed };
    return { value, typed };
  }

  /** Show "= value unit" under a number field that holds a formula (also when the value is out of range); hide it otherwise. */
  function setComputed(entry, typed) {
    if (!entry.computedEl) return;
    const show = typed !== undefined && !isPlainNumber(entry.control.value);
    entry.computedEl.hidden = !show;
    if (show) {
      const label = unitLabel(entry.spec.group, displayUnits[entry.spec.id]);
      entry.computedEl.textContent = `= ${formatNumber(typed)}${label ? ` ${label}` : ''}`;
    }
  }

  function setFieldError(entry, message) {
    entry.errorEl.textContent = message || '';
    entry.errorEl.hidden = !message;
    if (entry.spec.type !== 'select' && entry.spec.type !== 'textarea') {
      if (message) entry.control.setAttribute('aria-invalid', 'true');
      else entry.control.removeAttribute('aria-invalid');
    }
  }

  function clearOutputs() {
    for (const { valueEl } of Object.values(outputRows)) valueEl.textContent = DASH;
  }

  function renderWarnings(warnings) {
    warningsEl.innerHTML = '';
    const list = (warnings || []).filter(Boolean);
    warningsEl.hidden = list.length === 0;
    for (const text of list) warningsEl.append(el('li', { text }));
  }

  /** Rebuild the options of selects declared with `optionsBy` when their controlling select changed. */
  function syncDependentSelects() {
    for (const entry of Object.values(fields)) {
      const dependency = entry.spec.optionsBy;
      if (!dependency) continue;
      const key = fields[dependency.field].control.value;
      if (entry.lastKey === key) continue;
      const choices = dependency.options[key] || [];
      const current = entry.control.value;
      const fallback = (choices[dependency.defaultIndex ?? 0] || choices[0] || {}).value;
      const keep = entry.lastKey === undefined && choices.some((choice) => String(choice.value) === current) ? current : fallback;
      fillSelectOptions(entry.control, choices, keep);
      entry.lastKey = key;
    }
  }

  function notify(result, inputs) {
    if (typeof options.onUpdate === 'function') options.onUpdate(result, inputs);
    for (const listener of listeners) listener(result, inputs);
  }

  // Typing and arrow keys recalculate after the browser has painted the keystroke, so the
  // character appears at once even on a heavy calculator (Interaction to Next Paint). Keys
  // typed within one frame share one recalculation; any direct update() cancels the queued one.
  let queued = false;
  function scheduleUpdate() {
    if (queued) return;
    queued = true;
    const run = () => setTimeout(() => { if (queued) update(); }, 0);
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run); else run();
  }

  function update() {
    queued = false;
    syncDependentSelects();
    const selectValues = readSelectValues();
    const inputs = {};
    let errorCount = 0;

    for (const entry of Object.values(fields)) {
      const visible = isVisible(entry.spec, selectValues);
      entry.field.hidden = !visible;
      if (!visible) {
        setFieldError(entry, '');
        setComputed(entry);
        inputs[entry.spec.id] = entry.spec.default;
        continue;
      }
      const result = validateField(entry);
      setComputed(entry, result.typed);
      if (result.error) {
        errorCount += 1;
        setFieldError(entry, result.error);
        inputs[entry.spec.id] = entry.spec.default;
      } else {
        setFieldError(entry, '');
        inputs[entry.spec.id] = result.value;
      }
    }

    for (const { spec, row } of Object.values(outputRows)) row.hidden = !isVisible(spec, inputs);
    if (tablesPanel) tablesPanel.hidden = schema.outputs.filter(isWide).every((o) => outputRows[o.id].row.hidden);

    if (errorCount > 0) {
      status.textContent = errorCount === 1 ? 'Fix the highlighted field to see results.' : `Fix the ${errorCount} highlighted fields to see results.`;
      status.hidden = false;
      clearOutputs();
      renderWarnings([]);
      lastResult = null;
      lastInputs = null;
      lastError = status.textContent;
      notify(null, inputs);
      return;
    }

    let result;
    try {
      result = calculate(inputs);
    } catch (error) {
      status.textContent = error.message;
      status.hidden = false;
      clearOutputs();
      renderWarnings([]);
      lastResult = null;
      lastInputs = null;
      lastError = error.message;
      notify(null, inputs);
      return;
    }
    status.hidden = true;

    for (const { spec, valueEl } of Object.values(outputRows)) {
      const value = result.outputs ? result.outputs[spec.id] : undefined;
      if (spec.type === 'text') {
        valueEl.textContent = value === undefined || value === null ? DASH : String(value);
      } else if (spec.type === 'table') {
        renderTable(valueEl, value);
      } else if (spec.type === 'chart') {
        if (value && Array.isArray(value.points)) renderLineChart(valueEl, { ...value, height: 220 });
        else valueEl.textContent = DASH;
      } else if (typeof value === 'number') {
        const converted = convert(value, spec.unit, displayUnits[spec.id], spec.group);
        valueEl.textContent = formatNumber(converted, { decimals: spec.decimals });
      } else {
        valueEl.textContent = DASH;
      }
    }
    renderWarnings(result.warnings);
    lastResult = result;
    lastInputs = inputs;
    lastError = null;
    notify(result, inputs);
  }

  function reset() {
    for (const entry of Object.values(fields)) {
      if (entry.spec.type === 'textarea') {
        entry.control.value = entry.spec.default ?? '';
      } else if (entry.spec.type === 'select') {
        if (entry.spec.optionsBy) {
          entry.lastKey = undefined;
          fillSelectOptions(entry.control, initialSelectOptions(schema, entry.spec), entry.spec.default);
        }
        entry.control.value = entry.spec.default;
      } else {
        displayUnits[entry.spec.id] = entry.spec.display || entry.spec.unit;
        if (entry.unitSelect && entry.unitSelect.tagName === 'SELECT') entry.unitSelect.value = displayUnits[entry.spec.id];
        entry.control.value = roundForInput(convert(entry.spec.default, entry.spec.unit, displayUnits[entry.spec.id], entry.spec.group));
      }
    }
    for (const { spec, unitControl } of Object.values(outputRows)) {
      if (spec.type === 'text' || isWide(spec)) continue;
      displayUnits[spec.id] = spec.display || spec.unit;
      if (unitControl && unitControl.tagName === 'SELECT') unitControl.value = displayUnits[spec.id];
    }
    update();
  }

  /** Current values in schema units (undefined where a field is invalid); hidden fields report their default. */
  function getInputs() {
    const selectValues = readSelectValues();
    const inputs = {};
    for (const entry of Object.values(fields)) {
      const result = isVisible(entry.spec, selectValues) ? validateField(entry) : { value: entry.spec.default };
      inputs[entry.spec.id] = result.error ? undefined : result.value;
    }
    return inputs;
  }

  function getState() {
    return { inputs: getInputs(), units: { ...displayUnits } };
  }

  /**
   * Apply display units, then values given in schema units (unknown ids and invalid select values are skipped),
   * then recalculate once.
   */
  function setState({ inputs = {}, units = {} } = {}) {
    for (const [id, unitId] of Object.entries(units)) {
      if (!(id in displayUnits)) continue;
      const entry = fields[id];
      const spec = entry ? entry.spec : outputRows[id]?.spec;
      if (!spec || !getGroup(spec.group).units[unitId]) continue;
      if (entry) {
        const typed = numberFromText(entry.control.value);
        if (entry.control.value !== '' && Number.isFinite(typed)) entry.control.value = roundForInput(convert(typed, displayUnits[id], unitId, spec.group));
        if (entry.unitSelect && entry.unitSelect.tagName === 'SELECT') entry.unitSelect.value = unitId;
      } else if (outputRows[id].unitControl && outputRows[id].unitControl.tagName === 'SELECT') {
        outputRows[id].unitControl.value = unitId;
      }
      displayUnits[id] = unitId;
    }
    for (const input of schema.inputs) {
      if (!(input.id in inputs)) continue;
      const entry = fields[input.id];
      const value = inputs[input.id];
      if (input.type === 'select') {
        if (input.optionsBy) syncDependentSelects();
        if ([...entry.control.options].some((o) => o.value === String(value))) entry.control.value = String(value);
      } else if (input.type === 'textarea') {
        entry.control.value = String(value ?? '');
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        entry.control.value = roundForInput(convert(value, input.unit, displayUnits[input.id], input.group));
      }
    }
    update();
  }

  function subscribe(listener) {
    listeners.push(listener);
    return () => {
      const k = listeners.indexOf(listener);
      if (k >= 0) listeners.splice(k, 1);
    };
  }

  update();
  return {
    schema,
    update,
    reset,
    getInputs,
    getState,
    setState,
    subscribe,
    getResult: () => lastResult,
    getLastInputs: () => (lastInputs ? { ...lastInputs } : null),
    getError: () => lastError,
  };
}

/**
 * Render a "run self-tests" panel for a calculator's tests.js.
 */
export function renderTestPanel(root, tests, { title = 'Self-tests' } = {}) {
  if (!root) throw new Error('renderTestPanel: root element is missing');
  root.innerHTML = '';
  root.classList.add('ec-panel');
  const list = el('ul', { class: 'ec-test-list' });
  const summary = el('p', { class: 'ec-test-summary', 'aria-live': 'polite' });
  const button = el('button', { type: 'button', class: 'ec-button', text: `Run ${tests.length} self-tests` });
  button.addEventListener('click', () => {
    const report = runTests(tests);
    list.innerHTML = '';
    for (const result of report.results) {
      list.append(el('li', { class: `ec-test ${result.ok ? 'ec-test-pass' : 'ec-test-fail'}` }, [
        result.name,
        result.ok ? null : el('span', { class: 'ec-test-error', text: result.error }),
        result.source ? el('span', { class: 'ec-test-source', text: `Source: ${result.source}` }) : null,
      ]));
    }
    summary.textContent = `${report.passed}/${report.total} passed`;
  });
  root.append(
    el('h2', { class: 'ec-panel-heading', text: title }),
    el('p', { class: 'ec-help', text: 'Each test checks calculate() against a textbook value, a standard or a published table. Sources are listed with the results.' }),
    button,
    list,
    summary,
  );
}

/**
 * Render the calculator's fixed assumptions, caveats and sources (schema.assumptions / schema.sources).
 */
export function renderNotesPanel(root, schema) {
  if (!root) throw new Error('renderNotesPanel: root element is missing');
  const assumptions = schema.assumptions || [];
  const sources = schema.sources || [];
  root.innerHTML = '';
  const details = el('details', { class: 'ec-notes ec-panel' }, [
    el('summary', { class: 'ec-notes-summary', text: `Assumptions, caveats and sources (${assumptions.length})` }),
    assumptions.length ? el('h3', { class: 'ec-notes-heading', text: 'Assumptions and caveats' }) : null,
    assumptions.length ? el('ul', { class: 'ec-notes-list' }, assumptions.map((text) => el('li', { text }))) : null,
    sources.length ? el('h3', { class: 'ec-notes-heading', text: 'Sources' }) : null,
    sources.length ? el('ul', { class: 'ec-notes-list' }, sources.map((text) => el('li', { text }))) : null,
  ]);
  root.append(details);
}

/** "Load this example": a button at the top of the article's worked example that puts its inputs into the calculator. */
function mountExampleLoader(section, schema, api, calcRoot) {
  const status = el('p', { class: 'ec-example-status', role: 'status' });
  const button = el('button', { type: 'button', class: 'ec-button', text: 'Load this example into the calculator' });
  button.addEventListener('click', () => {
    const { inputs, units } = exampleState(schema);
    api.reset();
    api.setState({ inputs, units });
    const error = api.getError();
    status.textContent = error
      ? `The example did not calculate: ${error}`
      : 'Loaded: the calculator above holds this example, with the results in the units used here.';
    calcRoot.scrollIntoView({ block: 'start' });
  });
  section.querySelector('h2').after(el('div', { class: 'ec-example-load' }, [button, status]));
}

/**
 * Convenience for the standalone pages: renders the calculator into #calculator, the tools panel below it,
 * the assumptions into #notes and the tests into #tests.
 */
export function mountCalculatorPage({ schema, calculate, tests = [], features = true }) {
  const calcRoot = document.getElementById('calculator');
  const notesRoot = document.getElementById('notes');
  const testsRoot = document.getElementById('tests');
  const api = renderCalculator(calcRoot, schema, calculate);
  if (notesRoot && ((schema.assumptions && schema.assumptions.length) || (schema.sources && schema.sources.length))) renderNotesPanel(notesRoot, schema);
  const worked = document.querySelector('.ec-article-section[data-section="worked-example"]');
  const allTests = schema.example ? [...tests, exampleTest(schema, calculate, worked ? worked.textContent : null)] : tests;
  if (testsRoot && allTests.length) renderTestPanel(testsRoot, allTests);
  if (schema.example && worked) mountExampleLoader(worked, schema, api, calcRoot);
  if (features) mountFeatures({ schema, calculate, api, anchor: calcRoot });
  return api;
}
