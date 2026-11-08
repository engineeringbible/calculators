/**
 * carnot-cop/tests.js — checks against the Carnot relations and the first law.
 * Run: node run-tests.js carnot-cop
 */
import { calculate } from './calc.js';
import { assertClose, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Heat pump 35 °C from 0 °C: Carnot COP 308.15/35 = 8.804; at 50 %, 4.40; 2 kW in gives 8.80 kW of heat, 6.80 kW from outdoors',
    source: 'Çengel and Boles, Thermodynamics, eq. 6-21: COP_HP,rev = T_H/(T_H − T_L)',
    run: () => {
      const o = calculate({ machine: 'heatpump', hot_c: 35, cold_c: 0, fraction: 0.5, power_w: 2000 }).outputs;
      assertClose(o.carnot, 8.8043, { abs: 1e-4 }, 'Carnot');
      assertClose(o.real, 4.4021, { abs: 1e-4 }, 'real');
      assertClose(o.useful_w, 8804.3, { abs: 0.1 }, 'heat');
      assertClose(o.rejected_w, o.useful_w - 2000, { rel: 1e-12 }, 'source');
    },
  },
  {
    name: 'Refrigerator 5 °C inside, 35 °C outside: Carnot COP 278.15/30 = 9.27; COP_heating − COP_cooling = 1 for the same temperatures',
    source: 'Çengel and Boles, eq. 6-20: COP_R,rev = T_L/(T_H − T_L)',
    run: () => {
      const r = calculate({ machine: 'fridge', hot_c: 35, cold_c: 5 }).outputs;
      assertClose(r.carnot, 9.2717, { abs: 1e-4 }, 'Carnot');
      assertClose(calculate({ machine: 'heatpump', hot_c: 35, cold_c: 5 }).outputs.carnot - r.carnot, 1, { rel: 1e-12 }, 'difference');
    },
  },
  {
    name: 'Steam plant 550 °C to 30 °C: Carnot efficiency 1 − 303.15/823.15 = 63.2 %; 100 MW of heat at 60 % of Carnot gives 37.9 MW of work',
    source: 'Çengel and Boles, eq. 6-18: η_th,rev = 1 − T_L/T_H',
    run: () => {
      const o = calculate({ machine: 'engine', hot_c: 550, cold_c: 30, fraction: 0.6, power_w: 1e8 }).outputs;
      assertClose(o.carnot, 0.63172, { abs: 1e-5 }, 'η');
      assertClose(o.useful_w / 1e6, 37.903, { abs: 0.001 }, 'work');
      assertClose(o.rejected_w + o.useful_w, 1e8, { rel: 1e-12 }, 'first law');
    },
  },
  {
    name: 'A colder source lowers the heat pump COP: −10 °C gives a Carnot COP of 6.80 at 35 °C flow',
    source: 'COP = 308.15/45',
    run: () => {
      assertClose(calculate({ machine: 'heatpump', hot_c: 35, cold_c: -10 }).outputs.carnot, 6.8478, { abs: 1e-4 }, 'COP');
    },
  },
  {
    name: 'Hot side not above the cold side and a fraction above 1 are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ hot_c: 10, cold_c: 10 }), 'must be above the cold side');
      assertThrows(() => calculate({ fraction: 1.2 }), 'Fraction of Carnot');
    },
  },
];
