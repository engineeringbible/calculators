/**
 * inverter-size/calc.js — power inverter sizing: continuous load in W and VA (with each load's power factor), the
 * surge while a motor starts, a design margin, the next common inverter size, and the DC current the inverter draws
 * from the battery at its nominal and its low-cutoff voltage.
 *
 * W_run = Σ W_i;  S_run = Σ W_i / PF_i;  surge = max(W_start,i − W_i) or Σ;  W_peak = W_run + surge;
 * rating ≥ S_run (1 + m) and ≥ W_peak / k_surge;  I_dc = W / (V_bat η).
 * Schema units: SI — W, VA, V, A, fraction.
 */
import { withDefaults, assertRange, assertOneOf } from '../shared/validate.js';

const DEFAULT_LOADS = [
  'Refrigerator; 150; 750; 0.8',
  'Well pump, 1/2 hp; 800; 2400; 0.75',
  'Microwave; 1000',
  'Lights; 200',
  'TV and router; 150',
  'Laptop; 60',
].join('\n');

/** Common continuous ratings of inverters on the market, W (catalogue sizes, not a standard series). */
export const INVERTER_SIZES_W = [150, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000, 10000, 12000, 15000];

/** Parses "name; running W; starting W; power factor" lines; starting W defaults to running W, power factor to 1. */
export function parseLoads(text) {
  const loads = [];
  String(text).split(/\r?\n/).forEach((raw, k) => {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) return;
    const parts = line.split(/[;\t]/).map((p) => p.trim());
    if (parts.length < 2 || parts.length > 4) throw new Error(`Loads, line ${k + 1}: write "name; running watts; starting watts; power factor" (the last two are optional).`);
    const num = (s) => Number(String(s).replace(/\s/g, ''));
    const run = num(parts[1]);
    if (parts[1] === '' || !Number.isFinite(run) || run < 0) throw new Error(`Loads, line ${k + 1}: the running watts "${parts[1]}" is not a number of 0 or more.`);
    const start = parts[2] === undefined || parts[2] === '' ? run : num(parts[2]);
    if (!Number.isFinite(start) || start < run) throw new Error(`Loads, line ${k + 1}: the starting watts must be a number at least equal to the running watts.`);
    const pf = parts[3] === undefined || parts[3] === '' ? 1 : num(parts[3]);
    if (!Number.isFinite(pf) || pf < 0.1 || pf > 1) throw new Error(`Loads, line ${k + 1}: the power factor must be between 0.1 and 1.`);
    loads.push({ name: parts[0] || `Load ${k + 1}`, run, start, pf });
  });
  if (!loads.length) throw new Error('Loads: enter at least one load.');
  return loads;
}

