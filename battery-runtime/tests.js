/**
 * battery-runtime/tests.js — checks against Peukert's law and standard battery-sizing arithmetic.
 * Run: node run-tests.js battery-runtime
 */
import { calculate, peukertTimeH, peukertCapacityAh, CHEMISTRIES } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

/** 100 Ah C20 battery, custom k = 1.3, 100 % DoD for the raw Peukert checks. */
const PEUKERT_100 = { voltage_v: 12, capacity_ah: 100, rated_hours: 20, chemistry: 'custom', peukert_k: 1.3, dod_pct: 100, charge_efficiency: 1, load_basis: 'current', derating: 1, mode: 'runtime' };

export const tests = [
  {
    name: "Peukert textbook case: 100 Ah (C20), k = 1.3, discharged at 10 A → 8.12 h and 81.2 Ah; at the rated 5 A exactly 20 h and 100 Ah",
    source: "Peukert (1897) t = H (C/(I H))^k; Doerffel & Sharkh (2006) worked illustration (k = 1.3 flooded lead-acid)",
    run: () => {
      assertClose(peukertTimeH(100, 20, 10, 1.3), 20 * 0.5 ** 1.3, { rel: 1e-12 }, 'formula');
      assertClose(peukertTimeH(100, 20, 10, 1.3), 8.123, { abs: 2e-3 }, 'time at 10 A');
      assertClose(peukertTimeH(100, 20, 5, 1.3), 20, { rel: 1e-12 }, 'rated current');
      const { outputs } = calculate({ ...PEUKERT_100, load_a: 10 });
      assertClose(outputs.time_to_empty_h, 8.123, { abs: 2e-3 }, 'in calculate()');
      assertClose(outputs.effective_capacity_ah, 81.23, { abs: 0.02 }, 'effective Ah');
      assertClose(outputs.capacity_loss_pct, 18.77, { abs: 0.02 }, 'loss %');
      assertClose(outputs.c_rate, 0.1, { rel: 1e-12 }, 'C-rate');
      assertClose(outputs.rated_current_a, 5, { rel: 1e-12 }, 'rated current');
    },
  },
  {
    name: 'k = 1 removes the effect (10 A → 10 h, 100 Ah); at 1 A with k = 1.3 the law predicts 162 Ah, which is why it warns at low rates',
    source: "Limits of Peukert's law (Doerffel & Sharkh 2006)",
    run: () => {
      assertClose(peukertTimeH(100, 20, 10, 1.0), 10, { rel: 1e-12 }, 'k = 1');
      assertClose(peukertTimeH(100, 20, 1, 1.3), 20 * 5 ** 1.3, { rel: 1e-12 }, 'low rate');
      assertClose(peukertTimeH(100, 20, 1, 1.3) * 1, 162.1, { abs: 0.1 }, 'low-rate Ah');
      const low = calculate({ ...PEUKERT_100, load_a: 0.5 });
      assertEqual(low.warnings.some((w) => w.includes('well below the rated rate')), true, 'low-rate warning');
      const high = calculate({ ...PEUKERT_100, load_a: 150 });
      assertEqual(high.warnings.some((w) => w.includes('above 1 C')), true, 'high-rate warning');
    },
  },
  {
    name: 'Default AGM bank 24 V 200 Ah with a 1 kW AC load at 90 % inverter efficiency: 46.3 A, k 1.12, time to empty 3.59 h, runtime 1.80 h at 50 % DoD, 83.2 Ah removed',
    source: 'Load current = P / (η V); Peukert k 1.12 for AGM (Linden & Reddy ch. 23 typical values); DoD 50 % for lead-acid cycle life',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.load_current_a, 1000 / 0.9 / 24, { rel: 1e-12 }, 'current');
      assertClose(outputs.load_current_a, 46.30, { abs: 0.01 }, 'current value');
      assertEqual(outputs.peukert_k_out, CHEMISTRIES.agm.k, 'k preset');
      assertClose(outputs.time_to_empty_h, 20 * (200 / (46.296 * 20)) ** 1.12, { rel: 1e-4 }, 'time formula');
      assertClose(outputs.time_to_empty_h, 3.594, { abs: 0.002 }, 'time to empty');
      assertClose(outputs.runtime_h, outputs.time_to_empty_h * 0.5, { rel: 1e-12 }, 'runtime at DoD');
      assertClose(outputs.discharged_ah, outputs.load_current_a * outputs.runtime_h, { rel: 1e-12 }, 'Ah removed');
      assertClose(outputs.nominal_energy_wh, 4800, { rel: 1e-12 }, 'nominal Wh');
      assertClose(outputs.usable_energy_wh, 24 * outputs.discharged_ah, { rel: 1e-12 }, 'usable Wh');
    },
  },
  {
    name: 'Recharge: 83.2 Ah removed at 90 % charge efficiency needs 92.4 Ah back, 2.31 h at 40 A bulk charging',
    source: 'Ah efficiency of lead-acid charging 85–90 % (Linden & Reddy); bulk-phase time = Ah / I',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.recharge_ah, outputs.discharged_ah / 0.9, { rel: 1e-12 }, 'recharge Ah');
      assertClose(outputs.recharge_time_h, outputs.recharge_ah / 40, { rel: 1e-12 }, 'recharge time');
      assertEqual(calculate({ charger_a: 0 }).outputs.recharge_time_h, null, 'no charger');
    },
  },
  {
    name: 'Required capacity: for a 10 h runtime at 50 % DoD (20 h to empty) at 46.3 A the inversion gives I × H = 926 Ah; the inversion is exact for the default bank',
    source: 'Inverse Peukert C = I H (t/H)^(1/k) — at t = H the capacity is I H regardless of k',
    run: () => {
      const { outputs } = calculate({ mode: 'capacity', target_runtime_h: 10 });
      assertClose(outputs.required_capacity_ah, outputs.load_current_a * 20, { rel: 1e-9 }, 'C = I H when t_empty = H');
      assertClose(outputs.required_capacity_ah, 925.9, { abs: 0.2 }, 'value');
      const base = calculate({}).outputs;
      const roundTrip = calculate({ mode: 'capacity', target_runtime_h: base.runtime_h }).outputs;
      assertClose(roundTrip.required_capacity_ah, 200, { rel: 1e-9 }, 'round trip returns the bank capacity');
      assertClose(peukertCapacityAh(10, 20, 8.123, 1.3), 100, { rel: 2e-4 }, 'helper inverse of the textbook case');
    },
  },
  {
    name: 'Derating 0.8 (end of life) scales the effective capacity and runtime by 0.8 and raises the required capacity by 1/0.8',
    source: 'IEEE Std 485 aging factor 1.25 (= 1/0.8) and temperature correction',
    run: () => {
      const fresh = calculate({}).outputs;
      const aged = calculate({ derating: 0.8 }).outputs;
      assertClose(aged.time_to_empty_h / fresh.time_to_empty_h, 0.8 ** CHEMISTRIES.agm.k, { rel: 1e-9 }, 'time scales with derating^k');
      const freshReq = calculate({ mode: 'capacity', target_runtime_h: 5 }).outputs.required_capacity_ah;
      const agedReq = calculate({ mode: 'capacity', target_runtime_h: 5, derating: 0.8 }).outputs.required_capacity_ah;
      assertClose(agedReq / freshReq, 1 / 0.8, { rel: 1e-9 }, 'required capacity scales 1/derating');
    },
  },
  {
    name: 'LiFePO4 preset: k 1.03, DoD 80 %, charge efficiency 97 % → nearly rate-independent capacity and a longer runtime than AGM for the same bank',
    source: 'Lithium iron phosphate Peukert exponents 1.02–1.05 (Doerffel & Sharkh 2006); typical DoD 80 %',
    run: () => {
      const li = calculate({ chemistry: 'lifepo4' }).outputs;
      const agm = calculate({ chemistry: 'agm' }).outputs;
      assertEqual(li.peukert_k_out, 1.03, 'k');
      assertEqual(li.capacity_loss_pct < 5, true, 'small rate loss');
      assertEqual(li.runtime_h > agm.runtime_h * 1.5, true, 'longer runtime (80 % DoD)');
      assertClose(li.recharge_ah, li.discharged_ah / 0.97, { rel: 1e-12 }, 'charge efficiency');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero load, Peukert exponent below 1, unknown chemistry',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ load_basis: 'current', load_a: 0 }), 'greater than zero to compute', 'zero load');
      assertThrows(() => calculate({ chemistry: 'custom', peukert_k: 0.9 }), 'between', 'k');
      assertThrows(() => calculate({ chemistry: 'zinc_air' }), 'must be one of', 'chemistry');
    },
  },
];
