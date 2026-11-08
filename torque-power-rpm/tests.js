/**
 * torque-power-rpm/tests.js — checks against P = T ω and the 5252 rpm horsepower crossover.
 * Run: node run-tests.js torque-power-rpm
 */
import { calculate } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'A 15 kW motor at 1460 rpm: ω = 152.89 rad/s, T = 98.11 N·m = 72.36 lbf·ft',
    source: 'Shigley, Mechanical Engineering Design, ch. 3: H = T ω, ω = 2π n / 60',
    run: () => {
      const { outputs } = calculate({ solve_for: 'torque', power_w: 15000, speed_rpm: 1460 });
      assertClose(convert(outputs.omega_rad_s, 'rpm', 'rad_s', 'rotational_speed'), 152.891, { abs: 1e-3 }, 'ω');
      assertClose(outputs.torque_out_n_m, 15000 * 60 / (2 * Math.PI * 1460), { rel: 1e-12 }, 'T');
      assertClose(convert(outputs.torque_lbf_ft, 'N_m', 'lbf_ft', 'torque'), 72.36, { abs: 0.01 }, 'lbf·ft');
    },
  },
  {
    name: '300 lbf·ft at 5252 rpm is 300 hp: torque in lbf·ft equals horsepower at 5252 rpm',
    source: 'Machinery\'s Handbook, "Horsepower and torque": hp = T n / 5252 (33 000 / 2π = 5252.1)',
    run: () => {
      const t = convert(300, 'lbf_ft', 'N_m', 'torque');
      const { outputs } = calculate({ solve_for: 'power', torque_n_m: t, speed_rpm: 5252.113 });
      assertClose(convert(outputs.power_hp_w, 'W', 'hp', 'power'), 300, { abs: 1e-3 }, 'hp');
    },
  },
  {
    name: 'Speed from power and torque: 100 kW and 500 N·m give 1909.9 rpm; feeding it back gives 100 kW',
    source: 'n = 60 P / (2π T)',
    run: () => {
      const n = calculate({ solve_for: 'speed', power_w: 100000, torque_n_m: 500 }).outputs.speed_out_rpm;
      assertClose(n, 1909.86, { abs: 0.01 }, 'n');
      assertClose(calculate({ solve_for: 'power', torque_n_m: 500, speed_rpm: n }).outputs.power_out_w, 100000, { rel: 1e-12 }, 'P');
    },
  },
  {
    name: 'A two-stroke main engine of 10 MW at 80 rpm turns 1.194 MN·m on its shaft',
    source: 'T = P / ω for a low-speed engine (Shigley, ch. 7)',
    run: () => {
      assertClose(calculate({ solve_for: 'torque', power_w: 10e6, speed_rpm: 80 }).outputs.torque_out_n_m, 1.19366e6, { rel: 1e-5 }, 'T');
    },
  },
  {
    name: 'Halving the speed at the same power doubles the torque',
    source: 'T ∝ 1/n at constant P',
    run: () => {
      const a = calculate({ solve_for: 'torque', power_w: 5000, speed_rpm: 3000 }).outputs.torque_out_n_m;
      const b = calculate({ solve_for: 'torque', power_w: 5000, speed_rpm: 1500 }).outputs.torque_out_n_m;
      assertClose(b / a, 2, { rel: 1e-12 }, 'ratio');
    },
  },
];
