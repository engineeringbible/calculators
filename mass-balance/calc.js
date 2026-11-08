/**
 * mass-balance/calc.js — steady-state mixing of two or three streams: mixed flow, concentration (mass fraction of a
 * component) and temperature; and the required-stream form: the flow of stream 2 that brings stream 1 to a target
 * concentration or temperature.
 *
 * Total: ṁ = Σ ṁ_i;  component: x = Σ ṁ_i x_i / Σ ṁ_i;  energy (no heat of mixing): T = Σ ṁ_i c_p,i T_i / Σ ṁ_i c_p,i.
 * Required stream 2: ṁ2 = ṁ1 (x1 − x_t) / (x_t − x2), or ṁ2 = ṁ1 c_p1 (T1 − T_t) / (c_p2 (T_t − T2)).
 * Schema units: SI — kg/s, mass fraction, K, J/(kg·K).
 */
import { withDefaults, assertPositive, assertOneOf, assertRange, assertNonNegative } from '../shared/validate.js';

const stream = (n, m, c, tC, extra = {}) => [
  { id: `m${n}_kg_s`, label: `Stream ${n}: mass flow`, group: 'mass_flow', unit: 'kg_s', display: 'kg_h', default: m / 3600, min: 0, max: 1e5, ...(extra.m || {}) },
  { id: `x${n}`, label: `Stream ${n}: concentration (mass fraction of the component)`, group: 'ratio', unit: 'frac', display: 'pct', default: c, min: 0, max: 1, ...(extra.all || {}) },
  { id: `t${n}_k`, label: `Stream ${n}: temperature`, group: 'temperature', unit: 'K', display: 'C', default: tC + 273.15, min: 1, max: 2000, ...(extra.all || {}) },
  { id: `cp${n}`, label: `Stream ${n}: specific heat c_p`, group: 'specific_heat', unit: 'J_kgK', display: 'kJ_kgK', default: 4186, min: 100, max: 20000, ...(extra.all || {}) },
];

export const schema = {
  id: 'mass-balance',
  name: 'Mass balance calculator: mixing streams (flow, concentration, temperature)',
  category: 'process',
  summary: 'Mix two or three streams to find the combined flow, concentration and temperature, or find the stream 2 flow that reaches a target concentration or temperature.',
  related: ['blending-ratio', 'dilution', 'chemical-dosing', 'specific-heat'],
  assumptions: [
    'Steady state with no reaction, accumulation or losses: total mass and the mass of each component are conserved, so the mixed concentration is the flow-weighted mean of the stream concentrations.',
    'Concentrations are mass fractions of one component (% w/w, ppm by mass) and flows are mass flows; for volume flows and mg/L the same equations hold only when the densities are equal.',
    'The mixed temperature is the c_p-weighted mean: no heat of mixing or dilution, no phase change and no heat loss; dissolving or diluting acids, caustic soda and some salts releases heat and gives a hotter mix.',
    'In the required-stream form, stream 2 must be weaker (or colder) than the target when stream 1 is stronger (or hotter), and the target must lie between the two.',
  ],
  notes: [
    'Verification 2026-11-08: 1 000 kg/h of 26 % brine diluted to 10 % needs 1 000 × (26 − 10) / (10 − 0) = 1 600 kg/h of water, giving 2 600 kg/h of product. Checked by hand.',
    'Felder and Rousseau, mixing unit example: 200 g of 40 wt% methanol and 150 g of 70 wt% methanol give 350 g of 52.9 wt% methanol, reproduced in the tests.',
  ],
  sources: [
    'Felder, R.M. and Rousseau, R.W., Elementary Principles of Chemical Processes, 3rd ed., Wiley, ch. 4 (material balances on a mixing unit) and ch. 7–8 (energy balances)',
    'Himmelblau, D.M. and Riggs, J.B., Basic Principles and Calculations in Chemical Engineering, 8th ed., Part II (material balances)',
  ],
  inputs: [
    { id: 'mode', label: 'Find', type: 'select', default: 'mix', options: [{ value: 'mix', label: 'Mixed stream from the streams (flow, concentration, temperature)' }, { value: 'required', label: 'Flow of stream 2 to reach a target' }] },
    { id: 'streams', label: 'Number of streams', type: 'select', default: '2', options: [{ value: '2', label: 'Two' }, { value: '3', label: 'Three' }], visibleWhen: { mode: 'mix' } },
    { id: 'target', label: 'Target', type: 'select', default: 'conc', options: [{ value: 'conc', label: 'Concentration of the mix' }, { value: 'temp', label: 'Temperature of the mix' }], visibleWhen: { mode: 'required' } },
    ...stream(1, 1000, 0.1, 60),
    ...stream(2, 500, 0.02, 20, { m: { visibleWhen: { mode: 'mix' } } }),
    ...stream(3, 0, 0, 20, { m: { visibleWhen: { mode: 'mix', streams: '3' } }, all: { visibleWhen: { mode: 'mix', streams: '3' } } }),
    { id: 'x_target', label: 'Target concentration of the mix', group: 'ratio', unit: 'frac', display: 'pct', default: 0.05, min: 0, max: 1, visibleWhen: { mode: 'required', target: 'conc' } },
    { id: 't_target_k', label: 'Target temperature of the mix', group: 'temperature', unit: 'K', display: 'C', default: 313.15, min: 1, max: 2000, visibleWhen: { mode: 'required', target: 'temp' } },
  ],
  outputs: [
    { id: 'm2_req', label: 'Required flow of stream 2', group: 'mass_flow', unit: 'kg_s', display: 'kg_h', visibleWhen: { mode: 'required' } },
    { id: 'm_mix', label: 'Mixed flow', group: 'mass_flow', unit: 'kg_s', display: 'kg_h' },
    { id: 'x_mix', label: 'Mixed concentration', group: 'ratio', unit: 'frac', display: 'pct' },
    { id: 't_mix', label: 'Mixed temperature (no heat of mixing)', group: 'temperature', unit: 'K', display: 'C' },
    { id: 'solute', label: 'Component flow in the mix', group: 'mass_flow', unit: 'kg_s', display: 'kg_h' },
    { id: 'ratio', label: 'Ratio of stream 2 to stream 1 (mass)', group: 'dimensionless', unit: 'none', decimals: 3 },
  ],
  example: {
    inputs: { mode: 'required', target: 'conc', m1_kg_s: [1000, 'kg_h'], x1: [26, 'pct'], t1_k: [20, 'C'], x2: [0, 'pct'], t2_k: [20, 'C'], x_target: [10, 'pct'] },
    results: { m2_req: '1 600 kg/h', m_mix: '2 600 kg/h', ratio: '1.600' },
  },
};

