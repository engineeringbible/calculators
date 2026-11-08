/**
 * carbon-equivalent/tests.js — checks of the IIW, AWS, Pcm and CET formulas and the EN 1011-2 preheat equation.
 * Run: node run-tests.js carbon-equivalent
 */
import { calculate, preheatEn1011 } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const ZERO = { c: 0, mn: 0, si: 0, cr: 0, mo: 0, v: 0, ni: 0, cu: 0, b: 0, nb: 0, ti: 0 };

export const tests = [
  {
    name: 'C-Mn steel C 0.18, Mn 1.40, Si 0.30, Cr 0.05, Mo 0.02, V 0.01, Ni 0.05, Cu 0.10: CE 0.4393, CE(AWS) 0.4893, Pcm 0.2707, CET 0.3308',
    source: 'EN 1011-2 Annex C (CE, CET); AWS D1.1 Annex B (CE + Si/6); Ito–Bessyo Pcm (hand calculation)',
    run: () => {
      const o = calculate({ preheat: 'none' }).outputs;
      assertClose(o.ce_iiw, 0.18 + 1.4 / 6 + 0.08 / 5 + 0.15 / 15, { abs: 1e-12 }, 'CE');
      assertClose(o.ce_aws, o.ce_iiw + 0.05, { abs: 1e-12 }, 'CE AWS');
      assertClose(o.pcm, 0.270667, { abs: 1e-6 }, 'Pcm');
      assertClose(o.cet, 0.33075, { abs: 1e-9 }, 'CET');
      assertEqual(o.preheat_c, null, 'no preheat asked');
    },
  },
  {
    name: 'Plain carbon steel C 0.20, Mn 0.60: CE = 0.20 + 0.10 = 0.30, Pcm = 0.20 + 0.03 = 0.23, CET = 0.20 + 0.06 = 0.26',
    source: 'Formulas of EN 1011-2 Annex C and Ito–Bessyo (hand calculation)',
    run: () => {
      const o = calculate({ ...ZERO, c: 0.2, mn: 0.6, preheat: 'none' }).outputs;
      assertClose(o.ce_iiw, 0.3, { abs: 1e-12 }, 'CE');
      assertClose(o.pcm, 0.23, { abs: 1e-12 }, 'Pcm');
      assertClose(o.cet, 0.26, { abs: 1e-12 }, 'CET');
    },
  },
  {
    name: 'EN 1011-2 C.3 preheat: CET 0.35 %, d 20 mm, HD 2, Q 1.5 kJ/mm gives 57.4 °C; the example gives 108.1 °C',
    source: 'T_p = 697 CET + 160 tanh(d/35) + 62 HD^0.35 + (53 CET − 32) Q − 328 (EN 1011-2 Annex C, method B; hand calculation)',
    run: () => {
      const hand = 697 * 0.35 + 160 * Math.tanh(20 / 35) + 62 * 2 ** 0.35 + (53 * 0.35 - 32) * 1.5 - 328;
      assertClose(preheatEn1011(0.35, 20, 2, 1.5), hand, { rel: 1e-12 }, 'formula');
      assertClose(hand, 57.42, { abs: 0.01 }, 'value');
      assertClose(calculate({}).outputs.preheat_c, 108.13, { abs: 0.01 }, 'example');
    },
  },
  {
    name: 'Preheat trends: thicker plate and more hydrogen need more preheat, a higher heat input needs less',
    source: 'EN 1011-2 Annex C: the effects of d, HD and Q on the minimum preheat',
    run: () => {
      const base = calculate({}).outputs.preheat_c;
      assertEqual(calculate({ thickness_m: 0.06 }).outputs.preheat_c > base, true, 'thickness');
      assertEqual(calculate({ hd: 15 }).outputs.preheat_c > base, true, 'hydrogen');
      assertEqual(calculate({ q_kj_mm: 2.5 }).outputs.preheat_c < base, true, 'heat input');
    },
  },
  {
    name: 'Each element enters with its coefficient: 0.5 % Ni adds 0.0333 to CE, 0.0083 to Pcm and 0.0125 to CET; 0.002 % B adds 0.01 to Pcm only',
    source: 'Coefficients of CE(IIW), Pcm and CET',
    run: () => {
      const a = calculate({ preheat: 'none' }).outputs;
      const b = calculate({ preheat: 'none', ni: 0.55 }).outputs;
      assertClose(b.ce_iiw - a.ce_iiw, 0.5 / 15, { abs: 1e-12 }, 'CE Ni');
      assertClose(b.pcm - a.pcm, 0.5 / 60, { abs: 1e-12 }, 'Pcm Ni');
      assertClose(b.cet - a.cet, 0.5 / 40, { abs: 1e-12 }, 'CET Ni');
      const c = calculate({ preheat: 'none', b: 0.002 }).outputs;
      assertClose(c.pcm - a.pcm, 0.01, { abs: 1e-12 }, 'Pcm B');
      assertClose(c.ce_iiw, a.ce_iiw, { abs: 1e-15 }, 'CE B');
    },
  },
  {
    name: 'Outside EN 1011-2 method B: Mn 0.3 %, C 0.40 %, 5 mm plate, HD 30 and Q 5 kJ/mm are refused; CE alone still calculates',
    source: 'EN 1011-2 Annex C validity range (C 0.05–0.32, Mn 0.5–1.9 %, d 10–90 mm, HD 1–20, Q 0.5–4.0)',
    run: () => {
      assertThrows(() => calculate({ mn: 0.3 }), 'Mn 0.3 %');
      assertThrows(() => calculate({ c: 0.4 }), 'C 0.4 %');
      assertThrows(() => calculate({ thickness_m: 0.005 }), 'Plate thickness');
      assertThrows(() => calculate({ hd: 30 }), 'Diffusible hydrogen');
      assertThrows(() => calculate({ q_kj_mm: 5 }), 'Effective heat input');
      assertEqual(calculate({ mn: 0.3, preheat: 'none' }).outputs.preheat_c, null, 'CE only');
      assertThrows(() => calculate({ c: -0.1 }), 'Carbon C');
    },
  },
];
