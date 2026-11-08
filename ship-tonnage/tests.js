/**
 * ship-tonnage/tests.js — checks against ITC 1969 Annex I regulations 3 and 4 and the Appendix 2 coefficient table.
 * Run: node run-tests.js ship-tonnage
 */
import { calculate, kCoefficient } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Appendix 2 table: K1 = 0.2200 at 10 m³, 0.2600 at 1 000 m³, 0.2800 at 10 000 m³ and 0.3200 at 1 000 000 m³',
    source: 'ITC 1969, Annex I, Appendix 2 (coefficients K1 and K2)',
    run: () => {
      assertClose(kCoefficient(10), 0.22, { abs: 1e-12 }, '10');
      assertClose(kCoefficient(1000), 0.26, { abs: 1e-12 }, '1 000');
      assertClose(kCoefficient(10000), 0.28, { abs: 1e-12 }, '10 000');
      assertClose(kCoefficient(1e6), 0.32, { abs: 1e-12 }, '1 000 000');
    },
  },
  {
    name: 'Cargo ship: V 30 000 m³ → GT 8 686; Vc 16 000 m³, d 8.5 m, D 12 m → NT 4 054',
    source: 'ITC 1969, Annex I, regulations 3 and 4; hand calculation',
    run: () => {
      const o = calculate({ v_m3: 30000, vc_m3: 16000, depth_m: 12, draft_m: 8.5, n1: 0, n2: 0 }).outputs;
      assertClose(o.gt, 8686.273, { abs: 1e-3 }, 'GT');
      assertClose(o.draft_factor, (34 / 36) ** 2, { rel: 1e-12 }, '(4d/3D)²');
      assertClose(o.nt, 4054.312, { abs: 1e-3 }, 'NT');
      assertEqual(o.limits.startsWith('None'), true, 'no limits');
    },
  },
  {
    name: 'Passenger ship: V 60 000 m³, no cargo, 1 500 + 200 passengers: cargo term raised to 0.25 GT, K3 = 3.467, NT = 9 703',
    source: 'ITC 1969, Annex I, regulation 4(1)(b) and K3 = 1.25 (GT + 10 000)/10 000; hand calculation',
    run: () => {
      const o = calculate({ v_m3: 60000, vc_m3: 0, depth_m: 20, draft_m: 7, n1: 1500, n2: 200 }).outputs;
      assertClose(o.gt, 17733.78, { abs: 0.01 }, 'GT');
      assertClose(o.cargo_term, 0.25 * o.gt, { rel: 1e-12 }, '0.25 GT');
      assertClose(o.k3, 1.25 * (o.gt + 10000) / 10000, { rel: 1e-12 }, 'K3');
      assertClose(o.nt, 9702.86, { abs: 0.01 }, 'NT');
    },
  },
  {
    name: 'Limits: (4d/3D)² capped at 1; fewer than 13 passengers ignored; NT not below 0.30 GT',
    source: 'ITC 1969, Annex I, regulation 4(1)(a), (c) and the N1 + N2 < 13 rule',
    run: () => {
      const a = calculate({ v_m3: 30000, vc_m3: 16000, depth_m: 10, draft_m: 9 }).outputs;
      assertEqual(a.draft_factor, 1, 'factor capped');
      const b = calculate({ v_m3: 1000, vc_m3: 100, depth_m: 12, draft_m: 8.5, n1: 5, n2: 7 }).outputs;
      assertEqual(b.passenger_term, 0, '12 passengers not counted');
      assertClose(b.nt, 0.3 * b.gt, { rel: 1e-12 }, '0.30 GT');
      assertEqual(b.limits.includes('0.30 GT'), true, 'limit noted');
    },
  },
  {
    name: 'A cargo volume above the total and a fractional passenger count are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ v_m3: 1000, vc_m3: 2000 }), 'cannot exceed');
      assertThrows(() => calculate({ n1: 2.5 }), 'whole number');
      assertThrows(() => calculate({ v_m3: 0 }), 'must be greater than zero');
    },
  },
];
