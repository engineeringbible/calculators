/**
 * cargo-securing/calc.js — the advanced calculation method of CSS Code Annex 13 for a non-standardized cargo unit:
 * design accelerations from the stowage position (Table 2) corrected for ship length and speed (Table 3) and for
 * B/GM below 13 (Table 4), the external forces with wind and sea sloshing on deck, and the balance of forces and
 * moments against transverse sliding, transverse tipping and longitudinal sliding, plus the rule-of-thumb check.
 *
 * F(x,y,z) = m a(x,y,z) + F_wind(x,y) + F_sloshing(x,y);  CS = MSL / 1.5;  f = μ sin α + cos α
 * Sliding:  F_y ≤ μ m g + Σ CS·f;   Tipping:  F_y a ≤ b m g + Σ CS·c;   Longitudinal:  F_x ≤ μ (m g − F_z) + Σ CS·f
 * Schema units: tonnes, metres, knots, kN, degrees.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

const DEG = Math.PI / 180;
/** CSS Code Annex 13: g = 9.81 m/s², safety factor 1.5, wind and sloshing 1 kN/m², sloshing up to 2 m above the deck. */
const G = 9.81;
const SAFETY_FACTOR = 1.5;
const WIND_KN_M2 = 1;
const SLOSHING_KN_M2 = 1;
const SLOSHING_HEIGHT_M = 2;
/** Table 2: basic accelerations (L = 100 m, 15 kn, B/GM ≥ 13) at x/L = 0.1 … 0.9 from aft. */
const X_STATIONS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const TRANSVERSE = {
  deck_high: [7.1, 6.9, 6.8, 6.7, 6.7, 6.8, 6.9, 7.1, 7.4],
  deck_low: [6.5, 6.3, 6.1, 6.1, 6.1, 6.1, 6.3, 6.5, 6.7],
  tween: [5.9, 5.6, 5.5, 5.4, 5.4, 5.5, 5.6, 5.9, 6.2],
  hold: [5.5, 5.3, 5.1, 5.0, 5.0, 5.1, 5.3, 5.5, 5.9],
};
const LONGITUDINAL = { deck_high: 3.8, deck_low: 2.9, tween: 2.0, hold: 1.5 };
const VERTICAL = [7.6, 6.2, 5.0, 4.3, 4.3, 5.0, 6.2, 7.6, 9.2];
/** Table 3: correction factor by length (rows) and speed (columns). */
const T3_LENGTHS = [50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200];
const T3_SPEEDS = [9, 12, 15, 18, 21, 24];
const T3 = [
  [1.2, 1.09, 1.0, 0.92, 0.85, 0.79, 0.7, 0.63, 0.57, 0.53, 0.49],
  [1.34, 1.22, 1.12, 1.03, 0.96, 0.9, 0.79, 0.72, 0.65, 0.6, 0.56],
  [1.49, 1.36, 1.24, 1.15, 1.07, 1.0, 0.89, 0.8, 0.73, 0.68, 0.63],
  [1.64, 1.49, 1.37, 1.27, 1.18, 1.1, 0.98, 0.89, 0.82, 0.76, 0.71],
  [1.78, 1.62, 1.49, 1.38, 1.29, 1.21, 1.08, 0.98, 0.9, 0.83, 0.78],
  [1.93, 1.76, 1.62, 1.5, 1.4, 1.31, 1.17, 1.07, 0.98, 0.91, 0.85],
];
/** Table 4: transverse correction for B/GM below 13. */
const T4_BGM = [7, 8, 9, 10, 11, 12, 13];
const T4 = {
  deck_high: [1.56, 1.4, 1.27, 1.19, 1.11, 1.05, 1.0],
  deck_low: [1.42, 1.3, 1.21, 1.14, 1.09, 1.04, 1.0],
  tween: [1.26, 1.19, 1.14, 1.09, 1.06, 1.03, 1.0],
  hold: [1.15, 1.12, 1.09, 1.06, 1.04, 1.02, 1.0],
};
const FRICTION = { steel_timber: 0.3, steel_steel_dry: 0.1, steel_steel_wet: 0.0 };

