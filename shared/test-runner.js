/**
 * shared/test-runner.js — dependency-free assertions and a runner that works in Node and in the browser.
 *
 * A test is `{ name, source, run }` where `run()` throws on failure. `source` names the textbook,
 * standard or published table the expected value was checked against.
 */

/**
 * Assert |actual − expected| ≤ abs, or ≤ rel·|expected|. Defaults to rel = 1e-3 when neither is given.
 */
export function assertClose(actual, expected, tolerance = {}, label = 'value') {
  const abs = tolerance.abs;
  const rel = tolerance.rel ?? (abs === undefined ? 1e-3 : undefined);
  if (typeof actual !== 'number' || Number.isNaN(actual)) {
    throw new Error(`${label}: expected ${expected}, got ${String(actual)}`);
  }
  const diff = Math.abs(actual - expected);
  const okAbs = abs !== undefined && diff <= abs;
  const okRel = rel !== undefined && diff <= rel * Math.abs(expected);
  if (!okAbs && !okRel) {
    const tol = abs !== undefined ? `±${abs}` : `±${rel * 100}%`;
    throw new Error(`${label}: expected ${expected} ${tol}, got ${actual}`);
  }
}

/** Strict equality assertion for strings, integers and booleans. */
export function assertEqual(actual, expected, label = 'value') {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

/** Assert that `fn` throws; optionally that the message contains `messagePart`. */
export function assertThrows(fn, messagePart, label = 'call') {
  let threw = false;
  try {
    fn();
  } catch (error) {
    threw = true;
    if (messagePart && !String(error.message).includes(messagePart)) {
      throw new Error(`${label}: error message "${error.message}" does not contain "${messagePart}"`);
    }
  }
  if (!threw) throw new Error(`${label}: expected an error but none was thrown`);
}

/**
 * Run an array of tests synchronously.
 * @returns {{ total: number, passed: number, failed: number, results: Array<{name, source, ok, error}> }}
 */
export function runTests(tests) {
  const results = tests.map((test) => {
    try {
      test.run();
      return { name: test.name, source: test.source, ok: true, error: null };
    } catch (error) {
      return { name: test.name, source: test.source, ok: false, error: error.message };
    }
  });
  const passed = results.filter((r) => r.ok).length;
  return { total: results.length, passed, failed: results.length - passed, results };
}

/** Plain-text report of a runTests() summary, one line per test. */
export function formatReport(summary, title = '') {
  const lines = [];
  if (title) lines.push(title);
  for (const r of summary.results) {
    lines.push(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n        ${r.error}`}${r.source ? `\n        source: ${r.source}` : ''}`);
  }
  lines.push(`  ${summary.passed}/${summary.total} passed`);
  return lines.join('\n');
}
