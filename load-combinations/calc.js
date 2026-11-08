/**
 * load-combinations/calc.js — factored load combinations for strength design: ASCE 7-16 LRFD (2.3.1, with the seismic
 * combinations of 2.3.6) and ASD (2.4.1), and EN 1990 expressions 6.10 or 6.10a/b with ψ0 from Table A1.1 and the
 * seismic combination 6.12b. Lists every combination and the governing maximum and minimum.
 *
 * ASCE 7-16 LRFD: 1.4D; 1.2D + 1.6L + 0.5(Lr|S|R); 1.2D + 1.6(Lr|S|R) + (L|0.5W); 1.2D + 1.0W + L + 0.5(Lr|S|R);
 *   1.2D + 1.0E + L + 0.2S; 0.9D + 1.0W; 0.9D + 1.0E.  ASD: D; D + L; D + (Lr|S|R); D + 0.75L + 0.75(Lr|S|R);
 *   D + (0.6W|0.7E); D + 0.75L + 0.75(0.6W) + 0.75(Lr|S|R); D + 0.75L + 0.75(0.7E) + 0.75S; 0.6D + 0.6W; 0.6D + 0.7E.
 * EN 1990 (STR): 6.10 Σγ_G G + 1.5 Q1 + Σ 1.5 ψ0,i Qi;  6.10a Σγ_G G + Σ 1.5 ψ0,i Qi;  6.10b ξ γ_G G + 1.5 Q1 + Σ 1.5 ψ0,i Qi;
 *   γ_G = 1.35 unfavourable, 1.00 favourable, ξ = 0.85; variable actions only where unfavourable.  6.12b: G + A_Ed + Σ ψ2,i Qi.
 * Loads are load effects of one kind in any consistent unit (dimensionless here); W and E act in both directions.
 */
import { withDefaults, assertOneOf, assertFinite } from '../shared/validate.js';

/** EN 1990 Table A1.1 (recommended values): ψ0, ψ1, ψ2. */
export const PSI = {
  A: { label: 'Category A: domestic, residential', psi: [0.7, 0.5, 0.3] },
  B: { label: 'Category B: offices', psi: [0.7, 0.5, 0.3] },
  C: { label: 'Category C: congregation areas', psi: [0.7, 0.7, 0.6] },
  D: { label: 'Category D: shopping areas', psi: [0.7, 0.7, 0.6] },
  E: { label: 'Category E: storage areas', psi: [1.0, 0.9, 0.8] },
  F: { label: 'Category F: traffic, vehicles ≤ 30 kN', psi: [0.7, 0.7, 0.6] },
  G: { label: 'Category G: traffic, 30 to 160 kN', psi: [0.7, 0.5, 0.3] },
};
export const SNOW_PSI = {
  low: { label: 'Snow, other CEN countries, altitude ≤ 1 000 m', psi: [0.5, 0.2, 0] },
  high: { label: 'Snow, other CEN countries, altitude > 1 000 m', psi: [0.7, 0.5, 0.2] },
  nordic: { label: 'Snow, Finland, Iceland, Norway, Sweden', psi: [0.7, 0.5, 0.2] },
};
const WIND_PSI = [0.6, 0.2, 0];
const ROOF_PSI = [0, 0, 0]; // category H, roofs

const n2 = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
};

