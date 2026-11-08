/**
 * density/tests.js — checks against ρ = m / V and published reference densities.
 * Run: node run-tests.js density
 */
import { calculate, MATERIALS, WATER_4C } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const LB_FT3 = 16.01846337396;

export const tests = [
  {
    name: '200 L of ethanol at 20 °C (0.7893 g/cm³) has a mass of 157.86 kg and a specific gravity of 0.789',
    source: 'CRC Handbook, density of ethanol at 20 °C; m = ρ V by hand',
    run: () => {
      const o = calculate({ solve: 'mass', material: 'ethanol', volume_m3: 0.2 }).outputs;
      assertClose(o.mass_out, 157.86, { abs: 1e-9 }, 'mass');
      assertClose(o.sg, 0.7893, { abs: 0.0001 }, 'SG');
    },
  },
  {
    name: 'Water at 4 °C is 62.43 lb/ft³ and at 20 °C 62.32 lb/ft³; carbon steel is 490 lb/ft³',
    source: 'Standard US values (62.4 lb/ft³ for water, 490 lb/ft³ for steel, AISC Manual)',
    run: () => {
      assertClose(calculate({ material: 'water_4' }).outputs.density_lb_ft3 / LB_FT3, 62.43, { abs: 0.005 }, 'water 4 °C');
      assertClose(calculate({ material: 'water_20' }).outputs.density_lb_ft3 / LB_FT3, 62.32, { abs: 0.005 }, 'water 20 °C');
      assertClose(MATERIALS.steel[1] / LB_FT3, 490, { rel: 0.002 }, 'steel');
    },
  },
  {
    name: 'Normal gas densities agree with M / 22.414 L/mol within the real-gas correction (under 0.7 %)',
    source: 'Ideal molar volume 22.414 L/mol at 0 °C and 1 atm (CODATA); IUPAC 2021 molar masses',
    run: () => {
      const m = { air: 28.9647, nitrogen: 28.0134, oxygen: 31.9988, co2: 44.0095, hydrogen: 2.01588, helium: 4.0026, argon: 39.948, methane: 16.0425 };
      for (const [id, M] of Object.entries(m)) assertClose(MATERIALS[id][1], M / 22.41397, { rel: 0.007 }, id);
    },
  },
  {
    name: 'Density from mass and volume: 7.85 kg in 1 L is 7 850 kg/m³; volume of 1 t of water at 20 °C is 1.0018 m³',
    source: 'ρ = m / V and V = m / ρ by hand',
    run: () => {
      assertClose(calculate({ solve: 'density', mass_kg: 7.85, volume_m3: 0.001 }).outputs.density_out, 7850, { rel: 1e-12 }, 'ρ');
      assertClose(calculate({ solve: 'volume', material: 'water_20', mass_kg: 1000 }).outputs.volume_out, 1000 / 998.2, { rel: 1e-12 }, 'V');
      assertClose(calculate({ solve: 'mass', material: 'custom', density_kg_m3: 1200, volume_m3: 2 }).outputs.mass_out, 2400, { rel: 1e-12 }, 'custom');
      assertClose(WATER_4C, 999.972, { abs: 1e-9 }, 'reference');
    },
  },
  {
    name: 'Gases warn about their reference state; zero volume, negative mass and an unknown material are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ material: 'co2' }).warnings.length, 1, 'gas warning');
      assertThrows(() => calculate({ volume_m3: 0 }), 'Volume V must be greater than zero');
      assertThrows(() => calculate({ solve: 'density', mass_kg: -1 }), 'Mass m');
      assertThrows(() => calculate({ material: 'kryptonite' }), 'Material');
    },
  },
];