export const schema = {
  id: 'inverter-size',
  name: 'Inverter size calculator',
  category: 'electrical',
  summary: 'What size power inverter you need: running watts and VA of your loads, motor starting surge, design margin, the next common size and the DC battery current.',
  related: ['solar-battery-bank', 'generator-size', 'battery-runtime', 'wire-size'],
  assumptions: [
    'Running watts are what each load draws once running and starting watts what a motor draws for a few seconds while it starts; take both from the nameplate or manual. The default list is an illustrative example only.',
    'Apparent power is the sum of each load\'s watts divided by its power factor; adding the VA arithmetically ignores the different phase angles and errs on the safe side. Loads without a power factor are taken as resistive (1).',
    'By default the motors start one at a time, so only the largest surge adds to the running total; choose "all together" if several can start at once. The inverter\'s surge rating is its continuous rating times the surge multiple from its data sheet, held for a few seconds.',
    'The recommended size is the next common catalogue rating above both requirements; inverter ratings are not a standard series, so check the sizes the maker offers.',
    'Battery current is the AC output power divided by the battery voltage and the inverter efficiency; it is highest at the low-voltage cutoff, which sets the cable and fuse sizes.',
  ],
  notes: [
    'Verification 2026-11-08: the default list runs 2 360 W and 2 664 VA; the pump\'s 1 600 W surge gives a 3 960 W peak; with 25 % margin 3 330 VA continuous, surge needs 1 980 W at 2×, so 3 500 W; at 24 V and 90 % the battery current is 109 A running and 209 A at the peak with the 21 V cutoff. Checked by hand.',
  ],
  sources: [
    'Sandia National Laboratories, Stand-Alone Photovoltaic Systems: A Handbook of Recommended Design Practices, SAND87-7023 (inverter sizing for continuous and surge loads)',
    'IEEE Std 1562-2007, Guide for Array and Battery Sizing in Stand-Alone Photovoltaic Systems (load determination)',
    'NEMA MG 1-2021, Motors and Generators, Part 10 (locked-rotor kVA code letters behind the starting surge of motor loads)',
  ],
  inputs: [
    { id: 'loads', label: 'Loads (one per line: name; running watts; starting watts; power factor)', type: 'textarea', rows: 8, default: DEFAULT_LOADS, help: 'Starting watts and power factor only for motors: fridges, pumps, compressors, fans, power tools.' },
    { id: 'starting', label: 'Motor starting', type: 'select', default: 'largest', options: [{ value: 'largest', label: 'One at a time (largest surge only)' }, { value: 'all', label: 'All together (every surge at once)' }] },
    { id: 'margin', label: 'Design margin on the continuous load', group: 'ratio', unit: 'frac', display: 'pct', default: 0.25, min: 0, max: 1 },
    { id: 'surge_multiple', label: 'Inverter surge rating as a multiple of its continuous rating', group: 'dimensionless', unit: 'none', default: 2, min: 1, max: 5 },
    { id: 'battery_v', label: 'Battery voltage (nominal)', group: 'voltage', unit: 'V', default: 24, min: 6, max: 1000 },
    { id: 'cutoff', label: 'Low-voltage cutoff as a share of nominal', group: 'ratio', unit: 'frac', display: 'pct', default: 0.875, min: 0.5, max: 1, help: '10.5 V on a 12 V battery is 87.5 %.' },
    { id: 'efficiency', label: 'Inverter efficiency', group: 'ratio', unit: 'frac', display: 'pct', default: 0.9, min: 0.5, max: 1 },
  ],
  outputs: [
    { id: 'running_w', label: 'Running watts of all loads', group: 'power', unit: 'W' },
    { id: 'running_va', label: 'Apparent power of all loads', group: 'apparent_power', unit: 'VA' },
    { id: 'pf', label: 'Overall power factor', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'surge_w', label: 'Extra watts while starting', group: 'power', unit: 'W' },
    { id: 'peak_w', label: 'Peak (starting) watts', group: 'power', unit: 'W' },
    { id: 'need_continuous_va', label: 'Continuous rating needed, with margin', group: 'apparent_power', unit: 'VA' },
    { id: 'need_surge_w', label: 'Continuous rating needed for the surge', group: 'power', unit: 'W' },
    { id: 'recommended_w', label: 'Recommended inverter size (next common rating)', group: 'power', unit: 'W' },
    { id: 'recommended', label: 'Recommendation', type: 'text' },
    { id: 'dc_running_a', label: 'Battery current at the running load (nominal voltage)', group: 'current', unit: 'A' },
    { id: 'dc_cutoff_a', label: 'Battery current at the running load (cutoff voltage)', group: 'current', unit: 'A' },
    { id: 'dc_peak_a', label: 'Battery current at the peak (cutoff voltage)', group: 'current', unit: 'A' },
    { id: 'dc_rated_a', label: 'Battery current at the inverter\'s full rating (cutoff voltage)', group: 'current', unit: 'A' },
  ],
  example: {
    inputs: {},
    results: { running_w: '2 360 W', running_va: '2 664 VA', peak_w: '3 960 W', need_continuous_va: '3 330 VA', recommended_w: '3 500 W', dc_running_a: '109 A', dc_peak_a: '209.5 A' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.starting, ['largest', 'all'], 'starting', 'Motor starting');
  const m = assertRange(x.margin, 0, 1, 'margin', 'Design margin');
  const k = assertRange(x.surge_multiple, 1, 5, 'surge_multiple', 'Inverter surge multiple');
  const v = assertRange(x.battery_v, 6, 1000, 'battery_v', 'Battery voltage');
  const cut = assertRange(x.cutoff, 0.5, 1, 'cutoff', 'Low-voltage cutoff');
  const eta = assertRange(x.efficiency, 0.5, 1, 'efficiency', 'Inverter efficiency');
  const loads = parseLoads(x.loads);
  const running = loads.reduce((a, l) => a + l.run, 0);
  if (running <= 0) throw new Error('Loads: the running watts add up to zero.');
  const va = loads.reduce((a, l) => a + l.run / l.pf, 0);
  const surges = loads.map((l) => l.start - l.run);
  const surge = x.starting === 'all' ? surges.reduce((a, b) => a + b, 0) : Math.max(...surges);
  const peak = running + surge;
  const needVa = va * (1 + m);
  const needSurge = peak / k;
  const need = Math.max(needVa, needSurge);
  const size = INVERTER_SIZES_W.find((s) => s >= need - 1e-9) ?? null;
  const vCut = v * cut;
  const warnings = [];
  if (surge === 0) warnings.push('No starting watts entered: motors such as fridges, pumps and compressors draw several times their running watts for a few seconds when they start.');
  if (size !== null && v <= 12 && size > 2000) warnings.push('Above about 2 kW a 12 V battery has to supply very high currents; a 24 V or 48 V system needs thinner cables and smaller fuses.');
  const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sizeText = size === null
    ? `Above ${group(INVERTER_SIZES_W.at(-1))} W: use several inverters in parallel or a three-phase system`
    : `${group(size)} W continuous, ${group(Number((size * k).toPrecision(6)))} W surge for a few seconds; ${needSurge > needVa ? 'set by the motor starting surge' : 'set by the continuous load with margin'}`;
  return {
    outputs: {
      running_w: running,
      running_va: va,
      pf: running / va,
      surge_w: surge,
      peak_w: peak,
      need_continuous_va: needVa,
      need_surge_w: needSurge,
      recommended_w: size,
      recommended: sizeText,
      dc_running_a: running / (v * eta),
      dc_cutoff_a: running / (vCut * eta),
      dc_peak_a: peak / (vCut * eta),
      dc_rated_a: size === null ? null : size / (vCut * eta),
    },
    warnings,
  };
}
