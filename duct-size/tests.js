/**
 * duct-size/tests.js — checks against the ASHRAE friction chart, the Huebscher table and explicit friction formulas.
 * Run: node run-tests.js duct-size
 */
import { calculate, colebrook, equivalentDiameter, otherSide, frictionRate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const CFM = 0.028316846592 / 60;
const IN = 0.0254;
const G = 249.0889 / 30.48;

export const tests = [
  {
    name: '1 000 cfm at 0.10 in. w.c./100 ft: 13.65 in round at 983 ft/min, next standard 14 in (400 mm); the friction at that size is the target',
    source: 'ASHRAE Fundamentals Ch. 21, Darcy–Weisbach and Colebrook, galvanized ε = 0.09 mm, standard air',
    run: () => {
      const { outputs } = calculate({ flow_m3s: 1000 * CFM, method: 'friction', friction_pa_m: 0.1 * G, roughness_m: 0.00009 });
      assertClose(outputs.diameter_m / IN, 13.65, { abs: 0.01 }, 'D');
      assertClose(outputs.velocity_out_m_s / 0.00508, 983, { abs: 1 }, 'V');
      assertEqual(outputs.round_in, '14 in', 'standard');
      assertEqual(outputs.round_mm, '400 mm', 'metric');
      assertClose(outputs.friction_out_pa_m / G, 0.1, { rel: 1e-6 }, 'friction');
    },
  },
  {
    name: 'Friction chart readings at 0.1 in./100 ft: 100 cfm → 6 in, 400 cfm → 10 in, 2 000 cfm → 18 in standard round',
    source: 'ASHRAE Fundamentals Ch. 21 Fig. 10 (friction chart, galvanized round duct), read to the next standard size',
    run: () => {
      [[100, '6 in'], [400, '10 in'], [2000, '18 in']].forEach(([c, s]) => assertEqual(calculate({ flow_m3s: c * CFM, friction_pa_m: 0.1 * G }).outputs.round_in, s, `${c} cfm`));
    },
  },
  {
    name: 'Colebrook agrees with the explicit Haaland formula within 1.5 % at Re 1e5 and ε/D 1e-4; laminar flow gives 64/Re',
    source: 'Haaland (1983), J. Fluids Eng. 105(1): 1/√f = −1.8 log[(ε/D/3.7)^1.11 + 6.9/Re]',
    run: () => {
      const haaland = (-1.8 * Math.log10((1e-4 / 3.7) ** 1.11 + 6.9 / 1e5)) ** -2;
      assertClose(colebrook(1e5, 1e-4), haaland, { rel: 0.015 }, 'turbulent');
      assertClose(colebrook(1000, 1e-4), 0.064, { rel: 1e-12 }, 'laminar');
    },
  },
  {
    name: 'Velocity method: 1 000 cfm at 900 ft/min needs 14.27 in; Huebscher 12 × 12 in = 13.1 in round and the inverse returns 12 in',
    source: 'A = Q / V; ASHRAE Fundamentals Ch. 21 eq. (25) and Table 2 (12 × 12 in → 13.1 in)',
    run: () => {
      assertClose(calculate({ flow_m3s: 1000 * CFM, method: 'velocity', velocity_m_s: 900 * 0.00508 }).outputs.diameter_m / IN, 14.27, { abs: 0.01 }, 'D');
      assertClose(equivalentDiameter(12, 12), 13.1, { abs: 0.05 }, 'De');
      assertClose(otherSide(12 * IN, equivalentDiameter(12 * IN, 12 * IN)) / IN, 12, { abs: 1e-6 }, 'inverse');
      assertEqual(frictionRate(1000 * CFM, 0.4, 0.00009) < frictionRate(1000 * CFM, 0.3, 0.00009), true, 'bigger duct, less friction');
    },
  },
  {
    name: 'A fixed side too small warns; an extreme aspect ratio warns; zero airflow and unknown methods are rejected',
    source: 'Behaviour specification; validation contract',
    run: () => {
      assertEqual(calculate({ flow_m3s: 5000 * CFM, side_a_m: 3 * IN }).warnings.some((w) => w.includes('Aspect ratio') || w.includes('too small')), true, 'narrow');
      assertThrows(() => calculate({ flow_m3s: 0 }), 'Airflow must be greater than zero');
      assertThrows(() => calculate({ method: 'static' }), 'Size by');
    },
  },
];
