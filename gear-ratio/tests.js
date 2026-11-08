/**
 * gear-ratio/tests.js — checks against the train value of simple and compound gear trains.
 * Run: node run-tests.js gear-ratio
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '12 teeth driving 48 at 1450 rpm and 20 N·m, 98 %: ratio 4, 362.5 rpm, 78.4 N·m, 3.04 kW in and 60.7 W lost',
    source: 'Shigley, Mechanical Engineering Design, ch. 13: n_out = n_in z₁/z₂; T_out = T_in (z₂/z₁) η',
    run: () => {
      const { outputs } = calculate({ mode: 'teeth', z1: 12, z2: 48, stages: '1', speed_rpm: 1450, torque_n_m: 20, efficiency: 0.98 });
      assertClose(outputs.ratio, 4, { rel: 1e-12 }, 'i');
      assertClose(outputs.speed_out_rpm, 362.5, { rel: 1e-12 }, 'n out');
      assertClose(outputs.torque_out_n_m, 78.4, { rel: 1e-12 }, 'T out');
      assertClose(outputs.power_in_w, 20 * 2 * Math.PI * 1450 / 60, { rel: 1e-12 }, 'P in');
      assertClose(outputs.loss_w, outputs.power_in_w * 0.02, { rel: 1e-12 }, 'loss');
    },
  },
  {
    name: 'Two stages 12:48 and 15:45 multiply to 12:1; two 98 % stages pass 96.04 % of the power',
    source: 'Shigley, ch. 13: train value of a compound train = product of the stage ratios; ISO 14179-1 per-stage losses',
    run: () => {
      const { outputs } = calculate({ mode: 'teeth', z1: 12, z2: 48, stages: '2', z3: 15, z4: 45, speed_rpm: 1200, torque_n_m: 10, efficiency: 0.98 });
      assertClose(outputs.ratio, 12, { rel: 1e-12 }, 'i');
      assertClose(outputs.speed_out_rpm, 100, { rel: 1e-12 }, 'n');
      assertClose(outputs.power_out_w / outputs.power_in_w, 0.9604, { rel: 1e-12 }, 'η²');
    },
  },
  {
    name: 'A step-up of 40 teeth driving 20 doubles the speed and halves the torque, before losses',
    source: 'Gear ratio below 1 (overdrive)',
    run: () => {
      const { outputs } = calculate({ mode: 'teeth', z1: 40, z2: 20, stages: '1', speed_rpm: 1000, torque_n_m: 50, efficiency: 1 });
      assertClose(outputs.speed_out_rpm, 2000, { rel: 1e-12 }, 'n');
      assertClose(outputs.torque_out_n_m, 25, { rel: 1e-12 }, 'T');
      assertEqual(outputs.kind.startsWith('Increases speed'), true, 'kind');
    },
  },
  {
    name: 'A known ratio of 3.5 gives the same output as matching tooth counts 14:49',
    source: 'Ratio mode equals tooth mode',
    run: () => {
      const r = calculate({ mode: 'ratio', ratio_in: 3.5, speed_rpm: 1750, torque_n_m: 30, efficiency: 0.97 }).outputs;
      const t = calculate({ mode: 'teeth', z1: 14, z2: 49, stages: '1', speed_rpm: 1750, torque_n_m: 30, efficiency: 0.97 }).outputs;
      assertClose(r.torque_out_n_m, t.torque_out_n_m, { rel: 1e-12 }, 'same torque');
      assertClose(r.speed_out_rpm, 500, { rel: 1e-12 }, 'n');
    },
  },
  {
    name: 'A 12-tooth pinion warns about undercut; fractional teeth and zero speed are rejected',
    source: 'Minimum teeth for a 20° full-depth pinion without undercut is 17 (Shigley, ch. 13); validation contract',
    run: () => {
      assertEqual(calculate({ mode: 'teeth', z1: 12, z2: 48, stages: '1' }).warnings.some((w) => w.includes('undercut')), true, 'undercut');
      assertThrows(() => calculate({ mode: 'teeth', z1: 12.5 }), 'Stage 1 driving gear teeth');
      assertThrows(() => calculate({ speed_rpm: 0 }), 'Input speed must be greater than zero');
    },
  },
];
