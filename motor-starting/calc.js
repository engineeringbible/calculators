/**
 * motor-starting/calc.js — induction motor starting: rated current, starting current and kVA by starting method
 * (direct-on-line, star-delta, autotransformer, soft starter, variable-speed drive), the voltage dip on a generator or a
 * network, the starting torque at the reduced voltage and the checks against a voltage-dip limit and the load torque.
 *
 * I_n = P/(√3 V η cos φ);  S_start = √3 V I_start;  generator: dip = X s/(1 + X s), s = S_start/S_gen;  network: dip = S_start/(S_sc + S_start)
 * T_start/T_n = LRT × torque factor × (1 − dip)²
 * Schema units: kW, V, kVA, MVA, %.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf } from '../shared/validate.js';

export const METHODS = {
  dol: { label: 'Direct-on-line (full locked-rotor current)' },
  star_delta: { label: 'Star-delta (1/3 of DOL current and torque)' },
  autotransformer: { label: 'Autotransformer (current and torque × tap²)' },
  soft_starter: { label: 'Soft starter (current limit)' },
  vfd: { label: 'Variable-speed drive (current about rated)' },
};

export const DIP_LIMITS = [
  'ISO 8528-5 performance class G1: −25 %, G2: −20 %, G3: −15 % maximum transient voltage dip on load increase',
  'IACS UR E5: transient voltage variation of a.c. distribution ±20 % with recovery within 1.5 s',
];

export const schema = {
  id: 'motor-starting',
  name: 'Motor starting current and voltage dip',
  category: 'electrical',
  summary: 'Starting current and kVA by method (DOL, star-delta, autotransformer, soft starter, VFD), voltage dip on a generator or network, torque at reduced voltage.',
  related: ['three-phase-power', 'generator-load', 'transformer-sizing', 'cable-sizing', 'short-circuit-current'],
  sendTo: [
    {
      target: 'cable-sizing',
      label: 'Motor cable size and voltage drop',
      note: 'Sized on the rated current; the starting current is several times larger for a few seconds, so check the dip at start separately.',
      links: [
        { to: 'system', value: 'ac3' },
        { to: 'voltage_v', from: 'input:voltage_v' },
        { to: 'current_a', from: 'rated_current_a' },
        { to: 'power_factor', from: 'input:power_factor' },
      ],
    },
  ],
  assumptions: [
    'Rated current I_n = P/(√3 V η cos φ) from the rated shaft power, voltage, efficiency and power factor; the locked-rotor (direct-on-line) starting current is the multiple of I_n from the motor data sheet (5–8 for standard IEC motors, IEC 60034-12 design N), and the starting methods reduce it: star-delta to 1/3, an autotransformer with tap a to a², a soft starter to its current limit, a variable-speed drive to about its overload current (1.0–1.5 I_n).',
    'Voltage dip by the voltage-divider estimate: the starting motor is a constant impedance equal to the locked-rotor kVA, the source an EMF behind a reactance — for a generator dip = X s/(1 + X s) with s = S_start/S_gen and X its transient reactance X\'d (conservative; the subtransient X\'\'d gives the initial dip, the AVR then recovers), for a network dip = S_start/(S_sc + S_start); magnitudes are added, ignoring the locked-rotor power factor (0.2–0.4) and the pre-existing load, which makes the estimate conservative by a few per cent; time-domain AVR and governor response is not modelled.',
    'Starting torque scales with the square of the motor terminal voltage: T_start/T_n = (locked-rotor torque multiple) × (method torque factor: DOL 1, star-delta 1/3, autotransformer a², soft starter (I_limit/I_LR)²) × (1 − dip)²; for a drive the available starting torque is about its current multiple (field-oriented control). The motor accelerates only if this exceeds the load\'s breakaway and acceleration torque with margin (here 10 % above the load torque entered: 10–30 % for centrifugal pumps and fans, 100 % or more for loaded compressors and conveyors).',
    'Dip limits are user inputs; references: ISO 8528-5 maximum transient voltage dip on load increase −25 / −20 / −15 % for performance classes G1 / G2 / G3 (for the standard load steps), and IACS UR E5 for ship a.c. systems: ±20 % transient with recovery within 1.5 s; contactors drop out and electronics trip below about 70–80 % voltage.',
  ],
  notes: [
    'Verification 2026-10-31: 200 kW, 440 V, η 0.94, cos φ 0.85 → I_n 328.5 A; DOL at 7 × I_n = 2 299 A, 1 752 kVA on a 1 500 kVA generator with X\'d 0.25 → s 1.168, dip 22.6 % (exceeds 15 %); star-delta 584 kVA → dip 8.9 % with 0.55 × rated torque available, enough for a centrifugal pump (0.3); the divider formula is the one in Cummins\' motor starting white paper (dip = S_start/(S_gen/X + S_start)).',
    'Design decision: the transient reactance X\'d is the default because it gives the larger (conservative) dip; the subtransient value can be entered for the initial dip.',
  ],
  sources: [
    'Cummins Power Generation, white paper "Generator set motor starting" / T-030 Application Manual — voltage dip from alternator reactance and motor starting kVA',
    'ISO 8528-5:2022 Reciprocating internal combustion engine driven alternating current generating sets — Part 5: Generating sets (performance classes G1–G3, transient voltage deviation)',
    'IACS Unified Requirement E5 Voltage and frequency variations (a.c. distribution: ±20 % transient, 1.5 s)',
    'IEC 60034-12 Rotating electrical machines — starting performance of single-speed three-phase cage induction motors (locked-rotor current and torque, design N/H)',
  ],
  inputs: [
    { id: 'motor_power_kw', label: 'Motor rated shaft power', group: 'power', unit: 'kW', default: 200, min: 0.1, max: 50000 },
    { id: 'voltage_v', label: 'Line voltage', group: 'voltage', unit: 'V', default: 440, min: 100, max: 15000 },
    { id: 'efficiency', label: 'Motor efficiency η at rated load', group: 'ratio', unit: 'frac', display: 'pct', default: 0.94, min: 0.5, max: 0.995 },
    { id: 'power_factor', label: 'Motor power factor cos φ at rated load', group: 'dimensionless', unit: 'none', default: 0.85, min: 0.3, max: 1 },
    { id: 'lrc_multiple', label: 'Locked-rotor current / rated current (DOL)', group: 'dimensionless', unit: 'none', default: 7, min: 2, max: 12 },
    { id: 'lrt_multiple', label: 'Locked-rotor torque / rated torque', group: 'dimensionless', unit: 'none', default: 2.0, min: 0.3, max: 4 },
    { id: 'method', label: 'Starting method', type: 'select', default: 'dol', options: Object.entries(METHODS).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'tap', label: 'Autotransformer tap a', group: 'ratio', unit: 'frac', display: 'pct', default: 0.65, min: 0.3, max: 0.95, visibleWhen: { method: 'autotransformer' } },
    { id: 'soft_limit', label: 'Soft-starter current limit (× I_n)', group: 'dimensionless', unit: 'none', default: 3.5, min: 1, max: 8, visibleWhen: { method: 'soft_starter' } },
    { id: 'vfd_multiple', label: 'Drive current at start (× I_n)', group: 'dimensionless', unit: 'none', default: 1.2, min: 0.5, max: 2, visibleWhen: { method: 'vfd' } },
    { id: 'source', label: 'Supply', type: 'select', default: 'generator', options: [{ value: 'generator', label: 'Generator (island, e.g. ship or site supply)' }, { value: 'network', label: 'Network or transformer (short-circuit power)' }] },
    { id: 'generator_kva', label: 'Generator(s) on line, rated', group: 'apparent_power', unit: 'kVA', default: 1500, min: 1, max: 1e6, visibleWhen: { source: 'generator' } },
    { id: 'reactance_pu', label: 'Generator reactance X\'d (transient) or X\'\'d (subtransient), per unit', group: 'dimensionless', unit: 'none', default: 0.25, min: 0.02, max: 0.6, visibleWhen: { source: 'generator' } },
    { id: 'short_circuit_mva', label: 'Short-circuit power at the motor busbar', group: 'apparent_power', unit: 'MVA', default: 20, min: 0.01, max: 100000, visibleWhen: { source: 'network' } },
    { id: 'dip_limit_pct', label: 'Allowed voltage dip', group: 'ratio', unit: 'pct', default: 15, min: 1, max: 50, help: 'ISO 8528-5 G3 15 %, G2 20 %; IACS UR E5 ±20 % transient (1.5 s).' },
    { id: 'load_torque_pct', label: 'Load breakaway / acceleration torque (% of motor rated torque)', group: 'ratio', unit: 'pct', default: 30, min: 0, max: 300 },
  ],
  outputs: [
    { id: 'rated_current_a', label: 'Rated current I_n', group: 'current', unit: 'A' },
    { id: 'input_kva', label: 'Rated input apparent power', group: 'apparent_power', unit: 'kVA' },
    { id: 'start_multiple', label: 'Starting line current (× I_n)', group: 'dimensionless', unit: 'none' },
    { id: 'start_current_a', label: 'Starting line current', group: 'current', unit: 'A' },
    { id: 'start_kva', label: 'Starting apparent power', group: 'apparent_power', unit: 'kVA' },
    { id: 'start_to_source_ratio', label: 'Starting kVA / generator kVA (or / S_sc)', group: 'dimensionless', unit: 'none' },
    { id: 'voltage_dip_pct', label: 'Voltage dip during start', group: 'ratio', unit: 'pct' },
    { id: 'retained_voltage_pct', label: 'Voltage during start', group: 'ratio', unit: 'pct' },
    { id: 'dip_check', label: 'Voltage dip check', type: 'text' },
    { id: 'start_torque_pu', label: 'Starting torque at the reduced voltage (× rated torque)', group: 'dimensionless', unit: 'none' },
    { id: 'torque_check', label: 'Starting torque check', type: 'text' },
    { id: 'dol_dip_pct', label: 'For comparison: dip with direct-on-line start', group: 'ratio', unit: 'pct' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      rated_current_a: '328 A',
      start_current_a: '2 299 A',
      start_kva: '1 752 kVA',
      start_to_source_ratio: '1.168',
      voltage_dip_pct: '22.6 %',
      dol_dip_pct: '22.6 %',
    },
  },
};

/** Voltage dip fraction for a start of S_start on a source. */
export function voltageDip(source, startVa, { generatorVa, reactancePu, shortCircuitVa }) {
  if (source === 'generator') {
    const xs = reactancePu * (startVa / generatorVa);
    return xs / (1 + xs);
  }
  return startVa / (shortCircuitVa + startVa);
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.motor_power_kw, 'motor_power_kw', 'Motor power');
  assertPositive(i.voltage_v, 'voltage_v', 'Voltage');
  assertRange(i.efficiency, 0.3, 1, 'efficiency', 'Efficiency');
  assertRange(i.power_factor, 0.1, 1, 'power_factor', 'Power factor');
  assertRange(i.lrc_multiple, 1, 15, 'lrc_multiple', 'Locked-rotor current multiple');
  assertRange(i.lrt_multiple, 0.1, 5, 'lrt_multiple', 'Locked-rotor torque multiple');
  assertOneOf(i.method, Object.keys(METHODS), 'method', 'Starting method');
  assertOneOf(i.source, ['generator', 'network'], 'source', 'Supply');
  assertRange(i.dip_limit_pct, 0.1, 100, 'dip_limit_pct', 'Dip limit');
  assertRange(i.load_torque_pct, 0, 500, 'load_torque_pct', 'Load torque');

  const sqrt3V = Math.sqrt(3) * i.voltage_v;
  const inputVa = (i.motor_power_kw * 1000) / (i.efficiency * i.power_factor);
  const In = inputVa / sqrt3V;
  let multiple;
  let torqueFactor;
  if (i.method === 'dol') { multiple = i.lrc_multiple; torqueFactor = 1; }
  else if (i.method === 'star_delta') { multiple = i.lrc_multiple / 3; torqueFactor = 1 / 3; }
  else if (i.method === 'autotransformer') { const a = assertRange(i.tap, 0.1, 1, 'tap', 'Tap'); multiple = i.lrc_multiple * a * a; torqueFactor = a * a; }
  else if (i.method === 'soft_starter') {
    const lim = assertRange(i.soft_limit, 0.5, 10, 'soft_limit', 'Current limit');
    multiple = Math.min(lim, i.lrc_multiple);
    torqueFactor = (multiple / i.lrc_multiple) ** 2;
  } else { multiple = assertRange(i.vfd_multiple, 0.2, 3, 'vfd_multiple', 'Drive current'); torqueFactor = null; }

  const startVa = sqrt3V * In * multiple;
  const sourceArgs = {};
  let ratio;
  if (i.source === 'generator') {
    sourceArgs.generatorVa = assertPositive(i.generator_kva, 'generator_kva', 'Generator rating') * 1000;
    sourceArgs.reactancePu = assertRange(i.reactance_pu, 0.01, 1, 'reactance_pu', 'Reactance');
    ratio = startVa / sourceArgs.generatorVa;
  } else {
    sourceArgs.shortCircuitVa = assertPositive(i.short_circuit_mva, 'short_circuit_mva', 'Short-circuit power') * 1e6;
    ratio = startVa / sourceArgs.shortCircuitVa;
  }
  const dip = voltageDip(i.source, startVa, sourceArgs);
  const dolDip = voltageDip(i.source, sqrt3V * In * i.lrc_multiple, sourceArgs);
  const torque = torqueFactor === null ? multiple : i.lrt_multiple * torqueFactor * (1 - dip) ** 2;
  const needed = (i.load_torque_pct / 100) * 1.1;
  const dipOk = dip * 100 <= i.dip_limit_pct + 1e-9;

  const warnings = [];
  if (!dipOk) warnings.push(`Voltage dip ${(dip * 100).toFixed(1)} % exceeds the ${i.dip_limit_pct} % limit: use a reduced-voltage start (star-delta, autotransformer, soft starter, drive) or add generating capacity.`);
  if (torque < needed) warnings.push(`Starting torque ${torque.toFixed(2)} × rated is below the load torque plus 10 % margin (${needed.toFixed(2)}): the motor may stall or take too long to accelerate.`);
  if (i.source === 'generator' && ratio > 1) warnings.push('Starting kVA exceeds the generator rating: the generator may also be limited by its excitation and the engine by the step load — check with the generator maker\'s motor-starting curve.');
  if ((1 - dip) < 0.8) warnings.push('Voltage below 80 % during start: contactors may drop out and other drives trip.');
  if (i.method === 'star_delta') warnings.push('Star-delta changeover causes a transient current peak; the motor must reach about 80 % speed in star, which needs a light load at start.');
  warnings.push('Divider estimate with magnitudes (conservative); AVR and governor response, pre-existing load and the locked-rotor power factor are not modelled — confirm with the generator maker\'s motor-starting data.');

  return {
    outputs: {
      rated_current_a: In,
      input_kva: inputVa / 1000,
      start_multiple: multiple,
      start_current_a: In * multiple,
      start_kva: startVa / 1000,
      start_to_source_ratio: ratio,
      voltage_dip_pct: dip * 100,
      retained_voltage_pct: (1 - dip) * 100,
      dip_check: dipOk ? `OK — dip ${(dip * 100).toFixed(1)} % ≤ ${i.dip_limit_pct} %` : `EXCEEDED — dip ${(dip * 100).toFixed(1)} % > ${i.dip_limit_pct} %`,
      start_torque_pu: torque,
      torque_check: torque >= needed ? `OK — ${torque.toFixed(2)} × rated torque ≥ ${needed.toFixed(2)} (load + 10 %)` : `INSUFFICIENT — ${torque.toFixed(2)} × rated torque < ${needed.toFixed(2)} (load + 10 %)`,
      dol_dip_pct: dolDip * 100,
    },
    warnings,
  };
}
