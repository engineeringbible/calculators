/**
 * consolidation-settlement/tests.js — checks against Terzaghi's time factor table and hand calculations of settlement.
 * Run: node run-tests.js consolidation-settlement
 */
import { calculate, degreeOfConsolidation, timeFactor, settlement } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const YEAR = 31557600;

export const tests = [
  {
    name: 'Time factors: U 10 % → 0.008, 20 % → 0.031, 30 % → 0.071, 40 % → 0.126, 50 % → 0.197, 60 % → 0.287, 70 % → 0.403, 80 % → 0.567, 90 % → 0.848',
    source: 'Das & Sobhan, Principles of Geotechnical Engineering, ch. 11: table of T_v against U from Terzaghi\'s solution',
    run: () => {
      [[0.1, 0.008], [0.2, 0.031], [0.3, 0.071], [0.4, 0.126], [0.5, 0.197], [0.6, 0.287], [0.7, 0.403], [0.8, 0.567], [0.9, 0.848]]
        .forEach(([u, t]) => assertClose(timeFactor(u), t, { abs: 0.0011 }, `U ${u}`));
    },
  },
  {
    name: 'Approximations: T_v = (π/4) U² below 60 % is exact to 1e-6 at U = 30 %; 1.781 − 0.933 log(100 − U%) is within 0.3 % at 90 %; the series inverts to itself',
    source: 'Das & Sobhan, ch. 11 (approximations of Terzaghi\'s solution quoted there)',
    run: () => {
      assertClose(timeFactor(0.3), (Math.PI / 4) * 0.09, { abs: 1e-6 }, 'π/4 U²');
      assertClose(timeFactor(0.9), 1.781 - 0.933 * Math.log10(10), { rel: 0.003 }, 'log form');
      assertClose(degreeOfConsolidation(timeFactor(0.73)), 0.73, { abs: 1e-9 }, 'inverse');
      assertClose(degreeOfConsolidation(1e-7), Math.sqrt(4e-7 / Math.PI), { rel: 1e-9 }, 'small T');
    },
  },
  {
    name: 'Normally consolidated: 4 m, e0 1.1, Cc 0.36, 100 → 150 kPa: S = 0.36 × 4/2.1 × log 1.5 = 120.7 mm',
    source: 'Hand calculation: S = Cc H/(1 + e0) log(σ\'1/σ\'0) (Das & Sobhan, ch. 11)',
    run: () => {
      const o = calculate({ thickness_m: 4, e0: 1.1, cc: 0.36, history: 'nc', s0_pa: 100000, ds_pa: 50000 }).outputs;
      assertClose(o.settlement_m * 1000, (0.36 * 4) / 2.1 * Math.log10(1.5) * 1000, { rel: 1e-12 }, 'S');
      assertClose(o.settlement_m * 1000, 120.74, { abs: 0.01 }, 'value');
      assertEqual(o.ocr, 1, 'OCR');
    },
  },
  {
    name: 'Over-consolidated example: 3 m, e0 0.9, Cc 0.30, Cr 0.05, 80 → 140 kPa past σ\'p 120 kPa: 13.90 + 31.71 = 45.6 mm; staying below σ\'p uses Cr only',
    source: 'Hand calculation: S = Cr H/(1 + e0) log(σ\'p/σ\'0) + Cc H/(1 + e0) log(σ\'1/σ\'p) (Das & Sobhan, ch. 11)',
    run: () => {
      const o = calculate({}).outputs;
      const k = 3 / 1.9;
      assertClose(o.settlement_m, 0.05 * k * Math.log10(1.5) + 0.3 * k * Math.log10(140 / 120), { rel: 1e-12 }, 'S');
      assertClose(o.settlement_m * 1000, 45.61, { abs: 0.01 }, 'mm');
      assertClose(settlement({ H: 3, e0: 0.9, cc: 0.3, cr: 0.05, s0: 80, sp: 120, ds: 30 }), 0.05 * k * Math.log10(110 / 80), { rel: 1e-12 }, 'Cr only');
    },
  },
  {
    name: 'Rate: c_v 2 m²/year, H_dr 1.5 m, t90 = 0.848 × 2.25/2 = 0.954 years; single drainage takes 4 times as long; 2 m²/year = 6.34 × 10⁻⁴ cm²/s',
    source: 'T_v = c_v t / H_dr² (Terzaghi); unit conversion with the 365.25-day year',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.t_target_s / YEAR, 0.95410, { abs: 1e-4 }, 't90');
      assertClose(calculate({ drainage: 'single' }).outputs.t_target_s, 4 * o.t_target_s, { rel: 1e-9 }, 'single drainage');
      const cm2s = (2 / YEAR) * 1e4;
      assertClose(calculate({ cv: cm2s, cv_unit: 'cm2_s' }).outputs.t_target_s, o.t_target_s, { rel: 1e-9 }, 'cm²/s');
      assertClose(cm2s, 6.338e-4, { abs: 1e-6 }, 'conversion');
      assertClose(o.settlement_t_m, o.u_at_t * o.settlement_m, { rel: 1e-12 }, 'S(t)');
    },
  },
  {
    name: 'σ\'p below σ\'0 and Cr above Cc are refused; a very thick layer warns',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ sp_pa: 50000 }), 'under-consolidated');
      assertThrows(() => calculate({ cr: 0.5 }), 'must not exceed');
      assertEqual(calculate({ thickness_m: 20 }).warnings.length > 0, true, 'thick');
    },
  },
];
