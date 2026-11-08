/**
 * loading-condition/calc.js — a loading condition from a pasted list of weights and centres, with the hydrostatic
 * particulars interpolated from a pasted hydrostatic table: displacement and deadweight, KG with the free-surface
 * correction, GM, trim and end drafts, and the list from an off-centre weight.
 *
 * Δ = Σw;  KG = Σw·VCG/Δ;  LCG = Σw·LCG/Δ;  TCG = Σw·TCG/Δ;  FSC = ΣFSM/Δ;  GM_fluid = KM − KG − FSC
 * trim (m, + by the stern) = Δ (LCB − LCG) / (100 MCTC);  T_aft = T + trim·x_F/L,  T_fwd = T − trim·(L − x_F)/L
 * list: tan φ = TCG / GM_fluid
 * Schema units: tonnes, metres (longitudinal positions forward of the aft perpendicular), t/m³.
 */
import { withDefaults, assertPositive, assertRange } from '../shared/validate.js';

const DEG = Math.PI / 180;

const DEFAULT_ITEMS = [
  '# item; weight (t); VCG (m); LCG (m fwd of AP); TCG (m, + stbd); FSM (t·m) — lightship on the first line',
  'Lightship; 4200; 8.6; 64.0; 0; 0',
  'Hold 1 cargo; 1800; 6.8; 112.0; 0; 0',
  'Hold 2 cargo; 2400; 7.0; 88.0; 0; 0',
  'Hold 3 cargo; 2400; 7.0; 60.0; 0; 0',
  'Hold 4 cargo; 1600; 7.2; 36.0; 0; 0',
  'HFO 3 port; 400; 1.0; 40.0; -4.0; 180',
  'HFO 3 starboard; 380; 1.0; 40.0; 4.0; 180',
  'Fresh water; 150; 7.0; 10.0; 0; 60',
  'Fore peak ballast; 300; 4.0; 135.0; 0; 0',
  'Stores and crew; 60; 12.0; 15.0; 0; 0',
].join('\n');

const DEFAULT_HYDRO = [
  '# draft (m); displacement (t); KM (m); LCB (m fwd of AP); LCF (m fwd of AP); MCTC (t·m/cm); TPC (t/cm)',
  '5.0; 9000; 8.90; 71.8; 69.2; 165; 25.6',
  '6.0; 11600; 8.55; 71.5; 68.6; 175; 26.2',
  '7.0; 14250; 8.40; 71.2; 68.0; 185; 26.8',
  '8.0; 16960; 8.38; 70.9; 67.3; 196; 27.3',
  '9.0; 19720; 8.45; 70.5; 66.6; 208; 27.8',
].join('\n');

