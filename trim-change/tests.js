/**
 * trim-change/tests.js — checks against trim = w d / MCTC, sinkage = w / TPC and the draft distribution about the LCF.
 * Run: node run-tests.js trim-change
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Shift 120 t forward 45 m, MCTC 240, L 126 m, LCF 60 m from AP: trim 22.5 cm by the head, aft −10.7 cm, forward +11.8 cm',
    source: 'Derrett & Barrass, Ship Stability for Masters and Mates, ch. 15 (change of trim = w d / MCTC, shared in the ratio of the LCF position); hand calculation',
    run: () => {
      const o = calculate({ lbp_m: 126, draft_fwd_m: 5.5, draft_aft_m: 6.5, lcf_m: 60, tpc: 20, mctc: 240, operation: 'shift', weight_t: 120, shift_m: 45 }).outputs;
      assertClose(o.trim_change_cm, -22.5, { rel: 1e-12 }, 'trim');
      assertClose(o.change_aft_cm, -10.7143, { abs: 1e-4 }, 'aft');
      assertClose(o.change_fwd_cm, 11.7857, { abs: 1e-4 }, 'forward');
      assertEqual(o.sinkage_cm, 0, 'no sinkage for a shift');
    },
  },
  {
    name: 'Load 300 t at 110 m from AP (LCF 72 m, TPC 25, MCTC 180, L 150): sinkage 12 cm, trim 63.3 cm by the head, A 7.816 m, F 7.649 m',
    source: 'Derrett & Barrass ch. 9 and 15 (bodily sinkage then trim about the LCF); hand calculation',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.sinkage_cm, 12, { rel: 1e-12 }, 'sinkage');
      assertClose(o.trim_change_cm, -63.3333, { abs: 1e-4 }, 'trim');
      assertClose(o.new_aft_m, 7.816, { abs: 1e-9 }, 'aft');
      assertClose(o.new_fwd_m, 7.649333, { abs: 1e-6 }, 'forward');
      assertClose(o.new_trim_cm, 16.6667, { abs: 1e-4 }, 'new trim');
    },
  },
  {
    name: 'Loading at MCTC L / (TPC LCF) = 15 m forward of the LCF (87 m from AP) leaves the aft draft unchanged',
    source: 'Derrett & Barrass ch. 15 (loading to keep the aft draft constant); consistency check',
    run: () => {
      const o = calculate({ position_m: 87 }).outputs;
      assertClose(o.keep_aft_m, 87, { rel: 1e-12 }, 'position');
      assertClose(o.change_aft_cm, 0, { abs: 1e-9 }, 'aft unchanged');
      const f = calculate({ position_m: calculate({}).outputs.keep_fwd_m }).outputs;
      assertClose(f.change_fwd_cm, 0, { abs: 1e-9 }, 'forward unchanged');
    },
  },
  {
    name: 'Loading then discharging the same weight at the same place restores the drafts; loading at the LCF only sinks the ship',
    source: 'Consistency checks',
    run: () => {
      const a = calculate({ operation: 'load', weight_t: 500, position_m: 30 }).outputs;
      const b = calculate({ operation: 'discharge', weight_t: 500, position_m: 30, draft_aft_m: a.new_aft_m, draft_fwd_m: a.new_fwd_m }).outputs;
      assertClose(b.new_aft_m, 8.0, { abs: 1e-9 }, 'aft');
      assertClose(b.new_fwd_m, 7.2, { abs: 1e-9 }, 'forward');
      const c = calculate({ position_m: 72 }).outputs;
      assertClose(c.change_aft_cm, c.change_fwd_cm, { abs: 1e-12 }, 'parallel sinkage');
    },
  },
  {
    name: 'LCF outside the length, zero MCTC and an unknown operation are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ lcf_m: 200 }), 'LCF from AP');
      assertThrows(() => calculate({ mctc: 0 }), 'MCTC must be greater than zero');
      assertThrows(() => calculate({ operation: 'lift' }), 'Operation');
    },
  },
];
