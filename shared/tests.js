/**
 * shared/tests.js — self-tests of the shared modules (water properties, friction line, roughness allowance,
 * statistics) and, appended from features/tests.js, of the tools panel logic and the chart helpers.
 * Run: node run-tests.js shared
 */
import { seawaterDensity, seawaterKinematicViscosity, cfIttc57, roughnessAllowance, interpolate, KS_DEFAULT_M } from './seawater.js';
import { lgamma, betaI, normalCdf, normalQuantile, tCdf, tQuantile, coverageFactor, describe, quantile, linearFit, grubbsCritical, seededRandom, normalDeviate, parseNumberList } from './stats.js';
import { assertClose, assertEqual, assertThrows } from './test-runner.js';
import { tests as featureTests } from './features/tests.js';
import { evaluateExpression, isPlainNumber, numberFromText } from './expression.js';
import { renderArticle, renderInline, articleLinks } from './markdown.js';
import { parseQuote, quoteTolerance, quoteIn, exampleState, checkExample } from './example.js';
import { awgDiameterMm, awgCircularMils, awgName, awgNumber, smallestAwgForArea, smallestIecSize, resistancePerMetre, gaugeNumberForDiameterMm } from './awg.js';
import { bagsFor, bagSummary, bagYieldM3, orderOutputs, YD3_M3, FT3_M3 } from './concrete.js';
import { saturationPressure, stateFromRh, standardPressure, moistAirDensity, dewPointFromVapourPressure } from './psychro.js';
import { frictionFactor, fullyTurbulentF, fittingsK } from './pipes.js';
import { region1, region2, psat, tsat, pB23, tB23 } from './iapws97.js';
import { E_SERIES, nearestStandard, standardAtOrAbove, standardAtOrBelow, seriesOf, parseComponentValues } from './eseries.js';

