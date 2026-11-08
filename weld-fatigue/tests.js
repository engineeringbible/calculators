/**
 * weld-fatigue/tests.js — DNV-RP-C203 S-N curves, thickness effect, Miner sum, equivalent range and screening.
 * Run: node run-tests.js weld-fatigue
 */
import { calculate, snCurve } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Curve D in air: 10^(12.164 − 3 log 100) = 1.459 × 10^6 cycles at 100 MPa; below the slope change 10^(15.606 − 5 log 40) = 3.94 × 10^7 at 40 MPa',
    source: 'DNV-RP-C203 (2011) Table 2-1, eq. (2.4.1)',
    run: () => {
      const sn = snCurve('D', 'air');
      assertClose(sn.cycles(100), 10 ** (12.164 - 3 * 2), { rel: 1e-12 }, '100 MPa');
      assertClose(sn.cycles(40), 10 ** (15.606 - 5 * Math.log10(40)), { rel: 1e-12 }, '40 MPa');
      assertClose(sn.cycles(100), 1.459e6, { rel: 1e-3 }, 'value');
    },
  },
  {
    name: 'Fatigue limits at 10^7 cycles from log a2 agree with Table 2-1: D 52.63, F 41.52, W3 21.05 MPa',
    source: 'DNV-RP-C203 (2011) Table 2-1, fatigue limit column',
    run: () => {
      [['D', 52.63], ['F', 41.52], ['W3', 21.05]].forEach(([curve, limit]) => {
        assertClose(snCurve(curve, 'air').range(1e7 * 1.0001), limit, { abs: 0.02 }, curve);
      });
    },
  },
  {
    name: 'Seawater with cathodic protection: the slope changes at 10^6 cycles and D gives 2.51 times fewer cycles than in air at 100 MPa',
    source: 'DNV-RP-C203 (2011) Table 2-2 (log a1 = 11.764 for D)',
    run: () => {
      assertClose(snCurve('D', 'cp').cycles(100), 10 ** (11.764 - 6), { rel: 1e-12 }, 'CP');
      assertClose(snCurve('D', 'air').cycles(100) / snCurve('D', 'cp').cycles(100), 10 ** 0.4, { rel: 1e-12 }, 'ratio');
    },
  },
  {
    name: 'Free corrosion: one slope m = 3 for all cycles; D at 40 MPa gives 10^(11.687 − 3 log 40) = 7.6 × 10^6 cycles',
    source: 'DNV-RP-C203 (2011) Table 2-3',
    run: () => {
      assertClose(snCurve('D', 'fc').cycles(40), 10 ** (11.687 - 3 * Math.log10(40)), { rel: 1e-12 }, 'free corrosion');
      assertClose(snCurve('D', 'fc').cycles(40), 7.6e6, { rel: 0.01 }, 'value');
    },
  },
  {
    name: 'Thickness effect: 50 mm with k = 0.20 multiplies the stress ranges by 2^0.2 = 1.149, thinner plates get no credit, and the T curve uses k = 0.30 when SCF > 10',
    source: 'DNV-RP-C203 (2011) eq. (2.4.3), Tables 2-1 to 2-3',
    run: () => {
      assertClose(calculate({ thickness_mm: 50 }).outputs.thickness_factor, 2 ** 0.2, { rel: 1e-12 }, '50 mm');
      assertEqual(calculate({ thickness_mm: 16 }).outputs.thickness_factor, 1, '16 mm');
      assertClose(calculate({ curve: 'T', thickness_mm: 64, reference_thickness_mm: 32, scf: 12 }).outputs.thickness_factor, 2 ** 0.3, { rel: 1e-12 }, 'T, SCF 12');
    },
  },
  {
    name: 'Default one-year histogram on curve D in air: Miner sum 0.01666, fatigue life 60.0 years, utilisation 0.666 over 20 years with DFF 2',
    source: 'Palmgren–Miner, DNV-RP-C203 (2011) eq. (2.2.1) with η = 1/DFF',
    run: () => {
      const { outputs } = calculate({});
      const sum = outputs.blocks_table.rows.reduce((s, r) => s + r[2] / r[3], 0);
      assertClose(outputs.damage_period, sum, { rel: 1e-12 }, 'sum of n/N');
      assertClose(outputs.damage_period, 0.01666, { abs: 5e-6 }, 'damage');
      assertClose(outputs.fatigue_life_years, 60.03, { abs: 0.01 }, 'life');
      assertClose(outputs.utilisation, (20 / outputs.fatigue_life_years) * 2, { rel: 1e-12 }, 'utilisation');
    },
  },
  {
    name: 'A single block is its own equivalent range, and ranges below 52.63 × 2^−0.33 = 41.87 MPa pass the screening of section 2.11',
    source: 'DNV-RP-C203 (2011) 2.11; equivalent range on the same curve',
    run: () => {
      assertClose(calculate({ histogram: '60; 1000000' }).outputs.equivalent_range_mpa, 60, { rel: 1e-9 }, 'equivalent');
      const low = calculate({ histogram: '40; 1000000\n30; 5000000' });
      assertClose(low.outputs.fatigue_limit_mpa, 10 ** ((15.606 - 7) / 5) * 2 ** -0.33, { rel: 1e-12 }, 'reduced limit');
      assertEqual(low.warnings.some((w) => w.includes('may be omitted')), true, 'screening');
    },
  },
  {
    name: 'Invalid inputs are rejected: a histogram line with one number, a negative range, an unknown curve',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ histogram: '100' }), 'two numbers');
      assertThrows(() => calculate({ histogram: '-5; 100' }), 'must not be negative');
      assertThrows(() => calculate({ curve: 'Z' }), 'must be one of');
    },
  },
];
