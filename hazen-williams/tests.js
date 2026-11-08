/**
 * hazen-williams/tests.js — checks against the NFPA 13 US form, the Williams–Hazen velocity form and Darcy–Weisbach.
 * Run: node run-tests.js hazen-williams
 */
import { calculate, headLoss, C_FACTORS } from './calc.js';
import { frictionFactor, G } from '../shared/pipes.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const GPM = 0.003785411784 / 60;
const IN = 0.0254;
const FT = 0.3048;
const PSI = 6894.757293168;

export const tests = [
  {
    name: '500 US gpm through 1 000 ft of 6 in bore pipe, C = 150: 15.7 ft of head, 6.82 psi, within 0.3 % of the NFPA 13 form 4.52 Q^1.85/(C^1.85 d^4.87) = 6.81 psi',
    source: 'NFPA 13, hydraulic calculation procedures (Hazen–Williams in psi per foot, Q in gpm, d in inches)',
    run: () => {
      const o = calculate({ solve: 'headloss', material: 'plastic', length_m: 1000 * FT, flow_m3s: 500 * GPM, diameter_m: 6 * IN }).outputs;
      assertClose(o.headloss_out_m / FT, 15.749, { abs: 0.001 }, 'h_f in ft');
      const nfpa = ((4.52 * 500 ** 1.85) / (150 ** 1.85 * 6 ** 4.87)) * 1000;
      assertClose(o.dp_pa / PSI, nfpa, { rel: 0.003 }, 'psi against NFPA 13');
      assertClose(o.velocity_m_s / FT, 5.674, { abs: 0.001 }, 'velocity');
      assertClose(o.per_100, 1.5749, { abs: 1e-4 }, 'ft per 100 ft');
    },
  },
  {
    name: 'The SI constant follows from V = 0.849 C R^0.63 S^0.54: (0.849 × π/4 × 4^−0.63)^−1.852 = 10.67, and the US conversion gives 4.52 psi per foot',
    source: 'Williams & Hazen, Hydraulic Tables, 3rd ed. (1920); unit conversion of the head-loss form',
    run: () => {
      assertClose((0.849 * (Math.PI / 4) * 4 ** -0.63) ** -1.852, 10.67, { abs: 0.01 }, 'K_SI');
      assertClose(2.63 / 0.54, 4.8704, { abs: 0.0001 }, 'diameter exponent');
      const psiPerFt = (headLoss(1, GPM, 1, IN) * 999.1 * G * FT) / PSI;
      assertClose(psiPerFt, 4.52, { rel: 0.001 }, 'US constant');
    },
  },
  {
    name: 'Cross-check with Darcy–Weisbach: 20 L/s in 1 000 m of 150 mm PVC (C = 150) loses 7.32 m; Colebrook with ε = 0.0015 mm at 15 °C gives 7.25 m, 1 % less',
    source: 'Darcy–Weisbach with the Colebrook friction factor of shared/pipes.js; ν = 1.139 mm²/s for water at 15 °C',
    run: () => {
      const o = calculate({ material: 'plastic', length_m: 1000, flow_m3s: 0.02, diameter_m: 0.15 }).outputs;
      assertClose(o.headloss_out_m, 7.317, { abs: 0.001 }, 'Hazen–Williams');
      const v = 0.02 / ((Math.PI / 4) * 0.15 ** 2);
      const f = frictionFactor((v * 0.15) / 1.139e-6, 1.5e-6 / 0.15);
      const dw = ((f * 1000) / 0.15) * (v * v) / (2 * G);
      assertClose(o.headloss_out_m, dw, { rel: 0.03 }, 'within 3 % of Darcy–Weisbach');
    },
  },
  {
    name: 'Solving for flow or diameter inverts the head-loss form exactly; doubling the flow multiplies the loss by 2^1.852 = 3.61',
    source: 'Algebra of h_f = 10.67 L Q^1.852 / (C^1.852 d^4.8704)',
    run: () => {
      const h = calculate({ material: 'di_lined', length_m: 2500, flow_m3s: 0.08, diameter_m: 0.3 }).outputs.headloss_out_m;
      assertClose(calculate({ solve: 'flow', material: 'di_lined', length_m: 2500, headloss_m: h, diameter_m: 0.3 }).outputs.flow_out_m3s, 0.08, { rel: 1e-12 }, 'flow');
      assertClose(calculate({ solve: 'diameter', material: 'di_lined', length_m: 2500, headloss_m: h, flow_m3s: 0.08 }).outputs.diameter_out_m, 0.3, { rel: 1e-12 }, 'diameter');
      assertClose(headLoss(1, 0.2, 140, 0.3) / headLoss(1, 0.1, 140, 0.3), 2 ** 1.852, { rel: 1e-12 }, 'flow exponent');
      assertEqual(C_FACTORS.di_lined.c, 140, 'cement-lined iron');
      assertEqual(C_FACTORS.steel_wet.c, 120, 'black steel, wet');
    },
  },
  {
    name: 'Warnings outside the usual range: 1.9 in bore at 50 gpm (velocity 1.72 m/s) warns only for the bore; 1 000 gpm in 6 in (3.46 m/s) and 20 gpm in 6 in (0.07 m/s) warn for velocity',
    source: 'Validity range of Hazen–Williams for water distribution practice (d ≥ 50 mm, 0.3–3 m/s)',
    run: () => {
      const small = calculate({ flow_m3s: 50 * GPM, diameter_m: 1.9 * IN });
      assertEqual(small.warnings.length, 1, 'small bore');
      assertEqual(calculate({ flow_m3s: 1000 * GPM }).warnings.length, 1, 'fast');
      assertEqual(calculate({ flow_m3s: 20 * GPM }).warnings.length, 1, 'slow');
      assertEqual(calculate({}).warnings.length, 0, 'default in range');
    },
  },
  {
    name: 'Invalid inputs: zero flow, zero length, a custom C above 160 and an unknown material are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ flow_m3s: 0 }), 'Flow rate');
      assertThrows(() => calculate({ length_m: 0 }), 'Pipe length');
      assertThrows(() => calculate({ material: 'custom', c_custom: 200 }), 'Hazen–Williams C');
      assertThrows(() => calculate({ material: 'glass' }), 'Pipe material');
      assertThrows(() => calculate({ solve: 'flow', headloss_m: -1 }), 'Allowed head loss');
    },
  },
];
