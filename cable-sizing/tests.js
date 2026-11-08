/**
 * cable-sizing/tests.js — checks against IEC 60228 resistances, IEC temperature coefficients and hand-verified drops.
 * Run: node run-tests.js cable-sizing
 */
import { calculate, resistance20OhmKm, resistanceAtTemperature, voltageDropV, IEC60228_RESISTANCE_OHM_KM, CONDUCTORS } from './calc.js';
import { convert } from '../shared/units.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'IEC 60228 class 2 copper at 20 °C: 1.5 mm² 12.1, 2.5 mm² 7.41, 16 mm² 1.15, 95 mm² 0.193 Ω/km; aluminium 16 mm² 1.91 Ω/km',
    source: 'IEC 60228:2004 Table 2',
    run: () => {
      assertEqual(IEC60228_RESISTANCE_OHM_KM.copper[1.5], 12.1, 'Cu 1.5');
      assertEqual(IEC60228_RESISTANCE_OHM_KM.copper[2.5], 7.41, 'Cu 2.5');
      assertEqual(IEC60228_RESISTANCE_OHM_KM.copper[16], 1.15, 'Cu 16');
      assertEqual(IEC60228_RESISTANCE_OHM_KM.copper[95], 0.193, 'Cu 95');
      assertEqual(IEC60228_RESISTANCE_OHM_KM.aluminium[16], 1.91, 'Al 16');
      assertEqual(resistance20OhmKm('copper', 16), 1.15, 'lookup');
    },
  },
  {
    name: 'Theoretical ρ/A (IACS copper 1.7241 µΩ·cm) lies 4–11 % below the IEC 60228 maximum for every standard copper size (stranding allowance)',
    source: 'IEC 60028 (ρ_Cu = 1.7241 µΩ·cm at 20 °C); IEC 60228 values include stranding and tolerance (largest gap 50 mm²: 0.345 vs 0.387 Ω/km)',
    run: () => {
      for (const [size, tableValue] of Object.entries(IEC60228_RESISTANCE_OHM_KM.copper)) {
        const theoretical = (CONDUCTORS.copper.rho20 / (Number(size) * 1e-6)) * 1000;
        assertEqual(theoretical <= tableValue * 0.96, true, `${size} mm² theoretical at least 4 % below table`);
        assertEqual(theoretical >= tableValue * 0.89, true, `${size} mm² theoretical within 11 % of table`);
      }
      assertClose(resistance20OhmKm('copper', 1), 17.241, { abs: 1e-3 }, '1 mm² theoretical (custom size)');
    },
  },
  {
    name: 'Temperature correction: copper 16 mm² at 70 °C = 1.15 × (1 + 0.00393 × 50) = 1.376 Ω/km; aluminium α = 0.00403',
    source: 'IEC 60287-1-1 Table 1 (α₂₀: copper 3.93 × 10⁻³, aluminium 4.03 × 10⁻³ per K)',
    run: () => {
      assertClose(resistanceAtTemperature(1.15, 0.00393, 70), 1.37598, { abs: 1e-5 }, 'Cu 70 °C');
      assertEqual(CONDUCTORS.aluminium.alpha, 0.00403, 'α Al');
      const { outputs } = calculate({ material: 'copper', size: '16', insulation: 'xlpe_90' });
      assertClose(outputs.resistance_t_ohm_km, 1.15 * (1 + 0.00393 * 70), { rel: 1e-9 }, 'Cu 90 °C');
    },
  },
  {
    name: 'Three-phase 400 V, 50 A, 50 m, 16 mm² Cu at 70 °C, pf 0.85, X 0.08 Ω/km: ΔU = √3 I (R cos φ + X sin φ) = 5.25 V = 1.31 %; loss 516 W',
    source: 'IEC 60364-5-52:2009 Annex G voltage-drop method; hand calculation',
    run: () => {
      const { outputs } = calculate({ system: 'ac3', voltage_v: 400, current_a: 50, length_m: 50, material: 'copper', insulation: 'pvc_70', size: '16', reactance_ohm_km: 0.08, power_factor: 0.85 });
      assertClose(outputs.resistance_ohm, 0.0687988, { abs: 1e-6 }, 'R one conductor');
      assertClose(outputs.voltage_drop_v, 5.2469, { abs: 1e-3 }, 'ΔU');
      assertClose(outputs.voltage_drop_pct, 1.3117, { abs: 5e-4 }, 'ΔU %');
      assertClose(outputs.voltage_at_load_v, 400 - 5.2469, { abs: 1e-3 }, 'U load');
      assertClose(outputs.power_loss_w, 3 * 2500 * 0.0687988, { rel: 1e-6 }, 'loss 3 I² R');
      assertEqual(outputs.compliance.startsWith('OK'), true, 'compliant');
    },
  },
  {
    name: 'Single-phase 230 V, 20 A, 30 m, 2.5 mm² Cu at 70 °C, pf 1: ΔU = 2 I R = 10.64 V = 4.63 % (within 5 %)',
    source: 'IEC 60364-5-52 Annex G (b = 2 for single-phase); hand calculation 7.41 × 1.1965 × 0.03 × 2 × 20',
    run: () => {
      const { outputs } = calculate({ system: 'ac1', voltage_v: 230, current_a: 20, length_m: 30, size: '2.5', insulation: 'pvc_70', power_factor: 1, allowed_drop_pct: 5 });
      assertClose(outputs.voltage_drop_v, 10.639, { abs: 2e-3 }, 'ΔU');
      assertClose(outputs.voltage_drop_pct, 4.626, { abs: 2e-3 }, 'ΔU %');
      assertEqual(outputs.recommended_size, '2.5 mm² copper', 'smallest size meeting 5 %');
    },
  },
  {
    name: 'DC 24 V, 10 A, 10 m on 2.5 mm² at 20 °C: ΔU = 1.48 V = 6.2 % — exceeds 5 %; recommended 4 mm² (3.84 %)',
    source: 'Ohm\'s law for the loop 2 L; IEC 60228 2.5 mm² 7.41 Ω/km, 4 mm² 4.61 Ω/km',
    run: () => {
      const { outputs, warnings } = calculate({ system: 'dc', voltage_v: 24, current_a: 10, length_m: 10, size: '2.5', insulation: 'ambient_20', allowed_drop_pct: 5 });
      assertClose(outputs.voltage_drop_v, 1.482, { abs: 1e-6 }, 'ΔU');
      assertClose(outputs.voltage_drop_pct, 6.175, { abs: 1e-3 }, 'ΔU %');
      assertEqual(outputs.compliance.startsWith('Exceeds'), true, 'non-compliant');
      assertEqual(outputs.recommended_size, '4 mm² copper', 'recommended');
      assertClose(outputs.recommended_drop_pct, 3.842, { abs: 1e-3 }, 'drop with 4 mm²');
      assertEqual(warnings.some((w) => w.includes('exceeds the 5 % limit')), true, 'warning');
    },
  },
  {
    name: 'Reactance matters at low power factor: with pf 0.5 the X term adds √3 I X sin φ; DC ignores reactance; pf 1 removes it',
    source: 'IEC 60364-5-52 Annex G formula structure',
    run: () => {
      const withX = voltageDropV('ac3', 100, 100, 0.5, 0.08, 0.5);
      const withoutX = voltageDropV('ac3', 100, 100, 0.5, 0, 0.5);
      assertClose(withX - withoutX, Math.sqrt(3) * 100 * 0.008 * Math.sqrt(0.75), { rel: 1e-9 }, 'reactive share');
      assertClose(voltageDropV('dc', 10, 10, 7.41, 5, 0.1), 1.482, { rel: 1e-9 }, 'DC ignores X and pf');
      assertClose(voltageDropV('ac3', 50, 50, 1.376, 0.08, 1), Math.sqrt(3) * 50 * 0.0688, { rel: 1e-9 }, 'pf 1 removes X');
    },
  },
  {
    name: 'Cable rating utilisation: 50 A on a 63 A derated cable = 79.4 %; 80 A on 63 A raises the ampacity warning',
    source: 'Utilisation = I / I_z (IEC 60364-5-52 §523)',
    run: () => {
      const ok = calculate({ current_a: 50, cable_rating_a: 63 });
      assertClose(ok.outputs.rating_utilisation_pct, 79.365, { abs: 1e-3 }, 'utilisation');
      const over = calculate({ current_a: 80, cable_rating_a: 63 });
      assertEqual(over.warnings.some((w) => w.includes('exceeds the cable rating')), true, 'ampacity warning');
      assertEqual(calculate({ cable_rating_a: 0 }).outputs.rating_utilisation_pct, null, 'not checked when 0');
    },
  },
  {
    name: 'Unit layer: 1 Ω/km = 1 mΩ/m = 0.3048 Ω/1000 ft; 16 mm² = 0.0248 in²',
    source: 'SI definitions; 1 ft = 0.3048 m',
    run: () => {
      assertClose(convert(1, 'ohm_km', 'mohm_m', 'resistance_per_length'), 1, { rel: 1e-12 }, 'Ω/km = mΩ/m');
      assertClose(convert(1, 'ohm_km', 'ohm_kft', 'resistance_per_length'), 0.3048, { rel: 1e-12 }, 'Ω/km → Ω/kft');
      assertClose(convert(16, 'mm2', 'in2', 'area'), 0.0248, { abs: 1e-4 }, 'mm² → in²');
    },
  },
  {
    name: 'Invalid inputs fail fast: zero voltage, unknown size, negative current',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ voltage_v: 0 }), 'greater than zero', 'voltage');
      assertThrows(() => calculate({ size: '17' }), 'Unknown conductor size', 'size');
      assertThrows(() => calculate({ current_a: -1 }), 'must not be negative', 'current');
    },
  },
];
