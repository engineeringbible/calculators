/**
 * shared/features/tests.js — Node tests of the tools panel logic (core.js) and the chart helpers (chart.js).
 * They use two small stand-in calculators so every expected value is exact.
 * Run: node run-tests.js shared
 */
import * as core from './core.js';
import { niceTicks, logTicks, makeScale, pathSegments, nearestIndex, heatClass, heatBreaks, cellEdges } from './chart.js';
import { assertClose, assertEqual, assertThrows } from '../test-runner.js';

const TOY = {
  id: 'toy',
  name: 'Toy calculator',
  assumptions: ['A toy assumption.'],
  notes: ['A toy note.'],
  sources: ['A toy source.'],
  inputs: [
    { id: 'a_m', label: 'Length a', group: 'length', unit: 'm', default: 2, min: 0 },
    { id: 'b', label: 'Factor b', group: 'dimensionless', unit: 'none', default: 5 },
    { id: 'mode', label: 'Mode', type: 'select', default: 'p', options: [{ value: 'p', label: 'Product' }, { value: 's', label: 'Sum' }] },
    { id: 'text', label: 'Free text', type: 'textarea', default: '' },
  ],
  outputs: [
    { id: 'y_m', label: 'Result y', group: 'length', unit: 'm', display: 'mm' },
    { id: 'label', label: 'Label', type: 'text' },
  ],
};

function toyCalculate(raw) {
  const i = { ...core.defaultInputs(TOY), ...raw };
  if (!(i.a_m > 0)) throw new Error('Length a must be greater than zero');
  return { outputs: { y_m: i.mode === 's' ? i.a_m + i.b : i.a_m * i.b, label: i.mode }, warnings: i.b > 100 ? ['b is large'] : [] };
}

const TARGET = {
  id: 'toy-target',
  name: 'Toy target',
  inputs: [
    { id: 'len_mm', label: 'Length', group: 'length', unit: 'mm', default: 100, min: 1 },
    { id: 'k', label: 'Plain number', group: 'dimensionless', unit: 'none', default: 1 },
    { id: 'kind', label: 'Kind', type: 'select', default: 'x', options: [{ value: 'x', label: 'X' }, { value: 'prod', label: 'Product' }] },
    { id: 'notes', label: 'Notes', type: 'textarea', default: '' },
  ],
  outputs: [{ id: 'z', label: 'z', group: 'dimensionless', unit: 'none' }],
};

function targetCalculate(raw) {
  const i = { ...core.defaultInputs(TARGET), ...raw };
  if (i.len_mm > 10000) throw new Error('Length must be between 1 and 10 000 mm');
  return { outputs: { z: i.len_mm * i.k } };
}

const SOURCE = {
  ...TOY,
  sendTo: [
    {
      target: 'toy-target',
      label: 'Send to the toy target',
      links: [
        { to: 'len_mm', from: 'y_m' },
        { to: 'k', from: 'input:a_m', raw: true },
        { to: 'kind', from: 'input:mode', map: { p: 'prod' } },
        { to: 'notes', template: 'a = {input:a_m}, y = {y_m}' },
      ],
    },
  ],
};

