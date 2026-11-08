/**
 * shared/validate.js — input helpers used by every calc.js.
 *
 * calculate() functions must fail fast with a readable message; these helpers
 * produce consistent messages that the renderer shows next to the form.
 */

/**
 * Merge caller inputs over the schema defaults so calculate() can be called with a partial object.
 * Unknown keys are kept (they are ignored by the calculation).
 */
export function withDefaults(schema, inputs = {}) {
  const merged = {};
  for (const input of schema.inputs) merged[input.id] = input.default;
  return Object.assign(merged, inputs);
}

function formatName(id, label) {
  return label || id;
}

/** Throw unless `value` is a finite number. */
export function assertFinite(value, id, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${formatName(id, label)} must be a number (got ${JSON.stringify(value)})`);
  }
  return value;
}

/** Throw unless `value` is a finite number > 0. */
export function assertPositive(value, id, label) {
  assertFinite(value, id, label);
  if (value <= 0) throw new Error(`${formatName(id, label)} must be greater than zero (got ${value})`);
  return value;
}

/** Throw unless `value` is a finite number ≥ 0. */
export function assertNonNegative(value, id, label) {
  assertFinite(value, id, label);
  if (value < 0) throw new Error(`${formatName(id, label)} must not be negative (got ${value})`);
  return value;
}

/** Throw unless min ≤ value ≤ max. */
export function assertRange(value, min, max, id, label) {
  assertFinite(value, id, label);
  if (value < min || value > max) {
    throw new Error(`${formatName(id, label)} must be between ${min} and ${max} (got ${value})`);
  }
  return value;
}

/** Throw unless `value` is one of the allowed option values. */
export function assertOneOf(value, allowed, id, label) {
  if (!allowed.includes(value)) {
    throw new Error(`${formatName(id, label)} must be one of ${allowed.join(', ')} (got ${JSON.stringify(value)})`);
  }
  return value;
}

/** Throw unless `value` is an integer. */
export function assertInteger(value, id, label) {
  assertFinite(value, id, label);
  if (!Number.isInteger(value)) throw new Error(`${formatName(id, label)} must be a whole number (got ${value})`);
  return value;
}
