/**
 * decibels/calc.js — decibel conversions: power ratio (10 log) and voltage or current ratio (20 log) to dB and back,
 * absolute levels in dBm, dBW, dBV, dBµV and dBu with watts and volts across an impedance, and the sum of
 * incoherent (uncorrelated) levels.
 *
 * L = 10 log10(P2/P1) = 20 log10(V2/V1);  dBm = 10 log10(P / 1 mW);  dBW = 10 log10(P / 1 W);
 * dBV = 20 log10(V / 1 V);  dBµV = 20 log10(V / 1 µV);  dBu = 20 log10(V / 0.7746 V), 0.7746 V = √(0.6) V (1 mW in 600 Ω);
 * P = V² / R;  L_sum = 10 log10 Σ 10^(L_i / 10).
 * Schema units: SI — W, V, Ω; levels and ratios dimensionless.
 */
import { withDefaults, assertOneOf, assertPositive, assertFinite, assertRange } from '../shared/validate.js';

/** 0 dBu: the r.m.s. voltage of 1 mW in 600 Ω, √(0.001 × 600) V. */
export const DBU_REF_V = Math.sqrt(0.6);

/** Absolute level units: kind 'p' (power) or 'v' (voltage) and the reference in W or V. */
export const LEVELS = {
  dBm: { kind: 'p', ref: 1e-3, label: 'dBm (re 1 mW)' },
  dBW: { kind: 'p', ref: 1, label: 'dBW (re 1 W)' },
  dBV: { kind: 'v', ref: 1, label: 'dBV (re 1 V)' },
  dBuV: { kind: 'v', ref: 1e-6, label: 'dBµV (re 1 µV)' },
  dBu: { kind: 'v', ref: DBU_REF_V, label: 'dBu (re 0.7746 V)' },
  W: { kind: 'pw', label: 'Watts' },
  V: { kind: 'vv', label: 'Volts r.m.s.' },
};

const DEFAULT_LEVELS = ['85', '82', '79'].join('\n');

/** Parses one level per line (commas or semicolons also separate); # starts a comment. */
export function parseLevels(text) {
  const out = [];
  String(text).split(/\r?\n/).forEach((raw, k) => {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) return;
    for (const token of line.split(/[;,\t]+|\s+/).filter(Boolean)) {
      const v = Number(token.replace(/−/g, '-'));
      if (!Number.isFinite(v)) throw new Error(`Levels, line ${k + 1}: "${token}" is not a number of decibels.`);
      if (Math.abs(v) > 1000) throw new Error(`Levels, line ${k + 1}: ${v} dB is outside ±1 000 dB.`);
      out.push(v);
    }
  });
  if (!out.length) throw new Error('Levels: enter at least one level in dB.');
  return out;
}

/** Sum of incoherent levels in dB. */
export function sumLevels(levels) {
  const top = Math.max(...levels);
  return top + 10 * Math.log10(levels.reduce((s, l) => s + 10 ** ((l - top) / 10), 0));
}

