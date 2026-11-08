/**
 * elastic-constants/tests.js — checks of the isotropic relations between E, G, K and ν.
 * Run: node run-tests.js elastic-constants
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Steel E 210 GPa, ν 0.3: G = 210/2.6 = 80.77 GPa, K = 210/1.2 = 175 GPa, λ = 121.15 GPa, M = 282.69 GPa',
    source: 'G = E/(2(1 + ν)), K = E/(3(1 − 2ν)), λ = Eν/((1 + ν)(1 − 2ν)) (Timoshenko and Goodier); EN 1993-1-1 §3.2.6 rounds G to 81 GPa',
    run: () => {
      const o = calculate({ pair: 'E_nu', e_pa: 210e9, nu: 0.3 }).outputs;
      assertClose(o.g_out_pa / 1e9, 80.7692, { abs: 1e-4 }, 'G');
      assertClose(o.k_out_pa / 1e9, 175, { abs: 1e-9 }, 'K');
      assertClose(o.lambda_pa / 1e9, 121.1538, { abs: 1e-4 }, 'λ');
      assertClose(o.m_pa / 1e9, 282.6923, { abs: 1e-4 }, 'M');
      assertClose(81, o.g_out_pa / 1e9, { rel: 0.003 }, 'EN 1993 rounded G');
    },
  },
  {
    name: 'Every pair returns the same set: from (E, G), (E, K), (G, ν), (G, K) and (K, ν) of steel back to E 210 GPa and ν 0.3',
    source: 'Consistency of the isotropic relations (round trip)',
    run: () => {
      const G = 210e9 / 2.6;
      const K = 175e9;
      const cases = [
        { pair: 'E_G', e_pa: 210e9, g_pa: G }, { pair: 'E_K', e_pa: 210e9, k_pa: K }, { pair: 'G_nu', g_pa: G, nu: 0.3 },
        { pair: 'G_K', g_pa: G, k_pa: K }, { pair: 'K_nu', k_pa: K, nu: 0.3 },
      ];
      for (const c of cases) {
        const o = calculate(c).outputs;
        assertClose(o.e_out_pa, 210e9, { rel: 1e-12 }, `${c.pair} E`);
        assertClose(o.nu_out, 0.3, { abs: 1e-12 }, `${c.pair} ν`);
      }
    },
  },
  {
    name: 'EN 1999-1-1 aluminium E 70 GPa, G 27 GPa gives ν = 0.2963 (the code rounds ν to 0.3)',
    source: 'EN 1999-1-1:2007 §3.2.5; ν = E/(2G) − 1',
    run: () => {
      assertClose(calculate({ pair: 'E_G', e_pa: 70e9, g_pa: 27e9 }).outputs.nu_out, 70 / 54 - 1, { abs: 1e-12 }, 'ν');
    },
  },
  {
    name: 'Copper C11000 data sheet: E 17 000 ksi, G 6 400 ksi gives ν = 0.328',
    source: 'National Bronze & Metals C11000 data sheet (modulus of elasticity in tension and modulus of rigidity)',
    run: () => {
      assertClose(calculate({ pair: 'E_G', e_pa: 17000 * 6894757.293168, g_pa: 6400 * 6894757.293168 }).outputs.nu_out, 0.328125, { abs: 1e-9 }, 'ν');
    },
  },
  {
    name: 'Limiting cases: ν = 0 gives G = E/2 and K = E/3; ν → 0.5 makes K grow without bound and G → E/3',
    source: 'Limits of G = E/(2(1 + ν)) and K = E/(3(1 − 2ν))',
    run: () => {
      const z = calculate({ pair: 'E_nu', e_pa: 1e9, nu: 0 }).outputs;
      assertClose(z.g_out_pa, 0.5e9, { rel: 1e-12 }, 'G at 0');
      assertClose(z.k_out_pa, 1e9 / 3, { rel: 1e-12 }, 'K at 0');
      const h = calculate({ pair: 'E_nu', e_pa: 1e9, nu: 0.499 }).outputs;
      assertEqual(h.k_out_pa > 100e9, true, 'K large');
      assertClose(h.g_out_pa, 1e9 / 3, { rel: 0.001 }, 'G near E/3');
    },
  },
  {
    name: 'Impossible pairs are refused: G below E/3, E above 9K, ν of 0.5 or more; zero E is rejected',
    source: 'Validation contract (−1 < ν < 0.5)',
    run: () => {
      assertThrows(() => calculate({ pair: 'E_G', e_pa: 210e9, g_pa: 60e9 }), 'G must be more than E/3');
      assertThrows(() => calculate({ pair: 'E_K', e_pa: 100e9, k_pa: 10e9 }), 'outside');
      assertThrows(() => calculate({ pair: 'E_nu', nu: 0.5 }), 'Poisson');
      assertThrows(() => calculate({ pair: 'E_nu', e_pa: 0 }), 'Young');
    },
  },
];
