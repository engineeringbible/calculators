/**
 * ideal-gas-law/tests.js — checks against the ideal-gas equation of state, the standard molar volume and the
 * ISO standard atmosphere.
 * Run: node run-tests.js ideal-gas-law
 */
import { calculate, solveIdealGas, R_J_MOL_K, GASES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'One mole at 0 °C and 101.325 kPa occupies 22.414 L, the standard molar volume',
    source: 'CODATA 2018: R = 8.314 462 618 J/(mol·K); molar volume of an ideal gas at 273.15 K and 101.325 kPa = 22.413 969 54 L/mol',
    run: () => {
      const { outputs } = calculate({ solve_for: 'volume', gas: 'nitrogen', pressure_pa: 101325, temperature_k: 273.15, amount_mol: 1 });
      assertClose(outputs.volume_out_m3, 0.02241396954, { rel: 1e-9 }, 'V');
      assertClose(outputs.molar_volume_m3, 22.41396954, { rel: 1e-9 }, 'molar volume per kmol');
    },
  },
  {
    name: 'Dry air at the ISO standard atmosphere (101.325 kPa, 15 °C) has a density of 1.225 kg/m³',
    source: 'ISO 2533:1975 Standard Atmosphere: ρ₀ = 1.2250 kg/m³ at sea level, 288.15 K',
    run: () => {
      const { outputs } = calculate({ solve_for: 'amount', gas: 'air', pressure_pa: 101325, volume_m3: 1, temperature_k: 288.15 });
      assertClose(outputs.density_kg_m3, 1.2250, { abs: 5e-4 }, 'ρ');
      assertClose(outputs.mass_kg, outputs.density_kg_m3, { rel: 1e-12 }, 'mass of 1 m³ equals the density');
    },
  },
  {
    name: 'Specific gas constants: air 287.05, nitrogen 296.80, CO₂ 188.92, hydrogen 4124.5 J/(kg·K)',
    source: 'Çengel and Boles, Thermodynamics, Table A-1 (R = R_u / M)',
    run: () => {
      const rOf = (gas) => calculate({ gas }).outputs.specific_constant;
      assertClose(rOf('air'), 287.05, { abs: 0.02 }, 'air');
      assertClose(rOf('nitrogen'), 296.80, { abs: 0.02 }, 'nitrogen');
      assertClose(rOf('co2'), 188.92, { abs: 0.02 }, 'CO₂');
      assertClose(rOf('hydrogen'), 4124.5, { abs: 0.5 }, 'hydrogen');
    },
  },
  {
    name: 'A 50 L nitrogen cylinder at 200 bar absolute and 15 °C holds 417.4 mol, 11.69 kg as an ideal gas, with a high-pressure warning',
    source: 'PV = nRT (Çengel and Boles, ch. 3); M(N₂) = 28.0134 g/mol (IUPAC 2021)',
    run: () => {
      const result = calculate({ solve_for: 'amount', gas: 'nitrogen', pressure_pa: 200e5, volume_m3: 0.05, temperature_k: 288.15 });
      assertClose(result.outputs.amount_out_mol, 417.39, { abs: 0.01 }, 'n');
      assertClose(result.outputs.mass_kg, 11.693, { abs: 0.001 }, 'm');
      assertEqual(result.warnings.some((w) => w.includes('compressibility')), true, 'warning');
    },
  },
  {
    name: 'Round trip: solving for each variable in turn returns the other three unchanged',
    source: 'Consistency of PV = nRT',
    run: () => {
      const all = { p: 350000, v: 0.2, t: 320, n: (350000 * 0.2) / (R_J_MOL_K * 320) };
      for (const variable of ['amount', 'pressure', 'volume', 'temperature']) {
        const key = { amount: 'n', pressure: 'p', volume: 'v', temperature: 't' }[variable];
        const known = { ...all };
        delete known[key];
        const got = solveIdealGas(variable, known);
        assertClose(got[key], all[key], { rel: 1e-12 }, `${variable}`);
      }
    },
  },
  {
    name: 'Heating a closed vessel: 1 bar at 20 °C rises to 1.341 bar at 120 °C (Gay-Lussac, P/T constant)',
    source: 'Çengel and Boles, ch. 3: P₁/T₁ = P₂/T₂ at constant V and n',
    run: () => {
      const n = calculate({ solve_for: 'amount', pressure_pa: 1e5, volume_m3: 1, temperature_k: 293.15 }).outputs.amount_out_mol;
      const hot = calculate({ solve_for: 'pressure', volume_m3: 1, temperature_k: 393.15, amount_mol: n }).outputs;
      assertClose(hot.pressure_out_pa, 1e5 * 393.15 / 293.15, { rel: 1e-12 }, 'P₂');
      assertClose(hot.pressure_out_pa / 1e5, 1.3411, { abs: 1e-4 }, 'bar');
    },
  },
  {
    name: 'Custom gas with M = 44.0095 g/mol matches the built-in CO₂; CO₂ below 31 °C warns about condensation',
    source: 'IUPAC 2021 molar mass of CO₂; critical temperature of CO₂ 304.13 K (NIST Chemistry WebBook)',
    run: () => {
      const custom = calculate({ gas: 'custom', molar_mass_g_mol: 44.0095 }).outputs;
      const builtIn = calculate({ gas: 'co2' }).outputs;
      assertClose(custom.mass_kg, builtIn.mass_kg, { rel: 1e-12 }, 'same mass');
      assertEqual(GASES.co2.molarMass, 0.0440095, 'table value');
      assertEqual(calculate({ gas: 'co2' }).warnings.some((w) => w.includes('critical temperature')), true, 'condensation warning');
    },
  },
  {
    name: 'Zero absolute temperature, zero volume and an unknown gas are rejected',
    source: 'Input validation contract (shared/validate.js)',
    run: () => {
      assertThrows(() => calculate({ solve_for: 'amount', temperature_k: 0 }), 'Temperature (absolute) must be greater than zero');
      assertThrows(() => calculate({ solve_for: 'pressure', volume_m3: 0 }), 'Volume must be greater than zero');
      assertThrows(() => calculate({ gas: 'xenon' }), 'Gas');
    },
  },
];
