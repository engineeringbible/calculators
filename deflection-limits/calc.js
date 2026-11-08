/**
 * deflection-limits/calc.js — allowable deflection of beams, joists, roof members, walls and cantilevers as span/n by
 * IBC Table 1604.3, the UK National Annex to EN 1993-1-1, EN 1992-1-1 7.4.1 and EN 1995-1-1 Table 7.2, compared
 * with the actual deflections.
 *
 * Allowable Δ = l / n, with l = span (IBC: twice the length for cantilevers, footnote i). Utilisation = Δ_actual / Δ_allow.
 * Schema units: m.
 */
import { withDefaults, assertOneOf, assertPositive, assertNonNegative } from '../shared/validate.js';

const V = 'var'; const T = 'total';
/** Limits: [case, divisor (or [lenient, strict]), which actual deflection it applies to]. */
export const LIMITS = {
  ibc: {
    roof_plaster: { label: 'Roof member supporting a plaster or stucco ceiling', rows: [['Live load L', 360, V], ['Snow or wind S or W', 360, V], ['Dead + live D + L', 240, T]] },
    roof_nonplaster: { label: 'Roof member supporting a non-plaster ceiling', rows: [['Live load L', 240, V], ['Snow or wind S or W', 240, V], ['Dead + live D + L', 180, T]] },
    roof_none: { label: 'Roof member not supporting a ceiling', rows: [['Live load L', 180, V], ['Snow or wind S or W', 180, V], ['Dead + live D + L', 120, T]] },
    floor: { label: 'Floor member', rows: [['Live load L', 360, V], ['Dead + live D + L', 240, T]] },
    wall_plaster: { label: 'Exterior wall with plaster or stucco finish', rows: [['Wind W', 360, V]] },
    wall_brittle: { label: 'Exterior wall with other brittle finish', rows: [['Wind W', 240, V]] },
    wall_flexible: { label: 'Exterior wall with flexible finish', rows: [['Wind W', 120, V]] },
    part_plaster: { label: 'Interior partition with plaster or stucco finish (5 psf lateral load)', rows: [['Lateral load L', 360, V]] },
    part_brittle: { label: 'Interior partition with other brittle finish', rows: [['Lateral load L', 240, V]] },
    part_flexible: { label: 'Interior partition with flexible finish', rows: [['Lateral load L', 120, V]] },
    farm: { label: 'Farm building member', rows: [['Dead + live D + L', 180, T]] },
    greenhouse: { label: 'Greenhouse member', rows: [['Dead + live D + L', 120, T]] },
  },
  uk1993: {
    beam_brittle: { label: 'Beam carrying plaster or other brittle finish', rows: [['Variable actions (vertical)', 360, V]], cant: [['Cantilever, variable actions', 180, V]] },
    beam_other: { label: 'Other beam (except purlins and sheeting rails)', rows: [['Variable actions (vertical)', 200, V]], cant: [['Cantilever, variable actions', 180, V]] },
    column_top: { label: 'Top of column, single-storey building (not portal frame); span = height', rows: [['Horizontal, variable actions', 300, V]] },
    storey: { label: 'Each storey of a multi-storey building; span = storey height', rows: [['Horizontal drift, variable actions', 300, V]] },
  },
  en1992: {
    any: { label: 'Reinforced or prestressed concrete beam, slab or cantilever', rows: [['Appearance: sag under quasi-permanent loads', 250, T], ['Damage to partitions and finishes: deflection after construction', 500, V]] },
  },
  en1995: {
    beam: { label: 'Timber beam on two supports', rows: [['w_inst (instantaneous)', [300, 500], V], ['w_net,fin (net final)', [250, 350], T], ['w_fin (final)', [150, 300], T]], cant: [['Cantilever w_inst', [150, 250], V], ['Cantilever w_net,fin', [125, 175], T], ['Cantilever w_fin', [75, 150], T]] },
  },
};

const memberInput = (code, def, visible) => ({
  id: `member_${code}`, label: 'Member', type: 'select', default: def, visibleWhen: { code: visible },
  options: Object.entries(LIMITS[code]).map(([value, m]) => ({ value, label: m.label })),
});

