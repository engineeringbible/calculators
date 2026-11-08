/**
 * berthing-energy/tests.js — checks against the PIANC 2002 method as reproduced in the fender design manuals.
 * Run: node run-tests.js berthing-energy
 */
import { calculate, brolsmaVelocity, eccentricity, BROLSMA_TABLE, SAFETY_FACTORS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** ShibataFenderTeam manual p. 19: 100 000 DWT laden tanker, third-point side berthing at 5°. */
const TANKER = { displacement_t: 125000, lbp_m: 236, beam_m: 43, draft_m: 15.1, water_density_t_m3: 1.025, ukc_m: 3, velocity_mode: 'given', velocity_m_s: 0.15, contact: 'third', angle_deg: 5, cm_method: 'pianc', softness: 'soft', vessel_class: 'tanker_large', fender_energy_kj: 2500, fender_reaction_kn: 2200, panel_area_m2: 12, allowable_pressure_kpa: 200 };

export const tests = [
  {
    name: 'Manual example: 125 000 t tanker, L 236 m, B 43 m, D 15.1 m → C_B 0.796, K = (0.19·0.796 + 0.11)·236 = 61.65 m (manual prints 61.7), third-point R = 44.8 m, γ = 90 − 5 − asin(43/89.6) = 56.3°, C_E = 0.761',
    source: 'ShibataFenderTeam Fender Design Manual (2021) p. 19 worked example of the PIANC 2002 eccentricity coefficient',
    run: () => {
      const { outputs } = calculate(TANKER);
      assertClose(outputs.cb, 0.796, { abs: 1e-3 }, 'C_B');
      assertClose(outputs.k_m, 61.65, { abs: 0.06 }, 'K');
      assertClose(outputs.r_m, 44.8, { abs: 0.05 }, 'R');
      assertClose(outputs.gamma_deg, 56.3, { abs: 0.05 }, 'γ');
      assertClose(outputs.ce, 0.761, { abs: 1e-3 }, 'C_E');
      const e = eccentricity(0.796, 236, 43, 1 / 3, 5);
      assertClose(e.ce, 0.761, { abs: 1e-3 }, 'helper');
    },
  },
  {
    name: 'Eccentricity presets: midships contact gives C_E = 1 (γ = 90° − α − asin(B/2R) with R = B/2 → γ = −α… formula gives 1.0 at α 0); quarter point ≈ 0.5 and fifth point ≈ 0.45 as the manual\'s rules of thumb for a typical hull',
    source: 'Fender manual p. 19 common approximations (fifth 0.45, quarter 0.50, third 0.70, midships 1.00)',
    run: () => {
      const mid = eccentricity(0.796, 236, 43, 0.5, 0);
      assertClose(mid.ce, 1, { abs: 1e-9 }, 'midships');
      const quarter = eccentricity(0.796, 236, 43, 0.25, 5);
      assertEqual(quarter.ce > 0.45 && quarter.ce < 0.6, true, 'quarter ≈ 0.5');
      const fifth = eccentricity(0.796, 236, 43, 0.2, 5);
      assertEqual(fifth.ce > 0.38 && fifth.ce < 0.5, true, 'fifth ≈ 0.45');
      assertEqual(fifth.ce < quarter.ce && quarter.ce < eccentricity(0.796, 236, 43, 1 / 3, 5).ce, true, 'monotone with distance from bow');
    },
  },
  {
    name: 'Added mass: PIANC K_C/D 0.199 → C_M = 1.875 − 0.75·0.199 = 1.726; K_C/D 0.05 → 1.8; K_C/D 0.6 → 1.5; Vasco Costa 1 + 2·15.1/43 = 1.702; Ueda 1 + π·15.1/(2·0.796·43) = 1.693',
    source: 'PIANC 2002 §4.2.3 (as reproduced in the fender manual p. 18); Vasco Costa (1964); Ueda (1981)',
    run: () => {
      assertClose(calculate(TANKER).outputs.cm, 1.875 - 0.75 * (3 / 15.1), { rel: 1e-9 }, 'PIANC interpolated');
      assertClose(calculate({ ...TANKER, ukc_m: 0.5 }).outputs.cm, 1.8, { rel: 1e-12 }, 'shallow');
      assertClose(calculate({ ...TANKER, ukc_m: 10 }).outputs.cm, 1.5, { rel: 1e-12 }, 'deep');
      assertClose(calculate({ ...TANKER, cm_method: 'vasco_costa' }).outputs.cm, 1 + 30.2 / 43, { rel: 1e-12 }, 'Vasco Costa');
      const ueda = calculate({ ...TANKER, cm_method: 'ueda' }).outputs;
      assertClose(ueda.cm, 1 + (Math.PI * 15.1) / (2 * ueda.cb * 43), { rel: 1e-12 }, 'Ueda');
    },
  },
  {
    name: 'Berth configuration and softness: PIANC C_M → C_C = 1; Vasco Costa with solid quay and K_C/D 0.2 at 5° → 0.8, at 8° → 1.0, with K_C/D 0.6 → 0.9; partly closed 0.9; hard fender C_S 0.9',
    source: 'PIANC 2002 §4.2.4–4.2.5 (fender manual p. 20)',
    run: () => {
      assertEqual(calculate(TANKER).outputs.cc, 1, 'PIANC → 1');
      assertEqual(calculate({ ...TANKER, cm_method: 'vasco_costa', structure: 'solid' }).outputs.cc, 0.8, 'solid shallow');
      assertEqual(calculate({ ...TANKER, cm_method: 'vasco_costa', structure: 'solid', angle_deg: 8 }).outputs.cc, 1, 'angle > 5°');
      assertEqual(calculate({ ...TANKER, cm_method: 'vasco_costa', structure: 'solid', ukc_m: 10 }).outputs.cc, 0.9, 'solid deep');
      assertEqual(calculate({ ...TANKER, cm_method: 'vasco_costa', structure: 'partly_closed' }).outputs.cc, 0.9, 'partly closed');
      assertEqual(calculate({ ...TANKER, softness: 'hard' }).outputs.cs, 0.9, 'hard fender');
    },
  },
  {
    name: 'Brolsma velocities: 10 000 t condition c = 0.287 m/s, 100 000 t condition b = 0.083, 500 000 t e = 0.115; 12 500 t condition c interpolates between 0.287 and 0.252; below-table values floor at 0.08 m/s (300 000 t condition a)',
    source: 'BS 6349-4:2014 Figure 9 / PIANC 2002 Brolsma curves as tabulated in the fender manual p. 21',
    run: () => {
      assertEqual(BROLSMA_TABLE.length, 17, 'rows');
      assertClose(brolsmaVelocity(10000, 'c'), 0.287, { rel: 1e-12 }, '10 000 c');
      assertClose(brolsmaVelocity(100000, 'b'), 0.083, { rel: 1e-12 }, '100 000 b');
      assertClose(brolsmaVelocity(500000, 'e'), 0.115, { rel: 1e-12 }, '500 000 e');
      const v = brolsmaVelocity(12500, 'c');
      assertEqual(v < 0.287 && v > 0.252, true, 'interpolated');
      assertClose(brolsmaVelocity(300000, 'a'), 0.08, { rel: 1e-12 }, 'floor');
      const r = calculate({ ...TANKER, velocity_mode: 'brolsma', brolsma_condition: 'c' });
      const expected = brolsmaVelocity(125000, 'c');
      assertClose(r.outputs.velocity_used_m_s, expected, { rel: 1e-12 }, 'in calculate');
      assertEqual(expected > 0.107 && expected < 0.126, true, 'between 100 000 and 150 000 rows');
    },
  },
  {
    name: 'Energies: tanker at 0.15 m/s → ½·125 000·0.15² = 1 406 kJ kinetic, E_N = 1 406 × 1.726 × 0.761 = 1 847 kJ, factor 1.25 → E_A = 2 309 kJ; fender 2 500 kJ OK; 2 200 kN on 12 m² = 183 kPa ≤ 200 kPa',
    source: 'PIANC 2002 E_N = ½ M v² C_M C_E C_C C_S, Table 4.2.5 factor 1.25 for large tankers, hull pressure guidance',
    run: () => {
      const { outputs } = calculate(TANKER);
      assertClose(outputs.kinetic_energy_kj, 0.5 * 125000 * 0.0225, { rel: 1e-12 }, 'kinetic');
      assertClose(outputs.normal_energy_kj, outputs.kinetic_energy_kj * outputs.cm * outputs.ce, { rel: 1e-12 }, 'E_N');
      assertClose(outputs.normal_energy_kj, 1847, { rel: 3e-3 }, 'E_N value');
      assertEqual(outputs.safety_factor, 1.25, 'factor');
      assertClose(outputs.abnormal_energy_kj, outputs.normal_energy_kj * 1.25, { rel: 1e-12 }, 'E_A');
      assertEqual(outputs.fender_check.startsWith('OK'), true, 'fender OK');
      assertClose(outputs.hull_pressure_kpa, 2200 / 12, { rel: 1e-12 }, 'pressure');
      assertEqual(outputs.pressure_check.startsWith('OK'), true, 'pressure OK');
      const weak = calculate({ ...TANKER, fender_energy_kj: 2000, panel_area_m2: 8 }).outputs;
      assertEqual(weak.fender_check.startsWith('INSUFFICIENT'), true, 'fender insufficient');
      assertEqual(weak.pressure_check.startsWith('EXCEEDED'), true, 'pressure exceeded');
    },
  },
  {
    name: 'Safety factors follow PIANC Table 4.2.5: small tankers 1.75, large container 1.5, small container 2.0, general cargo 1.75, RoRo 2.0; custom factor honoured',
    source: 'PIANC 2002 Table 4.2.5 as interpreted by the fender manual p. 22',
    run: () => {
      assertEqual(SAFETY_FACTORS.tanker_small.factor, 1.75, 'small tanker');
      assertEqual(SAFETY_FACTORS.container_large.factor, 1.5, 'large container');
      assertEqual(SAFETY_FACTORS.container_small.factor, 2.0, 'small container');
      assertEqual(SAFETY_FACTORS.general_cargo.factor, 1.75, 'general cargo');
      assertEqual(SAFETY_FACTORS.roro.factor, 2.0, 'RoRo');
      assertEqual(calculate({ ...TANKER, vessel_class: 'custom', custom_factor: 1.6 }).outputs.safety_factor, 1.6, 'custom');
    },
  },
  {
    name: 'Invalid inputs fail fast: implausible block coefficient, berthing angle above 45°, unknown vessel class',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...TANKER, displacement_t: 300000 }), 'not plausible', 'C_B');
      assertThrows(() => calculate({ ...TANKER, angle_deg: 60 }), 'between', 'angle');
      assertThrows(() => calculate({ ...TANKER, vessel_class: 'yacht' }), 'must be one of', 'class');
    },
  },
];
