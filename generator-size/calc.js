/**
 * generator-size/calc.js — what size generator a home, RV or site needs: the running watts of the loads, the surge
 * when the largest motor starts, the minimum running and starting ratings, and the kVA of a standby set.
 *
 * W_run = Σ W_i;  surge = max(W_start,i − W_i) (one motor starting at a time) or Σ (all together);
 * W_peak = W_run + surge;  rating ≥ W_run / k_max and ≥ W_peak;  kVA = rating / 0.8 for a three-phase standby set.
 * Schema units: SI — W, VA, fraction.
 */
import { withDefaults, assertRange, assertOneOf } from '../shared/validate.js';

const DEFAULT_LOADS = [
  'Refrigerator; 700; 2200',
  'Sump pump, 1/2 hp; 1050; 2150',
  'Furnace fan, 1/2 hp; 800; 2350',
  'Lights; 600',
  'Microwave; 1000',
  'TV and internet; 300',
].join('\n');

/** Parses "name; running W; starting W" lines; the starting watts default to the running watts. */
export function parseLoads(text) {
  const loads = [];
  String(text).split(/\r?\n/).forEach((raw, k) => {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) return;
    const parts = line.split(/[;\t]/).map((p) => p.trim());
    if (parts.length < 2 || parts.length > 3) throw new Error(`Loads, line ${k + 1}: write "name; running watts; starting watts" (starting watts optional).`);
    const run = Number(parts[1].replace(/\s/g, ''));
    const start = parts[2] === undefined || parts[2] === '' ? run : Number(parts[2].replace(/\s/g, ''));
    if (!Number.isFinite(run) || run < 0) throw new Error(`Loads, line ${k + 1}: the running watts "${parts[1]}" is not a number of 0 or more.`);
    if (!Number.isFinite(start) || start < run) throw new Error(`Loads, line ${k + 1}: the starting watts must be a number at least equal to the running watts.`);
    loads.push({ name: parts[0] || `Load ${k + 1}`, run, start });
  });
  if (!loads.length) throw new Error('Loads: enter at least one load.');
  return loads;
}

export const schema = {
  id: 'generator-size',
  name: 'Generator size calculator',
  category: 'electrical',
  summary: 'What size generator you need: running watts of your loads, the surge of the largest motor starting, and the minimum running, starting and kVA ratings.',
  related: ['generator-load', 'watts-to-amps', 'kw-to-kva', 'breaker-size'],
  assumptions: [
    'Running watts are what each load draws once running; starting (surge) watts are what a motor load draws for a few seconds while it starts. Take both from the nameplate or the manual; the default list is an illustrative example only.',
    'By default the motors start one at a time, so only the largest surge adds to the running total; choose "all together" if several motors can start at the same moment, for example after a power cut.',
    'The running rating keeps the load at or below the chosen maximum loading of the generator (80 % by default), which leaves margin for loads switching on and avoids running flat out for hours.',
    'Portable and inverter generators are rated in watts at unity power factor; standby sets are rated in kVA at a power factor of 0.8 (ISO 8528-1), so their kVA is the kW divided by 0.8.',
    'Altitude and high ambient temperature reduce the output of an engine-driven generator; apply the derating in the manufacturer\'s data.',
  ],
  notes: [
    'Verification 2026-11-07: the default list runs 4 450 W; the furnace fan has the largest surge, 1 550 W, so the peak is 6 000 W and the running rating at 80 % loading is 5 563 W. Checked by hand.',
  ],
  sources: [
    'ISO 8528-1:2018 Reciprocating internal combustion engine driven alternating current generating sets (ratings, power factor 0.8)',
    'NFPA 70, National Electrical Code (2023), Article 702 (optional standby systems: the system must carry the load it is connected to)',
    'NEMA MG 1-2021, Motors and Generators, Part 10 (locked-rotor kVA code letters behind the surge of motor loads)',
  ],
  inputs: [
    { id: 'loads', label: 'Loads (one per line: name; running watts; starting watts)', type: 'textarea', rows: 8, default: DEFAULT_LOADS, help: 'Starting watts only for motors: fridges, pumps, compressors, fans, power tools.' },
    { id: 'starting', label: 'Motor starting', type: 'select', default: 'largest', options: [{ value: 'largest', label: 'One at a time (largest surge only)' }, { value: 'all', label: 'All together (every surge at once)' }] },
    { id: 'max_loading', label: 'Maximum running loading of the generator', group: 'ratio', unit: 'frac', display: 'pct', default: 0.8, min: 0.5, max: 1 },
  ],
  outputs: [
    { id: 'running_w', label: 'Running watts of all loads', group: 'power', unit: 'W' },
    { id: 'surge_w', label: 'Extra watts while starting', group: 'power', unit: 'W' },
    { id: 'peak_w', label: 'Peak (starting) watts', group: 'power', unit: 'W' },
    { id: 'rated_w', label: 'Minimum generator running rating', group: 'power', unit: 'W' },
    { id: 'rated_start_w', label: 'Minimum generator starting (surge) rating', group: 'power', unit: 'W' },
    { id: 'standby_va', label: 'Standby set rating at power factor 0.8', group: 'apparent_power', unit: 'VA', display: 'kVA' },
    { id: 'largest', label: 'Largest starting load', type: 'text' },
    { id: 'count', label: 'Loads counted', group: 'dimensionless', unit: 'none', decimals: 0 },
  ],
  example: {
    inputs: {},
    results: { running_w: '4 450 W', surge_w: '1 550 W', peak_w: '6 000 W', rated_w: '5 563 W' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.starting, ['largest', 'all'], 'starting', 'Motor starting');
  const k = assertRange(x.max_loading, 0.5, 1, 'max_loading', 'Maximum running loading');
  const loads = parseLoads(x.loads);
  const running = loads.reduce((a, l) => a + l.run, 0);
  if (running <= 0) throw new Error('Loads: the running watts add up to zero.');
  const surges = loads.map((l) => l.start - l.run);
  const surge = x.starting === 'all' ? surges.reduce((a, b) => a + b, 0) : Math.max(...surges);
  const top = loads[surges.indexOf(Math.max(...surges))];
  const peak = running + surge;
  const rated = running / k;
  const warnings = [];
  if (surge === 0) warnings.push('No starting watts entered: motors such as fridges, pumps and air conditioners draw two to three times their running watts for a few seconds when they start.');
  if (rated > 25000) warnings.push('Above about 25 kW, a permanently installed standby set with a transfer switch sized by an electrician is the usual choice.');
  return {
    outputs: {
      running_w: running,
      surge_w: surge,
      peak_w: peak,
      rated_w: rated,
      rated_start_w: Math.max(peak, rated),
      standby_va: rated / 0.8,
      largest: surge > 0 ? `${top.name}: ${top.start} W starting, ${top.run} W running` : 'No motor starts entered',
      count: loads.length,
    },
    warnings,
  };
}
