/**
 * lighting-lumen/calc.js — interior lighting by the lumen method: room index, utilisation factor (typical table or
 * entered), maintenance factor, number of luminaires for a target maintained illuminance, layout rows and columns with
 * the spacing-to-height check, achieved illuminance, lighting power density and energy.
 *
 * K = L W/(h_m (L + W));  N = E A/(Φ UF MF);  E_achieved = N Φ UF MF / A.
 * Schema units: m, lx, lm, W, hours.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

/** Typical utilisation factors for a recessed louvred/diffuser luminaire (direct distribution) by room index and reflectances (ceiling/walls/floor). Indicative — manufacturer photometry governs. */
export const UF_TABLE = {
  '70/50/20': { 0.75: 0.38, 1.0: 0.45, 1.25: 0.5, 1.5: 0.54, 2.0: 0.59, 2.5: 0.63, 3.0: 0.65, 4.0: 0.68, 5.0: 0.7 },
  '50/30/20': { 0.75: 0.34, 1.0: 0.41, 1.25: 0.46, 1.5: 0.5, 2.0: 0.55, 2.5: 0.58, 3.0: 0.61, 4.0: 0.64, 5.0: 0.66 },
  '30/30/20': { 0.75: 0.31, 1.0: 0.38, 1.25: 0.43, 1.5: 0.47, 2.0: 0.52, 2.5: 0.55, 3.0: 0.58, 4.0: 0.61, 5.0: 0.63 },
};

/** EN 12464-1 maintained illuminance for common task areas (lx). */
export const ILLUMINANCE_PRESETS = {
  office_writing: { label: 'Office — writing, typing, reading (500 lx)', lux: 500 },
  drawing: { label: 'Technical drawing / CAD workstation (750 lx)', lux: 750 },
  conference: { label: 'Conference / meeting room (500 lx)', lux: 500 },
  corridor: { label: 'Corridor, circulation (100 lx)', lux: 100 },
  stores: { label: 'Store rooms, stock (100 lx)', lux: 100 },
  workshop_rough: { label: 'Workshop — rough machine work (300 lx)', lux: 300 },
  workshop_fine: { label: 'Workshop — fine machine work, bench (500 lx)', lux: 500 },
  control_room: { label: 'Control room / ECR (500 lx)', lux: 500 },
  engine_room: { label: 'Engine room general (200 lx, ISO 8995 / class)', lux: 200 },
  custom: { label: 'Custom illuminance', lux: null },
};

