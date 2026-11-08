/**
 * quarter-mile/tests.js — checks against the published ET/mph constants, a published road test and the constant-power
 * relations. Run: node run-tests.js quarter-mile
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const LB = 0.45359237;
const HP = 745.69987158227;
const MPH = 0.44704;

export const tests = [
  {
    name: '3 500 lb and 400 hp (Hale): ET = 5.825 × 8.75^(1/3) = 12.00 s, trap 234 / 8.75^(1/3) = 113.6 mph',
    source: 'McCaul 2014, Table 2 (Patrick Hale / Quarter Jr. K_t = 5.825, K_v = 234.0); hand calculation',
    run: () => {
      const o = calculate({ weight_kg: 3500 * LB, power_w: 400 * HP, formula: 'hale' }).outputs;
      assertClose(o.et_s, 12.0032, { abs: 1e-4 }, 'ET');
      assertClose(o.trap_m_s / MPH, 113.557, { abs: 0.001 }, 'mph');
      assertClose(o.lb_per_hp, 8.75, { rel: 1e-12 }, 'lb/hp');
    },
  },
  {
    name: 'ET × mph is the constant of each formula, whatever the car: 1 363 for Hale, 1 409 for Huntington',
    source: 'McCaul 2014, Table 2, column CONSTANT (1 363 Hale, 1 409 Huntington)',
    run: () => {
      for (const [formula, k] of [['hale', 1363.05], ['huntington', 1408.96]]) {
        for (const [w, p] of [[2500, 150], [4200, 700]]) {
          const o = calculate({ weight_kg: w * LB, power_w: p * HP, formula }).outputs;
          assertClose(o.et_s * (o.trap_m_s / MPH), k, { rel: 1e-9 }, `${formula} ${w}/${p}`);
        }
      }
    },
  },
  {
    name: '2005 Mustang GT, 300 hp and 3 673 lb, ran 13.7 s at 103 mph; Hale predicts 13.43 s and 101.5 mph, within 2.1 %',
    source: 'McCaul 2014, Table 3 (road-test figures of 2005–2006 cars)',
    run: () => {
      const o = calculate({ weight_kg: 3673 * LB, power_w: 300 * HP }).outputs;
      assertClose(o.et_s, 13.425, { abs: 0.001 }, 'ET');
      assertClose(o.trap_m_s / MPH, 101.53, { abs: 0.01 }, 'mph');
      assertEqual(Math.abs(o.et_s / 13.7 - 1) < 0.021 && Math.abs(o.trap_m_s / MPH / 103 - 1) < 0.021, true, 'within 2.1 %');
    },
  },
  {
    name: 'Eighth mile at constant power: ET_1/4 / ET_1/8 = 2^(2/3) = 1.587 and mph_1/4 / mph_1/8 = 2^(1/3) = 1.260',
    source: 'Constant power from rest: x = (2/3) √(2P/m) t^1.5, v = √(2P t / m) (McCaul 2014, paragraph 4)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.et_s / o.et8_s, 1.587401, { rel: 1e-6 }, 'ET ratio');
      assertClose(o.trap_m_s / o.trap8_m_s, 1.259921, { rel: 1e-6 }, 'speed ratio');
    },
  },
  {
    name: '340 hp at the wheels with a 15 % loss is 400 hp at the flywheel and the same 12.00 s',
    source: 'hp_crank = hp_wheel / (1 − loss)',
    run: () => {
      const o = calculate({ weight_kg: 3500 * LB, power_w: 340 * HP, power_at: 'wheel', loss: 0.15 }).outputs;
      assertClose(o.crank_w / HP, 400, { rel: 1e-9 }, 'crank');
      assertClose(o.et_s, 12.0032, { abs: 1e-4 }, 'ET');
    },
  },
  {
    name: 'A weight of 10 kg, zero power and an unknown formula are rejected; under 1.5 lb/hp warns',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ weight_kg: 10 }), 'Race weight');
      assertThrows(() => calculate({ power_w: 0 }), 'Horsepower');
      assertThrows(() => calculate({ formula: 'x' }), 'Empirical constants');
      assertEqual(calculate({ weight_kg: 2000 * LB, power_w: 2000 * HP }).warnings.length, 1, 'warning');
    },
  },
];