export const tests = [
  {
    name: 'Sea water table: 15 °C → 1025.9 kg/m³ and 1.1883e-6 m²/s; 25 °C → 1023.2 and 0.9425e-6; interpolation at 17.5 °C is the mean of the 15 and 20 °C rows; values are held outside 0–35 °C',
    source: 'ITTC RP 7.5-02-01-03 standard sea water 35 g/kg; atlas_physics production pins (2026-10-31)',
    run: () => {
      assertClose(seawaterDensity(15), 1025.9, { rel: 1e-12 }, 'rho 15');
      assertClose(seawaterKinematicViscosity(15), 1.1883e-6, { rel: 1e-12 }, 'nu 15');
      assertClose(seawaterDensity(25), 1023.2, { rel: 1e-12 }, 'rho 25');
      assertClose(seawaterKinematicViscosity(25), 0.9425e-6, { rel: 1e-12 }, 'nu 25');
      assertClose(seawaterDensity(17.5), (1025.9 + 1024.7) / 2, { rel: 1e-12 }, 'interpolated');
      assertClose(seawaterDensity(-5), 1028.0, { rel: 1e-12 }, 'held low');
      assertClose(seawaterKinematicViscosity(40), 0.7716e-6, { rel: 1e-12 }, 'held high');
      assertClose(interpolate(2, [0, 4], [10, 20]), 15, { rel: 1e-12 }, 'interpolate');
    },
  },
  {
    name: 'Salinity slopes: 38 g/kg at 25 °C adds 3 × 0.77 = 2.31 kg/m³ and 0.39 % viscosity; 35 g/kg is the table itself',
    source: 'EOS-80 haline slopes (atlas_physics.temperature_resistance constants)',
    run: () => {
      assertClose(seawaterDensity(25, 38), 1023.2 + 2.31, { rel: 1e-12 }, 'rho');
      assertClose(seawaterKinematicViscosity(25, 38), 0.9425e-6 * 1.0039, { rel: 1e-12 }, 'nu');
      assertClose(seawaterDensity(25, 35), seawaterDensity(25), { rel: 1e-12 }, 'default');
    },
  },
  {
    name: 'ITTC-57 line: Re 1e9 → C_F = 0.075/49 = 1.5306e-3; Re 9.846e8 → 1.533564e-3',
    source: 'ITTC-1957 model-ship correlation line; production pin',
    run: () => {
      assertClose(cfIttc57(1e9), 0.075 / 49, { rel: 1e-12 }, 'Re 1e9');
      assertClose(cfIttc57(6.5 * 180 / 1.1883e-6), 1.533564e-3, { rel: 1e-6 }, 'Re 9.846e8');
    },
  },
  {
    name: 'Roughness allowance (ISO 15016 form) at L 180 m, Re 9.846e8: 150 µm → 9.677e-5, 300 → 2.044e-4, 1000 → 4.620e-4, 10 000 → 1.3616e-3; a hydraulically smooth hull is clamped at 0; ITTC-78 form 150 µm → 3.481e-4',
    source: 'ISO 15016:2025 E.7/G.8 (atlas_physics pins); ITTC 7.5-02-03-01.4 (1978) formula',
    run: () => {
      const re = 6.5 * 180 / 1.1883e-6;
      assertClose(roughnessAllowance(re, 180, KS_DEFAULT_M), 9.677369e-5, { rel: 1e-6 }, '150 µm');
      assertClose(roughnessAllowance(re, 180, 300e-6), 2.043955e-4, { rel: 1e-6 }, '300 µm');
      assertClose(roughnessAllowance(re, 180, 1000e-6), 4.620008e-4, { rel: 1e-6 }, '1000 µm');
      assertClose(roughnessAllowance(re, 180, 10000e-6), 1.361632e-3, { rel: 1e-6 }, '10 000 µm');
      assertEqual(roughnessAllowance(re, 180, 1e-9), 0, 'clamped');
      assertClose(roughnessAllowance(re, 180, 150e-6, 'ittc78'), 3.480878e-4, { rel: 1e-6 }, 'ITTC-78');
    },
  },
  {
    name: 'Special functions: lnΓ(0.5) = ln √π = 0.5723649429, lnΓ(10) = ln 9! = 12.80182748; I_0.4(2, 3) = 0.5248 (binomial identity); Φ(1.96) = 0.9750021, Φ(−3) = 0.0013499',
    source: 'Abramowitz & Stegun 6.1, 26.2 and 26.5; Lanczos (1964) / Numerical Recipes 6.1–6.4',
    run: () => {
      assertClose(lgamma(0.5), Math.log(Math.sqrt(Math.PI)), { rel: 1e-13 }, 'lnΓ(0.5)');
      assertClose(lgamma(10), Math.log(362880), { rel: 1e-13 }, 'lnΓ(10)');
      assertClose(betaI(2, 3, 0.4), 1 - (0.6 ** 4 + 4 * 0.4 * 0.6 ** 3), { rel: 1e-12 }, 'I_x(a, b)');
      assertClose(normalCdf(1.96), 0.9750021049, { abs: 1e-10 }, 'Φ(1.96)');
      assertClose(normalCdf(-3), 0.001349898032, { rel: 1e-9 }, 'Φ(−3)');
    },
  },
  {
    name: 'Normal quantiles: Φ⁻¹(0.975) = 1.959963985, Φ⁻¹(0.95) = 1.644853627, Φ⁻¹(0.001) = −3.090232306; 95.45 % two-sided coverage gives k = 2.000',
    source: 'Standard normal table (Abramowitz & Stegun 26.2); Acklam algorithm with Halley refinement; GUM G.3',
    run: () => {
      assertClose(normalQuantile(0.975), 1.959963985, { abs: 1e-9 }, '0.975');
      assertClose(normalQuantile(0.95), 1.644853627, { abs: 1e-9 }, '0.95');
      assertClose(normalQuantile(0.001), -3.090232306, { abs: 1e-9 }, '0.001');
      assertClose(coverageFactor(0.9545, Infinity), 2.0, { abs: 1e-5 }, 'k at 95.45 %');
      assertThrows(() => normalQuantile(1), '0 < p < 1', 'p = 1');
    },
  },
  {
    name: 'Student t quantiles: t₀.₉₇₅ = 12.706 (ν 1), 3.182446 (3), 2.776445 (4), 2.364624 (7), 2.262157 (9), 2.045230 (29); t₀.₉₉₅(10) = 3.169273; t₀.₉₅(1) = 6.313752; the CDF inverts the quantile',
    source: 'Student t table (e.g. NIST/SEMATECH e-Handbook 1.3.6.7.2)',
    run: () => {
      const cases = [[0.975, 1, 12.70620474], [0.975, 3, 3.182446305], [0.975, 4, 2.776445105], [0.975, 7, 2.364624252], [0.975, 9, 2.262157163], [0.975, 29, 2.045229642], [0.995, 10, 3.169272673], [0.95, 1, 6.313751515]];
      for (const [p, nu, t] of cases) assertClose(tQuantile(p, nu), t, { rel: 1e-8 }, `t(${p}, ${nu})`);
      assertClose(tCdf(2.262157163, 9), 0.975, { abs: 1e-10 }, 'CDF inverse');
      assertClose(tCdf(-2.262157163, 9), 0.025, { abs: 1e-10 }, 'lower tail');
    },
  },
  {
    name: 'GUM Table G.2 coverage factors for p = 95.45 %: ν 1 → 13.97, 2 → 4.53, 3 → 3.31, 5 → 2.65, 10 → 2.28, 20 → 2.13, 50 → 2.05, 100 → 2.025; for p = 95 %: ν 10 → 2.23, 20 → 2.09',
    source: 'JCGM 100:2008 (GUM) Annex G, Table G.2',
    run: () => {
      const g2 = [[1, 13.97], [2, 4.53], [3, 3.31], [5, 2.65], [10, 2.28], [20, 2.13], [50, 2.05]];
      for (const [nu, k] of g2) assertClose(coverageFactor(0.9545, nu), k, { abs: 0.005 }, `95.45 % ν ${nu}`);
      assertClose(coverageFactor(0.9545, 100), 2.025, { abs: 0.0005 }, '95.45 % ν 100');
      assertClose(coverageFactor(0.95, 10), 2.23, { abs: 0.005 }, '95 % ν 10');
      assertClose(coverageFactor(0.95, 20), 2.09, { abs: 0.005 }, '95 % ν 20');
    },
  },
  {
    name: 'Descriptive statistics of 2, 4, 4, 4, 5, 5, 7, 9: mean 5, population SD 2, sample SD √(32/7) = 2.1381, skewness 0.81849 and excess kurtosis 0.940625 (Excel SKEW/KURT definitions); type-7 quartiles of 1…9 are 3 and 7',
    source: 'Textbook example (population SD 2); Joanes & Gill (1998) G1/G2 estimators as used by Excel; Hyndman & Fan (1996) type 7',
    run: () => {
      const d = describe([2, 4, 4, 4, 5, 5, 7, 9]);
      assertEqual(d.mean, 5, 'mean');
      assertClose(d.populationSd, 2, { rel: 1e-12 }, 'population SD');
      assertClose(d.sd, Math.sqrt(32 / 7), { rel: 1e-12 }, 'sample SD');
      assertClose(d.skewness, 0.8184875534, { rel: 1e-9 }, 'skewness');
      assertClose(d.excessKurtosis, 0.940625, { rel: 1e-12 }, 'kurtosis');
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      assertEqual(quantile(sorted, 0.25) === 3 && quantile(sorted, 0.75) === 7 && quantile(sorted, 0.5) === 5, true, 'quartiles');
      assertClose(quantile([1, 2, 3, 4], 0.5), 2.5, { rel: 1e-12 }, 'interpolated median');
    },
  },
  {
    name: 'Least squares on (1,1) (2,3) (3,2) (4,5) (5,4): slope 0.8, intercept 0.6, R² 0.64, SE(slope) √(1.2/10) = 0.3464, t 2.309, p = 0.104 (3 df); Grubbs critical values for n = 10: 2.290 (α 5 %) and 2.482 (α 1 %)',
    source: 'OLS formulas (Montgomery & Runger); ISO 5725-2:2019 Table 5 Grubbs critical values',
    run: () => {
      const f = linearFit([1, 2, 3, 4, 5], [1, 3, 2, 5, 4]);
      assertClose(f.slope, 0.8, { rel: 1e-12 }, 'slope');
      assertClose(f.intercept, 0.6, { rel: 1e-12 }, 'intercept');
      assertClose(f.r2, 0.64, { rel: 1e-12 }, 'R²');
      assertClose(f.slopeSe, Math.sqrt(0.12), { rel: 1e-12 }, 'SE');
      assertClose(f.pValue, 2 * (1 - tCdf(0.8 / Math.sqrt(0.12), 3)), { rel: 1e-12 }, 'p');
      assertClose(f.pValue, 0.104, { abs: 5e-4 }, 'p value');
      assertClose(grubbsCritical(10, 0.05), 2.290, { abs: 5e-4 }, 'Grubbs 5 %');
      assertClose(grubbsCritical(10, 0.01), 2.482, { abs: 5e-4 }, 'Grubbs 1 %');
    },
  },
  {
    name: 'Random numbers and parsing: the seeded generator repeats exactly for the same seed; 20 000 normal deviates have mean ≈ 0 and SD ≈ 1 (±0.03); number lists accept spaces, commas, semicolons, tabs and comment lines and reject text',
    source: 'mulberry32 generator; Box–Muller transform; behaviour specification',
    run: () => {
      const a = seededRandom(42);
      const b = seededRandom(42);
      assertEqual(a() === b() && a() === b(), true, 'repeatable');
      const r = seededRandom(7);
      const z = Array.from({ length: 20000 }, () => normalDeviate(r));
      const d = describe(z);
      assertClose(d.mean, 0, { abs: 0.03 }, 'mean');
      assertClose(d.sd, 1, { abs: 0.03 }, 'SD');
      assertEqual(parseNumberList('# header\n1, 2;3\t4\n 5e1 ').join(), '1,2,3,4,50', 'parse');
      assertThrows(() => parseNumberList('1, two, 3'), 'is not a number', 'reject');
    },
  },
  {
    name: 'Formulas in number fields: 1500/60 = 25, 2*pi*0.5 = π, sqrt(9.81*30), precedence 1 + 2*3 = 7, −2^2 = −4, 2^−1 = 0.5, right-associative 2^3^2 = 512, ×, ÷, − and ** accepted',
    source: 'shared/expression.js grammar (recursive descent, conventional precedence)',
    run: () => {
      assertEqual(evaluateExpression('1500/60'), 25, 'division');
      assertClose(evaluateExpression('2*pi*0.5'), Math.PI, { rel: 1e-15 }, 'pi');
      assertClose(evaluateExpression('sqrt(9.81*30)'), Math.sqrt(294.3), { rel: 1e-15 }, 'sqrt');
      assertEqual(evaluateExpression('1+2*3'), 7, 'precedence');
      assertEqual(evaluateExpression('-2^2'), -4, 'sign and power');
      assertEqual(evaluateExpression('2^-1'), 0.5, 'signed exponent');
      assertEqual(evaluateExpression('2^3^2'), 512, 'right-associative');
      assertEqual(evaluateExpression('(1+2)*3'), 9, 'parentheses');
      assertClose(evaluateExpression('12 × 0.95'), 11.4, { rel: 1e-12 }, '×');
      assertEqual(evaluateExpression('10 ÷ 4'), 2.5, '÷');
      assertEqual(evaluateExpression('5 − 3'), 2, 'Unicode minus');
      assertEqual(evaluateExpression('2**3'), 8, '**');
      assertEqual(evaluateExpression('max(3, 7, 2)'), 7, 'max');
      assertClose(evaluateExpression('ln(exp(2))'), 2, { rel: 1e-15 }, 'ln and exp');
      assertEqual(evaluateExpression('log10(1000)'), 3, 'log10');
      assertEqual(evaluateExpression(' 1e3 '), 1000, 'plain number');
    },
  },
  {
    name: 'Formulas are rejected with a readable message: empty, division by zero, unknown names, incomplete or unbalanced input, a decimal comma, and characters that are not arithmetic',
    source: 'shared/expression.js error handling; numberFromText returns NaN for the tools',
    run: () => {
      assertThrows(() => evaluateExpression(''), 'Enter a value');
      assertThrows(() => evaluateExpression('1/0'), 'finite number');
      assertThrows(() => evaluateExpression('foo(2)'), 'Unknown name');
      assertThrows(() => evaluateExpression('2+'), 'Incomplete');
      assertThrows(() => evaluateExpression('(1+2'), 'expected');
      assertThrows(() => evaluateExpression('1,5'), 'decimal separator');
      assertThrows(() => evaluateExpression('3%'), 'not allowed');
      assertThrows(() => evaluateExpression('Infinity'), 'Unknown name');
      assertEqual(Number.isNaN(numberFromText('2+')), true, 'NaN for the tools');
      assertEqual(numberFromText('3*4'), 12, 'value for the tools');
      assertEqual(isPlainNumber('-1.5e-3') && !isPlainNumber('12/2'), true, 'plain numbers');
    },
  },
  {
    name: 'Article inline markup: **bold**, *italic*, `code` and relative links render; raw HTML is escaped; a javascript: link stays text; an asterisk inside a word (v* = 14) is not emphasis',
    source: 'shared/markdown.js subset (README, "Adding a calculator"); HTML escaping of & < > " \'',
    run: () => {
      assertEqual(renderInline('**a** and *b* with `x<y` and [beam](../beam-deflection/index.html)'), '<strong>a</strong> and <em>b</em> with <code>x&lt;y</code> and <a href="../beam-deflection/index.html">beam</a>', 'inline markup');
      assertEqual(renderInline('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;', 'raw HTML escaped');
      assertEqual(renderInline('[x](javascript:alert(1))').includes('<a'), false, 'unsafe link not rendered');
      assertEqual(renderInline('v* = 14 × (2/3)'), 'v* = 14 × (2/3)', 'no stray emphasis');
    },
  },
  {
    name: 'Article blocks: the title and summary are left out; each "##" opens a section with its slug; indented lines become one formula block; pipe tables, lists and FAQ questions (a bold first line, answer below) render; relative links are listed for the build check',
    source: 'shared/markdown.js subset (README, "Adding a calculator")',
    run: () => {
      const md = ['# Title', '', '**Summary:** One line.', '', '## Formulas', '', 'Area:', '', '    A = b h', '    Z = I / c', '', '| a | b |', '|---|--:|', '| 1 | 2 |', '', '1. one', '2. two', '', '## FAQ', '', '**Why?**', 'Because.', '', '- detail', '', '**Next?**', 'Yes.', '', '## Related calculators', '', '- [Beam](../beam-deflection/index.html) — bending.'].join('\n');
      const html = renderArticle(md);
      assertEqual(html.includes('Title') || html.includes('Summary'), false, 'title and summary left out');
      assertEqual(html.includes('<section class="ec-article-section" data-section="formulas">\n<h2 id="ec-article-formulas">Formulas</h2>'), true, 'section with slug');
      assertEqual(html.includes('<pre class="ec-formula" tabindex="0"><code>A = b h\nZ = I / c</code></pre>'), true, 'formula block');
      assertEqual(html.includes('<th scope="col" style="text-align: right">b</th>') && html.includes('<td style="text-align: right">2</td>'), true, 'table with alignment');
      assertEqual(html.includes('<ol>\n<li>one</li>\n<li>two</li>\n</ol>'), true, 'numbered list');
      assertEqual(html.includes('<details class="ec-faq"><summary>Why?</summary>\n<p>Because.</p>\n<ul>\n<li>detail</li>\n</ul>\n</details>'), true, 'question holds the blocks up to the next question');
      assertEqual((html.match(/<details/g) || []).length, 2, 'two questions');
      assertEqual(articleLinks(md).join(), '../beam-deflection/index.html', 'links for the build check');
    },
  },
  {
    name: 'Worked-example quotes: "51.5 MPa" is 51.5 ± 0.05, "848 800 N·m" is ± 50 (trailing zeros not significant), "≈ 106 700" ± 50, "about 2.1" ± 0.1, "+519.75" and "−0.2 nmi" keep their signs, "063.5°" reads 63.5 in degrees',
    source: 'shared/example.js rounding rules (README, "The worked example is data")',
    run: () => {
      const q = parseQuote('51.5 MPa');
      assertEqual([q.value, q.label, q.decimals].join(), '51.5,MPa,1', '51.5 MPa');
      assertClose(quoteTolerance(q), 0.05, { rel: 1e-5 }, 'half a unit of the last decimal');
      assertClose(quoteTolerance(parseQuote('848 800 N·m')), 50, { abs: 1e-2 }, 'whole number with trailing zeros');
      const approx = parseQuote('≈ 106 700');
      assertEqual(approx.approx && approx.value === 106700, true, 'approximate whole number');
      assertClose(quoteTolerance(approx), 50, { abs: 1e-2 }, '≈ 106 700');
      assertClose(quoteTolerance(parseQuote('about 2.1')), 0.1, { rel: 1e-5 }, 'about widens a decimal to one unit');
      assertEqual(parseQuote('+519.75').value, 519.75, 'plus sign');
      assertEqual(parseQuote('−0.2 nmi').value, -0.2, 'minus sign');
      assertEqual([parseQuote('063.5°').value, parseQuote('063.5°').label].join(), '63.5,°', 'leading zero, unit without space');
      assertThrows(() => parseQuote('two'), 'not a number');
    },
  },
  {
    name: 'Worked-example check: a quote must stand whole in the article ("−490" is not in "−490.4′", "4.0 m" not in "4.0 m³", "60 year" not in "60 years"); example inputs convert from their units; a result outside the rounding of its quote and a unit of the wrong quantity are reported',
    source: 'shared/example.js (quoteIn, exampleState, checkExample)',
    run: () => {
      assertEqual(quoteIn('DMP = −490.4′.', '−490'), false, 'part of a longer number');
      assertEqual(quoteIn('DMP = −490.4′.', '−490.4'), true, 'followed by a prime');
      assertEqual(quoteIn('a 4.0 m³ tank', '4.0 m'), false, 'part of a longer unit');
      assertEqual(quoteIn('a **4.0 m** wave', '4.0 m'), true, 'emphasis ignored');
      assertEqual(quoteIn('life 60 years', '60 year'), false, 'part of a longer word');
      const schema = {
        id: 'stand-in',
        inputs: [{ id: 'span_m', group: 'length', unit: 'm', default: 1 }, { id: 'mode', type: 'select', default: 'a' }],
        outputs: [{ id: 'double_m', label: 'Double', group: 'length', unit: 'm' }],
        example: { inputs: { span_m: [2500, 'mm'], mode: 'b' }, results: { double_m: '5.00 m' } },
      };
      const calculate = (i) => ({ outputs: { double_m: 2 * i.span_m } });
      const state = exampleState(schema);
      assertEqual([state.inputs.span_m, state.inputs.mode, state.units.span_m, state.units.double_m].join(), '2.5,b,mm,m', 'state');
      assertEqual(checkExample(schema, calculate, 'gives 5.00 m.').problems.length, 0, 'reproduced');
      assertEqual(checkExample(schema, (i) => ({ outputs: { double_m: 5.01 } }), 'gives 5.00 m.').problems[0].includes('the calculator gives 5.01'), true, 'outside the rounding');
      assertEqual(checkExample(schema, calculate, 'gives 5.000 m.').problems.length, 1, 'quote not in the article');
      assertEqual(checkExample({ ...schema, example: { results: { double_m: '5 kg' } } }, calculate).problems[0].includes('not a unit of length'), true, 'wrong quantity');
    },
  },
  {
    name: 'E series: E96 has 96 values and E24 contains every E12 and E6 value; 3793 Ω is nearest 3.9 kΩ in E24 and 3.83 kΩ in E96; 90 Ω rounds up to 91 Ω and down to 82 Ω in E24; 4.7 kΩ belongs to E6',
    source: 'IEC 60063:2015 Preferred number series for resistors and capacitors, Tables 1 and 2',
    run: () => {
      assertEqual(E_SERIES.E96.length, 96, 'E96 count');
      assertEqual(E_SERIES.E24.length, 24, 'E24 count');
      for (const m of [...E_SERIES.E12, ...E_SERIES.E6]) assertEqual(E_SERIES.E24.includes(m), true, `E24 contains ${m}`);
      assertEqual(nearestStandard(3793.1, 'E24'), 3900, 'nearest E24');
      assertEqual(nearestStandard(3793.1, 'E96'), 3830, 'nearest E96');
      assertEqual(standardAtOrAbove(90, 'E24'), 91, 'at or above');
      assertEqual(standardAtOrBelow(90, 'E24'), 82, 'at or below');
      assertEqual(standardAtOrAbove(300, 'E24'), 300, 'exact value stays');
      assertEqual(seriesOf(4700), 'E6', '4.7 k in E6');
      assertEqual(seriesOf(5110), 'E96', '5.11 k in E96');
      assertEqual(seriesOf(4567), null, 'not standard');
    },
  },
  {
    name: 'Component values: 470, 4.7k, 4k7, 2R2, 1M5 and 10kΩ read as ohms; 100n, 4u7, 22p and a plain 10 read as farads with plain numbers in µF; comments and separators are ignored; "4.7x" is rejected',
    source: 'IEC 60062:2016 clause 5 (letter and digit code: R, k, M as the decimal marker; p, n, µ for capacitors)',
    run: () => {
      const r = parseComponentValues('# resistors\n470, 4.7k; 4k7\t2R2\n1M5 10kΩ');
      assertEqual(r.length, 6, 'count');
      [470, 4700, 4700, 2.2, 1.5e6, 10000].forEach((v, i) => assertClose(r[i], v, { rel: 1e-12 }, `resistor ${i}`));
      const c = parseComponentValues('100n 4u7 22p 10', 1e-6);
      [100e-9, 4.7e-6, 22e-12, 10e-6].forEach((v, i) => assertClose(c[i], v, { rel: 1e-12 }, `capacitor ${i}`));
      assertThrows(() => parseComponentValues('4.7x'), 'not a component value');
    },
  },
  {
    name: 'AWG geometry: 4/0 is 0.4600 in and 211 600 cmil, 10 AWG 0.1019 in and 10 380 cmil, 36 AWG 0.0050 in; names and gauge numbers; the inverse formula returns the gauge',
    source: 'ASTM B258-18 Table 1 (nominal diameters and areas of AWG solid wire)',
    run: () => {
      assertClose(awgDiameterMm('0000') / 25.4, 0.46, { abs: 5e-5 }, '4/0 d');
      assertClose(awgCircularMils('0000'), 211600, { rel: 1e-3 }, '4/0 cmil');
      assertClose(awgDiameterMm('10') / 25.4, 0.1019, { abs: 5e-5 }, '10 d');
      assertClose(awgCircularMils('10'), 10380, { rel: 1e-3 }, '10 cmil');
      assertClose(awgDiameterMm('36') / 25.4, 0.005, { rel: 1e-12 }, '36 d');
      assertEqual(awgName('000'), '3/0 AWG', 'name 3/0');
      assertEqual(awgName('0'), '1/0 AWG', 'name 1/0');
      assertEqual(awgNumber('00'), -1, 'n of 00');
      assertClose(gaugeNumberForDiameterMm(awgDiameterMm('12')), 12, { abs: 1e-9 }, 'inverse');
      assertThrows(() => awgNumber('41'), 'Unknown AWG gauge');
    },
  },
  {
    name: 'Conductor resistance at 75 °C: solid 14, 12, 10 AWG copper 3.07, 1.93, 1.21 Ω/1000 ft; stranded 10 AWG 1.24 and 4/0 0.0608; smallest gauge and IEC size for an area',
    source: 'NFPA 70 (2023) Chapter 9 Table 8 (DC resistance at 75 °C, uncoated copper); ASTM B8 2 % stranding increment; IEC 60228 sizes',
    run: () => {
      const kft = (g, stranded) => resistancePerMetre(Math.PI / 4 * awgDiameterMm(g) ** 2, 'copper', 75, stranded) * 304.8;
      assertClose(kft('14', false), 3.07, { rel: 0.005 }, '14 solid');
      assertClose(kft('12', false), 1.93, { rel: 0.005 }, '12 solid');
      assertClose(kft('10', false), 1.21, { rel: 0.005 }, '10 solid');
      assertClose(kft('10', true), 1.24, { rel: 0.005 }, '10 stranded');
      assertClose(kft('0000', true), 0.0608, { rel: 0.005 }, '4/0 stranded');
      assertEqual(smallestAwgForArea(5.0), '10', '5 mm² needs 10 AWG');
      assertEqual(smallestAwgForArea(5.3), '9', '5.3 mm² needs 9 AWG');
      assertEqual(smallestAwgForArea(120), null, 'beyond 4/0');
      assertEqual(smallestIecSize(7.2), 10, '7.2 mm² → 10 mm²');
      assertEqual(smallestIecSize(2000), null, 'beyond 1000 mm²');
    },
  },
  {
    name: 'Premix bags: 0.60 ft³ per 80 lb; one cubic yard is 45 × 80 lb, 60 × 60 lb, 90 × 40 lb; a 25 kg bag makes 11.7 L; costs are empty without a price',
    source: 'US premix product data (0.60 ft³ per 80 lb bag); 1 yd³ = 27 ft³',
    run: () => {
      assertClose(bagYieldM3('lb80') / FT3_M3, 0.6, { rel: 1e-12 }, '80 lb yield');
      assertClose(bagsFor(YD3_M3, 'lb80'), 45, { rel: 1e-12 }, '80 lb per yd³');
      assertClose(bagsFor(YD3_M3, 'lb60'), 60, { rel: 1e-12 }, '60 lb per yd³');
      assertClose(bagsFor(YD3_M3, 'lb40'), 90, { rel: 1e-12 }, '40 lb per yd³');
      assertClose(bagYieldM3('kg25') * 1000, 11.705, { abs: 0.001 }, '25 kg yield');
      assertEqual(bagSummary(YD3_M3), '80 lb: 45 · 60 lb: 60 · 50 lb: 72 · 40 lb: 90 · 25 kg: 66', 'summary');
      const o = orderOutputs(YD3_M3, YD3_M3, 'lb80', 0, 0);
      assertEqual(o.bags, 45, 'exact count not rounded up');
      assertEqual(o.cost_readymix, null, 'no price');
      assertClose(orderOutputs(1, 1, 'lb80', 200, 6).cost_bags, 59 * 6, { rel: 1e-12 }, 'bag cost');
    },
  },
  {
    name: 'Psychrometrics: saturation pressure −10, 0, 20, 25, 100 °C; 20 °C and 50 % gives dew point 9.27 °C, W 0.00726, wet bulb 13.8 °C; dry air 1.2250 kg/m³ at 15 °C; 84.556 kPa at 1 500 m',
    source: 'ASHRAE Handbook — Fundamentals, Chapter 1, Tables 1 and 3 and eqs. (3)–(35); ISA sea-level density 1.225 kg/m³',
    run: () => {
      [[-10, 259.90], [0, 611.21], [20, 2338.8], [25, 3169.2], [100, 101418]].forEach(([t, p]) => assertClose(saturationPressure(t), p, { rel: 2e-4 }, `p_ws ${t} °C`));
      const s = stateFromRh(20, 0.5, 101325);
      assertClose(s.dewPoint, 9.27, { abs: 0.01 }, 'dew point');
      assertClose(s.w, 0.007262, { abs: 2e-6 }, 'W');
      assertClose(s.wetBulb, 13.78, { abs: 0.02 }, 'wet bulb');
      assertClose(moistAirDensity(15, 0, 101325), 1.225, { abs: 1e-4 }, 'dry air');
      assertClose(standardPressure(1500), 84556, { abs: 2 }, 'altitude');
      assertClose(dewPointFromVapourPressure(saturationPressure(-5)), -5, { abs: 1e-9 }, 'frost point inverse');
    },
  },
  {
    name: 'Pipes: Crane f_T for 1, 2, 4, 8 in Schedule 40 bores is 0.023, 0.019, 0.017, 0.014; Colebrook at Re 1e5, ε/D 1e-4 is 0.0185; laminar 64/Re',
    source: 'Crane TP-410 Appendix A (friction factors for clean commercial steel); Moody chart',
    run: () => {
      [[26.64, 0.023], [52.50, 0.019], [102.26, 0.017], [202.72, 0.014]].forEach(([dmm, f]) => assertClose(fullyTurbulentF(dmm / 1000), f, { abs: 0.001 }, `f_T ${dmm} mm`));
      assertClose(frictionFactor(1e5, 1e-4), 0.0185, { abs: 0.0003 }, 'Colebrook');
      assertClose(frictionFactor(1000, 1e-4), 0.064, { rel: 1e-12 }, 'laminar');
      assertClose(fittingsK({ elbow90: 2, exit: 1 }, 0.0525).K, 2 * 30 * fullyTurbulentF(0.0525) + 1, { rel: 1e-12 }, 'sum');
    },
  },
  {
    name: 'IAPWS-IF97 verification tables: region 1 (Table 5), region 2 (Table 15), saturation (Tables 35, 36) and the B23 point, all to nine digits',
    source: 'IAPWS R7-97(2012), Tables 5, 15, 35, 36 and the B23 test point after Table 1',
    run: () => {
      const chk = (o, ref, label) => ['v', 'h', 'u', 's', 'cp', 'w'].forEach((k, i) => assertClose(o[k], ref[i], { rel: 5e-9 }, `${label} ${k}`));
      chk(region1(3, 300), [0.100215168e-2, 0.115331273e3, 0.112324818e3, 0.392294792, 0.417301218e1, 0.150773921e4], 'R1 300 K 3 MPa');
      chk(region1(80, 300), [0.971180894e-3, 0.184142828e3, 0.106448356e3, 0.368563852, 0.401008987e1, 0.163469054e4], 'R1 300 K 80 MPa');
      chk(region1(3, 500), [0.120241800e-2, 0.975542239e3, 0.971934985e3, 0.258041912e1, 0.465580682e1, 0.124071337e4], 'R1 500 K 3 MPa');
      chk(region2(0.0035, 300), [0.394913866e2, 0.254991145e4, 0.241169160e4, 0.852238967e1, 0.191300162e1, 0.427920172e3], 'R2 300 K');
      chk(region2(0.0035, 700), [0.923015898e2, 0.333568375e4, 0.301262819e4, 0.101749996e2, 0.208141274e1, 0.644289068e3], 'R2 700 K low p');
      chk(region2(30, 700), [0.542946619e-2, 0.263149474e4, 0.246861076e4, 0.517540298e1, 0.103505092e2, 0.480386523e3], 'R2 700 K 30 MPa');
      [[300, 0.353658941e-2], [500, 0.263889776e1], [600, 0.123443146e2]].forEach(([T, p]) => assertClose(psat(T), p, { rel: 5e-9 }, `psat ${T}`));
      [[0.1, 0.372755919e3], [1, 0.453035632e3], [10, 0.584149488e3]].forEach(([p, T]) => assertClose(tsat(p), T, { rel: 5e-9 }, `tsat ${p}`));
      assertClose(pB23(623.15), 0.165291643e2, { rel: 5e-9 }, 'B23 p');
      assertClose(tB23(0.165291643e2), 623.15, { rel: 5e-9 }, 'B23 T');
    },
  },
  ...featureTests,
];
