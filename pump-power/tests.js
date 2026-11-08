/**
 * pump-power/tests.js — checks against P = ρ g Q H / η and the US BHP formula.
 * Run: node run-tests.js pump-power
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const GPM = 0.003785411784 / 60;

export const tests = [
  {
    name: '50 m³/h of water (998 kg/m³) against 30 m: hydraulic 4.08 kW, shaft 5.83 kW at 70 %, input 6.47 kW at 90 %, 7.5 kW motor',
    source: 'P_h = ρ g Q H; IEC 60072-1 rated outputs (5.5, 7.5 kW)',
    run: () => {
      const o = calculate({ flow_m3s: 50 / 3600, mode: 'head', head_m: 30, density: 998, eta_pump: 0.7, eta_motor: 0.9, margin: 0.1 }).outputs;
      assertClose(o.hydraulic_w, 4077.93, { abs: 0.01 }, 'hydraulic');
      assertClose(o.shaft_w, 5825.62, { abs: 0.01 }, 'shaft');
      assertClose(o.input_w, 6472.91, { abs: 0.01 }, 'input');
      assertEqual(o.motor.startsWith('7.5 kW'), true, 'motor');
    },
  },
  {
    name: 'US: 100 gpm against 100 ft at 60 % needs Q H SG / (3 960 η) = 4.20 hp brake horsepower',
    source: 'Hydraulic Institute BHP formula, SG 0.998',
    run: () => {
      const o = calculate({ flow_m3s: 100 * GPM, head_m: 100 * 0.3048, density: 998, eta_pump: 0.6 }).outputs;
      assertClose(o.shaft_w / 745.6999, (100 * 100 * 0.998) / (3960 * 0.6), { rel: 0.003 }, 'BHP (3 960 is a rounded constant)');
    },
  },
  {
    name: 'Pressure duty: 3 bar at 10 L/s is 3 kW of hydraulic power (Q Δp); head 30.6 m of water',
    source: 'P_h = Q Δp; H = Δp / (ρ g)',
    run: () => {
      const o = calculate({ mode: 'pressure', dp_pa: 3e5, flow_m3s: 0.01, density: 998 }).outputs;
      assertClose(o.hydraulic_w, 3000, { rel: 1e-12 }, 'P');
      assertClose(o.head_out_m, 30.65, { abs: 0.01 }, 'H');
    },
  },
  {
    name: 'Energy: 6.47 kW for 4 000 h is 25.9 MWh; at 0.15 per kWh, 3 884 a year',
    source: 'E = P t',
    run: () => {
      const o = calculate({ flow_m3s: 50 / 3600, head_m: 30, density: 998, eta_pump: 0.7, eta_motor: 0.9, hours: 4000, price_kwh: 0.15 }).outputs;
      assertClose(o.energy_j / 3.6e9, 25.892, { abs: 0.001 }, 'MWh');
      assertClose(o.cost, 3883.7, { abs: 0.1 }, 'cost');
    },
  },
  {
    name: 'A low pump efficiency warns; zero flow and an efficiency above 95 % are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ eta_pump: 0.3 }).warnings.length, 1, 'low');
      assertThrows(() => calculate({ flow_m3s: 0 }), 'Flow rate must be greater than zero');
      assertThrows(() => calculate({ eta_pump: 0.99 }), 'Pump efficiency');
    },
  },
];
