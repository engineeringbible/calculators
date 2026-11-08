/**
 * hydrostatic-pressure/tests.js — checks against p = ρ g h, the standard atmosphere and plane-surface forces.
 * Run: node run-tests.js hydrostatic-pressure
 */
import { calculate, P_ATM_PA } from './calc.js';
import { GRAVITY_M_S2 } from '../shared/units.js';
import { assertClose, assertEqual } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Sea water (1025.87 kg/m³) at 30 m: 301.81 kPa gauge, 403.14 kPa absolute, 3.018 bar',
    source: 'White, Fluid Mechanics, ch. 2.3: p = p₀ + ρ g h; ITTC 7.5-02-01-03 sea water at 15 °C; ISO 2533 atmosphere',
    run: () => {
      const { outputs } = calculate({ depth_m: 30, fluid: 'seawater_15c', surface_pa: P_ATM_PA, area_m2: 0 });
      assertClose(outputs.gauge_pa, 1025.87 * GRAVITY_M_S2 * 30, { rel: 1e-12 }, 'gauge');
      assertClose(outputs.gauge_pa / 1000, 301.81, { abs: 0.01 }, 'kPa');
      assertClose(outputs.absolute_pa / 1000, 403.14, { abs: 0.01 }, 'absolute');
      assertEqual(outputs.force_n, null, 'no area, no force');
    },
  },
  {
    name: 'Fresh water at 10 m: 97.9 kPa, close to one atmosphere, and a head of 9.98 m of 1000 kg/m³ water',
    source: 'ρ water 20 °C = 998.2 kg/m³; conventional metre of water column at 1000 kg/m³ (ISO 80000-4)',
    run: () => {
      const { outputs } = calculate({ depth_m: 10, fluid: 'water_20c', surface_pa: P_ATM_PA, area_m2: 0 });
      assertClose(outputs.gauge_pa, 97889.8, { abs: 0.5 }, 'gauge');
      assertClose(outputs.head_water_m, 9.982, { abs: 0.001 }, 'head');
      assertClose(outputs.gradient_pa_m, 9.789, { abs: 0.001 }, 'kPa per metre');
    },
  },
  {
    name: 'A 1.5 m² hatch 4 m below a fuel oil surface (830 kg/m³) carries 48.8 kN',
    source: 'Force on a horizontal plane F = p A (White, ch. 2.5)',
    run: () => {
      const { outputs } = calculate({ depth_m: 4, fluid: 'mgo_40c', surface_pa: P_ATM_PA, area_m2: 1.5 });
      assertClose(outputs.force_n, 830 * GRAVITY_M_S2 * 4 * 1.5, { rel: 1e-12 }, 'F');
      assertClose(outputs.force_n / 1000, 48.84, { abs: 0.01 }, 'kN');
    },
  },
  {
    name: 'A 760 mm mercury column (13 595.1 kg/m³ at 0 °C) equals one standard atmosphere',
    source: 'Definition of 760 mmHg = 101 325 Pa with mercury at 0 °C and standard gravity',
    run: () => {
      const { outputs } = calculate({ depth_m: 0.76, fluid: 'custom', rho_kg_m3: 13595.1, surface_pa: 0, area_m2: 0 });
      assertClose(outputs.gauge_pa, 101325, { rel: 1e-5 }, '1 atm');
    },
  },
  {
    name: 'At the surface the gauge pressure is zero and the absolute pressure is the surface pressure; very deep water warns',
    source: 'p = p₀ at h = 0; water compressibility about 0.5 % per 1000 m',
    run: () => {
      const surface = calculate({ depth_m: 0, fluid: 'water_20c', surface_pa: 95000, area_m2: 0 }).outputs;
      assertEqual(surface.gauge_pa, 0, 'gauge');
      assertEqual(surface.absolute_pa, 95000, 'absolute');
      assertEqual(calculate({ depth_m: 4000, fluid: 'seawater_15c' }).warnings.length, 1, 'deep warning');
    },
  },
];