/** ASCE 7-16 combinations as [name, [[factor, load], …]] with every alternative expanded; W and E both signs. */
export function asceCombos(method, loads, fL) {
  const alts = (keys) => {
    const nz = keys.filter((k) => loads[k] !== 0);
    return nz.length ? nz : [keys[0]];
  };
  const signs = (k) => (loads[k] === 0 ? [1] : [1, -1]);
  const out = [];
  const add = (name, terms) => out.push([name, terms]);
  if (method === 'lrfd') {
    add('1', [[1.4, 'D']]);
    for (const a of alts(['Lr', 'S', 'R'])) add(`2 (${a})`, [[1.2, 'D'], [1.6, 'L'], [0.5, a]]);
    for (const a of alts(['Lr', 'S', 'R'])) {
      add(`3 (${a}, L)`, [[1.2, 'D'], [1.6, a], [fL, 'L']]);
      for (const s of signs('W')) if (loads.W !== 0) add(`3 (${a}, ${s > 0 ? '+' : '−'}0.5W)`, [[1.2, 'D'], [1.6, a], [0.5 * s, 'W']]);
    }
    for (const a of alts(['Lr', 'S', 'R'])) for (const s of signs('W')) add(`4 (${s > 0 ? '+' : '−'}W, ${a})`, [[1.2, 'D'], [1.0 * s, 'W'], [fL, 'L'], [0.5, a]]);
    for (const s of signs('E')) add(`5 (${s > 0 ? '+' : '−'}E)`, [[1.2, 'D'], [1.0 * s, 'E'], [fL, 'L'], [0.2, 'S']]);
    for (const s of signs('W')) add(`6 (${s > 0 ? '+' : '−'}W)`, [[0.9, 'D'], [1.0 * s, 'W']]);
    for (const s of signs('E')) add(`7 (${s > 0 ? '+' : '−'}E)`, [[0.9, 'D'], [1.0 * s, 'E']]);
  } else {
    add('1', [[1, 'D']]);
    add('2', [[1, 'D'], [1, 'L']]);
    for (const a of alts(['Lr', 'S', 'R'])) add(`3 (${a})`, [[1, 'D'], [1, a]]);
    for (const a of alts(['Lr', 'S', 'R'])) add(`4 (${a})`, [[1, 'D'], [0.75, 'L'], [0.75, a]]);
    for (const s of signs('W')) add(`5 (${s > 0 ? '+' : '−'}0.6W)`, [[1, 'D'], [0.6 * s, 'W']]);
    if (loads.E !== 0) for (const s of signs('E')) add(`5 (${s > 0 ? '+' : '−'}0.7E)`, [[1, 'D'], [0.7 * s, 'E']]);
    for (const a of alts(['Lr', 'S', 'R'])) for (const s of signs('W')) add(`6a (${s > 0 ? '+' : '−'}W, ${a})`, [[1, 'D'], [0.75, 'L'], [0.45 * s, 'W'], [0.75, a]]);
    for (const s of signs('E')) add(`6b (${s > 0 ? '+' : '−'}E)`, [[1, 'D'], [0.75, 'L'], [0.525 * s, 'E'], [0.75, 'S']]);
    for (const s of signs('W')) add(`7 (${s > 0 ? '+' : '−'}W)`, [[0.6, 'D'], [0.6 * s, 'W']]);
    for (const s of signs('E')) add(`8 (${s > 0 ? '+' : '−'}E)`, [[0.6, 'D'], [0.7 * s, 'E']]);
  }
  return out;
}

/** EN 1990 combinations for the maximum and the minimum effect. */
export function enCombos(expr, loads, psiL, psiS) {
  const out = [];
  const vars = [
    { key: 'L', psi: psiL, values: [loads.L] },
    { key: 'Lr', psi: ROOF_PSI, values: [loads.Lr] },
    { key: 'S', psi: psiS, values: [loads.S] },
    { key: 'W', psi: WIND_PSI, values: loads.W === 0 ? [0] : [loads.W, -loads.W] },
  ];
  // A1.2.1(3): imposed loads on roofs are not combined with snow or wind
  const compatible = (a, b) => !((a === 'Lr' && (b === 'S' || b === 'W')) || (b === 'Lr' && (a === 'S' || a === 'W')));
  for (const dir of [1, -1]) {
    const tag = dir > 0 ? 'max' : 'min';
    const gSup = (xi) => (dir * loads.D > 0 ? xi * 1.35 : 1.0);
    const unfav = [];
    for (const v of vars) for (const val of v.values) if (val * dir > 0) unfav.push({ ...v, val });
    const gTerm = (xi) => [gSup(xi), 'D', loads.D];
    const accompany = (lead) => {
      const used = new Set(lead ? [lead.key] : []);
      const terms = [];
      for (const v of unfav) {
        if (used.has(v.key)) continue;
        if (lead && !compatible(lead.key, v.key)) continue;
        if (!lead && v.key === 'Lr' && unfav.some((u) => u.key === 'S' || u.key === 'W')) continue;
        if (v.psi[0] === 0) continue;
        used.add(v.key);
        terms.push([1.5 * v.psi[0], v.key, v.val]);
      }
      return terms;
    };
    if (expr === '610') {
      out.push([`6.10 permanent only (${tag})`, [gTerm(1)]]);
      for (const lead of unfav) out.push([`6.10 leading ${lead.key}${lead.key === 'W' ? (lead.val > 0 ? ' +' : ' −') : ''} (${tag})`, [gTerm(1), [1.5, lead.key, lead.val], ...accompany(lead)]]);
    } else {
      out.push([`6.10a (${tag})`, [gTerm(1), ...accompany(null)]]);
      out.push([`6.10b permanent only (${tag})`, [gTerm(0.85)]]);
      for (const lead of unfav) out.push([`6.10b leading ${lead.key}${lead.key === 'W' ? (lead.val > 0 ? ' +' : ' −') : ''} (${tag})`, [gTerm(0.85), [1.5, lead.key, lead.val], ...accompany(lead)]]);
    }
    if (loads.E !== 0) {
      for (const e of [loads.E, -loads.E]) {
        const terms = [[1, 'D', loads.D], [1, 'E', e]];
        if (loads.L * dir > 0 && psiL[2] > 0) terms.push([psiL[2], 'L', loads.L]);
        if (loads.S * dir > 0 && psiS[2] > 0) terms.push([psiS[2], 'S', loads.S]);
        out.push([`6.12b seismic, ${e > 0 ? '+' : '−'}E (${tag})`, terms]);
      }
    }
  }
  return out;
}

