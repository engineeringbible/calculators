/**
 * shared/features/chart.js — the SVG charts of the tools panel: the sweep's line chart, the tornado's ranked bars and
 * the heat map's colour grid.
 *
 * Follows the dataviz rules: one y-axis per chart (several outputs → several charts), 2 px line with round joins,
 * ≥ 8 px markers with a 2 px surface ring, hairline solid gridlines, text in text colours, a crosshair and
 * tooltip on hover with the same readout on keyboard focus (arrow keys), and a table view kept by the caller.
 * The tornado uses two validated series colours (blue, Signal Orange) with a legend that also names the bar position;
 * the heat map uses one sequential hue in seven equal-interval classes with a stepped legend, hatched cells where the
 * calculator gives no result and a per-cell tooltip. Bars and cells are their own hover and focus targets.
 * The SVG is drawn at the container's real pixel width (no viewBox scaling) so text stays ≥ 12 px on phones.
 *
 * The scale, tick, path and class helpers are pure and tested in Node; the render functions need a DOM.
 */
import { formatNumber } from '../format.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** A "nice" tick step (1, 2, 2.5 or 5 × 10ⁿ) for a range and a maximum tick count. */
export function niceStep(range, maxTicks = 6) {
  const rough = range / Math.max(1, maxTicks - 1);
  const power = 10 ** Math.floor(Math.log10(rough));
  const m = rough / power;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return nice * power;
}

/** Linear axis: rounded limits that contain [min, max] and the ticks between them. */
export function niceTicks(min, max, maxTicks = 6) {
  let lo = min;
  let hi = max;
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { min: 0, max: 1, ticks: [0, 1], step: 1 };
  if (lo === hi) {
    const pad = Math.abs(lo) * 0.1 || 1;
    lo -= pad;
    hi += pad;
  }
  const step = niceStep(hi - lo, maxTicks);
  const start = Math.floor(lo / step + 1e-9) * step;
  const end = Math.ceil(hi / step - 1e-9) * step;
  const ticks = [];
  for (let v = start; v <= end + step * 1e-6; v += step) ticks.push(Number(v.toPrecision(12)));
  return { min: start, max: end, ticks, step };
}

/** Logarithmic axis ticks at 1, 2 and 5 × 10ⁿ inside [min, max] (min > 0). */
export function logTicks(min, max) {
  const ticks = [];
  for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e += 1) {
    for (const m of [1, 2, 5]) {
      const v = m * 10 ** e;
      if (v >= min * (1 - 1e-9) && v <= max * (1 + 1e-9)) ticks.push(Number(v.toPrecision(12)));
    }
  }
  return ticks.length >= 2 ? ticks : [min, max];
}

/** Scale from data [d0, d1] to pixels [r0, r1]; log scale when `log` is true. */
export function makeScale(d0, d1, r0, r1, log = false) {
  if (log) {
    const a = Math.log(d0);
    const b = Math.log(d1);
    return (v) => r0 + ((Math.log(v) - a) / (b - a || 1)) * (r1 - r0);
  }
  return (v) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
}

/** SVG path strings for a series, broken into separate segments wherever y is null. */
export function pathSegments(points, sx, sy) {
  const segments = [];
  let current = '';
  for (const p of points) {
    if (p.y === null || p.y === undefined || !Number.isFinite(p.y)) {
      if (current) segments.push(current);
      current = '';
      continue;
    }
    const cmd = current ? 'L' : 'M';
    current += `${cmd}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`;
  }
  if (current) segments.push(current);
  return segments;
}

/** Index of the point whose x is nearest to `x`. */
export function nearestIndex(points, x) {
  let best = 0;
  for (let k = 1; k < points.length; k += 1) if (Math.abs(points[k].x - x) < Math.abs(points[best].x - x)) best = k;
  return best;
}

function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  return node;
}

