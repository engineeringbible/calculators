/**
 * mah-to-wh/tests.js — checks against E = Q V and the IATA passenger limits.
 * Run: node run-tests.js mah-to-wh
 */
import { calculate, airlineStatus } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const wh = (j) => convert(j, 'J', 'Wh', 'energy');
const mah = (c) => convert(c, 'C', 'mAh', 'electric_charge');

export const tests = [
  {
    name: '3000 mAh at 3.7 V is 11.1 Wh (3 Ah)',
    source: 'Linden\'s Handbook of Batteries, ch. 1: energy = capacity × nominal voltage',
    run: () => {
      const { outputs } = calculate({ mode: 'to_energy', capacity_c: convert(3000, 'mAh', 'C', 'electric_charge'), voltage_v: 3.7 });
      assertClose(wh(outputs.energy_out_j), 11.1, { rel: 1e-12 }, 'Wh');
      assertClose(convert(outputs.capacity_ah_c, 'C', 'Ah', 'electric_charge'), 3, { rel: 1e-12 }, 'Ah');
    },
  },
  {
    name: 'A 100 Ah, 12 V lead-acid battery stores 1.2 kWh; 1.2 kWh at 12 V is back to 100 Ah',
    source: 'E = Q V; Q = E / V',
    run: () => {
      const e = calculate({ mode: 'to_energy', capacity_c: convert(100, 'Ah', 'C', 'electric_charge'), voltage_v: 12 }).outputs.energy_out_j;
      assertClose(convert(e, 'J', 'kWh', 'energy'), 1.2, { rel: 1e-12 }, 'kWh');
      const q = calculate({ mode: 'to_capacity', energy_j: e, voltage_v: 12 }).outputs.capacity_out_c;
      assertClose(convert(q, 'C', 'Ah', 'electric_charge'), 100, { rel: 1e-12 }, 'Ah');
    },
  },
  {
    name: 'Airline limits: 99.9 Wh free, 100 Wh free, 100.1 Wh needs approval, 160 Wh needs approval, 160.1 Wh not allowed',
    source: 'IATA Dangerous Goods Regulations, Table 2.3.A, lithium-ion batteries carried by passengers',
    run: () => {
      assertEqual(airlineStatus(99.9).startsWith('Allowed'), true, '99.9');
      assertEqual(airlineStatus(100).startsWith('Allowed'), true, '100');
      assertEqual(airlineStatus(100.1).startsWith('Needs'), true, '100.1');
      assertEqual(airlineStatus(160).startsWith('Needs'), true, '160');
      assertEqual(airlineStatus(160.1).startsWith('Not allowed'), true, '160.1');
    },
  },
  {
    name: 'A 20 000 mAh power bank at 3.7 V is 74 Wh, allowed; 27 000 mAh is 99.9 Wh, just under the limit',
    source: 'IATA Lithium Battery Guidance Document (power banks)',
    run: () => {
      const a = calculate({ mode: 'to_energy', capacity_c: convert(20000, 'mAh', 'C', 'electric_charge'), voltage_v: 3.7 }).outputs;
      assertClose(wh(a.energy_out_j), 74, { rel: 1e-12 }, '74 Wh');
      const b = calculate({ mode: 'to_energy', capacity_c: convert(27000, 'mAh', 'C', 'electric_charge'), voltage_v: 3.7 }).outputs;
      assertClose(wh(b.energy_out_j), 99.9, { rel: 1e-12 }, '99.9 Wh');
      assertEqual(b.airline.startsWith('Allowed'), true, 'allowed');
    },
  },
  {
    name: 'A 100 Wh LiFePO4 pack at 12.8 V holds 7812.5 mAh; zero voltage is rejected',
    source: 'Q = E / V; LiFePO4 4 cells × 3.2 V; validation contract',
    run: () => {
      const q = calculate({ mode: 'to_capacity', energy_j: 360000, voltage_v: 12.8 }).outputs.capacity_out_c;
      assertClose(mah(q), 7812.5, { rel: 1e-12 }, 'mAh');
      assertThrows(() => calculate({ voltage_v: 0 }), 'Nominal voltage must be greater than zero');
    },
  },
];
