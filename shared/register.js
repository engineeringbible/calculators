/**
 * shared/register.js — the assumptions, notes and sources of the SHARED modules (water properties, feature modules),
 * so that build-manifest.js can write them into ASSUMPTIONS.md next to the calculators' own registers.
 */
export const SHARED_MODULES = [
  {
    id: 'seawater',
    name: 'Sea water properties and friction line (shared/seawater.js)',
    assumptions: [
      'Density and kinematic viscosity come from the ITTC Recommended Procedure 7.5-02-01-03 table for standard sea water of 35 g/kg salinity, interpolated linearly in temperature between 0 and 35 °C and held at the end values outside that range; a salinity other than 35 g/kg is applied as a linear slope (+0.77 kg/m³ and +0.13 % viscosity per g/kg, valid for oceanic salinities 30–41 g/kg).',
      'The ITTC-1957 friction line C_F = 0.075/(log₁₀Re − 2)² is the model-ship correlation line, not a physical flat-plate law; it is what ISO 15016, ISO 19030 and the ITTC-78 method prescribe.',
      'The hull roughness allowance is the Townsin form adopted by ISO 15016:2025 (E.7, G.8), ΔC_F = 0.044[(k_s/L)^(1/3) − 10 Re^(−1/3)] + 0.000125 clamped at zero, with the 1978 ITTC form [105 (k_s/L)^(1/3) − 0.64]·10⁻³ as the legacy option; k_s is the equivalent sand roughness (≈ the 50 mm-cut-off hull roughness Rt50), default 150 µm for a new coating.',
    ],
    notes: [
      'Verification 2026-10-31: the table and slopes reproduce the atlas_physics production module (ρ 1023.2 kg/m³ and ν 0.9425e-6 m²/s at 25 °C; ΔC_F 9.677e-5 for 150 µm, L 180 m, Re 9.846e8).',
      'ISO 15016:2025 Annex E also offers a viscosity polynomial (E.8); at 15 °C it differs from the ITTC table by 0.17 %, second order for every use here, so one table is kept for both density and viscosity.',
    ],
    sources: [
      'ITTC Recommended Procedures and Guidelines 7.5-02-01-03, Fresh Water and Seawater Properties (2011)',
      'ISO 15016:2025 Ships and marine technology — Guidelines for the assessment of speed and power performance by analysis of speed trial data, Annex E (E.5–E.8) and Annex G (G.6–G.8)',
      'ITTC 7.5-02-03-01.4, 1978 ITTC Performance Prediction Method (roughness allowance); Townsin R.L., "The ITTC line — its genesis and correlation allowance", The Naval Architect, 1985',
    ],
  },
  {
    id: 'stats',
    name: 'Statistics (shared/stats.js)',
    assumptions: [
      'Special functions: log-gamma by the Lanczos approximation (g = 7, 9 coefficients, relative error about 1e-15); regularised incomplete gamma by series / continued fraction and regularised incomplete beta by the modified Lentz continued fraction (Numerical Recipes 6.2–6.4), iterated to 1e-15.',
      'Standard normal CDF from the incomplete gamma function (accurate in both tails); quantile by Acklam\'s rational approximation refined with one Halley step (absolute error below 1e-9); Student t CDF from the incomplete beta function and its quantile by bracketing and bisection to 1e-14, falling back to the normal distribution above 1e7 degrees of freedom.',
      'Descriptive statistics: sample variance with n − 1, skewness G1 and excess kurtosis G2 with the small-sample corrections used by Excel SKEW/KURT (Joanes & Gill 1998), quantiles by linear interpolation between order statistics (Hyndman–Fan type 7, the Excel PERCENTILE.INC / NumPy default).',
      'Least-squares line with the slope\'s standard error, t statistic and two-sided p-value on n − 2 degrees of freedom; Grubbs\' single-outlier critical value G = ((n − 1)/√n) √(t²/(n − 2 + t²)) with t at the two-sided level α/(2n) (ISO 5725-2).',
      'Monte Carlo sampling uses a seeded mulberry32 generator (reproducible runs, not cryptographic) with Box–Muller normal deviates.',
    ],
    notes: [
      'Verification 2026-10-31: Student t quantiles reproduce the table to 1e-8 (12.706 205, 3.182 446, 2.776 445, 2.364 624, 2.262 157, 2.045 230, 3.169 273, 6.313 752), GUM Table G.2 coverage factors to ±0.005 (13.97 … 2.025), Grubbs 2.290/2.482 for n = 10, and Excel SKEW 0.818 488 / KURT 0.940 625 for 2, 4, 4, 4, 5, 5, 7, 9.',
    ],
    sources: [
      'M. Abramowitz, I. A. Stegun, Handbook of Mathematical Functions, NBS 1964 — 6.1, 26.2, 26.5, 26.7',
      'W. H. Press et al., Numerical Recipes, 3rd ed., Cambridge 2007 — 6.1 (gamma), 6.2 (incomplete gamma), 6.4 (incomplete beta, Student t)',
      'P. J. Acklam, "An algorithm for computing the inverse normal cumulative distribution function" (2003)',
      'JCGM 100:2008 (GUM) Annex G Table G.2; ISO 5725-2:2019 Table 5 (Grubbs); D. N. Joanes, C. A. Gill, "Comparing measures of sample skewness and kurtosis", The Statistician 47, 1998; R. J. Hyndman, Y. Fan, "Sample quantiles in statistical packages", Am. Stat. 50, 1996',
    ],
  },
  {
    id: 'expression',
    name: 'Formulas in number fields (shared/expression.js)',
    assumptions: [
      'A number field accepts a formula: numbers (1.5, 1e-3), + − × ÷ and ^ (also * / ** and the Unicode signs), parentheses, the constant pi and the functions sqrt, abs, ln, log10, exp, min and max. A small recursive-descent parser evaluates it (never eval), and the result must be a finite number.',
      'Precedence is the mathematical one: ^ before × and ÷, × and ÷ before + and −, ^ right-associative (2^3^2 = 512), and a leading sign applies to the whole power (−2^2 = −4, as in Python; a spreadsheet gives +4). A decimal comma is rejected with a message rather than guessed.',
      'The calculator, the share link, scenarios, the batch template and the record receive the number, not the formula: a link or record restores the value (10 significant digits), and switching the unit of a field replaces the formula by the converted number.',
    ],
    notes: [
      'Number fields are text fields (inputmode decimal, or numeric for whole numbers) so that a formula can be typed; the arrow keys still step a plain number by 1 (Shift: 10). The tools read their own fields the same way, and a ± that is not a number or formula is reported instead of skipped.',
      'Verification 2026-10-31: 2 tests in shared/tests.js (precedence, signs, right-associative power, functions, Unicode operators; empty input, division by zero, unknown names, incomplete and unbalanced formulas, a decimal comma and stray characters rejected) and a browser check on shaft-torque: 1500/60 gives the same results as 25 with "= 25 rpm" under the field, an out-of-range formula shows its value next to the limit, the link carries 110 for 2*55, a unit switch turns 4*2000 kW into 8000000 W, and the sweep, goal-seek and ± fields accept formulas (goal seek for 1000/2 kN·m gives 4 712.4 kW = 500 kN·m × 2π × 1.5 s⁻¹).',
    ],
    sources: [
      'The Python Language Reference, 6.5 The power operator (binds more tightly than a unary operator on its left, less tightly than one on its right: the convention followed here)',
      'Microsoft Support, Calculation operators and precedence in Excel (negation before exponentiation, so =-2^2 gives 4: the difference users may expect)',
    ],
  },
  {
    id: 'article',
    name: 'Article on the page (shared/markdown.js, build-manifest.js)',
    assumptions: [
      'The explanatory article of each calculator is its content.md, rendered at build time into its index.html between the article markers, so the page reads without JavaScript and search engines see the text; every build regenerates the block, so content.md is the only place to edit.',
      'Only the Markdown subset the articles use is rendered: "##" sections and "###" headings, paragraphs, bold, italic, code, links, "-" and "1." lists, pipe tables and formula blocks indented by four spaces. A list, table or formula block may follow a paragraph line directly (CommonMark would continue the paragraph). Raw HTML is shown as text, and only relative and http(s) addresses become links.',
      'In the FAQ section a bold first line is a question, and its answer is everything up to the next question, shown collapsed. The "#" title and the "**Summary:**" paragraph are left out because the page header shows them; the summary is also the meta description.',
      'The build fails when an article lacks one of the six sections (Introduction, Formulas, Assumptions and limitations, Worked example, FAQ, Related calculators, in this order) or links to a page that does not exist. The article is not printed: Print / PDF produces the calculation record.',
    ],
    notes: [
      'Verification 2026-10-31: all 115 articles render with their six sections, 5–8 FAQ questions each, 235 formula blocks, 8 tables and no unrendered markup; the 486 related-calculator lines became links (389 by exact name, 97 short names resolved through the related ids of the schema and checked one by one); 2 Node tests in shared/tests.js; browser check of beam-deflection in light and dark mode.',
    ],
    sources: [
      'CommonMark Spec 0.31.2 (emphasis, code spans, links, indented code blocks) and the GitHub Flavored Markdown table extension, for the subset used',
    ],
  },
  {
    id: 'example',
    name: 'Worked example as data and "Load this example" (shared/example.js)',
    assumptions: [
      'Every calculator carries the worked example of its article as schema.example: the inputs, with the units the article uses, and the results quoted exactly as printed. Inputs not listed keep their defaults; for 102 of the 115 calculators the defaults are the worked example itself.',
      '"Load this example" resets the calculator, applies the example inputs and the units of the article (for the inputs given with a unit and for every quoted result), recalculates and scrolls to the calculator; the share link then carries the example.',
      'The check, a self-test of every calculator and a build gate, requires each quote to appear in the worked example as a whole (not inside a longer number such as −490.4 or a longer unit such as m³) and calculate() to round to it: within half a unit of the last printed decimal; a whole number to its last significant digit, trailing zeros not significant (848 800 means 848 800 ± 50); one unit of the last decimal when the quote is marked "≈" or "about"; or a tolerance stated with the quote. A quote shows the value only as precisely as the article prints it.',
    ],
    notes: [
      'Verification 2026-10-31: 115 examples, checked by run-tests.js and build-manifest.js. They were drafted by computing every output at the defaults and searching the article for it, then reviewed against each article; 13 were written by hand because the article uses other inputs or options (Holtrop–Mennen 1982 variant, Mercator on the sphere, beam deflection with the tabulated IPE 200, deep-water waves, a hydrostatics barge, among others), and a sweep over the select options flagged the articles whose main example differs from the defaults.',
      'The check found errors in five articles, each corrected with a note in its calculator: Holtrop–Mennen (the figures of the paper printed instead of the results of the calculator, R_F(1+k1), η_H and the 1984 increase), Mercator sailing (meridional parts), hull roughness penalty (speed rounded to 6.5 m/s), optimal charter speed (rounding) and pipe flow (friction factors). On the way, four calculators were found using a truncated knot (0.514444 m/s) instead of the exact 1852/3600 m/s of shared/units.js; they now take it from there.',
    ],
    sources: [
      'The worked example section of each content.md, with the references it cites',
    ],
  },
  {
    id: 'eseries',
    name: 'Preferred number series for resistors and capacitors (shared/eseries.js)',
    assumptions: [
      'Standard values are the IEC 60063:2015 E6, E12, E24 and E96 series, repeated in every decade; the nearest value is taken on a logarithmic scale, because the series are spaced geometrically.',
      'The usual tolerances are E6 20 %, E12 10 %, E24 5 % and E96 1 %; a part from a series can be made to a tighter tolerance than its series implies.',
      'Component values are read as marked (IEC 60062 clause 5): a letter p, n, u or µ, m, R, k, M or G is the SI prefix and may stand in for the decimal point (4k7 = 4.7 kΩ, 2R2 = 2.2 Ω, 4n7 = 4.7 nF); a plain number takes the unit the calculator states.',
    ],
    notes: [
      'Verification 2026-11-07: the tables were checked value by value against IEC 60063:2015 Tables 1 and 2; E96 has 96 values and E24 contains every E12 and E6 value.',
    ],
    sources: [
      'IEC 60063:2015 Preferred number series for resistors and capacitors',
    ],
  },
  {
    id: 'fluids',
    name: 'Reference fluid properties (shared/fluids.js)',
    assumptions: [
      'Fresh water at 20 °C (998.2 kg/m³, 1.004 cSt) and sea water at 15 °C and 35 g/kg (1025.87 kg/m³, 1.188 cSt) follow ITTC 7.5-02-01-03; air is taken at 20 °C and 101.325 kPa.',
      'Fuels and oils are typical values for the named ISO 8217 and SAE grades at the stated temperature; a real product can differ by several per cent in density and by a factor of two in viscosity, so the custom fluid takes data-sheet values.',
    ],
    notes: [
      'The table is identical to pipe-flow/calc.js FLUIDS, so pipe flow, Reynolds number, pipe volume, flow velocity, Bernoulli and hydrostatic pressure all agree for the same fluid (checked 2026-11-07).',
    ],
    sources: [
      'ITTC Recommended Procedures and Guidelines 7.5-02-01-03, Fresh Water and Seawater Properties (2011)',
      'ISO 8217:2017 Petroleum products — Fuels (class F) — Specifications of marine fuels (grade viscosity and density limits)',
    ],
  },
  {
    id: 'power',
    name: 'Power, current and voltage conversions (shared/power.js)',
    assumptions: [
      'DC power is V × I; single-phase AC power is V × I × cos φ with RMS values; three-phase power is √3 × V_LL × I × cos φ for a balanced load, with the line-to-line voltage and the line current.',
      'Apparent power is real power divided by the power factor; harmonics are not included, so for drives and rectifiers the true RMS current is higher.',
    ],
    notes: [
      'The same relations as three-phase-power and kva-to-amps, gathered in one module for the conversion pages (checked 2026-11-07 against those calculators).',
    ],
    sources: [
      'Hughes, Electrical and Electronic Technology, 12th ed., ch. 2 (DC power) and ch. "Three-phase systems" (P = √3 V_L I_L cos φ)',
    ],
  },
  {
    id: 'awg',
    name: 'American Wire Gauge and conductor resistance (shared/awg.js)',
    assumptions: [
      'AWG diameters follow the ASTM B258 defining formula d = 0.005 in × 92^((36 − n) / 39), exact for the solid wire of each gauge; 0000 is 0.4600 in and 36 is 0.0050 in.',
      'Resistance is computed from the resistivity at 20 °C (copper 1.7241 × 10⁻⁸ Ω·m per IEC 60028, aluminium 1350 2.8264 × 10⁻⁸ Ω·m) scaled linearly with temperature, divided by the area; stranded conductors add the ASTM B8 increment of 2 %.',
      'Metric sizes are the IEC 60228 nominal cross-sections, 0.5 to 1000 mm²; real IEC conductors are made to a maximum resistance, not to a nominal area, so their resistance can differ from ρ/A by a few percent.',
    ],
    notes: [
      'Verification 2026-11-07: at 75 °C the module gives 3.07, 1.93 and 1.21 Ω/1000 ft for solid 14, 12 and 10 AWG copper, 1.24 Ω/1000 ft for stranded 10 AWG and 0.0608 Ω/1000 ft for stranded 4/0, as listed in NEC Chapter 9 Table 8.',
    ],
    sources: [
      'ASTM B258-18, Standard Specification for Standard Nominal Diameters and Cross-Sectional Areas of AWG Sizes of Solid Round Wires Used as Electrical Conductors',
      'ASTM B8-23, Concentric-Lay-Stranded Copper Conductors (standard increment of resistance 2 %)',
      'IEC 60028:1925, International standard of resistance for copper; IEC 60228:2004 Conductors of insulated cables (nominal sizes)',
      'NFPA 70, National Electrical Code (2023), Chapter 9 Table 8 (conductor properties; used only as a check)',
    ],
  },
  {
    id: 'concrete',
    name: 'Premixed concrete bags and weight (shared/concrete.js)',
    assumptions: [
      'A bag of premixed concrete yields 0.60 ft³ per 80 lb of dry mix (0.45 ft³ per 60 lb, 0.30 ft³ per 40 lb), as printed on US premix bags; metric bags use the same yield per kilogram, 11.7 L per 25 kg. Mixes with a different aggregate yield a little more or less, so check the bag.',
      'The weight in place uses normal-weight concrete at 2 400 kg/m³ (about 150 lb/ft³, 4 050 lb per cubic yard).',
      'Bag counts are rounded up to whole bags after the waste allowance; ready-mix costs use the order volume including waste.',
    ],
    notes: [
      'Verification 2026-11-07: one cubic yard needs 45 bags of 80 lb, 60 of 60 lb and 90 of 40 lb, the figures in US premix yield charts.',
    ],
    sources: [
      'QUIKRETE Concrete Mix (No. 1101) product data: yield about 0.60 ft³ per 80 lb bag, 0.45 ft³ per 60 lb bag',
      'EN 1991-1-1:2002 Table A.1 (normal-weight concrete 24 kN/m³)',
    ],
  },
  {
    id: 'psychro',
    name: 'Moist-air properties (shared/psychro.js)',
    assumptions: [
      'Saturation pressure from the Hyland–Wexler equations of ASHRAE Fundamentals Chapter 1 (eq. 5 over ice below 0 °C, eq. 6 over water), valid from −100 to 200 °C; below 0 °C the dew point is the frost point.',
      'Moist air is treated as a mixture of ideal gases (ASHRAE eqs. 20, 26, 30); the enhancement factor, below 0.5 % near atmospheric pressure, is neglected.',
      'Wet bulb is the thermodynamic wet-bulb temperature from eq. (33) above freezing and (35) below; a sling psychrometer reads close to it at normal air speeds.',
      'Standard atmospheric pressure at altitude follows ASHRAE eq. (3), the US Standard Atmosphere below 11 km.',
    ],
    notes: [
      'Verification 2026-11-07: saturation pressure 0.25990 kPa at −10 °C, 2.3388 kPa at 20 °C, 3.1692 kPa at 25 °C and 101.42 kPa at 100 °C (ASHRAE Table 3); dry air at 15 °C and 101.325 kPa is 1.2250 kg/m³; standard pressure at 1 500 m is 84.556 kPa (ASHRAE Table 1).',
    ],
    sources: [
      'ASHRAE Handbook — Fundamentals (SI), Chapter 1 Psychrometrics: eqs. (3), (5), (6), (20), (26), (30), (33), (35); Tables 1 and 3',
      'Hyland, R.W. and Wexler, A. (1983), Formulations for the thermodynamic properties of the saturated phases of H2O from 173.15 K to 473.15 K, ASHRAE Transactions 89(2A)',
    ],
  },
  {
    id: 'pipes',
    name: 'Pipe friction and fitting losses (shared/pipes.js)',
    assumptions: [
      'Darcy friction factor from the Colebrook–White equation in turbulent flow and 64/Re in laminar flow (below Re 2 300); the transition zone 2 300–4 000 is uncertain in any method.',
      'Fitting losses by the Crane TP-410 method: K = f_T × L/D, with f_T the fully turbulent friction factor of clean commercial steel (ε = 0.046 mm) for the pipe bore; entrance K = 0.5 (sharp-edged) and exit K = 1.0.',
    ],
    notes: [
      'Verification 2026-11-07: f_T computed for 1, 2, 4 and 8 in Schedule 40 bores is 0.0225, 0.0190, 0.0163 and 0.0141, within 0.001 of the rounded values tabulated in Crane TP-410 (0.023, 0.019, 0.017, 0.014).',
    ],
    sources: [
      'Crane Co., Technical Paper No. 410, Flow of Fluids Through Valves, Fittings and Pipe (2018), Appendix A: friction factors for clean commercial steel and representative resistance coefficients (L/D)',
      'Colebrook, C.F. (1939), Turbulent flow in pipes, J. Inst. Civil Engineers 11',
    ],
  },
  {
    id: 'iapws97',
    name: 'Water and steam properties, IAPWS-IF97 (shared/iapws97.js)',
    assumptions: [
      'IAPWS Industrial Formulation 1997, Revised Release R7-97(2012): basic equations of region 1 (compressed liquid, 0–350 °C), region 2 (superheated vapour to 800 °C), region 4 (saturation) and the B23 boundary, up to 100 MPa.',
      'Region 3 (around the critical point, above 350 °C at pressures above the B23 line) and region 5 (800–2 000 °C) are not included; states there raise an error rather than an extrapolated value.',
    ],
    notes: [
      'Verification 2026-11-07: every value of verification Tables 5 (region 1), 15 (region 2), 35 and 36 (saturation) and the B23 test point is reproduced to all nine printed digits. Coefficients transcribed from the release PDF; exponents read from the superscript text spans.',
    ],
    sources: [
      'IAPWS R7-97(2012), Revised Release on the IAPWS Industrial Formulation 1997 for the Thermodynamic Properties of Water and Steam (Tables 1, 2, 10, 11, 34 and verification Tables 5, 15, 35, 36)',
    ],
  },
  {
    id: 'tools',
    name: 'Tools panel: share link, send to, sweep, heat map, goal seek, tornado, uncertainty, scenarios, batch, record (shared/features/)',
    assumptions: [
      'Share link: the address bar carries only the inputs and display units that differ from the defaults, in schema units and rounded to 10 significant digits (the precision of the number fields), under a version tag (v=1). Free-text inputs (data lists, budgets) travel in the link as well, so long data makes long links. Opening a link resets everything it does not name to the default; an entry that is not a valid input, option or unit is listed in the banner and never applied.',
      'Send to: a chain copies values into another calculator in that calculator\'s own schema units, converting only between units of the same quantity. A raw copy (same number, different quantity group, such as tonnes per day stored as a mass) is declared per link; select options travel only when the target has them or through a declared map. Inputs that are not sent keep the target\'s defaults, and the target page lists what it received.',
      'Send to checks: every chain is validated when the manifest is built (target fields exist, quantities match, options exist, conditional chains explain themselves) and run end to end at the source defaults (the target must accept every value and calculate); either failure stops the build.',
      'Sweep: one input runs over 2–200 linear or geometric points while the others keep their current values, and every point is a full calculate() call, so the curve is exactly what the page would show. Points the calculator rejects are left as gaps, never interpolated. The range follows the current value (½× to 1.5×) until it is edited; an edited range is converted when its unit changes.',
      'Heat map: two inputs run over a grid of 3–41 linear or geometric points each (whole-number inputs rounded, duplicates dropped) while the others keep their current values; every cell is a full calculate() call, and cells the calculator rejects are hatched, never interpolated. The colours are seven equal-interval classes of one blue ramp between the smallest and the largest result of that map (light to dark; the ramp flips in dark mode so low values recede into the surface), so a colour means different values on two maps; the legend, the per-cell tooltip, the table and the CSV give the numbers. The map is recalculated when the calculator inputs change unless a full map took more than 2 s, in which case it waits for the button.',
      'Goal seek: the range is scanned at 80 points (geometric when it spans 100× or more) for sign changes of result − target, and each bracket is refined by bisection to 1e-12 relative. Every root found is listed and the one nearest the current value is reported. A result that touches the target without crossing it between two scan points (a double root) can be missed; narrow the range to find it.',
      'Tornado: each input in turn is multiplied by 1 ∓ p/100 (default 10 %; whole numbers move by at least 1; clamped to the valid range) with the others held, and the inputs are ranked by the larger change of the chosen result. This one-at-a-time measure ignores interactions between inputs and, for a non-linear result, depends on p; inputs at zero cannot be scaled and are listed, as are inputs without effect and changed values the calculator rejects.',
      'Uncertainty band: inputs are treated as uncorrelated. The linear column is the law of propagation (GUM eq. 10) with central-difference sensitivity coefficients (step max(10⁻⁶|x|, 10⁻⁴u)), one-sided at the edge of an input\'s valid range. The ±95 % column is 1.96 u (normal, large degrees of freedom), not a Welch–Satterthwaite expanded uncertainty: use the GUM calculator for that. The Monte Carlo check (GUM Supplement 1) samples each input from a normal or rectangular distribution with a fixed seed, so a rerun repeats; draws the calculator rejects are dropped and counted.',
      'Probability of passing a limit: after a propagation, any result can be checked against a limit typed in its display unit. The Monte Carlo estimate is the fraction of valid draws above (or below) the limit, with a 95 % Wilson score interval that covers the sampling error only, not the choice of input distributions; a draw equal to the limit counts on neither side, and when no draw (or every draw) passes, only the 95 % bound is given. The normal approximation next to it reads the result as normal with the linear u, so it misjudges the tails when the result is non-linear in the inputs or an input is rectangular. Draws the calculator rejects are dropped (the count is reported), which biases the probability when they cluster beyond the limit. The results are cleared as soon as the calculator inputs change.',
      'Scenarios are stored per calculator in this browser\'s local storage: they are not shared with other browsers or devices and are lost when the site data is cleared. Values count as different above 1e-12 relative; free text is compared too and shown as a short preview with its line count.',
      'Batch: the header row holds input ids (a "(unit)" suffix is ignored) and the values are in schema units; columns left out keep the current values; decimal commas are accepted in semicolon-separated files only; at most 5 000 rows; each row runs the same calculate() as the page and a failing row reports its own error.',
      'Calculation record: the JSON file holds the inputs (schema units), the display units, every output, the warnings and three version stamps: the library version, a SHA-256 of the calculator\'s calc.js and one of the shared computational modules. Loading a record made with a different calc.js restores the inputs and warns that the results may differ. Print / PDF uses the browser\'s print engine with a print stylesheet: one column, tools hidden, notes opened, the version stamps in a header.',
    ],
    notes: [
      'Verification 2026-10-31: 17 Node tests in shared/features/tests.js (exact stand-in calculators: √2 by goal seek, u = √0.73 by the linear law, Monte Carlo within 3 %, the Wilson intervals of Newcombe 1998 and the normal tail for the probability of passing a limit, a tornado ranking with a rejected, a clamped, a whole-number and a zero input, a heat-map grid with a rejected cell and the class and cell-edge helpers, RFC 4180 quoting, record round trip, chain conversion and validation) and browser checks of every tool; the 39 chains of the library pass the build-time end-to-end check.',
      'A typed number that belongs to a unit (a sweep or search limit, a goal-seek target, an absolute ± tolerance) remembers its unit and is converted when that quantity\'s unit is switched on the calculator.',
    ],
    sources: [
      'JCGM 100:2008, Evaluation of measurement data — Guide to the expression of uncertainty in measurement (GUM), 5.1.2 and 5.1.6',
      'JCGM 101:2008, GUM Supplement 1 — Propagation of distributions using a Monte Carlo method, 6.4 and 7.7',
      'E. B. Wilson, "Probable inference, the law of succession, and statistical inference", J. Am. Stat. Assoc. 22 (1927) 209–212; R. G. Newcombe, "Two-sided confidence intervals for the single proportion: comparison of seven methods", Statistics in Medicine 17 (1998) 857–872',
      'RFC 4180, Common Format and MIME Type for Comma-Separated Values (CSV) Files (2005)',
      'P. S. Heckbert, "Nice numbers for graph labels", Graphics Gems, Academic Press 1990',
    ],
  },
];