export const tests = [
  {
    name: 'Permalink: only non-default values travel, in schema units, rounded to the 10 significant digits the fields hold; bad entries are listed and never applied',
    source: 'Permalink contract (README, "Share link and send to")',
    run: () => {
      const hash = core.encodeState(TOY, { inputs: { a_m: 13.000000000431964, b: 5, mode: 's', text: 'x' }, units: { a_m: 'mm', y_m: 'mm' } });
      assertEqual(hash, 'v=1&i.a_m=13&i.mode=s&i.text=x&u.a_m=mm', 'encoded hash');
      const back = core.decodeState(TOY, `#${hash}`);
      assertEqual(JSON.stringify(back.inputs), JSON.stringify({ a_m: 13, mode: 's', text: 'x' }), 'decoded inputs');
      assertEqual(JSON.stringify(back.units), JSON.stringify({ a_m: 'mm' }), 'decoded units');
      assertEqual(core.encodeState(TOY, { inputs: core.defaultInputs(TOY), units: core.defaultUnits(TOY) }), 'v=1', 'defaults only');
      const bad = core.decodeState(TOY, '#v=1&i.a_m=7&i.mode=q&i.zzz=1&u.b=kg&u.a_m=furlong');
      assertEqual(JSON.stringify(bad.inputs), JSON.stringify({ a_m: 7 }), 'valid entry kept');
      assertEqual([...bad.ignored].sort().join(','), 'i.mode,i.zzz,u.a_m,u.b', 'invalid entries listed');
      assertEqual(core.decodeState(TOY, `#${core.encodeState(TOY, {}, { from: 'other-calc' })}`).from, 'other-calc', 'from marker');
      assertEqual(core.encodeState(TOY, { inputs: { b: 5 } }, {}, { keep: ['b'] }), 'v=1&i.b=5', 'a kept default is written');
      const longDefault = { ...TOY, inputs: [{ ...TOY.inputs[0], default: 100 / 3600 }] };
      assertEqual(core.encodeState(longDefault, { inputs: core.defaultInputs(longDefault) }), 'v=1', 'a default with more than 10 digits stays out of the link');
    },
  },
  {
    name: 'Sweep: 5 linear points over 0–10 are 0, 2.5, 5, 7.5, 10; 3 logarithmic points over 1–100 are 1, 10, 100; points the calculator rejects are kept as gaps with the error',
    source: 'Definitions of arithmetic and geometric spacing',
    run: () => {
      assertEqual(core.sweepValues(0, 10, 5).join(), '0,2.5,5,7.5,10', 'linear');
      const log = core.sweepValues(1, 100, 3, 'log');
      assertClose(log[1], 10, { rel: 1e-12 }, 'geometric mid point');
      assertClose(log[2], 100, { rel: 1e-12 }, 'geometric end point');
      assertThrows(() => core.sweepValues(0, 10, 3, 'log'), 'positive limits', 'log needs positive limits');
      const rows = core.runSweep(toyCalculate, core.defaultInputs(TOY), 'a_m', [-1, 1, 2], ['y_m']);
      assertEqual(rows[0].y.y_m, null, 'rejected point is a gap');
      assertEqual(rows[0].error.includes('greater than zero'), true, 'error kept');
      assertClose(rows[2].y.y_m, 10, { rel: 1e-12 }, 'valid point');
    },
  },
  {
    name: 'Goal seek: x² = 2 on [0, 2] gives √2 = 1.41421356237; x² = 4 on [−3, 3] lists both roots and reports the one nearest the start; an unreachable target reports the closest value',
    source: 'Bisection on a sign change (intermediate value theorem)',
    run: () => {
      const square = (i) => ({ outputs: { y: i.x * i.x } });
      const root = core.goalSeek(square, { x: 1 }, 'x', 'y', 2, 0, 2);
      assertEqual(root.status, 'ok', 'status');
      assertClose(root.x, Math.SQRT2, { rel: 1e-10 }, '√2');
      const two = core.goalSeek(square, { x: 1 }, 'x', 'y', 4, -3, 3, { start: 1 });
      assertClose(two.x, 2, { rel: 1e-10 }, 'nearest root');
      assertEqual(two.roots.length, 2, 'both roots');
      assertClose(two.roots[0], -2, { rel: 1e-10 }, 'negative root');
      const none = core.goalSeek(square, { x: 1 }, 'x', 'y', -1, -3, 3);
      assertEqual(none.status, 'no-bracket', 'unreachable');
      assertEqual(Math.abs(none.x) < 0.05, true, 'closest point is near x = 0');
      const invalid = core.goalSeek(() => { throw new Error('never'); }, { x: 1 }, 'x', 'y', 1, 0, 2);
      assertEqual(invalid.status, 'invalid', 'nothing valid');
      assertThrows(() => core.goalSeek(square, { x: 1 }, 'x', 'y', 2, 2, 1), 'lower limit below', 'range order');
    },
  },
  {
    name: 'Linear propagation: y = 3a + 4b with u(a) 0.1, u(b) 0.2 gives u(y) = √0.73 = 0.8544 (b carries 87.7 %); y = a·b at a 2, b 5 gives √0.41; a one-sided difference is used at a domain edge',
    source: 'JCGM 100:2008 (GUM) eq. (10) and 5.1.6; the ± reading divisors 1.959963985 and √3 from GUM 4.3.4 and 4.3.7',
    run: () => {
      const model = (i) => ({ outputs: { y: 3 * i.a + 4 * i.b, p: i.a * i.b } });
      const res = core.propagateLinear(model, { a: 2, b: 5 }, { a: 0.1, b: 0.2 }, ['y', 'p']);
      assertClose(res.outputs.y.u, Math.sqrt(0.73), { rel: 1e-9 }, 'u(y) linear');
      assertEqual(res.outputs.y.contributions[0].id, 'b', 'largest contribution');
      assertClose(res.outputs.y.contributions[0].share, (0.64 / 0.73) * 100, { rel: 1e-9 }, 'share of b');
      assertClose(res.outputs.p.u, Math.sqrt(0.41), { rel: 1e-9 }, 'u(p) product');
      const edge = core.propagateLinear((i) => { if (i.a < 1) throw new Error('a must be at least 1'); return { outputs: { y: i.a * i.a } }; }, { a: 1 }, { a: 0.01 }, ['y']);
      assertClose(edge.outputs.y.u, 0.02, { rel: 1e-5 }, 'forward difference at the edge');
      const stuck = core.propagateLinear((i) => { if (i.c !== 7) throw new Error('c must be 7'); return { outputs: { y: 1 } }; }, { c: 7 }, { c: 0.1 }, ['y']);
      assertEqual(stuck.skipped.join(), 'c', 'no sensitivity on either side');
      assertClose(core.SPREADS.normal95.divisor, 1.959963985, { rel: 1e-9 }, '95 % divisor');
      assertClose(core.SPREADS.rect.divisor, Math.sqrt(3), { rel: 1e-12 }, 'rectangular divisor');
    },
  },
  {
    name: 'Monte Carlo: 20 000 draws of y = 3a + 4b reproduce u(y) = 0.8544 within 3 % and a 95 % interval of ±1.96 u; a rectangular input with u = 1 has SD 1 and a 97.5 % quantile of 0.95√3; rejected draws are counted; the same seed repeats exactly',
    source: 'JCGM 101:2008 (GUM Supplement 1) 6.4.2 and 7.7; uniform distribution quantiles',
    run: () => {
      const model = (i) => ({ outputs: { y: 3 * i.a + 4 * i.b } });
      const spreads = { a: { u: 0.1, dist: 'normal' }, b: { u: 0.2, dist: 'normal' } };
      const mc = core.propagateMonteCarlo(model, { a: 2, b: 5 }, spreads, ['y'], { samples: 20000, seed: 7 });
      assertClose(mc.outputs.y.mean, 26, { abs: 0.03 }, 'mean');
      assertClose(mc.outputs.y.sd, Math.sqrt(0.73), { rel: 0.03 }, 'SD');
      assertClose(mc.outputs.y.p975 - mc.outputs.y.p025, 2 * 1.959963985 * Math.sqrt(0.73), { rel: 0.04 }, '95 % interval width');
      const again = core.propagateMonteCarlo(model, { a: 2, b: 5 }, spreads, ['y'], { samples: 20000, seed: 7 });
      assertEqual(again.outputs.y.p975, mc.outputs.y.p975, 'repeatable');
      const uniform = core.propagateMonteCarlo((i) => ({ outputs: { y: i.a } }), { a: 0 }, { a: { u: 1, dist: 'rect' } }, ['y'], { samples: 20000, seed: 3 });
      assertClose(uniform.outputs.y.sd, 1, { rel: 0.03 }, 'rectangular SD');
      assertClose(uniform.outputs.y.p975, 0.95 * Math.sqrt(3), { rel: 0.03 }, 'rectangular 97.5 % quantile');
      const half = core.propagateMonteCarlo((i) => { if (i.a < 0) throw new Error('a must not be negative'); return { outputs: { y: i.a } }; }, { a: 0 }, { a: { u: 1, dist: 'normal' } }, ['y'], { samples: 2000, seed: 1 });
      assertClose(half.failures / 2000, 0.5, { abs: 0.05 }, 'half the draws rejected');
    },
  },
  {
    name: 'Probability of passing a limit: the 95 % Wilson score interval reproduces the examples of Newcombe (1998), 81/263 → 0.2553–0.3662, 15/148 → 0.0624–0.1605, 0/20 → 0–0.1611, 1/29 → 0.0061–0.1718; a draw equal to the limit counts on neither side',
    source: 'E. B. Wilson, J. Am. Stat. Assoc. 22 (1927) 209–212; R. G. Newcombe, Statistics in Medicine 17 (1998) 857–872, method 3 (score interval without continuity correction)',
    run: () => {
      for (const [k, n, lo, hi] of [[81, 263, 0.2553, 0.3662], [15, 148, 0.0624, 0.1605], [0, 20, 0, 0.1611], [1, 29, 0.0061, 0.1718]]) {
        const e = core.exceedance(Array.from({ length: n }, (_, j) => (j < k ? 2 : 0)), 1, 'above');
        assertEqual(e.k, k, `${k}/${n} count`);
        assertClose(e.lo, lo, { abs: 5e-5 }, `${k}/${n} lower limit`);
        assertClose(e.hi, hi, { abs: 5e-5 }, `${k}/${n} upper limit`);
      }
      assertEqual(core.exceedance([0, 1, 1, 2], 1, 'above').k, 1, 'above: values equal to the limit not counted');
      assertEqual(core.exceedance([0, 1, 1, 2], 1, 'below').k, 1, 'below: values equal to the limit not counted');
      assertEqual(core.exceedance([], 1, 'above'), null, 'no draws');
    },
  },
  {
    name: 'Probability of passing a limit from 20 000 Monte Carlo draws of a standard normal result: P(y > 1.6449) = 5 % within 0.5 %, with a sampling interval 2 × 1.96 √(p(1 − p)/n) wide; the normal approximation gives Φ(−1.96) = 2.5 % in either tail, and 0 or 1 when u = 0',
    source: 'Standard normal table: Φ(1.6449) = 0.95, Φ(1.96) = 0.975; JCGM 101:2008 (GUM Supplement 1) 7.7',
    run: () => {
      const mc = core.propagateMonteCarlo((i) => ({ outputs: { y: i.x } }), { x: 0 }, { x: { u: 1, dist: 'normal' } }, ['y'], { samples: 20000, seed: 11 });
      const e = core.exceedance(mc.outputs.y.draws, 1.644853627, 'above');
      assertClose(e.p, 0.05, { abs: 0.005 }, 'fraction above the 95 % quantile');
      assertClose(e.hi - e.lo, 2 * core.Z95 * Math.sqrt((0.05 * 0.95) / 20000), { rel: 0.1 }, 'sampling interval width');
      assertClose(core.normalExceedance(10, 2, 10 + 2 * core.Z95, 'above'), 0.025, { rel: 1e-8 }, 'normal upper tail');
      assertClose(core.normalExceedance(10, 2, 10 - 2 * core.Z95, 'below'), 0.025, { rel: 1e-8 }, 'normal lower tail');
      assertEqual(core.normalExceedance(10, 0, 9, 'above'), 1, 'u = 0, value above the limit');
      assertEqual(core.normalExceedance(10, 0, 11, 'above'), 0, 'u = 0, value below the limit');
    },
  },
  {
    name: 'CSV: the delimiter is detected from the header (comma, semicolon or tab); quoted fields keep delimiters, doubled quotes and line breaks; comment and empty lines are skipped; writing quotes what needs it and neutralises formula cells',
    source: 'RFC 4180 (Common Format for CSV files) quoting rules; OWASP CSV injection guidance',
    run: () => {
      const parsed = core.parseCsv('﻿# comment\nname;value\n"a;b";1,5\r\n"say ""hi""";2\n\n');
      assertEqual(parsed.delimiter, ';', 'semicolon');
      assertEqual(parsed.header.join('|'), 'name|value', 'header');
      assertEqual(parsed.rows.length, 2, 'rows');
      assertEqual(parsed.rows[0][0], 'a;b', 'quoted delimiter');
      assertEqual(parsed.rows[1][0], 'say "hi"', 'doubled quotes');
      assertEqual(core.parseCsv('x\ty\n1\t2').delimiter, '\t', 'tab');
      assertEqual(core.toCsv([['a,b', 'q"x', 3]]), '"a,b","q""x",3\r\n', 'quoting on write');
      assertEqual(core.toCsv([['=1+1', '+A1', '@SUM(A1)', '-x', '-3', -3, 'plain']]), "'=1+1,'+A1,'@SUM(A1),'-x,-3,-3,plain\r\n", 'formula cells get an apostrophe (OWASP CSV injection); numbers do not');
      const again = core.parseCsv(core.toCsv([['h1', 'h2'], ['a,b', 'line\nbreak']]));
      assertEqual(again.rows[0][1], 'line\nbreak', 'line break round trip');
    },
  },
  {
    name: 'Batch: one calculation per row with a "(unit)" header suffix ignored and decimal commas in a semicolon file; a rejected row and a non-number are reported per row; unknown columns and empty files fail fast',
    source: 'Batch contract (README, "Batch (CSV)")',
    run: () => {
      const out = core.runBatch(TOY, toyCalculate, core.defaultInputs(TOY), 'a_m (m);b;mode\n1,5;2;p\n-1;2;p\nabc;2;s\n2;3;s');
      assertEqual(out.header.join('|'), 'a_m (m)|b|mode|y_m (m)|label|error', 'header');
      assertEqual(out.count, 4, 'rows');
      assertEqual(out.errors, 2, 'rows with an error');
      assertClose(out.rows[0][3], 3, { rel: 1e-12 }, '1.5 × 2');
      assertEqual(out.rows[1][5].includes('greater than zero'), true, 'calculator error');
      assertEqual(out.rows[2][5], 'a_m: "abc" is not a number', 'parse error');
      assertClose(out.rows[3][3], 5, { rel: 1e-12 }, '2 + 3');
      assertThrows(() => core.runBatch(TOY, toyCalculate, core.defaultInputs(TOY), 'zz\n1'), 'Unknown column', 'unknown column');
      assertThrows(() => core.runBatch(TOY, toyCalculate, core.defaultInputs(TOY), 'a_m\n'), 'no data rows', 'header only');
      assertEqual(core.batchTemplate(TOY, { ...core.defaultInputs(TOY), a_m: 3 }), 'a_m,b,mode\r\n3,5,p\r\n', 'template');
    },
  },
  {
    name: 'Calculation record: JSON round trip with version stamps; a different calc.js hash and invalid inputs become notes; foreign files are refused; the Markdown carries inputs, results in display units, warnings, assumptions, notes and sources',
    source: 'Calculation record contract (README, "Calculation record")',
    run: () => {
      const inputs = { ...core.defaultInputs(TOY), a_m: 3, b: 200, text: 'line 1\nline 2' };
      const result = toyCalculate(inputs);
      const meta = { libraryVersion: '0.3.0', calcHash: 'abc123', sharedHash: 'def456', generated: '2026-10-31T12:00:00Z', url: 'http://localhost/toy/#v=1' };
      const record = core.buildRecord(TOY, { inputs, units: { a_m: 'm', y_m: 'mm' } }, result, meta);
      assertEqual(record.format, 'engineering-calculator-record', 'format');
      assertClose(record.outputs.y_m, 600, { rel: 1e-12 }, 'output in schema units');
      const read = core.readRecord(TOY, JSON.stringify(record), { calcHash: 'abc123' });
      assertEqual(JSON.stringify(read.inputs), JSON.stringify(inputs), 'inputs restored');
      assertEqual(read.units.y_m, 'mm', 'display unit restored');
      assertEqual(read.notes.length, 0, 'no notes for the same code');
      assertEqual(core.readRecord(TOY, record, { calcHash: 'zzz' }).notes[0].includes('abc123'), true, 'hash mismatch noted');
      assertEqual(core.readRecord(TOY, { ...record, inputs: { ...inputs, mode: 'q' } }).notes[0].includes('mode'), true, 'invalid input noted');
      assertThrows(() => core.readRecord(TOY, '{'), 'not valid JSON', 'broken file');
      assertThrows(() => core.readRecord(TOY, { calculator: 'toy' }), 'Not a calculation record', 'foreign file');
      assertThrows(() => core.readRecord(TOY, { ...record, calculator: 'other' }), 'belongs to', 'other calculator');
      const md = core.recordToMarkdown(TOY, record);
      for (const part of ['# Toy calculator', 'library 0.3.0 · calc.js abc123 · shared def456', '| Length a | 3 | m |', '| Mode | Product |', '| Result y | 600000 | mm |', '```\nline 1\nline 2\n```', '- b is large', '## Assumptions', '- A toy assumption.', '## Notes', '- A toy note.', '## Sources', '- A toy source.']) {
        assertEqual(md.includes(part), true, `Markdown contains "${part}"`);
      }
    },
  },
  {
    name: 'Scenarios: only the inputs that differ are listed unless all are asked for (free text included, shown as a short preview); every result is listed with a changed flag',
    source: 'Scenario comparison contract (README, "Scenarios")',
    run: () => {
      const columns = [
        { name: 'Current', inputs: core.defaultInputs(TOY), outputs: toyCalculate({}).outputs },
        { name: 'A', inputs: { ...core.defaultInputs(TOY), a_m: 4 }, outputs: toyCalculate({ a_m: 4 }).outputs },
      ];
      const rows = core.compareScenarios(TOY, columns);
      assertEqual(rows.filter((r) => r.kind === 'input').map((r) => r.spec.id).join(), 'a_m', 'changed inputs');
      assertEqual(rows.find((r) => r.spec.id === 'y_m').changed, true, 'changed result');
      assertEqual(rows.find((r) => r.spec.id === 'label').changed, false, 'unchanged result');
      assertEqual(core.compareScenarios(TOY, columns, { showAll: true }).filter((r) => r.kind === 'input').length, 4, 'all inputs');
      const texts = [{ inputs: { ...core.defaultInputs(TOY), text: '1\n2' } }, { inputs: { ...core.defaultInputs(TOY), text: '1\n3' } }];
      assertEqual(core.compareScenarios(TOY, texts).filter((r) => r.kind === 'input').map((r) => r.spec.id).join(), 'text', 'changed free text');
      assertEqual(core.textPreview('# header\n1.25\n1.31\n\n1.28'), '1.25 / 1.31 / 1.28 (3 lines)', 'preview');
      assertEqual(core.textPreview('x'.repeat(50), 10), 'xxxxxxxxx… (1 line)', 'cut preview');
    },
  },
  {
    name: 'Send to: values convert to the target unit (10 m → 10 000 mm), copy raw, translate select options through a map, fill a text template, and skip what has no equivalent; the end-to-end check catches a value the target rejects',
    source: 'Chain contract (README, "Share link and send to")',
    run: () => {
      const inputs = core.defaultInputs(SOURCE);
      const entry = SOURCE.sendTo[0];
      const values = core.buildChainValues(SOURCE, entry, inputs, toyCalculate(inputs).outputs, TARGET);
      assertEqual(JSON.stringify(values.inputs), JSON.stringify({ len_mm: 10000, k: 2, kind: 'prod', notes: 'a = 2, y = 10' }), 'sent values');
      assertEqual(values.sent.join('|'), 'Length|Plain number|Kind|Notes', 'sent list');
      const sum = { ...inputs, mode: 's' };
      const skipped = core.buildChainValues(SOURCE, entry, sum, toyCalculate(sum).outputs, TARGET);
      assertEqual(skipped.skipped.join(), 'Kind: no equivalent for "s"', 'unmapped option skipped');
      const source = { schema: SOURCE, calculate: toyCalculate };
      const target = { schema: TARGET, calculate: targetCalculate };
      assertEqual(core.smokeTestChain(source, entry, target).problems.length, 0, 'works at the defaults');
      const tooLong = core.smokeTestChain(source, entry, target, { ...inputs, a_m: 3 });
      assertEqual(tooLong.problems.some((p) => p.includes('target does not calculate')), true, '15 000 mm rejected by the target');
      assertEqual(core.chainAvailable({ when: { mode: 's' } }, inputs), false, 'when: not available');
      assertEqual(core.chainAvailable({ when: { mode: 's' } }, sum), true, 'when: available');
      assertEqual(core.smokeTestChain(source, { ...entry, when: { mode: 's' }, whenNote: 'x' }, target).skipped, true, 'skipped when not available');
    },
  },
  {
    name: 'Send to validation: unknown targets and fields, mixed quantities without raw, map values and fixed values that are not options, templates into a number, and "when" without an explanation are all build errors',
    source: 'Chain contract (README, "Share link and send to"); build-manifest.js fails the build on any of them',
    run: () => {
      assertEqual(core.validateSendTo(SOURCE, { 'toy-target': TARGET }).length, 0, 'a valid chain');
      const broken = {
        ...TOY,
        sendTo: [
          { target: 'nowhere', label: 'x', links: [{ to: 'a', from: 'b' }] },
          {
            target: 'toy-target',
            label: 'y',
            when: { mode: 'q' },
            links: [
              { to: 'missing', from: 'y_m' },
              { to: 'k', from: 'y_m' },
              { to: 'kind', from: 'input:mode', map: { p: 'nope' } },
              { to: 'len_mm', template: '{y_m}' },
              { to: 'kind', value: 'zzz' },
            ],
          },
        ],
      };
      const errors = core.validateSendTo(broken, { 'toy-target': TARGET });
      const expected = ['unknown target calculator', '"when" value "q" is not an option of mode', 'needs a whenNote', 'target input "missing" does not exist', 'are different quantities', 'map value "nope" is not an option of kind', 'templates can only fill a textarea', '"zzz" is not an option of kind'];
      for (const part of expected) assertEqual(errors.some((e) => e.includes(part)), true, `error "${part}"`);
      assertEqual(errors.length, expected.length, 'no other errors');
    },
  },
  {
    name: 'Tornado: y = a² + 3b + 0·c + 10n + d + z at a 2, b 1, c 5, n 2 (whole), d 1.05 (min 1), z 0 and ±10 % ranks n (±10), a (−0.76; the raised value 2.2 is rejected), b (±0.3), d (−0.05 held at the minimum, +0.105), c (no effect); z at 0 is not varied',
    source: 'Exact arithmetic of the stand-in calculator (one-at-a-time changes: 1.8² − 2² = −0.76, 3 × 0.1 = 0.3, 1 − 1.05 = −0.05, 1.155 − 1.05 = 0.105)',
    run: () => {
      const model = (i) => {
        if (i.a > 2.15) throw new Error('a must not exceed 2.15');
        return { outputs: { y: i.a ** 2 + 3 * i.b + 0 * i.c + 10 * i.n + i.d + i.z } };
      };
      const specs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'n', integer: true }, { id: 'd', min: 1 }, { id: 'z' }];
      const t = core.tornado(model, { a: 2, b: 1, c: 5, n: 2, d: 1.05, z: 0 }, specs, 'y', 10);
      assertClose(t.base, 28.05, { rel: 1e-12 }, 'current result');
      assertEqual(t.rows.map((r) => r.id).join(), 'n,a,b,d,c', 'ranking by the larger change');
      const row = Object.fromEntries(t.rows.map((r) => [r.id, r]));
      assertEqual([row.n.low.x, row.n.high.x].join(), '1,3', 'a whole number moves by at least 1');
      assertClose(row.n.swing, 10, { rel: 1e-12 }, 'n swing');
      assertClose(row.a.dLow, -0.76, { rel: 1e-9 }, 'a lowered to 1.8');
      assertEqual(row.a.dHigh === null && row.a.high.error.includes('2.15'), true, 'a raised to 2.2 is rejected and reported');
      assertClose(row.b.dHigh, 0.3, { rel: 1e-9 }, 'b raised');
      assertEqual(row.d.low.x, 1, 'd held at its minimum');
      assertEqual(row.d.clamped.join(), 'minimum', 'clamp reported');
      assertClose(row.d.dHigh, 0.105, { rel: 1e-9 }, 'd raised to 1.155');
      assertEqual(row.c.swing, 0, 'no effect');
      assertEqual(t.zero.join(), 'z', 'an input at 0 is listed, not varied');
      assertThrows(() => core.tornado(model, { a: 2, b: 1, c: 5, n: 2, d: 1.05, z: 0 }, specs, 'y', 0), 'positive');
    },
  },
  {
    name: 'Heat map grid: p = x·w over x 1, 2, 3 and w 10, 20 gives rows 10, 20, 30 and 20, 40, 60; a point the calculator rejects is null and the rest of the grid stands',
    source: 'Exact arithmetic of the stand-in calculator',
    run: () => {
      const model = (i) => {
        if (i.x * i.w > 50) throw new Error('p above 50');
        return { outputs: { p: i.x * i.w } };
      };
      const grid = core.runGrid(model, { x: 1, w: 1 }, 'x', [1, 2, 3], 'w', [10, 20], 'p');
      assertEqual(JSON.stringify(grid), '[[10,20,30],[20,40,null]]', 'values[j][i] at (x[i], w[j])');
    },
  },
  {
    name: 'Heat-map helpers: seven equal classes over 0–7 put 0 and 0.999 in class 0, 1 in class 1, 3.5 in class 3 and 7 in class 6; a flat field takes the middle class; cell edges sit halfway between grid values (1, 2, 4 → 0.5, 1.5, 3, 5) and geometrically on a log axis (1, 10, 100 → 10^−0.5 … 10^2.5)',
    source: 'Exact arithmetic: class = ⌊7 (v − min)/(max − min)⌋ capped at 6; edges at the arithmetic (log axis: geometric) midpoints',
    run: () => {
      assertEqual([0, 0.999, 1, 3.5, 7].map((v) => heatClass(v, 0, 7)).join(), '0,0,1,3,6', 'classes');
      assertEqual(heatClass(5, 5, 5), 3, 'flat field');
      assertEqual(heatBreaks(0, 7).join(), '0,1,2,3,4,5,6,7', 'class limits');
      assertEqual(cellEdges([1, 2, 4]).join(), '0.5,1.5,3,5', 'linear edges');
      const edges = cellEdges([1, 10, 100], true);
      [-0.5, 0.5, 1.5, 2.5].forEach((e, k) => assertClose(edges[k], 10 ** e, { rel: 1e-12 }, `log edge ${k}`));
    },
  },
  {
    name: 'Chart helpers: 0–9.7 gets ticks 0, 2, …, 10; 1–1000 on a log axis gets 1-2-5 ticks; scales map linearly and logarithmically; a null value breaks the line; the nearest point is found for the crosshair',
    source: 'Heckbert, "Nice numbers for graph labels", Graphics Gems (1990) — 1, 2, 2.5, 5 × 10ⁿ steps',
    run: () => {
      assertEqual(niceTicks(0, 9.7, 6).ticks.join(), '0,2,4,6,8,10', 'linear ticks');
      assertEqual(logTicks(1, 1000).join(), '1,2,5,10,20,50,100,200,500,1000', 'log ticks');
      assertClose(makeScale(0, 10, 0, 100)(5), 50, { rel: 1e-12 }, 'linear scale');
      assertClose(makeScale(1, 100, 0, 200, true)(10), 100, { rel: 1e-12 }, 'log scale');
      const same = (v) => v;
      assertEqual(pathSegments([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: null }, { x: 3, y: 3 }], same, same).join('|'), 'M0.0,0.0L1.0,1.0|M3.0,3.0', 'gap splits the path');
      assertEqual(nearestIndex([{ x: 0 }, { x: 1 }, { x: 3 }], 2.1), 2, 'nearest point');
    },
  },
];
