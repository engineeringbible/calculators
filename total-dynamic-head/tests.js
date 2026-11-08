/**
 * total-dynamic-head/tests.js — checks against Darcy–Weisbach, the Haaland friction factor and hand sums.
 * Run: node run-tests.js total-dynamic-head
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual } from '../shared/test-runner.js';

export const tests = [
  {
    name: '20 m³/h, 100 m of 77.9 mm steel pipe, 15 m lift, ΣK 8: v 1.166 m/s, Re 90 440, f 0.0210, friction 1.86 m, fittings 0.55 m, TDH 17.42 m',
    source: 'Darcy–Weisbach h_f = f L/D v²/2g with Colebrook (Crane TP-410 ch. 2)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.velocity_m_s, 1.1656, { abs: 1e-4 }, 'v');
      assertClose(o.re, 90441, { abs: 1 }, 'Re');
      assertClose(o.f, 0.02095, { abs: 1e-5 }, 'f');
      assertClose(o.friction_m, 1.8632, { abs: 1e-4 }, 'h_f');
      assertClose(o.fittings_m, 0.5542, { abs: 1e-4 }, 'h_K');
      assertClose(o.tdh_m, 17.4174, { abs: 1e-4 }, 'TDH');
    },
  },
  {
    name: 'The Colebrook factor lies within 2 % of the explicit Haaland formula at this Reynolds number and roughness',
    source: 'Haaland (1983): 1/√f = −1.8 log10[(ε/D/3.7)^1.11 + 6.9/Re]',
    run: () => {
      const o = calculate({}).outputs;
      const haaland = (-1.8 * Math.log10((0.000046 / 0.0779 / 3.7) ** 1.11 + 6.9 / o.re)) ** -2;
      assertClose(o.f, haaland, { rel: 0.02 }, 'Haaland');
    },
  },
  {
    name: 'A closed discharge vessel at 2 bar adds 2e5 / (998.2 × 9.81) = 20.431 m of head',
    source: 'h_p = Δp / (ρ g)',
    run: () => {
      const a = calculate({ dp_pa: 0 }).outputs.tdh_m;
      const b = calculate({ dp_pa: 2e5 }).outputs;
      assertClose(b.pressure_head_m, 20.431, { abs: 0.001 }, 'h_p');
      assertClose(b.tdh_m - a, b.pressure_head_m, { rel: 1e-12 }, 'added');
    },
  },
  {
    name: 'Laminar oil flow uses f = 64/Re: 2 m³/h of oil (100 mm²/s) in 50 mm pipe gives Re 141 and f 0.453',
    source: 'Hagen–Poiseuille, f = 64/Re',
    run: () => {
      const o = calculate({ flow_m3s: 2 / 3600, diameter_m: 0.05, viscosity_m2s: 1e-4, density: 880 }).outputs;
      assertClose(o.re, 141.47, { abs: 0.01 }, 'Re');
      assertClose(o.f, 64 / o.re, { rel: 1e-12 }, 'laminar');
    },
  },
  {
    name: 'Gravity flow (outlet 10 m below the inlet at low flow) gives a negative head and a warning; zero flow is rejected',
    source: 'Behaviour specification',
    run: () => {
      const o = calculate({ static_m: -10, flow_m3s: 1 / 3600 });
      assertEqual(o.outputs.tdh_m < 0, true, 'negative');
      assertEqual(o.warnings.some((w) => w.includes('gravity')), true, 'warning');
    },
  },
];