const DEFAULT_LASHINGS = [
  '# side (S, P, F or A — where the lashing is fitted); number; MSL kN; vertical angle α °; tipping lever c m',
  'S; 4; 90; 40; 3.0',
  'P; 2; 90; 40; 3.0',
  'P; 2; 90; 10; 3.9',
  'F; 2; 90; 40; 0',
  'A; 2; 90; 40; 0',
].join('\n');

export const schema = {
  id: 'cargo-securing',
  name: 'Cargo securing (CSS Code Annex 13)',
  category: 'maritime',
  summary: 'Design accelerations, forces and the sliding and tipping balance of a lashed cargo unit by the CSS Code Annex 13 advanced calculation method.',
  related: ['lifting-sling', 'mooring-line-meg4', 'loading-condition', 'roll-period'],
  assumptions: [
    'Advanced calculation method of CSS Code Annex 13: basic accelerations of Table 2 for a 100 m ship at 15 kn with B/GM ≥ 13 in unrestricted service all year (25-day voyage), interpolated linearly along the ship (x/L from aft, held at the ends below 0.1 and above 0.9); corrected by Table 3 for length and speed (bilinear interpolation) and, for B/GM < 13, the transverse acceleration by Table 4. The transverse figures include the gravity component of roll.',
    'External forces F = m·a + wind + sea sloshing, with 1 kN/m² of wind on the exposed side and front of a unit on deck and 1 kN/m² of sloshing up to 2 m above the deck (not applied below deck; may be neglected in restricted areas); the vertical force is used only to reduce friction in the longitudinal balance, as the Code\'s formulas prescribe.',
    'Securing devices count with their calculated strength CS = MSL/1.5; the MSL of a lashing is the smallest MSL of its components (Table 1, for example 50 % of the breaking strength for mild-steel shackles, rings, deck eyes and turnbuckles, 80 % for single-use wire rope, 30 % for re-usable wire rope, 50 % for chains — take the value from the Cargo Securing Manual). The efficiency factor f = μ sin α + cos α depends on the vertical lashing angle α (Table 5); lashings steeper than 60° and those deviating more than 30° from the transverse direction should be disregarded for sliding.',
    'Transverse sliding: F_y ≤ μ m g + Σ CS f for the lashings on the side that holds the unit; transverse tipping: F_y a ≤ b m g + Σ CS c, with a the height of the centre of gravity above the tipping edge, b the lever of stableness and c the lever of each lashing about the tipping edge; longitudinal sliding: F_x ≤ μ (m g − F_z) + Σ CS f for longitudinal lashings, taking the longitudinal components of transverse lashings as no more than 0.5 CS.',
    'The figures may be exceeded in marked roll resonance (amplitudes over 30°), when running before large stern or quartering seas with marginal stability, and with slamming in head seas; the Code requires the master to avoid these by course and speed. Containers on containerships and standardized cargo follow their own rules (Annex 14, the Cargo Securing Manual).',
  ],
  notes: [
    'Verification 2026-10-31: the worked example of Annex 13 — a 62 t unit stowed low on deck at x/L 0.7 of a 120 m ship at 15 kn, 6 m × 4 m × 4 m, lashings with an MSL of 90 kN (CS 60 kN) — gives F_x = 2.9 × 0.89 × 62 + 16 + 8 = 184 kN, F_y = 6.3 × 0.89 × 62 + 24 + 12 = 384 kN and F_z = 342 kN; four starboard lashings at 40° hold 0.3 × 62 × 9.81 + 4 × 60 × 0.959 = 412 kN, the port arrangement 422 kN, as printed in the Code. Tables 2–4 were read from the published Annex 13 text (MSC/Circ.664).',
  ],
  sources: [
    'IMO Code of Safe Practice for Cargo Stowage and Securing (CSS Code), Annex 13 "Methods to assess the efficiency of securing arrangements for non-standardized cargo" (MSC/Circ.664, as amended), Tables 1–5 and the worked example',
    'IMO MSC.1/Circ.1353/Rev.2 Revised guidelines for the preparation of the Cargo Securing Manual',
    'IMO/ILO/UNECE Code of Practice for Packing of Cargo Transport Units (CTU Code), Annex 7 — friction and securing principles',
  ],
  inputs: [
    { id: 'ship_length_m', label: 'Ship length L', group: 'length', unit: 'm', default: 120, min: 30, max: 400 },
    { id: 'service_speed_kn', label: 'Service speed', group: 'speed', unit: 'kn', default: 15, min: 5, max: 30 },
    { id: 'beam_m', label: 'Ship breadth B', group: 'length', unit: 'm', default: 20, min: 2, max: 80 },
    { id: 'gm_m', label: 'Metacentric height GM', group: 'length', unit: 'm', default: 1.5, min: 0.05, max: 20 },
    {
      id: 'stowage',
      label: 'Stowage level',
      type: 'select',
      default: 'deck_low',
      options: [
        { value: 'deck_high', label: 'On deck, high' },
        { value: 'deck_low', label: 'On deck, low' },
        { value: 'tween', label: 'Tween deck' },
        { value: 'hold', label: 'Lower hold' },
      ],
    },
    { id: 'position_x_l', label: 'Longitudinal position x/L from aft', group: 'ratio', unit: 'frac', default: 0.7, min: 0, max: 1 },
    { id: 'mass_t', label: 'Mass of the cargo unit m', group: 'mass', unit: 't', default: 62, min: 0.01, max: 2000 },
    { id: 'unit_length_m', label: 'Unit length (fore-and-aft)', group: 'length', unit: 'm', default: 6, min: 0.1, max: 100 },
    { id: 'unit_breadth_m', label: 'Unit breadth (athwartships)', group: 'length', unit: 'm', default: 4, min: 0.1, max: 60 },
    { id: 'unit_height_m', label: 'Unit height', group: 'length', unit: 'm', default: 4, min: 0.1, max: 40 },
    {
      id: 'sloshing',
      label: 'Sea sloshing on deck cargo',
      type: 'select',
      default: 'yes',
      options: [
        { value: 'yes', label: 'Include (unrestricted service)' },
        { value: 'no', label: 'Neglect (restricted area)' },
      ],
    },
    {
      id: 'friction',
      label: 'Friction between cargo and stowage surface',
      type: 'select',
      default: 'steel_timber',
      options: [
        { value: 'steel_timber', label: 'Steel–timber or steel–rubber (μ = 0.3)' },
        { value: 'steel_steel_dry', label: 'Steel–steel, dry (μ = 0.1)' },
        { value: 'steel_steel_wet', label: 'Steel–steel, wet (μ = 0.0)' },
      ],
    },
    { id: 'cog_height_m', label: 'Tipping lever a: centre of gravity above the tipping edge', group: 'length', unit: 'm', default: 2, min: 0, max: 40 },
    { id: 'stableness_m', label: 'Lever of stableness b: centre of gravity to the tipping edge, horizontally', group: 'length', unit: 'm', default: 2, min: 0, max: 30 },
    { id: 'lashings', label: 'Lashings (one group per line: side; number; MSL kN; α °; lever c m)', type: 'textarea', rows: 6, default: DEFAULT_LASHINGS },
  ],
  outputs: [
    { id: 'factor_length_speed', label: 'Correction for length and speed (Table 3)', group: 'dimensionless', unit: 'none' },
    { id: 'factor_bgm', label: 'Transverse correction for B/GM (Table 4)', group: 'dimensionless', unit: 'none' },
    { id: 'ax_m_s2', label: 'Longitudinal acceleration a_x', group: 'acceleration', unit: 'm_s2' },
    { id: 'ay_m_s2', label: 'Transverse acceleration a_y', group: 'acceleration', unit: 'm_s2' },
    { id: 'az_m_s2', label: 'Vertical acceleration a_z', group: 'acceleration', unit: 'm_s2' },
    { id: 'fx_kn', label: 'Longitudinal force F_x', group: 'force', unit: 'kN' },
    { id: 'fy_kn', label: 'Transverse force F_y', group: 'force', unit: 'kN' },
    { id: 'fz_kn', label: 'Vertical force F_z', group: 'force', unit: 'kN' },
    { id: 'balance_table', label: 'Balance of forces and moments', type: 'table' },
    { id: 'overall', label: 'Result', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      fx_kn: '184 kN',
      fy_kn: '384 kN',
      fz_kn: '342 kN',
    },
  },
};

