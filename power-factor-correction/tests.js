/**
 * power-factor-correction/tests.js — checks against the kvar/kW table, capacitance formulas and the resonance rule.
 * Run: node run-tests.js power-factor-correction
 */
import { calculate, tanPhi } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const LOAD = { active_power_kw: 500, pf_existing: 0.75, pf_target: 0.93, voltage_v: 400, frequency_hz: 50, connection: 'delta', short_circuit_mva: 10, detuning_pct: 0, existing_losses_kw: 8, hours_per_year: 4000 };

export const tests = [
  {
    name: 'kvar/kW factor: cos φ 0.75 → 0.93 gives tan φ 0.8819 − 0.3952 = 0.487 kvar/kW (Schneider table value); 500 kW needs Q_c = 243.3 kvar; 0.80 → 0.95 gives 0.421',
    source: 'Schneider Electric Electrical Installation Guide, chapter L, table of kvar per kW (0.75→0.93: 0.487; 0.80→0.95: 0.421)',
    run: () => {
      const { outputs } = calculate(LOAD);
      assertClose(outputs.tan_phi1, Math.sqrt(0.4375) / 0.75, { rel: 1e-12 }, 'tan φ₁');
      assertClose(outputs.tan_phi2, Math.sqrt(1 - 0.93 ** 2) / 0.93, { rel: 1e-12 }, 'tan φ₂');
      assertClose(outputs.kvar_per_kw, 0.487, { abs: 5e-4 }, 'table 0.487');
      assertClose(outputs.q_required_var / 1000, 243.35, { abs: 0.01 }, 'Q_c');
      assertClose(tanPhi(0.8) - tanPhi(0.95), 0.421, { abs: 5e-4 }, 'table 0.421');
      assertClose(outputs.q_before_var - outputs.q_after_var, outputs.q_required_var, { rel: 1e-12 }, 'balance');
    },
  },
  {
    name: 'Released capacity and currents at 400 V: S 666.7 → 537.6 kVA (129.0 kVA released), I 962.3 → 776.0 A, capacitor current 351.2 A; losses fall by 1 − (0.75/0.93)² = 34.96 %, 2.80 kW of 8 kW, 11 187 kWh/yr',
    source: 'S = P/cos φ, I = S/(√3 V), losses ∝ I²',
    run: () => {
      const { outputs } = calculate(LOAD);
      assertClose(outputs.s_before_va / 1000, 666.667, { abs: 1e-3 }, 'S₁');
      assertClose(outputs.s_after_va / 1000, 537.634, { abs: 1e-3 }, 'S₂');
      assertClose(outputs.released_va / 1000, 129.03, { abs: 0.01 }, 'released');
      assertClose(outputs.current_before_a, 666666.67 / (Math.sqrt(3) * 400), { rel: 1e-8 }, 'I₁');
      assertClose(outputs.current_after_a, 776.0, { abs: 0.1 }, 'I₂');
      assertClose(outputs.capacitor_current_a, outputs.q_required_var / (Math.sqrt(3) * 400), { rel: 1e-12 }, 'I_C');
      assertClose(outputs.loss_reduction_pct, (1 - (0.75 / 0.93) ** 2) * 100, { rel: 1e-12 }, 'loss %');
      assertClose(outputs.loss_reduction_pct, 34.96, { abs: 0.01 }, 'loss % value');
      assertClose(outputs.energy_saving_kwh, 8 * (1 - (0.75 / 0.93) ** 2) * 4000, { rel: 1e-12 }, 'kWh');
    },
  },
  {
    name: 'Capacitance: delta C = Q_c/(3 ω V²) = 243 345/(3 × 314.16 × 400²) = 1 614 µF per phase; star C = Q_c/(ω V²) = 3 × that; at 60 Hz the capacitance falls by 50/60',
    source: 'Q = 3 V² ω C (delta), Q = V_LL² ω C (star)',
    run: () => {
      const d = calculate(LOAD).outputs;
      assertClose(d.capacitance_f, d.q_required_var / (3 * 2 * Math.PI * 50 * 400 ** 2), { rel: 1e-12 }, 'delta');
      assertClose(d.capacitance_f * 1e6, 1613.7, { abs: 0.1 }, 'delta value');
      const s = calculate({ ...LOAD, connection: 'star' }).outputs;
      assertClose(s.capacitance_f, 3 * d.capacitance_f, { rel: 1e-12 }, 'star = 3 × delta');
      assertClose(calculate({ ...LOAD, frequency_hz: 60 }).outputs.capacitance_f, d.capacitance_f * (50 / 60), { rel: 1e-12 }, '60 Hz');
    },
  },
  {
    name: 'Resonance: S_sc 10 MVA and Q_c 243 kvar give h_r = √(10 000/243.35) = 6.41 (321 Hz), within 10 % of the 7th → RISK with a warning; S_sc 30 MVA gives h_r 11.1 → near the 11th; S_sc 20 MVA gives h_r 9.07 → no characteristic harmonic within 10 %',
    source: 'Schneider guide / IEEE 1036: h_r = √(S_sc/Q_c)',
    run: () => {
      const r = calculate(LOAD);
      assertClose(r.outputs.resonance_order, Math.sqrt(10000 / 243.345), { rel: 1e-5 }, 'h_r');
      assertClose(r.outputs.resonance_hz, r.outputs.resonance_order * 50, { rel: 1e-12 }, 'f_r');
      assertEqual(r.outputs.resonance_check.startsWith('RISK') && r.warnings.some((w) => w.includes('7th harmonic')), true, '7th');
      assertEqual(calculate({ ...LOAD, short_circuit_mva: 30 }).outputs.resonance_check.includes('11th'), true, '11th');
      assertEqual(calculate({ ...LOAD, short_circuit_mva: 20 }).outputs.resonance_check.startsWith('Resonance at'), true, 'clear');
    },
  },
  {
    name: 'Detuned bank: p 7 % → tuning order 1/√0.07 = 3.78 (189 Hz at 50 Hz), capacitor voltage factor 1/0.93 = 1.0753, resonance check reports the detuned bank',
    source: 'Detuned reactor practice (Schneider guide chapter L; IEC 61642)',
    run: () => {
      const r = calculate({ ...LOAD, detuning_pct: 7 });
      assertClose(r.outputs.tuning_order, 1 / Math.sqrt(0.07), { rel: 1e-12 }, 'tuning order');
      assertClose(r.outputs.tuning_order, 3.78, { abs: 0.01 }, 'value');
      assertClose(r.outputs.capacitor_voltage_factor, 1 / 0.93, { rel: 1e-12 }, 'voltage factor');
      assertEqual(r.outputs.resonance_check.startsWith('Detuned bank'), true, 'detuned text');
      assertEqual(calculate(LOAD).outputs.tuning_order, null, 'no reactor');
    },
  },
  {
    name: 'Validation and warnings: target not above existing is rejected; zero voltage rejected; a target of 0.99 warns about over-compensation; a 2 MVar bank on 10 MVA warns about the switching voltage step',
    source: 'Behaviour specification',
    run: () => {
      assertThrows(() => calculate({ ...LOAD, pf_target: 0.75 }), 'above the existing', 'target');
      assertThrows(() => calculate({ ...LOAD, voltage_v: 0 }), 'greater than zero', 'voltage');
      assertEqual(calculate({ ...LOAD, pf_target: 0.99 }).warnings.some((w) => w.includes('over-compensates')), true, 'leading');
      assertEqual(calculate({ ...LOAD, active_power_kw: 4000 }).warnings.some((w) => w.includes('10 % of the short-circuit')), true, 'voltage step');
    },
  },
];
