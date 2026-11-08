/**
 * ship-squat/tests.js — checks against the Barrass formulas and hand-computed values.
 * Run: node run-tests.js ship-squat
 */
import { calculate, widthOfInfluenceFactor, barrassSquatM, simpleSquatM, speedForSquatKn } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const OPEN_CASE = { cb: 0.8, beam_m: 32, draft_m: 10, depth_m: 12, speed_kn: 10, waterway: 'open', allowances_m: 0.5, required_ukc_pct: 10 };

export const tests = [
  {
    name: "Barrass open-water rule of thumb: C_B 0.80 at 10 kn squats about C_B V²/100 = 0.80 m",
    source: 'Barrass & Derrett, Ship Stability for Masters and Mates, 7th ed., ch. 43: open water S_max ≈ C_B × V² / 100 for h/T 1.1–1.4',
    run: () => {
      assertClose(simpleSquatM(0.8, 0, 10, 'open'), 0.80, { rel: 1e-12 }, 'rule of thumb');
      const { outputs } = calculate(OPEN_CASE);
      assertClose(outputs.squat_simple_m, 0.80, { rel: 1e-12 }, 'in calculate()');
    },
  },
  {
    name: 'Barrass general formula in open water: F_B = 7.7 + 20 (1 − 0.8)² = 8.5, S = T / (F_B h) = 0.0980, S_max = 0.8 × S^0.81 × 10^2.08 / 20 = 0.733 m (within 10 % of the rule of thumb)',
    source: 'Barrass, Ship Squat and Interaction (2004): width of influence and S_max = C_B S^0.81 V^2.08 / 20; value computed by hand',
    run: () => {
      assertClose(widthOfInfluenceFactor(0.8), 8.5, { rel: 1e-12 }, 'F_B');
      const { outputs } = calculate(OPEN_CASE);
      assertClose(outputs.effective_width_m, 8.5 * 32, { rel: 1e-12 }, 'effective width');
      assertClose(outputs.blockage_factor, 10 / (8.5 * 12), { rel: 1e-12 }, 'S');
      assertClose(outputs.squat_m, 0.7329, { abs: 2e-3 }, 'squat');
      assertClose(outputs.squat_m / outputs.squat_simple_m, 0.916, { abs: 0.01 }, 'ratio to rule of thumb');
    },
  },
  {
    name: 'Confined channel 150 m wide: S = 32 × 10 / (150 × 12) = 0.178; general formula 1.187 m, simplified confined rule C_B S^(2/3) V^2.08 / 20 = 1.520 m',
    source: 'Barrass & Derrett ch. 43 confined-channel formula; Barrass (2004) general formula; values computed by hand',
    run: () => {
      const { outputs } = calculate({ ...OPEN_CASE, waterway: 'confined', channel_width_m: 150 });
      assertClose(outputs.blockage_factor, 320 / 1800, { rel: 1e-12 }, 'S');
      assertClose(outputs.squat_m, 1.187, { abs: 3e-3 }, 'general');
      assertClose(outputs.squat_simple_m, 1.520, { abs: 3e-3 }, 'simplified confined');
      assertClose(barrassSquatM(0.8, 320 / 1800, 10), outputs.squat_m, { rel: 1e-12 }, 'helper');
    },
  },
  {
    name: 'Under-keel clearance: static 2.00 m, net 2.00 − 0.733 − 0.5 = 0.767 m, required 10 % × 10 m = 1.00 m → short by 0.233 m; maximum speed 8.32 kn',
    source: 'UKC bookkeeping per PIANC (1997/2014); speed from inverting the Barrass formula for the available squat (0.5 m)',
    run: () => {
      const { outputs, warnings } = calculate(OPEN_CASE);
      assertClose(outputs.static_ukc_m, 2.0, { rel: 1e-12 }, 'static');
      assertClose(outputs.net_ukc_m, 0.767, { abs: 2e-3 }, 'net');
      assertClose(outputs.required_ukc_m, 1.0, { rel: 1e-12 }, 'required');
      assertClose(outputs.ukc_margin_m, -0.233, { abs: 2e-3 }, 'margin');
      assertEqual(outputs.ukc_status.startsWith('Insufficient'), true, 'status');
      assertClose(outputs.max_speed_kn, 8.32, { abs: 0.01 }, 'max speed');
      assertClose(barrassSquatM(0.8, outputs.blockage_factor, outputs.max_speed_kn), 0.5, { abs: 1e-9 }, 'squat at max speed equals the available 0.5 m');
      assertEqual(warnings.some((w) => w.includes('short of the requirement')), true, 'warning');
    },
  },
  {
    name: 'Slowing to 8 kn makes the same case compliant (squat 0.464 m, net 1.036 m); zero available clearance gives zero speed',
    source: 'Squat scales with V^2.08: (8/10)^2.08 = 0.629 (Barrass)',
    run: () => {
      const slow = calculate({ ...OPEN_CASE, speed_kn: 8 }).outputs;
      assertClose(slow.squat_m, 0.7329 * 0.8 ** 2.08, { abs: 2e-3 }, 'squat at 8 kn');
      assertEqual(slow.ukc_status.startsWith('OK'), true, 'compliant');
      assertEqual(speedForSquatKn(0.8, 0.1, 0), 0, 'no clearance → no speed');
      assertEqual(speedForSquatKn(0.8, 0.1, -1), 0, 'negative → 0');
    },
  },
  {
    name: 'Froude depth number: 10 kn in 12 m = 5.144 / √(9.80665 × 12) = 0.474; 16 kn in 12 m exceeds 0.7 and triggers the warning',
    source: 'F_nh = V / √(g h); PIANC guidance that squat rises steeply above F_nh ≈ 0.7',
    run: () => {
      assertClose(calculate(OPEN_CASE).outputs.froude_depth, 0.4742, { abs: 5e-4 }, 'F_nh');
      const fast = calculate({ ...OPEN_CASE, speed_kn: 16 });
      assertEqual(fast.outputs.froude_depth > 0.7, true, 'above 0.7');
      assertEqual(fast.warnings.some((w) => w.includes('Froude depth number above 0.7')), true, 'warning');
    },
  },
  {
    name: 'Squat location by block coefficient: C_B 0.80 at the bow, 0.60 at the stern, 0.70 even keel; h/T outside 1.1–1.4 is flagged',
    source: 'Barrass & Derrett ch. 43: full-form ships (C_B > 0.7) squat by the head, fine-form by the stern',
    run: () => {
      assertEqual(calculate(OPEN_CASE).outputs.squat_location.startsWith('At the bow'), true, 'bow');
      assertEqual(calculate({ ...OPEN_CASE, cb: 0.6 }).outputs.squat_location.startsWith('At the stern'), true, 'stern');
      assertEqual(calculate({ ...OPEN_CASE, cb: 0.7 }).outputs.squat_location.startsWith('Even-keel'), true, 'even keel');
      const deep = calculate({ ...OPEN_CASE, depth_m: 20 });
      assertEqual(deep.warnings.some((w) => w.includes('outside the 1.1–1.4 range')), true, 'h/T warning');
    },
  },
  {
    name: 'Invalid inputs fail fast: depth not exceeding draft (aground), zero beam, unknown waterway',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ ...OPEN_CASE, depth_m: 10 }), 'must exceed the static draft', 'aground');
      assertThrows(() => calculate({ ...OPEN_CASE, beam_m: 0 }), 'greater than zero', 'beam');
      assertThrows(() => calculate({ ...OPEN_CASE, waterway: 'river' }), 'must be one of', 'waterway');
    },
  },
];