export const schema = {
  id: 'deflection-limits',
  name: 'Deflection limits calculator (L/360, L/240)',
  category: 'structural',
  summary: 'Allowable deflection of floors, roofs, walls and cantilevers (L/360, L/240, L/180) by IBC Table 1604.3 and Eurocode, checked against your deflection.',
  related: ['beam-deflection', 'joist-span', 'load-combinations', 'snow-load'],
  assumptions: [
    'IBC Table 1604.3 limits apply to the deflection under each load named in its columns; the D + L column may use 0.5 D for dry wood (footnote d) and zero dead load for steel members (footnote g), and wind may be taken as 0.42 times the component and cladding loads (footnote f).',
    'For cantilevers the IBC uses l = twice the cantilever length (footnote i); the UK National Annex to EN 1993-1-1 gives length/180 directly, and EN 1995-1-1 has its own cantilever row.',
    'The UK National Annex limits for steel apply to characteristic variable actions only, without the permanent load. EN 1992-1-1 7.4.1 gives span/250 for the sag under quasi-permanent loads and span/500 for deflection after construction.',
    'EN 1995-1-1 Table 7.2 gives ranges; the national annex fixes the value. Choose the lenient or the strict end of each range.',
    'These are code serviceability limits. Vibration of floors, ponding of flat roofs and limits for glass or crane runways need separate checks.',
  ],
  notes: [
    'Verification 2026-11-08: a 14 ft floor joist (IBC) may deflect 168/360 = 0.47 in under live load and 168/240 = 0.70 in under dead plus live; actual 0.35 in and 0.55 in use 75 % and 79 %. A 6 ft cantilever is checked over 12 ft. Checked by hand.',
  ],
  sources: [
    'International Building Code 2021, Table 1604.3 Deflection Limits and footnotes a to i (same values in IBC 2018)',
    'NA+A1:2014 to BS EN 1993-1-1:2005+A1:2014, clause NA.2.23 (vertical and horizontal deflection limits for buildings)',
    'EN 1992-1-1:2004, 7.4.1(4) and (5) (span/250 and span/500)',
    'EN 1995-1-1:2004+A1:2008, 7.2 and Table 7.2 (limiting values for deflections of beams)',
  ],
  inputs: [
    { id: 'code', label: 'Code', type: 'select', default: 'ibc', options: [{ value: 'ibc', label: 'IBC Table 1604.3 (US)' }, { value: 'uk1993', label: 'Steel: UK National Annex to EN 1993-1-1' }, { value: 'en1992', label: 'Concrete: EN 1992-1-1 7.4.1' }, { value: 'en1995', label: 'Timber: EN 1995-1-1 Table 7.2' }] },
    memberInput('ibc', 'floor', 'ibc'),
    memberInput('uk1993', 'beam_brittle', 'uk1993'),
    memberInput('en1995', 'beam', 'en1995'),
    { id: 'range_end', label: 'End of the EN 1995 range', type: 'select', default: 'lenient', options: [{ value: 'lenient', label: 'Lenient (l/300, l/250, l/150)' }, { value: 'strict', label: 'Strict (l/500, l/350, l/300)' }], visibleWhen: { code: 'en1995' } },
    { id: 'cantilever', label: 'Cantilever?', type: 'select', default: 'no', options: [{ value: 'no', label: 'No: span between supports' }, { value: 'yes', label: 'Yes: enter the cantilever length' }], visibleWhen: { code: ['ibc', 'uk1993', 'en1995'] } },
    { id: 'span_m', label: 'Span (or cantilever length, or height)', group: 'length', unit: 'm', display: 'ft', default: 14 * 0.3048, min: 0.1, max: 200 },
    { id: 'delta_var_m', label: 'Actual deflection under live, snow or wind load (0 = not checked)', group: 'length', unit: 'm', display: 'in', default: 0.35 * 0.0254, min: 0, max: 10, help: 'For EN 1992 enter the deflection after the finishes are built; for EN 1995 the instantaneous w_inst.' },
    { id: 'delta_total_m', label: 'Actual total or long-term deflection (0 = not checked)', group: 'length', unit: 'm', display: 'in', default: 0.55 * 0.0254, min: 0, max: 10 },
  ],
  outputs: [
    { id: 'length_m', label: 'Length l used in the limits', group: 'length', unit: 'm', display: 'ft', decimals: 2 },
    { id: 'allow_var_m', label: 'Allowable deflection, live or variable load (first limit)', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'allow_total_m', label: 'Allowable deflection, total or long-term', group: 'length', unit: 'm', display: 'in', decimals: 2 },
    { id: 'ratio_var', label: 'Actual live or variable deflection as span/n (n)', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'utilisation', label: 'Highest utilisation (actual / allowable)', group: 'ratio', unit: 'frac', display: 'pct', decimals: 1 },
    { id: 'verdict', label: 'Result', type: 'text' },
    { id: 'table', label: 'Every limit for the member', type: 'table' },
  ],
  example: {
    inputs: { code: 'ibc', member_ibc: 'floor', cantilever: 'no', span_m: [14, 'ft'], delta_var_m: [0.35, 'in'], delta_total_m: [0.55, 'in'] },
    results: { allow_var_m: '0.47 in', allow_total_m: '0.70 in', utilisation: '78.6 %', ratio_var: '480' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.code, Object.keys(LIMITS), 'code', 'Code');
  const memberId = x.code === 'en1992' ? 'any' : x[`member_${x.code}`];
  assertOneOf(memberId, Object.keys(LIMITS[x.code]), `member_${x.code}`, 'Member');
  assertOneOf(x.cantilever, ['no', 'yes'], 'cantilever', 'Cantilever?');
  assertOneOf(x.range_end, ['lenient', 'strict'], 'range_end', 'End of the EN 1995 range');
  const span = assertPositive(x.span_m, 'span_m', 'Span');
  const dVar = assertNonNegative(x.delta_var_m, 'delta_var_m', 'Actual deflection under live load');
  const dTot = assertNonNegative(x.delta_total_m, 'delta_total_m', 'Actual total deflection');
  const member = LIMITS[x.code][memberId];
  const warnings = [];
  const cant = x.cantilever === 'yes' && x.code !== 'en1992';
  let rows = member.rows;
  let l = span;
  if (cant) {
    if (x.code === 'ibc') {
      if (!/^(roof|floor)/.test(memberId)) throw new Error('Cantilever?: the cantilever rule applies to roof and floor members; choose No for walls and partitions.');
      l = 2 * span;
    } else if (member.cant) rows = member.cant;
    else throw new Error('Cantilever?: this member has no cantilever limit; choose No.');
  }
  if (x.cantilever === 'yes' && x.code === 'en1992') warnings.push('EN 1992-1-1 gives no separate cantilever rule; the span/250 and span/500 limits are applied to the cantilever length as entered.');
  const fmtLen = (m) => `${(m * 1000).toFixed(1)} mm (${(m / 0.0254).toFixed(2)} in)`;
  let util = null;
  let failed = false;
  let allowVar = null; let allowTot = null;
  const table = rows.map(([name, div, which]) => {
    const n = Array.isArray(div) ? div[x.range_end === 'strict' ? 1 : 0] : div;
    const allow = l / n;
    if (which === V && allowVar === null) allowVar = allow;
    if (which === T && allowTot === null) allowTot = allow;
    const actual = which === V ? dVar : dTot;
    let result = 'Not checked';
    let ratioText = '—';
    if (actual > 0) {
      const u = actual / allow;
      util = Math.max(util ?? 0, u);
      if (u > 1 + 1e-12) failed = true;
      ratioText = `${(u * 100).toFixed(1)} %`;
      result = u <= 1 + 1e-12 ? 'OK' : 'Exceeds the limit';
    }
    const limitText = Array.isArray(div) ? `l/${n} (range l/${div[0]} to l/${div[1]})` : `l/${n}`;
    return [name, limitText, fmtLen(allow), actual > 0 ? fmtLen(actual) : '—', ratioText, result];
  });
  if (x.code === 'uk1993' && /column_top|storey/.test(memberId)) warnings.push('Horizontal limits: enter the column or storey height as the span and the sway as the deflection.');
  return {
    outputs: {
      length_m: l,
      allow_var_m: allowVar,
      allow_total_m: allowTot,
      ratio_var: dVar > 0 ? l / dVar : null,
      utilisation: util,
      verdict: util === null ? 'Enter an actual deflection to check it.' : failed ? `Fails: the worst deflection is ${(util * 100).toFixed(0)} % of its limit.` : `Passes: the worst deflection is ${(util * 100).toFixed(0)} % of its limit.`,
      table: { columns: ['Case', 'Limit', 'Allowable deflection', 'Actual', 'Utilisation', 'Result'], rows: table },
    },
    warnings,
  };
}