export const schema = {
  id: 'load-combinations',
  name: 'Load combinations calculator (ASCE 7 LRFD/ASD and Eurocode)',
  category: 'structural',
  summary: 'Factored load combinations from dead, live, roof, snow, rain, wind and seismic loads by ASCE 7-16 LRFD or ASD, or EN 1990 6.10, with the governing case.',
  related: ['snow-load', 'wind-load', 'deflection-limits', 'base-plate'],
  assumptions: [
    'Each load is the effect of one load case on the same quantity (a reaction, a moment, an axial force) in one consistent unit, positive in the direction of gravity.',
    'Wind and earthquake effects act in either direction, so every combination with W or E is evaluated with both signs; the minimum shows uplift or reversal.',
    'ASCE 7-16: the load factor on L in combinations 3, 4 and 5 may be 0.5 where the live load is 100 psf or less, except in garages and places of public assembly (2.3.1 Exception 1). E is the combined seismic load effect of 12.4; the special combinations of 2.3.6 with E_v are not split out.',
    'EN 1990: expressions 6.10 or 6.10a and 6.10b for persistent and transient STR design with the recommended γ_G = 1.35 (1.00 when favourable), γ_Q = 1.5 and ψ factors of Table A1.1; variable actions enter only where unfavourable, and roof imposed loads are not combined with snow or wind (A1.2.1(3)). National annexes can change the values. Rain R has no EN 1990 counterpart and is ignored there.',
    'The seismic combination of EN 1990 6.12b takes E as the design seismic action A_Ed with ψ2 on the imposed and snow loads.',
  ],
  notes: [
    'Verification 2026-11-08: D 10, L 8, Lr 2, S 5, W 6: ASCE 7-16 LRFD maximum 1.2 × 10 + 6 + 8 + 0.5 × 5 = 28.5 (combination 4), minimum 0.9 × 10 − 6 = 3.0 (combination 6); ASD maximum 22.45 (6a), minimum 2.4 (7); EN 1990 6.10 maximum 34.8 with snow leading (category A, altitude ≤ 1 000 m). Checked by hand.',
  ],
  sources: [
    'ASCE/SEI 7-16 Minimum Design Loads and Associated Criteria for Buildings and Other Structures, 2.3.1 (LRFD basic combinations), 2.3.6 and 2.4.1 (ASD basic combinations)',
    'EN 1990:2002+A1:2005 Eurocode — Basis of structural design, 6.4.3.2 expressions 6.10, 6.10a, 6.10b; 6.4.3.4 expression 6.12b; Annex A1, Table A1.1 (ψ factors) and Table A1.2(B) (γ factors)',
    'International Building Code 2021, section 1605 Load Combinations (adopting the ASCE 7 combinations)',
  ],
  inputs: [
    { id: 'code', label: 'Combination rules', type: 'select', default: 'asce_lrfd', options: [{ value: 'asce_lrfd', label: 'ASCE 7-16 LRFD (strength design, 2.3.1)' }, { value: 'asce_asd', label: 'ASCE 7-16 ASD (allowable stress, 2.4.1)' }, { value: 'en_610', label: 'EN 1990 expression 6.10' }, { value: 'en_610ab', label: 'EN 1990 expressions 6.10a and 6.10b' }] },
    { id: 'D', label: 'Dead load effect D (permanent G)', group: 'dimensionless', unit: 'none', default: 10, min: -1e9, max: 1e9, help: 'Any unit, as long as all loads use the same one: kN, kip, kN·m, psf…' },
    { id: 'L', label: 'Live (imposed) load effect L', group: 'dimensionless', unit: 'none', default: 8, min: -1e9, max: 1e9 },
    { id: 'Lr', label: 'Roof live load effect Lr', group: 'dimensionless', unit: 'none', default: 2, min: -1e9, max: 1e9 },
    { id: 'S', label: 'Snow load effect S', group: 'dimensionless', unit: 'none', default: 5, min: -1e9, max: 1e9 },
    { id: 'R', label: 'Rain load effect R (ASCE only)', group: 'dimensionless', unit: 'none', default: 0, min: -1e9, max: 1e9 },
    { id: 'W', label: 'Wind load effect W (acts both ways)', group: 'dimensionless', unit: 'none', default: 6, min: -1e9, max: 1e9 },
    { id: 'E', label: 'Seismic load effect E (acts both ways)', group: 'dimensionless', unit: 'none', default: 0, min: -1e9, max: 1e9 },
    { id: 'l_factor', label: 'Factor on L in LRFD combinations 3 to 5', type: 'select', default: '1', options: [{ value: '1', label: '1.0' }, { value: '0.5', label: '0.5 (L ≤ 100 psf, not garages or assembly)' }], visibleWhen: { code: 'asce_lrfd' } },
    { id: 'category', label: 'Imposed load category (EN 1990 Table A1.1)', type: 'select', default: 'A', options: Object.entries(PSI).map(([value, c]) => ({ value, label: `${c.label} (ψ0 ${c.psi[0]})` })), visibleWhen: { code: ['en_610', 'en_610ab'] } },
    { id: 'snow_site', label: 'Snow ψ factors (EN 1990 Table A1.1)', type: 'select', default: 'low', options: Object.entries(SNOW_PSI).map(([value, c]) => ({ value, label: `${c.label} (ψ0 ${c.psi[0]})` })), visibleWhen: { code: ['en_610', 'en_610ab'] } },
  ],
  outputs: [
    { id: 'max', label: 'Governing maximum', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'max_name', label: 'Governing maximum combination', type: 'text' },
    { id: 'min', label: 'Governing minimum (uplift or reversal if negative)', group: 'dimensionless', unit: 'none', decimals: 2 },
    { id: 'min_name', label: 'Governing minimum combination', type: 'text' },
    { id: 'count', label: 'Number of combinations evaluated', group: 'dimensionless', unit: 'none', decimals: 0 },
    { id: 'table', label: 'Every combination', type: 'table' },
  ],
  example: {
    inputs: { code: 'asce_lrfd', D: 10, L: 8, Lr: 2, S: 5, R: 0, W: 6, E: 0, l_factor: '1' },
    results: { max: '28.5', min: '3.0' },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.code, ['asce_lrfd', 'asce_asd', 'en_610', 'en_610ab'], 'code', 'Combination rules');
  assertOneOf(String(x.l_factor), ['1', '0.5'], 'l_factor', 'Factor on L');
  assertOneOf(x.category, Object.keys(PSI), 'category', 'Imposed load category');
  assertOneOf(x.snow_site, Object.keys(SNOW_PSI), 'snow_site', 'Snow ψ factors');
  const loads = {};
  for (const k of ['D', 'L', 'Lr', 'S', 'R', 'W', 'E']) loads[k] = assertFinite(x[k], k, `Load ${k}`);
  const warnings = [];
  let rows;
  if (x.code.startsWith('asce')) {
    rows = asceCombos(x.code === 'asce_lrfd' ? 'lrfd' : 'asd', loads, Number(x.l_factor)).map(([name, terms]) => [name, terms.map(([f, k]) => [f, k, loads[k]])]);
  } else {
    if (loads.R !== 0) warnings.push('EN 1990 has no separate rain load; R is ignored in the Eurocode combinations.');
    rows = enCombos(x.code === 'en_610' ? '610' : '610ab', loads, PSI[x.category].psi, SNOW_PSI[x.snow_site].psi);
  }
  const evaluated = rows.map(([name, terms]) => {
    const value = terms.reduce((s, [f, , v]) => s + f * v, 0);
    const expr = terms.map(([f, k, v], i) => {
      const sign = f * v < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '');
      return `${sign}${Math.abs(f) === 1 ? '' : n2(Math.abs(f))}${k}`;
    }).join('');
    return { name, expr, value };
  });
  let mx = evaluated[0]; let mn = evaluated[0];
  for (const r of evaluated) { if (r.value > mx.value) mx = r; if (r.value < mn.value) mn = r; }
  if (loads.D < 0) warnings.push('The dead load is negative: check the sign convention (gravity positive).');
  if (mn.value < 0) warnings.push('The minimum is negative: the load effect reverses (uplift or tension); check the connections and anchorage for it.');
  return {
    outputs: {
      max: mx.value,
      max_name: `${mx.name}: ${mx.expr}`,
      min: mn.value,
      min_name: `${mn.name}: ${mn.expr}`,
      count: evaluated.length,
      table: { columns: ['Combination', 'Expression', 'Value'], rows: evaluated.map((r) => [r.name, r.expr, n2(r.value)]) },
    },
    warnings,
  };
}
