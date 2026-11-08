/**
 * reynolds-number/tests.js — checks against the definition of the Reynolds number, the hydraulic diameter and the
 * regime limits for internal flow and flat plates.
 * Run: node run-tests.js reynolds-number
 */
import { calculate, reynolds, hydraulicDiameter, regimeOf } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const includes = (text, part, message) => assertEqual(String(text).includes(part), true, `${message}: "${text}" should contain "${part}"`);

export const tests = [
  {
    name: 'Water at 20 °C, 1.5 m/s in a 50 mm bore: Re = 1.5 × 0.05 / 1.004e-6 = 74 701, turbulent',
    source: 'White, Fluid Mechanics, ch. 6: Re = V D / ν; ITTC 7.5-02-01-03 fresh water ν(20 °C) = 1.004e-6 m²/s',
    run: () => {
      assertClose(reynolds(1.5, 0.05, 1.004e-6), 74701.2, { abs: 0.1 }, 'formula');
      const { outputs } = calculate({ geometry: 'pipe', known: 'velocity', velocity_m_s: 1.5, diameter_m: 0.05, fluid: 'water_20c' });
      assertClose(outputs.reynolds, 74701.2, { abs: 0.1 }, 'Re');
      includes(outputs.regime, 'Turbulent', 'regime');
      assertClose(outputs.mu_pa_s, 998.2 * 1.004e-6, { rel: 1e-12 }, 'μ = ρ ν');
      assertClose(outputs.critical_velocity_m_s, 2300 * 1.004e-6 / 0.05, { rel: 1e-12 }, 'velocity at Re 2300');
    },
  },
  {
    name: 'Heavy fuel oil of 380 cSt at 1 m/s in a 100 mm pipe: Re = 263, laminar',
    source: 'Moody (1944), laminar zone below Re ≈ 2300; ISO 8217 RMG 380 viscosity 380 mm²/s at 50 °C',
    run: () => {
      const { outputs } = calculate({ geometry: 'pipe', known: 'velocity', velocity_m_s: 1, diameter_m: 0.1, fluid: 'hfo_50c' });
      assertClose(outputs.reynolds, 263.16, { abs: 0.01 }, 'Re');
      includes(outputs.regime, 'Laminar', 'regime');
    },
  },
  {
    name: 'A 300 × 200 mm duct has D_h = 4 × 0.06 / 1.0 = 0.24 m; air at 5 m/s gives Re = 79 156, turbulent',
    source: 'White, ch. 6.6, hydraulic diameter D_h = 4 A / P; ASHRAE Handbook Fundamentals, ch. 21 duct design',
    run: () => {
      assertClose(hydraulicDiameter(0.3 * 0.2, 2 * (0.3 + 0.2)), 0.24, { rel: 1e-12 }, 'D_h');
      const { outputs } = calculate({ geometry: 'duct', known: 'velocity', velocity_m_s: 5, area_m2: 0.06, perimeter_m: 1, fluid: 'air_20c' });
      assertClose(outputs.length_used_m, 0.24, { rel: 1e-12 }, 'length used');
      assertClose(outputs.reynolds, 5 * 0.24 / 1.516e-5, { rel: 1e-12 }, 'Re');
      includes(outputs.regime, 'Turbulent', 'regime');
    },
  },
  {
    name: 'Flow rate and velocity agree: 0.01 m³/s in a 100 mm pipe is 1.273 m/s and gives the same Re as entering that velocity',
    source: 'Continuity: V = Q / A, A = π D² / 4',
    run: () => {
      const byFlow = calculate({ geometry: 'pipe', known: 'flow', flow_m3_s: 0.01, diameter_m: 0.1, fluid: 'water_20c' }).outputs;
      const v = 0.01 / (Math.PI * 0.1 * 0.1 / 4);
      assertClose(byFlow.velocity_used_m_s, v, { rel: 1e-12 }, 'V = Q/A');
      const byVelocity = calculate({ geometry: 'pipe', known: 'velocity', velocity_m_s: v, diameter_m: 0.1, fluid: 'water_20c' }).outputs;
      assertClose(byFlow.reynolds, byVelocity.reynolds, { rel: 1e-12 }, 'same Re');
    },
  },
  {
    name: 'Flat plate in sea water at 2 m/s: Re_x = 841 526 at 0.5 m (turbulent), 168 305 at 0.1 m (laminar); transition velocity 5 × 10⁵ ν / x',
    source: 'White, ch. 7: flat-plate boundary layer, transition near Re_x = 5 × 10⁵; ITTC 7.5-02-01-03 sea water ν(15 °C)',
    run: () => {
      const far = calculate({ geometry: 'plate', velocity_m_s: 2, length_m: 0.5, fluid: 'seawater_15c' }).outputs;
      assertClose(far.reynolds, 2 * 0.5 / 1.18831e-6, { rel: 1e-12 }, 'Re at 0.5 m');
      includes(far.regime, 'Turbulent', 'regime at 0.5 m');
      const near = calculate({ geometry: 'plate', velocity_m_s: 2, length_m: 0.1, fluid: 'seawater_15c' }).outputs;
      includes(near.regime, 'Laminar', 'regime at 0.1 m');
      assertClose(near.critical_velocity_m_s, 5e5 * 1.18831e-6 / 0.1, { rel: 1e-12 }, 'transition velocity');
    },
  },
  {
    name: 'Water at 0.05 m/s in a 50 mm pipe: Re = 2490, transitional, with a warning; the same Re in "any length" mode names no regime',
    source: 'Transitional range 2300–4000 (White, ch. 6; Moody 1944)',
    run: () => {
      const result = calculate({ geometry: 'pipe', known: 'velocity', velocity_m_s: 0.05, diameter_m: 0.05, fluid: 'water_20c' });
      includes(result.outputs.regime, 'Transitional', 'regime');
      assertEqual(result.warnings.length >= 1, true, 'warning');
      includes(regimeOf('length', 2490), 'Depends on the geometry', 'generic length');
      assertEqual(calculate({ geometry: 'length', velocity_m_s: 1, length_m: 1 }).outputs.critical_velocity_m_s, null, 'no limit for a generic length');
    },
  },
  {
    name: 'Custom fluid: glycerine-like ρ 1260 kg/m³, ν 1.18e-3 m²/s gives μ = 1.487 Pa·s and Re = 8.47 at 0.2 m/s in 50 mm',
    source: 'μ = ρ ν (White, ch. 1); Re = V D / ν',
    run: () => {
      const { outputs } = calculate({ geometry: 'pipe', known: 'velocity', velocity_m_s: 0.2, diameter_m: 0.05, fluid: 'custom', rho_kg_m3: 1260, nu_m2_s: 1.18e-3 });
      assertClose(outputs.mu_pa_s, 1.4868, { abs: 1e-4 }, 'μ');
      assertClose(outputs.reynolds, 8.4746, { abs: 1e-4 }, 'Re');
    },
  },
  {
    name: 'Zero diameter, zero velocity and an unknown fluid are rejected',
    source: 'Input validation contract (shared/validate.js)',
    run: () => {
      assertThrows(() => calculate({ geometry: 'pipe', diameter_m: 0 }), 'Pipe inside diameter must be greater than zero');
      assertThrows(() => calculate({ geometry: 'plate', velocity_m_s: 0 }), 'Mean velocity must be greater than zero');
      assertThrows(() => calculate({ fluid: 'mercury' }), 'Fluid');
    },
  },
];