export const schema = {
  id: 'decibels',
  name: 'Decibel calculator (dB, dBm, dBV, dBu)',
  category: 'electrical',
  summary: 'Decibels from power or voltage ratios and back, dBm, dBW, dBV, dBµV and dBu converted to watts and volts, and the sum of several decibel levels.',
  related: ['filter-cutoff', 'ohms-law', 'lc-resonance', 'voltage-divider'],
  assumptions: [
    'Power ratios use 10 log10 and voltage or current ratios 20 log10; the 20 log form gives the power ratio only when both voltages act across the same impedance.',
    'Voltages are r.m.s. values. dBm and dBW are power levels; dBV, dBµV and dBu are voltage levels, converted to power with P = V² / R across the impedance entered (50 Ω for RF, 600 Ω for traditional audio lines, 75 Ω for video and cable TV).',
    '0 dBu is 0.7746 V r.m.s., the voltage of 1 mW in 600 Ω; dBu is a voltage level and needs no 600 Ω load, so dBu equals dBm only across 600 Ω.',
    'Levels add as uncorrelated (incoherent) sources: their powers add, so two equal levels give 3 dB more. Coherent signals in phase add their voltages instead and can give up to 6 dB more.',
  ],
  notes: [
    'Verification 2026-11-08: 10 dBm is 10 mW, −20 dBW and 0.707 V in 50 Ω, which is −3.01 dBV, 117.0 dBµV and −0.79 dBu; 85, 82 and 79 dB add to 87.4 dB. Checked by hand.',
  ],
  sources: [
    'IEC 60027-3:2002 Letter symbols to be used in electrical technology, Part 3: Logarithmic and related quantities, and their units (power and root-power quantities, the decibel)',
    'ITU-R Recommendation V.574-5 (2015), Use of the decibel and the neper in telecommunications (absolute levels dBW, dBm, dB(µV))',
    'Boylestad, Introductory Circuit Analysis, 13th ed., ch. 21 (decibels: power gain 10 log, voltage gain 20 log, dBm referred to 1 mW in 600 Ω)',
  ],
  inputs: [
    { id: 'mode', label: 'Conversion', type: 'select', default: 'level', options: [
      { value: 'ratio', label: 'Ratio to decibels' },
      { value: 'db', label: 'Decibels to power and voltage ratios' },
      { value: 'level', label: 'Absolute level: dBm, dBW, dBV, dBµV, dBu, W, V' },
      { value: 'sum', label: 'Add several levels (incoherent sources)' },
    ] },
    { id: 'ratio_kind', label: 'Ratio of', type: 'select', default: 'power', options: [{ value: 'power', label: 'Power (10 log)' }, { value: 'voltage', label: 'Voltage or current (20 log)' }], visibleWhen: { mode: 'ratio' } },
    { id: 'ratio', label: 'Ratio (output / input)', group: 'dimensionless', unit: 'none', default: 2, min: 1e-30, max: 1e30, visibleWhen: { mode: 'ratio' } },
    { id: 'db_in', label: 'Decibels, dB', group: 'dimensionless', unit: 'none', default: 3, min: -1000, max: 1000, visibleWhen: { mode: 'db' } },
    { id: 'level', label: 'Level', group: 'dimensionless', unit: 'none', default: 10, min: -1000, max: 1e30, visibleWhen: { mode: 'level' } },
    { id: 'level_unit', label: 'Level unit', type: 'select', default: 'dBm', options: Object.entries(LEVELS).map(([value, u]) => ({ value, label: u.label })), visibleWhen: { mode: 'level' } },
    { id: 'impedance_ohm', label: 'Impedance (to relate power and voltage)', group: 'resistance', unit: 'ohm', default: 50, min: 1e-3, max: 1e9, visibleWhen: { mode: 'level' } },
    { id: 'levels', label: 'Levels to add, dB (one per line)', type: 'textarea', rows: 5, default: DEFAULT_LEVELS, visibleWhen: { mode: 'sum' } },
  ],
  outputs: [
    { id: 'db_out', label: 'Decibels, dB', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { mode: 'ratio' } },
    { id: 'power_ratio', label: 'Power ratio 10^(dB/10)', group: 'dimensionless', unit: 'none', visibleWhen: { mode: ['ratio', 'db'] } },
    { id: 'voltage_ratio', label: 'Voltage or current ratio 10^(dB/20)', group: 'dimensionless', unit: 'none', visibleWhen: { mode: ['ratio', 'db'] } },
    { id: 'watts', label: 'Power', group: 'power', unit: 'W', visibleWhen: { mode: 'level' } },
    { id: 'volts', label: 'Voltage r.m.s. across the impedance', group: 'voltage', unit: 'V', visibleWhen: { mode: 'level' } },
    { id: 'dbm', label: 'dBm', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { mode: 'level' } },
    { id: 'dbw', label: 'dBW', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { mode: 'level' } },
    { id: 'dbv', label: 'dBV', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { mode: 'level' } },
    { id: 'dbuv', label: 'dBµV', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { mode: 'level' } },
    { id: 'dbu', label: 'dBu', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { mode: 'level' } },
    { id: 'sum_db', label: 'Total level, dB', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { mode: 'sum' } },
    { id: 'sum_rise_db', label: 'Rise above the highest level, dB', group: 'dimensionless', unit: 'none', decimals: 2, visibleWhen: { mode: 'sum' } },
    { id: 'count', label: 'Levels added', group: 'dimensionless', unit: 'none', decimals: 0, visibleWhen: { mode: 'sum' } },
  ],
  example: {
    inputs: { mode: 'level', level: 10, level_unit: 'dBm', impedance_ohm: [50, 'ohm'] },
    results: { watts: '0.0100 W', volts: '0.707 V', dbw: '−20.00', dbv: '−3.01', dbuv: '117.0', dbu: '−0.79' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['ratio', 'db', 'level', 'sum'], 'mode', 'Conversion');
  const out = { db_out: null, power_ratio: null, voltage_ratio: null, watts: null, volts: null, dbm: null, dbw: null, dbv: null, dbuv: null, dbu: null, sum_db: null, sum_rise_db: null, count: null };
  const warnings = [];
  if (x.mode === 'ratio' || x.mode === 'db') {
    let db;
    if (x.mode === 'ratio') {
      assertOneOf(x.ratio_kind, ['power', 'voltage'], 'ratio_kind', 'Ratio of');
      const r = assertRange(assertPositive(x.ratio, 'ratio', 'Ratio'), 1e-30, 1e30, 'ratio', 'Ratio');
      db = (x.ratio_kind === 'power' ? 10 : 20) * Math.log10(r);
      out.db_out = db;
    } else {
      db = assertRange(x.db_in, -1000, 1000, 'db_in', 'Decibels');
    }
    out.power_ratio = 10 ** (db / 10);
    out.voltage_ratio = 10 ** (db / 20);
  } else if (x.mode === 'level') {
    assertOneOf(x.level_unit, Object.keys(LEVELS), 'level_unit', 'Level unit');
    const z = assertRange(assertPositive(x.impedance_ohm, 'impedance_ohm', 'Impedance'), 1e-3, 1e9, 'impedance_ohm', 'Impedance');
    const u = LEVELS[x.level_unit];
    const value = assertFinite(x.level, 'level', 'Level');
    let p;
    let v;
    if (u.kind === 'pw' || u.kind === 'vv') {
      const name = `Level in ${u.kind === 'pw' ? 'watts' : 'volts'}`;
      assertRange(assertPositive(value, 'level', name), 1e-30, 1e30, 'level', name);
      if (u.kind === 'pw') p = value;
      else v = value;
    } else {
      assertRange(value, -1000, 1000, 'level', 'Level in decibels');
      if (u.kind === 'p') p = u.ref * 10 ** (value / 10);
      else v = u.ref * 10 ** (value / 20);
    }
    if (p === undefined) p = (v * v) / z;
    if (v === undefined) v = Math.sqrt(p * z);
    Object.assign(out, {
      watts: p,
      volts: v,
      dbm: 10 * Math.log10(p / 1e-3),
      dbw: 10 * Math.log10(p),
      dbv: 20 * Math.log10(v),
      dbuv: 20 * Math.log10(v / 1e-6),
      dbu: 20 * Math.log10(v / DBU_REF_V),
    });
  } else {
    const levels = parseLevels(x.levels);
    out.sum_db = sumLevels(levels);
    out.sum_rise_db = out.sum_db - Math.max(...levels);
    out.count = levels.length;
    if (levels.length === 1) warnings.push('Only one level entered: the total is that level.');
  }
  return { outputs: out, warnings };
}
