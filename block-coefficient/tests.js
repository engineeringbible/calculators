/**
 * block-coefficient/tests.js — checks against the definitions of the form coefficients and Δ = C_B L B T ρ.
 * Run: node run-tests.js block-coefficient
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '100 × 16 × 6 m, ∇ 7 200 m³, A_M 92 m², A_WP 1 300 m²: C_B 0.750, C_M 0.958, C_P 0.783, C_WP 0.813, C_VP 0.923',
    source: 'Derrett & Barrass, Ship Stability for Masters and Mates, ch. 2 (definitions); hand calculation',
    run: () => {
      const o = calculate({ length_m: 100, beam_m: 16, draft_m: 6, basis: 'volume', volume_m3: 7200, midship_area_m2: 92, waterplane_area_m2: 1300 }).outputs;
      assertClose(o.cb, 0.75, { rel: 1e-12 }, 'C_B');
      assertClose(o.cm, 92 / 96, { rel: 1e-12 }, 'C_M');
      assertClose(o.cp, 7200 / (92 * 100), { rel: 1e-12 }, 'C_P = ∇ / (A_M L)');
      assertClose(o.cwp, 0.8125, { rel: 1e-12 }, 'C_WP');
      assertClose(o.cvp, 7200 / (1300 * 6), { rel: 1e-12 }, 'C_VP = ∇ / (A_WP T)');
    },
  },
  {
    name: 'Displacement: 7 200 m³ is 7 380 t in salt water (1.025) and 7 200 t in fresh water; TPC = 1 300 × 1.025 / 100 = 13.33 t/cm',
    source: 'Δ = ∇ ρ; TPC = A_WP ρ / 100 (Derrett & Barrass ch. 9)',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.disp_salt_kg, 7.38e6, { rel: 1e-12 }, 'salt');
      assertClose(o.disp_fresh_kg, 7.2e6, { rel: 1e-12 }, 'fresh');
      assertClose(o.tpc_salt, 13.325, { rel: 1e-12 }, 'TPC');
    },
  },
  {
    name: 'From mass: 1 800 t in salt water on 64 × 10 × 4 m gives C_B = 1 800 / (1.025 × 2 560) = 0.686',
    source: 'C_B = Δ / (ρ L B T); hand calculation in the form of Derrett & Barrass ch. 2 exercises',
    run: () => {
      const o = calculate({ length_m: 64, beam_m: 10, draft_m: 4, basis: 'mass', mass_kg: 1.8e6, density_kg_m3: 1025, midship_area_m2: 0, waterplane_area_m2: 0 }).outputs;
      assertClose(o.cb, 0.68598, { abs: 1e-5 }, 'C_B');
      assertEqual(o.cm, null, 'no C_M');
      assertEqual(o.cp, null, 'no C_P');
    },
  },
  {
    name: 'A box barge has every coefficient equal to 1; from C_B, Δ = C_B L B T ρ',
    source: 'Limiting case of the definitions',
    run: () => {
      const box = calculate({ length_m: 50, beam_m: 10, draft_m: 2, basis: 'cb', cb_in: 1, midship_area_m2: 20, waterplane_area_m2: 500 }).outputs;
      for (const k of ['cb', 'cm', 'cp', 'cwp', 'cvp']) assertClose(box[k], 1, { rel: 1e-12 }, k);
      assertClose(box.disp_salt_kg, 1025 * 1000, { rel: 1e-12 }, 'Δ');
    },
  },
  {
    name: 'A volume larger than L B T and a midship area larger than B T are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ volume_m3: 10000 }), 'block coefficient would exceed 1');
      assertThrows(() => calculate({ midship_area_m2: 100 }), 'Midship section area');
      assertThrows(() => calculate({ length_m: 0 }), 'Length L must be greater than zero');
    },
  },
];
