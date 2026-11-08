/**
 * drag-lift/tests.js — checks against F = ½ ρ v² C A, P = F v and the standard sea-level density.
 * Run: node run-tests.js drag-lift
 */
import { calculate, SHAPES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const MPH = 0.44704;
const FT2 = 0.09290304;
const LBF = 4.4482216152605;
const HP = 745.69987158227;

export const tests = [
  {
    name: 'Car, Cd 0.30 on 24 ft², 70 mph at sea level and 15 °C: q 599.8 Pa, drag 401.2 N (90.2 lbf), 16.84 hp',
    source: 'Hand calculation, F = ½ ρ v² Cd A with ρ = 1.2250 kg/m³ (ISA sea level)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.rho_kg_m3, 1.225, { abs: 1e-4 }, 'density');
      assertClose(o.q_pa, 0.5 * o.rho_kg_m3 * (70 * MPH) ** 2, { rel: 1e-12 }, 'q');
      assertClose(o.force_n / LBF, 90.196, { abs: 0.001 }, 'drag');
      assertClose(o.power_w / HP, 16.837, { abs: 0.001 }, 'power');
    },
  },
  {
    name: 'Drag power grows with the cube of speed: twice the speed needs eight times the power',
    source: 'P = ½ ρ v³ Cd A',
    run: () => {
      const a = calculate({ speed_m_s: 20 }).outputs;
      const b = calculate({ speed_m_s: 40 }).outputs;
      assertClose(b.force_n / a.force_n, 4, { rel: 1e-12 }, 'force');
      assertClose(b.power_w / a.power_w, 8, { rel: 1e-12 }, 'power');
    },
  },
  {
    name: 'Racing cyclist, Cd 0.88 on 0.36 m², at 10 m/s in 1.225 kg/m³ air: 19.40 N and 194 W',
    source: 'Munson, Young and Okiishi, typical drag coefficients (racing bicycle 0.88 on 0.36 m²); hand calculation',
    run: () => {
      const o = calculate({ shape: 'cyclist_racing', area_m2: 0.36, speed_m_s: 10, air: 'density', density_kg_m3: 1.225 }).outputs;
      assertEqual(o.coef_used, SHAPES.cyclist_racing.cd, 'preset');
      assertClose(o.force_n, 19.404, { abs: 0.001 }, 'force');
      assertClose(o.power_w, 194.04, { abs: 0.01 }, 'power');
    },
  },
  {
    name: 'Lift: CL 0.3 on a 16.2 m² wing at 60 m/s in 1.225 kg/m³ air is 10 716 N; no drag power for lift',
    source: 'L = ½ ρ v² CL S',
    run: () => {
      const o = calculate({ force_type: 'lift', coef: 0.3, area_m2: 16.2, speed_m_s: 60, air: 'density', density_kg_m3: 1.225 }).outputs;
      assertClose(o.force_n, 10716.3, { abs: 0.01 }, 'lift');
      assertEqual(o.power_w, null, 'no power');
    },
  },
  {
    name: 'At 5 280 ft and 30 °C the density is 0.9588 kg/m³ and the drag 21.7 % lower than the sea-level standard',
    source: 'ASHRAE standard pressure p = 101 325 (1 − 2.25577e−5 Z)^5.2559 and ρ = p / (287.042 T)',
    run: () => {
      const hi = calculate({ altitude_m: 5280 * 0.3048, temp_c: 30 }).outputs;
      const sl = calculate({}).outputs;
      assertClose(hi.rho_kg_m3, 0.95875, { abs: 1e-4 }, 'density');
      assertClose(1 - hi.force_n / sl.force_n, 0.2174, { abs: 1e-3 }, 'reduction');
    },
  },
  {
    name: 'A zero area, a negative coefficient and an unknown body are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ area_m2: 0 }), 'Reference area');
      assertThrows(() => calculate({ coef: -1 }), 'Coefficient');
      assertThrows(() => calculate({ shape: 'brick' }), 'Body');
    },
  },
];
