/**
 * mass-flow/tests.js — checks against continuity, Crane TP-410 velocity tables and the gas laws.
 * Run: node run-tests.js mass-flow
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const GPM = 0.003785411784 / 60;
const CFM = 0.028316846592 / 60;
const PSI = 6894.757293168;

export const tests = [
  {
    name: '500 Nm³/h of air: 646.1 kg/h; at 8 bar(a) and 20 °C 9.507 kg/m³, 67.97 m³/h, 40.0 ACFM, 9.62 m/s in 50 mm',
    source: 'Hand calculation: ρ = P M / (R T), ṁ = ρ_N Q_N, v = Q / A',
    run: () => {
      const o = calculate({ fluid: 'gas', given: 'standard', std_flow_m3_s: 500 / 3600, diameter_m: 0.05, molar_mass: 28.9644, pressure_pa: 8e5, temp_k: 293.15, z: 1, reference: 'normal' }).outputs;
      assertClose(o.mass_flow * 3600, 646.124, { abs: 0.001 }, 'kg/h');
      assertClose(o.density, 9.50671, { abs: 1e-5 }, 'ρ');
      assertClose(o.vol_flow * 3600, 67.965, { abs: 0.001 }, 'm³/h');
      assertClose(o.velocity, 9.6151, { abs: 0.0001 }, 'v');
    },
  },
  {
    name: '100 US gpm of water in 2 in Schedule 40 pipe (2.067 in bore) flows at 9.56 ft/s',
    source: 'Crane Technical Paper 410, v = 0.4085 Q/d² (gpm, in) and its flow table for 2 in Schedule 40',
    run: () => {
      const o = calculate({ fluid: 'liquid', given: 'actual', vol_flow_m3_s: 100 * GPM, diameter_m: 2.067 * 0.0254, density_kg_m3: 998.2 }).outputs;
      assertClose(o.velocity / 0.3048, 9.56, { abs: 0.005 }, 'ft/s');
      assertClose(o.mass_flow, 100 * GPM * 998.2, { rel: 1e-12 }, 'ṁ');
    },
  },
  {
    name: 'Dry air at 60 °F and 14.696 psia is 1.2226 kg/m³ (0.0763 lb/ft³); at 0 °C and 1 atm 1.2922 kg/m³, within 0.1 % of the real 1.2929',
    source: 'Ideal gas with M = 28.9644 g/mol (ISO 2533); CRC normal density of air 1.2929 kg/m³',
    run: () => {
      const us = calculate({ fluid: 'gas', given: 'mass', mass_flow_kg_s: 1, reference: 'us' }).outputs;
      assertClose(us.std_density, 1.22260, { abs: 1e-4 }, 'SCF air');
      assertClose(us.std_density / 16.01846337396, 0.0763, { abs: 0.0001 }, 'lb/ft³');
      assertClose(calculate({ fluid: 'gas', given: 'mass', reference: 'normal' }).outputs.std_density, 1.2929, { rel: 1e-3 }, 'normal');
    },
  },
  {
    name: '100 ACFM of air at 100 psig and 60 °F is 780.5 SCFM; Z = 0.9 at the same conditions gives 867.2 SCFM',
    source: 'Q_std = Q (P / P_std)(T_std / T) / Z by hand (14.696 psia atmosphere)',
    run: () => {
      const base = { fluid: 'gas', given: 'actual', vol_flow_m3_s: 100 * CFM, pressure_pa: 114.696 * PSI, temp_k: 288.7055556, reference: 'us' };
      assertClose(calculate(base).outputs.scfm / CFM, 780.46, { abs: 0.01 }, 'SCFM');
      assertClose(calculate({ ...base, z: 0.9 }).outputs.scfm / CFM, 867.18, { abs: 0.01 }, 'SCFM, Z 0.9');
    },
  },
  {
    name: 'Velocity input round-trips: 2 m/s in a 100 mm bore is 56.55 m³/h and back',
    source: 'Q = v π D² / 4 by hand',
    run: () => {
      const o = calculate({ fluid: 'liquid', given: 'velocity', velocity_m_s: 2, diameter_m: 0.1 }).outputs;
      assertClose(o.vol_flow * 3600, 56.549, { abs: 0.001 }, 'Q');
      assertClose(calculate({ given: 'mass', mass_flow_kg_s: o.mass_flow, diameter_m: 0.1 }).outputs.velocity, 2, { rel: 1e-12 }, 'v');
    },
  },
  {
    name: 'Standard flow of a liquid is refused; a fast liquid warns; zero diameter is rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ fluid: 'liquid', given: 'standard' }), 'applies to gases');
      assertEqual(calculate({ given: 'velocity', velocity_m_s: 4 }).warnings.length, 1, 'fast');
      assertThrows(() => calculate({ diameter_m: 0 }), 'Pipe inside diameter D must be greater than zero');
    },
  },
];
