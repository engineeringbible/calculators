/**
 * load-combinations/tests.js — checks against the ASCE 7-16 and EN 1990 combination equations, by hand.
 * Run: node run-tests.js load-combinations
 */
import { calculate, asceCombos, PSI, SNOW_PSI } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const base = { D: 10, L: 8, Lr: 2, S: 5, R: 0, W: 6, E: 0 };
const value = (code, name, extra = {}) => {
  const row = calculate({ ...base, code, ...extra }).outputs.table.rows.find((r) => r[0] === name);
  return row ? Number(row[2]) : NaN;
};

export const tests = [
  {
    name: 'ASCE 7-16 LRFD with D 10, L 8, Lr 2, S 5, W 6: 1.4D = 14; 2(S) = 27.3; 3(S, L) = 28; 4(+W, S) = 28.5 governs; 6(−W) = 0.9 × 10 − 6 = 3.0 is the minimum',
    source: 'ASCE/SEI 7-16, 2.3.1 combinations 1 to 7; hand calculation',
    run: () => {
      assertClose(value('asce_lrfd', '1'), 14, { abs: 1e-9 }, '1');
      assertClose(value('asce_lrfd', '2 (S)'), 27.3, { abs: 1e-9 }, '2');
      assertClose(value('asce_lrfd', '3 (S, L)'), 28, { abs: 1e-9 }, '3');
      const o = calculate(base).outputs;
      assertClose(o.max, 28.5, { abs: 1e-9 }, 'max');
      assertEqual(o.max_name.startsWith('4 (+W, S)'), true, 'max combination');
      assertClose(o.min, 3, { abs: 1e-9 }, 'min');
    },
  },
  {
    name: 'ASCE 7-16 LRFD exception: with 0.5 on L, combination 4 drops to 24.5; seismic E 7 gives 1.2D + E + L + 0.2S = 28 and 0.9D − E = 2',
    source: 'ASCE/SEI 7-16, 2.3.1 Exception 1 and combinations 5 and 7',
    run: () => {
      assertClose(value('asce_lrfd', '4 (+W, S)', { l_factor: '0.5' }), 24.5, { abs: 1e-9 }, 'half L');
      assertClose(value('asce_lrfd', '5 (+E)', { E: 7 }), 12 + 7 + 8 + 1, { abs: 1e-9 }, '5');
      assertClose(value('asce_lrfd', '7 (−E)', { E: 7 }), 2, { abs: 1e-9 }, '7');
    },
  },
  {
    name: 'ASCE 7-16 ASD: D + L = 18; D + 0.75L + 0.75(0.6W) + 0.75S = 22.45 governs; 0.6D − 0.6W = 2.4 is the minimum; 0.6D + 0.7E with E 10 is 13',
    source: 'ASCE/SEI 7-16, 2.4.1 combinations 1 to 8; hand calculation',
    run: () => {
      assertClose(value('asce_asd', '2'), 18, { abs: 1e-9 }, '2');
      const o = calculate({ ...base, code: 'asce_asd' }).outputs;
      assertClose(o.max, 22.45, { abs: 1e-9 }, 'max 6a');
      assertClose(o.min, 2.4, { abs: 1e-9 }, 'min 7');
      assertClose(value('asce_asd', '8 (+E)', { E: 10 }), 13, { abs: 1e-9 }, '8');
      assertEqual(asceCombos('asd', { ...base, E: 0 }, 1).some(([n]) => n.includes('0.7E')), false, 'no E rows when E = 0');
    },
  },
  {
    name: 'EN 1990 6.10, category A, snow below 1 000 m: snow leading 1.35 × 10 + 1.5 × 5 + 1.5 × 0.7 × 8 + 1.5 × 0.6 × 6 = 34.8; roof load leading excludes snow and wind (24.9); uplift 1.0 × 10 − 1.5 × 6 = 1.0',
    source: 'EN 1990 6.10 with Table A1.1 ψ0 (A 0.7, snow 0.5, wind 0.6, H 0) and Table A1.2(B) γ factors; A1.2.1(3)',
    run: () => {
      const o = calculate({ ...base, code: 'en_610' }).outputs;
      assertClose(o.max, 34.8, { abs: 1e-9 }, 'max');
      assertClose(value('en_610', '6.10 leading Lr (max)'), 24.9, { abs: 1e-9 }, 'Lr leading');
      assertClose(o.min, 1, { abs: 1e-9 }, 'min');
      assertEqual(PSI.E.psi.join('/'), '1/0.9/0.8', 'storage ψ');
      assertEqual(SNOW_PSI.high.psi.join('/'), '0.7/0.5/0.2', 'snow > 1 000 m');
    },
  },
  {
    name: 'EN 1990 6.10a/b: 6.10a = 1.35 × 10 + 1.5(0.7 × 8 + 0.5 × 5 + 0.6 × 6) = 31.05; 6.10b snow leading 0.85 × 1.35 × 10 + 7.5 + 8.4 + 5.4 = 32.775 governs; seismic 6.12b G + E + 0.3 L = 22.4 for E 10; rain is ignored and bad input refused',
    source: 'EN 1990 expressions 6.10a, 6.10b (ξ = 0.85) and 6.12b with ψ2 = 0.3 for category A',
    run: () => {
      assertClose(value('en_610ab', '6.10a (max)'), 31.05, { abs: 1e-9 }, '6.10a');
      assertClose(calculate({ ...base, code: 'en_610ab' }).outputs.max, 32.775, { abs: 1e-9 }, '6.10b');
      assertClose(value('en_610', '6.12b seismic, +E (max)', { E: 10 }), 10 + 10 + 0.3 * 8, { abs: 1e-9 }, '6.12b');
      assertEqual(calculate({ ...base, code: 'en_610', R: 3 }).warnings.length, 1, 'rain ignored');
      assertThrows(() => calculate({ D: Number.NaN }), 'Load D');
      assertThrows(() => calculate({ code: 'aci' }), 'Combination rules');
    },
  },
];