/** Shorten a rendered x-axis title with an ellipsis (keeping the unit) until it fits the chart, keep it inside the frame, and put the full text in a tooltip. */
function fitAxisTitle(text, label, unit, width) {
  if (typeof text.getComputedTextLength !== 'function' || text.getComputedTextLength() === 0) return;
  const suffix = unit ? ` (${unit})` : '';
  let kept = label.length;
  while (text.getComputedTextLength() > width - 8 && kept > 4) {
    kept -= 1;
    text.textContent = `${label.slice(0, kept).trimEnd()}…${suffix}`;
  }
  if (kept < label.length) {
    const tooltip = svg('title', {});
    tooltip.textContent = `${label}${suffix}`;
    text.append(tooltip);
  }
  const half = text.getComputedTextLength() / 2;
  text.setAttribute('x', Math.min(Math.max(Number(text.getAttribute('x')), half + 4), width - half - 4).toFixed(1));
}

/**
 * Draw a line chart into `container` (emptied first).
 * @param {HTMLElement} container
 * @param {{ points: {x:number,y:number|null}[], xLabel: string, yLabel: string, xUnit: string, yUnit: string,
 *           logX?: boolean, current?: {x:number,y:number|null}, width?: number, height?: number }} spec
 */
export function renderLineChart(container, spec) {
  container.innerHTML = '';
  const width = Math.max(240, Math.round(spec.width || container.clientWidth || 600));
  const height = spec.height || 240;
  const valid = spec.points.filter((p) => p.y !== null && Number.isFinite(p.y));
  const fmt = (v) => formatNumber(v);
  if (valid.length === 0) {
    container.append(Object.assign(document.createElement('p'), { className: 'ec-help', textContent: 'No valid results in this range.' }));
    return;
  }
  const yAxis = niceTicks(Math.min(...valid.map((p) => p.y)), Math.max(...valid.map((p) => p.y)), 5);
  const xs = spec.points.map((p) => p.x);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const logX = Boolean(spec.logX) && xMin > 0;
  const xAxis = logX ? { min: xMin, max: xMax, ticks: logTicks(xMin, xMax) } : niceTicks(xMin, xMax, Math.max(3, Math.min(7, Math.floor(width / 90))));
  const yLabels = yAxis.ticks.map(fmt);
  const xLabels = xAxis.ticks.map(fmt);
  // ~7.4 px per character of 12 px Source Code Pro; the right margin holds half of the widest x label
  const margin = {
    top: 12,
    right: Math.max(16, Math.ceil(3.7 * Math.max(...xLabels.map((s) => s.length))) + 4),
    bottom: 40,
    left: Math.max(40, 12 + 7.4 * Math.max(...yLabels.map((s) => s.length))),
  };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const sx = makeScale(logX ? xAxis.min : xAxis.min, xAxis.max, margin.left, margin.left + plotW, logX);
  const sy = makeScale(yAxis.min, yAxis.max, margin.top + plotH, margin.top);

  const root = svg('svg', { class: 'ec-chart-svg', width, height, role: 'img', 'aria-label': `${spec.yLabel} against ${spec.xLabel}` });
  const grid = svg('g', { class: 'ec-chart-grid' });
  yAxis.ticks.forEach((t, k) => {
    const y = sy(t).toFixed(1);
    grid.append(svg('line', { x1: margin.left, x2: margin.left + plotW, y1: y, y2: y }));
    const label = svg('text', { x: margin.left - 8, y, 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'ec-chart-tick' });
    label.textContent = yLabels[k];
    grid.append(label);
  });
  xAxis.ticks.forEach((t, k) => {
    if (t < xAxis.min - 1e-12 || t > xAxis.max + 1e-12) return;
    const x = sx(t).toFixed(1);
    const label = svg('text', { x, y: margin.top + plotH + 18, 'text-anchor': 'middle', class: 'ec-chart-tick' });
    label.textContent = xLabels[k];
    grid.append(label);
  });
  grid.append(svg('line', { class: 'ec-chart-axis', x1: margin.left, x2: margin.left + plotW, y1: margin.top + plotH, y2: margin.top + plotH }));
  const xTitle = svg('text', { x: margin.left + plotW / 2, y: height - 4, 'text-anchor': 'middle', class: 'ec-chart-axis-title' });
  xTitle.textContent = `${spec.xLabel}${spec.xUnit ? ` (${spec.xUnit})` : ''}`;
  root.append(grid, xTitle);

  for (const d of pathSegments(spec.points, sx, sy)) root.append(svg('path', { d, class: 'ec-chart-line' }));

  if (spec.current && spec.current.y !== null && Number.isFinite(spec.current.y) && spec.current.x >= xAxis.min && spec.current.x <= xAxis.max) {
    const cx = sx(spec.current.x);
    const cy = sy(spec.current.y);
    root.append(svg('circle', { cx, cy, r: 5, class: 'ec-chart-current' }));
    const tag = svg('text', { x: Math.min(cx + 10, margin.left + plotW - 4), y: Math.max(cy - 10, margin.top + 10), 'text-anchor': cx + 10 > margin.left + plotW - 80 ? 'end' : 'start', class: 'ec-chart-label' });
    tag.textContent = `current ${fmt(spec.current.y)}`;
    root.append(tag);
  }

  const cross = svg('line', { class: 'ec-chart-crosshair', y1: margin.top, y2: margin.top + plotH, visibility: 'hidden' });
  const dot = svg('circle', { r: 5, class: 'ec-chart-hover', visibility: 'hidden' });
  const hit = svg('rect', { x: margin.left, y: margin.top, width: plotW, height: plotH, class: 'ec-chart-hit' });
  root.append(cross, dot, hit);

  const tip = document.createElement('div');
  tip.className = 'ec-chart-tip';
  tip.hidden = true;
  const tipValue = document.createElement('strong');
  const tipLabel = document.createElement('span');
  tip.append(tipValue, tipLabel);

  const wrap = document.createElement('div');
  wrap.className = 'ec-chart-frame';
  wrap.tabIndex = 0;
  wrap.setAttribute('aria-label', `${spec.yLabel} against ${spec.xLabel}: use the arrow keys to read values`);
  wrap.append(root, tip);
  container.append(wrap);
  fitAxisTitle(xTitle, spec.xLabel, spec.xUnit, width);

  let index = spec.current ? nearestIndex(spec.points, spec.current.x) : 0;
  const show = (k) => {
    index = Math.max(0, Math.min(spec.points.length - 1, k));
    const p = spec.points[index];
    const x = sx(p.x);
    cross.setAttribute('x1', x.toFixed(1));
    cross.setAttribute('x2', x.toFixed(1));
    cross.setAttribute('visibility', 'visible');
    if (p.y !== null && Number.isFinite(p.y)) {
      dot.setAttribute('cx', x.toFixed(1));
      dot.setAttribute('cy', sy(p.y).toFixed(1));
      dot.setAttribute('visibility', 'visible');
    } else dot.setAttribute('visibility', 'hidden');
    tipValue.textContent = p.y === null || !Number.isFinite(p.y) ? 'no result' : `${fmt(p.y)}${spec.yUnit ? ` ${spec.yUnit}` : ''}`;
    tipLabel.textContent = `${spec.xLabel} ${fmt(p.x)}${spec.xUnit ? ` ${spec.xUnit}` : ''}`;
    tip.hidden = false;
    const tipWidth = tip.offsetWidth;
    let left = x + 12;
    if (left + tipWidth > width - 4) left = x - 12 - tipWidth;
    tip.style.left = `${Math.max(4, left)}px`;
    tip.style.top = `${margin.top}px`;
  };
  const hide = () => {
    cross.setAttribute('visibility', 'hidden');
    dot.setAttribute('visibility', 'hidden');
    tip.hidden = true;
  };
  const toData = (clientX) => {
    const box = root.getBoundingClientRect();
    const px = clientX - box.left;
    if (logX) return Math.exp(Math.log(xAxis.min) + ((px - margin.left) / plotW) * (Math.log(xAxis.max) - Math.log(xAxis.min)));
    return xAxis.min + ((px - margin.left) / plotW) * (xAxis.max - xAxis.min);
  };
  hit.addEventListener('pointermove', (event) => show(nearestIndex(spec.points, toData(event.clientX))));
  hit.addEventListener('pointerleave', hide);
  wrap.addEventListener('focus', () => show(index));
  wrap.addEventListener('blur', hide);
  wrap.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { show(index + 1); event.preventDefault(); }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { show(index - 1); event.preventDefault(); }
    else if (event.key === 'Home') { show(0); event.preventDefault(); }
    else if (event.key === 'End') { show(spec.points.length - 1); event.preventDefault(); }
    else if (event.key === 'Escape') hide();
  });
}

