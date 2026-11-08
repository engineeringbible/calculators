/**
 * torque-power-rpm/calc.js — power, torque and rotational speed of a shaft from any two of them.
 *
 * P = T ω = 2π n T / 60   (n in rpm).
 * Schema units: SI — W, N·m, rpm (the conventional unit for shaft speed).
 */
import { withDefaults, assertPositive, assertOneOf } from '../shared/validate.js';

export const schema = {
  id: 'torque-power-rpm',
  name: 'Torque, power and speed',
  category: 'mechanical',
  summary: 'Shaft power from torque and rpm, torque from power and rpm, or speed from power and torque, in kW, hp, N·m and lbf·ft.',
  related: ['shaft-torque', 'gear-ratio', 'three-phase-power', 'engine-bmep'],
  assumptions: [
    'Power, torque and speed refer to the same shaft at the same instant; for an engine or motor the rated values come from its data sheet at the rated point.',
    'The relation P = T ω is exact for steady rotation; for a fluctuating torque (a piston engine) use the mean torque.',
    'Horsepower is mechanical horsepower (745.7 W); metric horsepower (PS, 735.5 W) is offered in the unit lists.',
  ],
  notes: [
    'Verification 2026-11-07: a 15 kW motor at 1460 rpm gives 98.1 N·m; 300 lbf·ft at 5252 rpm gives exactly 300 hp, the crossover where torque in lbf·ft equals horsepower. Checked by hand.',
  ],
  sources: [
    'Shigley\'s Mechanical Engineering Design, 11th ed., ch. 3 and ch. 7 (power transmitted by a shaft, H = T ω)',
    'Oberg et al., Machinery\'s Handbook, 31st ed., "Horsepower and torque" (hp = T n / 5252 in lbf·ft and rpm)',
  ],
  inputs: [
    { id: 'solve_for', label: 'Find', type: 'select', default: 'torque', options: [{ value: 'torque', label: 'Torque from power and speed' }, { value: 'power', label: 'Power from torque and speed' }, { value: 'speed', label: 'Speed from power and torque' }] },
    { id: 'power_w', label: 'Power P', group: 'power', unit: 'W', display: 'kW', default: 15000, min: 0, max: 1e10, visibleWhen: { solve_for: ['torque', 'speed'] } },
    { id: 'torque_n_m', label: 'Torque T', group: 'torque', unit: 'N_m', default: 100, min: 0, max: 1e10, visibleWhen: { solve_for: ['power', 'speed'] } },
    { id: 'speed_rpm', label: 'Speed n', group: 'rotational_speed', unit: 'rpm', default: 1460, min: 0, max: 1e6, visibleWhen: { solve_for: ['torque', 'power'] } },
  ],
  outputs: [
    { id: 'power_out_w', label: 'Power P', group: 'power', unit: 'W', display: 'kW' },
    { id: 'power_hp_w', label: 'Power in horsepower', group: 'power', unit: 'W', display: 'hp' },
    { id: 'torque_out_n_m', label: 'Torque T', group: 'torque', unit: 'N_m' },
    { id: 'torque_lbf_ft', label: 'Torque in lbf·ft', group: 'torque', unit: 'N_m', display: 'lbf_ft' },
    { id: 'speed_out_rpm', label: 'Speed n', group: 'rotational_speed', unit: 'rpm' },
    { id: 'omega_rad_s', label: 'Angular velocity ω = 2π n / 60', group: 'rotational_speed', unit: 'rpm', display: 'rad_s' },
  ],
  example: {
    inputs: { solve_for: 'torque', power_w: [15, 'kW'], speed_rpm: [1460, 'rpm'] },
    results: {
      torque_out_n_m: '98.1 N·m',
      omega_rad_s: '152.9 rad/s',
      torque_lbf_ft: '72.4 lbf·ft',
    },
  },
};

const omegaOf = (rpm) => (2 * Math.PI * rpm) / 60;

export function calculate(inputs) {
  const x = withDefaults(schema, inputs);
  assertOneOf(x.solve_for, ['torque', 'power', 'speed'], 'solve_for', 'Find');
  let p;
  let t;
  let n;
  if (x.solve_for === 'torque') {
    p = assertPositive(x.power_w, 'power_w', 'Power');
    n = assertPositive(x.speed_rpm, 'speed_rpm', 'Speed');
    t = p / omegaOf(n);
  } else if (x.solve_for === 'power') {
    t = assertPositive(x.torque_n_m, 'torque_n_m', 'Torque');
    n = assertPositive(x.speed_rpm, 'speed_rpm', 'Speed');
    p = t * omegaOf(n);
  } else {
    p = assertPositive(x.power_w, 'power_w', 'Power');
    t = assertPositive(x.torque_n_m, 'torque_n_m', 'Torque');
    n = (p / t) * (60 / (2 * Math.PI));
  }
  const warnings = [];
  if (n > 30000) warnings.push('Above 30 000 rpm only special high-speed machines run; check the inputs.');
  return {
    outputs: { power_out_w: p, power_hp_w: p, torque_out_n_m: t, torque_lbf_ft: t, speed_out_rpm: n, omega_rad_s: n },
    warnings,
  };
}
