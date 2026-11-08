/**
 * thrust-weight/tests.js — checks against W = m g0, V_s = √(2W/(ρ S CL_max)) and the ISA density.
 * Run: node run-tests.js thrust-weight
 */
import { calculate, isaDensity } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const LB = 0.45359237;
const FT2 = 0.09290304;
const HP = 745.69987158227;
const KN = 1852 / 3600;
const G0 = 9.80665;

export const tests = [
  {
    name: '2 550 lb, 174 ft², 180 hp: wing loading 14.66 lb/ft² (71.6 kg/m²), power loading 14.17 lb/hp; CL_max 1.5 stalls at 53.7 kn',
    source: 'Hand calculation, V_s = √(2W/(ρ S CL_max)) (Anderson, Aircraft Performance and Design, Ch. 5)',
    run: () => {
      const o = calculate({ mass_kg: 2550 * LB, wing_area_m2: 174 * FT2, power_w: 180 * HP, clmax: 1.5, altitude_m: 0 }).outputs;
      assertClose(o.wing_loading_pa / 47.88025898033584, 2550 / 174, { rel: 1e-9 }, 'lb/ft²');
      assertClose(o.wing_loading_kg_m2, 71.553, { abs: 0.001 }, 'kg/m²');
      assertClose(o.power_loading_lb_hp, 2550 / 180, { rel: 1e-12 }, 'lb/hp');
      assertClose(o.stall_m_s / KN, 53.72, { abs: 0.01 }, 'stall');
    },
  },
  {
    name: 'ISA density: 1.2250 kg/m³ at sea level, 0.9046 kg/m³ at 10 000 ft (σ = 0.7385)',
    source: 'ICAO Doc 7488/3 table',
    run: () => {
      assertClose(isaDensity(0), 1.225, { abs: 1e-4 }, 'sea level');
      assertClose(isaDensity(3048), 0.90464, { abs: 1e-4 }, '10 000 ft');
    },
  },
  {
    name: 'At altitude the true stall speed rises as 1/√σ: 5 000 ft gives 53.72 / √0.8617 = 57.9 kn',
    source: 'V_s ∝ 1/√ρ; equivalent stall speed unchanged',
    run: () => {
      const sl = calculate({}).outputs;
      const hi = calculate({ altitude_m: 5000 * 0.3048 }).outputs;
      assertClose(hi.stall_m_s / sl.stall_m_s, Math.sqrt(1.225 / hi.rho_kg_m3), { rel: 1e-6 }, 'ratio');
      assertClose(hi.stall_m_s / KN, 57.87, { abs: 0.01 }, 'stall at 5 000 ft');
    },
  },
  {
    name: 'Rocket of 1 000 kg with 14 710 N of thrust: T/W 1.5, net acceleration 0.5 g straight up',
    source: 'a = g0 (T/W − 1)',
    run: () => {
      const o = calculate({ mass_kg: 1000, thrust_n: 1.5 * 1000 * G0, power_w: 0, wing_area_m2: 0 }).outputs;
      assertClose(o.tw, 1.5, { rel: 1e-12 }, 'T/W');
      assertClose(o.accel_m_s2 / G0, 0.5, { rel: 1e-12 }, 'acceleration');
      assertEqual(o.stall_m_s, null, 'no wing, no stall speed');
      assertEqual(o.power_loading_lb_hp, null, 'no power');
    },
  },
  {
    name: 'A 1.5 kg drone with 2.2 kgf of thrust can climb; a jet trainer at T/W 0.4 needs its wing',
    source: 'T/W > 1 condition for vertical flight',
    run: () => {
      const d = calculate({ mass_kg: 1.5, thrust_n: 2.2 * G0, wing_area_m2: 0, power_w: 0 }).outputs;
      assertClose(d.tw, 2.2 / 1.5, { rel: 1e-12 }, 'drone T/W');
      assertEqual(d.verdict.startsWith('T/W above 1'), true, 'drone verdict');
      const j = calculate({ mass_kg: 5000, thrust_n: 0.4 * 5000 * G0 }).outputs;
      assertEqual(j.verdict.startsWith('T/W below 1'), true, 'jet verdict');
    },
  },
  {
    name: 'Zero mass, negative thrust and a CL_max of 0.1 are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ mass_kg: 0 }), 'Gross weight');
      assertThrows(() => calculate({ thrust_n: -5 }), 'Static thrust');
      assertThrows(() => calculate({ clmax: 0.1 }), 'Maximum lift coefficient');
    },
  },
];
