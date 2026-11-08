/**
 * build-manifest.js — regenerate manifest.json and ASSUMPTIONS.md from every <calculator-id>/calc.js and tests.js.
 *
 * The schema in calc.js is the single source of truth. The manifest is a derived index, and ASSUMPTIONS.md is the
 * retrievable register of EVERYTHING a calculator assumes, checks and notes:
 *   - schema.assumptions   fixed assumptions, simplifications and caveats
 *   - schema.notes         verification findings, design decisions, provenance of tables, defects found
 *   - schema.sources       standards, textbooks and tables behind the formulas and test values
 *   - tests.js             the self-tests (checks) with the reference each expected value was taken from
 *   - calc.js source       the runtime warnings calculate() can raise and the explicit validation errors it throws
 *
 * It also checks every schema.sendTo chain against the target schemas (the build fails on a broken link), checks every
 * content.md (the six sections in order, links that point at existing calculator pages) and embeds the rendered article
 * in the calculator's index.html between the article markers, so the page reads without JavaScript, checks the worked
 * example of every article against the calculator (schema.example, shared/example.js), and writes
 * shared/version.js: the library version, the build date and SHA-256 stamps of every calc.js and of the shared
 * computational modules, which the calculation record carries so a result can be traced to the code.
 *
 *   node build-manifest.js
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { unitLabel } from './shared/units.js';
import { SHARED_MODULES } from './shared/register.js';
import { tests as sharedTests } from './shared/tests.js';
import { validateSendTo, smokeTestChain } from './shared/features/core.js';
import { renderArticle, articleLinks } from './shared/markdown.js';
import { checkExample, exampleTest, workedExampleText } from './shared/example.js';

/** Shared modules whose code determines calculate() results (stamped in the record as SHARED_HASH). */
const COMPUTATIONAL_SHARED = ['units.js', 'validate.js', 'stats.js', 'seawater.js', 'fuels.js', 'sections.js', 'format.js', 'eseries.js', 'fluids.js', 'power.js', 'awg.js', 'concrete.js', 'psychro.js', 'pipes.js', 'iapws97.js'];
const sha = (text) => createHash('sha256').update(text).digest('hex').slice(0, 12);

const ROOT = new URL('./', import.meta.url);
const PLANNED_FILE = new URL('./planned.json', ROOT);
const CATEGORY_NAMES = { maritime: 'Maritime', mechanical: 'Mechanical', thermal: 'Thermal and fluids', structural: 'Structural', electrical: 'Electrical', civil: 'Civil', hvac: 'HVAC', process: 'Process', manufacturing: 'Manufacturing', automotive: 'Automotive', general: 'General' };

async function findCalculatorIds() {
  const entries = await readdir(ROOT, { withFileTypes: true });
  const ids = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'shared' || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    try {
      await readFile(new URL(`./${entry.name}/calc.js`, ROOT));
      ids.push(entry.name);
    } catch {
      // not a calculator folder
    }
  }
  return ids.sort();
}

function describeInput(input) {
  if (input.type === 'textarea') return { id: input.id, label: input.label, type: 'textarea', default: input.default };
  if (input.type === 'select') {
    const options = input.optionsBy ? Object.values(input.optionsBy.options).flat() : input.options;
    return { id: input.id, label: input.label, type: 'select', options: [...new Set(options.map((o) => o.value))], default: input.default };
  }
  return {
    id: input.id,
    label: input.label,
    group: input.group,
    unit: unitLabel(input.group, input.unit),
    default: input.default,
    ...(input.min !== undefined ? { min: input.min } : {}),
    ...(input.max !== undefined ? { max: input.max } : {}),
  };
}

function describeOutput(output) {
  if (output.type === 'text' || output.type === 'table' || output.type === 'chart') return { id: output.id, label: output.label, type: output.type };
  return { id: output.id, label: output.label, group: output.group, unit: unitLabel(output.group, output.unit) };
}

/** Extract the message literals passed to `warnings.push(...)` and `throw new Error(...)` in a calc.js source. */
function extractMessages(source, callPattern) {
  const regex = new RegExp(`${callPattern}\\(\\s*(['"\`])([\\s\\S]*?)\\1\\s*\\)`, 'g');
  const messages = [];
  for (const match of source.matchAll(regex)) {
    const text = match[2].replace(/\$\{[^}]*\}/g, '…').replace(/\s+/g, ' ').trim();
    if (text && !messages.includes(text)) messages.push(text);
  }
  return messages;
}

