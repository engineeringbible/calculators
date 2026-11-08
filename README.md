# Engineering Bible calculators

The calculation library behind [engineeringbible.com](https://engineeringbible.com): 283 engineering calculators for maritime, mechanical, electrical, energy, HVAC, fluids, process, manufacturing, automotive, structural, civil and thermal work. Every calculator ships with its sources, its assumptions and limits, a worked example and recorded checks, 2,065 checks in all.

Plain HTML, CSS and vanilla JavaScript (ES modules). No framework, no bundler, no dependencies, no network access. Everything runs from this folder, in Node 18+ or a browser.

- **Use the calculators:** [engineeringbible.com](https://engineeringbible.com). Each calculator is at `engineeringbible.com/<field>/<name>/`, with the formula, the worked example and a button that runs its checks in your browser.
- **Report a wrong number:** open an issue with the calculator, your inputs and the value you expected, with its source if you have one. A "Share link" from the site records the inputs. Or write to contact@engineeringbible.com.
- **Licence:** the code is MIT ([LICENSE](LICENSE)). The articles (`content.md`, `content.es.md`) are CC BY-NC-ND 4.0 ([LICENSE-CONTENT.md](LICENSE-CONTENT.md)).

## Use a calculator in your own code

Every `calc.js` exports a `schema` (inputs, outputs, units, sources, assumptions) and a pure `calculate(inputs)`. It has no DOM and no side effects:

```js
import { calculate, schema } from './ohms-law/calc.js';

const { outputs, warnings } = calculate({ pair: 'vi', voltage_v: 24, current_a: 0.5 });
// outputs → { voltage_out_v: 24, current_out_a: 0.5, resistance_out_ohm: 48, power_out_w: 12, conductance_s: 0.0208… }
```

Inputs and outputs are in the SI units the schema names (the `_v`, `_a` and `_ohm` suffixes). Any input you leave out takes its default. Invalid input throws a plain `Error` with a readable message. `shared/units.js` converts to and from every display unit. The full contract is under "The calc.js contract" below.

These are engineering estimates with stated assumptions, not a substitute for the governing code or class rule, or for a qualified engineer's check.

## Run it

Browsers refuse to load ES modules from `file://` URLs (the page's origin is `null`, so every `import` is blocked by CORS). Serve the folder over http instead — this still works fully offline:

```
cd calculators
node serve.js            # http://localhost:8000/   (Node 18+, no dependencies)
# or
python -m http.server 8000
```

Then open `http://localhost:8000/` for the library index, or `http://localhost:8000/<calculator-id>/` for one calculator. A calculator page holds, top to bottom: the calculator, the Tools panel, the article (from `content.md`, with "Load this example" in its worked example), the assumptions and sources, and a "Run N self-tests" button that runs the calculator's `tests.js` and the check of the worked example in the browser.

Run every test from the command line:

```
node run-tests.js                  # all calculators in manifest.json + the shared modules
node run-tests.js pipe-flow        # one or more ids
node run-tests.js shared           # only the shared modules (water, statistics, formulas, articles, worked examples, tools panel, charts)
```

After adding or changing a calculator or its `content.md`, regenerate `manifest.json`, `ASSUMPTIONS.md`, `shared/version.js` and the article in every `index.html` (an edited article reaches its page only this way):

```
node build-manifest.js
```

The build fails if a summary is longer than 160 characters, a send-to chain is broken (see "Share link and send to"), an article lacks one of its six sections or links to a page that does not exist, or a calculator has no worked example or does not reproduce a number its worked example prints.

Check every calculator for robustness with random and boundary inputs (no browser, about 10 s for the whole library):

```
node fuzz.js                       # 300 random input sets per calculator, fixed seed
node fuzz.js holtrop-mennen        # one or more ids
node fuzz.js --runs 1000 --seed 7  # more sets, another seed; --full prints the complete failing inputs
```

`fuzz.js` runs `calculate()` with the defaults, every select option, each number at its limits and beyond them (zero, negative, ten times the maximum), broken text in the text areas, and random combinations — half over the whole input range, half spread around the defaults. A run may return results or reject the inputs with a plain `Error`; it fails on a crash (TypeError and the like), a message showing NaN or undefined, a visible output, table cell, text or warning that is NaN, undefined or of the wrong type, and an input validated as a whole number without `integer: true`. Infinite results are listed as notes (some are legitimate, such as an unlimited fatigue life) and shown as ∞. Each finding prints the input set that caused it, so it can become a regression test.

## Layout

```
calculators/
  shared/
    tokens.css        every colour, font, size and spacing value (theme here)
    ui.css            component styles for the renderer, all values from tokens.css
    units.js          unit groups, conversion factors, convert()/toBase()/fromBase()
    ui.js             generic renderer: renderCalculator(), renderTestPanel(), mountCalculatorPage()
    dom.js            el(), renderTable(), copyText(), downloadText() — the DOM helpers ui.js and the tools share
    format.js         formatNumber() and the "—" placeholder (DOM-free, also used by the record and the charts)
    expression.js     formulas typed into number fields ("1500/60", "2*pi*0.5"): a small parser, no eval
    markdown.js       the Markdown subset of content.md rendered to HTML; the build embeds each article in its page
    example.js        the worked example of content.md as data: "Load this example" and the check against the article
    validate.js       withDefaults() and assert* helpers used by every calc.js
    fuels.js          marine fuel constants (IMO CO₂ factors) shared by the fuel and CII calculators
    sections.js       cross-section properties (I about both axes, area, polar moment) shared by beams, columns and shafts
    seawater.js       ITTC sea-water density and viscosity, ITTC-57 friction line, roughness allowance
    stats.js          special functions, normal and Student t, descriptive statistics, least squares, seeded random numbers
    register.js       assumptions, notes and sources of the shared modules (written into ASSUMPTIONS.md)
    tests.js          self-tests of the shared modules (+ features/tests.js)
    version.js        GENERATED: library version, build date, SHA-256 stamps of every calc.js and of the shared code
    test-runner.js    assertClose/assertEqual/assertThrows and runTests() (Node + browser)
    features/
      core.js         DOM-free logic of the tools: permalink, chains, sweep, goal seek, uncertainty, CSV, record
      panel.js        the "Tools" panel below every calculator (builds the DOM, converts display units)
      chart.js        SVG charts of the tools: sweep line chart, tornado bars, heat map (tooltips, keyboard readout)
      tests.js        Node tests of core.js and the chart helpers
  <calculator-id>/
    calc.js           schema + pure calculate(inputs) — no DOM, reusable anywhere
    index.html        standalone page (three imports, one mount call); the article block in it is generated
    tests.js          ≥ 5 named tests with the reference source for each expected value
    content.md        explanatory article: summary, formulas, assumptions, worked example, FAQ, related (shown on the page)
  index.html          library index, built from manifest.json
  manifest.json       generated index of every calculator (id, name, category, summary, inputs, outputs, related, assumptions, sources)
  ASSUMPTIONS.md      generated register: assumptions, notes, runtime warnings, validation errors, self-tests (checks) and sources of every calculator
  planned.json        optional: calculators not built yet (shown on the index page)
  build-manifest.js   regenerates manifest.json, ASSUMPTIONS.md, shared/version.js and the article in every index.html
  run-tests.js        runs all tests.js files and the worked-example checks in Node
  fuzz.js             robustness check: random and boundary inputs through every calculate()
  serve.js            zero-dependency static server
  package.json        "type": "module" so Node runs the .js files as ES modules
```

## The calc.js contract

```js
export const schema = {
  id: 'pipe-flow',                     // must equal the folder name
  name: 'Pipe flow and pressure drop',
  category: 'thermal',                 // maritime | mechanical | thermal | structural | electrical | civil | general
  summary: '…',                        // ≤ 160 characters, used as meta description
  related: ['pump-affinity', …],       // ids of related calculators
  assumptions: ['…', '…'],             // every fixed assumption, simplification or caveat, one sentence each
  notes: ['…'],                        // verification findings, design decisions, table provenance, defects found and fixed
  sources: ['…'],                      // standards, textbooks, tables the formulas and test values come from
  inputs: [
    { id: 'diameter_m', label: 'Inside diameter', group: 'length', unit: 'm', default: 0.1, min: 0.001, max: 5,
      help: 'optional hint', display: 'mm' /* optional default display unit */, visibleWhen: { mode: 'x' } /* optional */ },
    { id: 'mode', label: '…', type: 'select', default: 'x', options: [{ value: 'x', label: '…' }, …] },
    { id: 'to_unit', label: '…', type: 'select', default: 'm_s',           // options that depend on another select:
      optionsBy: { field: 'quantity', options: { speed: [{ value: 'm_s', label: 'm/s' }, …], … }, defaultIndex: 1 } },
    { id: 'data', label: 'Readings', type: 'textarea', default: '1.2\n1.3', rows: 8 },  // raw text passed to calculate()
  ],
  outputs: [
    { id: 'velocity_m_s', label: 'Velocity', group: 'speed', unit: 'm_s', decimals: 2 /* optional */ },
    { id: 'regime', label: 'Flow regime', type: 'text' },
    { id: 'budget', label: 'Budget', type: 'table' },   // calculate() returns { columns: [...], rows: [[...], ...] }
  ],
  sendTo: [ … ],                       // optional chains to other calculators (see "Share link and send to")
  example: {                           // the worked example of content.md (required; shared/example.js)
    inputs: { diameter_m: [100, 'mm'], mode: 'x' },     // [value, unit id] or a schema value; others keep defaults
    results: { velocity_m_s: '3.54 m/s' },              // quoted exactly as the article prints them
  },
};

export function calculate(inputs) {
  const i = withDefaults(schema, inputs);   // partial input objects are fine
  // validate, compute …
  return { outputs: { velocity_m_s: 1.27, regime: 'turbulent' }, warnings: ['…'] };
}
```

Rules that keep every calculator interchangeable:

- **Schema units.** `unit` is the unit `calculate()` receives and returns — SI, or the conventional engineering unit when SI is never used in practice (knots and nautical miles at sea, rpm, g/kWh, t/cm). Put the unit in the id (`speed_kn`, `pitch_m`) so callers cannot misread it. The renderer converts from and to whatever the user picks; `display` only changes the preselected dropdown entry.
- **Pure functions.** `calc.js` never touches the DOM, `window`, `fetch` or `Date`. It imports only from `../shared/`.
- **Fail fast.** Validate every input with the helpers in `shared/validate.js`; throw an `Error` with the field name and the bad value. The renderer shows the message. Use `warnings` for results that are valid but suspicious.
- **Outputs may be `null`** when a value is undefined for the inputs (e.g. no upper bound); the renderer shows "—".
- **The worked example is data.** `schema.example` holds the inputs of the article's worked example and the results quoted exactly as printed there. "Load this example" (a button in the article) puts the inputs into the page with the article's units, and the check (a self-test of every calculator and a build gate) requires each quote to appear in the worked example as a whole number and unit, and `calculate()` to round to it: half a unit of the last printed decimal, a whole number to its last significant digit (848 800 means ± 50); "≈" or "about" widens a decimal to one unit, and a result can carry its own tolerance, `['≈ 2 %', { rel: 0.05 }]`.
- **Constants** live at the top of `calc.js` in UPPER_CASE with a comment naming the source (standard, table, paper). Shared physical constants (gravity) are in `shared/units.js`.
- **Nothing duplicated.** Conversion factors exist once, in `shared/units.js`. If a calculator needs a new unit or group, add it there.
- **Assumptions, checks and notes are data.** Every simplification, convention or caveat goes into `schema.assumptions` (one sentence each), every verification finding, design decision or table provenance into `schema.notes`, and every reference into `schema.sources`. The renderer shows assumptions and sources on the page; `build-manifest.js` writes all of them, plus the self-tests from `tests.js` and the runtime warnings and validation errors extracted from `calc.js`, into `manifest.json` and `ASSUMPTIONS.md`. `content.md` discusses the same points in prose. Value-dependent caveats are runtime `warnings` from `calculate()` — write them as plain string literals (template placeholders are shown as "…" in the register).

## Number fields

Every number field, including those of the tools, accepts a formula as well as a number: `1500/60`, `2*pi*0.5`, `sqrt(9.81*30)`, `12 × 0.95`. Allowed are numbers (`1.5`, `1e-3`), `+ − × ÷ ^` (also `* / **`), parentheses, the constant `pi` and the functions `sqrt`, `abs`, `ln`, `log10`, `exp`, `min` and `max`. The value appears under the field (`= 25 rpm`). The calculator, the share link, scenarios and the record receive the number, never the formula, and switching the unit replaces the formula by the converted number. `^` binds tighter than a leading sign, as in mathematics and Python: `-2^2` is −4 (a spreadsheet gives 4). A decimal comma is rejected rather than guessed. The arrow keys step a plain number by 1 (Shift: 10). The parser is `shared/expression.js` (recursive descent, no `eval`).

## Tools below every calculator

`mountCalculatorPage()` adds a "Tools" panel under each calculator. The logic lives in `shared/features/core.js` (no DOM, tested in Node); `panel.js` only builds the controls and converts between the user's display units and the schema units. Each tool's assumptions are in `shared/register.js` and therefore in `ASSUMPTIONS.md`.

### Share link and send to

The address bar always holds the calculation: `#v=1&i.<input id>=<value>&u.<id>=<unit id>`. Only inputs and units that differ from the defaults are written, values are in schema units, rounded to the 10 significant digits the fields hold. Opening a link restores every value and resets the rest to the defaults; entries that are not valid are listed in a banner and never applied.

A calculator can offer chains to other calculators in `schema.sendTo`:

```js
sendTo: [
  {
    target: 'shaft-torque',                          // id of the target calculator
    label: 'Propeller shaft torque and diameter',    // link text
    note: 'What is sent and what to check there.',   // shown under the link
    when: { system: 'ac3' },                         // optional, visibleWhen form; needs whenNote
    whenNote: 'Why the chain is unavailable otherwise.',
    links: [
      { to: 'power_w', from: 'delivered_power_w' },                    // an output; converted to the target unit
      { to: 'speed_rpm', from: 'input:rpm' },                          // a source input
      { to: 'fuel_t_per_day', from: 'me_daily_used_t', raw: true },    // same number, different quantity group
      { to: 'mode', value: 'design' },                                 // a fixed value or option
      { to: 'fuel_1', from: 'input:fuel_type', map: { vlsfo: 'lfo' } },// select → select through a map
      { to: 'components', template: 'Repeatability; typeA; {sd}; 1; ; {n}' },  // text into a textarea
    ],
  },
],
```

The link opens `../<target>/index.html#…&from=<source id>`; the target page lists what it received. `node build-manifest.js` checks every chain (target fields exist, quantities match unless `raw`, options and map values exist, `when` explains itself) and runs it end to end at the source defaults: the target must accept every value and calculate. A broken chain fails the build.

### Sweep and plot

Vary one input over 2–200 linear or logarithmic points and plot up to four results, one chart each (one y-axis per chart). Every point is a full `calculate()` call; points the calculator rejects are gaps. The table view and a CSV download carry the same numbers.

### Heat map

Vary two inputs over a grid (3–41 points each, linear or logarithmic) and colour one result in seven equal steps of one blue ramp between the smallest and the largest value of the map; cells the calculator rejects are hatched and the current point is ringed. Hover or use the arrow keys to read a cell; the table view and a CSV carry every value. A slow calculator (over 2 s per map) is not redrawn on every change: press the button.

### Goal seek

Find the input value that makes a result equal a target. The range is scanned for sign changes and refined by bisection; every root in the range is listed and the one nearest the current value can be applied to the calculator.

### Tornado

Change each input in turn by ± a percentage (default 10 %), the others held, and rank the inputs by how far the chosen result moves: two bars per input measured from the current result, the upper for the lower input value and the lower for the higher one. Inputs at zero, inputs without effect and changed values the calculator rejects are listed under the chart; the table gives every value and change.

### Uncertainty band

Give inputs a ± (absolute or percent; a standard uncertainty, a 95 % half-width or rectangular limits). The tool reports the linear propagation (GUM) with the largest contributor and, optionally, a seeded Monte Carlo interval. Below the results, type a limit for any result (an allowable stress, a maximum draught) to see the probability of being above or below it: the share of Monte Carlo draws beyond the limit with a 95 % (Wilson) interval for the sampling error, next to the normal approximation from the linear u. The results clear when the calculator inputs change.

### Scenarios

Save up to three input sets (A, B, C) in the browser's local storage and compare them side by side with the current inputs; changed values are highlighted.

### Batch (CSV)

Paste a CSV whose header row holds input ids (a "(unit)" suffix is ignored, values in schema units); every row is calculated and the results can be downloaded. "Insert template" writes the header and the current values. Comma, semicolon (decimal commas allowed) or tab separated.

### Calculation record

Print or save as PDF (a print stylesheet gives one column with the version stamps and the assumptions; the tools, the article and the self-tests are left out), copy or download a Markdown summary, or save the inputs and results as JSON and load them back. Every record carries the library version from `package.json`, the build date and SHA-256 stamps of the calculator's `calc.js` and of the shared computational modules, all from the generated `shared/version.js`; loading a record made with different code warns that the results may differ.

## Adding a calculator

1. Create `<calculator-id>/` (kebab-case, same as `schema.id`).
2. Write `calc.js`: schema first, then small exported helper functions, then `calculate()`.
3. Copy an existing `index.html`; change the title, meta description, category and heading text (the build replaces the copied article block).
4. Write `tests.js`: at least five tests, each `{ name, source, run }`. Expected values come from a textbook, a standard or a published table; name it in `source`. Include one test that checks invalid inputs throw.
5. Write `content.md` with these sections in this order: title, one-sentence summary (≤ 160 characters), introduction, formulas with every variable defined, assumptions and limitations, worked example, FAQ (5–8), related calculators. Formulas go in blocks indented by four spaces; each FAQ entry is a bold question line with the answer below it; each related calculator is a link, `- [Name](../<id>/index.html) — why`. The build checks the sections and the links and renders the article into `index.html` between `<!-- article: … -->` and `<!-- /article -->`: edit `content.md`, never that block.
6. Add `schema.example` from the worked example. Run `node run-tests.js <id>` until green (the example is checked there too), then `node fuzz.js <id>` until it reports no failing finding, then `node build-manifest.js` (regenerates `manifest.json`, `ASSUMPTIONS.md` and `shared/version.js`, and checks the send-to chains). Add `sendTo` entries where a result naturally feeds another calculator.
7. If you listed the calculator in `planned.json`, it drops out of the "planned" list automatically once the folder exists.

## Conventions

- Class names and custom properties are prefixed `ec-`. Element ids are `ec-<calculator-id>-<field-id>`.
- Theme by overriding the custom properties in `shared/tokens.css` (or in a stylesheet loaded after it). Dark mode follows `prefers-color-scheme`; force it with `<html data-theme="dark">` or `"light"`.
- Longitudinal positions in ship calculators are measured from the aft perpendicular, positive forward. Trim is positive by the stern.
- Percentages are passed as percent when the schema unit is `pct` and as fractions when it is `frac`; the id says which (`margin_pct`, `wake_fraction`).
- Money has no currency conversion; the `$` label is a placeholder for any single currency.
- Tests tolerate `rel: 1e-3` by default. Use tighter tolerances for exact definitions and `abs` for values quoted to a fixed number of decimals.
- No hand-written `.md` files other than `content.md` per calculator and this README; `ASSUMPTIONS.md` is generated.

## Accessibility

Every control has a `<label>`; unit menus have `aria-label`s; errors are tied to their field with `aria-describedby` and `aria-invalid`; the results list is an `aria-live` region; the error banner has `role="alert"`. Everything is reachable with the keyboard. Focus rings use the `--ec-focus-ring` token. Charts are focusable: the arrow keys, Home and End move the readout point by point (bar by bar on a tornado, cell by cell on a heat map), and every chart has a table view with the same values. In the article, each FAQ answer opens with Enter or Space, and a wide formula scrolls inside its own focusable block. Wide tables scroll inside a focusable region instead of widening the page.
