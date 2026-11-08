/**
 * gas-compressibility/tests.js — checks against Standing–Katz chart readings, the Smith–Van Ness–Abbott n-butane
 * example and hand calculations of the Sutton and Wichert–Aziz correlations.
 * Run: node run-tests.js gas-compressibility
 */
import { calculate, zDAK, sutton, wichertAziz } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const PSI = 6894.757293168;
const degF = (f) => (f + 459.67) * (5 / 9);

export const tests = [
  {
    name: 'DAK matches Standing–Katz chart readings within 1 %: Tpr 1.3 → 0.835, 0.756, 0.638; 1.5 → 0.900, 0.859, 0.794; 2.0 → 0.956, 0.941',
    source: 'Standing–Katz chart values digitised by Reyes, zFactor R package ("StandingKatz chart" article), Tpr 1.3, 1.5, 2.0 at ppr 1.0, 1.5, 2.5',
    run: () => {
      for (const [t, p, z] of [[1.3, 1.002, 0.835], [1.3, 1.5, 0.756], [1.3, 2.5, 0.638], [1.5, 1, 0.9], [1.5, 1.5, 0.859], [1.5, 2.5, 0.794], [2, 1.5, 0.956], [2, 2.5, 0.941]]) {
        assertClose(zDAK(t, p), z, { rel: 0.01 }, `Tpr ${t}, ppr ${p}`);
      }
    },
  },
  {
    name: 'n-butane at 510 K and 25 bar (Tc 425.1 K, Pc 37.96 bar, ω 0.200): Tr 1.200, Pr 0.659, Z = 0.879',
    source: 'Smith, Van Ness and Abbott, Introduction to Chemical Engineering Thermodynamics, 7th ed., §3.6 n-butane example (virial result Z = 0.879, V ≈ 1 491 cm³/mol)',
    run: () => {
      const o = calculate({ method: 'pitzer', tc_k: 425.1, pc_pa: 3.796e6, omega: 0.2, molar_mass: 58.123, p_pure_pa: 25e5, t_pure_k: 510 }).outputs;
      assertClose(o.z, 0.879, { abs: 0.0005 }, 'Z');
      assertClose((o.z * 8.314462618 * 510) / 25e5 * 1e6, 1490.8, { abs: 1 }, 'V cm³/mol');
      assertClose(o.tpr, 1.2, { abs: 0.001 }, 'Tr');
    },
  },
  {
    name: 'Sutton at γ = 0.7: Tpc = 377.59 °R, ppc = 663.34 psia; Wichert–Aziz with 10 % H₂S and 5 % CO₂: ε = 20.74 °R, 356.85 °R, 623.83 psia',
    source: 'Ahmed, Reservoir Engineering Handbook, ch. 2 (Sutton 1985 and Wichert–Aziz 1972 equations); hand calculation',
    run: () => {
      const s = sutton(0.7);
      assertClose(s.tpcR, 377.59, { abs: 0.005 }, 'Tpc');
      assertClose(s.ppcPsia, 663.336, { abs: 0.005 }, 'ppc');
      const w = wichertAziz(s.tpcR, s.ppcPsia, 0.1, 0.05);
      assertClose(w.eps, 20.735, { abs: 0.005 }, 'ε');
      assertClose(w.tpcR, 356.855, { abs: 0.005 }, 'T′pc');
      assertClose(w.ppcPsia, 623.83, { abs: 0.01 }, 'p′pc');
    },
  },
  {
    name: 'Worked example: γ 0.65 at 2 000 psia and 200 °F gives Tpr 1.807, ppr 2.984, Z 0.897 and 94.95 kg/m³',
    source: 'Hand calculation with Sutton (1985) and DAK (1975); ρ = p M / (Z R T) with M = 28.964 γ',
    run: () => {
      const o = calculate({ gas_sg: 0.65, pressure_pa: 2000 * PSI, temp_k: degF(200) }).outputs;
      assertClose(o.tpr, 1.80677, { abs: 1e-5 }, 'Tpr');
      assertClose(o.ppr, 2.98450, { abs: 1e-5 }, 'ppr');
      assertClose(o.z, 0.8974, { abs: 0.0001 }, 'Z');
      assertClose(o.density, 94.95, { abs: 0.01 }, 'ρ');
      assertClose(o.bg, 0.008370, { abs: 1e-6 }, 'Bg');
    },
  },
  {
    name: 'Low pressure tends to the ideal gas: at 15 psia Z is above 0.995 for natural gas and for n-butane far above Tc',
    source: 'Limiting case: Z → 1 as P → 0',
    run: () => {
      const r = calculate({ gas_sg: 0.65, pressure_pa: 15 * PSI, temp_k: degF(100) });
      assertEqual(r.outputs.z > 0.995 && r.outputs.z < 1, true, 'natural gas');
      assertEqual(r.warnings.length, 1, 'below the chart range warns');
      const p = calculate({ method: 'pitzer', p_pure_pa: 1e5, t_pure_k: 800 }).outputs;
      assertClose(p.z, 1, { abs: 0.005 }, 'n-butane');
    },
  },
  {
    name: 'Outside the validity ranges the calculator refuses: Tpr below 1.05, ppr above 30, a dense state for the virial method',
    source: 'Validation contract (DAK / Standing–Katz range; Poling et al.: second-virial truncation only to half the critical density)',
    run: () => {
      assertThrows(() => calculate({ gas_sg: 0.65, temp_k: 200 }), 'cover 1.05 to 3.0');
      assertThrows(() => calculate({ gas_sg: 0.65, pressure_pa: 1.5e8 }), 'valid up to 30');
      assertThrows(() => calculate({ method: 'pitzer', p_pure_pa: 10e6, t_pure_k: 450 }), 'too dense');
      assertThrows(() => calculate({ gas_sg: 2 }), 'Gas specific gravity');
    },
  },
];