const ids = await findCalculatorIds();
const calculators = [];
const schemasById = {};
const calculatorsById = {};
const calcHashes = {};
for (const id of ids) {
  const { schema, calculate } = await import(new URL(`./${id}/calc.js`, ROOT));
  schemasById[id] = schema;
  calculatorsById[id] = { schema, calculate };
  if (schema.id !== id) throw new Error(`Folder "${id}" holds a schema with id "${schema.id}" — they must match`);
  if (!schema.summary || schema.summary.length > 160) throw new Error(`${id}: summary must be 1–160 characters`);
  if (!Array.isArray(schema.assumptions) || schema.assumptions.length === 0) console.warn(`warning: ${id} has no schema.assumptions`);
  if (!Array.isArray(schema.sources) || schema.sources.length === 0) console.warn(`warning: ${id} has no schema.sources`);
  if (!Array.isArray(schema.notes) || schema.notes.length === 0) console.warn(`warning: ${id} has no schema.notes`);

  let checks = [];
  try {
    const { tests } = await import(new URL(`./${id}/tests.js`, ROOT));
    checks = tests.map((t) => ({ name: t.name, source: t.source || '' }));
    if (schema.example) {
      const { name, source } = exampleTest(schema, calculate);
      checks.push({ name, source });
    }
  } catch (error) {
    console.warn(`warning: ${id} has no loadable tests.js (${error.message})`);
  }
  const source = await readFile(new URL(`./${id}/calc.js`, ROOT), 'utf8');
  calcHashes[id] = sha(source);
  const runtimeWarnings = extractMessages(source, 'warnings\\.push');
  const validationErrors = extractMessages(source, 'throw new Error');

  calculators.push({
    id,
    name: schema.name,
    category: schema.category,
    summary: schema.summary,
    path: `${id}/index.html`,
    inputs: schema.inputs.map(describeInput),
    outputs: schema.outputs.map(describeOutput),
    related: schema.related || [],
    assumptions: schema.assumptions || [],
    notes: schema.notes || [],
    sources: schema.sources || [],
    checks,
    runtimeWarnings,
    validationErrors,
    sendTo: (schema.sendTo || []).map((entry) => ({ target: entry.target, label: entry.label, note: entry.note || '' })),
    calcHash: calcHashes[id],
  });
}

const chainErrors = ids.flatMap((id) => validateSendTo(schemasById[id], schemasById));
if (chainErrors.length) throw new Error(`Broken sendTo chains:\n  ${chainErrors.join('\n  ')}`);
// Every chain must also work end to end at the source defaults: the target accepts every value and calculates.
const smokeFailures = [];
let smokeSkipped = 0;
for (const id of ids) {
  for (const entry of schemasById[id].sendTo || []) {
    const check = smokeTestChain(calculatorsById[id], entry, calculatorsById[entry.target]);
    if (check.skipped) smokeSkipped += 1;
    else if (check.problems.length) smokeFailures.push(`${id} → ${entry.target}: ${check.problems.join(' | ')}`);
  }
}
if (smokeFailures.length) throw new Error(`sendTo chains that fail at the source defaults:\n  ${smokeFailures.join('\n  ')}`);
const chainCount = calculators.reduce((n, c) => n + c.sendTo.length, 0);