// ---- tornado and heat map --------------------------------------------------------------------

const HEAT_CLASSES = 7;
const TORNADO_ROW = 52;
const TORNADO_BAR = 10;
let patternCount = 0;

/** Equal-interval class (0 … classes − 1) of a value between min and max; a flat field takes the middle class. */
export function heatClass(value, min, max, classes = HEAT_CLASSES) {
  if (!(max > min)) return Math.floor(classes / 2);
  return Math.min(classes - 1, Math.max(0, Math.floor(((value - min) / (max - min)) * classes)));
}

/** The class limits min, min + Δ, …, max of the heat-map legend. */
export function heatBreaks(min, max, classes = HEAT_CLASSES) {
  return Array.from({ length: classes + 1 }, (_, k) => min + ((max - min) * k) / classes);
}

/** Cell edges around grid values: midpoints between them and half a step beyond the ends (geometric on a log axis). */
export function cellEdges(values, log = false) {
  const t = log ? values.map(Math.log) : values;
  const back = log ? Math.exp : (v) => v;
  const n = t.length;
  if (n === 1) return [back(t[0] - 0.5), back(t[0] + 0.5)];
  const edges = [t[0] - (t[1] - t[0]) / 2];
  for (let k = 1; k < n; k += 1) edges.push((t[k - 1] + t[k]) / 2);
  edges.push(t[n - 1] + (t[n - 1] - t[n - 2]) / 2);
  return edges.map(back);
}

