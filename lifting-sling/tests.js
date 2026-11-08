/**
 * lifting-sling/tests.js — checks against the sling-angle relation, EN 818-4 chain WLL table and EN 13414-1 factors.
 * Run: node run-tests.js lifting-sling
 */
import { calculate, legTensionN, chainG8WllKg, wireRopeWllKg, HITCHES } from './calc.js';
import { GRAVITY_M_S2 } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const TWO_LEG = { load_kg: 10000, dynamic_factor: 1, legs: 2, effective_legs: 0, angle_basis: 'angle', angle_deg: 30, hitch: 'straight', sling_type: 'rated', rated_wll_kg: 8000 };

export const tests = [
  {
    name: 'Sling angle: 10 t on two legs at β = 30° gives 5.77 t per leg (factor 1.155); at 45° 7.07 t; at 60° each leg carries the full 10 t',
    source: 'ASME B30.9 / EN 13414-1 sling-angle relation T = W / (n cos β); the 60°-to-vertical limit where T = W',
    run: () => {
      const W = 10000 * GRAVITY_M_S2;
      assertClose(legTensionN(W, 2, 30), W / (2 * Math.cos(Math.PI / 6)), { rel: 1e-12 }, 'helper');
      assertClose(calculate(TWO_LEG).outputs.leg_tension_kg, 5773.5, { abs: 0.1 }, '30°');
      assertClose(calculate(TWO_LEG).outputs.angle_factor, 1.1547, { abs: 1e-4 }, 'factor 30°');
      assertClose(calculate({ ...TWO_LEG, angle_deg: 45 }).outputs.leg_tension_kg, 7071.1, { abs: 0.1 }, '45°');
      assertClose(calculate({ ...TWO_LEG, angle_deg: 60 }).outputs.leg_tension_kg, 10000, { rel: 1e-9 }, '60°');
      assertClose(calculate({ ...TWO_LEG, angle_deg: 0 }).outputs.leg_tension_kg, 5000, { rel: 1e-12 }, 'vertical legs');
    },
  },
  {
    name: 'Geometry: 4 m spread with 4 m legs gives β = asin(2/4) = 30°, the same tension as the angle input; included angle 60°',
    source: 'Right-triangle geometry sin β = (spread/2) / leg length (LEEA guidance)',
    run: () => {
      const byAngle = calculate(TWO_LEG).outputs;
      const byGeometry = calculate({ ...TWO_LEG, angle_basis: 'geometry', spread_m: 4, leg_length_m: 4 }).outputs;
      assertClose(byGeometry.angle_out_deg, 30, { abs: 1e-9 }, 'angle');
      assertClose(byGeometry.included_angle_deg, 60, { abs: 1e-9 }, 'included');
      assertClose(byGeometry.leg_tension_n, byAngle.leg_tension_n, { rel: 1e-12 }, 'same tension');
      assertClose(byGeometry.compression_n, byAngle.leg_tension_n * 0.5, { rel: 1e-9 }, 'compression T sin 30°');
    },
  },
  {
    name: 'Dynamic factor and effective legs: DAF 1.25 raises the hook load to 122.6 kN; a 4-leg sling is rated on 3 legs by default (3.92 t per leg at 30°) and on 4 only when overridden',
    source: 'DNV-ST-N001 dynamic amplification; EN 13414-1 / ASME B30.9 three-leg assumption for four-leg slings',
    run: () => {
      const daf = calculate({ ...TWO_LEG, dynamic_factor: 1.25 }).outputs;
      assertClose(daf.hook_load_n, 10000 * GRAVITY_M_S2 * 1.25, { rel: 1e-12 }, 'hook load');
      const four = calculate({ ...TWO_LEG, legs: 4 }).outputs;
      assertEqual(four.effective_legs_out, 3, 'default 3 effective legs');
      assertClose(four.leg_tension_kg, 10000 / (3 * Math.cos(Math.PI / 6)), { rel: 1e-12 }, 'tension on 3 legs');
      const fourAll = calculate({ ...TWO_LEG, legs: 4, effective_legs: 4 });
      assertEqual(fourAll.outputs.effective_legs_out, 4, 'override');
      assertEqual(fourAll.warnings.some((w) => w.includes('All legs assumed')), true, 'warning on equal sharing');
      assertEqual(calculate({ ...TWO_LEG, legs: 1, angle_deg: 30 }).outputs.angle_out_deg, 0, 'single leg is vertical');
    },
  },
  {
    name: 'Grade 8 chain WLL ≈ 0.0314 d²: 8 mm 2.0 t, 10 mm 3.14 t (table 3.15), 13 mm 5.3 t, 16 mm 8.0 t, 20 mm 12.6 t (table 12.5)',
    source: 'EN 818-4 Table (Grade 8 single-leg chain sling WLL)',
    run: () => {
      assertClose(chainG8WllKg(8), 2010, { abs: 20 }, '8 mm');
      assertClose(chainG8WllKg(10), 3150, { rel: 0.01 }, '10 mm');
      assertClose(chainG8WllKg(13), 5300, { rel: 0.01 }, '13 mm');
      assertClose(chainG8WllKg(16), 8000, { rel: 0.01 }, '16 mm');
      assertClose(chainG8WllKg(20), 12500, { rel: 0.01 }, '20 mm');
      const { outputs } = calculate({ ...TWO_LEG, sling_type: 'chain_g8', sling_diameter_m: 0.016 });
      assertClose(outputs.sling_wll_single_kg, 8038, { abs: 5 }, 'in calculate()');
      assertEqual(outputs.wll_basis.startsWith('Grade 8 chain 16 mm'), true, 'basis text');
    },
  },
  {
    name: 'Wire rope sling 20 mm 6×36 IWRC 1770: MBL = 0.356 × 20² × 1770/1000 = 252 kN; WLL = 252 × 0.9 / 5 = 45.4 kN = 4.62 t',
    source: 'EN 12385-4 minimum breaking force (K = 0.356 for 6×36 IWRC); EN 13414-1 termination efficiency 0.9 and safety factor 5',
    run: () => {
      const mblKn = 0.356 * 400 * 1.77;
      assertClose(mblKn, 252.0, { abs: 0.1 }, 'MBL');
      assertClose(wireRopeWllKg(20) * GRAVITY_M_S2 / 1000, (mblKn * 0.9) / 5, { rel: 1e-9 }, 'WLL kN');
      assertClose(wireRopeWllKg(20), 4624, { abs: 5 }, 'WLL kg');
      const { outputs } = calculate({ ...TWO_LEG, sling_type: 'wire_rope', sling_diameter_m: 0.02 });
      assertClose(outputs.sling_wll_single_kg, 4624, { abs: 5 }, 'in calculate()');
    },
  },
  {
    name: 'Hitch factors: choke 0.8 halves nothing but reduces capacity to 6.4 t for an 8 t sling; basket with vertical legs doubles to 16 t',
    source: 'EN 13414-1 mode factors; ASME B30.9 choker (0.8) and basket (2.0) hitches',
    run: () => {
      assertEqual(HITCHES.choke.factor, 0.8, 'choke');
      assertEqual(HITCHES.basket.factor, 2.0, 'basket');
      assertClose(calculate({ ...TWO_LEG, hitch: 'choke' }).outputs.leg_capacity_kg, 6400, { rel: 1e-12 }, 'choke capacity');
      assertClose(calculate({ ...TWO_LEG, hitch: 'basket', angle_deg: 0 }).outputs.leg_capacity_kg, 16000, { rel: 1e-12 }, 'basket capacity');
    },
  },
  {
    name: 'Utilisation and maximum load: 10 t at 30° on two 8 t legs = 72 %; maximum load 13.86 t; 16 t at 30° exceeds the capacity',
    source: 'Utilisation = T / (WLL × hitch factor); maximum W = WLL n cos β / DAF',
    run: () => {
      const ok = calculate(TWO_LEG);
      assertClose(ok.outputs.utilisation_pct, (5773.5 / 8000) * 100, { abs: 0.01 }, 'utilisation');
      assertClose(ok.outputs.max_load_kg, 8000 * 2 * Math.cos(Math.PI / 6), { rel: 1e-9 }, 'max load');
      assertEqual(ok.outputs.status.startsWith('OK'), true, 'OK');
      const over = calculate({ ...TWO_LEG, load_kg: 16000 });
      assertEqual(over.outputs.status.startsWith('NOT PERMITTED'), true, 'not permitted');
      assertEqual(over.warnings.some((w) => w.includes('exceeds the sling capacity')), true, 'warning');
    },
  },
  {
    name: 'Angle warnings: 50° is allowed with a recommendation, 65° is not permitted',
    source: 'EN 13414-1 (β ≤ 60°, 45° recommended); ASME B30.9',
    run: () => {
      const fifty = calculate({ ...TWO_LEG, angle_deg: 50 });
      assertEqual(fifty.warnings.some((w) => w.includes('between 45° and 60°')), true, '50° recommendation');
      const sixtyFive = calculate({ ...TWO_LEG, angle_deg: 65 });
      assertEqual(sixtyFive.warnings.some((w) => w.includes('not permitted')), true, '65° not permitted');
    },
  },
  {
    name: 'Invalid inputs fail fast: more effective legs than legs, legs too short for the spread, zero chain diameter',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...TWO_LEG, effective_legs: 3 }), 'cannot exceed the number of legs', 'effective legs');
      assertThrows(() => calculate({ ...TWO_LEG, angle_basis: 'geometry', spread_m: 10, leg_length_m: 4 }), 'legs cannot reach', 'geometry');
      assertThrows(() => calculate({ ...TWO_LEG, sling_type: 'chain_g8', sling_diameter_m: 0 }), 'greater than zero', 'diameter');
    },
  },
];