export const schema = {
  id: 'loading-condition',
  name: 'Loading condition from an item list',
  category: 'maritime',
  summary: 'Displacement, deadweight, KG with free surface, GM, trim, end drafts and list from a pasted list of weights and centres and a hydrostatic table.',
  related: ['hydrostatics', 'initial-stability', 'gz-criteria', 'drydock-critical-instant'],
  sendTo: [
    {
      target: 'gz-criteria',
      label: 'Check the intact stability criteria',
      note: 'Displacement, GM corrected for free surface, KG and the mean draft; paste the GZ curve of this condition from the cross curves there.',
      links: [
        { to: 'displacement_t', from: 'displacement_t' },
        { to: 'gm0_m', from: 'gm_fluid_m' },
        { to: 'kg_m', from: 'kg_fluid_m' },
        { to: 'draft_m', from: 'draft_mean_m' },
      ],
    },
    {
      target: 'drydock-critical-instant',
      label: 'Dry-docking critical instant for this condition',
      note: 'Displacement, end drafts, LBP, LCF, MCTC, TPC, KM, solid KG and free-surface moment; enter the point of contact there.',
      links: [
        { to: 'displacement_t', from: 'displacement_t' },
        { to: 'draft_fwd_m', from: 'draft_fwd_m' },
        { to: 'draft_aft_m', from: 'draft_aft_m' },
        { to: 'lbp_m', from: 'input:lbp_m' },
        { to: 'lcf_from_ap_m', from: 'lcf_m' },
        { to: 'mctc_t_m_cm', from: 'mctc_t_m_cm' },
        { to: 'tpc_t_cm', from: 'tpc_t_cm' },
        { to: 'km_m', from: 'km_m' },
        { to: 'kg_m', from: 'kg_solid_m' },
        { to: 'fsm_t_m', from: 'fsm_total_t_m' },
      ],
    },
  ],
  assumptions: [
    'Weights are summed with their vertical, longitudinal and transverse centres; the first line is taken as the lightship for the deadweight. Free-surface moments of slack tanks (FSM = ρ·i, t·m) are summed and divided by the displacement as a virtual rise of G.',
    'Hydrostatic particulars (mean draft, KM, LCB, LCF, MCTC, TPC) are interpolated linearly by displacement in the pasted table, which is for even keel in water of the table density; for other water the displacement is converted to the table density first, and MCTC and TPC are scaled with the density.',
    'Trim by the stern = Δ(LCB − LCG)/(100 MCTC) about the LCF, with the table draft taken at the LCF; this is the usual small-trim method of stability booklets and loses accuracy at large trims, where a trimmed-hydrostatics (or direct) calculation is needed.',
    'List from the transverse centre of gravity by the small-angle formula tan φ = TCG/GM; it is not valid near or beyond the deck-edge immersion or with GM close to zero (angle of loll).',
    'The calculation does not include longitudinal strength (shear forces and bending moments), grain or dangerous goods requirements; use the approved loading computer for the official condition.',
  ],
  notes: [
    'Verification 2026-10-31: the default condition sums to 13 690 t (deadweight 9490 t); interpolated in the sample table it floats at 6.79 m with KM 8.43 m, GM 1.30 m after 0.031 m of free surface, and trims 1.00 m by the stern; the sums of moments reproduce KG, LCG and TCG independently computed in the tests, and a weight moved 10 m to starboard lists the ship by atan(w·10/(Δ·GM)).',
  ],
  sources: [
    'C. B. Barrass, D. R. Derrett, Ship Stability for Masters and Mates, 7th ed. — loading condition tables, trim and drafts by MCTC, free-surface correction',
    'IMO Resolution MSC.267(85) 2008 IS Code, Part B chapter 3 (calculation of loading conditions, free-surface effects)',
    'IACS Recommendation No. 48 Requirements for loading conditions, loading manuals and loading instruments',
  ],
  inputs: [
    { id: 'items', label: 'Items (one per line: item; weight t; VCG m; LCG m; TCG m; FSM t·m)', type: 'textarea', rows: 12, default: DEFAULT_ITEMS },
    { id: 'hydrostatics', label: 'Hydrostatic table (draft; displacement; KM; LCB; LCF; MCTC; TPC)', type: 'textarea', rows: 7, default: DEFAULT_HYDRO },
    { id: 'lbp_m', label: 'Length between perpendiculars', group: 'length', unit: 'm', default: 140, min: 5, max: 500 },
    { id: 'density_t_m3', label: 'Water density at the berth or at sea', group: 'density', unit: 't_m3', default: 1.025, min: 0.99, max: 1.04 },
    { id: 'table_density_t_m3', label: 'Water density of the hydrostatic table', group: 'density', unit: 't_m3', default: 1.025, min: 0.99, max: 1.04 },
  ],
  outputs: [
    { id: 'displacement_t', label: 'Displacement', group: 'mass', unit: 't' },
    { id: 'deadweight_t', label: 'Deadweight (displacement − first line)', group: 'mass', unit: 't' },
    { id: 'kg_solid_m', label: 'KG (solid)', group: 'length', unit: 'm' },
    { id: 'fsm_total_t_m', label: 'Total free-surface moment', group: 'mass_moment', unit: 't_m' },
    { id: 'fsc_m', label: 'Free-surface correction', group: 'length', unit: 'm' },
    { id: 'kg_fluid_m', label: 'KG corrected for free surface', group: 'length', unit: 'm' },
    { id: 'km_m', label: 'KM (interpolated)', group: 'length', unit: 'm' },
    { id: 'gm_fluid_m', label: 'GM corrected for free surface', group: 'length', unit: 'm' },
    { id: 'lcg_m', label: 'LCG forward of the AP', group: 'length', unit: 'm' },
    { id: 'lcb_m', label: 'LCB forward of the AP (interpolated)', group: 'length', unit: 'm' },
    { id: 'lcf_m', label: 'LCF forward of the AP (interpolated)', group: 'length', unit: 'm' },
    { id: 'mctc_t_m_cm', label: 'MCTC at this density', group: 'mctc', unit: 't_m_cm' },
    { id: 'tpc_t_cm', label: 'TPC at this density', group: 'tpc', unit: 't_cm' },
    { id: 'draft_mean_m', label: 'Draft at the LCF', group: 'length', unit: 'm' },
    { id: 'trim_m', label: 'Trim (+ by the stern)', group: 'length', unit: 'm' },
    { id: 'draft_fwd_m', label: 'Draft forward', group: 'length', unit: 'm' },
    { id: 'draft_aft_m', label: 'Draft aft', group: 'length', unit: 'm' },
    { id: 'tcg_m', label: 'TCG (+ starboard)', group: 'length', unit: 'm' },
    { id: 'list_deg', label: 'List (+ starboard)', group: 'angle', unit: 'deg' },
    { id: 'items_table', label: 'Weights and moments', type: 'table' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      displacement_t: '13 690 t',
      deadweight_t: '9490 t',
      kg_solid_m: '7.102 m',
      fsm_total_t_m: '420 t·m',
      fsc_m: '0.031 m',
      km_m: '8.43 m',
      gm_fluid_m: '1.30 m',
      lcg_m: '69.93 m',
    },
  },
};

