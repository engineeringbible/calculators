/**
 * admiralty-coefficient/tests.js — checks against the Admiralty-coefficient definition and hand-verified scaling.
 * Run: node run-tests.js admiralty-coefficient
 */
import { calculate, admiraltyCoefficient, scalePower, scaleSpeed, dailyFuelT } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Admiralty coefficient of the default point: 47 232^(2/3) × 14³ / 8 000 = 1 306.6 × 2 744 / 8 000 = 448.2 (cargo ships 350–600)',
    source: 'Rawson & Tupper, Basic Ship Theory, ch. 10: A_c = Δ^(2/3) V³ / P; typical range quoted by Taylor, Introduction to Marine Engineering',
    run: () => {
      assertClose(47232 ** (2 / 3), 1306.6, { abs: 0.1 }, 'Δ^(2/3)');
      assertClose(admiraltyCoefficient(47232, 14, 8000), 448.2, { abs: 0.1 }, 'A_c');
      const { outputs } = calculate({});
      assertClose(outputs.admiralty_coefficient, 448.2, { abs: 0.1 }, 'in calculate()');
      assertClose(outputs.fuel_coefficient, (47232 ** (2 / 3) * 14 ** 3) / 33.6, { rel: 1e-9 }, 'fuel coefficient');
      assertClose(outputs.fuel_coefficient, 106700, { rel: 2e-3 }, 'fuel coefficient value');
    },
  },
  {
    name: 'Cube law at constant displacement: 8 000 kW at 14 kn → 5 038 kW at 12 kn; back-solving gives 12 kn',
    source: 'P ∝ V³ (Admiralty coefficient held constant), Barrass ch. "Admiralty coefficient"',
    run: () => {
      assertClose(scalePower(8000, 47232, 14, 47232, 12), 8000 * (12 / 14) ** 3, { rel: 1e-12 }, 'formula');
      const { outputs } = calculate({ mode: 'power', speed2_kn: 12 });
      assertClose(outputs.power2_out_kw, 5037.9, { abs: 0.1 }, 'P₂');
      assertClose(outputs.power_ratio, 0.62974, { abs: 1e-5 }, 'ratio');
      assertClose(scaleSpeed(14, 47232, 8000, 47232, outputs.power2_out_kw), 12, { rel: 1e-12 }, 'inverse');
    },
  },
  {
    name: 'Speed at 6 000 kW: 14 × (6000/8000)^(1/3) = 12.72 kn',
    source: 'Inverse of the cube law',
    run: () => {
      const { outputs } = calculate({ mode: 'speed', power2_kw: 6000 });
      assertClose(outputs.speed2_out_kn, 14 * 0.75 ** (1 / 3), { rel: 1e-12 }, 'formula');
      assertClose(outputs.speed2_out_kn, 12.720, { abs: 1e-3 }, 'value');
    },
  },
  {
    name: 'Displacement scaling: 40 000 t at 14 kn needs 8 000 × (40 000/47 232)^(2/3) = 7 161 kW',
    source: 'Wetted-surface scaling Δ^(2/3) in the Admiralty coefficient (Rawson & Tupper ch. 10)',
    run: () => {
      const { outputs } = calculate({ mode: 'power', displacement2_t: 40000, speed2_kn: 14 });
      assertClose(outputs.power2_out_kw, 8000 * (40000 / 47232) ** (2 / 3), { rel: 1e-12 }, 'formula');
      assertClose(outputs.power2_out_kw, 7161, { abs: 1 }, 'value');
    },
  },
  {
    name: 'Speed exponent 3.5: 12 kn needs 8 000 × (12/14)^3.5 = 4 665 kW instead of 5 038 kW',
    source: 'MAN Energy Solutions, Basic Principles of Ship Propulsion (2018): P ∝ V^n with n = 3.2–3.5 for faster ships',
    run: () => {
      const { outputs } = calculate({ mode: 'power', speed2_kn: 12, speed_exponent: 3.5 });
      assertClose(outputs.power2_out_kw, 8000 * (12 / 14) ** 3.5, { rel: 1e-12 }, 'formula');
      assertClose(outputs.power2_out_kw, 4665, { abs: 1 }, 'value');
    },
  },
  {
    name: 'Fuel: 33.6 t/day at 14 kn → 21.16 t/day at 12 kn; fuel per mile falls from 100.0 to 73.5 kg/nmi (−26.5 % = 1 − (12/14)²)',
    source: 'Fuel per day = P × SFOC × 24 / 10⁶ (ISO 3046-1 SFOC definition); per mile ∝ V² under the cube law',
    run: () => {
      assertClose(dailyFuelT(8000, 175), 33.6, { rel: 1e-12 }, 'daily fuel');
      const { outputs } = calculate({ mode: 'power', speed2_kn: 12 });
      assertClose(outputs.fuel1_t_day, 33.6, { rel: 1e-12 }, 'fuel 1');
      assertClose(outputs.fuel2_t_day, 33.6 * (12 / 14) ** 3, { rel: 1e-12 }, 'fuel 2');
      assertClose(outputs.fuel_per_nmi1_kg, 100, { rel: 1e-12 }, 'per mile 1');
      assertClose(outputs.fuel_per_nmi2_kg, 100 * (12 / 14) ** 2, { rel: 1e-9 }, 'per mile 2');
      assertClose(outputs.fuel_per_nmi_change_pct, ((12 / 14) ** 2 - 1) * 100, { rel: 1e-9 }, 'change %');
    },
  },
  {
    name: 'Warnings: a 30 % speed cut and a 40 % displacement change are flagged; implausible A_c (power in W) is flagged',
    source: 'Validity limits of the similarity rule (Rawson & Tupper; MAN 2018)',
    run: () => {
      const far = calculate({ mode: 'power', speed2_kn: 9.5, displacement2_t: 28000 });
      assertEqual(far.warnings.some((w) => w.includes('Speed change beyond')), true, 'speed warning');
      assertEqual(far.warnings.some((w) => w.includes('Displacement change beyond')), true, 'displacement warning');
      const wrongUnits = calculate({ power1_kw: 8e6 });
      assertEqual(wrongUnits.warnings.some((w) => w.includes('outside 250–800')), true, 'A_c warning');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero speed, zero power, unknown mode',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ speed1_kn: 0 }), 'greater than zero', 'speed');
      assertThrows(() => calculate({ mode: 'speed', power2_kw: 0 }), 'greater than zero', 'power');
      assertThrows(() => calculate({ mode: 'guess' }), 'must be one of', 'mode');
    },
  },
];
