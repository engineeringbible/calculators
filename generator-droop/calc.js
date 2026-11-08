/**
 * generator-droop/calc.js — active load sharing and bus frequency of generating sets in parallel on an isolated bus,
 * each on a straight-line speed-droop characteristic, optionally with one isochronous set taking the balance.
 *
 * droop set i: P_i = P_r,i (f_nl,i − f) / (D_i f_r);  Σ P_i = P_load  →  f = (Σ c_i f_nl,i − P_load) / Σ c_i,  c_i = P_r,i / (D_i f_r)
 * isochronous set: holds f_set while 0 ≤ P_iso ≤ P_r,iso; beyond that it stays at 0 or P_r,iso and the droop sets move f.
 * Schema units: kW, Hz, percent.
 */
import { withDefaults, assertPositive, assertRange } from '../shared/validate.js';

const DEFAULT_SETS = [
  '# name; rated kW; droop % (or iso); no-load frequency Hz (iso: set frequency)',
  'DG1; 1000; 4; 62.4',
  'DG2; 1000; 4; 62.4',
  'DG3; 800; 4; 62.4',
].join('\n');

export const schema = {
  id: 'generator-droop',
  name: 'Generator load sharing with droop',
  category: 'electrical',
  summary: 'Active load sharing and bus frequency of paralleled generating sets with speed droop, with an optional isochronous set taking the balance.',
  related: ['generator-load', 'three-phase-power', 'short-circuit-current', 'power-factor-correction'],
  assumptions: [
    'Each droop governor follows a straight line from its no-load frequency down by D % of the rated frequency at rated power (Woodward application notes 01302 and 50528: droop = (no-load − full-load speed)/rated speed); on a common bus the frequency is where the summed droop lines meet the load.',
    'Sets with the same droop and the same no-load setting share load in proportion to their ratings; the operator moves a set\'s line, and so its load, with the speed setting, which does not change the bus frequency when another source holds it.',
    'One isochronous set holds its set frequency and takes the balance of the load while it stays between no load and its rating; below, it unloads (and would be motored) and the bus frequency rises; above, it stays at its limit and the bus frequency falls until the droop sets take the rest (Woodward 01302).',
    'Steady state only: governor dynamics, reactive load sharing (voltage droop), engine power limits other than the rating, and load-dependent start and stop are not modelled.',
    'The deviation from the proportional share is expressed as a percentage of the largest set\'s rating; the permitted deviation for ships is set by IEC 60092-301 (6.3.2, load sharing) and the class rules.',
  ],
  notes: [
    'Verification 2026-10-31: three sets of 1000, 1000 and 800 kW, all 4 % droop from 62.4 Hz on a 60 Hz base, carrying 1800 kW: f = 62.4 − 2.4 × 1800/2800 = 60.857 Hz, each set at 64.3 % of its rating; lowering all speed settings by 0.857 Hz restores 60 Hz.',
    'Design decision: at most one isochronous set is accepted, because two isochronous sets on one bus need a load-sharing link between their controls.',
  ],
  sources: [
    'Woodward, Application Note 01302 Speed droop and power generation (1991)',
    'Woodward, Application Note 50528 (2003) — measuring droop as (no-load − full-load speed)/rated speed',
    'IEC 60092-301:2025, Electrical installations in ships — Equipment — Generators and motors, 6.3 parallel operation (load sharing)',
  ],
  inputs: [
    { id: 'rated_frequency_hz', label: 'Rated frequency', group: 'frequency', unit: 'Hz', default: 60, min: 1, max: 500 },
    { id: 'load_kw', label: 'Total active load', group: 'power', unit: 'kW', default: 1800, min: 0, max: 1e6 },
    { id: 'sets', label: 'Generating sets (one per line: name; rated kW; droop % or iso; no-load or set frequency Hz)', type: 'textarea', rows: 6, default: DEFAULT_SETS },
  ],
  outputs: [
    { id: 'bus_frequency_hz', label: 'Bus frequency', group: 'frequency', unit: 'Hz' },
    { id: 'frequency_deviation_pct', label: 'Deviation from rated frequency', group: 'ratio', unit: 'pct' },
    { id: 'setting_change_hz', label: 'Change of all droop speed settings to restore rated frequency', group: 'frequency', unit: 'Hz' },
    { id: 'max_share_deviation_pct', label: 'Largest deviation from the proportional share (of the largest rating)', group: 'ratio', unit: 'pct' },
    { id: 'sets_table', label: 'Load on each set (load as % of its rating; deviation from the proportional share as % of the largest rating)', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      bus_frequency_hz: '60.857 Hz',
    },
  },
};

