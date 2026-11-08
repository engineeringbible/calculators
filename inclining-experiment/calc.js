/**
 * inclining-experiment/calc.js — metacentric height and lightship centre of gravity from an inclining test: the
 * heeling moments of the weight movements against the tangents of the heel measured by up to three pendulums,
 * fitted by least squares as the IS Code guidance recommends, then the free-surface correction and the lightweight
 * survey (items to add or remove) to the lightship displacement and KG.
 *
 * tan θ = W·x / (Δ·GM)  →  slope b of tan θ on W·x,  GM = 1/(Δ·b);   KG_fluid = KM − GM;   KG = KG_fluid − FSM/Δ
 * Lightship: Δ_L = Δ + Σw,  KG_L = (Δ·KG + Σ w·VCG)/Δ_L   (w + to add, − to remove)
 * Schema units: tonnes, metres, tonne-metres, millimetres of pendulum deflection.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange } from '../shared/validate.js';
import { linearFit } from '../shared/stats.js';

const DEG = Math.PI / 180;
/** IS Code 2008 Part B 8.2.2.8 and Annex 1 2.4.1: 1°–4° of heel each side, at least 15 cm of deflection. */
const MIN_HEEL_DEG = 1;
const MAX_HEEL_DEG = 4;
const MIN_DEFLECTION_MM = 150;
const MIN_PENDULUM_LENGTH_M = 3;
/** IS Code 8.4.1.2: the zero point and at least six weight movements. */
const MIN_READINGS = 7;
/** Outlier test: externally studentized residual above 3, and more than about 1 mm on a 6 m pendulum (reading noise). */
const OUTLIER_T = 3;
const TANGENT_NOISE_FLOOR = 2e-4;

const DEFAULT_READINGS = [
  '# cumulative heeling moment W·x (t·m, + to starboard); deflection of pendulum 1, 2, 3 (mm, + to starboard)',
  '0; 0; 0',
  '160; 89; 81',
  '320; 178; 163',
  '160; 89; 82',
  '0; 1; 0',
  '-160; -88; -81',
  '-320; -177; -163',
  '-160; -89; -81',
  '0; 0; 1',
].join('\n');

const DEFAULT_ITEMS = [
  '# item; weight (t, + to add, − to remove); VCG (m above the keel)',
  'Inclining weights; -40; 12.5',
  'Crane and personnel on deck; -1.5; 15',
  'Lifeboat davit not yet fitted; 2.0; 18',
  'Fuel in the settling tank; -12; 6.0',
].join('\n');

