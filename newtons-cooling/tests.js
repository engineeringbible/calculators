/**
 * newtons-cooling/tests.js — checks against Incropera Example 5.1, the exponential solution, a two-reading fit and
 * the Biot-number criterion.
 * Run: node run-tests.js newtons-cooling
 */
import { calculate, geometry } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const bead = { tau_from: 'lumped', shape: 'sphere', diameter_m: 0.706e-3, density: 8500, cp: 400, k: 20, h: 400, t0_c: 25, tinf_c: 200 };

export const tests = [
  {
    name: 'Incropera Example 5.1: thermocouple bead 0.706 mm has τ = 1 s, Bi = 2.35 × 10⁻³, and reaches 199 °C from 25 °C in 5.2 s',
    source: 'Incropera et al., Fundamentals of Heat and Mass Transfer, 7th ed., Example 5.1 (D, τ and t); Bi = h (D/6)/k by hand',
    run: () => {
      const o = calculate({ ...bead, find: 'time', t_target_c: 199 }).outputs;
      assertClose(o.tau_out_s, 1.0, { abs: 0.005 }, 'τ');
      assertClose(o.biot, 2.35e-3, { abs: 0.01e-3 }, 'Bi');
      assertClose(o.time_out_s, 5.2, { abs: 0.05 }, 't');
      assertEqual(o.validity.includes('valid'), true, 'lumped valid');
    },
  },
  {
    name: 'After one time constant 36.8 % of the initial difference remains; the difference halves in τ ln 2',
    source: "Newton's law of cooling T = T∞ + (T0 − T∞) e^(−t/τ) (Incropera eq. 5.6)",
    run: () => {
      const o = calculate({ tau_from: 'direct', tau_s: 600, t0_c: 90, tinf_c: 20, find: 'temperature', time_s: 600 }).outputs;
      assertClose(o.temp_c, 20 + 70 * Math.exp(-1), { rel: 1e-12 }, 'T(τ)');
      assertClose(o.half_s, 600 * Math.LN2, { rel: 1e-12 }, 'half time');
      const h = calculate({ tau_from: 'direct', tau_s: 600, t0_c: 90, tinf_c: 20, find: 'time', t_target_c: 55 }).outputs;
      assertClose(h.time_out_s, 600 * Math.LN2, { rel: 1e-12 }, 'time to 55 °C');
    },
  },
  {
    name: 'Two readings: coffee 90 °C falls to 70 °C in 10 min in a 20 °C room, so τ = 10 / ln(70/50) = 29.7 min and it is 45.5 °C after 30 min',
    source: 'τ = t1 / ln[(T0 − T∞)/(T1 − T∞)] (hand calculation)',
    run: () => {
      const o = calculate({ tau_from: 'measured', t0_c: 90, tinf_c: 20, t_meas_s: 600, t_meas_c: 70, find: 'temperature', time_s: 1800 }).outputs;
      assertClose(o.tau_out_s / 60, 10 / Math.log(70 / 50), { rel: 1e-12 }, 'τ');
      assertClose(o.temp_c, 45.51, { abs: 0.01 }, 'T(30 min)');
      const back = calculate({ tau_from: 'measured', t0_c: 90, tinf_c: 20, t_meas_s: 600, t_meas_c: 70, find: 'time', t_target_c: 70 }).outputs;
      assertClose(back.time_out_s, 600, { rel: 1e-9 }, 'reproduces the reading');
    },
  },
  {
    name: 'Geometry and Biot: a 100 mm steel ball (k 50) quenched in water at h = 1 000 has Bi = 0.33 and warns; cylinder V and A by hand',
    source: 'Bi = h (V/A)/k with V/A = D/6 for a sphere; Incropera Section 5.2 criterion Bi < 0.1',
    run: () => {
      const r = calculate({ tau_from: 'lumped', shape: 'sphere', diameter_m: 0.1, density: 7850, cp: 470, k: 50, h: 1000, t0_c: 800, tinf_c: 20 });
      assertClose(r.outputs.biot, 1000 * (0.1 / 6) / 50, { rel: 1e-12 }, 'Bi');
      assertEqual(r.warnings.length, 1, 'warning');
      const g = geometry('cylinder', 0.02, 0.5, 0, 0);
      assertClose(g.v, Math.PI * 0.01 ** 2 * 0.5, { rel: 1e-12 }, 'V');
      assertClose(g.a, 2 * Math.PI * 0.01 * 0.5 + 2 * Math.PI * 0.01 ** 2, { rel: 1e-12 }, 'A');
    },
  },
  {
    name: 'Heating works the same way: a 4 °C drink in a 24 °C room with τ = 1 h reaches 14 °C in 41.6 min; heat gained is m c ΔT',
    source: "Newton's law of cooling applied to warming (hand calculation)",
    run: () => {
      const o = calculate({ tau_from: 'direct', tau_s: 3600, t0_c: 4, tinf_c: 24, find: 'time', t_target_c: 14 }).outputs;
      assertClose(o.time_out_s / 60, 60 * Math.LN2, { rel: 1e-12 }, 'time');
      const b = calculate({ ...bead, find: 'temperature', time_s: 1 }).outputs;
      assertClose(b.heat_j, b.mass_kg * 400 * (b.temp_c - 25), { rel: 1e-12 }, 'heat');
    },
  },
  {
    name: 'Invalid input: a target beyond T∞, a second reading on the wrong side and a zero diameter are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ ...bead, find: 'time', t_target_c: 210 }), 'Target temperature');
      assertThrows(() => calculate({ tau_from: 'measured', t0_c: 90, tinf_c: 20, t_meas_c: 95 }), 'second reading');
      assertThrows(() => calculate({ ...bead, diameter_m: 0 }), 'Diameter');
    },
  },
];