/** Linear interpolation in parallel arrays, holding the end values. */
function lerp(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let k = 0;
  while (x > xs[k + 1]) k += 1;
  return ys[k] + ((ys[k + 1] - ys[k]) * (x - xs[k])) / (xs[k + 1] - xs[k]);
}

/** Table 3 factor by bilinear interpolation in length and speed. */
export function lengthSpeedFactor(lengthM, speedKn) {
  const byLength = T3.map((row) => lerp(T3_LENGTHS, row, lengthM));
  return lerp(T3_SPEEDS, byLength, speedKn);
}

/** Efficiency of a lashing in the sliding balance (Table 5): f = μ sin α + cos α. */
export function lashingEfficiency(mu, alphaDeg) {
  return mu * Math.sin(alphaDeg * DEG) + Math.cos(alphaDeg * DEG);
}

/** Parse lashing groups: [{ side, n, msl, alpha, c }]. */
export function parseLashings(text) {
  const groups = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const f = clean.split(/;|\t/).map((s) => s.trim());
    const where = `Lashings line ${index + 1}`;
    const side = (f[0] || '').toUpperCase();
    if (!['S', 'P', 'F', 'A'].includes(side)) throw new Error(`${where}: side must be S, P, F or A`);
    const [n, msl, alpha, c = 0] = f.slice(1).map((s) => Number(String(s).replace(',', '.')));
    if (!Number.isInteger(n) || n < 1) throw new Error(`${where}: the number of lashings must be a whole number of at least 1`);
    if (!(msl > 0)) throw new Error(`${where}: MSL must be greater than zero`);
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 90) throw new Error(`${where}: vertical angle must be between 0 and 90°`);
    if (!Number.isFinite(c) || c < 0) throw new Error(`${where}: lever c must not be negative`);
    groups.push({ side, n, msl, alpha, c, line: index + 1 });
  });
  return groups;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertRange(i.ship_length_m, 30, 400, 'ship_length_m', 'Ship length');
  assertRange(i.service_speed_kn, 5, 30, 'service_speed_kn', 'Service speed');
  assertPositive(i.beam_m, 'beam_m', 'Breadth');
  assertPositive(i.gm_m, 'gm_m', 'GM');
  assertOneOf(i.stowage, Object.keys(TRANSVERSE), 'stowage', 'Stowage level');
  assertRange(i.position_x_l, 0, 1, 'position_x_l', 'Longitudinal position');
  assertPositive(i.mass_t, 'mass_t', 'Mass');
  assertPositive(i.unit_length_m, 'unit_length_m', 'Unit length');
  assertPositive(i.unit_breadth_m, 'unit_breadth_m', 'Unit breadth');
  assertPositive(i.unit_height_m, 'unit_height_m', 'Unit height');
  assertOneOf(i.sloshing, ['yes', 'no'], 'sloshing', 'Sea sloshing');
  assertOneOf(i.friction, Object.keys(FRICTION), 'friction', 'Friction');
  assertNonNegative(i.cog_height_m, 'cog_height_m', 'Tipping lever a');
  assertNonNegative(i.stableness_m, 'stableness_m', 'Lever of stableness b');

  const mu = FRICTION[i.friction];
  const k3 = lengthSpeedFactor(i.ship_length_m, i.service_speed_kn);
  const bgm = i.beam_m / i.gm_m;
  const k4 = lerp(T4_BGM, T4[i.stowage], bgm);
  const ax = LONGITUDINAL[i.stowage] * k3;
  const ay = lerp(X_STATIONS, TRANSVERSE[i.stowage], i.position_x_l) * k3 * k4;
  const az = lerp(X_STATIONS, VERTICAL, i.position_x_l) * k3;
  const onDeck = i.stowage.startsWith('deck');
  const sloshHeight = Math.min(i.unit_height_m, SLOSHING_HEIGHT_M);
  const windX = onDeck ? WIND_KN_M2 * i.unit_breadth_m * i.unit_height_m : 0;
  const windY = onDeck ? WIND_KN_M2 * i.unit_length_m * i.unit_height_m : 0;
  const sloshX = onDeck && i.sloshing === 'yes' ? SLOSHING_KN_M2 * i.unit_breadth_m * sloshHeight : 0;
  const sloshY = onDeck && i.sloshing === 'yes' ? SLOSHING_KN_M2 * i.unit_length_m * sloshHeight : 0;
  const m = i.mass_t;
  const fx = m * ax + windX + sloshX;
  const fy = m * ay + windY + sloshY;
  const fz = m * az;
  const weight = m * G;

  const groups = parseLashings(i.lashings);
  const cs = (g) => g.msl / SAFETY_FACTOR;
  const sideSum = (side, term) => groups.filter((g) => g.side === side).reduce((s, g) => s + g.n * term(g), 0);
  const usable = (g) => g.alpha <= 60;
  const rows = [];
  const add = (check, load, resistance) => rows.push([check, load, resistance, resistance >= load ? 'OK' : 'NOT OK']);

  const slideRes = (side) => mu * weight + sideSum(side, (g) => (usable(g) ? cs(g) * lashingEfficiency(mu, g.alpha) : 0));
  const tipRes = (side) => i.stableness_m * weight + sideSum(side, (g) => cs(g) * g.c);
  add('Transverse sliding to port (held by the starboard lashings), kN', fy, slideRes('S'));
  add('Transverse sliding to starboard (held by the port lashings), kN', fy, slideRes('P'));
  add('Transverse tipping to port (starboard lashings), kN·m', fy * i.cog_height_m, tipRes('S'));
  add('Transverse tipping to starboard (port lashings), kN·m', fy * i.cog_height_m, tipRes('P'));
  const longFriction = mu * Math.max(0, weight - fz);
  const longRes = (side) => longFriction + sideSum(side, (g) => (usable(g) ? cs(g) * lashingEfficiency(mu, g.alpha) : 0));
  add('Longitudinal sliding forward (held by the aft lashings), kN', fx, longRes('A'));
  add('Longitudinal sliding aft (held by the forward lashings), kN', fx, longRes('F'));
  const thumb = (side) => sideSum(side, (g) => g.msl);
  rows.push(['Rule of thumb: Σ MSL on the starboard side ≥ weight, kN', weight, thumb('S'), thumb('S') >= weight ? 'OK' : 'NOT OK']);
  rows.push(['Rule of thumb: Σ MSL on the port side ≥ weight, kN', weight, thumb('P'), thumb('P') >= weight ? 'OK' : 'NOT OK']);

  const advanced = rows.slice(0, 6);
  const failed = advanced.filter((r) => r[3] !== 'OK').map((r) => r[0].split(' (')[0].split(',')[0]);
  const warnings = [];
  groups.filter((g) => g.alpha > 60).forEach((g) => warnings.push(`Lashings on line ${g.line} are steeper than 60°: not counted against sliding (they still count against tipping).`));
  if (!groups.some((g) => g.side === 'F' || g.side === 'A')) warnings.push('No longitudinal lashings entered: the longitudinal balance relies on friction alone; longitudinal components of transverse lashings may be counted up to 0.5 CS if their geometry is known.');
  if (bgm < 7) warnings.push(`B/GM = ${bgm.toFixed(1)} is below the smallest Table 4 entry (7): the ship is very stiff and transverse accelerations may exceed the table; the factor is held at 7.`);
  if (i.ship_length_m < 50 || i.ship_length_m > 200 || i.service_speed_kn < 9 || i.service_speed_kn > 24) warnings.push('Length or speed outside Table 3 (50–200 m, 9–24 kn): the nearest table value is used.');
  if (mu === 0) warnings.push('Steel on wet steel: no friction at all — every newton must be taken by the lashings.');
  warnings.push('Accelerations may be exceeded in roll resonance, in following or quartering seas with marginal stability, and with slamming; avoid these by course and speed (Annex 13 caution).');

  return {
    outputs: {
      factor_length_speed: k3,
      factor_bgm: k4,
      ax_m_s2: ax,
      ay_m_s2: ay,
      az_m_s2: az,
      fx_kn: fx,
      fy_kn: fy,
      fz_kn: fz,
      balance_table: { columns: ['Check', 'Load', 'Resistance', 'Result'], rows },
      overall: failed.length ? `Securing NOT sufficient: ${[...new Set(failed)].join('; ')}.` : 'Securing sufficient in all six balances of the advanced method.',
    },
    warnings,
  };
}
