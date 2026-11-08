/**
 * alternative-fuel-tanks/tests.js — energy equivalence, volumes, tank capacity and the fuel comparison.
 * Run: node run-tests.js alternative-fuel-tanks
 */
import { calculate, FUELS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '1000 t of MGO (42.7 MJ/kg) carry 42 700 GJ, the energy of 2145.73 t of methanol (19.9 MJ/kg), 2696.7 m³ at 795.7 kg/m³',
    source: 'FuelEU Maritime Annex II LCVs (EC guidance Table 4.2); NIST SRD 69 methanol density at 15 °C',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.energy_gj, 42700, { rel: 1e-12 }, 'energy');
      assertClose(outputs.fuel_mass_t, 42700 / 19.9, { rel: 1e-12 }, 'methanol mass');
      assertClose(outputs.fuel_volume_m3, 2696.7, { abs: 0.05 }, 'methanol volume');
      assertClose(outputs.volume_ratio, (42.7 * 860) / (19.9 * 795.7), { rel: 1e-12 }, 'volume ratio = energy density ratio');
    },
  },
  {
    name: 'Liquid hydrogen needs 4.32 times the volume of MGO at 860 kg/m³ but only 0.356 times the mass',
    source: 'LCV 120 MJ/kg (FuelEU Annex II); saturated liquid H₂ at 1 atm 70.85 kg/m³ (NIST SRD 69)',
    run: () => {
      const { outputs } = calculate({ fuel: 'lh2' });
      assertClose(outputs.volume_ratio, (42.7 * 860) / (120 * 70.85), { rel: 1e-12 }, 'volume ratio');
      assertClose(outputs.volume_ratio, 4.32, { abs: 0.005 }, 'value');
      assertClose(outputs.mass_ratio, 42.7 / 120, { rel: 1e-12 }, 'mass ratio');
    },
  },
  {
    name: 'Tank capacity is the fuel volume over the usable fraction: 98 % filling limit less 2 % unpumpable gives V / 0.96',
    source: 'IGF Code 6.8 filling limit; usable volume = filling limit − unpumpable',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.tank_capacity_m3, outputs.fuel_volume_m3 / 0.96, { rel: 1e-12 }, 'capacity');
      const heel = calculate({ fill_limit_pct: 95, unpumpable_pct: 10 }).outputs;
      assertClose(heel.tank_capacity_m3, heel.fuel_volume_m3 / 0.85, { rel: 1e-12 }, 'with heel');
    },
  },
  {
    name: 'A machinery efficiency 5 % lower on the alternative fuel raises its mass and volume by 1/0.95',
    source: 'Same work: m = E / (η_rel × LCV)',
    run: () => {
      const base = calculate({ fuel: 'nh3_refrigerated' }).outputs;
      const lower = calculate({ fuel: 'nh3_refrigerated', relative_efficiency: 0.95 }).outputs;
      assertClose(lower.fuel_mass_t / base.fuel_mass_t, 1 / 0.95, { rel: 1e-12 }, 'mass');
      assertClose(lower.fuel_volume_m3 / base.fuel_volume_m3, 1 / 0.95, { rel: 1e-12 }, 'volume');
    },
  },
  {
    name: 'Every row of the comparison carries the same energy, and its energy density is LCV × ρ',
    source: 'E = m × LCV for each fuel',
    run: () => {
      const { outputs } = calculate({ reference_fuel: 'hfo', reference_mass_t: 2500, reference_density_kg_m3: 975 });
      assertEqual(outputs.comparison_table.rows.length, Object.keys(FUELS).length + 1, 'rows');
      outputs.comparison_table.rows.forEach((r) => {
        assertClose(r[4] * r[1], 2500 * 40.5, { rel: 1e-12 }, `energy of ${r[0]}`);
        assertClose(r[3], (r[1] * r[2]) / 1000, { rel: 1e-12 }, `energy density of ${r[0]}`);
      });
    },
  },
  {
    name: 'A custom fuel with the properties of a listed fuel gives the same result',
    source: 'Consistency of the custom path',
    run: () => {
      const listed = calculate({ fuel: 'lpg_refrigerated' }).outputs;
      const custom = calculate({ fuel: 'custom', custom_lcv_mj_kg: 46, custom_density_kg_m3: 580.9 }).outputs;
      assertClose(custom.tank_capacity_m3, listed.tank_capacity_m3, { rel: 1e-12 }, 'capacity');
    },
  },
  {
    name: 'Invalid inputs are rejected: an unpumpable volume above the filling limit, an unknown fuel, zero quantity',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ fill_limit_pct: 60, unpumpable_pct: 60 }), 'smaller than the filling limit');
      assertThrows(() => calculate({ fuel: 'coal' }), 'must be one of');
      assertThrows(() => calculate({ reference_mass_t: 0 }), 'greater than zero');
    },
  },
];