function streamOf(x, n) {
  return {
    m: assertNonNegative(x[`m${n}_kg_s`], `m${n}_kg_s`, `Stream ${n}: mass flow`),
    c: assertRange(x[`x${n}`], 0, 1, `x${n}`, `Stream ${n}: concentration`),
    t: assertPositive(x[`t${n}_k`], `t${n}_k`, `Stream ${n}: temperature`),
    cp: assertPositive(x[`cp${n}`], `cp${n}`, `Stream ${n}: specific heat`),
  };
}

function mixOf(list) {
  const m = list.reduce((s, q) => s + q.m, 0);
  const solute = list.reduce((s, q) => s + q.m * q.c, 0);
  const h = list.reduce((s, q) => s + q.m * q.cp, 0);
  const t = list.reduce((s, q) => s + q.m * q.cp * q.t, 0) / h;
  return { m, solute, c: solute / m, t };
}

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['mix', 'required'], 'mode', 'Find');
  const warnings = [];
  const s1 = streamOf(x, 1);
  if (x.mode === 'mix') {
    assertOneOf(x.streams, ['2', '3'], 'streams', 'Number of streams');
    const list = [s1, streamOf(x, 2)];
    if (x.streams === '3') list.push(streamOf(x, 3));
    const mix = mixOf(list);
    if (!(mix.m > 0)) throw new Error('Stream mass flows: at least one stream must have a flow above zero.');
    const temps = list.filter((q) => q.m > 0).map((q) => q.t);
    if (Math.max(...temps) - Math.min(...temps) > 50) warnings.push('The streams differ by more than 50 K: check for boiling, flashing or a heat of mixing, which this energy balance ignores.');
    return { outputs: { m2_req: null, m_mix: mix.m, x_mix: mix.c, t_mix: mix.t, solute: mix.solute, ratio: s1.m > 0 ? list[1].m / s1.m : null }, warnings };
  }
  assertOneOf(x.target, ['conc', 'temp'], 'target', 'Target');
  if (!(s1.m > 0)) throw new Error('Stream 1: mass flow must be greater than zero to find the flow of stream 2.');
  const s2 = { ...streamOf({ ...x, m2_kg_s: 0 }, 2) };
  let m2;
  if (x.target === 'conc') {
    const ct = assertRange(x.x_target, 0, 1, 'x_target', 'Target concentration');
    if (ct === s2.c) throw new Error('Target concentration: it equals the concentration of stream 2, which no finite flow can reach.');
    m2 = (s1.m * (s1.c - ct)) / (ct - s2.c);
    if (m2 < 0) throw new Error('Target concentration: it must lie between the concentrations of stream 1 and stream 2.');
  } else {
    const tt = assertPositive(x.t_target_k, 't_target_k', 'Target temperature');
    if (tt === s2.t) throw new Error('Target temperature: it equals the temperature of stream 2, which no finite flow can reach.');
    m2 = (s1.m * s1.cp * (s1.t - tt)) / (s2.cp * (tt - s2.t));
    if (m2 < 0) throw new Error('Target temperature: it must lie between the temperatures of stream 1 and stream 2.');
  }
  const mix = mixOf([s1, { ...s2, m: m2 }]);
  if (m2 > 100 * s1.m) warnings.push('Stream 2 is more than 100 times stream 1: the target is very close to the concentration or temperature of stream 2.');
  return { outputs: { m2_req: m2, m_mix: mix.m, x_mix: mix.c, t_mix: mix.t, solute: mix.solute, ratio: m2 / s1.m }, warnings };
}
