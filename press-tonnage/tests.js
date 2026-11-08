/**
 * press-tonnage/tests.js — checks against Durma's punching example, the Bystronic air-bending formula and hand
 * calculations.
 * Run: node run-tests.js press-tonnage
 */
import { calculate, airBendPerMetre } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const PSI = 6894.757293168;
const US_TON = 8896.443230521;

export const tests = [
  {
    name: 'Durma: a 20 mm hole in 3 mm steel at τ = 300 MPa needs 56 549 N, 5.77 tonnes-force; +10 % stripping 62.20 kN; +20 % margin 74.64 kN',
    source: 'Durma, How to calculate punching force (F = L t τ, worked example 56 547 N)',
    run: () => {
      const o = calculate({ diameter_m: 0.02, thickness_m: 0.003, strength_mode: 'shear', shear_pa: 3e8, strip: 0.1, margin: 0.2 }).outputs;
      assertClose(o.punch_n, 56548.7, { abs: 0.1 }, 'F');
      assertClose(o.punch_n / 9806.65, 5.77, { abs: 0.005 }, 'tf');
      assertClose(o.load_n / 1000, 62.2035, { abs: 0.0001 }, 'with stripping');
      assertClose(o.press_n / 1000, 74.6442, { abs: 0.0001 }, 'with margin');
    },
  },
  {
    name: 'US punching: 1 in hole in 1/4 in steel of 60 ksi UTS, τ = 0.75 × 60 = 45 ksi: π × 1 × 0.25 × 45 000 = 35 343 lbf = 17.67 US tons',
    source: 'F = L t τ with τ ≈ 0.75 UTS for wrought steel (Deutschman et al.) (hand calculation)',
    run: () => {
      const o = calculate({ strip: 0, margin: 0 }).outputs;
      assertClose(o.punch_n / 4.4482216152605, 35342.9, { abs: 0.1 }, 'lbf');
      assertClose(o.load_us_tons, 17.6715, { abs: 0.0001 }, 'US tons');
      assertClose(o.tau_pa / PSI, 45000, { rel: 1e-12 }, 'shear');
    },
  },
  {
    name: 'Bystronic air bending: 1/4 in mild steel (60 ksi) on a 2 in V-die needs 575 × 0.25² / 2 = 17.97 tons per foot, 179.7 tons for 10 ft; a 90 ksi material needs 1.5 times as much',
    source: 'Bystronic, How to calculate press brake tonnage (575 constant, material factor UTS / 60 000 psi)',
    run: () => {
      const o = calculate({ operation: 'brake', margin: 0 }).outputs;
      assertClose(o.tons_ft, 17.96875, { rel: 1e-9 }, 'tons per foot');
      assertClose(o.load_us_tons, 179.6875, { rel: 1e-9 }, '10 ft');
      assertClose(airBendPerMetre(0.25 * IN, 2 * IN, 90000 * PSI) / airBendPerMetre(0.25 * IN, 2 * IN, 60000 * PSI), 1.5, { rel: 1e-12 }, 'material factor');
      assertClose(o.per_m * 0.3048 / US_TON, 17.96875, { rel: 1e-9 }, 'unit conversion');
    },
  },
  {
    name: 'Rectangle 1 × 2 in has a 6 in perimeter; four holes a stroke need four times the force; doubling the V-die opening halves the bending force',
    source: 'F ∝ perimeter × number of holes; tonnage ∝ 1/V (formula structure)',
    run: () => {
      const r = calculate({ shape: 'rect', strip: 0 }).outputs;
      assertClose(r.perimeter_out_m / IN, 6, { rel: 1e-12 }, 'perimeter');
      assertClose(calculate({ holes: 4 }).outputs.punch_n, 4 * calculate({}).outputs.punch_n, { rel: 1e-12 }, 'four holes');
      assertClose(calculate({ operation: 'brake', die_v_m: 4 * IN }).outputs.per_m, calculate({ operation: 'brake' }).outputs.per_m / 2, { rel: 1e-12 }, 'wider die');
    },
  },
  {
    name: 'A hole smaller than the thickness warns; a V-die no wider than twice the thickness, zero holes and zero thickness are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ diameter_m: 0.2 * IN }).warnings.length, 1, 'small hole');
      assertThrows(() => calculate({ operation: 'brake', die_v_m: 0.5 * IN }), 'twice the thickness');
      assertThrows(() => calculate({ holes: 0 }), 'Holes per stroke');
      assertThrows(() => calculate({ thickness_m: 0 }), 'Material thickness');
    },
  },
];