/** Shorten a left-aligned SVG label with an ellipsis until it fits `width`; the full text goes into a tooltip. */
function fitLabel(text, full, width) {
  if (typeof text.getComputedTextLength !== 'function' || text.getComputedTextLength() === 0) return;
  let kept = full.length;
  while (text.getComputedTextLength() > width && kept > 4) {
    kept -= 1;
    text.textContent = `${full.slice(0, kept).trimEnd()}…`;
  }
  if (kept < full.length) {
    const tooltip = svg('title', {});
    tooltip.textContent = full;
    text.append(tooltip);
  }
}

/** A horizontal bar from x0 (the baseline, square) to x1 (the data end, 4 px rounded); top y, height h. */
function barPath(x0, x1, y, h) {
  const r = Math.min(4, Math.abs(x1 - x0) / 2, h / 2);
  const dir = x1 >= x0 ? 1 : -1;
  const turn = dir > 0 ? 1 : 0;
  const xr = x1 - dir * r;
  const f = (v) => v.toFixed(1);
  return `M${f(x0)},${f(y)}H${f(xr)}A${r.toFixed(2)},${r.toFixed(2)} 0 0 ${turn} ${f(x1)},${f(y + r)}V${f(y + h - r)}A${r.toFixed(2)},${r.toFixed(2)} 0 0 ${turn} ${f(xr)},${f(y + h)}H${f(x0)}Z`;
}

/** Legend list: a colour key beside text in text colours (identity never by colour alone). */
function legendList(items) {
  const list = document.createElement('ul');
  list.className = 'ec-chart-legend';
  for (const { swatch, text } of items) {
    const key = document.createElement('span');
    key.className = `ec-chart-swatch ${swatch}`;
    key.setAttribute('aria-hidden', 'true');
    const item = document.createElement('li');
    item.append(key, document.createTextNode(text));
    list.append(item);
  }
  return list;
}

/** Tooltip box (value first, two label lines) and the focusable frame that holds the SVG. */
function chartFrame(root, label) {
  const tip = document.createElement('div');
  tip.className = 'ec-chart-tip ec-chart-tip-wrap';
  tip.hidden = true;
  const value = document.createElement('strong');
  const lines = [document.createElement('span'), document.createElement('span')];
  tip.append(value, ...lines);
  const wrap = document.createElement('div');
  wrap.className = 'ec-chart-frame';
  wrap.tabIndex = 0;
  wrap.setAttribute('aria-label', label);
  wrap.append(root, tip);
  return { wrap, tip, value, lines };
}

/** Place the tooltip right of `right` (or left of `left` when it would overflow `width`), its top at `top`. */
function placeTip(tip, left, right, top, width) {
  tip.hidden = false;
  tip.style.left = '0px';
  const tipWidth = tip.offsetWidth;
  const x = right + 10 + tipWidth > width - 4 ? left - 10 - tipWidth : right + 10;
  tip.style.left = `${Math.max(4, x)}px`;
  tip.style.top = `${Math.max(0, top)}px`;
}