export const schema = {
  id: 'inclining-experiment',
  name: 'Inclining experiment',
  category: 'maritime',
  summary: 'GM and lightship KG from an inclining test: weight-movement moments against pendulum tangents by least squares, free surface and the lightweight survey.',
  related: ['initial-stability', 'gz-criteria', 'loading-condition', 'hydrostatics'],
  assumptions: [
    'Small-angle stability: within the 1°–4° of an inclining test the heeling moment and the tangent of the heel are proportional, tan θ = W·x/(Δ·GM); the moments of the weight movements are plotted against the tangents and fitted by a least-squares straight line, which (as the IS Code guidance stresses) need not pass through the origin, so a constant zero error of the pendulums does not affect GM.',
    'The tangent of each reading is the mean over the pendulums used of the deflection divided by that pendulum\'s length; the displacement and KM are those of the test condition from the draft readings, water density and hydrostatics at the actual trim, which this calculator takes as inputs.',
    'The measured metacentric height includes the free-surface effect of slack tanks at the time of the test; the free-surface moment entered is removed to obtain the solid KG.',
    'Lightweight survey: every item on board that is not part of the lightship (the inclining weights themselves, people, tools, liquids) is removed and every missing item added, each with its own vertical centre of gravity; their sum gives the lightship displacement and KG. Longitudinal centre and the hydrostatic corrections for trim and hog/sag are outside this calculator.',
    'IS Code limits checked as warnings: heel between 1° and 4° each side, a pendulum deflection of at least 15 cm, pendulums of at least 3 m, at least two pendulums, the zero point plus at least six movements, and a straight-line fit: R² below 0.99, or a reading whose externally studentized residual exceeds 3 and whose deviation exceeds about 1 mm on a 6 m pendulum, points to wind, mooring lines, liquids or people moving.',
  ],
  notes: [
    'Verification 2026-10-31: readings generated for Δ = 9000 t and GM = 1.20 m (6.0 m and 5.5 m pendulums, rounded to whole millimetres) give GM = 1.20 m; adding a 3 mm zero error to every reading leaves GM unchanged; with KM 9.50 m and a free-surface moment of 150 t·m the solid KG is 8.283 m, and the lightweight survey of the default items gives 8948.5 t at a KG of 8.269 m.',
  ],
  sources: [
    'IMO Resolution MSC.267(85) 2008 IS Code, Part B chapter 8 (determination of lightship parameters) and Annex 1 (detailed guidance for the conduct of an inclining test)',
    'ASTM F1321 Standard Guide for Conducting a Stability Test (Lightweight Survey and Inclining Experiment) to Determine the Light Ship Displacement and Centers of Gravity of a Vessel',
    'Rawson & Tupper, Basic Ship Theory, 5th ed., ch. 4 (the inclining experiment)',
  ],
  inputs: [
    { id: 'displacement_t', label: 'Displacement at the test Δ (from the drafts)', group: 'mass', unit: 't', default: 9000, min: 1, max: 600000 },
    { id: 'km_m', label: 'KM at the test draft and trim', group: 'length', unit: 'm', default: 9.5, min: 0.1, max: 60 },
    { id: 'pendulum1_m', label: 'Length of pendulum 1', group: 'length', unit: 'm', default: 6.0, min: 0, max: 30 },
    { id: 'pendulum2_m', label: 'Length of pendulum 2 (0 = not used)', group: 'length', unit: 'm', default: 5.5, min: 0, max: 30 },
    { id: 'pendulum3_m', label: 'Length of pendulum 3 (0 = not used)', group: 'length', unit: 'm', default: 0, min: 0, max: 30 },
    { id: 'readings', label: 'Readings (one per line: moment t·m; deflections mm)', type: 'textarea', rows: 11, default: DEFAULT_READINGS },
    { id: 'fsm_t_m', label: 'Free-surface moment of slack tanks during the test', group: 'mass_moment', unit: 't_m', default: 150, min: 0, max: 1e6 },
    { id: 'items', label: 'Lightweight survey items (item; weight t; VCG m)', type: 'textarea', rows: 7, default: DEFAULT_ITEMS },
  ],
  outputs: [
    { id: 'gm_m', label: 'Measured metacentric height GM (fluid)', group: 'length', unit: 'm' },
    { id: 'r2', label: 'Coefficient of determination R² of the fit', group: 'dimensionless', unit: 'none' },
    { id: 'intercept_tan', label: 'Fitted tangent at zero moment (zero error)', group: 'dimensionless', unit: 'none' },
    { id: 'max_heel_deg', label: 'Largest heel during the test', group: 'angle', unit: 'deg' },
    { id: 'kg_fluid_m', label: 'KG including free surface = KM − GM', group: 'length', unit: 'm' },
    { id: 'fsc_m', label: 'Free-surface correction FSM/Δ', group: 'length', unit: 'm' },
    { id: 'kg_solid_m', label: 'KG of the test condition (solid)', group: 'length', unit: 'm' },
    { id: 'lightship_t', label: 'Lightship displacement', group: 'mass', unit: 't' },
    { id: 'lightship_kg_m', label: 'Lightship KG', group: 'length', unit: 'm' },
    { id: 'readings_table', label: 'Readings and fit', type: 'table' },
    { id: 'items_table', label: 'Lightweight survey', type: 'table' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      gm_m: '1.201 m',
      r2: '0.99999',
      kg_fluid_m: '8.299 m',
      fsc_m: '0.017 m',
      kg_solid_m: '8.282 m',
      lightship_t: '8948.5 t',
      lightship_kg_m: '8.27 m',
    },
  },
};

