/**
 * cargo-securing/tests.js — the CSS Code Annex 13 worked example and the tables.
 * Run: node run-tests.js cargo-securing
 */
import { calculate, lengthSpeedFactor, lashingEfficiency, parseLashings } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const EXAMPLE = {
  ship_length_m: 120, service_speed_kn: 15, beam_m: 20, gm_m: 1.5, stowage: 'deck_low', position_x_l: 0.7, mass_t: 62,
  unit_length_m: 6, unit_breadth_m: 4, unit_height_m: 4, sloshing: 'yes', friction: 'steel_timber',
  lashings: 'S; 4; 90; 40; 3\nP; 2; 90; 40; 3\nP; 2; 90; 10; 3.9',
};

export const tests = [
  {
    name: 'Annex 13 worked example, forces: 62 t low on deck at x/L 0.7, 120 m ship at 15 kn → F_x = 2.9 × 0.89 × 62 + 16 + 8 = 184 kN, F_y = 6.3 × 0.89 × 62 + 24 + 12 = 384 kN, F_z = 6.2 × 0.89 × 62 = 342 kN',
    source: 'CSS Code Annex 13 (MSC/Circ.664), example of the advanced calculation method',
    run: () => {
      const { outputs } = calculate(EXAMPLE);
      assertClose(outputs.factor_length_speed, 0.89, { abs: 1e-12 }, 'Table 3');
      assertClose(outputs.fx_kn, 2.9 * 0.89 * 62 + 16 + 8, { rel: 1e-9 }, 'F_x');
      assertClose(outputs.fy_kn, 6.3 * 0.89 * 62 + 24 + 12, { rel: 1e-9 }, 'F_y');
      assertClose(outputs.fz_kn, 6.2 * 0.89 * 62, { rel: 1e-9 }, 'F_z');
      assertClose(outputs.fy_kn, 384, { abs: 0.5 }, 'F_y as printed');
    },
  },
  {
    name: 'Annex 13 worked example, balance: starboard 0.3 × 62 × 9.81 + 4 × 60 × 0.96 ≈ 412 kN and port 0.3 × 62 × 9.81 + 2 × 60 × 0.96 + 2 × 60 × 1.04 ≈ 422 kN, both above F_y = 384 kN',
    source: 'CSS Code Annex 13 example (CS = 90/1.5 = 60 kN, f from Table 5)',
    run: () => {
      const rows = calculate(EXAMPLE).outputs.balance_table.rows;
      assertClose(rows[0][2], 412, { abs: 1 }, 'starboard arrangement');
      assertClose(rows[1][2], 422, { abs: 1 }, 'port arrangement');
      assertEqual(rows[0][3] === 'OK' && rows[1][3] === 'OK', true, 'both hold');
    },
  },
  {
    name: 'Table 5: f = μ sin α + cos α gives 0.96 at 40°, 1.04 at 10° and 0.72 at −30° for μ 0.3; 0.83 at 40° for μ 0.1',
    source: 'CSS Code Annex 13 Table 5 (f-values)',
    run: () => {
      assertClose(lashingEfficiency(0.3, 40), 0.96, { abs: 0.005 }, '0.3 / 40°');
      assertClose(lashingEfficiency(0.3, 10), 1.04, { abs: 0.005 }, '0.3 / 10°');
      assertClose(lashingEfficiency(0.3, -30), 0.72, { abs: 0.005 }, '0.3 / −30°');
      assertClose(lashingEfficiency(0.1, 40), 0.83, { abs: 0.005 }, '0.1 / 40°');
    },
  },
  {
    name: 'Tables 3 and 4: 100 m at 15 kn is 1.00, 200 m at 24 kn 0.85, 50 m at 9 kn 1.20, 110 m at 16.5 kn interpolates between 1.10/1.00/0.98/0.89; B/GM 10 on deck high multiplies a_y by 1.19',
    source: 'CSS Code Annex 13 Tables 3 and 4 (linear interpolation)',
    run: () => {
      assertClose(lengthSpeedFactor(100, 15), 1.0, { abs: 1e-12 }, 'base');
      assertClose(lengthSpeedFactor(200, 24), 0.85, { abs: 1e-12 }, 'long and fast');
      assertClose(lengthSpeedFactor(50, 9), 1.2, { abs: 1e-12 }, 'short and slow');
      assertClose(lengthSpeedFactor(110, 16.5), (1.0 + 0.89 + 1.1 + 0.98) / 4, { abs: 1e-12 }, 'bilinear');
      const stiff = calculate({ ...EXAMPLE, stowage: 'deck_high', ship_length_m: 100, beam_m: 20, gm_m: 2 }).outputs;
      assertClose(stiff.factor_bgm, 1.19, { abs: 1e-12 }, 'B/GM 10');
      assertClose(stiff.ay_m_s2, 6.9 * 1.19, { rel: 1e-12 }, 'a_y = 6.9 × 1.19 at x/L 0.7');
    },
  },
  {
    name: 'Longitudinal sliding with friction reduced by F_z: μ (m g − F_z) = 0.3 (608.2 − 342.1) = 79.8 kN without longitudinal lashings, too little for F_x = 184 kN; below deck no wind or sloshing is added',
    source: 'CSS Code Annex 13 §7.2.3 longitudinal sliding',
    run: () => {
      const rows = calculate(EXAMPLE).outputs.balance_table.rows;
      assertClose(rows[4][2], 0.3 * (62 * 9.81 - 6.2 * 0.89 * 62), { rel: 1e-9 }, 'friction only');
      assertEqual(rows[4][3], 'NOT OK', 'fails without longitudinal lashings');
      const hold = calculate({ ...EXAMPLE, stowage: 'hold' }).outputs;
      assertClose(hold.fy_kn, 5.3 * 0.89 * 62, { rel: 1e-9 }, 'no wind or sloshing in the hold');
    },
  },
  {
    name: 'Invalid inputs fail fast: an unknown side letter, a fractional number of lashings, a vertical angle over 90°, zero mass',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => parseLashings('X; 2; 90; 40; 3'), 'side must be', 'side');
      assertThrows(() => parseLashings('S; 1.5; 90; 40; 3'), 'whole number', 'count');
      assertThrows(() => parseLashings('S; 2; 90; 95; 3'), 'between 0 and 90', 'angle');
      assertThrows(() => calculate({ mass_t: 0 }), 'greater than zero', 'mass');
    },
  },
];
