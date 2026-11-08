/**
 * wind-turbine-power/tests.js — checks against P = ½ ρ A v³ Cp, the Betz limit, the ISO 2533 atmosphere and the
 * Rayleigh moments.
 * Run: node run-tests.js wind-turbine-power
 */
import { calculate, rayleighMeanPower, rayleighExceed, BETZ } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '3 m rotor at 6 m/s, 1.225 kg/m³, Cp 0.35: A = 7.069 m², 327.3 W; rated 2 017 W at 11 m/s',
    source: 'Hand calculation: P = ½ ρ A v³ Cp',
    run: () => {
      const o = calculate({ diameter_m: 3, speed_m_s: 6, cp: 0.35, density_mode: 'entered', density: 1.225, rated_m_s: 11 }).outputs;
      assertClose(o.area_m2, 7.06858, { abs: 1e-5 }, 'A');
      assertClose(o.power_w, 0.5 * 1.225 * 7.0685835 * 216 * 0.35, { rel: 1e-7 }, 'P');
      assertClose(o.rated_w, 2016.90, { abs: 0.01 }, 'rated');
    },
  },
  {
    name: 'Wind power density at 10 m/s and 1.225 kg/m³ is 612.5 W/m²; the Betz limit is 16/27 of it, 363.0 W/m²',
    source: 'Manwell, McGowan and Rogers, Wind Energy Explained, 2nd ed., ch. 2 (P/A = ½ ρ v³) and ch. 3 (Cp,max = 16/27)',
    run: () => {
      const o = calculate({ diameter_m: 2 / Math.sqrt(Math.PI), speed_m_s: 10, density_mode: 'entered', density: 1.225, rated_m_s: 12 }).outputs;
      assertClose(o.wind_power_w, 612.5, { rel: 1e-9 }, 'P/A');
      assertClose(o.betz_w, 612.5 * 16 / 27, { rel: 1e-9 }, 'Betz');
      assertClose(BETZ, 0.592593, { abs: 1e-6 }, '16/27');
    },
  },
  {
    name: 'ISO 2533 standard atmosphere: 1.2250 kg/m³ at sea level, 1.1117 at 1 000 m, 1.0066 at 2 000 m',
    source: 'ISO 2533:1975 Standard Atmosphere, tabulated density',
    run: () => {
      assertClose(calculate({ density_mode: 'isa', altitude_m: 0 }).outputs.density_out, 1.225, { abs: 1e-4 }, '0 m');
      assertClose(calculate({ density_mode: 'isa', altitude_m: 1000 }).outputs.density_out, 1.1117, { abs: 1e-4 }, '1 000 m');
      assertClose(calculate({ density_mode: 'isa', altitude_m: 2000 }).outputs.density_out, 1.0066, { abs: 1e-4 }, '2 000 m');
      assertClose(calculate({ density_mode: 'temp', altitude_m: 0, temp_c: 0 }).outputs.density_out, 101325 / (287.05287 * 273.15), { rel: 1e-9 }, '0 °C at sea level');
    },
  },
  {
    name: 'Rayleigh: the mean of v³ is (6/π) v̄³ (energy pattern factor 1.91); P(v > v̄) = exp(−π/4) = 0.456',
    source: 'Manwell, McGowan and Rogers, Wind Energy Explained, 2nd ed., ch. 2 (Rayleigh distribution)',
    run: () => {
      assertClose(rayleighMeanPower(1, 5, 0, 60, 60), (6 / Math.PI) * 125, { rel: 1e-6 }, 'v³ moment');
      assertClose(rayleighExceed(5, 5), Math.exp(-Math.PI / 4), { rel: 1e-12 }, 'exceedance');
      assertClose(calculate({}).outputs.resource_w_m2, (6 / Math.PI) * 0.5 * 1.225 * 125, { rel: 1e-6 }, 'power density');
    },
  },
  {
    name: 'Default turbine on a 5 m/s Rayleigh site: 338 W mean, 2 962 kWh a year, capacity factor 16.8 %, running 75.4 % of the year',
    source: 'Numerical integration of the idealised power curve (Simpson, checked against the analytical moment above)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.mean_power_w, 338.08, { abs: 0.01 }, 'mean');
      assertClose(o.energy_j / 3.6e6, 2961.6, { abs: 0.1 }, 'kWh');
      assertClose(o.cf_out, 0.16762, { abs: 1e-5 }, 'CF');
      assertClose(o.hours_running, Math.exp(-Math.PI / 4 * 0.36) - Math.exp(-Math.PI / 4 * 25), { rel: 1e-12 }, 'running');
    },
  },
  {
    name: 'Capacity factor mode: energy = rated power × CF × 8 760 h',
    source: 'Definition of the capacity factor',
    run: () => {
      const o = calculate({ energy_mode: 'cf', capacity_factor: 0.25 }).outputs;
      assertClose(o.energy_j / 3.6e6, (o.rated_w / 1000) * 0.25 * 8760, { rel: 1e-12 }, 'kWh');
      assertClose(o.cf_out, 0.25, { rel: 1e-12 }, 'CF');
      assertEqual(o.resource_w_m2, null, 'no Rayleigh');
    },
  },
  {
    name: 'A power coefficient above the Betz limit, a cut-in at or above the rated speed and a cut-out below it are rejected',
    source: 'Validation contract (Betz limit 16/27)',
    run: () => {
      assertThrows(() => calculate({ cp: 0.6 }), 'Betz');
      assertThrows(() => calculate({ cut_in_m_s: 11, rated_m_s: 11 }), 'Cut-in speed');
      assertThrows(() => calculate({ cut_out_m_s: 10, rated_m_s: 11 }), 'Cut-out speed');
    },
  },
];
