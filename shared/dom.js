/**
 * shared/dom.js — small DOM helpers shared by the renderer (ui.js) and the tools panel (features/panel.js).
 * Browser-only: every function creates or fills DOM nodes; text always goes through textContent.
 */
import { DASH, formatNumber } from './format.js';

export { DASH, formatNumber };

/** Create an element: attrs (class, text, html, boolean and string attributes) and children. */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined) continue;
    node.append(child);
  }
  return node;
}

/** Render a { columns, rows } table into a container (numbers formatted, null shown as a dash). */
export function renderTable(container, table, { cellClass, tableClass } = {}) {
  container.innerHTML = '';
  if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) {
    container.textContent = DASH;
    return;
  }
  const cell = (value, rowIndex, colIndex) => {
    const extra = cellClass ? cellClass(rowIndex, colIndex) : null;
    const numeric = typeof value === 'number';
    const cls = [numeric ? 'ec-num' : null, extra].filter(Boolean).join(' ') || null;
    return el('td', { class: cls, text: numeric ? formatNumber(value) : value === null || value === undefined ? DASH : String(value) });
  };
  container.append(el('table', { class: ['ec-table', tableClass].filter(Boolean).join(' ') }, [
    el('thead', {}, el('tr', {}, table.columns.map((c) => el('th', { scope: 'col', text: c })))),
    el('tbody', {}, table.rows.map((r, ri) => el('tr', {}, r.map((v, ci) => cell(v, ri, ci))))),
  ]));
}

/** Copy text to the clipboard, falling back to a hidden textarea and execCommand. Resolves true on success. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  const area = el('textarea', { class: 'ec-visually-hidden', 'aria-hidden': 'true', tabindex: '-1' });
  area.value = text;
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

/** Offer `text` as a file download. */
export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: filename, class: 'ec-visually-hidden', tabindex: '-1' });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