/** Parse the readings: [{ moment, deflections: [mm, ...], line }]. */
export function parseReadings(text, pendulumCount) {
  const rows = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const fields = clean.split(/[;\t]+/).map((f) => f.trim()).filter((f) => f !== '');
    const values = fields.map((f) => Number(f.replace(',', '.')));
    if (values.length < 2 || values.some((v) => !Number.isFinite(v))) throw new Error(`Readings line ${index + 1}: expected a moment and at least one deflection, all numbers`);
    if (values.length - 1 < pendulumCount) throw new Error(`Readings line ${index + 1}: ${pendulumCount} pendulums are in use but only ${values.length - 1} deflection(s) are given`);
    rows.push({ moment: values[0], deflections: values.slice(1, 1 + pendulumCount), line: index + 1 });
  });
  return rows;
}

/** Externally studentized residuals of a straight-line fit: r_i / (s_(i) √(1 − h_i)), s_(i) from the fit without point i. */
export function externallyStudentized(xs, residuals) {
  const n = xs.length;
  const mean = xs.reduce((s, x) => s + x, 0) / n;
  const sxx = xs.reduce((s, x) => s + (x - mean) ** 2, 0);
  const sse = residuals.reduce((s, r) => s + r * r, 0);
  return residuals.map((r, k) => {
    const h = 1 / n + (xs[k] - mean) ** 2 / sxx;
    if (n <= 3 || h >= 1) return 0;
    const s2 = (sse - (r * r) / (1 - h)) / (n - 3);
    if (!(s2 > 1e-30)) return Math.abs(r) > 1e-15 ? Infinity : 0;
    return r / (Math.sqrt(s2) * Math.sqrt(1 - h));
  });
}

