/**
 * gear-ratio/calc.js — ratio, output speed, output torque and power of a one- or two-stage gear train from tooth
 * counts or a known ratio, with the efficiency of each stage.
 *
 * i = (z₂/z₁)(z₄/z₃);  n_out = n_in / i;  T_out = T_in i ηᵏ;  P_out = P_in ηᵏ.
 * Schema units: rpm, N·m, W; efficiency as a fraction.
 */
import { withDefaults, assertPositive, assertRange, assertInteger, assertOneOf } from '../shared/validate.js';

export const schema = {
  id: 'gear-ratio',
  name: 'Gear ratio, rpm and torque',
  category: 'mechanical',
  summary: 'Gear ratio from tooth counts for one or two stages, with output speed, torque and power after the losses of each stage.',
  related: ['torque-power-rpm', 'shaft-torque', 'bearing-life', 'three-phase-power'],
  assumptions: [
    'Gears mesh without slip, so the speed ratio is exactly the tooth ratio; belts slip by 1 to 2 %, which this does not include.',
    'Each stage loses the same fraction of the power it transmits; a spur or helical stage is typically 97 to 99 % efficient, a worm stage much less (50 to 90 %).',
    'Idler gears change the direction of rotation but not the ratio, so they are left out of the tooth counts.',
    'The output torque is the steady value; starting, shock and inertia loads are covered by the service factor used when choosing the gearbox.',
  ],
  notes: [
    'Verification 2026-11-07: a 12-tooth pinion driving 48 teeth at 1450 rpm and 20 N·m gives a ratio of 4.00, 362.5 rpm and 78.4 N·m at 98 %. Checked by hand.',
  ],
  sources: [
    'Shigley\'s Mechanical Engineering Design, 11th ed., ch. 13 (gear trains: train value e = product of driving teeth / product of driven teeth)',
    'ISO 14179-1:2001 Gears — Thermal capacity (typical mesh losses of cylindrical gears, about 1 % per stage)',
  ],
  inputs: [
    { id: 'mode', label: 'Ratio from', type: 'select', default: 'teeth', options: [{ value: 'teeth', label: 'Tooth counts' }, { value: 'ratio', label: 'A known overall ratio' }] },
    { id: 'z1', label: 'Stage 1 driving gear teeth z₁', group: 'dimensionless', unit: 'none', default: 12, min: 3, max: 10000, visibleWhen: { mode: 'teeth' } },
    { id: 'z2', label: 'Stage 1 driven gear teeth z₂', group: 'dimensionless', unit: 'none', default: 48, min: 3, max: 10000, visibleWhen: { mode: 'teeth' } },
    { id: 'stages', label: 'Stages', type: 'select', default: '1', options: [{ value: '1', label: 'One stage' }, { value: '2', label: 'Two stages' }], visibleWhen: { mode: 'teeth' } },
    { id: 'z3', label: 'Stage 2 driving gear teeth z₃', group: 'dimensionless', unit: 'none', default: 15, min: 3, max: 10000, visibleWhen: { mode: 'teeth', stages: '2' } },
    { id: 'z4', label: 'Stage 2 driven gear teeth z₄', group: 'dimensionless', unit: 'none', default: 45, min: 3, max: 10000, visibleWhen: { mode: 'teeth', stages: '2' } },
    { id: 'ratio_in', label: 'Overall ratio i (input speed / output speed)', group: 'dimensionless', unit: 'none', default: 4, min: 0.001, max: 1e6, visibleWhen: { mode: 'ratio' } },
    { id: 'speed_rpm', label: 'Input speed', group: 'rotational_speed', unit: 'rpm', default: 1450, min: 0, max: 1e6 },
    { id: 'torque_n_m', label: 'Input torque', group: 'torque', unit: 'N_m', default: 20, min: 0, max: 1e10 },
    { id: 'efficiency', label: 'Efficiency per stage', group: 'ratio', unit: 'frac', display: 'pct', default: 0.98, min: 0.3, max: 1, help: 'Spur or helical 0.97–0.99; bevel 0.95–0.98; worm 0.5–0.9.' },
  ],
  outputs: [
    { id: 'ratio', label: 'Overall ratio i', group: 'dimensionless', unit: 'none', decimals: 3 },
    { id: 'speed_out_rpm', label: 'Output speed n_in / i', group: 'rotational_speed', unit: 'rpm' },
    { id: 'torque_out_n_m', label: 'Output torque T_in × i × η', group: 'torque', unit: 'N_m' },
    { id: 'power_in_w', label: 'Input power', group: 'power', unit: 'W', display: 'kW' },
    { id: 'power_out_w', label: 'Output power', group: 'power', unit: 'W', display: 'kW' },
    { id: 'loss_w', label: 'Power lost as heat', group: 'power', unit: 'W' },
    { id: 'kind', label: 'What the train does', type: 'text' },
  ],
  example: {
    inputs: { mode: 'teeth', z1: 12, z2: 48, stages: '1', speed_rpm: [1450, 'rpm'], torque_n_m: [20, 'N_m'], efficiency: [98, 'pct'] },
    results: {
      ratio: '4.00',
      speed_out_rpm: '362.5 rpm',
      torque_out_n_m: '78.4 N·m',
    },
  },
};

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.mode, ['teeth', 'ratio'], 'mode', 'Ratio from');
  const speed = assertPositive(x.speed_rpm, 'speed_rpm', 'Input speed');
  const torque = assertPositive(x.torque_n_m, 'torque_n_m', 'Input torque');
  const eta = assertRange(x.efficiency, 0.3, 1, 'efficiency', 'Efficiency per stage');
  let ratio;
  let stages = 1;
  if (x.mode === 'teeth') {
    assertOneOf(String(x.stages), ['1', '2'], 'stages', 'Stages');
    stages = Number(x.stages);
    const teeth = (v, id, label) => assertInteger(assertPositive(v, id, label), id, label);
    ratio = teeth(x.z2, 'z2', 'Stage 1 driven gear teeth') / teeth(x.z1, 'z1', 'Stage 1 driving gear teeth');
    if (stages === 2) ratio *= teeth(x.z4, 'z4', 'Stage 2 driven gear teeth') / teeth(x.z3, 'z3', 'Stage 2 driving gear teeth');
  } else {
    ratio = assertPositive(x.ratio_in, 'ratio_in', 'Overall ratio');
  }
  const etaTotal = eta ** stages;
  const powerIn = torque * (2 * Math.PI * speed) / 60;
  const kind = Math.abs(ratio - 1) < 1e-12 ? 'Same speed and torque (ratio 1)'
    : ratio > 1 ? `Reduces speed ${Number(ratio.toPrecision(4))} times and multiplies torque` : `Increases speed ${Number((1 / ratio).toPrecision(4))} times and reduces torque`;
  const warnings = [];
  if (x.mode === 'teeth' && (x.z1 < 17 || (stages === 2 && x.z3 < 17))) warnings.push('A pinion with fewer than 17 teeth (20° pressure angle) undercuts unless its profile is shifted; check the gear design.');
  if (x.mode === 'teeth' && stages === 1 && ratio > 8) warnings.push('More than about 8:1 in one spur or helical stage makes a large, heavy wheel; two stages are usual.');
  return {
    outputs: {
      ratio,
      speed_out_rpm: speed / ratio,
      torque_out_n_m: torque * ratio * etaTotal,
      power_in_w: powerIn,
      power_out_w: powerIn * etaTotal,
      loss_w: powerIn * (1 - etaTotal),
      kind,
    },
    warnings,
  };
}