// Articles: check every content.md first, then embed its rendered HTML in the page between the markers (written only
// when it changed). The page keeps its own newline style.
const ARTICLE_SECTIONS = ['Introduction', 'Formulas', 'Assumptions and limitations', 'Worked example', 'FAQ', 'Related calculators'];
const ARTICLE_START = '<!-- article: generated from content.md by build-manifest.js; edit content.md, not this block -->';
const ARTICLE_END = '<!-- /article -->';
const articleErrors = [];
const pageUpdates = [];
for (const id of ids) {
  const markdown = await readFile(new URL(`./${id}/content.md`, ROOT), 'utf8');
  const headings = [...markdown.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);
  if (headings.length !== ARTICLE_SECTIONS.length || !ARTICLE_SECTIONS.every((s, k) => headings[k].startsWith(s))) {
    articleErrors.push(`${id}: content.md sections must be ${ARTICLE_SECTIONS.join(', ')} (found ${headings.join(', ')})`);
  }
  for (const href of articleLinks(markdown)) {
    const target = href.match(/^\.\.\/([^/]+)\/index\.html$/);
    if (!target || !calculatorsById[target[1]]) articleErrors.push(`${id}: content.md link ${href} does not point at a calculator page`);
  }
  if (schemasById[id].example) {
    const { problems } = checkExample(schemasById[id], calculatorsById[id].calculate, workedExampleText(markdown));
    for (const problem of problems) articleErrors.push(`${id}: worked example: ${problem}`);
  } else articleErrors.push(`${id}: no schema.example (the worked example of content.md as data, see shared/example.js)`);
  const pageUrl = new URL(`./${id}/index.html`, ROOT);
  const page = await readFile(pageUrl, 'utf8');
  const newline = page.includes('\r\n') ? '\r\n' : '\n';
  const article = [ARTICLE_START, '<article class="ec-article" aria-label="About this calculator">', renderArticle(markdown), '</article>', ARTICLE_END].join('\n');
  const block = article.split('\n').join(newline);
  const start = page.indexOf(ARTICLE_START);
  const end = page.indexOf(ARTICLE_END);
  let next;
  if (start >= 0 && end > start) next = page.slice(0, start) + block + page.slice(end + ARTICLE_END.length);
  else if (page.includes('<section id="notes"')) next = page.replace('<section id="notes"', () => `${block}${newline}    <section id="notes"`);
  else articleErrors.push(`${id}: index.html has neither the article markers nor a <section id="notes"> to put the article before`);
  if (next && next !== page) pageUpdates.push([pageUrl, next]);
}
if (articleErrors.length) throw new Error(`content.md problems:\n  ${articleErrors.join('\n  ')}`);
for (const [url, html] of pageUpdates) await writeFile(url, html, 'utf8');

const sharedSources = await Promise.all(COMPUTATIONAL_SHARED.map((file) => readFile(new URL(`./shared/${file}`, ROOT), 'utf8')));
const sharedHash = sha(sharedSources.join('\n'));
const libraryVersion = JSON.parse(await readFile(new URL('./package.json', ROOT), 'utf8')).version;
const buildDate = new Date().toISOString().slice(0, 10);
const versionModule = [
  '/**',
  ' * shared/version.js — GENERATED by build-manifest.js; do not edit. Version stamps carried by every calculation',
  ' * record: the library version, the build date, a SHA-256 (first 12 hex) of the shared computational modules',
  ` * (${COMPUTATIONAL_SHARED.join(', ')}) and one of each calculator\'s calc.js.`,
  ' */',
  `export const LIBRARY_VERSION = '${libraryVersion}';`,
  `export const BUILD_DATE = '${buildDate}';`,
  `export const SHARED_HASH = '${sharedHash}';`,
  'export const CALC_HASHES = {',
  ...ids.map((id) => `  '${id}': '${calcHashes[id]}',`),
  '};',
  '',
].join('\n');
await writeFile(new URL('./shared/version.js', ROOT), versionModule, 'utf8');

for (const calc of calculators) {
  for (const relatedId of calc.related) {
    if (!ids.includes(relatedId)) console.warn(`warning: ${calc.id} relates to "${relatedId}", which is not built yet`);
  }
}

let planned = [];
try {
  planned = JSON.parse(await readFile(PLANNED_FILE, 'utf8'));
} catch {
  // no planned.json — fine
}

const sharedChecks = sharedTests.map((t) => ({ name: t.name, source: t.source || '' }));
const today = new Date().toISOString().slice(0, 10);
const manifest = {
  name: 'Engineering calculators',
  version: JSON.parse(await readFile(new URL('./package.json', ROOT), 'utf8')).version,
  generated: today,
  categories: [...new Set(calculators.map((c) => c.category))].sort(),
  calculators,
  planned: planned.filter((p) => !ids.includes(p.id)),
  shared: { modules: SHARED_MODULES, checks: sharedChecks, hash: sharedHash },
};

