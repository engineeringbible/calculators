/**
 * viscosity-sus/tests.js — checks against ASTM D2161 Tables 1 and 3.
 * Run: node run-tests.js viscosity-sus
 */
import { calculate, susAt100F, sfsAt122F, tempFactor } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: '20.00 cSt is 97.8 SUS at 100 °F and 98.5 SUS at 210 °F',
    source: 'ASTM D2161 Table 1 (row 20.00 mm²/s)',
    run: () => {
      assertClose(susAt100F(20), 97.8, { abs: 0.05 }, '100 °F');
      assertClose(susAt100F(20) * tempFactor(210), 98.5, { abs: 0.05 }, '210 °F');
    },
  },
  {
    name: '50.0 cSt is 233 SUS at 100 °F and 234 SUS at 210 °F',
    source: 'ASTM D2161 Table 1 (row 50.0 mm²/s)',
    run: () => {
      assertClose(susAt100F(50), 233, { abs: 0.5 }, '100 °F');
      assertClose(susAt100F(50) * tempFactor(210), 234, { abs: 0.5 }, '210 °F');
    },
  },
  {
    name: 'Saybolt Furol at 122 °F: 103 cSt is 50.0 SFS and 203 cSt is 96.2 SFS',
    source: 'ASTM D2161 eq. 7 and Table 3',
    run: () => {
      assertClose(sfsAt122F(103), 50.0, { abs: 0.05 }, '103');
      assertClose(sfsAt122F(203), 96.2, { abs: 0.05 }, '203');
    },
  },
  {
    name: 'Above 75 cSt SUS approaches 4.632 × cSt (ASTM D2161 eq. 1, B = 4.632 at 100 °F); the inverse returns the input',
    source: 'ASTM D2161 §5.2 and §5.4',
    run: () => {
      assertClose(susAt100F(500) / 500, 4.632, { abs: 0.002 }, 'linear');
      const o = calculate({ direction: 'to_cst', sus: susAt100F(37.5), temp_c: 37.7778 }).outputs;
      assertClose(o.cst_out, 37.5, { rel: 1e-6 }, 'inverse');
    },
  },
  {
    name: 'Dynamic viscosity 20 cSt × 0.870 g/cm³ = 17.4 cP; below 32 SUS and below 1.8 cSt are refused',
    source: 'μ = ν ρ; ASTM D2161 §7.2 (32.0 s and above)',
    run: () => {
      assertClose(calculate({ cst: 20, density: 870 }).outputs.cp, 17.4, { rel: 1e-12 }, 'cP');
      assertThrows(() => calculate({ direction: 'to_cst', sus: 30 }), 'Saybolt Universal Seconds');
      assertThrows(() => calculate({ cst: 1 }), 'Kinematic viscosity');
      assertEqual(calculate({ cst: 20 }).outputs.sfs, null, 'no Furol below 25.1 s');
    },
  },
];
