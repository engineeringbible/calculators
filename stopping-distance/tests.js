/**
 * stopping-distance/tests.js — checks against AASHTO Green Book Table 3-1 and the braking distance on grades.
 * Run: node run-tests.js stopping-distance
 */
import { calculate, SURFACES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const MPH = 0.44704;
const G = 9.80665;

export const tests = [
  {
    name: 'AASHTO Table 3-1, 45 mph: brake reaction 165.4 ft, braking 194.4 ft, stopping sight distance 360 ft (2.5 s, 11.2 ft/s²)',
    source: 'AASHTO Green Book Table 3-1 (level roadways), as reproduced by Iowa DOT; table uses 1.47 V t + 1.075 V² / a',
    run: () => {
      const o = calculate({ speed_m_s: 45 * MPH, reaction_s: 2.5, method: 'decel', decel_m_s2: 11.2 * FT }).outputs;
      assertClose(o.reaction_m / FT, 165.4, { rel: 0.003 }, 'reaction');
      assertClose(o.braking_m / FT, 194.4, { rel: 0.003 }, 'braking');
      assertClose(o.total_m / FT, 360, { rel: 0.003 }, 'total');
    },
  },
  {
    name: 'AASHTO Table 3-1, 50 mph: calculated stopping sight distance about 423 ft (design 425 ft)',
    source: 'AASHTO Green Book Table 3-1, 50 mph row',
    run: () => {
      const o = calculate({ speed_m_s: 50 * MPH, method: 'decel', decel_m_s2: 11.2 * FT }).outputs;
      assertClose(o.total_m / FT, 423.4, { abs: 0.1 }, 'calculated');
      assertEqual(o.total_m / FT < 425, true, 'below the design value');
    },
  },
  {
    name: '60 mph, 2.5 s, 3.4 m/s² on the level: 220.0 + 347.1 = 567.1 ft (172.9 m), 10.39 s',
    source: 'Hand calculation, d = v t + v² / (2a), v = 26.822 m/s',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.reaction_m / FT, 220, { abs: 1e-9 }, 'reaction');
      assertClose(o.braking_m, 26.8224 ** 2 / 6.8, { rel: 1e-12 }, 'braking');
      assertClose(o.total_metric_m, 172.856, { abs: 0.001 }, 'total m');
      assertClose(o.time_s, 2.5 + 26.8224 / 3.4, { rel: 1e-12 }, 'time');
    },
  },
  {
    name: 'A 5 % downgrade lengthens braking to v² / (2 (3.4 − 0.49)) = 405.6 ft; a 5 % upgrade shortens it',
    source: 'AASHTO braking distance on grades, d = V² / (30 (a/32.2 ± G)) in SI form',
    run: () => {
      const down = calculate({ grade: -0.05 }).outputs;
      assertClose(down.braking_m, 26.8224 ** 2 / (2 * (3.4 - 0.05 * G)), { rel: 1e-12 }, 'downhill');
      assertClose(down.braking_m / FT, 405.61, { abs: 0.01 }, 'downhill ft');
      assertEqual(calculate({ grade: 0.05 }).outputs.braking_m < calculate({}).outputs.braking_m, true, 'uphill shorter');
    },
  },
  {
    name: 'Wet asphalt (sliding μ 0.45, Wong) at 60 mph: braking 26.82² / (2 × 0.45 g) = 267.4 ft; ice μ 0.07 needs 1 719 ft',
    source: 'Wong, Theory of Ground Vehicles, 2nd ed., p. 26 (sliding coefficients); d = v² / (2 μ g)',
    run: () => {
      assertEqual(SURFACES.wet_asphalt.mu, 0.45, 'table value');
      const wet = calculate({ method: 'surface', surface: 'wet_asphalt' }).outputs;
      assertClose(wet.braking_m / FT, 267.43, { abs: 0.01 }, 'wet');
      const ice = calculate({ method: 'surface', surface: 'ice' }).outputs;
      assertClose(ice.braking_m / FT, 1719.2, { abs: 0.1 }, 'ice');
    },
  },
  {
    name: 'A downgrade steeper than the friction, zero speed and an unknown surface are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ method: 'surface', surface: 'ice', grade: -0.1 }), 'cannot stop');
      assertThrows(() => calculate({ speed_m_s: 0 }), 'Speed');
      assertThrows(() => calculate({ method: 'surface', surface: 'lava' }), 'Road surface');
    },
  },
];