/** Parse lines of numbers after an optional leading name: returns [{ name, values }]. */
function parseRows(text, label, minValues, withName) {
  const rows = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const fields = clean.split(/;|\t/).map((f) => f.trim());
    const name = withName ? fields.shift() : null;
    const values = fields.map((f) => (f === '' ? 0 : Number(f.replace(',', '.'))));
    if (values.length < minValues || values.some((v) => !Number.isFinite(v))) throw new Error(`${label} line ${index + 1}: expected ${minValues} numbers${withName ? ' after the name' : ''}`);
    rows.push({ name: name || `Item ${rows.length + 1}`, values, line: index + 1 });
  });
  return rows;
}

/** Linear interpolation of every column of a table by its displacement column. */
export function interpolateHydrostatics(table, displacement) {
  const disp = table.map((r) => r.values[1]);
  if (displacement < disp[0] || displacement > disp[disp.length - 1]) throw new Error(`Displacement ${displacement.toFixed(0)} t (at the table density) is outside the hydrostatic table (${disp[0]}–${disp[disp.length - 1]} t)`);
  let k = 0;
  while (k < disp.length - 2 && displacement > disp[k + 1]) k += 1;
  const t = (displacement - disp[k]) / (disp[k + 1] - disp[k]);
  const lerp = (c) => table[k].values[c] + t * (table[k + 1].values[c] - table[k].values[c]);
  return { draft: lerp(0), km: lerp(2), lcb: lerp(3), lcf: lerp(4), mctc: lerp(5), tpc: lerp(6) };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.lbp_m, 'lbp_m', 'Length between perpendiculars');
  assertRange(i.density_t_m3, 0.99, 1.04, 'density_t_m3', 'Water density');
  assertRange(i.table_density_t_m3, 0.99, 1.04, 'table_density_t_m3', 'Table density');

  const items = parseRows(i.items, 'Items', 3, true).map((r) => ({ name: r.name, w: r.values[0], vcg: r.values[1], lcg: r.values[2] ?? 0, tcg: r.values[3] ?? 0, fsm: r.values[4] ?? 0 }));
  if (!items.length) throw new Error('Enter at least the lightship line');
  items.forEach((it) => {
    if (!(it.w > 0)) throw new Error(`Item "${it.name}": weight must be greater than zero`);
    if (it.fsm < 0) throw new Error(`Item "${it.name}": free-surface moment must not be negative`);
  });
  const table = parseRows(i.hydrostatics, 'Hydrostatic table', 7, false);
  if (table.length < 2) throw new Error('The hydrostatic table needs at least two drafts');
  for (let k = 1; k < table.length; k += 1) {
    if (!(table[k].values[1] > table[k - 1].values[1])) throw new Error(`Hydrostatic table line ${table[k].line}: displacements must increase`);
  }

  const sum = (f) => items.reduce((s, it) => s + f(it), 0);
  const disp = sum((it) => it.w);
  const kg = sum((it) => it.w * it.vcg) / disp;
  const lcg = sum((it) => it.w * it.lcg) / disp;
  const tcg = sum((it) => it.w * it.tcg) / disp;
  const fsm = sum((it) => it.fsm);
  const fsc = fsm / disp;
  const ratio = i.density_t_m3 / i.table_density_t_m3;
  const h = interpolateHydrostatics(table, disp / ratio);
  const mctc = h.mctc * ratio;
  const tpc = h.tpc * ratio;
  const kgFluid = kg + fsc;
  const gm = h.km - kgFluid;
  const trim = (disp * (h.lcb - lcg)) / (100 * mctc);
  const draftAft = h.draft + (trim * h.lcf) / i.lbp_m;
  const draftFwd = h.draft - (trim * (i.lbp_m - h.lcf)) / i.lbp_m;
  const list = gm > 0 ? Math.atan(tcg / gm) / DEG : null;

  const warnings = [];
  if (gm <= 0) warnings.push(`GM corrected for free surface is ${gm.toFixed(3)} m: the ship is unstable upright (angle of loll) — do not sail.`);
  else if (gm < 0.15) warnings.push(`GM ${gm.toFixed(3)} m is below the IS Code minimum of 0.15 m.`);
  if (list !== null && Math.abs(list) > 1) warnings.push(`List of ${Math.abs(list).toFixed(1)}° to ${list > 0 ? 'starboard' : 'port'}: correct it by transferring ballast or fuel.`);
  if (Math.abs(trim) > 0.015 * i.lbp_m) warnings.push(`Trim of ${trim.toFixed(2)} m is more than 1.5 % of the length: even-keel hydrostatics lose accuracy; use trimmed hydrostatics.`);
  if (fsc > 0.1) warnings.push(`Free surface costs ${fsc.toFixed(3)} m of GM: press up or empty slack tanks where possible.`);
  warnings.push('Longitudinal strength, the GZ curve and the stability criteria are not checked here; the approved loading computer governs.');

  return {
    outputs: {
      displacement_t: disp,
      deadweight_t: disp - items[0].w,
      kg_solid_m: kg,
      fsm_total_t_m: fsm,
      fsc_m: fsc,
      kg_fluid_m: kgFluid,
      km_m: h.km,
      gm_fluid_m: gm,
      lcg_m: lcg,
      lcb_m: h.lcb,
      lcf_m: h.lcf,
      mctc_t_m_cm: mctc,
      tpc_t_cm: tpc,
      draft_mean_m: h.draft,
      trim_m: trim,
      draft_fwd_m: draftFwd,
      draft_aft_m: draftAft,
      tcg_m: tcg,
      list_deg: list,
      items_table: {
        columns: ['Item', 'Weight (t)', 'VCG (m)', 'Vertical moment (t·m)', 'LCG (m)', 'Longitudinal moment (t·m)', 'TCG (m)', 'FSM (t·m)'],
        rows: [
          ...items.map((it) => [it.name, it.w, it.vcg, it.w * it.vcg, it.lcg, it.w * it.lcg, it.tcg, it.fsm]),
          ['Total', disp, kg, disp * kg, lcg, disp * lcg, tcg, fsm],
        ],
      },
    },
    warnings,
  };
}
