/**
 * horsepower/tests.js — checks against P = T ω, the 5 252 rpm crossover and the published ET/mph constants.
 * Run: node run-tests.js horsepower
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const LBFT = 1.3558179483314004;
const LB = 0.45359237;
const MPH = 0.44704;
const HP = 745.69987158227;

export const tests = [
  {
    name: '400 lbf·ft at 5 000 rpm is 400 × 5 000 / 5 252.1 = 380.8 hp, 284.0 kW, 386.1 PS; 323.7 hp at the wheels with 15 % loss',
    source: 'P = T ω with 1 hp = 550 ft·lbf/s (33 000 / 2π = 5 252.11); 1 PS = 735.49875 W',
    run: () => {
      const o = calculate({ torque_nm: 400 * LBFT, rpm: 5000, loss: 0.15 }).outputs;
      assertClose(o.crank_w / HP, (400 * 5000) / 5252.113, { rel: 1e-6 }, 'hp');
      assertClose(o.crank_kw_w / 1000, 283.96, { abs: 0.01 }, 'kW');
      assertClose(o.crank_ps_w / 735.49875, 386.08, { abs: 0.01 }, 'PS');
      assertClose(o.wheel_w / HP, 323.68, { abs: 0.01 }, 'wheel hp');
    },
  },
  {
    name: 'Torque and horsepower cross at 5 252 rpm: 300 lbf·ft there is 300 hp',
    source: 'hp = lbf·ft × rpm / 5 252 (definition of the mechanical horsepower)',
    run: () => {
      const o = calculate({ torque_nm: 300 * LBFT, rpm: 33000 / (2 * Math.PI) }).outputs;
      assertClose(o.crank_w / HP, 300, { rel: 1e-9 }, 'hp');
    },
  },
  {
    name: 'Chassis dyno: 300 hp at the wheels with a 15 % loss is 352.9 hp at the crank',
    source: 'Wheel = crank × (1 − loss)',
    run: () => {
      const rpm = 6000;
      const t = (300 * HP) / ((2 * Math.PI * rpm) / 60);
      const o = calculate({ torque_nm: t, rpm, measured_at: 'wheel', loss: 0.15 }).outputs;
      assertClose(o.wheel_w / HP, 300, { rel: 1e-9 }, 'wheel');
      assertClose(o.crank_w / HP, 352.94, { abs: 0.01 }, 'crank');
    },
  },
  {
    name: 'Hale constants: 3 500 lb trapping 113.6 mph is 400.5 hp; the same car at 12.00 s is 400.3 hp',
    source: 'McCaul 2014, Table 2: Patrick Hale / Quarter Jr. K_t = 5.825, K_v = 234.0; hp = W (mph/K_v)³ = W (K_t/ET)³',
    run: () => {
      const trap = calculate({ mode: 'trap', weight_kg: 3500 * LB, trap_m_s: 113.6 * MPH, formula: 'hale' }).outputs;
      assertClose(trap.crank_w / HP, 3500 * (113.6 / 234) ** 3, { rel: 1e-9 }, 'trap hp');
      assertClose(trap.crank_w / HP, 400.46, { abs: 0.01 }, 'trap hp value');
      const et = calculate({ mode: 'et', weight_kg: 3500 * LB, et_s: 12, formula: 'hale' }).outputs;
      assertClose(et.crank_w / HP, 400.32, { abs: 0.01 }, 'ET hp');
    },
  },
  {
    name: '1970 AAR ’Cuda (3 585 lb, 14.30 s, rated 290 hp): Huntington’s ET formula gives 305.1 hp, within 6 % of the rating',
    source: 'McCaul 2014, test data of the AAR ’Cuda and Huntington constants K_t = 6.29, K_v = 224',
    run: () => {
      const o = calculate({ mode: 'et', weight_kg: 3585 * LB, et_s: 14.3, formula: 'huntington' }).outputs;
      assertClose(o.crank_w / HP, 305.1, { abs: 0.05 }, 'hp');
      assertEqual(Math.abs(o.crank_w / HP / 290 - 1) < 0.06, true, 'within 6 %');
    },
  },
  {
    name: 'Zero torque, a 70 % loss and an unknown formula are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ torque_nm: 0 }), 'Torque');
      assertThrows(() => calculate({ loss: 0.7 }), 'Drivetrain loss');
      assertThrows(() => calculate({ mode: 'trap', formula: 'guess' }), 'Empirical constants');
    },
  },
];
