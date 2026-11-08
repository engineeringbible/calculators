/**
 * heat-loss/tests.js — checks against hand calculations of Σ U A ΔT and the ventilation loss.
 * Run: node run-tests.js heat-loss
 */
import { calculate, parseElements } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const B = 0.29307107017;

export const tests = [
  {
    name: 'Default house, ΔT 24 K: fabric 87.4 W/K = 2 098 W, ventilation 0.336 × 0.5 × 150 × 24 = 606 W, total 2 703 W; walls are the largest loss',
    source: 'EN 12831-1: Φ = Σ U A ΔT + ρ c_p n V ΔT / 3600',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.fabric_w, 2097.6, { abs: 0.01 }, 'fabric');
      assertClose(outputs.vent_w, 605.61, { abs: 0.01 }, 'ventilation');
      assertClose(outputs.total_w, 2703.21, { abs: 0.01 }, 'total');
      assertEqual(outputs.largest.startsWith('Walls'), true, 'largest');
    },
  },
  {
    name: 'US units: 1 000 ft² of R13 wall and 150 ft² of U-0.30 windows at 70 °F inside and 20 °F outside lose 6 096 Btu/h',
    source: 'ASHRAE Fundamentals Ch. 18: q = U A ΔT with U = 1/R; (1 000/13 + 150 × 0.30) × 50 = 6 096 Btu/h',
    run: () => {
      const o = calculate({ units: 'ip', elements: 'Wall; 1000; R13\nWindow; 150; 0.30', inside_c: (70 - 32) / 1.8, outside_c: (20 - 32) / 1.8, volume_m3: 0, ach: 0 }).outputs;
      assertClose(o.total_btu_w / B, 6096.2, { abs: 0.2 }, 'Btu/h');
    },
  },
  {
    name: 'Ventilation constant: 100 cfm at 50 °F difference is 1.08 × 100 × 50 = 5 400 Btu/h within 0.5 %; heat recovery of 80 % removes 80 % of it',
    source: 'ASHRAE sensible heat formula q = 1.08 × cfm × ΔT (standard air)',
    run: () => {
      const v = 100 * 0.028316846592 * 60; // m³ moved per hour; with 1 ACH the volume equals it
      const base = { elements: 'Tiny; 0.001; 0.001', volume_m3: v, ach: 1, inside_c: (70 - 32) / 1.8, outside_c: (20 - 32) / 1.8 };
      assertClose(calculate(base).outputs.vent_w / B, 5400, { rel: 0.005 }, '1.08 rule');
      assertClose(calculate({ ...base, recovery: 0.8 }).outputs.vent_w, 0.2 * calculate(base).outputs.vent_w, { rel: 1e-12 }, 'recovery');
    },
  },
  {
    name: 'Degree-days: H 112.63 W/K × 2 500 K·day × 24 h = 6 758 kWh a year; the parser reads R-values and tabs',
    source: 'CIBSE Guide A degree-day method: E = H × HDD × 24',
    run: () => {
      assertClose(calculate({ hdd: 2500 }).outputs.annual_kwh, 6758.03, { abs: 0.01 }, 'kWh');
      const e = parseElements('Wall\t10\tR-2.5', 'si');
      assertClose(e[0].u, 0.4, { rel: 1e-12 }, 'R to U');
    },
  },
  {
    name: 'Outdoor not below indoor, bad lines and an implausible wall U-value are caught',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ outside_c: 25 }), 'must be below the indoor temperature');
      assertThrows(() => calculate({ elements: 'Wall; ten; 0.3' }), 'line 1');
      assertThrows(() => calculate({ elements: 'Wall; 10' }), 'line 1');
      assertEqual(calculate({ elements: 'Wall; 10; 5' }).warnings.length, 1, 'U above 3');
    },
  },
];
