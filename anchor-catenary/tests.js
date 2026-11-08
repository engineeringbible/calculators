/**
 * anchor-catenary/tests.js — checks against the catenary identities, ISO 1704 chain masses and hand-verified values.
 * Run: node run-tests.js anchor-catenary
 */
import { calculate, chainMassKgPerM, submergedWeightNPerM, windForceN, catenary, maxHorizontalForceN, SHACKLE_M } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const W76 = submergedWeightNPerM(chainMassKgPerM(76));

export const tests = [
  {
    name: 'Stud-link chain mass: 76 mm → 126.5 kg/m (tables ≈ 127), 50 mm → 54.8 kg/m; submerged weight is 86.9 % of the air weight',
    source: 'ISO 1704:2008 / class equipment tables: mass ≈ 0.0219 d² kg/m; buoyancy factor 1 − 1025/7850',
    run: () => {
      assertClose(chainMassKgPerM(76), 126.49, { abs: 0.01 }, '76 mm');
      assertClose(chainMassKgPerM(76), 127, { rel: 0.01 }, '76 mm vs tables');
      assertClose(chainMassKgPerM(50), 54.75, { abs: 0.01 }, '50 mm');
      assertClose(submergedWeightNPerM(100) / (100 * 9.80665), 1 - 1025 / 7850, { rel: 1e-12 }, 'buoyancy factor');
      assertClose(W76, 1078.5, { abs: 0.5 }, 'w for 76 mm (N/m)');
    },
  },
  {
    name: 'Catenary with H = 200 kN, 76 mm chain, D = 30 m: a = 185.4 m, cable needed for a horizontal pull 109.7 m, horizontal reach 104.1 m, hawse tension 232.4 kN',
    source: 'Catenary relations s² = D² + 2 a D, x = a asinh(s/a), T = H + w D (Danton, Theory and Practice of Seamanship; Admiralty Manual of Seamanship)',
    run: () => {
      const g = catenary(200000, W76, 30, 500);
      assertClose(g.a, 200000 / W76, { rel: 1e-12 }, 'a');
      assertClose(g.a, 185.4, { abs: 0.2 }, 'a value');
      assertClose(g.suspended, Math.sqrt(900 + 2 * g.a * 30), { rel: 1e-12 }, 's formula');
      assertClose(g.suspended, 109.7, { abs: 0.1 }, 's value');
      assertClose((g.a + 30) ** 2, g.a ** 2 + g.suspended ** 2, { rel: 1e-12 }, 'catenary identity (a + D)² = a² + s²');
      assertClose(g.horizontalDistance - g.onBottom, 104.1, { abs: 0.2 }, 'x suspended');
      assertClose(g.tensionHawse, 200000 + W76 * 30, { rel: 1e-12 }, 'T hawse');
      assertClose(g.tensionHawse, 232355, { abs: 20 }, 'T hawse value');
      assertEqual(g.upliftDeg, 0, 'horizontal at the anchor');
    },
  },
  {
    name: 'Five shackles (137.5 m) leave 27.8 m on the bottom at 200 kN; the maximum force without uplift is 323.7 kN, at which the suspended length equals the cable',
    source: 'Inversion L² = D² + 2 a D → a = (L² − D²)/(2D), H = w a',
    run: () => {
      const { outputs } = calculate({ depth_to_hawse_m: 30, chain_basis: 'diameter', chain_diameter_m: 0.076, cable_out_m: 137.5, force_basis: 'given', given_force_n: 200000 });
      assertClose(outputs.chain_on_bottom_m, 137.5 - 109.7, { abs: 0.1 }, 'on bottom');
      assertClose(outputs.max_force_no_uplift_n, (W76 * (137.5 ** 2 - 900)) / 60, { rel: 1e-12 }, 'H_max formula');
      assertClose(outputs.max_force_no_uplift_n, 323660, { abs: 100 }, 'H_max value');
      const atLimit = catenary(maxHorizontalForceN(W76, 30, 137.5), W76, 30, 137.5);
      assertClose(atLimit.suspended, 137.5, { rel: 1e-9 }, 'suspended = L at the limit');
      assertClose(atLimit.onBottom, 0, { abs: 1e-6 }, 'nothing on the bottom at the limit');
      assertClose(outputs.scope_ratio, 137.5 / 30, { rel: 1e-12 }, 'scope');
    },
  },
  {
    name: 'Cable too short to lie on the bottom (80 m at 200 kN): the catenary is fully suspended with an uplift angle at the anchor and satisfies the rise equation',
    source: 'General catenary y² = a² + s² solved for the virtual arc below the anchor (bisection)',
    run: () => {
      const g = catenary(200000, W76, 30, 80);
      assertEqual(g.onBottom, 0, 'nothing on the bottom');
      assertEqual(g.upliftDeg > 0, true, 'uplift present');
      const a = 200000 / W76;
      const s0 = a * Math.tan((g.upliftDeg * Math.PI) / 180);
      assertClose(Math.sqrt(a * a + (s0 + 80) ** 2) - Math.sqrt(a * a + s0 * s0), 30, { abs: 1e-6 }, 'rise equation satisfied');
      assertEqual(g.horizontalDistance < 80 && g.horizontalDistance > Math.sqrt(80 * 80 - 30 * 30) * 0.99, true, 'horizontal reach between straight-line and cable length');
      assertEqual(g.tensionHawse > 200000, true, 'hawse tension above H');
      const { warnings } = calculate({ depth_to_hawse_m: 30, cable_out_m: 80, force_basis: 'given', given_force_n: 200000 });
      assertEqual(warnings.some((w) => w.includes('lifts off the bottom')), true, 'uplift warning');
    },
  },
  {
    name: 'Wind force: 30 kn on 1 500 m² with C_d 1.0 = 0.5 × 1.225 × 1500 × 15.43² = 218.8 kN',
    source: 'Drag equation F = ½ ρ C_d A V² with ρ_air = 1.225 kg/m³ (OCIMF MEG4 wind force formulation)',
    run: () => {
      const v = 30 * (1852 / 3600);
      assertClose(windForceN(v, 1500, 1.0), 218836, { abs: 20 }, 'wind force');
      const { outputs } = calculate({});
      assertClose(outputs.horizontal_force_n, 218836, { abs: 20 }, 'default H');
      const withCurrent = calculate({ other_force_n: 50000 }).outputs;
      assertClose(withCurrent.horizontal_force_n, 218836 + 50000, { abs: 20 }, 'other force added');
    },
  },
  {
    name: 'Holding: 7 800 kg HHP anchor × 7 = 535 kN against 219 kN → margin 2.45, OK; coefficient 2 gives 153 kN and a dragging warning',
    source: 'Holding capacity = anchor weight × holding coefficient (IACS UR A1: HHP ≥ 2 × ordinary; typical coefficients 3–4 ordinary, 6–10 HHP in sand)',
    run: () => {
      const ok = calculate({});
      assertClose(ok.outputs.holding_capacity_n, 7800 * 9.80665 * 7, { rel: 1e-12 }, 'holding');
      assertEqual(ok.outputs.holding_status.startsWith('OK'), true, 'status OK');
      const weak = calculate({ holding_coefficient: 2 });
      assertEqual(weak.outputs.holding_status.startsWith('Dragging risk'), true, 'dragging');
      assertEqual(weak.warnings.some((w) => w.includes('dragging is likely')), true, 'warning');
    },
  },
  {
    name: 'Default case: 5 shackles in 30 m with 219 kN → scope 4.58, swing radius = horizontal distance + 190 m; cable rules text lists 1.5 √D = 8.2 shackles',
    source: 'Admiralty Manual of Seamanship rules of thumb (1.5 √D shackles; scope 6–10 × depth)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.scope_ratio, 137.5 / 30, { rel: 1e-12 }, 'scope');
      assertClose(outputs.swing_radius_m, outputs.horizontal_distance_m + 190, { rel: 1e-12 }, 'swing radius');
      assertEqual(outputs.cable_rules.startsWith('1.5 √D rule: 8.2 shackles (226 m)'), true, 'rules text');
      assertClose(convert(5, 'shackle', 'm', 'length'), 5 * SHACKLE_M, { rel: 1e-12 }, 'shackle unit');
    },
  },
  {
    name: 'Zero horizontal force: the cable hangs vertically, L − D lies on the bottom and the hawse tension is w D',
    source: 'Limiting case of the catenary (a → ∞)',
    run: () => {
      const g = catenary(0, W76, 30, 137.5);
      assertClose(g.onBottom, 107.5, { rel: 1e-12 }, 'on bottom');
      assertClose(g.tensionHawse, W76 * 30, { rel: 1e-12 }, 'tension');
      assertEqual(calculate({ force_basis: 'given', given_force_n: 0 }).outputs.catenary_parameter_m, null, 'parameter undefined');
    },
  },
  {
    name: 'Invalid inputs fail fast: cable shorter than the depth, zero chain diameter, unknown basis',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ cable_out_m: 20 }), 'must exceed the depth', 'short cable');
      assertThrows(() => calculate({ chain_diameter_m: 0 }), 'greater than zero', 'diameter');
      assertThrows(() => calculate({ chain_basis: 'rope' }), 'must be one of', 'basis');
    },
  },
];
