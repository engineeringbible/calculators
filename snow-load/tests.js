/**
 * snow-load/tests.js — checks against EN 1991-1-3 and ASCE 7-16 by hand.
 * Run: node run-tests.js snow-load
 */
import { calculate, mu1, slopeFactor } from './calc.js';
import { assertClose, assertEqual } from '../shared/test-runner.js';

const PSF = 4.4482216152605 / 0.09290304;

export const tests = [
  {
    name: 'EN: s_k 1.0 kPa, normal exposure, 35° roof: μ1 = 0.8 × 25/30 = 0.667, s = 0.667 kPa; flat 0.8 kPa',
    source: 'EN 1991-1-3 eq. (5.1), Table 5.2',
    run: () => {
      const o = calculate({ code: 'en', ground_pa: 1000, slope_deg: 35, exposure: 'normal', ct_en: 1 }).outputs;
      assertClose(o.shape_factor, 2 / 3, { rel: 1e-12 }, 'μ1');
      assertClose(o.roof_pa, 666.667, { abs: 0.001 }, 's');
      assertClose(o.flat_pa, 800, { rel: 1e-12 }, 'flat');
    },
  },
  {
    name: 'EN μ1 is 0.8 to 30°, 0.4 at 45°, 0 from 60°; windswept 0.8 and sheltered 1.2 scale the load',
    source: 'EN 1991-1-3 Tables 5.1 and 5.2',
    run: () => {
      assertEqual(mu1(10), 0.8, '10°');
      assertClose(mu1(45), 0.4, { rel: 1e-12 }, '45°');
      assertEqual(mu1(60), 0, '60°');
      const base = { code: 'en', ground_pa: 1000, slope_deg: 0 };
      assertClose(calculate({ ...base, exposure: 'sheltered' }).outputs.roof_pa / calculate({ ...base, exposure: 'windswept' }).outputs.roof_pa, 1.5, { rel: 1e-12 }, 'Ce ratio');
    },
  },
  {
    name: 'ASCE 7-16: p_g 30 psf, partially exposed, heated, category II, flat: p_f = 0.7 × 30 = 21 psf (above the 20 psf minimum)',
    source: 'ASCE 7-16 eq. 7.3-1 and §7.3.4',
    run: () => {
      const o = calculate({ code: 'asce', ground_pa: 30 * PSF, slope_deg: 0, exposure: 'normal', thermal: 'heated', surface: 'other', risk: 'II' }).outputs;
      assertClose(o.roof_pa / PSF, 21, { rel: 1e-9 }, 'p_f');
    },
  },
  {
    name: 'ASCE slope factor: warm rough roof 1.0 to 30°, 0.75 at 40°; slippery 1.0 to 5°; cold roof (C_t 1.2) rough 1.0 to 45°; 0 at 70°',
    source: 'ASCE 7-16 Fig. 7.4-1 (a), (b), (c)',
    run: () => {
      assertEqual(slopeFactor(30, 1.0, false), 1, 'warm rough 30');
      assertClose(slopeFactor(40, 1.0, false), 0.75, { rel: 1e-12 }, 'warm rough 40');
      assertClose(slopeFactor(37.5, 1.0, true), 0.5, { rel: 1e-12 }, 'warm slippery 37.5');
      assertEqual(slopeFactor(45, 1.2, false), 1, 'cold rough 45');
      assertEqual(slopeFactor(70, 1.0, false), 0, '70');
      assertClose(calculate({ code: 'asce', ground_pa: 50 * PSF, slope_deg: 40, exposure: 'normal' }).outputs.roof_pa / PSF, 26.25, { rel: 1e-9 }, '40° roof');
    },
  },
  {
    name: 'ASCE minimum load: p_g 15 psf, windswept, 5° roof: p_f = 9.45 psf but p_m = I_s p_g = 15 psf governs; total on 100 m² of plan',
    source: 'ASCE 7-16 §7.3.4 (p_m for slopes < 15°)',
    run: () => {
      const o = calculate({ code: 'asce', ground_pa: 15 * PSF, slope_deg: 5, exposure: 'windswept', roof_area_m2: 100 }).outputs;
      assertClose(o.flat_pa / PSF, 9.45, { rel: 1e-9 }, 'p_f');
      assertClose(o.roof_pa / PSF, 15, { rel: 1e-9 }, 'p_m');
      assertClose(o.total_n, o.roof_pa * 100, { rel: 1e-12 }, 'total');
      assertEqual(o.note.startsWith('Minimum'), true, 'note');
    },
  },
];