/** Lines of "name; rated kW; droop % or iso; frequency" → [{ name, rated, droop, iso, f }]. */
export function parseSets(text) {
  const sets = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const fields = clean.split(/;|\t/).map((f) => f.trim());
    const where = `Line ${index + 1}`;
    if (fields.length < 4) throw new Error(`${where}: expected name; rated kW; droop % or iso; frequency Hz`);
    const rated = Number(fields[1].replace(',', '.'));
    const iso = fields[2].toLowerCase() === 'iso';
    const droop = iso ? 0 : Number(fields[2].replace(',', '.'));
    const f = Number(fields[3].replace(',', '.'));
    if (!Number.isFinite(rated) || rated <= 0) throw new Error(`${where}: the rating must be a number greater than zero`);
    if (!iso && (!Number.isFinite(droop) || droop <= 0 || droop > 20)) throw new Error(`${where}: the droop must be between 0 and 20 %, or "iso"`);
    if (!Number.isFinite(f) || f <= 0) throw new Error(`${where}: the frequency must be a number greater than zero`);
    sets.push({ name: fields[0] || `Set ${sets.length + 1}`, rated, droop, iso, f });
  });
  if (!sets.length) throw new Error('Enter at least one generating set');
  if (sets.filter((s) => s.iso).length > 1) throw new Error('Only one isochronous set can be modelled; the others must run in droop');
  return sets;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.rated_frequency_hz, 'rated_frequency_hz', 'Rated frequency');
  assertRange(i.load_kw, 0, 1e9, 'load_kw', 'Total active load');
  const sets = parseSets(i.sets);
  const fr = i.rated_frequency_hz;
  const droops = sets.filter((s) => !s.iso);
  const iso = sets.find((s) => s.iso);
  const slope = droops.reduce((sum, s) => sum + s.rated / ((s.droop / 100) * fr), 0);
  const intercept = droops.reduce((sum, s) => sum + (s.rated * s.f) / ((s.droop / 100) * fr), 0);
  const droopLoad = (f) => intercept - slope * f;
  let f;
  let isoLoad = 0;
  if (iso) {
    isoLoad = i.load_kw - droopLoad(iso.f);
    if (isoLoad >= 0 && isoLoad <= iso.rated) f = iso.f;
    else {
      isoLoad = isoLoad < 0 ? 0 : iso.rated;
      if (!droops.length) throw new Error(`The isochronous set alone cannot carry ${i.load_kw} kW`);
      f = (intercept - (i.load_kw - isoLoad)) / slope;
    }
  } else {
    f = (intercept - i.load_kw) / slope;
  }
  const loadOf = (s) => (s.iso ? isoLoad : (s.rated * (s.f - f)) / ((s.droop / 100) * fr));
  const totalRated = sets.reduce((sum, s) => sum + s.rated, 0);
  const largest = Math.max(...sets.map((s) => s.rated));
  const rows = sets.map((s) => {
    const p = loadOf(s);
    const proportional = (i.load_kw * s.rated) / totalRated;
    const deviation = ((p - proportional) / largest) * 100;
    return [s.name, s.rated, s.iso ? `iso ${s.f} Hz` : `${s.droop} %, ${s.f} Hz`, p, (p / s.rated) * 100, proportional, Math.abs(deviation) < 1e-9 ? 0 : deviation];
  });
  const maxDeviation = Math.max(...rows.map((r) => Math.abs(r[6])));

  const warnings = [];
  rows.filter((r) => r[3] > r[1]).forEach((r) => warnings.push(`${r[0]} is overloaded at ${r[4].toFixed(0)} % of its rating.`));
  rows.filter((r) => r[3] < 0).forEach((r) => warnings.push(`${r[0]} takes negative power (${r[3].toFixed(0)} kW): it is motored and its reverse-power relay will trip it.`));
  if (i.load_kw > totalRated) warnings.push(`The load exceeds the total rating of ${totalRated} kW.`);
  if (iso && (isoLoad === 0 || isoLoad === iso.rated) && f !== iso.f) warnings.push(`The isochronous set is at ${isoLoad === 0 ? 'no load' : 'its rating'}; the bus frequency has moved to ${f.toFixed(2)} Hz.`);

  return {
    outputs: {
      bus_frequency_hz: f,
      frequency_deviation_pct: ((f - fr) / fr) * 100,
      setting_change_hz: iso && f === iso.f ? 0 : fr - f,
      max_share_deviation_pct: maxDeviation,
      sets_table: {
        columns: ['Set', 'Rated (kW)', 'Droop, no-load', 'Load (kW)', 'Load (%)', 'Proportional (kW)', 'Deviation (%)'],
        rows,
      },
      summary: `${i.load_kw} kW on ${sets.length} set${sets.length > 1 ? 's' : ''}: bus at ${f.toFixed(3)} Hz (${(((f - fr) / fr) * 100).toFixed(2)} % from ${fr} Hz); ${rows.map((r) => `${r[0]} ${r[3].toFixed(0)} kW`).join(', ')}.`,
    },
    warnings,
  };
}