/** Parse the lightweight survey: [{ name, weight, vcg }]. */
export function parseItems(text) {
  const items = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const fields = clean.split(/;|\t/).map((f) => f.trim());
    if (fields.length < 3) throw new Error(`Survey line ${index + 1}: expected item; weight; VCG`);
    const weight = Number(fields[1].replace(',', '.'));
    const vcg = Number(fields[2].replace(',', '.'));
    if (!Number.isFinite(weight) || !Number.isFinite(vcg)) throw new Error(`Survey line ${index + 1}: weight and VCG must be numbers`);
    items.push({ name: fields[0] || `Item ${items.length + 1}`, weight, vcg });
  });
  return items;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.displacement_t, 'displacement_t', 'Displacement');
  assertPositive(i.km_m, 'km_m', 'KM');
  const lengths = [i.pendulum1_m, i.pendulum2_m, i.pendulum3_m];
  lengths.forEach((l, k) => assertNonNegative(l, `pendulum${k + 1}_m`, `Length of pendulum ${k + 1}`));
  const used = lengths.map((l, k) => ({ l, k })).filter((p) => p.l > 0);
  if (!used.length) throw new Error('Give the length of at least one pendulum');
  if (used.some((p, n) => p.k !== n)) throw new Error('Number the pendulums in use from 1 without gaps (pendulum 2 is used only together with pendulum 1)');
  assertNonNegative(i.fsm_t_m, 'fsm_t_m', 'Free-surface moment');

  const readings = parseReadings(i.readings, used.length);
  if (readings.length < 3) throw new Error('At least three readings are needed for the fit');
  const tangents = readings.map((r) => r.deflections.reduce((sum, d, n) => sum + d / 1000 / used[n].l, 0) / used.length);
  const moments = readings.map((r) => r.moment);
  if (Math.max(...moments) - Math.min(...moments) <= 0) throw new Error('The heeling moments are all equal: move the weights');
  const fit = linearFit(moments, tangents);
  if (!(fit.slope > 0)) throw new Error('The tangents do not increase with the heeling moment: check the signs (+ to starboard) of moments and deflections');
  const gm = 1 / (i.displacement_t * fit.slope);
  const kgFluid = i.km_m - gm;
  const fsc = i.fsm_t_m / i.displacement_t;
  const kgSolid = kgFluid - fsc;

  const items = parseItems(i.items);
  const added = items.reduce((s, it) => s + it.weight, 0);
  const lightship = i.displacement_t + added;
  if (!(lightship > 0)) throw new Error('The survey removes more than the test displacement');
  const lightshipKg = (i.displacement_t * kgSolid + items.reduce((s, it) => s + it.weight * it.vcg, 0)) / lightship;

  const fitted = moments.map((m) => fit.intercept + fit.slope * m);
  const residuals = tangents.map((t, k) => t - fitted[k]);
  const studentized = externallyStudentized(moments, residuals);
  const maxHeel = Math.max(...tangents.map((t) => Math.abs(Math.atan(t - fit.intercept)))) / DEG;
  const maxDeflection = Math.max(...readings.flatMap((r) => r.deflections.map((d) => Math.abs(d))));

  const warnings = [];
  if (fit.r2 < 0.99) warnings.push(`R² = ${fit.r2.toFixed(4)}: the points do not lie on a straight line — look for wind, mooring lines, free liquids or people moving during the test, and repeat the bad movements.`);
  residuals.forEach((r, k) => {
    if (Math.abs(studentized[k]) > OUTLIER_T && Math.abs(r) > TANGENT_NOISE_FLOOR) warnings.push(`Reading on line ${readings[k].line} is off the line (studentized residual ${Number.isFinite(studentized[k]) ? studentized[k].toFixed(1) : 'very large'}): check it or repeat that movement.`);
  });
  if (maxHeel < MIN_HEEL_DEG || maxHeel > MAX_HEEL_DEG) warnings.push(`Largest heel ${maxHeel.toFixed(2)}°: the IS Code asks for 1° to 4° each side.`);
  if (maxDeflection < MIN_DEFLECTION_MM) warnings.push(`Largest deflection ${maxDeflection} mm: at least 150 mm each side is recommended (longer pendulums or heavier weights).`);
  if (used.some((p) => p.l < MIN_PENDULUM_LENGTH_M)) warnings.push('A pendulum shorter than 3 m: 4–6 m is recommended.');
  if (used.length < 2) warnings.push('Only one pendulum: at least two are required and three recommended, to identify bad readings.');
  if (readings.length < MIN_READINGS) warnings.push('Fewer than seven readings: the standard test is the zero point and eight weight movements (at least six with a straight-line plot).');
  if (gm < 0.05) warnings.push('Very small GM: the ship is tender — the test may not be valid and the condition may be unsafe.');

  return {
    outputs: {
      gm_m: gm,
      r2: fit.r2,
      intercept_tan: fit.intercept,
      max_heel_deg: maxHeel,
      kg_fluid_m: kgFluid,
      fsc_m: fsc,
      kg_solid_m: kgSolid,
      lightship_t: lightship,
      lightship_kg_m: lightshipKg,
      readings_table: {
        columns: ['Line', 'Moment (t·m)', ...used.map((p) => `tan θ pendulum ${p.k + 1}`), 'Mean tan θ', 'Fitted', 'Residual'],
        rows: readings.map((r, k) => [r.line, r.moment, ...r.deflections.map((d, n) => d / 1000 / used[n].l), tangents[k], fitted[k], residuals[k]]),
      },
      items_table: {
        columns: ['Item', 'Weight (t)', 'VCG (m)', 'Moment (t·m)'],
        rows: [['Test condition (solid KG)', i.displacement_t, kgSolid, i.displacement_t * kgSolid], ...items.map((it) => [it.name, it.weight, it.vcg, it.weight * it.vcg]), ['Lightship', lightship, lightshipKg, lightship * lightshipKg]],
      },
    },
    warnings,
  };
}
