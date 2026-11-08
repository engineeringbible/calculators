/**
 * mass-balance/tests.js — checks against a textbook mixing-unit example and hand calculations of the balances.
 * Run: node run-tests.js mass-balance
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const C = (c) => c + 273.15;

export const tests = [
  {
    name: '200 g of 40 wt% methanol mixed with 150 g of 70 wt% methanol gives 350 g of 52.9 wt% methanol',
    source: 'Felder and Rousseau, Elementary Principles of Chemical Processes, 3rd ed., ch. 4, balances on a mixing unit',
    run: () => {
      const o = calculate({ mode: 'mix', streams: '2', m1_kg_s: 0.2, x1: 0.4, m2_kg_s: 0.15, x2: 0.7 }).outputs;
      assertClose(o.m_mix, 0.35, { rel: 1e-12 }, 'mass');
      assertClose(o.x_mix, 0.529, { abs: 0.0005 }, 'fraction');
    },
  },
  {
    name: '1 000 kg/h of 26 % brine diluted to 10 % needs 1 600 kg/h of water and gives 2 600 kg/h',
    source: 'Component balance by hand: ṁ2 = ṁ1 (x1 − x_t) / (x_t − x2)',
    run: () => {
      const o = calculate({ mode: 'required', target: 'conc', m1_kg_s: 1000 / 3600, x1: 0.26, x2: 0, x_target: 0.1 }).outputs;
      assertClose(o.m2_req * 3600, 1600, { rel: 1e-12 }, 'water');
      assertClose(o.m_mix * 3600, 2600, { rel: 1e-12 }, 'product');
      assertClose(o.x_mix, 0.1, { rel: 1e-12 }, 'check');
    },
  },
  {
    name: 'Three streams of 100, 200 and 300 kg/h at 10, 20 and 30 % and 10, 20 and 30 °C mix to 600 kg/h at 23.33 % and 23.33 °C',
    source: 'Flow-weighted means by hand (equal c_p)',
    run: () => {
      const o = calculate({ streams: '3', m1_kg_s: 100 / 3600, x1: 0.1, t1_k: C(10), m2_kg_s: 200 / 3600, x2: 0.2, t2_k: C(20), m3_kg_s: 300 / 3600, x3: 0.3, t3_k: C(30) }).outputs;
      assertClose(o.m_mix * 3600, 600, { rel: 1e-12 }, 'flow');
      assertClose(o.x_mix, 0.233333, { abs: 1e-6 }, 'x');
      assertClose(o.t_mix - 273.15, 23.3333, { abs: 1e-4 }, 'T');
    },
  },
  {
    name: 'Energy balance with different c_p: 1 kg/s of water at 80 °C and 2 kg/s of oil (2.0 kJ/(kg·K)) at 20 °C mix at 50.68 °C',
    source: 'Felder and Rousseau ch. 8: adiabatic mixing with constant c_p, by hand',
    run: () => {
      const o = calculate({ m1_kg_s: 1, t1_k: C(80), cp1: 4186, m2_kg_s: 2, t2_k: C(20), cp2: 2000 }).outputs;
      assertClose(o.t_mix - 273.15, 50.682, { abs: 0.001 }, 'T');
    },
  },
  {
    name: 'Required cold stream: 1 kg/s at 60 °C cooled to 40 °C by water at 10 °C needs 0.667 kg/s',
    source: 'Energy balance by hand: ṁ2 = ṁ1 c_p1 (T1 − T_t) / (c_p2 (T_t − T2))',
    run: () => {
      const o = calculate({ mode: 'required', target: 'temp', m1_kg_s: 1, t1_k: C(60), t2_k: C(10), t_target_k: C(40) }).outputs;
      assertClose(o.m2_req, 2 / 3, { rel: 1e-12 }, 'flow');
      assertClose(o.t_mix, C(40), { abs: 1e-9 }, 'check');
    },
  },
  {
    name: 'A target outside the two streams, a target equal to stream 2 and no flow at all are rejected; large temperature spreads warn',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ mode: 'required', x1: 0.1, x2: 0, x_target: 0.2 }), 'must lie between');
      assertThrows(() => calculate({ mode: 'required', x2: 0.05, x_target: 0.05 }), 'no finite flow');
      assertThrows(() => calculate({ m1_kg_s: 0, m2_kg_s: 0 }), 'at least one stream');
      assertEqual(calculate({ t1_k: C(90), t2_k: C(10) }).warnings.length, 1, 'spread');
    },
  },
];
