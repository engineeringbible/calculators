/**
 * run-tests.js — run every calculator's tests.js in Node, plus the worked example of its article (schema.example,
 * checked against content.md by shared/example.js) as one more test.
 *
 *   node run-tests.js                 # all calculators listed in manifest.json
 *   node run-tests.js pipe-flow       # one or more calculator ids
 *
 * Exit code 1 when any test fails, so it can gate a commit.
 */
import { readFile } from 'node:fs/promises';
import { runTests, formatReport } from './shared/test-runner.js';
import { exampleTest, workedExampleText } from './shared/example.js';

const manifest = JSON.parse(await readFile(new URL('./manifest.json', import.meta.url), 'utf8'));
const requested = process.argv.slice(2);
const calculators = manifest.calculators.filter((calc) => requested.length === 0 || requested.includes(calc.id));
const runShared = requested.length === 0 || requested.includes('shared');

if (calculators.length === 0 && !runShared) {
  console.error(`No calculator matched ${requested.join(', ')}. Known ids: ${manifest.calculators.map((c) => c.id).join(', ')}`);
  process.exit(1);
}

let totalPassed = 0;
let totalFailed = 0;
for (const calc of calculators) {
  const { tests } = await import(new URL(`./${calc.id}/tests.js`, import.meta.url));
  const { schema, calculate } = await import(new URL(`./${calc.id}/calc.js`, import.meta.url));
  const article = schema.example ? workedExampleText(await readFile(new URL(`./${calc.id}/content.md`, import.meta.url), 'utf8')) : null;
  const summary = runTests(schema.example ? [...tests, exampleTest(schema, calculate, article)] : tests);
  console.log(formatReport(summary, `${calc.id} (${calc.name})`));
  totalPassed += summary.passed;
  totalFailed += summary.failed;
}
if (runShared) {
  const { tests } = await import(new URL('./shared/tests.js', import.meta.url));
  const summary = runTests(tests);
  console.log(formatReport(summary, 'shared (water properties, friction line, roughness, statistics, tools panel, charts)'));
  totalPassed += summary.passed;
  totalFailed += summary.failed;
}
console.log(`
${totalPassed} passed, ${totalFailed} failed across ${calculators.length} calculator(s)${runShared ? ' + shared modules' : ''}`);
process.exitCode = totalFailed > 0 ? 1 : 0;
