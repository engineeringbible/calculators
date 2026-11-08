/**
 * material-properties/tests.js — checks of the table against the cited standards and data sheets, and of the derived values.
 * Run: node run-tests.js material-properties
 */
import { calculate, MATERIALS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'EN 1993-1-1: S235 fy 235, fu 360; S355 fy 355, fu 490 MPa (t ≤ 40 mm); E 210 GPa, α 12e-6/K, ρ 7 850 kg/m³',
    source: 'EN 1993-1-1:2005 Table 3.1 and §3.2.6',
    run: () => {
      const a = calculate({ material: 's235' }).outputs;
      const b = calculate({ material: 's355' }).outputs;
      assertEqual([a.yield_pa, a.tensile_pa, b.yield_pa, b.tensile_pa].join(), [235e6, 360e6, 355e6, 490e6].join(), 'fy, fu');
      assertClose(b.modulus_pa, 210e9, { rel: 1e-12 }, 'E');
      assertClose(b.alpha_per_k, 12e-6, { rel: 1e-12 }, 'α');
      assertEqual(b.density, 7850, 'ρ');
    },
  },
  {
    name: 'EN 1993-1-2 carbon steel at 20 °C: λ = 54 − 0.0333 × 20 = 53.33 W/(m·K), c = 439.8 J/(kg·K)',
    source: 'EN 1993-1-2:2005 §3.4.1.2 (eq. 3.2) and §3.4.1.3 (eq. 3.4)',
    run: () => {
      const o = calculate({ material: 'a36' }).outputs;
      assertClose(o.k_w_mk, 53.334, { abs: 0.001 }, 'λ');
      assertClose(o.cp_j_kgk, 439.80, { abs: 0.01 }, 'c');
    },
  },
  {
    name: 'ASTM A36 Fy 36 ksi = 248.2 MPa, Fu 58 ksi = 399.9 MPa; A572 Gr 50 Fy 50 ksi = 344.7 MPa',
    source: 'ASTM A36 and A572 minimum properties (1 ksi = 6.894757 MPa)',
    run: () => {
      assertClose(calculate({ material: 'a36' }).outputs.yield_pa / 1e6, 248.21, { abs: 0.01 }, 'A36 Fy');
      assertClose(calculate({ material: 'a36' }).outputs.tensile_pa / 1e6, 399.90, { abs: 0.01 }, 'A36 Fu');
      assertClose(calculate({ material: 'a572' }).outputs.yield_pa / 1e6, 344.74, { abs: 0.01 }, 'A572 Fy');
    },
  },
  {
    name: 'Data-sheet values: 304 ρ 8 030, E 193 GPa, k 16.2; copper k 226 Btu·ft/(h·ft²·°F) = 391.1 W/(m·K), α 9.40 µin/(in·°F) = 16.92 µm/(m·K)',
    source: 'Cleveland-Cliffs 304/304L bulletin; National Bronze C11000 data sheet',
    run: () => {
      const s = calculate({ material: 'ss304' }).outputs;
      assertEqual([s.density, s.modulus_pa / 1e9, s.k_w_mk].join(), '8030,193,16.2', '304');
      const c = calculate({ material: 'copper' }).outputs;
      assertClose(c.k_w_mk, 391.15, { abs: 0.01 }, 'k Cu');
      assertClose(c.alpha_per_k * 1e6, 16.92, { abs: 1e-9 }, 'α Cu');
      assertClose(c.modulus_pa / 1e9, 117.21, { abs: 0.01 }, 'E Cu');
    },
  },
  {
    name: 'Derived values: 2 L of 6061-T6 is 5.40 kg; E/ρ 25.52 MJ/kg; 276 MPa / 2 700 = 102.2 kJ/kg; no volume gives no mass',
    source: 'm = ρ V, E/ρ, f/ρ (by hand)',
    run: () => {
      const o = calculate({ material: 'al6061', volume_m3: 0.002 }).outputs;
      assertClose(o.mass_kg, 5.4, { rel: 1e-12 }, 'mass');
      assertClose(o.specific_stiffness / 1e6, 25.5185, { abs: 1e-4 }, 'E/ρ');
      assertClose(o.specific_strength / 1e3, 102.222, { abs: 1e-3 }, 'f/ρ');
      assertEqual(calculate({ material: 'al6061', volume_m3: 0 }).outputs.mass_kg, null, 'no volume');
    },
  },
  {
    name: 'Every material calculates; brittle materials use their tensile or characteristic strength; an unknown material is rejected',
    source: 'Validation contract',
    run: () => {
      for (const id of Object.keys(MATERIALS)) {
        const o = calculate({ material: id }).outputs;
        assertEqual(Number.isFinite(o.specific_strength) && o.specific_strength > 0, true, id);
      }
      assertEqual(calculate({ material: 'glass' }).outputs.yield_pa, null, 'glass has no yield');
      assertThrows(() => calculate({ material: 'unobtainium' }), 'Material');
    },
  },
];
