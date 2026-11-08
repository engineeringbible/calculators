/**
 * interference-fit/tests.js — Lamé contact pressure, friction capacity, bore stresses and shrink temperature.
 * Run: node run-tests.js interference-fit
 */
import { calculate, contactPressure } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Equal steel parts, solid shaft: p = E δ (D² − d²)/(2 d D²) = 210 000 × 0.08 × 30 000/(2 × 100 × 40 000) = 63.0 MPa',
    source: 'Shigley (10th ed.) 3-16, contact pressure for equal materials',
    run: () => {
      assertClose(calculate({}).outputs.pressure_mpa, (210000 * 0.08 * 30000) / (2 * 100 * 40000), { rel: 1e-12 }, 'p');
    },
  },
  {
    name: 'Equal steel parts, shaft bored to 50 mm: p = E δ (D² − d²)(d² − d_i²)/(2 d³ (D² − d_i²)) = 50.4 MPa',
    source: 'Shigley (10th ed.) 3-16, equal materials with a hollow shaft',
    run: () => {
      assertClose(calculate({ shaft_bore_mm: 50 }).outputs.pressure_mpa, (210000 * 0.08 * 30000 * 7500) / (2 * 1e6 * 37500), { rel: 1e-12 }, 'p');
    },
  },
  {
    name: 'A rigid hub on a solid shaft gives p = δ E/(d (1 − ν)) = 240 MPa',
    source: 'Limit of the general two-material formula as E_hub → ∞',
    run: () => {
      const p = contactPressure({ d: 100, outer: 200, bore: 0, interference: 0.08, eHub: 1e18, nuHub: 0.3, eShaft: 210000, nuShaft: 0.3 });
      assertClose(p, (0.08 * 210000) / (100 * 0.7), { rel: 1e-9 }, 'p');
    },
  },
  {
    name: 'Friction capacity: T = μ p π d² L/2 = 16.63 kN·m and F = μ p π d L = 2T/d = 332.5 kN',
    source: 'Torque and axial force carried by friction over the fit',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.torque_knm, (0.14 * 63 * Math.PI * 10000 * 120) / 2 / 1e6, { rel: 1e-12 }, 'torque');
      assertClose(outputs.axial_kn, (2 * outputs.torque_knm * 1e6) / 100 / 1000, { rel: 1e-12 }, 'axial');
    },
  },
  {
    name: 'Bore stresses: hub hoop p (D² + d²)/(D² − d²) = 5/3 × 63 = 105 MPa, von Mises √(105² + 105 × 63 + 63²) = 147 MPa, solid shaft hoop −p',
    source: 'Lamé thick-cylinder stresses (Shigley 3-14 and 3-16)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.hub_hoop_mpa, 105, { rel: 1e-12 }, 'hub hoop');
      assertClose(outputs.hub_vm_mpa, Math.sqrt(105 ** 2 + 105 * 63 + 63 ** 2), { rel: 1e-12 }, 'von Mises');
      assertClose(outputs.shaft_hoop_mpa, -63, { rel: 1e-12 }, 'shaft hoop');
    },
  },
  {
    name: 'Shrink assembly: (0.08 + 0.05) mm/(12 × 10⁻⁶ × 100 mm) = 108.3 °C of heating, the hub at 128.3 °C',
    source: 'Free thermal expansion of the hub bore',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.heating_dt_c, 0.13 / (12e-6 * 100), { rel: 1e-12 }, 'ΔT');
      assertClose(outputs.hub_temperature_c, 20 + 0.13 / (12e-6 * 100), { rel: 1e-12 }, 'temperature');
    },
  },
  {
    name: 'Invalid inputs are rejected: a hub no larger than the fit, a shaft bore as large as the fit',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ hub_outer_mm: 100 }), 'larger than the fit diameter');
      assertThrows(() => calculate({ shaft_bore_mm: 100 }), 'smaller than the fit diameter');
      assertEqual(calculate({ interference_mm: 0 }).outputs.torque_knm, 0, 'no interference');
    },
  },
];