export const schema = {
  id: 'lighting-lumen',
  name: 'Lighting design (lumen method)',
  category: 'electrical',
  summary: 'Number of luminaires for a target illuminance from room index, utilisation and maintenance factors; power density.',
  related: ['three-phase-power', 'cable-sizing', 'solar-pv-sizing', 'generator-load'],
  assumptions: [
    'Lumen (zonal cavity) method for a uniform general lighting layout: average maintained illuminance on the horizontal working plane E = N Φ UF MF / A, where Φ is the initial luminous flux of one luminaire (lamp lumens × lamps × luminaire light-output ratio, or the luminaire lumens of an LED fitting), UF the utilisation factor and MF the maintenance factor; it gives the average, not the uniformity, and ignores task lighting, daylight and obstructions.',
    'Room index K = L W/(h_m (L + W)) with h_m the mounting height above the working plane (0.75–0.85 m above the floor in offices, 0 for floor-level tasks), valid for rooms whose length is less than about four times the width.',
    'Utilisation factor: the built-in table is a typical direct-distribution luminaire (recessed louvre or diffuser) for three reflectance sets (ceiling/walls/floor 70/50/20, 50/30/20, 30/30/20) interpolated in K; it is indicative within about ±10 %, and the manufacturer\'s photometric UF table for the actual luminaire and reflectances should be entered when available.',
    'Maintenance factor MF = LLMF × LSF × LMF × RSMF (lamp lumen maintenance, lamp survival, luminaire maintenance, room surface maintenance): 0.8 is the usual clean-room default, 0.67 for dirty industrial spaces, 0.9 for sealed LED fittings in clean offices — entered by the user as a single factor.',
    'Layout: the luminaires are arranged in a rectangular grid with rows along the width and columns along the length; the spacing-to-height ratio (SHR = spacing/h_m) should not exceed the luminaire\'s maximum (1.25–1.5 for most direct fittings) for acceptable uniformity; the page rounds N up to a grid and reports the resulting SHR.',
    'Target illuminances are EN 12464-1 maintained values (offices 500 lx, drawing 750, corridors 100, workshops 300–500) and the engine-room value of ISO 8995 / class practice (200 lx); glare (UGR), colour rendering and emergency lighting are separate requirements.',
  ],
  notes: [
    'Verification 2026-10-31: 12 × 8 m office, h_m 2.3 m → K 2.09; 500 lx with 4 000 lm luminaires, UF 0.55, MF 0.8 → N = 27.3 → 28 (4 × 7 grid), achieved 513 lx, 10.5 W/m² for 36 W fittings — within the EN 15193 benchmark range for LED offices (8–12 W/m²).',
    'Design decision: a typical UF table is built in so the page works without photometric data, with a warning that it is indicative; a custom UF overrides it.',
  ],
  sources: [
    'CIBSE/SLL Lighting Handbook (2018) and SLL Code for Lighting — lumen method, room index, utilisation factor tables, maintenance factor',
    'EN 12464-1:2021 Light and lighting — Lighting of work places — Part 1: Indoor work places (maintained illuminance, UGR, uniformity)',
    'ISO 8995-1:2002 / CIE S 008 Lighting of indoor work places; IMO/class lighting practice for machinery spaces (ABS/DNV ergonomics notations)',
    'CIE 97:2005 Guide on the maintenance of indoor electric lighting systems (maintenance factor components)',
  ],
  inputs: [
    { id: 'length_m', label: 'Room length L', group: 'length', unit: 'm', default: 12, min: 1, max: 200 },
    { id: 'width_m', label: 'Room width W', group: 'length', unit: 'm', default: 8, min: 1, max: 200 },
    { id: 'mounting_height_m', label: 'Luminaire height above the working plane h_m', group: 'length', unit: 'm', default: 2.3, min: 0.5, max: 30 },
    { id: 'task', label: 'Task / illuminance', type: 'select', default: 'office_writing', options: Object.entries(ILLUMINANCE_PRESETS).map(([value, p]) => ({ value, label: p.label })) },
    { id: 'lux_custom', label: 'Custom maintained illuminance', group: 'dimensionless', unit: 'none', default: 300, min: 10, max: 5000, visibleWhen: { task: 'custom' }, help: 'lux' },
    { id: 'luminaire_lm', label: 'Luminous flux per luminaire Φ (luminaire lumens)', group: 'dimensionless', unit: 'none', default: 4000, min: 100, max: 200000, help: 'lm; LED panel 600×600 ≈ 3 600–4 500 lm, 2×36 W fluorescent ≈ 5 200 lm.' },
    { id: 'luminaire_w', label: 'Power per luminaire (incl. driver)', group: 'power', unit: 'W', default: 36, min: 1, max: 2000 },
    { id: 'uf_mode', label: 'Utilisation factor', type: 'select', default: 'table', options: [{ value: 'table', label: 'Typical table (direct luminaire) by room index and reflectances' }, { value: 'custom', label: 'Enter UF from the luminaire photometric data' }] },
    { id: 'reflectances', label: 'Reflectances ceiling / walls / floor', type: 'select', default: '70/50/20', options: Object.keys(UF_TABLE).map((k) => ({ value: k, label: k.replace(/\//g, ' / ') + ' %' })), visibleWhen: { uf_mode: 'table' } },
    { id: 'uf_custom', label: 'Utilisation factor UF', group: 'dimensionless', unit: 'none', default: 0.55, min: 0.1, max: 1, visibleWhen: { uf_mode: 'custom' } },
    { id: 'maintenance_factor', label: 'Maintenance factor MF', group: 'dimensionless', unit: 'none', default: 0.8, min: 0.4, max: 1, help: '0.8 clean rooms, 0.67 dirty industrial, 0.9 sealed LED in clean offices.' },
    { id: 'shr_max', label: 'Maximum spacing-to-height ratio of the luminaire', group: 'dimensionless', unit: 'none', default: 1.5, min: 0.5, max: 3 },
    { id: 'hours_per_year', label: 'Operating hours per year', group: 'dimensionless', unit: 'none', default: 2500, min: 0, max: 8760 },
  ],
  outputs: [
    { id: 'area_m2', label: 'Floor area A', group: 'area', unit: 'm2' },
    { id: 'target_lux', label: 'Target maintained illuminance (lx)', group: 'dimensionless', unit: 'none' },
    { id: 'room_index', label: 'Room index K = LW/(h_m(L + W))', group: 'dimensionless', unit: 'none' },
    { id: 'uf_used', label: 'Utilisation factor used', group: 'dimensionless', unit: 'none' },
    { id: 'luminaires_exact', label: 'Luminaires required N = E A/(Φ UF MF)', group: 'dimensionless', unit: 'none' },
    { id: 'luminaires', label: 'Luminaires installed (rounded up to a grid)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'layout', label: 'Suggested layout', type: 'text' },
    { id: 'spacing_length_m', label: 'Spacing along the length', group: 'length', unit: 'm' },
    { id: 'spacing_width_m', label: 'Spacing along the width', group: 'length', unit: 'm' },
    { id: 'shr', label: 'Spacing-to-height ratio (larger spacing / h_m)', group: 'dimensionless', unit: 'none' },
    { id: 'shr_check', label: 'Uniformity (SHR) check', type: 'text' },
    { id: 'achieved_lux', label: 'Achieved maintained illuminance (lx)', group: 'dimensionless', unit: 'none' },
    { id: 'initial_lux', label: 'Initial illuminance with new lamps (lx)', group: 'dimensionless', unit: 'none' },
    { id: 'total_power_w', label: 'Installed lighting power', group: 'power', unit: 'W' },
    { id: 'power_density_w_m2', label: 'Lighting power density (W/m²)', group: 'dimensionless', unit: 'none' },
    { id: 'efficacy_lm_w', label: 'Luminaire efficacy (lm/W)', group: 'dimensionless', unit: 'none' },
    { id: 'annual_energy_wh', label: 'Annual lighting energy', group: 'energy', unit: 'Wh', display: 'kWh' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {
      uf_mode: 'custom',
      uf_custom: 0.55,
    },
    results: {
      target_lux: '500',
      room_index: '2.09',
      luminaires_exact: '27.3',
      luminaires: '28',
      spacing_width_m: '2.0 m',
      spacing_length_m: '1.71 m',
      shr: '0.87',
      achieved_lux: '513',
      initial_lux: '642',
      total_power_w: '1 008 W',
      power_density_w_m2: '10.5',
      efficacy_lm_w: '111',
    },
  },
};

/** Room index. */
export function roomIndex(L, W, hm) {
  return (L * W) / (hm * (L + W));
}

/** Typical UF interpolated in K for a reflectance set. */
export function typicalUf(reflectances, K) {
  const table = UF_TABLE[reflectances];
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (K <= keys[0]) return table[keys[0]];
  if (K >= keys[keys.length - 1]) return table[keys[keys.length - 1]];
  for (let k = 1; k < keys.length; k += 1) {
    if (K <= keys[k]) {
      const t = (K - keys[k - 1]) / (keys[k] - keys[k - 1]);
      return table[keys[k - 1]] + t * (table[keys[k]] - table[keys[k - 1]]);
    }
  }
  return table[keys[keys.length - 1]];
}

/** Rows × columns grid with at least n luminaires, rows:columns close to W:L. */
export function gridFor(n, L, W) {
  let best = null;
  for (let rows = 1; rows <= Math.max(1, Math.ceil(Math.sqrt(n)) + 2); rows += 1) {
    const cols = Math.ceil(n / rows);
    const spacingL = L / cols;
    const spacingW = W / rows;
    const score = Math.abs(Math.log(spacingL / spacingW)) + 0.02 * (rows * cols - n);
    if (!best || score < best.score) best = { rows, cols, score };
  }
  return { rows: best.rows, cols: best.cols };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.length_m, 'length_m', 'Length');
  assertPositive(i.width_m, 'width_m', 'Width');
  assertPositive(i.mounting_height_m, 'mounting_height_m', 'Mounting height');
  assertOneOf(i.task, Object.keys(ILLUMINANCE_PRESETS), 'task', 'Task');
  assertPositive(i.luminaire_lm, 'luminaire_lm', 'Luminous flux');
  assertPositive(i.luminaire_w, 'luminaire_w', 'Power');
  assertOneOf(i.uf_mode, ['table', 'custom'], 'uf_mode', 'UF mode');
  assertRange(i.maintenance_factor, 0.3, 1, 'maintenance_factor', 'Maintenance factor');
  assertRange(i.shr_max, 0.5, 3, 'shr_max', 'Maximum SHR');
  assertRange(i.hours_per_year, 0, 8760, 'hours_per_year', 'Hours');

  const L = Math.max(i.length_m, i.width_m);
  const W = Math.min(i.length_m, i.width_m);
  const A = L * W;
  const lux = i.task === 'custom' ? assertPositive(i.lux_custom, 'lux_custom', 'Illuminance') : ILLUMINANCE_PRESETS[i.task].lux;
  const K = roomIndex(L, W, i.mounting_height_m);
  let UF;
  if (i.uf_mode === 'table') {
    assertOneOf(i.reflectances, Object.keys(UF_TABLE), 'reflectances', 'Reflectances');
    UF = typicalUf(i.reflectances, K);
  } else UF = assertRange(i.uf_custom, 0.05, 1, 'uf_custom', 'Utilisation factor');
  const nExact = (lux * A) / (i.luminaire_lm * UF * i.maintenance_factor);
  const grid = gridFor(Math.ceil(nExact), L, W);
  const N = grid.rows * grid.cols;
  const spacingL = L / grid.cols;
  const spacingW = W / grid.rows;
  const shr = Math.max(spacingL, spacingW) / i.mounting_height_m;
  const achieved = (N * i.luminaire_lm * UF * i.maintenance_factor) / A;
  const totalPower = N * i.luminaire_w;

  const shrCheck = shr <= i.shr_max ? `OK — SHR ${shr.toFixed(2)} ≤ ${i.shr_max}` : `EXCEEDED — SHR ${shr.toFixed(2)} > ${i.shr_max}: add luminaires or use a wider-distribution fitting for uniformity`;
  const layout = `${grid.rows} rows × ${grid.cols} columns = ${N} luminaires (rows across the ${W.toFixed(1)} m width, columns along the ${L.toFixed(1)} m length)`;

  const warnings = [];
  if (i.uf_mode === 'table') warnings.push(`Utilisation factor ${UF.toFixed(2)} from the typical direct-luminaire table for ${i.reflectances} reflectances (±10 %): use the manufacturer's UF table for the actual fitting.`);
  if (L / W > 4) warnings.push('Room length more than four times the width: the room-index method is unreliable — split the room into zones.');
  if (shr > i.shr_max) warnings.push('Spacing-to-height ratio exceeded: the average may be met but the uniformity (E_min/E_avg ≥ 0.6 for task areas) will not.');
  if (i.maintenance_factor > 0.85) warnings.push('Maintenance factor above 0.85 assumes sealed LED luminaires in a clean, regularly cleaned space.');
  warnings.push('Average illuminance only: glare (UGR), uniformity, colour rendering, task lighting and emergency lighting are separate requirements (EN 12464-1).');
  warnings.push('Daylight, obstructions (machinery, racks) and dark equipment surfaces reduce the real illuminance below the lumen-method average.');

  return {
    outputs: {
      area_m2: A,
      target_lux: lux,
      room_index: K,
      uf_used: UF,
      luminaires_exact: nExact,
      luminaires: N,
      layout,
      spacing_length_m: spacingL,
      spacing_width_m: spacingW,
      shr,
      shr_check: shrCheck,
      achieved_lux: achieved,
      initial_lux: achieved / i.maintenance_factor,
      total_power_w: totalPower,
      power_density_w_m2: totalPower / A,
      efficacy_lm_w: i.luminaire_lm / i.luminaire_w,
      annual_energy_wh: totalPower * i.hours_per_year,
    },
    warnings,
  };
}