/**
 * Draw a tornado chart into `container` (emptied first): per input a label line and two bars measured from the
 * current result, the upper for the lower input value and the lower for the higher one, in the order given.
 * @param {HTMLElement} container
 * @param {{ base: number, rows: {label: string, name: string, unit: string, low: {x:number,y:number|null}|null,
 *           high: {x:number,y:number|null}|null}[], xLabel: string, xUnit: string, lowName: string, highName: string,
 *           width?: number }} spec
 */
export function renderTornado(container, spec) {
  container.innerHTML = '';
  const width = Math.max(240, Math.round(spec.width || container.clientWidth || 600));
  const fmt = (v) => formatNumber(v);
  const signed = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmt(Math.abs(v))}`;
  const unit = spec.xUnit ? ` ${spec.xUnit}` : '';
  const values = [spec.base];
  for (const row of spec.rows) for (const p of [row.low, row.high]) if (p && p.y !== null) values.push(p.y);
  const axis = niceTicks(Math.min(...values), Math.max(...values), Math.max(3, Math.min(6, Math.floor(width / 100))));
  const tickLabels = axis.ticks.map(fmt);
  const half = (s) => Math.ceil(3.7 * s.length) + 4;
  const margin = { top: 24, right: Math.max(12, half(tickLabels[tickLabels.length - 1])), bottom: 40, left: Math.max(12, half(tickLabels[0])) };
  const plotW = width - margin.left - margin.right;
  const plotH = spec.rows.length * TORNADO_ROW;
  const height = margin.top + plotH + margin.bottom;
  const sx = makeScale(axis.min, axis.max, margin.left, margin.left + plotW);
  const x0 = sx(spec.base);

  const root = svg('svg', { class: 'ec-chart-svg', width, height, role: 'img', 'aria-label': `Change of ${spec.xLabel} when each input is lowered or raised` });
  const grid = svg('g', { class: 'ec-chart-grid' });
  axis.ticks.forEach((t, k) => {
    const x = sx(t).toFixed(1);
    grid.append(svg('line', { x1: x, x2: x, y1: margin.top, y2: margin.top + plotH }));
    const label = svg('text', { x, y: margin.top + plotH + 18, 'text-anchor': 'middle', class: 'ec-chart-tick' });
    label.textContent = tickLabels[k];
    grid.append(label);
  });
  const xTitle = svg('text', { x: margin.left + plotW / 2, y: height - 4, 'text-anchor': 'middle', class: 'ec-chart-axis-title' });
  xTitle.textContent = `${spec.xLabel}${spec.xUnit ? ` (${spec.xUnit})` : ''}`;
  const baseLabel = svg('text', { x: x0.toFixed(1), y: margin.top - 10, 'text-anchor': x0 > margin.left + plotW / 2 ? 'end' : 'start', class: 'ec-chart-label' });
  baseLabel.textContent = `current ${fmt(spec.base)}${unit}`;
  root.append(grid, xTitle, svg('line', { class: 'ec-chart-baseline', x1: x0.toFixed(1), x2: x0.toFixed(1), y1: margin.top - 4, y2: margin.top + plotH }), baseLabel);

  const marks = [];
  const labels = [];
  spec.rows.forEach((row, k) => {
    const top = margin.top + k * TORNADO_ROW;
    [['low', row.low], ['high', row.high]].forEach(([kind, p], j) => {
      const y = top + 18 + j * (TORNADO_BAR + 2);
      const bar = p && p.y !== null && Math.abs(sx(p.y) - x0) >= 0.5 ? svg('path', { d: barPath(x0, sx(p.y), y, TORNADO_BAR), class: `ec-chart-bar ec-chart-bar-${kind}` }) : null;
      if (bar) root.append(bar);
      marks.push({ row, kind, point: p, y, bar });
    });
    const text = svg('text', { x: margin.left, y: top + 12, class: 'ec-chart-row-label' });
    text.textContent = row.label;
    root.append(text);
    labels.push({ text, full: row.label });
  });

  const legend = legendList([
    { swatch: 'ec-chart-swatch-low', text: `${spec.lowName} (upper bar)` },
    { swatch: 'ec-chart-swatch-high', text: `${spec.highName} (lower bar)` },
  ]);
  const { wrap, tip, value: tipValue, lines: [tipInput, tipSeries] } = chartFrame(root, `Tornado chart of ${spec.xLabel}: use the arrow keys to read each bar`);
  container.append(legend, wrap);
  fitAxisTitle(xTitle, spec.xLabel, spec.xUnit, width);
  for (const { text, full } of labels) fitLabel(text, full, plotW);

  let index = 0;
  let active = null;
  const show = (k) => {
    index = Math.max(0, Math.min(marks.length - 1, k));
    const m = marks[index];
    if (active) active.classList.remove('ec-chart-bar-active');
    active = m.bar;
    if (active) active.classList.add('ec-chart-bar-active');
    const p = m.point;
    if (!p) {
      tipValue.textContent = 'not varied';
      tipInput.textContent = `${m.row.name} is already at the ${m.kind === 'low' ? 'lower' : 'upper'} end of its valid range`;
    } else {
      const change = p.y !== null && spec.base !== 0 ? ` (${signed((100 * (p.y - spec.base)) / Math.abs(spec.base))} %)` : '';
      tipValue.textContent = p.y === null ? 'no result' : `${fmt(p.y)}${unit}${change}`;
      tipInput.textContent = `${m.row.name} ${fmt(p.x)}${m.row.unit ? ` ${m.row.unit}` : ''}`;
    }
    tipSeries.textContent = m.kind === 'low' ? spec.lowName : spec.highName;
    const end = p && p.y !== null ? sx(p.y) : x0;
    placeTip(tip, Math.min(end, x0), Math.max(end, x0), m.y - 26, width);
  };
  const hide = () => {
    if (active) active.classList.remove('ec-chart-bar-active');
    active = null;
    tip.hidden = true;
  };
  marks.forEach((m, k) => {
    const hit = svg('rect', { x: margin.left, y: m.y - 1, width: plotW, height: TORNADO_BAR + 2, class: 'ec-chart-hit-bar' });
    hit.addEventListener('pointerenter', () => show(k));
    hit.addEventListener('pointerleave', hide);
    root.append(hit);
  });
  wrap.addEventListener('focus', () => show(index));
  wrap.addEventListener('blur', hide);
  wrap.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { show(index + 1); event.preventDefault(); }
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { show(index - 1); event.preventDefault(); }
    else if (event.key === 'Home') { show(0); event.preventDefault(); }
    else if (event.key === 'End') { show(marks.length - 1); event.preventDefault(); }
    else if (event.key === 'Escape') hide();
  });
}

/**
 * Draw a heat map into `container` (emptied first): one result over a grid of two inputs in seven equal-interval
 * classes of the sequential ramp, cells without a result hatched, the current point ringed, a stepped legend above,
 * and a per-cell tooltip that follows the pointer and the arrow keys.
 * @param {HTMLElement} container
 * @param {{ xs: number[], ys: number[], values: (number|null)[][], xLabel: string, xUnit: string, yLabel: string,
 *           yUnit: string, zLabel: string, zUnit: string, logX?: boolean, logY?: boolean,
 *           current?: {x:number,y:number}|null, width?: number }} spec   values[j][i] belongs to (xs[i], ys[j])
 */
export function renderHeatmap(container, spec) {
  container.innerHTML = '';
  const width = Math.max(240, Math.round(spec.width || container.clientWidth || 600));
  const fmt = (v) => formatNumber(v);
  const ok = (v) => v !== null && Number.isFinite(v);
  const valid = spec.values.flat().filter(ok);
  if (!valid.length) {
    container.append(Object.assign(document.createElement('p'), { className: 'ec-help', textContent: 'No valid results in this grid.' }));
    return;
  }
  const zMin = Math.min(...valid);
  const zMax = Math.max(...valid);
  const nx = spec.xs.length;
  const ny = spec.ys.length;
  const xEdges = cellEdges(spec.xs, spec.logX);
  const yEdges = cellEdges(spec.ys, spec.logY);
  const inside = (t, edges) => t >= Math.min(edges[0], edges[edges.length - 1]) && t <= Math.max(edges[0], edges[edges.length - 1]);
  // a log axis keeps only the powers of ten when 1-2-5 ticks would crowd it
  const ticksOf = (edges, log, count) => {
    if (!log) return niceTicks(edges[0], edges[edges.length - 1], count).ticks.filter((t) => inside(t, edges));
    const ticks = logTicks(edges[0], edges[edges.length - 1]);
    return ticks.length > count + 2 ? ticks.filter((t) => Math.abs(Math.log10(t) - Math.round(Math.log10(t))) < 1e-9) : ticks;
  };
  const xTicks = ticksOf(xEdges, spec.logX, Math.max(3, Math.min(6, Math.floor(width / 100))));
  const yTicks = ticksOf(yEdges, spec.logY, 5);
  const xTickLabels = xTicks.map(fmt);
  const yTickLabels = yTicks.map(fmt);
  const margin = {
    top: 26,
    right: Math.max(12, Math.ceil(3.7 * Math.max(0, ...xTickLabels.map((s) => s.length))) + 4),
    bottom: 40,
    left: Math.max(40, 16 + 7.4 * Math.max(0, ...yTickLabels.map((s) => s.length))),
  };
  const plotW = width - margin.left - margin.right;
  const plotH = Math.round(Math.min(420, Math.max(220, plotW * 0.8)));
  const height = margin.top + plotH + margin.bottom;
  const sx = makeScale(xEdges[0], xEdges[nx], margin.left, margin.left + plotW, spec.logX);
  const sy = makeScale(yEdges[0], yEdges[ny], margin.top + plotH, margin.top, spec.logY);
  const px = xEdges.map(sx);
  const py = yEdges.map(sy);
  // whole-pixel cell edges: neighbouring cells share each edge exactly, so no hairline seam shows between them
  const ex = px.map(Math.round);
  const ey = py.map(Math.round);

  const root = svg('svg', { class: 'ec-chart-svg', width, height, role: 'img', 'aria-label': `${spec.zLabel} over ${spec.xLabel} and ${spec.yLabel}` });
  const hatchId = `ec-heat-hatch-${(patternCount += 1)}`;
  const pattern = svg('pattern', { id: hatchId, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
  pattern.append(svg('rect', { width: 6, height: 6, class: 'ec-heat-hatch-bg' }), svg('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'ec-heat-hatch-line' }));
  const defs = svg('defs');
  defs.append(pattern);
  const cells = svg('g', { 'shape-rendering': 'crispEdges' });
  let missing = 0;
  for (let j = 0; j < ny; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      const v = spec.values[j][i];
      if (!ok(v)) missing += 1;
      cells.append(svg('rect', {
        x: ex[i],
        y: ey[j + 1],
        width: ex[i + 1] - ex[i],
        height: ey[j] - ey[j + 1],
        class: ok(v) ? `ec-heat-${heatClass(v, zMin, zMax) + 1}` : null,
        fill: ok(v) ? null : `url(#${hatchId})`,
      }));
    }
  }
  const axes = svg('g', { class: 'ec-chart-grid' });
  xTicks.forEach((t, k) => {
    const x = sx(t).toFixed(1);
    axes.append(svg('line', { class: 'ec-chart-axis', x1: x, x2: x, y1: margin.top + plotH, y2: margin.top + plotH + 4 }));
    const label = svg('text', { x, y: margin.top + plotH + 18, 'text-anchor': 'middle', class: 'ec-chart-tick' });
    label.textContent = xTickLabels[k];
    axes.append(label);
  });
  yTicks.forEach((t, k) => {
    const y = sy(t).toFixed(1);
    axes.append(svg('line', { class: 'ec-chart-axis', x1: margin.left - 4, x2: margin.left, y1: y, y2: y }));
    const label = svg('text', { x: margin.left - 8, y, 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'ec-chart-tick' });
    label.textContent = yTickLabels[k];
    axes.append(label);
  });
  const xTitle = svg('text', { x: margin.left + plotW / 2, y: height - 4, 'text-anchor': 'middle', class: 'ec-chart-axis-title' });
  xTitle.textContent = `${spec.xLabel}${spec.xUnit ? ` (${spec.xUnit})` : ''}`;
  const yFull = `↑ ${spec.yLabel}${spec.yUnit ? ` (${spec.yUnit})` : ''}`;
  const yTitle = svg('text', { x: 4, y: 14, class: 'ec-chart-axis-title' });
  yTitle.textContent = yFull;
  root.append(defs, cells, axes, xTitle, yTitle);

  const c = spec.current;
  const cellOf = (edges, v) => {
    let k = 0;
    while (k < edges.length - 2 && v >= edges[k + 1]) k += 1;
    return k;
  };
  let ci = Math.floor(nx / 2);
  let cj = Math.floor(ny / 2);
  if (c && Number.isFinite(c.x) && Number.isFinite(c.y) && inside(c.x, xEdges) && inside(c.y, yEdges)) {
    const cx = sx(c.x).toFixed(1);
    const cy = sy(c.y).toFixed(1);
    root.append(svg('circle', { cx, cy, r: 5, class: 'ec-heat-ring-halo' }), svg('circle', { cx, cy, r: 5, class: 'ec-heat-ring' }));
    ci = cellOf(xEdges, c.x);
    cj = cellOf(yEdges, c.y);
  }
  const halo = svg('rect', { class: 'ec-heat-active-halo', visibility: 'hidden' });
  const outline = svg('rect', { class: 'ec-heat-active', visibility: 'hidden' });
  const hit = svg('rect', { x: margin.left, y: margin.top, width: plotW, height: plotH, class: 'ec-chart-hit' });
  root.append(halo, outline, hit);

  const breaks = heatBreaks(zMin, zMax);
  const items = zMax > zMin
    ? breaks.slice(0, -1).map((b, k) => ({ swatch: `ec-heat-${k + 1}`, text: `${fmt(b)} – ${fmt(breaks[k + 1])}` }))
    : [{ swatch: `ec-heat-${heatClass(zMin, zMin, zMax) + 1}`, text: `all ${fmt(zMin)}` }];
  if (missing) items.push({ swatch: 'ec-chart-swatch-none', text: 'no result' });
  const { wrap, tip, value: tipValue, lines: [tipX, tipY] } = chartFrame(root, `${spec.zLabel} heat map: use the arrow keys to move from cell to cell`);
  container.append(legendList(items), wrap);
  fitAxisTitle(xTitle, spec.xLabel, spec.xUnit, width);
  fitLabel(yTitle, yFull, width - 8);

  const show = (i, j) => {
    ci = Math.max(0, Math.min(nx - 1, i));
    cj = Math.max(0, Math.min(ny - 1, j));
    const box = { x: ex[ci], y: ey[cj + 1], width: ex[ci + 1] - ex[ci], height: ey[cj] - ey[cj + 1], visibility: 'visible' };
    for (const rect of [halo, outline]) for (const [key, value] of Object.entries(box)) rect.setAttribute(key, value);
    const v = spec.values[cj][ci];
    tipValue.textContent = ok(v) ? `${fmt(v)}${spec.zUnit ? ` ${spec.zUnit}` : ''}` : 'no result';
    tipX.textContent = `${spec.xLabel} ${fmt(spec.xs[ci])}${spec.xUnit ? ` ${spec.xUnit}` : ''}`;
    tipY.textContent = `${spec.yLabel} ${fmt(spec.ys[cj])}${spec.yUnit ? ` ${spec.yUnit}` : ''}`;
    placeTip(tip, px[ci], px[ci + 1], py[cj + 1] - 8, width);
  };
  const hide = () => {
    halo.setAttribute('visibility', 'hidden');
    outline.setAttribute('visibility', 'hidden');
    tip.hidden = true;
  };
  hit.addEventListener('pointermove', (event) => {
    const frame = root.getBoundingClientRect();
    const mx = event.clientX - frame.left;
    const my = event.clientY - frame.top;
    let i = 0;
    while (i < nx - 1 && mx >= px[i + 1]) i += 1;
    let j = 0;
    while (j < ny - 1 && my <= py[j + 1]) j += 1;
    show(i, j);
  });
  hit.addEventListener('pointerleave', hide);
  wrap.addEventListener('focus', () => show(ci, cj));
  wrap.addEventListener('blur', hide);
  wrap.addEventListener('keydown', (event) => {
    const moves = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (moves[event.key]) { show(ci + moves[event.key][0], cj + moves[event.key][1]); event.preventDefault(); }
    else if (event.key === 'Home') { show(0, cj); event.preventDefault(); }
    else if (event.key === 'End') { show(nx - 1, cj); event.preventDefault(); }
    else if (event.key === 'Escape') hide();
  });
}
