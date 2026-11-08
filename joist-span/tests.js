/**
 * joist-span/tests.js — checks of the bending and deflection spans by hand and of the NDS factors.
 * Run: node run-tests.js joist-span
 */
import { calculate, sizeFactor, spanBending, spanDeflection } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const FT = 0.3048;
const PSI = 6894.757293168;
const PSF = 47.88025898033584;

export const tests = [
  {
    name: 'DF-L No. 2 2×10 at 16 in, 10 + 40 psf: F\'b = 900 × 1.1 × 1.15 = 1 138.5 psi; bending span √(8 × 1 138.5 × 21.39 / 5.556) = 187.3 in = 15.61 ft governs',
    source: 'Hand calculation in inch-pound units: S = 1.5 × 9.25²/6, w = 50 psf × 16/12 ft = 66.67 lb/ft; NDS 2018 C_F = 1.1 and C_r = 1.15',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.fb_adj_pa / PSI, 1138.5, { abs: 1e-6 }, 'F\'b');
      const S = (1.5 * 9.25 ** 2) / 6;
      const w = (50 * 16) / 144; // lb/in
      assertClose(o.span_bending_m / IN, Math.sqrt((8 * 1138.5 * S) / w), { rel: 1e-9 }, 'bending span');
      assertClose(o.max_span_m / FT, 15.606, { abs: 0.001 }, 'max span');
      assertEqual(o.governs, 'Bending', 'governs');
      assertEqual(o.max_span_text, '15 ft 7 in', 'ft-in');
    },
  },
  {
    name: 'Deflection spans of the same joist: L/360 under 40 psf gives (384 × 1.6e6 × 98.93 / (5 × 4.444 × 360))^⅓ = 196.6 in; L/240 under 50 psf gives 208.9 in',
    source: 'Δ = 5 w L⁴ / (384 E I) solved for L; I = 1.5 × 9.25³/12 = 98.93 in⁴',
    run: () => {
      const o = calculate({}).outputs;
      const I = (1.5 * 9.25 ** 3) / 12;
      assertClose(o.span_live_m / IN, Math.cbrt((384 * 1.6e6 * I) / (5 * ((40 * 16) / 144) * 360)), { rel: 1e-9 }, 'live');
      assertClose(o.span_total_m / IN, Math.cbrt((384 * 1.6e6 * I) / (5 * ((50 * 16) / 144) * 240)), { rel: 1e-9 }, 'total');
      // at a span where Δ = L/360 exactly, the deflection check returns that span
      const L = spanDeflection(10e9, 1e-4, 1000, 360);
      assertClose((5 * 1000 * L ** 4) / (384 * 10e9 * 1e-4), L / 360, { rel: 1e-12 }, 'inverse');
      assertClose(spanBending(10e6, 1e-3, 1000), Math.sqrt(80), { rel: 1e-12 }, 'bending inverse');
    },
  },
  {
    name: 'NDS size factors for 2 in lumber: 2×4 1.5, 2×6 1.3, 2×8 1.2, 2×10 1.1, 2×12 1.0, 2×14 0.9; C_r drops to 1.0 beyond 24 in spacing',
    source: 'AWC NDS Supplement 2018, Table 4A size factors (2" and 3" thick); NDS 4.3.9 repetitive member factor',
    run: () => {
      assertEqual([3.5, 5.5, 7.25, 9.25, 11.25, 13.25].map(sizeFactor).join(','), '1.5,1.3,1.2,1.1,1,0.9', 'C_F');
      const o = calculate({ spacing_m: 32 * IN });
      assertClose(o.outputs.fb_adj_pa / PSI, 900 * 1.1, { abs: 1e-6 }, 'no C_r');
      assertEqual(o.warnings.length > 0, true, 'warning');
    },
  },
  {
    name: 'Heavy dead load: with 60 psf dead and 5 psf live, dead alone at C_D 0.9 governs bending (60/65 > 0.9/1.0)',
    source: 'NDS 2018 2.3.2: each load combination is checked with the C_D of its shortest-duration load',
    run: () => {
      const o = calculate({ dead_pa: 60 * PSF, live_pa: 5 * PSF, n_total: 60, n_live: 60 }).outputs;
      assertEqual(o.governs.startsWith('Bending under dead load'), true, 'dead governs');
      const S = (1.5 * 9.25 ** 2) / 6;
      assertClose(o.span_bending_m / IN, Math.sqrt((8 * 900 * 0.9 * 1.1 * 1.15 * S) / ((60 * 16) / 144)), { rel: 1e-9 }, 'dead span');
    },
  },
  {
    name: 'Span check at 15 ft: stress ratio (15/15.606)² = 92.4 %; live deflection 0.384 in (L/469); a flat member, thick preset lumber and no load are refused',
    source: 'Hand calculation; validation contract',
    run: () => {
      const o = calculate({ span_m: 15 * FT }).outputs;
      assertClose(o.stress_ratio, (15 / 15.6055) ** 2, { abs: 1e-4 }, 'ratio');
      assertClose(o.defl_live_m / IN, 0.3838, { abs: 1e-4 }, 'Δ live');
      assertThrows(() => calculate({ size: 'custom', b_m: 0.2, d_m: 0.1 }), 'deeper');
      assertThrows(() => calculate({ size: 'custom', b_m: 3.5 * IN, d_m: 9.25 * IN }), 'Other');
      assertThrows(() => calculate({ dead_pa: 0, live_pa: 0 }), 'enter a dead or a live load');
    },
  },
];
