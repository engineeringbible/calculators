/**
 * three-phase-power/tests.js — checks against the three-phase power relations and typical motor nameplate data.
 * Run: node run-tests.js three-phase-power
 */
import { calculate, apparentPowerVa, lineCurrentA, correctionVar } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Three-phase 400 V, 50 A, cos φ 0.85: S = √3 × 400 × 50 = 34.64 kVA, P = 29.44 kW, Q = 18.25 kvar, φ = 31.8°',
    source: 'Hughes, Electrical and Electronic Technology, ch. "Three-phase systems": S = √3 V_L I_L, P = S cos φ, Q = S sin φ',
    run: () => {
      assertClose(apparentPowerVa('ac3', 400, 50), Math.sqrt(3) * 20000, { rel: 1e-12 }, 'S formula');
      const { outputs } = calculate({ system: 'ac3', mode: 'current', voltage_v: 400, current_a: 50, power_factor: 0.85 });
      assertClose(outputs.apparent_power_va, 34641, { abs: 1 }, 'S');
      assertClose(outputs.active_power_out_w, 29445, { abs: 1 }, 'P');
      assertClose(outputs.reactive_power_var, 18249, { abs: 1 }, 'Q');
      assertClose(outputs.phase_angle_deg, 31.79, { abs: 0.01 }, 'φ');
      assertClose(Math.hypot(outputs.active_power_out_w, outputs.reactive_power_var), outputs.apparent_power_va, { rel: 1e-9 }, 'power triangle');
    },
  },
  {
    name: 'Current from load: 30 kW at 400 V, cos φ 0.85 → 50.9 A; at unity power factor 43.3 A; single-phase 230 V 2.3 kW → 10 A; DC 24 V 240 W → 10 A',
    source: 'I = P / (√3 V cos φ), P / (V cos φ), P / V (Wildi ch. 8)',
    run: () => {
      assertClose(lineCurrentA('ac3', 30000, 400, 0.85), 30000 / (Math.sqrt(3) * 400 * 0.85), { rel: 1e-12 }, 'formula');
      assertClose(calculate({ system: 'ac3', mode: 'power', voltage_v: 400, active_power_w: 30000, power_factor: 0.85 }).outputs.line_current_a, 50.94, { abs: 0.01 }, '3φ 0.85');
      assertClose(calculate({ system: 'ac3', mode: 'power', voltage_v: 400, active_power_w: 30000, power_factor: 1 }).outputs.line_current_a, 43.30, { abs: 0.01 }, '3φ unity');
      assertClose(calculate({ system: 'ac1', mode: 'power', voltage_v: 230, active_power_w: 2300, power_factor: 1 }).outputs.line_current_a, 10, { rel: 1e-12 }, '1φ');
      const dc = calculate({ system: 'dc', mode: 'power', voltage_v: 24, active_power_w: 240 }).outputs;
      assertClose(dc.line_current_a, 10, { rel: 1e-12 }, 'DC current');
      assertClose(dc.reactive_power_var, 0, { abs: 1e-12 }, 'DC no reactive power');
      assertClose(dc.apparent_power_va, 240, { rel: 1e-12 }, 'DC S = P');
    },
  },
  {
    name: 'Motor nameplate: 30 kW shaft, η 0.92, cos φ 0.85, 400 V → input 32.6 kW, 55.4 A full-load current, losses 2.6 kW (typical IE3 4-pole 30 kW motors: 55–57 A)',
    source: 'IEC 60034-1 nameplate convention (rated output = shaft power); manufacturer catalogues for 30 kW IE3 400 V 4-pole motors (I_N ≈ 55–57 A)',
    run: () => {
      const { outputs } = calculate({ system: 'ac3', mode: 'motor', voltage_v: 400, shaft_power_w: 30000, efficiency: 0.92, power_factor: 0.85, starting_multiple: 7 });
      assertClose(outputs.active_power_out_w, 30000 / 0.92, { rel: 1e-12 }, 'input power');
      assertClose(outputs.line_current_a, 55.37, { abs: 0.01 }, 'full-load current');
      assertClose(outputs.motor_losses_w, 30000 / 0.92 - 30000, { rel: 1e-12 }, 'losses');
      assertClose(outputs.shaft_power_out_w, 30000, { rel: 1e-12 }, 'shaft power');
      assertEqual(outputs.line_current_a > 55 && outputs.line_current_a < 57, true, 'within the catalogue band');
    },
  },
  {
    name: 'Starting: 7 × full-load current = 387.6 A and 268.5 kVA for the 30 kW motor; star-delta (2.33 ×) gives one third',
    source: 'IEC 60034-12 locked-rotor current (design N 6–8 × I_N); star-delta reduces line current to 1/3 (Wildi ch. 14)',
    run: () => {
      const dol = calculate({ system: 'ac3', mode: 'motor', voltage_v: 400, shaft_power_w: 30000, efficiency: 0.92, power_factor: 0.85, starting_multiple: 7 }).outputs;
      assertClose(dol.starting_current_a, 7 * 55.37, { abs: 0.1 }, 'I_start');
      assertClose(dol.starting_kva, Math.sqrt(3) * 400 * 7 * 55.37, { abs: 100 }, 'S_start');
      assertClose(convert(dol.starting_kva, 'VA', 'kVA', 'apparent_power'), 268.5, { abs: 0.1 }, 'kVA');
      const starDelta = calculate({ system: 'ac3', mode: 'motor', voltage_v: 400, shaft_power_w: 30000, efficiency: 0.92, power_factor: 0.85, starting_multiple: 7 / 3 }).outputs;
      assertClose(starDelta.starting_current_a / dol.starting_current_a, 1 / 3, { rel: 1e-9 }, 'star-delta third');
    },
  },
  {
    name: 'Power-factor correction: 29.44 kW from 0.85 to 0.95 needs Q_c = P (tan 31.8° − tan 18.2°) = 8.57 kvar and cuts the current from 50 A to 44.7 A',
    source: 'Schneider Electrical Installation Guide / IEEE Std 141: Q_c = P (tan φ₁ − tan φ₂)',
    run: () => {
      assertClose(correctionVar(29445, 0.85, 0.95), 29445 * (Math.tan(Math.acos(0.85)) - Math.tan(Math.acos(0.95))), { rel: 1e-12 }, 'formula');
      const { outputs } = calculate({ system: 'ac3', mode: 'current', voltage_v: 400, current_a: 50, power_factor: 0.85, target_pf: 0.95 });
      assertClose(convert(outputs.correction_kvar, 'var', 'kvar', 'reactive_power'), 8.57, { abs: 0.01 }, 'Q_c');
      assertClose(outputs.current_after_correction_a, 29445 / (Math.sqrt(3) * 400 * 0.95), { rel: 1e-4 }, 'current after');
      assertClose(outputs.current_after_correction_a, 44.74, { abs: 0.01 }, 'current after value');
      const noNeed = calculate({ system: 'ac3', mode: 'current', voltage_v: 400, current_a: 50, power_factor: 0.95, target_pf: 0.9 });
      assertClose(noNeed.outputs.correction_kvar, 0, { abs: 1e-9 }, 'no correction');
      assertEqual(noNeed.warnings.some((w) => w.includes('no correction needed')), true, 'warning');
    },
  },
  {
    name: 'Generator kVA equals the apparent power drawn (34.6 kVA at 0.85 for 29.4 kW); unity power factor minimises it',
    source: 'Generator rating in kVA at the load power factor (Wildi ch. 16)',
    run: () => {
      const lag = calculate({ system: 'ac3', mode: 'power', voltage_v: 400, active_power_w: 29445, power_factor: 0.85 }).outputs;
      assertClose(lag.generator_kva, lag.apparent_power_va, { rel: 1e-12 }, 'generator = S');
      assertClose(lag.generator_kva, 34641, { abs: 2 }, 'kVA');
      const unity = calculate({ system: 'ac3', mode: 'power', voltage_v: 400, active_power_w: 29445, power_factor: 1 }).outputs;
      assertClose(unity.generator_kva, 29445, { rel: 1e-12 }, 'unity');
    },
  },
  {
    name: 'Warnings: low power factor 0.7 and DOL starting are flagged; over-correction target 0.99 is flagged',
    source: 'Behaviour specification; common practice targets 0.92–0.95',
    run: () => {
      const low = calculate({ system: 'ac3', mode: 'current', current_a: 50, power_factor: 0.7 });
      assertEqual(low.warnings.some((w) => w.includes('Power factor below 0.8')), true, 'low pf');
      const dol = calculate({ system: 'ac3', mode: 'motor', starting_multiple: 7 });
      assertEqual(dol.warnings.some((w) => w.includes('Direct-on-line starting')), true, 'DOL warning');
      const over = calculate({ system: 'ac3', mode: 'current', current_a: 50, power_factor: 0.85, target_pf: 0.99 });
      assertEqual(over.warnings.some((w) => w.includes('over-correction')), true, 'over-correction warning');
    },
  },
  {
    name: 'Unit layer: 34.64 kVA = 0.03464 MVA, 18.25 kvar = 18 250 var, 30 kW = 40.2 hp',
    source: 'SI prefixes; 1 hp = 745.7 W',
    run: () => {
      assertClose(convert(34641, 'VA', 'MVA', 'apparent_power'), 0.034641, { rel: 1e-9 }, 'MVA');
      assertClose(convert(18.25, 'kvar', 'var', 'reactive_power'), 18250, { rel: 1e-12 }, 'var');
      assertClose(convert(30000, 'W', 'hp', 'power'), 40.23, { abs: 0.01 }, 'hp');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero voltage, power factor above 1, unknown system',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ voltage_v: 0 }), 'greater than zero', 'voltage');
      assertThrows(() => calculate({ power_factor: 1.2 }), 'between', 'power factor');
      assertThrows(() => calculate({ system: 'ac6' }), 'must be one of', 'system');
    },
  },
];