const manifestPath = fileURLToPath(new URL('./manifest.json', ROOT));
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const bullets = (items, empty = '- (none recorded)') => (items.length ? items.map((item) => `- ${item}`) : [empty]);
const register = [
  '# Assumptions, checks and notes register',
  '',
  `Generated by \`node build-manifest.js\` on ${today} from every calculator's calc.js (schema.assumptions, schema.notes,`,
  'schema.sources, the runtime warnings and validation errors in the code) and tests.js (the self-tests). Edit the calculator,',
  'then regenerate — do not edit this file by hand. The assumptions and sources are also shown on each calculator page and',
  'everything here is carried in manifest.json for programmatic access. The long-form discussion lives in each content.md.',
  '',
  '## Contents',
  '',
  ...calculators.map((c) => `- [${c.name}](#${c.id}) — ${c.assumptions.length} assumptions, ${c.notes.length} notes, ${c.checks.length} checks, ${c.runtimeWarnings.length} runtime warnings`),
  `- [Shared modules](#shared-modules) — ${SHARED_MODULES.reduce((n, m) => n + m.assumptions.length, 0)} assumptions, ${SHARED_MODULES.reduce((n, m) => n + m.notes.length, 0)} notes, ${sharedChecks.length} checks`,
  '',
];
for (const calc of calculators) {
  register.push(`## ${calc.name}`, '', `<a id="${calc.id}"></a>`, '', `Folder \`${calc.id}/\` · ${CATEGORY_NAMES[calc.category] || calc.category} · ${calc.summary}`, '');
  register.push('### Assumptions and caveats', '', ...bullets(calc.assumptions), '');
  register.push('### Notes (verification findings, design decisions, provenance)', '', ...bullets(calc.notes), '');
  register.push('### Runtime warnings the calculator can raise', '', ...bullets(calc.runtimeWarnings, '- (none — all conditions are hard errors or silent)'), '');
  register.push('### Validation errors (in addition to the shared finite / positive / range checks)', '', ...bullets(calc.validationErrors, '- (only the shared validate.js checks)'), '');
  register.push('### Checks (self-tests in tests.js, with the reference for each expected value)', '');
  register.push(...(calc.checks.length ? calc.checks.map((t) => `- ${t.name}${t.source ? `\n  - Source: ${t.source}` : ''}`) : ['- (no tests found)']), '');
  register.push('### Sources', '', ...bullets(calc.sources), '');
}
register.push('## Shared modules', '', '<a id="shared-modules"></a>', '', 'Modules under `shared/` used by several calculators: water properties, friction line and roughness allowance, statistics, formulas in number fields, and the tools panel below every calculator.', '');
for (const mod of SHARED_MODULES) {
  register.push(`### ${mod.name}`, '', '#### Assumptions and caveats', '', ...bullets(mod.assumptions), '', '#### Notes', '', ...bullets(mod.notes), '', '#### Sources', '', ...bullets(mod.sources), '');
}
register.push('### Checks (shared/tests.js)', '', ...sharedChecks.map((t) => `- ${t.name}${t.source ? `
  - Source: ${t.source}` : ''}`), '');
const registerPath = fileURLToPath(new URL('./ASSUMPTIONS.md', ROOT));
await writeFile(registerPath, `${register.join('\n')}\n`, 'utf8');

const total = (key) => calculators.reduce((n, c) => n + c[key].length, 0);
console.log(`manifest.json: ${calculators.length} calculator(s) built, ${manifest.planned.length} planned, ${chainCount} send-to chain(s) validated and run at the defaults${smokeSkipped ? ` (${smokeSkipped} not applicable at the defaults)` : ''} → ${manifestPath}`);
console.log(`shared/version.js: library ${libraryVersion}, shared ${sharedHash}, ${ids.length} calc.js hashes`);
console.log(`articles: ${ids.length} content.md checked and embedded, ${pageUpdates.length} page(s) updated; ${ids.length} worked examples reproduced by the calculator`);
console.log(`ASSUMPTIONS.md: ${total('assumptions')} assumptions, ${total('notes')} notes, ${total('checks') + sharedChecks.length} checks (${sharedChecks.length} shared), ${total('runtimeWarnings')} runtime warnings, ${total('validationErrors')} validation errors, ${total('sources')} sources → ${registerPath}`);
