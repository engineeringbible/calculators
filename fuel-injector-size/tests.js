/**
 * fuel-injector-size/tests.js — checks against lb/hr = hp × BSFC / (n × DC), the √Δp pressure law and the cc/min
 * conversion. Run: node run-tests.js fuel-injector-size
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const HP = 745.69987158227;
const LB_H = 0.45359237 / 3600;
const PSI = 6894.757293168;

export const tests = [
  {
    name: '450 hp NA gasoline (BSFC 0.50), 8 injectors at 80 %: 225 lb/hr in total, 35.2 lb/hr each, 369.1 cc/min',
    source: 'EngineLabs (Acosta 2024): lb/hr = hp × BSFC / (injectors × duty cycle); hand calculation',
    run: () => {
      const o = calculate({ power_w: 450 * HP, fuel: 'gas_na', injectors: 8, duty: 0.8 }).outputs;
      assertClose(o.total_kg_s / LB_H, 225, { rel: 1e-6 }, 'total');
      assertClose(o.injector_rated_kg_s / LB_H, 450 * 0.5 / (8 * 0.8), { rel: 1e-6 }, 'per injector');
      assertClose(o.injector_cc_min, 369.13, { abs: 0.01 }, 'cc/min');
    },
  },
  {
    name: '650 hp at BSFC 0.50 on 8 injectors at 85 % needs 650 × 0.5 / 6.8 = 47.8 lb/hr',
    source: 'Same formula; hand calculation',
    run: () => {
      const o = calculate({ power_w: 650 * HP, injectors: 8, duty: 0.85 }).outputs;
      assertClose(o.injector_rated_kg_s / LB_H, 47.794, { abs: 0.001 }, 'lb/hr');
    },
  },
  {
    name: 'Gasoline at 720 kg/m³: 1 lb/hr = 453.592 / 60 / 0.72 = 10.50 cc/min, the usual conversion',
    source: 'Unit conversion; EN 228 density range 720 to 775 kg/m³',
    run: () => {
      const o = calculate({ mode: 'hp', flow_kg_s: 1 * LB_H }).outputs;
      assertClose(o.injector_cc_min, 10.4998, { abs: 1e-4 }, 'cc/min per lb/hr');
    },
  },
  {
    name: 'Reverse: eight 42 lb/hr injectors at 80 % support 42 × 8 × 0.8 / 0.5 = 537.6 hp; at 58 psi instead of 43.5 psi, 620.8 hp',
    source: 'hp = flow × n × DC / BSFC; orifice flow ∝ √Δp',
    run: () => {
      const a = calculate({ mode: 'hp', flow_kg_s: 42 * LB_H }).outputs;
      assertClose(a.hp_supported_w / HP, 537.6, { rel: 1e-6 }, 'hp');
      const b = calculate({ mode: 'hp', flow_kg_s: 42 * LB_H, rated_pa: 43.5 * PSI, operating_pa: 58 * PSI }).outputs;
      assertClose(b.injector_op_kg_s / LB_H, 42 * Math.sqrt(58 / 43.5), { rel: 1e-9 }, 'flow at 58 psi');
      assertClose(b.hp_supported_w / HP, 620.77, { abs: 0.01 }, 'hp at 58 psi');
    },
  },
  {
    name: 'E85 needs 14.7 / 9.8 = 1.5 times the gasoline flow: a turbo E85 engine uses BSFC 0.975',
    source: 'Stoichiometric air-fuel ratios 14.7 (gasoline) and 9.8 (E85); Heywood Appendix D',
    run: () => {
      const g = calculate({ fuel: 'gas_turbo' }).outputs;
      const e = calculate({ fuel: 'e85_turbo' }).outputs;
      assertClose(e.total_kg_s / g.total_kg_s, 1.5, { rel: 1e-9 }, 'ratio');
      assertClose(e.bsfc_used_g_kwh / (453.59237 / 0.74569987158227), 0.975, { rel: 1e-9 }, 'BSFC');
    },
  },
  {
    name: 'Fractional injectors, a 5 % duty cycle and an unknown fuel are rejected; 95 % duty warns',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ injectors: 7.5 }), 'whole number');
      assertThrows(() => calculate({ duty: 0.05 }), 'Maximum duty cycle');
      assertThrows(() => calculate({ fuel: 'nitro' }), 'Fuel and engine');
      assertEqual(calculate({ duty: 0.95 }).warnings.length, 1, 'warning');
    },
  },
];
