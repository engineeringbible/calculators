/**
 * compression-ratio/tests.js — checks against CR = (V_s + V_c) / V_c and the cylinder volumes of the parts.
 * Run: node run-tests.js compression-ratio
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const IN3 = IN ** 3;
const CC = 1e-6;

export const tests = [
  {
    name: '4.030 × 3.480 in, 64 cc chamber, 0.041 in gasket of 4.100 in, 0.025 in deck, 5 cc reliefs: 727.4 cc swept, 83.1 cc clearance, 9.75:1',
    source: 'Hand calculation: π/4 b² s = 44.389 in³ = 727.41 cc; gasket π/4 × 4.1² × 0.041 = 0.5413 in³ = 8.870 cc; deck 0.3189 in³ = 5.226 cc',
    run: () => {
      const o = calculate({ bore_m: 4.03 * IN, stroke_m: 3.48 * IN, chamber_m3: 64 * CC, gasket_bore_m: 4.1 * IN, gasket_t_m: 0.041 * IN, deck_m: 0.025 * IN, piston_m3: 5 * CC, cylinders: 8 }).outputs;
      assertClose(o.swept_m3 / CC, 727.41, { abs: 0.01 }, 'swept');
      assertClose(o.gasket_m3 / CC, 8.870, { abs: 0.001 }, 'gasket');
      assertClose(o.deck_m3 / CC, 5.226, { abs: 0.001 }, 'deck');
      assertClose(o.clearance_m3 / CC, 83.096, { abs: 0.001 }, 'clearance');
      assertClose(o.cr, 810.508 / 83.096, { rel: 1e-5 }, 'CR');
      assertClose(o.quench_m / IN, 0.066, { abs: 1e-9 }, 'piston to head');
    },
  },
  {
    name: 'Chevrolet 350: 4.000 in bore × 3.480 in stroke × 8 is 349.9 in³ (5.73 L)',
    source: 'Published GM small-block 350 dimensions (4.00 in × 3.48 in, 350 cu in, 5.7 L)',
    run: () => {
      const o = calculate({ bore_m: 4 * IN, stroke_m: 3.48 * IN, gasket_bore_m: 4.1 * IN, cylinders: 8 }).outputs;
      assertClose(o.displacement_m3 / IN3, 349.85, { abs: 0.01 }, 'in³');
      assertClose(o.displacement_l_m3 * 1000, 5.733, { abs: 0.001 }, 'L');
    },
  },
  {
    name: 'Chamber only (no gasket, deck or dish): 86 × 86 mm with 50 cc gives (499.6 + 50) / 50 = 10.99',
    source: 'Limiting case of r_c = (V_d + V_c) / V_c (Heywood Section 2.2)',
    run: () => {
      const o = calculate({ bore_m: 0.086, stroke_m: 0.086, chamber_m3: 50 * CC, gasket_bore_m: 0.087, gasket_t_m: 0, deck_m: 0, piston_m3: 0, cylinders: 4 }).outputs;
      const vs = (Math.PI / 4) * 0.086 ** 3;
      assertClose(o.swept_m3, vs, { rel: 1e-12 }, 'swept');
      assertClose(o.cr, (vs + 50 * CC) / (50 * CC), { rel: 1e-12 }, 'CR');
      assertClose(o.cr, 10.99, { abs: 0.005 }, 'CR rounded');
    },
  },
  {
    name: 'A 5 cc dome instead of 5 cc of reliefs removes 10 cc of clearance and raises the ratio to 10.95',
    source: 'Sign convention of the piston volume (dome negative); hand calculation (810.508 − 10) / 73.096',
    run: () => {
      const o = calculate({ piston_m3: -5 * CC }).outputs;
      assertClose(o.clearance_m3 / CC, 73.096, { abs: 0.001 }, 'clearance');
      assertClose(o.cr, 800.508 / 73.096, { rel: 1e-5 }, 'CR');
    },
  },
  {
    name: 'Piston above the deck by more than the gasket, or a dome larger than the clearance, is rejected; a small gasket bore warns',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ deck_m: -0.002, gasket_t_m: 0.001 }), 'hit the head');
      assertThrows(() => calculate({ piston_m3: -100 * CC }), 'dome fills');
      assertThrows(() => calculate({ cylinders: 2.5 }), 'whole number');
      assertEqual(calculate({ gasket_bore_m: 4 * IN }).warnings.length, 1, 'gasket bore warning');
    },
  },
];
