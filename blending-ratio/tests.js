/**
 * blending-ratio/tests.js — checks against the Refutas blending number and hand calculations of linear blending.
 * Run: node run-tests.js blending-ratio
 */
import { calculate, vbn, viscFromVbn } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'ISO VG 100 and VG 32 to VG 68: VBN 33.196, 29.143 and 31.940; 69.0 % VG 100 by mass, 68.5 % by volume, 685 L of 1 000 L',
    source: 'Refutas VBN = 14.534 ln(ln(ν + 0.8)) + 10.975 (Maples; ASTM D7152 family), hand calculation; ISO 3448 grade midpoints',
    run: () => {
      const o = calculate({ property: 'viscosity', visc_a: 100e-6, visc_b: 32e-6, visc_t: 68e-6, rho_a: 880, rho_b: 860, total_m3: 1 }).outputs;
      assertClose(o.vbn_a, 33.1962, { abs: 1e-4 }, 'VBN A');
      assertClose(o.vbn_b, 29.1429, { abs: 1e-4 }, 'VBN B');
      assertClose(o.w_a, 0.69012, { abs: 1e-5 }, 'w_A');
      assertClose(o.phi_a, 0.68518, { abs: 1e-5 }, 'φ_A');
      assertClose(o.v_a * 1000, 685.18, { abs: 0.01 }, 'L of A');
    },
  },
  {
    name: 'Refutas: VBN(10 cSt) = 23.57 and VBN(100 cSt) = 33.20; a 50/50 mass blend is 26.7 cSt, not the 55 cSt average',
    source: 'Refutas method as verified in the fuel-blend-heating calculator (VBI 23.58 and 33.20, blend 26.7 cSt)',
    run: () => {
      assertClose(vbn(10), 23.575, { abs: 0.001 }, 'VBN 10');
      assertClose(vbn(100), 33.196, { abs: 0.001 }, 'VBN 100');
      assertClose(viscFromVbn((vbn(10) + vbn(100)) / 2), 26.67, { abs: 0.01 }, 'blend');
      const o = calculate({ visc_a: 100e-6, visc_b: 10e-6, visc_t: 26.6724e-6 }).outputs;
      assertClose(o.w_a, 0.5, { abs: 1e-4 }, 'inverse');
    },
  },
  {
    name: 'Sulphur by mass: 3.5 % and 0.1 % fuels blend to 0.5 % S at 11.76 % of the high-sulphur fuel by mass, 10.37 % by volume (991 and 860 kg/m³)',
    source: 'Linear blending by mass (Maples), hand calculation: w = (0.5 − 0.1) / (3.5 − 0.1)',
    run: () => {
      const o = calculate({ property: 'mass', prop_a: 3.5, prop_b: 0.1, prop_t: 0.5, rho_a: 991, rho_b: 860 }).outputs;
      assertClose(o.w_a, 0.4 / 3.4, { rel: 1e-12 }, 'w');
      assertClose(o.phi_a, 0.103708, { abs: 1e-6 }, 'φ');
      const sulphur = (o.m_a * 3.5 + o.m_b * 0.1) / (o.m_a + o.m_b);
      assertClose(sulphur, 0.5, { rel: 1e-12 }, 'mass balance');
    },
  },
  {
    name: 'Density by volume: 991 and 860 kg/m³ blend to 900 kg/m³ at 30.53 % by volume; the blend density is the target',
    source: 'Linear blending by volume with additive volumes, hand calculation: φ = 40 / 131',
    run: () => {
      const o = calculate({ property: 'volume', prop_a: 991, prop_b: 860, prop_t: 900, rho_a: 991, rho_b: 860 }).outputs;
      assertClose(o.phi_a, 40 / 131, { rel: 1e-12 }, 'φ');
      assertClose(o.rho_blend, 900, { rel: 1e-12 }, 'ρ');
      assertClose(o.m_a / (o.m_a + o.m_b), o.w_a, { rel: 1e-12 }, 'w consistent');
    },
  },
  {
    name: 'Limits: a target equal to A gives 100 % A; VBN inverts exactly; a target outside A and B and equal properties are rejected',
    source: 'Limiting cases and validation contract',
    run: () => {
      assertClose(calculate({ property: 'mass', prop_t: 3.5 }).outputs.w_a, 1, { abs: 1e-12 }, 'all A');
      for (const c of [1, 5, 46, 380, 5000]) assertClose(viscFromVbn(vbn(c)), c, { rel: 1e-10 }, `${c} cSt`);
      assertThrows(() => calculate({ visc_t: 150e-6 }), 'must lie between');
      assertThrows(() => calculate({ property: 'mass', prop_a: 1, prop_b: 1 }), 'equals that of liquid A');
      assertEqual(calculate({ rho_a: 1500, rho_b: 800 }).warnings.length, 1, 'density warning');
    },
  },
];
