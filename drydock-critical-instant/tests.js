/**
 * drydock-critical-instant/tests.js — upthrust, the two loss-of-GM methods, the draft at the critical instant, the trim limit.
 * Run: node run-tests.js drydock-critical-instant
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Upthrust: 6000 t trimmed 30 cm by the stern, MCTC 90 t·m/cm, contact 45 m aft of the LCF → P = 90 × 30 / 45 = 60 t',
    source: 'Barrass & Derrett, Ship Stability for Masters and Mates, "Drydocking and grounding": P = MCTC × t / l',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.trim_cm, 30, { rel: 1e-9 }, 'trim');
      assertClose(outputs.lever_m, 45, { rel: 1e-12 }, 'lever');
      assertClose(outputs.upthrust_t, 60, { rel: 1e-9 }, 'upthrust');
    },
  },
  {
    name: 'Loss of GM: method 1 P·KM/W = 60 × 7.5/6000 = 0.075 m (GM 1.425 m); method 2 P·KG/(W − P) = 60 × 6.0/5940 = 0.0606 m (GM 1.4394 m)',
    source: 'Barrass & Derrett: the two methods for the virtual loss of GM at the critical instant',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.gm_initial_m, 1.5, { rel: 1e-12 }, 'initial GM');
      assertClose(outputs.loss_method1_m, 0.075, { rel: 1e-9 }, 'loss 1');
      assertClose(outputs.gm_method1_m, 1.425, { rel: 1e-9 }, 'GM 1');
      assertClose(outputs.loss_method2_m, 360 / 5940, { rel: 1e-9 }, 'loss 2');
      assertClose(outputs.gm_method2_m, 1.5 - 360 / 5940, { rel: 1e-9 }, 'GM 2');
    },
  },
  {
    name: 'Draft at the critical instant: draft at the LCF 4.45 − 0.30 × 45/120 = 4.3375 m, less the bodily rise 60 t / 15 t/cm = 4 cm → 4.2975 m even keel',
    source: 'Trim about the LCF and parallel rise P/TPC',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.draft_ci_m, 4.3375 - 0.04, { rel: 1e-9 }, 'draft');
    },
  },
  {
    name: 'Trim limit and free surface: the largest trim for GM 0.15 m is P_max·l/MCTC with P_max = W(GM − 0.15)/KM = 1080 t → 540 cm; 300 t·m of free surface lowers both GMs and the limit',
    source: 'Method 1 solved for the trim; free-surface correction FSM/W',
    run: () => {
      const base = calculate({}).outputs;
      assertClose(base.max_trim_cm, 540, { rel: 1e-9 }, 'largest trim');
      const slack = calculate({ fsm_t_m: 300 }).outputs;
      assertClose(slack.gm_initial_m, 1.45, { rel: 1e-9 }, 'GM with free surface');
      assertEqual(slack.max_trim_cm < base.max_trim_cm, true, 'smaller limit');
      const kmCi = calculate({ km_ci_m: 7.52 }).outputs;
      assertClose(kmCi.gm_method2_m - base.gm_method2_m, 0.02, { rel: 1e-9 }, 'KM at the new draft enters method 2 only');
    },
  },
  {
    name: 'Unsafe case: a tender ship (KG 7.4 m, GM 0.10 m) trimmed 1.5 m by the stern loses its GM before the critical instant and is reported unsafe',
    source: 'Critical-instant stability requirement (positive GM until the keel lands)',
    run: () => {
      const { outputs } = calculate({ kg_m: 7.4, draft_aft_m: 5.65 });
      assertEqual(outputs.gm_method1_m < 0, true, 'negative GM');
      assertEqual(outputs.status.startsWith('UNSAFE'), true, 'status');
    },
  },
  {
    name: 'Invalid inputs fail fast: trimmed by the head, contact point forward of the LCF, zero MCTC',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ draft_fwd_m: 5, draft_aft_m: 4 }), 'trimmed by the head', 'by the head');
      assertThrows(() => calculate({ contact_from_ap_m: 60 }), 'aft of the LCF', 'contact');
      assertThrows(() => calculate({ mctc_t_m_cm: 0 }), 'greater than zero', 'MCTC');
    },
  },
];
