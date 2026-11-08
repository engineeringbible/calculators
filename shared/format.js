/**
 * shared/format.js — pure number formatting shared by the renderer, the tools panel and the Markdown record.
 */

export const DASH = '—';

/**
 * Format a number for display: fixed decimals when given; otherwise about five significant digits,
 * but never rounding away integer digits (177 276.8 → "177,277", 8.92857 → "8.9286", 33.6 → "33.6").
 * `grouping: false` drops the thousands separators (CSV, Markdown tables meant for re-use).
 */
export function formatNumber(value, { decimals, grouping = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '−∞';
  let options;
  if (decimals !== undefined) {
    options = { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
  } else {
    const magnitude = Math.abs(value);
    if (magnitude === 0) options = { maximumFractionDigits: 0 };
    else if (magnitude >= 1) options = { maximumFractionDigits: Math.max(0, 4 - Math.floor(Math.log10(magnitude))) };
    else options = { maximumSignificantDigits: 5 };
  }
  return new Intl.NumberFormat('en-US', { ...options, useGrouping: grouping }).format(value);
}
