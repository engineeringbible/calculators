/**
 * padeye/tests.js — EN 1993-1-8 pin connection checks of a padeye and its shackle pin.
 * Run: node run-tests.js padeye
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Type A geometry: a ≥ 250 000/(2 × 30 × 355) + 2 × 53/3 = 47.07 mm and c ≥ 11.74 + 17.67 = 29.40 mm',
    source: 'EN 1993-1-8:2005 Table 3.9, type A (given thickness)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.a_required_mm, 250000 / (2 * 30 * 355) + (2 * 53) / 3, { rel: 1e-12 }, 'a');
      assertClose(outputs.c_required_mm, 250000 / (2 * 30 * 355) + 53 / 3, { rel: 1e-12 }, 'c');
    },
  },
  {
    name: 'Bearing 1.5 t d fy/γM0 with fy the lower of plate and pin: 798.75 kN with a 355 MPa plate, 675 kN when the pin has 300 MPa',
    source: 'EN 1993-1-8:2005 Table 3.10, bearing of plate and pin',
    run: () => {
      assertClose(calculate({}).outputs.bearing_kn, 798.75, { rel: 1e-12 }, '355 MPa plate');
      assertClose(calculate({ fy_pin_mpa: 300, fu_pin_mpa: 500 }).outputs.bearing_kn, (1.5 * 30 * 50 * 300) / 1000, { rel: 1e-12 }, '300 MPa pin');
    },
  },
  {
    name: 'Pin shear 0.6 A fup/γM2 = 0.6 × 1963.5 × 800/1.25 = 754.0 kN per plane against F/2 = 125 kN in double shear',
    source: 'EN 1993-1-8:2005 Table 3.10, shear of the pin; Table 2.1 γM2 = 1.25',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.pin_shear_kn, (0.6 * Math.PI * 625 * 800) / 1.25 / 1000, { rel: 1e-12 }, 'Fv,Rd');
      assertClose(outputs.checks_table.rows[3][1], 125, { rel: 1e-12 }, 'Fv,Ed');
    },
  },
  {
    name: 'Pin bending MEd = F (b + 4c + 2a)/8 = 250 × 100/8 = 3125 kN·mm against MRd = 1.5 (π 50³/32) 640 = 11.78 kN·m; interaction 0.098',
    source: 'EN 1993-1-8:2005 Figure 3.11 and Table 3.10',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.pin_moment_knm, 3.125, { rel: 1e-12 }, 'MEd');
      assertClose(outputs.pin_moment_rd_knm, (1.5 * (Math.PI * 50 ** 3) / 32 * 640) / 1e6, { rel: 1e-12 }, 'MRd');
      assertClose(outputs.checks_table.rows[5][3], (3.125 / outputs.pin_moment_rd_knm) ** 2 + (125 / outputs.pin_shear_kn) ** 2, { rel: 1e-12 }, 'interaction');
    },
  },
  {
    name: 'Replaceable pin: σh,Ed = 0.591 √(210 000 × 170 000 × 3/(50² × 30)) = 706.2 MPa against 2.5 × 355 = 887.5 MPa governs at 0.80',
    source: 'EN 1993-1-8:2005 eqs (3.14)–(3.16)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.contact_stress_mpa, 0.591 * Math.sqrt((210000 * 170000 * 3) / (2500 * 30)), { rel: 1e-12 }, 'σh');
      assertClose(outputs.max_utilisation, outputs.contact_stress_mpa / 887.5, { rel: 1e-12 }, 'governs');
      assertEqual(calculate({ replaceable: 'no' }).outputs.checks_table.rows.length, 6, 'no serviceability rows');
    },
  },
  {
    name: 'At 900 kN the pin fails in combined bending and shear (1.27) and the failure is flagged',
    source: 'EN 1993-1-8:2005 Table 3.10, combined shear and bending',
    run: () => {
      const { outputs, warnings } = calculate({ force_kn: 900 });
      assertClose(outputs.max_utilisation, 1.268, { abs: 0.001 }, 'utilisation');
      assertEqual(warnings.some((w) => w.startsWith('Not adequate')), true, 'warning');
    },
  },
  {
    name: 'Invalid inputs are rejected: a pin larger than the hole, an ultimate strength below the yield strength',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ pin_mm: 60 }), 'must not exceed the hole');
      assertThrows(() => calculate({ fu_pin_mpa: 500 }), 'not be below its yield');
    },
  },
];
